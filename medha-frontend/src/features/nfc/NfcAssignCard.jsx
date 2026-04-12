import { useEffect, useState, useRef } from "react";
import {
  assignNfcCard, getPatientNfcStatus,
  onNFCCard, onNfcReaderStatus, getNfcReaderStatus
} from "../../services/offlineService";
import {
  CreditCard, Radio, Check, X, AlertTriangle, Loader2, Usb
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * NfcAssignCard — inline card component for patient NFC status + assignment.
 *
 * Props:
 *   patientId   — patient_id string (e.g. "MHD-4500")
 *   patientName — display name
 *   onAssigned  — optional callback(uid) after successful assignment
 */
export default function NfcAssignCard({ patientId, patientName, onAssigned }) {
  const [nfcStatus, setNfcStatus]       = useState(null);   // { has_nfc, nfc_uid }
  const [readerConnected, setReader]    = useState(false);
  const [assignMode, setAssignMode]     = useState(false);
  const [processing, setProcessing]    = useState(false);   // ref-backed too
  const [lastUid, setLastUid]          = useState(null);
  const [result, setResult]            = useState(null);    // { type, message }

  // Ref guard — prevents double-assign if two events fire before state settles
  const processingRef = useRef(false);
  const assignModeRef = useRef(false);
  const dismissTimer  = useRef(null);

  // Keep ref in sync with state
  useEffect(() => { assignModeRef.current = assignMode; }, [assignMode]);

  // Fetch NFC status on mount / patient change
  useEffect(() => {
    if (!patientId) return;
    getPatientNfcStatus(patientId).then(setNfcStatus).catch(() => {});
  }, [patientId]);

  // Reader connection
  useEffect(() => {
    getNfcReaderStatus().then((s) => setReader(s.hasReader));
    const unsub = onNfcReaderStatus((d) => setReader(d.connected));
    return unsub;
  }, []);

  // ── Raw UID listener (fires exactly ONCE per physical tap) ──
  // Only active when assignMode is true
  useEffect(() => {
    if (!assignMode) return;

    const unsub = onNFCCard((uid) => {
      // Ref guard: bail if already processing or assign mode was cancelled
      if (processingRef.current || !assignModeRef.current) return;
      processingRef.current = true;
      setProcessing(true);
      setLastUid(uid);
      doAssign(uid).finally(() => { processingRef.current = false; });
    });

    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignMode]);

  // Auto-dismiss result
  useEffect(() => {
    clearTimeout(dismissTimer.current);
    if (result) {
      dismissTimer.current = setTimeout(() => setResult(null), 5000);
    }
    return () => clearTimeout(dismissTimer.current);
  }, [result]);

  async function doAssign(uid) {
    setResult(null);
    const res = await assignNfcCard(patientId, uid);

    if (res.success) {
      setNfcStatus({ has_nfc: true, nfc_uid: uid });
      setAssignMode(false);
      setResult({
        type: 'success',
        message: res.data?.offline
          ? `Card ${uid} saved locally — syncs when online`
          : `Card ${uid} assigned to ${patientName || patientId}`,
      });
      if (onAssigned) onAssigned(uid);
    } else {
      const msg = res.assigned_to
        ? `Already assigned to ${res.assigned_to.full_name || res.assigned_to.patient_id}`
        : (res.error || 'Assignment failed');
      setResult({ type: 'error', message: msg });
    }
    setProcessing(false);
  }

  const cancel = () => {
    setAssignMode(false);
    setResult(null);
    setLastUid(null);
    processingRef.current = false;
    setProcessing(false);
  };

  const hasNfc = nfcStatus?.has_nfc;

  return (
    <div className="space-y-3">

      {/* ── NFC Status Row ── */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            hasNfc ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"
          )}>
            <CreditCard size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">NFC Card</p>
            {hasNfc ? (
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <p className="text-sm font-bold text-emerald-700">
                  Assigned — <span className="font-mono text-xs text-slate-500">{nfcStatus.nfc_uid}</span>
                </p>
              </div>
            ) : (
              <p className="text-sm font-bold text-slate-500">Not assigned</p>
            )}
          </div>
        </div>

        {!assignMode && (
          <button
            onClick={() => { setAssignMode(true); setResult(null); }}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all",
              hasNfc
                ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                : "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20"
            )}
          >
            {hasNfc ? "Reassign" : "Assign NFC Card"}
          </button>
        )}
      </div>

      {/* ── Assign Mode Panel ── */}
      <AnimatePresence>
        {assignMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.03] text-center space-y-4">
              {!readerConnected ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto">
                    <Usb size={24} className="text-amber-500" />
                  </div>
                  <p className="text-sm font-bold text-amber-700">Connect NFC Reader</p>
                  <p className="text-xs text-slate-400">Plug in ACR122U or compatible USB NFC reader</p>
                </>
              ) : processing ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Loader2 size={24} className="text-primary animate-spin" />
                  </div>
                  <p className="text-sm font-bold text-primary">Assigning {lastUid}…</p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <CreditCard size={24} className="text-primary animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    Tap NFC card to assign to <strong>{patientName || patientId}</strong>
                  </p>
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                    <Radio size={9} className="animate-pulse" />
                    Reader active — waiting for card
                  </div>
                </>
              )}

              <button
                onClick={cancel}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-600 text-sm font-bold border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <X size={13} />
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Result Toast ── */}
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
              "text-sm font-medium leading-snug",
              result.type === "success" ? "text-emerald-700" : "text-red-600"
            )}>
              {result.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function cn(...cls) { return cls.filter(Boolean).join(" "); }
