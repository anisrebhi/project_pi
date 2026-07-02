/**
 * @file models/WaitlistEntry.js
 * @description Waitlist entry for a fully-booked event.
 * When the event regains capacity (a reservation is cancelled), the entry
 * at position 1 (ordered by `createdAt`) is automatically promoted to a
 * confirmed reservation and the user is notified by email.
 */
const mongoose = require('mongoose');

const waitlistEntrySchema = new mongoose.Schema(
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
    // Desired ticket type (Standard / VIP / Premium / Étudiant). Null for flat-price events.
    ticketType: {
      type: String,
      enum: { values: ['Standard', 'VIP', 'Premium', 'Etudiant', null], message: '{VALUE} is not a valid ticket type' },
      default: null,
    },
    // Number of tickets the user wants — bounded by event.maxTicketsPerUser at join time.
    numberOfTickets: {
      type: Number,
      required: [true, 'Number of tickets is required'],
      min: [1, 'At least 1 ticket required'],
      max: [20, 'Cannot waitlist more than 20 tickets'],
      default: 1,
    },
    status: {
      type: String,
      enum: { values: ['waiting', 'notified', 'promoted', 'expired', 'removed'], message: '{VALUE} is not a valid waitlist status' },
      default: 'waiting',
    },
    // When we sent the "a spot opened up" notification
    notifiedAt: { type: Date, default: null },
    // When the entry was converted to an actual reservation
    promotedAt: { type: Date, default: null },
    // Reference to the reservation created on promotion
    reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// One active waitlist entry per user per event
waitlistEntrySchema.index(
  { user: 1, event: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['waiting', 'notified'] } },
    name: 'unique_active_waitlist',
  }
);
waitlistEntrySchema.index({ event: 1, status: 1, createdAt: 1 });

module.exports = mongoose.model('WaitlistEntry', waitlistEntrySchema);
