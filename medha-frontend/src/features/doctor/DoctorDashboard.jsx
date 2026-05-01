import { useState, useEffect } from "react";
import DashboardHeader from "../admin/DashboardNav";
import Sidebar from "../admin/Sidebar";
import { 
  Calendar, 
  Users, 
  Clock, 
  Activity, 
  FileText, 
  Pill, 
  UserCircle, 
  BrainCircuit, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  MoreHorizontal,
  Plus,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
import { dashboardAPI } from "../../services/api";
import PatientUploadsPanel from "./PatientUploadsPanel";

/* ─── Metric Card (matches Stitch: white bg, outline-variant border, rounded-xl, icon in circle) ─── */
const MetricCard = ({ label, value, change, icon: Icon, color, iconBg }) => (
  <div className="bg-white border border-[#c3c5d9] rounded-xl p-4 flex items-center gap-4 shadow-sm">
    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", iconBg)}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-[11px] font-medium text-[#434656] uppercase tracking-[0.03em]">{label}</p>
      <p className="text-[24px] font-semibold text-[#191c1e] leading-8 tracking-[-0.01em]">{value}</p>
    </div>
  </div>
);

/* ─── Waitlist Item (matches Stitch: avatar initials, name, type, time, status badge) ─── */
const WaitlistItem = ({ apt }) => {
  const name = apt.name || apt.patient_name || "Patient";
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const type = apt.type || apt.appointment_type || "";
  const time = apt.time || "";
  const status = apt.status || "";

  const statusStyle = 
    (status === 'Done' || status === 'completed') 
      ? "bg-[#d3e4fe] text-[#0b1c30]"
      : (status === 'Critical' || status === 'critical' || status === 'Priority') 
      ? "bg-[#ba1a1a] text-white"
      : (status === 'Waiting' || status === 'waiting')
      ? "bg-[#d3e4fe] text-[#38485d]"
      : "bg-[#eceef0] text-[#505f76]";

  return (
    <div className="flex items-center justify-between p-2 hover:bg-[#f2f4f6] rounded-lg transition-colors cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#c9e6ff] flex items-center justify-center text-[#004c6e] text-[12px] font-semibold tracking-wide">
          {initials}
        </div>
        <div>
          <p className="text-[12px] font-semibold text-[#191c1e] group-hover:text-[#003ec7] transition-colors tracking-wide">{name}</p>
          <p className="text-[13px] font-normal text-[#434656]">{type}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[11px] font-medium text-[#434656] tracking-wide">{time}</p>
        {status && (
          <span className={cn("inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide", statusStyle)}>
            {status}
          </span>
        )}
      </div>
    </div>
  );
};

const DEFAULT_DOCTOR_DASHBOARD = {
  stats: { appointments: "0", reports: "0", alerts: "0" },
  waitlist: [],
  insight: {
    patient: "—",
    message: "No AI insight available yet.",
    recommendation: "Tap an NFC card to load a patient and generate an insight.",
    confidence: "—",
  },
};

export default function DoctorDashboard() {
  const [activePanel, setActivePanel] = useState("overview");
  const [data, setData] = useState(DEFAULT_DOCTOR_DASHBOARD);
  const [selectedPatient, setSelectedPatient] = useState(null);
  // NFC state machine: "idle" → "reading" → "success" | "not_found" | "error"
  const [nfcStatus, setNfcStatus] = useState("idle");

  useEffect(() => {
    let cancelled = false;
    dashboardAPI.doctor()
      .then((res) => {
        if (cancelled) return;
        const live = res?.data || {};
        setData({
          stats: live.stats || DEFAULT_DOCTOR_DASHBOARD.stats,
          waitlist: live.waitlist || [],
          insight: live.insight || DEFAULT_DOCTOR_DASHBOARD.insight,
          hospital: live.hospital,
        });
      })
      .catch(() => {
        // Keep defaults — axios interceptor already handles 401 via refresh/logout.
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!window.medhaAPI?.nfcHardware) return;

    const off = window.medhaAPI.nfcHardware.onCardTap((evt) => {
      console.log("NFC EVENT:", evt);

      if (evt?.status === "reading") {
        setNfcStatus("reading");
        return;
      }

      if (evt?.status === "success" && evt.patient) {
        console.log("SETTING PATIENT:", evt.patient);
        setSelectedPatient(evt.patient);
        setNfcStatus("success");
        return;
      }

      if (evt?.status === "not_found") {
        setSelectedPatient(null);
        setNfcStatus("not_found");
        return;
      }

      if (evt?.status === "error") {
        setSelectedPatient(null);
        setNfcStatus("error");
        return;
      }
    });

    return () => off?.(); // VERY IMPORTANT
  }, []);

  // TEMP debug: confirm React actually commits the state update.
  useEffect(() => {
    console.log("PATIENT STATE UPDATED:", selectedPatient);
  }, [selectedPatient]);

  const panels = {
    overview: { title: "Good Morning, Dr. Mehta", subtitle: "Here is a summary of your clinical activities today." },
    schedule: { title: "Clinical Schedule", subtitle: "Upcoming Consultations" },
    patients: { title: "Patient Lookup", subtitle: "Unified Health Records" },
    records: { title: "Clinical Records", subtitle: "Manage and review all patient clinical documentation." },
    prescribe: { title: "Lab Results", subtitle: "Review diagnostics and results" },
    uploads: { title: "Patient Files", subtitle: "View and attach reports & prescription PDFs" },
    settings: { title: "Settings", subtitle: "System configuration" },
    profile: { title: "My Profile", subtitle: "Credentials & Identity" },
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();

  return (
    <div className="flex h-screen bg-[#f7f9fb] overflow-hidden">
      <Sidebar role="doctor" activePanel={activePanel} onPanelChange={setActivePanel} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader 
          title={panels[activePanel]?.title || "Dashboard"} 
          subtitle={panels[activePanel]?.subtitle}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activePanel === "overview" && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-7xl mx-auto space-y-6"
              >
                {/* Welcome + Date Row */}
                <section className="flex justify-between items-end">
                  <div>
                    <h2 className="text-[30px] font-semibold text-[#191c1e] leading-[38px] tracking-[-0.02em]">
                      Good Evening, Dr. Mehta
                    </h2>
                    <p className="text-[16px] font-normal text-[#434656] mt-1 leading-6">
                      Here is a summary of your clinical activities today.
                    </p>
                  </div>
                  <p className="text-[12px] font-semibold text-[#434656] uppercase tracking-wider hidden md:block">
                    {dateStr}
                  </p>
                </section>

                {/* Metric Cards (3-col grid) */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCard 
                    label="Today's Appointments" 
                    value={data?.stats?.appointments || "0"} 
                    icon={Calendar} 
                    iconBg="bg-[#0052ff] text-white"
                  />
                  <MetricCard 
                    label="Pending Reports" 
                    value={data?.stats?.reports || "0"} 
                    icon={Activity} 
                    iconBg="bg-[#006d9c] text-white"
                  />
                  <MetricCard 
                    label="New Patients" 
                    value={data?.stats?.alerts || "0"} 
                    icon={Users} 
                    iconBg="bg-[#d0e1fb] text-[#505f76]"
                  />
                </section>

                {/* NFC state machine: idle → reading → success | not_found | error */}

                {nfcStatus === "idle" && (
                  <div className="bg-[#f2f4f6] border border-[#c3c5d9] rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#c3c5d9] flex items-center justify-center shrink-0">
                      <UserCircle size={20} className="text-[#737688]" />
                    </div>
                    <p className="text-[14px] font-normal text-[#505f76]">
                      Tap NFC card to load patient
                    </p>
                  </div>
                )}

                {nfcStatus === "reading" && (
                  <div className="bg-[#dde1ff]/30 border border-[#b7c4ff] rounded-xl p-4 flex items-center gap-4">
                    <div className="w-5 h-5 border-2 border-[#003ec7] border-t-transparent rounded-full animate-spin shrink-0" />
                    <p className="text-[14px] font-medium text-[#003ec7]">
                      Reading card...
                    </p>
                  </div>
                )}

                {nfcStatus === "success" && selectedPatient && (
                  <motion.div
                    key={selectedPatient.id || selectedPatient.patient_code}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border-2 border-[#003ec7]/30 shadow-sm p-5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-[#dde1ff] text-[#003ec7] flex items-center justify-center shrink-0">
                        <UserCircle size={24} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-[#003ec7] uppercase tracking-[0.03em] mb-0.5">
                          NFC Card Tapped • Patient Loaded
                        </p>
                        <h4 className="text-xl font-semibold text-[#191c1e] truncate">
                          {selectedPatient.full_name || selectedPatient.name || "Unknown"}
                        </h4>
                        <p className="text-[13px] font-normal text-[#505f76] truncate">
                          {/* Display: prefer PAT-XXXX (human code). Internally, selectedPatient.id holds the UUID for API calls. */}
                          ID: {selectedPatient.patient_code || selectedPatient.patient_id || selectedPatient.id || "—"}
                          {selectedPatient.blood_group && ` • Blood: ${selectedPatient.blood_group}`}
                          {selectedPatient.age && ` • Age: ${selectedPatient.age}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPatient(null);
                        setNfcStatus("idle");
                      }}
                      className="text-[11px] font-semibold uppercase tracking-[0.03em] text-[#737688] hover:text-[#191c1e] px-3 py-2 rounded-lg hover:bg-[#f2f4f6] transition-all shrink-0"
                    >
                      Clear
                    </button>
                  </motion.div>
                )}

                {nfcStatus === "not_found" && (
                  <div className="bg-[#ffdad6]/30 border border-[#ffdad6] rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <AlertCircle size={18} className="text-[#ba1a1a] shrink-0" />
                      <p className="text-[14px] font-medium text-[#93000a]">
                        Card not assigned — tap a registered card
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPatient(null);
                        setNfcStatus("idle");
                      }}
                      className="text-[11px] font-semibold uppercase tracking-[0.03em] text-[#93000a] hover:bg-[#ffdad6]/50 px-3 py-2 rounded-lg transition-all shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {nfcStatus === "error" && (
                  <div className="bg-[#ffdad6]/30 border border-[#ffdad6] rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <AlertCircle size={18} className="text-[#ba1a1a] shrink-0" />
                      <p className="text-[14px] font-medium text-[#93000a]">
                        NFC lookup error — please tap again
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPatient(null);
                        setNfcStatus("idle");
                      }}
                      className="text-[11px] font-semibold uppercase tracking-[0.03em] text-[#93000a] hover:bg-[#ffdad6]/50 px-3 py-2 rounded-lg transition-all shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Main Bento Grid: AI Insight (2 cols) + Waitlist (1 col) */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* AI Clinical Insight Card (spans 2 cols — matches Stitch gradient card) */}
                  <div className="lg:col-span-2 bg-gradient-to-br from-[#dde1ff] to-[#b7c4ff] rounded-xl border border-[#b7c4ff] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    {/* Decorative background icon */}
                    <div className="absolute -right-6 -top-6 text-[#003ec7] opacity-10">
                      <Sparkles size={120} />
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-2 text-[#003ec7] mb-2">
                        <Sparkles size={16} />
                        <h3 className="text-[12px] font-semibold uppercase tracking-wider">AI Clinical Insight</h3>
                      </div>
                      <h4 className="text-[20px] font-semibold text-[#001452] leading-7 tracking-[-0.01em] mb-4">
                        {data?.insight?.message ? "Elevated Risk Profile Detected" : "No insights available"}
                      </h4>
                      <p className="text-[14px] font-normal text-[#0038b6] max-w-xl leading-5">
                        {data?.insight?.message 
                          ? <>Based on recent lab results and historical trends, patient <strong className="text-[#001452]">{data?.insight?.patient || "Patient"}</strong> {data?.insight?.message}</>
                          : data?.insight?.recommendation
                        }
                      </p>
                    </div>
                    <div className="relative z-10 mt-6 flex items-center gap-3">
                      <button className="bg-[#003ec7] text-white text-[12px] font-semibold tracking-wide py-2 px-6 rounded-lg hover:bg-[#0038b6] transition-colors shadow-sm">
                        Review Chart
                      </button>
                      <button className="bg-white text-[#003ec7] text-[12px] font-semibold tracking-wide py-2 px-6 rounded-lg border border-[#b7c4ff] hover:bg-[#f2f4f6] transition-colors">
                        Schedule Follow-up
                      </button>
                    </div>
                  </div>

                  {/* Today's Waitlist */}
                  <div className="bg-white border border-[#c3c5d9] rounded-xl p-6 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#eceef0]">
                      <h3 className="text-[20px] font-semibold text-[#191c1e] leading-7 tracking-[-0.01em]">Today's Waitlist</h3>
                      <button className="text-[#003ec7] hover:text-[#0038b6] text-[12px] font-semibold tracking-wide transition-colors">
                        View All
                      </button>
                    </div>
                    <div className="flex-1 space-y-2">
                      {(data?.waitlist || []).length === 0 ? (
                        <div className="text-center py-8">
                          <Clock size={32} className="text-[#c3c5d9] mx-auto mb-3" />
                          <p className="text-[13px] text-[#737688]">No patients in waitlist</p>
                        </div>
                      ) : (
                        (data?.waitlist || []).map((apt, i) => (
                          <WaitlistItem key={i} apt={apt} />
                        ))
                      )}
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activePanel === "uploads" && (
              <motion.div
                key="uploads"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <PatientUploadsPanel preloadedPatient={nfcStatus === "success" ? selectedPatient : null} />
              </motion.div>
            )}

            {activePanel !== "overview" && activePanel !== "uploads" && (
               <motion.div
                 key="placeholder"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="flex flex-col items-center justify-center py-32 text-center"
               >
                  <div className="w-20 h-20 rounded-xl bg-[#eceef0] text-[#737688] flex items-center justify-center mb-6">
                     <Clock size={40} />
                  </div>
                  <h3 className="text-[24px] font-semibold text-[#191c1e] mb-2 tracking-[-0.01em]">Panel Migration in Progress</h3>
                  <p className="text-[#505f76] max-w-sm text-[14px]">We are enhancing our clinical data visualization. This panel will be live shortly.</p>
               </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}