// Packages/backend-services/shared/utils/validation.js
const Joi = require('joi');
// Use a simple console logger instead of requiring a file
const logger = {
  warn: (message, data) => {
    console.warn(message, data);
  }
};

class ValidationMiddleware {
  constructor() {
    // Common validation schemas
    this.schemas = {
      // MongoDB ObjectId
      objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId'),
      
      // Email
      email: Joi.string().email().lowercase().trim(),
      
      // Password
      password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .message('Password must contain at least 8 characters with uppercase, lowercase, number and special character'),
      
      // Mobile number (Indian format)
      mobileNumber: Joi.string().pattern(/^[6-9]\d{9}$/).message('Invalid mobile number'),
      
      // Citizen ID
      citizenId: Joi.string().alphanum().min(6).max(20),
      
      // Location coordinates
      coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required()
      }),
      
      // File upload
      file: Joi.object({
        filename: Joi.string().required(),
        mimetype: Joi.string().valid('image/jpeg', 'image/png', 'application/pdf').required(),
        size: Joi.number().max(10 * 1024 * 1024) // 10MB
      }),
      
      // Pagination
      pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sortBy: Joi.string(),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc')
      })
    };

    // User registration validation
    this.userRegistration = Joi.object({
      name: Joi.string().trim().min(2).max(100).required(),
      email: this.schemas.email.required(),
      password: this.schemas.password.required(),
      confirmPassword: Joi.string().valid(Joi.ref('password')).required()
        .messages({ 'any.only': 'Password confirmation does not match' }),
      mobileNumber: this.schemas.mobileNumber.required(),
      citizenId: this.schemas.citizenId.required(),
      ward: Joi.string().trim().min(1).max(50).required(),
      address: Joi.object({
        street: Joi.string().trim().max(200),
        area: Joi.string().trim().max(100),
        pincode: Joi.string().pattern(/^\d{6}$/).message('Invalid pincode')
      }),
      role: Joi.string().valid('citizen', 'officer', 'admin').default('citizen')
    });

    // User login validation
    this.userLogin = Joi.object({
      email: this.schemas.email,
      mobileNumber: this.schemas.mobileNumber,
      password: Joi.string().required(),
      rememberMe: Joi.boolean().default(false)
    }).xor('email', 'mobileNumber'); // Either email or mobile number required

    // Grievance creation validation
    this.grievanceCreation = Joi.object({
      title: Joi.string().trim().min(5).max(200).required(),
      description: Joi.string().trim().min(10).max(2000).required(),
      category: Joi.string().valid('roads', 'water', 'sanitation', 'electricity', 'waste', 'other').required(),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
      location: Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
        address: Joi.string().trim().max(300).required()
      }),
      ward: Joi.string().trim().required()
    });

    // Status update validation
    this.statusUpdate = Joi.object({
      status: Joi.string().valid('submitted', 'acknowledged', 'in_progress', 'resolved', 'closed').required(),
      comment: Joi.string().trim().max(1000),
      estimatedResolutionDate: Joi.date().iso().greater('now')
    });
  }

  // Create validation middleware
  validate = (schema, source = 'body') => {
    return (req, res, next) => {
      const data = req[source];
      
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const errorDetails = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        logger.warn('Validation failed:', {
          url: req.url,
          method: req.method,
          errors: errorDetails,
          userId: req.user?.id
        });

        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: errorDetails
        });
      }

      // Replace request data with validated and sanitized data
      req[source] = value;
      next();
    };
  };

  // Validate query parameters
  validateQuery = (schema) => this.validate(schema, 'query');

  // Validate route parameters
  validateParams = (schema) => this.validate(schema, 'params');

  // File upload validation
  validateFile = (fieldName, options = {}) => {
    return (req, res, next) => {
      const file = req.file || req.files?.[fieldName];
      
      if (!file && options.required) {
        return res.status(400).json({
          status: 'error',
          message: `File '${fieldName}' is required`,
          code: 'FILE_REQUIRED'
        });
      }

      if (file) {
        // Validate file type
        const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            status: 'error',
            message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
            code: 'INVALID_FILE_TYPE'
          });
        }

        // Validate file size
        const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          return res.status(400).json({
            status: 'error',
            message: `File size too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
            code: 'FILE_TOO_LARGE'
          });
        }
      }

      next();
    };
  };

  // Sanitize HTML input
  sanitizeHtml = (req, res, next) => {
    const sanitizeValue = (value) => {
      if (typeof value === 'string') {
        // Remove HTML tags and potentially dangerous characters
        return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                   .replace(/<[^>]+>/g, '')
                   .trim();
      }
      return value;
    };

    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        } else {
          obj[key] = sanitizeValue(obj[key]);
        }
      }
    };

    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);

    next();
  };
}

module.exports = new ValidationMiddleware();