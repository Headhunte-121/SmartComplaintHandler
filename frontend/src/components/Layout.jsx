import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isFlushPage =
    location.pathname === '/' ||
    location.pathname === '/map' ||
    location.pathname === '/submit';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-200 ${
        isDark
          ? 'bg-[#0e1117] text-zinc-100 selection:bg-zinc-700 selection:text-white'
          : 'bg-[#f8fafc] text-slate-800 selection:bg-slate-200 selection:text-slate-900'
      }`}
    >
      <Navbar />
      <main className={`flex-1 w-full ${isFlushPage ? 'p-0 m-0' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        <Outlet />
      </main>
      <Footer isDark={isDark} />
    </div>
  );
}
