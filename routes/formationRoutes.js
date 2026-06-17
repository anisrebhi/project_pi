const express = require("express");
const router  = express.Router();
const { body, validationResult } = require("express-validator");

const {
  createFormation,
  getAllFormations,
  getFormationById,
  updateFormation,
  deleteFormation,
} = require("../controllers/formationController");

// Inline validation rules (replaces missing formationValidation.js middleware)
const formationValidationRules = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ min: 3 }).withMessage("Title must be at least 3 characters"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("level").isIn(["Beginner", "Intermediate", "Advanced"]).withMessage("Level must be Beginner, Intermediate or Advanced"),
  body("durationHours").isInt({ min: 1 }).withMessage("Duration must be at least 1 hour"),
  body("instructor").trim().notEmpty().withMessage("Instructor is required"),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

router.post("/", formationValidationRules, validate, createFormation);
router.get("/", getAllFormations);
router.get("/:id", getFormationById);
router.put("/:id", formationValidationRules, validate, updateFormation);
router.delete("/:id", deleteFormation);

module.exports = router;
