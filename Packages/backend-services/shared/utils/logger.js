const winston = require('winston');
const path = require('path');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Production format (JSON)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? prodFormat : logFormat,
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'amc-service',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    })
  ],
  exitOnError: false
});

// File transports for production
if (process.env.NODE_ENV === 'production') {
  const logDir = process.env.LOG_DIR || './logs';
  
  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true
  }));

  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true
  }));
}

// Request logging middleware
logger.requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info(`🔵 ${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '🔴' : '🟢';
    
    logger.info(`${statusColor} ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`, {
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userId: req.user?.id
    });
  });

  next();
};

// Database operation logger
logger.dbLogger = {
  query: (sql, params) => {
    logger.debug('🔍 Database Query:', { sql, params });
  },
  
  error: (error, sql, params) => {
    logger.error('❌ Database Error:', { error: error.message, sql, params });
  },
  
  slow: (sql, params, duration) => {
    logger.warn(`⚠️ Slow Query (${duration}ms):`, { sql, params, duration });
  }
};

// Security logger
logger.securityLogger = {
  authSuccess: (user, req) => {
    logger.info('✅ Authentication Success:', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  },
  
  authFailure: (email, reason, req) => {
    logger.warn('🚫 Authentication Failure:', {
      email,
      reason,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  },
  
  rateLimitExceeded: (req) => {
    logger.warn('⚠️ Rate Limit Exceeded:', {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
  },
  
  suspiciousActivity: (description, req, user) => {
    logger.warn('🚨 Suspicious Activity:', {
      description,
      userId: user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
};

module.exports = logger;