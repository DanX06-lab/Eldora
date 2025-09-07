// Medication adherence tracking
const Patient = require('../models/Patient');
const VoiceCall = require('../models/VoiceCall');
const moment = require('moment');
const logger = require('../utils/logger');

class AdherenceService {
  
  /**
   * Calculate medication adherence rate for a patient
   */
  async calculateAdherenceRate(patientId, timeframe = 30) {
    try {
      const startDate = moment().subtract(timeframe, 'days').toDate();
      
      const patient = await Patient.findById(patientId);
      if (!patient) throw new Error('Patient not found');
      
      const adherenceData = {};
      
      for (const medication of patient.medications) {
        if (!medication.isActive) continue;
        
        const scheduledDoses = this.calculateScheduledDoses(medication, timeframe);
        const confirmedDoses = await this.getConfirmedDoses(patientId, medication._id, startDate);
        
        const adherenceRate = scheduledDoses > 0 ? (confirmedDoses / scheduledDoses) * 100 : 0;
        
        adherenceData[medication._id] = {
          medicationName: medication.name,
          scheduledDoses,
          confirmedDoses,
          adherenceRate: Math.round(adherenceRate),
          missedDoses: scheduledDoses - confirmedDoses
        };
      }
      
      return adherenceData;
      
    } catch (error) {
      logger.error('Failed to calculate adherence rate:', error);
      throw error;
    }
  }
  
  /**
   * Calculate total scheduled doses for a medication over timeframe
   */
  calculateScheduledDoses(medication, timeframe) {
    const dailyDoses = medication.times.length;
    
    switch (medication.frequency) {
      case 'daily':
        return dailyDoses * timeframe;
      case 'twice_daily':
        return 2 * timeframe;
      case 'three_times_daily':
        return 3 * timeframe;
      case 'weekly':
        return Math.ceil(timeframe / 7) * dailyDoses;
      default:
        return dailyDoses * timeframe;
    }
  }
  
  /**
   * Get confirmed medication doses from voice calls
   */
  async getConfirmedDoses(patientId, medicationId, startDate) {
    try {
      const confirmedCalls = await VoiceCall.countDocuments({
        patientId,
        medicationId,
        createdAt: { $gte: startDate },
        'patientResponse.confirmed': true
      });
      
      return confirmedCalls;
      
    } catch (error) {
      logger.error('Failed to get confirmed doses:', error);
      return 0;
    }
  }
  
  /**
   * Get detailed adherence history for patient dashboard
   */
  async getAdherenceHistory(patientId, timeframe = 7) {
    try {
      const startDate = moment().subtract(timeframe, 'days').toDate();
      
      const voiceCalls = await VoiceCall.find({
        patientId,
        createdAt: { $gte: startDate }
      }).populate('patientId', 'personalInfo medications')
        .sort({ createdAt: -1 });
      
      const historyData = voiceCalls.map(call => ({
        date: call.createdAt,
        medicationName: this.getMedicationName(call.patientId, call.medicationId),
        status: call.patientResponse?.confirmed ? 'taken' : 'missed',
        callStatus: call.status,
        responseTime: call.patientResponse?.responseTime,
        attemptNumber: call.attemptNumber
      }));
      
      return historyData;
      
    } catch (error) {
      logger.error('Failed to get adherence history:', error);
      throw error;
    }
  }
  
  /**
   * Helper to get medication name from patient data
   */
  getMedicationName(patient, medicationId) {
    const medication = patient.medications.find(med => 
      med._id.toString() === medicationId.toString()
    );
    return medication ? medication.name : 'Unknown Medication';
  }
  
  /**
   * Generate adherence insights and recommendations
   */
  async generateAdherenceInsights(patientId) {
    try {
      const adherenceData = await this.calculateAdherenceRate(patientId, 30);
      const insights = [];
      
      for (const [medicationId, data] of Object.entries(adherenceData)) {
        if (data.adherenceRate < 80) {
          insights.push({
            type: 'poor_adherence',
            medicationName: data.medicationName,
            adherenceRate: data.adherenceRate,
            recommendation: `Consider adjusting reminder times or frequency for ${data.medicationName}`
          });
        }
        
        if (data.missedDoses > 5) {
          insights.push({
            type: 'frequent_misses',
            medicationName: data.medicationName,
            missedDoses: data.missedDoses,
            recommendation: `High number of missed doses for ${data.medicationName}. Consider family intervention.`
          });
        }
      }
      
      return insights;
      
    } catch (error) {
      logger.error('Failed to generate adherence insights:', error);
      throw error;
    }
  }
}

module.exports = new AdherenceService();
