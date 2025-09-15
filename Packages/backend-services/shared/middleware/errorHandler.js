const logger = require('../utils/logger');

class ErrorHandler {
  // Handle different types of errors
  handleError(error, req) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    // Log user info if available
    if (req.user) {
      errorInfo.user = {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      };
    }

    logger.error('Application error:', errorInfo);
  }

  // Development error response
  sendErrorDev(error, res) {
    res.status(error.statusCode || 500).json({
      status: 'error',
      error: error,
      message: error.message,
      stack: error.stack
    });
  }

  // Production error response
  sendErrorProd(error, res) {
    // Operational errors that are safe to send to client
    if (error.isOperational) {
      res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message,
        code: error.code
      });
    } else {
      // Unknown errors - don't leak details
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  // Handle specific error types
  handleCastError(error) {
    const message = `Invalid ${error.path}: ${error.value}`;
    return this.createOperationalError(message, 400, 'INVALID_DATA');
  }

  handleDuplicateFieldsError(error) {
    const value = error.keyValue ? Object.values(error.keyValue)[0] : 'unknown';
    const message = `Duplicate field value: ${value}. Please use another value.`;
    return this.createOperationalError(message, 400, 'DUPLICATE_FIELD');
  }

  handleValidationError(error) {
    const errors = Object.values(error.errors).map(err => err.message);
    const message = `Invalid input data: ${errors.join('. ')}`;
    return this.createOperationalError(message, 400, 'VALIDATION_ERROR');
  }

  handleJWTError() {
    return this.createOperationalError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN');
  }

  handleJWTExpiredError() {
    return this.createOperationalError('Your token has expired! Please log in again.', 401, 'TOKEN_EXPIRED');
  }

  // Create operational error
  createOperationalError(message, statusCode, code) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    error.code = code;
    return error;
  }

  // Main error handling middleware
  globalErrorHandler = (error, req, res, next) => {
    error.statusCode = error.statusCode || 500;

    this.handleError(error, req);

    // Handle specific error types
    let err = { ...error };
    err.message = error.message;

    if (error.name === 'CastError') {
      err = this.handleCastError(err);
    }
    if (error.code === 11000) {
      err = this.handleDuplicateFieldsError(err);
    }
    if (error.name === 'ValidationError') {
      err = this.handleValidationError(err);
    }
    if (error.name === 'JsonWebTokenError') {
      err = this.handleJWTError();
    }
    if (error.name === 'TokenExpiredError') {
      err = this.handleJWTExpiredError();
    }

    // Send appropriate error response
    if (process.env.NODE_ENV === 'development') {
      this.sendErrorDev(err, res);
    } else {
      this.sendErrorProd(err, res);
    }
  };

  // Async error wrapper
  catchAsync = (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  // Handle unhandled routes
  handleUnhandledRoutes = (req, res, next) => {
    const error = new Error(`Can't find ${req.originalUrl} on this server!`);
    error.statusCode = 404;
    error.isOperational = true;
    error.code = 'ROUTE_NOT_FOUND';
    next(error);
  };
}

module.exports = new ErrorHandler();