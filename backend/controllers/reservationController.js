/**
 * @file controllers/reservationController.js
 * @description Reservation management controller.
 *
 * Security / business rules enforced here:
 *  - A regular user (PARTICIPANT/ORGANIZER) can only create, view, list,
 *    cancel and download reservations that belong to them.
 *  - Only ADMIN can view/manage other users' reservations.
 *  - Reservations are NOT exposed through a generic "get by id" endpoint
 *    (no direct ID access). Ticket data is delivered to the user either by
 *    email (confirmation message with the QR code) or via a protected,
 *    ownership-checked PDF download endpoint.
 *  - A confirmation email (with the ticket QR code) is sent only once the
 *    reservation status is "confirmed".
 *  - Reservations cannot be created for events that are not in the future
 *    or that have reached their capacity.
 */

const Reservation = require('../models/Reservation');
const Event       = require('../models/Event');
const { User, ROLES } = require('../models/User');

const { sendError } = require('../utils/apiResponse');
const { generateReservationQRCode } = require('../utils/qrCodeHelper');
const { sendMail } = require('../utils/emailService');
const { buildReservationConfirmationEmail } = require('../utils/emailTemplates');
const { generateReservationTicketPDF } = require('../utils/pdfGenerator');

const ok = (res, code, message, data = {}) =>
  res.status(code).json({ success: true, statusCode: code, message, ...data });

const getBaseUrl = () =>
  process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:3000';

/**
 * Generate the ticket QR code for a reservation, persist it on the document,
 * and (if the reservation is confirmed) email it to the user together with
 * the reservation details. Failures here must never block the reservation
 * response — they are logged and surfaced via the response flags instead.
 */
const issueTicketAndNotify = async (reservation, event, user) => {
  const result = { qrGenerated: false, emailSent: false };

  try {
    const qrCodeDataUrl = await generateReservationQRCode(reservation, event, user, getBaseUrl());
    reservation.qrCode = qrCodeDataUrl;
    result.qrGenerated = true;
  } catch (qrErr) {
    console.error('[QR] Failed to generate ticket QR code for reservation', reservation._id, qrErr.message);
  }

  // Only send the reservation (and its QR code) by email once it is confirmed
  if (reservation.status === 'confirmed') {
    try {
      const { subject, html, text, attachments } = buildReservationConfirmationEmail({
        reservation, user, event, qrCodeDataUrl: reservation.qrCode,
      });
      await sendMail({ to: user.email, subject, html, text, attachments });
      reservation.confirmationSentAt = new Date();
      result.emailSent = true;
    } catch (mailErr) {
      console.error('[Email] Failed to send reservation confirmation to', user.email, mailErr.message);
    }
  }

  if (result.qrGenerated || result.emailSent) {
    await reservation.save();
  }

  return result;
};

// ─── Create Reservation ────────────────────────────────────────────────────

const createReservation = async (req, res, next) => {
  try {
    const { eventId, numberOfTickets } = req.body;
    let { userId } = req.body;

    // ─── Authorization: who is this reservation for? ────────────────────────
    // Regular users may only book for themselves. Only ADMIN may pass a
    // different `userId` to create a reservation on someone else's behalf.
    if (req.user.role !== ROLES.ADMIN) {
      if (userId && userId !== req.user._id.toString()) {
        return sendError(res, 403, 'Access denied. You can only create a reservation for your own account.');
      }
      userId = req.user._id.toString();
    } else if (!userId) {
      userId = req.user._id.toString();
    }

    // 1. Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      const e = new Error(`User not found: ${userId}`);
      e.statusCode = 404; return next(e);
    }

    const event = await Event.findById(eventId);
    if (!event) {
      const e = new Error(`Event not found: ${eventId}`);
      e.statusCode = 404; return next(e);
    }

    // 2. Cohérence : impossible de réserver un événement déjà passé / en cours
    if (event.startDate.getTime() <= Date.now()) {
      const e = new Error(`Cannot create a reservation for event "${event.title}": it has already started or passed.`);
      e.statusCode = 400; return next(e);
    }

    // 3. Vérifier la capacité disponible
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

    const existing = await Reservation.findOne({
      user: userId, event: eventId, status: { $ne: 'cancelled' },
    });
    if (existing) {
      const e = new Error('You already have an active reservation for this event');
      e.statusCode = 409; return next(e);
    }

    const totalPrice = event.price * numberOfTickets;

    const reservation = await Reservation.create({
      user: userId,
      event: eventId,
      numberOfTickets,
      totalPrice,
      status: 'confirmed',
    });

    await Promise.all([
      Event.findByIdAndUpdate(eventId, { $addToSet: { participants: userId } }),
      User.findByIdAndUpdate(userId,   { $addToSet: { events: eventId } }),
    ]);

    // 4. Générer le QR code du billet et envoyer l'email de confirmation
    //    (uniquement si la réservation est confirmée)
    const notification = await issueTicketAndNotify(reservation, event, user);

    await reservation.populate([
      { path: 'user',  select: 'fullName email phone' },
      { path: 'event', select: 'title startDate endDate type price location category' },
    ]);

    return ok(res, 201, 'Reservation created successfully', {
      data: reservation,
      notification,
    });
  } catch (err) { next(err); }
};

