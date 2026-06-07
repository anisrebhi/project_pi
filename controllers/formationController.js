const Formation = require('../models/Formation');

// ── Helper ────────────────────────────────────────────────────────────────────
const buildPagination = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: page > 1,
});

// @desc  Get all formations  GET /api/formations
exports.getAllFormations = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.level)    filter.level    = req.query.level;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search)   filter.$text    = { $search: req.query.search };

    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    const [formations, total] = await Promise.all([
      Formation.find(filter)
        .populate('participants', 'name email')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      Formation.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      ...buildPagination(total, page, limit),
      data: formations,
    });
  } catch (error) { next(error); }
};

// @desc  Get formation by ID  GET /api/formations/:id
exports.getFormationById = async (req, res, next) => {
  try {
    const formation = await Formation.findById(req.params.id)
      .populate('participants', 'name email');

    if (!formation)
      return res.status(404).json({ success: false, message: 'Formation not found' });

    return res.status(200).json({ success: true, data: formation });
  } catch (error) { next(error); }
};

// @desc  Create formation  POST /api/formations
exports.createFormation = async (req, res, next) => {
  try {
    const formation = await Formation.create(req.body);
    await formation.populate('participants', 'name email');
    return res.status(201).json({ success: true, data: formation });
  } catch (error) { next(error); }
};

// @desc  Update formation  PUT /api/formations/:id
exports.updateFormation = async (req, res, next) => {
  try {
    delete req.body.participants; // managed via enroll routes only

    const formation = await Formation.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    ).populate('participants', 'name email');

    if (!formation)
      return res.status(404).json({ success: false, message: 'Formation not found' });

    return res.status(200).json({ success: true, data: formation });
  } catch (error) { next(error); }
};

// @desc  Soft delete formation  DELETE /api/formations/:id
exports.deleteFormation = async (req, res, next) => {
  try {
    const formation = await Formation.findByIdAndUpdate(
      req.params.id, { isDeleted: true, status: 'Archived' }, { new: true }
    );

    if (!formation)
      return res.status(404).json({ success: false, message: 'Formation not found' });

    return res.status(200).json({ success: true, message: 'Formation deleted successfully' });
  } catch (error) { next(error); }
};

// @desc  Enroll user  POST /api/formations/:id/enroll   body: { userId }
exports.enrollUser = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId)
      return res.status(400).json({ success: false, message: 'userId is required' });

    const formation = await Formation.findById(req.params.id);
    if (!formation)
      return res.status(404).json({ success: false, message: 'Formation not found' });

    if (formation.participants.map(String).includes(String(userId)))
      return res.status(409).json({ success: false, message: 'User already enrolled' });

    if (formation.capacity && formation.participants.length >= formation.capacity)
      return res.status(409).json({ success: false, message: `Formation is full (capacity: ${formation.capacity})` });

    formation.participants.push(userId);
    await formation.save();
    await formation.populate('participants', 'name email');

    return res.status(200).json({
      success: true,
      message: 'User enrolled successfully',
      spotsLeft: formation.spotsLeft,
      data: formation,
    });
  } catch (error) { next(error); }
};

// @desc  Unenroll user  DELETE /api/formations/:id/enroll/:userId
exports.unenrollUser = async (req, res, next) => {
  try {
    const formation = await Formation.findById(req.params.id);
    if (!formation)
      return res.status(404).json({ success: false, message: 'Formation not found' });

    const before = formation.participants.length;
    formation.participants = formation.participants.filter(
      (p) => String(p) !== String(req.params.userId)
    );

    if (formation.participants.length === before)
      return res.status(404).json({ success: false, message: 'User not enrolled' });

    await formation.save();
    return res.status(200).json({ success: true, message: 'User unenrolled successfully' });
  } catch (error) { next(error); }
};

