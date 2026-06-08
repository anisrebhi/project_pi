/**
 * @file controllers/registrationController.js
 * @description QR code-based event registration — generate ticket, scan at entry.
 */

const Event = require("../models/Event");
const { User } = require("../models/User");
const Registration = require("../models/Registration");
const { generateQRToken, verifyQRToken } = require("../utils/generateToken");
const { sendQRCodeEmail } = require("../services/emailService");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// ─── Register to Event (generates QR ticket) ──────────────────────────────────

/**
 * @desc    Register authenticated user to an event and send QR code by email
 * @route   POST /api/events/:eventId/register-qr
 * @access  Private
 */
const registerWithQR = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // 1. Fetch event
    const event = await Event.findById(eventId);
    if (!event) return sendError(res, 404, `Event with ID "${eventId}" not found.`);

    // 2. Check past / capacity
    if (event.isPast) return sendError(res, 400, "Cannot register for a past event.");
    if (!event.hasCapacity())
      return sendError(res, 400, `Event "${event.title}" has reached its capacity of ${event.capacity}.`);

    // 3. Prevent duplicate registration
    const existing = await Registration.findOne({ userId, eventId });
    if (existing) {
      return sendError(res, 409, `You are already registered for "${event.title}".`);
    }

    // 4. Generate signed QR token
    const qrToken = generateQRToken(userId.toString(), eventId.toString());

    // 5. Save registration record
    const registration = await Registration.create({ userId, eventId, qrToken });

    // 6. Also update the many-to-many on Event + User (existing logic)
    await Promise.all([
      Event.findByIdAndUpdate(eventId, { $addToSet: { participants: userId } }),
      User.findByIdAndUpdate(userId, { $addToSet: { events: eventId } }),
    ]);

    // 7. Send QR code email (non-blocking)
    try {
      await sendQRCodeEmail(req.user, event, qrToken);
    } catch (emailError) {
      console.error("Failed to send QR email:", emailError.message);
    }

    return sendSuccess(res, 201, `Registration confirmed for "${event.title}". Your QR code has been sent by email.`, {
      registrationId: registration._id,
      event: { _id: event._id, title: event.title, date: event.date, location: event.location },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Scan QR Code at Entry ────────────────────────────────────────────────────

/**
 * @desc    Validate and consume a QR code at event entry (staff use)
 * @route   POST /api/registrations/scan
 * @access  Private — ADMIN or ORGANIZER
 */
const scanQRCode = async (req, res, next) => {
  try {
    const { qrData } = req.body;

    if (!qrData) return sendError(res, 400, "qrData is required.");

    // 1. Parse scanned content
    let payload;
    try {
      payload = JSON.parse(qrData);
    } catch {
      return sendError(res, 400, "Invalid QR code format.");
    }

    if (!payload.qrToken) return sendError(res, 400, "QR code is missing token.");

    // 2. Verify JWT signature + expiry
    let decoded;
    try {
      decoded = verifyQRToken(payload.qrToken);
    } catch (err) {
      if (err.name === "TokenExpiredError") return sendError(res, 400, "QR code has expired.");
      return sendError(res, 400, "QR code signature is invalid.");
    }

    // 3. Find registration record
    const registration = await Registration.findOne({ qrToken: payload.qrToken })
      .populate("userId", "fullName email")
      .populate("eventId", "title date location");

    if (!registration) return sendError(res, 404, "Registration not found for this QR code.");

    // 4. Single-use check
    if (registration.qrUsed) {
      return sendError(res, 409, `QR code already used at ${registration.checkedInAt?.toLocaleString("fr-FR") || "unknown time"}. Access denied.`);
    }

    // 5. Mark as used
    registration.qrUsed = true;
    registration.checkedInAt = new Date();
    await registration.save();

    return sendSuccess(res, 200, "✅ Access granted.", {
      participant: {
        name: registration.userId.fullName,
        email: registration.userId.email,
      },
      event: {
        title: registration.eventId.title,
        date: registration.eventId.date,
        location: registration.eventId.location,
      },
      checkedInAt: registration.checkedInAt,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get My Registrations ─────────────────────────────────────────────────────

/**
 * @desc    Get all QR registrations for the current user
 * @route   GET /api/registrations/my
 * @access  Private
 */
const getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ userId: req.user._id })
      .populate("eventId", "title date location")
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, "Registrations retrieved successfully.", registrations);
  } catch (error) {
    next(error);
  }
};

module.exports = { registerWithQR, scanQRCode, getMyRegistrations };
