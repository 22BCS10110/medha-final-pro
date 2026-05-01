import React, { useState } from "react";
import { consentAPI } from "../../services/api";
import { ShieldCheck, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * One-time consent modal — shown after first NFC scan if patient
 * has not yet granted consent. Not shown again after granting.
 */
export default function ConsentModal({ isOpen, onClose, patientId, patientName, onConsented }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleGrant = async () => {
    setSubmitting(true);
    setError("");
    try {
      await consentAPI.grant(patientId, { granted_via: "nfc" });
      onConsented?.();
      onClose();
    } catch (err) {
      setError("Failed to record consent. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-900"
            >
              <X size={18} />
            </button>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <ShieldCheck size={24} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Patient Consent Required</h3>
                  <p className="text-sm text-slate-500">{patientName}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-sm text-slate-600 leading-relaxed">
                <p>
                  By granting consent, the patient agrees to share their health records
                  with authorized healthcare providers via the Medha Health Intelligance platform for
                  the purpose of care management.
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  This is a one-time consent. It can be revoked at any time from the patient portal.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 rounded-xl text-red-600 text-sm">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Skip for Now
                </button>
                <button
                  onClick={handleGrant}
                  disabled={submitting}
                  className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Recording..." : "Grant Consent"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
