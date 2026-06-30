/**
 * @file routes/eventRoutes.js
 * @description Event management routes — CRUD + Many-to-Many registration endpoints
<<<<<<< HEAD
 *
 * Auth model:
 *  - GET /api/events and GET /api/events/:id  → public (optionalAuth for personalization)
 *  - POST, PUT, DELETE, and participant routes → require authentication + roles
=======
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
 */

const express = require("express");
const router = express.Router();

const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerUserToEvent,
  unregisterUserFromEvent,
  getEventParticipants,
  getEventQRCode,
  regenerateEventQRCode,
} = require("../controllers/eventController");

<<<<<<< HEAD
const { protect, optionalAuth } = require("../middleware/authMiddleware");
=======
const { protect } = require("../middleware/authMiddleware");
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
const { organizerAndAdmin } = require("../middleware/roleMiddleware");
const {
  validateCreateEvent,
  validateUpdateEvent,
  validateMongoId,
  validatePagination,
} = require("../middleware/validationMiddleware");

<<<<<<< HEAD
// ─── Public read routes (optional auth for future personalization) ─────────────
router.get("/", optionalAuth, validatePagination, getAllEvents);
router.get("/:id", optionalAuth, validateMongoId("id"), getEventById);

// ─── Protected mutation routes ────────────────────────────────────────────────
router.post("/", protect, organizerAndAdmin, validateCreateEvent, createEvent);
router.put("/:id", protect, validateMongoId("id"), validateUpdateEvent, updateEvent);
router.delete("/:id", protect, validateMongoId("id"), deleteEvent);

// ─── QR Code routes ───────────────────────────────────────────────────────────
router.get("/:id/qrcode", protect, validateMongoId("id"), getEventQRCode);
router.patch("/:id/qrcode", protect, validateMongoId("id"), regenerateEventQRCode);

// ─── Many-to-Many Relation Routes ─────────────────────────────────────────────
router.post(
  "/:eventId/register/:userId",
  protect,
=======
// ─── All event routes require authentication ──────────────────────────────────
router.use(protect);

// ─── CRUD Routes ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/events:
 *   get:
 *     tags: [Events]
 *     summary: Get all events with pagination and filters
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
 *         description: Search by title, description or location
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *         description: Filter events from this date
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *         description: Filter events until this date
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: date }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: asc }
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get("/", validatePagination, getAllEvents);

/**
 * @swagger
 * /api/events:
 *   post:
 *     tags: [Events]
 *     summary: Create a new event
 *     description: Only ADMIN and ORGANIZER roles can create events. The authenticated user becomes the organizer.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventInput'
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       403:
 *         description: Forbidden — ORGANIZER or ADMIN role required
 *       422:
 *         description: Validation error
 */
router.post("/", organizerAndAdmin, validateCreateEvent, createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     tags: [Events]
 *     summary: Get event by ID with full participant details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *       404:
 *         description: Event not found
 */
router.get("/:id", validateMongoId("id"), getEventById);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     tags: [Events]
 *     summary: Update an event
 *     description: Only the event's organizer or an ADMIN can update it.
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
 *             $ref: '#/components/schemas/EventInput'
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       400:
 *         description: Capacity below current participant count
 *       403:
 *         description: Access denied
 *       404:
 *         description: Event not found
 */
router.put("/:id", validateMongoId("id"), validateUpdateEvent, updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     tags: [Events]
 *     summary: Soft-delete an event
 *     description: Only the event's organizer or an ADMIN can delete it. Removes event from all participants.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Event not found
 */
router.delete("/:id", validateMongoId("id"), deleteEvent);


/**
 * @swagger
 * /api/events/{id}/qrcode:
 *   get:
 *     tags: [Events]
 *     summary: Get the QR code for an event
 *     description: |
 *       Returns the QR code image for the event.
 *       Add **?format=png** to receive a raw PNG image instead of JSON.
 *       The QR code is auto-generated on first access if missing.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [png] }
 *         description: Pass "png" to get a raw PNG image response
 *     responses:
 *       200:
 *         description: QR code retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 eventId: { type: string }
 *                 title:   { type: string }
 *                 qrCode:  { type: string, description: "base64 PNG data URL" }
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Event not found
 */
router.get("/:id/qrcode", validateMongoId("id"), getEventQRCode);

/**
 * @swagger
 * /api/events/{id}/qrcode:
 *   patch:
 *     tags: [Events]
 *     summary: Regenerate the QR code for an event
 *     description: Forces a new QR code to be generated and saved. Only the organizer or ADMIN.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: QR code regenerated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Event not found
 */
router.patch("/:id/qrcode", validateMongoId("id"), regenerateEventQRCode);

// ─── Many-to-Many Relation Routes ─────────────────────────────────────────────

/**
 * @swagger
 * /api/events/{eventId}/register/{userId}:
 *   post:
 *     tags: [Relations]
 *     summary: Register a user to an event
 *     description: |
 *       Links a user as a participant. ADMIN can register anyone.
 *       Other users can only register themselves.
 *       Checks for: duplicate registration, capacity limit, and past events.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User registered successfully
 *       400:
 *         description: Event full or in the past
 *       403:
 *         description: Cannot register another user
 *       404:
 *         description: Event or user not found
 *       409:
 *         description: User already registered
 */
router.post(
  "/:eventId/register/:userId",
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
  validateMongoId("eventId"),
  validateMongoId("userId"),
  registerUserToEvent
);

<<<<<<< HEAD
router.delete(
  "/:eventId/unregister/:userId",
  protect,
=======
/**
 * @swagger
 * /api/events/{eventId}/unregister/{userId}:
 *   delete:
 *     tags: [Relations]
 *     summary: Unregister a user from an event
 *     description: Removes the Many-to-Many link. ADMIN can unregister anyone. Users can unregister themselves.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User unregistered successfully
 *       403:
 *         description: Cannot unregister another user
 *       404:
 *         description: Event or user not found
 *       409:
 *         description: User was not registered
 */
router.delete(
  "/:eventId/unregister/:userId",
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
  validateMongoId("eventId"),
  validateMongoId("userId"),
  unregisterUserFromEvent
);

<<<<<<< HEAD
router.get(
  "/:eventId/participants",
  protect,
=======
/**
 * @swagger
 * /api/events/{eventId}/participants:
 *   get:
 *     tags: [Relations]
 *     summary: Get all participants of an event
 *     description: Only the event organizer or ADMIN can view the full participant list.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Filter participants by name or email
 *     responses:
 *       200:
 *         description: Participants retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Event not found
 */
router.get(
  "/:eventId/participants",
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
  validateMongoId("eventId"),
  validatePagination,
  getEventParticipants
);

<<<<<<< HEAD
// ─── Similar events (Lot 2) ──────────────────────────────────────────────────
const { getSimilarEvents } = require('../controllers/recommendationController');
router.get('/:id/similar', optionalAuth, validateMongoId('id'), getSimilarEvents);

module.exports = router;
=======
module.exports = router;

// ─── Similar events (Lot 2) ───────────────────────────────────────────────────
const { getSimilarEvents } = require('../controllers/recommendationController');
router.get('/:id/similar', validateMongoId('id'), getSimilarEvents);
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
