/**
 * Medha Health Intelligance Desktop Application — Main Process
 *
 * Handles: auth, API proxy, local database, sync engine, NFC bridge.
 * Login → role-based redirect to app.html
 */
import { app, BrowserWindow, ipcMain, net } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 MAIN FILE LOADED");

const API = 'http://127.0.0.1:8000/api';
const NFC_API = 'http://localhost:8010';

app.disableHardwareAcceleration();

let mainWindow;
let database = null;
let sync = null;
let authToken = null;
let nfcReader = null;

import { initDB } from './db.js';
import { startNFC } from './nfc.js';

let db;

// ══════════════════════════════════════
//  WINDOW
// ══════════════════════════════════════

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Medha Health Intelligance',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#f1f5f9',
    show: false,
    autoHideMenuBar: true,
  });

  mainWindow.loadFile(path.join(__dirname, 'login.html'));
  
  mainWindow.once('ready-to-show', () => { mainWindow.show(); mainWindow.focus(); });
  mainWindow.on('closed', () => { mainWindow = null; });
}

// ══════════════════════════════════════
//  OFFLINE SYSTEM
// ══════════════════════════════════════

async function initOffline() {
  try {
    database = await import('./database.js');
    database.initDatabase();
    sync = await import('./syncEngine.js');
    console.log('[Main] Offline system ready');
  } catch (e) {
    console.error('[Main] Offline init failed:', e.message);
  }
}

// ══════════════════════════════════════
//  NFC HARDWARE READER (nfc-pcsc)
// ══════════════════════════════════════

async function initNfc() {
  try {
    const { createNfcReader } = await import('./nfcReader.js');
    nfcReader = createNfcReader();

    nfcReader.on('reader:connect', (name) => {
      sendToRenderer('nfc:reader-status', { connected: true, readerName: name });
    });

    nfcReader.on('reader:disconnect', (name) => {
      sendToRenderer('nfc:reader-status', { connected: false, readerName: name });
    });

    // DESFire card read — fires before card:uid when DESFire data is present
    nfcReader.on('card:desfire', (data, uid, readerName) => {
      console.log(`[Main] DESFire data: ${data.id} | ${data.name} | ${data.blood}`);
      sendToRenderer('nfc:patient-basic', {
        uid,
        readerName,
        id: data.id,
        name: data.name,
        blood: data.blood,
        source: 'desfire',
      });
    });

    // DESFire write results
    nfcReader.on('card:write-success', (data, readerName) => {
      sendToRenderer('nfc:write-success', { ...data, readerName });
    });

    nfcReader.on('card:write-error', (error, readerName) => {
      sendToRenderer('nfc:write-error', { error, readerName });
    });

    nfcReader.on('card:uid', async (uid, readerName) => {
      // 1. Fire raw UID immediately — for assign mode and any listener that just needs the UID
      sendToRenderer('nfc:raw-uid', { uid, readerName });

      // 2. Fire scanning state on the card-tap channel for the scan panel
      sendToRenderer('nfc:card-tap', { uid, readerName, status: 'reading' });

      // 3. Offline-first patient lookup (for the scan panel only)
      try {
        const patient = await resolvePatientByNfcUid(uid);
        sendToRenderer('nfc:card-tap', {
          uid,
          readerName,
          status: 'success',
          patient: patient.data,
          source: patient.source,
        });
      } catch (err) {
        sendToRenderer('nfc:card-tap', {
          uid,
          readerName,
          status: 'not_found',
          error: err.message || 'Patient not found',
        });
      }
    });

    nfcReader.on('card:removed', (readerName) => {
      sendToRenderer('nfc:card-removed', { readerName });
    });

    nfcReader.on('card:error', (err) => {
      sendToRenderer('nfc:error', { error: err?.message || 'NFC error' });
    });

    nfcReader.on('nfc:unavailable', () => {
      console.log('[Main] NFC hardware not available — NFC features disabled');
    });

    nfcReader.start();
    console.log("NFC STARTED");
    console.log('[Main] NFC reader initialised');
  } catch (e) {
    console.warn('[Main] NFC init failed (non-fatal):', e.message);
  }
}

