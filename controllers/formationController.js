import Formation from "../models/Formation.js";

export const createFormation = async (req, res, next) => {
  try {
    const formation = await Formation.create(req.body);

    res.status(201).json({
      success: true,
      data: formation,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllFormations = async (req, res, next) => {
  try {
    const formations = await Formation.find();

    res.status(200).json({
      success: true,
      count: formations.length,
      data: formations,
    });
  } catch (error) {
    next(error);
  }
};

export const getFormationById = async (req, res, next) => {
  try {
    const formation = await Formation.findById(req.params.id);

    if (!formation) {
      return res.status(404).json({
        success: false,
        message: "Formation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: formation,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFormation = async (req, res, next) => {
  try {
    const formation = await Formation.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!formation) {
      return res.status(404).json({
        success: false,
        message: "Formation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: formation,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFormation = async (req, res, next) => {
  try {
    const formation = await Formation.findByIdAndDelete(req.params.id);

    if (!formation) {
      return res.status(404).json({
        success: false,
        message: "Formation not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Formation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
