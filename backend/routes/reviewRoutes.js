const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createReview, getEventReviews, deleteReview } = require('../controllers/reviewController');

router.get('/event/:eventId', getEventReviews);           // Public
router.use(protect);
router.post('/',              createReview);              // Participant
router.delete('/:id',        deleteReview);              // Owner or Admin

module.exports = router;
