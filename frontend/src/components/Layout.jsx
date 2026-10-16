/**
 * SmartComplaintHandler - Global Layout Shell
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
    <div className="min-h-screen flex flex-col bg-[#0A110D] text-[#DAD0C6] font-sans antialiased selection:bg-[#A7AD89]/30 selection:text-[#FAF7F2]">
      <Navbar />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <PersonaSwitcherModal />
      <Footer />
    </div>
  );
}
