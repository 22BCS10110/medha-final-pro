/**
 * ABDMConsentDashboard — Full ABDM Consent Management UI
 * ========================================================
 * This is the centerpiece UI for the ABDM demo. It shows:
 * - ABDM Ready status badges
 * - ABHA ID management
 * - Active consent requests (with approve/deny/revoke)
 * - Data fetch via FHIR
 * - Audit trail
 *
 * Used by: Doctors (request data), Admins (overview), Patients (approve)
 */
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, FileSearch, UserCheck, Clock, CheckCircle2,
  XCircle, AlertTriangle, Send, Eye, RefreshCw, Activity,
  Fingerprint, BadgeCheck, Lock, Unlock, ChevronDown, ChevronRight,
  FileText, Pill, Stethoscope, Heart, ClipboardList
} from "lucide-react";
import { cn } from "../../utils/cn";
import abdmAPI from "../../services/abdmService";

// ═══════════════════════════════════════════════════════════════
// STATUS BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════
const StatusBadge = ({ status }) => {
  const config = {
    REQUESTED: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Clock, label: "Pending" },
    GRANTED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2, label: "Approved" },
    DENIED: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", icon: XCircle, label: "Denied" },
    REVOKED: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300", icon: Lock, label: "Revoked" },
    EXPIRED: { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-300", icon: Clock, label: "Expired" },
  };
  const c = config[status] || config.REQUESTED;
  const Icon = c.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border", c.bg, c.text, c.border)}>
      <Icon size={12} />
      {c.label}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════
// ABDM READY BADGE
// ═══════════════════════════════════════════════════════════════
const ABDMReadyBadge = () => (
  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-200">
    <ShieldCheck size={16} />
    ABDM Ready
  </div>
);

