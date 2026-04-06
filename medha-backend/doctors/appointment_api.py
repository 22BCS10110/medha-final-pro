"""
Appointment Booking API
Handles appointment creation, listing, and management.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Doctor, Appointment
from patients.models import Patient
from hospitals.models import Hospital


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def book_appointment(request):
    """
    Book a new appointment.
    POST /api/appointments/book/
    Body: {
        "doctor_id": "DOC-A-1001",
        "patient_id": "MHD-4504",
        "appointment_date": "2026-04-10",
        "appointment_time": "10:00",
        "reason": "General checkup"
    }
    """
    user = request.user
    
    # Get doctor
    doctor_id = request.data.get('doctor_id')
    try:
        doctor = Doctor.objects.get(doctor_id=doctor_id)
    except Doctor.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Get patient
    patient_id = request.data.get('patient_id')
    try:
        patient = Patient.objects.get(patient_id=patient_id)
    except Patient.DoesNotExist:
        return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Validate date and time
    appt_date = request.data.get('appointment_date')
    appt_time = request.data.get('appointment_time')
    
    if not appt_date or not appt_time:
        return Response({'error': 'Date and time are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        appointment_datetime = datetime.strptime(f"{appt_date} {appt_time}", "%Y-%m-%d %H:%M")
    except ValueError:
        return Response({'error': 'Invalid date or time format'}, status=status.HTTP_400_BAD_REQUEST)
    
    if appointment_datetime < timezone.now():
        return Response({'error': 'Cannot book appointments in the past'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check for conflicts
    existing = Appointment.objects.filter(
        doctor=doctor,
        appointment_date=appt_date,
        appointment_time=appt_time,
        status__in=['scheduled', 'confirmed']
    ).exists()
    
    if existing:
        return Response({'error': 'This time slot is already booked'}, status=status.HTTP_409_CONFLICT)
    
    # Create appointment
    appointment = Appointment.objects.create(
        doctor=doctor,
        patient=patient,
        hospital=doctor.hospital,
        appointment_date=appt_date,
        appointment_time=appt_time,
        reason=request.data.get('reason', ''),
        status='scheduled'
    )
    
    return Response({
        'message': 'Appointment booked successfully',
        'appointment': {
            'id': str(appointment.id),
            'doctor': doctor.full_name,
            'patient': patient.full_name,
            'hospital': doctor.hospital.name if doctor.hospital else None,
            'date': appt_date,
            'time': appt_time,
            'reason': appointment.reason,
            'status': appointment.status
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_appointments(request):
    """
    List appointments for the current user.
    GET /api/appointments/?role=doctor|patient|admin
    """
    user = request.user
    role = request.query_params.get('role', user.role)
    
    if role == 'doctor':
        try:
            doctor = Doctor.objects.get(user=user)
            appointments = Appointment.objects.filter(doctor=doctor)
        except Doctor.DoesNotExist:
            return Response({'error': 'Doctor profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    elif role == 'patient':
        try:
            patient = Patient.objects.get(user=user)
            appointments = Appointment.objects.filter(patient=patient)
        except Patient.DoesNotExist:
            return Response({'error': 'Patient profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    elif role in ['hospital_admin', 'super_admin']:
        if user.role == 'hospital_admin' and user.hospital:
            appointments = Appointment.objects.filter(hospital=user.hospital)
        else:
            appointments = Appointment.objects.all()
    else:
        return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Filter by date if provided
    date_filter = request.query_params.get('date')
    if date_filter:
        appointments = appointments.filter(appointment_date=date_filter)
    
    # Filter by status if provided
    status_filter = request.query_params.get('status')
    if status_filter:
        appointments = appointments.filter(status=status_filter)
    
    # Serialize
    data = []
    for appt in appointments.order_by('appointment_date', 'appointment_time')[:50]:
        data.append({
            'id': str(appt.id),
            'doctor': appt.doctor.full_name,
            'doctor_id': appt.doctor.doctor_id,
            'patient': appt.patient.full_name,
            'patient_id': appt.patient.patient_id,
            'hospital': appt.hospital.name if appt.hospital else None,
            'date': appt.appointment_date,
            'time': appt.appointment_time,
            'reason': appt.reason,
            'status': appt.status,
            'notes': appt.notes
        })
    
    return Response({'appointments': data, 'count': len(data)})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_appointment_status(request, appointment_id):
    """
    Update appointment status.
    PATCH /api/appointments/<id>/status/
    Body: {"status": "confirmed" | "completed" | "cancelled" | "no_show"}
    """
    try:
        appointment = Appointment.objects.get(id=appointment_id)
    except Appointment.DoesNotExist:
        return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
    
    new_status = request.data.get('status')
    valid_statuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']
    
    if new_status not in valid_statuses:
        return Response({'error': f'Invalid status. Choose from: {valid_statuses}'}, status=status.HTTP_400_BAD_REQUEST)
    
    appointment.status = new_status
    appointment.save()
    
    return Response({
        'message': f'Appointment status updated to {new_status}',
        'appointment_id': str(appointment.id)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_available_slots(request, doctor_id):
    """
    Get available time slots for a doctor on a specific date.
    GET /api/appointments/slots/<doctor_id>/?date=2026-04-10
    """
    date = request.query_params.get('date')
    if not date:
        return Response({'error': 'Date is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        doctor = Doctor.objects.get(doctor_id=doctor_id)
    except Doctor.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Generate time slots (9 AM to 5 PM, 30 min intervals)
    all_slots = []
    for hour in range(9, 17):
        for minute in [0, 30]:
            slot = f"{hour:02d}:{minute:02d}"
            all_slots.append(slot)
    
    # Get booked slots
    booked = Appointment.objects.filter(
        doctor=doctor,
        appointment_date=date,
        status__in=['scheduled', 'confirmed']
    ).values_list('appointment_time', flat=True)
    
    available = [slot for slot in all_slots if slot not in booked]
    
    return Response({
        'doctor': doctor.full_name,
        'date': date,
        'available_slots': available,
        'booked_slots': list(booked)
    })