const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      statusCode: 422,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Formation CRUD ────────────────────────────────────────────────────────────
const validateCreateFormation = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ max: 3000 }).withMessage('Description max 3000 characters'),
  body('level').notEmpty().withMessage('Level is required')
    .isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Level must be: Beginner, Intermediate, or Advanced'),
  body('category').optional()
    .isIn(['technical', 'soft-skills', 'management', 'security', 'other']).withMessage('Invalid category'),
  body('instructor').trim().notEmpty().withMessage('Instructor name is required'),
  body('capacity').optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
  body('status').optional()
    .isIn(['Active', 'Archived', 'Draft']).withMessage('Status must be: Active, Archived, or Draft'),
  handleValidationErrors,
];

const validateUpdateFormation = [
  param('id').isMongoId().withMessage('Invalid formation ID'),
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').optional().trim().isLength({ max: 3000 }),
  body('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid level'),
  body('category').optional().isIn(['technical', 'soft-skills', 'management', 'security', 'other']),
  body('capacity').optional({ nullable: true }).isInt({ min: 1 }),
  body('status').optional().isIn(['Active', 'Archived', 'Draft']),
  handleValidationErrors,
];

// ── Participants ──────────────────────────────────────────────────────────────
const validateEnroll = [
  param('id').isMongoId().withMessage('Invalid formation ID'),
  body('userId').isMongoId().withMessage('Invalid user ID'),
  handleValidationErrors,
];

const validateUnenroll = [
  param('id').isMongoId().withMessage('Invalid formation ID'),
  param('userId').isMongoId().withMessage('Invalid user ID'),
  handleValidationErrors,
];

// ── Sessions ──────────────────────────────────────────────────────────────────
const validateAddSession = [
  param('id').isMongoId().withMessage('Invalid formation ID'),
  body('title').trim().notEmpty().withMessage('Session title is required'),
  body('startDate').notEmpty().withMessage('Start date is required').isISO8601().withMessage('Invalid start date'),
  body('endDate').notEmpty().withMessage('End date is required').isISO8601().withMessage('Invalid end date')
    .custom((v, { req }) => {
      if (req.body.startDate && new Date(v) <= new Date(req.body.startDate))
        throw new Error('End date must be after start date');
      return true;
    }),
  body('location').optional().trim().isLength({ max: 300 }),
  body('maxCapacity').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Session capacity must be positive'),
  handleValidationErrors,
];

const validateUpdateSession = [
  param('id').isMongoId().withMessage('Invalid formation ID'),
  param('sessionId').isMongoId().withMessage('Invalid session ID'),
  body('title').optional().trim().notEmpty().withMessage('Session title cannot be empty'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date')
    .custom((v, { req }) => {
      if (req.body.startDate && new Date(v) <= new Date(req.body.startDate))
        throw new Error('End date must be after start date');
      return true;
    }),
  body('maxCapacity').optional({ nullable: true }).isInt({ min: 1 }),
  handleValidationErrors,
];

const validateSessionId = [
  param('id').isMongoId().withMessage('Invalid formation ID'),
  param('sessionId').isMongoId().withMessage('Invalid session ID'),
  handleValidationErrors,
];

// ── Resources ─────────────────────────────────────────────────────────────────
const validateAddResource = [
  param('id').isMongoId().withMessage('Invalid formation ID'),
  body('name').trim().notEmpty().withMessage('Resource name is required'),
  body('type').optional().isIn(['document', 'video', 'equipment', 'software', 'other']).withMessage('Invalid resource type'),
  body('url').optional({ nullable: true }).isURL().withMessage('Invalid URL'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be positive'),
  handleValidationErrors,
];

const validateUpdateResource = [
  param('id').isMongoId().withMessage('Invalid formation ID'),
  param('resourceId').isMongoId().withMessage('Invalid resource ID'),
  body('name').optional().trim().notEmpty(),
  body('type').optional().isIn(['document', 'video', 'equipment', 'software', 'other']),
  body('url').optional({ nullable: true }).isURL().withMessage('Invalid URL'),
  body('quantity').optional().isInt({ min: 1 }),
  handleValidationErrors,
];

const validateResourceId = [
  param('id').isMongoId().withMessage('Invalid formation ID'),
  param('resourceId').isMongoId().withMessage('Invalid resource ID'),
  handleValidationErrors,
];

// ── List query params ─────────────────────────────────────────────────────────
const validateListFormations = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['Active', 'Archived', 'Draft']),
  query('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced']),
  query('category').optional().isIn(['technical', 'soft-skills', 'management', 'security', 'other']),
  query('sortBy').optional().isIn(['createdAt', 'title', 'level']),
  query('order').optional().isIn(['asc', 'desc']),
  handleValidationErrors,
];

const validateMongoId = [
  param('id').isMongoId().withMessage('Invalid formation ID'),
  handleValidationErrors,
];

module.exports = {
  validateCreateFormation,
  validateUpdateFormation,
  validateEnroll,
  validateUnenroll,
  validateAddSession,
  validateUpdateSession,
  validateSessionId,
  validateAddResource,
  validateUpdateResource,
  validateResourceId,
  validateListFormations,
  validateMongoId,
};
