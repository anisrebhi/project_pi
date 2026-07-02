/**
 * @file controllers/certificateController.js
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
 * @description Full certificate management:
 *   initializeCertificates  — POST /api/certificates/initialize/:eventId
 *   generateForOne          — POST /api/certificates/generate-one
 *   getEventCertificates    — GET  /api/certificates/event/:eventId
 *   getAllCertificates       — GET  /api/certificates/all            (Admin)
 *   validateCertificate     — PATCH /api/certificates/:id/validate
 *   bulkValidate            — PATCH /api/certificates/bulk-validate/:eventId
 *   sendCertificate         — PATCH /api/certificates/:id/send
 *   bulkSend                — POST  /api/certificates/bulk-send/:eventId
 *   deleteCertificate       — DELETE /api/certificates/:id
 *   downloadCertificate     — GET  /api/certificates/download/:id
 *   previewCertificate      — GET  /api/certificates/preview/:id
 *   getMyCertificates       — GET  /api/certificates/my
 *   verifyCertificate       — GET  /api/certificates/verify/:code   (public)
 *
 * RBAC:
 *   Public           → verifyCertificate
 *   Any auth         → getMyCertificates, downloadCertificate (own cert)
 *   Admin/Organizer  → all management actions (route middleware + canManage check)
 *   Admin only       → getAllCertificates, deleteCertificate on any cert
 */

const crypto                     = require('crypto');
const Certificate                = require('../models/Certificate');
const Reservation                = require('../models/Reservation');
const Event                      = require('../models/Event');
const { User }                   = require('../models/User');
const { generateCertificatePDF } = require('../utils/certificateGenerator');
const { sendMail }               = require('../utils/emailService');
const { buildCertificateEmail }  = require('../utils/emailTemplates');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Load event with organizer populated */
const loadEvent = (id) =>
  Event.findById(id).populate('organizer', 'fullName email');

/**
 * Check whether user may manage certificates for this event.
 * - ADMIN: always yes
 * - ORGANIZER: only if they own the event
 */
const canManage = (user, event) => {
  if (!user || !event) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role !== 'ORGANIZER') return false;

  const organizerId =
    event.organizer?._id?.toString() ||
    event.organizer?.toString();

  return organizerId === user._id.toString();
};

/** Generate a unique uppercase verification code */
const generateCode = () =>
  crypto.randomUUID().replace(/-/g, '').toUpperCase();

/** Populate fields needed for PDF generation */
const CERT_PDF_POPULATE = [
  { path: 'user', select: 'fullName email' },
  {
    path: 'event',
    select: 'title startDate endDate location organizer',
    populate: { path: 'organizer', select: 'fullName email' },
  },
];

/** Build PDF + send email helper — reused by sendCertificate and bulkSend */
const generateAndSend = async (certificate) => {
  const pdfBuffer = await generateCertificatePDF({
    user:             certificate.user,
    event:            certificate.event,
    verificationCode: certificate.verificationCode,
  });

  const emailContent = buildCertificateEmail({
    user:             certificate.user,
    event:            certificate.event,
    verificationCode: certificate.verificationCode,
    pdfBuffer,
  });

  await sendMail({ to: certificate.user.email, ...emailContent });
  return pdfBuffer;
};

// ─── Initialize all ───────────────────────────────────────────────────────────
/**
 * POST /api/certificates/initialize/:eventId
 * Creates PENDING certificates for every confirmed participant.
 * Idempotent — skips participants who already have a certificate.
 * Query param: ?force=true  bypasses the endDate check.
 */
