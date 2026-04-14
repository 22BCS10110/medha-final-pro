/**
 * Medha Health — Offline-First Data Service
 *
 * Smart data layer that:
 *  - Online: Fetches from backend API, caches result in local DB
 *  - Offline: Reads from local SQLite database via Electron IPC
 *  - Queues write operations for background sync when offline
 *
 * All methods return { data, source } where source is 'api' | 'cache' | 'nfc_only'
 */
import {
  patientsAPI, doctorsAPI, appointmentsAPI, prescriptionsAPI,
  recordsAPI, billingAPI, dashboardAPI
} from './api';

const isElectron = !!window.electronAPI?.isElectron;
const db = window.electronAPI?.db;
const sync = window.electronAPI?.sync;

// ═══════════════════════════════════════════════════════════
//  CONNECTIVITY
// ═══════════════════════════════════════════════════════════

let _isOnline = navigator.onLine;
let _statusListeners = [];

// Listen to browser online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { _isOnline = true; _notifyListeners(); });
  window.addEventListener('offline', () => { _isOnline = false; _notifyListeners(); });
}

function _notifyListeners() {
  _statusListeners.forEach(fn => fn(_isOnline));
}

export function onOnlineStatusChange(fn) {
  _statusListeners.push(fn);
  return () => { _statusListeners = _statusListeners.filter(f => f !== fn); };
}

export async function checkOnline() {
  if (isElectron && sync) {
    try {
      _isOnline = await sync.isOnline();
    } catch {
      _isOnline = navigator.onLine;
    }
  }
  return _isOnline;
}

export function isOnline() {
  return _isOnline;
}

// ═══════════════════════════════════════════════════════════
//  SYNC ENGINE START / STOP
// ═══════════════════════════════════════════════════════════

export async function startSyncEngine() {
  if (!isElectron || !sync) return;
  const token = localStorage.getItem('medha_token');
  if (token) {
    await sync.start(token);
  }
}

export async function stopSyncEngine() {
  if (!isElectron || !sync) return;
  await sync.stop();
}

export async function updateSyncToken() {
  if (!isElectron || !sync) return;
  const token = localStorage.getItem('medha_token');
  if (token) await sync.updateToken(token);
}

export function onSyncStatusUpdate(callback) {
  if (!isElectron || !sync) return () => {};
  return sync.onStatusUpdate(callback);
}

export async function getSyncQueueCount() {
  if (!isElectron || !sync) return 0;
  return sync.getQueueCount();
}

export async function forcePull() {
  if (!isElectron || !sync) return;
  return sync.forcePull();
}

export async function forcePush() {
  if (!isElectron || !sync) return;
  return sync.forcePush();
}

// ═══════════════════════════════════════════════════════════
//  SMART FETCHERS — Try API first, fall back to local DB
// ═══════════════════════════════════════════════════════════

/**
 * Generic fetch-with-cache wrapper.
 * @param {Function} apiFn - The API call returning { data }
 * @param {Function} cacheFn - The local DB read function
 * @param {Function} storeFn - The local DB write function (receives API data)
 */
async function fetchWithCache(apiFn, cacheFn, storeFn) {
  // Try the API first
  try {
    const res = await apiFn();
    const data = res.data;
    // Cache the result in background
    if (isElectron && storeFn) {
      try { await storeFn(data); } catch (e) { console.warn('[Offline] Cache write failed:', e); }
    }
    return { data, source: 'api' };
  } catch (err) {
    // API failed — try local cache
    if (isElectron && cacheFn) {
      try {
        const cached = await cacheFn();
        if (cached && (Array.isArray(cached) ? cached.length > 0 : cached)) {
          return { data: cached, source: 'cache' };
        }
      } catch (e) {
        console.warn('[Offline] Cache read failed:', e);
      }
    }
    // Neither worked — throw original error
    throw err;
  }
}

// ── Patients ──

export async function getPatients(params) {
  return fetchWithCache(
    () => patientsAPI.list(params),
    () => db?.getAllPatients(),
    (data) => db?.upsertPatients(Array.isArray(data) ? data : [])
  );
}

export async function getPatient(id) {
  return fetchWithCache(
    () => patientsAPI.get(id),
    () => db?.getPatient(id),
    (data) => db?.upsertPatient(data)
  );
}

