from rest_framework import viewsets, permissions
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
            qs = qs.filter(patient_id=patient)

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
            qs = qs.filter(patient_id=patient)
        if doctor:
            qs = qs.filter(doctor_id=doctor)

        return qs

    def perform_create(self, serializer):
        hospital = serializer.validated_data.get('hospital')
        if not hospital and hasattr(self.request.user, 'hospital') and self.request.user.hospital:
            serializer.save(hospital=self.request.user.hospital)
        else:
            serializer.save()


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