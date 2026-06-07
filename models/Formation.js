const mongoose = require('mongoose');

// ── Sub-schema: Session (1 day or multi-day) ──────────────────────────────────
const sessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Session start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'Session end date is required'],
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    maxCapacity: {
      type: Number,
      min: [1, 'Session capacity must be at least 1'],
      default: null,
    },
  },
  { _id: true }
);

sessionSchema.virtual('isMultiDay').get(function () {
  if (!this.startDate || !this.endDate) return false;
  return (this.endDate - this.startDate) / (1000 * 60 * 60 * 24) >= 1;
});

sessionSchema.virtual('durationDays').get(function () {
  if (!this.startDate || !this.endDate) return null;
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// ── Sub-schema: Resource ──────────────────────────────────────────────────────
const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['document', 'video', 'equipment', 'software', 'other'],
      default: 'other',
    },
    url: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    quantity: {
      type: Number,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
  },
  { _id: true }
);

// ── Main Formation schema ─────────────────────────────────────────────────────
const formationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Formation title is required'],
      minlength: [3, 'Title must be at least 3 characters'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    level: {
      type: String,
      enum: {
        values: ['Beginner', 'Intermediate', 'Advanced'],
        message: '{VALUE} is not a valid level',
      },
      required: [true, 'Level is required'],
    },
    category: {
      type: String,
      enum: ['technical', 'soft-skills', 'management', 'security', 'other'],
      default: 'other',
    },
    instructor: {
      type: String,
      required: [true, 'Instructor name is required'],
      trim: true,
    },
    // Global capacity (used when no per-session capacity is defined)
    capacity: {
      type: Number,
      min: [1, 'Capacity must be at least 1'],
      default: null,
    },
    // Sessions: 1-day or multi-day blocks
    sessions: {
      type: [sessionSchema],
      default: [],
    },
    // Resources: equipment, documents, software, etc.
    resources: {
      type: [resourceSchema],
      default: [],
    },
    // Many-to-Many relation: users who enrolled
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['Active', 'Archived', 'Draft'],
      default: 'Active',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
formationSchema.index({ title: 'text', description: 'text' });
formationSchema.index({ status: 1 });
formationSchema.index({ level: 1 });
formationSchema.index({ category: 1 });

// ── Virtuals ──────────────────────────────────────────────────────────────────
formationSchema.virtual('participantCount').get(function () {
  return this.participants ? this.participants.length : 0;
});

formationSchema.virtual('isFull').get(function () {
  if (!this.capacity) return false;
  return this.participants.length >= this.capacity;
});

formationSchema.virtual('spotsLeft').get(function () {
  if (!this.capacity) return null;
  return Math.max(0, this.capacity - this.participants.length);
});

formationSchema.virtual('totalDurationDays').get(function () {
  if (!this.sessions || this.sessions.length === 0) return null;
  return this.sessions.reduce((sum, s) => {
    if (!s.startDate || !s.endDate) return sum;
    return sum + Math.ceil((s.endDate - s.startDate) / (1000 * 60 * 60 * 24));
  }, 0);
});

// ── Pre-save: validate session dates ──────────────────────────────────────────
formationSchema.pre('save', function (next) {
  for (const session of this.sessions) {
    if (session.endDate <= session.startDate) {
      return next(new Error(`Session "${session.title}": end date must be after start date`));
    }
  }
  next();
});

// ── Soft-delete filter ────────────────────────────────────────────────────────
formationSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

module.exports = mongoose.model('Formation', formationSchema);
