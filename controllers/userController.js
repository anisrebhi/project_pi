const User = require('../models/User');

const ok = (res, code, message, data = {}) =>
  res.status(code).json({ success: true, statusCode: code, message, ...data });

// ─── POST /api/users ──────────────────────────────────────────────────────────
const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    const user = await User.create({ firstName, lastName, email, phone });
    return ok(res, 201, 'User created successfully', { data: user });
  } catch (err) { next(err); }
};

// ─── GET /api/users ───────────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip  = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().populate('events', 'title startDate category type')
        .skip(skip).limit(limit).lean(),
      User.countDocuments(),
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
    return ok(res, 200, 'User fetched successfully', { data: user });
  } catch (err) { next(err); }
};

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    const allowed = ['firstName', 'lastName', 'phone'];
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
    return ok(res, 200, 'User updated successfully', { data: user });
  } catch (err) { next(err); }
};

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      const e = new Error(`User not found: ${req.params.id}`);
      e.statusCode = 404; return next(e);
    }
    return ok(res, 200, 'User deleted successfully', { data: { id: req.params.id } });
  } catch (err) { next(err); }
};

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser };
