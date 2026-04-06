"""
Force import all patients to Supabase Auth, regardless of existing firebase_uid.

Usage:
    python manage.py force_import_to_supabase
"""

import requests
from django.core.management.base import BaseCommand
from patients.models import Patient
from django.conf import settings


class Command(BaseCommand):
    help = 'Force import all patients to Supabase Auth'

    def add_arguments(self, parser):
        parser.add_argument(
            '--default-password',
            type=str,
            default='MedhaHealth123!',
            help='Default password for imported patients',
        )

    def handle(self, *args, **options):
        supabase_url = getattr(settings, 'SUPABASE_URL', None)
        supabase_service_key = getattr(settings, 'SUPABASE_SERVICE_KEY', None)

        if not supabase_url or not supabase_service_key:
            self.stderr.write(self.style.ERROR('Supabase credentials not configured'))
            return

        default_password = options['default_password']
        patients = Patient.objects.all()
        total = patients.count()

        self.stdout.write(self.style.SUCCESS(f'Found {total} patients to import to Supabase'))

        created = 0
        skipped = 0
        errors = 0

        for patient in patients:
            try:
                email = patient.email or f"{patient.patient_id}@medha.local"
                
                user_data = {
                    'email': email,
                    'password': default_password,
                    'email_confirm': True,
                    'user_metadata': {
                        'full_name': patient.full_name,
                        'role': 'patient',
                        'patient_id': patient.patient_id,
                        'hospital_id': None,
                        'phone': patient.phone or '',
                        'gender': patient.gender,
                        'blood_group': patient.blood_group or '',
                    }
                }

                result = self._create_supabase_user(supabase_url, supabase_service_key, user_data)
                
                if result and 'id' in result:
                    patient.firebase_uid = result['id']
                    patient.save(update_fields=['firebase_uid'])
                    
                    self.stdout.write(self.style.SUCCESS(
                        f'  Created: {patient.full_name} ({email}) -> Supabase UID: {result["id"]}'
                    ))
                    created += 1
                elif result and 'error' in result:
                    if 'already exists' in str(result.get('message', '')).lower() or 'duplicate' in str(result.get('message', '')).lower():
                        self.stdout.write(f'  Already exists: {patient.full_name} ({email})')
                        skipped += 1
                    else:
                        self.stderr.write(self.style.ERROR(
                            f'  Failed: {patient.full_name} - {result}'
                        ))
                        errors += 1
                else:
                    self.stderr.write(self.style.ERROR(
                        f'  Failed: {patient.full_name} - {result}'
                    ))
                    errors += 1

            except Exception as e:
                self.stderr.write(self.style.ERROR(f'  Error: {patient.full_name} - {str(e)}'))
                errors += 1

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Import complete!'))
        self.stdout.write(self.style.SUCCESS(f'  Created: {created}'))
        self.stdout.write(self.style.WARNING(f'  Skipped (already exists): {skipped}'))
        self.stdout.write(self.style.ERROR(f'  Errors: {errors}'))
        
        if created > 0:
            self.stdout.write('')
            self.stdout.write(self.style.WARNING(f'Default password: {default_password}'))

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