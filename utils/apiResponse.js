/**
 * @file utils/apiResponse.js
 * @description Standardized API response helpers for consistent JSON structure
 */

/**
 * Send a successful response
 *
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Human-readable success message
 * @param {*} data - Payload to return
 * @param {Object} [pagination] - Optional pagination metadata
 */
const sendSuccess = (res, statusCode, message, data = null, pagination = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) response.data = data;
  if (pagination !== null) response.pagination = pagination;

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 *
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Human-readable error message
 * @param {Array} [errors] - Optional array of validation errors
 */
const sendError = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors !== null) response.errors = errors;

  return res.status(statusCode).json(response);
};

/**
 * Build pagination metadata
 *
 * @param {number} total - Total documents count
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const buildPagination = (total, page, limit) => ({
  total,
  page: parseInt(page),
  limit: parseInt(limit),
  pages: Math.ceil(total / limit),
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: page > 1,
});

module.exports = { sendSuccess, sendError, buildPagination };
