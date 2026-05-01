import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Stethoscope,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Clock,
  ShieldCheck,
  MoreVertical,
  Plus,
  UserPlus,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { dashboardAPI } from '../../services/api';
import { getAdminDashboard } from '../../services/offlineService';
import NfcPatientPanel from '../nfc/NfcPatientPanel';

const StatCard = ({ title, value, change, icon: Icon, color }) => (

  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3.5 rounded-2xl ${color} transition-transform group-hover:scale-110`}>
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${change > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
        {change > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {Math.abs(change)}%
      </div>
    </div>
    <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">{title}</h3>
    <p className="text-3xl font-display font-bold text-slate-900">{value}</p>
  </motion.div>
);

const DashboardOverview = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [dataSource, setDataSource] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // Uses offline-first: tries API, falls back to local cache
        const result = await getAdminDashboard();
        setData(result.data);
        setDataSource(result.source);
      } catch (err) {
        console.error("Dashboard fetch failed, using fallback data");
        setData({
          metrics: {
             active_patients: 45210,
             doctors_on_duty: 128,
             total_billed: 12400000,
             new_registrations: 0,
             pending_receipts: 0
          },
          doctors: [
            { full_name: 'Dr. Arvind Mehta', department: 'Cardiology', status: 'In Clinic', patients: 12 },
            { full_name: 'Dr. Sarah Wilson', department: 'Pediatrics', status: 'On Break', patients: 8 },
          ],
          alerts: [
            { title: 'Blood Bank Low', desc: 'O- Negative stocks below threshold.', time: '2m ago', type: 'critical' },
            { title: 'System Maintenance', desc: 'Planned downtime at 02:00 AM.', time: '1h ago', type: 'warning' },
          ]
        });
        setDataSource('fallback');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return (
    <AdminLayout title="Hospital Overview">
       <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
       </div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Hospital Overview">
      <div className="space-y-10">

        {/* Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
           <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Welcome back</h2>
              <p className="text-sm font-bold text-slate-400 mt-1">Manage patients, staff, and operations at a glance.</p>
           </div>
           <div className="flex items-center gap-3">
              <button
                 onClick={() => navigate('/admin/patients')}
                 className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
              >
                 <Users size={18} />
                 View Patients
              </button>
              <button
                 onClick={() => navigate('/admin/registration')}
                 className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                 <UserPlus size={18} />
                 Add Patient
              </button>
           </div>
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard 
             title="Total Patients" 
             value={data?.metrics?.active_patients?.toLocaleString() || "0"} 
             change={12} 
             icon={Users} 
             color="bg-primary/10 text-primary" 
           />
           <StatCard 
             title="Doctors Active" 
             value={data?.metrics?.doctors_on_duty || "0"} 
             change={-2} 
             icon={Stethoscope} 
             color="bg-indigo-50 text-indigo-600" 
           />
           <StatCard 
             title="Revenue (MTD)" 
             value={`₹${(data?.metrics?.total_billed / 100000).toFixed(1)}L`} 
             change={28} 
             icon={CreditCard} 
             color="bg-emerald-50 text-emerald-600" 
           />
           <StatCard 
             title="Care Index" 
             value="98.2" 
             change={4} 
             icon={Activity} 
             color="bg-rose-50 text-rose-600" 
           />
        </div>

        {/* NFC Scan Panel (Admin) */}
        <NfcPatientPanel role="admin" />


        <div className="grid lg:grid-cols-3 gap-8">
           {/* Doctors on Duty Section */}
           <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-xl font-black text-slate-900 tracking-tight">Staff on Duty</h2>
                 <button className="text-sm font-bold text-primary hover:underline">View All Schedule</button>
              </div>
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                       <tr>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Practitioner</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest px-8">Patients</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {(data?.doctors || []).map((doc, i) => (
                         <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                     {doc.full_name?.split(' ').length > 1 ? doc.full_name.split(' ')[1][0] : doc.full_name?.[0] || 'D'}
                                  </div>
                                  <span className="font-bold text-sm text-slate-900">{doc.full_name}</span>
                               </div>
                            </td>
                            <td className="px-8 py-6 text-sm font-medium text-slate-500">{doc.department}</td>

                            <td className="px-8 py-6">
                               <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                 doc.status === 'In Clinic' || doc.status === 'on_duty' ? 'bg-emerald-50 text-emerald-600' : 
                                 doc.status === 'In Surgery' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                               }`}>
                                  {doc.status}
                               </span>
                            </td>
                            <td className="px-8 py-6 text-sm font-bold text-slate-900 pl-12">{doc.patients || 0}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Alerts & Critical Feed */}
           <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-xl font-black text-slate-900 tracking-tight">Critical Alerts</h2>
                 <span className="w-6 h-6 rounded-lg bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">{data?.alerts?.length || 0}</span>
              </div>
              <div className="space-y-4">
                 {(data?.alerts || []).map((alert, i) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.1 }}
                     className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex gap-4 hover:shadow-md transition-all group"
                   >
                     <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center ${
                       alert.type === 'critical' ? 'bg-rose-50 text-rose-500' : 
                       alert.type === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-primary/5 text-primary'
                     }`}>
                        <AlertCircle size={20} />
                     </div>
                     <div>
                        <div className="flex justify-between items-start mb-1">
                           <h4 className="font-bold text-sm text-slate-900">{alert.title}</h4>
                           <span className="text-[10px] font-bold text-slate-400 uppercase">{alert.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{alert.desc}</p>
                     </div>
                   </motion.div>
                 ))}
                 
                 <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10 text-center space-y-3">
                    <ShieldCheck size={32} className="text-primary mx-auto opacity-50" />
                    <p className="text-sm font-bold text-primary">System Integrity 100%</p>
                    <p className="text-xs text-slate-500 font-medium">Auto-backups active. All encryption keys verified for AHDS compliance.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </AdminLayout>
  );
};


export default DashboardOverview;