// ─── List Reservations (role-based) ────────────────────────────────────────

/**
 * GET /api/reservations
 *  - ADMIN: sees every reservation, optionally filtered by ?userId / ?eventId / ?status
 *  - Any other role: only ever sees their OWN reservations (the `userId`
 *    query parameter is ignored to prevent users from snooping on others).
 */
const getAllReservations = async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.status)  filter.status = req.query.status;
    if (req.query.eventId) filter.event  = req.query.eventId;

    if (req.user.role === ROLES.ADMIN) {
      if (req.query.userId) filter.user = req.query.userId;
    } else {
      // Non-admin users can only ever see their own reservations.
      filter.user = req.user._id;
    }

    const [reservations, total] = await Promise.all([
      Reservation.find(filter)
        .populate('user',  'fullName email')
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

// ─── Get a User's Reservations (self or admin) ─────────────────────────────

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
        user: { id: user._id, fullName: user.fullName },
        reservations,
      },
      pagination: { total, totalPages, currentPage: page, limit,
        hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
  } catch (err) { next(err); }
};

// ─── Cancel Reservation (owner or admin) ───────────────────────────────────

const cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      const e = new Error(`Reservation not found: ${req.params.id}`);
      e.statusCode = 404; return next(e);
    }

    const isAdmin = req.user.role === ROLES.ADMIN;
    const isOwner = reservation.user.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return sendError(res, 403, 'Access denied. You can only cancel your own reservations.');
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
      { path: 'user',  select: 'fullName email' },
      { path: 'event', select: 'title startDate' },
    ]);

    return ok(res, 200, 'Reservation cancelled successfully', { data: reservation });
  } catch (err) { next(err); }
};

// ─── Download Reservation Ticket (PDF, owner or admin) ─────────────────────

/**
 * GET /api/reservations/:id/ticket
 * Streams a downloadable PDF ticket (with embedded QR code) for a
 * confirmed reservation. Only the reservation's owner or an ADMIN may
 * download it — reservations are never exposed by direct ID otherwise.
 */
const downloadReservationTicket = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('user',  'fullName email phone')
      .populate('event', 'title description startDate endDate category type price location');

    if (!reservation) {
      const e = new Error(`Reservation not found: ${req.params.id}`);
      e.statusCode = 404; return next(e);
    }

    const isAdmin = req.user.role === ROLES.ADMIN;
    const isOwner = reservation.user._id.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return sendError(res, 403, 'Access denied. You can only download your own reservation ticket.');
    }

    if (reservation.status !== 'confirmed') {
      return sendError(res, 400, 'A ticket is only available for confirmed reservations.');
    }

    let qrCodeDataUrl = reservation.qrCode;
    if (!qrCodeDataUrl) {
      qrCodeDataUrl = await generateReservationQRCode(reservation, reservation.event, reservation.user, getBaseUrl());
      reservation.qrCode = qrCodeDataUrl;
      await reservation.save();
    }

    const pdfBuffer = await generateReservationTicketPDF({
      reservation,
      user: reservation.user,
      event: reservation.event,
      qrCodeDataUrl,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ticket-${reservation._id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    return res.send(pdfBuffer);
  } catch (err) { next(err); }
};

module.exports = {
  createReservation,
  getAllReservations,
  getUserReservations,
  cancelReservation,
  downloadReservationTicket,
};
