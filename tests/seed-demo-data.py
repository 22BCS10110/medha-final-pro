from doctors.models import Doctor
from patients.models import Patient
from django.db.models import Count

hospitals = [
    "City Hospital",
    "Sunrise MultiSpeciality",
    "Green Valley Medical Center",
    "Apex Care Hospital",
    "Lotus Heart Institute",
    "Metro Health Clinic",
    "Riverfront General Hospital",
    "Starlight Women and Child Care",
]

doctor_templates = [
    ("Dr. Aditi Sharma", "Cardiology"),
    ("Dr. Rohan Verma", "Neurology"),
    ("Dr. Meera Iyer", "General Medicine"),
    ("Dr. Kunal Singh", "Orthopaedics"),
    ("Dr. Priya Nair", "Gynaecology"),
    ("Dr. Arjun Patel", "Dermatology"),
    ("Dr. Neha Gupta", "Pediatrics"),
    ("Dr. Vikram Joshi", "Pulmonology"),
    ("Dr. Sana Khan", "ENT"),
    ("Dr. Manish Rao", "Urology"),
    ("Dr. Pooja Menon", "Oncology"),
    ("Dr. Rahul Das", "Psychiatry"),
]

created_doctors = 0
for idx, (name, dept) in enumerate(doctor_templates, start=1):
    doctor_id = f"DOC-SEED-{idx:03d}"
    hospital_name = hospitals[(idx - 1) % len(hospitals)]
    _, created = Doctor.objects.get_or_create(
        doctor_id=doctor_id,
        defaults={
            "full_name": name,
            "department": dept,
            "specialisation": dept,
            "status": "on_duty",
            "hospital_name": hospital_name,
            "phone": f"98{idx:08d}",
            "email": f"seed.doctor{idx}@medha.local",
        },
    )
    if created:
        created_doctors += 1

seed_doctors = list(Doctor.objects.filter(doctor_id__startswith="DOC-SEED-").order_by("id"))
if not seed_doctors:
    raise SystemExit("No seed doctors available")

max_num = 4500
for pid in Patient.objects.values_list("patient_id", flat=True):
    if isinstance(pid, str) and pid.startswith("MHD-"):
        part = pid.split("-", 1)[1]
        if part.isdigit():
            max_num = max(max_num, int(part))

first_names = [
    "Aarav",
    "Vivaan",
    "Aditya",
    "Vihaan",
    "Arjun",
    "Sai",
    "Krishna",
    "Ishaan",
    "Reyansh",
    "Atharv",
    "Anaya",
    "Siya",
    "Diya",
    "Aadhya",
    "Myra",
    "Pari",
    "Ira",
    "Navya",
    "Kiara",
    "Riya",
]
last_names = ["Sharma", "Verma", "Patel", "Singh", "Gupta", "Nair", "Iyer", "Rao", "Das", "Mehta", "Joshi", "Kapoor"]

created_patients = 0
for i in range(60):
    num = max_num + i + 1
    patient_id = f"MHD-{num}"
    full_name = f"{first_names[i % len(first_names)]} {last_names[i % len(last_names)]}"
    assigned_doctor = seed_doctors[i % len(seed_doctors)]
    hospital_name = assigned_doctor.hospital_name or hospitals[i % len(hospitals)]

    _, created = Patient.objects.get_or_create(
        patient_id=patient_id,
        defaults={
            "full_name": full_name,
            "gender": "M" if i % 2 == 0 else "F",
            "blood_group": ["A+", "B+", "O+", "AB+", "A-", "B-"][i % 6],
            "phone": f"97{i:08d}",
            "emergency_contact": f"96{i:08d}",
            "abha_id": f"12-3456-78{i:02d}-{(1000 + i):04d}",
            "reason_for_visit": "Routine checkup",
            "assigned_doctor": assigned_doctor,
            "status": "active" if i % 5 != 0 else "pending",
            "hospital_name": hospital_name,
        },
    )
    if created:
        created_patients += 1

hospital_summary = list(
    Patient.objects.values("hospital_name").annotate(total=Count("id")).order_by("-total")
)

print("Created doctors:", created_doctors)
print("Created patients:", created_patients)
print("Total doctors:", Doctor.objects.count())
print("Total patients:", Patient.objects.count())
print("Unique hospitals in patients:", Patient.objects.values("hospital_name").distinct().count())
print("Hospital-wise patient counts:")
for row in hospital_summary:
    print(f" - {row['hospital_name']}: {row['total']}")

