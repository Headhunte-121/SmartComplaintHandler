/**
 * SmartComplaintHandler - Global Layout Shell
 * Blueprint Reference: V1/M1/frontend/03_layout_and_navigation.md
 * Role: Persistent layout wrapper rendering Navbar, dynamic page Outlet, Footer, and Persona Switcher Modal.
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import PersonaSwitcherModal from './PersonaSwitcherModal';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Top Persistent Navigation Bar */}
      <Navbar />

      {/* Main Dynamic Viewport Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Persistent Global Footer */}
      <Footer />

      {/* Global Persona Switcher Modal */}
      <PersonaSwitcherModal />
    </div>
  );
}
