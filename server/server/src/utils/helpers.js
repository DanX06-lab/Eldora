// Utility functions
const moment = require('moment-timezone');

/**
 * Format phone number to E.164 format
 */
const formatPhoneNumber = (phoneNumber) => {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add country code if not present (assuming India +91)
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  
  return phoneNumber; // Return as-is if already formatted
};

/**
 * Calculate age from date of birth
 */
const calculateAge = (dateOfBirth) => {
  return moment().diff(moment(dateOfBirth), 'years');
};

/**
 * Check if time is within business hours
 */
const isBusinessHours = (timezone = 'Asia/Kolkata') => {
  const now = moment().tz(timezone);
  const hour = now.hour();
  return hour >= 8 && hour <= 20; // 8 AM to 8 PM
};

/**
 * Generate unique identifier
 */
const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `${prefix}${timestamp}${random}`.toUpperCase();
};

/**
 * Validate time format (HH:MM)
 */
const isValidTimeFormat = (time) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Convert time to cron expression
 */
const timeToCron = (time) => {
  const [hours, minutes] = time.split(':');
  return `${minutes} ${hours} * * *`;
};

/**
 * Sanitize user input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 500); // Limit length
};

module.exports = {
  formatPhoneNumber,
  calculateAge,
  isBusinessHours,
  generateId,
  isValidTimeFormat,
  timeToCron,
  sanitizeInput
};
