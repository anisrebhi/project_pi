/**
 * @file controllers/reviewController.js
 * @description Event ratings and comments — only confirmed participants after event ends.
 */
const Review        = require('../models/Review');
const Event         = require('../models/Event');
const Reservation   = require('../models/Reservation');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/** POST /api/reviews — Create or update my review for an event */
const createReview = async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;
    if (!eventId || !rating) return sendError(res, 400, 'eventId et rating sont requis');
    if (rating < 1 || rating > 5) return sendError(res, 400, 'La note doit être entre 1 et 5');

    const event = await Event.findById(eventId);
    if (!event) return sendError(res, 404, 'Événement introuvable');

    if (new Date(event.endDate) > new Date()) {
      return sendError(res, 400, 'Vous ne pouvez évaluer un événement qu\'après sa clôture');
    }

    // Check the user has a confirmed reservation
    const reservation = await Reservation.findOne({
      event: eventId, user: req.user._id, status: 'confirmed',
    });
    if (!reservation) {
      return sendError(res, 403, 'Vous devez avoir participé à cet événement pour laisser un avis');
    }

    // Upsert
    const review = await Review.findOneAndUpdate(
      { event: eventId, user: req.user._id },
      { rating, comment: comment || '' },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('user', 'fullName');

    return sendSuccess(res, 201, 'Avis enregistré avec succès', { review });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, 'Vous avez déjà laissé un avis pour cet événement');
    return sendError(res, 500, 'Erreur lors de l\'enregistrement de l\'avis');
  }
};

/** GET /api/reviews/event/:eventId — Get all reviews for an event (public) */
const getEventReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ event: req.params.eventId })
      .populate('user', 'fullName')
      .sort({ createdAt: -1 });

    const total  = reviews.length;
    const avgRating = total ? +(reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : 0;

    return sendSuccess(res, 200, 'Avis de l\'événement', { reviews, total, avgRating });
  } catch (err) {
    return sendError(res, 500, 'Erreur lors de la récupération des avis');
  }
};

/** DELETE /api/reviews/:id — Participant deletes their own review / Admin deletes any */
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return sendError(res, 404, 'Avis introuvable');

    const isOwner = review.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'ADMIN') return sendError(res, 403, 'Accès refusé');

    await review.deleteOne();
    return sendSuccess(res, 200, 'Avis supprimé');
  } catch (err) {
    return sendError(res, 500, 'Erreur lors de la suppression');
  }
};

module.exports = { createReview, getEventReviews, deleteReview };
