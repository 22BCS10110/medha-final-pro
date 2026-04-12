"""
ABDM Simulator — API Views
============================
REST API endpoints that simulate the full ABDM workflow.

All endpoints are prefixed with /api/abdm/ and follow the exact flow
shown in the architecture diagram:

  1. Patient registers → gets ABHA
  2. Links ABHA in app
  3. Doctor requests data via ABHA ID
  4. Consent request sent to patient
  5. Patient approves / rejects
  6. Consent artifact generated
  7. Data fetched via simulated NDHM
  8. Access logged in audit trail
"""
import base64
import hashlib
import logging
import uuid
from datetime import datetime

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

# Debug logger for ABDM operations
logger = logging.getLogger('abdm_simulator')
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(
        '[ABDM] %(asctime)s | %(levelname)s | %(message)s',
        datefmt='%H:%M:%S'
    ))
    logger.addHandler(handler)

from patients.models import Patient
from doctors.models import Doctor, Appointment
from hospitals.models import Hospital
from records.models import HealthRecord, Prescription, Vital

from .models import ABHARecord, ConsentRequest, ConsentArtifact, HIUDataRequest, ABDMAuditLog
from .serializers import (
    ABHARecordSerializer, ABHACreateSerializer, ABHALinkSerializer,
    ABHAVerifySerializer, ConsentRequestSerializer, ConsentCreateSerializer,
    ConsentActionSerializer, ConsentArtifactSerializer,
    HIUDataRequestSerializer, HIUFetchSerializer,
    ABDMAuditLogSerializer, ABDMStatusSerializer,
)
from .fhir_mock import (
    generate_fhir_patient, generate_fhir_encounter,
    generate_fhir_observation, generate_fhir_medication_request,
    generate_fhir_diagnostic_report, generate_fhir_bundle,
    generate_mock_fhir_bundle_for_patient,
)


def _log_action(action, request=None, abha_id='', consent_id='', hospital_id=None, details=None):
    """Helper to create an immutable audit log entry."""
    logger.info(f'AUDIT: {action} | ABHA={abha_id} | Consent={consent_id} | Details={details}')
    ABDMAuditLog.objects.create(
        action=action,
        actor_user_id=request.user.id if request and request.user.is_authenticated else None,
        actor_role=getattr(request.user, 'role', '') if request and request.user.is_authenticated else '',
        patient_abha_id=abha_id,
        consent_request_id=consent_id,
        hospital_id=hospital_id,
        ip_address=request.META.get('REMOTE_ADDR') if request else None,
        details=details or {}
    )


# ═══════════════════════════════════════════════════════════════════
# ABDM STATUS / OVERVIEW
# ═══════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([AllowAny])
def abdm_status(request):
    """Get overall ABDM simulation status — useful for dashboard widgets."""
    logger.info('STATUS: Fetching ABDM dashboard stats')
    data = {
        'total_abha_records': ABHARecord.objects.count(),
        'total_consent_requests': ConsentRequest.objects.count(),
        'pending_consents': ConsentRequest.objects.filter(status='REQUESTED').count(),
        'granted_consents': ConsentRequest.objects.filter(status='GRANTED').count(),
        'denied_consents': ConsentRequest.objects.filter(status='DENIED').count(),
        'total_data_fetches': HIUDataRequest.objects.filter(status='COMPLETE').count(),
        'audit_log_entries': ABDMAuditLog.objects.count(),
        'simulation_mode': True,
        'abdm_gateway_status': 'SIMULATED — Ready for production ABDM integration',
    }
    logger.info(f'STATUS: {data}')
    return Response(data)


