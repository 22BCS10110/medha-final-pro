/**
 * Medha Health — Supabase MCP Server
 * =====================================
 * Exposes Supabase as a set of MCP tools that Claude Code can call.
 * Runs alongside the Django backend — does NOT replace it.
 *
 * Tools exposed:
 *   testConnection      — Verify Supabase connectivity
 *   getPatients         — List patients from Supabase
 *   getPatient          — Get one patient by patient_id
 *   createPatient       — Insert a new patient record
 *   updatePatient       — Update a patient field
 *   getAppointments     — List appointments (filterable by patient/doctor)
 *   createAppointment   — Insert a new appointment
 *   getChatMessages     — Get chat messages for a room
 *   storeChatMessage    — Store a chat message
 *   getConsentStatus    — Check consent for a patient
 *   setConsentStatus    — Set/revoke consent for a patient
 *   storeAuditLog       — Append an audit log entry
 *   getAuditLogs        — Query audit logs
 *   runQuery            — Raw SELECT query (read-only, safe)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────
// SUPABASE CLIENT
// ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[MCP] ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) must be set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

/** Wrap a Supabase response into a clean MCP tool result. */
function ok(data) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

function err(message, details) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: message, details }, null, 2) }],
    isError: true,
  };
}

/** Execute a Supabase query and format the result. */
async function query(fn) {
  try {
    const { data, error } = await fn();
    if (error) return err(error.message, error);
    return ok(data);
  } catch (e) {
    return err(e.message);
  }
}

