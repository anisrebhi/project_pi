<<<<<<< HEAD
/**
 * @file models/User.js
 * @description Mongoose User model — stores credentials, roles, and event references.
 *              Implements soft delete via `isActive` flag.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ─── Enum Constants ───────────────────────────────────────────────────────────

const ROLES = {
  ADMIN: "ADMIN",
  ORGANIZER: "ORGANIZER",
  PARTICIPANT: "PARTICIPANT",
};

// ─── Schema Definition ────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name must not exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never returned in queries by default
    },

    role: {
      type: String,
      enum: {
        values: Object.values(ROLES),
        message: "Role must be ADMIN, ORGANIZER, or PARTICIPANT",
      },
      default: ROLES.PARTICIPANT,
    },

    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-()]{7,20}$/, "Please provide a valid phone number"],
      default: null,
    },

    profileImage: {
      type: String,
      default: null,
    },

    // ─── Many-to-Many: User ↔ Event ──────────────────────────────
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],

    // ─── Soft Delete ──────────────────────────────────────────────
=======
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'staff'],
      default: 'staff',
    },
    phone: {
      type: String,
      trim: true,
    },
>>>>>>> 736ea0a (Travail de Elyes)
    isActive: {
      type: Boolean,
      default: true,
    },
<<<<<<< HEAD

    deletedAt: {
      type: Date,
      default: null,
    },

    // ─── Password Reset (optional) ────────────────────────────────
    passwordChangedAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// NOTE: email index is already created by `unique: true` in the schema field definition
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ fullName: "text", email: "text" }); // Text search index

// ─── Pre-Save Middleware: Hash Password ───────────────────────────────────────

userSchema.pre("save", async function (next) {
  // Only hash if password field is new or modified
  if (!this.isModified("password")) return next();

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, saltRounds);

  // Update passwordChangedAt if not a new document
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }

  next();
});

// ─── Query Middleware: Filter Soft-Deleted ────────────────────────────────────

// Automatically exclude soft-deleted users from find queries
userSchema.pre(/^find/, function (next) {
  // `this` refers to the query object
  if (!this.getOptions().includeSoftDeleted) {
    this.find({ isActive: { $ne: false } });
  }
  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

/**
 * Compare a plain-text password with the stored hashed password
 * @param {string} candidatePassword - The password to verify
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Perform soft delete by setting isActive to false
 * @returns {Promise<User>}
 */
userSchema.methods.softDelete = async function () {
  this.isActive = false;
  this.deletedAt = new Date();
  return await this.save();
};

/**
 * Remove password and sensitive fields from JSON output
 */
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordChangedAt;
  delete obj.deletedAt;
  return obj;
};

// ─── Static Methods ───────────────────────────────────────────────────────────

/**
 * Find user by email with password included (for authentication)
 * @param {string} email
 * @returns {Promise<User|null>}
 */
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email, isActive: true }).select("+password");
};

// ─── Virtual Fields ───────────────────────────────────────────────────────────

userSchema.virtual("eventCount").get(function () {
  return this.events ? this.events.length : 0;
});

// ─── Export ───────────────────────────────────────────────────────────────────

const User = mongoose.model("User", userSchema);

module.exports = { User, ROLES };
=======
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
>>>>>>> 736ea0a (Travail de Elyes)
