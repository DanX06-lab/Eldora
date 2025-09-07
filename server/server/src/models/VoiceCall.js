const mongoose = require('mongoose');

const voiceCallSchema = new mongoose.Schema({
  // Call identification
  callSid: { type: String, unique: true, required: true },
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  medicationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  
  // Call details
  scheduledTime: { type: Date, required: true },
  initiatedTime: { type: Date, default: Date.now },
  answeredTime: { type: Date },
  endedTime: { type: Date },
  
  // Call status and response
  status: { 
    type: String, 
    enum: ['initiated', 'ringing', 'answered', 'completed', 'failed', 'no-answer', 'busy'], 
    default: 'initiated' 
  },
  duration: { type: Number }, // seconds
  
  // Patient response
  patientResponse: {
    dtmfInput: { type: String }, // "1" for taken, "2" for need time
    responseTime: { type: Date },
    confirmed: { type: Boolean }
  },
  
  // Voice script used
  voiceScript: {
    language: { type: String, default: 'en' },
    medicationName: { type: String },
    scriptText: { type: String }
  },
  
  // Follow-up actions
  followupActions: [{
    action: { 
      type: String, 
      enum: ['retry_call', 'send_sms', 'alert_family', 'alert_physician'] 
    },
    timestamp: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'failed'], 
      default: 'pending' 
    },
    details: { type: String }
  }],
  
  // Retry information
  attemptNumber: { type: Number, default: 1 },
  maxAttempts: { type: Number, default: 3 },
  
  createdAt: { type: Date, default: Date.now }
});

// Indexes
voiceCallSchema.index({ patientId: 1, createdAt: -1 });
voiceCallSchema.index({ callSid: 1 });
voiceCallSchema.index({ status: 1 });
voiceCallSchema.index({ scheduledTime: 1 });

module.exports = mongoose.model('VoiceCall', voiceCallSchema);
