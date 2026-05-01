# Medha Health Intelligence — API Documentation

## Base URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Django backend | `http://127.0.0.1:8000/api` | Core REST API |
| NFC bridge (FastAPI) | `http://127.0.0.1:8010` | USB NFC reader bridge |
| Frontend (Vite dev) | `http://127.0.0.1:5173` | React + Electron app |

---

## Authentication

The Django backend uses **SimpleJWT** (RS/HS-signed access + refresh tokens) for the desktop/admin clients, plus optional Google OAuth and Firebase login flows. The Flutter mobile app authenticates against Supabase and the patient endpoints accept the Supabase UID.

### Headers

```
Authorization: Bearer <access_jwt>
Content-Type: application/json
```

Token lifetimes are configured in `medha_backend/settings.py`:

- `ACCESS_TOKEN_LIFETIME` — 12 hours
- `REFRESH_TOKEN_LIFETIME` — 7 days (rotation enabled)

Custom JWT claims include `role` and `hospital_id`.

### Auth Endpoints (`/api/auth/`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/login/` | Username/password login → JWT pair | Public |
| POST | `/api/auth/google/` | Google OAuth login (ID token in body) | Public |
| POST | `/api/auth/firebase-login/` | Firebase ID-token login | Public |
| POST | `/api/auth/profile/complete/` | Complete profile after first OAuth login | Bearer |
| POST | `/api/auth/logout/` | Blacklist refresh token | Bearer |
| POST | `/api/auth/refresh/` | Exchange refresh token for new access token | Public |
| GET  | `/api/auth/me/` | Current user profile | Bearer |

#### Login example

```http
POST /api/auth/login/
{
  "username": "doctor_a_1",
  "password": "doctor_a_1"
}
```

Response:

```json
{
  "tokens": { "access": "<jwt>", "refresh": "<jwt>" },
  "token": "<jwt>",
  "user": {
    "id": 12,
    "name": "Dr. Asha Mehra",
    "role": "doctor",
    "userId": "DOC-A-1001",
    "email": "asha@hosp-a.in",
    "hospital_name": "City General",
    "hospital_id": "550e8400-e29b-41d4-a716-446655440001",
    "is_profile_complete": true
  }
}
```

---

## Hospital Management (`/api/hospitals/`)

| Method | Path | Description | Allowed Roles |
|--------|------|-------------|---------------|
| GET | `/api/hospitals/` | List hospitals | All authenticated |
| POST | `/api/hospitals/` | Create hospital | `super_admin` |
| GET | `/api/hospitals/{id}/` | Hospital detail | All authenticated |
| PATCH | `/api/hospitals/{id}/` | Update hospital | `super_admin`, hospital's admin |
| DELETE | `/api/hospitals/{id}/` | Delete hospital | `super_admin` |
| GET | `/api/hospitals/brief/` | Minimal list for dropdowns | All authenticated |
| GET | `/api/hospitals/my-hospital/` | Caller's own hospital | All authenticated |

---

## Patient Management (`/api/patients/`)

Patients are **global** (no hospital FK). All other clinical data is hospital-scoped.

### Public / NFC-facing

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/patients/nfc-scan/?id=PAT-4504` | Resolve patient by code or NFC UID (no auth) |
| GET | `/api/patients/scan-card/{card_number}/` | Resolve patient by issued card number |
| GET | `/api/patients/patients/by-nfc/{uid}/` | Lookup by hardware NFC UID |
| GET | `/api/patients/patient-cards/scan/{card_number}/` | Card scanner endpoint (alias) |

### Patient CRUD & search

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/patients/patients/` | List patients (filtered by hospital visit history) |
| POST | `/api/patients/patients/` | Create patient |
| GET | `/api/patients/patients/{id}/` | Patient detail |
| PATCH | `/api/patients/patients/{id}/` | Update patient |
| DELETE | `/api/patients/patients/{id}/` | Delete patient |
| GET | `/api/patients/patients/search/?q=vikram` | Free-text search |
| GET | `/api/patients/patients/{id}/global-access/` | Aggregated history across hospitals |
| GET | `/api/patients/patient-visits/` | List `PatientHospitalVisit` records |

### Card / NFC operations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/patients/nfc/write/{patient_id}/` | Issue card (`card_type`: `nfc` or `qr`) |
| GET  | `/api/patients/nfc/read/{card_number}/` | Read card metadata |
| GET  | `/api/patients/nfc/cards/{patient_id}/` | All cards belonging to a patient |
| POST | `/api/patients/patients/assign-nfc/` | Bind hardware NFC UID to patient |
| GET  | `/api/patients/patients/{patient_id}/nfc-status/` | Whether the patient has an active card |
| POST | `/api/patients/patients/assign-doctor/` | Hospital admin assigns patient to a doctor |

