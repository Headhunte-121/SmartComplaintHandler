/**
 * SmartComplaintHandler - Institutional Global Navigation Header
 * Role: Enterprise glassmorphism navigation bar providing university branding, segmented role-tailored
 *       command links, live Supabase/FastAPI heartbeat pill, Google avatar support, and role switcher.
 */
import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const {
    currentUser,
    logout,
    openPersonaModal,
    isStudent,
    isTechnician,
    isAdmin,
    isSuperAdmin,
  } = useAuth();

  const [backendHealthy, setBackendHealthy] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    const healthUrl = apiBase
      ? `${apiBase.replace(/\/api\/v1\/?$/, '')}/health`
      : '/health';

    fetch(healthUrl)
      .then((res) => res.json())
      .then((data) => {
        setBackendHealthy(data.status === 'healthy');
      })
      .catch(() => {
        setBackendHealthy(false);
      });
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClasses = ({ isActive }) =>
    `px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-150 flex items-center space-x-1.5 ${
      isActive
        ? 'bg-slate-900 text-white shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Institutional Brand */}
          <Link
            to={isStudent ? '/submit' : isSuperAdmin ? '/superadmin' : isAdmin ? '/admin' : '/'}
            className="flex items-center space-x-3 group"
          >
            <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200/80 group-hover:border-indigo-200 transition-colors">
              <img
                src="/iiitnr_logo.png"
                alt="IIIT Naya Raipur Logo"
                className="h-8 w-auto object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 tracking-tight leading-tight flex items-center space-x-1.5">
                <span>IIIT Naya Raipur</span>
                <span className="hidden xl:inline-block text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 border border-indigo-200/70">
                  Facilities
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Smart Grievance &amp; SLA Desk
              </p>
            </div>
          </Link>

          {/* Desktop Segmented Navigation Pill */}
          <nav className="hidden md:flex items-center space-x-1 p-1 rounded-2xl bg-slate-100/70 border border-slate-200/60">
            {isStudent && (
              <>
                <NavLink to="/submit" className={navLinkClasses}>
                  <span>Lodge Grievance</span>
                </NavLink>
                <NavLink to="/student" className={navLinkClasses}>
                  <span>My History</span>
                </NavLink>
                <NavLink to="/track" className={navLinkClasses}>
                  <span>Track Status</span>
                </NavLink>
              </>
            )}

            {isTechnician && (
              <>
                <NavLink to="/technician" className={navLinkClasses}>
                  <span>Squad Workstation</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Assigned Queue" />
                </NavLink>
                <NavLink to="/track" className={navLinkClasses}>
                  <span>Track Ticket</span>
                </NavLink>
                <NavLink to="/submit" className={navLinkClasses}>
                  <span>Lodge Hazard</span>
                </NavLink>
              </>
            )}

            {isAdmin && !isSuperAdmin && (
              <>
                <NavLink to="/admin" className={navLinkClasses}>
                  <span>Operations Desk</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" title="Supervisor Console" />
                </NavLink>
                <NavLink to="/technician" className={navLinkClasses}>
                  <span>Squad Dispatches</span>
                </NavLink>
                <NavLink to="/track" className={navLinkClasses}>
                  <span>Ticket Tracker</span>
                </NavLink>
                <NavLink to="/submit" className={navLinkClasses}>
                  <span>Lodge Issue</span>
                </NavLink>
              </>
            )}

            {isSuperAdmin && (
              <>
                <NavLink to="/superadmin" className={navLinkClasses}>
                  <span>👑 Directorate</span>
                </NavLink>
                <NavLink to="/admin" className={navLinkClasses}>
                  <span>Operations Desk</span>
                </NavLink>
                <NavLink to="/technician" className={navLinkClasses}>
                  <span>Squads</span>
                </NavLink>
                <NavLink to="/track" className={navLinkClasses}>
                  <span>Tracker</span>
                </NavLink>
                <NavLink to="/submit" className={navLinkClasses}>
                  <span>Lodge Issue</span>
                </NavLink>
              </>
            )}
          </nav>

          {/* Right Header Area: Live Heartbeat & Authenticated Account */}
          <div className="hidden sm:flex items-center space-x-2.5">
            {/* System Health Heartbeat */}
            <div
              className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                backendHealthy === true
                  ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200'
                  : backendHealthy === false
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
              title={backendHealthy ? 'FastAPI & Supabase Connected' : 'Service Desk Backend Offline'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  backendHealthy === true
                    ? 'bg-emerald-500 animate-pulse'
                    : backendHealthy === false
                    ? 'bg-rose-500'
                    : 'bg-slate-400'
                }`}
              />
              <span>{backendHealthy ? 'Online' : 'Offline'}</span>
            </div>

            {currentUser ? (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={openPersonaModal}
                  className="flex items-center space-x-2.5 pl-2 pr-3 py-1.5 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-indigo-200 text-left shadow-2xs transition-all cursor-pointer"
                  title="Click to view or switch institutional role persona"
                >
                  {currentUser.avatar_url ? (
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-sm">
                      {currentUser.avatar || '👤'}
                    </span>
                  )}
                  <div className="leading-tight">
                    <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                      <span className="truncate max-w-[115px]">{currentUser.name}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                          currentUser.badgeClass || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {currentUser.roleLabel || currentUser.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                      {currentUser.email}
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200/70 transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center space-x-2">
            {currentUser && (
              <button
                type="button"
                onClick={openPersonaModal}
                className="p-1.5 text-sm rounded-xl border border-slate-200 bg-white"
              >
                {currentUser?.avatar || '👤'}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 space-y-1.5 animate-fade-in">
            {isStudent && (
              <>
                <NavLink
                  to="/submit"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-100"
                >
                  Lodge Grievance
                </NavLink>
                <NavLink
                  to="/student"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50/60 rounded-xl"
                >
                  My History
                </NavLink>
                <NavLink
                  to="/track"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-100"
                >
                  Track Status
                </NavLink>
              </>
            )}

            {isSuperAdmin && (
              <>
                <NavLink
                  to="/superadmin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-xs font-bold text-amber-800 bg-amber-50/70 rounded-xl"
                >
                  👑 Super Admin Directorate
                </NavLink>
                <NavLink
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-xs font-bold text-purple-800 rounded-xl hover:bg-purple-50"
                >
                  Operations Desk
                </NavLink>
              </>
            )}

            {isAdmin && !isSuperAdmin && (
              <NavLink
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-xs font-bold text-purple-800 bg-purple-50/60 rounded-xl"
              >
                Operations Desk
              </NavLink>
            )}

            {isTechnician && (
              <NavLink
                to="/technician"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-xs font-bold text-amber-800 bg-amber-50/60 rounded-xl"
              >
                Squad Workstation Console
              </NavLink>
            )}

            {currentUser && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                Sign Out ({currentUser.name})
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
