const Reservation = require('../models/Reservation');
const Event       = require('../models/Event');
const User        = require('../models/User');

const ok = (res, code, message, data = {}) =>
  res.status(code).json({ success: true, statusCode: code, message, ...data });

// ─── POST /api/reservations — Réserver un événement ──────────────────────────
const createReservation = async (req, res, next) => {
  try {
    const { userId, eventId, numberOfTickets } = req.body;

    // 1. Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      const e = new Error(`User not found: ${userId}`);
      e.statusCode = 404; return next(e);
    }

    // 2. Vérifier que l'événement existe
    const event = await Event.findById(eventId);
    if (!event) {
      const e = new Error(`Event not found: ${eventId}`);
      e.statusCode = 404; return next(e);
    }

    // 3. Vérifier la capacité restante
    if (event.capacity !== null) {
      const takenTickets = await Reservation.aggregate([
        { $match: { event: event._id, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$numberOfTickets' } } },
      ]);
      const booked   = takenTickets[0]?.total || 0;
      const remaining = event.capacity - booked;
      if (numberOfTickets > remaining) {
        const e = new Error(
          `Not enough capacity. Only ${remaining} ticket(s) remaining.`
        );
        e.statusCode = 409; return next(e);
      }
    }

    // 4. Vérifier que l'utilisateur n'a pas déjà une réservation active
    const existing = await Reservation.findOne({
      user: userId, event: eventId, status: { $ne: 'cancelled' },
    });
    if (existing) {
      const e = new Error('You already have an active reservation for this event');
      e.statusCode = 409; return next(e);
    }

    // 5. Calculer le prix total
    const totalPrice = event.price * numberOfTickets;

    // 6. Créer la réservation
    const reservation = await Reservation.create({
      user: userId,
      event: eventId,
      numberOfTickets,
      totalPrice,
      status: 'confirmed',
    });

    // 7. Many-to-Many sync: ajouter user dans event.participants et event dans user.events
    await Promise.all([
      Event.findByIdAndUpdate(eventId, { $addToSet: { participants: userId } }),
      User.findByIdAndUpdate(userId,   { $addToSet: { events: eventId } }),
    ]);

    // 8. Populate pour la réponse
    await reservation.populate([
      { path: 'user',  select: 'firstName lastName email' },
      { path: 'event', select: 'title startDate endDate type price location category' },
    ]);

    return ok(res, 201, 'Reservation created successfully', { data: reservation });
  } catch (err) { next(err); }
};

// ─── GET /api/reservations — Toutes les réservations ─────────────────────────
const getAllReservations = async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.user   = req.query.userId;
    if (req.query.eventId) filter.event = req.query.eventId;

    const [reservations, total] = await Promise.all([
      Reservation.find(filter)
        .populate('user',  'firstName lastName email')
        .populate('event', 'title startDate endDate category type price')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      Reservation.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    return ok(res, 200, 'Reservations fetched successfully', {
      data: reservations,
      pagination: { total, totalPages, currentPage: page, limit,
        hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
  } catch (err) { next(err); }
};

// ─── GET /api/reservations/:id ────────────────────────────────────────────────
const getReservationById = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('user',  'firstName lastName email phone')
      .populate('event', 'title description startDate endDate category type price location images');

    if (!reservation) {
      const e = new Error(`Reservation not found: ${req.params.id}`);
      e.statusCode = 404; return next(e);
    }
    return ok(res, 200, 'Reservation fetched successfully', { data: reservation });
  } catch (err) { next(err); }
};

// ─── GET /api/users/:userId/reservations — Réservations d'un utilisateur ─────
const getUserReservations = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      const e = new Error(`User not found: ${req.params.userId}`);
      e.statusCode = 404; return next(e);
    }

    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip  = (page - 1) * limit;

    const filter = { user: req.params.userId };
    if (req.query.status) filter.status = req.query.status;

    const [reservations, total] = await Promise.all([
      Reservation.find(filter)
        .populate('event', 'title startDate endDate category type price location')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      Reservation.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    return ok(res, 200, 'User reservations fetched successfully', {
      data: {
        user: { id: user._id, fullName: `${user.firstName} ${user.lastName}` },
        reservations,
      },
      pagination: { total, totalPages, currentPage: page, limit,
        hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
  } catch (err) { next(err); }
};

// ─── PUT /api/reservations/:id/cancel — Annuler une réservation ───────────────
const cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      const e = new Error(`Reservation not found: ${req.params.id}`);
      e.statusCode = 404; return next(e);
    }

    if (reservation.status === 'cancelled') {
      const e = new Error('Reservation is already cancelled');
      e.statusCode = 409; return next(e);
    }

    // Update reservation status
    reservation.status             = 'cancelled';
    reservation.cancelledAt        = new Date();
    reservation.cancellationReason = req.body.cancellationReason || '';
    await reservation.save();

    // Many-to-Many cleanup: retirer user des participants de l'événement
    await Promise.all([
      Event.findByIdAndUpdate(reservation.event, {
        $pull: { participants: reservation.user },
      }),
      User.findByIdAndUpdate(reservation.user, {
        $pull: { events: reservation.event },
      }),
    ]);

    await reservation.populate([
      { path: 'user',  select: 'firstName lastName email' },
      { path: 'event', select: 'title startDate' },
    ]);

    return ok(res, 200, 'Reservation cancelled successfully', { data: reservation });
  } catch (err) { next(err); }
};

// ─── GET /api/events/:id/participants ─────────────────────────────────────────
// (défini aussi dans eventController — ici version enrichie depuis Reservation)
const getEventParticipants = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      const e = new Error(`Event not found: ${req.params.id}`);
      e.statusCode = 404; return next(e);
    }

    const reservations = await Reservation.find({
      event: req.params.id,
      status: { $ne: 'cancelled' },
    }).populate('user', 'firstName lastName email phone');

    const participants = reservations.map((r) => ({
      reservationId:  r._id,
      status:         r.status,
      numberOfTickets: r.numberOfTickets,
      totalPrice:     r.totalPrice,
      reservationDate: r.reservationDate,
      user: r.user,
    }));

    const totalTickets = reservations.reduce((s, r) => s + r.numberOfTickets, 0);

    return ok(res, 200, 'Event participants fetched successfully', {
      data: {
        eventId:       event._id,
        eventTitle:    event.title,
        capacity:      event.capacity,
        totalTickets,
        remaining:     event.capacity !== null ? event.capacity - totalTickets : null,
        participantCount: participants.length,
        participants,
      },
    });
  } catch (err) { next(err); }
};

module.exports = {
  createReservation,
  getAllReservations,
  getReservationById,
  getUserReservations,
  cancelReservation,
  getEventParticipants,
};
