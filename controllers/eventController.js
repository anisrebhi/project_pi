const Event = require('../models/Event');
const { sendSuccess } = require('../utils/responseHelper');
const { AppError } = require('../middleware/errorHandler');
const asyncHandler = require('../middleware/asyncHandler');
const { validationResult } = require('express-validator');

const createEvent = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((e) => e.msg).join('. '), 400);
  }

  const { title, description, location, startDate, endDate, category, capacity, project, materials, status } = req.body;

  if (new Date(startDate) >= new Date(endDate)) {
    throw new AppError('Start date must be before end date', 400);
  }

  const event = await Event.create({ title, description, location, startDate, endDate, category, capacity, project, materials, status });

  return sendSuccess(res, 201, 'Event created successfully', { data: event });
});

const getAllEvents = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.search) filter.$text = { $search: req.query.search };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.project) filter.project = req.query.project;
  if (req.query.status) filter.status = req.query.status;

  if (req.query.startFrom || req.query.startTo) {
    filter.startDate = {};
    if (req.query.startFrom) {
      const from = new Date(req.query.startFrom);
      if (isNaN(from.getTime())) throw new AppError('Invalid startFrom date', 400);
      filter.startDate.$gte = from;
    }
    if (req.query.startTo) {
      const to = new Date(req.query.startTo);
      if (isNaN(to.getTime())) throw new AppError('Invalid startTo date', 400);
      filter.startDate.$lte = to;
    }
  }

  const sortField = req.query.sortBy || 'startDate';
  const sortOrder = req.query.order === 'desc' ? -1 : 1;

  const [events, total] = await Promise.all([
    Event.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip).limit(limit)
      .populate('project', 'name')
      .populate('materials.material', 'name status')
      .lean(),
    Event.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return sendSuccess(res, 200, 'Events fetched successfully', {
    data: events,
    pagination: { total, totalPages, currentPage: page, limit, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
  });
});

const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('project', 'name')
    .populate('materials.material', 'name serialNumber status')
    .lean();

  if (!event) throw new AppError(`Event not found with ID: ${req.params.id}`, 404);

  return sendSuccess(res, 200, 'Event fetched successfully', { data: event });
});

const updateEvent = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((e) => e.msg).join('. '), 400);
  }

  const allowedFields = ['title', 'description', 'location', 'startDate', 'endDate', 'category', 'capacity', 'project', 'materials', 'status'];
  const updateData = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
  );

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields provided for update', 400);
  }

  if (updateData.startDate && updateData.endDate && new Date(updateData.startDate) >= new Date(updateData.endDate)) {
    throw new AppError('Start date must be before end date', 400);
  }

  const event = await Event.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true, runValidators: true })
    .populate('project', 'name')
    .populate('materials.material', 'name status');

  if (!event) throw new AppError(`Event not found with ID: ${req.params.id}`, 404);

  return sendSuccess(res, 200, 'Event updated successfully', { data: event });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);

  if (!event) throw new AppError(`Event not found with ID: ${req.params.id}`, 404);

  return sendSuccess(res, 200, 'Event deleted successfully', { data: { id: req.params.id } });
});

module.exports = { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent };
