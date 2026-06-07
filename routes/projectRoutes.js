const express = require('express');
const router = express.Router();
const { createProject, getAllProjects, getProjectById, updateProject, deleteProject } = require('../controllers/projectController');
const { createProjectValidator, updateProjectValidator } = require('../validators/projectValidator');

router.route('/')
  .get(getAllProjects)
  .post(createProjectValidator, createProject);

router.route('/:id')
  .get(getProjectById)
  .put(updateProjectValidator, updateProject)
  .delete(deleteProject);

module.exports = router;
