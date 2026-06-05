/**
 * @file routes/userRoutes.js
 * @description User management routes with role-based access control
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
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly, selfOrAdmin } = require("../middleware/roleMiddleware");
const {
  validateUpdateUser,
  validateMongoId,
  validatePagination,
} = require("../middleware/validationMiddleware");
const { upload } = require("../utils/multerConfig");

// ─── All user routes require authentication ───────────────────────────────────
router.use(protect);

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users (Admin only)
 *     description: Returns paginated list of users with optional search and role filter
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
 *         description: Search by fullName or email
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       403:
 *         description: Forbidden — ADMIN role required
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
 *         description: User created successfully
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Email already exists
 */
router.post("/", adminOnly, validateUpdateUser, createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: ADMIN can get any user; other users can only get their own profile
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId of the user
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.get("/:id", selfOrAdmin("id"), validateMongoId("id"), getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update a user
 *     description: ADMIN can update all fields; users can update their own profile (restricted fields)
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
 *               password: { type: string }
 *               role:
 *                 type: string
 *                 enum: [ADMIN, ORGANIZER, PARTICIPANT]
 *                 description: ADMIN only
 *     responses:
 *       200:
 *         description: User updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
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
 *         description: User deleted (soft)
 *       400:
 *         description: Cannot delete own account
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.delete("/:id", adminOnly, validateMongoId("id"), deleteUser);

/**
 * @swagger
 * /api/users/{userId}/events:
 *   get:
 *     tags: [Relations]
 *     summary: Get all events a user is registered for
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
 *         description: User events retrieved
 *       403:
 *         description: Access denied
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

/**
 * @swagger
 * /api/users/{id}/profile-image:
 *   put:
 *     tags: [Users]
 *     summary: Upload or update profile image
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
 *         description: No file provided or invalid format
 *       413:
 *         description: File too large (max 5MB)
 */
router.put(
  "/:id/profile-image",
  selfOrAdmin("id"),
  validateMongoId("id"),
  upload.single("profileImage"),
  uploadProfileImage
);

module.exports = router;
