/**
 * SmartComplaintHandler - Global Layout Shell
 * Blueprint Reference: V1/M1/frontend/03_layout_and_navigation.md
 * Role: Persistent layout wrapper rendering glassmorphism Navbar, architectural grid background,
 *       dynamic page Outlet, Footer, and Persona Switcher Modal.
 */
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import PersonaSwitcherModal from './PersonaSwitcherModal';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 bg-architectural-grid text-slate-900 font-sans antialiased">
      {/* Top Persistent Glassmorphism Navigation Bar */}
      <Navbar />

      {/* Main Dynamic Viewport Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Outlet />
      </main>

      {/* Role / Persona Switcher Modal */}
      <PersonaSwitcherModal />

      {/* Persistent Global Footer */}
      <Footer />
    </div>
  );
}
