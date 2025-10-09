//packages/backend-services/complaint-management-service/src/routes/complaintRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { rateLimit } = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const complaintController = require('../controllers/complaintController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads/complaints';
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `complaint-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    console.log('📎 File received:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname
    });

    // Allow all images
    if (file.mimetype.startsWith('image/')) {
      console.log('✅ Image file accepted:', file.originalname);
      return cb(null, true);
    }

    // ✅ Allow octet-stream if file extension is an image
    if (file.mimetype === 'application/octet-stream') {
      const ext = path.extname(file.originalname).toLowerCase();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      
      if (imageExtensions.includes(ext)) {
        console.log('✅ Image file accepted (by extension):', file.originalname);
        return cb(null, true);
      }
    }

    // Allow PDFs
    if (file.mimetype === 'application/pdf') {
      console.log('✅ PDF file accepted:', file.originalname);
      return cb(null, true);
    }

    // Allow Word documents
    if (file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('✅ Document file accepted:', file.originalname);
      return cb(null, true);
    }

    // Allow text files
    if (file.mimetype === 'text/plain') {
      console.log('✅ Text file accepted:', file.originalname);
      return cb(null, true);
    }

    console.log('❌ File rejected:', file.originalname, '- Invalid type:', file.mimetype);
    cb(new Error(`File type not allowed: ${file.mimetype}. Only images, PDFs, and documents are allowed.`));
  }
});

// Rate limiting for complaint submission
const complaintSubmissionLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 complaints per 15 minutes
  message: {
    status: 'error',
    message: 'Too many complaints submitted. Please wait before submitting another.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ✅ JWT Authentication Middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication token required'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'amc-super-secret-jwt-key-change-in-production';
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      req.user = {
        id: decoded.id || decoded.userId,
        citizenId: decoded.id || decoded.userId,
        name: decoded.name,
        email: decoded.email,
        mobile: decoded.mobile,
        role: decoded.role || 'citizen'
      };

      console.log('✅ Token validated for user:', req.user.email);
      next();
    } catch (error) {
      console.error('❌ JWT verification failed:', error.message);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication service error'
    });
  }
};

// ✅ Role-based Authorization Middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// ================================
// ✅ ROUTES (ORDER MATTERS!)
// ================================

// Public routes (no auth required)
router.get('/categories', complaintController.getComplaintCategories);

// Admin/Officer statistics route (MUST be before /:identifier)
router.get('/admin/statistics', 
  authenticateToken, 
  requireRole(['admin', 'officer']), 
  complaintController.getComplaintStatistics
);

// Citizen routes (auth required)
router.post(
  '/',
  authenticateToken,
  complaintSubmissionLimit,
  upload.array('attachments', 5),
  complaintController.fileComplaint
);

// Get citizen's own complaints
router.get('/my', 
  authenticateToken, 
  complaintController.getMyComplaints
);

// File download route
router.get('/attachments/:attachmentId/download', 
  authenticateToken, 
  complaintController.downloadAttachment
);

// ✅ Admin/Officer: Get ALL complaints (with filters)
router.get('/', 
  authenticateToken, 
  requireRole(['officer', 'admin']), 
  complaintController.getAllComplaints
);

// Get single complaint by ID or complaint number
router.get('/:identifier', 
  authenticateToken, 
  complaintController.getComplaint
);

// Add comment to complaint
router.post('/:id/comments', 
  authenticateToken, 
  complaintController.addComment
);

// Update complaint status (Officer/Admin only)
router.patch('/:id/status', 
  authenticateToken, 
  requireRole(['officer', 'admin']), 
  complaintController.updateComplaintStatus
);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'complaint-routes',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
