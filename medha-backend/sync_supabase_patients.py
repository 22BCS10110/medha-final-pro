"""
One-time script: import all 14 Supabase auth users into Django patients table.
Run with: python sync_supabase_patients.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medha_backend.settings')
django.setup()

from patients.models import Patient
from patients.utils import generate_patient_id

SUPABASE_PATIENTS = [
    {"supabase_uid": "ed9ae45b-d3b3-4c75-b236-d2cdce5f95f1", "email": "amit@example.com",          "full_name": "Amit Kumar",     "phone": "+91 9876543212"},
    {"supabase_uid": "d9aec3e6-e964-427f-b404-f400d5524737", "email": "rahul@example.com",          "full_name": "Rahul Sharma",   "phone": "+91 9876543210"},
    {"supabase_uid": "f2617eb5-7ddf-470c-8b5d-2b264898747a", "email": "priya@example.com",          "full_name": "Priya Patel",    "phone": "+91 9876543211"},
    {"supabase_uid": "5aee5b07-3dc0-45a2-a9a6-a7e30196de2d", "email": "sneha@example.com",          "full_name": "Sneha Reddy",    "phone": "+91 9876543213"},
    {"supabase_uid": "bd47f47d-823a-4cae-aabd-30f761622c60", "email": "vikram@example.com",         "full_name": "Vikram Singh",   "phone": "+91 9876543214"},
    {"supabase_uid": "22534d67-74e3-4d94-9229-fe992cd8315d", "email": "rsevil1234@gmail.com",       "full_name": "Rohit Soni",     "phone": ""},
    {"supabase_uid": "3a5439a8-d001-495b-90ac-b4075425f424", "email": "rohit8199055020@gmail.com",  "full_name": "Rohit Soni",     "phone": ""},
    {"supabase_uid": "c4b96d25-d955-4b62-83d8-3ada4e404a65", "email": "rsoni999640@gmail.com",      "full_name": "Rohit",          "phone": ""},
    {"supabase_uid": "ecab5fd8-2a87-4cf8-9d48-d6ab8fbac2bc", "email": "22bcs10117@gmail.com",       "full_name": "Abhishek Kumar", "phone": ""},
    {"supabase_uid": "404825f1-257a-4bd9-8815-96ad49246960", "email": "health@gmail.com",           "full_name": "Health",         "phone": ""},
    {"supabase_uid": "4d39f210-4a7d-494c-b4a1-1d89f38cd598", "email": "medha@gmail.com",            "full_name": "Medha",          "phone": ""},
    {"supabase_uid": "a91f9edf-206a-4668-8ee8-3aa13f43b8a3", "email": "rohit@example.com",          "full_name": "Rohit",          "phone": ""},
    {"supabase_uid": "06b2d09b-002e-47ef-b2b1-9844eee34138", "email": "22bcs10117@gmail.cim",       "full_name": "22bcs10117",     "phone": ""},
    {"supabase_uid": "1887cb3b-0c04-45e9-be6a-7ad9a5325b81", "email": "abh@gmail.com",              "full_name": "Abh",            "phone": ""},
]

created = 0
skipped = 0

for p in SUPABASE_PATIENTS:
    uid   = p["supabase_uid"]
    email = p["email"]

    if Patient.objects.filter(supabase_uid=uid).exists():
        print(f"  SKIP (already synced): {p['full_name']}")
        skipped += 1
        continue

    existing = Patient.objects.filter(email=email).first() if email else None
    if existing:
        existing.supabase_uid = uid
        existing.save(update_fields=["supabase_uid"])
        print(f"  LINKED: {existing.full_name} ({existing.patient_id})")
        skipped += 1
        continue

    patient = Patient.objects.create(
        patient_id=generate_patient_id(),
        full_name=p["full_name"],
        email=email or None,
        phone=p["phone"],
        supabase_uid=uid,
        status="active",
    )
    print(f"  CREATED: {patient.full_name} -> {patient.patient_id} <{email}>")
    created += 1

print(f"\nResult: {created} created, {skipped} skipped/linked")
print(f"Total patients in DB: {Patient.objects.count()}")
print("\nAll patients now:")
for p in Patient.objects.all().order_by('patient_id'):
    print(f"  {p.patient_id:<12} {p.full_name:<22} {p.email or '-'}")
