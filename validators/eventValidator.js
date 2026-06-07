const { body, param } = require('express-validator');

const createEventValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Event title is required'),
  body('description')
    .optional()
    .trim(),
  body('location')
    .optional()
    .trim(),
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Invalid start date'),
  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('Invalid end date'),
  body('category')
    .optional()
    .trim(),
  body('capacity')
    .optional()
    .isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('project')
    .optional({ values: 'null' })
    .isMongoId().withMessage('Invalid project ID'),
  body('materials')
    .optional()
    .isArray().withMessage('Materials must be an array'),
  body('materials.*.material')
    .optional()
    .isMongoId().withMessage('Invalid material ID'),
  body('materials.*.quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('Material quantity must be at least 1'),
  body('status')
    .optional()
    .isIn(['draft', 'confirmed', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Invalid event status'),
];

const updateEventValidator = [
  param('id').isMongoId().withMessage('Invalid event ID'),
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Event title cannot be empty'),
  body('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date'),
  body('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date'),
  body('capacity')
    .optional()
    .isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('project')
    .optional({ values: 'null' })
    .isMongoId().withMessage('Invalid project ID'),
];

module.exports = { createEventValidator, updateEventValidator };
