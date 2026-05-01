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
import { dashboardAPI } from "../../services/api";
import { getDoctorDashboard } from "../../services/offlineService";
import desktopAPI from "../../services/desktopAPI";
import NfcPatientPanel from "../nfc/NfcPatientPanel";
import DesktopNfcPanel from "../nfc/DesktopNfcPanel";

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

export default function DoctorDashboard() {
  const [activePanel, setActivePanel] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // Offline-first: tries API, falls back to local cache
        const result = await getDoctorDashboard();
        setData(result.data);
      } catch (err) {
        console.error("Doctor dashboard fetch failed, using fallback");
        setData({
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
            confidence: "94%"
          }
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return (
     <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
     </div>
  );


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

                {desktopAPI.isElectron ? (
                  <DesktopNfcPanel role="doctor" />
                ) : (
                  <NfcPatientPanel role="doctor" />
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
                            <h4 className="text-lg font-bold">Medha AI Insight</h4>
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