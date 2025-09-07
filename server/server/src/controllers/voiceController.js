// Voice controller
const VoiceCall = require('../models/VoiceCall');
const Patient = require('../models/Patient');
const twilioService = require('../services/twilioService');
const notificationService = require('../services/notificationService');
const voiceScriptService = require('../services/voiceScriptService');
const logger = require('../utils/logger');

class VoiceController {
  
  /**
   * Handle Twilio voice status webhook
   */
  async handleVoiceStatus(req, res) {
    try {
      const { CallSid, CallStatus, CallDuration } = req.body;
      
      logger.info(`Voice status webhook: ${CallSid} - ${CallStatus}`);
      
      // Update call status in database
      await twilioService.updateCallStatus(CallSid, CallStatus, CallDuration);
      
      // Handle specific status updates
      if (CallStatus === 'no-answer' || CallStatus === 'failed') {
        await this.handleFailedCall(CallSid);
      } else if (CallStatus === 'completed') {
        // Check if patient responded during the call
        const voiceCall = await VoiceCall.findOne({ callSid: CallSid });
        if (voiceCall && !voiceCall.patientResponse?.confirmed) {
          await this.handleMissedResponse(voiceCall);
        }
      }
      
      res.status(200).send('OK');
      
    } catch (error) {
      logger.error('Failed to handle voice status:', error);
      res.status(500).send('Error');
    }
  }
  
  /**
   * Handle patient voice response (DTMF input)
   */
  async handleVoiceResponse(req, res) {
    try {
      const { CallSid, Digits } = req.body;
      
      logger.info(`Voice response: ${CallSid} - Digits: ${Digits}`);
      
      const voiceCall = await VoiceCall.findOne({ callSid: CallSid })
        .populate('patientId', 'personalInfo medications');
      
      if (!voiceCall) {
        return res.status(404).send('<Response><Say>Call not found</Say></Response>');
      }
      
      const confirmed = Digits === '1';
      const needsTime = Digits === '2';
      
      // Update voice call with patient response
      voiceCall.patientResponse = {
        dtmfInput: Digits,
        responseTime: new Date(),
        confirmed: confirmed
      };
      await voiceCall.save();
      
      // Get medication name for response
      const medication = voiceCall.patientId.medications.find(med => 
        med._id.toString() === voiceCall.medicationId.toString()
      );
      
      const language = voiceCall.patientId.personalInfo.preferredLanguage;
      const responseScript = voiceScriptService.generateConfirmationScript(
        language, 
        medication?.name || 'medication', 
        confirmed
      );
      
      // Send notifications based on response
      if (confirmed) {
        await notificationService.notifyFamilyMembers(
          voiceCall.patientId._id,
          'medication_taken',
          { medicationName: medication?.name }
        );
        
        await notificationService.sendRealTimeNotification(
          voiceCall.patientId._id,
          'medication_taken',
          { medicationName: medication?.name, time: new Date() }
        );
      } else if (needsTime) {
        // Schedule retry call in 15 minutes
        await this.scheduleRetryCall(voiceCall, 15);
      }
      
      // Generate TwiML response
      const twimlResponse = `<Response><Say voice="alice" language="en">${responseScript}</Say></Response>`;
      
      res.set('Content-Type', 'text/xml');
      res.send(twimlResponse);
      
    } catch (error) {
      logger.error('Failed to handle voice response:', error);
      res.status(500).send('<Response><Say>Error processing response</Say></Response>');
    }
  }
  
  /**
   * Manually initiate voice call for testing
   */
  async initiateCall(req, res) {
    try {
      const { patientId, medicationId } = req.body;
      
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      
      const medication = patient.medications.find(med => 
        med._id.toString() === medicationId
      );
      
      if (!medication) {
        return res.status(404).json({ error: 'Medication not found' });
      }
      
      // Generate voice script
      const voiceScript = voiceScriptService.generateScript(
        medication,
        patient.personalInfo.preferredLanguage,
        patient.personalInfo.firstName
      );
      
      // Make voice call
      const result = await twilioService.makeVoiceCall(patient, medication, voiceScript);
      
      logger.info(`Manual voice call initiated: ${result.callSid}`);
      
      res.json({
        message: 'Voice call initiated successfully',
        callSid: result.callSid
      });
      
    } catch (error) {
      logger.error('Failed to initiate voice call:', error);
      res.status(500).json({ error: 'Failed to initiate call' });
    }
  }
  
