// Medication scheduling
const cron = require('node-cron');
const moment = require('moment-timezone');
const Patient = require('../models/Patient');
const twilioService = require('./twilioService');
const voiceScriptService = require('./voiceScriptService');
const logger = require('../utils/logger');

class SchedulerService {
  constructor() {
    this.activeJobs = new Map(); // Track active cron jobs
  }
  
  /**
   * Start all medication reminder jobs
   */
  async startAllReminderJobs() {
    try {
      const activePatients = await Patient.find({ 
        isActive: true,
        'medications.isActive': true 
      });
      
      for (const patient of activePatients) {
        await this.schedulePatientReminders(patient);
      }
      
      logger.info(`Scheduled reminders for ${activePatients.length} patients`);
    } catch (error) {
      logger.error('Failed to start reminder jobs:', error);
    }
  }
  
  /**
   * Schedule medication reminders for a specific patient
   */
  async schedulePatientReminders(patient) {
    const patientTimezone = patient.personalInfo.timezone;
    
    for (const medication of patient.medications) {
      if (!medication.isActive) continue;
      
      for (const time of medication.times) {
        const jobKey = `${patient._id}_${medication._id}_${time}`;
        
        // Parse time and create cron pattern
        const [hours, minutes] = time.split(':');
        const cronPattern = `${minutes} ${hours} * * *`; // Daily at specified time
        
        // Cancel existing job if it exists
        if (this.activeJobs.has(jobKey)) {
          this.activeJobs.get(jobKey).destroy();
        }
        
        // Schedule new job
        const job = cron.schedule(cronPattern, async () => {
          await this.executeMedicationReminder(patient, medication);
        }, {
          scheduled: true,
          timezone: patientTimezone
        });
        
        this.activeJobs.set(jobKey, job);
        
        logger.info(`Scheduled reminder for patient ${patient._id} at ${time} (${patientTimezone})`);
      }
    }
  }
  
  /**
   * Execute medication reminder (voice call)
   */
  async executeMedicationReminder(patient, medication) {
    try {
      logger.info(`Executing reminder for patient ${patient._id}, medication: ${medication.name}`);
      
      // Generate personalized voice script
      const voiceScript = voiceScriptService.generateScript(
        medication,
        patient.personalInfo.preferredLanguage,
        patient.personalInfo.firstName
      );
      
      // Make voice call
      const result = await twilioService.makeVoiceCall(patient, medication, voiceScript);
      
      logger.info(`Medication reminder call initiated: ${result.callSid}`);
      
    } catch (error) {
      logger.error(`Failed to execute reminder for patient ${patient._id}:`, error);
      
      // Fallback to SMS if voice call fails
      try {
        const smsMessage = `Hello ${patient.personalInfo.firstName}, this is a reminder to take your ${medication.name} medication. Please take it as prescribed.`;
        await twilioService.sendSMSReminder(patient.personalInfo.phoneNumber, smsMessage);
      } catch (smsError) {
        logger.error('SMS fallback also failed:', smsError);
      }
    }
  }
  
  /**
   * Update patient schedule when medications change
   */
  async updatePatientSchedule(patientId) {
    try {
      const patient = await Patient.findById(patientId);
      if (patient) {
        await this.schedulePatientReminders(patient);
        logger.info(`Updated schedule for patient ${patientId}`);
      }
    } catch (error) {
      logger.error(`Failed to update schedule for patient ${patientId}:`, error);
    }
  }
  
  /**
   * Cancel all jobs for a patient
   */
  cancelPatientJobs(patientId) {
    const keysToDelete = [];
    
    for (const [key, job] of this.activeJobs) {
      if (key.startsWith(patientId)) {
        job.destroy();
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.activeJobs.delete(key));
    logger.info(`Cancelled ${keysToDelete.length} jobs for patient ${patientId}`);
  }
}

module.exports = new SchedulerService();
