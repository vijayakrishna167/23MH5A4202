const mongoose = require('mongoose');
const logger = require('../middleware/logger');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      logger.error('MONGO_URI environment variable is not set.');
      process.exit(1);
    }
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    logger.info('MongoDB Connected...');
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 