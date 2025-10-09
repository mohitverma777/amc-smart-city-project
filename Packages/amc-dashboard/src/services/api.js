// src/services/api.js
import axios from 'axios';
import { toast } from 'react-hot-toast';

// ✅ Updated to use environment variable or fallback to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

console.log('🔗 API Configuration:', {
  baseURL: API_BASE_URL,
  environment: process.env.NODE_ENV
});

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // ✅ Increased to 30 seconds for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Only log non-file data
    if (config.data && !(config.data instanceof FormData)) {
      console.log('📤 Request Data:', config.data);
    } else if (config.data instanceof FormData) {
      console.log('📤 Request: FormData (multipart)');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and errors
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    
    // Only log non-blob data
    if (!(response.data instanceof Blob)) {
      console.log('📥 Response Data:', response.data);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: originalRequest?.url,
      method: originalRequest?.method,
      code: error.code
    });

    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      toast.error('Cannot connect to server. Please check if backend is running on port 3000.');
      return Promise.reject(error);
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      toast.error('Request timeout - please try again');
      return Promise.reject(error);
    }

    // Handle 404 errors
    if (error.response?.status === 404) {
      const errorMessage = error.response?.data?.message || 'Resource not found';
      console.error('❌ 404 Error:', errorMessage);
      
      // Don't show toast for 404s on automatic requests
      if (!originalRequest._autoRetry) {
        toast.error(errorMessage);
      }
      
      return Promise.reject(error);
    }

    // Handle 403 errors
    if (error.response?.status === 403) {
      toast.error('Access denied. You do not have permission to perform this action.');
      return Promise.reject(error);
    }

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        console.log('🔄 Attempting to refresh access token...');
        
        const response = await axios.post(
          `${API_BASE_URL}/api/user-management/auth/refresh-token`,
          { refreshToken }
        );
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
        
        // Update tokens
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        // Update the failed request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        console.log('✅ Token refreshed successfully');
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Clear all auth data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Redirect to login
        toast.error('Session expired. Please login again.');
        
        // Delay redirect slightly to show toast
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
        
        return Promise.reject(refreshError);
      }
    }

    // Handle validation errors (400)
    if (error.response?.status === 400) {
      const errorMessage = error.response?.data?.message || 'Invalid request';
      toast.error(errorMessage);
      return Promise.reject(error);
    }

    // Handle server errors (500+)
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
      return Promise.reject(error);
    }

    // Generic error handling
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    toast.error(errorMessage);
    
    return Promise.reject(error);
  }
);

export default api;
