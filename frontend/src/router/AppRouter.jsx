/**
 * SmartComplaintHandler - Master Application Router
 * Blueprint Reference: V1/M1/frontend/04_app_router.md
 * Role: Declarative client-side routing hierarchy enforcing strict role-based access control (RBAC).
 * Enforces role-specific default home redirects, strict technician isolation, and clean path nomenclature.
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
import SquadsPage from '../pages/SquadsPage';
import SuperAdminDashboard from '../pages/SuperAdminDashboard';
import StaffDirectoryPage from '../pages/StaffDirectoryPage';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ResidenceInfo from '../pages/ResidenceInfo';
import { useAuth } from '../context/AuthContext';

/**
 * Smart role-based home redirector.
 * Automatically lands authenticated users on their primary operational workplace.
 */
function RoleHomeRedirect() {
  const { currentUser, authInitializing } = useAuth();

  if (authInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  switch (currentUser.role) {
    case 'STUDENT':
      return <Navigate to="/student" replace />;
    case 'TECHNICIAN':
      return <Navigate to="/technician" replace />;
    case 'ADMIN':
      return <Navigate to="/operations" replace />;
    case 'SUPER_ADMIN':
      return <Navigate to="/superadmin" replace />;
    default:
      return <Navigate to="/map" replace />;
  }
}

/**
 * Route protection guard checking authenticated role permissions.
 */
function ProtectedRoute({ children, allowedRoles, fallbackRoute = '/student' }) {
  const { currentUser, authInitializing } = useAuth();

  if (authInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect unauthorized attempts to their default workplace
    const redirect =
      currentUser.role === 'STUDENT'
        ? '/student'
        : currentUser.role === 'TECHNICIAN'
        ? '/technician'
        : currentUser.role === 'SUPER_ADMIN'
        ? '/superadmin'
        : '/operations';
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
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#A7AD89] hover:bg-[#8C906D] text-[#0A110D] font-bold text-xs rounded-xl shadow-xs transition-colors"
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
        {/* Standalone Authentication & Onboarding Pages (NO Navbar / Footer) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/residence-info" element={<ResidenceInfo />} />
        <Route path="/onboarding" element={<ResidenceInfo />} />

        {/* Main Application Shell (Strictly Protected - Requires Authentication) */}
        <Route path="/" element={<Layout />}>
          {/* Dynamic Role-Based Home Landing */}
          <Route index element={<RoleHomeRedirect />} />

          {/* Institutional Campus Map & Digital Twin Locator */}
          <Route path="map" element={<Home />} />

          {/* Grievance Submission */}
          <Route
            path="submit"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'SUPER_ADMIN']}>
                <SubmitComplaint />
              </ProtectedRoute>
            }
          />

          {/* Ticket Status Tracker */}
          <Route
            path="track"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'SUPER_ADMIN', 'TECHNICIAN']}>
                <TrackTicket />
              </ProtectedRoute>
            }
          />

          {/* Student Self-Service Grievance Portal */}
          <Route
            path="student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'SUPER_ADMIN']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Field Squad Technician Workstation — STRICTLY TECHNICIAN ONLY */}
          <Route
            path="technician"
            element={
              <ProtectedRoute allowedRoles={['TECHNICIAN']} fallbackRoute="/student">
                <TechnicianWorkstation />
              </ProtectedRoute>
            }
          />

          {/* Facilities Operations Console — Replaces /admin with /operations */}
          <Route
            path="operations"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} fallbackRoute="/student">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          {/* Backward-compatibility alias for /admin */}
          <Route path="admin" element={<Navigate to="/operations" replace />} />

          {/* Maintenance Squads & Dispatch Workload Balancer */}
          <Route
            path="squads"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} fallbackRoute="/student">
                <SquadsPage />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Directorate Overview */}
          <Route
            path="superadmin"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']} fallbackRoute="/operations">
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Staff Directory & RBAC Governance */}
          <Route
            path="superadmin/staff"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']} fallbackRoute="/operations">
                <StaffDirectoryPage />
              </ProtectedRoute>
            }
          />
          <Route path="staff" element={<Navigate to="/superadmin/staff" replace />} />

          {/* Data Editor deactivated for now (redirects to /superadmin) */}
          <Route path="superadmin/editor" element={<Navigate to="/superadmin" replace />} />
          <Route path="superadmin/data" element={<Navigate to="/superadmin" replace />} />
          <Route path="data-editor" element={<Navigate to="/superadmin" replace />} />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
