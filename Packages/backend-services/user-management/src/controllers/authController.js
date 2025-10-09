// packages/backend-services/user-management/src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class AuthController {
  // Validation for citizen registration
  validateCitizenRegistration(data) {
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

    if (!data.ward) {
      errors.push('Ward is required');
    }
    
    return errors;
  }

  // Validation for admin registration only
  validateAdminRegistration(data) {
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

    if (!data.employeeId || data.employeeId.length < 3) {
      errors.push('Employee ID is required');
    }

    if (!data.department) {
      errors.push('Department is required');
    }
    
    return errors;
  }

  // Universal Registration (Admin via React + Citizen via Flutter)
  register = async (req, res) => {
    try {
      // Determine registration type based on User-Agent or explicit parameter
      const userAgent = req.headers['user-agent'] || '';
      const isFlutterApp = userAgent.includes('Flutter') || userAgent.includes('Dart') || req.body.platform === 'flutter';
      const registrationType = req.body.registrationType || (isFlutterApp ? 'citizen' : 'admin');
      
      console.log(`📱 ${registrationType} registration request received:`, {
        name: req.body.name,
        email: req.body.email,
        platform: isFlutterApp ? 'Flutter' : 'React',
        userAgent: userAgent.substring(0, 50)
      });

      let registrationData;
      let validationErrors;

      if (registrationType === 'citizen') {
        // Citizen registration from Flutter
        registrationData = {
          ...req.body,
          role: 'citizen',
          citizenId: await this.generateCitizenId()
        };
        validationErrors = this.validateCitizenRegistration(registrationData);
      } else {
        // Admin registration from React
        registrationData = {
          ...req.body,
          role: 'admin',
          employeeId: req.body.employeeId || req.body.citizenId,
          department: req.body.department || 'Administration'
        };
        validationErrors = this.validateAdminRegistration(registrationData);
      }

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
        ward,
        address,
        dateOfBirth,
        gender
      } = registrationData;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { mobileNumber },
          ...(registrationData.citizenId ? [{ citizenId: registrationData.citizenId }] : []),
          ...(registrationData.employeeId ? [{ employeeId: registrationData.employeeId }] : [])
        ]
      });

      if (existingUser) {
        let field = 'email';
        if (existingUser.mobileNumber === mobileNumber) field = 'mobile number';
        if (existingUser.citizenId === registrationData.citizenId) field = 'citizen ID';
        if (existingUser.employeeId === registrationData.employeeId) field = 'employee ID';
        
        console.log(`❌ User already exists with ${field}:`, email);
        return res.status(400).json({
          status: 'error',
          message: `User already exists with this ${field}`,
          code: 'USER_ALREADY_EXISTS'
        });
      }

      // Prepare user data based on role
      const userData = {
        name,
        email: email.toLowerCase(),
        mobileNumber,
        password,
        role: registrationData.role,
        ward,
        createdByRole: 'self'
      };

      // Add role-specific fields
      if (registrationData.role === 'citizen') {
        userData.citizenId = registrationData.citizenId;
      } else {
        userData.employeeId = registrationData.employeeId;
        userData.department = registrationData.department;
      }

      // Add optional fields
      if (address) userData.address = address;
      if (dateOfBirth) userData.dateOfBirth = dateOfBirth;
      if (gender) userData.gender = gender;

      console.log(`🔄 Creating new ${registrationData.role} user...`);
      const user = new User(userData);
      await user.save();

      // Generate auth tokens
      const accessToken = this.generateAuthToken(user);
      const refreshToken = this.generateRefreshToken(user);

      console.log(`✅ ${registrationData.role} registered successfully: ${user.email}`);

      res.status(201).json({
        status: 'success',
        message: `${registrationData.role} registered successfully`,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            mobileNumber: user.mobileNumber,
            citizenId: user.citizenId,
            employeeId: user.employeeId,
            role: user.role,
            ward: user.ward,
            department: user.department,
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

  // Universal Login (Admin + Citizen)
  login = async (req, res) => {
    try {
      console.log('🔐 Login request received for:', req.body.identifier);
      
      const { identifier, password } = req.body;
      const userAgent = req.headers['user-agent'] || '';
      const isFlutterApp = userAgent.includes('Flutter') || userAgent.includes('Dart') || req.body.platform === 'flutter';

      if (!identifier || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Email/mobile/citizen ID and password are required'
        });
      }

      // Find user by email, mobile, citizenId, or employeeId
      const user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { mobileNumber: identifier },
          { citizenId: identifier },
          { employeeId: identifier }
        ],
        isActive: true
      }).select('+password');

      if (!user || !(await bcrypt.compare(password, user.password))) {
        console.log('❌ Invalid credentials for:', identifier);
        return res.status(401).json({
          status: 'error',
          message: 'Invalid login credentials',
          code: 'AUTH_FAILED'
        });
      }

      // For React app, ensure only admins can login
      if (!isFlutterApp && user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. Admin access required.',
          code: 'ADMIN_ACCESS_REQUIRED'
        });
      }

      // For Flutter app, ensure only citizens can login
      if (isFlutterApp && user.role !== 'citizen') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. Citizen access required.',
          code: 'CITIZEN_ACCESS_REQUIRED'
        });
      }

      // Generate tokens
      const accessToken = this.generateAuthToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      console.log(`✅ ${user.role} login successful: ${user.email}`);

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
            employeeId: user.employeeId,
            role: user.role,
            ward: user.ward,
            department: user.department,
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

  // Token refresh
  refreshToken = async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(401).json({
          status: 'error',
          message: 'Refresh token is required',
          code: 'REFRESH_TOKEN_REQUIRED'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret');
      
      // Find user
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      // Generate new tokens
      const newAccessToken = this.generateAuthToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      res.json({
        status: 'success',
        message: 'Token refreshed successfully',
        data: {
          tokens: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
          }
        }
      });
    } catch (error) {
      console.error('💥 Token refresh error:', error);
      res.status(401).json({
        status: 'error',
        message: 'Token refresh failed',
        code: 'TOKEN_REFRESH_FAILED'
      });
    }
  };

  // Logout
  logout = async (req, res) => {
    res.json({ 
      status: 'success', 
      message: 'Logout successful' 
    });
  };

  // Helper method to generate unique citizen ID
  async generateCitizenId() {
    const year = new Date().getFullYear().toString().slice(-2);
    let citizenId;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      const randomNum = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
      citizenId = `CIT${year}${randomNum}`;
      
      const existingUser = await User.findOne({ citizenId });
      if (!existingUser) {
        break;
      }
      
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique citizen ID');
    }

    return citizenId;
  }

  // Helper methods
  generateAuthToken(user) {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      citizenId: user.citizenId,
      employeeId: user.employeeId,
      department: user.department,
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
