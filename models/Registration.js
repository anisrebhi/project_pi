/**
 * @file models/Registration.js
 * @description Tracks event registrations with QR code tokens.
 *              Separate from the User.events[] many-to-many for QR-specific data.
 */

const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    // Signed JWT stored here for quick lookup + validation
    qrToken: {
      type: String,
      unique: true,
      required: true,
    },

    // QR is single-use
    qrUsed: {
      type: Boolean,
      default: false,
    },

    checkedInAt: {
      type: Date,
      default: null,
    },

    // Reminder tracking — prevent duplicate reminders
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });
registrationSchema.index({ qrToken: 1 });
registrationSchema.index({ eventId: 1, reminderSent: 1 });

const Registration = mongoose.model("Registration", registrationSchema);

module.exports = Registration;
