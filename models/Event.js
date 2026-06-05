const mongoose = require('mongoose');


const locationSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      trim: true,
      default: '',
    },
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
      default: null,
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
      default: null,
    },
  },
  { _id: false }
);

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    filename: {
      type: String,
      trim: true,
      default: '',
    },
    isUploaded: {
      type: Boolean,
      default: false, 
    },
  },
  { _id: false }
);


const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      minlength: [3, 'Title must be at least 3 characters'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },


    location: {
      type: locationSchema,
      default: () => ({}),
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

    
    type: {
      type: String,
      enum: {
        values: ['free', 'paid'],
        message: '{VALUE} is not a valid type. Use "free" or "paid"',
      },
      default: 'free',
    },

    
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },

   
    images: {
      type: [imageSchema],
      default: [],
    },

  
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


eventSchema.index({ title: 'text' });
eventSchema.index({ category: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });


eventSchema.virtual('durationHours').get(function () {
  if (this.startDate && this.endDate) {
    return Math.round((this.endDate - this.startDate) / (1000 * 60 * 60));
  }
  return null;
});


eventSchema.virtual('participantCount').get(function () {
  return this.participants ? this.participants.length : 0;
});


eventSchema.pre('save', function (next) {
  
  if (this.type === 'free') this.price = 0;
 
  if (this.type === 'paid' && (!this.price || this.price <= 0)) {
    return next(new Error('Paid events must have a price greater than 0'));
  }
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});


eventSchema.pre('findOneAndUpdate', function (next) {
  const u = this.getUpdate().$set || this.getUpdate();
  if (u.type === 'free') u.price = 0;
  if (u.type === 'paid' && u.price !== undefined && u.price <= 0) {
    return next(new Error('Paid events must have a price greater than 0'));
  }
  if (u.startDate && u.endDate && u.endDate <= u.startDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
