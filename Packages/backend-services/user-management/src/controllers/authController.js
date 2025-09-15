const User = require('../models/User');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const logger = require('@amc/shared/utils/logger');
const { catchAsync } = require('@amc/shared/middleware/errorHandler');
const crypto = require('crypto');

class AuthController {
  // User Registration
  register = catchAsync(async (req, res) => {
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

    const user = new User(userData);
    
    // Generate verification tokens
    const emailVerificationToken = user.createEmailVerificationToken();
    const mobileOTP = user.generateMobileOTP();
    
    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, emailVerificationToken);
    } catch (error) {
      logger.error('Failed to send verification email:', error);
    }

    // Send mobile OTP
    try {
      await smsService.sendOTP(user.mobileNumber, mobileOTP);
    } catch (error) {
      logger.error('Failed to send mobile OTP:', error);
    }

    // Generate auth tokens
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Store refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    logger.securityLogger.authSuccess(user, req);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully. Please verify your email and mobile number.',
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
          expiresIn: process.env.JWT_EXPIRES_IN
        }
      }
    });
  });

  // User Login
  login = catchAsync(async (req, res) => {
    const { identifier, password, rememberMe } = req.body; // identifier can be email or mobile

    if (!identifier || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email/mobile and password',
        code: 'MISSING_CREDENTIALS'
      });
    }

    try {
      // Find user and check password
      const user = await User.findByCredentials(identifier, password);

      // Generate tokens
      const accessToken = user.generateAuthToken();
      const refreshToken = user.generateRefreshToken();

      // Store refresh token
      user.refreshTokens.push({ token: refreshToken });
      
      // If remember me is false, limit refresh tokens to 1
      if (!rememberMe && user.refreshTokens.length > 1) {
        user.refreshTokens = user.refreshTokens.slice(-1);
      }
      
      await user.save();

      logger.securityLogger.authSuccess(user, req);

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
            expiresIn: process.env.JWT_EXPIRES_IN
          }
        }
      });
    } catch (error) {
      logger.securityLogger.authFailure(identifier, error.message, req);
      
      res.status(401).json({
        status: 'error',
        message: error.message,
        code: 'AUTHENTICATION_FAILED'
      });
    }
  });

  // Refresh Token
  refreshToken = catchAsync(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Refresh token is required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      // Check if refresh token exists in user's tokens
      const tokenExists = user.refreshTokens.some(token => token.token === refreshToken);
      if (!tokenExists) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      // Generate new tokens
      const newAccessToken = user.generateAuthToken();
      const newRefreshToken = user.generateRefreshToken();

      // Replace old refresh token with new one
      user.refreshTokens = user.refreshTokens.filter(token => token.token !== refreshToken);
      user.refreshTokens.push({ token: newRefreshToken });
      await user.save();

      res.json({
        status: 'success',
        message: 'Token refreshed successfully',
        data: {
          tokens: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN
          }
        }
      });
    } catch (error) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
  });

  // Logout
  logout = catchAsync(async (req, res) => {
    const { refreshToken } = req.body;
    const user = await User.findById(req.user.id);

    if (refreshToken && user) {
      // Remove specific refresh token
      user.refreshTokens = user.refreshTokens.filter(token => token.token !== refreshToken);
      await user.save();
    }

    res.json({
      status: 'success',
      message: 'Logged out successfully'
    });
  });

  // Logout from all devices
  logoutAll = catchAsync(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (user) {
      user.refreshTokens = [];
      await user.save();
    }

    res.json({
      status: 'success',
      message: 'Logged out from all devices successfully'
    });
  });

  // Send Mobile OTP
  sendMobileOTP = catchAsync(async (req, res) => {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'Mobile number is required',
        code: 'MOBILE_NUMBER_REQUIRED'
      });
    }

    const user = await User.findByMobile(mobileNumber);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found with this mobile number',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate OTP
    const otp = user.generateMobileOTP();
    await user.save();

    // Send OTP via SMS
    try {
      await smsService.sendOTP(mobileNumber, otp);
      
      res.json({
        status: 'success',
        message: 'OTP sent successfully',
        data: {
          expiresIn: process.env.OTP_EXPIRES_IN || 600000 // 10 minutes
        }
      });
    } catch (error) {
      logger.error('Failed to send OTP:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP',
        code: 'OTP_SEND_FAILED'
      });
    }
  });

  // Verify Mobile OTP
  verifyMobileOTP = catchAsync(async (req, res) => {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Mobile number and OTP are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const user = await User.findByMobile(mobileNumber);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const isValidOTP = user.verifyMobileOTP(otp);
    if (!isValidOTP) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired OTP',
        code: 'INVALID_OTP'
      });
    }

    // Mark mobile as verified
    user.verificationStatus.mobile = true;
    user.mobileOTP = undefined;
    user.mobileOTPExpires = undefined;
    await user.save();

    res.json({
      status: 'success',
      message: 'Mobile number verified successfully',
      data: {
        verificationStatus: user.verificationStatus
      }
    });
  });

  // Verify Email
  verifyEmail = catchAsync(async (req, res) => {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'Verification token is required',
        code: 'TOKEN_REQUIRED'
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN'
      });
    }

    // Mark email as verified
    user.verificationStatus.email = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      status: 'success',
      message: 'Email verified successfully',
      data: {
        verificationStatus: user.verificationStatus
      }
    });
  });

  // Forgot Password
  forgotPassword = catchAsync(async (req, res) => {
    const { identifier } = req.body; // email or mobile

    if (!identifier) {
      return res.status(400).json({
        status: 'error',
        message: 'Email or mobile number is required',
        code: 'IDENTIFIER_REQUIRED'
      });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { mobileNumber: identifier }
      ],
      isActive: true
    });

    if (!user) {
      // Don't reveal whether user exists or not
      return res.json({
        status: 'success',
        message: 'If a user with that email/mobile exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save();

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken);
      
      res.json({
        status: 'success',
        message: 'Password reset link sent to your email'
      });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      logger.error('Failed to send password reset email:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to send password reset email',
        code: 'EMAIL_SEND_FAILED'
      });
    }
  });

  // Reset Password
  resetPassword = catchAsync(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Token and new password are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Hash token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Clear all refresh tokens (logout from all devices)
    user.refreshTokens = [];
    
    await user.save();

    logger.info('Password reset successful', { userId: user._id, email: user.email });

    res.json({
      status: 'success',
      message: 'Password reset successful. Please login with your new password.'
    });
  });

  // Change Password
  changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check current password
    const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect',
        code: 'INCORRECT_CURRENT_PASSWORD'
      });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    logger.info('Password changed successfully', { userId: user._id, email: user.email });

    res.json({
      status: 'success',
      message: 'Password changed successfully'
    });
  });
}

module.exports = new AuthController();