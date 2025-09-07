// Medication schema
const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  
  // Medication Details
  name: { type: String, required: true, trim: true },
  genericName: { type: String, trim: true },
  dosage: { type: String, required: true },
  unit: { type: String, required: true }, // mg, ml, tablets
  
  // Schedule
  frequency: { 
    type: String, 
    enum: ['daily', 'twice_daily', 'three_times_daily', 'weekly'], 
    required: true 
  },
  times: [{ type: String, required: true }], // ["08:00", "14:00", "20:00"]
  
  // Instructions
  instructions: { type: String },
  foodInstructions: { 
    type: String, 
    enum: ['with_food', 'without_food', 'before_food', 'after_food', 'no_restriction'],
    default: 'no_restriction'
  },
  
  // Duration
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date },
  
  // Tracking
  adherenceHistory: [{
    date: { type: Date, required: true },
    taken: { type: Boolean, required: true },
    takenTime: { type: Date },
    method: { 
      type: String, 
      enum: ['voice_confirmed', 'sms_confirmed', 'manual_entry', 'missed'],
      required: true 
    },
    notes: { type: String }
  }],
  
  // Status
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
medicationSchema.index({ patientId: 1 });
medicationSchema.index({ isActive: 1 });
medicationSchema.index({ 'adherenceHistory.date': -1 });

// Virtual for adherence rate
medicationSchema.virtual('adherenceRate').get(function() {
  if (this.adherenceHistory.length === 0) return 0;
  
  const takenCount = this.adherenceHistory.filter(entry => entry.taken).length;
  return (takenCount / this.adherenceHistory.length) * 100;
});

// Update timestamp on save
medicationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Medication', medicationSchema);
