const winston = require('winston');

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

module.exports = logger;
module.exports.requestLogger = requestLogger; 