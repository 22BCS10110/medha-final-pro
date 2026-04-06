import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/guards/ProtectedRoute";

import Home from "./pages/Home";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";

import AdminOverview from "./pages/admin/pages/DashboardOverview";
import PatientManagement from "./pages/admin/pages/PatientManagement";
import DoctorManagement from "./pages/admin/pages/DoctorManagement";
import BillingAndReceipts from "./pages/admin/pages/BillingAndReceipts";

import DoctorDashboard from "./pages/dashboards/DoctorDashboard";
import PatientDashboard from "./pages/dashboards/PatientDashboard";
import Portal from "./pages/Portal";
import PatientPortal from "./pages/PatientPortal";
import NfcScanPage from "./pages/NfcScanPage";



function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/auth" element={<Portal />} />
          <Route path="/patient-portal" element={<PatientPortal />} />

          {/* Admin Routes - Super Admin & Hospital Admin Only */}
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

          {/* Doctor Routes - Doctor Only */}
          <Route path="/doctor" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          } />

          {/* Patient Routes - Patient Only */}
          <Route path="/patient" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          } />

          {/* NFC Scan - Accessible to all authenticated users */}
          <Route path="/nfc-scan" element={
            <ProtectedRoute allowedRoles={['super_admin', 'hospital_admin', 'doctor']}>
              <NfcScanPage />
            </ProtectedRoute>
          } />
        </Routes>

      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;