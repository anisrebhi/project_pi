/**
 * @file routes/eventRoutes.js
 * @description Event management routes — CRUD + Many-to-Many registration endpoints
 *
 * Auth model:
 *  - GET /api/events and GET /api/events/:id  → public (optionalAuth for personalization)
 *  - POST, PUT, DELETE, and participant routes → require authentication + roles
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

const { protect, optionalAuth } = require("../middleware/authMiddleware");
const { organizerAndAdmin } = require("../middleware/roleMiddleware");
const {
  validateCreateEvent,
  validateUpdateEvent,
  validateMongoId,
  validatePagination,
} = require("../middleware/validationMiddleware");

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
  validateMongoId("eventId"),
  validateMongoId("userId"),
  registerUserToEvent
);

router.delete(
  "/:eventId/unregister/:userId",
  protect,
  validateMongoId("eventId"),
  validateMongoId("userId"),
  unregisterUserFromEvent
);

router.get(
  "/:eventId/participants",
  protect,
  validateMongoId("eventId"),
  validatePagination,
  getEventParticipants
);

// ─── Similar events (Lot 2) ──────────────────────────────────────────────────
const { getSimilarEvents } = require('../controllers/recommendationController');
router.get('/:id/similar', optionalAuth, validateMongoId('id'), getSimilarEvents);

module.exports = router;
