/**
 * @file middlewares/roleMiddleware.js
 * @description Role-Based Access Control (RBAC) middleware
 *              Restricts routes to users with specific roles.
 *              Must be used AFTER the `protect` middleware.
 */

const { sendError } = require("../utils/apiResponse");
const { ROLES } = require("../models/User");

/**
 * Authorize access based on one or more roles
 *
 * @param {...string} roles - Allowed roles (e.g. 'ADMIN', 'ORGANIZER')
 * @returns {Function} Express middleware
 *
 * @example
 * // Only ADMINs can access
 * router.delete("/users/:id", protect, authorize("ADMIN"), deleteUser);
 *
 * @example
 * // ADMINs and ORGANIZERs can access
 * router.post("/events", protect, authorize("ADMIN", "ORGANIZER"), createEvent);
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(
        res,
        401,
        "Authentication required. Please log in first."
      );
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access forbidden. Required role(s): ${roles.join(", ")}. Your role: ${req.user.role}`
      );
    }

    next();
  };
};

/**
 * Allow access only to ADMIN role
 */
const adminOnly = authorize(ROLES.ADMIN);

/**
 * Allow access to ADMIN and ORGANIZER roles
 */
const organizerAndAdmin = authorize(ROLES.ADMIN, ROLES.ORGANIZER);

/**
 * Allow access to all authenticated users
 * (Same as just using `protect`, but explicit for clarity)
 */
const allRoles = authorize(ROLES.ADMIN, ROLES.ORGANIZER, ROLES.PARTICIPANT);

/**
 * Allow access only if user is accessing their own resource OR is ADMIN
 * Compares req.user._id with req.params.userId or req.params.id
 *
 * @param {string} [paramName="id"] - URL parameter name holding the target user ID
 */
const selfOrAdmin = (paramName = "id") => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Authentication required.");
    }

    const targetId = req.params[paramName];
    const isOwner = req.user._id.toString() === targetId;
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return sendError(
        res,
        403,
        "Access forbidden. You can only access your own resources."
      );
    }

    next();
  };
};

module.exports = { authorize, adminOnly, organizerAndAdmin, allRoles, selfOrAdmin };
