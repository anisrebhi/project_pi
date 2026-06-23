/**
 * @file controllers/messageController.js
 * @description Real-time chat REST endpoints (Socket.IO handles the live part).
 */
const Message     = require('../models/Message');
const Event       = require('../models/Event');
const Reservation = require('../models/Reservation');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/** Check if user is allowed to access event chat */
const canAccessChat = async (user, event) => {
  if (!event) return false;
  const isOrganizer = event.organizer.toString() === user._id.toString();
  const isAdmin     = user.role === 'ADMIN';
  if (isOrganizer || isAdmin) return true;
  const reservation = await Reservation.findOne({ event: event._id, user: user._id, status: 'confirmed' });
  return !!reservation;
};

/** GET /api/messages/:eventId — Load chat history */
const getMessages = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return sendError(res, 404, 'Événement introuvable');

    if (!(await canAccessChat(req.user, event))) {
      return sendError(res, 403, 'Accès au chat réservé aux participants inscrits');
    }

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip  = (page - 1) * limit;

    const messages = await Message.find({ event: req.params.eventId })
      .populate('sender', 'fullName role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Mark as read
    await Message.updateMany(
      { event: req.params.eventId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    return sendSuccess(res, 200, 'Messages', { messages: messages.reverse(), page, limit });
  } catch (err) {
    return sendError(res, 500, 'Erreur lors du chargement des messages');
  }
};

/** POST /api/messages/:eventId — Send a message (also via Socket.IO emit) */
const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return sendError(res, 400, 'Le message ne peut pas être vide');

    const event = await Event.findById(req.params.eventId);
    if (!event) return sendError(res, 404, 'Événement introuvable');

    if (!(await canAccessChat(req.user, event))) {
      return sendError(res, 403, 'Accès au chat réservé aux participants inscrits');
    }

    const message = await Message.create({
      event:   req.params.eventId,
      sender:  req.user._id,
      content: content.trim(),
      readBy:  [req.user._id],
    });

    const populated = await message.populate('sender', 'fullName role');

    // Emit via Socket.IO (if available)
    if (req.io) {
      req.io.to(`event-${req.params.eventId}`).emit('new-message', populated);
    }

    return sendSuccess(res, 201, 'Message envoyé', { message: populated });
  } catch (err) {
    return sendError(res, 500, 'Erreur lors de l\'envoi du message');
  }
};

/** GET /api/messages/:eventId/unread-count */
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      event:  req.params.eventId,
      readBy: { $ne: req.user._id },
      sender: { $ne: req.user._id },
    });
    return sendSuccess(res, 200, 'Compteur non lus', { count });
  } catch (err) {
    return sendError(res, 500, 'Erreur');
  }
};

/** DELETE /api/messages/:id — Admin or sender can delete */
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return sendError(res, 404, 'Message introuvable');
    const isOwner = message.sender.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'ADMIN') return sendError(res, 403, 'Accès refusé');
    await message.deleteOne();
    return sendSuccess(res, 200, 'Message supprimé');
  } catch (err) {
    return sendError(res, 500, 'Erreur lors de la suppression');
  }
};

module.exports = { getMessages, sendMessage, getUnreadCount, deleteMessage };
