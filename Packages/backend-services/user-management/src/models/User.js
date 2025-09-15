const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    trim: true,
    maxlength: 200
  },
  area: {
    type: String,
    trim: true,
    maxlength: 100
  },
  pincode: {
    type: String,
    match: [/^\d{6}$/, 'Invalid pincode format']
  },
  landmark: {
    type: String,
    trim: true,
    maxlength: 100
  }
});

const verificationStatusSchema = new mongoose.Schema({
  mobile: {
    type: Boolean,
    default: false
  },
  email: {
    type: Boolean,
    default: false
  },
  document: {
    type: Boolean,
    default: false
  }
});

const userSchema = new mongoose.Schema({
  // Basic Information
  citizenId: {
    type: String,
    required: [true, 'Citizen ID is required'],
    unique: true,
    trim: true,
    minlength: [6, 'Citizen ID must be at least 6 characters'],
    maxlength: [20, 'Citizen ID cannot exceed 20 characters']
  },
  
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid mobile number']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },
  
  // Role and Status
  role: {
    type: String,
    enum: {
      values: ['citizen', 'officer', 'admin'],
      message: 'Role must be either citizen, officer, or admin'
    },
    default: 'citizen'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Location Information
  ward: {
    type: String,
    required: [true, 'Ward is required'],
    trim: true,
    maxlength: 50
  },
  
  zone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  
  address: addressSchema,
  
  // Verification Status
  verificationStatus: verificationStatusSchema,
  
  // Profile Information
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date < new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    lowercase: true
  },
  
  profilePicture: {
    type: String, // URL to uploaded image
    trim: true
  },
  
  // Authentication Fields
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  mobileOTP: String,
  mobileOTPExpires: Date,
  
  // Security Fields
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Refresh Token for JWT
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '7d'
    }
  }],
  
  // Preferences
  preferences: {
    language: {
      type: String,
      enum: ['english', 'gujarati', 'hindi'],
      default: 'english'
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light'
    }
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.refreshTokens;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ mobileNumber: 1 });
userSchema.index({ citizenId: 1 });
userSchema.index({ ward: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Virtuals
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  
  const parts = [];
  if (this.address.street) parts.push(this.address.street);
  if (this.address.area) parts.push(this.address.area);
  if (this.address.pincode) parts.push(this.address.pincode);
  
  return parts.join(', ');
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware for email lowercase
userSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Instance Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function() {
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role,
    citizenId: this.citizenId,
    ward: this.ward
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

userSchema.methods.generateRefreshToken = function() {
  const payload = {
    id: this._id,
    type: 'refresh'
  };
  
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

userSchema.methods.generateMobileOTP = function() {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  this.mobileOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
  
  this.mobileOTPExpires = Date.now() + parseInt(process.env.OTP_EXPIRES_IN) || 10 * 60 * 1000; // 10 minutes
  
  return otp;
};

userSchema.methods.verifyMobileOTP = function(otp) {
  if (!this.mobileOTP || !this.mobileOTPExpires) {
    return false;
  }
  
  if (this.mobileOTPExpires < Date.now()) {
    return false;
  }
  
  const hashedOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
  
  return this.mobileOTP === hashedOTP;
};

// Handle login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static Methods
userSchema.statics.findByCredentials = async function(identifier, password) {
  // Find user by email or mobile number
  const user = await this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { mobileNumber: identifier }
    ],
    isActive: true
  }).select('+password');
  
  if (!user) {
    throw new Error('Invalid login credentials');
  }
  
  // Check if account is locked
  if (user.isLocked) {
    // Increment login attempts even for locked accounts
    await user.incLoginAttempts();
    throw new Error('Account is temporarily locked due to too many failed login attempts');
  }
  
  // Check password
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    await user.incLoginAttempts();
    throw new Error('Invalid login credentials');
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }
  
  // Update last login
  user.lastLogin = new Date();
  await user.save();
  
  return user;
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

userSchema.statics.findByMobile = function(mobileNumber) {
  return this.findOne({ mobileNumber, isActive: true });
};

userSchema.statics.findByCitizenId = function(citizenId) {
  return this.findOne({ citizenId, isActive: true });
};

// Export model
module.exports = mongoose.model('User', userSchema);