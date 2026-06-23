/**
 * @file models/Certificate.js
 * @description Participation certificate model — generated after event ends.
 */
const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      required: true,
    },
    // Unique verification code (UUID-like)
    verificationCode: {
      type: String,
      required: true,
      unique: true,
    },
    // When the certificate was generated
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    // Whether the certificate email has been sent
    emailSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

certificateSchema.index({ user: 1, event: 1 }, { unique: true });
certificateSchema.index({ verificationCode: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);
