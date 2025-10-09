// src/services/adminService.js
import api from './api';

class AdminService {
  // Create user (admin creates any type of user)
  async createUser(userData) {
    try {
      console.log('👑 AdminService: Creating user with role:', userData.role);
      
      // Get token to ensure we're authenticated
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated. Please login first.');
      }
      
      const payload = {
        name: userData.name,
        email: userData.email.toLowerCase(),
        mobileNumber: userData.mobileNumber,
        password: userData.password,
        role: userData.role || 'admin'
      };

      // Add role-specific fields
      if (userData.role === 'citizen') {
        payload.citizenId = userData.citizenId;
        payload.ward = userData.ward;
        // Optional fields
        if (userData.address) payload.address = userData.address;
        if (userData.dateOfBirth) payload.dateOfBirth = userData.dateOfBirth;
        if (userData.gender) payload.gender = userData.gender;
      } else if (userData.role === 'officer' || userData.role === 'admin') {
        payload.employeeId = userData.employeeId;
        payload.department = userData.department;
        payload.ward = userData.ward || 'Administrative';
      }

      console.log('📤 AdminService: Sending payload:', payload);
      
      const response = await api.post('/api/user-management/admin/users', payload);
      
      if (response.data && response.data.status === 'success') {
        console.log('✅ AdminService: User created successfully');
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ AdminService: User creation failed:', error);
      
      // Enhanced error handling
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.response?.status === 403) {
        throw new Error('Admin access required.');
      } else if (error.response?.data?.errors) {
        const errorMessage = error.response.data.errors.join(', ');
        throw new Error(errorMessage);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to create user. Please try again.');
      }
    }
  }

  // Get all users (paginated and filtered)
  async getAllUsers(filters = {}) {
    try {
      console.log('📋 AdminService: Fetching users with filters:', filters);
      
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.role) params.append('role', filters.role);
      if (filters.department) params.append('department', filters.department);
      if (filters.ward) params.append('ward', filters.ward);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/api/user-management/admin/users?${params}`);
      
      if (response.data && response.data.status === 'success') {
        console.log('✅ AdminService: Users fetched successfully');
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ AdminService: Failed to fetch users:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(userId, updateData) {
    try {
      console.log('📝 AdminService: Updating user:', userId);
      
      const response = await api.put(`/api/user-management/admin/users/${userId}`, updateData);
      
      if (response.data && response.data.status === 'success') {
        console.log('✅ AdminService: User updated successfully');
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ AdminService: User update failed:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      console.log('📊 AdminService: Fetching user statistics');
      
      const response = await api.get('/api/user-management/admin/stats');
      
      if (response.data && response.data.status === 'success') {
        console.log('✅ AdminService: Stats fetched successfully');
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ AdminService: Failed to fetch stats:', error);
      throw error;
    }
  }

  // Validate user data before creation
  validateUserData(userData) {
    const errors = [];
    
    // Common validations
    if (!userData.name || userData.name.length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    
    if (!userData.email || !userData.email.includes('@')) {
      errors.push('Valid email is required');
    }
    
    if (!userData.mobileNumber || !/^[6-9]\d{9}$/.test(userData.mobileNumber)) {
      errors.push('Valid mobile number is required (10 digits starting with 6-9)');
    }
    
    if (!userData.password || userData.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!userData.role) {
      errors.push('Role is required');
    }

    // Role-specific validations
    if (userData.role === 'citizen') {
      if (!userData.citizenId || userData.citizenId.length < 6) {
        errors.push('Citizen ID must be at least 6 characters long');
      }
      if (!userData.ward) {
        errors.push('Ward is required for citizens');
      }
    } else if (userData.role === 'officer' || userData.role === 'admin') {
      if (!userData.employeeId || userData.employeeId.length < 3) {
        errors.push('Employee ID is required for officers and admins');
      }
      if (!userData.department) {
        errors.push('Department is required for officers and admins');
      }
    }
    
    return errors;
  }
}

const adminService = new AdminService();
export default adminService;
