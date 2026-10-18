import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isDarkPage =
    location.pathname === '/' ||
    location.pathname === '/map' ||
    location.pathname === '/submit' ||
    location.pathname === '/student' ||
    location.pathname === '/track';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200 ${
        isDarkPage
          ? 'bg-[#090D16] text-slate-100'
          : 'bg-[#EDF3EF] text-slate-800'
      }`}
    >
      <Navbar isDark={isDarkPage} />
      <main className={`flex-1 w-full ${isDarkPage ? 'p-0 m-0' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        <Outlet />
      </main>
      <Footer isDark={isDarkPage} />
    </div>
  );
}
