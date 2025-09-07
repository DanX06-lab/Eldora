// Family member schema
const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
  // Personal Information
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  
  // Relationship
  patientIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  }],
  relationshipToPatient: { 
    type: String, 
    enum: ['son', 'daughter', 'spouse', 'sibling', 'caregiver', 'other'],
    required: true 
  },
  
  // Notification Preferences
  notificationSettings: {
    medicationTaken: { type: Boolean, default: true },
    medicationMissed: { type: Boolean, default: true },
    callFailed: { type: Boolean, default: true },
    dailySummary: { type: Boolean, default: false },
    preferredMethod: { 
      type: String, 
      enum: ['email', 'sms', 'both'], 
      default: 'both' 
    }
  },
  
  // Authentication
  password: { type: String, required: true },
  lastLogin: { type: Date },
  
  // System fields
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
familyMemberSchema.index({ email: 1 });
familyMemberSchema.index({ patientIds: 1 });

// Update timestamp on save
familyMemberSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('FamilyMember', familyMemberSchema);
