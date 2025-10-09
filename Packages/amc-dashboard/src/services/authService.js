// src/services/authService.js
import api from './api';

class AuthService {
  // Login user (for both admin and citizen apps)
  async login(credentials) {
    try {
      console.log('🔐 AuthService: Attempting login');
      const response = await api.post('/api/user-management/auth/login', {
        identifier: credentials.identifier.trim(),
        password: credentials.password
      });
      
      if (response.data && response.data.status === 'success') {
        const { data } = response.data;
        
        // Store tokens and user data
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('✅ AuthService: Login successful');
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ AuthService: Login failed:', error);
      throw error;
    }
  }

  // Register citizen (ONLY for citizen self-registration app)
  async registerCitizen(userData) {
    try {
      console.log('📝 AuthService: Attempting citizen registration');
      const response = await api.post('/api/user-management/auth/register', {
        name: userData.name,
        email: userData.email.toLowerCase(),
        mobileNumber: userData.mobileNumber,
        password: userData.password,
        citizenId: userData.citizenId,
        ward: userData.ward || 'Ward-1',
        address: userData.address,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender
        // Note: No role field - backend forces it to 'citizen'
      });
      
      if (response.data && response.data.status === 'success') {
        const { data } = response.data;
        
        // Store tokens and user data (citizen logs in immediately after registration)
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('✅ AuthService: Citizen registration successful');
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ AuthService: Citizen registration failed:', error);
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/api/user-management/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if current user is admin
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  }

  // Check if current user is officer
  isOfficer() {
    const user = this.getCurrentUser();
    return user && user.role === 'officer';
  }
}

const authService = new AuthService();
export default authService;

// Named exports for backward compatibility
export const loginUser = (credentials) => authService.login(credentials);
export const registerCitizen = (userData) => authService.registerCitizen(userData); // Changed name
export const logoutUser = () => authService.logout();

// New exports
export const isAuthenticated = () => authService.isAuthenticated();
export const getCurrentUser = () => authService.getCurrentUser();
export const isAdmin = () => authService.isAdmin();
export const isOfficer = () => authService.isOfficer();
