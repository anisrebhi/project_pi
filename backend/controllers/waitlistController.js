/**
 * @file controllers/waitlistController.js
 * @description Waitlist management.
 *
 * Participants can join the waitlist of a fully-booked event and leave it at
 * any time.  Organisers and ADMIN can consult the waitlist for their events.
 */
const WaitlistEntry = require('../models/WaitlistEntry');
const Reservation   = require('../models/Reservation');
const Event         = require('../models/Event');
const { ROLES }     = require('../models/User');
const { sendError } = require('../utils/apiResponse');
const { notifyWaitlistJoined } = require('../utils/notificationService');

const ok = (res, code, message, data = {}) =>
  res.status(code).json({ success: true, statusCode: code, message, ...data });

// ─── Helper: remaining capacity for an event ─────────────────────────────────

const getRemainingCapacity = async (event) => {
  if (event.capacity === null || event.capacity === undefined) return Infinity;
  const agg = await Reservation.aggregate([
    { $match: { event: event._id, status: { $ne: 'cancelled' } } },
    { $group: { _id: null, total: { $sum: '$numberOfTickets' } } },
  ]);
  return event.capacity - (agg[0]?.total || 0);
};

// ─── Join Waitlist ────────────────────────────────────────────────────────────

const joinWaitlist = async (req, res, next) => {
  try {
    const { eventId, numberOfTickets = 1, ticketType } = req.body;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) return sendError(res, 404, `Event "${eventId}" not found.`);

    if (event.startDate.getTime() <= Date.now()) {
      return sendError(res, 400, 'Cannot join the waitlist for an event that has already started.');
    }

    // Refuse if there are still spots — the user should book directly
    const remaining = await getRemainingCapacity(event);
    if (remaining >= numberOfTickets) {
      return sendError(res, 409, `There are still ${remaining} spot(s) available. Please book directly instead of joining the waitlist.`);
    }

    // Check the user doesn't already have an active reservation
    const existingRes = await Reservation.findOne({
      user: userId, event: eventId, status: { $ne: 'cancelled' },
    });
    if (existingRes) {
      return sendError(res, 409, 'You already have an active reservation for this event.');
    }

    // Validate ticket type if the event has types defined
    if (event.ticketTypes && event.ticketTypes.length > 0) {
      if (!ticketType) {
        return sendError(res, 400, `This event requires a ticket type. Choose one of: ${event.ticketTypes.map((t) => t.name).join(', ')}.`);
      }
      const validType = event.ticketTypes.find((t) => t.name === ticketType);
      if (!validType) {
        return sendError(res, 400, `Ticket type "${ticketType}" is not available for this event.`);
      }
    }

    // Create (or re-activate) the waitlist entry
    let entry;
    try {
      entry = await WaitlistEntry.create({
        user: userId,
        event: eventId,
        ticketType: ticketType || null,
        numberOfTickets: Math.min(Number(numberOfTickets), event.maxTicketsPerUser || 20),
        status: 'waiting',
      });
    } catch (dupErr) {
      if (dupErr.code === 11000) {
        return sendError(res, 409, 'You are already on the waitlist for this event.');
      }
      throw dupErr;
    }

    // Position in the queue (1-based)
    const position = await WaitlistEntry.countDocuments({
      event: eventId,
      status: { $in: ['waiting', 'notified'] },
      createdAt: { $lte: entry.createdAt },
    });

    // Notify the user (fire-and-forget)
    notifyWaitlistJoined(req.user, event, entry, position).catch(() => {});

    return ok(res, 201, 'You have been added to the waitlist.', {
      data: { entry, position },
    });
  } catch (err) { next(err); }
};

// ─── Leave Waitlist ───────────────────────────────────────────────────────────

const leaveWaitlist = async (req, res, next) => {
  try {
    const entry = await WaitlistEntry.findOne({
      user: req.user._id,
      event: req.params.eventId,
      status: { $in: ['waiting', 'notified'] },
    });

    if (!entry) return sendError(res, 404, 'You are not on the waitlist for this event.');

    entry.status = 'removed';
    await entry.save();

    return ok(res, 200, 'You have been removed from the waitlist.');
  } catch (err) { next(err); }
};

// ─── Get My Waitlist (current user) ──────────────────────────────────────────

const getMyWaitlist = async (req, res, next) => {
  try {
    const entries = await WaitlistEntry.find({
      user: req.user._id,
      status: { $in: ['waiting', 'notified'] },
    })
      .populate('event', 'title startDate endDate location capacity type category images')
      .sort({ createdAt: -1 });

    // Enrich with queue position
    const enriched = await Promise.all(
      entries.map(async (entry) => {
        const position = await WaitlistEntry.countDocuments({
          event: entry.event._id,
          status: { $in: ['waiting', 'notified'] },
          createdAt: { $lte: entry.createdAt },
        });
        return { ...entry.toObject(), position };
      })
    );

    return ok(res, 200, 'Waitlist fetched successfully.', { data: enriched });
  } catch (err) { next(err); }
};

// ─── Get Waitlist for an Event (ORGANIZER/ADMIN) ──────────────────────────────

const getEventWaitlist = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return sendError(res, 404, `Event "${req.params.eventId}" not found.`);

    const isAdmin = req.user.role === ROLES.ADMIN;
    const isOrganizer = event.organizer.toString() === req.user._id.toString();
    if (!isAdmin && !isOrganizer) {
      return sendError(res, 403, 'Access denied. Only the event organizer or an ADMIN can view the waitlist.');
    }

    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip  = (page - 1) * limit;

    const filter = { event: req.params.eventId };
    if (req.query.status) filter.status = req.query.status;
    else filter.status = { $in: ['waiting', 'notified'] };

    const [entries, total] = await Promise.all([
      WaitlistEntry.find(filter)
        .populate('user', 'fullName email')
        .sort({ createdAt: 1 })
        .skip(skip).limit(limit),
      WaitlistEntry.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    return ok(res, 200, 'Event waitlist fetched successfully.', {
      data: entries,
      pagination: { total, totalPages, currentPage: page, limit, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
  } catch (err) { next(err); }
};

// ─── Check My Position on Waitlist ───────────────────────────────────────────

const checkMyWaitlistPosition = async (req, res, next) => {
  try {
    const entry = await WaitlistEntry.findOne({
      user: req.user._id,
      event: req.params.eventId,
      status: { $in: ['waiting', 'notified'] },
    });

    if (!entry) {
      return ok(res, 200, 'Not on waitlist.', { data: { onWaitlist: false } });
    }

    const position = await WaitlistEntry.countDocuments({
      event: req.params.eventId,
      status: { $in: ['waiting', 'notified'] },
      createdAt: { $lte: entry.createdAt },
    });

    const total = await WaitlistEntry.countDocuments({
      event: req.params.eventId,
      status: { $in: ['waiting', 'notified'] },
    });

    return ok(res, 200, 'Waitlist position fetched.', {
      data: { onWaitlist: true, position, total, entry },
    });
  } catch (err) { next(err); }
};

module.exports = {
  joinWaitlist,
  leaveWaitlist,
  getMyWaitlist,
  getEventWaitlist,
  checkMyWaitlistPosition,
};
