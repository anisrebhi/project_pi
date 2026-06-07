const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      statusCode: 422,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};


const validateCreateEvent = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Location cannot exceed 300 characters'),

  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Start date must be a valid ISO 8601 date'),

  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('End date must be a valid ISO 8601 date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('category')
    .optional()
    .isIn(['conference', 'workshop', 'meeting', 'sport', 'other'])
    .withMessage('Category must be one of: conference, workshop, meeting, sport, other'),

  body('capacity')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),

  handleValidationErrors,
];


const validateUpdateEvent = [
  param('id')
    .isMongoId().withMessage('Invalid event ID'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Location cannot exceed 300 characters'),

  body('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid ISO 8601 date'),

  body('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid ISO 8601 date')
    .custom((endDate, { req }) => {
      if (req.body.startDate && new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('category')
    .optional()
    .isIn(['conference', 'workshop', 'meeting', 'sport', 'other'])
    .withMessage('Category must be one of: conference, workshop, meeting, sport, other'),

  body('capacity')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),

  handleValidationErrors,
];


const validateMongoId = [
  param('id').isMongoId().withMessage('Invalid event ID'),
  handleValidationErrors,
];


const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('category')
    .optional()
    .isIn(['conference', 'workshop', 'meeting', 'sport', 'other'])
    .withMessage('Invalid category filter'),

  query('sortBy')
    .optional()
    .isIn(['startDate', 'endDate', 'createdAt', 'title'])
    .withMessage('sortBy must be one of: startDate, endDate, createdAt, title'),

  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('order must be "asc" or "desc"'),

  handleValidationErrors,
];

// Used by GET /api/reclamations — correct field names: categorie, priorite, statut
const validateQueryReclamations = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('categorie')
    .optional()
    .isIn(['technique', 'administratif', 'pedagogique', 'infrastructure', 'autre'])
    .withMessage('Invalid categorie filter'),

  query('priorite')
    .optional()
    .isIn(['faible', 'moyenne', 'haute', 'urgente'])
    .withMessage('Invalid priorite filter'),

  query('statut')
    .optional()
    .isIn(['en_attente', 'en_cours', 'resolue', 'rejetee'])
    .withMessage('Invalid statut filter'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'priorite', 'statut', 'sujet'])
    .withMessage('sortBy must be one of: createdAt, updatedAt, priorite, statut, sujet'),

  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('order must be "asc" or "desc"'),

  handleValidationErrors,
];

// ─── Reclamation Validators ───────────────────────────────────────────────────

const validateCreateReclamation = [
  body('sujet')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isLength({ min: 5 }).withMessage('Subject must be at least 5 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),

  body('categorie')
    .optional()
    .isIn(['technique', 'administratif', 'pedagogique', 'infrastructure', 'autre'])
    .withMessage('Category must be one of: technique, administratif, pedagogique, infrastructure, autre'),

  body('priorite')
    .optional()
    .isIn(['faible', 'moyenne', 'haute', 'urgente'])
    .withMessage('Priority must be one of: faible, moyenne, haute, urgente'),

  body('soumisePar')
    .trim()
    .notEmpty().withMessage('Submitter information is required'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),

  body('piecesJointes')
    .optional()
    .isArray().withMessage('piecesJointes must be an array'),

  handleValidationErrors,
];

const validateUpdateReclamation = [
  param('id').isMongoId().withMessage('Invalid reclamation ID'),

  body('sujet')
    .optional()
    .trim()
    .isLength({ min: 5 }).withMessage('Subject must be at least 5 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),

  body('categorie')
    .optional()
    .isIn(['technique', 'administratif', 'pedagogique', 'infrastructure', 'autre'])
    .withMessage('Category must be one of: technique, administratif, pedagogique, infrastructure, autre'),

  body('priorite')
    .optional()
    .isIn(['faible', 'moyenne', 'haute', 'urgente'])
    .withMessage('Priority must be one of: faible, moyenne, haute, urgente'),

  body('piecesJointes')
    .optional()
    .isArray().withMessage('piecesJointes must be an array'),

  handleValidationErrors,
];

const validateUpdateStatut = [
  param('id').isMongoId().withMessage('Invalid reclamation ID'),

  body('statut')
    .notEmpty().withMessage('Status is required')
    .isIn(['en_attente', 'en_cours', 'resolue', 'rejetee'])
    .withMessage('Status must be one of: en_attente, en_cours, resolue, rejetee'),

  body('reponse')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Response cannot exceed 2000 characters'),

  handleValidationErrors,
];

module.exports = {
  validateCreateEvent,
  validateUpdateEvent,
  validateMongoId,
  validateQueryParams,
  validateQueryReclamations,
  validateCreateReclamation,
  validateUpdateReclamation,
  validateUpdateStatut,
};
