from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Doctor, Appointment
from .serializers import DoctorSerializer, AppointmentSerializer


class DoctorViewSet(viewsets.ModelViewSet):
    """
    Doctor CRUD with hospital isolation.
    - Super Admin: Full access to all doctors
    - Hospital Admin: Only their hospital's doctors
    - Doctor: Read-only access to themselves
    """
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Doctor.objects.none()

        # Super Admin sees all doctors
        if user.role == 'super_admin':
            return Doctor.objects.all()

        # Hospital Admin and Doctor see only their hospital's doctors
        if hasattr(user, 'hospital') and user.hospital:
            return Doctor.objects.filter(hospital=user.hospital)

        return Doctor.objects.none()

    def perform_create(self, serializer):
        from patients.utils import generate_doctor_id
        from hospitals.models import Hospital

        # If hospital is in validated data, use it
        hospital = serializer.validated_data.get('hospital')

        # Auto-assign hospital from user if admin and no hospital specified
        if not hospital and hasattr(self.request.user, 'hospital') and self.request.user.hospital:
            hospital = self.request.user.hospital

        # Generate doctor_id if not provided
        doctor_id = serializer.validated_data.get('doctor_id')
        if not doctor_id:
            doctor_id = generate_doctor_id()

        serializer.save(doctor_id=doctor_id, hospital=hospital)


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    Appointment CRUD with hospital isolation.
    - Super Admin: Full access to all appointments
    - Hospital Admin: Only their hospital's appointments
    - Doctor: Only their appointments
    """
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Appointment.objects.none()

        # Super Admin sees all appointments
        if user.role == 'super_admin':
            return Appointment.objects.all()

        # Doctor sees only their appointments
        if user.role == 'doctor' and hasattr(user, 'doctor_profile'):
            return Appointment.objects.filter(doctor=user.doctor_profile)

        # Hospital Admin sees their hospital's appointments
        if hasattr(user, 'hospital') and user.hospital:
            return Appointment.objects.filter(hospital=user.hospital)

        return Appointment.objects.none()

    def perform_create(self, serializer):
        # Auto-assign hospital from doctor if not provided
        doctor = serializer.validated_data.get('doctor')
        if doctor and not serializer.validated_data.get('hospital'):
            serializer.save(hospital=doctor.hospital)
        else:
            serializer.save()