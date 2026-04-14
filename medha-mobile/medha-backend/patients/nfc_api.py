"""
NFC Card Management API
Handles NFC card writing and reading operations.
"""
import random
import string
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Patient, PatientCard
from .serializers import PatientSerializer, PatientCardSerializer
from hospitals.models import Hospital


def generate_nfc_card_number():
    """Generate a unique NFC card number (10 digits)."""
    return 'NFC' + ''.join(random.choices(string.digits, k=10))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def write_nfc_card(request, patient_id):
    """
    Write NFC card data for a patient.
    POST /api/patients/nfc/write/<patient_id>/
    Body: {"card_type": "qr" or "nfc"}
    """
    try:
        patient = Patient.objects.get(patient_id=patient_id)
    except Patient.DoesNotExist:
        return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

    card_type = request.data.get('card_type', 'nfc')
    
    # Check if patient already has an active card
    existing_card = PatientCard.objects.filter(patient=patient, status='active').first()
    if existing_card:
        return Response({
            'message': 'Patient already has an active card',
            'card': PatientCardSerializer(existing_card).data
        }, status=status.HTTP_200_OK)

    # Create new card
    card_number = generate_nfc_card_number()
    while PatientCard.objects.filter(card_number=card_number).exists():
        card_number = generate_nfc_card_number()

    card = PatientCard.objects.create(
        patient=patient,
        card_number=card_number,
        card_type=card_type,
        status='active'
    )

    return Response({
        'message': 'NFC card created successfully',
        'card': PatientCardSerializer(card).data,
        'write_data': {
            'card_number': card_number,
            'patient_id': patient_id,
            'format': 'text'
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def read_nfc_card(request, card_number):
    """
    Read NFC card and return patient data.
    GET /api/patients/nfc/read/<card_number>/
    """
    try:
        card = PatientCard.objects.select_related('patient').get(
            card_number=card_number,
            status='active'
        )
        
        # Update last scanned
        from django.utils import timezone
        card.last_scanned_at = timezone.now()
        card.save(update_fields=['last_scanned_at'])

        # Log hospital visit if user has hospital
        user = request.user
        if hasattr(user, 'hospital') and user.hospital:
            from .models import PatientHospitalVisit
            PatientHospitalVisit.objects.get_or_create(
                patient=card.patient,
                hospital=user.hospital,
                defaults={'is_active': True}
            )

        return Response({
            'card': PatientCardSerializer(card).data,
            'patient': PatientSerializer(card.patient).data
        })

    except PatientCard.DoesNotExist:
        return Response({'error': 'Invalid or inactive card'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_patient_cards(request, patient_id):
    """
    List all cards for a patient.
    GET /api/patients/nfc/cards/<patient_id>/
    """
    try:
        patient = Patient.objects.get(patient_id=patient_id)
    except Patient.DoesNotExist:
        return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

    cards = PatientCard.objects.filter(patient=patient)
    return Response(PatientCardSerializer(cards, many=True).data)