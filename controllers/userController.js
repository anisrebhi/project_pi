/**
 * @file controllers/userController.js
 * @description User management controller — CRUD, events, profile image
 */

const { User } = require("../models/User");
const Event = require("../models/Event");
const { AppError } = require("../middleware/errorMiddleware");
const { sendSuccess, buildPagination } = require("../utils/apiResponse");
const { deleteFile } = require("../utils/multerConfig");

const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) filter.$text = { $search: req.query.search };
    if (req.query.role) filter.role = req.query.role;

    const [users, total] = await Promise.all([
      User.find(filter).populate("events", "title startDate category").skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, "Users fetched successfully", users, buildPagination(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate("events", "title startDate endDate category type").lean();
    if (!user) return next(new AppError(`User not found: ${req.params.id}`, 404));
    return sendSuccess(res, 200, "User fetched successfully", user);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    return sendSuccess(res, 201, "User created successfully", user.toSafeObject());
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const allowedFields = ["fullName", "phone", "password"];
    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowedFields.includes(k))
    );
    const user = await User.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true, runValidators: true }).lean();
    if (!user) return next(new AppError(`User not found: ${req.params.id}`, 404));
    return sendSuccess(res, 200, "User updated successfully", user);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError(`User not found: ${req.params.id}`, 404));
    if (req.user && req.user._id.toString() === req.params.id) {
      return next(new AppError("Cannot delete your own account", 400));
    }
    await user.softDelete();
    return sendSuccess(res, 200, "User deleted successfully");
  } catch (error) {
    next(error);
  }
};

const getUserEvents = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const userId = req.params.userId;

    const user = await User.findById(userId).lean();
    if (!user) return next(new AppError(`User not found: ${userId}`, 404));

    const filter = { participants: userId };
    const [events, total] = await Promise.all([
      Event.find(filter).sort({ startDate: -1 }).skip(skip).limit(limit).lean(),
      Event.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, "User events fetched successfully", events, buildPagination(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) return next(new AppError("No file provided", 400));

    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError(`User not found: ${req.params.id}`, 404));

    const oldImage = user.profileImage;
    user.profileImage = req.file.path;
    await user.save();

    if (oldImage) deleteFile(oldImage);

    return sendSuccess(res, 200, "Profile image updated successfully", { profileImage: req.file.path });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, getUserEvents, uploadProfileImage };
