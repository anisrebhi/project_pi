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

// ─── Event base rules (create vs update) ─────────────────────────────────────
const eventCreateRules = () => [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),

  body('description').optional().trim()
    .isLength({ max: 2000 }).withMessage('Description max 2000 chars'),

  body('startDate').notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('startDate must be a valid ISO 8601 date'),

  body('endDate').notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('endDate must be a valid ISO 8601 date')
    .custom((val, { req }) => {
      if (req.body.startDate && new Date(val) <= new Date(req.body.startDate))
        throw new Error('End date must be after start date');
      return true;
    }),

  body('category').optional()
    .isIn(['conference', 'workshop', 'meeting', 'sport', 'other'])
    .withMessage('Category must be: conference, workshop, meeting, sport or other'),

  body('capacity').optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),

  body('type').optional()
    .isIn(['free', 'paid']).withMessage('Type must be "free" or "paid"'),

  body('price').optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Price must be >= 0')
    .custom((val, { req }) => {
      if (req.body.type === 'paid' && (!val || val <= 0))
        throw new Error('Paid events must have a price greater than 0');
      return true;
    }),

  body('location.address').optional().trim()
    .isLength({ max: 300 }).withMessage('Address max 300 chars'),
  body('location.latitude').optional({ nullable: true })
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('location.longitude').optional({ nullable: true })
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),

  body('images').optional().isArray().withMessage('images must be an array'),
  body('images.*.url').optional().isURL().withMessage('Each image must have a valid URL'),
];

const eventUpdateRules = () => [
  body('title').optional().trim()
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),

  body('description').optional().trim()
    .isLength({ max: 2000 }).withMessage('Description max 2000 chars'),

  body('startDate').optional()
    .isISO8601().withMessage('startDate must be a valid ISO 8601 date'),

  body('endDate').optional()
    .isISO8601().withMessage('endDate must be a valid ISO 8601 date')
    .custom((val, { req }) => {
      if (req.body.startDate && new Date(val) <= new Date(req.body.startDate))
        throw new Error('End date must be after start date');
      return true;
    }),

  body('category').optional()
    .isIn(['conference', 'workshop', 'meeting', 'sport', 'other'])
    .withMessage('Category must be: conference, workshop, meeting, sport or other'),

  body('capacity').optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),

  body('type').optional()
    .isIn(['free', 'paid']).withMessage('Type must be "free" or "paid"'),

  body('price').optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Price must be >= 0')
    .custom((val, { req }) => {
      if (req.body.type === 'paid' && (!val || val <= 0))
        throw new Error('Paid events must have a price greater than 0');
      return true;
    }),

  body('location.address').optional().trim()
    .isLength({ max: 300 }).withMessage('Address max 300 chars'),
  body('location.latitude').optional({ nullable: true })
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude between -90 and 90'),
  body('location.longitude').optional({ nullable: true })
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude between -180 and 180'),

  body('images').optional().isArray().withMessage('images must be an array'),
  body('images.*.url').optional().isURL().withMessage('Each image must have a valid URL'),
];

// ─── Exported validator chains ────────────────────────────────────────────────
const validateCreateEvent  = [...eventCreateRules(), handleValidationErrors];
const validateUpdateEvent  = [
  param('id').isMongoId().withMessage('Invalid event ID'),
  ...eventUpdateRules(),
  handleValidationErrors,
];

// ─── User ─────────────────────────────────────────────────────────────────────
const validateCreateUser = [
  body('firstName').trim().notEmpty().withMessage('First name is required')
    .isLength({ min: 2 }).withMessage('First name min 2 chars'),
  body('lastName').trim().notEmpty().withMessage('Last name is required')
    .isLength({ min: 2 }).withMessage('Last name min 2 chars'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('phone').optional().trim(),
  handleValidationErrors,
];

// ─── Reservation ──────────────────────────────────────────────────────────────
const validateCreateReservation = [
  body('userId').notEmpty().withMessage('userId is required')
    .isMongoId().withMessage('Invalid userId'),
  body('eventId').notEmpty().withMessage('eventId is required')
    .isMongoId().withMessage('Invalid eventId'),
  body('numberOfTickets').notEmpty().withMessage('numberOfTickets is required')
    .isInt({ min: 1, max: 20 }).withMessage('numberOfTickets must be between 1 and 20'),
  handleValidationErrors,
];

const validateCancelReservation = [
  param('id').isMongoId().withMessage('Invalid reservation ID'),
  body('cancellationReason').optional().trim()
    .isLength({ max: 500 }).withMessage('Reason max 500 chars'),
  handleValidationErrors,
];

// ─── Shared ───────────────────────────────────────────────────────────────────
const validateMongoId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors,
];

const validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit between 1 and 100'),
  query('category').optional()
    .isIn(['conference', 'workshop', 'meeting', 'sport', 'other'])
    .withMessage('Invalid category'),
  query('type').optional().isIn(['free', 'paid']).withMessage('type must be "free" or "paid"'),
  query('sortBy').optional()
    .isIn(['startDate', 'endDate', 'createdAt', 'title', 'price'])
    .withMessage('sortBy: startDate, endDate, createdAt, title or price'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('order must be asc or desc'),
  handleValidationErrors,
];

module.exports = {
  validateCreateEvent,
  validateUpdateEvent,
  validateCreateUser,
  validateCreateReservation,
  validateCancelReservation,
  validateMongoId,
  validateQueryParams,
};
