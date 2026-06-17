const Reclamation = require('../models/Reclamation');

/**
 */
const sendSuccess = (res, statusCode, message, data = {}) =>
  res.status(statusCode).json({ success: true, statusCode, message, ...data });



/**
 * @desc    Create a new reclamation
 * @route   POST /api/reclamations
 * @access  Public
 */
const createReclamation = async (req, res, next) => {
  try {
    const { sujet, description, categorie, priorite, soumisePar, email, piecesJointes } = req.body;

    const reclamation = await Reclamation.create({
      sujet,
      description,
      categorie,
      priorite,
      soumisePar,
      email,
      piecesJointes: piecesJointes || [],
    });

    return sendSuccess(res, 201, 'Reclamation created successfully', { data: reclamation });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reclamations — with pagination, search, filter and sort
 * @route   GET /api/reclamations
 * @access  Public
 *
 * Query params:
 *   page       {number}  – page number           (default: 1)
 *   limit      {number}  – results per page       (default: 10)
 *   search     {string}  – text search on sujet
 *   statut     {string}  – filter by status
 *   categorie  {string}  – filter by category
 *   priorite   {string}  – filter by priority
 *   sortBy     {string}  – field to sort by       (default: createdAt)
 *   order      {string}  – "asc" | "desc"         (default: desc)
 */
const getAllReclamations = async (req, res, next) => {
  try {
    // ── Pagination ──
    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip  = (page - 1) * limit;

    // ── Build filter object ──
    const filter = {};

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    if (req.query.statut) {
      filter.statut = req.query.statut;
    }

    if (req.query.categorie) {
      filter.categorie = req.query.categorie;
    }

    if (req.query.priorite) {
      filter.priorite = req.query.priorite;
    }

    if (req.query.createdFrom || req.query.createdTo) {
      filter.createdAt = {};
      if (req.query.createdFrom) filter.createdAt.$gte = new Date(req.query.createdFrom);
      if (req.query.createdTo)   filter.createdAt.$lte = new Date(req.query.createdTo);
    }

    
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.order  === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    
    const [reclamations, total] = await Promise.all([
      Reclamation.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Reclamation.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 200, 'Reclamations fetched successfully', {
      data: reclamations,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single reclamation by ID
 * @route   GET /api/reclamations/:id
 * @access  Public
 */
const getReclamationById = async (req, res, next) => {
  try {
    const reclamation = await Reclamation.findById(req.params.id);

    if (!reclamation) {
      const error = new Error(`Reclamation not found with ID: ${req.params.id}`);
      error.statusCode = 404;
      return next(error);
    }

    return sendSuccess(res, 200, 'Reclamation fetched successfully', { data: reclamation });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a reclamation (sujet, description, categorie, priorite)
 * @route   PUT /api/reclamations/:id
 * @access  Public
 */
const updateReclamation = async (req, res, next) => {
  try {
    const allowedFields = ['sujet', 'description', 'categorie', 'priorite', 'piecesJointes'];

    // Strip unknown fields from the update payload
    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(updateData).length === 0) {
      const error = new Error('No valid fields provided for update');
      error.statusCode = 400;
      return next(error);
    }

    const reclamation = await Reclamation.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!reclamation) {
      const error = new Error(`Reclamation not found with ID: ${req.params.id}`);
      error.statusCode = 404;
      return next(error);
    }

    return sendSuccess(res, 200, 'Reclamation updated successfully', { data: reclamation });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a reclamation
 * @route   DELETE /api/reclamations/:id
 * @access  Public
 */
const deleteReclamation = async (req, res, next) => {
  try {
    const reclamation = await Reclamation.findByIdAndDelete(req.params.id);

    if (!reclamation) {
      const error = new Error(`Reclamation not found with ID: ${req.params.id}`);
      error.statusCode = 404;
      return next(error);
    }

    return sendSuccess(res, 200, 'Reclamation deleted successfully', { data: { id: req.params.id } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update reclamation status + optional response (admin action)
 * @route   PATCH /api/reclamations/:id/statut
 * @access  Public
 */
const updateStatut = async (req, res, next) => {
  try {
    const { statut, reponse } = req.body;

    const updateData = { statut };
    if (reponse !== undefined) updateData.reponse = reponse;

    const reclamation = await Reclamation.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!reclamation) {
      const error = new Error(`Reclamation not found with ID: ${req.params.id}`);
      error.statusCode = 404;
      return next(error);
    }

    return sendSuccess(res, 200, 'Reclamation status updated successfully', { data: reclamation });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReclamation,
  getAllReclamations,
  getReclamationById,
  updateReclamation,
  deleteReclamation,
  updateStatut,
};
