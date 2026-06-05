const Event = require('../models/Event');
const path  = require('path');

const ok = (res, code, message, data = {}) =>
  res.status(code).json({ success: true, statusCode: code, message, ...data });

// ─── POST /api/events ─────────────────────────────────────────────────────────
const createEvent = async (req, res, next) => {
  try {
    const {
      title, description, location,
      startDate, endDate, category,
      capacity, type, price, images,
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
      images: [...uploadedImages, ...urlImages],
    });

    return ok(res, 201, 'Event created successfully', { data: event });
  } catch (err) { next(err); }
};

// ─── GET /api/events ──────────────────────────────────────────────────────────
const getAllEvents = async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.search)   filter.$text     = { $search: req.query.search };
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
        .populate('participants', 'firstName lastName email')
        .sort({ [sortField]: sortOrder })
        .skip(skip).limit(limit).lean(),
      Event.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    return ok(res, 200, 'Events fetched successfully', {
      data: events,
      pagination: { total, totalPages, currentPage: page, limit,
        hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
  } catch (err) { next(err); }
};

// ─── GET /api/events/:id ──────────────────────────────────────────────────────
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('participants', 'firstName lastName email phone');
    if (!event) {
      const e = new Error(`Event not found: ${req.params.id}`);
      e.statusCode = 404; return next(e);
    }
    return ok(res, 200, 'Event fetched successfully', { data: event });
  } catch (err) { next(err); }
};

// ─── PUT /api/events/:id ──────────────────────────────────────────────────────
const updateEvent = async (req, res, next) => {
  try {
    const allowed = [
      'title','description','location','startDate','endDate',
      'category','capacity','type','price',
    ];
    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    if (updateData.type === 'free') updateData.price = 0;

    // Append newly uploaded images (without removing existing)
    const newImages = (req.files || []).map((f) => ({
      url: `${process.env.BASE_URL}/uploads/${f.filename}`,
      filename: f.filename,
      isUploaded: true,
    }));

    const ops = { $set: updateData };
    if (newImages.length) ops.$push = { images: { $each: newImages } };

    const event = await Event.findByIdAndUpdate(req.params.id, ops,
      { new: true, runValidators: true });

    if (!event) {
      const e = new Error(`Event not found: ${req.params.id}`);
      e.statusCode = 404; return next(e);
    }
    return ok(res, 200, 'Event updated successfully', { data: event });
  } catch (err) { next(err); }
};

// ─── DELETE /api/events/:id ───────────────────────────────────────────────────
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      const e = new Error(`Event not found: ${req.params.id}`);
      e.statusCode = 404; return next(e);
    }
    return ok(res, 200, 'Event deleted successfully', { data: { id: req.params.id } });
  } catch (err) { next(err); }
};

// ─── GET /api/events/:id/participants ─────────────────────────────────────────
const getEventParticipants = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('participants', 'firstName lastName email phone');
    if (!event) {
      const e = new Error(`Event not found: ${req.params.id}`);
      e.statusCode = 404; return next(e);
    }
    return ok(res, 200, 'Participants fetched successfully', {
      data: {
        eventId: event._id,
        eventTitle: event.title,
        participantCount: event.participants.length,
        participants: event.participants,
      },
    });
  } catch (err) { next(err); }
};

module.exports = {
  createEvent, getAllEvents, getEventById,
  updateEvent, deleteEvent, getEventParticipants,
};