// ═══════════════════════════════════════════════════════════════
// CONSENT REQUEST FORM
// ═══════════════════════════════════════════════════════════════
const ConsentRequestForm = ({ onSubmit, loading }) => {
  const [form, setForm] = useState({
    patient_abha_id: "",
    purpose: "CAREMGT",
    hi_types: ["Prescription", "DiagnosticReport"],
    date_range_from: new Date().toISOString().split("T")[0],
    date_range_to: new Date().toISOString().split("T")[0],
  });

  const purposeOptions = [
    { value: "CAREMGT", label: "Care Management" },
    { value: "BTG", label: "Break the Glass (Emergency)" },
    { value: "PUBHLTH", label: "Public Health" },
    { value: "HPAYMT", label: "Healthcare Payment" },
    { value: "DSRCH", label: "Disease Specific Research" },
  ];

  const hiTypeOptions = [
    { value: "Prescription", label: "Prescriptions" },
    { value: "DiagnosticReport", label: "Diagnostic Reports" },
    { value: "DischargeSummary", label: "Discharge Summary" },
    { value: "OPConsultation", label: "OP Consultation" },
    { value: "ImmunizationRecord", label: "Immunization Records" },
    { value: "WellnessRecord", label: "Wellness Records" },
  ];

  const toggleHiType = (type) => {
    setForm((prev) => ({
      ...prev,
      hi_types: prev.hi_types.includes(type)
        ? prev.hi_types.filter((t) => t !== type)
        : [...prev.hi_types, type],
    }));
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
          <Send size={22} />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900">Request Patient Data</h3>
          <p className="text-xs text-slate-500 font-medium">Enter ABHA ID to initiate consent-based data access</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* ABHA ID Input */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1 mb-2 block">Patient ABHA ID</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Fingerprint size={18} />
            </div>
            <input
              type="text"
              value={form.patient_abha_id}
              onChange={(e) => setForm({ ...form, patient_abha_id: e.target.value })}
              placeholder="XX-XXXX-XXXX-XXXX"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 font-mono font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1 mb-2 block">Purpose of Request</label>
          <select
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none"
          >
            {purposeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* HI Types */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1 mb-2 block">Health Information Types</label>
          <div className="flex flex-wrap gap-2">
            {hiTypeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleHiType(opt.value)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all border",
                  form.hi_types.includes(opt.value)
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1 mb-2 block">From Date</label>
            <input
              type="date"
              value={form.date_range_from}
              onChange={(e) => setForm({ ...form, date_range_from: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1 mb-2 block">To Date</label>
            <input
              type="date"
              value={form.date_range_to}
              onChange={(e) => setForm({ ...form, date_range_to: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none"
            />
          </div>
        </div>

        <button
          onClick={() => onSubmit(form)}
          disabled={loading || !form.patient_abha_id}
          className="w-full premium-gradient text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
          {loading ? "Sending Request..." : "Request Consent via ABDM"}
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// CONSENT CARD
// ═══════════════════════════════════════════════════════════════
const ConsentCard = ({ consent, onApprove, onDeny, onRevoke, onFetchData, role }) => {
  const [expanded, setExpanded] = useState(false);
  const [fhirData, setFhirData] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  const handleFetch = async () => {
    setFetchLoading(true);
    try {
      const res = await abdmAPI.fetchHealthData(consent.consent_request_id);
      setFhirData(res.data);
      if (onFetchData) onFetchData(res.data);
    } catch (err) {
      console.error("Data fetch failed:", err);
    } finally {
      setFetchLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <ClipboardList size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{consent.consent_request_id}</p>
              <p className="font-bold text-slate-900">{consent.patient_name}</p>
            </div>
          </div>
          <StatusBadge status={consent.status} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ABHA ID</p>
            <p className="text-sm font-mono font-bold text-primary">{consent.patient_abha_id}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Purpose</p>
            <p className="text-sm font-bold text-slate-700">{consent.purpose}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requested By</p>
            <p className="text-sm font-bold text-slate-700">{consent.requester_doctor_name}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hospital</p>
            <p className="text-sm font-bold text-slate-700">{consent.requester_hospital_name}</p>
          </div>
        </div>

        {/* HI Types tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(consent.hi_types || []).map((type) => (
            <span key={type} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              {type}
            </span>
          ))}
        </div>

        {/* Date range */}
        <p className="text.xs text-slate-500 font-medium mb-4">
          Data range: <span className="font-bold text-slate-700">{consent.date_range_from}</span> to <span className="font-bold text-slate-700">{consent.date_range_to}</span>
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {consent.status === "REQUESTED" && (
            <>
              <button
                onClick={() => onApprove(consent.consent_request_id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all shadow-sm"
              >
                <CheckCircle2 size={14} /> Approve
              </button>
              <button
                onClick={() => onDeny(consent.consent_request_id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-all shadow-sm"
              >
                <XCircle size={14} /> Deny
              </button>
            </>
          )}
          {consent.status === "GRANTED" && (
            <>
              <button
                onClick={handleFetch}
                disabled={fetchLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
              >
                {fetchLoading ? <RefreshCw size={14} className="animate-spin" /> : <FileSearch size={14} />}
                {fetchLoading ? "Fetching..." : "Fetch FHIR Data"}
              </button>
              <button
                onClick={() => onRevoke(consent.consent_request_id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
              >
                <Lock size={14} /> Revoke
              </button>
            </>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 px-3 py-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold transition-all ml-auto"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Details
          </button>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 bg-slate-50/50 p-6"
          >
            <pre className="text-xs text-slate-600 font-mono bg-white p-4 rounded-xl border border-slate-200 overflow-x-auto max-h-96">
              {JSON.stringify(consent, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FHIR Data Display */}
      <AnimatePresence>
        {fhirData && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-emerald-100 bg-emerald-50/30 p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <BadgeCheck size={16} className="text-emerald-600" />
              <h4 className="text-sm font-black text-emerald-800">FHIR Health Data Bundle</h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                {fhirData.fhir_bundle?.total || 0} resources
              </span>
            </div>

            {/* Render FHIR entries nicely */}
            <div className="space-y-3">
              {(fhirData.fhir_bundle?.entry || []).map((entry, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-emerald-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {entry.resource?.resourceType === "Patient" && <Heart size={14} className="text-rose-500" />}
                    {entry.resource?.resourceType === "MedicationRequest" && <Pill size={14} className="text-indigo-500" />}
                    {entry.resource?.resourceType === "DiagnosticReport" && <FileText size={14} className="text-amber-500" />}
                    {entry.resource?.resourceType === "Encounter" && <Stethoscope size={14} className="text-primary" />}
                    {entry.resource?.resourceType === "Observation" && <Activity size={14} className="text-teal-500" />}
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      {entry.resource?.resourceType}
                    </span>
                  </div>
                  <pre className="text-[10px] text-slate-500 font-mono overflow-x-auto">
                    {JSON.stringify(entry.resource, null, 2).substring(0, 500)}
                    {JSON.stringify(entry.resource, null, 2).length > 500 ? "..." : ""}
                  </pre>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════
const ABDMConsentDashboard = ({ role = "doctor" }) => {
  const [consents, setConsents] = useState([]);
  const [abdmStatus, setAbdmStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [consentsRes, statusRes] = await Promise.all([
        abdmAPI.listConsents(),
        abdmAPI.getStatus(),
      ]);
      setConsents(consentsRes.data);
      setAbdmStatus(statusRes.data);
    } catch (err) {
      console.error("ABDM data fetch failed:", err);
      // Use fallback empty state
      setConsents([]);
      setAbdmStatus({
        total_abha_records: 0, total_consent_requests: 0,
        pending_consents: 0, granted_consents: 0, denied_consents: 0,
        total_data_fetches: 0, audit_log_entries: 0,
        simulation_mode: true, abdm_gateway_status: 'SIMULATED',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateConsent = async (formData) => {
    setSubmitLoading(true);
    try {
      await abdmAPI.createConsent(formData);
      showToast("Consent request sent successfully!");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to create consent request", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleApprove = async (consentId) => {
    try {
      await abdmAPI.approveConsent(consentId);
      showToast("Consent APPROVED ✓ — Doctor can now access data");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to approve", "error");
    }
  };

  const handleDeny = async (consentId) => {
    try {
      await abdmAPI.denyConsent(consentId);
      showToast("Consent DENIED — Data access blocked");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to deny", "error");
    }
  };

  const handleRevoke = async (consentId) => {
    try {
      await abdmAPI.revokeConsent(consentId);
      showToast("Consent REVOKED — Doctor access terminated");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to revoke", "error");
    }
  };

  const filteredConsents = activeTab === "all"
    ? consents
    : consents.filter((c) => c.status === activeTab.toUpperCase());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-6 right-6 z-[9999] px-6 py-4 rounded-2xl shadow-xl font-bold text-sm max-w-md",
              toast.type === "error" ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
            )}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">ABDM Consent Manager</h2>
            <ABDMReadyBadge />
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Ayushman Bharat Digital Mission — Consent-based health data access
            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase">Simulation Mode</span>
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-all"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {abdmStatus && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: "ABHA Records", value: abdmStatus.total_abha_records, icon: UserCheck, color: "text-primary bg-primary/10" },
            { label: "Pending", value: abdmStatus.pending_consents, icon: Clock, color: "text-amber-600 bg-amber-50" },
            { label: "Granted", value: abdmStatus.granted_consents, icon: Unlock, color: "text-emerald-600 bg-emerald-50" },
            { label: "Denied", value: abdmStatus.denied_consents, icon: XCircle, color: "text-rose-600 bg-rose-50" },
            { label: "Data Fetches", value: abdmStatus.total_data_fetches, icon: FileSearch, color: "text-indigo-600 bg-indigo-50" },
            { label: "Audit Entries", value: abdmStatus.audit_log_entries, icon: Activity, color: "text-teal-600 bg-teal-50" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", stat.color)}>
                <stat.icon size={18} />
              </div>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Consent Request Form (for doctors) */}
        <div className="lg:col-span-1">
          <ConsentRequestForm onSubmit={handleCreateConsent} loading={submitLoading} />

          {/* ABDM Info Card */}
          <div className="mt-6 p-6 rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck size={24} className="text-emerald-400" />
              <h3 className="text-base font-black">ABDM Compliance</h3>
            </div>
            <ul className="space-y-2 text-xs font-medium text-slate-300">
              <li className="flex gap-2 items-start">
                <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" /> ABHA ID as Primary Identifier
              </li>
              <li className="flex gap-2 items-start">
                <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" /> Consent Mandatory for Data Access
              </li>
              <li className="flex gap-2 items-start">
                <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" /> FHIR R4 Data Interoperability
              </li>
              <li className="flex gap-2 items-start">
                <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" /> Immutable Audit Trail
              </li>
              <li className="flex gap-2 items-start">
                <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" /> Role-Based Access Control
              </li>
              <li className="flex gap-2 items-start">
                <AlertTriangle size={12} className="text-amber-400 mt-0.5 shrink-0" /> Simulation Mode Active
              </li>
            </ul>
          </div>
        </div>

        {/* Right: Consent List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { key: "all", label: "All" },
              { key: "requested", label: "Pending" },
              { key: "granted", label: "Approved" },
              { key: "denied", label: "Denied" },
              { key: "revoked", label: "Revoked" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  activeTab === tab.key
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {tab.label}
                {tab.key !== "all" && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">
                    {consents.filter((c) => tab.key === "all" || c.status === tab.key.toUpperCase()).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Consent Cards */}
          {filteredConsents.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-12 text-center">
              <ShieldCheck size={48} className="text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Consent Requests</h3>
              <p className="text-sm text-slate-500">
                Use the form to request patient data via ABHA ID. The consent flow will simulate real ABDM behavior.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConsents.map((consent) => (
                <ConsentCard
                  key={consent.id}
                  consent={consent}
                  role={role}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                  onRevoke={handleRevoke}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ABDMConsentDashboard;
