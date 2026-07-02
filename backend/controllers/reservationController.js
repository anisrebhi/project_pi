/**
 * @file controllers/reservationController.js
 * @description Reservation management controller.
 */
const Reservation = require('../models/Reservation');
const Event       = require('../models/Event');
const PromoCode   = require('../models/PromoCode');
const { User, ROLES } = require('../models/User');

const { sendError } = require('../utils/apiResponse');
const { generateReservationQRCode } = require('../utils/qrCodeHelper');
const { sendMail } = require('../utils/emailService');
const { buildReservationConfirmationEmail } = require('../utils/emailTemplates');
const { generateReservationTicketPDF } = require('../utils/pdfGenerator');
const { promoteFromWaitlist } = require('../utils/waitlistService');

const ok = (res, code, message, data = {}) =>
  res.status(code).json({ success: true, statusCode: code, message, ...data });

const getBaseUrl = () =>
  process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:3000';

const issueTicketAndNotify = async (reservation, event, user) => {
  const result = { qrGenerated: false, emailSent: false };

  try {
    const qrCodeDataUrl = await generateReservationQRCode(reservation, event, user, getBaseUrl());
    reservation.qrCode = qrCodeDataUrl;
    result.qrGenerated = true;
  } catch (qrErr) {
    console.error('[QR] Failed to generate ticket QR code for reservation', reservation._id, qrErr.message);
  }

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
    const { eventId, numberOfTickets, ticketType, promoCode: promoCodeRaw } = req.body;
    let { userId } = req.body;

    if (req.user.role !== ROLES.ADMIN) {
      if (userId && userId !== req.user._id.toString()) {
        return sendError(res, 403, 'Access denied. You can only create a reservation for your own account.');
      }
      userId = req.user._id.toString();
    } else if (!userId) {
      userId = req.user._id.toString();
    }

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

    if (event.startDate.getTime() <= Date.now()) {
      const e = new Error(`Cannot create a reservation for event "${event.title}": it has already started or passed.`);
      e.statusCode = 400; return next(e);
    }

    let unitPrice = event.price;
    let isEarlyBird = false;
    let resolvedTicketType = null;

    if (event.ticketTypes && event.ticketTypes.length > 0) {
      if (!ticketType) {
        const e = new Error(`This event requires a ticket type. Choose one of: ${event.ticketTypes.map((t) => t.name).join(', ')}.`);
        e.statusCode = 400; return next(e);
      }
      const pricing = event.getTicketPrice(ticketType);
      if (!pricing) {
        const e = new Error(`Ticket type "${ticketType}" is not available for this event.`);
        e.statusCode = 400; return next(e);
      }
      unitPrice = pricing.unitPrice;
      isEarlyBird = pricing.isEarlyBird;
      resolvedTicketType = ticketType;

      if (pricing.ticketType.quantity !== null && pricing.ticketType.quantity !== undefined) {
        const takenForType = await Reservation.aggregate([
          { $match: { event: event._id, ticketType, status: { $ne: 'cancelled' } } },
          { $group: { _id: null, total: { $sum: '$numberOfTickets' } } },
        ]);
        const bookedForType = takenForType[0]?.total || 0;
        const remainingForType = pricing.ticketType.quantity - bookedForType;
        if (numberOfTickets > remainingForType) {
          const e = new Error(`Not enough "${ticketType}" tickets remaining. Only ${Math.max(0, remainingForType)} left.`);
          e.statusCode = 409; return next(e);
        }
      }
    }

    if (event.capacity !== null) {
      const takenTickets = await Reservation.aggregate([
        { $match: { event: event._id, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$numberOfTickets' } } },
      ]);
      const booked   = takenTickets[0]?.total || 0;
      const remaining = event.capacity - booked;
      if (numberOfTickets > remaining) {
        const err = new Error(
          remaining === 0
            ? `This event is fully booked. You can join the waitlist.`
            : `Not enough capacity. Only ${remaining} ticket(s) remaining.`
        );
        err.statusCode = 409;
        err.waitlistAvailable = remaining === 0;
        return next(err);
      }
    }

    const maxPerUser = event.maxTicketsPerUser || 20;
    const userExisting = await Reservation.aggregate([
      { $match: { event: event._id, user: user._id, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$numberOfTickets' } } },
    ]);
    const alreadyHeld = userExisting[0]?.total || 0;
    if (alreadyHeld + numberOfTickets > maxPerUser) {
      const e = new Error(
        `You can reserve at most ${maxPerUser} ticket(s) for this event. You already hold ${alreadyHeld}.`
      );
      e.statusCode = 409; return next(e);
    }

    const existing = await Reservation.findOne({
      user: userId, event: eventId, status: { $ne: 'cancelled' },
    });
    if (existing) {
      const e = new Error('You already have an active reservation for this event');
      e.statusCode = 409; return next(e);
    }

    let discountAmount = 0;
    let appliedPromoCode = null;
    const grossPrice = unitPrice * numberOfTickets;

    if (promoCodeRaw) {
      const promo = await PromoCode.findOne({
        code: promoCodeRaw.trim().toUpperCase(),
        $or: [{ event: eventId }, { event: null }],
      });
      if (!promo) {
        const e = new Error('Invalid promo code for this event.');
        e.statusCode = 400; return next(e);
      }
      const validity = promo.isValidNow();
      if (!validity.ok) {
        const e = new Error(validity.reason);
        e.statusCode = 400; return next(e);
      }
      discountAmount = promo.computeDiscount(grossPrice);
      appliedPromoCode = promo;
    }

    const totalPrice = Math.max(0, grossPrice - discountAmount);

    const reservation = await Reservation.create({
      user: userId,
      event: eventId,
      numberOfTickets,
      ticketType: resolvedTicketType,
      unitPrice,
      isEarlyBird,
      promoCode: appliedPromoCode ? appliedPromoCode.code : null,
      discountAmount,
      totalPrice,
      status: 'confirmed',
    });

    if (appliedPromoCode) {
      appliedPromoCode.usedCount += 1;
      await appliedPromoCode.save();
    }

    await Promise.all([
      Event.findByIdAndUpdate(eventId, { $addToSet: { participants: userId } }),
      User.findByIdAndUpdate(userId,   { $addToSet: { events: eventId } }),
    ]);

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

// ─── List Reservations ────────────────────────────────────────────────────────

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

// ─── Get a User's Reservations ─────────────────────────────────────────────

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

// ─── Cancel Reservation ───────────────────────────────────────────────────

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

    reservation.status             = 'cancelled';
    reservation.cancelledAt        = new Date();
    reservation.cancellationReason = req.body.cancellationReason || '';
    await reservation.save();

    await Promise.all([
      Event.findByIdAndUpdate(reservation.event, {
        $pull: { participants: reservation.user },
      }),
      User.findByIdAndUpdate(reservation.user, {
        $pull: { events: reservation.event },
      }),
    ]);

    // Fire-and-forget: promote next user from waitlist for the freed spots
    promoteFromWaitlist(
      reservation.event.toString(),
      reservation.ticketType || null,
      reservation.numberOfTickets
    ).catch((err) => console.error('[Waitlist] Promotion failed after cancellation:', err.message));

    await reservation.populate([
      { path: 'user',  select: 'fullName email' },
      { path: 'event', select: 'title startDate' },
    ]);

    return ok(res, 200, 'Reservation cancelled successfully', { data: reservation });
  } catch (err) { next(err); }
};

// ─── Download Reservation Ticket ─────────────────────────────────────────────

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
