/**
 * SmartComplaintHandler - Institutional Global Navigation Header
 * Blueprint Reference: V1/M1/frontend/03_layout_and_navigation.md
 * Role: Primary institutional navigation bar providing university branding, core service links,
 *       backend service heartbeat, and authenticated campus persona identity management.
 */
import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { currentPersona, openPersonaModal, isStudent, isTechnician, isAdmin } = useAuth();
  const [backendHealthy, setBackendHealthy] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
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
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              🏛️
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 tracking-tight leading-tight">
                Campus Facilities Services
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Estate Management & Service Desk
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink to="/" className={navLinkClasses} end>
              <span>Home</span>
            </NavLink>
            <NavLink to="/submit" className={navLinkClasses}>
              <span>Report an Issue</span>
            </NavLink>
            <NavLink to="/track" className={navLinkClasses}>
              <span>Track Status</span>
            </NavLink>
            <NavLink to="/admin" className={navLinkClasses}>
              <span>Operations Desk</span>
              {isAdmin && (
                <span className="w-2 h-2 rounded-full bg-purple-500 ml-1" title="Supervisor Privileges" />
              )}
            </NavLink>
          </nav>

          {/* Right Header Area: Live Heartbeat & Persona Account */}
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

            {/* Authenticated Persona Profile Button */}
            <button
              type="button"
              onClick={openPersonaModal}
              className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-300 transition-all text-left shadow-2xs"
              title="Click to switch persona or manage campus account"
            >
              <span className="text-xl">{currentPersona.avatar}</span>
              <div className="leading-tight">
                <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <span className="truncate max-w-[120px]">{currentPersona.name}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${currentPersona.badgeClass}`}>
                    {currentPersona.roleLabel}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Switch Persona / Role
                </div>
              </div>
            </button>

            {/* Login Link */}
            <Link
              to="/login"
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            >
              SSO Login
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={openPersonaModal}
              className="p-1.5 text-lg rounded-xl border border-slate-200"
              title="Switch Persona"
            >
              {currentPersona.avatar}
            </button>
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
          <div className="md:hidden py-4 border-t border-slate-100 space-y-2 animate-fade-in">
            <NavLink
              to="/"
              end
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 rounded-lg hover:bg-slate-100"
            >
              Home
            </NavLink>
            <NavLink
              to="/submit"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 rounded-lg hover:bg-slate-100"
            >
              Report an Issue
            </NavLink>
            <NavLink
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 rounded-lg hover:bg-slate-100"
            >
              Track Status
            </NavLink>
            <NavLink
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 rounded-lg hover:bg-slate-100"
            >
              Operations Desk
            </NavLink>
            <NavLink
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 rounded-lg hover:bg-slate-100"
            >
              Campus SSO Login
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
}
