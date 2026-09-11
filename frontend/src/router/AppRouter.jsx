/**
 * SmartComplaintHandler - Application Router
 * Blueprint Reference: V1/M1/frontend/04_app_router.md
 * Role: Configures BrowserRouter route paths (/submit, /track, /admin).
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SubmitComplaint from '../pages/SubmitComplaint';
import TrackTicket from '../pages/TrackTicket';
import AdminDashboard from '../pages/AdminDashboard';

export default function AppRouter() {
  return (
    // Wrap entire application in HTML5 History API router
    <BrowserRouter>
      <Routes>
        {/* Top-level persistent layout shell hosting Navbar, main content outlet, and Footer */}
        <Route path="/" element={<Layout />}>
          
          {/* Default index route: automatically redirects root visits ('/') to the intake form ('/submit') */}
          <Route index element={<Navigate to="/submit" replace />} />
          
          {/* Route for student grievance intake form */}
          <Route path="submit" element={<SubmitComplaint />} />
          
          {/* Route for public ticket tracking stepper by tracking code */}
          <Route path="track" element={<TrackTicket />} />
          
          {/* Route for facility maintenance administrative dashboard and squad dispatch */}
          <Route path="admin" element={<AdminDashboard />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
