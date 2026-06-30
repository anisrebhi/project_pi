/**
 * @file routes/waitlistRoutes.js
 */
const express = require('express');
const router  = express.Router();

const {
  joinWaitlist,
  leaveWaitlist,
  getMyWaitlist,
  getEventWaitlist,
  checkMyWaitlistPosition,
} = require('../controllers/waitlistController');

const { protect }           = require('../middleware/authMiddleware');
const { organizerAndAdmin } = require('../middleware/roleMiddleware');
const { validateMongoId, validateJoinWaitlist } = require('../middleware/validationMiddleware');

router.use(protect);

// Current user's full waitlist
router.get('/my', getMyWaitlist);

// Check / leave per-event
router.get('/events/:eventId/position', validateMongoId('eventId'), checkMyWaitlistPosition);
router.delete('/events/:eventId', validateMongoId('eventId'), leaveWaitlist);

// Join
router.post('/', validateJoinWaitlist, joinWaitlist);

// Organizer / Admin: view event waitlist
router.get('/events/:eventId', validateMongoId('eventId'), organizerAndAdmin, getEventWaitlist);

module.exports = router;