const initializeCertificates = async (req, res) => {
  try {
    const event = await loadEvent(req.params.eventId);
    if (!event) return sendError(res, 404, 'Événement introuvable.');

    if (!canManage(req.user, event)) {
      return sendError(res, 403, 'Accès refusé — vous n\'êtes pas l\'organisateur de cet événement.');
    }

    // Enforce event-end check unless ?force=true is passed
    const force = req.query.force === 'true' || req.body?.force === true;
    if (!force && new Date(event.endDate) > new Date()) {
      return sendError(
        res, 400,
        `L'événement se termine le ${new Date(event.endDate).toLocaleDateString('fr-FR')}. ` +
        `Ajoutez ?force=true pour initialiser les certificats avant la fin de l'événement.`
      );
    }

    // Optional: restrict to selected user IDs (sent from the frontend checkboxes)
    // If not provided → initialize ALL confirmed participants
    const selectedUserIds = Array.isArray(req.body?.userIds) && req.body.userIds.length > 0
      ? req.body.userIds.map(id => id.toString())
      : null;

    const reservationFilter = { event: event._id, status: 'confirmed' };
    if (selectedUserIds) {
      reservationFilter.user = { $in: selectedUserIds };
    }

    const reservations = await Reservation
      .find(reservationFilter)
      .populate('user', 'fullName email');

    if (!reservations.length) {
      return sendSuccess(res, 200,
        selectedUserIds
          ? 'Aucune réservation confirmée trouvée pour les participants sélectionnés.'
          : 'Aucun participant confirmé pour cet événement.',
        { created: 0, skipped: 0 }
      );
    }

    let created = 0, skipped = 0;
    const createdCerts = [];

    for (const reservation of reservations) {
      if (!reservation.user) { skipped++; continue; }

      const exists = await Certificate.findOne({
        user: reservation.user._id,
        event: event._id,
      });

      if (exists) { skipped++; continue; }

      const cert = await Certificate.create({
        user:             reservation.user._id,
        event:            event._id,
        reservation:      reservation._id,
        verificationCode: generateCode(),
        status:           'pending',
      });
      createdCerts.push(cert);
      created++;
    }

    return sendSuccess(
      res, 201,
      `${created} certificat(s) initialisé(s), ${skipped} déjà existant(s).`,
      { created, skipped, certificates: createdCerts }
    );
  } catch (err) {
    console.error('[initializeCertificates]', err);
    return sendError(res, 500, 'Erreur lors de l\'initialisation des certificats.');
  }
};

// ─── Generate for one participant ─────────────────────────────────────────────
/**
 * POST /api/certificates/generate-one
 * Body: { eventId, userId }
 * Creates + auto-validates a certificate for a single confirmed participant.
 */
const generateForOne = async (req, res) => {
  try {
    const { eventId, userId } = req.body;
    if (!eventId || !userId) {
      return sendError(res, 400, 'eventId et userId sont requis.');
    }

    const event = await loadEvent(eventId);
    if (!event) return sendError(res, 404, 'Événement introuvable.');

    if (!canManage(req.user, event)) {
      return sendError(res, 403, 'Accès refusé — vous n\'êtes pas l\'organisateur de cet événement.');
    }

    const targetUser = await User.findById(userId).select('fullName email');
    if (!targetUser) return sendError(res, 404, 'Utilisateur introuvable.');

    const reservation = await Reservation.findOne({
      event: eventId,
      user:  userId,
      status: 'confirmed',
    });
    if (!reservation) {
      return sendError(res, 404, 'Aucune réservation confirmée pour ce participant.');
    }

    // Idempotent — return existing if already created
    const existing = await Certificate.findOne({ user: userId, event: eventId });
    if (existing) {
      return sendSuccess(res, 200, 'Ce certificat existe déjà.', {
        certificate:   existing,
        alreadyExisted: true,
      });
    }

    const cert = await Certificate.create({
      user:             userId,
      event:            eventId,
      reservation:      reservation._id,
      verificationCode: generateCode(),
      status:           'validated',
      validatedBy:      req.user._id,
      validatedAt:      new Date(),
    });

    return sendSuccess(res, 201, 'Certificat généré et validé.', { certificate: cert });
  } catch (err) {
    console.error('[generateForOne]', err);
    return sendError(res, 500, 'Erreur lors de la génération du certificat.');
  }
};

// ─── Get event certificates ───────────────────────────────────────────────────
/**
 * GET /api/certificates/event/:eventId
 */
const getEventCertificates = async (req, res) => {
  try {
    const event = await loadEvent(req.params.eventId);
    if (!event) return sendError(res, 404, 'Événement introuvable.');

    if (!canManage(req.user, event)) {
      return sendError(res, 403, 'Accès refusé — vous n\'êtes pas l\'organisateur de cet événement.');
    }

    const certificates = await Certificate.find({ event: event._id })
      .populate('user', 'fullName email')
      .populate('validatedBy', 'fullName')
      .sort({ createdAt: -1 });

    const stats = {
      total:      certificates.length,
      pending:    certificates.filter(c => c.status === 'pending').length,
      validated:  certificates.filter(c => c.status === 'validated').length,
      sent:       certificates.filter(c => c.status === 'sent').length,
      downloaded: certificates.filter(c => c.downloadCount > 0).length,
    };

    return sendSuccess(res, 200, 'Certificats récupérés.', { certificates, stats });
  } catch (err) {
    console.error('[getEventCertificates]', err);
    return sendError(res, 500, 'Erreur lors de la récupération des certificats.');
  }
};

