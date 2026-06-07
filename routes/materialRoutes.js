const express = require('express');
const router = express.Router();
const { createMaterial, getAllMaterials, getMaterialById, updateMaterial, deleteMaterial, updateMaterialStatus } = require('../controllers/materialController');
const { createMaterialValidator, updateMaterialValidator, updateStatusValidator, listMaterialsValidator } = require('../validators/materialValidator');

router.route('/')
  .get(listMaterialsValidator, getAllMaterials)
  .post(createMaterialValidator, createMaterial);

router.route('/:id')
  .get(getMaterialById)
  .put(updateMaterialValidator, updateMaterial)
  .delete(deleteMaterial);

router.patch('/:id/status', updateStatusValidator, updateMaterialStatus);

module.exports = router;
