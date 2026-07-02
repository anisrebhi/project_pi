const { User } = require('../models/User');
const path = require('path');
const fs   = require('fs');

const ok = (res, code, message, data = {}) =>
  res.status(code).json({ success: true, statusCode: code, message, ...data });

// ─── POST /api/users ──────────────────────────────────────────────────────────
const createUser = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, role } = req.body;
    const user = await User.create({ fullName, email, password, phone, role });
    return ok(res, 201, 'User created successfully', { data: user.toSafeObject() });
  } catch (err) { next(err); }
};

// ─── GET /api/users ───────────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { fullName: { $regex: req.query.search, $options: 'i' } },
        { email:    { $regex: req.query.search, $options: 'i' } },
      ];
    }
    if (req.query.role)   filter.role  = req.query.role;

    const [users, total] = await Promise.all([
      User.find(filter).populate('events', 'title startDate category type')
        .skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    return ok(res, 200, 'Users fetched successfully', {
      data: users,
      pagination: { total, totalPages, currentPage: page, limit,
        hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
  } catch (err) { next(err); }
};

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('events', 'title startDate endDate category type price location');
    if (!user) {
      const e = new Error(`User not found: ${req.params.id}`);
      e.statusCode = 404; return next(e);
    }
    return ok(res, 200, 'User fetched successfully', { data: user.toSafeObject() });
  } catch (err) { next(err); }
};

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    const allowed = ['fullName', 'phone', 'role'];
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
    return ok(res, 200, 'User updated successfully', { data: user.toSafeObject() });
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
    return ok(res, 200, 'User deleted successfully', { data: { id: req.params.id } });
  } catch (err) { next(err); }
};

// ─── GET /api/users/:userId/events ───────────────────────────────────────────
const getUserEvents = async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip  = (page - 1) * limit;

    const user = await User.findById(req.params.userId)
      .populate({
        path: 'events',
        select: 'title startDate endDate location category type price capacity isActive',
        options: { skip, limit },
      });

    if (!user) {
      const e = new Error(`User not found: ${req.params.userId}`);
      e.statusCode = 404; return next(e);
    }

    const total      = user.events.length;
    const totalPages = Math.ceil(total / limit);

    return ok(res, 200, 'User events fetched successfully', {
      data: user.events,
      pagination: { total, totalPages, currentPage: page, limit,
        hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
  } catch (err) { next(err); }
};

// ─── PUT /api/users/:id/profile-image ────────────────────────────────────────
const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      const e = new Error('No file provided. Please upload an image.');
      e.statusCode = 400; return next(e);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      const e = new Error(`User not found: ${req.params.id}`);
      e.statusCode = 404; return next(e);
    }

    if (user.profileImage) {
      const oldPath = path.join(__dirname, '..', user.profileImage);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.profileImage = `uploads/profiles/${req.file.filename}`;
    await user.save();

    return ok(res, 200, 'Profile image updated successfully', {
      data: { profileImage: user.profileImage },
    });
  } catch (err) { next(err); }
};

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser, getUserEvents, uploadProfileImage };
