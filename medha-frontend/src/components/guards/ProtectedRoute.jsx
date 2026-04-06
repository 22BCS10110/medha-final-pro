import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccessRoute, getRBACContext } from '../../context/rbac';

/**
 * ProtectedRoute - Guards routes based on user authentication and role
 * 
 * Usage:
 * <ProtectedRoute>
 *   <AdminDashboard />
 * </ProtectedRoute>
 * 
 * <ProtectedRoute allowedRoles={['super_admin', 'hospital_admin']}>
 *   <AdminPage />
 * </ProtectedRoute>
 */
export const ProtectedRoute = ({ children, allowedRoles, fallbackPath = '/auth' }) => {
  const { user } = useAuth();
  const rbac = getRBACContext(user);

  // Check authentication
  if (!rbac.isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * RoleGuard - Show/hide components based on user role
 * 
 * Usage:
 * <RoleGuard allowedRoles={['super_admin', 'hospital_admin']}>
 *   <AdminButton />
 * </RoleGuard>
 * 
 * <RoleGuard requiredRole="super_admin">
 *   <SuperAdminOnly />
 * </RoleGuard>
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
 * 
 * Usage:
 * <PermissionGuard feature="canManageBilling">
 *   <BillingButton />
 * </PermissionGuard>
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
 * 
 * Usage:
 * <HospitalGuard hospitalId="hospital-123">
 *   <HospitalContent />
 * </HospitalGuard>
 */
export const HospitalGuard = ({ children, hospitalId }) => {
  const { user } = useAuth();
  const rbac = getRBACContext(user);

  if (!rbac.isAuthenticated) return null;

  // Super admins can access any hospital
  if (rbac.isSuperAdmin) return children;

  // Check hospital match
  if (user.hospital_id !== hospitalId) return null;

  return children;
};

export default ProtectedRoute;