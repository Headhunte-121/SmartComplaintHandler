/**
 * SmartComplaintHandler - Master Application Router
 * Blueprint Reference: V1/M1/frontend/04_app_router.md
 * Role: Declarative client-side routing hierarchy mapping university portal pages inside the persistent layout.
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import SubmitComplaint from '../pages/SubmitComplaint';
import TrackTicket from '../pages/TrackTicket';
import AdminDashboard from '../pages/AdminDashboard';
import Login from '../pages/Login';
import DeveloperLab from '../pages/DeveloperLab';

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

          {/* Grievance Submission */}
          <Route path="submit" element={<SubmitComplaint />} />

          {/* Public Status Tracker */}
          <Route path="track" element={<TrackTicket />} />

          {/* Facilities Staff Operations Console */}
          <Route path="admin" element={<AdminDashboard />} />

          {/* Campus SSO & Role Authentication */}
          <Route path="login" element={<Login />} />

          {/* Technical Architecture & Component Verification */}
          <Route path="developer" element={<DeveloperLab />} />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
