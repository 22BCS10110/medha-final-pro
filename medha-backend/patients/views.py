from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Patient, PatientCard, PatientHospitalVisit
from .serializers import PatientSerializer, PatientCardSerializer, PatientHospitalVisitSerializer
from hospitals.middleware import HospitalDataFilterMixin


class PatientViewSet(HospitalDataFilterMixin, viewsets.ModelViewSet):
    """
    Patient CRUD with hospital-based filtering:
    - Super Admin: Full access to all patients (patients are global)
    - Hospital Admin/Doctor: Can see all patients but create visits tied to their hospital
    - Patient: Can see own data only
    """
    serializer_class = PatientSerializer

    def get_permissions(self):
        if self.action in ['list', 'search', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_object(self):
        """
        Resolve detail lookups by either UUID (primary key) or patient_id
        (human-readable PAT-XXXX code). This lets the frontend hit
        /api/patients/<uuid>/ and /api/patients/PAT-4054/ interchangeably.
        """
        from django.shortcuts import get_object_or_404
        queryset = self.filter_queryset(self.get_queryset())
        lookup = self.kwargs.get(self.lookup_field or 'pk')
        try:
            obj = queryset.get_by_id_or_code(lookup)
        except Patient.DoesNotExist:
            from django.http import Http404
            raise Http404(f"Patient with ID/Code '{lookup}' not found.")
        
        self.check_object_permissions(self.request, obj)
        return obj

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Patient.objects.none()

        # Super Admin sees all patients
        if user.role == 'super_admin':
            return Patient.objects.all()

        # Patients see only their own record
        if user.role == 'patient':
            return Patient.objects.filter(user=user)

        # Doctors ONLY see their assigned patients (strict enforcement)
        if user.role == 'doctor':
            return Patient.objects.filter(assigned_doctor__email=user.email)

        # Hospital Admin sees patients in their hospital (by visit or doctor assignment)
        if user.role == 'hospital_admin' and hasattr(user, 'hospital') and user.hospital:
            return Patient.objects.filter(
                Q(hospital_visits__hospital=user.hospital) |
                Q(assigned_doctor__hospital=user.hospital)
            ).distinct()

        return Patient.objects.all()

    def perform_create(self, serializer):
        from patients.utils import generate_patient_id
        from hospitals.models import Hospital
        from django.utils import timezone

        # Generate patient_id if not provided
        supplied_patient_id = serializer.validated_data.get('patient_id')
        if not supplied_patient_id:
            serializer.validated_data['patient_id'] = generate_patient_id()

        # If a hospital is provided in the context, create a hospital visit
        hospital_id = self.request.data.get('hospital_id')
        patient = serializer.save()

        # Create hospital visit record if hospital is specified
        if hospital_id:
            try:
                hospital = Hospital.objects.get(id=hospital_id)
                PatientHospitalVisit.objects.create(
                    patient=patient,
                    hospital=hospital,
                    is_active=True
                )
            except Hospital.DoesNotExist:
                pass

    @action(detail=False, methods=['get'])
    def search(self, request):
        q = request.query_params.get('q', '')
        if not q:
            return Response([])
        patients = Patient.objects.filter(
            Q(full_name__icontains=q) |
            Q(patient_id__icontains=q) |
            Q(phone__icontains=q) |
            Q(abha_id__icontains=q)
        )[:20]
        serializer = self.get_serializer(patients, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='global-access')
    def global_access(self, request, pk=None):
        """
        Global patient access endpoint.
        Any authenticated hospital staff can access patient data by patient_id.
        This supports the multi-hospital patient card scanning feature.
        """
        patient = self.get_object()

        # Create/update hospital visit if user has a hospital
        user = request.user
        if hasattr(user, 'hospital') and user.hospital:
            PatientHospitalVisit.objects.get_or_create(
                patient=patient,
                hospital=user.hospital,
                defaults={'is_active': True}
            )

        serializer = self.get_serializer(patient)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='issue-card')
    def issue_card(self, request, pk=None):
        """Issue a new patient card (QR/NFC) to a patient."""
        patient = self.get_object()
        card_type = request.data.get('card_type', 'qr')

        card = PatientCard.objects.create(
            patient=patient,
            card_type=card_type
        )
        return Response(PatientCardSerializer(card).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='cards')
    def cards(self, request, pk=None):
        """Get all cards for a patient."""
        patient = self.get_object()
        cards = patient.cards.all()
        serializer = PatientCardSerializer(cards, many=True)
        return Response(serializer.data)


class PatientCardViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for patient card operations."""
    serializer_class = PatientCardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return PatientCard.objects.all()
        if user.role == 'patient':
            return PatientCard.objects.filter(patient__user=user)
        # Hospital staff can see all cards (for scanning purposes)
        return PatientCard.objects.filter(status='active')

    def scan_card(self, request, card_number=None):
        """
        Scan a patient card and return patient data.
        This is the key endpoint for cross-hospital patient access.
        """
        try:
            from django.utils import timezone
            card = PatientCard.objects.select_related('patient').get(
                card_number=card_number,
                status='active'
            )

            # Log the scan
            if hasattr(request.user, 'hospital') and request.user.hospital:
                card.last_scanned_at = timezone.now()
                card.last_scanned_hospital = request.user.hospital
                card.save(update_fields=['last_scanned_at', 'last_scanned_hospital'])

                # Create/update hospital visit
                PatientHospitalVisit.objects.get_or_create(
                    patient=card.patient,
                    hospital=request.user.hospital,
                    defaults={'is_active': True}
                )

            patient_data = PatientSerializer(card.patient).data
            patient_data['scanned_card'] = PatientCardSerializer(card).data
            return Response(patient_data)

        except PatientCard.DoesNotExist:
            return Response(
                {'error': 'Invalid or inactive card'},
                status=status.HTTP_404_NOT_FOUND
            )


class PatientHospitalVisitViewSet(viewsets.ReadOnlyModelViewSet):
    """View patient hospital visits."""
    serializer_class = PatientHospitalVisitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return PatientHospitalVisit.objects.all()
        if user.role == 'patient':
            return PatientHospitalVisit.objects.filter(patient__user=user)
        if hasattr(user, 'hospital') and user.hospital:
            return PatientHospitalVisit.objects.filter(hospital=user.hospital)
        return PatientHospitalVisit.objects.none()


@csrf_exempt
def nfc_scan(request):
    """
    NFC scan endpoint.
    GET /api/patients/nfc-scan/?id=MHD-4504
    Returns patient data + consent status (triggers consent check).
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    patient_id = request.GET.get('id', '') or request.GET.get('patient_id', '')

    if not patient_id:
        return JsonResponse({'error': 'No patient_id provided'}, status=400)

    try:
        patient = Patient.objects.get(patient_id=patient_id)

        # Check consent status
        from consent.models import PatientConsent
        consent_obj = PatientConsent.objects.filter(patient=patient).first()
        has_consent = consent_obj.is_active if consent_obj else False
        needs_consent = not has_consent

        data = {
            'id': str(patient.id),
            'patient_id': patient.patient_id,
            'full_name': patient.full_name,
            'email': patient.email,
            'phone': patient.phone,
            'gender': patient.gender,
            'blood_group': patient.blood_group,
            'status': patient.status,
            'abha_id': patient.abha_id,
            'date_of_birth': str(patient.date_of_birth) if patient.date_of_birth else None,
            'allergies': patient.allergies,
            'reason_for_visit': patient.reason_for_visit,
            'consent': {
                'has_consent': has_consent,
                'needs_consent': needs_consent,
                'status': consent_obj.status if consent_obj else 'none',
            },
            'hospital_visits': list(PatientHospitalVisit.objects.filter(patient=patient).select_related('hospital').values(
                'hospital__name', 'visit_date', 'is_active'
            )),
            'cards': list(PatientCard.objects.filter(patient=patient, status='active').values(
                'card_number', 'card_type', 'status', 'issued_at'
            )),
        }
        return JsonResponse(data)
    except Patient.DoesNotExist:
        return JsonResponse({'error': f'Patient not found: {patient_id}'}, status=404)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def patient_by_nfc_uid(request, uid):
    """
    Look up a patient by NFC hardware UID.
    GET /api/patients/by-nfc/<uid>/
    Maps the raw NFC card UID to the patient via PatientCard.nfc_uid.
    """
    uid = uid.strip().upper()
    try:
        card = PatientCard.objects.select_related('patient').get(
            nfc_uid=uid,
            status='active'
        )

        from django.utils import timezone
        card.last_scanned_at = timezone.now()
        if hasattr(request.user, 'hospital') and request.user.hospital:
            card.last_scanned_hospital = request.user.hospital
            PatientHospitalVisit.objects.get_or_create(
                patient=card.patient,
                hospital=request.user.hospital,
                defaults={'is_active': True}
            )
        card.save(update_fields=['last_scanned_at', 'last_scanned_hospital'])

        patient = card.patient
        data = {
            'id': str(patient.id),
            'patient_id': patient.patient_id,
            'full_name': patient.full_name,
            'email': patient.email,
            'phone': patient.phone,
            'gender': patient.gender,
            'blood_group': patient.blood_group,
            'date_of_birth': str(patient.date_of_birth) if patient.date_of_birth else None,
            'age': None,
            'status': patient.status,
            'abha_id': patient.abha_id,
            'allergies': patient.allergies,
            'emergency_contact': patient.emergency_contact,
            'reason_for_visit': patient.reason_for_visit,
            'nfc_uid': uid,
            'scanned_card': PatientCardSerializer(card).data,
            'hospital_visits': list(
                PatientHospitalVisit.objects.filter(patient=patient)
                .select_related('hospital')
                .values('hospital__name', 'visit_date', 'is_active')
            ),
            'cards': list(
                PatientCard.objects.filter(patient=patient, status='active')
                .values('card_number', 'card_type', 'nfc_uid', 'status', 'issued_at')
            ),
        }

        if patient.date_of_birth:
            from datetime import date
            today = date.today()
            dob = patient.date_of_birth
            data['age'] = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

        return Response(data)

    except PatientCard.DoesNotExist:
        return Response(
            {'error': 'No active card found for this NFC UID'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def assign_nfc_card(request):
    """
    Assign a hardware NFC UID to a patient.
    POST /api/patients/assign-nfc/
    Body: { "patient_id": "MHD-4500", "nfc_uid": "AB12CD34" }

    Creates a new NFC-type PatientCard linked to the patient,
    or updates the nfc_uid on an existing active NFC card.
    """
    patient_id = request.data.get('patient_id', '').strip()
    nfc_uid = request.data.get('nfc_uid', '').strip().upper()

    if not patient_id:
        return Response({'error': 'patient_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    if not nfc_uid:
        return Response({'error': 'nfc_uid is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate patient exists
    try:
        patient = Patient.objects.get(Q(patient_id=patient_id) | Q(id=patient_id))
    except Patient.DoesNotExist:
        return Response({'error': f'Patient not found: {patient_id}'}, status=status.HTTP_404_NOT_FOUND)

    # Check if this NFC UID is already assigned to another patient
    existing = PatientCard.objects.filter(nfc_uid=nfc_uid, status='active').exclude(patient=patient).first()
    if existing:
        return Response({
            'error': 'This NFC card is already assigned to another patient',
            'assigned_to': {
                'patient_id': existing.patient.patient_id,
                'full_name': existing.patient.full_name,
            }
        }, status=status.HTTP_409_CONFLICT)

    # Check if patient already has an active NFC card with this UID
    already_assigned = PatientCard.objects.filter(patient=patient, nfc_uid=nfc_uid, status='active').first()
    if already_assigned:
        return Response({
            'message': 'NFC card already assigned to this patient',
            'card': PatientCardSerializer(already_assigned).data,
        })

    # Try to find an existing active NFC card for this patient and update its UID
    existing_nfc_card = PatientCard.objects.filter(
        patient=patient, card_type='nfc', status='active'
    ).first()

    if existing_nfc_card:
        existing_nfc_card.nfc_uid = nfc_uid
        existing_nfc_card.save(update_fields=['nfc_uid'])
        card = existing_nfc_card
    else:
        # Create a new NFC card for this patient
        card = PatientCard.objects.create(
            patient=patient,
            card_type='nfc',
            nfc_uid=nfc_uid,
            status='active',
        )

    return Response({
        'message': 'NFC card assigned successfully',
        'card': PatientCardSerializer(card).data,
        'patient': {
            'patient_id': patient.patient_id,
            'full_name': patient.full_name,
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def assign_patient_to_doctor(request):
    """
    Assign (or reassign) a patient to a doctor.
    POST /api/patients/assign-doctor/
    Body: { "patient_id": "PAT-XXXX", "doctor_id": "<uuid or doctor_id>" }
    Only hospital_admin or super_admin may call this.
    Creates a DB notification for the doctor's linked user account.
    """
    if request.user.role not in ('hospital_admin', 'super_admin'):
        return Response(
            {'error': 'Only hospital admins can assign patients to doctors.'},
            status=status.HTTP_403_FORBIDDEN
        )

    patient_id = request.data.get('patient_id', '').strip()
    doctor_id = request.data.get('doctor_id', '').strip()

    if not patient_id or not doctor_id:
        return Response({'error': 'patient_id and doctor_id are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        patient = Patient.objects.get(Q(patient_id=patient_id) | Q(id=patient_id))
    except Patient.DoesNotExist:
        return Response({'error': f'Patient not found: {patient_id}'}, status=status.HTTP_404_NOT_FOUND)

    from doctors.models import Doctor
    try:
        doctor = Doctor.objects.get(Q(id=doctor_id) | Q(doctor_id=doctor_id))
    except Doctor.DoesNotExist:
        return Response({'error': f'Doctor not found: {doctor_id}'}, status=status.HTTP_404_NOT_FOUND)

    # Hospital admin can only assign to doctors in their own hospital
    if request.user.role == 'hospital_admin':
        if hasattr(request.user, 'hospital') and request.user.hospital:
            if doctor.hospital != request.user.hospital:
                return Response(
                    {'error': 'Doctor does not belong to your hospital.'},
                    status=status.HTTP_403_FORBIDDEN
                )

    previous_doctor = patient.assigned_doctor
    patient.assigned_doctor = doctor
    patient.save(update_fields=['assigned_doctor'])

    _notify_doctor_of_assignment(doctor, patient, request.user)

    return Response({
        'message': f'{patient.full_name} assigned to {doctor.full_name}.',
        'patient_id': patient.patient_id,
        'doctor': {
            'id': str(doctor.id),
            'full_name': doctor.full_name,
            'department': doctor.department,
        },
        'previous_doctor': previous_doctor.full_name if previous_doctor else None,
    }, status=status.HTTP_200_OK)


def _notify_doctor_of_assignment(doctor, patient, assigned_by_user):
    """Create a DB notification for the doctor. Silently skips if no linked User account."""
    from accounts.models import User
    try:
        doctor_user = User.objects.get(email=doctor.email, role='doctor')
    except User.DoesNotExist:
        return
    from notifications.models import Notification
    Notification.objects.create(
        user=doctor_user,
        title='New Patient Assigned',
        message=(
            f'Patient {patient.full_name} ({patient.patient_id}) has been assigned to you '
            f'by {assigned_by_user.get_full_name() or assigned_by_user.username}.'
        ),
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def patient_nfc_status(request, patient_id):
    """
    Check NFC card assignment status for a patient.
    GET /api/patients/<patient_id>/nfc-status/
    """
    try:
        patient = Patient.objects.get(Q(patient_id=patient_id) | Q(id=patient_id))
    except Patient.DoesNotExist:
        return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

    nfc_cards = PatientCard.objects.filter(patient=patient, card_type='nfc', status='active')
    has_nfc = nfc_cards.exists()
    cards_data = PatientCardSerializer(nfc_cards, many=True).data

    return Response({
        'patient_id': patient.patient_id,
        'full_name': patient.full_name,
        'has_nfc': has_nfc,
        'nfc_uid': nfc_cards.first().nfc_uid if has_nfc else None,
        'cards': cards_data,
    })
