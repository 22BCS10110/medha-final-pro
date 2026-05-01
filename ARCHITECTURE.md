# Medha Health Intelligence — System Architecture

## Overview

Medha Health is a **multi-hospital, multi-tenant** healthcare platform with three first-class clients (web/desktop, mobile, ABDM-ready services), a Django REST core, and a side-car FastAPI service that bridges USB NFC readers. Hospitals are isolated tenants; patients are global so the same person can walk into any participating hospital with the same NFC card.

---

## High-Level Topology

```
┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────────┐
│ React + Vite + Electron │  │   Flutter Mobile App    │  │   ABDM / HIU /   │
│   (Doctor / Admin)      │  │       (Patient)         │  │   HIP Sandboxes  │
└────────────┬────────────┘  └────────────┬────────────┘  └────────┬─────────┘
             │ Bearer JWT                  │ Supabase JWT           │
             │                             │                        │
             ▼                             ▼                        ▼
       ┌──────────────────────────────────────────────────────────────┐
       │            Django REST API  (port 8000, SimpleJWT)           │
       │  hospitals · accounts · patients · doctors · records ·       │
       │  billing  · contact   · consent  · chat    · notifications · │
       │  patient_uploads · abdm_simulator                            │
       │  middleware: HospitalScopedPermission, RBAC                  │
       └────────────┬─────────────────────────────────────────────────┘
                    │
        ┌───────────┼─────────────────────────────────────┐
        ▼           ▼                                     ▼
  ┌──────────┐  ┌─────────────────┐               ┌─────────────────┐
  │  SQLite  │  │  Django Channels│               │ Supabase (mobile│
  │ (dev) /  │  │  (WebSockets:   │               │ auth + audit +  │
  │ Postgres │  │  /ws/chat/…)    │               │ chat mirror)    │
  │  (prod)  │  └─────────────────┘               └─────────────────┘
  └──────────┘
        ▲
        │ Token auth
        │
┌───────┴────────────────┐         ┌──────────────────────┐
│ FastAPI NFC Bridge     │ ◄────── │  ACR122U / DESFire   │
│ (port 8010)            │  USB    │   NFC Reader (HW)    │
│ /scan/latest, /patient │         └──────────────────────┘
└────────────────────────┘
```

---

## Tenancy Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPER ADMIN                               │
│                  (controls all hospitals)                        │
│            /api/hospitals/  ·  /api/dashboard/admin/             │
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
 │ Doctors (FK)          │ │ Doctors (FK)          │
 │ Appointments (FK)     │ │ Appointments (FK)     │
 │ Health Records (FK)   │ │ Health Records (FK)   │
 │ Prescriptions (FK)    │ │ Prescriptions (FK)    │
 │ Vitals (FK, nullable) │ │ Vitals (FK, nullable) │
 │ Receipts (FK)         │ │ Receipts (FK)         │
 └───────────────────────┘ └───────────────────────┘
            │                         │
            └────────────┬────────────┘
                         ▼
            ┌────────────────────────────┐
            │    GLOBAL PATIENTS         │
            │  PAT-4500, PAT-4501, …     │
            │  ✓ visit any hospital      │
            │  ✓ same patient_id always  │
            │  ✓ NFC / QR card scanning  │
            │  ✓ aggregated history      │
            └────────────────────────────┘
