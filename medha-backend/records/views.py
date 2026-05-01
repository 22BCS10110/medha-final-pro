from rest_framework import viewsets, permissions, serializers as drf_serializers
from .models import HealthRecord, Prescription, Vital
from .serializers import HealthRecordSerializer, PrescriptionSerializer, VitalSerializer


class HealthRecordViewSet(viewsets.ModelViewSet):
    """Health records with hospital isolation."""
    serializer_class = HealthRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return HealthRecord.objects.none()

        qs = HealthRecord.objects.all()

        # Super Admin sees all records
        if user.role != 'super_admin':
            # Filter by user's hospital
            if hasattr(user, 'hospital') and user.hospital:
                qs = qs.filter(hospital=user.hospital)
            else:
                return HealthRecord.objects.none()

        # Filter by patient if specified
        patient = self.request.query_params.get('patient')
        if patient:
            from django.db.models import Q
            qs = qs.filter(Q(patient__id=patient) | Q(patient__patient_id=patient))

        return qs

    def perform_create(self, serializer):
        # Auto-assign hospital from user if admin/doctor
        hospital = serializer.validated_data.get('hospital')
        if not hospital and hasattr(self.request.user, 'hospital') and self.request.user.hospital:
            serializer.save(hospital=self.request.user.hospital)
        else:
            serializer.save()


class PrescriptionViewSet(viewsets.ModelViewSet):
    """Prescriptions with hospital isolation."""
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Prescription.objects.none()

        qs = Prescription.objects.all()

        # Super Admin sees all records
        if user.role != 'super_admin':
            if hasattr(user, 'hospital') and user.hospital:
                qs = qs.filter(hospital=user.hospital)
            else:
                return Prescription.objects.none()

        # Apply additional filters
        patient = self.request.query_params.get('patient')
        doctor = self.request.query_params.get('doctor')
        if patient:
            from django.db.models import Q
            qs = qs.filter(Q(patient__id=patient) | Q(patient__patient_id=patient))
        if doctor:
            from django.db.models import Q
            qs = qs.filter(Q(doctor__id=doctor) | Q(doctor__doctor_id=doctor))

        return qs

    def create(self, request, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Prescription validation error: {serializer.errors} Payload: {request.data}")
            from rest_framework.response import Response
            from rest_framework import status
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        from rest_framework.response import Response
        from rest_framework import status
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        user = self.request.user
        doctor = serializer.validated_data.get('doctor')
        hospital = serializer.validated_data.get('hospital')

        # Auto-assign doctor from the logged-in doctor user when missing.
        if not doctor:
            doctor = getattr(user, 'doctor_profile', None)

        # Hospital follows the doctor, falling back to the user's hospital.
        if not hospital:
            hospital = (doctor.hospital if doctor else None) or getattr(user, 'hospital', None)

        if not hospital:
            raise drf_serializers.ValidationError({
                'hospital': ['Could not determine the hospital for this prescription. '
                             'Assign the user to a hospital or include "hospital" in the payload.']
            })

        serializer.save(doctor=doctor, hospital=hospital)


class VitalViewSet(viewsets.ModelViewSet):
    """Vitals with hospital isolation."""
    serializer_class = VitalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Vital.objects.none()

        qs = Vital.objects.all()

        # Super Admin sees all records
        if user.role != 'super_admin':
            if hasattr(user, 'hospital') and user.hospital:
                qs = qs.filter(hospital=user.hospital)
            else:
                return Vital.objects.none()

        # Filter by patient if specified
        patient = self.request.query_params.get('patient')
        if patient:
            qs = qs.filter(patient_id=patient)

        return qs