export async function searchPatients(query) {
  return fetchWithCache(
    () => patientsAPI.search(query),
    () => db?.searchPatients(query),
    (data) => db?.upsertPatients(Array.isArray(data) ? data : [])
  );
}

export async function createPatient(data) {
  try {
    const res = await patientsAPI.create(data);
    if (isElectron && db) db.upsertPatient(res.data);
    return { data: res.data, source: 'api' };
  } catch (err) {
    if (isElectron && sync) {
      await sync.addToQueue('create', 'patients', null, data);
      return { data: { ...data, _queued: true }, source: 'queued' };
    }
    throw err;
  }
}

// ── Doctors ──

export async function getDoctors(params) {
  return fetchWithCache(
    () => doctorsAPI.list(params),
    () => db?.getAllDoctors(),
    (data) => db?.upsertDoctors(Array.isArray(data) ? data : [])
  );
}

// ── Appointments ──

export async function getAppointments(params) {
  return fetchWithCache(
    () => appointmentsAPI.list(params),
    () => db?.getAllAppointments(),
    (data) => db?.upsertAppointments(Array.isArray(data) ? data : [])
  );
}

export async function createAppointment(data) {
  try {
    const res = await appointmentsAPI.create(data);
    return { data: res.data, source: 'api' };
  } catch (err) {
    if (isElectron && sync) {
      await sync.addToQueue('create', 'appointments', null, data);
      return { data: { ...data, _queued: true }, source: 'queued' };
    }
    throw err;
  }
}

// ── Prescriptions ──

export async function getPrescriptions(params) {
  return fetchWithCache(
    () => prescriptionsAPI.list(params),
    async () => {
      // Can't get all prescriptions easily from cache without patient_id
      return [];
    },
    null
  );
}

export async function createPrescription(data) {
  try {
    const res = await prescriptionsAPI.create(data);
    return { data: res.data, source: 'api' };
  } catch (err) {
    if (isElectron && sync) {
      await sync.addToQueue('create', 'prescriptions', null, data);
      return { data: { ...data, _queued: true }, source: 'queued' };
    }
    throw err;
  }
}

// ── Records ──

export async function getRecords(params) {
  return fetchWithCache(
    () => recordsAPI.list(params),
    async () => [],
    null
  );
}

export async function createRecord(data) {
  try {
    const res = await recordsAPI.create(data);
    return { data: res.data, source: 'api' };
  } catch (err) {
    if (isElectron && sync) {
      await sync.addToQueue('create', 'records', null, data);
      return { data: { ...data, _queued: true }, source: 'queued' };
    }
    throw err;
  }
}

// ── Billing ──

export async function getBillingReceipts(params) {
  return fetchWithCache(
    () => billingAPI.receipts(params),
    () => db?.getAllReceipts(),
    (data) => db?.upsertReceipts(Array.isArray(data) ? data : [])
  );
}

export async function getBillingSummary() {
  return fetchWithCache(
    () => billingAPI.summary(),
    async () => {
      const cached = await db?.getDashboard('billing_summary');
      return cached?.data || null;
    },
    (data) => db?.setDashboard('billing_summary', data)
  );
}

// ── Dashboard ──

export async function getAdminDashboard() {
  return fetchWithCache(
    () => dashboardAPI.admin(),
    async () => {
      const cached = await db?.getDashboard('admin');
      return cached?.data || null;
    },
    (data) => db?.setDashboard('admin', data)
  );
}

export async function getDoctorDashboard() {
  return fetchWithCache(
    () => dashboardAPI.doctor(),
    async () => {
      const cached = await db?.getDashboard('doctor');
      return cached?.data || null;
    },
    (data) => db?.setDashboard('doctor', data)
  );
}

// ═══════════════════════════════════════════════════════════
//  NFC — Offline-First Patient Lookup
// ═══════════════════════════════════════════════════════════

/**
 * Look up a patient by ID, trying local DB first for speed,
 * then backend. Returns data source flag.
 */
