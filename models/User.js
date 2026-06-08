/**
 * @file models/User.js
 * @description Mongoose User model — stores credentials, roles, and event references.
 *              Implements soft delete via `isActive` flag.
 *              Added: email verification, refresh tokens, QR registrations ref.
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
      select: false,
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
    isActive: {
      type: Boolean,
      default: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    // ─── Password Reset ───────────────────────────────────────────
    passwordChangedAt: {
      type: Date,
      select: false,
    },

    // ─── Email Verification ───────────────────────────────────────
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerifyToken: {
      type: String,
      select: false,
    },

    emailVerifyExpires: {
      type: Date,
      select: false,
    },

    // ─── Refresh Tokens (multi-device) ────────────────────────────
    refreshTokens: {
      type: [
        {
          token: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
          expiresAt: { type: Date, required: true },
        },
      ],
      default: [],
      select: false,
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

userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isEmailVerified: 1 });
userSchema.index({ emailVerifyToken: 1 });
userSchema.index({ fullName: "text", email: "text" });

// ─── Pre-Save Middleware: Hash Password ───────────────────────────────────────

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, saltRounds);

  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }

  next();
});

// ─── Query Middleware: Filter Soft-Deleted ────────────────────────────────────

userSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeSoftDeleted) {
    this.find({ isActive: { $ne: false } });
  }
  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.softDelete = async function () {
  this.isActive = false;
  this.deletedAt = new Date();
  return await this.save();
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordChangedAt;
  delete obj.deletedAt;
  delete obj.emailVerifyToken;
  delete obj.emailVerifyExpires;
  delete obj.refreshTokens;
  return obj;
};

// ─── Static Methods ───────────────────────────────────────────────────────────

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
