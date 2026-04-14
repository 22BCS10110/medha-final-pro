# Medha Health System - API Documentation

## Base URL
```
http://127.0.0.1:8000/api
```

---

## 🔐 Authentication

### Supabase JWT Authentication
All protected endpoints require a valid Supabase JWT token in the Authorization header:
```
Authorization: Bearer <supabase_jwt_token>
```

### Token-Based Authentication (Legacy)
```
Authorization: Token <django_token>
```

---

## 🏥 Hospital Management

### List Hospitals
```
GET /hospitals/
```

### Get Hospital Details
```
GET /hospitals/<hospital_id>/
```

---

## 👤 Patient Management

### NFC Scan (No Auth Required)
```
GET /patients/nfc-scan/?id=MHD-4504
```
**Response:**
```json
{
  "id": "uuid",
  "patient_id": "MHD-4504",
  "full_name": "Vikram Singh",
  "email": "vikram@example.com",
  "phone": "+91 9876543214",
  "gender": "M",
  "blood_group": "O-",
  "status": "active",
  "hospital_visits": [],
  "cards": []
}
```

### List Patients
```
GET /patients/patients/
```

### Search Patients
```
GET /patients/patients/search/?q=vikram
```

### Get Patient Global Access
```
GET /patients/patients/<id>/global-access/
```

---

## 💳 NFC Card Management

### Write NFC Card
```
POST /patients/nfc/write/<patient_id>/
Content-Type: application/json
Authorization: Bearer <token>

{
  "card_type": "nfc"  // or "qr"
}
```

### Read NFC Card
```
GET /patients/nfc/read/<card_number>/
Authorization: Bearer <token>
```

### List Patient Cards
```
GET /patients/nfc/cards/<patient_id>/
Authorization: Bearer <token>
```

---

## 📅 Appointment Management

### Book Appointment
```
POST /appointments/book/
Content-Type: application/json
Authorization: Bearer <token>

{
  "doctor_id": "DOC-A-1001",
  "patient_id": "MHD-4504",
  "appointment_date": "2026-04-10",
  "appointment_time": "10:00",
  "reason": "General checkup"
}
```

### List Appointments
```
GET /appointments/list/?role=doctor&date=2026-04-10&status=scheduled
Authorization: Bearer <token>
```

### Update Appointment Status
```
PATCH /appointments/<appointment_id>/status/
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "confirmed"  // scheduled, confirmed, completed, cancelled, no_show
}
```

### Get Available Slots
```
GET /appointments/slots/<doctor_id>/?date=2026-04-10
Authorization: Bearer <token>
```

---

## 👨‍️ Doctor Management

### List Doctors
```
GET /doctors/doctors/
```

### Get Doctor Details
```
GET /doctors/doctors/<doctor_id>/
```

---

## 📋 Health Records

### List Records
```
GET /records/health-records/
```

### Create Record
```
POST /records/health-records/
Content-Type: application/json
Authorization: Bearer <token>

{
  "patient_id": "MHD-4504",
  "diagnosis": "Mild fever",
  "record_type": "routine",
  "notes": "Patient advised rest"
}
```

---

## 💰 Billing

### Create Receipt
```
POST /billing/receipts/
Content-Type: application/json
Authorization: Bearer <token>

{
  "patient_id": "MHD-4504",
  "amount": 500.00,
  "description": "Consultation fee"
}
```

### List Receipts
```
GET /billing/receipts/
```

---

## 📊 Dashboard

### Admin Dashboard
```
GET /dashboard/admin/
Authorization: Bearer <token>
```

### Doctor Dashboard
```
GET /dashboard/doctor/
Authorization: Bearer <token>
```

### Patient Dashboard
```
GET /dashboard/patient/
Authorization: Bearer <token>
```

---

## 🔑 Login Credentials

### Django Admin
| Username | Password | Role |
|----------|----------|------|
| devadmin | devadmin123 | Super Admin |
| superadmin | superadmin123 | Super Admin |
| admin_a | admin_a123 | Hospital Admin (City General) |
| admin_b | admin_b123 | Hospital Admin (Metro Specialty) |

### Test Patients
| Patient ID | Name | Email |
|------------|------|-------|
| MHD-4504 | Vikram Singh | vikram@example.com |
| MHD-4503 | Sneha Reddy | sneha@example.com |
| MHD-4502 | Amit Kumar | amit@example.com |
| MHD-4501 | Priya Patel | priya@example.com |
| MHD-4500 | Rahul Sharma | rahul@example.com |

---

## 📱 Supabase Setup (Manual)

### 1. Enable Email Authentication
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **Providers**
4. Enable **Email** provider
5. Disable "Confirm email" for development

### 2. Create Test Users
Go to **Authentication** → **Users** → **Add User**

| Email | Password | Role (metadata) |
|-------|----------|-----------------|
| vikram@example.com | MedhaHealth123! | patient |
| sneha@example.com | MedhaHealth123! | patient |
| amit@example.com | MedhaHealth123! | patient |

### 3. Add User Metadata
When creating users, add custom metadata:
```json
{
  "role": "patient",
  "patient_id": "MHD-4504"
}
```

For doctors/admins:
```json
{
  "role": "doctor",
  "hospital_id": "<hospital-uuid>"
}
```

### 4. Get Your Keys
Go to **Project Settings** → **API**:
- **Project URL**: `https://mnwhjlgjncmdcjewktuo.supabase.co`
- **anon/public key**: Use in frontend/mobile app
- **service_role key**: Keep secret, use in backend

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Patient App    │     │  Doctor Dashboard│     │  Admin Panel    │
│  (Flutter)      │     │  (React)         │     │  (React)        │
└────────┬────────     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
         └───────────────────────┼────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    Supabase Auth        │
                    │    (JWT Tokens)         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    Django Backend       │
                    │    (REST APIs)          │
                    │    - RBAC               │
                    │    - Hospital Isolation │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    SQLite Database      │
                    │    - patients           │
                    │    - doctors            │
                    │    - appointments       │
                    │    - health_records     │
                    │    - billing            │
                    └─────────────────────────┘