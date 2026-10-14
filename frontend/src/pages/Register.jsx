/**
 * SmartComplaintHandler - Clean Institutional Registration Portal
 * Modern single-screen registration matching standard industry design:
 * Only two options:
 * 1. Continue with Email (@iiitnr.edu.in)
 * 2. Continue with Google (@iiitnr.edu.in)
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register, loginGoogle, currentUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [departmentInfo, setDepartmentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  // Derive verified official department dynamically from IIIT-NR email
  const parseEmailMetadata = (rawEmail) => {
    const clean = (rawEmail || '').trim().toLowerCase();
    if (!clean.endsWith('@iiitnr.edu.in')) return null;

    const prefix = clean.split('@')[0];
    const match = prefix.match(/^([a-z]+(?:[._][a-z]+)*?)(\d{2})(\d{2,5})$/i);
    if (match) {
      const rawName = match[1]
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
      const code = match[3];

      // Branch taxonomy: 100 -> CSE, 101 -> DSAI, 102/302 -> ECE
      let dept = 'Computer Science & Engineering';
      let deptCode = 'CSE';
      if (code.startsWith('101') || code.endsWith('01')) {
        dept = 'Data Science & Artificial Intelligence';
        deptCode = 'DSAI';
      } else if (code.startsWith('102') || code.endsWith('02') || code === '302') {
        dept = 'Electronics & Communication Engineering';
        deptCode = 'ECE';
      }

      return {
        fullName: rawName,
        department: dept,
        deptCode,
      };
    }

    const cleanName = prefix
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

    let dept = 'Computer Science & Engineering';
    if (prefix.includes('admin') || prefix.includes('estate')) {
      dept = 'Central Facilities Management';
    } else if (prefix.startsWith('tech')) {
      dept = 'Electrical Maintenance';
    } else if (prefix === 'director') {
      dept = 'Office of the Director';
    }

    return {
      fullName: cleanName,
      department: dept,
      deptCode: 'GEN',
    };
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    setError(null);
    const parsed = parseEmailMetadata(val);
    setDepartmentInfo(parsed);
  };

  const handleRoleRedirect = (user) => {
    setSuccessUser(user);
    let targetRoute = '/submit';
    if (user.role === 'SUPER_ADMIN') targetRoute = '/superadmin';
    else if (user.role === 'ADMIN') targetRoute = '/admin';
    else if (user.role === 'TECHNICIAN') targetRoute = '/technician';

    setTimeout(() => {
      navigate(targetRoute);
    }, 600);
  };

  // 1. Continue with Google Workspace (Standard Google OAuth Popup)
  const handleContinueWithGoogle = () => {
    setError(null);
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('smart_complaint_google_client_id');

    if (!clientId) {
      const promptId = window.prompt(
        'Google OAuth Setup:\nPlease enter your Google Cloud OAuth Client ID (e.g., xxxxxx.apps.googleusercontent.com):\n\nYou can also set VITE_GOOGLE_CLIENT_ID in your Vercel Environment Variables.'
      );
      if (promptId && promptId.trim()) {
        localStorage.setItem('smart_complaint_google_client_id', promptId.trim());
        window.location.reload();
        return;
      }
      setError('Google Sign-In requires a Google Cloud OAuth Client ID (VITE_GOOGLE_CLIENT_ID). Please provide your Client ID or use Continue with Email.');
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      setError('Google Identity Services SDK is initializing. Please check your internet connection and click again.');
      return;
    }

    try {
      setGoogleLoading(true);
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        hd: 'iiitnr.edu.in',
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setError(`Google Sign-In was cancelled or failed: ${tokenResponse.error}`);
            setGoogleLoading(false);
            return;
          }

          try {
            // Retrieve verified institutional profile from Google
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const profile = await userInfoRes.json();

            // Strict IIIT-NR verification
            if (!profile.email || !profile.email.toLowerCase().endsWith('@iiitnr.edu.in')) {
              setError('Access denied: Google Sign-In is strictly restricted to official @iiitnr.edu.in institutional accounts. Personal Gmail is blocked.');
              setGoogleLoading(false);
              return;
            }

            // Authenticate with backend and obtain 30-day persistent session
            const user = await loginGoogle({
              email: profile.email,
              name: profile.name,
              picture: profile.picture,
              remember_me: true,
            });
            handleRoleRedirect(user);
          } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Google account verification failed.');
            setGoogleLoading(false);
          }
        },
      });

      // Opens the standard Google popup window!
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setError(`Failed to open Google popup: ${err.message}`);
      setGoogleLoading(false);
    }
  };

  // 2. Continue with Email
  const handleRegisterWithEmail = async (e) => {
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

      handleRoleRedirect(user);
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

        {/* Clean Vercel-Style Register Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-7 sm:p-9 space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="text-lg font-black text-slate-900">
              Sign Up for IIIT-NR
            </h2>
            <p className="text-xs text-slate-500">
              Create your student or campus facilities account
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
            <div className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRegisterWithEmail} className="space-y-3">
                {/* Institutional Email */}
                <div className="space-y-1.5">
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="Email Address (@iiitnr.edu.in)"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-600/15 transition-all"
                  />

                  {/* Verified Identity Badge (Department auto-detected, locked, no roll number) */}
                  {departmentInfo && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs animate-fade-in select-none">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Department:</span>
                        <span className="font-bold text-indigo-700 text-xs">{departmentInfo.department}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        🔒 Verified
                      </span>
                    </div>
                  )}
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Password (min 6)"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-600/15 transition-all"
                    />
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError(null);
                      }}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-600/15 transition-all"
                    />
                  </div>
                </div>

                {/* Password Visibility & Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <span className="text-[11px] font-medium text-slate-600">
                      Remember me on this device
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold"
                  >
                    {showPassword ? 'Hide Password' : 'Show Password'}
                  </button>
                </div>

                {/* Continue with Email Button */}
                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span>Creating Account...</span>
                  ) : (
                    <span>Continue with Email</span>
                  )}
                </button>
              </form>

              {/* Continue with Google Button */}
              <button
                type="button"
                onClick={handleContinueWithGoogle}
                disabled={googleLoading || loading}
                className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-300 active:scale-[0.99] text-slate-800 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                {googleLoading ? (
                  <span>Connecting to Google Workspace...</span>
                ) : (
                  <span>Continue with Google</span>
                )}
              </button>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="pt-3 border-t border-slate-100 text-center text-xs">
            <span className="text-slate-500">Already have an account? </span>
            <Link
              to="/login"
              className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Log In
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
