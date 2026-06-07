const Category = require('../models/Category');
const Material = require('../models/Material');
const { sendSuccess } = require('../utils/responseHelper');
const { AppError } = require('../middleware/errorHandler');
const asyncHandler = require('../middleware/asyncHandler');
const { validationResult } = require('express-validator');

const createCategory = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((e) => e.msg).join('. '), 400);
  }

  const category = await Category.create(req.body);

  if (category.parent) {
    await Category.findByIdAndUpdate(category.parent, { $addToSet: { children: category._id } });
  }

  return sendSuccess(res, 201, 'Category created successfully', { data: category });
});

const getAllCategories = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.parent === 'none') {
    filter.parent = null;
  } else if (req.query.parent) {
    filter.parent = req.query.parent;
  }

  const categories = await Category.find(filter).populate('parent', 'name').sort('name').lean();

  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const materialCount = await Material.countDocuments({ category: cat._id });
      return { ...cat, materialCount };
    })
  );

  return sendSuccess(res, 200, 'Categories fetched successfully', { data: categoriesWithCount });
});

const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).populate('parent', 'name').lean();

  if (!category) {
    throw new AppError(`Category not found with ID: ${req.params.id}`, 404);
  }

  const materialCount = await Material.countDocuments({ category: req.params.id });

  return sendSuccess(res, 200, 'Category fetched successfully', { data: { ...category, materialCount } });
});

const updateCategory = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((e) => e.msg).join('. '), 400);
  }

  const allowedFields = ['name', 'description', 'icon', 'color', 'parent'];
  const updateData = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
  );

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields provided for update', 400);
  }

  const category = await Category.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true, runValidators: true }).populate('parent', 'name');

  if (!category) {
    throw new AppError(`Category not found with ID: ${req.params.id}`, 404);
  }

  return sendSuccess(res, 200, 'Category updated successfully', { data: category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw new AppError(`Category not found with ID: ${req.params.id}`, 404);
  }

  const materialCount = await Material.countDocuments({ category: req.params.id });
  if (materialCount > 0) {
    throw new AppError(`Cannot delete category: ${materialCount} material(s) are using it. Reassign them first.`, 400);
  }

  await Category.updateMany({ parent: req.params.id }, { $set: { parent: category.parent } });

  await Category.findByIdAndDelete(req.params.id);

  return sendSuccess(res, 200, 'Category deleted successfully', { data: { id: req.params.id } });
});

module.exports = { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory };
