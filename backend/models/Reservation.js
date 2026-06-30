const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
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
    numberOfTickets: {
      type: Number,
      required: [true, 'Number of tickets is required'],
      min: [1, 'At least 1 ticket required'],
      max: [20, 'Cannot book more than 20 tickets at once'],
    },
    // Ticket type selected (Standard / VIP / Premium / Etudiant). Null for events
    // that don't define ticketTypes (legacy flat pricing on the event itself).
    ticketType: {
      type: String,
      enum: { values: ['Standard', 'VIP', 'Premium', 'Etudiant', null], message: '{VALUE} is not a valid ticket type' },
      default: null,
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: [0, 'Unit price cannot be negative'],
    },
    isEarlyBird: {
      type: Boolean,
      default: false,
    },
    promoCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative'],
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: [0, 'Total price cannot be negative'],
    },
    reservationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },
    // Base64 PNG data URL of the ticket QR code (generated once the reservation is confirmed)
    qrCode: {
      type: String,
      default: null,
    },
    // Timestamp of when the confirmation email (with QR code / ticket) was sent to the user
    confirmationSentAt: {
      type: Date,
      default: null,
    },
    // Timestamp of when the 24-hour reminder email was sent
    reminderSentAt: {
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


reservationSchema.index({ status: 1 });
reservationSchema.index({ event: 1 });


reservationSchema.index(
  { user: 1, event: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: 'cancelled' } },
  }
);

module.exports = mongoose.model('Reservation', reservationSchema);
