/**
 * @file routes/promoCodeRoutes.js
 * @description Promo code routes. Creation/listing/update/delete are restricted
 *              to ORGANIZER/ADMIN; validation is open to any authenticated user
 *              so participants can preview a discount before booking.
 */
const express = require('express');
const router = express.Router();

const {
  createPromoCode,
  getAllPromoCodes,
  updatePromoCode,
  deletePromoCode,
  validatePromoCode,
} = require('../controllers/promoCodeController');

const { protect } = require('../middleware/authMiddleware');
const { organizerAndAdmin } = require('../middleware/roleMiddleware');
const {
  validateCreatePromoCode,
  validateUpdatePromoCode,
  validateMongoId,
} = require('../middleware/validationMiddleware');

router.use(protect);

router.get('/validate', validatePromoCode);

router.get('/', organizerAndAdmin, getAllPromoCodes);
router.post('/', organizerAndAdmin, validateCreatePromoCode, createPromoCode);
router.patch('/:id', organizerAndAdmin, validateMongoId('id'), validateUpdatePromoCode, updatePromoCode);
router.delete('/:id', organizerAndAdmin, validateMongoId('id'), deletePromoCode);

module.exports = router;
