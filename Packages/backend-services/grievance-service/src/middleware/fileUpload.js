// Packages/backend-services/grievance-service/src/middleware/fileUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uuid = require('uuid');
const logger = require('@amc/shared/utils/logger');

class FileUploadMiddleware {
  constructor() {
    this.uploadDir = process.env.UPLOAD_PATH || './uploads/grievances';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
    this.allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png', 
      'image/jpg',
      'application/pdf'
    ];

    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      logger.info('Upload directory created:', this.uploadDir);
    }
  }

  // Custom storage configuration
  getStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const userDir = path.join(this.uploadDir, req.user?.id || 'anonymous');
        
        if (!fs.existsSync(userDir)) {
          fs.mkdirSync(userDir, { recursive: true });
        }
        
        cb(null, userDir);
      },
      
      filename: (req, file, cb) => {
        const uniqueId = uuid.v4();
        const extension = path.extname(file.originalname);
        const sanitizedName = file.originalname
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .substring(0, 50);
        
        const filename = `${Date.now()}-${uniqueId}-${sanitizedName}${extension}`;
        cb(null, filename);
      }
    });
  }

  // File filter function
  fileFilter(req, file, cb) {
    // Check file type
    if (!this.allowedTypes.includes(file.mimetype)) {
      const error = new Error(`File type ${file.mimetype} not allowed`);
      error.code = 'INVALID_FILE_TYPE';
      return cb(error, false);
    }

    // Additional validations based on file type
    if (file.mimetype.startsWith('image/')) {
      // Image specific validations
      if (file.size > 5 * 1024 * 1024) { // 5MB for images
        const error = new Error('Image file too large. Maximum size is 5MB');
        error.code = 'FILE_TOO_LARGE';
        return cb(error, false);
      }
    }

    if (file.mimetype === 'application/pdf') {
      // PDF specific validations
      if (file.size > this.maxFileSize) {
        const error = new Error('PDF file too large. Maximum size is 10MB');
        error.code = 'FILE_TOO_LARGE';
        return cb(error, false);
      }
    }

    cb(null, true);
  }

  // Create multer instance
  createUploader() {
    return multer({
      storage: this.getStorage(),
      fileFilter: this.fileFilter.bind(this),
      limits: {
        fileSize: this.maxFileSize,
        files: 10 // Maximum 10 files per request
      }
    });
  }

  // Error handling middleware
  handleUploadError(error, req, res, next) {
    if (error instanceof multer.MulterError) {
      let message = 'File upload error';
      let code = 'UPLOAD_ERROR';

      switch (error.code) {
        case 'LIMIT_FILE_SIZE':
          message = 'File too large';
          code = 'FILE_TOO_LARGE';
          break;
        case 'LIMIT_FILE_COUNT':
          message = 'Too many files';
          code = 'TOO_MANY_FILES';
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          message = 'Unexpected file field';
          code = 'UNEXPECTED_FILE';
          break;
      }

      return res.status(400).json({
        status: 'error',
        message,
        code
      });
    }

    if (error.code === 'INVALID_FILE_TYPE' || error.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        code: error.code
      });
    }

    next(error);
  }
}

const fileUploadMiddleware = new FileUploadMiddleware();
const upload = fileUploadMiddleware.createUploader();

// Export configured multer instance
module.exports = upload;
module.exports.handleUploadError = fileUploadMiddleware.handleUploadError;
