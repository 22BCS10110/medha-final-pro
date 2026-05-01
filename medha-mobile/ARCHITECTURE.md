# Medha Health Intelligance - Multi-Hospital Architecture

## Overview

The Medha Health Intelligance platform has been converted from a single-tenant (one hospital) system to a **multi-hospital multi-tenant** architecture with **global patient access**.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPER ADMIN                               │
│                   (Controls All Hospitals)                       │
│                   /api/hospitals/                                │
│                   /api/dashboard/admin/                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
┌───────────────────────┐ ┌───────────────────────┐
│   HOSPITAL A          │ │   HOSPITAL B          │
│   (City General)      │ │   (Metro Specialty)   │
│   HOSP-0001           │ │   HOSP-0002           │
├───────────────────────┤ ├───────────────────────┤
│ Hospital Admin        │ │ Hospital Admin        │
│ 5 Doctors             │ │ 5 Doctors             │
│ N Appointments        │ │ N Appointments        │
│ N Health Records      │ │ N Health Records      │
│ N Prescriptions       │ │ N Prescriptions       │
│ N Vitals              │ │ N Vitals              │
│ N Receipts/Billing    │ │ N Receipts/Billing    │
└───────────────────────┘ └───────────────────────┘
            │                         │
            └────────────┬────────────┘
                         ▼
             ┌───────────────────────┐
             │    GLOBAL PATIENTS     │
             │  PAT-4500, PAT-4501... │
             │                        │
             │  ✓ Can visit any hospital│
             │  ✓ Same patient_id across│
             │  ✓ Patient Card scanning │
             └───────────────────────┘
```

---

## Database Schema

### Hospital-Tied Data (Isolated per hospital)

| Model | Hospital FK Field | Accessible By |
|-------|------------------|---------------|
| `Doctor` | `hospital` (FK) | Only hospital's staff |
| `Appointment` | `hospital` (FK) | Only hospital's staff |
| `HealthRecord` | `hospital` (FK) | Only hospital's staff |
| `Prescription` | `hospital` (FK) | Only hospital's staff |
| `Vital` | `hospital` (FK, nullable) | Only hospital's staff |
| `Receipt` | `hospital` (FK) | Only hospital's staff |
| `User` (doctor/admin) | `hospital` (FK, nullable) | N/A |

### Global Patient Data (Accessible across hospitals)

| Model | Description |
|-------|-------------|
| `Patient` | No hospital FK - globally accessible |
| `PatientCard` | Patient identification cards (QR/NFC) |
| `PatientHospitalVisit` | Tracks which hospitals a patient has visited |

---

## Role-Based Access Control

| Role | Scope | Can Access |
|------|-------|------------|
| `super_admin` | Global | All hospitals, all data |
| `hospital_admin` | Single hospital | Their hospital's doctors, appointments, records, billing |
| `doctor` | Single hospital | Their hospital's patients' data |
| `patient` | Global | Their own data from ALL hospitals |

---

## Key API Endpoints

### Hospital Management (Super Admin / Authenticated)
- `GET /api/hospitals/` - List all hospitals
- `POST /api/hospitals/` - Create hospital (Super Admin only)
- `GET /api/hospitals/brief/` - Minimal hospital list for dropdowns
- `GET /api/hospitals/my-hospital/` - Current user's hospital

### Patient Card System (Global Access - Key Feature)
- `GET /api/patients/patient-cards/scan/{card_number}/` - Scan patient card
- `GET /api/patients/{id}/global-access/` - Access patient from any hospital
- `POST /api/patients/{id}/issue-card/` - Issue new card to patient
- `GET /api/patients/{id}/cards/` - Get all cards for a patient

### Hospital-Scoped API (Auto-filtered by middleware)
- `GET /api/doctors/` - Only returns doctors in user's hospital
- `GET /api/appointments/` - Only returns appointments in user's hospital
- `GET /api/records/` - Only returns records from user's hospital
- `GET /api/prescriptions/` - Only returns prescriptions from user's hospital
- `GET /api/billing/receipts/` - Only returns receipts from user's hospital

---

## Data Isolation Rules

### ✅ Hospital A CAN see:
- Hospital A's doctors, appointments, records, billing
- Any patient (patients are global)
- Hospital A's admin can scan any patient card

### ❌ Hospital A CANNOT see:
- Hospital B's doctors
- Hospital B's appointments
- Hospital B's health records
- Hospital B's billing data

### ✅ BUT BOTH can access:
- Same patient via `patient_id` (patient_id is global/universal)
- Patient medical history (aggregated from all hospitals)
- Patient cards (QR/NFC scanning)

---

## Migration Notes

### New Fields Added:
1. **Hospital Model** (new): `Hospital`, `hospital_id`, `gstin`, `abdm_hip_id`
2. **User**: Added `hospital` FK, new role `super_admin`
3. **Doctor**: Added `hospital` FK (required)
4. **Appointment**: Added `hospital` FK
5. **HealthRecord**: Added `hospital` FK
6. **Prescription**: Added `hospital` FK
7. **Vital**: Added `hospital` FK (nullable)
8. **Receipt**: Added `hospital` FK

### New Models:
- `Hospital` - Hospital entity
- `PatientHospitalVisit` - Tracks patient-hospital relationships
- `PatientCard` - QR/NFC card for patient identification

### Backward Compatibility:
- `hospital_name` field kept as string for backward compatibility
- All IDs use UUID primary keys for distributed system readiness

---

## Test Scenarios

### ✅ Scenario 1: Hospital Data Isolation
```
1. Login as admin_a (Hospital A admin)
2. GET /api/doctors/ → Returns only Hospital A's 5 doctors (City General)
3. Login as admin_b (Hospital B admin)
4. GET /api/doctors/ → Returns only Hospital B's 5 doctors (Metro Specialty)
```

### ✅ Scenario 2: Global Patient Access
```
1. Patient "Amit Verma" (PAT-4502) registered at Hospital A
2. Same patient visits Hospital B
3. Hospital B scans card CARD-xxx-E985F5
4. GET /api/patients/patient-cards/scan/CARD-xxx-E985F5/
   → Returns Amit Verma's full data including Hospital A records
5. No duplicate patient created
```

### ✅ Scenario 3: Cross-Hospital Access Denied
```
1. Login as admin_a (Hospital A)
2. GET /api/hospitals/HOSPITAL_B_ID/doctors/ → Permission denied
3. Hospital A cannot see Hospital B's doctors
```

---

## How to Run

```bash
cd medha-backend

# Fresh setup
python manage.py migrate
python manage.py seed_data

# Run server
python manage.py runserver
```

---

## Login Credentials (After seed_data)

| Role | Username | Password |
|------|----------|----------|
| Super Admin | superadmin | superadmin123 |
| Hospital A Admin | admin_a | admin_a123 |
| Hospital B Admin | admin_b | admin_b123 |
| Hospital A Doctor | doctor_a_1 | doctor_a_1 |
| Hospital B Doctor | doctor_b_1 | doctor_b_1 |