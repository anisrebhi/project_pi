const { body, param } = require('express-validator');

const createCategoryValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required'),
  body('description')
    .optional()
    .trim(),
  body('icon')
    .optional()
    .trim(),
  body('color')
    .optional()
    .trim(),
  body('parent')
    .optional({ values: 'null' })
    .isMongoId().withMessage('Invalid parent category ID'),
];

const updateCategoryValidator = [
  param('id').isMongoId().withMessage('Invalid category ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Category name cannot be empty'),
  body('description')
    .optional()
    .trim(),
  body('icon')
    .optional()
    .trim(),
  body('color')
    .optional()
    .trim(),
  body('parent')
    .optional({ values: 'null' })
    .isMongoId().withMessage('Invalid parent category ID'),
];

module.exports = {
  createCategoryValidator,
  updateCategoryValidator,
};
