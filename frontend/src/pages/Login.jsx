/**
 * SmartComplaintHandler - Clean Institutional Login Portal
 * Modern single-screen authentication matching standard industry design:
 * Only two options:
 * 1. Continue with Email (@iiitnr.edu.in)
 * 2. Continue with Google (@iiitnr.edu.in)
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginGoogle, rememberedEmail, currentUser } = useAuth();

  const [email, setEmail] = useState(rememberedEmail || '');
  const [password, setPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(!!rememberedEmail);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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

  useEffect(() => {
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setShowPasswordField(true);
    }
  }, [rememberedEmail]);

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

  // 1. Continue with Google Workspace SSO
  const handleContinueWithGoogle = async () => {
    setError(null);

    // If Google GIS client ID is configured and script is ready
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (clientId && window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            setGoogleLoading(true);
            const user = await loginGoogle({ credential: response.credential, remember_me: true });
            handleRoleRedirect(user);
          } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Google Sign-In failed.');
            setGoogleLoading(false);
          }
        },
        hosted_domain: 'iiitnr.edu.in',
      });
      window.google.accounts.id.prompt();
      return;
    }

    // Direct Google Workspace authentication with the entered email
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your @iiitnr.edu.in email address, then click Continue with Google.');
      return;
    }

    if (!cleanEmail.endsWith('@iiitnr.edu.in')) {
      setError('Access restricted: Only official @iiitnr.edu.in institutional accounts are permitted. Personal Gmail accounts are blocked.');
      return;
    }

    setGoogleLoading(true);
    try {
      const user = await loginGoogle({
        email: cleanEmail,
        remember_me: true,
      });
      handleRoleRedirect(user);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Google Workspace verification failed. Ensure you are using an official @iiitnr.edu.in account.'
      );
      setGoogleLoading(false);
    }
  };

  // 2. Continue with Email
  const handleContinueWithEmail = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your institutional email address.');
      return;
    }

    if (!cleanEmail.endsWith('@iiitnr.edu.in')) {
      setError('Access restricted: Only official @iiitnr.edu.in institutional accounts are permitted.');
      return;
    }

    // Reveal password field on first click if hidden
    if (!showPasswordField) {
      setShowPasswordField(true);
      return;
    }

    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(cleanEmail, password, rememberMe);
      handleRoleRedirect(user);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Invalid institutional credentials. Please check your email and password.'
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

        {/* Clean Vercel-Style Login Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-7 sm:p-9 space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="text-lg font-black text-slate-900">
              Log in to IIIT-NR
            </h2>
            <p className="text-xs text-slate-500">
              Access your student or campus facilities account
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
                Opening your portal...
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

              <form onSubmit={handleContinueWithEmail} className="space-y-3">
                {/* Institutional Email Address */}
                <div className="space-y-1">
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="Email Address (@iiitnr.edu.in)"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-600/15 transition-all"
                  />
                </div>

                {/* Password field (shown when user continues with email or remembered) */}
                {showPasswordField && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError(null);
                        }}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-600/15 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-600 font-semibold"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>

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
                    </div>
                  </div>
                )}

                {/* Continue with Email Button */}
                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span>Verifying...</span>
                  ) : (
                    <span>{showPasswordField ? 'Sign In with Email' : 'Continue with Email'}</span>
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
            <span className="text-slate-500">Don't have an account? </span>
            <Link
              to="/register"
              className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Sign Up
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
