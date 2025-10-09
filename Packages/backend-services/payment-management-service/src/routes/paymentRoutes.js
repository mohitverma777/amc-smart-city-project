const express = require('express');
const jwt = require('jsonwebtoken');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

// JWT Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('🔐 Authentication attempt for:', req.method, req.path);
    console.log('📝 Auth header present:', !!authHeader);

    if (!token) {
      console.warn('⚠️ No token provided');
      return res.status(401).json({
        status: 'error',
        message: 'Authentication token required'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'amc-super-secret-jwt-key-change-in-production';
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // ✅ Enhanced user data extraction with multiple fallbacks
      req.user = {
        id: decoded.id || decoded.userId || decoded.citizenId,
        citizenId: decoded.id || decoded.userId || decoded.citizenId,
        userId: decoded.userId || decoded.id,
        name: decoded.name || decoded.username || decoded.fullName || 'Citizen', // ✅ Multiple name fallbacks
        email: decoded.email,
        mobile: decoded.mobile || decoded.phone,
        role: decoded.role || 'citizen'
      };

      console.log('✅ Token validated for user:', {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      });
      
      next();
    } catch (error) {
      console.error('❌ JWT verification failed:', error.message);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      
      return res.status(401).json({
        status: 'error',
        message: 'Authentication failed',
        code: 'AUTH_FAILED'
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

// Role-based access control middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    console.log('🔒 Role check for:', req.user?.email, '| Required:', allowedRoles, '| Has:', req.user?.role);
    
    if (!req.user) {
      console.error('❌ No user object found - authentication middleware may have failed');
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.warn('⚠️ Insufficient permissions - User role:', req.user.role, 'Required:', allowedRoles);
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    console.log('✅ Role check passed');
    next();
  };
};

// Optional authentication - allows both authenticated and unauthenticated access
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('ℹ️ No token provided - proceeding without authentication');
      return next();
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'amc-super-secret-jwt-key-change-in-production';
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      req.user = {
        id: decoded.id || decoded.userId || decoded.citizenId,
        citizenId: decoded.id || decoded.userId || decoded.citizenId,
        name: decoded.name || decoded.username || 'Citizen',
        email: decoded.email,
        mobile: decoded.mobile,
        role: decoded.role || 'citizen'
      };

      console.log('✅ Optional auth - User authenticated:', req.user.email);
    } catch (error) {
      console.log('ℹ️ Optional auth - Invalid token, proceeding without authentication');
    }
    
    next();
  } catch (error) {
    console.error('❌ Optional auth error:', error);
    next(); // Continue without authentication
  }
};

// ==================== ROUTES ====================

// Health check (no auth required)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'payment-routes',
    timestamp: new Date().toISOString(),
    routes: {
      citizen: ['/bills', '/pay', '/history', '/pending'],
      admin: ['/admin/all'],
      public: ['/health']
    }
  });
});

// ==================== CITIZEN ROUTES ====================

// Get citizen's bills
router.get('/bills', authenticateToken, paymentController.getCitizenBills);

// Process payment
router.post('/pay', authenticateToken, paymentController.processPayment);

// Get payment history
router.get('/history', authenticateToken, paymentController.getPaymentHistory);

// Get pending payments
router.get('/pending', authenticateToken, paymentController.getPendingPayments);

// Generate sample bills (testing route - remove in production)
router.post('/generate-sample-bills', authenticateToken, paymentController.generateSampleBills);

// ==================== ADMIN ROUTES ====================

// Get all payments (admin only)
router.get(
  '/admin/all', 
  authenticateToken, 
  requireRole(['admin', 'officer']), 
  paymentController.getAllPayments
);

// ✅ Add a public admin route for testing (REMOVE IN PRODUCTION)
router.get('/admin/all-public', paymentController.getAllPayments);

// ==================== DEBUG ROUTES (Remove in production) ====================

// Test token validation
router.get('/test-auth', authenticateToken, (req, res) => {
  res.json({
    status: 'success',
    message: 'Authentication successful',
    user: req.user
  });
});

// Test role validation
router.get('/test-admin', authenticateToken, requireRole(['admin', 'officer']), (req, res) => {
  res.json({
    status: 'success',
    message: 'Admin access granted',
    user: req.user
  });
});

// ==================== ERROR HANDLING ====================

// 404 handler for undefined routes
router.use((req, res) => {
  console.warn('⚠️ 404 - Route not found:', req.method, req.path);
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      citizen: [
        'GET /bills',
        'POST /pay',
        'GET /history',
        'GET /pending',
        'POST /generate-sample-bills'
      ],
      admin: [
        'GET /admin/all'
      ],
      public: [
        'GET /health'
      ]
    }
  });
});

// Error handler middleware
router.use((err, req, res, next) => {
  console.error('❌ Route error:', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = router;
