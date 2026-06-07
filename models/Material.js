const mongoose = require('mongoose');

const MATERIAL_STATUSES = [
  'disponible',
  'en-utilisation',
  'en-maintenance',
  'hors-service',
  'retire',
];

const materialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Material name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    serialNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 1,
    },
    status: {
      type: String,
      enum: MATERIAL_STATUSES,
      default: 'disponible',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    purchaseDate: {
      type: Date,
    },
    purchasePrice: {
      type: Number,
      min: 0,
    },
    location: {
      type: String,
      trim: true,
    },
    condition: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

materialSchema.index({ name: 'text', description: 'text', serialNumber: 'text' });
materialSchema.index({ status: 1 });
materialSchema.index({ category: 1 });
materialSchema.index({ project: 1 });

module.exports = mongoose.model('Material', materialSchema);
module.exports.MATERIAL_STATUSES = MATERIAL_STATUSES;
