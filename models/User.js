/**
 * @file models/User.js
 * @description Mongoose User model — stores credentials, roles, and event references.
 *              Implements soft delete via `isActive` flag.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = {
  ADMIN: "ADMIN",
  ORGANIZER: "ORGANIZER",
  PARTICIPANT: "PARTICIPANT",
};

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
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
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
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
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

userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ fullName: "text", email: "text" });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }
  next();
});

userSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeSoftDeleted) {
    this.find({ isActive: { $ne: false } });
  }
  next();
});

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
  return obj;
};

userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email, isActive: true }).select("+password");
};

userSchema.virtual("eventCount").get(function () {
  return this.events ? this.events.length : 0;
});

const User = mongoose.model("User", userSchema);

module.exports = { User, ROLES };
