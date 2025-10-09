// Packages/backend-services/shared/middleware/auth.js
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class AuthMiddleware {
  // Extract token from request
  extractToken(req) {
    let token = null;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check cookies (for web applications)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Check query parameter (for WebSocket connections)
    else if (req.query && req.query.token) {
      token = req.query.token;
    }

    return token;
  }

  // Verify JWT token
  async verifyToken(token) {
    try {
      const secret = process.env.JWT_SECRET || 'amc-super-secret-jwt-key-change-in-production';
      const decoded = jwt.verify(token, secret);
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  // Main authentication middleware
  authenticate = async (req, res, next) => {
    try {
      console.log(`🔍 Auth check for: ${req.method} ${req.path}`);
      
      // Public routes that don't need authentication
      const publicPaths = [
        '/auth/register',
        '/auth/login',
        '/auth/refresh-token',
        '/health',
        '/info'
      ];

      // Check if current path is public
      const isPublicPath = publicPaths.some(path => req.path.startsWith(path));
      
      if (isPublicPath) {
        console.log('✅ Public route, skipping auth');
        return next();
      }

      // Extract token
      const token = this.extractToken(req);

      if (!token) {
        console.log('❌ No token provided');
        return res.status(401).json({
          status: 'error',
          message: 'Access denied. No token provided.',
          code: 'NO_TOKEN'
        });
      }

      // Verify token
      const decoded = await this.verifyToken(token);
      console.log('✅ Token verified for user:', decoded.email);

      // Add user info to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        citizenId: decoded.citizenId,
        employeeId: decoded.employeeId,
        ward: decoded.ward,
        department: decoded.department,
        iat: decoded.iat,
        exp: decoded.exp
      };

      next();
    } catch (error) {
      console.log('❌ Authentication failed:', error.message);
      
      return res.status(401).json({
        status: 'error',
        message: error.message,
        code: 'AUTHENTICATION_FAILED'
      });
    }
  };

  // Authorization middleware for roles
  authorize = (...allowedRoles) => {
    return (req, res, next) => {
      console.log(`🔐 Authorization check for roles: ${allowedRoles.join(', ')}`);
      
      if (!req.user) {
        console.log('❌ No user in request');
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        console.log(`❌ User role '${req.user.role}' not in allowed roles: ${allowedRoles.join(', ')}`);
        
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. Insufficient permissions.',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: allowedRoles,
          userRole: req.user.role
        });
      }

      console.log('✅ Authorization passed for user:', req.user.email);
      next();
    };
  };
}

module.exports = new AuthMiddleware();
