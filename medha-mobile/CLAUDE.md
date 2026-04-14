# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Medha Health is a multi-hospital, multi-tenant healthcare system with three clients: a Django backend, a React+Electron desktop app (for doctors/admins), and a Flutter mobile app (for patients). The system uses NFC-based patient identification, role-based access control, and is designed for future ABDM (Ayushman Bharat Digital Mission) integration.

## Architecture

**Multi-tenant model:** Hospitals are isolated tenants. Doctors, appointments, records, prescriptions, vitals, and billing are scoped to a hospital via FK. Patients are global — they can visit any hospital with the same `patient_id` and patient card.

**Roles:** `super_admin` (all hospitals), `hospital_admin` (one hospital), `doctor` (one hospital), `patient` (global, own data only). Custom user model at `accounts.User` with `AUTH_USER_MODEL = 'accounts.User'`.

**API versioning:** v1 routes are at `/api/...`, v2 (Supabase auth + RBAC + hospital isolation) at `/api/v2/...`.

**NFC flow:** A separate FastAPI service (`medha-backend/nfc_service/`) bridges USB NFC reader (ACR122U) to the web app. Reader writes to `latest_scan.json`, FastAPI serves it at port 8010. Frontend polls `/scan/latest`.

## Common Commands

### Backend (Django)
```bash
cd medha-backend
python manage.py runserver              # Start dev server (port 8000)
python manage.py migrate                # Apply migrations
python manage.py makemigrations         # Generate migrations
python manage.py seed_data              # Seed test data (hospitals, users, patients)
python manage.py test                   # Run all tests
python manage.py test accounts          # Run tests for one app
```

### Frontend (React + Vite + Electron)
```bash
cd medha-frontend
npm run dev                             # Vite dev server (port 5173/5174)
npm run build                           # Production build
npm run lint                            # ESLint
npm run electron:dev                    # Run as Electron desktop app
npm run electron:build                  # Package Electron app
```

### NFC Service (FastAPI)
```bash
cd medha-backend/nfc_service
.venv/Scripts/uvicorn app:app --host 0.0.0.0 --port 8010 --reload
```

### Mobile (Flutter)
```bash
cd medha-mobile
flutter run
```

## Backend Django Apps

| App | Purpose |
|-----|---------|
| `hospitals` | Hospital model, multi-tenant core |
| `accounts` | Custom User model, auth, roles |
| `patients` | Patient, PatientCard, PatientHospitalVisit (global) |
| `doctors` | Doctor profiles (hospital-scoped) |
| `records` | Health records, prescriptions, vitals (hospital-scoped) |
| `billing` | Receipts (hospital-scoped) |
| `contact` | Contact form |
| `abdm_simulator` | ABDM simulation for demo/pilot — not production ABDM |
| `api/v2` | Supabase-authenticated endpoints with hospital isolation |

## Frontend Structure

- `src/auth/` — AuthContext, ProtectedRoute, login modals, portal pages
- `src/features/admin/` — AdminDashboard, AdminLayout, Sidebar, patient/doctor/billing management
- `src/features/doctor/` — Doctor dashboard
- `src/features/patient/` — Patient dashboard
- `src/features/nfc/` — NFC scan page, desktop NFC panel
- `src/features/consent/` — ABDM consent dashboard
- `src/features/marketing/` — Public pages (Home, About, Pricing, Contact)
- `src/components/ui/` — Reusable UI components (Hero, Features, Button, etc.)
- `src/components/layout/` — Navbar, Footer, Layout wrapper
- `src/services/abdmService.js` — ABDM API client
- `electron/` — Electron main process (`main.js`, `preload.js`)

## Key Technical Details

- **Database:** SQLite in dev (`db.sqlite3`), designed for PostgreSQL in production
- **Auth:** Token auth (DRF) for desktop app; Supabase JWT for patient mobile app
- **Frontend styling:** Tailwind CSS
- **Frontend state:** React Context (`AuthContext`)
- **Routing:** react-router-dom with role-based `ProtectedRoute` wrapper
- **CORS:** Open in dev (`CORS_ALLOW_ALL_ORIGINS = True`)
- **Timezone:** `Asia/Kolkata`
- **UUIDs:** All hospital/patient IDs use UUIDs for distributed readiness

## Important Constraints

- ABDM integration is **architecture-ready only** — do not fully implement ABDM APIs
- Patients are global entities (no hospital FK); all other clinical data is hospital-scoped
- NFC service is a separate process — not part of Django
- The mobile app (Flutter) uses Supabase auth, not Django token auth
- Always modify existing files rather than creating duplicates
- Keep changes incremental to avoid breaking the running system

## Supabase MCP Server

The `supabase-mcp/` directory contains an MCP server that exposes Supabase as tools for Claude Code.

**Setup:**
```bash
cd supabase-mcp
cp .env.example .env       # Fill in SUPABASE_URL + SUPABASE_SERVICE_KEY
npm install
node test.js               # Verify connection
```

**Run schema migrations** — paste `supabase-mcp/schema.sql` into Supabase Dashboard → SQL Editor.

**Tools available:** `testConnection`, `getPatients`, `getPatient`, `createPatient`, `updatePatient`, `getAppointments`, `createAppointment`, `getChatMessages`, `storeChatMessage`, `getConsentStatus`, `setConsentStatus`, `storeAuditLog`, `getAuditLogs`, `runQuery`

The MCP server is registered in `~/.claude.json` as `medha-supabase`. Add your real Supabase keys to the `env` section there or to `supabase-mcp/.env`.

## Test Credentials (after seed_data)

| Role | Username | Password |
|------|----------|----------|
| Super Admin | superadmin | superadmin123 |
| Hospital A Admin | admin_a | admin_a123 |
| Hospital B Admin | admin_b | admin_b123 |
| Hospital A Doctor | doctor_a_1 | doctor_a_1 |
| Hospital B Doctor | doctor_b_1 | doctor_b_1 |
