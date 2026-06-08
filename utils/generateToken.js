/**
 * @file utils/generateToken.js
 * @description JWT token generation and verification utilities.
 *              Added: short-lived access token, refresh token, QR code token.
 */

const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// ─── Access Token (15 min) ────────────────────────────────────────────────────

/**
 * Generate a short-lived access token (15 min by default)
 * @param {Object} payload - { id, email, role }
 * @returns {string} Signed JWT
 */
const generateToken = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    issuer: "event-management-api",
    audience: "event-management-client",
  });
};

/**
 * Verify and decode an access token
 * @param {string} token
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: "event-management-api",
    audience: "event-management-client",
  });
};

/**
 * Extract token from Authorization: Bearer <token> header
 * @param {string} authHeader
 * @returns {string|null}
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1];
};

// ─── Refresh Token (opaque, stored in DB) ────────────────────────────────────

/**
 * Generate a secure opaque refresh token
 * @returns {{ token: string, expiresAt: Date }}
 */
const generateRefreshToken = () => {
  const token = crypto.randomBytes(40).toString("hex");
  const days = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 7;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return { token, expiresAt };
};

// ─── Email Verification Token (24h, random hex) ───────────────────────────────

/**
 * Generate a random email verification token (24h expiry)
 * @returns {{ token: string, expires: Date }}
 */
const generateEmailVerifyToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return { token, expires };
};

// ─── QR Code Token (signed JWT, 30 days, single-use enforced in DB) ──────────

/**
 * Generate a signed JWT for event access QR code
 * @param {string} userId
 * @param {string} eventId
 * @returns {string} Signed JWT
 */
const generateQRToken = (userId, eventId) => {
  if (!process.env.QR_SECRET) {
    throw new Error("QR_SECRET environment variable is not set");
  }
  return jwt.sign(
    { userId, eventId, type: "qr_access" },
    process.env.QR_SECRET,
    { expiresIn: "30d" }
  );
};

/**
 * Verify a QR code JWT
 * @param {string} token
 * @returns {Object} Decoded payload
 */
const verifyQRToken = (token) => {
  return jwt.verify(token, process.env.QR_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  generateRefreshToken,
  generateEmailVerifyToken,
  generateQRToken,
  verifyQRToken,
};
