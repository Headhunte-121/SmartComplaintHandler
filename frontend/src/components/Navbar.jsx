/**
 * SmartComplaintHandler - Modern SaaS Global Navigation Header
 * Inspired by Linear, Vercel & Supabase:
 * - Left: Brand Mark + Breadcrumb Divider (`/`) + Horizontal Underline Tabs with crisp SVG icons
 * - Right: Quick Search (`⌘K`) trigger, Saved Room chip, Primary `+ New Request` CTA, and User Profile Dropdown
 */
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    const healthUrl = apiBase
      ? `${apiBase.replace(/\/api\/v1\/?$/, '')}/health`
      : '/health';

    fetch(healthUrl)
      .then((res) => res.json())
      .then((data) => setBackendHealthy(data.status === 'healthy'))
      .catch(() => setBackendHealthy(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const navTabClasses = ({ isActive }) =>
    `relative h-16 inline-flex items-center gap-2 px-3.5 text-xs sm:text-[13px] transition-all ${
      isActive
        ? 'text-emerald-800 font-bold after:content-[""] after:absolute after:bottom-0 after:left-1 after:right-1 after:h-[3px] after:bg-gradient-to-r after:from-emerald-500 after:to-teal-500 after:rounded-full after:shadow-[0_-2px_10px_rgba(22,163,74,0.6)]'
        : 'text-slate-600 hover:text-slate-900 font-semibold'
    }`;

  const shortHostel = currentUser?.hostel_name
    ? currentUser.hostel_name.split(' ')[0]
    : 'Ramanujan';
  const shortRoom = currentUser?.room_number
    ? currentUser.room_number.replace('Wing ', '').replace(', Room ', '-').replace('Room ', '')
    : '204';

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-xl border-b-2 border-slate-200/90 shadow-xs relative">
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-4">
          {/* Left: Brand Identity + Breadcrumb Divider + Horizontal Underline Tabs */}
          <div className="flex items-center gap-6 h-full">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 group-hover:border-green-400/80 flex items-center justify-center p-1 transition-colors">
                <img
                  src="/iiitnr_logo.png"
                  alt="IIIT Naya Raipur"
                  className="h-full w-auto object-contain"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 tracking-tight">
                  IIIT-NR
                </span>
                <span className="text-slate-400 font-light text-sm">/</span>
                <span className="text-xs font-medium text-slate-600">
                  Facilities
                </span>
                {backendHealthy !== null && (
                  <span
                    className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${
                      backendHealthy
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        backendHealthy ? 'bg-green-500' : 'bg-rose-500'
                      }`}
                    />
                    {backendHealthy ? 'Live' : 'Offline'}
                  </span>
                )}
              </div>
            </Link>

            {/* Primary Navigation Links */}
            <nav className="hidden md:flex items-center h-full border-l border-slate-200 pl-4 space-x-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  navTabClasses({ isActive: isActive || location.pathname === '/map' })
                }
              >
                <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Campus Map</span>
              </NavLink>

              {isStudent && (
                <>
                  <NavLink to="/submit" className={navTabClasses}>
                    <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Submit Request</span>
                  </NavLink>
                  <NavLink to="/student" className={navTabClasses}>
                    <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>My Issues</span>
                  </NavLink>
                  <NavLink to="/track" className={navTabClasses}>
                    <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Track Status</span>
                  </NavLink>
                </>
              )}

              {isTechnician && (
                <>
                  <NavLink to="/technician" className={navTabClasses}>
                    <span>Work Orders</span>
                  </NavLink>
                  <NavLink to="/track" className={navTabClasses}>
                    <span>Track Status</span>
                  </NavLink>
                  <NavLink to="/submit" className={navTabClasses}>
                    <span>Submit Request</span>
                  </NavLink>
                </>
              )}

              {isAdmin && !isSuperAdmin && (
                <>
                  <NavLink to="/admin" className={navTabClasses}>
                    <span>Operations</span>
                  </NavLink>
                  <NavLink to="/technician" className={navTabClasses}>
                    <span>Squads</span>
                  </NavLink>
                  <NavLink to="/track" className={navTabClasses}>
                    <span>Track Status</span>
                  </NavLink>
                  <NavLink to="/submit" className={navTabClasses}>
                    <span>Submit Request</span>
                  </NavLink>
                </>
              )}

              {isSuperAdmin && (
                <>
                  <NavLink to="/superadmin" end className={navTabClasses}>
                    <span>Directorate</span>
                  </NavLink>
                  <NavLink to="/superadmin/editor" className={navTabClasses}>
                    <span className="text-[#A7AD89] font-semibold">Data Studio</span>
                  </NavLink>
                  <NavLink to="/admin" className={navTabClasses}>
                    <span>Operations</span>
                  </NavLink>
                  <NavLink to="/technician" className={navTabClasses}>
                    <span>Squads</span>
                  </NavLink>
                  <NavLink to="/track" className={navTabClasses}>
                    <span>Track Status</span>
                  </NavLink>
                  <NavLink to="/submit" className={navTabClasses}>
                    <span>Submit Request</span>
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Right: Quick Search Trigger + Saved Room Chip + Primary Action + Profile Menu */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/submit?mode=search')}
              className="hidden lg:flex items-center justify-between gap-5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-500 hover:text-slate-700 transition-all cursor-pointer"
              title="Quick-locate any room or laboratory"
            >
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Find room or lab...</span>
              </span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white text-slate-400 rounded border border-slate-200">
                ⌘K
              </kbd>
            </button>

            {currentUser?.hostel_name && (
              <Link
                to="/submit"
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-teal-100/60 hover:from-emerald-200 hover:to-teal-100 border-2 border-emerald-300 text-xs font-bold text-emerald-950 transition-all shadow-2xs hover:shadow-xs"
                title="Your default hostel residence"
              >
                <svg className="w-3.5 h-3.5 text-emerald-700 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-mono text-xs font-black">
                  {shortHostel} · {shortRoom}
                </span>
              </Link>
            )}

            <Link
              to="/submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:to-green-600 text-white font-black text-xs shadow-md shadow-emerald-700/30 transition-all inline-flex items-center gap-1.5 cursor-pointer border border-emerald-500/50 hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ New Request</span>
            </Link>

            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  {currentUser.avatar_url ? (
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-green-600 text-white font-bold text-xs flex items-center justify-center">
                      {(currentUser.name || 'S')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-800 max-w-[96px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 text-xs text-slate-800">
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 truncate">{currentUser.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 font-semibold">
                          {currentUser.roleLabel || currentUser.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                        {currentUser.email}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          openPersonaModal();
                        }}
                        className="w-full px-3.5 py-2 text-left text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Switch Role / Persona</span>
                      </button>

                      {(isSuperAdmin || isAdmin) && (
                        <Link
                          to="/superadmin/editor"
                          onClick={() => setProfileMenuOpen(false)}
                          className="w-full px-3.5 py-2 text-left text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Campus Data Studio</span>
                        </Link>
                      )}

                      <Link
                        to="/student"
                        onClick={() => setProfileMenuOpen(false)}
                        className="w-full px-3.5 py-2 text-left text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                        </svg>
                        <span>My Requests &amp; Room</span>
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white font-medium text-xs rounded-lg transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:bg-white/[0.06]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 bg-white space-y-1">
            <NavLink
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Campus Map
            </NavLink>
            <NavLink
              to="/submit"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-xs font-semibold text-green-700 rounded-lg hover:bg-green-50"
            >
              Submit Request
            </NavLink>
            {isStudent && (
              <NavLink
                to="/student"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50"
              >
                My Issues
              </NavLink>
            )}
            <NavLink
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Track Status
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
}
