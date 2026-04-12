import { useEffect, useState, useRef } from "react";
import {
  assignNfcCard, getPatientNfcStatus,
  onNFCCard, onNfcReaderStatus, getNfcReaderStatus
} from "../../services/offlineService";
import {
  CreditCard, Radio, Check, X, AlertTriangle,
  Loader2, Usb, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * NfcAssignModal — centered overlay modal for NFC card assignment.
 *
 * Props:
 *   patient    — { patient_id, id, full_name, ... }
 *   onClose    — called when modal closes (cancel or after success)
 *   onAssigned — optional callback(uid) after successful assignment
 */
export default function NfcAssignModal({ patient, onClose, onAssigned }) {
  const patientId   = patient?.patient_id || patient?.id;
  const patientName = patient?.full_name;

  const [nfcStatus, setNfcStatus]    = useState(null);   // { has_nfc, nfc_uid }
  const [readerOk, setReaderOk]      = useState(false);
  const [scanning, setScanning]      = useState(false);  // user clicked "Start Scan"
  const [processing, setProcessing]  = useState(false);
  const [lastUid, setLastUid]        = useState(null);
  const [result, setResult]          = useState(null);   // { type, message }

  const processingRef = useRef(false);
  const scanningRef   = useRef(false);
  const dismissTimer  = useRef(null);

  // Keep ref in sync
  useEffect(() => { scanningRef.current = scanning; }, [scanning]);

  // Fetch NFC status on open
  useEffect(() => {
    if (!patientId) return;
    getPatientNfcStatus(patientId).then(setNfcStatus).catch(() => {});
  }, [patientId]);

  // Reader status
  useEffect(() => {
    getNfcReaderStatus().then((s) => setReaderOk(s.hasReader));
    const unsub = onNfcReaderStatus((d) => setReaderOk(d.connected));
    return unsub;
  }, []);

  // Card tap listener — only active while scanning
  useEffect(() => {
    if (!scanning) return;

    const unsub = onNFCCard((uid) => {
      if (processingRef.current || !scanningRef.current) return;
      processingRef.current = true;
      setProcessing(true);
      setLastUid(uid);
      doAssign(uid).finally(() => { processingRef.current = false; });
    });

    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  // Auto-dismiss result banner after 6 s
  useEffect(() => {
    clearTimeout(dismissTimer.current);
    if (result) {
      dismissTimer.current = setTimeout(() => setResult(null), 6000);
    }
    return () => clearTimeout(dismissTimer.current);
  }, [result]);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  async function doAssign(uid) {
    setResult(null);
    const res = await assignNfcCard(patientId, uid);

    if (res.success) {
      setNfcStatus({ has_nfc: true, nfc_uid: uid });
      setScanning(false);
      setResult({
        type: 'success',
        message: res.data?.offline
          ? `Card ${uid} saved locally — syncs when online`
          : `Card ${uid} assigned to ${patientName || patientId}`,
      });
      if (onAssigned) onAssigned(uid);
    } else {
      const msg = res.assigned_to
        ? `UID already assigned to ${res.assigned_to.full_name || res.assigned_to.patient_id}`
        : (res.error || 'Assignment failed');
      setResult({ type: 'error', message: msg });
      setScanning(false);
    }
    setProcessing(false);
  }

  const startScan = () => {
    setResult(null);
    setLastUid(null);
    processingRef.current = false;
    setScanning(true);
  };

  const cancelScan = () => {
    setScanning(false);
    setLastUid(null);
    processingRef.current = false;
    setProcessing(false);
  };

  const handleClose = () => {
    cancelScan();
    onClose?.();
  };

  const hasNfc = nfcStatus?.has_nfc;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
      />

      {/* Modal card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl shadow-slate-900/30 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <CreditCard size={26} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                NFC Card Assignment
              </h2>
              <p className="text-xs font-bold text-slate-400 mt-0.5 tracking-wide">
                {patientName}
                <span className="ml-2 font-mono text-slate-300">·</span>
                <span className="ml-2 font-mono">{patientId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-8 py-6 space-y-5">

          {/* Current NFC status */}
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-2xl border",
            hasNfc
              ? "bg-emerald-50 border-emerald-100"
              : "bg-slate-50 border-slate-100"
          )}>
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
              hasNfc ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"
            )}>
              <ShieldCheck size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                Current Status
              </p>
              {hasNfc ? (
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                  <p className="text-sm font-bold text-emerald-700 truncate">
                    Assigned —{" "}
                    <span className="font-mono text-xs text-slate-500">{nfcStatus.nfc_uid}</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm font-bold text-slate-500">No NFC card assigned</p>
              )}
            </div>
          </div>

          {/* ── Scan Stage ── */}
          <AnimatePresence mode="wait">
            {!scanning ? (
              /* Idle / ready to scan */
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4 space-y-5"
              >
                {/* Reader status pill */}
                <div className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border",
                  readerOk
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-amber-50 text-amber-700 border-amber-100"
                )}>
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    readerOk ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                  )} />
                  {readerOk ? "NFC Reader Connected" : "NFC Reader Not Detected"}
                </div>

                {!readerOk && (
                  <p className="text-xs text-slate-400 font-medium">
                    Plug in your ACR122U or compatible USB NFC reader
                  </p>
                )}

                <button
                  onClick={startScan}
                  disabled={!readerOk}
                  className={cn(
                    "w-full py-4 rounded-2xl font-black text-sm transition-all",
                    readerOk
                      ? hasNfc
                        ? "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20"
                        : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
                      : "bg-slate-100 text-slate-300 cursor-not-allowed"
                  )}
                >
                  {hasNfc ? "Reassign NFC Card" : "Assign NFC Card"}
                </button>
              </motion.div>

            ) : (
              /* Active scanning */
              <motion.div
                key="scanning"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="py-4"
              >
                {processing ? (
                  /* Processing tap */
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center">
                      <Loader2 size={32} className="text-primary animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-slate-800">Assigning card…</p>
                      <p className="text-xs text-slate-400 font-mono mt-1">{lastUid}</p>
                    </div>
                  </div>
                ) : !readerOk ? (
                  /* Reader disconnected mid-scan */
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-20 h-20 rounded-[2rem] bg-amber-100 flex items-center justify-center">
                      <Usb size={32} className="text-amber-500" />
                    </div>
                    <p className="text-sm font-bold text-amber-700 text-center">
                      NFC reader disconnected.<br />
                      <span className="font-normal text-slate-400">Reconnect and try again.</span>
                    </p>
                  </div>
                ) : (
                  /* Waiting for tap */
                  <div className="flex flex-col items-center gap-5 py-4">
                    {/* Ripple animation */}
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                      <span className="absolute inset-2 rounded-full bg-primary/10 animate-ping [animation-delay:150ms]" />
                      <div className="relative w-20 h-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center">
                        <CreditCard size={32} className="text-primary" />
                      </div>
                    </div>

                    <div className="text-center space-y-1.5">
                      <p className="text-sm font-black text-slate-800">
                        Tap NFC card to assign
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        Hold the card near the reader
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-black uppercase tracking-widest">
                      <Radio size={10} className="animate-pulse" />
                      Reader active — waiting for card
                    </div>
                  </div>
                )}

                {/* Cancel scan */}
                {!processing && (
                  <button
                    onClick={cancelScan}
                    className="w-full mt-4 py-3 rounded-2xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={14} />
                    Cancel Scan
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Result banner ── */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-2xl border",
                  result.type === "success"
                    ? "bg-emerald-50 border-emerald-100"
                    : "bg-red-50 border-red-100"
                )}
              >
                {result.type === "success"
                  ? <Check size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                  : <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                }
                <p className={cn(
                  "text-sm font-medium leading-snug flex-1",
                  result.type === "success" ? "text-emerald-700" : "text-red-600"
                )}>
                  {result.message}
                </p>
                <button onClick={() => setResult(null)} className="text-slate-300 hover:text-slate-500 shrink-0">
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div className="px-8 pb-8">
          {result?.type === 'success' ? (
            <button
              onClick={handleClose}
              className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
            >
              Done
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="w-full py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function cn(...cls) { return cls.filter(Boolean).join(" "); }
