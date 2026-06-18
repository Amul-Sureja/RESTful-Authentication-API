import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Wraps routes that should NOT be accessible when already logged in
 * (e.g. /login, /register, /forgot-password, /reset-password).
 * If accessToken exists → redirect to /profile.
 */
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');

  if (token) {
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default PublicRoute;