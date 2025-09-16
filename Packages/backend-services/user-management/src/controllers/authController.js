const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class AuthController {
  // Simple input validation function
  validateRegistration(data) {
    const errors = [];
    
    if (!data.name || data.name.length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    
    if (!data.email || !data.email.includes('@')) {
      errors.push('Valid email is required');
    }
    
    if (!data.mobileNumber || !/^[6-9]\d{9}$/.test(data.mobileNumber)) {
      errors.push('Valid mobile number is required');
    }
    
    if (!data.password || data.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!data.citizenId || data.citizenId.length < 6) {
      errors.push('Citizen ID must be at least 6 characters long');
    }
    
    if (!data.ward) {
      errors.push('Ward is required');
    }
    
    return errors;
  }

  // User Registration
  register = async (req, res) => {
    try {
      console.log('📝 Registration request received:', {
        name: req.body.name,
        email: req.body.email,
        citizenId: req.body.citizenId
      });

      // Simple validation
      const validationErrors = this.validateRegistration(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      const {
        name,
        email,
        mobileNumber,
        password,
        citizenId,
        ward,
        address,
        dateOfBirth,
        gender
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { mobileNumber },
          { citizenId }
        ]
      });

      if (existingUser) {
        let field = 'email';
        if (existingUser.mobileNumber === mobileNumber) field = 'mobile number';
        if (existingUser.citizenId === citizenId) field = 'citizen ID';
        
        console.log(`❌ User already exists with ${field}:`, email);
        return res.status(400).json({
          status: 'error',
          message: `User already exists with this ${field}`,
          code: 'USER_ALREADY_EXISTS'
        });
      }

      // Create new user
      const userData = {
        name,
        email: email.toLowerCase(),
        mobileNumber,
        password,
        citizenId,
        ward,
        address,
        dateOfBirth,
        gender
      };

      console.log('🔄 Creating new user...');
      const user = new User(userData);
      await user.save();

      // Generate auth tokens
      const accessToken = this.generateAuthToken(user);
      const refreshToken = this.generateRefreshToken(user);

      console.log(`✅ User registered successfully: ${user.email}`);

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            mobileNumber: user.mobileNumber,
            citizenId: user.citizenId,
            role: user.role,
            ward: user.ward,
            verificationStatus: user.verificationStatus
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
          }
        }
      });
    } catch (error) {
      console.error('💥 Registration error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Registration failed',
        code: 'REGISTRATION_FAILED',
        details: error.message
      });
    }
  };

  // User Login
  login = async (req, res) => {
    try {
      console.log('🔐 Login request received for:', req.body.identifier);
      
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Email/mobile and password are required'
        });
      }

      // Find user by email or mobile number
      const user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { mobileNumber: identifier }
        ],
        isActive: true
      }).select('+password');

      if (!user || !(await bcrypt.compare(password, user.password))) {
        console.log('❌ Invalid credentials for:', identifier);
        return res.status(401).json({
          status: 'error',
          message: 'Invalid login credentials',
          code: 'AUTHENTICATION_FAILED'
        });
      }

      // Generate tokens
      const accessToken = this.generateAuthToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      console.log(`✅ User login successful: ${user.email}`);

      res.json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            mobileNumber: user.mobileNumber,
            citizenId: user.citizenId,
            role: user.role,
            ward: user.ward,
            verificationStatus: user.verificationStatus,
            lastLogin: user.lastLogin
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
          }
        }
      });
    } catch (error) {
      console.error('💥 Login error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Login failed',
        code: 'LOGIN_FAILED'
      });
    }
  };

  // Placeholder methods
  refreshToken = async (req, res) => {
    res.json({ status: 'success', message: 'Token refresh not implemented yet' });
  };

  logout = async (req, res) => {
    res.json({ status: 'success', message: 'Logout successful' });
  };

  // Helper methods
  generateAuthToken(user) {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      citizenId: user.citizenId,
      ward: user.ward
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
  }

  generateRefreshToken(user) {
    const payload = {
      id: user._id,
      type: 'refresh'
    };
    
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret', {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });
  }
}

module.exports = new AuthController();