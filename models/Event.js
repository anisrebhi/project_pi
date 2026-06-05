/**
 * @file models/Event.js
 * @description Mongoose Event model — stores event data, organizer reference,
 *              and Many-to-Many participant references. Implements soft delete.
 */

const mongoose = require("mongoose");

// ─── Schema Definition ────────────────────────────────────────────────────────

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [150, "Title must not exceed 150 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description must not exceed 2000 characters"],
      default: "",
    },

    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: [200, "Location must not exceed 200 characters"],
    },

    date: {
      type: Date,
      required: [true, "Event date is required"],
      validate: {
        validator: function (value) {
          // Date must be in the future (only on creation)
          return this.isNew ? value > new Date() : true;
        },
        message: "Event date must be in the future",
      },
    },

    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
      max: [100000, "Capacity cannot exceed 100,000"],
    },

    // ─── Relations ────────────────────────────────────────────────

    /**
     * One-to-Many: One organizer (User with ORGANIZER/ADMIN role) → Many events
     */
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Organizer is required"],
    },

    /**
     * Many-to-Many: Event ↔ User (participants)
     * Mirrored by User.events[]
     */
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ─── Soft Delete ──────────────────────────────────────────────

    isActive: {
      type: Boolean,
      default: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

eventSchema.index({ organizer: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ isActive: 1 });
eventSchema.index({ title: "text", description: "text", location: "text" });

// ─── Query Middleware: Soft Delete Filter ─────────────────────────────────────

eventSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeSoftDeleted) {
    this.find({ isActive: { $ne: false } });
  }
  next();
});

// ─── Virtual Fields ───────────────────────────────────────────────────────────

/**
 * Number of participants currently registered
 */
eventSchema.virtual("participantCount").get(function () {
  return this.participants ? this.participants.length : 0;
});

/**
 * Remaining spots available
 */
eventSchema.virtual("availableSpots").get(function () {
  const registered = this.participants ? this.participants.length : 0;
  return Math.max(0, this.capacity - registered);
});

/**
 * Whether the event has reached full capacity
 */
eventSchema.virtual("isFull").get(function () {
  return this.participants
    ? this.participants.length >= this.capacity
    : false;
});

/**
 * Whether the event date has passed
 */
eventSchema.virtual("isPast").get(function () {
  return this.date < new Date();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

/**
 * Check if a user is already registered as a participant
 * @param {ObjectId} userId
 * @returns {boolean}
 */
eventSchema.methods.hasParticipant = function (userId) {
  return this.participants.some((id) => id.toString() === userId.toString());
};

/**
 * Check if event has available capacity
 * @returns {boolean}
 */
eventSchema.methods.hasCapacity = function () {
  return this.participants.length < this.capacity;
};

/**
 * Soft delete the event
 * @returns {Promise<Event>}
 */
eventSchema.methods.softDelete = async function () {
  this.isActive = false;
  this.deletedAt = new Date();
  return await this.save();
};

// ─── Export ───────────────────────────────────────────────────────────────────

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
