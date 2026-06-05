import express from "express";

import {
  createFormation,
  getAllFormations,
  getFormationById,
  updateFormation,
  deleteFormation,
} from "../controllers/formationController.js";

import { formationValidationRules } from "../middleware/formationValidation.js";
import { validationResult } from "express-validator";

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  next();
};

router.post(
  "/",
  formationValidationRules,
  validate,
  createFormation
);

router.get("/", getAllFormations);

router.get("/:id", getFormationById);

router.put(
  "/:id",
  formationValidationRules,
  validate,
  updateFormation
);

router.delete("/:id", deleteFormation);

export default router;
