/**
 * @file routes/registrationRoutes.js
 * @description QR code-based registration routes.
 */

const express = require("express");
const router = express.Router();

const { registerWithQR, scanQRCode, getMyRegistrations } = require("../controllers/registrationController");
const { protect } = require("../middleware/authMiddleware");
const { organizerAndAdmin } = require("../middleware/roleMiddleware");

/**
 * @swagger
 * /api/events/{eventId}/register-qr:
 *   post:
 *     tags: [Registrations]
 *     summary: Register for an event — generates and emails QR code ticket
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Registered. QR code sent by email.
 *       400:
 *         description: Past event or full capacity
 *       409:
 *         description: Already registered
 */
router.post("/events/:eventId/register-qr", protect, registerWithQR);

/**
 * @swagger
 * /api/registrations/scan:
 *   post:
 *     tags: [Registrations]
 *     summary: Scan and validate a QR code at event entry (staff only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [qrData]
 *             properties:
 *               qrData:
 *                 type: string
 *                 description: JSON string scanned from QR code
 *     responses:
 *       200:
 *         description: Access granted
 *       400:
 *         description: Invalid or expired QR
 *       409:
 *         description: QR code already used
 */
router.post("/registrations/scan", protect, organizerAndAdmin, scanQRCode);

/**
 * @swagger
 * /api/registrations/my:
 *   get:
 *     tags: [Registrations]
 *     summary: Get current user's QR registrations
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Registrations list
 */
router.get("/registrations/my", protect, getMyRegistrations);

module.exports = router;
