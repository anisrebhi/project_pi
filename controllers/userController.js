/**
 * @file controllers/userController.js
 * @description User management controller — CRUD operations, pagination,
 *              full-text search, soft delete, and profile image upload.
 */

const { User, ROLES } = require("../models/User");
const Event = require("../models/Event");
const { sendSuccess, sendError, buildPagination } = require("../utils/apiResponse");
const { deleteFile } = require("../utils/multerConfig");

// ─── List Users ───────────────────────────────────────────────────────────────

/**
 * @desc    Get all users with pagination and search
 * @route   GET /api/users
 * @access  Private — ADMIN only
 * @query   page, limit, search, role
 */
const getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ─── Build filter ────────────────────────────────────────────
    const filter = {};

    // Full-text search on fullName and email
    if (search.trim()) {
      filter.$or = [
        { fullName: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Filter by role
    if (role && Object.values(ROLES).includes(role.toUpperCase())) {
      filter.role = role.toUpperCase();
    }

    // ─── Build sort ──────────────────────────────────────────────
    const allowedSortFields = ["fullName", "email", "role", "createdAt", "updatedAt"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    // ─── Execute queries in parallel ─────────────────────────────
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate({ path: "events", select: "title date location" }),
      User.countDocuments(filter),
    ]);

    const pagination = buildPagination(total, page, limit);

    return sendSuccess(res, 200, "Users retrieved successfully.", users, pagination);
  } catch (error) {
    next(error);
  }
};

// ─── Get Single User ──────────────────────────────────────────────────────────

/**
 * @desc    Get user by ID with their events
 * @route   GET /api/users/:id
 * @access  Private — ADMIN or self
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate({
        path: "events",
        select: "title description location date capacity organizer isActive",
        populate: { path: "organizer", select: "fullName email" },
      });

    if (!user) {
      return sendError(res, 404, `User with ID "${req.params.id}" not found.`);
    }

    return sendSuccess(res, 200, "User retrieved successfully.", user);
  } catch (error) {
    next(error);
  }
};

// ─── Create User (Admin) ──────────────────────────────────────────────────────

/**
 * @desc    Create a new user (Admin operation — can assign any role)
 * @route   POST /api/users
 * @access  Private — ADMIN only
 */
const createUser = async (req, res, next) => {
  try {
    const { fullName, email, password, role, phone } = req.body;

    // Check for existing email
    const existing = await User.findOne({ email }).setOptions({
      includeSoftDeleted: true,
    });
    if (existing) {
      return sendError(res, 409, `Email "${email}" is already registered.`);
    }

    const user = await User.create({ fullName, email, password, role, phone });

    return sendSuccess(res, 201, "User created successfully.", user.toSafeObject());
  } catch (error) {
    next(error);
  }
};

// ─── Update User ──────────────────────────────────────────────────────────────

/**
 * @desc    Update user by ID
 * @route   PUT /api/users/:id
 * @access  Private — ADMIN (all fields) or self (restricted fields)
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === ROLES.ADMIN;
    const isSelf = req.user._id.toString() === id;

    // Find current user
    const user = await User.findById(id).select("+password");
    if (!user) {
      return sendError(res, 404, `User with ID "${id}" not found.`);
    }

    // Fields a regular user can update on their own profile
    const selfAllowedFields = ["fullName", "phone", "password"];
    // Fields only ADMIN can update
    const adminOnlyFields = ["role", "email", "isActive"];

    // Build update object based on permission
    const updates = {};

    for (const [key, value] of Object.entries(req.body)) {
      if (value === undefined || value === null) continue;

      if (adminOnlyFields.includes(key) && !isAdmin) {
        // Silently skip unauthorized field updates for non-admins
        continue;
      }

      if (selfAllowedFields.includes(key) || isAdmin) {
        updates[key] = value;
      }
    }

    // Handle email uniqueness if being changed
    if (updates.email && updates.email !== user.email) {
      const emailTaken = await User.findOne({ email: updates.email, _id: { $ne: id } });
      if (emailTaken) {
        return sendError(res, 409, `Email "${updates.email}" is already in use.`);
      }
    }

    // Handle profile image upload
    if (req.file) {
      // Delete old image if exists
      if (user.profileImage) {
        deleteFile(user.profileImage);
      }
      updates.profileImage = req.file.path;
    }

    // Apply updates — triggers pre-save hooks (e.g. password hashing)
    Object.assign(user, updates);
    await user.save();

    return sendSuccess(res, 200, "User updated successfully.", user.toSafeObject());
  } catch (error) {
    next(error);
  }
};

// ─── Delete User (Soft Delete) ────────────────────────────────────────────────

/**
 * @desc    Soft-delete a user by ID (sets isActive = false, deletedAt = now)
 * @route   DELETE /api/users/:id
 * @access  Private — ADMIN only
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user._id.toString() === id) {
      return sendError(res, 400, "You cannot delete your own account.");
    }

    const user = await User.findById(id);
    if (!user) {
      return sendError(res, 404, `User with ID "${id}" not found.`);
    }

    // Soft delete via instance method
    await user.softDelete();

    // Remove user from all events they were registered in
    await Event.updateMany(
      { participants: id },
      { $pull: { participants: id } }
    );

    return sendSuccess(res, 200, "User deleted successfully.", {
      id,
      deletedAt: user.deletedAt,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get User Events ──────────────────────────────────────────────────────────

/**
 * @desc    Get all events a user is registered for
 * @route   GET /api/users/:userId/events
 * @access  Private — ADMIN or self
 */
const getUserEvents = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const user = await User.findById(userId).select("fullName email events");
    if (!user) {
      return sendError(res, 404, `User with ID "${userId}" not found.`);
    }

    // Paginate the events sub-array via Event collection
    const [events, total] = await Promise.all([
      Event.find({ _id: { $in: user.events } })
        .populate({ path: "organizer", select: "fullName email profileImage" })
        .sort({ date: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Event.countDocuments({ _id: { $in: user.events } }),
    ]);

    const pagination = buildPagination(total, page, limit);

    return sendSuccess(
      res,
      200,
      `Events for user "${user.fullName}" retrieved successfully.`,
      { user: { _id: user._id, fullName: user.fullName, email: user.email }, events },
      pagination
    );
  } catch (error) {
    next(error);
  }
};

// ─── Upload Profile Image ─────────────────────────────────────────────────────

/**
 * @desc    Upload or update profile image for a user
 * @route   PUT /api/users/:id/profile-image
 * @access  Private — ADMIN or self
 */
const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 400, "No image file provided.");
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      // Clean up uploaded file if user not found
      deleteFile(req.file.path);
      return sendError(res, 404, `User with ID "${req.params.id}" not found.`);
    }

    // Delete previous profile image
    if (user.profileImage) {
      deleteFile(user.profileImage);
    }

    user.profileImage = req.file.path;
    await user.save();

    return sendSuccess(res, 200, "Profile image updated successfully.", {
      profileImage: user.profileImage,
    });
  } catch (error) {
    // Clean up on error
    if (req.file) deleteFile(req.file.path);
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserEvents,
  uploadProfileImage,
};
