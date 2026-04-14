/**
 * Medha Health — Local SQLite Database
 *
 * Offline-first storage for patients, appointments, records, prescriptions.
 * Uses better-sqlite3 (already rebuilt for Electron).
 */
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db = null;

export function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'medha_local.db');
  console.log('[DB] Opening:', dbPath);
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      patient_id TEXT,
      full_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      age INTEGER,
      gender TEXT,
      date_of_birth TEXT,
      blood_group TEXT,
      abha_id TEXT,
      allergies TEXT,
      status TEXT DEFAULT 'active',
      emergency_contact TEXT,
      assigned_doctor_name TEXT,
      reason_for_visit TEXT,
      extra TEXT,
      cached_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      doctor_id TEXT,
      full_name TEXT NOT NULL,
      department TEXT,
      specialisation TEXT,
      status TEXT,
      phone TEXT,
      email TEXT,
      experience_years INTEGER,
      active_patient_count INTEGER DEFAULT 0,
      extra TEXT,
      cached_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      doctor TEXT,
      patient TEXT,
      doctor_name TEXT,
      patient_name TEXT,
      patient_id_code TEXT,
      date TEXT,
      time TEXT,
      appointment_type TEXT,
      complaint TEXT,
      status TEXT,
      notes TEXT,
      extra TEXT,
      cached_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      patient TEXT NOT NULL,
      doctor TEXT,
      doctor_name TEXT,
      patient_name TEXT,
      date TEXT,
      diagnosis TEXT,
      record_type TEXT,
      notes TEXT,
      ai_summary TEXT,
      extra TEXT,
      cached_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      patient TEXT NOT NULL,
      doctor TEXT,
      doctor_name TEXT,
      patient_name TEXT,
      medicine TEXT,
      dosage TEXT,
      duration TEXT,
      date TEXT,
      status TEXT DEFAULT 'active',
      notes TEXT,
      extra TEXT,
      cached_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      receipt_number TEXT,
      patient TEXT,
      patient_name TEXT,
      doctor_name TEXT,
      total_amount REAL,
      payment_mode TEXT,
      status TEXT,
      date TEXT,
      extra TEXT,
      cached_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cache_store (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      cached_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      retries INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS nfc_uid_map (
      nfc_uid TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      card_number TEXT,
      patient_name TEXT,
      cached_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_patients_pid ON patients(patient_id);
    CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(full_name);
    CREATE INDEX IF NOT EXISTS idx_nfc_uid_patient ON nfc_uid_map(patient_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
    CREATE INDEX IF NOT EXISTS idx_records_patient ON records(patient);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient);
    CREATE INDEX IF NOT EXISTS idx_sync_status ON sync_queue(status);
  `);

  console.log('[DB] Ready');
  return db;
}

export function closeDatabase() {
  if (db) { db.close(); db = null; }
}

// ── Helpers ──
const now = () => new Date().toISOString();
function jp(v) { try { return JSON.parse(v); } catch { return null; } }

// ══════════════════════════════════════
//  PATIENTS
// ══════════════════════════════════════

export function upsertPatient(p) {
  db.prepare(`
    INSERT OR REPLACE INTO patients (id, patient_id, full_name, phone, email, age, gender,
      date_of_birth, blood_group, abha_id, allergies, status, emergency_contact,
      assigned_doctor_name, reason_for_visit, extra, cached_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    String(p.id || p.patient_id), p.patient_id||null, p.full_name||'', p.phone||null,
    p.email||null, p.age||null, p.gender||null, p.date_of_birth||null,
    p.blood_group||null, p.abha_id||null, p.allergies||null, p.status||'active',
    p.emergency_contact||null, p.assigned_doctor_name||null,
    p.reason_for_visit||null, JSON.stringify(p), now()
  );
}

export function upsertPatients(list) {
  const tx = db.transaction((items) => { for (const p of items) upsertPatient(p); });
  tx(list);
}

export function getAllPatients() {
  return db.prepare('SELECT * FROM patients ORDER BY full_name').all().map(r => ({
    ...jp(r.extra), ...r, _offline: true
  }));
}

export function getPatient(id) {
  const r = db.prepare('SELECT * FROM patients WHERE id=? OR patient_id=?').get(id, id);
  return r ? { ...jp(r.extra), ...r, _offline: true } : null;
}

export function searchPatients(q) {
  const like = `%${q}%`;
  return db.prepare(
    'SELECT * FROM patients WHERE full_name LIKE ? OR patient_id LIKE ? OR phone LIKE ? OR abha_id LIKE ? ORDER BY full_name'
  ).all(like, like, like, like).map(r => ({ ...jp(r.extra), ...r, _offline: true }));
}

// ══════════════════════════════════════
//  DOCTORS
// ══════════════════════════════════════

export function upsertDoctor(d) {
  db.prepare(`
    INSERT OR REPLACE INTO doctors (id, doctor_id, full_name, department, specialisation,
      status, phone, email, experience_years, active_patient_count, extra, cached_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    String(d.id), d.doctor_id||null, d.full_name||'', d.department||null,
    d.specialisation||null, d.status||null, d.phone||null, d.email||null,
    d.experience_years||null, d.active_patient_count||0, JSON.stringify(d), now()
  );
}

export function upsertDoctors(list) {
  const tx = db.transaction((items) => { for (const d of items) upsertDoctor(d); });
  tx(list);
}

export function getAllDoctors() {
  return db.prepare('SELECT * FROM doctors ORDER BY full_name').all().map(r => ({
    ...jp(r.extra), ...r, _offline: true
  }));
}

// ══════════════════════════════════════
//  APPOINTMENTS
// ══════════════════════════════════════

export function upsertAppointment(a) {
  db.prepare(`
    INSERT OR REPLACE INTO appointments (id, doctor, patient, doctor_name, patient_name,
      patient_id_code, date, time, appointment_type, complaint, status, notes, extra, cached_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    String(a.id), a.doctor||null, a.patient||null, a.doctor_name||null,
    a.patient_name||null, a.patient_id_code||null, a.date||null, a.time||null,
    a.appointment_type||null, a.complaint||null, a.status||null, a.notes||null,
    JSON.stringify(a), now()
  );
}

export function upsertAppointments(list) {
  const tx = db.transaction((items) => { for (const a of items) upsertAppointment(a); });
  tx(list);
}

export function getAllAppointments() {
  return db.prepare('SELECT * FROM appointments ORDER BY date DESC, time DESC').all()
    .map(r => ({ ...jp(r.extra), ...r, _offline: true }));
}

export function getTodayAppointments() {
  const today = new Date().toISOString().split('T')[0];
  return db.prepare('SELECT * FROM appointments WHERE date=? ORDER BY time').all(today)
    .map(r => ({ ...jp(r.extra), ...r, _offline: true }));
}

// ══════════════════════════════════════
//  RECORDS
// ══════════════════════════════════════

export function upsertRecord(r) {
  db.prepare(`
    INSERT OR REPLACE INTO records (id, patient, doctor, doctor_name, patient_name,
      date, diagnosis, record_type, notes, ai_summary, extra, cached_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    String(r.id), r.patient||null, r.doctor||null, r.doctor_name||null,
    r.patient_name||null, r.date||null, r.diagnosis||null, r.record_type||null,
    r.notes||null, r.ai_summary||null, JSON.stringify(r), now()
  );
}

export function upsertRecords(list) {
  const tx = db.transaction((items) => { for (const r of items) upsertRecord(r); });
  tx(list);
}

export function getRecordsByPatient(patientId) {
  return db.prepare('SELECT * FROM records WHERE patient=? ORDER BY date DESC').all(patientId)
    .map(r => ({ ...jp(r.extra), ...r, _offline: true }));
}

export function getAllRecords() {
  return db.prepare('SELECT * FROM records ORDER BY date DESC').all()
    .map(r => ({ ...jp(r.extra), ...r, _offline: true }));
}

// ══════════════════════════════════════
//  PRESCRIPTIONS
// ══════════════════════════════════════

export function upsertPrescription(rx) {
  db.prepare(`
    INSERT OR REPLACE INTO prescriptions (id, patient, doctor, doctor_name, patient_name,
      medicine, dosage, duration, date, status, notes, extra, cached_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    String(rx.id), rx.patient||null, rx.doctor||null, rx.doctor_name||null,
    rx.patient_name||null, rx.medicine||null, rx.dosage||null, rx.duration||null,
    rx.date||null, rx.status||'active', rx.notes||null, JSON.stringify(rx), now()
  );
}

export function upsertPrescriptions(list) {
  const tx = db.transaction((items) => { for (const rx of items) upsertPrescription(rx); });
  tx(list);
}

export function getPrescriptionsByPatient(patientId) {
  return db.prepare('SELECT * FROM prescriptions WHERE patient=? ORDER BY date DESC').all(patientId)
    .map(r => ({ ...jp(r.extra), ...r, _offline: true }));
}

export function getAllPrescriptions() {
  return db.prepare('SELECT * FROM prescriptions ORDER BY date DESC').all()
    .map(r => ({ ...jp(r.extra), ...r, _offline: true }));
}

// ══════════════════════════════════════
//  RECEIPTS
// ══════════════════════════════════════

export function upsertReceipt(r) {
  db.prepare(`
    INSERT OR REPLACE INTO receipts (id, receipt_number, patient, patient_name, doctor_name,
      total_amount, payment_mode, status, date, extra, cached_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    String(r.id), r.receipt_number||null, r.patient||null, r.patient_name||null,
    r.doctor_name||null, parseFloat(r.total_amount)||0, r.payment_mode||null,
    r.status||null, r.date||r.created_at||null, JSON.stringify(r), now()
  );
}

export function upsertReceipts(list) {
  const tx = db.transaction((items) => { for (const r of items) upsertReceipt(r); });
  tx(list);
}

export function getAllReceipts() {
  return db.prepare('SELECT * FROM receipts ORDER BY date DESC').all()
    .map(r => ({ ...jp(r.extra), ...r, _offline: true }));
}

// ══════════════════════════════════════
//  NFC UID MAP
// ══════════════════════════════════════

export function upsertNfcUid(nfcUid, patientId, cardNumber, patientName) {
  db.prepare(`
    INSERT OR REPLACE INTO nfc_uid_map (nfc_uid, patient_id, card_number, patient_name, cached_at)
    VALUES (?,?,?,?,?)
  `).run(nfcUid.toUpperCase(), patientId, cardNumber || null, patientName || null, now());
}

export function lookupByNfcUid(nfcUid) {
  return db.prepare('SELECT * FROM nfc_uid_map WHERE nfc_uid=?').get(nfcUid.toUpperCase()) || null;
}

export function getPatientByNfcUid(nfcUid) {
  const map = lookupByNfcUid(nfcUid);
  if (!map) return null;
  // Return the full patient record from the patients table
  const patient = getPatient(map.patient_id);
  return patient ? { ...patient, nfc_uid: nfcUid } : map;
}

export function getAllNfcMappings() {
  return db.prepare('SELECT * FROM nfc_uid_map ORDER BY cached_at DESC').all();
}

// ══════════════════════════════════════
//  CACHE STORE (dashboards, billing summary)
// ══════════════════════════════════════

export function setCache(key, data) {
  db.prepare('INSERT OR REPLACE INTO cache_store (key, data, cached_at) VALUES (?,?,?)')
    .run(key, JSON.stringify(data), now());
}

export function getCache(key) {
  const r = db.prepare('SELECT * FROM cache_store WHERE key=?').get(key);
  return r ? { data: jp(r.data), cached_at: r.cached_at } : null;
}

// ══════════════════════════════════════
//  SYNC QUEUE
// ══════════════════════════════════════

export function addToQueue(action, entity, entityId, payload) {
  db.prepare(
    "INSERT INTO sync_queue (action,entity,entity_id,payload,status,created_at) VALUES (?,?,?,?,'pending',?)"
  ).run(action, entity, entityId||null, JSON.stringify(payload), now());
}

export function getPendingQueue() {
  return db.prepare("SELECT * FROM sync_queue WHERE status IN ('pending','retry') ORDER BY created_at")
    .all().map(r => ({ ...r, payload: jp(r.payload) }));
}

export function markQueueItem(id, status, error) {
  db.prepare('UPDATE sync_queue SET status=?, retries=retries+1, error=? WHERE id=?')
    .run(status, error||null, id);
}

export function getQueueCount() {
  return db.prepare("SELECT COUNT(*) as c FROM sync_queue WHERE status IN ('pending','retry')").get().c;
}

export function clearCompleted() {
  db.prepare("DELETE FROM sync_queue WHERE status='completed'").run();
}

// ══════════════════════════════════════
//  STATS
// ══════════════════════════════════════

export function getStats() {
  return {
    patients: db.prepare('SELECT COUNT(*) as c FROM patients').get().c,
    doctors: db.prepare('SELECT COUNT(*) as c FROM doctors').get().c,
    appointments: db.prepare('SELECT COUNT(*) as c FROM appointments').get().c,
    records: db.prepare('SELECT COUNT(*) as c FROM records').get().c,
    prescriptions: db.prepare('SELECT COUNT(*) as c FROM prescriptions').get().c,
    pendingSync: getQueueCount(),
  };
}