  /**
   * Get voice call history for a patient
   */
  async getCallHistory(req, res) {
    try {
      const { patientId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const calls = await VoiceCall.find({ patientId })
        .populate('patientId', 'personalInfo.firstName personalInfo.lastName medications')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      const total = await VoiceCall.countDocuments({ patientId });
      
      const callHistory = calls.map(call => ({
        callSid: call.callSid,
        medicationName: this.getMedicationName(call.patientId, call.medicationId),
        scheduledTime: call.scheduledTime,
        status: call.status,
        duration: call.duration,
        confirmed: call.patientResponse?.confirmed || false,
        attemptNumber: call.attemptNumber
      }));
      
      res.json({
        callHistory,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
      
    } catch (error) {
      logger.error('Failed to get call history:', error);
      res.status(500).json({ error: 'Failed to retrieve call history' });
    }
  }
  
  /**
   * Handle failed voice call
   */
  async handleFailedCall(callSid) {
    try {
      const voiceCall = await VoiceCall.findOne({ callSid })
        .populate('patientId');
      
      if (!voiceCall) return;
      
      const patient = voiceCall.patientId;
      const maxAttempts = patient.settings.maxCallAttempts || 3;
      
      if (voiceCall.attemptNumber < maxAttempts) {
        // Schedule retry
        await this.scheduleRetryCall(voiceCall, patient.settings.callRetryInterval || 15);
      } else {
        // Max attempts reached, notify family and send SMS
        await this.handleMaxAttemptsReached(voiceCall);
      }
      
    } catch (error) {
      logger.error('Failed to handle failed call:', error);
    }
  }
  
  /**
   * Schedule retry call
   */
  async scheduleRetryCall(voiceCall, delayMinutes) {
    // In a production system, you'd use a job queue like Bull or Agenda
    // For now, we'll use setTimeout (not recommended for production)
    setTimeout(async () => {
      try {
        const patient = await Patient.findById(voiceCall.patientId);
        const medication = patient.medications.find(med => 
          med._id.toString() === voiceCall.medicationId.toString()
        );
        
        if (patient && medication) {
          const voiceScript = voiceScriptService.generateScript(
            medication,
            patient.personalInfo.preferredLanguage,
            patient.personalInfo.firstName
          );
          
          await twilioService.makeVoiceCall(patient, medication, voiceScript);
        }
      } catch (error) {
        logger.error('Failed to execute retry call:', error);
      }
    }, delayMinutes * 60 * 1000);
    
    logger.info(`Retry call scheduled in ${delayMinutes} minutes for ${voiceCall.callSid}`);
  }
  
  /**
   * Handle when max call attempts are reached
   */
  async handleMaxAttemptsReached(voiceCall) {
    try {
      const patient = voiceCall.patientId;
      const medication = patient.medications.find(med => 
        med._id.toString() === voiceCall.medicationId.toString()
      );
      
      // Send SMS backup
      if (patient.settings.smsBackupEnabled) {
        const smsMessage = `URGENT: Medication reminder for ${medication?.name}. Please take your medication immediately and contact your family if you need assistance.`;
        await twilioService.sendSMSReminder(patient.personalInfo.phoneNumber, smsMessage);
      }
      
      // Notify family members
      await notificationService.notifyFamilyMembers(
        patient._id,
        'call_failed',
        { medicationName: medication?.name, attempts: voiceCall.attemptNumber }
      );
      
      // Send real-time alert
      await notificationService.sendRealTimeNotification(
        patient._id,
        'call_failed',
        { medicationName: medication?.name, urgency: 'high' }
      );
      
      logger.warn(`Max call attempts reached for patient ${patient._id}, medication ${medication?.name}`);
      
    } catch (error) {
      logger.error('Failed to handle max attempts reached:', error);
    }
  }
  
  /**
   * Handle missed response (call completed but no DTMF input)
   */
  async handleMissedResponse(voiceCall) {
    await notificationService.notifyFamilyMembers(
      voiceCall.patientId,
      'medication_missed',
      { medicationName: 'medication' } // Would need to populate medication data
    );
  }
  
  /**
   * Helper to get medication name
   */
  getMedicationName(patient, medicationId) {
    const medication = patient.medications.find(med => 
      med._id.toString() === medicationId.toString()
    );
    return medication ? medication.name : 'Unknown Medication';
  }
}

module.exports = new VoiceController();
