/**
 * @file controllers/eventController.js
 * @description Event management controller — CRUD operations and
 *              Many-to-Many user registration/unregistration logic.
 */

const Event = require("../models/Event");
const { User, ROLES } = require("../models/User");
const Reservation = require("../models/Reservation");
const Certificate = require("../models/Certificate");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { generateEventQRCode } = require("../utils/qrCodeHelper");
const { notifyEventModified, notifyEventCancelled } = require("../utils/notificationService");

// Helper pour réponses cohérentes
const ok = (res, code, message, data = {}) =>
  res.status(code).json({ success: true, statusCode: code, message, ...data });

// ─── List Events ──────────────────────────────────────────────────────────────

const getAllEvents = async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip  = (page - 1) * limit;

    const filter = {};

    // Non-admin/organizer users only see active events
    const isStaff = req.user && (req.user.role === 'ADMIN' || req.user.role === 'ORGANIZER');
    if (!isStaff) filter.isActive = true;

    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { 'location.address': searchRegex },
      ];
    }
    if (req.query.category) filter.category  = req.query.category;
    if (req.query.type)     filter.type      = req.query.type;
    if (req.query.startFrom || req.query.startTo) {
      filter.startDate = {};
      if (req.query.startFrom) filter.startDate.$gte = new Date(req.query.startFrom);
      if (req.query.startTo)   filter.startDate.$lte = new Date(req.query.startTo);
    }

    const sortField = req.query.sortBy || 'startDate';
    const sortOrder = req.query.order  === 'desc' ? -1 : 1;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('organizer', 'fullName email')
        .populate('participants', '_id')
        .sort({ [sortField]: sortOrder })
        .skip(skip).limit(limit).lean(),
      Event.countDocuments(filter),
    ]);

    // Aggregate real booked ticket count for all returned events
    const eventIds = events.map((e) => e._id);
    let bookedMap = {};
    if (eventIds.length > 0) {
      const bookedAgg = await Reservation.aggregate([
        { $match: { event: { $in: eventIds }, status: { $ne: 'cancelled' } } },
        { $group: { _id: '$event', total: { $sum: '$numberOfTickets' } } },
      ]);
      bookedMap = Object.fromEntries(bookedAgg.map((b) => [b._id.toString(), b.total]));
    }

    const now = new Date();
    const enriched = events.map(ev => {
      const bookedTickets  = bookedMap[ev._id.toString()] || 0;
      const participantCount = Array.isArray(ev.participants) ? ev.participants.length : 0;
      const availableSpots   = Math.max(0, (ev.capacity || 0) - bookedTickets);
      const isFull           = availableSpots <= 0;
      const isPast           = ev.endDate ? new Date(ev.endDate) < now : false;
      return {
        ...ev,
        participants:    [],
        _bookedTickets:  bookedTickets,
        participantCount,
        availableSpots,
        isFull,
        isPast,
      };
    });

    const totalPages = Math.ceil(total / limit);
    return ok(res, 200, 'Events fetched successfully', {
      data: enriched,
      pagination: { total, totalPages, currentPage: page, limit,
        hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
  } catch (err) { next(err); }
};

// ─── Get Single Event ─────────────────────────────────────────────────────────

const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate({ path: 'organizer', select: 'fullName email' });

    if (!event) {
      return sendError(res, 404, `Event with ID "${req.params.id}" not found.`);
    }

    // Attach real aggregated ticket count
    const bookedAgg = await Reservation.aggregate([
      { $match: { event: event._id, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$numberOfTickets' } } },
    ]);
    const evt = event.toObject ? event.toObject() : event;
    const booked = bookedAgg.length > 0 ? bookedAgg[0].total : 0;
    evt._bookedTickets = booked;

    // Override Mongoose virtuals (based on participants.length = unique users)
    // with real aggregated ticket counts.
    evt.participantCount  = booked;
    evt.availableSpots    = Math.max(0, (event.capacity || 0) - booked);
    evt.isFull            = evt.availableSpots <= 0;

    // Attach reservation flag for authenticated users (review form)
    if (req.user) {
      const reservation = await Reservation.findOne({
        event: event._id, user: req.user._id, status: 'confirmed',
      });
      evt._hasReservation = !!reservation;
    }

    return sendSuccess(res, 200, 'Event retrieved successfully.', evt);
  } catch (error) {
    next(error);
  }
};

// ─── Create Event ─────────────────────────────────────────────────────────────

const createEvent = async (req, res, next) => {
  try {
    const {
      title, description, location,
      startDate, endDate, category,
      capacity, type, price, images,
      ticketTypes, maxTicketsPerUser,
    } = req.body;

    // Build images array: combine uploaded files + URL objects from body
    const uploadedImages = (req.files || []).map((f) => ({
      url: `${process.env.BASE_URL}/uploads/${f.filename}`,
      filename: f.filename,
      isUploaded: true,
    }));

    const urlImages = Array.isArray(images)
      ? images.map((img) => ({
          url: typeof img === 'string' ? img : img.url,
          filename: '',
          isUploaded: false,
        }))
      : [];

    const event = await Event.create({
      title, description, location,
      startDate, endDate, category,
      capacity, type,
      price: type === 'free' ? 0 : price,
      organizer: req.user._id,
      images: [...uploadedImages, ...urlImages],
      ticketTypes: type === 'paid' ? (ticketTypes || []) : [],
      maxTicketsPerUser: maxTicketsPerUser || 20,
    });


    // Auto-generate QR code and persist it
    try {
      const baseUrl = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:3000';
      event.qrCode = await generateEventQRCode(event, baseUrl);
      await event.save();
    } catch (qrErr) {
      console.error('[QR] Failed to generate QR code for event', event._id, qrErr.message);
    }

    return ok(res, 201, 'Event created successfully', { data: event });
  } catch (err) { next(err); }
};

// ─── Update Event ─────────────────────────────────────────────────────────────

const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return sendError(res, 404, `Event with ID "${id}" not found.`);
    }

    // Only ADMIN or the event's organizer can update
    const isAdmin = req.user.role === ROLES.ADMIN;
    const isOrganizer = event.organizer.toString() === req.user._id.toString();

    if (!isAdmin && !isOrganizer) {
      return sendError(res, 403,
        "Access denied. Only the event organizer or an ADMIN can update this event."
      );
    }

    // Validate new capacity doesn't go below current participant count
    if (req.body.capacity !== undefined) {
      if (req.body.capacity < event.participants.length) {
        return sendError(res, 400,
          `Cannot reduce capacity to ${req.body.capacity}. Event already has ${event.participants.length} registered participants.`
        );
      }
    }

    const allowed = ['title','description','location','startDate','endDate','category','capacity','type','price','ticketTypes','maxTicketsPerUser'];
    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    if (updateData.type === 'free') { updateData.price = 0; updateData.ticketTypes = []; }

    const newImages = (req.files || []).map((f) => ({
      url: `${process.env.BASE_URL}/uploads/${f.filename}`,
      filename: f.filename,
      isUploaded: true,
    }));

    const ops = { $set: updateData };
    if (newImages.length) ops.$push = { images: { $each: newImages } };

    const updatedEvent = await Event.findByIdAndUpdate(id, ops,
      { new: true, runValidators: true })
      .populate({ path: "organizer", select: "fullName email" });

    // Notify confirmed participants if key fields changed (fire-and-forget)
    const notifiableFields = ['startDate', 'endDate', 'location', 'title'];
    if (Object.keys(updateData).some((k) => notifiableFields.includes(k))) {
      Reservation.find({ event: id, status: 'confirmed' })
        .populate('user', 'fullName email')
        .then((reservations) => {
          const changes = {};
          if (updateData.startDate) changes['Nouvelle date de début'] = new Date(updateData.startDate).toLocaleString('fr-FR');
          if (updateData.endDate)   changes['Nouvelle date de fin']   = new Date(updateData.endDate).toLocaleString('fr-FR');
          if (updateData.location?.address) changes['Nouveau lieu']   = updateData.location.address;
          if (updateData.title)     changes['Nouveau titre']          = updateData.title;
          reservations.forEach((r) =>
            notifyEventModified(r.user, updatedEvent, changes).catch(() => {})
          );
        })
        .catch(() => {});
    }

    return sendSuccess(res, 200, "Event updated successfully.", updatedEvent);
  } catch (error) {
    next(error);
  }
};

