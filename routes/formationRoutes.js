const express = require('express');
const router  = express.Router();

const {
  getAllFormations,
  getFormationById,
  createFormation,
  updateFormation,
  deleteFormation,
  enrollUser,
  unenrollUser,
  getParticipants,
  addSession,
  updateSession,
  deleteSession,
  getResources,
  addResource,
  updateResource,
  deleteResource,
} = require('../controllers/formationController');

const {
  validateCreateFormation,
  validateUpdateFormation,
  validateEnroll,
  validateUnenroll,
  validateAddSession,
  validateUpdateSession,
  validateSessionId,
  validateAddResource,
  validateUpdateResource,
  validateResourceId,
  validateListFormations,
  validateMongoId,
} = require('../middleware/formationValidation');

// ── Core CRUD ─────────────────────────────────────────────────────────────────
router.get('/',     validateListFormations,   getAllFormations);
router.post('/',    validateCreateFormation,  createFormation);
router.get('/:id',  validateMongoId,          getFormationById);
router.put('/:id',  validateUpdateFormation,  updateFormation);
router.delete('/:id', validateMongoId,        deleteFormation);

// ── Participants ──────────────────────────────────────────────────────────────
router.get('/:id/participants',        validateMongoId,   getParticipants);
router.post('/:id/enroll',             validateEnroll,    enrollUser);
router.delete('/:id/enroll/:userId',   validateUnenroll,  unenrollUser);

// ── Sessions ──────────────────────────────────────────────────────────────────
router.post('/:id/sessions',                      validateAddSession,    addSession);
router.put('/:id/sessions/:sessionId',            validateUpdateSession, updateSession);
router.delete('/:id/sessions/:sessionId',         validateSessionId,     deleteSession);

// ── Resources ─────────────────────────────────────────────────────────────────
router.get('/:id/resources',                      validateMongoId,       getResources);
router.post('/:id/resources',                     validateAddResource,   addResource);
router.put('/:id/resources/:resourceId',          validateUpdateResource,updateResource);
router.delete('/:id/resources/:resourceId',       validateResourceId,    deleteResource);

module.exports = router;
