const Material = require('../models/Material');
const { sendSuccess } = require('../utils/responseHelper');
const { AppError } = require('../middleware/errorHandler');
const asyncHandler = require('../middleware/asyncHandler');
const { validationResult } = require('express-validator');

const createMaterial = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((e) => e.msg).join('. '), 400);
  }

  const material = await Material.create(req.body);
  const populated = await Material.findById(material._id).populate('category', 'name').populate('project', 'name');

  return sendSuccess(res, 201, 'Material created successfully', { data: populated });
});

const getAllMaterials = asyncHandler(async (req, res) => {
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

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.project) {
    filter.project = req.query.project;
  }

  if (req.query.condition) {
    filter.condition = req.query.condition;
  }

  if (req.query.minPrice || req.query.maxPrice) {
    filter.purchasePrice = {};
    if (req.query.minPrice) filter.purchasePrice.$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) filter.purchasePrice.$lte = parseFloat(req.query.maxPrice);
  }

  const sortField = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.order === 'desc' ? -1 : 1;
  const sort = { [sortField]: sortOrder };

  const [materials, total] = await Promise.all([
    Material.find(filter).sort(sort).skip(skip).limit(limit).populate('category', 'name color').populate('project', 'name status').lean(),
    Material.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return sendSuccess(res, 200, 'Materials fetched successfully', {
    data: materials,
    pagination: { total, totalPages, currentPage: page, limit, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
  });
});

const getMaterialById = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id).populate('category', 'name color icon').populate('project', 'name status').lean();

  if (!material) {
    throw new AppError(`Material not found with ID: ${req.params.id}`, 404);
  }

  return sendSuccess(res, 200, 'Material fetched successfully', { data: material });
});

const updateMaterial = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((e) => e.msg).join('. '), 400);
  }

  const allowedFields = ['name', 'description', 'serialNumber', 'quantity', 'status', 'category', 'project', 'purchaseDate', 'purchasePrice', 'location', 'condition', 'notes', 'updatedBy'];

  const updateData = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
  );

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields provided for update', 400);
  }

  const material = await Material.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true, runValidators: true }).populate('category', 'name').populate('project', 'name');

  if (!material) {
    throw new AppError(`Material not found with ID: ${req.params.id}`, 404);
  }

  return sendSuccess(res, 200, 'Material updated successfully', { data: material });
});

const deleteMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findByIdAndDelete(req.params.id);

  if (!material) {
    throw new AppError(`Material not found with ID: ${req.params.id}`, 404);
  }

  return sendSuccess(res, 200, 'Material deleted successfully', { data: { id: req.params.id } });
});

const updateMaterialStatus = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((e) => e.msg).join('. '), 400);
  }

  const material = await Material.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } }, { new: true, runValidators: true }).populate('category', 'name').populate('project', 'name');

  if (!material) {
    throw new AppError(`Material not found with ID: ${req.params.id}`, 404);
  }

  return sendSuccess(res, 200, 'Material status updated successfully', { data: material });
});

module.exports = { createMaterial, getAllMaterials, getMaterialById, updateMaterial, deleteMaterial, updateMaterialStatus };
