const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('../config/environment');
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
      const decoded = await promisify(jwt.verify)(token, config.JWT.secret);
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
      // Public routes that don't need authentication
      const publicPaths = [
        '/auth/register',
        '/auth/login',
        '/health'
      ];

      // ✅ Allow public routes without token
      if (publicPaths.includes(req.path)) {
        return next();
      }

      // Extract token
      const token = this.extractToken(req);

      if (!token) {
        return res.status(401).json({
          status: 'error',
          message: 'Access denied. No token provided.',
          code: 'NO_TOKEN'
        });
      }

      // Verify token
      const decoded = await this.verifyToken(token);

      // Add user info to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        citizenId: decoded.citizenId,
        iat: decoded.iat,
        exp: decoded.exp
      };

      // Log authentication
      logger.info(`User authenticated: ${decoded.email} (${decoded.role})`);

      next();
    } catch (error) {
      logger.warn(`Authentication failed: ${error.message}`);
      
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
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`Authorization failed: User ${req.user.email} (${req.user.role}) attempted to access resource requiring roles: ${allowedRoles.join(', ')}`);
        
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. Insufficient permissions.',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: allowedRoles,
          userRole: req.user.role
        });
      }

      next();
    };
  };

  // Optional authentication (doesn't fail if no token)
  optionalAuth = async (req, res, next) => {
    try {
      const token = this.extractToken(req);
      
      if (token) {
        const decoded = await this.verifyToken(token);
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          citizenId: decoded.citizenId
        };
      }
    } catch (error) {
      // Silently ignore authentication errors for optional auth
      logger.debug(`Optional authentication failed: ${error.message}`);
    }
    
    next();
  };

  // Check if user owns resource
  checkOwnership = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      
      if (req.user.role === 'admin') {
        // Admins can access any resource
        return next();
      }

      if (req.user.id !== resourceUserId && req.user.citizenId !== resourceUserId) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You can only access your own resources.'
        });
      }

      next();
    };
  };
}

module.exports = new AuthMiddleware();
