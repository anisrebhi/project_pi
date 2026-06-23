/**
 * @file middlewares/validationMiddleware.js
 */
const { body, param, query, validationResult } = require("express-validator");
const { ROLES } = require("../models/User");

// ─── Validation Runner ────────────────────────────────────────────────────────
const runValidation = (req, res, next) => {
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

// ─── Auth ─────────────────────────────────────────────────────────────────────
const validateRegister = [
  body("fullName").trim().notEmpty().withMessage("Full name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Full name must be 2–100 characters"),
  body("email").trim().notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/\d/).withMessage("Password must contain at least one number"),
  body("role").optional().isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(", ")}`),
  body("phone").optional().trim()
    .matches(/^\+?[\d\s\-()]{7,20}$/).withMessage("Please provide a valid phone number"),
  runValidation,
];

const validateLogin = [
  body("email").trim().notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  runValidation,
];

// ─── User ─────────────────────────────────────────────────────────────────────
const validateUpdateUser = [
  body("fullName").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Full name must be 2–100 characters"),
  body("email").optional().trim().isEmail().withMessage("Please provide a valid email address").normalizeEmail(),
  body("phone").optional().trim().matches(/^\+?[\d\s\-()]{7,20}$/).withMessage("Please provide a valid phone number"),
  body("role").optional().isIn(Object.values(ROLES)).withMessage(`Role must be one of: ${Object.values(ROLES).join(", ")}`),
  body("password").optional().isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/\d/).withMessage("Password must contain at least one number"),
  runValidation,
];

const validateCreateUser = [
  body("fullName").trim().notEmpty().withMessage("Full name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Full name must be 2–100 characters"),
  body("email").trim().notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  runValidation,
];

// ─── Event ────────────────────────────────────────────────────────────────────
const validateCreateEvent = [
  body("title").trim().notEmpty().withMessage("Title is required")
    .isLength({ min: 3, max: 150 }).withMessage("Title must be 3–150 characters"),
  body("description").optional().trim().isLength({ max: 2000 }).withMessage("Description must not exceed 2000 characters"),
  body("startDate").notEmpty().withMessage("Start date is required")
    .isISO8601().withMessage("startDate must be a valid ISO 8601 date")
    .custom((value) => new Date(value).getTime() > Date.now())
    .withMessage("startDate must be a future date. Creating an event with a past date is not allowed"),
  body("endDate").notEmpty().withMessage("End date is required")
    .isISO8601().withMessage("endDate must be a valid ISO 8601 date")
    .custom((value, { req }) => {
      if (!req.body.startDate) return true;
      return new Date(value) > new Date(req.body.startDate);
    })
    .withMessage("endDate must be a date strictly after startDate"),
  body("capacity").notEmpty().withMessage("Capacity is required")
    .isInt({ min: 1, max: 100000 }).withMessage("Capacity must be an integer between 1 and 100,000"),
  body("type").optional().isIn(["free", "paid"]).withMessage('Type must be "free" or "paid"'),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price cannot be negative"),
  body("maxTicketsPerUser").optional().isInt({ min: 1, max: 20 }).withMessage("maxTicketsPerUser must be between 1 and 20"),
  body("ticketTypes").optional().isArray().withMessage("ticketTypes must be an array"),
  body("ticketTypes.*.name").optional().isIn(["Standard", "VIP", "Premium", "Etudiant"]).withMessage("Invalid ticket type name"),
  body("ticketTypes.*.price").optional().isFloat({ min: 0 }).withMessage("Ticket type price cannot be negative"),
  body("ticketTypes.*.quantity").optional({ nullable: true }).isInt({ min: 0 }).withMessage("Ticket type quantity must be a non-negative integer"),
  body("ticketTypes.*.earlyBird.enabled").optional().isBoolean().withMessage("earlyBird.enabled must be a boolean"),
  body("ticketTypes.*.earlyBird.price").optional({ nullable: true }).isFloat({ min: 0 }).withMessage("earlyBird.price cannot be negative"),
  body("ticketTypes.*.earlyBird.deadline").optional({ nullable: true }).isISO8601().withMessage("earlyBird.deadline must be a valid date"),
  runValidation,
];

const validateUpdateEvent = [
  body("title").optional().trim().isLength({ min: 3, max: 150 }).withMessage("Title must be 3–150 characters"),
  body("description").optional().trim().isLength({ max: 2000 }).withMessage("Description must not exceed 2000 characters"),
  body("startDate").optional().isISO8601().withMessage("startDate must be a valid ISO 8601 date")
    .custom((value) => new Date(value).getTime() > Date.now())
    .withMessage("startDate must be a future date. An event cannot be rescheduled to a past date"),
  body("endDate").optional().isISO8601().withMessage("endDate must be a valid ISO 8601 date")
    .custom((value, { req }) => {
      if (!req.body.startDate) return true;
      return new Date(value) > new Date(req.body.startDate);
    })
    .withMessage("endDate must be a date strictly after startDate"),
  body("capacity").optional().isInt({ min: 1, max: 100000 }).withMessage("Capacity must be an integer between 1 and 100,000"),
  body("type").optional().isIn(["free", "paid"]).withMessage('Type must be "free" or "paid"'),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price cannot be negative"),
  body("maxTicketsPerUser").optional().isInt({ min: 1, max: 20 }).withMessage("maxTicketsPerUser must be between 1 and 20"),
  body("ticketTypes").optional().isArray().withMessage("ticketTypes must be an array"),
  body("ticketTypes.*.name").optional().isIn(["Standard", "VIP", "Premium", "Etudiant"]).withMessage("Invalid ticket type name"),
  body("ticketTypes.*.price").optional().isFloat({ min: 0 }).withMessage("Ticket type price cannot be negative"),
  body("ticketTypes.*.quantity").optional({ nullable: true }).isInt({ min: 0 }).withMessage("Ticket type quantity must be a non-negative integer"),
  body("ticketTypes.*.earlyBird.enabled").optional().isBoolean().withMessage("earlyBird.enabled must be a boolean"),
  body("ticketTypes.*.earlyBird.price").optional({ nullable: true }).isFloat({ min: 0 }).withMessage("earlyBird.price cannot be negative"),
  body("ticketTypes.*.earlyBird.deadline").optional({ nullable: true }).isISO8601().withMessage("earlyBird.deadline must be a valid date"),
  runValidation,
];

// ─── Reclamation ──────────────────────────────────────────────────────────────
const validateCreateReclamation = [
  body("sujet").trim().notEmpty().withMessage("Subject is required").isLength({ min: 5 }).withMessage("Subject must be at least 5 characters"),
  body("description").trim().notEmpty().withMessage("Description is required").isLength({ min: 10 }).withMessage("Description must be at least 10 characters"),
  body("categorie").optional().isIn(['technique','administratif','pedagogique','infrastructure','autre']).withMessage("Invalid category"),
  body("priorite").optional().isIn(['faible','moyenne','haute','urgente']).withMessage("Invalid priority"),
  body("soumisePar").trim().notEmpty().withMessage("Submitter name is required"),
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email"),
  runValidation,
];

const validateUpdateReclamation = [
  body("sujet").optional().trim().isLength({ min: 5 }).withMessage("Subject must be at least 5 characters"),
  body("description").optional().trim().isLength({ min: 10 }).withMessage("Description must be at least 10 characters"),
  body("categorie").optional().isIn(['technique','administratif','pedagogique','infrastructure','autre']).withMessage("Invalid category"),
  body("priorite").optional().isIn(['faible','moyenne','haute','urgente']).withMessage("Invalid priority"),
  runValidation,
];

const validateUpdateStatut = [
  body("statut").notEmpty().withMessage("Status is required")
    .isIn(['en_attente','en_cours','resolue','rejetee']).withMessage("Invalid status"),
  body("reponse").optional().trim(),
  runValidation,
];

// ─── Reservation ─────────────────────────────────────────────────────────────
const validateCreateReservation = [
  // userId is optional: regular users always book for themselves (req.user._id).
  // Only an ADMIN may supply a different userId to book on someone else's behalf.
  body("userId").optional().isMongoId().withMessage("userId must be a valid MongoDB ObjectId"),
  body("eventId").notEmpty().withMessage("eventId is required").isMongoId().withMessage("eventId must be a valid MongoDB ObjectId"),
  body("numberOfTickets").notEmpty().withMessage("numberOfTickets is required")
    .isInt({ min: 1, max: 20 }).withMessage("numberOfTickets must be between 1 and 20"),
  body("ticketType").optional({ nullable: true }).isIn(["Standard", "VIP", "Premium", "Etudiant"]).withMessage("Invalid ticket type"),
  body("promoCode").optional({ nullable: true }).trim().isLength({ min: 3, max: 30 }).withMessage("Invalid promo code"),
  runValidation,
];

const validateCancelReservation = [
  body("cancellationReason").optional().trim(),
  runValidation,
];

// ─── Waitlist ─────────────────────────────────────────────────────────────────
const validateJoinWaitlist = [
  body("eventId").notEmpty().withMessage("eventId is required").isMongoId().withMessage("eventId must be a valid MongoDB ObjectId"),
  body("numberOfTickets").optional().isInt({ min: 1, max: 20 }).withMessage("numberOfTickets must be between 1 and 20"),
  body("ticketType").optional({ nullable: true }).isIn(["Standard", "VIP", "Premium", "Etudiant"]).withMessage("Invalid ticket type"),
  runValidation,
];

// ─── Promo Code ───────────────────────────────────────────────────────────────
const validateCreatePromoCode = [
  body("code").trim().notEmpty().withMessage("Code is required")
    .isLength({ min: 3, max: 30 }).withMessage("Code must be 3–30 characters")
    .matches(/^[A-Za-z0-9_-]+$/).withMessage("Code may only contain letters, numbers, hyphens and underscores"),
  body("discountType").notEmpty().withMessage("discountType is required")
    .isIn(["percentage", "fixed"]).withMessage('discountType must be "percentage" or "fixed"'),
  body("discountValue").notEmpty().withMessage("discountValue is required")
    .isFloat({ min: 0 }).withMessage("discountValue cannot be negative")
    .custom((value, { req }) => req.body.discountType !== "percentage" || value <= 100)
    .withMessage("Percentage discount cannot exceed 100"),
  body("eventId").optional({ nullable: true }).isMongoId().withMessage("eventId must be a valid MongoDB ObjectId"),
  body("maxUses").optional({ nullable: true }).isInt({ min: 1 }).withMessage("maxUses must be a positive integer"),
  body("expiresAt").optional({ nullable: true }).isISO8601().withMessage("expiresAt must be a valid date"),
  runValidation,
];

const validateUpdatePromoCode = [
  body("discountType").optional().isIn(["percentage", "fixed"]).withMessage('discountType must be "percentage" or "fixed"'),
  body("discountValue").optional().isFloat({ min: 0 }).withMessage("discountValue cannot be negative"),
  body("maxUses").optional({ nullable: true }).isInt({ min: 1 }).withMessage("maxUses must be a positive integer"),
  body("expiresAt").optional({ nullable: true }).isISO8601().withMessage("expiresAt must be a valid date"),
  body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
  runValidation,
];

// ─── Params ───────────────────────────────────────────────────────────────────
const validateMongoId = (paramName = "id") => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}: must be a valid MongoDB ObjectId`),
  runValidation,
];

// ─── Query ────────────────────────────────────────────────────────────────────
const validatePagination = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  runValidation,
];

const validateQueryParams = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("sortBy").optional().isString(),
  query("order").optional().isIn(["asc", "desc"]).withMessage('order must be "asc" or "desc"'),
  runValidation,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateUser,
  validateCreateUser,
  validateCreateEvent,
  validateUpdateEvent,
  validateCreateReclamation,
  validateUpdateReclamation,
  validateUpdateStatut,
  validateCreateReservation,
  validateCancelReservation,
  validateCreatePromoCode,
  validateUpdatePromoCode,
  validateJoinWaitlist,
  validateMongoId,
  validatePagination,
  validateQueryParams,
  runValidation,
};
