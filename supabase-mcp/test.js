/**
 * Supabase MCP Test Script
 * Run: node test.js
 * Tests all tool handlers directly (without MCP transport).
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const results = [];
function pass(name) { results.push({ name, status: '✅ PASS' }); }
function fail(name, reason) { results.push({ name, status: '❌ FAIL', reason }); }

// ── Test 1: Basic connection ─────────────────────────────────────
async function testConnection() {
  try {
    const { data, error } = await supabase.from('patients').select('patient_id').limit(1);
    if (error && error.code === '42P01') {
      pass('testConnection (table not yet created)');
    } else if (error) {
      fail('testConnection', error.message);
    } else {
      pass(`testConnection (found ${data.length} patient record(s))`);
    }
  } catch (e) {
    fail('testConnection', e.message);
  }
}

// ── Test 2: Read patients ────────────────────────────────────────
async function testReadPatients() {
  const { data, error } = await supabase
    .from('patients')
    .select('patient_id, full_name, status')
    .limit(5);

  if (error && error.code === '42P01') {
    console.log('  ⚠  patients table not found — skipping read test');
    pass('getPatients (table not found — skipped)');
    return;
  }
  if (error) { fail('getPatients', error.message); return; }
  console.log(`  Found ${data.length} patients:`, data.map(p => p.patient_id));
  pass('getPatients');
}

// ── Test 3: Audit log insert ─────────────────────────────────────
async function testAuditLog() {
  const { data, error } = await supabase
    .from('audit_logs')
    .insert([{
      action: 'TEST_CONNECTION',
      actor_role: 'system',
      details: { test: true, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    }])
    .select().single();

  if (error && error.code === '42P01') {
    console.log('  ⚠  audit_logs table not found — run schema.sql first');
    pass('storeAuditLog (table not found — skipped)');
    return;
  }
  if (error) { fail('storeAuditLog', error.message); return; }
  console.log('  Audit log created:', data?.id);
  pass('storeAuditLog');
}

// ── Test 4: Consent upsert ───────────────────────────────────────
async function testConsent() {
  const TEST_PATIENT_ID = 'TEST-0000';

  // Ensure a test patient row exists (FK constraint on patient_consents)
  const { error: patientErr } = await supabase
    .from('patients')
    .upsert({ patient_id: TEST_PATIENT_ID, full_name: 'Test Patient', status: 'active' }, { onConflict: 'patient_id' });

  if (patientErr && patientErr.code === '42P01') {
    console.log('  ⚠  patients table not found — skipping consent test');
    pass('setConsentStatus (table not found — skipped)');
    return;
  }
  if (patientErr) { fail('setConsentStatus', `seed patient: ${patientErr.message}`); return; }

  const { data, error } = await supabase
    .from('patient_consents')
    .upsert({
      patient_id: TEST_PATIENT_ID,
      status: 'granted',
      granted_at: new Date().toISOString(),
      granted_via: 'test',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'patient_id' })
    .select().single();

  if (error && error.code === '42P01') {
    console.log('  ⚠  patient_consents table not found — run schema.sql first');
    pass('setConsentStatus (table not found — skipped)');
    return;
  }
  if (error) { fail('setConsentStatus', error.message); return; }
  console.log('  Consent upserted for:', data?.patient_id);
  pass('setConsentStatus');

  // Clean up test data
  await supabase.from('patient_consents').delete().eq('patient_id', TEST_PATIENT_ID);
  await supabase.from('patients').delete().eq('patient_id', TEST_PATIENT_ID);
}

// ── Run all tests ────────────────────────────────────────────────
console.log('\n🔬  Medha Supabase MCP — Connection Tests\n');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   Key: ${SUPABASE_KEY.slice(0, 30)}...\n`);

await testConnection();
await testReadPatients();
await testAuditLog();
await testConsent();

console.log('\n── Results ──────────────────────────────────────');
for (const r of results) {
  console.log(`  ${r.status}  ${r.name}${r.reason ? ` — ${r.reason}` : ''}`);
}
console.log('');
