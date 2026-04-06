# Supabase Auth + SQLite Backend Integration

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PATIENT MOBILE APP                        │
│                   (Flutter + Supabase Client)                     │
│                                                                  │
│  1. Auth with Supabase (email/OTP/password)                     │
│  2. Receives JWT with role + hospital_id claims                 │
│  3. Sends JWT with every API request                            │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS
                              │ Authorization: Bearer <JWT>
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       DJANGO BACKEND LAYER                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  1. SupabaseJWTAuthentication (DRF Auth Class)             │  │
│  │     • Verifies JWT signature using Supabase JWKS           │  │
│  │     • Extracts: sub (user_id), role, hospital_id           │  │
│  │     • Gets/creates Django User from JWT claims             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  2. RBAC Permissions (accounts/permissions.py)             │  │
│  │     • IsSuperAdmin, IsHospitalAdmin, IsDoctor, IsPatient   │  │
│  │     • Checks request.user.role                             │  │
│  │     • Returns 403 Forbidden for unauthorized access        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  3. API Views (api/v2/views.py)                            │  │
│  │     • Apply hospital_id filtering to ALL queries           │  │
│  │     • Query SQLite database securely                       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  4. SQLite Database (db.sqlite3)                           │  │
│  │     • Source of truth for all business data                │  │
│  │     • hospital_id in all tables for isolation              │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Setup Instructions

### 1. Install Required Packages

```bash
cd "medha project/medha-backend"
pip install PyJWT requests cryptography
```

### 2. Configure Supabase

Set environment variables:

```bash
# Linux/Mac
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_KEY="your-service-key"

# Windows (PowerShell)
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_ANON_KEY="your-anon-key"
$env:SUPABASE_SERVICE_KEY="your-service-key"
```

Or add to `.env` file and use `python-dotenv`.

### 3. Configure Supabase JWT Claims

In Supabase Dashboard → Authentication → Custom Claims, ensure JWT tokens include:

```json
{
  "sub": "user-uuid-from-supabase",
  "app_metadata": {
    "role": "patient",
    "hospital_id": 1
  },
  "user_metadata": {
    "email": "patient@example.com"
  }
}
```

**Supported roles:** `patient`, `doctor`, `hospital_admin`, `super_admin`

---

## API v2 Endpoints

All endpoints require `Authorization: Bearer <supabase-jwt>` header.

### Patient Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/v2/patient/profile/` | patient | Get logged-in patient's profile |
| GET | `/api/v2/patient/appointments/` | patient | Get patient's appointments |
| POST | `/api/v2/patient/book-appointment/` | patient | Book a new appointment |

**Book Appointment Request:**
```json
{
  "doctor_id": 1,
  "date": "2026-04-05",
  "time": "10:00"
}
```

### Doctor Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/v2/doctor/patients/` | doctor | Get patients in doctor's hospital |
| GET | `/api/v2/doctor/appointments/` | doctor | Get doctor's appointments |

### Hospital Admin Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/v2/admin/hospital/` | hospital_admin | Get hospital data |
| GET | `/api/v2/admin/staff/` | hospital_admin | Get hospital staff |
| POST | `/api/v2/admin/patient-lookup/` | hospital_admin | Look up patient by ID (global) |

**Patient Lookup Request:**
```json
{
  "patient_id": 1
}
```

### Super Admin Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/v2/super-admin/hospitals/` | super_admin | Get all hospitals |

---

## RBAC Rules

| Role | Can Access | Hospital Isolation |
|------|------------|-------------------|
| **Patient** | Own profile, own appointments | N/A (own data only) |
| **Doctor** | Patients in their hospital, own appointments | ✅ Only their hospital |
| **Hospital Admin** | Hospital data, staff, patient lookup | ✅ Only their hospital |
| **Super Admin** | All hospitals | ❌ No isolation (full access) |

---

## Security

1. **JWT Verification**: All tokens verified server-side using Supabase JWKS
2. **RBAC Enforcement**: Role checks on every endpoint
3. **Hospital Isolation**: `hospital_id` in WHERE clause for all queries
4. **No Direct SQLite Access**: All queries go through Django ORM
5. **HTTPS Required**: In production, enforce HTTPS

---

## File Structure

```
medha-backend/
├── accounts/
│   ├── supabase_auth.py          # JWT verification + user creation
│   ├── supabase_backend.py       # DRF authentication class
│   └── permissions.py            # RBAC permission classes
├── api/
│   ├── __init__.py
│   └── v2/
│       ├── __init__.py
│       ├── views.py              # API v2 endpoints
│       └── urls.py               # URL routing
├── medha_backend/
│   ├── settings.py               # SUPABASE_* config
│   └── urls.py                   # Includes api/v2/
└── db.sqlite3                    # SQLite database (source of truth)
```

---

## Testing

### Test with curl

```bash
# Get JWT from Supabase client (Flutter/mobile app)
JWT="your-supabase-jwt-token"

# Test patient profile
curl -H "Authorization: Bearer $JWT" \
     http://localhost:8000/api/v2/patient/profile/

# Test doctor patients
curl -H "Authorization: Bearer $JWT" \
     http://localhost:8000/api/v2/doctor/patients/

# Test admin hospital data
curl -H "Authorization: Bearer $JWT" \
     http://localhost:8000/api/v2/admin/hospital/
```

### Expected Responses

**Success (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 9876543210"
}
```

**Unauthorized (401):**
```json
{
  "detail": "Invalid token: Token is expired"
}
```

**Forbidden (403):**
```json
{
  "detail": "Only patients can access this resource."
}
```

---

## Migration from Firebase

Firebase has been completely removed. The following files were deleted:
- `firebase-service-account.json`
- `patients/firebase_service.py`
- `patients/auth_views.py`
- `patients/management/commands/seed_patients.py`
- `patients/management/commands/link_firebase.py`

All patient authentication now goes through Supabase.