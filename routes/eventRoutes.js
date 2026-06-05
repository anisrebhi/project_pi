const express = require('express');
const router  = express.Router();

const {
  createEvent, getAllEvents, getEventById,
  updateEvent, deleteEvent,
} = require('../controllers/eventController');

const { getEventParticipants } = require('../controllers/reservationController');

const {
  validateCreateEvent, validateUpdateEvent,
  validateMongoId, validateQueryParams,
} = require('../middleware/validationMiddleware');

const { uploadEventImages } = require('../middleware/uploadMiddleware');

// POST   /api/events          — create (supports multipart/form-data for images)
// GET    /api/events          — list with pagination / search / filter / sort
router.route('/')
  .post(uploadEventImages, validateCreateEvent, createEvent)
  .get(validateQueryParams, getAllEvents);

// GET    /api/events/:id/participants
router.get('/:id/participants', validateMongoId, getEventParticipants);

// GET    /api/events/:id
// PUT    /api/events/:id      — supports multipart/form-data for image upload
// DELETE /api/events/:id
router.route('/:id')
  .get(validateMongoId, getEventById)
  .put(uploadEventImages, validateUpdateEvent, updateEvent)
  .delete(validateMongoId, deleteEvent);

module.exports = router;
