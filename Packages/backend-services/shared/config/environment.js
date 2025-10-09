// Packages/backend-services/shared/config/environment.js
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const config = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3000,
  HOST: process.env.HOST || 'localhost',

  // Database Configuration
  DATABASES: {
    POSTGRESQL: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT) || 5432,
      database: process.env.POSTGRES_DB || 'amc_smart_city',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
      ssl: process.env.NODE_ENV === 'production'
    },
    MONGODB: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/amc_smart_city',
      options: {
        maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE) || 10
      }
    },
    REDIS: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || null,
      db: parseInt(process.env.REDIS_DB) || 0
    }
  },

  // JWT Configuration
  JWT: {
    secret: process.env.JWT_SECRET || 'amc-smart-city-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'amc-refresh-secret-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // Security Configuration
  SECURITY: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },

  // File Upload Configuration
  UPLOADS: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf').split(','),
    destination: process.env.UPLOAD_DESTINATION || './uploads'
  },

  // External Services
  SERVICES: {
    userManagement: process.env.USER_SERVICE_URL || 'http://user-management:3001',
    grievance: process.env.GRIEVANCE_SERVICE_URL || 'http://grievance-service:3002',
    propertyTax: process.env.PROPERTY_TAX_SERVICE_URL || 'http://property-tax-service:3003',
    waterManagement: process.env.WATER_SERVICE_URL || 'http://water-management:3004',
    wasteManagement: process.env.WASTE_SERVICE_URL || 'http://waste-management:3005',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3006',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3007',
    chatbot: process.env.CHATBOT_SERVICE_URL || 'http://chatbot-service:3008',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3009'
  },

  // Logging Configuration
  LOGGING: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined'
  }
};

// Validation
const requiredEnvVars = ['JWT_SECRET'];

if (config.NODE_ENV === 'production') {
  requiredEnvVars.push(
    'POSTGRES_PASSWORD',
    'MONGODB_URI',
    'REDIS_PASSWORD'
  );
}

const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

module.exports = config;