// ─── Delete Event (Soft Delete) ───────────────────────────────────────────────

const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return sendError(res, 404, `Event with ID "${id}" not found.`);
    }

    const isAdmin = req.user.role === ROLES.ADMIN;
    const isOrganizer = event.organizer.toString() === req.user._id.toString();

    if (!isAdmin && !isOrganizer) {
      return sendError(res, 403,
        "Access denied. Only the event organizer or an ADMIN can delete this event."
      );
    }

    // Soft delete the event
    await event.softDelete();

    // Notify all confirmed participants and cancel their reservations
    // (fire-and-forget)
    Reservation.find({ event: id, status: 'confirmed' })
      .populate('user', 'fullName email')
      .then(async (reservations) => {
        await Reservation.updateMany({ event: id, status: { $ne: 'cancelled' } }, {
          $set: { status: 'cancelled', cancelledAt: new Date(), cancellationReason: 'Event cancelled by organizer/admin' }
        });
        reservations.forEach((r) => notifyEventCancelled(r.user, event).catch(() => {}));
      })
      .catch(() => {});

    // Remove the event reference from all participants
    await User.updateMany({ events: id }, { $pull: { events: id } });

    return sendSuccess(res, 200, "Event deleted successfully.", {
      id,
      deletedAt: event.deletedAt,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Register User to Event ───────────────────────────────────────────────────

const registerUserToEvent = async (req, res, next) => {
  try {
    const { eventId, userId } = req.params;

    const isAdmin = req.user.role === ROLES.ADMIN;
    const isSelf = req.user._id.toString() === userId;

    if (!isAdmin && !isSelf) {
      return sendError(res, 403, "Access denied. You can only register yourself to an event.");
    }

    const [event, user] = await Promise.all([
      Event.findById(eventId),
      User.findById(userId),
    ]);

    if (!event) return sendError(res, 404, `Event with ID "${eventId}" not found.`);
    if (!user)  return sendError(res, 404, `User with ID "${userId}" not found.`);

    if (event.hasParticipant(userId)) {
      return sendError(res, 409, `User "${user.fullName}" is already registered for this event.`);
    }
    if (!event.hasCapacity()) {
      return sendError(res, 400, `Event "${event.title}" has reached its maximum capacity of ${event.capacity}.`);
    }
    if (event.isPast) {
      return sendError(res, 400, `Cannot register for a past event.`);
    }

    await Promise.all([
      Event.findByIdAndUpdate(eventId, { $addToSet: { participants: userId } }),
      User.findByIdAndUpdate(userId,   { $addToSet: { events: eventId } }),
    ]);

    const updatedEvent = await Event.findById(eventId)
      .populate({ path: "organizer",    select: "fullName email" })
      .populate({ path: "participants", select: "fullName email profileImage" });

    return sendSuccess(res, 200,
      `"${user.fullName}" successfully registered for "${event.title}".`,
      {
        event: {
          _id: updatedEvent._id,
          title: updatedEvent.title,
          participantCount: updatedEvent.participantCount,
          availableSpots: updatedEvent.availableSpots,
          participants: updatedEvent.participants,
        },
      }
    );
  } catch (error) {
    next(error);
  }
};

// ─── Unregister User from Event ───────────────────────────────────────────────

const unregisterUserFromEvent = async (req, res, next) => {
  try {
    const { eventId, userId } = req.params;

    const isAdmin = req.user.role === ROLES.ADMIN;
    const isSelf  = req.user._id.toString() === userId;

    if (!isAdmin && !isSelf) {
      return sendError(res, 403, "Access denied. You can only unregister yourself from an event.");
    }

    const [event, user] = await Promise.all([
      Event.findById(eventId),
      User.findById(userId),
    ]);

    if (!event) return sendError(res, 404, `Event with ID "${eventId}" not found.`);
    if (!user)  return sendError(res, 404, `User with ID "${userId}" not found.`);

    if (!event.hasParticipant(userId)) {
      return sendError(res, 409, `User "${user.fullName}" is not registered for this event.`);
    }

    await Promise.all([
      Event.findByIdAndUpdate(eventId, { $pull: { participants: userId } }),
      User.findByIdAndUpdate(userId,   { $pull: { events: eventId } }),
    ]);

    return sendSuccess(res, 200,
      `"${user.fullName}" successfully unregistered from "${event.title}".`,
      { eventId, userId }
    );
  } catch (error) {
    next(error);
  }
};

// ─── Get Event Participants ───────────────────────────────────────────────────

const getEventParticipants = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 200, search = "" } = req.query;
    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.min(parseInt(limit), 200);
    const skip = (pageNum - 1) * limitNum;

    const event = await Event.findById(eventId).select('title capacity organizer');
    if (!event) {
      return sendError(res, 404, `Event with ID "${eventId}" not found.`);
    }

    const isAdmin     = req.user.role === ROLES.ADMIN;
    const isOrganizer = event.organizer.toString() === req.user._id.toString();
    if (!isAdmin && !isOrganizer) {
      return sendError(res, 403,
        "Access denied. Only the event organizer or ADMIN can view participants."
      );
    }

    const reservationFilter = { event: eventId, status: 'confirmed' };
    if (search) {
      reservationFilter.$or = [
        { 'user.fullName': { $regex: search, $options: 'i' } },
        { 'user.email':    { $regex: search, $options: 'i' } },
      ];
    }

    const matchStage = { $match: { event: event._id, status: 'confirmed' } };
    const lookupStage = {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    };
    const unwindStage = { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } };

    const pipeline = [matchStage, lookupStage, unwindStage];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'user.fullName': { $regex: search, $options: 'i' } },
            { 'user.email':    { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    const countPipeline = [...pipeline, { $count: 'total' }];
    const dataPipeline = [
      ...pipeline,
      { $sort: { reservationDate: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $project: {
          _id: 1,
          numberOfTickets: 1,
          ticketType: 1,
          reservationDate: 1,
          'user._id': 1,
          'user.fullName': 1,
          'user.email': 1,
          'user.phone': 1,
          'user.role': 1,
          'user.createdAt': 1,
        },
      },
    ];

    const [countResult, participants] = await Promise.all([
      Reservation.aggregate(countPipeline),
      Reservation.aggregate(dataPipeline),
    ]);

    const total = countResult.length > 0 ? countResult[0].total : 0;
    const totalPages = Math.ceil(total / limitNum);

    return sendSuccess(
      res, 200,
      `Participants for "${event.title}" retrieved successfully.`,
      {
        event: {
          _id: event._id,
          title: event.title,
          capacity: event.capacity,
          participantCount: total,
          availableSpots: event.capacity - total,
        },
        participants,
        pagination: {
          total,
          totalPages,
          currentPage: pageNum,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      }
    );
  } catch (error) {
    next(error);
  }
};



// ─── Get Event QR Code ────────────────────────────────────────────────────────

/**
 * GET /api/events/:id/qrcode
 * Returns the stored QR code for the event.
 * If it was never generated (legacy documents), generates it on the fly,
 * persists it, and returns it.
 * Query param: ?format=png → responds with a raw PNG buffer (Content-Type: image/png)
 *              default     → responds with JSON { qrCode: "data:image/png;base64,..." }
 */
const getEventQRCode = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return sendError(res, 404, `Event with ID "${req.params.id}" not found.`);
    }

    let qrCode = event.qrCode;

    // Regenerate if missing (e.g. events created before this feature)
    if (!qrCode) {
      const baseUrl = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:3000';
      qrCode = await generateEventQRCode(event, baseUrl);
      event.qrCode = qrCode;
      await event.save();
    }

    // Return raw PNG if requested
    if (req.query.format === 'png') {
      const base64Data = qrCode.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      res.set('Content-Type', 'image/png');
      res.set('Content-Disposition', `inline; filename="event-${event._id}-qrcode.png"`);
      return res.send(buffer);
    }

    return sendSuccess(res, 200, 'QR code retrieved successfully.', {
      eventId: event._id,
      title:   event.title,
      qrCode,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Regenerate Event QR Code ─────────────────────────────────────────────────

/**
 * PATCH /api/events/:id/qrcode
 * Force-regenerates the QR code for an event.
 * Only the organizer or an ADMIN can regenerate.
 */
const regenerateEventQRCode = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return sendError(res, 404, `Event with ID "${req.params.id}" not found.`);
    }

    const isAdmin     = req.user.role === ROLES.ADMIN;
    const isOrganizer = event.organizer.toString() === req.user._id.toString();

    if (!isAdmin && !isOrganizer) {
      return sendError(res, 403,
        'Access denied. Only the event organizer or an ADMIN can regenerate the QR code.'
      );
    }

    const baseUrl = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:3000';
    event.qrCode = await generateEventQRCode(event, baseUrl);
    await event.save();

    return sendSuccess(res, 200, 'QR code regenerated successfully.', {
      eventId: event._id,
      title:   event.title,
      qrCode:  event.qrCode,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerUserToEvent,
  unregisterUserFromEvent,
  getEventParticipants,
  getEventQRCode,
  regenerateEventQRCode,
};
