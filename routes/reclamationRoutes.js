const express = require('express');
const router  = express.Router();

const {
  createReclamation,
  getAllReclamations,
  getReclamationById,
  updateReclamation,
  deleteReclamation,
  updateStatut,
} = require('../controllers/reclamationController');

const {
  validateCreateReclamation,
  validateUpdateReclamation,
  validateUpdateStatut,
  validateMongoId,
  validateQueryParams,
} = require('../middleware/validationMiddleware');

// ─── Reclamation Routes ───────────────────────────────────────────────────────

// POST   /api/reclamations        → create reclamation
// GET    /api/reclamations        → get all (+ pagination, search, filter, sort)
router
  .route('/')
  .post(validateCreateReclamation, createReclamation)
  .get(validateQueryParams, getAllReclamations);

// GET    /api/reclamations/:id    → get reclamation by ID
// PUT    /api/reclamations/:id    → update reclamation fields
// DELETE /api/reclamations/:id   → delete reclamation
router
  .route('/:id')
  .get(validateMongoId, getReclamationById)
  .put(validateUpdateReclamation, updateReclamation)
  .delete(validateMongoId, deleteReclamation);

// PATCH  /api/reclamations/:id/statut  → update status + optional response
router
  .route('/:id/statut')
  .patch(validateUpdateStatut, updateStatut);

module.exports = router;
