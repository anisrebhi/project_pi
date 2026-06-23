const express = require('express');
const router  = express.Router();
const { protect }        = require('../middleware/authMiddleware');
const { generateCertificates, getMyCertificates, downloadCertificate, verifyCertificate } = require('../controllers/certificateController');

router.get('/verify/:code',       verifyCertificate);              // Public
router.use(protect);
router.post('/generate/:eventId', generateCertificates);           // Organizer/Admin
router.get('/my',                 getMyCertificates);              // Participant
router.get('/download/:id',       downloadCertificate);            // Participant/Admin

module.exports = router;
