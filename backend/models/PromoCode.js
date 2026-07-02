/**
 * @file models/PromoCode.js
 * @description Promotional codes applicable to reservations, either globally
 *              or scoped to a single event. Supports percentage or fixed
 *              amount discounts, usage caps and an optional expiry date.
 */
const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Promo code is required'],
      trim: true,
      uppercase: true,
      minlength: [3, 'Code must be at least 3 characters'],
      maxlength: [30, 'Code must not exceed 30 characters'],
    },
    discountType: {
      type: String,
      enum: {
        values: ['percentage', 'fixed'],
        message: '{VALUE} is not a valid discount type. Use "percentage" or "fixed"',
      },
      required: [true, 'Discount type is required'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    // If set, the code can only be used on this specific event. If null, it is global.
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    maxUses: {
      type: Number,
      default: null, // null = unlimited
      min: [1, 'maxUses must be at least 1'],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      default: null, // null = never expires
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

promoCodeSchema.index({ code: 1, event: 1 }, { unique: true });

promoCodeSchema.pre('validate', function (next) {
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    return next(new Error('Percentage discount cannot exceed 100'));
  }
  next();
});

promoCodeSchema.methods.isValidNow = function () {
  if (!this.isActive) return { ok: false, reason: 'This promo code is no longer active.' };
  if (this.expiresAt && this.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: 'This promo code has expired.' };
  }
  if (this.maxUses !== null && this.usedCount >= this.maxUses) {
    return { ok: false, reason: 'This promo code has reached its usage limit.' };
  }
  return { ok: true };
};

promoCodeSchema.methods.computeDiscount = function (amount) {
  if (this.discountType === 'percentage') {
    return Math.round((amount * this.discountValue) / 100 * 100) / 100;
  }
  return Math.min(amount, this.discountValue);
};

module.exports = mongoose.model('PromoCode', promoCodeSchema);