#### NFC scan response

```json
{
  "id": "0e8400-e29b-41d4-a716-446655440010",
  "patient_id": "PAT-4504",
  "full_name": "Vikram Singh",
  "email": "vikram@example.com",
  "phone": "+91 9876543214",
  "gender": "M",
  "blood_group": "O-",
  "status": "active",
  "abha_id": "",
  "hospital_visits": [
    { "hospital": "HOSP-0001", "first_visit": "2025-08-01" }
  ],
  "cards": [
    { "card_number": "CARD-PAT-4504-E985F5", "card_type": "nfc", "active": true }
  ]
}
```

---

## Doctors (`/api/doctors/`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/doctors/` | List doctors (auto-filtered by hospital) |
| POST | `/api/doctors/` | Create doctor |
| GET | `/api/doctors/{id}/` | Doctor detail |
| PATCH | `/api/doctors/{id}/` | Update doctor |
| DELETE | `/api/doctors/{id}/` | Delete doctor |

---

## Appointments (`/api/appointments/`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/appointments/` | DRF list (hospital-scoped) |
| POST | `/api/appointments/book/` | Book appointment |
| GET | `/api/appointments/list/?role=doctor&date=2026-04-10&status=scheduled` | Filtered list |
| PATCH | `/api/appointments/{appointment_id}/status/` | Update status |
| GET | `/api/appointments/slots/{doctor_id}/?date=2026-04-10` | Available slots |

#### Book appointment

```http
POST /api/appointments/book/
{
  "doctor_id": "DOC-A-1001",
  "patient_id": "PAT-4504",
  "appointment_date": "2026-04-10",
  "appointment_time": "10:00",
  "reason": "General checkup"
}
```

Status values: `scheduled` · `confirmed` · `completed` · `cancelled` · `no_show`.

---

## Health Records (`/api/`)

| Method | Path | Description |
|--------|------|-------------|
| GET / POST | `/api/records/` | Health records (hospital-scoped) |
| GET / POST | `/api/prescriptions/` | Prescriptions (hospital-scoped) |
| GET / POST | `/api/vitals/` | Vital readings (hospital-scoped) |
| GET / PATCH / DELETE | `/api/{records|prescriptions|vitals}/{id}/` | Resource detail |

#### Create record

```http
POST /api/records/
{
  "patient_id": "PAT-4504",
  "diagnosis": "Mild fever",
  "record_type": "routine",
  "notes": "Patient advised rest"
}
```

---

## Billing (`/api/billing/`)

| Method | Path | Description |
|--------|------|-------------|
| GET / POST | `/api/billing/receipts/` | List / create receipts |
| GET / PATCH / DELETE | `/api/billing/receipts/{id}/` | Receipt detail |
| GET | `/api/billing/summary/` | Aggregated revenue summary |

---

## Consent (`/api/consent/`)

One-time patient consent system used for ABDM data sharing.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/consent/{patient_id}/check/` | Check consent state |
| POST | `/api/consent/{patient_id}/grant/` | Grant consent |
| POST | `/api/consent/{patient_id}/revoke/` | Revoke consent |

---

## Chat (`/api/chat/`)

Doctor ↔ patient real-time chat (HTTP REST + WebSocket via Django Channels).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/chat/rooms/` | List chat rooms for the caller |
| POST | `/api/chat/rooms/create/` | Create or get a 1:1 room |
| GET | `/api/chat/rooms/{room_id}/messages/` | Message history |
| POST | `/api/chat/rooms/{room_id}/send/` | Send a message |

WebSocket endpoint (ASGI / Channels): `ws://127.0.0.1:8000/ws/chat/{room_id}/`.

---

## Notifications (`/api/notifications/`)

In-app notification feed (DRF `ModelViewSet`).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications/` | List notifications for the caller |
| POST | `/api/notifications/` | Create notification |
| GET / PATCH / DELETE | `/api/notifications/{id}/` | Resource detail |

---

## Patient Uploads (`/api/patient-uploads/`)

Patient-uploaded reports and prescription PDFs (`multipart/form-data`).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/patient-uploads/` | List uploads visible to caller |
| POST | `/api/patient-uploads/` | Upload file (`file`, `kind`, `patient_id`) |
| GET / DELETE | `/api/patient-uploads/{id}/` | Resource detail |

---

## ABDM Simulator (`/api/abdm/`)

