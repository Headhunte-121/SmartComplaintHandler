/**
 * SmartComplaintHandler - Application Router
 * Blueprint Reference: V1/M1/frontend/04_app_router.md
 * Role: Declarative route registry mounting page components within the persistent Layout shell.
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SubmitComplaint from '../pages/SubmitComplaint';
import TrackTicket from '../pages/TrackTicket';
import AdminDashboard from '../pages/AdminDashboard';
import DeveloperLab from '../pages/DeveloperLab';

function NotFound() {
  return (
    <div className="text-center py-16 space-y-4 animate-fade-in">
      <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-2xl font-bold">
        404
      </div>
      <h2 className="text-xl font-black text-slate-800">Page Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm mx-auto">
        The requested URL was not recognized by the Smart Complaint Handler application router.
      </p>
      <Link
        to="/"
        className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
      >
        Return to Complaint Submission
      </Link>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Default / Submit Grievance */}
          <Route index element={<SubmitComplaint />} />
          <Route path="submit" element={<SubmitComplaint />} />

          {/* Student Status Tracker */}
          <Route path="track" element={<TrackTicket />} />

          {/* Administrative / Staff Operations Desk */}
          <Route path="admin" element={<AdminDashboard />} />

          {/* Component Laboratory & Viva Demonstration */}
          <Route path="developer" element={<DeveloperLab />} />

          {/* Fallback 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
