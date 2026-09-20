import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/incident';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo,
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const defaultRedirect = allowedRoles.includes('official') || allowedRoles.includes('admin') ? '/gov/login' : '/auth';
  const targetRedirect = redirectTo || defaultRedirect;

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={targetRedirect} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={targetRedirect} replace />;
  }

  return <>{children}</>;
};
