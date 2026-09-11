/**
 * SmartComplaintHandler - Layout Shell
 * Blueprint Reference: V1/M1/frontend/03_layout_and_navigation.md
 * Role: Persistent layout wrapper rendering Navbar, dynamic page Outlet, and Footer.
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
