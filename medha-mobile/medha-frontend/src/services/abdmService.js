/**
 * ABDM Simulator — Frontend API Service
 * =======================================
 * Calls the backend ABDM simulation endpoints.
 * In production, these map to real ABDM APIs.
 */
import api from "./api";

// ═══ ABDM STATUS ═══
export const abdmAPI = {
  /** Get overall ABDM simulation status */
  getStatus: () => api.get("/abdm/status/"),

  // ── ABHA ──────────────────────────────────────────
  /** Create a new ABHA ID (simulated) */
  createABHA: (data) => api.post("/abdm/abha/create/", data),

  /** Link existing ABHA to a patient */
  linkABHA: (data) => api.post("/abdm/abha/link/", data),

  /** Verify an ABHA ID */
  verifyABHA: (abhaNumber) => api.get(`/abdm/abha/verify/${abhaNumber}/`),

  /** List all ABHA records */
  listABHA: () => api.get("/abdm/abha/list/"),

  // ── CONSENT ───────────────────────────────────────
  /** Create a new consent request (doctor action) */
  createConsent: (data) => api.post("/abdm/consent/create/", data),

  /** List consent requests (filtered by role) */
  listConsents: (params) => api.get("/abdm/consent/list/", { params }),

  /** Get consent details */
  getConsent: (consentId) => api.get(`/abdm/consent/${consentId}/`),

  /** Approve a consent request (patient action) */
  approveConsent: (consentId) =>
    api.post(`/abdm/consent/${consentId}/action/`, { action: "approve" }),

  /** Deny a consent request (patient action) */
  denyConsent: (consentId, reason = "") =>
    api.post(`/abdm/consent/${consentId}/action/`, { action: "deny", reason }),

  /** Revoke a granted consent (patient action) */
  revokeConsent: (consentId, reason = "") =>
    api.post(`/abdm/consent/${consentId}/action/`, {
      action: "revoke",
      reason,
    }),

  // ── HIU DATA FETCH ────────────────────────────────
  /** Fetch patient data using a granted consent (FHIR Bundle) */
  fetchHealthData: (consentRequestId) =>
    api.post("/abdm/hiu/fetch/", { consent_request_id: consentRequestId }),

  // ── AUDIT ─────────────────────────────────────────
  /** Get ABDM audit log */
  getAuditLog: (params) => api.get("/abdm/audit/", { params }),
};

export default abdmAPI;
