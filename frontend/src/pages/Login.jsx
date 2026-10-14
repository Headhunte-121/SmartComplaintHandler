/**
 * SmartComplaintHandler - IIIT Naya Raipur Institutional Authentication Gateway
 * Role: Single Sign-On (SSO) gateway enforcing @iiitnr.edu.in institutional email domain.
 *       Automatically parses student roll numbers and auto-redirects according to role:
 *       - Student (e.g. nikhil26100@iiitnr.edu.in) -> Lodging Grievance page (/submit)
 *       - Facility Admin (e.g. admin@iiitnr.edu.in) -> Operations Desk (/admin)
 *       - Super Admin (e.g. superadmin@iiitnr.edu.in) -> Super Admin Console (/superadmin)
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('nikhil26100@iiitnr.edu.in');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  const handleQuickFill = (presetEmail) => {
    setEmail(presetEmail);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@iiitnr.edu.in')) {
      setError('Access restricted: Only official @iiitnr.edu.in institutional email accounts are permitted.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(cleanEmail, password);
      setSuccessInfo(user);

      // Determine redirect route based on role
      let targetRoute = '/submit'; // Default for STUDENT
      if (user.role === 'SUPER_ADMIN') {
        targetRoute = '/superadmin';
      } else if (user.role === 'ADMIN') {
        targetRoute = '/admin';
      } else if (user.role === 'TECHNICIAN') {
        targetRoute = '/technician';
      }

      setTimeout(() => {
        navigate(targetRoute);
      }, 700);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Authentication failed. Please verify institutional credentials.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 animate-fade-in space-y-6">
      {/* Institutional Branding */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-600/30">
          🏛️
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          IIIT Naya Raipur
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Central Institutional Identity & Access Management (IAM). Please authenticate using your official <strong className="text-indigo-600 font-bold">@iiitnr.edu.in</strong> email account.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-6">
        {successInfo ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Welcome, {successInfo.name}!
            </h3>
            <div className="text-xs text-slate-500 space-y-1">
              <p>Authenticated as <strong className="text-indigo-600 uppercase font-bold">{successInfo.role}</strong> ({successInfo.identifier})</p>
              <p className="text-[11px] text-slate-400">
                Opening {successInfo.role === 'STUDENT' ? 'Grievance Filing Portal (/submit)' : successInfo.role === 'SUPER_ADMIN' ? 'Super Admin Directorate (/superadmin)' : 'Operations Desk (/admin)'}...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Quick Demo Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Quick-Fill Institutional Account:
                </label>
                <span className="text-[10px] text-slate-400">Click to autofill</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('nikhil26100@iiitnr.edu.in')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    email === 'nikhil26100@iiitnr.edu.in'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">🎓 Student</span>
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">Roll BCS100</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1 truncate">
                    nikhil26100@iiitnr.edu.in
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@iiitnr.edu.in')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    email === 'admin@iiitnr.edu.in'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">🛡️ Facility Admin</span>
                    <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">Supervisor</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1 truncate">
                    admin@iiitnr.edu.in
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('superadmin@iiitnr.edu.in')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    email === 'superadmin@iiitnr.edu.in'
                      ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">👑 Super Admin</span>
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-300">Directorate</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1 truncate">
                    superadmin@iiitnr.edu.in
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('tech.ramesh@iiitnr.edu.in')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    email === 'tech.ramesh@iiitnr.edu.in'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">🔧 Field Tech</span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">Squad 1</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1 truncate">
                    tech.ramesh@iiitnr.edu.in
                  </div>
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Institutional Email ID:
              </label>
              <input
                type="email"
                required
                placeholder="name(year)(roll)@iiitnr.edu.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Students use enrollment format e.g. <code className="text-indigo-600 font-mono">nikhil26100@iiitnr.edu.in</code>
              </span>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Campus Credential Password:
                </label>
                <span className="text-[10px] text-indigo-600 font-semibold cursor-pointer hover:underline">
                  Self-Service Reset
                </span>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <span>Verifying Institutional Identity...</span>
              ) : (
                <>
                  <span>Sign In to Campus Portal</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        )}

        {/* Security Notice */}
        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center leading-relaxed">
          Protected by Central Institutional Identity & Access Management (IAM). All actions are auditable by the Directorate of IIIT Naya Raipur.
        </div>
      </div>
    </div>
  );
}
