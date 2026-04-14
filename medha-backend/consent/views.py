"""
Consent API — one-time consent, grant, check, revoke.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from django.db.models import Q

from .models import PatientConsent
from .serializers import PatientConsentSerializer
from patients.models import Patient


def _resolve_patient(lookup):
    """
    Resolve a patient by either UUID (primary key) or patient_id
    (human-readable PAT-XXXX). Returns the Patient or raises
    Patient.DoesNotExist.
    """
    try:
        return Patient.objects.get(Q(id=lookup) | Q(patient_id=lookup))
    except ValueError:
        # Invalid UUID string — try patient_id only
        return Patient.objects.get(patient_id=lookup)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_consent(request, patient_id):
    """
    Check if a patient has granted consent.
    GET /api/consent/<patient_id>/check/
    Returns: {has_consent: bool, consent: {...} or null}
    """
    try:
        patient = _resolve_patient(patient_id)
    except Patient.DoesNotExist:
        return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        consent = PatientConsent.objects.get(patient=patient)
        return Response({
            'has_consent': consent.is_active,
            'consent': PatientConsentSerializer(consent).data,
        })
    except PatientConsent.DoesNotExist:
        return Response({
            'has_consent': False,
            'consent': None,
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def grant_consent(request, patient_id):
    """
    Grant one-time consent for a patient (triggered after NFC scan).
    POST /api/consent/<patient_id>/grant/
    Body: {"granted_via": "nfc"}
    """
    try:
        patient = _resolve_patient(patient_id)
    except Patient.DoesNotExist:
        return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

    consent, created = PatientConsent.objects.get_or_create(patient=patient)

    if consent.status == 'granted':
        return Response({
            'message': 'Consent already granted',
            'consent': PatientConsentSerializer(consent).data,
        })

    consent.status = 'granted'
    consent.granted_at = timezone.now()
    consent.granted_via = request.data.get('granted_via', 'nfc')
    # Record which hospital
    user = request.user
    if hasattr(user, 'hospital') and user.hospital:
        consent.granted_at_hospital = user.hospital
    consent.save()

    return Response({
        'message': 'Consent granted successfully',
        'consent': PatientConsentSerializer(consent).data,
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def revoke_consent(request, patient_id):
    """
    Revoke patient consent.
    POST /api/consent/<patient_id>/revoke/
    Body: {"reason": "Patient requested revocation"}
    """
    try:
        patient = _resolve_patient(patient_id)
    except Patient.DoesNotExist:
        return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        consent = PatientConsent.objects.get(patient=patient)
    except PatientConsent.DoesNotExist:
        return Response({'error': 'No consent record found'}, status=status.HTTP_404_NOT_FOUND)

    if consent.status == 'revoked':
        return Response({'message': 'Consent already revoked'})

    consent.status = 'revoked'
    consent.revoked_at = timezone.now()
    consent.revoke_reason = request.data.get('reason', '')
    consent.save()

    return Response({
        'message': 'Consent revoked successfully',
        'consent': PatientConsentSerializer(consent).data,
    })
