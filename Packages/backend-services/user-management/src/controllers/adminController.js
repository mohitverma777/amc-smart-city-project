// Packages/backend-services/user-management/src/controllers/adminController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

class AdminController {
  // Validation for admin user creation
  validateAdminUserCreation(data) {
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
    
    if (!data.role || !['citizen', 'officer', 'admin'].includes(data.role)) {
      errors.push('Valid role is required (citizen, officer, admin)');
    }
    
    // Different validation based on role
    if (data.role === 'citizen') {
      if (!data.citizenId || data.citizenId.length < 6) {
        errors.push('Citizen ID must be at least 6 characters long');
      }
      if (!data.ward) {
        errors.push('Ward is required for citizens');
      }
    } else if (data.role === 'officer' || data.role === 'admin') {
      if (!data.employeeId || data.employeeId.length < 3) {
        errors.push('Employee ID is required for officers/admins');
      }
      if (!data.department) {
        errors.push('Department is required for officers/admins');
      }
    }
    
    return errors;
  }

  // Admin creates any type of user
  createUser = async (req, res) => {
    try {
      console.log('👑 Admin user creation request received:', {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        adminId: req.user.id
      });

      // Validate input
      const validationErrors = this.validateAdminUserCreation(req.body);
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
        role,
        citizenId,
        employeeId,
        ward,
        department,
        address,
        dateOfBirth,
        gender
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { mobileNumber },
          ...(citizenId ? [{ citizenId }] : []),
          ...(employeeId ? [{ employeeId }] : [])
        ]
      });

      if (existingUser) {
        let field = 'email';
        if (existingUser.mobileNumber === mobileNumber) field = 'mobile number';
        if (existingUser.citizenId === citizenId) field = 'citizen ID';
        if (existingUser.employeeId === employeeId) field = 'employee ID';
        
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
        role,
        createdBy: req.user.id,
        createdByRole: 'admin'
      };

      // Add role-specific fields
      if (role === 'citizen') {
        userData.citizenId = citizenId;
        userData.ward = ward;
      } else if (role === 'officer' || role === 'admin') {
        userData.employeeId = employeeId;
        userData.department = department;
        userData.ward = ward || 'Administrative'; // Default for staff
      }

      // Add optional fields
      if (address) userData.address = address;
      if (dateOfBirth) userData.dateOfBirth = dateOfBirth;
      if (gender) userData.gender = gender;

      console.log('🔄 Admin creating new user...');
      const user = new User(userData);
      await user.save();

      console.log(`✅ Admin created ${role} successfully: ${user.email}`);

      // Log the action for audit
      console.log(`📋 Audit: Admin ${req.user.email} created ${role} account for ${user.email}`);

      res.status(201).json({
        status: 'success',
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
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
            createdBy: user.createdBy,
            createdByRole: user.createdByRole
          }
        }
      });
    } catch (error) {
      console.error('💥 Admin user creation error:', error);
      res.status(500).json({
        status: 'error',
        message: 'User creation failed',
        code: 'USER_CREATION_FAILED',
        details: error.message
      });
    }
  };

  // Get all users (admin only)
  getAllUsers = async (req, res) => {
    try {
      const { page = 1, limit = 10, role, department, ward } = req.query;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = { isActive: true };
      if (role) filter.role = role;
      if (department) filter.department = department;
      if (ward) filter.ward = ward;

      const users = await User.find(filter)
        .select('-password')
        .populate('createdBy', 'name email')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(filter);

      res.json({
        status: 'success',
        data: {
          users,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('💥 Get all users error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch users',
        code: 'FETCH_USERS_FAILED'
      });
    }
  };

  // Update user (admin only)
  updateUser = async (req, res) => {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      // Remove sensitive fields that shouldn't be updated directly
      delete updateData.password;
      delete updateData.createdBy;
      delete updateData.createdByRole;

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      console.log(`📝 Admin ${req.user.email} updated user ${user.email}`);

      res.json({
        status: 'success',
        message: 'User updated successfully',
        data: { user }
      });
    } catch (error) {
      console.error('💥 Update user error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update user',
        code: 'UPDATE_USER_FAILED'
      });
    }
  };

  // Deactivate user (admin only)
  deactivateUser = async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      console.log(`🚫 Admin ${req.user.email} deactivated user ${user.email}`);

      res.json({
        status: 'success',
        message: 'User deactivated successfully',
        data: { user }
      });
    } catch (error) {
      console.error('💥 Deactivate user error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to deactivate user',
        code: 'DEACTIVATE_USER_FAILED'
      });
    }
  };

  // Get user statistics (admin only)
  getUserStats = async (req, res) => {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
            inactive: { $sum: { $cond: ['$isActive', 0, 1] } }
          }
        }
      ]);

      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });

      res.json({
        status: 'success',
        data: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          byRole: stats
        }
      });
    } catch (error) {
      console.error('💥 Get user stats error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user statistics',
        code: 'FETCH_STATS_FAILED'
      });
    }
  };
}

module.exports = new AdminController();
