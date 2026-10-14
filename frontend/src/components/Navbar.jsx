/**
 * SmartComplaintHandler - Institutional Global Navigation Header
 * Role: Primary navigation bar providing university branding, role-tailored links,
 *       backend service heartbeat, and authenticated institutional account state.
 * Domain: Enforces strict student isolation (only Lodge Grievance, My History, Track Status).
 */
import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const {
    currentUser,
    logout,
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
    `px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 shadow-2xs font-extrabold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Institutional Brand */}
          <Link
            to={isStudent ? '/submit' : isSuperAdmin ? '/superadmin' : isAdmin ? '/admin' : '/'}
            className="flex items-center space-x-3 group"
          >
            <img
              src="/iiitnr_logo.png"
              alt="IIIT Naya Raipur Logo"
              className="h-10 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="text-sm font-black text-slate-900 tracking-tight leading-tight">
                IIIT Naya Raipur
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Campus Facilities & Grievance Portal
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links — Strictly Role Isolated */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* Student View: ONLY Lodge Grievance, My History, Track Status */}
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

            {/* Field Technician View */}
            {isTechnician && (
              <>
                <NavLink to="/technician" className={navLinkClasses}>
                  <span>Squad Workstation</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" title="Assigned Queue" />
                </NavLink>
                <NavLink to="/track" className={navLinkClasses}>
                  <span>Track Ticket</span>
                </NavLink>
                <NavLink to="/submit" className={navLinkClasses}>
                  <span>Lodge Hazard</span>
                </NavLink>
              </>
            )}

            {/* Facility Admin View */}
            {isAdmin && !isSuperAdmin && (
              <>
                <NavLink to="/admin" className={navLinkClasses}>
                  <span>Operations Desk</span>
                  <span className="w-2 h-2 rounded-full bg-purple-500 ml-1" title="Supervisor Console" />
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

            {/* Super Admin View */}
            {isSuperAdmin && (
              <>
                <NavLink to="/superadmin" className={navLinkClasses}>
                  <span>👑 Super Admin</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" title="Directorate Control" />
                </NavLink>
                <NavLink to="/admin" className={navLinkClasses}>
                  <span>Operations Desk</span>
                </NavLink>
                <NavLink to="/technician" className={navLinkClasses}>
                  <span>Squad Workstation</span>
                </NavLink>
                <NavLink to="/track" className={navLinkClasses}>
                  <span>Audit Tracker</span>
                </NavLink>
                <NavLink to="/submit" className={navLinkClasses}>
                  <span>Lodge Grievance</span>
                </NavLink>
              </>
            )}
          </nav>

          {/* Right Header Area: Live Heartbeat & Authenticated Account */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* System Health Heartbeat */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                backendHealthy === true
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : backendHealthy === false
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
              title={backendHealthy ? 'FastAPI Services Online' : 'Service Desk Backend Offline'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealthy === true
                    ? 'bg-emerald-500 animate-pulse'
                    : backendHealthy === false
                    ? 'bg-rose-500'
                    : 'bg-slate-400'
                }`}
              />
              <span>{backendHealthy ? 'Services Active' : 'System Offline'}</span>
            </div>

            {/* Authenticated User Account Card */}
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <div
                  className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 text-left shadow-2xs select-none"
                  title={`Logged in as ${currentUser.name} (${currentUser.roleLabel || currentUser.role})`}
                >
                  <span className="text-xl">{currentUser.avatar || '👤'}</span>
                  <div className="leading-tight">
                    <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <span className="truncate max-w-[120px]">{currentUser.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${currentUser.badgeClass || 'bg-slate-100'}`}>
                        {currentUser.roleLabel || currentUser.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]">
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
              <span className="p-1.5 text-lg rounded-xl border border-slate-200">
                {currentUser?.avatar || '👤'}
              </span>
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
          <div className="md:hidden py-4 border-t border-slate-100 space-y-1 animate-fade-in">
            {isStudent && (
              <>
                <NavLink
                  to="/submit"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  Lodge Grievance
                </NavLink>
                <NavLink
                  to="/student"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50/50 rounded-lg hover:bg-indigo-100"
                >
                  My History
                </NavLink>
                <NavLink
                  to="/track"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-slate-700 rounded-lg hover:bg-slate-100"
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
                  className="block px-3 py-2 text-sm font-bold text-amber-800 bg-amber-50/60 rounded-lg hover:bg-amber-100"
                >
                  👑 Super Admin Directorate
                </NavLink>
                <NavLink
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-purple-800 rounded-lg hover:bg-purple-100"
                >
                  Operations Desk
                </NavLink>
              </>
            )}

            {isAdmin && !isSuperAdmin && (
              <NavLink
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-semibold text-purple-800 bg-purple-50/50 rounded-lg hover:bg-purple-100"
              >
                Operations Desk
              </NavLink>
            )}

            {isTechnician && (
              <NavLink
                to="/technician"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-semibold text-amber-800 bg-amber-50/50 rounded-lg hover:bg-amber-100"
              >
                Squad Workstation Console
              </NavLink>
            )}

            {currentUser ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>Sign Out ({currentUser.name})</span>
              </button>
            ) : (
              <NavLink
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-semibold text-slate-700 rounded-lg hover:bg-slate-100"
              >
                Institutional Login (@iiitnr.edu.in)
              </NavLink>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