// ─────────────────────────────────────────────────────────────────
// TOOL DEFINITIONS
// ─────────────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'testConnection',
    description: 'Test the Supabase connection. Returns server time and project URL.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'getPatients',
    description: 'List patients from Supabase. Supports pagination and optional status filter.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max records to return (default 20, max 100)' },
        offset: { type: 'number', description: 'Offset for pagination (default 0)' },
        status: { type: 'string', description: 'Filter by status: active | pending | discharged | critical' },
        search: { type: 'string', description: 'Search by full_name or patient_id (partial match)' },
      },
      required: [],
    },
  },
  {
    name: 'getPatient',
    description: 'Get a single patient by their patient_id (e.g. PAT-4500).',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient ID like PAT-4500' },
      },
      required: ['patient_id'],
    },
  },
  {
    name: 'createPatient',
    description: 'Insert a new patient record into Supabase.',
    inputSchema: {
      type: 'object',
      properties: {
        full_name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        date_of_birth: { type: 'string', description: 'YYYY-MM-DD' },
        gender: { type: 'string', description: 'M | F | O' },
        blood_group: { type: 'string', description: 'A+ | B+ | O+ | AB+ | etc.' },
        allergies: { type: 'string' },
        abha_id: { type: 'string', description: 'ABHA ID (optional, for ABDM)' },
      },
      required: ['full_name'],
    },
  },
  {
    name: 'updatePatient',
    description: 'Update one or more fields of an existing patient.',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient ID like PAT-4500' },
        updates: {
          type: 'object',
          description: 'Key-value pairs to update (e.g. {"status": "discharged"})',
        },
      },
      required: ['patient_id', 'updates'],
    },
  },
  {
    name: 'getAppointments',
    description: 'List appointments. Filter by patient_id, doctor_id, date or status.',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string' },
        doctor_id: { type: 'string' },
        date: { type: 'string', description: 'Filter by date YYYY-MM-DD' },
        status: { type: 'string', description: 'upcoming | completed | cancelled | critical' },
        limit: { type: 'number', description: 'Max records (default 20)' },
      },
      required: [],
    },
  },
  {
    name: 'createAppointment',
    description: 'Schedule a new appointment.',
    inputSchema: {
      type: 'object',
      properties: {
        doctor_id: { type: 'string' },
        patient_id: { type: 'string' },
        hospital_id: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        time: { type: 'string', description: 'HH:MM' },
        appointment_type: { type: 'string', description: 'new | follow_up | emergency | routine | post_op' },
        complaint: { type: 'string' },
      },
      required: ['doctor_id', 'patient_id', 'date', 'time'],
    },
  },
  {
    name: 'getChatMessages',
    description: 'Get chat messages for a room by room ID.',
    inputSchema: {
      type: 'object',
      properties: {
        room_id: { type: 'string', description: 'UUID of the chat room' },
        limit: { type: 'number', description: 'Max messages (default 50)' },
      },
      required: ['room_id'],
    },
  },
  {
    name: 'storeChatMessage',
    description: 'Store a chat message in Supabase.',
    inputSchema: {
      type: 'object',
      properties: {
        room_id: { type: 'string' },
        sender_type: { type: 'string', description: 'doctor | patient' },
        sender_id: { type: 'string', description: 'User ID of the sender' },
        content: { type: 'string' },
      },
      required: ['room_id', 'sender_type', 'content'],
    },
  },
  {
    name: 'getConsentStatus',
    description: 'Check consent status for a patient.',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient ID like PAT-4500' },
      },
      required: ['patient_id'],
    },
  },
  {
    name: 'setConsentStatus',
    description: 'Grant or revoke patient consent.',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string' },
        status: { type: 'string', description: 'granted | revoked' },
        granted_via: { type: 'string', description: 'nfc | web | mobile (default: web)' },
        revoke_reason: { type: 'string', description: 'Reason if revoking' },
      },
      required: ['patient_id', 'status'],
    },
  },
  {
    name: 'storeAuditLog',
    description: 'Append an immutable audit log entry to Supabase.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Action type: LOGIN | LOGOUT | NFC_SCAN | CONSENT_GRANTED | CONSENT_REVOKED | DATA_ACCESS | DATA_MODIFIED | APPOINTMENT_CREATED | CHAT_MESSAGE',
        },
        actor_id: { type: 'string', description: 'User ID performing the action' },
        actor_role: { type: 'string', description: 'Role: super_admin | hospital_admin | doctor | patient' },
        patient_id: { type: 'string', description: 'Patient affected (if applicable)' },
        hospital_id: { type: 'string' },
        details: { type: 'object', description: 'Any extra context as key-value pairs' },
        ip_address: { type: 'string' },
      },
      required: ['action'],
    },
  },
  {
    name: 'getAuditLogs',
    description: 'Query audit logs. Filter by action, patient_id, actor_id, or date range.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string' },
        actor_id: { type: 'string' },
        patient_id: { type: 'string' },
        hospital_id: { type: 'string' },
        from_date: { type: 'string', description: 'ISO date string' },
        to_date: { type: 'string', description: 'ISO date string' },
        limit: { type: 'number', description: 'Max records (default 50)' },
      },
      required: [],
    },
  },
  {
    name: 'runQuery',
    description: 'Run a safe read-only SELECT query via Supabase RPC or table scan. Use for ad-hoc analytics.',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Supabase table name to query' },
        filters: {
          type: 'object',
          description: 'Column filters as key-value pairs (exact match)',
        },
        columns: { type: 'string', description: 'Comma-separated columns to select (default: *)' },
        order_by: { type: 'string', description: 'Column to order by' },
        ascending: { type: 'boolean', description: 'Ascending sort order (default: false)' },
        limit: { type: 'number', description: 'Max records (default 20)' },
      },
      required: ['table'],
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// TOOL HANDLERS
// ─────────────────────────────────────────────────────────────────

