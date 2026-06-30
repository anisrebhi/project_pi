const sendSuccess = (res, statusCode, message, data = null, pagination = null) => {
  const response = { success: true, statusCode, message };
  if (data !== null) response.data = data;
  if (pagination !== null) response.pagination = pagination;
  return res.status(statusCode).json(response);
};

const sendError = (res, statusCode, message, errors = null) => {
  const response = { success: false, statusCode, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

const buildPagination = (total, page, limit) => {
  const p = parseInt(page);
  const l = parseInt(limit);
  const totalPages = Math.ceil(total / l);
  return { total, totalPages, currentPage: p, limit: l, hasNextPage: p < totalPages, hasPrevPage: p > 1 };
};

module.exports = { sendSuccess, sendError, buildPagination };
