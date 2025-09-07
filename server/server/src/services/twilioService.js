// Voice & SMS operations
const { twilioClient, phoneNumber } = require('../config/twilio');
const logger = require('../utils/logger');
const VoiceCall = require('../models/VoiceCall');

class TwilioService {
  
  /**
   * Initiate voice call for medication reminder
   */
  async makeVoiceCall(patient, medication, voiceScript) {
    try {
      const webhookUrl = `${process.env.BASE_URL}/api/webhooks/twilio/voice-status`;
      const gatherUrl = `${process.env.BASE_URL}/api/webhooks/twilio/voice-response`;
      
      const twiml = this.generateTwiML(voiceScript, medication.name, gatherUrl);
      
      const call = await twilioClient.calls.create({
        to: patient.personalInfo.phoneNumber,
        from: phoneNumber,
        twiml: twiml,
        statusCallback: webhookUrl,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST',
        timeout: 30,
        record: false
      });
      
      // Create voice call record
      const voiceCallRecord = new VoiceCall({
        callSid: call.sid,
        patientId: patient._id,
        medicationId: medication._id,
        scheduledTime: new Date(),
        status: 'initiated',
        voiceScript: {
          language: patient.personalInfo.preferredLanguage,
          medicationName: medication.name,
          scriptText: voiceScript
        }
      });
      
      await voiceCallRecord.save();
      
      logger.info(`Voice call initiated for patient ${patient._id}: ${call.sid}`);
      return { callSid: call.sid, voiceCallRecord };
      
    } catch (error) {
      logger.error('Failed to make voice call:', error);
      throw new Error(`Voice call failed: ${error.message}`);
    }
  }
  
  /**
   * Generate TwiML for voice call
   */
  generateTwiML(voiceScript, medicationName, gatherUrl) {
    return `
      <Response>
        <Say voice="alice" language="en">${voiceScript}</Say>
        <Gather action="${gatherUrl}" 
                method="POST" 
                timeout="10" 
                numDigits="1">
          <Say voice="alice" language="en">
            Press 1 if you have taken your ${medicationName}, or press 2 if you need more time.
          </Say>
        </Gather>
        <Say voice="alice" language="en">
          We didn't receive your response. A family member will be notified. Please take your medication as prescribed.
        </Say>
      </Response>
    `;
  }
  
  /**
   * Send SMS backup notification
   */
  async sendSMSReminder(phoneNumber, message) {
    try {
      const sms = await twilioClient.messages.create({
        body: message,
        to: phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER
      });
      
      logger.info(`SMS sent successfully: ${sms.sid}`);
      return sms;
      
    } catch (error) {
      logger.error('Failed to send SMS:', error);
      throw error;
    }
  }
  
  /**
   * Update call status from webhook
   */
  async updateCallStatus(callSid, status, duration = null) {
    try {
      const updateData = { status };
      
      if (status === 'answered') {
        updateData.answeredTime = new Date();
      } else if (status === 'completed') {
        updateData.endedTime = new Date();
        if (duration) updateData.duration = duration;
      }
      
      const voiceCall = await VoiceCall.findOneAndUpdate(
        { callSid },
        updateData,
        { new: true }
      );
      
      logger.info(`Updated call status for ${callSid}: ${status}`);
      return voiceCall;
      
    } catch (error) {
      logger.error(`Failed to update call status for ${callSid}:`, error);
      throw error;
    }
  }
}

module.exports = new TwilioService();
