const twilio = require('twilio');
const logger = require('../utils/logger');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !phoneNumber) {
  logger.error('Missing Twilio configuration in environment variables');
  throw new Error('Twilio configuration incomplete');
}

const twilioClient = twilio(accountSid, authToken);

module.exports = {
  twilioClient,
  phoneNumber
};
