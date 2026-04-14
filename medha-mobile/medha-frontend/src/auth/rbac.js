/**
 * RBAC (Role-Based Access Control) Utilities for Medha Health Frontend
 */

// Role hierarchy - higher index = more permissions
const ROLE_HIERARCHY = ['patient', 'doctor', 'hospital_admin', 'super_admin'];

// Permission matrix: what each role can do
const ROLE_PERMISSIONS = {
  super_admin: {
    canViewAllHospitals: true,
    canManageHospitals: true,
    canViewAllDoctors: true,
    canManageAllDoctors: true,
    canViewAllPatients: true,
    canViewAllRecords: true,
    canViewSystemReports: true,
    canManageSettings: true,
    canViewBilling: true,
    canManageBilling: true,
  },
  hospital_admin: {
    canViewAllHospitals: false,
    canManageHospitals: false,
    canViewAllDoctors: true,
    canManageAllDoctors: true,
    canViewAllPatients: true,
    canViewAllRecords: true,
    canViewSystemReports: false,
    canManageSettings: true,
    canViewBilling: true,
    canManageBilling: true,
  },
  doctor: {
    canViewAllHospitals: false,
    canManageHospitals: false,
    canViewAllDoctors: false,
    canManageAllDoctors: false,
    canViewAllPatients: true,
    canViewAllRecords: true,
    canViewSystemReports: false,
    canManageSettings: false,
    canViewBilling: false,
    canManageBilling: false,
  },
  patient: {
    canViewAllHospitals: false,
    canManageHospitals: false,
    canViewAllDoctors: false,
    canManageAllDoctors: false,
    canViewAllPatients: false,
    canViewAllRecords: false,
    canViewSystemReports: false,
    canManageSettings: false,
    canViewBilling: false,
    canManageBilling: false,
  },
};

/**
 * Check if user has a specific role
 */
export const hasRole = (user, role) => {
  return user?.role === role;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (user, roles) => {
  return roles.includes(user?.role);
};

/**
 * Check if user's role is at or above a certain level
 */
export const hasMinimumRole = (user, minimumRole) => {
  const userLevel = ROLE_HIERARCHY.indexOf(user?.role);
  const minimumLevel = ROLE_HIERARCHY.indexOf(minimumRole);
  return userLevel >= minimumLevel;
};

/**
 * Check if user can access a specific feature
 */
export const canAccess = (user, feature) => {
  const userPermissions = ROLE_PERMISSIONS[user?.role] || ROLE_PERMISSIONS.patient;
  return userPermissions[feature] === true;
};

/**
 * Check if user is assigned to a specific hospital
 */
export const isInHospital = (user, hospitalId) => {
  if (!user || !hospitalId) return false;
  if (user.role === 'super_admin') return true; // Super admins can access any hospital
  return user.hospital_id === hospitalId;
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role) => {
  const displayNames = {
    super_admin: 'Super Administrator',
    hospital_admin: 'Hospital Administrator',
    doctor: 'Doctor',
    patient: 'Patient',
  };
  return displayNames[role] || role;
};

/**
 * Navigation menu items by role
 */
export const getNavItems = (user) => {
  const baseItems = [];
  
  if (!user) {
    return [
      { path: '/', label: 'Home' },
      { path: '/about', label: 'About' },
      { path: '/contact', label: 'Contact' },
      { path: '/portal', label: 'Portal' },
    ];
  }

  // Common items for authenticated users
  if (user.role === 'super_admin') {
    baseItems.push(
      { path: '/admin', label: 'Dashboard', icon: 'dashboard' },
      { path: '/admin/patients', label: 'Patients', icon: 'patients' },
      { path: '/admin/doctors', label: 'Doctors', icon: 'doctors' },
      { path: '/admin/registration', label: 'Registration', icon: 'registration' },
      { path: '/admin/billing', label: 'Billing', icon: 'billing' }
    );
  } else if (user.role === 'hospital_admin') {
    baseItems.push(
      { path: '/admin', label: 'Dashboard', icon: 'dashboard' },
      { path: '/admin/patients', label: 'Patients', icon: 'patients' },
      { path: '/admin/doctors', label: 'Doctors', icon: 'doctors' },
      { path: '/admin/registration', label: 'Registration', icon: 'registration' },
      { path: '/admin/billing', label: 'Billing', icon: 'billing' }
    );
  } else if (user.role === 'doctor') {
    baseItems.push(
      { path: '/doctor', label: 'Dashboard', icon: 'dashboard' }
    );
  } else if (user.role === 'patient') {
    baseItems.push(
      { path: '/patient', label: 'My Records', icon: 'records' }
    );
  }

  return baseItems;
};

/**
 * Check if user can access a specific route
 */
export const canAccessRoute = (user, route) => {
  if (!user) {
    return ['/', '/about', '/pricing', '/contact', '/portal', '/patient-portal', '/auth'].includes(route);
  }

  const routeAccess = {
    '/admin': ['super_admin', 'hospital_admin'],
    '/admin/patients': ['super_admin', 'hospital_admin'],
    '/admin/doctors': ['super_admin', 'hospital_admin'],
    '/admin/registration': ['super_admin', 'hospital_admin'],
    '/admin/billing': ['super_admin', 'hospital_admin'],
    '/admin/reports': ['super_admin', 'hospital_admin'],
    '/doctor': ['doctor'],
    '/patient': ['patient'],
  };

  const allowedRoles = routeAccess[route];
  if (!allowedRoles) return true; // Public route
  return allowedRoles.includes(user.role);
};

/**
 * RBAC Context values helper
 */
export const getRBACContext = (user) => {
  return {
    user,
    isAuthenticated: !!user,
    role: user?.role || null,
    hospitalId: user?.hospital_id || null,
    isSuperAdmin: user?.role === 'super_admin',
    isHospitalAdmin: user?.role === 'hospital_admin',
    isDoctor: user?.role === 'doctor',
    isPatient: user?.role === 'patient',
    isStaff: ['super_admin', 'hospital_admin', 'doctor'].includes(user?.role),
    permissions: ROLE_PERMISSIONS[user?.role] || ROLE_PERMISSIONS.patient,
  };
};
