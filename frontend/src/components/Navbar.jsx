/**
 * SmartComplaintHandler - Minimal Top Navigation Bar
 */
import React, { useState } from 'react';
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClasses = ({ isActive }) =>
    `px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-slate-900 text-white'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Minimal Brand */}
          <Link
            to={isStudent ? '/submit' : isSuperAdmin ? '/superadmin' : isAdmin ? '/admin' : '/'}
            className="flex items-center space-x-2.5"
          >
            <img
              src="/iiitnr_logo.png"
              alt="IIIT-NR"
              className="h-7 w-auto object-contain"
            />
            <span className="text-sm font-semibold text-slate-900 tracking-tight">
              IIIT-NR Facilities
            </span>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink to="/" end className={navLinkClasses}>
              Campus Map
            </NavLink>

            {isStudent && (
              <>
                <NavLink to="/submit" className={navLinkClasses}>
                  New Request
                </NavLink>
                <NavLink to="/student" className={navLinkClasses}>
                  My Requests
                </NavLink>
                <NavLink to="/track" className={navLinkClasses}>
                  Track
                </NavLink>
              </>
            )}

            {isTechnician && (
              <>
                <NavLink to="/technician" className={navLinkClasses}>
                  Assigned Queue
                </NavLink>
                <NavLink to="/track" className={navLinkClasses}>
                  Track
                </NavLink>
                <NavLink to="/submit" className={navLinkClasses}>
                  New Request
                </NavLink>
              </>
            )}

            {isAdmin && !isSuperAdmin && (
              <>
                <NavLink to="/admin" className={navLinkClasses}>
                  Operations
                </NavLink>
                <NavLink to="/technician" className={navLinkClasses}>
                  Squads
                </NavLink>
                <NavLink to="/track" className={navLinkClasses}>
                  Track
                </NavLink>
                <NavLink to="/submit" className={navLinkClasses}>
                  New Request
                </NavLink>
              </>
            )}

            {isSuperAdmin && (
              <>
                <NavLink to="/superadmin" className={navLinkClasses}>
                  Admin Settings
                </NavLink>
                <NavLink to="/admin" className={navLinkClasses}>
                  Operations
                </NavLink>
                <NavLink to="/technician" className={navLinkClasses}>
                  Squads
                </NavLink>
                <NavLink to="/submit" className={navLinkClasses}>
                  New Request
                </NavLink>
              </>
            )}
          </nav>

          {/* Right User Action */}
          <div className="hidden sm:flex items-center space-x-2">
            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={openPersonaModal}
                  className="flex items-center space-x-2 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-xs text-slate-700 transition-colors cursor-pointer"
                  title="Switch role or view profile"
                >
                  <span className="font-medium truncate max-w-[130px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {currentUser.roleLabel || currentUser.role}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
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
          <div className="md:hidden py-3 border-t border-slate-100 space-y-1">
            <NavLink
              to="/"
              end
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-1.5 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-100"
            >
              Campus Map
            </NavLink>
            <NavLink
              to="/submit"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-1.5 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-100"
            >
              New Request
            </NavLink>
            {isStudent && (
              <NavLink
                to="/student"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-1.5 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-100"
              >
                My Requests
              </NavLink>
            )}
            <NavLink
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-1.5 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-100"
            >
              Track
            </NavLink>
            {currentUser && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-1.5 text-xs font-medium text-rose-600 rounded-lg hover:bg-rose-50"
              >
                Sign out ({currentUser.name})
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
