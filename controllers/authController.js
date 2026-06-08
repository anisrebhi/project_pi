/**
 * @file controllers/authController.js
 * @description Authentication controller — register (with email verification),
 *              login (with refresh token), token refresh, logout, verify email.
 */

const { User } = require("../models/User");
const {
  generateToken,
  generateRefreshToken,
  generateEmailVerifyToken,
} = require("../utils/generateToken");
const { sendVerificationEmail } = require("../services/emailService");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// ─── Cookie helper ────────────────────────────────────────────────────────────

const setRefreshCookie = (res, token, expiresAt) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    expires: expiresAt,
    path: "/api/auth/refresh",
  });
};

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * @desc    Register a new user — sends verification email
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { fullName, email, password, role, phone } = req.body;

    // 1. Check duplicate email
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

    // 2. Prevent self-assigning ADMIN
    const assignedRole = role === "ADMIN" ? "PARTICIPANT" : role || "PARTICIPANT";

    // 3. Generate email verification token
    const { token: verifyToken, expires: verifyExpires } = generateEmailVerifyToken();

    // 4. Create user (not yet verified)
    const user = await User.create({
      fullName,
      email,
      password,
      role: assignedRole,
      phone: phone || null,
      isEmailVerified: false,
      emailVerifyToken: verifyToken,
      emailVerifyExpires: verifyExpires,
    });

    // 5. Send verification email (non-blocking — registration still succeeds)
    try {
      await sendVerificationEmail(user, verifyToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError.message);
    }

    return sendSuccess(res, 201, "Registration successful. Please check your email to verify your account.", {
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ─── Verify Email ─────────────────────────────────────────────────────────────

/**
 * @desc    Verify email address via token link
 * @route   GET /api/auth/verify-email?token=xxx
 * @access  Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return sendError(res, 400, "Verification token is required.");
    }

    // Find user with matching, non-expired token
    const user = await User.findOne({
      emailVerifyToken: token,
      emailVerifyExpires: { $gt: Date.now() },
    }).select("+emailVerifyToken +emailVerifyExpires");

    if (!user) {
      return sendError(res, 400, "Verification link is invalid or has expired. Please request a new one.");
    }

    // Activate account
    user.isEmailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    return sendSuccess(res, 200, "Email verified successfully! You can now log in.", {
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ─── Resend Verification Email ────────────────────────────────────────────────

/**
 * @desc    Resend email verification link
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 400, "Email is required.");

    const user = await User.findOne({ email })
      .select("+emailVerifyToken +emailVerifyExpires");

    // Always return 200 to prevent user enumeration
    if (!user || user.isEmailVerified) {
      return sendSuccess(res, 200, "If your email exists and is unverified, a new link has been sent.");
    }

    const { token, expires } = generateEmailVerifyToken();
    user.emailVerifyToken = token;
    user.emailVerifyExpires = expires;
    await user.save();

    try {
      await sendVerificationEmail(user, token);
    } catch (emailError) {
      console.error("Failed to resend verification email:", emailError.message);
    }

    return sendSuccess(res, 200, "If your email exists and is unverified, a new link has been sent.");
  } catch (error) {
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * @desc    Authenticate user — returns access token + sets refresh token cookie
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user with password
    const user = await User.findByEmailWithPassword(email);

    if (!user) {
      return sendError(res, 401, "Invalid email or password.");
    }

    // 2. Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return sendError(res, 401, "Invalid email or password.");
    }

    // 3. Check account active
    if (!user.isActive) {
      return sendError(res, 403, "Your account has been deactivated. Please contact support.");
    }

    // 4. Require email verification
    if (!user.isEmailVerified) {
      return sendError(
        res,
        403,
        "Please verify your email before logging in. Check your inbox or request a new verification link."
      );
    }

    // 5. Generate access token (short-lived)
    const accessToken = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // 6. Generate refresh token (long-lived, stored in DB)
    const { token: refreshToken, expiresAt } = generateRefreshToken();

    // Keep max 5 refresh tokens (multi-device support)
    const userWithTokens = await User.findById(user._id).select("+refreshTokens");
    userWithTokens.refreshTokens = userWithTokens.refreshTokens || [];
    userWithTokens.refreshTokens.push({ token: refreshToken, expiresAt });

    if (userWithTokens.refreshTokens.length > 5) {
      userWithTokens.refreshTokens.shift(); // Remove oldest
    }
    await userWithTokens.save();

    // 7. Set httpOnly refresh token cookie
    setRefreshCookie(res, refreshToken, expiresAt);

    return sendSuccess(res, 200, "Login successful.", {
      accessToken,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ─── Refresh Access Token ─────────────────────────────────────────────────────

/**
 * @desc    Issue new access token using refresh token (rotation)
 * @route   POST /api/auth/refresh
 * @access  Public (cookie-based)
 */
const refreshAccessToken = async (req, res, next) => {
  try {
    const incomingToken = req.cookies?.refreshToken;

    if (!incomingToken) {
      return sendError(res, 401, "No refresh token provided. Please log in.");
    }

    // Find user that owns this refresh token
    const user = await User.findOne({
      "refreshTokens.token": incomingToken,
    }).select("+refreshTokens");

    if (!user) {
      // Token not in DB — possible token reuse attack
      res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
      return sendError(res, 403, "Refresh token is invalid or has been revoked.");
    }

    const stored = user.refreshTokens.find((rt) => rt.token === incomingToken);

    if (!stored || stored.expiresAt < new Date()) {
      // Remove expired token
      user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== incomingToken);
      await user.save();
      res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
      return sendError(res, 403, "Refresh token has expired. Please log in again.");
    }

    // ─── Rotation: invalidate old, issue new ─────────────────────
    user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== incomingToken);
    const { token: newRefresh, expiresAt } = generateRefreshToken();
    user.refreshTokens.push({ token: newRefresh, expiresAt });
    await user.save();

    const newAccessToken = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    setRefreshCookie(res, newRefresh, expiresAt);

    return sendSuccess(res, 200, "Access token refreshed.", {
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

/**
 * @desc    Revoke current refresh token and clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await User.updateOne(
        { "refreshTokens.token": token },
        { $pull: { refreshTokens: { token } } }
      );
    }

    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
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

    return sendSuccess(res, 200, "Profile retrieved successfully.", user.toSafeObject());
  } catch (error) {
    next(error);
  }
};

module.exports = { register, verifyEmail, resendVerification, login, refreshAccessToken, logout, getMe };
