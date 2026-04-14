from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.conf import settings
from .models import User
from .serializers import UserSerializer, LoginSerializer
from .firebase_auth import verify_firebase_token

import requests
import logging

logger = logging.getLogger(__name__)


def get_tokens_for_user(user):
    """Generate JWT token pair for a user."""
    refresh = RefreshToken.for_user(user)
    refresh['role'] = user.role
    refresh['hospital_id'] = str(user.hospital_id) if user.hospital_id else None
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


def build_user_response(user):
    """Standard user data included in auth responses."""
    return {
        'id': user.id,
        'name': user.get_full_name() or user.username,
        'role': user.role,
        'userId': user.user_id_code or user.username,
        'email': user.email,
        'hospital_name': user.hospital_name_display,
        'hospital_id': str(user.hospital_id) if user.hospital_id else None,
        'is_profile_complete': user.is_profile_complete,
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Username/password login — returns JWT tokens."""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    username = serializer.validated_data['username']
    password = serializer.validated_data['password']

    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    tokens = get_tokens_for_user(user)
    return Response({
        'tokens': tokens,
        'token': tokens['access'],  # backward compat for frontend
        'user': build_user_response(user),
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login_view(request):
    """
    Google OAuth login — receives Google ID token from frontend,
    verifies it, creates/finds the user, returns JWT tokens.
    """
    google_token = request.data.get('credential') or request.data.get('token')
    if not google_token:
        return Response({'error': 'Google credential required'}, status=status.HTTP_400_BAD_REQUEST)

    # Verify Google token
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        idinfo = id_token.verify_oauth2_token(
            google_token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except Exception:
        # Fallback: verify via Google's tokeninfo endpoint
        try:
            resp = requests.get(
                'https://oauth2.googleapis.com/tokeninfo',
                params={'id_token': google_token},
                timeout=5,
            )
            if resp.status_code != 200:
                return Response({'error': 'Invalid Google token'}, status=status.HTTP_401_UNAUTHORIZED)
            idinfo = resp.json()
        except Exception:
            return Response({'error': 'Could not verify Google token'}, status=status.HTTP_401_UNAUTHORIZED)

    email = idinfo.get('email')
    if not email:
        return Response({'error': 'Email not found in Google token'}, status=status.HTTP_400_BAD_REQUEST)

    # Find or create user
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': email.split('@')[0],
            'first_name': idinfo.get('given_name', ''),
            'last_name': idinfo.get('family_name', ''),
            'role': 'patient',  # Google login defaults to patient
        }
    )

    if created:
        user.set_unusable_password()
        user.save()

    tokens = get_tokens_for_user(user)
    return Response({
        'tokens': tokens,
        'token': tokens['access'],
        'user': build_user_response(user),
        'created': created,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Blacklist the refresh token on logout."""
    refresh_token = request.data.get('refresh')
    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass
    return Response({'message': 'Logged out'})


@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh_view(request):
    """Refresh an access token."""
    from rest_framework_simplejwt.views import TokenRefreshView
    view = TokenRefreshView.as_view()
    return view(request._request)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Return current authenticated user's profile."""
    return Response(build_user_response(request.user))


@api_view(['POST'])
@permission_classes([AllowAny])
def firebase_login_view(request):
    """
    Firebase Authentication login (patient mobile app).

    Flow:
    1. Mobile app signs the user in via Firebase and gets an ID token.
    2. Mobile app POSTs the ID token here.
    3. We verify it via firebase-admin (`verify_firebase_token`).
    4. Find or create a Django User matched by email (duplicates avoided).
    5. Find or create a Patient profile linked to that User (first login
       creates the patient; existing users are not duplicated).
    6. Issue Django JWT tokens and return the mapping.

    Request body: { "token": "<firebase_id_token>" }

    Response: {
        "success": true,
        "user_id": <int>,
        "patient_id": "<MHD-xxxx>",
        "tokens": { "access": ..., "refresh": ... },
        "token": <access>,            # legacy alias
        "user": { ...build_user_response... },
        "is_profile_complete": <bool>,
        "created": <bool>
    }
    """
    firebase_token = request.data.get('token')
    if not firebase_token:
        return Response(
            {'success': False, 'error': 'Firebase ID token required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ── 1. Verify ID token ──────────────────────────────────────────
    try:
        claims = verify_firebase_token(firebase_token)
    except Exception as e:
        logger.warning('Firebase token verification failed: %s', e)
        return Response(
            {'success': False, 'error': f'Invalid Firebase token: {e}'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    uid = claims.get('uid')
    email = (claims.get('email') or '').strip().lower()
    full_name = claims.get('name', '') or ''

    if not email:
        return Response(
            {'success': False, 'error': 'Email not found in Firebase token'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # TEMP debug
    print("Firebase token verified:", email)
    logger.info("Firebase token verified for %s (uid=%s)", email, uid)

    # ── 2. Find or create Django User (match by email, avoid duplicates) ──
    user = User.objects.filter(email__iexact=email).first()
    user_created = False
    if not user:
        username = email.split('@')[0]
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f'{base_username}_{counter}'
            counter += 1

        name_parts = full_name.split(' ', 1) if full_name else ['', '']
        user = User.objects.create(
            username=username,
            email=email,
            first_name=name_parts[0],
            last_name=name_parts[1] if len(name_parts) > 1 else '',
            role='patient',
            is_profile_complete=False,
        )
        user.set_unusable_password()
        user.save()
        user_created = True

    # TEMP debug
    print("User created/fetched:", user.id)
    logger.info("User %s (id=%s) %s", user.email, user.id, 'created' if user_created else 'fetched')

    # ── 3. Find or create Patient profile linked to that User ──────
    from patients.models import Patient
    from patients.utils import generate_patient_id

    patient = Patient.objects.filter(user=user).first()
    if not patient and email:
        # Fall back to matching an orphan patient by email (pre-existing record)
        patient = Patient.objects.filter(email__iexact=email, user__isnull=True).first()
        if patient:
            patient.user = user
            patient.save(update_fields=['user'])

    patient_created = False
    if not patient:
        patient = Patient.objects.create(
            user=user,
            patient_id=generate_patient_id(),
            full_name=full_name or user.get_full_name() or user.username,
            email=email,
        )
        patient_created = True

    # TEMP debug
    print("Patient created/fetched:", patient.id)
    logger.info(
        "Patient %s (id=%s, patient_id=%s) %s",
        patient.full_name, patient.id, patient.patient_id,
        'created' if patient_created else 'fetched',
    )

    # ── 4. Issue Django JWT ────────────────────────────────────────
    tokens = get_tokens_for_user(user)
    return Response({
        'success': True,
        'user_id': user.id,
        'patient_id': patient.patient_id,
        'tokens': tokens,
        'token': tokens['access'],  # legacy alias for existing frontend
        'user': build_user_response(user),
        'is_profile_complete': user.is_profile_complete,
        'created': user_created,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_profile_view(request):
    """
    Complete patient onboarding profile.

    Called after first-time Google sign-up to collect required patient info.
    Creates a Patient record linked to the User.

    Request body: {
        "full_name": "...",
        "phone": "...",
        "gender": "M" | "F" | "O",
        "date_of_birth": "YYYY-MM-DD"
    }
    """
    user = request.user

    if user.is_profile_complete:
        return Response(
            {'error': 'Profile already completed'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    full_name = request.data.get('full_name', '').strip()
    phone = request.data.get('phone', '').strip()
    gender = request.data.get('gender', '').strip()
    date_of_birth = request.data.get('date_of_birth', '').strip()

    # Validation
    errors = {}
    if not full_name:
        errors['full_name'] = 'Full name is required.'
    if not phone:
        errors['phone'] = 'Phone number is required.'
    if gender not in ('M', 'F', 'O'):
        errors['gender'] = 'Gender must be M, F, or O.'
    if not date_of_birth:
        errors['date_of_birth'] = 'Date of birth is required.'
    else:
        from datetime import date as date_cls
        try:
            date_of_birth = date_cls.fromisoformat(date_of_birth)
        except ValueError:
            errors['date_of_birth'] = 'Invalid date format. Use YYYY-MM-DD.'

    if errors:
        return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

    # Create Patient record
    from patients.models import Patient
    from patients.utils import generate_patient_id

    # Check if patient already exists for this user
    patient = Patient.objects.filter(user=user).first()
    if not patient:
        patient = Patient(
            user=user,
            patient_id=generate_patient_id(),
            email=user.email,
        )

    patient.full_name = full_name
    patient.phone = phone
    patient.gender = gender
    patient.date_of_birth = date_of_birth
    # abdm_id / abha_id left null for future ABDM integration
    patient.save()

    # Update user profile
    name_parts = full_name.split(' ', 1)
    user.first_name = name_parts[0]
    user.last_name = name_parts[1] if len(name_parts) > 1 else ''
    user.phone = phone
    user.is_profile_complete = True
    user.save(update_fields=['first_name', 'last_name', 'phone', 'is_profile_complete'])

    return Response({
        'message': 'Profile completed successfully',
        'user': build_user_response(user),
        'patient_id': patient.patient_id,
        'is_profile_complete': True,
    })