Mock implementation of ABDM (Ayushman Bharat Digital Mission) for demo/pilot. Not production ABDM.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/abdm/status/` | Service status |
| POST | `/api/abdm/abha/create/` | Create ABHA address |
| POST | `/api/abdm/abha/link/` | Link ABHA to patient |
| GET | `/api/abdm/abha/verify/{abha_number}/` | Verify ABHA |
| GET | `/api/abdm/abha/list/` | List ABHA accounts |
| POST | `/api/abdm/consent/create/` | Issue consent request |
| GET | `/api/abdm/consent/list/` | List consents |
| GET | `/api/abdm/consent/{consent_id}/` | Consent detail |
| POST | `/api/abdm/consent/{consent_id}/action/` | Grant / deny consent |
| POST | `/api/abdm/hiu/fetch/` | HIU data-fetch simulation |
| GET | `/api/abdm/audit/` | ABDM audit log |

---

## Dashboards & Reports

| Method | Path | Description | Allowed Roles |
|--------|------|-------------|---------------|
| GET | `/api/dashboard/admin/` | Hospital admin metrics | `super_admin`, `hospital_admin` |
| GET | `/api/dashboard/doctor/` | Doctor metrics | `doctor` |
| GET | `/api/dashboard/patient/` | Patient overview | `patient` |
| GET | `/api/reports/` | Aggregated reports | `super_admin`, `hospital_admin` |
| GET / PATCH | `/api/hospital/settings/` | Hospital settings page | `hospital_admin`, `super_admin` |

---

## Contact (`/api/contact/`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/contact/enquiry/` | Submit public enquiry |
| GET | `/api/contact/enquiries/` | List enquiries (admin) |

---

## NFC Bridge Service (FastAPI, port 8010)

Standalone service in `medha-backend/nfc_service/`. Bridges the ACR122U USB reader to the desktop app.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/token` | Form login (`username=nfc`, `password=nfc123`) → JWT |
| GET | `/scan/latest` | Latest NFC scan + resolved patient (Bearer required) |
| GET | `/patient/{patient_id}` | Fetch patient via Django backend |
| GET | `/health` | Liveness probe |

The reader process writes scans to `latest_scan.json`; FastAPI hands them to the frontend on poll.

---

## Role-Based Access Summary

| Role | Scope | Examples |
|------|-------|----------|
| `super_admin` | Global | All hospitals, all data, hospital CRUD |
| `hospital_admin` | One hospital | Manages doctors, appointments, billing, settings |
| `doctor` | One hospital | Patients seen at that hospital, prescriptions |
| `patient` | Self | Own profile, records, appointments, uploads |

The middleware auto-filters list endpoints by `request.user.hospital`. Object-level checks use `BelongsToHospital` and `IsOwnerOrStaff` (see `accounts/permissions.py`).

---

## Standard Error Responses

```json
{ "error": "Authentication required" }                      // 401
{ "error": "Insufficient permissions. Required roles: ..." } // 403
{ "error": "Hospital assignment required" }                  // 403
{ "detail": "Not found." }                                   // 404
{ "field_name": ["This field is required."] }                // 400
```

---

## Test Credentials (after `python manage.py seed_data`)

### Django users

| Username | Password | Role |
|----------|----------|------|
| `superadmin` | `superadmin123` | Super Admin |
| `admin_a` | `admin_a123` | Hospital Admin (City General) |
| `admin_b` | `admin_b123` | Hospital Admin (Metro Specialty) |
| `doctor_a_1` | `doctor_a_1` | Hospital A Doctor |
| `doctor_b_1` | `doctor_b_1` | Hospital B Doctor |

### Patients

| Patient ID | Name | Email |
|------------|------|-------|
| PAT-4504 | Vikram Singh | vikram@example.com |
| PAT-4503 | Sneha Reddy | sneha@example.com |
| PAT-4502 | Amit Kumar | amit@example.com |
| PAT-4501 | Priya Patel | priya@example.com |
| PAT-4500 | Rahul Sharma | rahul@example.com |

---

## Supabase Setup (Mobile App Only)

The Flutter mobile app authenticates patients via Supabase. Steps:

1. Enable **Email** provider in Authentication → Providers (disable confirm-email for dev).
2. Create users with metadata:

   ```json
   { "role": "patient", "patient_id": "PAT-4504" }
   ```
3. Copy keys from **Project Settings → API**:
   - Project URL (e.g. `https://<project>.supabase.co`)
   - `anon` key → mobile + frontend env
   - `service_role` key → backend (`supabase-mcp/.env`)
4. Run `supabase-mcp/schema.sql` once via the Supabase SQL editor.

---

## Architecture (one-liner)

```
React + Electron desktop ─┐
Flutter mobile ──────────►│ Django REST API (port 8000) ── SQLite / Postgres
NFC reader (USB) ─► FastAPI bridge (port 8010) ─►│
                                                  └─ Supabase (mobile auth + audit log)
```

See `ARCHITECTURE.md` for the full diagram and data-isolation rules.
