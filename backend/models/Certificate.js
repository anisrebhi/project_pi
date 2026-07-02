/**
 * @file models/Certificate.js
 * @description Participation certificate model.
 * Status flow: pending → validated → sent → downloaded
 */
const mongoose = require('mongoose');

const STATUS = ['pending', 'validated', 'sent', 'downloaded'];

const certificateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
    },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      required: [true, 'Reservation is required'],
    },
    verificationCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: { values: STATUS, message: '{VALUE} is not a valid certificate status' },
      default: 'pending',
    },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    validatedAt:   { type: Date, default: null },
    issuedAt:      { type: Date, default: Date.now },
    emailSentAt:   { type: Date, default: null },
    downloadedAt:  { type: Date, default: null },
    downloadCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
certificateSchema.index({ user: 1, event: 1 }, { unique: true });
certificateSchema.index({ event: 1, status: 1 });
certificateSchema.index({ verificationCode: 1 });
certificateSchema.index({ user: 1, status: 1 });

// ── Virtuals ──────────────────────────────────────────────────────────────────
certificateSchema.virtual('isValidated').get(function () {
  return this.status !== 'pending';
});

module.exports = mongoose.model('Certificate', certificateSchema);
