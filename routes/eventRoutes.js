const express = require('express');
const router = express.Router();
const { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent } = require('../controllers/eventController');
const { createEventValidator, updateEventValidator } = require('../validators/eventValidator');

router.route('/')
  .get(getAllEvents)
  .post(createEventValidator, createEvent);

router.route('/:id')
  .get(getEventById)
  .put(updateEventValidator, updateEvent)
  .delete(deleteEvent);

module.exports = router;
