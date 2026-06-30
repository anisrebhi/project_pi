/**
 * @file models/EventPhoto.js
 * @description Photo gallery for events — uploaded by organizers after the event.
 */
const mongoose = require('mongoose');

const eventPhotoSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader is required'],
    },
    url: {
      type: String,
      required: [true, 'Photo URL is required'],
      trim: true,
    },
    filename: {
      type: String,
      trim: true,
      default: '',
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [300, 'Caption must not exceed 300 characters'],
      default: '',
    },
    // Store original filename for display
    originalName: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

eventPhotoSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model('EventPhoto', eventPhotoSchema);