export async function lookupPatientOfflineFirst(patientId) {
  if (!patientId) return null;

  // 1. Try local DB first (instant, works offline)
  if (isElectron && db) {
    try {
      const local = await db.getPatient(patientId);
      if (local) {
        // If online, also fetch fresh data in background to update cache
        if (_isOnline) {
          refreshPatientInBackground(patientId);
        }
        return { data: local, source: 'cache' };
      }
    } catch (e) {
      console.warn('[Offline] Local lookup failed:', e);
    }
  }

  // 2. Try backend API
  try {
    const res = await patientsAPI.get(patientId);
    const patient = res.data;
    // Cache it locally
    if (isElectron && db) {
      try { await db.upsertPatient(patient); } catch {}
    }
    return { data: patient, source: 'api' };
  } catch {
    // 3. No data available
    return null;
  }
}

function refreshPatientInBackground(patientId) {
  patientsAPI.get(patientId)
    .then(res => {
      if (isElectron && db) db.upsertPatient(res.data);
    })
    .catch(() => {}); // Silently fail
}

// ═══════════════════════════════════════════════════════════
//  NFC UID — Hardware NFC card UID lookup (nfc-pcsc)
// ═══════════════════════════════════════════════════════════

const nfcHw = window.medhaAPI?.nfcHardware;

/**
 * Look up a patient by NFC hardware UID via Electron IPC.
 * The main process handles the offline-first logic:
 *   1. Local nfc_uid_map → patients table
 *   2. Backend API /api/patients/by-nfc/<uid>/
 *   3. Error if both fail
 */
export async function lookupPatientByNfcUid(uid) {
  if (!uid) return null;
  if (isElectron && nfcHw) {
    const result = await nfcHw.lookup(uid);
    if (result.success) {
      return { data: result.data, source: result.source };
    }
    return null;
  }
  // Fallback: try the API directly (web mode)
  try {
    const res = await patientsAPI.getByNfcUid(uid);
    return { data: res.data, source: 'api' };
  } catch {
    return null;
  }
}

/**
 * Get NFC hardware reader status.
 */
export async function getNfcReaderStatus() {
  if (isElectron && nfcHw) {
    return nfcHw.status();
  }
  return { available: false, readers: [], hasReader: false };
}

/**
 * Subscribe to real-time NFC card tap events (full event with patient lookup result).
 * Returns an unsubscribe function.
 */
export function onNfcCardTap(callback) {
  if (isElectron && nfcHw) {
    return nfcHw.onCardTap(callback);
  }
  return () => {};
}

/**
 * Subscribe to raw NFC card UID events.
 * Fires exactly ONCE per physical tap with just the UID string.
 * Use this in assign mode — it fires before any patient lookup.
 */
export function onNFCCard(callback) {
  if (isElectron && nfcHw) {
    return nfcHw.onNFCCard(callback);
  }
  return () => {};
}

/**
 * Subscribe to NFC reader connect/disconnect events.
 * Returns an unsubscribe function.
 */
export function onNfcReaderStatus(callback) {
  if (isElectron && nfcHw) {
    return nfcHw.onReaderStatus(callback);
  }
  return () => {};
}

// ═══════════════════════════════════════════════════════════
//  NFC CARD ASSIGNMENT
// ═══════════════════════════════════════════════════════════

/**
 * Assign a hardware NFC UID to a patient.
 * Uses Electron IPC (which handles offline queueing) or falls back to API.
 */
export async function assignNfcCard(patientId, nfcUid) {
  if (isElectron && nfcHw) {
    return nfcHw.assign(patientId, nfcUid);
  }
  // Web fallback
  try {
    const res = await patientsAPI.assignNfc(patientId, nfcUid);
    return { success: true, data: res.data };
  } catch (err) {
    const msg = err.response?.data?.error || err.message || 'Failed to assign NFC card';
    return { success: false, error: msg, assigned_to: err.response?.data?.assigned_to };
  }
}

/**
 * Get NFC assignment status for a patient.
 */
export async function getPatientNfcStatus(patientId) {
  if (isElectron && nfcHw) {
    return nfcHw.patientStatus(patientId);
  }
  // Web fallback
  try {
    const res = await patientsAPI.nfcStatus(patientId);
    return res.data;
  } catch {
    return { has_nfc: false, nfc_uid: null };
  }
}

// ═══════════════════════════════════════════════════════════
//  LOCAL STATS
// ═══════════════════════════════════════════════════════════

export async function getLocalStats() {
  if (!isElectron || !db) return null;
  return db.getStats();
}
