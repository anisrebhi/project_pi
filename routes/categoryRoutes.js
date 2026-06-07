const express = require('express');
const router = express.Router();
const { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { createCategoryValidator, updateCategoryValidator } = require('../validators/categoryValidator');

router.route('/')
  .get(getAllCategories)
  .post(createCategoryValidator, createCategory);

router.route('/:id')
  .get(getCategoryById)
  .put(updateCategoryValidator, updateCategory)
  .delete(deleteCategory);

module.exports = router;
