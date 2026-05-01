import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./auth/AuthContext";
import ScrollToTop from "./ScrollToTop";

// ═══════════════════════════════════════════════════════════
//  ENVIRONMENT DETECTION
// ═══════════════════════════════════════════════════════════

const isElectron = !!window.electronAPI?.isElectron;
const Router = isElectron ? HashRouter : BrowserRouter;

// ═══════════════════════════════════════════════════════════
//  WEBSITE (BROWSER) — Marketing pages only
// ═══════════════════════════════════════════════════════════

import Home from "./features/marketing/Home";
import About from "./features/marketing/About";
import Pricing from "./features/marketing/Pricing";
import Contact from "./features/marketing/Contact";
import Portal from "./auth/Portal";               // Download page
import PatientPortal from "./auth/PatientPortal";
import LoginPage from "./auth/LoginPage";
import DesktopOnlyRedirect from "./components/DesktopOnlyRedirect";

// ═══════════════════════════════════════════════════════════
//  DESKTOP (ELECTRON) — Lazy-loaded, excluded from web bundle
// ═══════════════════════════════════════════════════════════

const AdminOverview      = lazy(() => import("./features/admin/DashboardOverview"));
const PatientManagement  = lazy(() => import("./features/admin/PatientManagement"));
const DoctorManagement   = lazy(() => import("./features/admin/DoctorManagement"));
const BillingAndReceipts = lazy(() => import("./features/admin/BillingAndReceipts"));
const DoctorDashboard    = lazy(() => import("./features/doctor/DoctorDashboard"));
const PatientDashboard   = lazy(() => import("./features/patient/PatientDashboard"));
const NfcScanPage        = lazy(() => import("./features/nfc/NfcScanPage"));
const ChatPage           = lazy(() => import("./features/chat/ChatPage"));
const LoginModal         = lazy(() => import("./auth/LoginModal"));

// Lazy-load wrapper + auth guard (only used in Electron)
import { ProtectedRoute } from "./auth/ProtectedRoute";

function DesktopLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading…</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  APP
// ═══════════════════════════════════════════════════════════

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<DesktopLoading />}>
          <Routes>

            {/* ─── WEBSITE ROUTES (always available) ─── */}

            {/* In Electron, "/" redirects to login. In browser, "/" is the landing page. */}
            <Route path="/" element={isElectron ? <Navigate to="/auth" replace /> : <Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/download" element={<Portal />} />
            <Route path="/patient-portal" element={<PatientPortal />} />

            {/* ─── DESKTOP-ONLY ROUTES ─── */}

            {/* Auth */}
            <Route path="/portal" element={<Portal />} />
            <Route path="/auth" element={<LoginPage />} />

            {/* Admin Routes — Super Admin & Hospital Admin (available in browser + Electron) */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['super_admin', 'hospital_admin']}>
                <AdminOverview />
              </ProtectedRoute>
            } />
            <Route path="/admin/patients" element={
              <ProtectedRoute allowedRoles={['super_admin', 'hospital_admin']}>
                <PatientManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/doctors" element={
              <ProtectedRoute allowedRoles={['super_admin', 'hospital_admin']}>
                <DoctorManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/registration" element={
              <ProtectedRoute allowedRoles={['super_admin', 'hospital_admin']}>
                <PatientManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/billing" element={
              <ProtectedRoute allowedRoles={['super_admin', 'hospital_admin']}>
                <BillingAndReceipts />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute allowedRoles={['super_admin', 'hospital_admin']}>
                <AdminOverview />
              </ProtectedRoute>
            } />

            {/* Doctor Routes */}
            <Route path="/doctor" element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            } />

            {/* Patient Routes */}
            <Route path="/patient" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            } />

            {/* NFC Scan — staff only */}
            <Route path="/nfc-scan" element={
              <ProtectedRoute allowedRoles={['super_admin', 'hospital_admin', 'doctor']}>
                <NfcScanPage />
              </ProtectedRoute>
            } />

            {/* Chat — Doctors and Patients */}
            <Route path="/chat" element={
              <ProtectedRoute allowedRoles={['doctor', 'patient']}>
                <ChatPage />
              </ProtectedRoute>
            } />

            {/* Fallback — redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
