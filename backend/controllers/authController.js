/**
 * @file controllers/authController.js
 * @description Authentication controller — handles user registration and login.
 *              Uses bcrypt for password hashing and JWT for token generation.
 */

const { User } = require("../models/User");
const { generateToken } = require("../utils/generateToken");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { AppError } = require("../middleware/errorMiddleware");

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { fullName, email, password, role, phone } = req.body;

    // 1. Check if email already exists (including soft-deleted)
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

    // 2. Prevent self-assigning ADMIN role via public registration
    //    Only an existing ADMIN can create another ADMIN
    const assignedRole = role === "ADMIN" ? "PARTICIPANT" : role || "PARTICIPANT";

    // 3. Create user — password is hashed by the pre-save middleware
    const user = await User.create({
      fullName,
      email,
      password,
      role: assignedRole,
      phone: phone || null,
    });

    // 4. Generate JWT token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // 5. Respond with user data (no password)
    return sendSuccess(res, 201, "Registration successful. Welcome!", {
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * @desc    Authenticate user and return JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email — explicitly include password (select: false by default)
    const user = await User.findByEmailWithPassword(email);

    if (!user) {
      // Use generic message to prevent user enumeration attacks
      return sendError(res, 401, "Invalid email or password.");
    }

    // 2. Compare provided password with stored hash
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return sendError(res, 401, "Invalid email or password.");
    }

    // 3. Check account is active
    if (!user.isActive) {
      return sendError(
        res,
        403,
        "Your account has been deactivated. Please contact support."
      );
    }

    // 4. Generate JWT
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // 5. Return token and safe user data
    return sendSuccess(res, 200, "Login successful.", {
      token,
      user: user.toSafeObject(),
    });
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
    // req.user is populated by the protect middleware
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

module.exports = { register, login, getMe };
