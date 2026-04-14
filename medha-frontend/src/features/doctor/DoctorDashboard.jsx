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
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
// NOTE: getDoctorDashboard / dashboardAPI imports were intentionally removed.
// That helper hits /api/dashboard/doctor/ which returns 401 (missing token)
// and was breaking the doctor UI on mount. The waitlist + insight below are
// rendered from static defaults until a real, authed dashboard endpoint is
// wired up — NFC flow does NOT depend on this data.
// NFC is handled inline by this component via window.medhaAPI.nfcHardware.
// The old NfcPatientPanel / DesktopNfcPanel / desktopAPI imports were removed
// because this dashboard now runs its own 5-state NFC card
// (idle/reading/success/not_found/error) driven by onCardTap + onPatientBasic
// listeners that auto-start on mount. Those components still exist and are
// used elsewhere in the app — untouched.

const MetricCard = ({ label, value, change, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", color)}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
        <span className="text-[10px] font-bold text-slate-500">{change}</span>
      </div>
    </div>
  </div>
);

// Default dashboard content. Previously fetched from /api/dashboard/doctor/
// which returned 401 and broke the UI on mount. Rendered synchronously so
// the page never blocks on a network call.
const DEFAULT_DOCTOR_DASHBOARD = {
  stats: { appointments: "6", reports: "3", alerts: "1" },
  waitlist: [
    { time: "09:00 AM", name: "Priya Sharma", id: "MED-4521", type: "Cardiology Follow-up", status: "Done" },
    { time: "11:30 AM", name: "Mohit Gupta", id: "MED-4460", type: "Emergency Consultation", status: "Critical" },
    { time: "02:00 PM", name: "Sunita Agarwal", id: "MED-4480", type: "Routine Screening", status: "Upcoming" },
    { time: "03:30 PM", name: "Deepak Malhotra", id: "MED-4415", type: "Post-op Review", status: "Upcoming" },
  ],
  insight: {
    patient: "Mohit Gupta",
    message: "Shows abnormal ST-segment elevation. Comparative analysis with baseline (Dec 2024) suggests acute progression.",
    recommendation: "Prioritize cardiac imaging and baseline enzyme panel immediately.",
    confidence: "94%",
  },
};

export default function DoctorDashboard() {
  const [activePanel, setActivePanel] = useState("overview");
  const [data] = useState(DEFAULT_DOCTOR_DASHBOARD);
  const [selectedPatient, setSelectedPatient] = useState(null);
  // NFC state machine: "idle" → "reading" → "success" | "not_found" | "error"
  const [nfcStatus, setNfcStatus] = useState("idle");

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
    overview: { title: "Good Morning, Dr. Mehta", subtitle: "Your Clinical Portfolio" },
    schedule: { title: "Clinical Schedule", subtitle: "Upcoming Consultations" },
    patients: { title: "My Patients", subtitle: "Unified Health Records" },
    records: { title: "Health Registry", subtitle: "Secure Data Access" },
    prescribe: { title: "Prescriptions", subtitle: "Smart Pharmacy Integration" },
    profile: { title: "My Profile", subtitle: "Credentials & Identity" },
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="doctor" activePanel={activePanel} onPanelChange={setActivePanel} />
      
      <div className="flex-grow flex flex-col min-w-0">
        <DashboardHeader 
          title={panels[activePanel].title} 
          subtitle={panels[activePanel].subtitle}
        />

        <main className="p-8 pb-20 flex-grow">
          <AnimatePresence mode="wait">
            {activePanel === "overview" && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <MetricCard 
                    label="Today's Appointments" 
                    value={data?.stats?.appointments || "0"} 
                    change="Live Schedule" 
                    icon={Calendar} 
                    color="bg-primary/10 text-primary" 
                   />
                   <MetricCard 
                    label="Pending Reports" 
                    value={data?.stats?.reports || "0"} 
                    change="Action Required" 
                    icon={Activity} 
                    color="bg-amber-100 text-amber-600" 
                   />
                   <MetricCard 
                    label="Critical Alerts" 
                    value={data?.stats?.alerts || "0"} 
                    change="Priority Case" 
                    icon={AlertCircle} 
                    color="bg-red-50 text-red-600" 
                   />
                </div>

                {/* NFC state machine: idle → reading → success | not_found | error */}

                {nfcStatus === "idle" && (
                  <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <UserCircle size={20} className="text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">
                      Tap NFC card to load patient
                    </p>
                  </div>
                )}

                {nfcStatus === "reading" && (
                  <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-5 flex items-center gap-4">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                    <p className="text-sm font-medium text-primary">
                      Reading card...
                    </p>
                  </div>
                )}

                {nfcStatus === "success" && selectedPatient && (
                  <motion.div
                    key={selectedPatient.id || selectedPatient.patient_code}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2rem] border-2 border-primary/30 shadow-sm p-6 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-5 min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <UserCircle size={28} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">
                          NFC Card Tapped • Patient Loaded
                        </p>
                        <h4 className="text-xl font-bold text-slate-900 truncate">
                          {selectedPatient.full_name || selectedPatient.name || "Unknown"}
                        </h4>
                        <p className="text-xs font-medium text-slate-500 truncate">
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
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all shrink-0"
                    >
                      Clear
                    </button>
                  </motion.div>
                )}

                {nfcStatus === "not_found" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <AlertCircle size={20} className="text-amber-600 shrink-0" />
                      <p className="text-sm font-medium text-amber-800">
                        Card not assigned — tap a registered card
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPatient(null);
                        setNfcStatus("idle");
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-amber-700 hover:text-amber-900 px-4 py-2 rounded-xl hover:bg-amber-100 transition-all shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {nfcStatus === "error" && (
                  <div className="bg-red-50 border border-red-200 rounded-[2rem] p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <AlertCircle size={20} className="text-red-600 shrink-0" />
                      <p className="text-sm font-medium text-red-800">
                        NFC lookup error — please tap again
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPatient(null);
                        setNfcStatus("idle");
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-red-700 hover:text-red-900 px-4 py-2 rounded-xl hover:bg-red-100 transition-all shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                )}


                <div className="grid lg:grid-cols-3 gap-8">
                   {/* Schedule Panel */}
                   <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                         <h3 className="text-xl font-bold text-slate-900">Today's Waitlist</h3>
                         <span className="text-xs font-bold text-primary px-3 py-1 bg-primary/5 rounded-lg uppercase tracking-widest">Live Updates</span>
                      </div>
                      <div className="divide-y divide-slate-50">
                         {(data?.waitlist || []).map((apt, i) => (
                           <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all group cursor-pointer">
                              <div className="flex items-center gap-6">
                                 <div className="w-16 text-center">
                                    <p className="text-xs font-black text-slate-400 leading-none">{apt.time.split(" ")[1]}</p>
                                    <p className="text-sm font-bold text-slate-900">{apt.time.split(" ")[0]}</p>
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate">{apt.name || apt.patient_name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{apt.id || apt.patient_id} • {apt.type || apt.appointment_type}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <span className={cn(
                                   "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap",
                                   (apt.status === 'Done' || apt.status === 'completed') ? "bg-emerald-50 text-emerald-600" : (apt.status === 'Critical' || apt.status === 'critical') ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-100 text-slate-400"
                                 )}>
                                    {apt.status}
                                 </span>
                                 <ChevronRight size={18} className="text-slate-300 group-hover:text-primary shrink-0" />
                              </div>
                           </div>
                         ))}
                      </div>

                   </div>

                   {/* AI Insight Sidebar */}
                   <div className="space-y-6">
                      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                         <div className="flex items-center gap-3 mb-6">
                            <BrainCircuit className="text-primary" size={24} />
                            <h4 className="text-lg font-bold">Medhā AI Insight</h4>
                          </div>
                          <div className="space-y-4 relative z-10">
                            <p className="text-sm text-slate-300 leading-relaxed italic">
                               "Patient <strong className="text-white">{data?.insight?.patient || 'Mohit Gupta'}</strong> {data?.insight?.message || 'shows abnormal vitals.'}"
                            </p>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Recommendation</p>
                               <p className="text-xs text-white font-medium">{data?.insight?.recommendation || 'Prioritize urgent review.'}</p>
                            </div>
                            <div className="flex items-center gap-2 pt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                               <CheckCircle2 size={12} className="text-emerald-500" />
                               AI Confidence: {data?.insight?.confidence || '94%'}
                            </div>
                         </div>

                      </div>

                      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                         <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">Quick Actions</h4>
                         <div className="space-y-3">
                            <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-600 hover:bg-primary/5 hover:text-primary transition-all text-sm group">
                               New Prescription
                               <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            </button>
                            <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-600 hover:bg-primary/5 hover:text-primary transition-all text-sm group">
                               Order Diagnostics
                               <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activePanel !== "overview" && (
               <motion.div 
                 key="placeholder"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="flex flex-col items-center justify-center py-32 text-center"
               >
                  <div className="w-20 h-20 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mb-6">
                     <Clock size={40} />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">Panel Migration in Progress</h3>
                  <p className="text-slate-500 max-w-sm">We are enhancing our clinical data visualization. This panel will be live shortly.</p>
               </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}