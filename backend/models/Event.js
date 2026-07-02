/**
 * @file models/Event.js
 */
const mongoose = require("mongoose");
const { AppError } = require("../middleware/errorMiddleware");

const locationSchema = new mongoose.Schema(
  {
    address:   { type: String, trim: true, default: '' },
    latitude:  { type: Number, min: [-90, 'Latitude must be between -90 and 90'],  max: [90,  'Latitude must be between -90 and 90'],  default: null },
    longitude: { type: Number, min: [-180,'Longitude must be between -180 and 180'], max: [180,'Longitude must be between -180 and 180'], default: null },
  },
  { _id: false }
);

const imageSchema = new mongoose.Schema(
  {
    url:        { type: String, required: true, trim: true },
    filename:   { type: String, trim: true, default: '' },
    isUploaded: { type: Boolean, default: false },
  },
  { _id: false }
);

// ─── Ticket Types ─────────────────────────────────────────────────────────────
const TICKET_TYPE_NAMES = ['Standard', 'VIP', 'Premium', 'Etudiant'];

const earlyBirdSchema = new mongoose.Schema(
  {
    enabled:  { type: Boolean, default: false },
    price:    { type: Number, default: null, min: [0, 'Early bird price cannot be negative'] },
    deadline: { type: Date,   default: null },
  },
  { _id: false }
);

const ticketTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: { values: TICKET_TYPE_NAMES, message: '{VALUE} is not a valid ticket type' },
      required: [true, 'Ticket type name is required'],
    },
    price: {
      type: Number,
      required: [true, 'Ticket type price is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      default: null,
      min: [0, 'Quantity cannot be negative'],
    },
    earlyBird: { type: earlyBirdSchema, default: () => ({}) },
  },
  { _id: false }
);

ticketTypeSchema.pre('validate', function (next) {
  if (this.earlyBird?.enabled) {
    if (this.earlyBird.price === null || this.earlyBird.price === undefined) {
      return next(new Error(`Early bird price is required for ticket type "${this.name}" when early bird is enabled`));
    }
    if (this.earlyBird.price >= this.price) {
      return next(new Error(`Early bird price must be lower than the regular price for ticket type "${this.name}"`));
    }
    if (!this.earlyBird.deadline) {
      return next(new Error(`Early bird deadline is required for ticket type "${this.name}" when early bird is enabled`));
    }
  }
  next();
});

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    url:  { type: String, required: true, trim: true },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title must not exceed 150 characters'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description must not exceed 2000 characters'],
      default: '',
    },
    location: { type: locationSchema, default: () => ({}) },
    participationMode: {
      type: String,
      enum: {
        values: ['in-person', 'online', 'hybrid'],
        message: '{VALUE} is not a valid participation mode',
      },
      default: 'in-person',
    },
    videoConferenceLink: { type: String, trim: true, default: '' },
    tags: [{ type: String, trim: true }],
    conditions: { type: String, trim: true, default: '' },
    attachments: { type: [attachmentSchema], default: [] },
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate:   { type: Date, required: [true, 'End date is required'] },
    category: {
      type: String,
      enum: {
        values: ['conference', 'workshop', 'meeting', 'sport', 'other'],
        message: '{VALUE} is not a valid category',
      },
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [100000, 'Capacity cannot exceed 100,000'],
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required'],
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive:   { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    type: {
      type: String,
      enum: {
        values: ['free', 'paid'],
        message: '{VALUE} is not a valid type. Use "free" or "paid"',
      },
      default: 'free',
    },
    price:  { type: Number, default: 0, min: [0, 'Price cannot be negative'] },
    ticketTypes: { type: [ticketTypeSchema], default: [] },
    maxTicketsPerUser: { type: Number, default: 20, min: [1, 'maxTicketsPerUser must be at least 1'], max: [20, 'maxTicketsPerUser cannot exceed 20'] },
    images: { type: [imageSchema], default: [] },
    qrCode: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
eventSchema.index({ organizer: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ isActive: 1 });
eventSchema.index({ title: 'text', description: 'text' });

// ─── Soft Delete Query Middleware ─────────────────────────────────────────────
eventSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeSoftDeleted) {
    this.find({ isActive: { $ne: false }, isArchived: { $ne: true } });
  }
  next();
});

// ─── Pre-save hook ────────────────────────────────────────────────────────────
eventSchema.pre('save', function (next) {
  if (this.type === 'free') this.price = 0;
  if (this.type === 'paid' && (!this.price || this.price <= 0)) {
    return next(new AppError('Paid events must have a price greater than 0', 400));
  }
  if (this.isNew && this.startDate && this.startDate.getTime() <= Date.now()) {
    return next(new AppError('Event start date must be in the future. Creating an event with a past date is not allowed.', 400));
  }
  if (this.endDate && this.startDate && this.endDate <= this.startDate) {
    return next(new AppError('End date must be after start date', 400));
  }
  next();
});

// ─── Pre-update hook ──────────────────────────────────────────────────────────
eventSchema.pre('findOneAndUpdate', function (next) {
  const u = this.getUpdate().$set || this.getUpdate();
  if (u.type === 'free') u.price = 0;
  if (u.type === 'paid' && u.price !== undefined && u.price <= 0) {
    return next(new AppError('Paid events must have a price greater than 0', 400));
  }
  if (u.startDate && new Date(u.startDate).getTime() <= Date.now()) {
    return next(new AppError('startDate must be a future date. An event cannot be rescheduled to a past date.', 400));
  }
  if (u.startDate && u.endDate && u.endDate <= u.startDate) {
    return next(new AppError('End date must be after start date', 400));
  }
  next();
});

// ─── Virtuals ─────────────────────────────────────────────────────────────────
eventSchema.virtual('participantCount').get(function () {
  return this.participants ? this.participants.length : 0;
});
eventSchema.virtual('availableSpots').get(function () {
  const registered = this.participants ? this.participants.length : 0;
  return Math.max(0, this.capacity - registered);
});
eventSchema.virtual('isFull').get(function () {
  return this.participants ? this.participants.length >= this.capacity : false;
});
eventSchema.virtual('isPast').get(function () {
  return (this.endDate || this.startDate) < new Date();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────
eventSchema.methods.hasParticipant = function (userId) {
  return this.participants.some((id) => id.toString() === userId.toString());
};
eventSchema.methods.hasCapacity = function () {
  return this.participants.length < this.capacity;
};
eventSchema.methods.softDelete = async function () {
  this.isActive = false;
  this.deletedAt = new Date();
  return await this.save();
};

eventSchema.methods.getTicketPrice = function (ticketTypeName) {
  if (!this.ticketTypes || this.ticketTypes.length === 0) {
    return { unitPrice: this.price, isEarlyBird: false, ticketType: null };
  }
  const tt = this.ticketTypes.find((t) => t.name === ticketTypeName);
  if (!tt) return null;

  const earlyBirdActive = !!(
    tt.earlyBird?.enabled &&
    tt.earlyBird.deadline &&
    tt.earlyBird.deadline.getTime() > Date.now()
  );

  return {
    unitPrice: earlyBirdActive ? tt.earlyBird.price : tt.price,
    isEarlyBird: earlyBirdActive,
    ticketType: tt,
  };
};

module.exports = mongoose.model('Event', eventSchema);
module.exports.TICKET_TYPE_NAMES = TICKET_TYPE_NAMES;
