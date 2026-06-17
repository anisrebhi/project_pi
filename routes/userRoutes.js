/**
 * @file routes/userRoutes.js
 * @description User management routes — CRUD, profile image, change password, user events.
 */

const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserEvents,
  uploadProfileImage,
  changePassword,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly, selfOrAdmin } = require("../middleware/roleMiddleware");
const {
  validateUpdateUser,
  validateMongoId,
  validatePagination,
  validateChangePassword,
} = require("../middleware/validationMiddleware");
const { upload } = require("../utils/multerConfig");

// All user routes require authentication
router.use(protect);

// ─── Collection ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Full-text search on fullName and email
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [ADMIN, ORGANIZER, PARTICIPANT] }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: ADMIN role required
 */
router.get("/", adminOnly, validatePagination, getAllUsers);

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: User created
 *       409:
 *         description: Email already exists
 */
router.post("/", adminOnly, validateUpdateUser, createUser);

// ─── Single User ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID (Self or Admin)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User retrieved
 *       403:
 *         description: Access denied
 *       404:
 *         description: Not found
 */
router.get("/:id", selfOrAdmin("id"), validateMongoId("id"), getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update a user (Self or Admin)
 *     description: Updatable fields — fullName, phone, role (ADMIN only).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               phone: { type: string }
 *               role:
 *                 type: string
 *                 enum: [ADMIN, ORGANIZER, PARTICIPANT]
 *                 description: ADMIN only
 *     responses:
 *       200:
 *         description: User updated
 *       403:
 *         description: Access denied
 */
router.put(
  "/:id",
  selfOrAdmin("id"),
  validateMongoId("id"),
  validateUpdateUser,
  updateUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Soft-delete a user (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User soft-deleted
 *       404:
 *         description: Not found
 */
router.delete("/:id", adminOnly, validateMongoId("id"), deleteUser);

// ─── User Events ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/users/{userId}/events:
 *   get:
 *     tags: [Relations]
 *     summary: Get events a user is registered for (paginated)
 *     description: |
 *       v2: Pagination is now correctly applied — the events array is sliced
 *       in the application layer before populate() is called, avoiding the
 *       Mongoose populate skip/limit bug.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Events retrieved
 *       404:
 *         description: User not found
 */
router.get(
  "/:userId/events",
  selfOrAdmin("userId"),
  validateMongoId("userId"),
  validatePagination,
  getUserEvents
);

// ─── Profile Image ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/users/{id}/profile-image:
 *   put:
 *     tags: [Users]
 *     summary: Upload or replace profile image (Self or Admin)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image updated
 *       400:
 *         description: No file or invalid format
 *       413:
 *         description: File too large (max 5 MB)
 */
router.put(
  "/:id/profile-image",
  selfOrAdmin("id"),
  validateMongoId("id"),
  upload.single("profileImage"),
  uploadProfileImage
);

// ─── Change Password ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/users/{id}/change-password:
 *   put:
 *     tags: [Users]
 *     summary: Change password (Self or Admin)
 *     description: |
 *       Requires the user's currentPassword for verification. On success,
 *       all active refresh tokens are revoked — the user must log in again.
 *       Admin can change any user's password without providing currentPassword.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Must contain at least one number
 *     responses:
 *       200:
 *         description: Password changed — user must log in again
 *       400:
 *         description: Missing fields or new password same as current
 *       401:
 *         description: Incorrect current password
 *       404:
 *         description: User not found
 */
router.put(
  "/:id/change-password",
  selfOrAdmin("id"),
  validateMongoId("id"),
  validateChangePassword,
  changePassword
);

module.exports = router;
