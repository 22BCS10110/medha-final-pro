import { useEffect, useMemo, useRef, useState } from "react";
import { nfcAPI, billingAPI, doctorsAPI, appointmentsAPI, patientsAPI } from "../../services/api";
import { 
  CreditCard, ScanLine, AlertTriangle, UserRound, Stethoscope, 
  Heart, Activity, FileText, Pill, Calendar, Phone, MapPin,
  Droplets, Shield, ChevronRight, Clock, TrendingUp, Eye, Hospital
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";

// Helper to calculate age from DOB
const calculateAge = (dob) => {
  if (!dob) return "-";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Blood group color coding
const getBloodGroupColor = (bg) => {
  const colors = {
    'A+': 'bg-red-50 text-red-600 border-red-100',
    'A-': 'bg-red-50 text-red-600 border-red-100',
    'B+': 'bg-blue-50 text-blue-600 border-blue-100',
    'B-': 'bg-blue-50 text-blue-600 border-blue-100',
    'AB+': 'bg-purple-50 text-purple-600 border-purple-100',
    'AB-': 'bg-purple-50 text-purple-600 border-purple-100',
    'O+': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'O-': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };
  return colors[bg] || 'bg-slate-50 text-slate-600 border-slate-100';
};

// Status badge component
const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    inactive: 'bg-slate-50 text-slate-400 border-slate-100',
    critical: 'bg-red-50 text-red-600 border-red-100 animate-pulse',
  };
  return (
    <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border", styles[status] || styles.inactive)}>
      {status || 'Unknown'}
    </span>
  );
};

// Info row component
const InfoRow = ({ icon: Icon, label, value, color = "text-slate-400" }) => (
  <div className="flex items-center gap-3">
    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", color)}>
      <Icon size={14} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-900 truncate">{value || "-"}</p>
    </div>
  </div>
);

