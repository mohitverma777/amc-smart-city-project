const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  citizenId: {
    type: String,
    required: [true, 'Citizen ID is required'],
    unique: true,
    trim: true
  },
  
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false
  },
  
  // Role and Status
  role: {
    type: String,
    enum: ['citizen', 'officer', 'admin'],
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
    trim: true
  },
  
  address: {
    street: String,
    area: String,
    pincode: String
  },
  
  // Verification Status
  verificationStatus: {
    mobile: { type: Boolean, default: false },
    email: { type: Boolean, default: false }
  },
  
  // Profile Information
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  
  // Security Fields
  lastLogin: Date
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ mobileNumber: 1 });
userSchema.index({ citizenId: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);