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

  return (
    <div
      className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-200 ${
        isDark
          ? 'bg-[#0e1117] text-zinc-100 selection:bg-zinc-700 selection:text-white'
          : 'bg-white text-slate-800 selection:bg-slate-200 selection:text-slate-900'
      }`}
    >
      <Navbar />
      <main className="flex-1 w-full p-0 m-0">
        <Outlet />
      </main>
      <Footer isDark={isDark} />
    </div>
  );
}
