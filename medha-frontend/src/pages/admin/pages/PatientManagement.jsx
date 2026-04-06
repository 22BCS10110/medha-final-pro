import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  UserPlus, 
  ShieldCheck, 
  ChevronRight,
  Filter,
  Download,
  AlertCircle
} from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { patientsAPI, doctorsAPI } from '../../../services/api';

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  
  // Registration form state
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    age: '',
    gender: 'M',
    assigned_doctor: '',
    blood_group: 'A+',
    abha_id: ''
  });

  const location = useLocation();
  
  React.useEffect(() => {
    fetchPatients();
    fetchDoctors();
    
    // Open registration form if coming from registration route
    if (location.pathname === '/admin/registration') {
      setShowRegisterForm(true);
    }
  }, [location.pathname]);


  const fetchPatients = async () => {
    try {
      const res = await patientsAPI.list();
      setPatients(res.data);
    } catch (err) {
      console.error("Failed to fetch patients, using fallback");
      setPatients([
        { id: 'MHD-4211', full_name: 'Alok Sharma', age: 42, gender: 'Male', assigned_doctor: { full_name: 'Dr. Arvind Mehta' }, status: 'active', registered_at: '24 May 2026' },
        { id: 'MHD-4212', full_name: 'Priya Singh', age: 28, gender: 'Female', assigned_doctor: { full_name: 'Dr. Sarah Wilson' }, status: 'critical', registered_at: '25 May 2026' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await doctorsAPI.list();
      setDoctors(res.data);
    } catch (err) {
      setDoctors([]);
    }
  };

  const handleSearch = async (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (val.length > 2) {
      try {
        const res = await patientsAPI.search(val);
        setPatients(res.data);
      } catch (err) {
        console.error("Search failed");
      }
    } else if (val === "") {
      fetchPatients();
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await patientsAPI.create(formData);
      setShowRegisterForm(false);
      fetchPatients();
    } catch (err) {
      alert("Registration failed. Please check your data.");
    }
  };

  if (loading) return (
    <AdminLayout title="Patient Management">
       <div className="flex items-center justify-center py-20 text-slate-400">Loading Clinical Records...</div>
    </AdminLayout>
  );


  return (
    <AdminLayout title="Patient Management">
      <div className="space-y-8">
        
        {/* Top Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-3xl px-6 py-3 w-full max-w-lg shadow-sm focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <Search size={20} className="text-slate-400" />
              <input 
                 type="text" 
                 placeholder="Search by name, ID or phone..." 
                 className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full text-slate-900"
                 value={searchTerm}
                 onChange={handleSearch}
              />

           </div>

           <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm">
                 <Filter size={18} />
                 Filters
              </button>
              <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm">
                 <Download size={18} />
                 Export
              </button>
              <button 
                onClick={() => setShowRegisterForm(true)}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                 <Plus size={18} />
                 New Registration
              </button>
           </div>
        </div>

        {/* Patient Table */}
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden relative">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                       <th className="px-10 py-6">Patient Details</th>
                       <th className="px-10 py-6">Age / Gender</th>
                       <th className="px-10 py-6">Assigned Doctor</th>
                       <th className="px-10 py-6">Health Status</th>
                       <th className="px-10 py-6">Last Visit</th>
                       <th className="px-10 py-6 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {patients.map((patient, i) => (
                      <tr key={patient.patient_id || patient.id} className="hover:bg-primary/[0.02] transition-colors group">
                         <td className="px-10 py-7">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 group-hover:bg-primary group-hover:text-white transition-all">
                                  {patient.full_name[0]}
                               </div>
                               <div>
                                  <p className="font-bold text-slate-900 leading-none mb-1.5">{patient.full_name}</p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{patient.patient_id || patient.id}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-7">
                            <p className="text-sm font-bold text-slate-600 uppercase tracking-tighter">{patient.age}Y • {patient.gender === 'M' ? 'Male' : 'Female'}</p>
                         </td>
                         <td className="px-10 py-7">
                            <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                  <ShieldCheck size={12} />
                               </div>
                               <span className="text-sm font-bold text-slate-900">{patient.assigned_doctor?.full_name || 'Unassigned'}</span>
                            </div>
                         </td>
                         <td className="px-10 py-7">
                            <span className={cn(
                              "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                              patient.status === 'active' || patient.status === 'Stable' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              patient.status === 'critical' || patient.status === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                              patient.status === 'In Surgery' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                              'bg-amber-50 text-amber-600 border-amber-100'
                            )}>
                               {patient.status}
                            </span>
                         </td>
                         <td className="px-10 py-7">
                            <p className="text-xs font-bold text-slate-500">{new Date(patient.registered_at).toLocaleDateString()}</p>
                         </td>
                         <td className="px-10 py-7 text-right">
                            <button className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                               <MoreVertical size={20} />
                            </button>
                         </td>
                      </tr>
                    ))}
                 </tbody>

              </table>
           </div>
        </div>

        {/* Registration Slide-over */}
        <AnimatePresence>
          {showRegisterForm && (
            <div className="fixed inset-0 z-[2000] overflow-hidden">
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setShowRegisterForm(false)}
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
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                           <UserPlus size={24} />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black text-slate-900 tracking-tight">Register Patient</h2>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Medhā Clinical Intake</p>
                        </div>
                     </div>
                     <button onClick={() => setShowRegisterForm(false)} className="p-3 rounded-2xl hover:bg-slate-50 text-slate-400">
                        <Plus className="rotate-45" size={24} />
                     </button>
                  </div>

                  <div className="flex-grow overflow-y-auto p-10 space-y-10">
                     <form onSubmit={handleRegister} className="space-y-10">
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                              <input 
                                type="text" 
                                required
                                placeholder="John Doe" 
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
                                value={formData.full_name}
                                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                              <input 
                                type="text" 
                                placeholder="+91 98XXX XXXX" 
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300" 
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Age</label>
                              <input 
                                type="number" 
                                placeholder="25" 
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300" 
                                value={formData.age}
                                onChange={(e) => setFormData({...formData, age: e.target.value})}
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gender</label>
                              <select 
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                value={formData.gender}
                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                              >
                                 <option value="M">Male</option>
                                 <option value="F">Female</option>
                                 <option value="O">Other</option>
                              </select>
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Doctor</label>
                           <select 
                             className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                             value={formData.assigned_doctor}
                             onChange={(e) => setFormData({...formData, assigned_doctor: e.target.value})}
                           >
                              <option value="">Select Doctor</option>
                              {(doctors || []).map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.full_name} ({doc.department})</option>
                              ))}
                           </select>
                        </div>

                        <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100 flex gap-4">
                           <AlertCircle className="text-indigo-600 shrink-0" size={20} />
                           <p className="text-xs font-bold text-indigo-700 leading-relaxed">
                              Ensure ABHA ID is linked for seamless records sync between Central & Hospital systems.
                           </p>
                        </div>
                        
                        <div className="mt-8 border-t border-slate-100 pt-8">
                           <button type="submit" className="w-full premium-gradient text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">
                              Complete Registration
                           </button>
                        </div>
                     </form>
                  </div>

               </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
};

// Simple utility for tailwind class merging
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default PatientManagement;
