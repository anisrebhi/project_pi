/**
 * @file middlewares/errorMiddleware.js
 */
const mongoose = require("mongoose");

// ─── Custom Application Error Class ──────────────────────────────────────────
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Error Type Handlers ──────────────────────────────────────────────────────
const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: "${err.value}". Must be a valid MongoDB ObjectId.`, 400);

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new AppError(`Duplicate value for field "${field}": "${value}". Please use a different value.`, 409);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Validation failed: ${errors.join(". ")}`, 422);
};

const handleJWTError = () =>
  new AppError("Invalid token. Authentication failed.", 401);

const handleJWTExpiredError = () =>
  new AppError("Token has expired. Please log in again.", 401);

const handleMulterError = (err) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    const maxMB = (parseInt(process.env.MAX_FILE_SIZE) || 5242880) / 1024 / 1024;
    return new AppError(`File too large. Maximum allowed size is ${maxMB}MB.`, 413);
  }
  if (err.code === "LIMIT_FILE_COUNT") {
    return new AppError("Too many files. Only one file is allowed.", 400);
  }
  return new AppError(err.message || "File upload error.", 400);
};

// ─── Dev / Prod error senders ─────────────────────────────────────────────────
const sendDevError = (err, res) => {
  return res.status(err.statusCode || 500).json({
    success: false,
    statusCode: err.statusCode || 500,
    message: err.message,
    stack: err.stack,
  });
};

const sendProdError = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  console.error("💥 UNHANDLED ERROR:", err);
  return res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
};

// ─── 404 Handler ─────────────────────────────────────────────────────────────
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// ─── Global Error Handler ─────────────────────────────────────────────────────
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message    = err.message    || "Internal Server Error";

  if (process.env.NODE_ENV === "development") {
    console.error("❌ Error:", { message: err.message, status: err.statusCode, stack: err.stack });
  }

  let error = { ...err, message: err.message };

  if (err instanceof mongoose.Error.CastError)        error = handleCastError(err);
  if (err.code === 11000)                              error = handleDuplicateKeyError(err);
  if (err instanceof mongoose.Error.ValidationError)  error = handleValidationError(err);
  if (err.name === "JsonWebTokenError")                error = handleJWTError();
  if (err.name === "TokenExpiredError")                error = handleJWTExpiredError();
  if (err.name === "MulterError")                      error = handleMulterError(err);
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
