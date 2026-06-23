/**
 * @file controllers/recommendationController.js
 * @description Similar events + personalized recommendations.
 */
const Event       = require('../models/Event');
const Reservation = require('../models/Reservation');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/** GET /api/events/:id/similar — Public: similar events based on category */
const getSimilarEvents = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return sendError(res, 404, 'Événement introuvable');

    const similar = await Event.find({
      _id:      { $ne: event._id },
      category: event.category,
      isActive: true,
      endDate:  { $gte: new Date() },
    })
      .populate('organizer', 'fullName')
      .select('title description startDate endDate location category images organizer capacity participants')
      .limit(6)
      .sort({ startDate: 1 });

    return sendSuccess(res, 200, 'Événements similaires', { events: similar });
  } catch (err) {
    return sendError(res, 500, 'Erreur');
  }
};

/** GET /api/recommendations — Auth: personalized recommendations */
const getRecommendations = async (req, res) => {
  try {
    // 1. Get user's reservation history
    const reservations = await Reservation.find({ user: req.user._id })
      .populate('event', 'category')
      .lean();

    // 2. Count category frequency
    const categoryCount = {};
    for (const r of reservations) {
      if (r.event?.category) {
        categoryCount[r.event.category] = (categoryCount[r.event.category] || 0) + 1;
      }
    }

    // Top 3 preferred categories
    const preferredCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    // IDs of events already reserved
    const reservedEventIds = reservations.map((r) => r.event?._id).filter(Boolean);

    // 3. Find upcoming events matching preferences, excluding already reserved
    let recommended = [];

    if (preferredCategories.length) {
      recommended = await Event.find({
        _id:      { $nin: reservedEventIds },
        category: { $in: preferredCategories },
        isActive: true,
        endDate:  { $gte: new Date() },
      })
        .populate('organizer', 'fullName')
        .select('title description startDate endDate location category images organizer capacity participants type price')
        .limit(8)
        .sort({ startDate: 1 });
    }

    // 4. If not enough, fill with popular events
    if (recommended.length < 4) {
      const extra = await Event.find({
        _id:      { $nin: [...reservedEventIds, ...recommended.map((e) => e._id)] },
        isActive: true,
        endDate:  { $gte: new Date() },
      })
        .populate('organizer', 'fullName')
        .select('title description startDate endDate location category images organizer capacity participants type price')
        .limit(8 - recommended.length)
        .sort({ 'participants.length': -1, startDate: 1 });

      recommended = [...recommended, ...extra];
    }

    return sendSuccess(res, 200, 'Événements recommandés', {
      events: recommended,
      basedOn: preferredCategories,
    });
  } catch (err) {
    return sendError(res, 500, 'Erreur lors du calcul des recommandations');
  }
};

module.exports = { getSimilarEvents, getRecommendations };
