// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import adminService from '../services/adminService'; // Add this import
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = () => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
          console.log('✅ AuthContext: User restored from localStorage');
        }
      }
    } catch (error) {
      console.error('❌ AuthContext: Failed to restore user session:', error);
      localStorage.clear();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      console.log('🔐 AuthContext: Attempting login');
      
      const response = await authService.login(credentials);
      const { user: userData } = response.data;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      console.log('✅ AuthContext: Login successful');
      return userData;
    } catch (error) {
      console.error('❌ AuthContext: Login failed:', error);
      throw error;
    }
  };

  // FIXED: Register method should determine if it's admin creating user or citizen self-registering
  const register = async (userData) => {
    try {
      console.log('📝 AuthContext: Attempting registration for role:', userData.role);
      
      // Check if current user is admin and trying to create another user
      if (user && user.role === 'admin' && userData.role) {
        console.log('👑 Admin creating user via adminService');
        const response = await adminService.createUser(userData);
        // Don't update current user context for admin creating others
        console.log('✅ AuthContext: Admin user creation successful');
        return response.data.user;
      } else {
        // Citizen self-registration
        console.log('👤 Citizen self-registration via authService');
        const response = await authService.registerCitizen(userData);
        const { user: newUser } = response.data;
        
        setUser(newUser);
        setIsAuthenticated(true);
        
        console.log('✅ AuthContext: Citizen registration successful');
        return newUser;
      }
    } catch (error) {
      console.error('❌ AuthContext: Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 AuthContext: Logging out user');
      
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      
      toast.success('Logged out successfully');
      console.log('✅ AuthContext: Logout successful');
    } catch (error) {
      console.error('❌ AuthContext: Logout failed:', error);
      // Still clear local state even if API call fails
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    // Add helper methods
    isAdmin: () => user?.role === 'admin',
    isOfficer: () => user?.role === 'officer',
    isCitizen: () => user?.role === 'citizen'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
