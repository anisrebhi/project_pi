const Event = require('../models/Event');

const sendSuccess = (res, statusCode, message, data = {}) =>
  res.status(statusCode).json({ success: true, statusCode, message, ...data });


const createEvent = async (req, res, next) => {
  try {
    const { title, description, location, startDate, endDate, category, capacity } = req.body;

    const event = await Event.create({
      title,
      description,
      location,
      startDate,
      endDate,
      category,
      capacity,
    });

    return sendSuccess(res, 201, 'Event created successfully', { data: event });
  } catch (error) {
    next(error);
  }
};


const getAllEvents = async (req, res, next) => {
  try {
  
    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip  = (page - 1) * limit;

    const filter = {};

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

   
    if (req.query.startFrom || req.query.startTo) {
      filter.startDate = {};
      if (req.query.startFrom) filter.startDate.$gte = new Date(req.query.startFrom);
      if (req.query.startTo)   filter.startDate.$lte = new Date(req.query.startTo);
    }

   
    const sortField = req.query.sortBy || 'startDate';
    const sortOrder = req.query.order  === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortOrder };

  
    const [events, total] = await Promise.all([
      Event.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Event.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 200, 'Events fetched successfully', {
      data: events,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};


const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      const error = new Error(`Event not found with ID: ${req.params.id}`);
      error.statusCode = 404;
      return next(error);
    }

    return sendSuccess(res, 200, 'Event fetched successfully', { data: event });
  } catch (error) {
    next(error);
  }
};


const updateEvent = async (req, res, next) => {
  try {
    const allowedFields = ['title', 'description', 'location', 'startDate', 'endDate', 'category', 'capacity'];

   
    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(updateData).length === 0) {
      const error = new Error('No valid fields provided for update');
      error.statusCode = 400;
      return next(error);
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!event) {
      const error = new Error(`Event not found with ID: ${req.params.id}`);
      error.statusCode = 404;
      return next(error);
    }

    return sendSuccess(res, 200, 'Event updated successfully', { data: event });
  } catch (error) {
    next(error);
  }
};


const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      const error = new Error(`Event not found with ID: ${req.params.id}`);
      error.statusCode = 404;
      return next(error);
    }

    return sendSuccess(res, 200, 'Event deleted successfully', { data: { id: req.params.id } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};
