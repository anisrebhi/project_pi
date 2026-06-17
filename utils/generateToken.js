/**
 * @file utils/generateToken.js
 * @description JWT access token + opaque refresh token utilities.
 *              v2: added generateRefreshToken for two-token auth flow.
 */

const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/**
 * Generate a short-lived JWT access token
 * @param {object} payload - { id, email, role }
 * @returns {string} signed JWT
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });
};

/**
 * Generate a cryptographically random opaque refresh token
 * @returns {string} 64-char hex string
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Verify a JWT and return the decoded payload
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Extract Bearer token from Authorization header
 * @param {string} authHeader
 * @returns {string|null}
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  extractTokenFromHeader,
};
