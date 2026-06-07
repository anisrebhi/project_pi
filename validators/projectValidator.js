const { body, param } = require('express-validator');

const createProjectValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Project name is required'),
  body('description')
    .optional()
    .trim(),
  body('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date'),
  body('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date'),
  body('status')
    .optional()
    .isIn(['planning', 'active', 'completed', 'cancelled'])
    .withMessage('Status must be: planning, active, completed, or cancelled'),
  body('budget')
    .optional()
    .isFloat({ min: 0 }).withMessage('Budget must be non-negative'),
  body('manager')
    .optional()
    .isMongoId().withMessage('Invalid manager ID'),
];

const updateProjectValidator = [
  param('id').isMongoId().withMessage('Invalid project ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Project name cannot be empty'),
  body('description')
    .optional()
    .trim(),
  body('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date'),
  body('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date'),
  body('status')
    .optional()
    .isIn(['planning', 'active', 'completed', 'cancelled'])
    .withMessage('Status must be: planning, active, completed, or cancelled'),
  body('budget')
    .optional()
    .isFloat({ min: 0 }).withMessage('Budget must be non-negative'),
  body('manager')
    .optional()
    .isMongoId().withMessage('Invalid manager ID'),
];

module.exports = {
  createProjectValidator,
  updateProjectValidator,
};
