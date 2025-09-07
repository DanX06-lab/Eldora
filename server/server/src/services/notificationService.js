// Multi-channel notifications
const FamilyMember = require('../models/FamilyMember');
const twilioService = require('./twilioService');
const logger = require('../utils/logger');

class NotificationService {
  
  /**
   * Notify family members about medication events
   */
  async notifyFamilyMembers(patientId, eventType, details) {
    try {
      const familyMembers = await FamilyMember.find({
        patientIds: patientId,
        isActive: true
      }).populate('patientIds', 'personalInfo.firstName personalInfo.lastName');
      
      for (const familyMember of familyMembers) {
        await this.sendFamilyNotification(familyMember, eventType, details);
      }
      
      logger.info(`Notified ${familyMembers.length} family members for patient ${patientId}`);
      
    } catch (error) {
      logger.error('Failed to notify family members:', error);
    }
  }
  
  /**
   * Send notification to individual family member
   */
  async sendFamilyNotification(familyMember, eventType, details) {
    const { preferredMethod } = familyMember.notificationSettings;
    const patient = familyMember.patientIds[0]; // Assuming single patient for now
    
    const message = this.generateNotificationMessage(eventType, patient, details);
    
    try {
      if (preferredMethod === 'sms' || preferredMethod === 'both') {
        await twilioService.sendSMSReminder(familyMember.phoneNumber, message);
      }
      
      if (preferredMethod === 'email' || preferredMethod === 'both') {
        // Email functionality would go here
        // await emailService.sendEmail(familyMember.email, subject, message);
        logger.info(`Email notification queued for ${familyMember.email}`);
      }
      
    } catch (error) {
      logger.error(`Failed to send notification to family member ${familyMember._id}:`, error);
    }
  }
  
  /**
   * Generate notification message based on event type
   */
  generateNotificationMessage(eventType, patient, details) {
    const patientName = `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`;
    
    switch (eventType) {
      case 'medication_taken':
        return `Good news! ${patientName} has confirmed taking their ${details.medicationName} medication at ${new Date().toLocaleTimeString()}.`;
      
      case 'medication_missed':
        return `Alert: ${patientName} has not confirmed taking their ${details.medicationName} medication. Please check on them.`;
      
      case 'call_failed':
        return `Unable to reach ${patientName} for their ${details.medicationName} medication reminder. Please contact them directly.`;
      
      case 'medication_reminder':
        return `Reminder: ${patientName} should be taking their ${details.medicationName} medication now.`;
      
      default:
        return `Update regarding ${patientName}'s medication: ${details.message}`;
    }
  }
  
  /**
   * Send real-time notification via WebSocket
   */
  async sendRealTimeNotification(patientId, eventType, data) {
    const io = require('../websockets/socketHandler').getIO();
    
    if (io) {
      // Emit to family members connected to this patient's room
      io.to(`patient_${patientId}`).emit('medication_update', {
        eventType,
        patientId,
        timestamp: new Date(),
        data
      });
      
      logger.info(`Real-time notification sent for patient ${patientId}: ${eventType}`);
    }
  }
}

module.exports = new NotificationService();
