const { body, query, param } = require('express-validator');
const { MATERIAL_STATUSES } = require('../models/Material');

const createMaterialValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Material name is required'),
  body('description')
    .optional()
    .trim(),
  body('serialNumber')
    .optional()
    .trim(),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('status')
    .optional()
    .isIn(MATERIAL_STATUSES).withMessage(`Status must be one of: ${MATERIAL_STATUSES.join(', ')}`),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Invalid category ID'),
  body('project')
    .optional({ values: 'null' })
    .isMongoId().withMessage('Invalid project ID'),
  body('purchaseDate')
    .optional()
    .isISO8601().withMessage('Invalid purchase date'),
  body('purchasePrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Purchase price must be non-negative'),
  body('location')
    .optional()
    .trim(),
  body('condition')
    .optional()
    .trim(),
  body('notes')
    .optional()
    .trim(),
];

const updateMaterialValidator = [
  param('id').isMongoId().withMessage('Invalid material ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Material name cannot be empty'),
  body('description')
    .optional()
    .trim(),
  body('serialNumber')
    .optional()
    .trim(),
  body('quantity')
    .optional()
    .isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('status')
    .optional()
    .isIn(MATERIAL_STATUSES).withMessage(`Status must be one of: ${MATERIAL_STATUSES.join(', ')}`),
  body('category')
    .optional()
    .isMongoId().withMessage('Invalid category ID'),
  body('project')
    .optional({ values: 'null' })
    .isMongoId().withMessage('Invalid project ID'),
  body('purchaseDate')
    .optional()
    .isISO8601().withMessage('Invalid purchase date'),
  body('purchasePrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Purchase price must be non-negative'),
  body('location')
    .optional()
    .trim(),
  body('condition')
    .optional()
    .trim(),
  body('notes')
    .optional()
    .trim(),
];

const updateStatusValidator = [
  param('id').isMongoId().withMessage('Invalid material ID'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(MATERIAL_STATUSES).withMessage(`Status must be one of: ${MATERIAL_STATUSES.join(', ')}`),
];

const listMaterialsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(MATERIAL_STATUSES).withMessage(`Status must be one of: ${MATERIAL_STATUSES.join(', ')}`),
  query('category')
    .optional()
    .isMongoId().withMessage('Invalid category ID'),
  query('project')
    .optional()
    .isMongoId().withMessage('Invalid project ID'),
];

module.exports = {
  createMaterialValidator,
  updateMaterialValidator,
  updateStatusValidator,
  listMaterialsValidator,
};
