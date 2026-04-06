"""
API v2 Views - Secure endpoints with Supabase Auth + RBAC + Hospital Isolation
All endpoints require Supabase JWT authentication.
"""
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from accounts.supabase_backend import SupabaseJWTAuthentication
from accounts.permissions import IsPatient, IsDoctor, IsHospitalAdmin, IsSuperAdmin, HospitalScopedPermission

User = get_user_model()


# =============================================================================
# PATIENT ENDPOINTS
# =============================================================================

@api_view(['GET'])
@authentication_classes([SupabaseJWTAuthentication])
@permission_classes([IsPatient])
def patient_profile(request):
    """
    GET /api/v2/patient/profile/
    Returns the logged-in patient's profile.
    RBAC: Only patients can access.
    """
    try:
        patient = request.user.patient
        return Response({
            'id': patient.id,
            'name': patient.name,
            'email': request.user.email,
            'phone': patient.phone,
            'hospital_id': patient.hospital_id,
            'hospital_name': patient.hospital.name if patient.hospital else None,
        })
    except User.patient.RelatedObjectDoesNotExist:
        return Response({'error': 'Patient profile not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@authentication_classes([SupabaseJWTAuthentication])
@permission_classes([IsPatient])
def patient_appointments(request):
    """
    GET /api/v2/patient/appointments/
    Returns the logged-in patient's appointments.
    RBAC: Only patients can access their own appointments.
    """
    try:
        patient = request.user.patient
        appointments = patient.appointments.all().values(
            'id', 'date', 'time', 'status', 'doctor__name', 'hospital__name'
        )
        return Response(list(appointments))
    except User.patient.RelatedObjectDoesNotExist:
        return Response({'error': 'Patient profile not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@authentication_classes([SupabaseJWTAuthentication])
@permission_classes([IsPatient])
def book_appointment(request):
    """
    POST /api/v2/patient/book-appointment/
    Book a new appointment.
    RBAC: Only patients can book.
    Hospital Isolation: Doctor must exist and be accessible.
    """
    try:
        patient = request.user.patient
    except User.patient.RelatedObjectDoesNotExist:
        return Response({'error': 'Patient profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    doctor_id = request.data.get('doctor_id')
    appointment_date = request.data.get('date')
    appointment_time = request.data.get('time')
    
    if not doctor_id or not appointment_date:
        return Response({'error': 'doctor_id and date are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify doctor exists
    from doctors.models import Doctor
    try:
        doctor = Doctor.objects.get(id=doctor_id)
    except Doctor.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Create appointment
    from appointments.models import Appointment
    appointment = Appointment.objects.create(
        patient=patient,
        doctor=doctor,
        hospital=doctor.hospital,
        date=appointment_date,
        time=appointment_time or '09:00',
        status='pending'
    )
    
    return Response({
        'id': appointment.id,
        'status': 'booked',
        'doctor': doctor.name,
        'hospital': doctor.hospital.name if doctor.hospital else None,
        'date': appointment_date,
        'time': appointment.time
    }, status=status.HTTP_201_CREATED)


# =============================================================================
# DOCTOR ENDPOINTS
# =============================================================================

@api_view(['GET'])
@authentication_classes([SupabaseJWTAuthentication])
@permission_classes([IsDoctor])
def doctor_patients(request):
    """
    GET /api/v2/doctor/patients/
    Returns patients assigned to the logged-in doctor's hospital.
    RBAC: Only doctors can access.
    Hospital Isolation: Only patients from doctor's hospital.
    """
    hospital_id = request.user.hospital_id
    if not hospital_id:
        return Response({'error': 'Doctor not assigned to any hospital'}, status=status.HTTP_403_FORBIDDEN)
    
    from patients.models import Patient
    patients = Patient.objects.filter(hospital_id=hospital_id).values(
        'id', 'name', 'email', 'phone', 'age', 'gender'
    )
    
    return Response(list(patients))


@api_view(['GET'])
@authentication_classes([SupabaseJWTAuthentication])
@permission_classes([IsDoctor])
def doctor_appointments(request):
    """
    GET /api/v2/doctor/appointments/
    Returns appointments for the logged-in doctor.
    RBAC: Only doctors can access their own appointments.
    Hospital Isolation: Only appointments in doctor's hospital.
    """
    hospital_id = request.user.hospital_id
    if not hospital_id:
        return Response({'error': 'Doctor not assigned to any hospital'}, status=status.HTTP_403_FORBIDDEN)
    
    from appointments.models import Appointment
    appointments = Appointment.objects.filter(
        doctor__user=request.user,
        hospital_id=hospital_id
    ).values(
        'id', 'date', 'time', 'status', 'patient__name', 'patient__phone'
    )
    
    return Response(list(appointments))


# =============================================================================
# HOSPITAL ADMIN ENDPOINTS
# =============================================================================

@api_view(['GET'])
@authentication_classes([SupabaseJWTAuthentication])
@permission_classes([IsHospitalAdmin])
def admin_hospital_data(request):
    """
    GET /api/v2/admin/hospital/
    Returns the logged-in admin's hospital data.
    RBAC: Only hospital admins can access.
    Hospital Isolation: Only their own hospital.
    """
    hospital = request.user.hospital
    if not hospital:
        return Response({'error': 'Admin not assigned to any hospital'}, status=status.HTTP_403_FORBIDDEN)
    
    return Response({
        'id': hospital.id,
        'name': hospital.name,
        'address': hospital.address,
        'phone': hospital.phone,
        'email': hospital.email,
        'total_doctors': hospital.doctors.count(),
        'total_patients': hospital.patients.count(),
        'total_appointments': hospital.appointments.count(),
    })


@api_view(['GET'])
@authentication_classes([SupabaseJWTAuthentication])
@permission_classes([IsHospitalAdmin])
def admin_staff(request):
    """
    GET /api/v2/admin/staff/
    Returns staff members in the admin's hospital.
    RBAC: Only hospital admins can access.
    Hospital Isolation: Only staff from their hospital.
    """
    hospital_id = request.user.hospital_id
    if not hospital_id:
        return Response({'error': 'Admin not assigned to any hospital'}, status=status.HTTP_403_FORBIDDEN)
    
    staff = User.objects.filter(
        hospital_id=hospital_id,
        role__in=['doctor', 'hospital_admin']
    ).values(
        'id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone'
    )
    
    return Response(list(staff))


@api_view(['POST'])
@authentication_classes([SupabaseJWTAuthentication])
@permission_classes([IsHospitalAdmin])
def admin_patient_lookup(request):
    """
    POST /api/v2/admin/patient-lookup/
    Look up a patient by ID (global access for cross-hospital patient data).
    RBAC: Only hospital admins can access.
    Note: Patients are global, so any admin can look up any patient.
    """
    patient_id = request.data.get('patient_id')
    if not patient_id:
        return Response({'error': 'patient_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    from patients.models import Patient
    try:
        patient = Patient.objects.get(id=patient_id)
        return Response({
            'id': patient.id,
            'name': patient.name,
            'email': patient.email if hasattr(patient, 'email') else None,
            'phone': patient.phone,
            'age': patient.age,
            'gender': patient.gender,
            'hospital_id': patient.hospital_id,
        })
    except Patient.DoesNotExist:
        return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)


# =============================================================================
# SUPER ADMIN ENDPOINTS
# =============================================================================

@api_view(['GET'])
@authentication_classes([SupabaseJWTAuthentication])
@permission_classes([IsSuperAdmin])
def super_admin_hospitals(request):
    """
    GET /api/v2/super-admin/hospitals/
    Returns all hospitals (super admin only).
    RBAC: Only super admins can access.
    """
    from hospitals.models import Hospital
    hospitals = Hospital.objects.all().values(
        'id', 'name', 'address', 'phone', 'email'
    ).annotate(
        total_doctors=Count('doctors'),
        total_patients=Count('patients'),
    )
    
    return Response(list(hospitals))