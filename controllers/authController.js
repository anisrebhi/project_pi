/**
 * @file controllers/authController.js
 * @description Authentication controller — handles registration, login, token refresh,
 *              email verification, password reset, and logout.
 *
 * Auth Flow (v2):
 *  1. Register  → sends verification email
 *  2. Verify    → marks isEmailVerified = true
 *  3. Login     → returns accessToken (15m) + refreshToken (30d)
 *  4. Refresh   → exchanges refreshToken for a new accessToken
 *  5. Logout    → revokes refreshToken server-side
 */

const crypto = require("crypto");
const { User } = require("../models/User");
const {
  generateToken,
  generateRefreshToken,
} = require("../utils/generateToken");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../utils/emailService");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the two-token auth response payload
 */
const buildAuthPayload = async (user) => {
  // Access token — short-lived JWT
  const accessToken = generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  // Refresh token — opaque, stored hashed in DB
  const rawRefreshToken = generateRefreshToken();
  user.setRefreshToken(rawRefreshToken);
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken: rawRefreshToken, user: user.toSafeObject() };
};

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * @desc    Register a new user and send verification email
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { fullName, email, password, role, phone } = req.body;

    // 1. Check duplicate email (include soft-deleted to prevent reuse)
    const existingUser = await User.findOne({ email }).setOptions({
      includeSoftDeleted: true,
    });
    if (existingUser) {
      return sendError(
        res,
        409,
        "An account with this email already exists. Please log in or use a different email."
      );
    }

    // 2. Prevent self-assigning ADMIN role
    const assignedRole = role === "ADMIN" ? "PARTICIPANT" : role || "PARTICIPANT";

    // 3. Create user
    const user = await User.create({
      fullName,
      email,
      password,
      role: assignedRole,
      phone: phone || null,
    });

    // 4. Generate email verification token and send email
    const rawVerifyToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    try {
      await sendVerificationEmail(user.email, user.fullName, rawVerifyToken);
    } catch (emailErr) {
      // Don't fail registration if email sending fails — just log
      console.error("Verification email failed:", emailErr.message);
    }

    return sendSuccess(
      res,
      201,
      "Registration successful! Please check your email to verify your account.",
      { user: user.toSafeObject() }
    );
  } catch (error) {
    next(error);
  }
};

// ─── Verify Email ─────────────────────────────────────────────────────────────

/**
 * @desc    Verify email using the token from the verification email
 * @route   GET /api/auth/verify-email?token=<rawToken>
 * @access  Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return sendError(res, 400, "Verification token is required.");
    }

    const user = await User.findByVerificationToken(token);
    if (!user) {
      return sendError(
        res,
        400,
        "Invalid or expired verification token. Please request a new verification email."
      );
    }

    if (user.isEmailVerified) {
      return sendSuccess(res, 200, "Email is already verified. You can log in.");
    }

    // Mark verified and clear the token
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });

    return sendSuccess(res, 200, "Email verified successfully! You can now log in.", {
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ─── Resend Verification Email ────────────────────────────────────────────────

/**
 * @desc    Resend the email verification link
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 400, "Email is required.");

    const user = await User.findOne({ email, isActive: true }).select(
      "+emailVerificationToken +emailVerificationExpiresAt"
    );

    // Always respond with the same message to prevent email enumeration
    const genericMsg =
      "If this email exists and is unverified, a new verification link has been sent.";

    if (!user || user.isEmailVerified) {
      return sendSuccess(res, 200, genericMsg);
    }

    const rawToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    try {
      await sendVerificationEmail(user.email, user.fullName, rawToken);
    } catch (emailErr) {
      console.error("Resend verification email failed:", emailErr.message);
    }

    return sendSuccess(res, 200, genericMsg);
  } catch (error) {
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * @desc    Authenticate user — returns accessToken + refreshToken
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmailWithPassword(email);

    if (!user) {
      return sendError(res, 401, "Invalid email or password.");
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return sendError(res, 401, "Invalid email or password.");
    }

    if (!user.isActive) {
      return sendError(
        res,
        403,
        "Your account has been deactivated. Please contact support."
      );
    }

    if (!user.isEmailVerified) {
      return sendError(
        res,
        403,
        "Please verify your email before logging in. Check your inbox or request a new verification email."
      );
    }

    const payload = await buildAuthPayload(user);

    return sendSuccess(res, 200, "Login successful.", payload);
  } catch (error) {
    next(error);
  }
};

// ─── Refresh Access Token ─────────────────────────────────────────────────────

/**
 * @desc    Exchange a valid refresh token for a new access token + new refresh token (rotation)
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 400, "Refresh token is required.");
    }

    // Hash the incoming token and look up user
    const hashed = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const user = await User.findOne({
      refreshToken: hashed,
      isActive: true,
    }).select("+refreshToken +refreshTokenExpiresAt");

    if (!user) {
      return sendError(res, 401, "Invalid refresh token. Please log in again.");
    }

    if (!user.verifyRefreshToken(refreshToken)) {
      // Token is expired — clear it
      user.refreshToken = null;
      user.refreshTokenExpiresAt = null;
      await user.save({ validateBeforeSave: false });
      return sendError(
        res,
        401,
        "Refresh token has expired. Please log in again."
      );
    }

    // Rotate: issue new tokens
    const payload = await buildAuthPayload(user);

    return sendSuccess(res, 200, "Token refreshed successfully.", payload);
  } catch (error) {
    next(error);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

/**
 * @desc    Logout — revoke refresh token server-side
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "+refreshToken +refreshTokenExpiresAt"
    );

    if (user) {
      user.refreshToken = null;
      user.refreshTokenExpiresAt = null;
      await user.save({ validateBeforeSave: false });
    }

    return sendSuccess(res, 200, "Logged out successfully.");
  } catch (error) {
    next(error);
  }
};

// ─── Get Me ───────────────────────────────────────────────────────────────────

/**
 * @desc    Get currently authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "events",
      select: "title date location capacity isActive",
    });

    if (!user) {
      return sendError(res, 404, "User not found.");
    }

    return sendSuccess(
      res,
      200,
      "Profile retrieved successfully.",
      user.toSafeObject()
    );
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

/**
 * @desc    Send a password reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 400, "Email is required.");

    const genericMsg =
      "If this email exists, a password reset link has been sent.";

    const user = await User.findOne({ email, isActive: true }).select(
      "+passwordResetToken +passwordResetExpiresAt"
    );

    if (!user) {
      return sendSuccess(res, 200, genericMsg);
    }

    const rawToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetEmail(user.email, user.fullName, rawToken);
    } catch (emailErr) {
      user.passwordResetToken = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save({ validateBeforeSave: false });
      return sendError(res, 500, "Failed to send reset email. Please try again.");
    }

    return sendSuccess(res, 200, genericMsg);
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────

/**
 * @desc    Reset password using the token from the reset email
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return sendError(res, 400, "Token and new password are required.");
    }

    const user = await User.findByPasswordResetToken(token);
    if (!user) {
      return sendError(
        res,
        400,
        "Invalid or expired password reset token. Please request a new one."
      );
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();

    return sendSuccess(
      res,
      200,
      "Password reset successfully. You can now log in with your new password."
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  refreshAccessToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
};
