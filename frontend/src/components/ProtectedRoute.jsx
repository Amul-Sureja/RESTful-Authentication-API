import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Wraps routes that require authentication.
 * If no accessToken in localStorage → redirect to /login
 * Preserves the intended URL so the user lands there after login.
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;