import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  UserPlus,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Filter,
  Download,
  AlertCircle,
  User,
  Phone,
  Droplets,
  Calendar,
  CreditCard,
  X,
  Pencil,
  CheckCircle2,
  XCircle,
  Building2,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { patientsAPI, doctorsAPI, hospitalAPI, notificationsAPI } from '../../services/api';
import { getPatients, searchPatients as offlineSearch, getDoctors, createPatient } from '../../services/offlineService';
import NfcAssignCard from '../nfc/NfcAssignCard';
import NfcAssignModal from '../nfc/NfcAssignModal';

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  full_name: '',
  date_of_birth: '',
  gender: 'M',
  phone: '',
  email: '',
  address: '',
  emergency_contact: '',
  blood_group: '',
  allergies: '',
  existing_diseases: '',
  height_cm: '',
  weight_kg: '',
  assigned_doctor: '',
  hospital_id: '',
  abha_id: '',
  status: 'active',
};

function calcAge(dob) {
  if (!dob) return '';
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 0 ? age : '';
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function toast(kind, message) {
  const el = document.createElement('div');
  el.className = `medha-toast medha-toast-${kind}`;
  el.textContent = message;
  el.style.cssText = `
    position:fixed;top:24px;right:24px;z-index:9999;
    padding:14px 20px;border-radius:14px;font-weight:700;font-size:13px;
    box-shadow:0 10px 30px rgba(0,0,0,.12);color:#fff;
    background:${kind === 'success' ? '#10b981' : kind === 'error' ? '#ef4444' : '#6366f1'};
    transform:translateY(-10px);opacity:0;transition:all .25s ease;
  `;
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-10px)';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [nfcModalPatient, setNfcModalPatient] = useState(null);
  const [nfcAssignedIds, setNfcAssignedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: 'all', gender: 'all', blood_group: 'all' });
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [assignDoctorId, setAssignDoctorId] = useState('');
  const [assigningDoctor, setAssigningDoctor] = useState(false);

  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
  const location = useLocation();

  const selectedPatientRef = useRef(null);
  useEffect(() => {
    selectedPatientRef.current = selectedPatient;
    if (!selectedPatient) setAssignDoctorId('');
  }, [selectedPatient]);

  // ── Data loaders ─────────────────────────────────────────────
  const fetchPatients = async () => {
    try {
      const result = await getPatients();
      const data = Array.isArray(result.data) ? result.data : (result.data?.results || []);
      setPatients(data);
    } catch (err) {
      console.error('Failed to fetch patients', err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const result = await getDoctors();
      setDoctors(Array.isArray(result.data) ? result.data : (result.data?.results || []));
    } catch {
      setDoctors([]);
    }
  };

  const fetchHospitals = async () => {
    try {
      const res = await hospitalAPI.list();
      setHospitals(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch {
      setHospitals([]);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchHospitals();
    if (location.pathname === '/admin/registration') openNewForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ── Search (debounced server-side, client-side fallback) ────
  const handleSearch = async (val) => {
    setSearchTerm(val);
    setPage(1);
    if (val.length > 2) {
      try {
        const result = await offlineSearch(val);
        const data = Array.isArray(result.data) ? result.data : (result.data?.results || []);
        setPatients(data);
      } catch {
        // keep showing cached results
      }
    } else if (val === '') {
      fetchPatients();
    }
  };

  // ── Filter + Paginate ───────────────────────────────────────
  const filtered = useMemo(() => {
    return patients.filter((p) => {
      if (filters.status !== 'all' && p.status !== filters.status) return false;
      if (filters.gender !== 'all' && p.gender !== filters.gender) return false;
      if (filters.blood_group !== 'all' && p.blood_group !== filters.blood_group) return false;
      return true;
    });
  }, [patients, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);

  // ── Add / Edit ──────────────────────────────────────────────
  const openNewForm = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (p) => {
    setEditingId(p.patient_id || p.id);
    setFormData({
      full_name: p.full_name || '',
      date_of_birth: p.date_of_birth || '',
      gender: p.gender || 'M',
      phone: p.phone || '',
      email: p.email || '',
      address: p.address || '',
      emergency_contact: p.emergency_contact || '',
      blood_group: p.blood_group || '',
      allergies: p.allergies || '',
      existing_diseases: p.existing_diseases || '',
      height_cm: p.height_cm ?? '',
      weight_kg: p.weight_kg ?? '',
      assigned_doctor: p.assigned_doctor?.id || p.assigned_doctor || '',
      hospital_id: p.hospital_visits?.[0]?.hospital_id || '',
      abha_id: p.abha_id || '',
      status: p.status || 'active',
    });
    setShowForm(true);
    setSelectedPatient(null);
  };

  const buildPayload = () => {
    const payload = { ...formData };
    // empty strings → null for optional nullable fields
    if (!payload.date_of_birth) delete payload.date_of_birth;
    if (!payload.assigned_doctor) delete payload.assigned_doctor;
    if (!payload.height_cm) delete payload.height_cm;
    if (!payload.weight_kg) delete payload.weight_kg;
    if (!payload.email) delete payload.email;
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toast('error', 'Full name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await patientsAPI.update(editingId, buildPayload());
        toast('success', 'Patient updated');
      } else {
        const result = await createPatient(buildPayload());
        if (result.source === 'queued') {
          toast('info', 'Offline — queued for sync');
        } else {
          toast('success', 'Patient created');
        }
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(EMPTY_FORM);
      fetchPatients();
    } catch (err) {
      const msg = err.response?.data?.detail
        || Object.values(err.response?.data || {})[0]?.[0]
        || err.message
        || 'Save failed';
      toast('error', String(msg));
    } finally {
      setSaving(false);
    }
  };

  // ── Doctor assignment ────────────────────────────────────────
  const handleAssignDoctor = async () => {
    if (!assignDoctorId || !selectedPatient) return;
    setAssigningDoctor(true);
    try {
      const res = await patientsAPI.assignDoctor(
        selectedPatient.patient_id || selectedPatient.id,
        assignDoctorId
      );
      const doc = doctors.find((d) => d.id === assignDoctorId);
      setSelectedPatient((prev) => ({
        ...prev,
        assigned_doctor: doc || prev.assigned_doctor,
        assigned_doctor_name: doc?.full_name || prev.assigned_doctor_name,
      }));
      setAssignDoctorId('');
      fetchPatients();
      toast('success', `Assigned to ${res.data?.doctor?.full_name || 'doctor'}`);
    } catch (err) {
      toast('error', err?.response?.data?.error || 'Assignment failed');
    } finally {
      setAssigningDoctor(false);
    }
  };

  // ── NFC assign flow (unchanged behavior) ────────────────────
  const handleAssignClick = (patient) => {
    setSelectedPatient(patient);
    setNfcModalPatient(patient);
  };

  const assignCardToPatient = async (uid) => {
    const patient = selectedPatientRef.current;
    if (!patient) return;
    try {
      await patientsAPI.assignNfc(patient.patient_id || patient.id, uid.toUpperCase());
      setNfcAssignedIds((prev) => new Set([...prev, patient.patient_id || patient.id]));
      setNfcModalPatient(null);
      toast('success', `NFC card assigned to ${patient.full_name}`);
      fetchPatients();
    } catch (err) {
      console.error('NFC Assign Error:', err);
      toast('error', 'NFC assignment failed');
    }
  };

  useEffect(() => {
    if (!isElectron) return;
    const unsub = window.electronAPI.onNFCCard?.((uid) => assignCardToPatient(uid));
    return () => { if (unsub && typeof unsub === 'function') unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isElectron]);

  // ── Export CSV ──────────────────────────────────────────────
  const handleExport = () => {
    if (filtered.length === 0) { toast('info', 'No data to export'); return; }
    const headers = ['Patient ID', 'Full Name', 'Age', 'Gender', 'Phone', 'Blood Group', 'Email', 'Status', 'Created'];
    const rows = filtered.map((p) => [
      p.patient_id || p.id,
      p.full_name,
      calcAge(p.date_of_birth) || p.age || '',
      p.gender,
      p.phone,
      p.blood_group,
      p.email,
      p.status,
      p.created_at,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ──────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout title="Patient Management">
        <div className="flex items-center justify-center py-20 text-slate-400">Loading Clinical Records…</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Patient Management">
      <div className="space-y-8">
        {/* Top Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-3xl px-6 py-3 w-full max-w-lg shadow-sm focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <Search size={20} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, phone or ABHA…"
              className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full text-slate-900"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                'flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-sm',
                showFilters
                  ? 'bg-primary text-white'
                  : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
              )}
            >
              <Filter size={18} />
              Filters
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download size={18} />
              Export
            </button>
            <button
              onClick={openNewForm}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={18} />
              Add Patient
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                <FilterSelect
                  label="Status"
                  value={filters.status}
                  onChange={(v) => { setFilters((f) => ({ ...f, status: v })); setPage(1); }}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'active', label: 'Active' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'discharged', label: 'Discharged' },
                    { value: 'critical', label: 'Critical' },
                  ]}
                />
                <FilterSelect
                  label="Gender"
                  value={filters.gender}
                  onChange={(v) => { setFilters((f) => ({ ...f, gender: v })); setPage(1); }}
                  options={[
                    { value: 'all', label: 'All Genders' },
                    { value: 'M', label: 'Male' },
                    { value: 'F', label: 'Female' },
                    { value: 'O', label: 'Other' },
                  ]}
                />
                <FilterSelect
                  label="Blood Group"
                  value={filters.blood_group}
                  onChange={(v) => { setFilters((f) => ({ ...f, blood_group: v })); setPage(1); }}
                  options={[
                    { value: 'all', label: 'All Blood Groups' },
                    ...['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => ({ value: bg, label: bg })),
                  ]}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Patient Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-5">Patient</th>
                  <th className="px-6 py-5">Age / Gender</th>
                  <th className="px-6 py-5">Phone</th>
                  <th className="px-6 py-5">Blood</th>
                  <th className="px-6 py-5">Hospital</th>
                  <th className="px-6 py-5">NFC</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Created</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-20 text-center text-sm font-bold text-slate-400">
                      No patients found. Click <span className="text-primary">Add Patient</span> to register one.
                    </td>
                  </tr>
                )}
                {pageRows.map((patient) => {
                  const pid = patient.patient_id || patient.id;
                  const age = calcAge(patient.date_of_birth) || patient.age || '—';
                  const nfcAssigned =
                    nfcAssignedIds.has(pid) || patient.has_active_card || patient.has_nfc || patient.nfc_uid;
                  const hospitalName =
                    patient.hospital_visits?.[0]?.hospital_name
                    || patient.hospital_visits?.[0]?.hospital__name
                    || '—';
                  return (
                    <tr
                      key={pid}
                      className="hover:bg-primary/[0.02] transition-colors group cursor-pointer"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 group-hover:bg-primary group-hover:text-white transition-all">
                            {(patient.full_name || '?')[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-none mb-1.5">{patient.full_name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pid}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-600">
                        {age}{age !== '—' && 'Y'} • {genderLabel(patient.gender)}
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-600">{patient.phone || '—'}</td>
                      <td className="px-6 py-5">
                        {patient.blood_group ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-xs font-black border border-rose-100">
                            {patient.blood_group}
                          </span>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-600 max-w-[160px] truncate" title={hospitalName}>
                        {hospitalName}
                      </td>
                      <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                        {nfcAssigned ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                            <CheckCircle2 size={14} />
                            Assigned
                          </span>
                        ) : isElectron ? (
                          <button
                            onClick={() => handleAssignClick(patient)}
                            className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
                          >
                            Assign NFC
                          </button>
                        ) : (
                          <span
                            title="NFC only works in desktop app"
                            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed"
                          >
                            Desktop only
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={patient.status} />
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-500">
                        {formatDate(patient.created_at)}
                      </td>
                      <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditForm(patient)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setSelectedPatient(patient)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                            title="View"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
              <span className="text-xs font-bold text-slate-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-slate-100 bg-white text-slate-500 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-black text-slate-700 px-3">
                  Page {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-slate-100 bg-white text-slate-500 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* NFC Assign Modal */}
        <AnimatePresence>
          {selectedPatient && nfcModalPatient && (
            <NfcAssignModal
              patient={selectedPatient}
              onClose={() => setNfcModalPatient(null)}
              onAssigned={(uid) => {
                const pid = selectedPatient.patient_id || selectedPatient.id;
                setNfcAssignedIds((prev) => new Set([...prev, pid]));
                toast('success', `NFC card ${uid} assigned`);
                fetchPatients();
              }}
            />
          )}
        </AnimatePresence>

        {/* Detail Slide-over */}
        <AnimatePresence>
          {selectedPatient && !showForm && (
            <DetailDrawer
              patient={selectedPatient}
              doctors={doctors}
              assignDoctorId={assignDoctorId}
              setAssignDoctorId={setAssignDoctorId}
              assigningDoctor={assigningDoctor}
              onAssignDoctor={handleAssignDoctor}
              onClose={() => setSelectedPatient(null)}
              onEdit={() => openEditForm(selectedPatient)}
              onNfcAssigned={(uid) => {
                const pid = selectedPatient.patient_id || selectedPatient.id;
                setNfcAssignedIds((prev) => new Set([...prev, pid]));
                fetchPatients();
              }}
            />
          )}
        </AnimatePresence>

        {/* Add / Edit Form */}
        <AnimatePresence>
          {showForm && (
            <PatientFormDrawer
              editingId={editingId}
              formData={formData}
              setFormData={setFormData}
              doctors={doctors}
              hospitals={hospitals}
              saving={saving}
              onClose={() => { setShowForm(false); setEditingId(null); }}
              onSubmit={handleSubmit}
            />
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

// ═══════════════════════════════════════════════════════════
//  Sub-components
// ═══════════════════════════════════════════════════════════

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    critical: 'bg-rose-50 text-rose-600 border-rose-100',
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    discharged: 'bg-slate-50 text-slate-500 border-slate-100',
  };
  const cls = map[status] || 'bg-slate-50 text-slate-500 border-slate-100';
  return (
    <span className={cn('px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border', cls)}>
      {status || 'unknown'}
    </span>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={12} className="text-slate-400" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      </div>
      <p className="text-sm font-bold text-slate-900 break-words">{value || '—'}</p>
    </div>
  );
}

function DetailDrawer({ patient, doctors, assignDoctorId, setAssignDoctorId, assigningDoctor, onAssignDoctor, onClose, onEdit, onNfcAssigned }) {
  const age = calcAge(patient.date_of_birth) || patient.age;
  return (
    <div className="fixed inset-0 z-[2000] overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute top-0 right-0 w-full max-w-xl h-full bg-white shadow-2xl flex flex-col"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <User size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{patient.full_name}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {patient.patient_id || patient.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-3 rounded-2xl hover:bg-primary/10 text-primary" title="Edit">
              <Pencil size={20} />
            </button>
            <button onClick={onClose} className="p-3 rounded-2xl hover:bg-slate-50 text-slate-400">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-8 space-y-6">
          <div className="flex items-center gap-3">
            <StatusBadge status={patient.status} />
            {patient._offline && (
              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                Cached
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoItem icon={Calendar} label="Age / Gender" value={`${age || '—'}${age ? 'Y' : ''} / ${genderLabel(patient.gender)}`} />
            <InfoItem icon={Droplets} label="Blood Group" value={patient.blood_group} />
            <InfoItem icon={Phone} label="Phone" value={patient.phone} />
            <InfoItem icon={Phone} label="Emergency" value={patient.emergency_contact} />
            <InfoItem icon={ShieldCheck} label="ABHA ID" value={patient.abha_id || 'Not linked'} />
            <InfoItem icon={Calendar} label="DOB" value={patient.date_of_birth} />
            <InfoItem icon={User} label="Email" value={patient.email} />
            <InfoItem icon={Building2} label="Height / Weight" value={`${patient.height_cm || '—'}cm / ${patient.weight_kg || '—'}kg`} />
          </div>

          {patient.address && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Address</p>
              <p className="text-sm font-bold text-slate-900">{patient.address}</p>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Assigned Doctor</p>
            <p className="text-sm font-bold text-slate-900">
              {patient.assigned_doctor?.full_name || patient.assigned_doctor_name || 'Unassigned'}
            </p>
          </div>

          {/* ── Assign / Reassign Doctor ── */}
          <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3">
              Assign / Reassign Doctor
            </p>
            <div className="flex gap-2">
              <select
                className="flex-1 bg-white border border-indigo-100 rounded-xl px-3 py-2.5 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                value={assignDoctorId}
                onChange={(e) => setAssignDoctorId(e.target.value)}
              >
                <option value="">Select Doctor</option>
                {(doctors || []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}{d.department ? ` — ${d.department}` : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={onAssignDoctor}
                disabled={!assignDoctorId || assigningDoctor}
                className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {assigningDoctor ? '…' : 'Assign'}
              </button>
            </div>
          </div>

          {patient.allergies && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Allergies</p>
              <p className="text-sm font-bold text-amber-800">{patient.allergies}</p>
            </div>
          )}
          {patient.existing_diseases && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">Existing Diseases</p>
              <p className="text-sm font-bold text-rose-800">{patient.existing_diseases}</p>
            </div>
          )}

          <div className="pt-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">NFC Card Management</h3>
            <NfcAssignCard
              patientId={patient.patient_id || patient.id}
              patientName={patient.full_name}
              onAssigned={onNfcAssigned}
            />
          </div>

          {patient.hospital_visits?.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Hospital Visits</h3>
              <div className="space-y-2">
                {patient.hospital_visits.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-sm font-bold text-slate-700">{v.hospital_name || v.hospital__name}</span>
                    <span className="text-xs text-slate-400">
                      {v.visit_date ? formatDate(v.visit_date) : ''}
                      {v.is_active && <span className="ml-2 text-emerald-600 font-bold">Active</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function PatientFormDrawer({ editingId, formData, setFormData, doctors, hospitals, saving, onClose, onSubmit }) {
  const age = calcAge(formData.date_of_birth);
  const set = (k, v) => setFormData((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-[2000] overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute top-0 right-0 w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {editingId ? 'Edit Patient' : 'Register Patient'}
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {editingId ? `Updating ${editingId}` : 'Medha Clinical Intake'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl hover:bg-slate-50 text-slate-400">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-grow overflow-y-auto">
          <div className="p-8 space-y-8">
            {/* PERSONAL */}
            <Section title="Personal Information">
              <Field label="Full Name *">
                <input
                  required
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => set('full_name', e.target.value)}
                  placeholder="e.g. Aarav Kumar"
                  className={inputCls}
                />
              </Field>
              <Field label="Date of Birth">
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => set('date_of_birth', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Age (auto)">
                <input
                  type="text"
                  readOnly
                  value={age ? `${age} years` : '—'}
                  className={cn(inputCls, 'bg-slate-100 text-slate-500 cursor-not-allowed')}
                />
              </Field>
              <Field label="Gender">
                <select value={formData.gender} onChange={(e) => set('gender', e.target.value)} className={selectCls}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </Field>
              <Field label="Mobile Number">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+91 98XXXXXXXX"
                  className={inputCls}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="patient@example.com"
                  className={inputCls}
                />
              </Field>
              <Field label="Emergency Contact">
                <input
                  type="tel"
                  value={formData.emergency_contact}
                  onChange={(e) => set('emergency_contact', e.target.value)}
                  placeholder="+91 98XXXXXXXX"
                  className={inputCls}
                />
              </Field>
              <Field label="ABHA ID">
                <input
                  type="text"
                  value={formData.abha_id}
                  onChange={(e) => set('abha_id', e.target.value)}
                  placeholder="XX-XXXX-XXXX-XXXX"
                  className={inputCls}
                />
              </Field>
              <Field label="Address" full>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="Street, city, state, PIN…"
                  className={cn(inputCls, 'resize-none')}
                />
              </Field>
            </Section>

            {/* MEDICAL */}
            <Section title="Medical Information">
              <Field label="Blood Group">
                <select value={formData.blood_group} onChange={(e) => set('blood_group', e.target.value)} className={selectCls}>
                  <option value="">Select</option>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </Field>
              <Field label="Height (cm)">
                <input
                  type="number" step="0.1" min="0"
                  value={formData.height_cm}
                  onChange={(e) => set('height_cm', e.target.value)}
                  placeholder="170"
                  className={inputCls}
                />
              </Field>
              <Field label="Weight (kg)">
                <input
                  type="number" step="0.1" min="0"
                  value={formData.weight_kg}
                  onChange={(e) => set('weight_kg', e.target.value)}
                  placeholder="65"
                  className={inputCls}
                />
              </Field>
              <Field label="Allergies" full>
                <textarea
                  rows={2}
                  value={formData.allergies}
                  onChange={(e) => set('allergies', e.target.value)}
                  placeholder="Penicillin, peanuts…"
                  className={cn(inputCls, 'resize-none')}
                />
              </Field>
              <Field label="Existing Diseases" full>
                <textarea
                  rows={2}
                  value={formData.existing_diseases}
                  onChange={(e) => set('existing_diseases', e.target.value)}
                  placeholder="Diabetes, hypertension…"
                  className={cn(inputCls, 'resize-none')}
                />
              </Field>
            </Section>

            {/* HOSPITAL */}
            <Section title="Hospital & Assignment">
              <Field label="Hospital">
                <select value={formData.hospital_id} onChange={(e) => set('hospital_id', e.target.value)} className={selectCls}>
                  <option value="">Select Hospital</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>{h.name} ({h.hospital_id})</option>
                  ))}
                </select>
              </Field>
              <Field label="Assigned Doctor">
                <select value={formData.assigned_doctor} onChange={(e) => set('assigned_doctor', e.target.value)} className={selectCls}>
                  <option value="">Unassigned</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.full_name}{d.department ? ` — ${d.department}` : ''}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select value={formData.status} onChange={(e) => set('status', e.target.value)} className={selectCls}>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="discharged">Discharged</option>
                  <option value="critical">Critical</option>
                </select>
              </Field>
            </Section>

            {/* SYSTEM */}
            <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 flex gap-3">
              <AlertCircle className="text-indigo-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-black text-indigo-700 mb-1">System Fields</p>
                <p className="text-xs font-bold text-indigo-600/80 leading-relaxed">
                  Patient ID is auto-generated on creation. NFC card can be assigned from the patient list after saving.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] py-4 rounded-2xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 disabled:opacity-60 transition-all"
            >
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Patient'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary">{title}</h3>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div className={cn('space-y-1.5', full && 'col-span-2')}>
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-primary/20 placeholder:text-slate-300 transition-all';
const selectCls = `${inputCls} appearance-none cursor-pointer`;

function genderLabel(g) {
  if (g === 'M') return 'Male';
  if (g === 'F') return 'Female';
  if (g === 'O') return 'Other';
  return g || '—';
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default PatientManagement;
