const winston = require('winston');
const Log = require('../utils/logger'); // Import the new Log function

// Configure Winston Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'url-shortener-microservice' },
  transports: [
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Middleware for logging requests
const requestLogger = (req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });
  next();
};

// Middleware for centralized error logging
const errorLogger = (err, req, res, next) => {
  Log("backend", "error", "middleware", err.message);
  logger.error({
    method: req.method,
    url: req.url,
    ip: req.ip,
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: err.stack,
  });
  next(err);
};

module.exports = logger;
module.exports.requestLogger = requestLogger;
module.exports.errorLogger = errorLogger; // Export the errorLogger 