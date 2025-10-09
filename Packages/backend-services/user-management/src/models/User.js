// Packages/backend-services/user-management/src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
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
  
  // Citizens have citizenId, Officers/Admins have employeeId
  citizenId: {
    type: String,
    trim: true,
    sparse: true, // Allow null/undefined
    unique: true,
    validate: {
      validator: function(value) {
        // citizenId required only for citizens
        if (this.role === 'citizen') {
          return value && value.length >= 6;
        }
        return true; // Not required for admin/officer
      },
      message: 'Citizen ID must be at least 6 characters long'
    }
  },
  
  employeeId: {
    type: String,
    trim: true,
    sparse: true, // Allow null/undefined
    unique: true,
    validate: {
      validator: function(value) {
        // employeeId required only for officers/admins
        if (this.role === 'officer' || this.role === 'admin') {
          return value && value.length >= 3;
        }
        return true; // Not required for citizens
      },
      message: 'Employee ID must be at least 3 characters long'
    }
  },
  
  // Admin/Officer specific fields
  department: {
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        // department required only for officers/admins
        if (this.role === 'officer' || this.role === 'admin') {
          return value && value.length > 0;
        }
        return true; // Not required for citizens
      },
      message: 'Department is required for officers and admins'
    }
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
  
  // Audit fields for admin-created users
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  
  createdByRole: {
    type: String,
    enum: ['self', 'admin', 'system'],
    default: 'self'
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
userSchema.index({ citizenId: 1 }, { sparse: true });
userSchema.index({ employeeId: 1 }, { sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ createdBy: 1 });

// Pre-save validation for role-specific required fields
userSchema.pre('validate', function(next) {
  // Ensure citizens have citizenId
  if (this.role === 'citizen' && !this.citizenId) {
    this.invalidate('citizenId', 'Citizen ID is required for citizens');
  }
  
  // Ensure officers/admins have employeeId and department
  if ((this.role === 'officer' || this.role === 'admin')) {
    if (!this.employeeId) {
      this.invalidate('employeeId', 'Employee ID is required for officers and admins');
    }
    if (!this.department) {
      this.invalidate('department', 'Department is required for officers and admins');
    }
  }
  
  next();
});

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

// Static method to find by credentials
userSchema.statics.findByCredentials = async function(identifier, password) {
  const user = await this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { mobileNumber: identifier },
      { employeeId: identifier },
      { citizenId: identifier }
    ],
    isActive: true
  }).select('+password');
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid login credentials');
  }
  
  return user;
};

module.exports = mongoose.model('User', userSchema);
