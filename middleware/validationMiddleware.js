/**
 * @file middlewares/validationMiddleware.js
 * @description Input validation rules using express-validator.
 *              Each exported function is a validation chain for a specific route.
 */

const { body, param, query, validationResult } = require("express-validator");
const { ROLES } = require("../models/User");
const { sendError } = require("../utils/apiResponse");

// ─── Validation Runner ────────────────────────────────────────────────────────

/**
 * Run validation chain and return 422 if any errors exist
 * Include this as the last middleware in a validation chain
 */
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

// ─── Auth Validations ─────────────────────────────────────────────────────────

const validateRegister = [
  body("fullName")
    .trim()
    .notEmpty().withMessage("Full name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Full name must be 2–100 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/\d/).withMessage("Password must contain at least one number"),

  body("role")
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(", ")}`),

  body("phone")
    .optional()
    .trim()
    .matches(/^\+?[\d\s\-()]{7,20}$/)
    .withMessage("Please provide a valid phone number"),

  runValidation,
];

const validateLogin = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required"),

  runValidation,
];

// ─── User Validations ─────────────────────────────────────────────────────────

const validateUpdateUser = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage("Full name must be 2–100 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("phone")
    .optional()
    .trim()
    .matches(/^\+?[\d\s\-()]{7,20}$/)
    .withMessage("Please provide a valid phone number"),

  body("role")
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(", ")}`),

  body("password")
    .optional()
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/\d/).withMessage("Password must contain at least one number"),

  runValidation,
];

// ─── Event Validations ────────────────────────────────────────────────────────

const validateCreateEvent = [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ min: 3, max: 150 }).withMessage("Title must be 3–150 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Description must not exceed 2000 characters"),

  body("location")
    .trim()
    .notEmpty().withMessage("Location is required")
    .isLength({ max: 200 }).withMessage("Location must not exceed 200 characters"),

  body("date")
    .notEmpty().withMessage("Date is required")
    .isISO8601().withMessage("Date must be a valid ISO 8601 date (e.g. 2024-06-15T09:00:00Z)")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Event date must be in the future");
      }
      return true;
    }),

  body("capacity")
    .notEmpty().withMessage("Capacity is required")
    .isInt({ min: 1, max: 100000 })
    .withMessage("Capacity must be an integer between 1 and 100,000"),

  runValidation,
];

const validateUpdateEvent = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 }).withMessage("Title must be 3–150 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Description must not exceed 2000 characters"),

  body("location")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Location must not exceed 200 characters"),

  body("date")
    .optional()
    .isISO8601().withMessage("Date must be a valid ISO 8601 date"),

  body("capacity")
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage("Capacity must be an integer between 1 and 100,000"),

  runValidation,
];

// ─── Param Validations ────────────────────────────────────────────────────────

const validateMongoId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}: must be a valid MongoDB ObjectId`),
  runValidation,
];

// ─── Query Validations ────────────────────────────────────────────────────────

const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  runValidation,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateUser,
  validateCreateEvent,
  validateUpdateEvent,
  validateCreateUser,
  validateCreateReservation,
  validateCancelReservation,
  validateMongoId,
  validatePagination,
  runValidation,
};
