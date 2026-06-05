const mongoose = require('mongoose');

const reclamationSchema = new mongoose.Schema(
  {
    sujet: {
      type: String,
      required: [true, 'Reclamation subject is required'],
      minlength: [5, 'Subject must be at least 5 characters long'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters long'],
      trim: true,
    },
    categorie: {
      type: String,
      enum: {
        values: ['technique', 'administratif', 'pedagogique', 'infrastructure', 'autre'],
        message: '{VALUE} is not a valid category',
      },
      default: 'autre',
    },
    priorite: {
      type: String,
      enum: {
        values: ['faible', 'moyenne', 'haute', 'urgente'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'moyenne',
    },
    statut: {
      type: String,
      enum: {
        values: ['en_attente', 'en_cours', 'resolue', 'rejetee'],
        message: '{VALUE} is not a valid status',
      },
      default: 'en_attente',
    },
    // Reference to the user who submitted (ObjectId — kept flexible for integration)
    soumisePar: {
      type: String,
      required: [true, 'Submitter information is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    reponse: {
      type: String,
      trim: true,
      default: '',
    },
    dateResolution: {
      type: Date,
      default: null,
    },
    piecesJointes: {
      type: [String], // Array of file paths / URLs
      default: [],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes for query performance ───────────────────────────────────────────
reclamationSchema.index({ sujet: 'text' }); // Full-text search on sujet
reclamationSchema.index({ statut: 1 });
reclamationSchema.index({ categorie: 1 });
reclamationSchema.index({ priorite: 1 });
reclamationSchema.index({ createdAt: -1 });

// ─── Virtual: time since submission (in hours) ────────────────────────────────
reclamationSchema.virtual('heuresDepuisSoumission').get(function () {
  return Math.round((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

// ─── Virtual: is resolved ────────────────────────────────────────────────────
reclamationSchema.virtual('estResolue').get(function () {
  return this.statut === 'resolue';
});

// ─── Pre-save hook: set dateResolution when status changes to 'resolue' ───────
reclamationSchema.pre('save', function (next) {
  if (this.isModified('statut') && this.statut === 'resolue' && !this.dateResolution) {
    this.dateResolution = new Date();
  }
  next();
});

// ─── Pre-update hook: set dateResolution on update ───────────────────────────
reclamationSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.$set?.statut === 'resolue' || update.statut === 'resolue') {
    if (!update.$set) update.$set = {};
    update.$set.dateResolution = new Date();
  }
  next();
});

module.exports = mongoose.model('Reclamation', reclamationSchema);
