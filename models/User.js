/**
 * @file models/User.js
 * @description Mongoose User model — stores credentials, roles, and event references.
 *              Implements soft delete via `isActive` flag.
 *              v2: added refreshToken, emailVerification fields.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

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

    // ─── Password Management ──────────────────────────────────────
    passwordChangedAt: {
      type: Date,
      select: false,
    },

    // ─── Refresh Token ────────────────────────────────────────────
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },

    refreshTokenExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    // ─── Email Verification ───────────────────────────────────────
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      default: null,
      select: false,
    },

    emailVerificationExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    // ─── Password Reset ───────────────────────────────────────────
    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },

    passwordResetExpiresAt: {
      type: Date,
      default: null,
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
userSchema.index({ fullName: "text", email: "text" });
userSchema.index({ emailVerificationToken: 1 }, { sparse: true });
userSchema.index({ passwordResetToken: 1 }, { sparse: true });

// ─── Pre-Save Middleware: Hash Password ───────────────────────────────────────

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, saltRounds);

  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
    // Invalidate all refresh tokens on password change
    this.refreshToken = null;
    this.refreshTokenExpiresAt = null;
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
  this.refreshToken = null;
  this.refreshTokenExpiresAt = null;
  return await this.save();
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordChangedAt;
  delete obj.deletedAt;
  delete obj.refreshToken;
  delete obj.refreshTokenExpiresAt;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpiresAt;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpiresAt;
  return obj;
};

/**
 * Generate and store a hashed email verification token
 * @returns {string} raw token to send via email
 */
userSchema.methods.generateEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  this.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  return rawToken;
};

/**
 * Generate and store a hashed password reset token
 * @returns {string} raw token to send via email
 */
userSchema.methods.generatePasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  this.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
  return rawToken;
};

/**
 * Store a hashed refresh token
 * @param {string} rawToken
 */
userSchema.methods.setRefreshToken = function (rawToken) {
  this.refreshToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  const days = parseInt(process.env.REFRESH_TOKEN_DAYS) || 30;
  this.refreshTokenExpiresAt = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000
  );
};

/**
 * Verify a raw refresh token against the stored hash
 * @param {string} rawToken
 * @returns {boolean}
 */
userSchema.methods.verifyRefreshToken = function (rawToken) {
  if (!this.refreshToken || !this.refreshTokenExpiresAt) return false;
  if (new Date() > this.refreshTokenExpiresAt) return false;
  const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");
  return hashed === this.refreshToken;
};

// ─── Static Methods ───────────────────────────────────────────────────────────

userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email, isActive: true }).select(
    "+password +refreshToken +refreshTokenExpiresAt"
  );
};

userSchema.statics.findByVerificationToken = function (rawToken) {
  const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");
  return this.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpiresAt: { $gt: new Date() },
    isActive: true,
  }).select("+emailVerificationToken +emailVerificationExpiresAt");
};

userSchema.statics.findByPasswordResetToken = function (rawToken) {
  const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");
  return this.findOne({
    passwordResetToken: hashed,
    passwordResetExpiresAt: { $gt: new Date() },
    isActive: true,
  }).select("+passwordResetToken +passwordResetExpiresAt +password");
};

// ─── Virtual Fields ───────────────────────────────────────────────────────────

userSchema.virtual("eventCount").get(function () {
  return this.events ? this.events.length : 0;
});

// ─── Export ───────────────────────────────────────────────────────────────────

const User = mongoose.model("User", userSchema);

module.exports = { User, ROLES };