async function handleTool(name, args) {
  switch (name) {
    // ── testConnection ──────────────────────────────────────────
    case 'testConnection': {
      return query(() =>
        supabase.rpc('now').select()
      ).catch(async () => {
        // Fallback: try a simple table list
        const { data, error } = await supabase.from('patients').select('patient_id').limit(1);
        if (error && error.code === '42P01') {
          // Table doesn't exist yet — connection still works
          return ok({
            connected: true,
            supabase_url: SUPABASE_URL,
            note: 'Connected. patients table not found — run migrations first.',
          });
        }
        if (error) return err(error.message);
        return ok({
          connected: true,
          supabase_url: SUPABASE_URL,
          sample_patient_id: data?.[0]?.patient_id ?? null,
        });
      });
    }

    // ── getPatients ─────────────────────────────────────────────
    case 'getPatients': {
      const limit = Math.min(args.limit ?? 20, 100);
      const offset = args.offset ?? 0;

      return query(() => {
        let q = supabase.from('patients').select('*').range(offset, offset + limit - 1);
        if (args.status) q = q.eq('status', args.status);
        if (args.search) {
          q = q.or(`full_name.ilike.%${args.search}%,patient_id.ilike.%${args.search}%`);
        }
        return q.order('created_at', { ascending: false });
      });
    }

    // ── getPatient ──────────────────────────────────────────────
    case 'getPatient': {
      if (!args.patient_id) return err('patient_id is required');
      return query(() =>
        supabase.from('patients').select('*').eq('patient_id', args.patient_id).single()
      );
    }

    // ── createPatient ───────────────────────────────────────────
    case 'createPatient': {
      const { full_name, email, phone, date_of_birth, gender, blood_group, allergies, abha_id } = args;
      if (!full_name) return err('full_name is required');

      // Generate a patient_id (PAT-XXXX format)
      const { data: last } = await supabase
        .from('patients')
        .select('patient_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let nextNum = 4500;
      if (last?.patient_id) {
        const parts = last.patient_id.split('-');
        if (parts[1] && !isNaN(parts[1])) nextNum = parseInt(parts[1]) + 1;
      }
      const patient_id = `PAT-${nextNum}`;

      return query(() =>
        supabase.from('patients').insert([{
          patient_id,
          full_name,
          email: email || null,
          phone: phone || '',
          date_of_birth: date_of_birth || null,
          gender: gender || 'M',
          blood_group: blood_group || '',
          allergies: allergies || '',
          abha_id: abha_id || '',
          status: 'active',
          created_at: new Date().toISOString(),
        }]).select().single()
      );
    }

    // ── updatePatient ───────────────────────────────────────────
    case 'updatePatient': {
      const { patient_id, updates } = args;
      if (!patient_id) return err('patient_id is required');
      if (!updates || typeof updates !== 'object') return err('updates object is required');

      // Disallow updating system fields
      const forbidden = ['id', 'patient_id', 'created_at'];
      const safe = Object.fromEntries(
        Object.entries(updates).filter(([k]) => !forbidden.includes(k))
      );
      if (Object.keys(safe).length === 0) return err('No valid fields to update');

      return query(() =>
        supabase.from('patients').update({ ...safe, updated_at: new Date().toISOString() })
          .eq('patient_id', patient_id).select().single()
      );
    }

    // ── getAppointments ─────────────────────────────────────────
    case 'getAppointments': {
      const limit = args.limit ?? 20;
      return query(() => {
        let q = supabase.from('appointments').select('*').limit(limit);
        if (args.patient_id) q = q.eq('patient_id', args.patient_id);
        if (args.doctor_id)  q = q.eq('doctor_id', args.doctor_id);
        if (args.date)       q = q.eq('date', args.date);
        if (args.status)     q = q.eq('status', args.status);
        return q.order('date', { ascending: true });
      });
    }

    // ── createAppointment ───────────────────────────────────────
    case 'createAppointment': {
      const { doctor_id, patient_id, hospital_id, date, time, appointment_type, complaint } = args;
      if (!doctor_id || !patient_id || !date || !time) {
        return err('doctor_id, patient_id, date, and time are required');
      }
      return query(() =>
        supabase.from('appointments').insert([{
          doctor_id,
          patient_id,
          hospital_id: hospital_id || null,
          date,
          time,
          appointment_type: appointment_type || 'new',
          complaint: complaint || '',
          status: 'upcoming',
          created_at: new Date().toISOString(),
        }]).select().single()
      );
    }

    // ── getChatMessages ─────────────────────────────────────────
    case 'getChatMessages': {
      if (!args.room_id) return err('room_id is required');
      const limit = args.limit ?? 50;
      return query(() =>
        supabase.from('chat_messages')
          .select('*')
          .eq('room_id', args.room_id)
          .order('created_at', { ascending: true })
          .limit(limit)
      );
    }

    // ── storeChatMessage ────────────────────────────────────────
    case 'storeChatMessage': {
      const { room_id, sender_type, sender_id, content } = args;
      if (!room_id || !sender_type || !content) {
        return err('room_id, sender_type, and content are required');
      }
      return query(() =>
        supabase.from('chat_messages').insert([{
          room_id,
          sender_type,
          sender_id: sender_id || null,
          content,
          is_read: false,
          created_at: new Date().toISOString(),
        }]).select().single()
      );
    }

    // ── getConsentStatus ────────────────────────────────────────
    case 'getConsentStatus': {
      if (!args.patient_id) return err('patient_id is required');
      return query(() =>
        supabase.from('patient_consents')
          .select('*')
          .eq('patient_id', args.patient_id)
          .single()
      );
    }

    // ── setConsentStatus ────────────────────────────────────────
    case 'setConsentStatus': {
      const { patient_id, status, granted_via, revoke_reason } = args;
      if (!patient_id || !status) return err('patient_id and status are required');
      if (!['granted', 'revoked'].includes(status)) return err('status must be granted or revoked');

      const now = new Date().toISOString();
      const record = {
        patient_id,
        status,
        updated_at: now,
        ...(status === 'granted' ? { granted_at: now, granted_via: granted_via || 'web' } : {}),
        ...(status === 'revoked' ? { revoked_at: now, revoke_reason: revoke_reason || '' } : {}),
      };

      // Upsert — create if doesn't exist, update if it does
      return query(() =>
        supabase.from('patient_consents')
          .upsert(record, { onConflict: 'patient_id' })
          .select().single()
      );
    }

    // ── storeAuditLog ───────────────────────────────────────────
    case 'storeAuditLog': {
      const { action, actor_id, actor_role, patient_id, hospital_id, details, ip_address } = args;
      if (!action) return err('action is required');

      return query(() =>
        supabase.from('audit_logs').insert([{
          action,
          actor_id: actor_id || null,
          actor_role: actor_role || null,
          patient_id: patient_id || null,
          hospital_id: hospital_id || null,
          details: details || {},
          ip_address: ip_address || null,
          timestamp: new Date().toISOString(),
        }]).select().single()
      );
    }

    // ── getAuditLogs ────────────────────────────────────────────
    case 'getAuditLogs': {
      const limit = args.limit ?? 50;
      return query(() => {
        let q = supabase.from('audit_logs').select('*').limit(limit);
        if (args.action)     q = q.eq('action', args.action);
        if (args.actor_id)   q = q.eq('actor_id', args.actor_id);
        if (args.patient_id) q = q.eq('patient_id', args.patient_id);
        if (args.hospital_id) q = q.eq('hospital_id', args.hospital_id);
        if (args.from_date)  q = q.gte('timestamp', args.from_date);
        if (args.to_date)    q = q.lte('timestamp', args.to_date);
        return q.order('timestamp', { ascending: false });
      });
    }

    // ── runQuery ─────────────────────────────────────────────────
    case 'runQuery': {
      const { table, filters, columns, order_by, ascending, limit } = args;
      if (!table) return err('table is required');

      // Allowlist tables to prevent abuse
      const ALLOWED_TABLES = [
        'patients', 'appointments', 'doctors', 'hospitals',
        'health_records', 'prescriptions', 'receipts', 'vitals',
        'chat_rooms', 'chat_messages', 'patient_consents', 'audit_logs',
      ];
      if (!ALLOWED_TABLES.includes(table)) {
        return err(`Table "${table}" is not accessible. Allowed: ${ALLOWED_TABLES.join(', ')}`);
      }

      return query(() => {
        let q = supabase.from(table).select(columns || '*').limit(Math.min(limit ?? 20, 200));
        if (filters && typeof filters === 'object') {
          for (const [col, val] of Object.entries(filters)) {
            q = q.eq(col, val);
          }
        }
        if (order_by) q = q.order(order_by, { ascending: ascending ?? false });
        return q;
      });
    }

    default:
      return err(`Unknown tool: ${name}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// MCP SERVER SETUP
// ─────────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'medha-supabase', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return handleTool(name, args ?? {});
});

// ─────────────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[MCP] Medha Supabase MCP server running (stdio transport)');