# ═══════════════════════════════════════════════════════════════════
# ABHA ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([AllowAny])
def abha_create(request):
    """
    Simulate ABHA registration.
    In production: calls ABHA Registry API (abha.abdm.gov.in).
    In simulation: generates a random 14-digit ABHA number.
    """
    serializer = ABHACreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    d = serializer.validated_data

    abha_number = ABHARecord.generate_abha_number()
    abha_address = ABHARecord.generate_abha_address(d['full_name'])

    # Link to existing patient if patient_id provided
    patient = None
    if d.get('patient_id'):
        try:
            patient = Patient.objects.get(id=d['patient_id'])
            # Update patient's abha_id field too
            patient.abha_id = abha_number
            patient.save(update_fields=['abha_id'])
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

    hospital = None
    if request.user.is_authenticated and hasattr(request.user, 'hospital') and request.user.hospital:
        hospital = request.user.hospital

    record = ABHARecord.objects.create(
        patient=patient,
        abha_number=abha_number,
        abha_address=abha_address,
        full_name=d['full_name'],
        date_of_birth=d.get('date_of_birth'),
        gender=d.get('gender', ''),
        phone=d.get('phone', ''),
        linked_via=d.get('linked_via', 'mobile'),
        verified=True,  # Auto-verify in simulation
        registered_at_hospital=hospital,
        verified_at=timezone.now(),
    )

    _log_action('ABHA_CREATED', request, abha_id=abha_number, details={
        'full_name': d['full_name'], 'linked_via': d.get('linked_via', 'mobile')
    })

    return Response({
        'success': True,
        'message': 'ABHA ID created successfully (Simulated)',
        'abha': ABHARecordSerializer(record).data,
        'simulation_note': 'This ABHA number is simulated. In production, this would be issued by ABDM Registry.'
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def abha_link(request):
    """
    Link an existing ABHA number to a Medha patient record.
    In production: calls ABDM link APIs.
    """
    serializer = ABHALinkSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    d = serializer.validated_data

    try:
        patient = Patient.objects.get(id=d['patient_id'])
    except Patient.DoesNotExist:
        return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

    # Check if ABHA already exists
    try:
        abha = ABHARecord.objects.get(abha_number=d['abha_number'])
        if abha.patient and abha.patient != patient:
            return Response({'error': 'This ABHA is already linked to another patient'},
                            status=status.HTTP_409_CONFLICT)
        abha.patient = patient
        abha.save(update_fields=['patient'])
    except ABHARecord.DoesNotExist:
        # Create new ABHA record for existing ABHA number
        abha = ABHARecord.objects.create(
            patient=patient, abha_number=d['abha_number'],
            abha_address=ABHARecord.generate_abha_address(patient.full_name),
            full_name=patient.full_name, verified=True,
            verified_at=timezone.now(),
        )

    # Update patient model
    patient.abha_id = d['abha_number']
    patient.save(update_fields=['abha_id'])

    _log_action('ABHA_LINKED', request, abha_id=d['abha_number'], details={
        'patient_id': str(patient.id)
    })

    return Response({
        'success': True,
        'message': 'ABHA linked to patient successfully',
        'abha': ABHARecordSerializer(abha).data,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def abha_verify(request, abha_number):
    """
    Verify an ABHA ID — simulates ABDM Registry lookup.
    Always returns success in simulation mode.
    """
    try:
        record = ABHARecord.objects.get(abha_number=abha_number)
        data = ABHARecordSerializer(record).data
        data['verification_status'] = 'VERIFIED'
        data['registry'] = 'ABDM (Simulated)'
    except ABHARecord.DoesNotExist:
        # In simulation, we even "verify" unknown ABHA IDs
        data = {
            'abha_number': abha_number,
            'verification_status': 'VERIFIED_EXTERNAL',
            'registry': 'ABDM Registry (Simulated)',
            'message': 'ABHA exists in ABDM registry but not linked in Medha system'
        }

    _log_action('ABHA_VERIFIED', request, abha_id=abha_number)

    return Response(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def abha_list(request):
    """List all ABHA records (for admin dashboard)."""
    records = ABHARecord.objects.select_related('patient', 'registered_at_hospital').all()
    return Response(ABHARecordSerializer(records, many=True).data)


# ═══════════════════════════════════════════════════════════════════
# CONSENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([AllowAny])
def consent_create(request):
    """
    Doctor creates a consent request for patient data.
    This simulates POST /consent-requests/init on ABDM Consent Manager.
    """
    logger.info(f'CONSENT_CREATE: Received request: {request.data}')
    serializer = ConsentCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    d = serializer.validated_data

    # Find patient by ABHA ID
    patient = Patient.objects.filter(abha_id=d['patient_abha_id']).first()
    if not patient:
        return Response({
            'error': f'No patient found with ABHA ID: {d["patient_abha_id"]}'
        }, status=status.HTTP_404_NOT_FOUND)

    # Find requesting doctor (from auth or first available for demo)
    doctor = None
    if request.user.is_authenticated and hasattr(request.user, 'doctor_profile'):
        doctor = request.user.doctor_profile
    else:
        doctor = Doctor.objects.first()

    if not doctor:
        return Response({'error': 'No doctor found'}, status=status.HTTP_400_BAD_REQUEST)

    hospital = doctor.hospital

    consent = ConsentRequest.objects.create(
        requester_doctor=doctor,
        requester_hospital=hospital,
        patient=patient,
        patient_abha_id=d['patient_abha_id'],
        purpose=d.get('purpose', 'CAREMGT'),
        hi_types=d.get('hi_types', ['Prescription', 'DiagnosticReport']),
        date_range_from=d['date_range_from'],
        date_range_to=d['date_range_to'],
    )

    _log_action('CONSENT_REQUESTED', request, abha_id=d['patient_abha_id'],
                consent_id=consent.consent_request_id, hospital_id=hospital.id,
                details={'purpose': d.get('purpose', 'CAREMGT'), 'hi_types': d.get('hi_types')})

    return Response({
        'success': True,
        'message': 'Consent request created. Waiting for patient approval.',
        'consent': ConsentRequestSerializer(consent).data,
        'simulation_note': 'In production, this request is routed via ABDM Consent Manager to the patient\'s ABHA app.'
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def consent_list(request):
    """
    List consent requests.
    - For doctors: shows consent requests they created
    - For patients: shows consent requests for their data
    - For admins: shows all consent requests for their hospital
    """
    consents = ConsentRequest.objects.select_related(
        'requester_doctor', 'requester_hospital', 'patient'
    ).all()

    # Filter by role if authenticated
    role = getattr(request.user, 'role', None) if request.user.is_authenticated else None
    if role == 'doctor' and hasattr(request.user, 'doctor_profile'):
        consents = consents.filter(requester_doctor=request.user.doctor_profile)
    elif role == 'patient':
        consents = consents.filter(patient__user=request.user)
    elif role == 'hospital_admin' and request.user.hospital:
        consents = consents.filter(requester_hospital=request.user.hospital)

    # Filter by status query param
    status_filter = request.query_params.get('status')
    if status_filter:
        consents = consents.filter(status=status_filter.upper())

    # Filter by patient ABHA ID
    abha_filter = request.query_params.get('abha_id')
    if abha_filter:
        consents = consents.filter(patient_abha_id=abha_filter)

    return Response(ConsentRequestSerializer(consents, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def consent_detail(request, consent_id):
    """Get details of a specific consent request."""
    try:
        consent = ConsentRequest.objects.select_related(
            'requester_doctor', 'requester_hospital', 'patient'
        ).get(consent_request_id=consent_id)
    except ConsentRequest.DoesNotExist:
        return Response({'error': 'Consent request not found'}, status=status.HTTP_404_NOT_FOUND)

    data = ConsentRequestSerializer(consent).data

    # Include artifact if granted
    if consent.status == 'GRANTED' and hasattr(consent, 'artifact'):
        data['artifact'] = ConsentArtifactSerializer(consent.artifact).data

    return Response(data)


@api_view(['POST'])
@permission_classes([AllowAny])
def consent_action(request, consent_id):
    """
    Patient approves, denies, or revokes a consent request.
    This simulates the patient's action on the ABDM Consent Manager.
    """
    serializer = ConsentActionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    action = serializer.validated_data['action']
    reason = serializer.validated_data.get('reason', '')
    logger.info(f'CONSENT_ACTION: {action} on {consent_id} (reason={reason})')

    try:
        consent = ConsentRequest.objects.get(consent_request_id=consent_id)
    except ConsentRequest.DoesNotExist:
        return Response({'error': 'Consent request not found'}, status=status.HTTP_404_NOT_FOUND)

    if action == 'approve':
        if consent.status != 'REQUESTED':
            return Response({'error': f'Cannot approve consent in {consent.status} state'},
                            status=status.HTTP_400_BAD_REQUEST)

        consent.status = 'GRANTED'
        consent.granted_at = timezone.now()
        consent.save(update_fields=['status', 'granted_at'])

        # Generate consent artifact (simulated ABDM artifact)
        artifact_json = _build_consent_artifact(consent)
        signature = _generate_mock_signature(artifact_json)

        ConsentArtifact.objects.create(
            consent_request=consent,
            artifact_json=artifact_json,
            signature=signature,
            valid_until=consent.expires_at,
        )

        _log_action('CONSENT_GRANTED', request, abha_id=consent.patient_abha_id,
                     consent_id=consent.consent_request_id,
                     hospital_id=consent.requester_hospital_id)

        return Response({
            'success': True,
            'message': 'Consent APPROVED. Doctor can now access patient data.',
            'consent': ConsentRequestSerializer(consent).data,
            'simulation_note': 'Consent artifact generated. In production, this is digitally signed by ABDM.'
        })

    elif action == 'deny':
        if consent.status != 'REQUESTED':
            return Response({'error': f'Cannot deny consent in {consent.status} state'},
                            status=status.HTTP_400_BAD_REQUEST)

        consent.status = 'DENIED'
        consent.denied_at = timezone.now()
        consent.status_message = reason
        consent.save(update_fields=['status', 'denied_at', 'status_message'])

        _log_action('CONSENT_DENIED', request, abha_id=consent.patient_abha_id,
                     consent_id=consent.consent_request_id)

        return Response({
            'success': True,
            'message': 'Consent DENIED. Doctor will NOT be able to access patient data.',
            'consent': ConsentRequestSerializer(consent).data,
        })

    elif action == 'revoke':
        if consent.status != 'GRANTED':
            return Response({'error': 'Can only revoke GRANTED consents'},
                            status=status.HTTP_400_BAD_REQUEST)

        consent.status = 'REVOKED'
        consent.revoked_at = timezone.now()
        consent.status_message = reason
        consent.save(update_fields=['status', 'revoked_at', 'status_message'])

        _log_action('CONSENT_REVOKED', request, abha_id=consent.patient_abha_id,
                     consent_id=consent.consent_request_id)

        return Response({
            'success': True,
            'message': 'Consent REVOKED. Doctor access has been terminated.',
            'consent': ConsentRequestSerializer(consent).data,
        })

    return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


# ═══════════════════════════════════════════════════════════════════
# HIU DATA FETCH (FHIR)
# ═══════════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([AllowAny])
def hiu_fetch_data(request):
    """
    Fetch patient health data using a granted consent.
    Simulates NDHM Health Information Exchange (HIE) data pull.
    Returns FHIR R4 Bundle format.
    """
    serializer = HIUFetchSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    consent_id = serializer.validated_data['consent_request_id']
    logger.info(f'HIU_FETCH: Data fetch requested for consent={consent_id}')

    try:
        consent = ConsentRequest.objects.select_related(
            'requester_doctor', 'patient'
        ).get(consent_request_id=consent_id)
    except ConsentRequest.DoesNotExist:
        return Response({'error': 'Consent not found'}, status=status.HTTP_404_NOT_FOUND)

    if consent.status != 'GRANTED':
        return Response({
            'error': f'Data access denied. Consent status: {consent.status}. Only GRANTED consents allow data access.',
            'consent_status': consent.status,
        }, status=status.HTTP_403_FORBIDDEN)

    # Check if artifact exists
    try:
        artifact = consent.artifact
    except ConsentArtifact.DoesNotExist:
        return Response({'error': 'Consent artifact not found'}, status=status.HTTP_404_NOT_FOUND)

    patient = consent.patient
    abha_record = ABHARecord.objects.filter(patient=patient).first()

    # Build FHIR Bundle from real patient data
    encounters, observations, medications, reports = [], [], [], []

    # Fetch encounters from appointments
    appointments = Appointment.objects.filter(
        patient=patient,
        date__gte=consent.date_range_from,
        date__lte=consent.date_range_to
    ).select_related('doctor', 'hospital')
    for appt in appointments:
        encounters.append(generate_fhir_encounter(appt, appt.hospital))

    # Fetch observations from vitals
    vitals = Vital.objects.filter(
        patient=patient,
        recorded_at__date__gte=consent.date_range_from,
        recorded_at__date__lte=consent.date_range_to
    )
    for vital in vitals:
        observations.extend(generate_fhir_observation(vital, patient))

    # Fetch medications from prescriptions
    if 'Prescription' in consent.hi_types:
        prescriptions = Prescription.objects.filter(
            patient=patient,
            date__gte=consent.date_range_from,
            date__lte=consent.date_range_to
        ).select_related('doctor')
        for rx in prescriptions:
            medications.append(generate_fhir_medication_request(rx, patient))

    # Fetch diagnostic reports
    if 'DiagnosticReport' in consent.hi_types:
        records = HealthRecord.objects.filter(
            patient=patient,
            date__gte=consent.date_range_from,
            date__lte=consent.date_range_to
        ).select_related('doctor')
        for rec in records:
            reports.append(generate_fhir_diagnostic_report(rec, patient))

    # If no real data, return mock data for demo
    if not encounters and not observations and not medications and not reports:
        fhir_bundle = generate_mock_fhir_bundle_for_patient(consent.patient_abha_id)
    else:
        fhir_bundle = generate_fhir_bundle(
            patient, abha_record, encounters, observations, medications, reports
        )

    # Create HIU data request record
    hiu_request = HIUDataRequest.objects.create(
        consent_artifact=artifact,
        requesting_doctor=consent.requester_doctor,
        patient_abha_id=consent.patient_abha_id,
        data_types=consent.hi_types,
        status='COMPLETE',
        fhir_bundle=fhir_bundle,
        completed_at=timezone.now(),
    )

    _log_action('DATA_FETCHED', request, abha_id=consent.patient_abha_id,
                consent_id=consent.consent_request_id,
                hospital_id=consent.requester_hospital_id,
                details={'data_types': consent.hi_types, 'bundle_entries': fhir_bundle.get('total', 0)})

    return Response({
        'success': True,
        'message': 'Health data fetched successfully via simulated NDHM gateway.',
        'consent_request_id': consent_id,
        'fhir_bundle': fhir_bundle,
        'hiu_request_id': hiu_request.request_id,
        'simulation_note': 'In production, this data is encrypted and transferred via NDHM Health Information Exchange.'
    })


# ═══════════════════════════════════════════════════════════════════
# AUDIT LOG
# ═══════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([AllowAny])
def audit_log_list(request):
    """List ABDM audit log entries (immutable compliance trail)."""
    logs = ABDMAuditLog.objects.all()

    # Filter by ABHA ID
    abha_filter = request.query_params.get('abha_id')
    if abha_filter:
        logs = logs.filter(patient_abha_id=abha_filter)

    # Filter by action
    action_filter = request.query_params.get('action')
    if action_filter:
        logs = logs.filter(action=action_filter)

    # Limit
    limit = int(request.query_params.get('limit', 50))
    logs = logs[:limit]

    return Response(ABDMAuditLogSerializer(logs, many=True).data)


# ═══════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════

def _build_consent_artifact(consent):
    """Build a mock ABDM consent artifact JSON."""
    return {
        "schemaVersion": "1.0",
        "type": "CONSENT_ARTIFACT",
        "consentId": consent.consent_request_id,
        "createdAt": timezone.now().isoformat(),
        "purpose": {
            "code": consent.purpose,
            "text": dict(ConsentRequest.PURPOSE_CHOICES).get(consent.purpose, consent.purpose)
        },
        "patient": {
            "id": consent.patient_abha_id,
            "name": consent.patient.full_name,
        },
        "hip": {
            "id": str(consent.requester_hospital.id),
            "name": consent.requester_hospital.name,
        },
        "hiu": {
            "id": str(consent.requester_hospital.id),
            "name": consent.requester_hospital.name,
        },
        "requester": {
            "name": consent.requester_doctor.full_name,
            "identifier": consent.requester_doctor.doctor_id,
        },
        "hiTypes": consent.hi_types,
        "permission": {
            "accessMode": "VIEW",
            "dateRange": {
                "from": consent.date_range_from.isoformat(),
                "to": consent.date_range_to.isoformat(),
            },
            "dataEraseAt": consent.expires_at.isoformat() if consent.expires_at else None,
            "frequency": {"unit": "HOUR", "value": 1, "repeats": 0}
        },
        "consentManager": {
            "id": "MEDHA-ABDM-SIM",
            "name": "Medha ABDM Simulator"
        },
        "status": "GRANTED",
        "signature": "<<SIMULATED_DIGITAL_SIGNATURE>>"
    }


def _generate_mock_signature(artifact_json):
    """Generate a mock digital signature (base64-encoded hash)."""
    import json
    payload = json.dumps(artifact_json, sort_keys=True).encode('utf-8')
    digest = hashlib.sha256(payload).digest()
    return base64.b64encode(digest).decode('utf-8')
