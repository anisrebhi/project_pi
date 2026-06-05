/**
 * @file middlewares/errorMiddleware.js
 * @description Centralized error handling middleware — catches all thrown errors,
 *              normalizes them, and returns a consistent JSON error response.
 *              Must be registered LAST in app.js (after all routes).
 */

const mongoose = require("mongoose");

// ─── Custom Application Error Class ──────────────────────────────────────────

class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code to return
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguish operational vs programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Error Type Handlers ──────────────────────────────────────────────────────

/**
 * Handle Mongoose CastError (invalid ObjectId)
 * e.g. GET /api/users/invalid-id
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: "${err.value}". Must be a valid MongoDB ObjectId.`;
  return new AppError(message, 400);
};

/**
 * Handle Mongoose duplicate key error (E11000)
 * e.g. duplicate email on registration
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate value for field "${field}": "${value}". Please use a different value.`;
  return new AppError(message, 409);
};

/**
 * Handle Mongoose ValidationError
 * e.g. missing required field, failed custom validator
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation failed: ${errors.join(". ")}`;
  return new AppError(message, 422);
};

/**
 * Handle JWT errors (covered by authMiddleware but kept as fallback)
 */
const handleJWTError = () =>
  new AppError("Invalid token. Authentication failed.", 401);

const handleJWTExpiredError = () =>
  new AppError("Token has expired. Please log in again.", 401);

/**
 * Handle Multer errors (file upload)
 */
const handleMulterError = (err) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    const maxMB = (parseInt(process.env.MAX_FILE_SIZE) || 5242880) / 1024 / 1024;
    return new AppError(`File too large. Maximum allowed size is ${maxMB}MB.`, 413);
  }
  if (err.code === "LIMIT_FILE_COUNT") {
    return new AppError("Too many files. Only one file is allowed.", 400);
  }
  return new AppError(err.message || "File upload error.", 400);



  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: "${field}"`;
  }

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),

  });
};

const sendProdError = (err, res) => {
  // Operational, trusted errors → send details to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Programming or unknown errors → don't leak details
  console.error("💥 UNHANDLED ERROR:", err);
  return res.status(500).json({
    success: false,
    message: "An unexpected error occurred. Please try again later.",
  });
};

// ─── 404 Not Found Handler ────────────────────────────────────────────────────

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// ─── Global Error Handler ─────────────────────────────────────────────────────

/**
 * Express global error middleware (4 params = error middleware)
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Log all errors in development
  if (process.env.NODE_ENV === "development") {
    console.error("❌ Error:", {
      message: err.message,
      status: err.statusCode,
      stack: err.stack,
    });
  }

  let error = { ...err, message: err.message };

  // Normalize known error types
  if (err instanceof mongoose.Error.CastError) error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err instanceof mongoose.Error.ValidationError) error = handleValidationError(err);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpiredError();
  if (err.name === "MulterError") error = handleMulterError(err);
  // Multer errors thrown as Error (not MulterError) — check message pattern
  if (err.message && err.message.includes("Invalid file type")) {
    error = new AppError(err.message, 400);
  }

  if (process.env.NODE_ENV === "development") {
    sendDevError(error, res);
  } else {
    sendProdError(error, res);
  }
};

module.exports = { AppError, notFoundHandler, globalErrorHandler };