// ─── Get all certificates (Admin) ─────────────────────────────────────────────
/**
 * GET /api/certificates/all
 * Admin only — paginated with filters
 */
const getAllCertificates = async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.status)  filter.status = req.query.status;
    if (req.query.eventId) filter.event  = req.query.eventId;

    const [certificates, total] = await Promise.all([
      Certificate.find(filter)
        .populate('user', 'fullName email')
        .populate({
          path: 'event',
          select: 'title startDate',
          populate: { path: 'organizer', select: 'fullName' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Certificate.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Tous les certificats.', {
      certificates,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (err) {
    console.error('[getAllCertificates]', err);
    return sendError(res, 500, 'Erreur lors de la récupération.');
  }
};

// ─── Validate one ─────────────────────────────────────────────────────────────
/**
 * PATCH /api/certificates/:id/validate
 */
const validateCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id).populate({
      path: 'event',
      populate: { path: 'organizer', select: 'fullName email' },
    });

    if (!cert) return sendError(res, 404, 'Certificat introuvable.');
    if (!canManage(req.user, cert.event)) {
      return sendError(res, 403, 'Accès refusé.');
    }
    if (cert.status !== 'pending') {
      return sendError(res, 400, `Ce certificat est déjà en statut « ${cert.status} ».`);
    }

    cert.status      = 'validated';
    cert.validatedBy = req.user._id;
    cert.validatedAt = new Date();
    await cert.save();

    const populated = await Certificate.findById(cert._id)
      .populate('user', 'fullName email')
      .populate('validatedBy', 'fullName');

    return sendSuccess(res, 200, 'Certificat validé avec succès.', { certificate: populated });
  } catch (err) {
    console.error('[validateCertificate]', err);
    return sendError(res, 500, 'Erreur lors de la validation.');
  }
};

// ─── Bulk validate ────────────────────────────────────────────────────────────
/**
 * PATCH /api/certificates/bulk-validate/:eventId
 */
const bulkValidate = async (req, res) => {
  try {
    const event = await loadEvent(req.params.eventId);
    if (!event) return sendError(res, 404, 'Événement introuvable.');
    if (!canManage(req.user, event)) {
      return sendError(res, 403, 'Accès refusé.');
    }

    const result = await Certificate.updateMany(
      { event: event._id, status: 'pending' },
      { $set: { status: 'validated', validatedBy: req.user._id, validatedAt: new Date() } }
    );

    return sendSuccess(res, 200, `${result.modifiedCount} certificat(s) validé(s).`, {
      validated: result.modifiedCount,
    });
  } catch (err) {
    console.error('[bulkValidate]', err);
    return sendError(res, 500, 'Erreur lors de la validation groupée.');
  }
};

// ─── Send by email ────────────────────────────────────────────────────────────
/**
 * PATCH /api/certificates/:id/send
 */
const sendCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id).populate(CERT_PDF_POPULATE);

    if (!cert) return sendError(res, 404, 'Certificat introuvable.');
    if (!canManage(req.user, cert.event)) {
      return sendError(res, 403, 'Accès refusé.');
    }
    if (cert.status === 'pending') {
      return sendError(res, 400, 'Le certificat doit être validé avant d\'être envoyé.');
    }

    await generateAndSend(cert);

    cert.status      = 'sent';
    cert.emailSentAt = new Date();
    await cert.save();

    return sendSuccess(res, 200, 'Certificat envoyé par email.', {
      certificate: await Certificate.findById(cert._id).populate('user', 'fullName email'),
    });
  } catch (err) {
    console.error('[sendCertificate]', err);
    return sendError(res, 500, 'Erreur lors de l\'envoi du certificat.');
  }
};

// ─── Bulk send ────────────────────────────────────────────────────────────────
/**
 * POST /api/certificates/bulk-send/:eventId
 */
