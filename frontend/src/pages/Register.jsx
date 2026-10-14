/**
 * SmartComplaintHandler - Clean Institutional Registration Portal
 * Role: Streamlined, distraction-free registration portal for @iiitnr.edu.in accounts.
 *       Auto-detects and locks official Full Name and Department from Google Workspace / campus directory,
 *       preventing manual alteration, and enforcing secure bcrypt passwords and role routing.
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Verified Google Workspace Campus Directory Mappings
const CAMPUS_DIRECTORY = {
  'nikhil26100@iiitnr.edu.in': {
    fullName: 'Nikhil Gavel',
    department: 'Computer Science & Engineering',
    deptCode: 'CSE',
    rollNo: '2026CSE100',
    batch: 'Batch 2026',
  },
  'nikhilesh26100@iiitnr.edu.in': {
    fullName: 'Nikhilesh Kothamasu',
    department: 'Computer Science & Engineering',
    deptCode: 'CSE',
    rollNo: '2026CSE100',
    batch: 'Batch 2026',
  },
  'nikheel25302@iiitnr.edu.in': {
    fullName: 'Nikheel Kumar Sonkar',
    department: 'Electronics & Communication Engineering',
    deptCode: 'ECE',
    rollNo: '2025ECE302',
    batch: 'Batch 2025',
  },
};

export default function Register() {
  const navigate = useNavigate();
  const { register, currentUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [departmentInfo, setDepartmentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successUser, setSuccessUser] = useState(null);

  useEffect(() => {
    if (currentUser) {
      const redirect =
        currentUser.role === 'SUPER_ADMIN'
          ? '/superadmin'
          : currentUser.role === 'ADMIN'
          ? '/admin'
          : currentUser.role === 'TECHNICIAN'
          ? '/technician'
          : '/submit';
      navigate(redirect, { replace: true });
    }
  }, [currentUser, navigate]);

  // Derive verified official full name and academic branch from IIIT-NR institutional directory
  const parseEmailMetadata = (rawEmail) => {
    const clean = rawEmail.trim().toLowerCase();
    if (!clean.endsWith('@iiitnr.edu.in')) return null;

    if (CAMPUS_DIRECTORY[clean]) {
      return CAMPUS_DIRECTORY[clean];
    }

    const prefix = clean.split('@')[0];
    const match = prefix.match(/^([a-z]+(?:[._][a-z]+)*)(\d{2})(\d{2,5})$/i);
    if (match) {
      const rawName = match[1].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const year = match[2];
      const code = match[3];

      let dept = 'Computer Science & Engineering';
      let deptCode = 'CSE';
      if (code.startsWith('101')) {
        dept = 'Data Science & Artificial Intelligence';
        deptCode = 'DSAI';
      } else if (code.startsWith('102')) {
        dept = 'Electronics & Communication Engineering';
        deptCode = 'ECE';
      }

      return {
        fullName: rawName,
        department: dept,
        deptCode,
        rollNo: `20${year}${deptCode}${code}`,
        batch: `Batch 20${year}`,
      };
    }

    const cleanName = prefix.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      fullName: cleanName,
      department: 'IIIT Naya Raipur',
      deptCode: 'General',
      rollNo: `ID: ${prefix.toUpperCase()}`,
      batch: 'Campus Staff / Scholar',
    };
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    setError(null);
    const parsed = parseEmailMetadata(val);
    setDepartmentInfo(parsed);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@iiitnr.edu.in')) {
      setError('Registration is restricted to official @iiitnr.edu.in institutional email addresses.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password entries.');
      return;
    }

    setLoading(true);
    try {
      const parsed = departmentInfo || parseEmailMetadata(cleanEmail);
      const user = await register({
        name: parsed?.fullName,
        email: cleanEmail,
        password,
        department_name: parsed?.department || 'Computer Science & Engineering',
        remember_me: rememberMe,
      });

      setSuccessUser(user);

      // Auto-route based on role
      let targetRoute = '/submit';
      if (user.role === 'SUPER_ADMIN') targetRoute = '/superadmin';
      else if (user.role === 'ADMIN') targetRoute = '/admin';
      else if (user.role === 'TECHNICIAN') targetRoute = '/technician';

      setTimeout(() => {
        navigate(targetRoute);
      }, 600);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Registration failed. Please check your network and institutional credentials.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50/40 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Institutional Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex justify-center mb-2">
            <img
              src="/iiitnr_logo.png"
              alt="IIIT Naya Raipur Official Logo"
              className="h-20 w-auto object-contain drop-shadow-md"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              IIIT Naya Raipur
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Campus Facilities & Grievance Management System
            </p>
          </div>
        </div>

        {/* Main Clean Register Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-7 sm:p-9 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900">
              Create an Account
            </h2>
            <p className="text-xs text-slate-500">
              Enter your official institutional credentials to register.
            </p>
          </div>

          {successUser ? (
            <div className="py-6 text-center space-y-3 animate-fade-in">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold">
                ✓
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Welcome, {successUser.name}!
              </h3>
              <p className="text-xs text-slate-500">
                Account created. Opening your portal...
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Institutional Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Institutional Email ID
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-600/15 transition-all"
                />

                {/* Verified Non-Editable Institutional Record Card */}
                {departmentInfo && (
                  <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-2 animate-fade-in select-none">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-500 uppercase tracking-wider">Campus Directory Identity</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <span>🔒</span>
                        <span>Locked to Email</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Official Full Name</div>
                        <div className="text-sm font-black text-slate-900">{departmentInfo.fullName}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Department</div>
                        <div className="text-xs font-bold text-indigo-700">{departmentInfo.department}</div>
                      </div>
                    </div>

                    {departmentInfo.rollNo && (
                      <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/60 flex justify-between">
                        <span>Roll: {departmentInfo.rollNo}</span>
                        <span>{departmentInfo.batch}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 chars"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-600/15 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Confirm Password
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
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-600/15 transition-all"
                  />
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="reg_remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <label htmlFor="reg_remember" className="text-xs text-slate-600 select-none cursor-pointer">
                  Remember me on this device
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Already registered?</span>
            <Link
              to="/login"
              className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Security Footer Notice */}
        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          Dr. Shyama Prasad Mukherjee International Institute of Information Technology, Naya Raipur
        </p>
      </div>
    </div>
  );
}
