const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDatabase = async () => {
  try {
    // Use production MongoDB URI from environment variable
    // Default to NEW_DB database name to match your existing setup
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/NEW_DB';
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    await mongoose.connect(mongoURI, options);
    
    logger.info(`Connected to MongoDB database: ${mongoose.connection.name}`);
    
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = { connectDatabase };
