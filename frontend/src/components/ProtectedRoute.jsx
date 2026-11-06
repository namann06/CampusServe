import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Peer providers (resident + isPeerProvider) have dual capability to view the provider dashboard
    if (user.isPeerProvider && allowedRoles.includes('ROLE_PROVIDER')) {
      return children;
    }
    // If provider tries to view resident dashboard or vice versa, redirect to their role home
    if (user.role === 'ROLE_ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'ROLE_PROVIDER') return <Navigate to="/provider" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