```

---

## Backend Apps (Django)

| App | Purpose | Hospital-scoped? |
|-----|---------|------------------|
| `hospitals` | Hospital model, multi-tenant root | — |
| `accounts` | Custom `User`, JWT/Google/Firebase auth, RBAC permissions | partly (`hospital` FK) |
| `patients` | `Patient`, `PatientCard`, `PatientHospitalVisit`, NFC API | **global** |
| `doctors` | `Doctor`, `Appointment`, booking + slot APIs | yes |
| `records` | `HealthRecord`, `Prescription`, `Vital` | yes |
| `billing` | `Receipt`, billing summary | yes |
| `contact` | Public enquiry form | — |
| `consent` | One-time patient consent toggle (ABDM-style) | global to patient |
| `chat` | Doctor ↔ patient chat (REST + Channels WebSocket) | per-room |
| `notifications` | In-app notification feed | per-user |
| `patient_uploads` | Patient-uploaded reports / prescription PDFs | per-user |
| `abdm_simulator` | ABHA, consent, HIU, audit endpoints — **simulation only** | — |

URL roots (see `medha_backend/urls.py`):

```
/api/auth/              → accounts
/api/hospitals/         → hospitals
/api/                   → doctors, records, patients, notifications, patient_uploads
/api/billing/           → billing
/api/contact/           → contact
/api/consent/           → consent
/api/chat/              → chat
/api/abdm/              → abdm_simulator
/api/dashboard/...      → dashboard_views (admin / doctor / patient)
/api/reports/           → reports_view
/api/hospital/settings/ → hospital_settings
```

---

## Database Schema

### Hospital-tied data (isolated per hospital)

| Model | Hospital FK | Accessible by |
|-------|-------------|---------------|
| `Doctor` | `hospital` (required) | hospital staff |
| `Appointment` | `hospital` (required) | hospital staff |
| `HealthRecord` | `hospital` (required) | hospital staff |
| `Prescription` | `hospital` (required) | hospital staff |
| `Vital` | `hospital` (nullable) | hospital staff |
| `Receipt` | `hospital` (required) | hospital staff |
| `User` (doctor / admin) | `hospital` (nullable) | n/a |

### Global data

| Model | Description |
|-------|-------------|
| `Patient` | UUID PK, `patient_id` code, `supabase_uid`, no hospital FK |
| `PatientCard` | NFC / QR card, unique `card_number`, links to a patient |
| `PatientHospitalVisit` | M2M-style record of which hospitals a patient has visited |

All primary keys are UUIDs to support distribution.

---

## Authentication & RBAC

| Surface | Mechanism |
|---------|-----------|
| Desktop / Admin (React + Electron) | SimpleJWT (`Bearer`) — 12 h access, 7 d rotating refresh |
| OAuth login | Google ID token, Firebase ID token (verified server-side) |
| Mobile (Flutter) | Supabase Auth → mapped to `Patient.supabase_uid` |
| NFC bridge | Local FastAPI JWT (HS256) shared only with the desktop client |

JWT claims include `role` and `hospital_id`.

### Roles

| Role | Scope | Can access |
|------|-------|------------|
| `super_admin` | global | every hospital, every endpoint |
| `hospital_admin` | one hospital | their hospital's doctors, patients, appointments, billing, settings |
| `doctor` | one hospital | patients they have appointments with, write prescriptions/vitals |
| `patient` | self | own profile, records, appointments, uploads, chat |

Permission classes live in `accounts/permissions.py`:
`IsSuperAdmin`, `IsHospitalAdmin`, `IsDoctor`, `IsPatient`, `IsStaff`, `HasHospitalAccess`, `IsOwnerOrStaff`, `BelongsToHospital`, `HospitalScopedPermission`.

Hospital filtering is applied in `get_queryset()` overrides via `HospitalScopedPermission.filter_queryset_by_hospital()`.

---

## Frontend Structure (React + Vite + Electron)

```
medha-frontend/
├── electron/             # Electron main process, NFC bridge, sync engine, SQLite cache
│   ├── main.js           # window + IPC
│   ├── preload.js        # contextBridge surface for renderer
│   ├── nfcReader.js      # IPC bridge to FastAPI NFC service
│   ├── database.js       # local SQLite cache for offline mode
│   └── syncEngine.js     # background sync with Django API
├── src/
│   ├── auth/             # AuthContext, ProtectedRoute, login modals, PatientPortal
│   ├── features/
│   │   ├── admin/        # AdminLayout, Sidebar, dashboard, patient/doctor/billing mgmt
│   │   ├── doctor/       # Doctor dashboard, prescriptions, appointments
│   │   ├── patient/      # Patient dashboard, uploads, history
│   │   ├── nfc/          # NFC scan page, desktop NFC panel
│   │   ├── consent/      # ABDM consent dashboard
│   │   └── marketing/    # Public pages (Home, About, Pricing, Contact)
│   ├── components/
│   │   ├── ui/           # Reusable UI (Hero, Features, Button, Logo …)
│   │   └── layout/       # Navbar, Footer, Layout wrapper
│   └── services/
│       └── abdmService.js # ABDM simulator client
└── public/
```

State is React Context (`AuthContext`); routing is `react-router-dom` with role-based `ProtectedRoute`.

---

## Mobile (Flutter)

`medha-mobile/` — patient-facing app. Uses Supabase JWT directly. Endpoints touched are mostly:
`/api/patients/patients/{id}/`, `/api/dashboard/patient/`, `/api/consent/...`, `/api/chat/...`, `/api/patient-uploads/`.

---

## NFC Bridge Service

A separate FastAPI process (`medha-backend/nfc_service/app.py`) on port 8010 mediates between the USB ACR122U reader and the desktop app:

- Reader writes the most recent UID/payload into `latest_scan.json`.
- FastAPI exposes `GET /scan/latest`, `GET /patient/{id}`, `POST /token`.
- The Electron renderer polls `/scan/latest` and resolves the patient via the Django API (`/api/patients/scan-card/...`).

Run:

```bash
cd medha-backend/nfc_service
.venv/Scripts/uvicorn app:app --host 0.0.0.0 --port 8010 --reload
```

---

## ABDM Integration Strategy

The system is **architecture-ready** for ABDM (Ayushman Bharat Digital Mission) but does not call live ABDM APIs.

- `abdm_simulator/` mocks ABHA creation, consent flow, HIU data fetch, and audit log endpoints.
- `Patient.abha_id` is reserved for the real ABHA number.
- The frontend `services/abdmService.js` already speaks the simulator's contract; swapping the base URL to a real HIP/HIU sandbox is the migration path.

---

## Data Isolation Rules

✅ **Hospital A can see**
- Hospital A's doctors, appointments, records, billing
- Any patient (patients are global)
- Hospital A's admin can scan any patient card

❌ **Hospital A cannot see**
- Hospital B's doctors, appointments, records, or billing

✅ **Both can access**
- The same `Patient` via `patient_id` (universal)
- Aggregated medical history when patient consent is granted
- Patient cards (QR / NFC scanning)

---

## Test Scenarios

### 1. Hospital data isolation
```
Login as admin_a → GET /api/doctors/ → Hospital A doctors only
Login as admin_b → GET /api/doctors/ → Hospital B doctors only
```

### 2. Global patient access
```
Patient Amit (PAT-4502) registered at Hospital A
Same patient visits Hospital B
Hospital B scans CARD-PAT-4502-E985F5
GET /api/patients/patient-cards/scan/CARD-PAT-4502-E985F5/
→ Returns Amit's full data including Hospital A history
→ No duplicate Patient row
```

### 3. Cross-hospital denial
```
Login as admin_a (Hospital A)
GET /api/doctors/{hospital_b_doctor_id}/ → 403 / 404 (filtered out)
```

### 4. NFC end-to-end
```
ACR122U writes UID to latest_scan.json
Frontend → GET http://127.0.0.1:8010/scan/latest
NFC bridge → GET /api/patients/scan-card/{card_number}/ on Django
Django returns patient + visits + cards
Frontend opens patient profile
```

---

## Running the Stack

```bash
# Backend
cd medha-backend
python manage.py migrate
python manage.py seed_data
python manage.py runserver           # :8000

