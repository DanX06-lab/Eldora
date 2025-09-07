require('dotenv').config();
const app = require('./app');
const { connectDatabase } = require('./src/config/database');
const logger = require('./src/utils/logger');
const { startScheduledJobs } = require('./src/jobs/medicationReminder');

// Use PORT from environment or default to 3000
const PORT = process.env.PORT || 3000;
const DEMO_MODE = String(process.env.DEMO_MODE).toLowerCase() === 'true';

async function startServer() {
  try {
    if (DEMO_MODE) {
      logger.warn('Starting server in DEMO_MODE: skipping database connection and scheduled jobs');
    } else {
      // Connect to MongoDB (production URI from environment)
      await connectDatabase();
      logger.info('Connected to database');
      
      // Start scheduled medication reminder jobs
      startScheduledJobs();
      logger.info('Medication reminder jobs started');
    }
    
    // Start Express server
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Voice Health Reminder API running on port ${PORT}`);
    });

    // Socket.io setup for real-time family updates
    const io = require('socket.io')(server, {
      cors: { 
        origin: process.env.FRONTEND_URL || "*", // Use environment variable for frontend URL
        methods: ["GET", "POST"] 
      }
    });
    require('./src/websockets/socketHandler')(io);
    
    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => process.exit(0));
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
