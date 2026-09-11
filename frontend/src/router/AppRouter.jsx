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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/submit" replace />} />
          <Route path="submit" element={<SubmitComplaint />} />
          <Route path="track" element={<TrackTicket />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
