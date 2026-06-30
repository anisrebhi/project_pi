/**
 * @file models/Certificate.js
<<<<<<< HEAD
 * @description Participation certificate model.
 * Status flow: pending → validated → sent → downloaded
 */
const mongoose = require('mongoose');

const STATUS = ['pending', 'validated', 'sent', 'downloaded'];

=======
 * @description Participation certificate model — generated after event ends.
 */
const mongoose = require('mongoose');

>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
const certificateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
<<<<<<< HEAD
      required: [true, 'User is required'],
=======
      required: true,
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
<<<<<<< HEAD
      required: [true, 'Event is required'],
=======
      required: true,
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
    },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
<<<<<<< HEAD
      required: [true, 'Reservation is required'],
    },
=======
      required: true,
    },
    // Unique verification code (UUID-like)
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
    verificationCode: {
      type: String,
      required: true,
      unique: true,
<<<<<<< HEAD
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
=======
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
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
    toObject: { virtuals: true },
  }
);

<<<<<<< HEAD
// ── Indexes ───────────────────────────────────────────────────────────────────
certificateSchema.index({ user: 1, event: 1 }, { unique: true }); // no duplicates
certificateSchema.index({ event: 1, status: 1 });
certificateSchema.index({ verificationCode: 1 });
certificateSchema.index({ user: 1, status: 1 });

// ── Virtuals ──────────────────────────────────────────────────────────────────
certificateSchema.virtual('isValidated').get(function () {
  return this.status !== 'pending';
});
=======
certificateSchema.index({ user: 1, event: 1 }, { unique: true });
certificateSchema.index({ verificationCode: 1 });
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3

module.exports = mongoose.model('Certificate', certificateSchema);
