/**
 * @file middleware/roleMiddleware.js
 * @description Role-Based Access Control (RBAC) middleware.
 *              Must always be used AFTER the `protect` middleware.
 */
const { sendError } = require('../utils/apiResponse');
const { ROLES }     = require('../models/User');

/**
 * Authorize access based on one or more roles.
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return sendError(res, 401, 'Authentification requise. Veuillez vous connecter.');
  }
  if (!roles.includes(req.user.role)) {
    return sendError(
      res, 403,
      `Accès refusé. Rôle(s) requis : ${roles.join(', ')}. Votre rôle : ${req.user.role}`
    );
  }
  next();
};

const adminOnly          = authorize(ROLES.ADMIN);
const organizerAndAdmin  = authorize(ROLES.ADMIN, ROLES.ORGANIZER);
const allRoles           = authorize(ROLES.ADMIN, ROLES.ORGANIZER, ROLES.PARTICIPANT);

/**
 * Own resource or admin — compares req.user._id with req.params[paramName]
 */
const selfOrAdmin = (paramName = 'id') => (req, res, next) => {
  if (!req.user) return sendError(res, 401, 'Authentification requise.');
  const targetId = req.params[paramName];
  const isOwner  = req.user._id.toString() === targetId;
  const isAdmin  = req.user.role === ROLES.ADMIN;
  if (!isOwner && !isAdmin) {
    return sendError(res, 403, 'Accès refusé. Vous ne pouvez accéder qu\'à vos propres ressources.');
  }
  next();
};

module.exports = { authorize, adminOnly, organizerAndAdmin, allRoles, selfOrAdmin };
