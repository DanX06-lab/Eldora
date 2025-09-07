const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  // Personal Information
  personalInfo: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    phoneNumber: { 
      type: String, 
      required: true, 
      unique: true,
      match: /^\+?[\d\s-()]+$/
    },
    preferredLanguage: { 
      type: String, 
      enum: ['en', 'hi', 'es', 'fr'], 
      default: 'en' 
    },
    timezone: { type: String, default: 'Asia/Kolkata' }
  },
  
  // Medical Information
  medicalInfo: {
    conditions: [{ type: String }],
    allergies: [{ type: String }],
    primaryPhysician: {
      name: String,
      phone: String,
      email: String
    }
  },
  
  // Medication Schedule
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { 
      type: String, 
      enum: ['daily', 'twice_daily', 'three_times_daily', 'weekly'], 
      required: true 
    },
    times: [{ type: String }], // e.g., ["08:00", "20:00"]
    instructions: { type: String },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true }
  }],
  
  // Family Members
  familyMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember'
  }],
  
  // Settings
  settings: {
    voiceCallEnabled: { type: Boolean, default: true },
    smsBackupEnabled: { type: Boolean, default: true },
    maxCallAttempts: { type: Number, default: 3 },
    callRetryInterval: { type: Number, default: 15 } // minutes
  },
  
  // System fields
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
patientSchema.index({ 'personalInfo.phoneNumber': 1 });
patientSchema.index({ isActive: 1 });
patientSchema.index({ 'medications.isActive': 1 });

// Update timestamp on save
patientSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Patient', patientSchema);
