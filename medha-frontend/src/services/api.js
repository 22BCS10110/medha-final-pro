import axios from "axios";

// In Electron production builds there's no Vite proxy, so we need the full backend URL.
// In dev mode with Vite, the proxy handles /api -> localhost:8000.
const isElectronProd = window.electronAPI?.isElectron && !import.meta.env.DEV;
const API_BASE = import.meta.env.VITE_API_URL || (isElectronProd ? "http://127.0.0.1:8000" : "");
const NFC_API_BASE = import.meta.env.VITE_NFC_API_URL || "http://localhost:8010";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach JWT Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("medha_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 with token refresh
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("medha_refresh_token");
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/api/auth/refresh/`, {
            refresh: refreshToken,
          });
          const newAccess = res.data.access;
          localStorage.setItem("medha_token", newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch {
          // Refresh failed — clear session
          localStorage.removeItem("medha_token");
          localStorage.removeItem("medha_refresh_token");
          localStorage.removeItem("medha_user");
          window.location.href = "/";
        }
      } else {
        const hadToken = localStorage.getItem("medha_token");
        if (hadToken) {
          localStorage.removeItem("medha_token");
          localStorage.removeItem("medha_user");
          window.location.href = "/";
        }
      }
    }
    return Promise.reject(err);
  }
);

// ═══ AUTH ═══
export const authAPI = {
  login: (data) => api.post("/auth/login/", data),
  googleLogin: (credential) => api.post("/auth/google/", { credential }),
  logout: (refresh) => api.post("/auth/logout/", { refresh }),
  refresh: (refresh) => api.post("/auth/refresh/", { refresh }),
  me: () => api.get("/auth/me/"),
};

// Patient auth API (for PatientPortal)
export const patientAuthAPI = {
  login: async (email, password) => {
    const res = await api.post("/auth/login/", { username: email, password });
    return res.data;
  },
  register: async (data) => {
    const res = await api.post("/auth/register/", data);
    return res.data;
  },
};

// ═══ PATIENTS ═══
export const patientsAPI = {
  list: (params) => api.get("/patients/", { params }),
  get: (id) => api.get(`/patients/${id}/`),
  create: (data) => api.post("/patients/", data),
  update: (id, data) => api.put(`/patients/${id}/`, data),
  delete: (id) => api.delete(`/patients/${id}/`),
  search: (q) => api.get("/patients/search/", { params: { q } }),
  getByNfcUid: (uid) => api.get(`/patients/by-nfc/${encodeURIComponent(uid)}/`),
  assignNfc: (patientId, nfcUid) => api.post('/patients/assign-nfc/', { patient_id: patientId, nfc_uid: nfcUid }),
  nfcStatus: (patientId) => api.get(`/patients/${encodeURIComponent(patientId)}/nfc-status/`),
};

// ═══ DOCTORS ═══
export const doctorsAPI = {
  list: (params) => api.get("/doctors/", { params }),
  get: (id) => api.get(`/doctors/${id}/`),
  create: (data) => api.post("/doctors/", data),
  update: (id, data) => api.put(`/doctors/${id}/`, data),
  delete: (id) => api.delete(`/doctors/${id}/`),
};

// ═══ APPOINTMENTS ═══
export const appointmentsAPI = {
  list: (params) => api.get("/appointments/", { params }),
  get: (id) => api.get(`/appointments/${id}/`),
  create: (data) => api.post("/appointments/", data),
  update: (id, data) => api.put(`/appointments/${id}/`, data),
};

// ═══ PRESCRIPTIONS ═══
export const prescriptionsAPI = {
  list: (params) => api.get("/prescriptions/", { params }),
  create: (data) => api.post("/prescriptions/", data),
};

// ═══ RECORDS ═══
export const recordsAPI = {
  list: (params) => api.get("/records/", { params }),
  get: (id) => api.get(`/records/${id}/`),
  create: (data) => api.post("/records/", data),
};

// ═══ BILLING ═══
export const billingAPI = {
  receipts: (params) => api.get("/billing/receipts/", { params }),
  createReceipt: (data) => api.post("/billing/receipts/", data),
  summary: () => api.get("/billing/summary/"),
};

// ═══ REPORTS ═══
export const reportsAPI = {
  get: () => api.get("/reports/"),
};

// ═══ HOSPITAL ═══
export const hospitalAPI = {
  getSettings: () => api.get("/hospital/settings/"),
  updateSettings: (data) => api.put("/hospital/settings/", data),
};

// ═══ CONTACT ═══
export const contactAPI = {
  submit: (data) => api.post("/contact/enquiry/", data),
};

// ═══ DASHBOARD ═══
export const dashboardAPI = {
  admin: () => api.get("/dashboard/admin/"),
  doctor: () => api.get("/dashboard/doctor/"),
  patient: () => api.get("/dashboard/patient/"),
};

// ═══ CHAT ═══
export const chatAPI = {
  listRooms: () => api.get("/chat/rooms/"),
  createRoom: (data) => api.post("/chat/rooms/create/", data),
  getMessages: (roomId, params) => api.get(`/chat/rooms/${roomId}/messages/`, { params }),
  sendMessage: (roomId, content) => api.post(`/chat/rooms/${roomId}/send/`, { content }),
};

// ═══ NFC BRIDGE API (FastAPI) ═══
const nfcApi = axios.create({
  baseURL: NFC_API_BASE,
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
});

let nfcToken = null;
const getNfcToken = async (forceRefresh = false) => {
  if (nfcToken && !forceRefresh) return nfcToken;
  const username = import.meta.env.VITE_NFC_API_USER || "nfc";
  const password = import.meta.env.VITE_NFC_API_PASSWORD || "nfc123";
  const form = new URLSearchParams();
  form.set("username", username);
  form.set("password", password);
  const res = await nfcApi.post("/token", form);
  nfcToken = res.data.access_token;
  return nfcToken;
};

const nfcGet = async (path) => {
  let token = await getNfcToken();
  try {
    return await axios.get(`${NFC_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    if (err?.response?.status === 401) {
      token = await getNfcToken(true);
      return axios.get(`${NFC_API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    throw err;
  }
};

export const nfcAPI = {
  resetAuth: () => { nfcToken = null; },
  latestScan: () => nfcGet("/scan/latest"),
  patientById: (patientId) => nfcGet(`/patient/${encodeURIComponent(patientId)}`),
};

export default api;
