import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getRBACContext } from './rbac';

const isElectron = !!window.electronAPI?.isElectron;

/**
 * ProtectedRoute - Guards routes based on:
 *   1. Environment — desktop-only routes redirect to /download in browser
 *   2. Authentication — unauthenticated users redirect to /auth (desktop) or /download (web)
 *   3. Role — unauthorized roles redirect to /
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const rbac = getRBACContext(user);

  // Browser users should never reach protected routes (App.jsx handles this),
  // but as a safety net, redirect to download page.
  if (!isElectron) {
    return <Navigate to="/download" replace />;
  }

  if (!rbac.isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * RoleGuard - Show/hide components based on user role
 */
export const RoleGuard = ({ children, allowedRoles, requiredRole }) => {
  const { user } = useAuth();
  const rbac = getRBACContext(user);

  if (!rbac.isAuthenticated) return null;
  if (requiredRole && user.role !== requiredRole) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return children;
};

/**
 * PermissionGuard - Show/hide components based on specific permissions
 */
export const PermissionGuard = ({ children, feature }) => {
  const { user } = useAuth();
  const rbac = getRBACContext(user);

  if (!rbac.isAuthenticated) return null;
  if (!user.permissions?.[feature]) return null;

  return children;
};

/**
 * HospitalGuard - Show/hide content based on hospital access
 */
export const HospitalGuard = ({ children, hospitalId }) => {
  const { user } = useAuth();
  const rbac = getRBACContext(user);

  if (!rbac.isAuthenticated) return null;
  if (rbac.isSuperAdmin) return children;
  if (user.hospital_id !== hospitalId) return null;

  return children;
};

export default ProtectedRoute;
