"""
Supabase Authentication Module for Django Backend
Handles JWT verification and user creation from Supabase auth.
"""
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from rest_framework.exceptions import AuthenticationFailed
import base64
import json
import time

from hospitals.models import Hospital

User = get_user_model()

# JWKS cache (with expiration)
_JWKS_CACHE = None
_JWKS_CACHE_TIME = 0
_JWKS_CACHE_DURATION = 3600  # 1 hour


def _get_supabase_jwks_url():
    """Get the JWKS URL for Supabase"""
    url = getattr(settings, 'SUPABASE_URL', '')
    if not url.endswith('/'):
        url += '/'
    return f"{url}auth/v1/jwks"


def _get_jwks():
    """Fetch and return Supabase JWKS (JSON Web Key Set)."""
    global _JWKS_CACHE, _JWKS_CACHE_TIME

    if _JWKS_CACHE and (time.time() - _JWKS_CACHE_TIME) < _JWKS_CACHE_DURATION:
        return _JWKS_CACHE

    try:
        response = requests.get(_get_supabase_jwks_url(), timeout=10)
        response.raise_for_status()
        _JWKS_CACHE = response.json()
        _JWKS_CACHE_TIME = time.time()
        return _JWKS_CACHE
    except requests.RequestException as e:
        raise AuthenticationFailed(f"Failed to fetch JWKS: {str(e)}")


def _verify_jwt_signature(jwt_token):
    """
    Verify JWT signature using Supabase JWKS.
    Returns the decoded payload if valid.
    """
    try:
        import jwt
        from jwt import PyJWKClient, InvalidTokenError
    except ImportError:
        raise AuthenticationFailed("PyJWT is required. Install with: pip install PyJWT")

    try:
        jwk_client = PyJWKClient(_get_supabase_jwks_url(), cache_jwk_set=True)
        signing_key = jwk_client.get_signing_key_from_jwt(jwt_token)

        payload = jwt.decode(
            jwt_token,
            signing_key.key,
            algorithms=["HS256", "RS256"],
            audience="authenticated",
            options={"verify_exp": True, "verify_nbf": True, "verify_iat": True}
        )
        return payload

    except InvalidTokenError as e:
        raise AuthenticationFailed(f"Invalid token: {str(e)}")
    except AuthenticationFailed:
        raise
    except Exception as e:
        raise AuthenticationFailed(f"Token verification failed: {str(e)}")


def verify_supabase_token(token):
    """
    Main function to verify a Supabase JWT token.
    
    Args:
        token: JWT token string (without 'Bearer ' prefix)
        
    Returns:
        dict: Decoded token payload
        
    Raises:
        AuthenticationFailed: If token is invalid or expired
    """
    if not token:
        raise AuthenticationFailed("No token provided")

    if token.startswith('Bearer '):
        token = token[7:]

    payload = _verify_jwt_signature(token)

    user_id = payload.get('sub')
    if not user_id:
        raise AuthenticationFailed("Token missing 'sub' claim")

    return payload


def _resolve_hospital(hospital_id):
    """Resolve hospital from JWT metadata by hospital_id (HOSP-0001) or UUID."""
    if not hospital_id:
        return None
    try:
        return Hospital.objects.filter(
            models.Q(hospital_id=hospital_id) | models.Q(id=hospital_id)
        ).first()
    except Exception:
        return None


def get_or_create_django_user(payload):
    """
    Get or create Django user from Supabase payload.
    
    Args:
        payload: Decoded JWT payload
        
    Returns:
        User: Django user instance
    """
    user_id = payload.get('sub')
    email = payload.get('email', payload.get('user_metadata', {}).get('email', ''))
    
    app_metadata = payload.get('app_metadata', {})
    user_metadata = payload.get('user_metadata', {})

    # Check user_metadata first (our custom metadata) then app_metadata
    role = user_metadata.get('role') or app_metadata.get('role', 'patient')
    
    # hospital_id should be in user_metadata (what we set via admin API)
    hospital_id = user_metadata.get('hospital_id') or app_metadata.get('hospital_id')
    
    # Patient ID for patient users
    patient_id = user_metadata.get('patient_id')
    
    # Resolve hospital
    hospital = _resolve_hospital(hospital_id)

    user = None
    try:
        user = User.objects.get(username=user_id)
    except User.DoesNotExist:
        pass

    if not user and email:
        try:
            user = User.objects.get(email=email)
            user.username = user_id
        except User.DoesNotExist:
            pass

    if user:
        user.email = email or user.email
        user.role = role
        user.hospital = hospital
        user.save()
        return user

    username = email.split('@')[0] if email else f"user_{user_id[:8]}"
    
    base_username = username
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f"{base_username}_{counter}"
        counter += 1

    user = User.objects.create(
        username=user_id,
        email=email,
        role=role,
        hospital=hospital,
    )

    return user