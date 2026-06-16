/**
 * @file middlewares/errorMiddleware.js
 * @description Centralized error handling middleware — catches all thrown errors,
 *              normalizes them, and returns a consistent JSON error response.
 */

const mongoose = require("mongoose");

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleCastError = (err) => {
  const message = `Invalid ${err.path}: "${err.value}". Must be a valid MongoDB ObjectId.`;
  return new AppError(message, 400);
};

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate value for field "${field}": "${value}". Please use a different value.`;
  return new AppError(message, 409);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation failed: ${errors.join(". ")}`;
  return new AppError(message, 422);
};

const handleJWTError = () => new AppError("Invalid token. Authentication failed.", 401);

const handleJWTExpiredError = () => new AppError("Token has expired. Please log in again.", 401);

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

const sendDevError = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    statusCode: err.statusCode,
    message: err.message,
    stack: err.stack,
  });
};

const sendProdError = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }
  console.error("UNHANDLED ERROR:", err);
  return res.status(500).json({
    success: false,
    message: "An unexpected error occurred. Please try again later.",
  });
};

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  if (process.env.NODE_ENV === "development") {
    console.error("Error:", { message: err.message, status: err.statusCode, stack: err.stack });
  }

  let error = { ...err, message: err.message };

  if (err instanceof mongoose.Error.CastError) error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err instanceof mongoose.Error.ValidationError) error = handleValidationError(err);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpiredError();
  if (err.name === "MulterError") error = handleMulterError(err);
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
