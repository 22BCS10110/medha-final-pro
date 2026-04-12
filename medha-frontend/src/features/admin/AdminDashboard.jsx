import { useState } from "react";
import DashboardHeader from "../../components/layout/DashboardNav";
import Sidebar from "../../components/layout/Sidebar";
import { 
  Users, 
  Stethoscope, 
  CreditCard, 
  TrendingUp, 
  Plus, 
  MoreVertical, 
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
import desktopAPI from "../../services/desktopAPI";
import NfcPatientPanel from "../nfc/NfcPatientPanel";
import DesktopNfcPanel from "../nfc/DesktopNfcPanel";

const MetricCard = ({ label, value, change, trend, icon: Icon, color }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
  >
    <div className="flex justify-between items-start mb-6">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", color)}>
        <Icon size={24} />
      </div>
      <button className="text-slate-300 hover:text-slate-600 transition-colors">
        <MoreVertical size={20} />
      </button>
    </div>
    <div className="space-y-1">
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
      <h3 className="text-3xl font-display font-bold text-slate-900">{value}</h3>
    </div>
    <div className="mt-4 flex items-center gap-2">
      <div className={cn(
        "flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full",
        trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
      )}>
        {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {change}
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">vs. last month</span>
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const [activePanel, setActivePanel] = useState("overview");

  const panels = {
    overview: { title: "Executive Overview", subtitle: "Strategic Hospital Insights" },
    doctors: { title: "Medical Staff", subtitle: "Directory & Performance" },
    receipts: { title: "Financial Ops", subtitle: "Billing & Collections" },
    billing: { title: "Revenue Cycle", subtitle: "Analytics & Forecasts" },
    reports: { title: "Intelligence", subtitle: "Operational Metrics" },
    settings: { title: "Hospital Settings", subtitle: "Configuration & Compliance" },
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="admin" activePanel={activePanel} onPanelChange={setActivePanel} />
      
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
                {/* Top Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <MetricCard 
                    label="Active Doctors" 
                    value="12" 
                    change="+2" 
                    trend="up" 
                    icon={Stethoscope} 
                    color="bg-primary/10 text-primary" 
                  />
                  <MetricCard 
                    label="Total Revenue" 
                    value="₹4.2M" 
                    change="12%" 
                    trend="up" 
                    icon={CreditCard} 
                    color="bg-emerald-50 text-emerald-600" 
                  />
                  <MetricCard 
                    label="Patient Satisfaction" 
                    value="4.8/5" 
                    change="0.2" 
                    trend="up" 
                    icon={TrendingUp} 
                    color="bg-amber-50 text-amber-600" 
                  />
                </div>

                {desktopAPI.isElectron ? (
                  <DesktopNfcPanel role="admin" />
                ) : (
                  <NfcPatientPanel role="admin" />
                )}

                {/* Main Table */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                   <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                      <div>
                         <h3 className="text-xl font-bold text-slate-900">Hospital Personnel</h3>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Staff directory & availability</p>
                      </div>
                      <button 
                        onClick={() => setActivePanel("doctors")}
                        className="bg-white text-slate-900 border border-slate-200 px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
                      >
                         Manage All Staff
                      </button>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full">
                         <thead>
                            <tr className="bg-slate-50/30">
                               <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Practitioner</th>
                               <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Specialization</th>
                               <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Department</th>
                               <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Status</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {[
                              { name: "Dr. Arvind Mehta", id: "DOC-001", spec: "Interventional Card.", dept: "Cardiology", status: "Active" },
                              { name: "Dr. Rajesh Singh", id: "DOC-002", spec: "Internal Medicine", dept: "General", status: "Active" },
                              { name: "Dr. Sunita Kapoor", id: "DOC-003", spec: "Joint Replacement", dept: "Orthopaedics", status: "On Leave" },
                              { name: "Dr. Pradeep Nair", id: "DOC-004", spec: "Epilepsy & Stroke", dept: "Neurology", status: "Active" },
                            ].map((dr, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                 <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs ring-4 ring-primary/5">
                                          {dr.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                                       </div>
                                       <div>
                                          <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{dr.name}</p>
                                          <p className="text-[10px] font-bold text-slate-400 tracking-tighter uppercase">{dr.id}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-5 text-sm font-medium text-slate-600">{dr.spec}</td>
                                 <td className="px-8 py-5">
                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                                       {dr.dept}
                                    </span>
                                 </td>
                                 <td className="px-8 py-5 text-right">
                                    <div className={cn(
                                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none",
                                      dr.status === 'Active' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                                    )}>
                                       <span className={cn("w-1.5 h-1.5 rounded-full", dr.status === 'Active' ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
                                       {dr.status}
                                    </div>
                                 </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                   <div className="p-4 bg-slate-50/10 border-t border-slate-50 text-center">
                      <button className="text-xs font-bold text-primary hover:underline">Download Performance Report (PDF)</button>
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
                  <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">Refining Dashboard Analytics</h3>
                  <p className="text-slate-500 max-w-sm">We are currently migrating this panel to the new Intelligence Layer. Check back in a few minutes.</p>
               </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}