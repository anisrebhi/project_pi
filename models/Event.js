/**
 * @file models/Event.js
 */
const mongoose = require("mongoose");

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
    isActive:  { type: Boolean, default: true },
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
    images: { type: [imageSchema], default: [] },
    qrCode: {
      type: String,
      default: null,
      // Stores a base64 PNG data URL generated automatically on create
      // and refreshable via PATCH /api/events/:id/qrcode
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
    this.find({ isActive: { $ne: false } });
  }
  next();
});

// ─── Pre-save hook ────────────────────────────────────────────────────────────
eventSchema.pre('save', function (next) {
  if (this.type === 'free') this.price = 0;
  if (this.type === 'paid' && (!this.price || this.price <= 0)) {
    return next(new Error('Paid events must have a price greater than 0'));
  }
  if (this.endDate && this.startDate && this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

// ─── Pre-update hook ──────────────────────────────────────────────────────────
eventSchema.pre('findOneAndUpdate', function (next) {
  const u = this.getUpdate().$set || this.getUpdate();
  if (u.type === 'free') u.price = 0;
  if (u.type === 'paid' && u.price !== undefined && u.price <= 0) {
    return next(new Error('Paid events must have a price greater than 0'));
  }
  if (u.startDate && u.endDate && u.endDate <= u.startDate) {
    return next(new Error('End date must be after start date'));
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

module.exports = mongoose.model('Event', eventSchema);