// @desc  Get participants  GET /api/formations/:id/participants
exports.getParticipants = async (req, res, next) => {
  try {
    const formation = await Formation.findById(req.params.id)
      .populate('participants', 'name email createdAt');

    if (!formation)
      return res.status(404).json({ success: false, message: 'Formation not found' });

    return res.status(200).json({
      success: true,
      count: formation.participants.length,
      capacity: formation.capacity,
      spotsLeft: formation.spotsLeft,
      data: formation.participants,
    });
  } catch (error) { next(error); }
};

// @desc  Add session  POST /api/formations/:id/sessions
exports.addSession = async (req, res, next) => {
  try {
    const formation = await Formation.findById(req.params.id);
    if (!formation)
      return res.status(404).json({ success: false, message: 'Formation not found' });

    formation.sessions.push(req.body);
    await formation.save();

    return res.status(201).json({
      success: true,
      message: 'Session added',
      data: formation.sessions[formation.sessions.length - 1],
    });
  } catch (error) { next(error); }
};

// @desc  Update session  PUT /api/formations/:id/sessions/:sessionId
exports.updateSession = async (req, res, next) => {
  try {
    const formation = await Formation.findById(req.params.id);
    if (!formation)
      return res.status(404).json({ success: false, message: 'Formation not found' });

    const session = formation.sessions.id(req.params.sessionId);
    if (!session)
      return res.status(404).json({ success: false, message: 'Session not found' });

    Object.assign(session, req.body);
    await formation.save();
    return res.status(200).json({ success: true, data: session });
  } catch (error) { next(error); }
};

// @desc  Delete session  DELETE /api/formations/:id/sessions/:sessionId
exports.deleteSession = async (req, res, next) => {
  try {
    const formation = await Formation.findById(req.params.id);
    if (!formation)
      return res.status(404).json({ success: false, message: 'Formation not found' });

    const session = formation.sessions.id(req.params.sessionId);
    if (!session)
      return res.status(404).json({ success: false, message: 'Session not found' });

    session.deleteOne();
    await formation.save();
    return res.status(200).json({ success: true, message: 'Session deleted' });
  } catch (error) { next(error); }
};

// @desc  Get resources  GET /api/formations/:id/resources
exports.getResources = async (req, res, next) => {
  try {
    const formation = await Formation.findById(req.params.id).select('title resources');
    if (!formation)
      return res.status(404).json({ success: false, message: 'Formation not found' });

    return res.status(200).json({
      success: true,
      count: formation.resources.length,
      data: formation.resources,
    });
  } catch (error) { next(error); }
};

// @desc  Add resource  POST /api/formations/:id/resources
exports.addResource = async (req, res, next) => {
  try {
    const formation = await Formation.findById(req.params.id);
    if (!formation)
      return res.status(404).json({ success: false, message: 'Formation not found' });

    formation.resources.push(req.body);
    await formation.save();

    return res.status(201).json({
      success: true,
      message: 'Resource added',
      data: formation.resources[formation.resources.length - 1],
    });
  } catch (error) { next(error); }
};

// @desc  Update resource  PUT /api/formations/:id/resources/:resourceId
exports.updateResource = async (req, res, next) => {
  try {
    const formation = await Formation.findById(req.params.id);
    if (!formation)
      return res.status(404).json({ success: false, message: 'Formation not found' });

    const resource = formation.resources.id(req.params.resourceId);
    if (!resource)
      return res.status(404).json({ success: false, message: 'Resource not found' });

    Object.assign(resource, req.body);
    await formation.save();
    return res.status(200).json({ success: true, data: resource });
  } catch (error) { next(error); }
};

// @desc  Delete resource  DELETE /api/formations/:id/resources/:resourceId
exports.deleteResource = async (req, res, next) => {
  try {
    const formation = await Formation.findById(req.params.id);
    if (!formation)
      return res.status(404).json({ success: false, message: 'Formation not found' });

    const resource = formation.resources.id(req.params.resourceId);
    if (!resource)
      return res.status(404).json({ success: false, message: 'Resource not found' });

    resource.deleteOne();
    await formation.save();
    return res.status(200).json({ success: true, message: 'Resource deleted' });
  } catch (error) { next(error); }
};
