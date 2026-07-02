/**
 * @file routes/certificateRoutes.js
 *
 * Public:
 *   GET  /api/certificates/verify/:code
 *
 * Authenticated (any role):
 *   GET  /api/certificates/my
 *   GET  /api/certificates/download/:id
 *   GET  /api/certificates/preview/:id
 *
 * Admin / Organizer:
 *   POST   /api/certificates/initialize/:eventId     (?force=true)
 *   POST   /api/certificates/generate-one
 *   GET    /api/certificates/event/:eventId
 *   PATCH  /api/certificates/:id/validate
 *   PATCH  /api/certificates/bulk-validate/:eventId
 *   PATCH  /api/certificates/:id/send
 *   POST   /api/certificates/bulk-send/:eventId
 *   DELETE /api/certificates/:id
 *
 * Admin only:
 *   GET  /api/certificates/all
 */
const express = require('express');
const router  = express.Router();

const { protect }               = require('../middleware/authMiddleware');
const { adminOnly, organizerAndAdmin } = require('../middleware/roleMiddleware');

const {
  initializeCertificates,
  generateForOne,
  getEventCertificates,
  getAllCertificates,
  validateCertificate,
  bulkValidate,
  sendCertificate,
  bulkSend,
  deleteCertificate,
  downloadCertificate,
  previewCertificate,
  getMyCertificates,
  verifyCertificate,
  getConfirmedParticipants,
} = require('../controllers/certificateController');

// ── Public ─────────────────────────────────────────────────────────────────────
router.get('/verify/:code', verifyCertificate);

// ── Authenticated (any role) ───────────────────────────────────────────────────
router.use(protect);

router.get('/my',             getMyCertificates);
router.get('/download/:id',   downloadCertificate);
router.get('/preview/:id',    previewCertificate);

// ── Admin / Organizer ──────────────────────────────────────────────────────────
router.get(   '/event/:eventId/participants', organizerAndAdmin, getConfirmedParticipants);
router.post(  '/initialize/:eventId',     organizerAndAdmin, initializeCertificates);
router.post(  '/generate-one',            organizerAndAdmin, generateForOne);
router.get(   '/event/:eventId',          organizerAndAdmin, getEventCertificates);
router.patch( '/bulk-validate/:eventId',  organizerAndAdmin, bulkValidate);
router.patch( '/:id/validate',            organizerAndAdmin, validateCertificate);
router.patch( '/:id/send',               organizerAndAdmin, sendCertificate);
router.post(  '/bulk-send/:eventId',      organizerAndAdmin, bulkSend);
router.delete('/:id',                    organizerAndAdmin, deleteCertificate);

// ── Admin only ─────────────────────────────────────────────────────────────────
router.get('/all', adminOnly, getAllCertificates);

module.exports = router;
