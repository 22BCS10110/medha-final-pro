import time
import uuid
from datetime import datetime, timezone


def generate_card_number():
    """Generate a unique card number for patient cards."""
    timestamp = str(int(time.time()))
    return f"CARD-{timestamp}-{uuid.uuid4().hex[:6].upper()}"


def generate_patient_id():
    """Generate a unique patient ID."""
    from .models import Patient

    last_patient = Patient.objects.order_by('-id').first()
    next_num = 4500
    if last_patient and last_patient.patient_id:
        parts = last_patient.patient_id.split('-')
        if len(parts) == 2 and parts[0] == 'MHD' and parts[1].isdigit():
            next_num = int(parts[1]) + 1

    patient_id = f"MHD-{next_num}"
    while Patient.objects.filter(patient_id=patient_id).exists():
        next_num += 1
        patient_id = f"MHD-{next_num}"

    return patient_id


def generate_doctor_id():
    """Generate a unique doctor ID."""
    from doctors.models import Doctor

    last_doctor = Doctor.objects.order_by('-id').first()
    next_num = 1000
    if last_doctor and last_doctor.doctor_id:
        parts = last_doctor.doctor_id.split('-')
        if len(parts) == 2 and parts[0] == 'DOC' and parts[1].isdigit():
            next_num = int(parts[1]) + 1

    doctor_id = f"DOC-{next_num}"
    from django.db.models import Q
    while Doctor.objects.filter(doctor_id=doctor_id).exists():
        next_num += 1
        doctor_id = f"DOC-{next_num}"

    return doctor_id