function sendToRenderer(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

/**
 * Offline-first patient resolution by NFC UID:
 *  1. Check local nfc_uid_map → patients table (instant, works offline)
 *  2. Call backend API /api/patients/by-nfc/<uid>/ (if online)
 *  3. Throw if neither works
 */
async function resolvePatientByNfcUid(uid) {
  // Step 1 — Local DB lookup
  if (database) {
    const local = database.getPatientByNfcUid(uid);
    if (local) {
      // Background refresh if online
      if (authToken) {
        refreshFromApi(uid).catch(() => {});
      }
      return { data: local, source: 'cache' };
    }
  }

  // Step 2 — Backend API (requires internet + auth)
  if (authToken) {
    try {
      const data = await apiRequest('GET', `/patients/by-nfc/${encodeURIComponent(uid)}/`);
      // Cache the mapping and patient data locally
      if (database && data) {
        database.upsertNfcUid(uid, data.patient_id, data.scanned_card?.card_number, data.full_name);
        database.upsertPatients([data]);
      }
      return { data, source: 'api' };
    } catch (err) {
      // API failed — fall through
    }
  }

  // Step 3 — Nothing found
  throw new Error('Patient not found offline. Connect to internet.');
}

async function refreshFromApi(uid) {
  if (!authToken) return;
  try {
    const data = await apiRequest('GET', `/patients/by-nfc/${encodeURIComponent(uid)}/`);
    if (database && data) {
      database.upsertNfcUid(uid, data.patient_id, data.scanned_card?.card_number, data.full_name);
      database.upsertPatients([data]);
    }
  } catch {}
}

// ══════════════════════════════════════
//  HTTP HELPERS (Electron net module)
// ══════════════════════════════════════

function apiRequest(method, endpoint, body, customToken) {
  return new Promise((resolve, reject) => {
    const req = net.request({ method, url: `${API}${endpoint}` });
    req.setHeader('Content-Type', 'application/json');
    const tk = customToken || authToken;
    if (tk) req.setHeader('Authorization', `Bearer ${tk}`);

    let data = '';
    req.on('response', (res) => {
      res.on('data', (c) => data += c.toString());
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch { resolve(data); }
        } else {
          reject({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', (err) => reject({ status: 0, body: err.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function nfcRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const req = net.request({ method: 'GET', url: `${NFC_API}${endpoint}` });
    let data = '';
    req.on('response', (res) => {
      res.on('data', (c) => data += c.toString());
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch { resolve(data); }
        } else {
          reject({ status: res.statusCode });
        }
      });
    });
    req.on('error', (err) => reject({ status: 0, body: err.message }));
    req.end();
  });
}

// ══════════════════════════════════════
//  IPC HANDLERS
// ══════════════════════════════════════

function registerHandlers() {

  // ── Auth ──
  ipcMain.handle('auth:login', async (_e, { username, password }) => {
    try {
      const data = await apiRequest('POST', '/auth/login/', { username, password });
      authToken = data.tokens?.access || null;

      // Start sync after login
      if (sync && authToken) {
        sync.start(authToken, (status) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('sync:status', status);
          }
        });
      }

      return { success: true, user: data.user || {}, tokens: data.tokens || {} };
    } catch (err) {
      if (err.status === 401 || err.status === 400) {
        return { success: false, error: 'Invalid username or password.' };
      }
      if (err.body?.includes?.('ECONNREFUSED') || err.status === 0) {
        return { success: false, error: 'Cannot reach server. Is the backend running?' };
      }
      return { success: false, error: `Server error (${err.status})` };
    }
  });

  ipcMain.handle('auth:logout', () => {
    authToken = null;
    if (sync) sync.stop();
    if (mainWindow) mainWindow.loadFile(path.join(__dirname, 'login.html'));
    return { success: true };
  });

  ipcMain.handle('navigate:app', (_e, { user, tokens }) => {
    authToken = tokens?.access || authToken;
    mainWindow.loadFile(path.join(__dirname, 'app.html'));
  });

  // ── API Proxy (online requests) ──
  ipcMain.handle('api:get', async (_e, endpoint) => {
    try {
      const data = await apiRequest('GET', endpoint);
      return { success: true, data };
    } catch (err) {
      return { success: false, status: err.status, error: err.body };
    }
  });

  ipcMain.handle('api:post', async (_e, endpoint, body) => {
    try {
      const data = await apiRequest('POST', endpoint, body);
      return { success: true, data };
    } catch (err) {
      return { success: false, status: err.status, error: err.body };
    }
  });

  ipcMain.handle('api:put', async (_e, endpoint, body) => {
    try {
      const data = await apiRequest('PUT', endpoint, body);
      return { success: true, data };
    } catch (err) {
      return { success: false, status: err.status, error: err.body };
    }
  });

  // ── Offline DB ──
  ipcMain.handle('db:patients:all', () => database?.getAllPatients() || []);
  ipcMain.handle('db:patients:get', (_e, id) => database?.getPatient(id) || null);
  ipcMain.handle('db:patients:search', (_e, q) => database?.searchPatients(q) || []);
  
  ipcMain.handle('db:patients:upsert', (_, patient) => {
    if (!db) {
      console.error("❌ DB NOT READY");
      return;
    }
  
    db.prepare(`
      INSERT INTO patients (id, name, nfc_uid)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        nfc_uid=excluded.nfc_uid
    `).run(patient.id, patient.name, patient.nfc_uid);
  
    return true;
  });

  ipcMain.handle('db:doctors:all', () => database?.getAllDoctors() || []);
  ipcMain.handle('db:doctors:upsert', (_e, list) => { if (database) database.upsertDoctors(Array.isArray(list) ? list : [list]); });

  ipcMain.handle('db:appointments:all', () => database?.getAllAppointments() || []);
  ipcMain.handle('db:appointments:today', () => database?.getTodayAppointments() || []);

  ipcMain.handle('db:records:byPatient', (_e, pid) => database?.getRecordsByPatient(pid) || []);
  ipcMain.handle('db:records:all', () => database?.getAllRecords() || []);

  ipcMain.handle('db:prescriptions:byPatient', (_e, pid) => database?.getPrescriptionsByPatient(pid) || []);
  ipcMain.handle('db:prescriptions:all', () => database?.getAllPrescriptions() || []);

  ipcMain.handle('db:receipts:all', () => database?.getAllReceipts() || []);

  ipcMain.handle('db:cache:get', (_e, key) => database?.getCache(key) || null);
  ipcMain.handle('db:cache:set', (_e, key, data) => { if (database) database.setCache(key, data); });

  ipcMain.handle('db:stats', () => database?.getStats() || null);

  // ── Sync Queue ──
  ipcMain.handle('sync:queue', (_e, action, entity, entityId, payload) => {
    if (database) database.addToQueue(action, entity, entityId, payload);
  });

  ipcMain.handle('sync:count', () => database?.getQueueCount() || 0);

  ipcMain.handle('sync:forcePull', async () => {
    if (sync) return sync.forcePull();
    return { success: false };
  });

  ipcMain.handle('sync:forcePush', async () => {
    if (sync) return sync.forcePush();
    return { success: false };
  });

  ipcMain.handle('sync:isOnline', () => sync?.isOnline() ?? true);

  // ── NFC (legacy polling — FastAPI bridge) ──
  ipcMain.handle('nfc:scan', async () => {
    try {
      const data = await nfcRequest('/scan/latest');
      return { success: true, data };
    } catch {
      return { success: false, error: 'NFC reader not available' };
    }
  });

  ipcMain.handle('nfc:patient', async (_e, patientId) => {
    try {
      const data = await nfcRequest(`/patient/${encodeURIComponent(patientId)}`);
      return { success: true, data };
    } catch {
      return { success: false };
    }
  });

  // ── NFC Hardware (nfc-pcsc) ──
  ipcMain.handle('nfc:status', () => {
    if (!nfcReader) return { available: false, readers: [] };
    return {
      available: nfcReader.isAvailable(),
      readers: nfcReader.getReaders(),
      hasReader: nfcReader.hasReader(),
    };
  });

  ipcMain.handle('nfc:lookup', async (_e, uid) => {
    try {
      const result = await resolvePatientByNfcUid(uid);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('nfc:mappings', () => {
    return database?.getAllNfcMappings() || [];
  });

  ipcMain.handle('nfc:assign', async (_e, { patientId, nfcUid }) => {
    if (!patientId || !nfcUid) {
      return { success: false, error: 'patient_id and nfc_uid are required' };
    }
    const uid = nfcUid.trim().toUpperCase();

    // Check local DB for duplicate assignment to a different patient
    if (database) {
      const existing = database.lookupByNfcUid(uid);
      if (existing && existing.patient_id !== patientId) {
        return {
          success: false,
          error: `This NFC card is already assigned to ${existing.patient_name || existing.patient_id}`,
          assigned_to: existing,
        };
      }
    }

    // Try backend API first (authoritative)
    if (authToken) {
      try {
        const data = await apiRequest('POST', '/patients/assign-nfc/', {
          patient_id: patientId,
          nfc_uid: uid,
        });
        // Cache the mapping locally
        if (database) {
          database.upsertNfcUid(uid, patientId, data.card?.card_number, data.patient?.full_name);
        }
        return { success: true, data };
      } catch (err) {
        const body = typeof err.body === 'string' ? (() => { try { return JSON.parse(err.body); } catch { return {}; } })() : {};
        if (err.status === 409) {
          return { success: false, error: body.error || 'NFC card already assigned to another patient', assigned_to: body.assigned_to };
        }
        if (err.status === 0) {
          // Offline — fall through to local-only assignment
        } else {
          return { success: false, error: body.error || `Server error (${err.status})` };
        }
      }
    }

    // Offline: save mapping locally and queue for sync
    if (database) {
      const patient = database.getPatient(patientId);
      database.upsertNfcUid(uid, patientId, null, patient?.full_name || null);
      database.addToQueue('create', 'nfc_assign', null, { patient_id: patientId, nfc_uid: uid });
      return { success: true, data: { message: 'NFC card assigned locally (will sync when online)', offline: true } };
    }

    return { success: false, error: 'No connection and no local database available' };
  });

  // ── NFC DESFire Write ──
  ipcMain.handle('nfc:write-card', async (_e, { id, name, blood }) => {
    if (!nfcReader || !nfcReader.isAvailable()) {
      return { success: false, error: 'NFC reader not available' };
    }
    if (!nfcReader.hasReader()) {
      return { success: false, error: 'No NFC reader connected' };
    }
    if (!id || !name) {
      return { success: false, error: 'Patient ID and name are required' };
    }
    try {
      const result = await nfcReader.queueWrite({ id, name, blood: blood || '' });
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('nfc:cancel-write', () => {
    if (nfcReader) nfcReader.cancelWrite();
    return { success: true };
  });

  ipcMain.handle('nfc:patient-status', async (_e, patientId) => {
    // Check local NFC mappings for this patient
    if (database) {
      const mappings = database.getAllNfcMappings();
      const match = mappings.find(m => m.patient_id === patientId);
      if (match) {
        return { has_nfc: true, nfc_uid: match.nfc_uid, source: 'cache' };
      }
    }
    // Try API
    if (authToken) {
      try {
        const data = await apiRequest('GET', `/patients/${encodeURIComponent(patientId)}/nfc-status/`);
        // Cache if assigned
        if (data.has_nfc && data.nfc_uid && database) {
          database.upsertNfcUid(data.nfc_uid, patientId, null, data.full_name);
        }
        return { ...data, source: 'api' };
      } catch {
        return { has_nfc: false, nfc_uid: null, source: 'unknown' };
      }
    }
    return { has_nfc: false, nfc_uid: null, source: 'offline' };
  });
}

// ══════════════════════════════════════
//  APP LIFECYCLE
// ══════════════════════════════════════

app.whenReady().then(async () => {
  db = initDB();
  await initOffline();
  await initNfc();
  createWindow();
  startNFC(mainWindow);
  registerHandlers();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (nfcReader) nfcReader.stop();
  if (sync) sync.stop();
  if (database) database.closeDatabase();
  app.quit();
});
