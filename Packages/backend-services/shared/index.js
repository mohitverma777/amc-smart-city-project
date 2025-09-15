// Export all shared utilities
module.exports = {
  // Config
  config: require('./config/environment'),
  database: require('./config/database'),
  
  // Middleware
  auth: require('./middleware/auth'),
  errorHandler: require('./middleware/errorHandler'),
  validation: require('./middleware/validation'),
  
  // Utils
  logger: require('./utils/logger')
};