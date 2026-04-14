"""
Update Supabase user metadata with correct hospital_id and role.
Run this script to sync Supabase with Django hospital data.
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medha_backend.settings')

import django
django.setup()

from django.conf import settings
from django.db import models
from hospitals.models import Hospital
import requests

SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_SERVICE_KEY = settings.SUPABASE_SERVICE_KEY

headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Content-Type': 'application/json',
}

def get_supabase_users():
    """Get all users from Supabase."""
    response = requests.get(f'{SUPABASE_URL}/auth/v1/admin/users', headers=headers, params={'per_page': 50})
    if response.status_code == 200:
        return response.json().get('users', [])
    else:
        print(f'Error: {response.status_code}')
        print(response.text)
        return []

def update_user_meta(user_id, user_metadata):
    """Update user metadata in Supabase."""
    response = requests.put(
        f'{SUPABASE_URL}/auth/v1/admin/users/{user_id}',
        headers=headers,
        json={'user_metadata': user_metadata}
    )
    return response.status_code, response.json()

# Get all hospitals
hospitals = list(Hospital.objects.all())
print(f"Found {len(hospitals)} hospitals:")
for h in hospitals:
    print(f"  - {h.name} (hospital_id: {h.hospital_id})")

# Get all Supabase users
users = get_supabase_users()
print(f"\nFound {len(users)} Supabase users")

# Update each user
from django.contrib.auth import get_user_model
User = get_user_model()

for user in users:
    email = user.get('email', '')
    current_meta = user.get('user_metadata', {})
    
    # Find corresponding Django user (or create one)
    try:
        dj_user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Create a Django user from Supabase data
        patient_id = current_meta.get('patient_id', '')
        role = current_meta.get('role', 'patient')
        
        # Determine hospital_id from Supabase metadata if available
        hospital_id = current_meta.get('hospital_id', '')
        hospital = None
        
        if hospital_id:
            from hospitals.models import Hospital
            hospital = Hospital.objects.filter(hospital_id=hospital_id).first()
        
        dj_user = User.objects.create(
            username=user['id'][:20],
            email=email,
            role=role,
            hospital=hospital,
        )
        print(f"  Created Django user for {email}")
    
    # Determine role and hospital_id
    role = dj_user.role
    
    # Build metadata
    new_meta = {
        'role': role,
    }
    
    if dj_user.hospital:
        new_meta['hospital_id'] = dj_user.hospital.hospital_id
    
    # For patients, add patient_id
    if role == 'patient':
        try:
            from patients.models import Patient
            patient = Patient.objects.get(user=dj_user)
            new_meta['patient_id'] = patient.patient_id
        except Exception:
            pass
    
    print(f"\nUpdating {email}:")
    print(f"  Role: {role}")
    print(f"  Hospital: {dj_user.hospital.name if dj_user.hospital else 'None'}")
    print(f"  Metadata: {new_meta}")
    
    status_code, result = update_user_meta(user['id'], new_meta)
    if status_code == 200:
        print("  ✅ Updated!")
    else:
        print(f"  ❌ Error: {result}")

print("\n✅ Done! All Supabase users synced.")