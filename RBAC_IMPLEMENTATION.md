# RBAC (Role-Based Access Control) Implementation

## Overview

Medha Health Intelligance now has a complete RBAC system implemented across both backend (Django) and frontend (React).

## Role Hierarchy

```
Super Admin (highest)
    ↓
Hospital Admin
    ↓
Doctor
    ↓
Patient (lowest)
```

## Roles & Permissions

### Super Admin
- Full access to all hospitals and data
- Can manage all hospital admins, doctors, patients
- Can view system-wide reports and billing
- Bypasses hospital data isolation

### Hospital Admin
- Full access to their assigned hospital only
- Can manage doctors and patients within their hospital
- Can view billing and generate reports for their hospital
- Cannot access other hospitals' data

### Doctor
- Can view patients globally (cross-hospital access)
- Can create prescriptions and medical records
- Can only see their hospital's appointments and data
- Cannot manage users or billing

### Patient
- Can only access their own data
- Can view medical records, prescriptions, appointments
- Can access data globally across all hospitals they visit
- No admin capabilities

## Backend Implementation

### Files Created/Modified

1. **`accounts/permissions.py`** - Permission classes and decorators
   - `IsSuperAdmin`, `IsHospitalAdmin`, `IsDoctor`, `IsPatient`
   - `IsStaff` - For any staff member
   - `HasHospitalAccess` - Requires hospital assignment
   - `IsOwnerOrReadOnly` - Object-level ownership
   - `HospitalScopedPermission` - Filters data by hospital
   - `@require_roles()` decorator - Function-based view decorator
   - `@require_hospital_access` decorator

### Usage Examples

```python
# Using permission classes
from accounts.permissions import IsSuperAdmin, IsHospitalAdmin

@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def super_admin_only_view(request):
    ...

# Using decorators
from accounts.permissions import require_roles

@require_roles(['super_admin', 'hospital_admin'])
@api_view(['GET'])
def admin_view(request):
    ...

# Hospital-scoped filtering
permission = HospitalScopedPermission()
queryset = permission.filter_queryset_by_hospital(
    request, 
    MyModel.objects.all(), 
    hospital_field='hospital_id'
)
```

## Frontend Implementation

### Files Created/Modified

1. **`context/rbac.js`** - RBAC utility functions and permission matrix
2. **`context/AuthContext.jsx`** - Updated with RBAC helpers
3. **`components/guards/ProtectedRoute.jsx`** - Route guards
4. **`App.jsx`** - Updated with protected routes

### Guard Components

```jsx
// ProtectedRoute - Protect entire routes
<ProtectedRoute allowedRoles={['super_admin', 'hospital_admin']}>
  <AdminDashboard />
</ProtectedRoute>

// RoleGuard - Show/hide components
<RoleGuard allowedRoles={['super_admin']}>
  <SuperAdminOnlyComponent />
</RoleGuard>

// PermissionGuard - Permission-based access
<PermissionGuard feature="canManageBilling">
  <BillingButton />
</PermissionGuard>

// HospitalGuard - Hospital-scoped access
<HospitalGuard hospitalId="hospital-123">
  <HospitalContent />
</HospitalGuard>
```

### AuthContext RBAC Helpers

```jsx
const {
  user,
  isSuperAdmin,
  isHospitalAdmin,
  isDoctor,
  isPatient,
  isStaff,
  hospitalId,
  permissions,
  hasRole,
  hasAnyRole,
  canAccess,
  isInHospital,
} = useAuth();
```

### Permission Matrix Reference

```js
// Check if user can do something
if (canAccess('canManageBilling')) { ... }
if (hasRole('super_admin')) { ... }
if (hasAnyRole(['super_admin', 'hospital_admin'])) { ... }
if (isInHospital('hospital-123')) { ... }
```

## Route Protection

| Route | Allowed Roles |
|-------|--------------|
| `/` | All (Public) |
| `/about` | All (Public) |
| `/pricing` | All (Public) |
| `/contact` | All (Public) |
| `/portal` | All (Public) |
| `/patient-portal` | All (Public) |
| `/admin` | Super Admin, Hospital Admin |
| `/admin/patients` | Super Admin, Hospital Admin |
| `/admin/doctors` | Super Admin, Hospital Admin |
| `/admin/billing` | Super Admin, Hospital Admin |
| `/admin/reports` | Super Admin, Hospital Admin |
| `/doctor` | Doctor |
| `/patient` | Patient |

## Testing RBAC

### Create Test Users

```bash
# Create super admin
python manage.py createsuperuser
# Then set role in Django admin or shell:
# User.objects.filter(username='admin').update(role='super_admin')

# Create hospital admin
# Assign role='hospital_admin' and hospital_id

# Create doctor
# Assign role='doctor' and hospital_id

# Create patient
# Register via patient portal
```

### Test Scenarios

1. **Unauthenticated Access**
   - Navigate to `/admin` → Redirects to `/auth`

2. **Patient Accessing Admin**
   - Login as patient → Try `/admin` → Redirects to `/`

3. **Doctor Accessing Admin**
   - Login as doctor → Try `/admin` → Redirects to `/`

4. **Hospital Admin Hospital Isolation**
   - Login as Hospital A admin → Should only see Hospital A data

5. **Super Admin Full Access**
   - Login as super admin → Can see all hospitals

## Security Notes

1. Backend permissions are the source of truth
2. Frontend guards are for UX (never rely solely on frontend)
3. Always validate permissions on the server
4. Use `@require_roles()` decorator for function views
5. Use `permission_classes` for class-based viewsets
6. Hospital middleware should filter querysets by hospital_id