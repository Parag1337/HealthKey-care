import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorLogin from './pages/DoctorLogin';
import { PatientOverviewPage } from './pages/patient/OverviewPage';
import { PatientRecordsPage } from './pages/patient/RecordsPage';
import { PatientPrescriptionsPage } from './pages/patient/PrescriptionsPage';
import { PatientVitalsPage } from './pages/patient/VitalsPage';
import { PatientAccessControlPage } from './pages/patient/AccessControlPage';
import { PatientAuditPage } from './pages/patient/AuditPage';
import { ConnectDoctorPage } from './pages/patient/ConnectDoctorPage';
import { FindDoctorPage } from './pages/patient/FindDoctorPage';
import { DoctorDetailPage } from './pages/patient/DoctorDetailPage';
import { PatientAppointmentsPage } from './pages/patient/AppointmentsPage';
import { ConnectPage } from './pages/ConnectPage';
import { DoctorOverviewPage } from './pages/doctor/OverviewPage';
import { DoctorAppointmentsPage } from './pages/doctor/AppointmentsPage';
import { DoctorProfilePage } from './pages/doctor/ProfilePage';
import { DoctorRequestsPage } from './pages/doctor/RequestsPage';
import { DoctorPatientsPage } from './pages/doctor/PatientsPage';
import { DoctorPatientDetailPage } from './pages/doctor/PatientDetailPage';
import { DoctorRecordsPage } from './pages/doctor/RecordsPage';
import { DoctorPrescriptionsPage } from './pages/doctor/PrescriptionsPage';
import { DoctorVitalsPage } from './pages/doctor/VitalsPage';
import { MyQrPage } from './pages/doctor/MyQrPage';
import { DoctorAuditPage } from './pages/doctor/AuditPage';

const FullScreenLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-ink-50 text-sm text-ink-500">
    Loading…
  </div>
);

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoading />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'doctor' ? '/doctor' : '/dashboard'} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/doctor-login" element={user ? <Navigate to="/doctor" replace /> : <DoctorLogin />} />
      <Route path="/connect/doctor/:token" element={<ConnectPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={['patient']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<PatientOverviewPage />} />
        <Route path="records" element={<PatientRecordsPage />} />
        <Route path="prescriptions" element={<PatientPrescriptionsPage />} />
        <Route path="vitals" element={<PatientVitalsPage />} />
        <Route path="access" element={<PatientAccessControlPage />} />
        <Route path="audit" element={<PatientAuditPage />} />
        <Route path="connect" element={<ConnectDoctorPage />} />
        <Route path="doctors" element={<FindDoctorPage />} />
        <Route path="doctors/:id" element={<DoctorDetailPage />} />
        <Route path="appointments" element={<PatientAppointmentsPage />} />
      </Route>

      <Route
        path="/doctor"
        element={
          <ProtectedRoute roles={['doctor']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<DoctorOverviewPage />} />
        <Route path="requests" element={<DoctorRequestsPage />} />
        <Route path="patients" element={<DoctorPatientsPage />} />
        <Route path="patients/:patientId" element={<DoctorPatientDetailPage />} />
        <Route path="records" element={<DoctorRecordsPage />} />
        <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
        <Route path="vitals" element={<DoctorVitalsPage />} />
        <Route path="my-qr" element={<MyQrPage />} />
        <Route path="audit" element={<DoctorAuditPage />} />
        <Route path="appointments" element={<DoctorAppointmentsPage />} />
        <Route path="profile" element={<DoctorProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;