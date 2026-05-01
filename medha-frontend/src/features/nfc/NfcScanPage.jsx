import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { Nfc, Search, User, Heart, AlertCircle } from "lucide-react";

export default function NfcScanPage() {
  const { user } = useAuth();
  const [patientId, setPatientId] = useState("");
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // NFC state machine: "waiting" → "reading" → "success" | "not_found" | "error"
  // Starts in "waiting" because the listener auto-arms on mount.
  const [nfcStatus, setNfcStatus] = useState("waiting");

  const fetchPatient = async (id) => {
    if (!id.trim()) return;
    setLoading(true);
    setError("");
    setPatient(null);
    try {
      // Use Electron IPC proxy (handles base URL + auth token). Falls back
      // to raw fetch only when running in plain browser (no window.medhaAPI).
      let data;
      if (window.medhaAPI?.apiGet) {
        data = await window.medhaAPI.apiGet(`/patients/nfc-scan/?id=${encodeURIComponent(id)}`);
      } else {
        const API_BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
        const res = await fetch(`${API_BASE}/api/patients/nfc-scan/?id=${encodeURIComponent(id)}`);
        data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Patient not found");
      }
      if (data?.error) {
        setError(data.error);
      } else {
        setPatient(data);
      }
    } catch (e) {
      setError("Network error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Auto-scan: continuous NFC listener ───────────────────────────
  // Runs for the lifetime of the page. Each card tap:
  //   UID → local DB (getPatientByUID) → UUID → backend hydrate (apiGet)
  // Never removes the listener until unmount, no button required.
  useEffect(() => {
    console.log("[NFC] AUTO START ACTIVE (NfcScanPage)");
    console.log("medhaAPI:", window.medhaAPI);

    let off;

    // 🔥 DELAY attach — give preload + contextBridge time to fully inject
    // window.medhaAPI before subscribing. Safety net for cold page load.
    const timer = setTimeout(() => {
      console.log("[NFC] Initialising listener...");

      if (!window.medhaAPI?.nfcHardware) {
        console.error("[NFC] medhaAPI not ready");
        return;
      }

      off = window.medhaAPI.nfcHardware.onCardTap(async (evt) => {
        console.log("🔥 [FRONTEND NFC EVENT]:", evt);
        console.log("[NFC EVENT RECEIVED]:", evt);
      console.log("[NFC] Status:", evt?.status);
      console.log("[NFC] UID:", evt?.uid);
      console.log("[NFC] Patient:", evt?.patient);

      setError("");

      // ✅ CASE 1 — Backend already resolved the patient
      if (evt?.status === "success" && evt.patient) {
        console.log("[NFC] Patient from backend:", evt.patient);
        const p = evt.patient;
        setPatient({
          ...p,
          patient_code: p.patient_code || p.patient_id || p.id,
        });
        setNfcStatus("success");
        return;
      }

      // ✅ CASE 2 — UID fallback
      const uid = evt?.uid;
      if (!uid) return;

      setNfcStatus("reading");

      try {
        const local = await window.medhaAPI.db.getPatientByUID(uid);
        console.log("Patient:", local);

        if (!local) {
          setPatient(null);
          setNfcStatus("not_found");
          return;
        }

        // Show local record immediately so the UI is responsive offline.
        setPatient(local);
        setNfcStatus("success");

        // Hydrate from backend using UUID — NOT patient_code.
        try {
          const full = await window.medhaAPI.apiGet(`/patients/${local.id}/`);
          if (full && !full.error) {
            setPatient({
              ...full,
              patient_code: full.patient_code || full.patient_id || local.patient_code,
            });
          }
        } catch (apiErr) {
          console.warn("[NFC] Backend hydrate failed, keeping local record:", apiErr);
        }
      } catch (err) {
        console.error("[NFC] DB lookup failed:", err);
        setNfcStatus("error");
      }
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      off?.();
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchPatient(patientId);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Nfc size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">NFC Patient Lookup</h1>
            <p className="text-sm text-slate-500">Scan NFC card or enter Patient ID to fetch records</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="Scan NFC card or type Patient ID (e.g. MHD-4500)..."
              className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {/* NFC auto-scan status — always mounted, never hidden behind a button */}
        {nfcStatus === "waiting" && !patient && (
          <div className="flex items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 mb-4">
            <Nfc size={18} className="text-slate-400 animate-pulse" />
            <span className="font-medium text-sm">Waiting for NFC card...</span>
          </div>
        )}
        {nfcStatus === "reading" && (
          <div className="flex items-center gap-2 p-4 bg-primary/5 border border-primary/20 rounded-xl text-primary mb-4">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="font-medium text-sm">Reading card...</span>
          </div>
        )}
        {nfcStatus === "not_found" && (
          <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 mb-4">
            <AlertCircle size={18} />
            <span className="font-medium text-sm">Card not assigned</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl text-red-600 mb-6">
            <AlertCircle size={18} />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {patient && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Patient Header */}
            <div className="p-6 border-b border-slate-100 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <User size={28} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{patient.full_name}</h2>
                <p className="text-sm text-slate-500">{patient.patient_id}</p>
              </div>
            </div>

            {/* Patient Info Grid */}
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoCard label="Gender" value={{ M: "Male", F: "Female", O: "Other" }[patient.gender] || patient.gender} />
              <InfoCard label="Blood Group" value={patient.blood_group || "N/A"} />
              <InfoCard label="Phone" value={patient.phone || "N/A"} />
              <InfoCard label="Email" value={patient.email || "N/A"} />
              <InfoCard label="Status" value={patient.status} />
              <InfoCard label="ABHA ID" value={patient.abha_id || "N/A"} />
              <InfoCard label="Date of Birth" value={patient.date_of_birth || "N/A"} />
              <InfoCard label="Active Cards" value={patient.cards?.length || 0} />
            </div>

            {patient.allergies && (
              <div className="mx-6 mb-4 p-3 bg-amber-50 rounded-xl text-sm">
                <span className="font-semibold text-amber-800">Allergies:</span>{" "}
                <span className="text-amber-700">{patient.allergies}</span>
              </div>
            )}

            {patient.reason_for_visit && (
              <div className="mx-6 mb-6 p-3 bg-emerald-50 rounded-xl text-sm">
                <span className="font-semibold text-emerald-800">Reason for Visit:</span>{" "}
                <span className="text-emerald-700">{patient.reason_for_visit}</span>
              </div>
            )}

            {/* Hospital Visits */}
            {patient.hospital_visits?.length > 0 && (
              <div className="px-6 pb-6">
                <h3 className="font-bold text-slate-900 mb-3">Hospital Visits</h3>
                <div className="space-y-2">
                  {patient.hospital_visits.map((v, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="font-medium text-slate-700">{v.hospital__name}</span>
                      <span className="text-sm text-slate-400">
                        {new Date(v.visit_date).toLocaleDateString()}
                        {v.is_active && (
                          <span className="ml-2 text-emerald-600 font-semibold">Active</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="p-3 bg-slate-50 rounded-xl">
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}
