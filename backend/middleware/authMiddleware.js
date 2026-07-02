/**
 * @file middlewares/authMiddleware.js
 * @description JWT authentication middleware — validates Bearer token and
 *              attaches the decoded user to req.user for downstream handlers.
 */

const { User } = require("../models/User");
const { verifyToken, extractTokenFromHeader } = require("../utils/generateToken");
const { sendError } = require("../utils/apiResponse");

/**
 * Protect routes — verifies JWT and loads the authenticated user
 *
 * Usage: router.get("/protected", protect, handler)
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return sendError(
        res,
        401,
        "Access denied. No token provided. Use: Authorization: Bearer <token>"
      );
    }

    // 2. Verify token integrity and expiration
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return sendError(res, 401, "Token has expired. Please log in again.");
      }
      if (err.name === "JsonWebTokenError") {
        return sendError(res, 401, "Invalid token. Authentication failed.");
      }
      throw err;
    }

    // 3. Verify the user still exists and is active
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return sendError(res, 401, "User no longer exists. Please register.");
    }

    if (!user.isActive) {
      return sendError(res, 401, "Your account has been deactivated. Contact support.");
    }

    // 4. Attach user to request for downstream use
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === "MongooseError" || (error.message && error.message.includes("buffering timed out"))) {
      return sendError(res, 503, "Service temporarily unavailable. Please try again.");
    }
    console.error("Auth middleware error:", error);
    return sendError(res, 500, "Authentication failed due to a server error.");
  }
};

/**
 * Optional auth — attaches user if token present, but doesn't block
 * Useful for routes that behave differently for authenticated users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.id).select("-password");
        if (user && user.isActive) {
          req.user = user;
        }
      } catch {
        // Token invalid — continue without user
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect, optionalAuth };
