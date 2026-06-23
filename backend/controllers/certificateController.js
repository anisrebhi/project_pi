/**
 * @file controllers/certificateController.js
 * @description Certificate generation, download and verification.
 */
const crypto        = require('crypto');
const Certificate   = require('../models/Certificate');
const Reservation   = require('../models/Reservation');
const { User }      = require('../models/User');
const Event         = require('../models/Event');
const { generateCertificatePDF } = require('../utils/certificateGenerator');
const { sendEmail }               = require('../utils/emailService');
const { buildCertificateEmail }   = require('../utils/emailTemplates');
const { sendSuccess, sendError }  = require('../utils/apiResponse');

/**
 * POST /api/certificates/generate/:eventId
 * Admin/Organizer — generate certificates for all confirmed participants of a past event.
 */
const generateCertificates = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('organizer', 'fullName email');
    if (!event) return sendError(res, 404, 'Événement introuvable');

    if (new Date(event.endDate) > new Date()) {
      return sendError(res, 400, 'Les certificats ne peuvent être générés qu\'après la fin de l\'événement');
    }

    // Only the organizer or an admin can trigger generation
    const isOrganizer = event.organizer._id.toString() === req.user._id.toString();
    const isAdmin     = req.user.role === 'ADMIN';
    if (!isOrganizer && !isAdmin) return sendError(res, 403, 'Accès refusé');

    // Get confirmed reservations
    const reservations = await Reservation.find({
      event: event._id,
      status: 'confirmed',
    }).populate('user', 'fullName email');

    if (!reservations.length) {
      return sendSuccess(res, 200, 'Aucun participant confirmé pour cet événement', { generated: 0 });
    }

    let generated = 0;
    let skipped   = 0;

    for (const reservation of reservations) {
      const user = reservation.user;
      if (!user) continue;

      // Skip if certificate already exists
      const existing = await Certificate.findOne({ user: user._id, event: event._id });
      if (existing) { skipped++; continue; }

      // Create unique code
      const verificationCode = crypto.randomUUID().replace(/-/g, '').toUpperCase();

      // Create certificate record
      const certificate = await Certificate.create({
        user:             user._id,
        event:            event._id,
        reservation:      reservation._id,
        verificationCode,
      });

      // Generate PDF
      const pdfBuffer = await generateCertificatePDF({ user, event, verificationCode });

      // Send email
      const emailContent = buildCertificateEmail({ user, event, verificationCode, pdfBuffer });
      await sendEmail({ to: user.email, ...emailContent });

      // Mark as sent
      certificate.emailSentAt = new Date();
      await certificate.save();
      generated++;
    }

    return sendSuccess(res, 200, `Certificats générés avec succès`, { generated, skipped });
  } catch (err) {
    console.error('generateCertificates error:', err);
    return sendError(res, 500, 'Erreur lors de la génération des certificats');
  }
};

/**
 * GET /api/certificates/my
 * Participant — list my certificates.
 */
const getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ user: req.user._id })
      .populate('event', 'title startDate endDate location organizer')
      .populate({ path: 'event', populate: { path: 'organizer', select: 'fullName' } })
      .sort({ issuedAt: -1 });

    return sendSuccess(res, 200, 'Mes certificats', { certificates });
  } catch (err) {
    return sendError(res, 500, 'Erreur lors de la récupération des certificats');
  }
};

/**
 * GET /api/certificates/download/:id
 * Participant — download certificate PDF by certificate _id.
 */
const downloadCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('user', 'fullName email')
      .populate({
        path: 'event',
        select: 'title startDate endDate location organizer',
        populate: { path: 'organizer', select: 'fullName' },
      });

    if (!certificate) return sendError(res, 404, 'Certificat introuvable');

    // Only the owner or admin can download
    if (certificate.user._id.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return sendError(res, 403, 'Accès refusé');
    }

    const pdfBuffer = await generateCertificatePDF({
      user:             certificate.user,
      event:            certificate.event,
      verificationCode: certificate.verificationCode,
    });

    const filename = `certificat-${certificate.event.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('downloadCertificate error:', err);
    return sendError(res, 500, 'Erreur lors du téléchargement');
  }
};

/**
 * GET /api/certificates/verify/:code
 * Public — verify a certificate by its unique code.
 */
const verifyCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ verificationCode: req.params.code })
      .populate('user', 'fullName email')
      .populate('event', 'title startDate endDate location organizer');

    if (!certificate) {
      return sendError(res, 404, 'Certificat invalide ou introuvable');
    }

    return sendSuccess(res, 200, 'Certificat valide', {
      valid:     true,
      issuedAt:  certificate.issuedAt,
      holder:    certificate.user.fullName || certificate.user.email,
      event:     certificate.event.title,
      eventDate: certificate.event.startDate,
    });
  } catch (err) {
    return sendError(res, 500, 'Erreur lors de la vérification');
  }
};

module.exports = { generateCertificates, getMyCertificates, downloadCertificate, verifyCertificate };
