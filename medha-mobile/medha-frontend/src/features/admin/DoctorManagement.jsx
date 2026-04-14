import React from 'react';
import { motion } from 'framer-motion';
import { 
  Stethoscope, 
  Search, 
  MapPin, 
  Clock, 
  ShieldCheck,
  MoreVertical,
  Plus,
  ChevronRight
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { doctorsAPI } from '../../services/api';
import { getDoctors } from '../../services/offlineService';

const DoctorManagement = () => {
  const [doctors, setDoctors] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const result = await getDoctors();
        setDoctors(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        console.error("Doctor fetch failed, using fallback");
        setDoctors([
          { id: 'DOC-001', full_name: 'Dr. Arvind Mehta', department: 'Cardiology', status: 'Available', patients: 12, rating: 4.9 },
          { id: 'DOC-002', full_name: 'Dr. Sarah Wilson', department: 'Pediatrics', status: 'In Clinic', patients: 8, rating: 4.8 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  if (loading) return <AdminLayout title="Medical Staff Registry"><div className="py-20 text-center">Loading Staff Registry...</div></AdminLayout>;



  return (
    <AdminLayout title="Medical Staff Registry">
      <div className="space-y-8">
        
        {/* Search & Add */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-3xl px-6 py-3 w-full max-w-lg shadow-sm">
              <Search size={20} className="text-slate-400" />
              <input type="text" placeholder="Search by name, department or ID..." className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full text-slate-900" />
           </div>
           <button className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-lg">
              <Plus size={18} />
              Onboard New Doctor
           </button>
        </div>

        {/* Doctor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {doctors.map((doc, i) => (
             <motion.div 
               key={doc.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none transition-transform group-hover:scale-110" />
                
                <div className="flex justify-between items-start mb-6">
                   <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xl group-hover:bg-primary group-hover:text-white transition-all">
                      {doc.full_name?.split(' ').length > 1 ? doc.full_name.split(' ')[1][0] : doc.full_name?.[0] || 'D'}
                   </div>
                   <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                      <MoreVertical size={20} />
                   </button>
                </div>

                <div className="space-y-1 mb-6">
                   <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">{doc.full_name}</h3>
                      <ShieldCheck size={16} className="text-emerald-500" />
                   </div>
                   <p className="text-sm font-bold text-primary tracking-wide uppercase text-[10px]">{doc.department}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        doc.status === 'Available' || doc.status === 'on_duty' ? 'bg-emerald-50 text-emerald-600' : 
                        doc.status === 'In Clinic' || doc.status === 'break' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-500'
                      }`}>
                         {doc.status}
                      </span>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Patients</p>
                      <p className="text-sm font-black text-slate-900">{doc.patients || 0} Active</p>
                   </div>
                </div>


                <button className="w-full mt-8 py-4 rounded-2xl bg-slate-50 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                   View Performance
                   <ChevronRight size={16} />
                </button>
             </motion.div>
           ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default DoctorManagement;
