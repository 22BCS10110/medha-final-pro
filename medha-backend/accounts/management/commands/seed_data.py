from django.core.management.base import BaseCommand
from hospitals.models import Hospital
from accounts.models import User
from doctors.models import Doctor, Appointment
from patients.models import Patient, PatientCard, PatientHospitalVisit
from records.models import HealthRecord, Prescription, Vital
from billing.models import Receipt
from datetime import date, time, timedelta
import random


class Command(BaseCommand):
    help = 'Seed the database with multi-hospital test data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing existing data...')
        Receipt.objects.all().delete()
        Prescription.objects.all().delete()
        HealthRecord.objects.all().delete()
        Vital.objects.all().delete()
        Appointment.objects.all().delete()
        PatientCard.objects.all().delete()
        PatientHospitalVisit.objects.all().delete()
        Doctor.objects.all().delete()
        Patient.objects.all().delete()
        User.objects.all().delete()
        Hospital.objects.all().delete()

        self.stdout.write(self.style.SUCCESS('Creating hospitals...'))

        # Create 2 hospitals
        hospital_a = Hospital.objects.create(
            name='City General Hospital',
            address='123 Main Street, New Delhi',
            phone='011-23456789',
            email='admin@citygeneral.com',
            gstin='07AAACC0000A1Z5',
            abdm_hip_id='HIP-CGH-2024-001',
            status='active'
        )
        self.stdout.write(f'  Hospital A: {hospital_a.name} ({hospital_a.hospital_id})')

        hospital_b = Hospital.objects.create(
            name='Metro Specialty Hospital',
            address='456 Health Avenue, Mumbai',
            phone='022-87654321',
            email='admin@metrospecialty.com',
            gstin='27AAACC0000A1Z5',
            abdm_hip_id='HIP-MSH-2024-002',
            status='active'
        )
        self.stdout.write(f'  Hospital B: {hospital_b.name} ({hospital_b.hospital_id})')

        # Create Super Admin
        super_admin = User.objects.create_user(
            username='superadmin',
            password='superadmin123',
            first_name='System',
            last_name='Admin',
            email='superadmin@medha.com',
            role='super_admin'
        )
        self.stdout.write(self.style.SUCCESS('Super Admin created: superadmin/superadmin123'))

        # Create Hospital Admins
        admin_a = User.objects.create_user(
            username='admin_a',
            password='admin_a123',
            first_name='City',
            last_name='Admin',
            email='admin@citygeneral.com',
            role='hospital_admin',
            phone='9876543210',
            hospital=hospital_a
        )
        self.stdout.write(f'  Hospital A Admin: admin_a/admin_a123')

        admin_b = User.objects.create_user(
            username='admin_b',
            password='admin_b123',
            first_name='Metro',
            last_name='Admin',
            email='admin@metrospecialty.com',
            role='hospital_admin',
            phone='9876543211',
            hospital=hospital_b
        )
        self.stdout.write(f'  Hospital B Admin: admin_b/admin_b123')

        # Create doctors for Hospital A
        departments_a = [
            ('Cardiology', 'Heart Specialist'),
            ('Orthopaedics', 'Bone & Joint Specialist'),
            ('General Medicine', 'General Physician'),
            ('Neurology', 'Brain & Nerve Specialist'),
            ('Paediatrics', 'Child Specialist'),
        ]
        names_a = ['Dr. Rajesh Kumar', 'Dr. Priya Singh', 'Dr. Amit Patel', 'Dr. Sunita Reddy', 'Dr. Vikram Joshi']

        self.stdout.write(self.style.SUCCESS(f'Creating {len(names_a)} doctors for Hospital A...'))
        doctors_a = []
        for i, (dept, spec) in enumerate(departments_a):
            doctor = Doctor.objects.create(
                doctor_id=f'DOC-A-{1001+i}',
                hospital=hospital_a,
                full_name=names_a[i],
                department=dept,
                specialisation=spec,
                registration_no=f'REG-A-{1001+i}',
                experience_years=random.randint(5, 20),
                phone=f'98765{str(1001+i)[-4:]}',
                status='on_duty'
            )
            doctors_a.append(doctor)
            # Create user for each doctor
            User.objects.create_user(
                username=f'doctor_a_{i+1}',
                password=f'doctor_a_{i+1}',
                first_name=names_a[i].replace('Dr. ', '').split()[0],
                last_name=names_a[i].split()[-1],
                email=f'doctor{i+1}@citygeneral.com',
                role='doctor',
                hospital=hospital_a,
            )
            self.stdout.write(f'  {doctor.full_name} ({doctor.doctor_id})')

        # Create doctors for Hospital B
        departments_b = [
            ('Oncology', 'Cancer Specialist'),
            ('Gastroenterology', 'Digestive System Specialist'),
            ('Dermatology', 'Skin Specialist'),
            ('Psychiatry', 'Mental Health Specialist'),
            ('Radiology', 'Imaging Specialist'),
        ]
        names_b = ['Dr. Meena Sharma', 'Dr. Ravi Gupta', 'Dr. Kavita Nair', 'Dr. Suresh Iyer', 'Dr. Anita Desai']

        self.stdout.write(self.style.SUCCESS(f'Creating {len(names_b)} doctors for Hospital B...'))
        doctors_b = []
        for i, (dept, spec) in enumerate(departments_b):
            doctor = Doctor.objects.create(
                doctor_id=f'DOC-B-{2001+i}',
                hospital=hospital_b,
                full_name=names_b[i],
                department=dept,
                specialisation=spec,
                registration_no=f'REG-B-{2001+i}',
                experience_years=random.randint(5, 20),
                phone=f'98766{'0001+i'}',
                status='on_duty'
            )
            doctors_b.append(doctor)
            User.objects.create_user(
                username=f'doctor_b_{i+1}',
                password=f'doctor_b_{i+1}',
                first_name=names_b[i].replace('Dr. ', '').split()[0],
                last_name=names_b[i].split()[-1],
                email=f'doctor{i+1}@metrospecialty.com',
                role='doctor',
                hospital=hospital_b,
            )
            self.stdout.write(f'  {doctor.full_name} ({doctor.doctor_id})')

        # Create GLOBAL patients (not tied to a single hospital)
        patient_data = [
            {'name': 'Rajan Kumar', 'dob': '1985-03-15', 'gender': 'M', 'blood_group': 'O+', 'phone': '9900110001'},
            {'name': 'Priya Sharma', 'dob': '1990-07-22', 'gender': 'F', 'blood_group': 'B+', 'phone': '9900110002'},
            {'name': 'Amit Verma', 'dob': '1978-11-30', 'gender': 'M', 'blood_group': 'A+', 'phone': '9900110003'},
            {'name': 'Sneha Patel', 'dob': '1995-01-08', 'gender': 'F', 'blood_group': 'AB+', 'phone': '9900110004'},
            {'name': 'Rohit Singh', 'dob': '1982-06-14', 'gender': 'M', 'blood_group': 'O-', 'phone': '9900110005'},
        ]

        self.stdout.write(self.style.SUCCESS('Creating GLOBAL patients...'))
        patients = []
        for i, pdata in enumerate(patient_data):
            patient = Patient.objects.create(
                patient_id=f'PAT-{4500+i}',
                full_name=pdata['name'],
                date_of_birth=pdata['dob'],
                gender=pdata['gender'],
                blood_group=pdata['blood_group'],
                phone=pdata['phone'],
                emergency_contact=f'990022{'0001+i'}',
                status='active',
            )
            patients.append(patient)

            # Issue patient card
            PatientCard.objects.create(patient=patient)

            # Patient visits Hospital A for first 3 patients, Hospital B for all 5
            # (demonstrating global patient access)
            if i < 3:
                PatientHospitalVisit.objects.create(
                    patient=patient,
                    hospital=hospital_a,
                    is_active=False
                )

            if i >= 2:
                PatientHospitalVisit.objects.create(
                    patient=patient,
                    hospital=hospital_b,
                    is_active=False
                )

            self.stdout.write(f'  {patient.full_name} ({patient.patient_id}) - Card: {patient.cards.first().card_number}')

        # Patient 3 (Amit Verma) visits BOTH hospitals
        # This demonstrates global patient access
        self.stdout.write(self.style.SUCCESS(f'\nPatient {patients[2].full_name} ({patients[2].patient_id}) accessed by:'))
        self.stdout.write(f'  - Hospital A: City General Hospital')
        self.stdout.write(f'  - Hospital B: Metro Specialty Hospital')

        # Create some health records at different hospitals
        HealthRecord.objects.create(
            patient=patients[2],
            doctor=doctors_a[0],
            hospital=hospital_a,
            date=date.today() - timedelta(days=10),
            diagnosis='Mild hypertension',
            record_type='routine',
            notes='Patient advised lifestyle changes'
        )

        HealthRecord.objects.create(
            patient=patients[2],
            doctor=doctors_b[3],
            hospital=hospital_b,
            date=date.today() - timedelta(days=3),
            diagnosis='Anxiety disorder evaluation',
            record_type='follow_up',
            notes='Follow-up assessment recommended'
        )

        # Create prescriptions
        Prescription.objects.create(
            patient=patients[1],
            doctor=doctors_a[0],
            hospital=hospital_a,
            medicine='Amlodipine 5mg',
            dosage='Once daily',
            duration='30 days',
            status='active',
        )

        self.stdout.write(self.style.SUCCESS('\nTest data seeded successfully!'))
        self.stdout.write(self.style.WARNING('\n=== LOGIN CREDENTIALS ==='))
        self.stdout.write('Super Admin: username=superadmin, password=superadmin123')
        self.stdout.write(f'Hospital A Admin: username=admin_a, password=admin_a123')
        self.stdout.write(f'Hospital B Admin: username=admin_b, password=admin_b123')
        self.stdout.write(f'Doctor A1: username=doctor_a_1, password=doctor_a_1')
        self.stdout.write(f'Doctor B1: username=doctor_b_1, password=doctor_b_1')
        self.stdout.write(self.style.WARNING('\n=== PATIENT CARD NUMBERS ==='))
        for p, card in zip(patients, [p.cards.first() for p in patients]):
            self.stdout.write(f'  {p.full_name} ({p.patient_id}): {card.card_number}')