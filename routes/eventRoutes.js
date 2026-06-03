const express = require('express');
const router  = express.Router();

const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');

const {
  validateCreateEvent,
  validateUpdateEvent,
  validateMongoId,
  validateQueryParams,
} = require('../middleware/validationMiddleware');


router
  .route('/')
  .post(validateCreateEvent, createEvent)
  .get(validateQueryParams, getAllEvents);


router
  .route('/:id')
  .get(validateMongoId, getEventById)
  .put(validateUpdateEvent, updateEvent)
  .delete(validateMongoId, deleteEvent);

module.exports = router;
