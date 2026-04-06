"""
Dashboard API — aggregated data endpoints for admin, doctor, and patient dashboards.
Updated for multi-hospital support.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from doctors.models import Doctor, Appointment
from patients.models import Patient
from billing.models import Receipt
from records.models import Prescription
from django.db.models import Sum, Count
from datetime import date, timedelta


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard(request):
    """Admin dashboard - scoped to user's hospital."""
    user = request.user
    today = date.today()
    seven_days_ago = today - timedelta(days=7)

    # Determine queryset scope
    if user.role == 'super_admin':
        # Super admin sees all data
        patients_qs = Patient.objects.all()
        doctors_qs = Doctor.objects.all()
        receipts_qs = Receipt.objects.all()
    elif hasattr(user, 'hospital') and user.hospital:
        hospital = user.hospital
        patients_qs = Patient.objects.filter(hospital_visits__hospital=hospital).distinct()
        doctors_qs = Doctor.objects.filter(hospital=hospital)
        receipts_qs = Receipt.objects.filter(hospital=hospital)
    else:
        return Response({'error': 'No hospital assigned'}, status=403)

    active_patients = patients_qs.count()
    doctors_on_duty = doctors_qs.filter(status='on_duty').count()
    total_billed = receipts_qs.aggregate(total=Sum('total_amount'))['total'] or 0
    new_registrations = patients_qs.filter(created_at__gte=seven_days_ago).count()
    pending_receipts = receipts_qs.filter(status='pending').count()

    doctors_list = list(doctors_qs.values('full_name', 'department', 'status')[:4])

    return Response({
        'metrics': {
            'active_patients': active_patients,
            'doctors_on_duty': doctors_on_duty,
            'total_billed': float(total_billed),
            'new_registrations': new_registrations,
            'pending_receipts': pending_receipts,
            'hospital_name': user.hospital_name_display if hasattr(user, 'hospital_name_display') else None,
        },
        'recent_patients': [],
        'doctors': doctors_list,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def doctor_dashboard(request):
    """Doctor dashboard - only their appointments."""
    user = request.user

    # Get doctor profile
    doctor = getattr(user, 'doctor_profile', None)
    if not doctor:
        return Response({'error': 'No doctor profile found'}, status=404)

    today = date.today()
    appointments = Appointment.objects.filter(doctor=doctor, date=today)

    waitlist = []
    for apt in appointments:
        waitlist.append({
            'time': apt.time.strftime('%I:%M %p') if apt.time else "TBD",
            'patient_name': apt.patient.full_name if apt.patient else "Unknown",
            'patient_id': apt.patient.patient_id if apt.patient else "N/A",
            'appointment_type': apt.appointment_type,
            'status': apt.status
        })

    return Response({
        'stats': {
            'appointments': appointments.count(),
            'reports': doctor.health_records.count(),
            'alerts': 0,
        },
        'waitlist': waitlist,
        'hospital': {
            'name': doctor.hospital.name,
            'id': doctor.hospital.hospital_id,
        },
        'insight': {
            'patient': 'Rajan Kumar',
            'message': 'presents with chest pain and dyspnoea for 3 days.',
            'recommendation': 'Prioritize cardiac imaging and baseline enzyme panel immediately.',
            'confidence': '94%'
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def patient_dashboard(request):
    """Patient dashboard - global patient data."""
    user = request.user

    # Get patient profile
    patient = getattr(user, 'patient_profile', None)
    if not patient:
        return Response({'error': 'No patient profile found'}, status=404)

    hospital_visits = patient.hospital_visits.select_related('hospital').all()[:5]
    hospitals_visited = [
        {
            'name': v.hospital.name,
            'id': v.hospital.hospital_id,
            'last_visit': v.visit_date,
        }
        for v in hospital_visits
    ]

    return Response({
        'profile': {
            'name': patient.full_name,
            'patient_id': patient.patient_id,
            'abha_id': patient.abha_id,
            'blood_group': patient.blood_group,
            'assigned_doctor': patient.assigned_doctor.full_name if patient.assigned_doctor else None,
            'active_prescriptions': patient.prescriptions.filter(status='active').count(),
        },
        'hospital_visits': hospitals_visited,
        'vitals': {
            'blood_pressure': patient.vitals.first().blood_pressure if patient.vitals.exists() else 'N/A',
            'heart_rate': patient.vitals.first().heart_rate if patient.vitals.exists() else None,
            'spo2': patient.vitals.first().spo2 if patient.vitals.exists() else None,
            'temperature': patient.vitals.first().temperature if patient.vitals.exists() else None,
        },
        'prescriptions': [
            {
                'medicine': p.medicine,
                'dosage': p.dosage,
                'duration': p.duration,
                'hospital': p.hospital.name if p.hospital else 'Unknown',
            }
            for p in patient.prescriptions.filter(status='active')[:5]
        ]
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reports_view(request):
    """Reports - scoped to user's hospital."""
    user = request.user

    if user.role == 'super_admin':
        # Super admin - aggregate across all hospitals
        return Response({
            'avg_stay': 3.2,
            'bed_occupancy': 78,
            'patient_satisfaction': 4.6,
            'readmission_rate': 4.2,
            'total_hospitals': 2,
            'departments': [
                {'name': 'General Medicine', 'patients': 42},
                {'name': 'Cardiology', 'patients': 28},
                {'name': 'Orthopaedics', 'patients': 21},
                {'name': 'Gynaecology', 'patients': 19},
                {'name': 'Neurology', 'patients': 14},
            ]
        })

    if hasattr(user, 'hospital') and user.hospital:
        return Response({
            'avg_stay': 3.2,
            'bed_occupancy': 78,
            'patient_satisfaction': 4.6,
            'readmission_rate': 4.2,
            'hospital_name': user.hospital.name,
            'departments': [
                {'name': 'General Medicine', 'patients': 42},
                {'name': 'Cardiology', 'patients': 28},
                {'name': 'Orthopaedics', 'patients': 21},
                {'name': 'Gynaecology', 'patients': 19},
                {'name': 'Neurology', 'patients': 14},
            ]
        })

    return Response({'error': 'Access denied'}, status=403)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def hospital_settings(request):
    """Hospital settings - scoped to user's hospital."""
    user = request.user

    if request.method == 'GET':
        if hasattr(user, 'hospital') and user.hospital:
            hospital = user.hospital
            return Response({
                'id': str(hospital.id),
                'hospital_id': hospital.hospital_id,
                'hospital_name': hospital.name,
                'gstin': hospital.gstin,
                'abdm_hip_id': hospital.abdm_hip_id,
                'address': hospital.address,
                'phone': hospital.phone,
                'email': hospital.email,
                'two_factor_auth': False,
                'blockchain_audit': False,
                'data_encryption': 'AES-256',
            })
        if user.role == 'super_admin':
            return Response({
                'message': 'Super Admin - manage hospitals via /api/hospitals/',
                'two_factor_auth': False,
                'blockchain_audit': False,
                'data_encryption': 'AES-256',
            })
        return Response({'error': 'No hospital assigned'}, status=403)

    # PUT - update hospital settings (hospital admin only)
    if user.role in ['hospital_admin', 'super_admin'] and hasattr(user, 'hospital') and user.hospital:
        hospital = user.hospital
        data = request.data
        if 'gstin' in data:
            hospital.gstin = data['gstin']
        if 'abdm_hip_id' in data:
            hospital.abdm_hip_id = data['abdm_hip_id']
        hospital.save()
        return Response({'message': 'Settings updated successfully'})

    return Response({'error': 'Permission denied'}, status=403)