# NFC bridge (separate terminal)
cd medha-backend/nfc_service
.venv/Scripts/uvicorn app:app --host 0.0.0.0 --port 8010 --reload

# Frontend (web dev)
cd medha-frontend
npm install
npm run dev                          # :5173

# Frontend (Electron desktop)
npm run electron:dev

# Mobile
cd medha-mobile
flutter run
```

---

## Key Technical Choices

- **Database** — SQLite in dev, Postgres in prod (`DATABASE_URL` env var, `dj_database_url`).
- **Auth** — SimpleJWT (web/desktop), Supabase (mobile), local FastAPI JWT (NFC bridge).
- **Realtime** — Django Channels with `InMemoryChannelLayer` (swap to Redis for prod).
- **Styling** — Tailwind CSS.
- **Time zone** — `Asia/Kolkata`.
- **CORS** — `CORS_ALLOW_ALL_ORIGINS = True` in dev only.
- **IDs** — UUID primary keys throughout for distributed readiness.
- **Offline cache** — Electron embeds SQLite + a sync engine for low-connectivity hospitals.

---

## Migration Notes

When upgrading from the legacy single-tenant system:

1. **Hospital model added** — `Hospital`, `hospital_id` (`HOSP-XXXX`), `gstin`, `abdm_hip_id`.
2. **User** — added `hospital` FK + `super_admin` role.
3. **Doctor / Appointment / HealthRecord / Prescription / Receipt** — added `hospital` FK (required).
4. **Vital** — added `hospital` FK (nullable to keep historical rows).
5. **New models** — `Hospital`, `PatientHospitalVisit`, `PatientCard`.
6. **Backward compat** — `hospital_name` kept as a string field; existing rows backfilled by `seed_data`.

---

## Login Credentials (after `seed_data`)

| Role | Username | Password |
|------|----------|----------|
| Super Admin | `superadmin` | `superadmin123` |
| Hospital A Admin | `admin_a` | `admin_a123` |
| Hospital B Admin | `admin_b` | `admin_b123` |
| Hospital A Doctor | `doctor_a_1` | `doctor_a_1` |
| Hospital B Doctor | `doctor_b_1` | `doctor_b_1` |

For the full endpoint catalogue, see `API_DOCUMENTATION.md`.
