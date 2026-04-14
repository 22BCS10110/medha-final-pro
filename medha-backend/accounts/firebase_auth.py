"""
Firebase Authentication helper for the Django backend.

Single source of truth for verifying a Firebase ID token and extracting
the (email, uid, name) triple that the rest of the auth flow consumes.

Initialization is lazy and idempotent — the Firebase Admin SDK is only
imported/initialized the first time `verify_firebase_token` is called,
so a missing `firebase-admin` package or missing credentials file never
breaks Django startup (it only fails the Firebase login endpoint).
"""
import logging
import os

from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)

_INITIALIZED = False


def _init_firebase_app():
    """Initialize the Firebase Admin SDK exactly once. Idempotent."""
    global _INITIALIZED
    if _INITIALIZED:
        return

    try:
        import firebase_admin
        from firebase_admin import credentials
    except ImportError as exc:
        raise AuthenticationFailed(
            "firebase-admin is not installed. "
            "Install it with: pip install firebase-admin"
        ) from exc

    if firebase_admin._apps:
        _INITIALIZED = True
        return

    cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', '') or os.environ.get(
        'FIREBASE_CREDENTIALS_PATH', ''
    )
    if not cred_path or not os.path.exists(cred_path):
        raise AuthenticationFailed(
            "Firebase service account JSON not found. "
            "Set FIREBASE_CREDENTIALS_PATH in settings or environment."
        )

    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    _INITIALIZED = True
    logger.info("Firebase Admin SDK initialized (creds: %s)", cred_path)


def verify_firebase_token(token):
    """
    Verify a Firebase ID token and return its decoded claims.

    Args:
        token: Firebase ID token string (may include 'Bearer ' prefix).

    Returns:
        dict with at least {'uid', 'email', 'name'} keys (name may be '').

    Raises:
        AuthenticationFailed: invalid, expired, or unverifiable token.
    """
    if not token:
        raise AuthenticationFailed("No token provided")

    if token.startswith('Bearer '):
        token = token[7:]

    _init_firebase_app()

    try:
        from firebase_admin import auth as fb_auth
        decoded = fb_auth.verify_id_token(token)
    except AuthenticationFailed:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.warning("Firebase token verification failed: %s", exc)
        raise AuthenticationFailed(f"Invalid Firebase token: {exc}")

    uid = decoded.get('uid')
    email = decoded.get('email', '')
    name = decoded.get('name', '') or decoded.get('display_name', '') or ''

    if not uid:
        raise AuthenticationFailed("Firebase token missing 'uid'")

    return {'uid': uid, 'email': email, 'name': name, 'raw': decoded}
