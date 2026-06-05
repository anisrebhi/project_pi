/**
 * @file controllers/eventController.js
 * @description Event management controller — CRUD operations and
 *              Many-to-Many user registration/unregistration logic.
 */

const Event = require("../models/Event");
const { User, ROLES } = require("../models/User");
const { sendSuccess, sendError, buildPagination } = require("../utils/apiResponse");

// ─── List Events ──────────────────────────────────────────────────────────────

/**
 * @desc    Get all events with pagination and search
 * @route   GET /api/events
 * @access  Private
 * @query   page, limit, search, location, from, to, sortBy, order
 */
const getAllEvents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      location,
      from,
      to,
      sortBy = "date",
      order = "asc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ─── Build filter ────────────────────────────────────────────
    const filter = {};

    // Text search across title, description, location
    if (search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { location: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Filter by location
    if (location) {
      filter.location = { $regex: location.trim(), $options: "i" };
    }

    // Date range filter
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    // Non-ADMIN users see only their own events + public events
    // ORGANIZER sees events they created
    if (req.user.role === ROLES.ORGANIZER) {
      filter.organizer = req.user._id;
    }

    // ─── Build sort ──────────────────────────────────────────────
    const allowedSort = ["title", "date", "location", "capacity", "createdAt"];
    const sortField = allowedSort.includes(sortBy) ? sortBy : "date";
    const sort = { [sortField]: order === "asc" ? 1 : -1 };

    // ─── Execute ─────────────────────────────────────────────────
    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate({ path: "organizer", select: "fullName email profileImage" })
        .populate({ path: "participants", select: "fullName email profileImage" })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Event.countDocuments(filter),
    ]);

    const pagination = buildPagination(total, page, limit);

    return sendSuccess(res, 200, "Events retrieved successfully.", events, pagination);
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Event ─────────────────────────────────────────────────────────

/**
 * @desc    Get event by ID with full participant and organizer details
 * @route   GET /api/events/:id
 * @access  Private
 */
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate({
        path: "organizer",
        select: "fullName email phone profileImage role",
      })
      .populate({
        path: "participants",
        select: "fullName email profileImage role",
      });

    if (!event) {
      return sendError(res, 404, `Event with ID "${req.params.id}" not found.`);
    }

    return sendSuccess(res, 200, "Event retrieved successfully.", event);
  } catch (error) {
    next(error);
  }
};

// ─── Create Event ─────────────────────────────────────────────────────────────

/**
 * @desc    Create a new event
 * @route   POST /api/events
 * @access  Private — ADMIN, ORGANIZER
 */
const createEvent = async (req, res, next) => {
  try {
    const { title, description, location, date, capacity } = req.body;

    const event = await Event.create({
      title,
      description,
      location,
      date,
      capacity,
      organizer: req.user._id, // Authenticated user becomes the organizer
    });

    // Populate organizer for the response
    await event.populate({ path: "organizer", select: "fullName email profileImage" });

    return sendSuccess(res, 201, "Event created successfully.", event);
  } catch (error) {
    next(error);
  }
};

// ─── Update Event ─────────────────────────────────────────────────────────────

/**
 * @desc    Update event by ID
 * @route   PUT /api/events/:id
 * @access  Private — ADMIN or organizer of this event
 */
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
      return sendError(
        res,
        403,
        "Access denied. Only the event organizer or an ADMIN can update this event."
      );
    }

    // Validate new capacity doesn't go below current participant count
    if (req.body.capacity !== undefined) {
      if (req.body.capacity < event.participants.length) {
        return sendError(
          res,
          400,
          `Cannot reduce capacity to ${req.body.capacity}. Event already has ${event.participants.length} registered participants.`
        );
      }
    }

    const allowedUpdates = ["title", "description", "location", "date", "capacity"];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    await event.save();
    await event.populate({ path: "organizer", select: "fullName email" });

    return sendSuccess(res, 200, "Event updated successfully.", event);
  } catch (error) {
    next(error);
  }
};

// ─── Delete Event (Soft Delete) ───────────────────────────────────────────────

