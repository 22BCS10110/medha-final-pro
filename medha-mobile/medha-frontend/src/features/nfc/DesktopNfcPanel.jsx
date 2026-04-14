import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { nfcAPI, billingAPI, doctorsAPI, appointmentsAPI, patientsAPI } from "../../services/api";
import desktopAPI from "../../services/desktopAPI";
import {
  lookupPatientOfflineFirst, getDoctors, getBillingSummary,
  onNfcCardTap, onNfcReaderStatus, getNfcReaderStatus
} from "../../services/offlineService";
import useOfflineStatus from "../../hooks/useOfflineStatus";
import {
  CreditCard, ScanLine, AlertTriangle, UserRound, Stethoscope,
  Heart, Activity, FileText, Pill, Calendar, Phone, MapPin,
  Droplets, Shield, ChevronRight, Clock, TrendingUp, Eye, Hospital,
  Usb, Printer, Download, WifiOff, Database, Wifi, Radio
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

export default function DesktopNfcPanel({ role = "doctor" }) {
  const [loading, setLoading] = useState(false);
  const [scanState, setScanState] = useState("Tap card on NFC reader");
  const [patient, setPatient] = useState(null);
  const [dataSource, setDataSource] = useState(null); // 'api' | 'cache' | 'nfc_only'
  const [error, setError] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [billingSummary, setBillingSummary] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [readerConnected, setReaderConnected] = useState(false);
  const [readerName, setReaderName] = useState("");
  const [nfcMode, setNfcMode] = useState("auto"); // 'auto' (real-time) | 'polling' (legacy)
  const pollRef = useRef(null);
  const isDesktop = desktopAPI.isElectron;
  const { isOnline } = useOfflineStatus();

  // ── Check NFC hardware status on mount ──
  useEffect(() => {
    desktopAPI.getAppVersion().then(setAppVersion);

    if (isDesktop) {
      getNfcReaderStatus().then((status) => {
        if (status.available && status.hasReader) {
          setReaderConnected(true);
          setReaderName(status.readers[0] || '');
          setNfcMode('auto');
          setScanState('NFC reader ready — tap card');
        } else if (status.available) {
          setNfcMode('auto');
          setScanState('Connect NFC reader...');
        } else {
          setNfcMode('polling');
          setScanState('Tap card on NFC reader');
        }
      });
    }

    if (role !== "admin") return;
    getDoctors().then(({ data }) => setDoctors(Array.isArray(data) ? data : [])).catch(() => setDoctors([]));
    getBillingSummary().then(({ data }) => setBillingSummary(data)).catch(() => setBillingSummary(null));
  }, [role, isDesktop]);

  // ── Real-time NFC card tap listener (nfc-pcsc via IPC) ──
  useEffect(() => {
    if (!isDesktop) return;

    const unsubTap = onNfcCardTap((data) => {
      if (data.status === 'reading') {
        setLoading(true);
        setError('');
        setPatient(null);
        setDataSource(null);
        setScanState(`Reading card ${data.uid}...`);
        setActiveTab('overview');
      } else if (data.status === 'success') {
        setPatient(data.patient);
        setDataSource(data.source);
        setScanState(`Card detected: ${data.uid}`);
        setLoading(false);
        setError('');
      } else if (data.status === 'not_found') {
        setPatient({ patient_id: data.uid, full_name: `Unknown (${data.uid})`, _nfc_only: true });
        setDataSource('nfc_only');
        setScanState(`Card ${data.uid} — patient not found`);
        setError(data.error || 'Patient not found offline. Connect to internet.');
        setLoading(false);
      }
    });

    const unsubReader = onNfcReaderStatus((data) => {
      setReaderConnected(data.connected);
      setReaderName(data.readerName || '');
      if (data.connected) {
        setScanState('NFC reader ready — tap card');
        setError('');
      } else {
        setScanState('NFC reader disconnected');
      }
    });

    return () => {
      unsubTap();
      unsubReader();
    };
  }, [isDesktop]);

  // ── Legacy polling fallback (for when nfc-pcsc is unavailable) ──
  const startPolling = async () => {
    setError("");
    setPatient(null);
    setDataSource(null);
    setLoading(true);
    setScanState("Waiting for NFC card...");
    setActiveTab("overview");

    const tick = async () => {
      try {
        let scanResult;

        if (isDesktop) {
          scanResult = await desktopAPI.nfcScan();
          if (scanResult?.success && scanResult?.cardNumber) {
            const cardId = scanResult.cardNumber;
            const localResult = await lookupPatientOfflineFirst(cardId);
            if (localResult) {
              setPatient(localResult.data);
              setDataSource(localResult.source);
              setScanState(`Card detected: ${cardId}`);
              setLoading(false);
              clearInterval(pollRef.current);
              pollRef.current = null;
              return;
            }

            try {
              const response = await nfcAPI.patientById(cardId);
              const patientData = response?.data;
              if (patientData) {
                if (window.electronAPI?.db) {
                  window.electronAPI.db.upsertPatient(patientData).catch(() => {});
                }
                setPatient(patientData);
                setDataSource('api');
                setScanState(`Card detected: ${cardId}`);
                setLoading(false);
                clearInterval(pollRef.current);
                pollRef.current = null;
                return;
              }
            } catch {
              setPatient({ patient_id: cardId, full_name: `Patient ${cardId}`, _nfc_only: true });
              setDataSource('nfc_only');
              setScanState(`Card detected: ${cardId} (Limited Data)`);
              setLoading(false);
              clearInterval(pollRef.current);
              pollRef.current = null;
              return;
            }
          }
        } else {
          const scan = await nfcAPI.latestScan();
          const pid = scan?.patient_id || scan?.data?.patient_id || scan?.patient_data?.patient_id;
          if (pid) {
            const patientData = scan?.patient_data || (await nfcAPI.patientById(pid))?.data;
            setPatient(patientData);
            setDataSource('api');
            setScanState(`Card detected: ${pid}`);
            setLoading(false);
            clearInterval(pollRef.current);
            pollRef.current = null;
            return;
          }
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

  const tabs = [
    { id: "overview", label: "Overview", icon: Eye },
    { id: "history", label: "Hospital Visits", icon: Calendar },
    { id: "records", label: "Health Records", icon: FileText },
    { id: "prescriptions", label: "Prescriptions", icon: Pill },
  ];

  const handlePrintPrescription = async () => {
    if (!patient) return;
    const html = `
      <html>
        <head><title>Prescription - ${patient.full_name}</title></head>
        <body>
          <h1>Prescription</h1>
          <p><strong>Patient:</strong> ${patient.full_name}</p>
          <p><strong>ID:</strong> ${patient.patient_id}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <hr/>
          <h2>Medications</h2>
          <ul>
            ${prescriptions.map(rx => `<li>${rx.medicine || rx.medication} - ${rx.dosage || ''}</li>`).join('')}
          </ul>
        </body>
      </html>
    `;
    await desktopAPI.printDocument({ html });
  };

  const handleExportPatientData = async () => {
    if (!patient) return;
    const content = JSON.stringify(patient, null, 2);
    await desktopAPI.saveFile({
      filename: `${patient.patient_id}_${patient.full_name}.json`,
      content,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
  };

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
              patient ? "bg-emerald-100 text-emerald-600"
                : readerConnected ? "bg-primary/10 text-primary"
                : "bg-slate-100 text-slate-400"
            )}>
              {isDesktop ? <Usb size={24} /> : <ScanLine size={24} />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                NFC Patient Scan {isDesktop && <span className="text-xs font-normal text-slate-400">(Desktop)</span>}
              </h3>
              <p className="text-xs text-slate-400 uppercase tracking-widest">{scanState}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* NFC Reader Status Indicator */}
            {isDesktop && nfcMode === 'auto' && (
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                readerConnected
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-red-50 text-red-500 border border-red-100"
              )}>
                <Radio size={10} className={readerConnected ? "animate-pulse" : ""} />
                {readerConnected ? (readerName ? readerName.slice(0, 20) : 'Reader Connected') : 'No Reader'}
              </div>
            )}
            {/* Online/Offline indicator */}
            {isDesktop && (
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold",
                isOnline ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
              )}>
                {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                {isOnline ? 'Online' : 'Offline'}
              </div>
            )}
            {isDesktop && (
              <span className="text-xs text-slate-400">v{appVersion}</span>
            )}
            {/* Show manual scan button only in polling mode or when nfc-pcsc isn't auto-detecting */}
            {(nfcMode === 'polling' || !isDesktop) && (
              <button
                onClick={startPolling}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                <ScanLine size={16} />
                Scan Patient
              </button>
            )}
            {nfcMode === 'auto' && isDesktop && !loading && (
              <div className="text-xs text-slate-400 italic">
                Auto-detecting cards
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Idle state — waiting for card in auto mode */}
      {!loading && !patient && !error && nfcMode === 'auto' && readerConnected && isDesktop && (
        <div className="p-12 text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
            <CreditCard size={36} className="text-primary animate-pulse" />
          </div>
          <p className="text-sm font-medium text-slate-600">Tap NFC card on reader</p>
          <p className="text-xs text-slate-400 mt-1">Patient data will appear instantly</p>
        </div>
      )}

      {/* No reader connected in auto mode */}
      {!loading && !patient && nfcMode === 'auto' && !readerConnected && isDesktop && (
        <div className="p-12 text-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Usb size={36} className="text-amber-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">Connect USB NFC Reader</p>
          <p className="text-xs text-slate-400 mt-1">Plug in ACR122U or compatible NFC reader</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">
            {isDesktop ? "Reading NFC card..." : "Tap card on NFC reader..."}
          </p>
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
                  <div className="flex items-center gap-2">
                    <StatusBadge status={patient.status} />
                    {dataSource === 'cache' && (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                        <Database size={10} /> Cached
                      </span>
                    )}
                    {dataSource === 'nfc_only' && (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-400/30 animate-pulse">
                        <WifiOff size={10} /> Limited Offline Data
                      </span>
                    )}
                  </div>
                </div>

                {/* NFC-only warning banner */}
                {dataSource === 'nfc_only' && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center gap-3">
                    <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-200 font-medium">
                      Only NFC card ID available. Full patient data will load when internet connection is restored.
                    </p>
                  </div>
                )}

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

            {/* Action Buttons */}
            {isDesktop && (
              <div className="px-8 pt-6 flex gap-3">
                <button
                  onClick={handlePrintPrescription}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  <Printer size={14} />
                  Print Prescription
                </button>
                <button
                  onClick={handleExportPatientData}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  <Download size={14} />
                  Export Data
                </button>
              </div>
            )}

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
                      <InfoRow icon={Droplets} label="Blood Group" value={patient.blood_group} color="bg-blue-100 text-blue-600" />
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