const bulkSend = async (req, res) => {
  try {
    const event = await loadEvent(req.params.eventId);
    if (!event) return sendError(res, 404, 'Événement introuvable.');
    if (!canManage(req.user, event)) {
      return sendError(res, 403, 'Accès refusé.');
    }

    const certs = await Certificate.find({ event: event._id, status: 'validated' })
      .populate(CERT_PDF_POPULATE);

    if (!certs.length) {
      return sendSuccess(res, 200, 'Aucun certificat validé à envoyer.', { sent: 0, errors: 0 });
    }

    let sent = 0, errors = 0;
    for (const cert of certs) {
      try {
        await generateAndSend(cert);
        cert.status      = 'sent';
        cert.emailSentAt = new Date();
        await cert.save();
        sent++;
      } catch (e) {
        console.error(`[bulkSend] cert=${cert._id}:`, e.message);
        errors++;
      }
    }

    return sendSuccess(res, 200, `${sent} envoyé(s)${errors ? `, ${errors} erreur(s)` : ''}.`, {
      sent,
      errors,
    });
  } catch (err) {
    console.error('[bulkSend]', err);
    return sendError(res, 500, 'Erreur lors de l\'envoi groupé.');
  }
};

// ─── Delete ───────────────────────────────────────────────────────────────────
/**
 * DELETE /api/certificates/:id
 * Admin may delete any certificate. Organizer may delete only their event's certs.
 */
const deleteCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id).populate({
      path: 'event',
      populate: { path: 'organizer', select: 'fullName email' },
    });

    if (!cert) return sendError(res, 404, 'Certificat introuvable.');
    if (!canManage(req.user, cert.event)) {
      return sendError(res, 403, 'Accès refusé.');
    }

    await Certificate.findByIdAndDelete(req.params.id);
    return sendSuccess(res, 200, 'Certificat supprimé.');
  } catch (err) {
    console.error('[deleteCertificate]', err);
    return sendError(res, 500, 'Erreur lors de la suppression.');
  }
};

// ─── Download PDF ─────────────────────────────────────────────────────────────
/**
 * GET /api/certificates/download/:id
 * Owner (participant) OR Admin/Organizer of the event can download.
 */
const downloadCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id).populate(CERT_PDF_POPULATE);

    if (!cert) return sendError(res, 404, 'Certificat introuvable.');

    const isOwner   = cert.user._id.toString() === req.user._id.toString();
    const isManager = canManage(req.user, cert.event);

    if (!isOwner && !isManager) {
      return sendError(res, 403, 'Accès refusé — ce certificat ne vous appartient pas.');
    }
    if (cert.status === 'pending') {
      return sendError(res, 400, 'Ce certificat n\'a pas encore été validé.');
    }

    const pdfBuffer = await generateCertificatePDF({
      user:             cert.user,
      event:            cert.event,
      verificationCode: cert.verificationCode,
    });

    // Track download
    cert.downloadCount = (cert.downloadCount || 0) + 1;
    cert.downloadedAt  = new Date();
    if (cert.status === 'validated') cert.status = 'downloaded';
    await cert.save();

    const safeName = (cert.event.title || 'evenement')
      .replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '_')
      .substring(0, 60);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificat-${safeName}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('[downloadCertificate]', err);
    return sendError(res, 500, 'Erreur lors du téléchargement.');
  }
};

// ─── Preview PDF (inline) ─────────────────────────────────────────────────────
/**
 * GET /api/certificates/preview/:id
 * Same permissions as download but sends inline (for browser preview tab).
 */
const previewCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id).populate(CERT_PDF_POPULATE);

    if (!cert) return sendError(res, 404, 'Certificat introuvable.');

    const isOwner   = cert.user._id.toString() === req.user._id.toString();
    const isManager = canManage(req.user, cert.event);

    if (!isOwner && !isManager) {
      return sendError(res, 403, 'Accès refusé.');
    }
    if (cert.status === 'pending') {
      return sendError(res, 400, 'Ce certificat n\'a pas encore été validé.');
    }

    const pdfBuffer = await generateCertificatePDF({
      user:             cert.user,
      event:            cert.event,
      verificationCode: cert.verificationCode,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="certificat-apercu.pdf"');
    res.send(pdfBuffer);
  } catch (err) {
    console.error('[previewCertificate]', err);
    return sendError(res, 500, 'Erreur lors de la prévisualisation.');
  }
};

// ─── My certificates ──────────────────────────────────────────────────────────
/**
 * GET /api/certificates/my
<<<<<<< HEAD
=======
=======
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
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
 */
const getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ user: req.user._id })
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
      .populate({
        path: 'event',
        select: 'title startDate endDate location organizer category',
        populate: { path: 'organizer', select: 'fullName' },
      })
      .sort({ issuedAt: -1 });

    return sendSuccess(res, 200, 'Mes certificats.', { certificates });
  } catch (err) {
    console.error('[getMyCertificates]', err);
    return sendError(res, 500, 'Erreur lors de la récupération de vos certificats.');
  }
};

