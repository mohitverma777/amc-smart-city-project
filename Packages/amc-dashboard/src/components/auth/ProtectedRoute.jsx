import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../../services/auth';

const ProtectedRoute = ({ children, requiredRole }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole && currentUser?.role !== requiredRole) {
    // Check if user has sufficient privileges
    const roleHierarchy = ['citizen', 'officer', 'admin'];
    const userRoleIndex = roleHierarchy.indexOf(currentUser?.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    if (userRoleIndex < requiredRoleIndex) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
