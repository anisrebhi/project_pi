/**
 * @file controllers/photoController.js
 * @description Event photo gallery — organizer uploads, participants view.
 */
const path        = require('path');
const fs          = require('fs');
const EventPhoto  = require('../models/EventPhoto');
const Event       = require('../models/Event');
const Reservation = require('../models/Reservation');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { sendEmail } = require('../utils/emailService');
const { buildNewPhotosEmail } = require('../utils/emailTemplates');
const { User }    = require('../models/User');

/** POST /api/photos/:eventId — Organizer uploads photos */
const uploadPhotos = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return sendError(res, 404, 'Événement introuvable');

    const isOrganizer = event.organizer.toString() === req.user._id.toString();
    const isAdmin     = req.user.role === 'ADMIN';
    if (!isOrganizer && !isAdmin) return sendError(res, 403, 'Seul l\'organisateur peut ajouter des photos');

    if (!req.files?.length) return sendError(res, 400, 'Aucun fichier fourni');

    const photos = await Promise.all(req.files.map(async (file) => {
      const url = `/uploads/gallery/${file.filename}`;
      return EventPhoto.create({
        event:        event._id,
        uploadedBy:   req.user._id,
        url,
        filename:     file.filename,
        originalName: file.originalname,
        caption:      req.body.caption || '',
      });
    }));

    // Notify confirmed participants
    const reservations = await Reservation.find({ event: event._id, status: 'confirmed' }).populate('user', 'email fullName');
    for (const res_ of reservations) {
      if (res_.user?.email) {
        await sendEmail({ to: res_.user.email, ...buildNewPhotosEmail({ user: res_.user, event, count: photos.length }) });
      }
    }

    return sendSuccess(res, 201, `${photos.length} photo(s) ajoutée(s)`, { photos });
  } catch (err) {
    console.error('uploadPhotos error:', err);
    return sendError(res, 500, 'Erreur lors de l\'upload');
  }
};

/** GET /api/photos/:eventId — Get gallery (confirmed participants, organizer, admin) */
const getPhotos = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return sendError(res, 404, 'Événement introuvable');

    // Authorization check
    const isOrganizer = event.organizer.toString() === req.user._id.toString();
    const isAdmin     = req.user.role === 'ADMIN';
    if (!isOrganizer && !isAdmin) {
      const reservation = await Reservation.findOne({ event: event._id, user: req.user._id, status: 'confirmed' });
      if (!reservation) return sendError(res, 403, 'Accès réservé aux participants confirmés');
    }

    const photos = await EventPhoto.find({ event: req.params.eventId })
      .populate('uploadedBy', 'fullName')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Galerie', { photos, total: photos.length });
  } catch (err) {
    return sendError(res, 500, 'Erreur lors du chargement de la galerie');
  }
};

/** PATCH /api/photos/:id/caption — Update caption */
const updateCaption = async (req, res) => {
  try {
    const photo = await EventPhoto.findById(req.params.id).populate('event');
    if (!photo) return sendError(res, 404, 'Photo introuvable');

    const isOrganizer = photo.event.organizer.toString() === req.user._id.toString();
    if (!isOrganizer && req.user.role !== 'ADMIN') return sendError(res, 403, 'Accès refusé');

    photo.caption = req.body.caption || '';
    await photo.save();
    return sendSuccess(res, 200, 'Légende mise à jour', { photo });
  } catch (err) {
    return sendError(res, 500, 'Erreur');
  }
};

/** DELETE /api/photos/:id — Organizer or admin deletes a photo */
const deletePhoto = async (req, res) => {
  try {
    const photo = await EventPhoto.findById(req.params.id).populate('event');
    if (!photo) return sendError(res, 404, 'Photo introuvable');

    const isOrganizer = photo.event.organizer.toString() === req.user._id.toString();
    if (!isOrganizer && req.user.role !== 'ADMIN') return sendError(res, 403, 'Accès refusé');

    // Delete physical file
    const filePath = path.join(__dirname, '..', 'uploads', 'gallery', photo.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await photo.deleteOne();
    return sendSuccess(res, 200, 'Photo supprimée');
  } catch (err) {
    return sendError(res, 500, 'Erreur lors de la suppression');
  }
};

module.exports = { uploadPhotos, getPhotos, updateCaption, deletePhoto };
