/**
 * SmartComplaintHandler - Global Navbar Component
 * Blueprint Reference: V1/M1/frontend/03_layout_and_navigation.md
 * Role: Persistent top navigation with role/persona status, active route highlighting, and live health pill.
 */
import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { currentPersona, openPersonaModal, isStudent, isTechnician, isAdmin } = useAuth();
  const [backendHealthy, setBackendHealthy] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Health check ping on load
    fetch('/health')
      .then((res) => res.json())
      .then((data) => {
        setBackendHealthy(data.status === 'healthy');
      })
      .catch(() => {
        setBackendHealthy(false);
      });
  }, []);

  const navLinkClasses = ({ isActive }) =>
    `px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 font-extrabold shadow-2xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Subtitle */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 tracking-tight flex items-center space-x-1.5">
                <span>SmartComplaintHandler</span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Campus Facilities & SLA Automation
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink to="/" className={navLinkClasses} end>
              <span>Submit Grievance</span>
            </NavLink>
            <NavLink to="/track" className={navLinkClasses}>
              <span>Track Ticket</span>
            </NavLink>
            <NavLink to="/admin" className={navLinkClasses}>
              <span>Operations Desk</span>
              {isAdmin && (
                <span className="ml-1 w-2 h-2 rounded-full bg-purple-500" title="Supervisor Access" />
              )}
            </NavLink>
            <NavLink to="/developer" className={navLinkClasses}>
              <span>Developer Lab</span>
            </NavLink>
          </nav>

          {/* Right Controls: Persona Switcher & Backend Health */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Backend Heartbeat */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                backendHealthy === true
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : backendHealthy === false
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
              title={backendHealthy ? 'FastAPI Backend Online' : 'FastAPI Backend Offline'}
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
              <span>{backendHealthy ? 'API Online' : 'API Offline'}</span>
            </div>

            {/* Persona Switcher Button */}
            <button
              type="button"
              onClick={openPersonaModal}
              className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-300 transition-all text-left shadow-2xs"
            >
              <span className="text-xl">{currentPersona.avatar}</span>
              <div className="leading-tight">
                <div className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                  <span className="truncate max-w-[110px]">{currentPersona.name}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${currentPersona.badgeClass}`}>
                    {currentPersona.roleLabel}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Click to switch persona
                </div>
              </div>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={openPersonaModal}
              className="p-1.5 text-lg rounded-lg border border-slate-200"
              title="Switch Persona"
            >
              {currentPersona.avatar}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
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
          <div className="md:hidden py-4 border-t border-slate-100 space-y-2 animate-fade-in">
            <NavLink
              to="/"
              end
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 rounded-lg hover:bg-slate-100"
            >
              Submit Grievance
            </NavLink>
            <NavLink
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 rounded-lg hover:bg-slate-100"
            >
              Track Ticket
            </NavLink>
            <NavLink
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 rounded-lg hover:bg-slate-100"
            >
              Operations Desk
            </NavLink>
            <NavLink
              to="/developer"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 rounded-lg hover:bg-slate-100"
            >
              Developer Lab
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
}
