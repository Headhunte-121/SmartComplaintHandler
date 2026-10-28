import React, { useState } from 'react';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import ModernSidebar from './ModernSidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
  const { currentUser, authInitializing, isSuperAdmin, isAdmin, isTechnician } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (authInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050608] text-zinc-100">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-xs font-mono text-zinc-400 tracking-wider uppercase">Loading Command Desk...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const roleTitle = isSuperAdmin
    ? 'Directorate'
    : isAdmin
    ? 'Operations Desk'
    : isTechnician
    ? 'Field Technician'
    : 'Student Portal';

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 font-sans antialiased selection:bg-white/20 selection:text-white flex flex-col lg:flex-row">
      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-white/[0.08] bg-[#07080c]/90 px-4 backdrop-blur-xl shadow-lg">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-white/[0.05] border border-white/[0.1] p-1 flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
            <img src="/iiitnr_logo.png" alt="IIIT-NR" className="h-full w-full object-contain" />
          </div>
          <div>
            <span className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
              IIIT-NR
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff5722]" />
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block -mt-0.5">
              {roleTitle}
            </span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-xl border border-white/[0.1] bg-white/[0.04] p-2 text-zinc-300 hover:text-white transition cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>
      </header>

      {/* Universal Desktop & Mobile Sidebar */}
      <ModernSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Viewport */}
      <div className="min-w-0 flex-1 w-full bg-[#050608] text-zinc-100">
        <Outlet />
      </div>
    </div>
  );
}
