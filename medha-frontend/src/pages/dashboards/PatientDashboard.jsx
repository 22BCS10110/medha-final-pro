import { useState } from "react";
import DashboardHeader from "../../components/layout/DashboardNav";
import Sidebar from "../../components/layout/Sidebar";
import { 
  Heart, 
  Activity, 
  Thermometer, 
  Pill, 
  FileText, 
  Calendar, 
  CreditCard, 
  ArrowRight,
  ChevronRight,
  MoreVertical,
  Bell,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

const VitalCard = ({ label, value, unit, icon: Icon, color, trend }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
  >
    <div className="flex justify-between items-start mb-6">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner", color)}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className={cn(
          "text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest",
          trend === 'Normal' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
        )}>
          {trend}
        </span>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <div className="flex items-baseline gap-1">
        <h3 className="text-3xl font-display font-bold text-slate-900 tracking-tighter">{value}</h3>
        <span className="text-xs font-bold text-slate-400 uppercase">{unit}</span>
      </div>
    </div>
  </motion.div>
);

export default function PatientDashboard() {
  const [activePanel, setActivePanel] = useState("overview");

  const panels = {
    overview: { title: "Good Morning, Priya", subtitle: "Personal Health Intelligence" },
    records: { title: "Digital Records", subtitle: "Your Medical History" },
    prescriptions: { title: "My Medications", subtitle: "Prescription Management" },
    bills: { title: "Billing & Receipts", subtitle: "Financial History" },
    profile: { title: "Personal Profile", subtitle: "Account & Health Identity" },
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="patient" activePanel={activePanel} onPanelChange={setActivePanel} />
      
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
                {/* Profile Brief */}
                <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
                   <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                      <div className="w-24 h-24 rounded-[2rem] bg-emerald-500 text-white flex items-center justify-center font-display font-bold text-3xl shadow-xl ring-8 ring-white/5">
                         PS
                      </div>
                      <div className="text-center md:text-left">
                         <h2 className="text-3xl font-display font-bold mb-1">Priya Sharma</h2>
                         <p className="text-emerald-400 font-bold text-xs uppercase tracking-[0.2em] mb-4">Patient ID: MHD-4521 · B+</p>
                         <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/5 text-[10px] uppercase font-black tracking-widest">Active Patient</span>
                            <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/5 text-[10px] uppercase font-black tracking-widest">City Hospital</span>
                            <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/5 text-[10px] uppercase font-black tracking-widest">HIPAA Verified</span>
                         </div>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 relative z-10 w-full md:w-auto">
                      <div className="p-5 rounded-[2rem] bg-white/5 border border-white/10 text-center">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Last Visit</p>
                         <p className="text-lg font-bold">18 Mar 2025</p>
                      </div>
                      <div className="p-5 rounded-[2rem] bg-white/10 border border-white/10 text-center ring-2 ring-emerald-500/50">
                         <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Next Appt</p>
                         <p className="text-lg font-bold">18 Apr 2025</p>
                      </div>
                   </div>

                   {/* Background Glow */}
                   <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
                </div>

                {/* Vitals Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <VitalCard label="Heart Rate" value="72" unit="BPM" icon={Heart} color="bg-red-50 text-red-500" trend="Normal" />
                   <VitalCard label="Blood Pressure" value="128/84" unit="mmHg" icon={Activity} color="bg-sky-50 text-sky-500" trend="Slightly Elevated" />
                   <VitalCard label="SPO2" value="98" unit="%" icon={Activity} color="bg-emerald-50 text-emerald-500" trend="Normal" />
                   <VitalCard label="Temperature" value="98.4" unit="°F" icon={Thermometer} color="bg-amber-50 text-amber-500" trend="Normal" />
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                   {/* Appointments Panel */}
                   <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                         <h3 className="text-xl font-bold text-slate-900">Health History</h3>
                         <button onClick={() => setActivePanel("records")} className="text-xs font-bold text-primary uppercase tracking-widest hover:underline">View All Records</button>
                      </div>
                      <div className="overflow-x-auto">
                         <table className="w-full">
                            <thead>
                               <tr className="bg-slate-50/30">
                                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date</th>
                                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Diagnosis / Visit</th>
                                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Doctor</th>
                                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Report</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm">
                               {[
                                 { date: "18 Mar 2025", title: "Hypertension Follow-up", dr: "Dr. Arvind Mehta", type: "Follow-up" },
                                 { date: "12 Jan 2025", title: "ECG + Complete Blood Panel", dr: "Dr. Arvind Mehta", type: "Diagnostic" },
                                 { date: "5 Dec 2024", title: "General Health Checkup", dr: "Dr. Rajesh Singh", type: "Routine" },
                               ].map((visit, i) => (
                                 <tr key={i} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                    <td className="px-8 py-5 font-bold text-slate-400">{visit.date}</td>
                                    <td className="px-8 py-5 font-bold text-slate-900">{visit.title}</td>
                                    <td className="px-8 py-5 font-medium text-slate-600">{visit.dr}</td>
                                    <td className="px-8 py-5 text-right">
                                       <button className="text-xs font-bold text-primary px-4 py-1.5 rounded-lg border border-primary/10 bg-primary/5 hover:bg-primary hover:text-white transition-all">Download PDF</button>
                                    </td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>

                   {/* Prescriptions Brief */}
                   <div className="space-y-6">
                      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                           <h3 className="text-lg font-bold text-slate-900">Direct Delivery</h3>
                           <Pill size={20} className="text-primary" />
                        </div>
                        <div className="space-y-4">
                           {[
                             { name: "Amlodipine 5mg", dosage: "Once Daily", days: "30 days left" },
                             { name: "Metoprolol 25mg", dosage: "Twice Daily", days: "60 days left" },
                           ].map((item, i) => (
                              <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group">
                                 <div>
                                    <p className="font-bold text-slate-900">{item.name}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.dosage}</p>
                                 </div>
                                 <span className="text-[10px] font-bold text-emerald-600">{item.days}</span>
                              </div>
                           ))}
                           <button className="w-full mt-4 py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all">Reorder from Pharmacy</button>
                        </div>
                      </div>

                      <div className="p-8 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 relative overflow-hidden group">
                         <div className="relative z-10">
                            <h4 className="font-bold text-indigo-900 mb-2">ABHA Card Integrated</h4>
                            <p className="text-xs text-indigo-600 leading-relaxed mb-4">Your digital health identity is synchronized with the National Health Authority.</p>
                            <button className="text-xs font-bold text-indigo-900 underline group-hover:no-underline transition-all">View Digital Identity →</button>
                         </div>
                         <Star className="absolute bottom-[-10px] right-[-10px] text-indigo-200 opacity-20" size={80} />
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
                     <FileText size={40} />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">Expanding Your Health Records</h3>
                  <p className="text-slate-500 max-w-sm">We are integrating your full history from the Medhā Healthcare Cloud. Please wait.</p>
               </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}