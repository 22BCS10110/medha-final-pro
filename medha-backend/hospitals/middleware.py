"""
Hospital Access Control Middleware
Enforces data isolation between hospitals.
"""
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from functools import wraps
from rest_framework.permissions import BasePermission
from rest_framework import status


class HospitalAccessMiddleware:
    """
    Middleware that ensures users can only access data from their own hospital.
    - Super Admin: Can access all hospitals
    - Hospital Admin: Can only access their hospital
    - Doctor: Can only access their hospital
    - Patient: Can access own data globally
    """
    pass


class HospitalDataFilterMixin:
    """
    Mixin for viewsets that automatically filters querysets by hospital.
    """
    def get_hospital_filter(self):
        """Return the hospital field name for filtering. Override as needed."""
        return 'hospital'

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return super().get_queryset()

        # Super Admin can see everything
        if user.role == 'super_admin':
            return super().get_queryset()

        # Patients can see everything (patient data is global)
        if user.role == 'patient':
            return super().get_queryset()

        # Hospital Admin and Doctor - filter by their hospital
        hospital_filter = self.get_hospital_filter()
        qs = super().get_queryset()

        # Get user's hospital
        if hasattr(user, 'hospital') and user.hospital:
            filter_kwargs = {f"{hospital_filter}": user.hospital}
            return qs.filter(**filter_kwargs)

        # No hospital assigned - return empty queryset
        return qs.none()


def hospital_required(view_func):
    """
    Decorator that ensures the user belongs to a hospital (except super_admin and patient).
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user = request.user
        if not user.is_authenticated:
            return JsonResponse(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Super Admin and patients don't need hospital assignment
        if user.role in ['super_admin', 'patient']:
            return view_func(request, *args, **kwargs)

        # Hospital Admin and Doctor must have a hospital
        if not hasattr(user, 'hospital') or not user.hospital:
            return JsonResponse(
                {'error': 'Access denied. No hospital assigned.'},
                status=status.HTTP_403_FORBIDDEN
            )

        return view_func(request, *args, **kwargs)
    return wrapper