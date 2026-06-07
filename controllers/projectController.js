const Project = require('../models/Project');
const Event = require('../models/Event');
const Material = require('../models/Material');
const { sendSuccess } = require('../utils/responseHelper');
const { AppError } = require('../middleware/errorHandler');
const asyncHandler = require('../middleware/asyncHandler');
const { validationResult } = require('express-validator');

const createProject = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((e) => e.msg).join('. '), 400);
  }

  const project = await Project.create(req.body);
  const populated = await Project.findById(project._id).populate('manager', 'name email');

  return sendSuccess(res, 201, 'Project created successfully', { data: populated });
});

const getAllProjects = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.manager) {
    filter.manager = req.query.manager;
  }

  const sortField = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.order === 'desc' ? -1 : 1;
  const sort = { [sortField]: sortOrder };

  const [projects, total] = await Promise.all([
    Project.find(filter).sort(sort).skip(skip).limit(limit).populate('manager', 'name email').lean(),
    Project.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return sendSuccess(res, 200, 'Projects fetched successfully', {
    data: projects,
    pagination: { total, totalPages, currentPage: page, limit, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
  });
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate('manager', 'name email').lean();

  if (!project) {
    throw new AppError(`Project not found with ID: ${req.params.id}`, 404);
  }

  const [events, materials] = await Promise.all([
    Event.find({ project: req.params.id }).select('title startDate endDate status').lean(),
    Material.find({ project: req.params.id }).select('name serialNumber status category').populate('category', 'name').lean(),
  ]);

  return sendSuccess(res, 200, 'Project fetched successfully', {
    data: { ...project, events, materials },
  });
});

const updateProject = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((e) => e.msg).join('. '), 400);
  }

  const allowedFields = ['name', 'description', 'startDate', 'endDate', 'status', 'budget', 'manager'];

  const updateData = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
  );

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields provided for update', 400);
  }

  const project = await Project.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true, runValidators: true }).populate('manager', 'name email');

  if (!project) {
    throw new AppError(`Project not found with ID: ${req.params.id}`, 404);
  }

  return sendSuccess(res, 200, 'Project updated successfully', { data: project });
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);

  if (!project) {
    throw new AppError(`Project not found with ID: ${req.params.id}`, 404);
  }

  await Promise.all([
    Event.updateMany({ project: req.params.id }, { $set: { project: null } }),
    Material.updateMany({ project: req.params.id }, { $set: { project: null } }),
  ]);

  return sendSuccess(res, 200, 'Project deleted successfully', { data: { id: req.params.id } });
});

module.exports = { createProject, getAllProjects, getProjectById, updateProject, deleteProject };