// ─── Public verify ────────────────────────────────────────────────────────────
/**
 * GET /api/certificates/verify/:code
 */
const verifyCertificate = async (req, res) => {
  try {
    const code = (req.params.code || '').trim().toUpperCase();
    if (!code) return sendError(res, 400, 'Code de vérification requis.');

    const cert = await Certificate.findOne({ verificationCode: code })
      .populate('user',        'fullName email')
      .populate('event',       'title startDate endDate location')
      .populate('validatedBy', 'fullName');

    if (!cert) return sendError(res, 404, 'Certificat invalide ou introuvable.');
    if (cert.status === 'pending') {
      return sendError(res, 400, 'Ce certificat n\'a pas encore été validé.');
    }

    return sendSuccess(res, 200, 'Certificat valide.', {
      valid:            true,
      verificationCode: cert.verificationCode,
      issuedAt:         cert.issuedAt,
      validatedAt:      cert.validatedAt,
      holder:           cert.user.fullName || cert.user.email,
      holderEmail:      cert.user.email,
      event:            cert.event.title,
      eventDate:        cert.event.startDate,
      eventEndDate:     cert.event.endDate,
      status:           cert.status,
      downloadCount:    cert.downloadCount || 0,
    });
  } catch (err) {
    console.error('[verifyCertificate]', err);
    return sendError(res, 500, 'Erreur lors de la vérification.');
  }
};

// ─── Get confirmed participants (for init preview) ────────────────────────────
/**
 * GET /api/certificates/event/:eventId/participants
 * Returns all confirmed reservations with participant info + existing cert status.
 * Used by the front-office to show the "Initialize" preview table.
 */
const getConfirmedParticipants = async (req, res) => {
  try {
    const event = await loadEvent(req.params.eventId);
    if (!event) return sendError(res, 404, 'Événement introuvable.');

    if (!canManage(req.user, event)) {
      return sendError(res, 403, 'Accès refusé — vous n\'êtes pas l\'organisateur de cet événement.');
    }

    // Get all confirmed reservations
    const reservations = await Reservation
      .find({ event: event._id, status: 'confirmed' })
      .populate('user', 'fullName email profileImage')
      .sort({ createdAt: 1 });

    if (!reservations.length) {
      return sendSuccess(res, 200, 'Aucun participant confirmé pour cet événement.', {
        participants: [],
        total: 0,
        event: { _id: event._id, title: event.title },
      });
    }

    // Get existing certificates for this event to mark already-initialized users
    const existingCerts = await Certificate.find({ event: event._id })
      .select('user status verificationCode');

    const certByUser = new Map(
      existingCerts.map(c => [c.user.toString(), c])
    );

    const participants = reservations.map(r => {
      const userId   = r.user?._id?.toString();
      const existCert = userId ? certByUser.get(userId) : null;

      return {
        userId:         r.user?._id,
        fullName:       r.user?.fullName  || '—',
        email:          r.user?.email     || '—',
        profileImage:   r.user?.profileImage || null,
        reservationId:  r._id,
        reservedAt:     r.reservationDate || r.createdAt,
        ticketType:     r.ticketType,
        numberOfTickets: r.numberOfTickets,
        // Certificate info (null if not yet created)
        hasCertificate: !!existCert,
        certStatus:     existCert?.status || null,
        certCode:       existCert?.verificationCode || null,
      };
    });

    const withCert    = participants.filter(p => p.hasCertificate).length;
    const withoutCert = participants.length - withCert;

    return sendSuccess(res, 200, `${participants.length} participant(s) confirmé(s).`, {
      participants,
      total:       participants.length,
      withCert,
      withoutCert,
      event: {
        _id:      event._id,
        title:    event.title,
        endDate:  event.endDate,
      },
    });
  } catch (err) {
    console.error('[getConfirmedParticipants]', err);
    return sendError(res, 500, 'Erreur lors de la récupération des participants.');
  }
};

module.exports = {
  getConfirmedParticipants,
  initializeCertificates,
  generateForOne,
  getEventCertificates,
  getAllCertificates,
  validateCertificate,
  bulkValidate,
  sendCertificate,
  bulkSend,
  deleteCertificate,
  downloadCertificate,
  previewCertificate,
  getMyCertificates,
  verifyCertificate,
};

<<<<<<< HEAD
=======
=======
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
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
