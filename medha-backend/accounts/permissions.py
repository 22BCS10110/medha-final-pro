"""
RBAC (Role-Based Access Control) Permission Classes for Medha Health
"""
from rest_framework import permissions
from functools import wraps
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework import status


class IsSuperAdmin(permissions.BasePermission):
    """Permission for super admin only"""
    message = "Only Super Admins can access this resource."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'super_admin'


class IsHospitalAdmin(permissions.BasePermission):
    """Permission for hospital admin only"""
    message = "Only Hospital Admins can access this resource."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'hospital_admin'


class IsDoctor(permissions.BasePermission):
    """Permission for doctors only"""
    message = "Only Doctors can access this resource."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'doctor'


class IsPatient(permissions.BasePermission):
    """Permission for patients only"""
    message = "Only Patients can access this resource."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'patient'


class IsStaff(permissions.BasePermission):
    """Permission for any staff member (super_admin, hospital_admin, doctor)"""
    message = "Only staff members can access this resource."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['super_admin', 'hospital_admin', 'doctor']


class HasHospitalAccess(permissions.BasePermission):
    """Permission for users with hospital assignment"""
    message = "You must be assigned to a hospital to access this resource."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.hospital is not None


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Object-level permission: allow object owner or read-only for others"""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.__dict__.get('user_id') == request.user.id or \
               obj.__dict__.get('patient_id') == getattr(request.user, 'patient_id', None)


class IsOwnerOrStaff(permissions.BasePermission):
    """Object-level: owner (patient) or hospital staff can access."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role in ('super_admin', 'hospital_admin', 'doctor'):
            return True
        if hasattr(obj, 'patient') and hasattr(obj.patient, 'user'):
            return obj.patient.user == user
        if hasattr(obj, 'user'):
            return obj.user == user
        return False


class BelongsToHospital(permissions.BasePermission):
    """Ensures the user belongs to the same hospital as the resource."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == 'super_admin':
            return True
        if user.role == 'patient':
            return True  # Patients are global
        if not hasattr(user, 'hospital') or not user.hospital:
            return False
        if hasattr(obj, 'hospital'):
            return obj.hospital == user.hospital
        return True


class HospitalScopedPermission(permissions.BasePermission):
    """
    Ensures users can only access data from their own hospital.
    Super admins can access all hospitals.
    """
    message = "You can only access data from your assigned hospital."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Super admins can access everything
        if request.user.role == 'super_admin':
            return True
        return True  # Will filter in get_queryset

    def filter_queryset_by_hospital(self, request, queryset, hospital_field='hospital_id'):
        """Filter queryset by user's hospital"""
        if request.user.role == 'super_admin':
            return queryset  # Super admin sees all
        
        if request.user.hospital_id:
            return queryset.filter(**{hospital_field: request.user.hospital_id})
        
        return queryset.none()


def require_roles(allowed_roles):
    """
    Decorator to require specific roles for a view.
    Usage: @require_roles(['super_admin', 'hospital_admin'])
    """
    def decorator(view):
        @wraps(view)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            if request.user.role not in allowed_roles:
                return Response(
                    {'error': f'Insufficient permissions. Required roles: {", ".join(allowed_roles)}'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return view(request, *args, **kwargs)
        return _wrapped_view
    return decorator


def require_hospital_access(view):
    """Decorator to require hospital assignment"""
    @wraps(view)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        if not request.user.hospital_id:
            return Response(
                {'error': 'Hospital assignment required'},
                status=status.HTTP_403_FORBIDDEN
            )
        return view(request, *args, **kwargs)
    return _wrapped_view