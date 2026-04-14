"""
Firebase Authentication helper for the Django backend.

Single source of truth for verifying a Firebase ID token.
Initialization is idempotent — `firebase_admin.initialize_app()` is only
called when `firebase_admin._apps` is empty, guaranteeing the Admin SDK
is initialized exactly once for the lifetime of the process.
"""
import os

import firebase_admin
from firebase_admin import credentials, auth
from django.conf import settings


def get_firebase_app():
    """
    Idempotent Firebase Admin SDK initializer.

    Reads the service account JSON from
    `<BASE_DIR>/firebase_credentials.json`. Guarded by
    `firebase_admin._apps` so multiple imports / repeated calls never
    re-initialize the SDK.
    """
    if not firebase_admin._apps:
        print("Initializing Firebase Admin")
        cred_path = os.path.join(settings.BASE_DIR, "firebase_credentials.json")
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    return firebase_admin.get_app()


def verify_firebase_token(token):
    """
    Verify a Firebase ID token and return its decoded claims.

    Returns the full decoded-token dict from `auth.verify_id_token`,
    which includes `uid`, `email`, `name`, and the rest of the Firebase
    claims. The caller reads fields directly via `.get(...)`.
    """
    # Strip optional 'Bearer ' prefix so callers can pass the raw
    # Authorization header value.
    if token and token.startswith("Bearer "):
        token = token[7:]

    try:
        get_firebase_app()
        print("Verifying token")
        decoded_token = auth.verify_id_token(token)
        print("Decoded token:", decoded_token)
        return decoded_token
    except Exception as e:
        print("Firebase verify error:", str(e))
        raise
