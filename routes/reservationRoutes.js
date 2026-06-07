const express = require('express');
const router  = express.Router();

const {
  createReservation,
  getAllReservations,
  getReservationById,
  cancelReservation,
} = require('../controllers/reservationController');

const {
  validateCreateReservation,
  validateCancelReservation,
  validateMongoId,
  validateQueryParams,
} = require('../middleware/validationMiddleware');


router.route('/')
  .post(validateCreateReservation, createReservation)
  .get(validateQueryParams, getAllReservations);


router.get('/:id', validateMongoId, getReservationById);


router.put('/:id/cancel', validateCancelReservation, cancelReservation);

module.exports = router;
