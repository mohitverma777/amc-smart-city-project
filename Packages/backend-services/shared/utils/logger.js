// packages/backend-services/shared/utils/logger.js

const winston = require('winston');

// Simple logger configuration for development
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
      let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
      
      if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
      }
      
      if (stack) {
        log += `\n${stack}`;
      }
      
      return log;
    })
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'amc-service'
  },
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    })
  ],
  exitOnError: false
});

// Request logging middleware
logger.requestLogger = (req, res, next) => {
  const start = Date.now();
  
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};

// Security logger
logger.securityLogger = {
  authSuccess: (user, req) => {
    logger.info('Authentication Success', {
      userId: user.id || user._id,
      email: user.email,
      ip: req.ip
    });
  },
  
  authFailure: (identifier, reason, req) => {
    logger.warn('Authentication Failure', {
      identifier,
      reason,
      ip: req.ip
    });
  }
};

module.exports = logger;
