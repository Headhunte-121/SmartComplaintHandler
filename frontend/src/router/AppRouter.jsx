/**
 * SmartComplaintHandler - Master Application Router
 * Blueprint Reference: V1/M1/frontend/04_app_router.md
 * Role: Declarative client-side routing hierarchy enforcing strict role-based access control (RBAC).
 * Domain: Restricts students strictly to Lodge Grievance (/submit), My History (/student), and Tracker (/track).
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import SubmitComplaint from '../pages/SubmitComplaint';
import TrackTicket from '../pages/TrackTicket';
import AdminDashboard from '../pages/AdminDashboard';
import StudentDashboard from '../pages/StudentDashboard';
import TechnicianWorkstation from '../pages/TechnicianWorkstation';
import SuperAdminDashboard from '../pages/SuperAdminDashboard';
import Login from '../pages/Login';
import DeveloperLab from '../pages/DeveloperLab';
import { useAuth } from '../context/AuthContext';

/**
 * Route protection guard checking authenticated role permissions.
 */
function ProtectedRoute({ children, allowedRoles, fallbackRoute = '/submit' }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect unauthorized attempts to their default workplace
    const redirect = currentUser.role === 'STUDENT' ? '/submit' : currentUser.role === 'SUPER_ADMIN' ? '/superadmin' : '/admin';
    return <Navigate to={redirect} replace />;
  }

  return children;
}

function NotFound() {
  return (
    <div className="text-center py-20 space-y-5 animate-fade-in max-w-md mx-auto">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-2xl font-black">
        404
      </div>
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-slate-900">Resource Not Found</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The requested service URL was not located on the Campus Facilities service desk directory.
        </p>
      </div>
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <span>Return to Facilities Home</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Institutional Homepage */}
          <Route index element={<Home />} />

          {/* Institutional SSO Login */}
          <Route path="login" element={<Login />} />

          {/* Grievance Submission — Accessible to students, staff, and faculty */}
          <Route path="submit" element={<SubmitComplaint />} />

          {/* Public Status Tracker */}
          <Route path="track" element={<TrackTicket />} />

          {/* Student Self-Service Grievance Portal — Accessible to Students & Admins */}
          <Route path="student" element={<StudentDashboard />} />

          {/* Field Squad Technician Workstation — Protected for Staff & Admins */}
          <Route
            path="technician"
            element={
              <ProtectedRoute allowedRoles={['TECHNICIAN', 'ADMIN', 'SUPER_ADMIN']}>
                <TechnicianWorkstation />
              </ProtectedRoute>
            }
          />

          {/* Facilities Staff Operations Console — Strictly Protected from Students */}
          <Route
            path="admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} fallbackRoute="/submit">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Control Directorate — Strictly Protected for SUPER_ADMIN */}
          <Route
            path="superadmin"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']} fallbackRoute="/admin">
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Technical Architecture & Component Verification */}
          <Route path="developer" element={<DeveloperLab />} />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
