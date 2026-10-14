/**
 * SmartComplaintHandler - Institutional Registration Gateway
 * Role: Allows students, faculty, and administrative staff to register an authentic account
 *       under the @iiitnr.edu.in institutional domain with bcrypt password hashing
 *       and persistent Remember Me session support.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Data Science & Artificial Intelligence',
  'Electronics & Communication Engineering',
  'Electrical',
  'Central Facilities Management',
  'General Administration',
  'Office of the Director',
];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successUser, setSuccessUser] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@iiitnr.edu.in')) {
      setError('Registration is restricted to official @iiitnr.edu.in institutional email addresses.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters for institutional security.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password entries.');
      return;
    }

    setLoading(true);
    try {
      const user = await register({
        name: name.trim(),
        email: cleanEmail,
        password,
        department_name: department,
        phone: phone.trim() || undefined,
        remember_me: rememberMe,
      });

      setSuccessUser(user);

      // Auto-route based on role
      let targetRoute = '/submit';
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
        'Registration failed. Please check your network and credentials.'
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
          Create Institutional Account
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          International Institute of Information Technology, Naya Raipur. Register with your official <strong className="text-indigo-600 font-bold">@iiitnr.edu.in</strong> email to access campus grievance workflows.
        </p>
      </div>

      {/* Main Registration Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-6">
        {/* Navigation Tabs: Sign In / Register */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
          <Link
            to="/login"
            className="py-2.5 text-center text-slate-600 hover:text-slate-900 rounded-xl transition-all"
          >
            Sign In
          </Link>
          <div className="py-2.5 text-center bg-white text-indigo-600 rounded-xl shadow-xs">
            Create Account
          </div>
        </div>

        {successUser ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Account Created Successfully!
            </h3>
            <div className="text-xs text-slate-500 space-y-1">
              <p>Welcome, <strong className="text-slate-800">{successUser.name}</strong>!</p>
              <p>Registered as <strong className="text-indigo-600 uppercase font-bold">{successUser.role}</strong> ({successUser.identifier})</p>
              <p className="text-[11px] text-slate-400">
                Opening {successUser.role === 'STUDENT' ? 'Grievance Filing Portal (/submit)' : 'Console'}...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Full Name *:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Nikhil Sharma"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Institutional Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Institutional Email ID (@iiitnr.edu.in) *:
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
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Students use official enrollment format e.g. <code className="text-indigo-600 font-mono">nikhil26100@iiitnr.edu.in</code>
              </span>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Department / Program:
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-semibold text-slate-800 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Contact Phone (Optional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Mobile / Intercom Extension (Optional):
              </label>
              <input
                type="text"
                placeholder="+91-9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Password *:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min. 6 chars"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-10 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Confirm Password *:
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-type password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-rose-400 focus:ring-rose-400/20'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
            </div>

            {/* Persistent Remember Me Checkbox */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start space-x-3">
              <input
                id="reg-remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
              />
              <label htmlFor="reg-remember-me" className="text-xs text-slate-700 leading-snug cursor-pointer">
                <strong className="font-bold text-slate-900 block">Persistent Remember Me (Industry Standard)</strong>
                Keep me signed in for <strong className="text-indigo-600">30 days</strong> on this device with a secure cryptographic JWT token.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <span>Registering Account in Supabase...</span>
              ) : (
                <>
                  <span>Complete Registration & Sign In</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Link */}
        <div className="pt-4 border-t border-slate-100 text-xs text-center text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-indigo-600 hover:underline">
            Sign In with @iiitnr.edu.in
          </Link>
        </div>
      </div>
    </div>
  );
}
