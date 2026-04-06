import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://127.0.0.1:8000";

export default function NfcScanPage() {
  const { user } = useAuth();
  const [patientId, setPatientId] = useState("");
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPatient = async (id) => {
    if (!id.trim()) return;
    setLoading(true);
    setError("");
    setPatient(null);
    try {
      const token = localStorage.getItem("medha_token");
      const res = await fetch(`${API_BASE}/api/patients/nfc-scan/?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (res.ok) {
        setPatient(data);
      } else {
        setError(data.error || "Patient not found");
      }
    } catch (e) {
      setError("Network error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchPatient(patientId);
  };

  // Auto-focus for NFC reader (most NFC readers act as keyboard input)
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>NFC Patient Lookup</h1>

      {/* Scan Input */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <input
          autoFocus
          type="text"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          placeholder="Scan NFC card or enter Patient ID..."
          style={{
            flex: 1,
            padding: "12px 16px",
            fontSize: 16,
            border: "2px solid #e0e0e0",
            borderRadius: 8,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 24px",
            fontSize: 16,
            fontWeight: 600,
            background: loading ? "#ccc" : "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div style={{ padding: 16, background: "#ffebee", borderRadius: 8, color: "#c62828", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Patient Data */}
      {patient && (
        <div style={{ background: "#f5f5f5", borderRadius: 12, padding: 24 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 20 }}>{patient.full_name}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Info label="Patient ID" value={patient.patient_id} />
            <Info label="Email" value={patient.email || "N/A"} />
            <Info label="Phone" value={patient.phone || "N/A"} />
            <Info label="Gender" value={{ M: "Male", F: "Female", O: "Other" }[patient.gender] || patient.gender} />
            <Info label="Blood Group" value={patient.blood_group || "N/A"} />
            <Info label="Status" value={patient.status} />
            <Info label="ABHA ID" value={patient.abha_id || "N/A"} />
            <Info label="Date of Birth" value={patient.date_of_birth || "N/A"} />
          </div>

          {patient.allergies && (
            <div style={{ marginTop: 16, padding: 12, background: "#fff3e0", borderRadius: 8 }}>
              <strong>Allergies:</strong> {patient.allergies}
            </div>
          )}

          {patient.reason_for_visit && (
            <div style={{ marginTop: 12, padding: 12, background: "#e8f5e9", borderRadius: 8 }}>
              <strong>Reason for Visit:</strong> {patient.reason_for_visit}
            </div>
          )}

          {/* Hospital Visits */}
          {patient.hospital_visits && patient.hospital_visits.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ margin: "0 0 8px" }}>Hospital Visits</h3>
              {patient.hospital_visits.map((v, i) => (
                <div key={i} style={{ padding: 8, background: "#fff", borderRadius: 6, marginBottom: 6 }}>
                  <strong>{v.hospital}</strong> — {new Date(v.date).toLocaleDateString()}
                  {v.active && <span style={{ marginLeft: 8, color: "#4caf50" }}>(Active)</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ padding: 8 }}>
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500 }}>{value}</div>
    </div>
  );
}