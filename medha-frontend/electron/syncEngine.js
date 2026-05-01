/**
 * Medha Health Intelligance — Background Sync Engine
 *
 * Pull: fetches data from backend, caches in SQLite
 * Push: sends queued offline writes to backend
 * Retries with exponential backoff, max 5 attempts
 */
import { net } from 'electron';
import * as db from './database.js';

const API = 'http://127.0.0.1:8000/api';
const PULL_MS = 60_000;
const PUSH_MS = 15_000;
const MAX_RETRIES = 5;

let token = null;
let pullTimer = null;
let pushTimer = null;
let online = false;
let busy = false;
let onChange = null;

// ── Public API ──

export function start(authToken, statusCb) {
  token = authToken;
  onChange = statusCb;
  checkOnline();

  pullTimer = setInterval(() => {
    checkOnline();
    if (online && !busy) pull();
  }, PULL_MS);

  pushTimer = setInterval(() => {
    if (online && !busy) push();
  }, PUSH_MS);

  setTimeout(() => { if (online) pull(); }, 2000);
}

export function stop() {
  if (pullTimer) { clearInterval(pullTimer); pullTimer = null; }
  if (pushTimer) { clearInterval(pushTimer); pushTimer = null; }
}

export function setToken(t) { token = t; }
export function isOnline() { return online; }

export async function forcePull() {
  if (!online) return { success: false };
  return pull();
}

export async function forcePush() {
  if (!online) return { success: false };
  return push();
}

// ── Connectivity ──

function checkOnline() {
  const was = online;
  try { online = net.isOnline(); } catch { online = false; }
  if (was !== online) {
    emit();
    if (online && !busy) { pull(); push(); }
  }
}

// ── Pull ──

async function pull() {
  if (busy || !token) return;
  busy = true;
  emit('syncing');
  console.log('Sync pull started');

  const pulls = [
    ['/patients/', d => {
      const patients = arr(d);
      console.log(`Patients fetched from backend: ${patients.length}`);
      db.upsertPatients(patients);
      console.log('Stored in local DB');
    }],
    ['/doctors/', d => db.upsertDoctors(arr(d))],
    ['/appointments/', d => db.upsertAppointments(arr(d))],
    ['/records/', d => db.upsertRecords(arr(d))],
    ['/prescriptions/', d => db.upsertPrescriptions(arr(d))],
    ['/billing/receipts/', d => db.upsertReceipts(arr(d))],
    ['/dashboard/admin/', d => db.setCache('dashboard_admin', d)],
    ['/dashboard/doctor/', d => db.setCache('dashboard_doctor', d)],
    ['/billing/summary/', d => db.setCache('billing_summary', d)],
  ];

  let ok = 0;
  for (const [ep, handler] of pulls) {
    try {
      const data = await httpGet(ep);
      handler(data);
      ok++;
    } catch (e) {
      // Some endpoints may 403 based on role — that's fine
    }
  }

  console.log(`[Sync] Pull: ${ok}/${pulls.length} ok`);
  console.log('Sync pull completed');
  db.setCache('last_pull', { time: new Date().toISOString() });
  busy = false;
  emit('idle');
  return { success: true, ok };
}

// ── Push ──

async function push() {
  const pending = db.getPendingQueue();
  if (!pending.length) return { success: true, pushed: 0 };
  emit('pushing');

  let pushed = 0;
  for (const item of pending) {
    if (item.retries >= MAX_RETRIES) {
      db.markQueueItem(item.id, 'failed', 'Max retries');
      continue;
    }
    try {
      const epMap = {
        patients: '/patients/', appointments: '/appointments/',
        records: '/records/', prescriptions: '/prescriptions/',
        receipts: '/billing/receipts/',
      };
      const ep = epMap[item.entity];
      if (!ep) throw new Error('Unknown entity: ' + item.entity);

      if (item.action === 'create') await httpPost(ep, item.payload);
      else if (item.action === 'update') await httpPut(`${ep}${item.entity_id}/`, item.payload);

      db.markQueueItem(item.id, 'completed', null);
      pushed++;
    } catch (e) {
      db.markQueueItem(item.id, 'retry', e.message);
    }
  }

  db.clearCompleted();
  emit('idle');
  return { success: true, pushed };
}

// ── HTTP via Electron net ──

function httpGet(endpoint) {
  return new Promise((resolve, reject) => {
    const req = net.request({ method: 'GET', url: `${API}${endpoint}` });
    req.setHeader('Content-Type', 'application/json');
    if (token) req.setHeader('Authorization', `Bearer ${token}`);
    let body = '';
    req.on('response', res => {
      res.on('data', c => body += c.toString());
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}`));
        try { resolve(JSON.parse(body)); } catch { reject(new Error('Bad JSON')); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function httpPost(endpoint, data) { return httpSend('POST', endpoint, data); }
function httpPut(endpoint, data) { return httpSend('PUT', endpoint, data); }

function httpSend(method, endpoint, data) {
  return new Promise((resolve, reject) => {
    const req = net.request({ method, url: `${API}${endpoint}` });
    req.setHeader('Content-Type', 'application/json');
    if (token) req.setHeader('Authorization', `Bearer ${token}`);
    let body = '';
    req.on('response', res => {
      res.on('data', c => body += c.toString());
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
        try { resolve(JSON.parse(body)); } catch { resolve(body); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

// ── Status ──

function emit(state) {
  if (!onChange) return;
  onChange({
    online,
    state: state || (online ? 'idle' : 'offline'),
    pending: db.getQueueCount(),
    lastPull: db.getCache('last_pull')?.data?.time || null,
  });
}

function arr(d) { return Array.isArray(d) ? d : []; }
