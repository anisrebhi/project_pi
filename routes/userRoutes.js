const express = require('express');
const router  = express.Router();

const {
  createUser, getAllUsers, getUserById, updateUser, deleteUser,
} = require('../controllers/userController');

const { getUserReservations } = require('../controllers/reservationController');

const {
  validateCreateUser, validateMongoId, validateQueryParams,
} = require('../middleware/validationMiddleware');


router.route('/')
  .post(validateCreateUser, createUser)
  .get(validateQueryParams, getAllUsers);


router.get('/:userId/reservations', validateMongoId, getUserReservations);


router.route('/:id')
  .get(validateMongoId, getUserById)
  .put(validateMongoId, updateUser)
  .delete(validateMongoId, deleteUser);

module.exports = router;
