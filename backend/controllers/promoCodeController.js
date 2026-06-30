/**
 * @file controllers/promoCodeController.js
 * @description Promo code management — create/list/update/delete (ORGANIZER/ADMIN)
 *              and a lightweight validation endpoint usable by any authenticated
 *              participant before/while creating a reservation.
 */
const PromoCode = require('../models/PromoCode');
const Event = require('../models/Event');
const { ROLES } = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const ok = (res, code, message, data = {}) =>
  res.status(code).json({ success: true, statusCode: code, message, ...data });

// ─── Create Promo Code ─────────────────────────────────────────────────────

const createPromoCode = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, eventId, maxUses, expiresAt } = req.body;

    if (eventId) {
      const event = await Event.findById(eventId);
      if (!event) return sendError(res, 404, `Event with ID "${eventId}" not found.`);

      const isAdmin = req.user.role === ROLES.ADMIN;
      const isOrganizer = event.organizer.toString() === req.user._id.toString();
      if (!isAdmin && !isOrganizer) {
        return sendError(res, 403, 'Access denied. Only the event organizer or an ADMIN can create a promo code for this event.');
      }
    }

    const promoCode = await PromoCode.create({
      code,
      discountType,
      discountValue,
      event: eventId || null,
      maxUses: maxUses ?? null,
      expiresAt: expiresAt || null,
      createdBy: req.user._id,
    });

    return ok(res, 201, 'Promo code created successfully', { data: promoCode });
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 409, 'This promo code already exists for the selected event/scope.');
    }
    next(err);
  }
};

// ─── List Promo Codes ──────────────────────────────────────────────────────

const getAllPromoCodes = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.eventId) filter.event = req.query.eventId;

    // ORGANIZER only ever sees codes they created; ADMIN sees everything.
    if (req.user.role !== ROLES.ADMIN) filter.createdBy = req.user._id;

    const promoCodes = await PromoCode.find(filter)
      .populate('event', 'title')
      .sort({ createdAt: -1 });

    return ok(res, 200, 'Promo codes fetched successfully', { data: promoCodes });
  } catch (err) { next(err); }
};

// ─── Update Promo Code ──────────────────────────────────────────────────────

const updatePromoCode = async (req, res, next) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) return sendError(res, 404, `Promo code with ID "${req.params.id}" not found.`);

    const isAdmin = req.user.role === ROLES.ADMIN;
    const isOwner = promoCode.createdBy.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return sendError(res, 403, 'Access denied. Only the creator or an ADMIN can update this promo code.');
    }

    const allowed = ['discountType', 'discountValue', 'maxUses', 'expiresAt', 'isActive'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) promoCode[key] = req.body[key];
    }
    await promoCode.save();

    return sendSuccess(res, 200, 'Promo code updated successfully.', promoCode);
  } catch (err) { next(err); }
};

// ─── Delete Promo Code ──────────────────────────────────────────────────────

const deletePromoCode = async (req, res, next) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) return sendError(res, 404, `Promo code with ID "${req.params.id}" not found.`);

    const isAdmin = req.user.role === ROLES.ADMIN;
    const isOwner = promoCode.createdBy.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return sendError(res, 403, 'Access denied. Only the creator or an ADMIN can delete this promo code.');
    }

    await promoCode.deleteOne();
    return sendSuccess(res, 200, 'Promo code deleted successfully.', { id: req.params.id });
  } catch (err) { next(err); }
};

// ─── Validate Promo Code (any authenticated user, for checkout preview) ────

const validatePromoCode = async (req, res, next) => {
  try {
    const { code, eventId } = req.query;
    if (!code || !eventId) {
      return sendError(res, 400, 'Both "code" and "eventId" query parameters are required.');
    }

    const event = await Event.findById(eventId);
    if (!event) return sendError(res, 404, `Event with ID "${eventId}" not found.`);

    const promoCode = await PromoCode.findOne({
      code: code.trim().toUpperCase(),
      $or: [{ event: eventId }, { event: null }],
    });

    if (!promoCode) {
      return sendError(res, 404, 'Invalid promo code for this event.');
    }

    const validity = promoCode.isValidNow();
    if (!validity.ok) {
      return sendError(res, 400, validity.reason);
    }

    return ok(res, 200, 'Promo code is valid.', {
      data: {
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
      },
    });
  } catch (err) { next(err); }
};

module.exports = {
  createPromoCode,
  getAllPromoCodes,
  updatePromoCode,
  deletePromoCode,
  validatePromoCode,
};
