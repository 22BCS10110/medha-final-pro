"""Check Supabase Users and Update Metadata with Hospital IDs"""
import os
import sys

# Setup Django settings
sys.path.append(os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medha_backend.settings')

import django
django.setup()

from django.conf import settings
import requests

SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_SERVICE_KEY = settings.SUPABASE_SERVICE_KEY

headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Content-Type': 'application/json',
}

def get_users():
    response = requests.get(f'{SUPABASE_URL}/auth/v1/admin/users', headers=headers, params={'per_page': 50})
    if response.status_code == 200:
        return response.json().get('users', [])
    else:
        print(f'Error: {response.status_code}')
        print(response.text)
        return []

def update_user_meta(user_id, user_metadata={}):
    response = requests.put(
        f'{SUPABASE_URL}/auth/v1/admin/users/{user_id}',
        headers=headers,
        json={'user_metadata': user_metadata}
    )
    return response.status_code, response.json()

# Fetch all users
users = get_users()
print(f"Total Supabase users: {len(users)}\n")

# Map patients to hospital H001 (City General Hospital)
# Map doctors to hospitals
hospital_mapping = {
    'vikram@example.com': {'role': 'patient', 'hospital_id': 'HOSP-0001', 'patient_id': 'MHD-4504'},
    'sneha@example.com': {'role': 'patient', 'hospital_id': 'HOSP-0001', 'patient_id': 'MHD-4503'},
    'amit@example.com': {'role': 'patient', 'hospital_id': 'HOSP-0001', 'patient_id': 'MHD-4502'},
    'priya@example.com': {'role': 'patient', 'hospital_id': 'HOSP-0001', 'patient_id': 'MHD-4501'},
    'rahul@example.com': {'role': 'patient', 'hospital_id': 'HOSP-0001', 'patient_id': 'MHD-4500'},
}

# Update each patient user
for user in users:
    email = user.get('email', '')
    meta = user.get('user_metadata', {})
    
    if email in hospital_mapping:
        new_meta = hospital_mapping[email]
        print(f"Updating {email}: {new_meta}")
        status, result = update_user_meta(user['id'], new_meta)
        print(f"  Status: {status}")
        if status == 200:
            print(f"  Updated!")
        else:
            print(f"  Error: {result}")

print("\nDone! All Supabase users updated with hospital_id metadata.")