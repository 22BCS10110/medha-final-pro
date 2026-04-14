-- ═══════════════════════════════════════════════════════════════
-- Medha Health — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Patients table (mirror of Django patients for analytics/MCP access)
CREATE TABLE IF NOT EXISTS patients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      TEXT UNIQUE NOT NULL,
  full_name       TEXT NOT NULL,
  email           TEXT UNIQUE,
  phone           TEXT DEFAULT '',
  date_of_birth   DATE,
  gender          TEXT DEFAULT 'M' CHECK (gender IN ('M', 'F', 'O')),
  blood_group     TEXT DEFAULT '',
  allergies       TEXT DEFAULT '',
  abha_id         TEXT DEFAULT '',
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'discharged', 'critical')),
  reason_for_visit TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id        TEXT NOT NULL,
  patient_id       TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  hospital_id      TEXT,
  date             DATE NOT NULL,
  time             TIME NOT NULL,
  appointment_type TEXT DEFAULT 'new' CHECK (appointment_type IN ('new', 'follow_up', 'emergency', 'routine', 'post_op')),
  complaint        TEXT DEFAULT '',
  status           TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled', 'critical')),
  notes            TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Chat rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id   TEXT NOT NULL,
  patient_id  TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  hospital_id TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (doctor_id, patient_id, hospital_id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('doctor', 'patient')),
  sender_id   TEXT,
  content     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Patient consents table (one-time consent, upsertable)
CREATE TABLE IF NOT EXISTS patient_consents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       TEXT UNIQUE NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'revoked')),
  consent_text     TEXT DEFAULT 'I consent to share my health records with authorized healthcare providers via the Medha Health platform.',
  granted_at       TIMESTAMPTZ,
  granted_via      TEXT DEFAULT '',
  granted_at_hospital TEXT,
  revoked_at       TIMESTAMPTZ,
  revoke_reason    TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table (append-only — no updates/deletes via RLS)
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action      TEXT NOT NULL,
  actor_id    TEXT,
  actor_role  TEXT,
  patient_id  TEXT,
  hospital_id TEXT,
  resource_type TEXT,
  resource_id   TEXT,
  ip_address  INET,
  details     JSONB DEFAULT '{}'
);

-- ── Indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patients_status      ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_patient_id  ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor  ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date    ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_chat_msgs_room       ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp      ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_patient        ON audit_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_action         ON audit_logs(action);

-- ── Row Level Security (RLS) ──────────────────────────────────────
-- Enable RLS on all tables (use service_role key to bypass from MCP server)
ALTER TABLE patients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms       ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS — MCP server uses service key
-- For anon key access, add policies as needed here
