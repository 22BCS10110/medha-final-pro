"""
Supabase JWT Authentication Backend for Django REST Framework
Integrates Supabase Auth with Django User model.
"""
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .supabase_auth import verify_supabase_token, get_or_create_django_user


class SupabaseJWTAuthentication(BaseAuthentication):
    """
    DRF Authentication class for Supabase JWT tokens.
    
    Usage in views:
        authentication_classes = [SupabaseJWTAuthentication]
        permission_classes = [IsAuthenticated, IsPatient]
    
    The JWT must contain:
        - sub: Supabase user ID
        - app_metadata.role: User role (patient, doctor, hospital_admin, super_admin)
        - app_metadata.hospital_id: Hospital assignment (optional)
    """
    keyword = 'Bearer'
    
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith(f'{self.keyword} '):
            return None  # No token, let other auth classes handle
        
        token = auth_header[len(self.keyword) + 1:]
        
        if not token:
            return None
        
        # Verify token and get payload
        try:
            payload = verify_supabase_token(token)
        except AuthenticationFailed:
            raise
        
        # Get or create Django user from Supabase claims
        try:
            user = get_or_create_django_user(payload)
        except Exception as e:
            raise AuthenticationFailed(f"Failed to authenticate user: {str(e)}")
        
        # Attach JWT payload to user for access in views
        user.supabase_payload = payload
        
        return (user, token)
    
    def authenticate_header(self, request):
        return self.keyword


class OptionalSupabaseJWTAuthentication(SupabaseJWTAuthentication):
    """
    Same as SupabaseJWTAuthentication but doesn't fail if no token is provided.
    Useful for endpoints that work for both authenticated and anonymous users.
    """
    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except AuthenticationFailed:
            return None