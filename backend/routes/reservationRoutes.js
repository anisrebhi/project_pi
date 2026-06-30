/**
 * @file routes/reservationRoutes.js
 * @description Reservation routes.
 *
 * Security model:
 *  - All routes require authentication (`protect`).
 *  - Reservations are never readable by a generic "/:id" endpoint.
 *  - Listing reservations is role-filtered: ADMIN sees everything,
 *    everyone else only ever sees their own reservations.
 *  - Cancelling and downloading the PDF ticket are restricted to the
 *    reservation's owner or an ADMIN.
 */

const express = require('express');
const router  = express.Router();

const {
  createReservation,
  getAllReservations,
  getUserReservations,
  cancelReservation,
  downloadReservationTicket,
} = require('../controllers/reservationController');

const { protect } = require('../middleware/authMiddleware');
const { selfOrAdmin } = require('../middleware/roleMiddleware');

const {
  validateCreateReservation,
  validateCancelReservation,
  validateMongoId,
  validateQueryParams,
} = require('../middleware/validationMiddleware');

// ─── All reservation routes require authentication ────────────────────────────
router.use(protect);

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     tags: [Reservations]
 *     summary: Create a reservation for an event
 *     description: |
 *       Books one or more tickets for a future event. A regular user can
 *       only book for themselves; only ADMIN may pass a different `userId`
 *       to create a reservation on someone else's behalf.
 *
 *       Rules enforced:
 *         - The event must be in the future (not started/passed).
 *         - The event must have enough remaining capacity.
 *         - The user cannot have more than one active reservation per event.
 *
 *       Once confirmed, a ticket QR code is generated and a confirmation
 *       email (with the QR code and reservation details) is sent to the user.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, numberOfTickets]
 *             properties:
 *               userId: { type: string, description: "ADMIN only — book on behalf of another user" }
 *               eventId: { type: string }
 *               numberOfTickets: { type: integer, minimum: 1, maximum: 20 }
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *       400:
 *         description: Event is in the past, or not enough capacity
 *       403:
 *         description: Cannot create a reservation for another user
 *       404:
 *         description: User or event not found
 *       409:
 *         description: An active reservation already exists for this event
 *       422:
 *         description: Validation error
 *
 *   get:
 *     tags: [Reservations]
 *     summary: List reservations (role-based)
 *     description: |
 *       - **ADMIN**: sees every reservation, optionally filtered by
 *         `userId`, `eventId` and/or `status`.
 *       - **Any other role**: only ever sees their OWN reservations
 *         (the `userId` query parameter is ignored).
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
 *         name: status
 *         schema: { type: string, enum: [pending, confirmed, cancelled] }
 *       - in: query
 *         name: eventId
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *         description: ADMIN only — ignored for non-admin users
 *     responses:
 *       200:
 *         description: Reservations fetched successfully
 */
router.route('/')
  .post(validateCreateReservation, createReservation)
  .get(validateQueryParams, getAllReservations);

/**
 * @swagger
 * /api/reservations/user/{userId}:
 *   get:
 *     tags: [Reservations]
 *     summary: Get reservations belonging to a specific user
 *     description: Accessible only by that user themselves, or by an ADMIN.
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
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, confirmed, cancelled] }
 *     responses:
 *       200:
 *         description: User reservations fetched successfully
 *       403:
 *         description: Access denied — not your own reservations and not an ADMIN
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', validateMongoId('userId'), validateQueryParams, selfOrAdmin('userId'), getUserReservations);

/**
 * @swagger
 * /api/reservations/{id}/cancel:
 *   put:
 *     tags: [Reservations]
 *     summary: Cancel a reservation
 *     description: Only the reservation's owner or an ADMIN can cancel it.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancellationReason: { type: string }
 *     responses:
 *       200:
 *         description: Reservation cancelled successfully
 *       403:
 *         description: Access denied — not your own reservation and not an ADMIN
 *       404:
 *         description: Reservation not found
 *       409:
 *         description: Reservation already cancelled
 */
router.put('/:id/cancel', validateMongoId('id'), validateCancelReservation, cancelReservation);

/**
 * @swagger
 * /api/reservations/{id}/ticket:
 *   get:
 *     tags: [Reservations]
 *     summary: Download the PDF ticket for a confirmed reservation
 *     description: |
 *       Streams a downloadable PDF containing the reservation details and
 *       the ticket QR code. Reservations are intentionally NOT exposed by
 *       direct ID otherwise — only the reservation's owner or an ADMIN can
 *       access this PDF, and only once the reservation is confirmed.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF ticket stream
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       400:
 *         description: Reservation is not confirmed yet
 *       403:
 *         description: Access denied — not your own reservation and not an ADMIN
 *       404:
 *         description: Reservation not found
 */
router.get('/:id/ticket', validateMongoId('id'), downloadReservationTicket);

module.exports = router;
