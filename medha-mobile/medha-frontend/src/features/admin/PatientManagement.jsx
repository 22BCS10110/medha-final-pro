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
  AlertCircle,
  User,
  Phone,
  Droplets,
  Calendar,
  CreditCard,
  X
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { patientsAPI, doctorsAPI } from '../../services/api';
import { getPatients, searchPatients as offlineSearch, getDoctors, createPatient } from '../../services/offlineService';
import NfcAssignCard from '../nfc/NfcAssignCard';
import NfcAssignModal from '../nfc/NfcAssignModal';

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [nfcModalPatient, setNfcModalPatient] = useState(null);
  const [nfcAssignedIds, setNfcAssignedIds] = useState(new Set()); // track assigned in session
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

  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  const handleAssignClick = (patient) => {
    setSelectedPatient(patient);
    setNfcModalPatient(patient);
  };

  const selectedPatientRef = React.useRef(null);
  React.useEffect(() => {
    selectedPatientRef.current = selectedPatient;
  }, [selectedPatient]);

  const assignCardToPatient = async (uid) => {
    const patient = selectedPatientRef.current;
    if (!patient) return;

    const uppercaseUid = uid.toUpperCase();

    try {
      await patientsAPI.assignNfc(patient.patient_id || patient.id, uppercaseUid);
      setNfcAssignedIds(prev => new Set([...prev, patient.patient_id || patient.id]));
      setNfcModalPatient(null);
    } catch (err) {
      console.error("NFC Assign Error:", err);
    }
  };

  React.useEffect(() => {
    if (isElectron) {
      console.log("ELECTRON ADMIN PANEL LOADED");
      const unsub = window.electronAPI.onNFCCard((uid) => {
        assignCardToPatient(uid);
      });
      return () => {
        if (unsub && typeof unsub === 'function') unsub();
      };
    }
  }, [isElectron]);

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
      const result = await getPatients();
      setPatients(Array.isArray(result.data) ? result.data : []);
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
      const result = await getDoctors();
      setDoctors(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setDoctors([]);
    }
  };

  const handleSearch = async (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (val.length > 2) {
      try {
        const result = await offlineSearch(val);
        setPatients(Array.isArray(result.data) ? result.data : []);
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
      const result = await createPatient(formData);
      if (result.source === 'queued') {
        alert("You are offline. Registration has been queued and will sync when online.");
      }
      setShowRegisterForm(false);
      fetchPatients();
    } catch (err) {
      alert("Registration failed. Please check your data.");
    }
  };

  const openPatientDetail = (patient) => {
    setSelectedPatient(patient);
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
                       <th className="px-10 py-6">NFC Card</th>
                       <th className="px-10 py-6 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {patients.map((patient, i) => (
                      <tr
                        key={patient.patient_id || patient.id}
                        className="hover:bg-primary/[0.02] transition-colors group cursor-pointer"
                        onClick={() => openPatientDetail(patient)}
                      >
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
                         {/* NFC Card column */}
                         <td className="px-10 py-7" onClick={(e) => e.stopPropagation()}>
                           {nfcAssignedIds.has(patient.patient_id || patient.id) || patient.has_nfc || patient.nfc_uid ? (
                             <span style={{ color: "green", fontWeight: "bold" }}>
                               Assigned ✅
                             </span>
                           ) : isElectron ? (
                             <button
                               onClick={() => handleAssignClick(patient)}
                               style={{
                                 background: "#6366f1",
                                 color: "#fff",
                                 padding: "6px 14px",
                                 borderRadius: "8px",
                                 fontWeight: "600",
                                 cursor: "pointer"
                               }}
                             >
                               Assign NFC
                             </button>
                           ) : (
                             <button
                               disabled
                               title="NFC only works in desktop app"
                               style={{
                                 background: "#e2e8f0",
                                 color: "#94a3b8",
                                 padding: "6px 14px",
                                 borderRadius: "8px",
                                 fontWeight: "600",
                                 cursor: "not-allowed"
                               }}
                             >
                               Assign NFC
                             </button>
                           )}
                         </td>
                         <td className="px-10 py-7 text-right">
                            <button
                              onClick={(e) => { e.stopPropagation(); openPatientDetail(patient); }}
                              className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                            >
                               <ChevronRight size={20} />
                            </button>
                         </td>
                      </tr>
                    ))}
                 </tbody>

              </table>
           </div>
        </div>

        {/* ── NFC Assign Modal ── */}
        <AnimatePresence>
          {selectedPatient && nfcModalPatient && (
            <NfcAssignModal
              patient={selectedPatient}
              onClose={() => setNfcModalPatient(null)}
              onAssigned={(uid) => {
                const pid = selectedPatient.patient_id || selectedPatient.id;
                setNfcAssignedIds((prev) => new Set([...prev, pid]));
              }}
            />
          )}
        </AnimatePresence>

        {/* Patient Detail Slide-over (with NFC Assign) */}
        <AnimatePresence>
          {selectedPatient && (
            <div className="fixed inset-0 z-[2000] overflow-hidden">
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setSelectedPatient(null)}
                 className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
               />
               <motion.div
                 initial={{ x: '100%' }}
                 animate={{ x: 0 }}
                 exit={{ x: '100%' }}
                 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                 className="absolute top-0 right-0 w-full max-w-xl h-full bg-white shadow-2xl flex flex-col"
               >
                  {/* Header */}
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                           <User size={28} />
                        </div>
                        <div>
                           <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedPatient.full_name}</h2>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                             {selectedPatient.patient_id || selectedPatient.id}
                           </p>
                        </div>
                     </div>
                     <button onClick={() => setSelectedPatient(null)} className="p-3 rounded-2xl hover:bg-slate-50 text-slate-400">
                        <X size={24} />
                     </button>
                  </div>

                  {/* Patient Info + NFC */}
                  <div className="flex-grow overflow-y-auto p-8 space-y-6">
                     {/* Status Badge */}
                     <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          selectedPatient.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          selectedPatient.status === 'critical' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        )}>
                           {selectedPatient.status || 'Unknown'}
                        </span>
                        {selectedPatient._offline && (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                            Cached
                          </span>
                        )}
                     </div>

                     {/* Info Grid */}
                     <div className="grid grid-cols-2 gap-4">
                        <InfoItem icon={Calendar} label="Age / Gender" value={`${selectedPatient.age || '-'}Y / ${selectedPatient.gender === 'M' ? 'Male' : selectedPatient.gender === 'F' ? 'Female' : selectedPatient.gender || '-'}`} />
                        <InfoItem icon={Droplets} label="Blood Group" value={selectedPatient.blood_group || 'N/A'} />
                        <InfoItem icon={Phone} label="Phone" value={selectedPatient.phone || 'N/A'} />
                        <InfoItem icon={ShieldCheck} label="ABHA ID" value={selectedPatient.abha_id || 'Not linked'} />
                     </div>

                     {/* Assigned Doctor */}
                     <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Assigned Doctor</p>
                        <p className="text-sm font-bold text-slate-900">
                          {selectedPatient.assigned_doctor?.full_name || selectedPatient.assigned_doctor_name || 'Unassigned'}
                        </p>
                     </div>

                     {/* Allergies */}
                     {selectedPatient.allergies && (
                       <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Allergies</p>
                          <p className="text-sm font-bold text-amber-800">{selectedPatient.allergies}</p>
                       </div>
                     )}

                     {/* ═══ NFC CARD ASSIGNMENT ═══ */}
                     <div className="pt-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">NFC Card Management</h3>
                        <NfcAssignCard
                          patientId={selectedPatient.patient_id || selectedPatient.id}
                          patientName={selectedPatient.full_name}
                          onAssigned={(uid) => {
                            const pid = selectedPatient.patient_id || selectedPatient.id;
                            setNfcAssignedIds((prev) => new Set([...prev, pid]));
                          }}
                        />
                     </div>

                     {/* Hospital Visits */}
                     {selectedPatient.hospital_visits?.length > 0 && (
                       <div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Hospital Visits</h3>
                          <div className="space-y-2">
                            {selectedPatient.hospital_visits.map((v, i) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-sm font-bold text-slate-700">{v.hospital__name || v.hospital_name}</span>
                                <span className="text-xs text-slate-400">
                                  {v.visit_date ? new Date(v.visit_date).toLocaleDateString() : ''}
                                  {v.is_active && <span className="ml-2 text-emerald-600 font-bold">Active</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                       </div>
                     )}
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

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
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Medha Clinical Intake</p>
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

// Info item for the detail panel
function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={12} className="text-slate-400" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      </div>
      <p className="text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

// Simple utility for tailwind class merging
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default PatientManagement;
