import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './index.css';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Laboratory from './pages/Laboratory';
import Pharmacy from './pages/Pharmacy';
import Billing from './pages/Billing';
import SystemLogs from './pages/SystemLogs';
import UserApprovals from './pages/UserApprovals';

import { Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterPatient from './pages/RegisterPatient';
import Portal from './pages/Portal';
import PatientDashboard from './pages/PatientDashboard';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="animate-fade-in">
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
            <Route path="/laboratory" element={<ProtectedRoute><Laboratory /></ProtectedRoute>} />
            <Route path="/pharmacy" element={<ProtectedRoute><Pharmacy /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/system-logs" element={<ProtectedRoute><SystemLogs /></ProtectedRoute>} />
            <Route path="/approvals" element={<ProtectedRoute><UserApprovals /></ProtectedRoute>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-patient" element={<RegisterPatient />} />
        <Route path="/patient-dashboard" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </Router>
  );
}

export default App;
