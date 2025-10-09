// Packages/backend-services/shared/middleware/errorHandler.js
const logger = require('../utils/logger');

const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const handleUnhandledRoutes = (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
};

const globalErrorHandler = (error, req, res, next) => {
  console.error('💥 Global error:', error);
  
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Something went wrong';
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

module.exports = {
  catchAsync,
  handleUnhandledRoutes,
  globalErrorHandler
};
