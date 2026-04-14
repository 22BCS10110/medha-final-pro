"""
Django management command to import all patients from SQLite to Supabase Auth.

Usage:
    python manage.py import_patients_to_supabase

This command:
1. Reads all patients from the local SQLite database
2. Creates corresponding users in Supabase Auth
3. Sets user metadata (role, hospital_id, patient_id, etc.)
4. Updates the firebase_uid field in the Patient model
"""

import os
import requests
from django.core.management.base import BaseCommand
from patients.models import Patient
from django.conf import settings


class Command(BaseCommand):
    help = 'Import all patients from SQLite to Supabase Auth'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually making changes',
        )
        parser.add_argument(
            '--default-password',
            type=str,
            default='MedhaHealth123!',
            help='Default password for imported patients (default: MedhaHealth123!)',
        )

    def handle(self, *args, **options):
        supabase_url = getattr(settings, 'SUPABASE_URL', None)
        supabase_service_key = getattr(settings, 'SUPABASE_SERVICE_KEY', None)

        if not supabase_url or not supabase_service_key:
            self.stderr.write(self.style.ERROR('Supabase credentials not configured in settings'))
            return

        dry_run = options['dry_run']
        default_password = options['default_password']

        patients = Patient.objects.all()
        total = patients.count()

        self.stdout.write(self.style.SUCCESS(f'Found {total} patients to import'))

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - no changes will be made'))
            for patient in patients:
                self.stdout.write(f'  Would create: {patient.full_name} ({patient.email or patient.patient_id})')
            return

        created = 0
        skipped = 0
        errors = 0

        for patient in patients:
            try:
                # Skip if already has firebase_uid (already imported)
                if patient.firebase_uid:
                    self.stdout.write(f'  Skipping {patient.full_name} - already has firebase_uid')
                    skipped += 1
                    continue

                # Use email if available, otherwise use patient_id as email
                email = patient.email or f"{patient.patient_id}@medha.local"
                
                # Check if user already exists in Supabase
                user_exists = self._check_user_exists(supabase_url, supabase_service_key, email)
                
                if user_exists:
                    self.stdout.write(f'  Skipping {patient.full_name} - user already exists in Supabase')
                    skipped += 1
                    continue

                # Create user in Supabase
                user_data = {
                    'email': email,
                    'password': default_password,
                    'email_confirm': True,
                    'user_metadata': {
                        'full_name': patient.full_name,
                        'role': 'patient',
                        'patient_id': patient.patient_id,
                        'hospital_id': None,  # Patients are global, not tied to a hospital
                        'phone': patient.phone or '',
                        'gender': patient.gender,
                        'blood_group': patient.blood_group or '',
                    }
                }

                if not dry_run:
                    result = self._create_supabase_user(supabase_url, supabase_service_key, user_data)
                    
                    if result and 'id' in result:
                        # Update patient record with Supabase UID
                        patient.firebase_uid = result['id']
                        patient.save(update_fields=['firebase_uid'])
                        
                        self.stdout.write(self.style.SUCCESS(
                            f'  Created: {patient.full_name} ({email}) -> UID: {result["id"]}'
                        ))
                        created += 1
                    else:
                        self.stderr.write(self.style.ERROR(
                            f'  Failed to create {patient.full_name}: {result}'
                        ))
                        errors += 1
                else:
                    self.stdout.write(f'  Would create: {patient.full_name} ({email})')
                    created += 1

            except Exception as e:
                self.stderr.write(self.style.ERROR(f'  Error processing {patient.full_name}: {str(e)}'))
                errors += 1

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Import complete!'))
        self.stdout.write(self.style.SUCCESS(f'  Created: {created}'))
        self.stdout.write(self.style.WARNING(f'  Skipped: {skipped}'))
        self.stdout.write(self.style.ERROR(f'  Errors: {errors}'))
        
        if created > 0:
            self.stdout.write(self.style.WARNING(f'\nDefault password for all patients: {default_password}'))
            self.stdout.write(self.style.WARNING('Patients should be prompted to change their password on first login.'))

    def _check_user_exists(self, supabase_url, service_key, email):
        """Check if a user already exists in Supabase Auth."""
        try:
            url = f"{supabase_url}/auth/v1/admin/users"
            headers = {
                'apikey': service_key,
                'Authorization': f'Bearer {service_key}',
                'Content-Type': 'application/json',
            }
            params = {'email': email}
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                users = data.get('users', [])
                return any(u.get('email') == email for u in users)
            return False
        except Exception:
            return False

    def _create_supabase_user(self, supabase_url, service_key, user_data):
        """Create a user in Supabase Auth using the Admin API."""
        try:
            url = f"{supabase_url}/auth/v1/admin/users"
            headers = {
                'apikey': service_key,
                'Authorization': f'Bearer {service_key}',
                'Content-Type': 'application/json',
            }
            response = requests.post(url, headers=headers, json=user_data, timeout=10)
            
            if response.status_code in [200, 201]:
                return response.json()
            else:
                return {'error': response.status_code, 'message': response.text}
        except Exception as e:
            return {'error': str(e)}