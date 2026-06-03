const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      minlength: [3, 'Title must be at least 3 characters long'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    category: {
      type: String,
      enum: {
        values: ['conference', 'workshop', 'meeting', 'sport', 'other'],
        message: '{VALUE} is not a valid category',
      },
      default: 'other',
    },
    capacity: {
      type: Number,
      min: [1, 'Capacity must be at least 1'],
      default: null,
    },
  },
  {
    timestamps: true, 
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


eventSchema.index({ title: 'text' }); 
eventSchema.index({ category: 1 });
eventSchema.index({ startDate: 1 });


eventSchema.methods.isUpcoming = function () {
  return this.startDate > new Date();
};


eventSchema.virtual('durationHours').get(function () {
  if (this.startDate && this.endDate) {
    return Math.round((this.endDate - this.startDate) / (1000 * 60 * 60));
  }
  return null;
});


eventSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});


eventSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.startDate && update.endDate && update.endDate <= update.startDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
