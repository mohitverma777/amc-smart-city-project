// src/config/constants.js - CORRECTED VERSION
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  AUTH: '/api/user-management/auth',
  USERS: '/api/user-management',
  GRIEVANCE: '/api/grievance',
  PROPERTY_TAX: '/api/property-tax',
  PAYMENT: '/api/payment',
  NOTIFICATION: '/api/notification'
};

export const USER_ROLES = {
  ADMIN: 'admin',
  OFFICER: 'officer',
  CITIZEN: 'citizen'
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user'
};