// Cron job for reminders
const schedulerService = require('../services/schedulerService');
const logger = require('../utils/logger');

/**
 * Start all scheduled medication reminder jobs
 */
const startScheduledJobs = async () => {
  try {
    logger.info('Starting medication reminder jobs...');
    
    await schedulerService.startAllReminderJobs();
    
    logger.info('All medication reminder jobs started successfully');
    
  } catch (error) {
    logger.error('Failed to start scheduled jobs:', error);
    throw error;
  }
};

/**
 * Restart jobs (useful for configuration updates)
 */
const restartJobs = async () => {
  logger.info('Restarting medication reminder jobs...');
  await startScheduledJobs();
};

module.exports = {
  startScheduledJobs,
  restartJobs
};