// Hospital visit card
const HospitalVisitCard = ({ visit, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100"
  >
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center",
        visit.is_active ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
      )}>
        <Hospital size={18} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{visit.hospital_name}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
          {new Date(visit.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
    </div>
    <span className={cn(
      "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
      visit.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
    )}>
      {visit.is_active ? 'Active' : 'Past'}
    </span>
  </motion.div>
);

// Health record card
const HealthRecordCard = ({ record, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary/20 transition-colors"
  >
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-primary" />
        <p className="text-sm font-bold text-slate-900">{record.title || record.diagnosis || 'Health Record'}</p>
      </div>
      <span className="text-[10px] font-bold text-slate-400">
        {record.date ? new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
      </span>
    </div>
    <p className="text-xs text-slate-500 line-clamp-2">{record.description || record.notes || ''}</p>
  </motion.div>
);

// Prescription card
const PrescriptionCard = ({ prescription, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="p-4 rounded-2xl bg-white border border-slate-100"
  >
    <div className="flex items-center gap-2 mb-2">
      <Pill size={14} className="text-amber-500" />
      <p className="text-sm font-bold text-slate-900">{prescription.medicine || prescription.medication}</p>
    </div>
    <div className="flex items-center gap-4 text-xs text-slate-500">
      <span>Dosage: {prescription.dosage || '-'}</span>
      <span>•</span>
      <span>Frequency: {prescription.frequency || '-'}</span>
    </div>
    <span className={cn(
      "inline-block mt-2 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
      prescription.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
    )}>
      {prescription.status || 'Unknown'}
    </span>
  </motion.div>
);

// Vital sign card
const VitalCard = ({ vital, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.05 }}
    className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 text-center"
  >
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{vital.name || vital.type}</p>
    <p className="text-xl font-bold text-slate-900">{vital.value || '-'}</p>
    <p className="text-[10px] text-slate-400">{vital.unit || ''}</p>
  </motion.div>
);

export default function NfcPatientPanel({ role = "doctor" }) {
  const [loading, setLoading] = useState(false);
  const [scanState, setScanState] = useState("Tap card");
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [billingSummary, setBillingSummary] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const pollRef = useRef(null);

  useEffect(() => {
    if (role !== "admin") return;
    doctorsAPI.list().then((r) => setDoctors(Array.isArray(r.data) ? r.data : [])).catch(() => setDoctors([]));
    billingAPI.summary().then((r) => setBillingSummary(r.data)).catch(() => setBillingSummary(null));
  }, [role]);

  const startPolling = async () => {
    nfcAPI.resetAuth();
    setError("");
    setPatient(null);
    setLoading(true);
    setScanState("Waiting for NFC card...");
    setActiveTab("overview");

    const tick = async () => {
      try {
        const scan = await nfcAPI.latestScan();
        const pid = scan?.patient_id || scan?.data?.patient_id || scan?.patient_data?.patient_id;
        if (pid) {
          const patientData = scan?.patient_data || (await nfcAPI.patientById(pid))?.data;
          setPatient(patientData);
          setScanState(`Card detected: ${pid}`);
          setLoading(false);
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (e) {
        console.error("NFC scan error:", e);
        setError("NFC/Backend connection error");
        setLoading(false);
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    await tick();
    pollRef.current = setInterval(tick, 1500);
  };

  useEffect(() => () => pollRef.current && clearInterval(pollRef.current), []);

  const hospitalVisits = useMemo(() => patient?.hospital_visits || [], [patient]);
  const healthRecords = useMemo(() => patient?.health_records || patient?.records || [], [patient]);
  const prescriptions = useMemo(() => patient?.prescriptions || patient?.medications || [], [patient]);
  const vitals = useMemo(() => patient?.vitals || [], [patient]);

  const tabs = [
    { id: "overview", label: "Overview", icon: Eye },
    { id: "history", label: "Hospital Visits", icon: Calendar },
    { id: "records", label: "Health Records", icon: FileText },
    { id: "prescriptions", label: "Prescriptions", icon: Pill },
  ];

  const assignDoctorAndCreateAppointment = async () => {
    if (!selectedDoctor || !patient?.patient_id) return;
    try {
      const all = await doctorsAPI.list();
      const doctorObj = (all.data || []).find((d) => String(d.id) === String(selectedDoctor));
      if (!doctorObj) throw new Error("Doctor not found");

      const patients = await patientsAPI.list();
      const match = (patients.data || []).find((p) => p.patient_id === patient.patient_id);
      if (!match) throw new Error("Patient not found in main API");

      await appointmentsAPI.create({
        doctor: doctorObj.id,
        patient: match.id,
        date: new Date().toISOString().slice(0, 10),
        time: "11:00:00",
        appointment_type: "follow_up",
        status: "upcoming",
        complaint: "NFC quick assign from admin dashboard",
      });
      alert("Doctor assigned and appointment created.");
    } catch (e) {
      alert("Could not assign doctor / create appointment.");
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center",
              patient ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary"
            )}>
              <ScanLine size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">NFC Patient Scan</h3>
              <p className="text-xs text-slate-400 uppercase tracking-widest">{scanState}</p>
            </div>
          </div>
          <button
            onClick={startPolling}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <ScanLine size={16} />
            Scan Patient
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Tap card on USB NFC reader...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-8">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
            <AlertTriangle size={20} className="text-red-500 shrink-0" />
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Patient Data */}
      <AnimatePresence mode="wait">
        {patient && (
          <motion.div
            key="patient-data"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Patient Header Card */}
            <div className="p-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                      <UserRound size={28} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{patient.full_name || patient.name}</h2>
                      <p className="text-sm text-slate-300">Patient ID: {patient.patient_id}</p>
                    </div>
                  </div>
                  <StatusBadge status={patient.status} />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Age</p>
                    <p className="text-lg font-bold">{calculateAge(patient.date_of_birth)} yrs</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Gender</p>
                    <p className="text-lg font-bold">{patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : patient.gender || '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Blood Group</p>
                    <p className={cn("text-lg font-bold", patient.blood_group?.includes('O') ? 'text-emerald-400' : patient.blood_group?.includes('A') ? 'text-red-400' : 'text-blue-400')}>
                      {patient.blood_group || '-'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Visits</p>
                    <p className="text-lg font-bold">{hospitalVisits.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-8 pt-6 border-b border-slate-50">
              <div className="flex gap-1 overflow-x-auto pb-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                      activeTab === tab.id 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Contact Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <InfoRow icon={Phone} label="Phone" value={patient.phone} color="bg-emerald-100 text-emerald-600" />
                      <InfoRow icon={Droplets} label="Blood Group" value={patient.blood_group} color={getBloodGroupColor(patient.blood_group).split(' ')[0] + ' ' + getBloodGroupColor(patient.blood_group).split(' ')[1]} />
                      <InfoRow icon={Shield} label="ABHA ID" value={patient.abha_id || 'Not linked'} color="bg-blue-100 text-blue-600" />
                      <InfoRow icon={AlertTriangle} label="Allergies" value={patient.allergies || 'None reported'} color="bg-amber-100 text-amber-600" />
                    </div>

                    {/* Emergency Contact */}
                    {patient.emergency_contact && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={16} className="text-amber-600" />
                          <p className="text-sm font-bold text-amber-800">Emergency Contact</p>
                        </div>
                        <p className="text-lg font-bold text-amber-900">{patient.emergency_contact}</p>
                      </div>
                    )}

                    {/* Recent Hospital Visits */}
                    {hospitalVisits.length > 0 && (
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Recent Hospital Visits</h4>
                        <div className="space-y-2">
                          {hospitalVisits.slice(0, 3).map((visit, i) => (
                            <HospitalVisitCard key={i} visit={visit} index={i} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin Actions */}
                    {role === "admin" && (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4">Admin Actions</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-bold text-slate-500 mb-2">Assign Doctor</p>
                            <select
                              value={selectedDoctor}
                              onChange={(e) => setSelectedDoctor(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium"
                            >
                              <option value="">Select doctor</option>
                              {doctors.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.full_name} ({d.department})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-end">
                            <button
                              onClick={assignDoctorAndCreateAppointment}
                              className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
                            >
                              Assign & Create Appointment
                            </button>
                          </div>
                        </div>
                        {billingSummary && (
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-white border border-slate-100">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Billed</p>
                              <p className="text-lg font-bold text-slate-900">₹{billingSummary?.total_billed?.toLocaleString?.() ?? "0"}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white border border-slate-100">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Outstanding</p>
                              <p className="text-lg font-bold text-red-600">₹{billingSummary?.outstanding?.toLocaleString?.() ?? "0"}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "history" && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Hospital Visit History</h4>
                    {hospitalVisits.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar size={40} className="text-slate-300 mx-auto mb-4" />
                        <p className="text-sm text-slate-500">No hospital visits recorded</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {hospitalVisits.map((visit, i) => (
                          <HospitalVisitCard key={i} visit={visit} index={i} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "records" && (
                  <motion.div
                    key="records"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Health Records</h4>
                    {healthRecords.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText size={40} className="text-slate-300 mx-auto mb-4" />
                        <p className="text-sm text-slate-500">No health records found</p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-3">
                        {healthRecords.map((record, i) => (
                          <HealthRecordCard key={i} record={record} index={i} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "prescriptions" && (
                  <motion.div
                    key="prescriptions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Active Prescriptions</h4>
                    {prescriptions.length === 0 ? (
                      <div className="text-center py-12">
                        <Pill size={40} className="text-slate-300 mx-auto mb-4" />
                        <p className="text-sm text-slate-500">No prescriptions found</p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-3">
                        {prescriptions.map((rx, i) => (
                          <PrescriptionCard key={i} prescription={rx} index={i} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}