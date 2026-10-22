import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
  const { currentUser, authInitializing } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const isDirectorateDashboard = location.pathname.replace(/\/$/, '') === '/superadmin';

  if (authInitializing) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0e1117] text-zinc-100' : 'bg-slate-50 text-slate-800'}`}>
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading campus session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-200 ${
        isDark
          ? 'bg-[#0e1117] text-zinc-100 selection:bg-zinc-700 selection:text-white'
          : 'bg-white text-slate-800 selection:bg-slate-200 selection:text-slate-900'
      }`}
    >
      {!isDirectorateDashboard && <Navbar />}
      <main className={`flex-1 w-full max-w-none min-w-0 p-0 m-0 ${isDirectorateDashboard ? 'overflow-x-hidden' : ''}`}>
        <Outlet />
      </main>
      {!isDirectorateDashboard && <Footer isDark={isDark} />}
    </div>
  );
}