/**
 * @desc    Soft-delete an event
 * @route   DELETE /api/events/:id
 * @access  Private — ADMIN or organizer of this event
 */
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
      return sendError(
        res,
        403,
        "Access denied. Only the event organizer or an ADMIN can delete this event."
      );
    }

    // Soft delete the event
    await event.softDelete();

    // Remove the event reference from all participants
    await User.updateMany(
      { events: id },
      { $pull: { events: id } }
    );

    return sendSuccess(res, 200, "Event deleted successfully.", {
      id,
      deletedAt: event.deletedAt,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Register User to Event ───────────────────────────────────────────────────

/**
 * @desc    Register a user as participant in an event (Many-to-Many link)
 * @route   POST /api/events/:eventId/register/:userId
 * @access  Private — ADMIN, ORGANIZER, or the user themselves
 */
const registerUserToEvent = async (req, res, next) => {
  try {
    const { eventId, userId } = req.params;

    // Authorization: ADMIN can register anyone; others can only register themselves
    const isAdmin = req.user.role === ROLES.ADMIN;
    const isSelf = req.user._id.toString() === userId;

    if (!isAdmin && !isSelf) {
      return sendError(
        res,
        403,
        "Access denied. You can only register yourself to an event."
      );
    }

    // ─── Fetch both documents in parallel ───────────────────────
    const [event, user] = await Promise.all([
      Event.findById(eventId),
      User.findById(userId),
    ]);

    if (!event) return sendError(res, 404, `Event with ID "${eventId}" not found.`);
    if (!user) return sendError(res, 404, `User with ID "${userId}" not found.`);

    // ─── Business Rule Checks ────────────────────────────────────

    // 1. Prevent double registration
    if (event.hasParticipant(userId)) {
      return sendError(
        res,
        409,
        `User "${user.fullName}" is already registered for this event.`
      );
    }

    // 2. Check capacity
    if (!event.hasCapacity()) {
      return sendError(
        res,
        400,
        `Event "${event.title}" has reached its maximum capacity of ${event.capacity}.`
      );
    }

    // 3. Prevent registering to a past event
    if (event.isPast) {
      return sendError(res, 400, `Cannot register for a past event.`);
    }

    // ─── Atomic Many-to-Many Update ──────────────────────────────
    // Update both sides of the relationship atomically (using Promise.all)
    await Promise.all([
      Event.findByIdAndUpdate(eventId, {
        $addToSet: { participants: userId }, // $addToSet prevents duplicates
      }),
      User.findByIdAndUpdate(userId, {
        $addToSet: { events: eventId },
      }),
    ]);

    // ─── Return updated event with populated data ────────────────
    const updatedEvent = await Event.findById(eventId)
      .populate({ path: "organizer", select: "fullName email" })
      .populate({ path: "participants", select: "fullName email profileImage" });

    return sendSuccess(
      res,
      200,
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

/**
 * @desc    Remove a user from an event's participant list (Many-to-Many unlink)
 * @route   DELETE /api/events/:eventId/unregister/:userId
 * @access  Private — ADMIN or the user themselves
 */
const unregisterUserFromEvent = async (req, res, next) => {
  try {
    const { eventId, userId } = req.params;

    const isAdmin = req.user.role === ROLES.ADMIN;
    const isSelf = req.user._id.toString() === userId;

    if (!isAdmin && !isSelf) {
      return sendError(
        res,
        403,
        "Access denied. You can only unregister yourself from an event."
      );
    }

    const [event, user] = await Promise.all([
      Event.findById(eventId),
      User.findById(userId),
    ]);

    if (!event) return sendError(res, 404, `Event with ID "${eventId}" not found.`);
    if (!user) return sendError(res, 404, `User with ID "${userId}" not found.`);

    // Check user is actually registered
    if (!event.hasParticipant(userId)) {
      return sendError(
        res,
        409,
        `User "${user.fullName}" is not registered for this event.`
      );
    }

    // ─── Atomic removal from both sides ──────────────────────────
    await Promise.all([
      Event.findByIdAndUpdate(eventId, { $pull: { participants: userId } }),
      User.findByIdAndUpdate(userId, { $pull: { events: eventId } }),
    ]);

    return sendSuccess(
      res,
      200,
      `"${user.fullName}" successfully unregistered from "${event.title}".`,
      { eventId, userId }
    );
  } catch (error) {
    next(error);
  }
};

// ─── Get Event Participants ───────────────────────────────────────────────────

/**
 * @desc    Get all participants of an event with pagination
 * @route   GET /api/events/:eventId/participants
 * @access  Private — ADMIN or event organizer
 */
const getEventParticipants = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const event = await Event.findById(eventId).populate({
      path: "participants",
      select: "fullName email phone profileImage role createdAt",
      match: search
        ? {
            $or: [
              { fullName: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          }
        : {},
    });

    if (!event) {
      return sendError(res, 404, `Event with ID "${eventId}" not found.`);
    }

    // Authorization: ADMIN or organizer
    const isAdmin = req.user.role === ROLES.ADMIN;
    const isOrganizer = event.organizer.toString() === req.user._id.toString();

    if (!isAdmin && !isOrganizer) {
      return sendError(
        res,
        403,
        "Access denied. Only the event organizer or ADMIN can view participants."
      );
    }

    // Manual pagination on populated array
    const allParticipants = event.participants;
    const total = allParticipants.length;
    const participants = allParticipants.slice(skip, skip + parseInt(limit));
    const pagination = buildPagination(total, page, limit);

    return sendSuccess(
      res,
      200,
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
      },
      pagination
    );
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
};
