import { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Search,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FilePlus,
  Eye,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadsAPI, patientsAPI } from "../../services/api";
import { cn } from "../../utils/cn";

const TYPE_LABELS = {
  prescription: { label: "Prescription", color: "bg-[#dde1ff] text-[#003ec7]" },
  lab_report:   { label: "Lab Report",   color: "bg-[#c8f5e4] text-[#006640]" },
  diagnostic:   { label: "Diagnostic",   color: "bg-[#fef0c7] text-[#7a4f00]" },
  other:        { label: "Other",        color: "bg-[#eceef0] text-[#505f76]" },
};

const TypeBadge = ({ type }) => {
  const t = TYPE_LABELS[type] || TYPE_LABELS.other;
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide", t.color)}>
      {t.label}
    </span>
  );
};

export default function PatientUploadsPanel({ preloadedPatient = null }) {
  const [patientQuery, setPatientQuery]   = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(preloadedPatient);
  const [uploads, setUploads]             = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [filterType, setFilterType]       = useState("all");
  const [searchFile, setSearchFile]       = useState("");

  // Upload modal
  const [showModal, setShowModal]   = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState("prescription");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef   = useRef();
  const searchDebounce = useRef();

  // If a patient was loaded via NFC, select them
  useEffect(() => {
    if (preloadedPatient) setSelectedPatient(preloadedPatient);
  }, [preloadedPatient]);

  // Load uploads when patient changes
  useEffect(() => {
    if (selectedPatient?.id) fetchUploads(selectedPatient.id);
    else setUploads([]);
  }, [selectedPatient]);

  const fetchUploads = async (patientId) => {
    setLoadingUploads(true);
    try {
      const res = await uploadsAPI.list({ patient: patientId });
      setUploads(res.data?.results ?? res.data ?? []);
    } catch {
      setUploads([]);
    } finally {
      setLoadingUploads(false);
    }
  };

  // Debounced patient search
  const handlePatientQuery = (q) => {
    setPatientQuery(q);
    clearTimeout(searchDebounce.current);
    if (q.length < 2) { setPatientResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await patientsAPI.search(q);
        setPatientResults(res.data?.results ?? res.data ?? []);
      } catch {
        setPatientResults([]);
      }
    }, 300);
  };

  const selectPatient = (p) => {
    setSelectedPatient(p);
    setPatientQuery("");
    setPatientResults([]);
  };

  // File upload
  const openModal = () => {
    setUploadFile(null);
    setUploadType("prescription");
    setUploadNotes("");
    setUploadError("");
    setUploadSuccess("");
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setUploadFile(f);
  };

  const handleUpload = async () => {
    if (!uploadFile || !selectedPatient) return;
    setUploading(true);
    setUploadError("");
    const form = new FormData();
    form.append("file", uploadFile);
    form.append("upload_type", uploadType);
    form.append("notes", uploadNotes);
    form.append("patient", selectedPatient.id);
    try {
      await uploadsAPI.upload(form);
      setUploadSuccess("File uploaded successfully.");
      setShowModal(false);
      fetchUploads(selectedPatient.id);
    } catch (err) {
      setUploadError(
        err.response?.data?.detail ||
        err.response?.data?.file?.[0] ||
        "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  // Delete
  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await uploadsAPI.delete(deleteId);
      setUploads((prev) => prev.filter((u) => u.id !== deleteId));
    } catch {
      // silently ignore
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  // Download via <a> click
  const handleDownload = (upload) => {
    const token = localStorage.getItem("medha_token");
    const url = uploadsAPI.downloadUrl(upload.id);
    // Open URL — Electron will handle it in the system browser/PDF viewer
    const a = document.createElement("a");
    a.href = url;
    a.download = upload.file_name || `upload-${upload.id}.pdf`;
    if (token) {
      // Fetch blob so we can attach the auth header
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          a.href = blobUrl;
          a.click();
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        })
        .catch(() => { a.click(); });
    } else {
      a.click();
    }
  };

  // View inline (opens in new Electron window or system viewer)
  const handleView = (upload) => {
    const token = localStorage.getItem("medha_token");
    const url = uploadsAPI.downloadUrl(upload.id);
    if (window.electronAPI?.shell?.openExternal) {
      window.electronAPI.shell.openExternal(url);
    } else {
      window.open(url, "_blank");
    }
    // If auth is needed, fall back to download
    if (token) {
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, "_blank");
        })
        .catch(() => {});
    }
  };

  // Filtered list
  const visible = uploads.filter((u) => {
    const matchType = filterType === "all" || u.upload_type === filterType;
    const matchName = !searchFile || (u.file_name || "").toLowerCase().includes(searchFile.toLowerCase());
    return matchType && matchName;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Success banner */}
      <AnimatePresence>
        {uploadSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 bg-[#c8f5e4] border border-[#006640]/30 text-[#006640] rounded-xl px-5 py-3 text-sm font-medium"
          >
            <CheckCircle2 size={16} />
            {uploadSuccess}
            <button className="ml-auto" onClick={() => setUploadSuccess("")}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patient selector */}
      <section className="bg-white border border-[#c3c5d9] rounded-xl p-5 shadow-sm">
        <h3 className="text-[13px] font-semibold text-[#434656] uppercase tracking-wider mb-3">
          Select Patient
        </h3>

        {selectedPatient ? (
          <div className="flex items-center justify-between bg-[#f2f4f6] rounded-xl px-4 py-3">
            <div>
              <p className="text-[15px] font-semibold text-[#191c1e]">
                {selectedPatient.full_name || selectedPatient.name}
              </p>
              <p className="text-[12px] text-[#505f76]">
                {selectedPatient.patient_code || selectedPatient.patient_id || selectedPatient.id}
                {selectedPatient.blood_group && ` • ${selectedPatient.blood_group}`}
                {selectedPatient.age && ` • Age ${selectedPatient.age}`}
              </p>
            </div>
            <button
              onClick={() => { setSelectedPatient(null); setUploads([]); }}
              className="text-[11px] font-semibold uppercase tracking-wide text-[#737688] hover:text-[#191c1e] px-3 py-1.5 rounded-lg hover:bg-white transition-all"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center gap-2 border border-[#c3c5d9] rounded-xl px-4 py-2.5 bg-[#f7f9fb] focus-within:border-[#003ec7] transition-colors">
              <Search size={16} className="text-[#737688] shrink-0" />
              <input
                type="text"
                placeholder="Search patient by name or ID…"
                value={patientQuery}
                onChange={(e) => handlePatientQuery(e.target.value)}
                className="flex-1 bg-transparent text-[14px] text-[#191c1e] placeholder:text-[#737688] outline-none"
              />
            </div>
            {patientResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#c3c5d9] rounded-xl shadow-lg z-20 overflow-hidden">
                {patientResults.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectPatient(p)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f2f4f6] transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#dde1ff] text-[#003ec7] flex items-center justify-center text-[11px] font-bold shrink-0">
                      {(p.full_name || p.name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#191c1e]">
                        {p.full_name || p.name}
                      </p>
                      <p className="text-[11px] text-[#737688]">
                        {p.patient_code || p.patient_id || p.id}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Toolbar + Table */}
      {selectedPatient && (
        <section className="bg-white border border-[#c3c5d9] rounded-xl shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#eceef0]">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* File search */}
              <div className="flex items-center gap-2 border border-[#c3c5d9] rounded-lg px-3 py-1.5 bg-[#f7f9fb] w-56 focus-within:border-[#003ec7] transition-colors">
                <Search size={14} className="text-[#737688] shrink-0" />
                <input
                  type="text"
                  placeholder="Search files…"
                  value={searchFile}
                  onChange={(e) => setSearchFile(e.target.value)}
                  className="flex-1 bg-transparent text-[13px] outline-none text-[#191c1e] placeholder:text-[#737688]"
                />
              </div>

              {/* Type filter */}
              <div className="flex items-center gap-1.5 border border-[#c3c5d9] rounded-lg px-3 py-1.5 bg-[#f7f9fb]">
                <Filter size={14} className="text-[#737688]" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-transparent text-[13px] text-[#505f76] outline-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="prescription">Prescription</option>
                  <option value="lab_report">Lab Report</option>
                  <option value="diagnostic">Diagnostic</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <button
              onClick={openModal}
              className="flex items-center gap-2 bg-[#003ec7] hover:bg-[#0038b6] text-white text-[12px] font-semibold tracking-wide px-4 py-2 rounded-lg shadow-sm transition-all shrink-0"
            >
              <FilePlus size={15} />
              Attach File
            </button>
          </div>

          {/* Table */}
          {loadingUploads ? (
            <div className="flex items-center justify-center py-16 gap-3 text-[#737688]">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-[14px]">Loading files…</span>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-[#eceef0] flex items-center justify-center">
                <FileText size={28} className="text-[#c3c5d9]" />
              </div>
              <p className="text-[14px] font-semibold text-[#434656]">No files found</p>
              <p className="text-[12px] text-[#737688]">
                {uploads.length === 0
                  ? 'No uploads for this patient yet. Use "Attach File" to add one.'
                  : "No results match your current filters."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f7f9fb] border-b border-[#eceef0]">
                  {["File Name", "Type", "Notes", "Uploaded By", "Date", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-[11px] font-semibold text-[#434656] uppercase tracking-[0.04em]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((u, i) => (
                  <tr
                    key={u.id}
                    className={cn(
                      "border-b border-[#f2f4f6] hover:bg-[#f7f9fb] transition-colors",
                      i === visible.length - 1 && "border-b-0"
                    )}
                  >
                    {/* File name */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-[#737688] shrink-0" />
                        <span className="text-[13px] font-medium text-[#191c1e] truncate max-w-[200px]">
                          {u.file_name || `upload-${u.id}`}
                        </span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-3">
                      <TypeBadge type={u.upload_type} />
                    </td>

                    {/* Notes */}
                    <td className="px-5 py-3">
                      <span className="text-[12px] text-[#505f76] line-clamp-1 max-w-[160px]">
                        {u.notes || "—"}
                      </span>
                    </td>

                    {/* Uploaded by */}
                    <td className="px-5 py-3">
                      <span className="text-[12px] text-[#505f76]">
                        {u.uploaded_by_name || u.doctor_name || "—"}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3">
                      <span className="text-[12px] text-[#505f76]">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(u)}
                          title="View"
                          className="p-1.5 rounded-lg text-[#505f76] hover:bg-[#dde1ff] hover:text-[#003ec7] transition-all"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDownload(u)}
                          title="Download"
                          className="p-1.5 rounded-lg text-[#505f76] hover:bg-[#c8f5e4] hover:text-[#006640] transition-all"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(u.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-[#505f76] hover:bg-[#ffdad6] hover:text-[#ba1a1a] transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Footer count */}
          {visible.length > 0 && (
            <div className="px-5 py-3 border-t border-[#eceef0] text-[11px] text-[#737688]">
              {visible.length} file{visible.length !== 1 ? "s" : ""}
              {filterType !== "all" || searchFile ? ` (filtered from ${uploads.length})` : ""}
            </div>
          )}
        </section>
      )}

      {/* Empty state when no patient selected */}
      {!selectedPatient && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-[#eceef0] flex items-center justify-center">
            <Upload size={36} className="text-[#c3c5d9]" />
          </div>
          <div>
            <h3 className="text-[18px] font-semibold text-[#434656] mb-1">No patient selected</h3>
            <p className="text-[13px] text-[#737688]">
              Search for a patient above, or tap an NFC card to load one automatically.
            </p>
          </div>
        </div>
      )}

      {/* ── Upload Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[18px] font-semibold text-[#191c1e] tracking-tight">
                    Attach File
                  </h3>
                  <p className="text-[12px] text-[#737688] mt-0.5">
                    For {selectedPatient?.full_name || selectedPatient?.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-[#eceef0] flex items-center justify-center text-[#737688] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* File picker */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl px-4 py-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors mb-4",
                  uploadFile
                    ? "border-[#003ec7]/50 bg-[#dde1ff]/20"
                    : "border-[#c3c5d9] hover:border-[#003ec7]/40 hover:bg-[#f7f9fb]"
                )}
              >
                {uploadFile ? (
                  <>
                    <FileText size={28} className="text-[#003ec7]" />
                    <p className="text-[13px] font-semibold text-[#003ec7] text-center">
                      {uploadFile.name}
                    </p>
                    <p className="text-[11px] text-[#737688]">
                      {(uploadFile.size / 1024).toFixed(1)} KB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload size={28} className="text-[#c3c5d9]" />
                    <p className="text-[13px] font-medium text-[#505f76]">
                      Click to select a file
                    </p>
                    <p className="text-[11px] text-[#737688]">PDF, JPG, PNG — max 10 MB</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Type selector */}
              <div className="mb-4">
                <label className="block text-[12px] font-semibold text-[#434656] uppercase tracking-wider mb-1.5">
                  File Type
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full border border-[#c3c5d9] rounded-lg px-3 py-2 text-[13px] text-[#191c1e] bg-[#f7f9fb] outline-none focus:border-[#003ec7] transition-colors"
                >
                  <option value="prescription">Prescription PDF</option>
                  <option value="lab_report">Lab Report</option>
                  <option value="diagnostic">Diagnostic Report</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Notes */}
              <div className="mb-5">
                <label className="block text-[12px] font-semibold text-[#434656] uppercase tracking-wider mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="e.g. Post-consultation prescription for hypertension"
                  rows={2}
                  className="w-full border border-[#c3c5d9] rounded-lg px-3 py-2 text-[13px] text-[#191c1e] bg-[#f7f9fb] outline-none focus:border-[#003ec7] transition-colors resize-none placeholder:text-[#b0b3c4]"
                />
              </div>

              {/* Error */}
              {uploadError && (
                <div className="flex items-start gap-2 bg-[#ffdad6]/40 border border-[#ffdad6] text-[#93000a] text-[12px] rounded-xl px-4 py-3 mb-4">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {uploadError}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-[#c3c5d9] rounded-lg py-2.5 text-[13px] font-semibold text-[#505f76] hover:bg-[#f2f4f6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-semibold tracking-wide shadow-sm transition-all",
                    !uploadFile || uploading
                      ? "bg-[#c3c5d9] text-white cursor-not-allowed"
                      : "bg-[#003ec7] hover:bg-[#0038b6] text-white"
                  )}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ── */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteId(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            >
              <div className="w-12 h-12 rounded-full bg-[#ffdad6] flex items-center justify-center mb-4">
                <Trash2 size={20} className="text-[#ba1a1a]" />
              </div>
              <h3 className="text-[17px] font-semibold text-[#191c1e] mb-1">Delete file?</h3>
              <p className="text-[13px] text-[#505f76] mb-5">
                This action cannot be undone. The file will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                  className="flex-1 border border-[#c3c5d9] rounded-lg py-2 text-[13px] font-semibold text-[#505f76] hover:bg-[#f2f4f6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-lg py-2 text-[13px] font-semibold transition-colors"
                >
                  {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
