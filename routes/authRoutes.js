/**
 * @file routes/authRoutes.js
 * @description Authentication routes — register, verify email, login,
 *              refresh token, logout, forgot/reset password, get current user.
 */

const express = require("express");
const router = express.Router();

const {
  register,
  verifyEmail,
  resendVerification,
  login,
  refreshAccessToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateResendVerification,
} = require("../middleware/validationMiddleware");

// ─── Public Routes ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates account and sends a verification email. ADMIN role cannot be self-assigned.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Registered — verification email sent
 *       409:
 *         description: Email already exists
 *       422:
 *         description: Validation error
 */
router.post("/register", validateRegister, register);

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     tags: [Auth]
 *     summary: Verify email address
 *     description: Validates the token sent in the verification email.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Email verified
 *       400:
 *         description: Invalid or expired token
 */
router.get("/verify-email", verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Resend the email verification link
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Link sent (generic response to prevent enumeration)
 */
router.post("/resend-verification", validateResendVerification, resendVerification);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login — returns accessToken + refreshToken
 *     description: |
 *       Returns a short-lived JWT accessToken (15 min) and a long-lived
 *       opaque refreshToken (30 days). Store the refreshToken securely
 *       (HttpOnly cookie or secure storage) and use it to get new access tokens.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email not verified or account deactivated
 *       422:
 *         description: Validation error
 */
router.post("/login", validateLogin, login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: |
 *       Exchanges a valid refreshToken for a new accessToken and a new
 *       refreshToken (token rotation — old token is immediately invalidated).
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: New tokens issued
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", refreshAccessToken);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset email
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset email sent (generic — prevents enumeration)
 */
router.post("/forgot-password", validateForgotPassword, forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using token from email
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post("/reset-password", validateResetPassword, resetPassword);

// ─── Protected Routes ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get currently authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 *       401:
 *         description: Unauthorized
 */
router.get("/me", protect, getMe);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout — revoke refresh token server-side
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", protect, logout);

module.exports = router;
