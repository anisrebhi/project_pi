/**
 * @file controllers/userController.js
 * @description User management controller.
 *
 * v2 improvements:
 *  - getUserEvents: pagination fixed with proper MongoDB slice (no more Mongoose populate skip/limit bug)
 *  - changePassword: dedicated endpoint — verifies old password before updating
 */

const { User } = require("../models/User");
const path = require("path");
const fs   = require("fs");

const ok = (res, code, message, data = {}) =>
  res.status(code).json({ success: true, statusCode: code, message, ...data });

// ─── POST /api/users ──────────────────────────────────────────────────────────
const createUser = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, role } = req.body;
    const user = await User.create({ fullName, email, password, phone, role });
    return ok(res, 201, "User created successfully", { data: user.toSafeObject() });
  } catch (err) { next(err); }
};

// ─── GET /api/users ───────────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip  = (page - 1) * limit;

    const sortBy = ["createdAt", "fullName", "email", "role"].includes(req.query.sortBy)
      ? req.query.sortBy : "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;

    const filter = {};
    if (req.query.search) filter.$text = { $search: req.query.search };
    if (req.query.role)   filter.role  = req.query.role;

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate("events", "title startDate category type")
        .sort({ [sortBy]: order })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    return ok(res, 200, "Users fetched successfully", {
      data: users,
      pagination: {
        total, totalPages, currentPage: page, limit,
        hasNextPage: page < totalPages, hasPrevPage: page > 1,
      },
    });
  } catch (err) { next(err); }
};

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("events", "title startDate endDate category type price location");
    if (!user) {
      const e = new Error(`User not found: ${req.params.id}`);
      e.statusCode = 404; return next(e);
    }
    return ok(res, 200, "User fetched successfully", { data: user.toSafeObject() });
  } catch (err) { next(err); }
};

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    const allowed = ["fullName", "phone", "role"];
    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    const user = await User.findByIdAndUpdate(
      req.params.id, { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!user) {
      const e = new Error(`User not found: ${req.params.id}`);
      e.statusCode = 404; return next(e);
    }
    return ok(res, 200, "User updated successfully", { data: user.toSafeObject() });
  } catch (err) { next(err); }
};

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      const e = new Error(`User not found: ${req.params.id}`);
      e.statusCode = 404; return next(e);
    }
    await user.softDelete();
    return ok(res, 200, "User deleted successfully", { data: { id: req.params.id } });
  } catch (err) { next(err); }
};

// ─── GET /api/users/:userId/events ───────────────────────────────────────────
/**
 * FIX v2: Mongoose populate() with skip/limit inside options does NOT paginate
 * the referenced array — it only limits how many subdocuments are hydrated,
 * but `user.events.length` still reflects the full array (not the paginated slice).
 *
 * Correct approach: paginate the events[] ObjectId array in JS first,
 * then populate only that slice — O(slice) DB lookups instead of O(all).
 */
const getUserEvents = async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip  = (page - 1) * limit;

    // 1. Fetch only the events[] id array (lean, no populate)
    const user = await User.findById(req.params.userId).select("events").lean();

    if (!user) {
      const e = new Error(`User not found: ${req.params.userId}`);
      e.statusCode = 404; return next(e);
    }

    const total      = user.events.length;
    const totalPages = Math.ceil(total / limit);

    // 2. Slice the id array in application layer
    const eventIdsSlice = user.events.slice(skip, skip + limit);

    // 3. Populate only the slice — single batched $in query
    const populatedUser = await User.findById(req.params.userId)
      .select("events")
      .populate({
        path: "events",
        match: { _id: { $in: eventIdsSlice } },
        select: "title startDate endDate location category type price capacity isActive",
      });

    return ok(res, 200, "User events fetched successfully", {
      data: populatedUser ? populatedUser.events : [],
      pagination: {
        total, totalPages, currentPage: page, limit,
        hasNextPage: page < totalPages, hasPrevPage: page > 1,
      },
    });
  } catch (err) { next(err); }
};

// ─── PUT /api/users/:id/profile-image ────────────────────────────────────────
const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      const e = new Error("No file provided. Please upload an image.");
      e.statusCode = 400; return next(e);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      const e = new Error(`User not found: ${req.params.id}`);
      e.statusCode = 404; return next(e);
    }

    // Delete old profile image if it's a local upload
    if (user.profileImage) {
      const oldPath = path.join(__dirname, "..", user.profileImage);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.profileImage = `uploads/profiles/${req.file.filename}`;
    await user.save();

    return ok(res, 200, "Profile image updated successfully", {
      data: { profileImage: user.profileImage },
    });
  } catch (err) { next(err); }
};

// ─── PUT /api/users/:id/change-password ──────────────────────────────────────
/**
 * NEW v2: Dedicated change-password endpoint.
 * Requires the user's current password before allowing a change.
 * On success, all existing refresh tokens are revoked (forced re-login).
 *
 * @route   PUT /api/users/:id/change-password
 * @access  Self or Admin
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      const e = new Error("Both currentPassword and newPassword are required.");
      e.statusCode = 400; return next(e);
    }

    if (currentPassword === newPassword) {
      const e = new Error("New password must be different from the current password.");
      e.statusCode = 400; return next(e);
    }

    // Load user WITH password (normally excluded)
    const user = await User.findById(req.params.id).select(
      "+password +refreshToken +refreshTokenExpiresAt"
    );
    if (!user) {
      const e = new Error(`User not found: ${req.params.id}`);
      e.statusCode = 404; return next(e);
    }

    // Verify current password
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      const e = new Error("Current password is incorrect.");
      e.statusCode = 401; return next(e);
    }

    // Update password — pre-save hook hashes it and clears refreshToken
    user.password = newPassword;
    await user.save();

    return ok(res, 200, "Password changed successfully. Please log in again with your new password.");
  } catch (err) { next(err); }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserEvents,
  uploadProfileImage,
  changePassword,
};
