/**
 * @file utils/generateToken.js
 * @description JWT token generation and verification utilities
 */

const jwt = require("jsonwebtoken");

/**
 * Generate a signed JWT token for a given user
 *
 * @param {Object} payload - Data to encode in the token
 * @param {string} payload.id - User's MongoDB ObjectId
 * @param {string} payload.role - User's role (ADMIN, ORGANIZER, PARTICIPANT)
 * @param {string} payload.email - User's email
 * @returns {string} Signed JWT token
 */
const generateToken = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    issuer: "event-management-api",
    audience: "event-management-client",
  });
};

/**
 * Verify and decode a JWT token
 *
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {JsonWebTokenError|TokenExpiredError} If token is invalid or expired
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: "event-management-api",
    audience: "event-management-client",
  });
};

/**
 * Extract token from Authorization header
 *
 * @param {string} authHeader - The Authorization header value
 * @returns {string|null} Extracted token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1];
};

module.exports = { generateToken, verifyToken, extractTokenFromHeader };
