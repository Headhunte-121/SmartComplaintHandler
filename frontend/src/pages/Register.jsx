/**
 * SmartComplaintHandler - Institutional Registration Portal (IIIT Naya Raipur)
 * Rich visual design with auto-detected Roll/Branch card, IIIT-NR Hostel/Room selector,
 * and 4-bar password strength meter — zero promotional filler advertising.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchAuthConfig, isUndergradHostelStudent } from '../api/auth';

const ALLOWED_DOMAIN = 'iiitnr.edu.in';
const GOOGLE_GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GOOGLE_CLIENT_ID_PATTERN = /^[0-9]+-[a-zA-Z0-9_]+\.apps\.googleusercontent\.com$/;
const IS_PROD_BUILD = Boolean(import.meta.env.PROD);

function getInitialGoogleClientId() {
  const envClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  if (envClientId && GOOGLE_CLIENT_ID_PATTERN.test(envClientId)) {
    return envClientId;
  }
  if (!IS_PROD_BUILD) {
    const devStored = (localStorage.getItem('smart_complaint_google_client_id') || '').trim();
    if (devStored && GOOGLE_CLIENT_ID_PATTERN.test(devStored)) {
      return devStored;
    }
  }
  return '';
}

function ensureGoogleSdkLoaded(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      resolve(window.google);
      return;
    }
    let existingScript = document.querySelector(`script[src="${GOOGLE_GSI_SCRIPT_SRC}"]`);
    if (!existingScript) {
      existingScript = document.createElement('script');
      existingScript.src = GOOGLE_GSI_SCRIPT_SRC;
      existingScript.async = true;
      existingScript.defer = true;
      document.head.appendChild(existingScript);
    }
    const start = Date.now();
    const timer = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(timer);
        resolve(window.google);
      } else if (Date.now() - start >= timeoutMs) {
        clearInterval(timer);
        reject(new Error('Google SDK timed out.'));
      }
    }, 100);
  });
}

function evaluatePasswordStrength(pw) {
  if (!pw) return { score: 0, label: 'Minimum 6 characters', color: 'bg-slate-200' };
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1;

  const map = {
    1: { label: 'Fair', color: 'bg-amber-500' },
    2: { label: 'Good', color: 'bg-sky-500' },
    3: { label: 'Strong', color: 'bg-emerald-500' },
    4: { label: 'Excellent', color: 'bg-teal-400' },
  };
  return { score, ...(map[score] || map[1]) };
}

export default function Register() {
  const navigate = useNavigate();
  const { register, loginGoogle, currentUser, authInitializing } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [googleClientId, setGoogleClientId] = useState(getInitialGoogleClientId);
  const [showClientIdModal, setShowClientIdModal] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authInitializing && currentUser) {
      if (isUndergradHostelStudent(currentUser.email)) {
        let isCompleted = false;
        try {
          isCompleted = localStorage.getItem(`iiitnr_residence_completed_${(currentUser.email || '').toLowerCase()}`) === 'true';
        } catch (_) {}
        if (!isCompleted && (!currentUser.hostel_name || !currentUser.room_number)) {
          navigate('/residence-info', { replace: true });
          return;
        }
      }
      navigate('/submit', { replace: true });
    }
  }, [currentUser, authInitializing, navigate]);

  useEffect(() => {
    if (!googleClientId) {
      fetchAuthConfig()
        .then((cfg) => {
          const remoteId = (cfg?.google_client_id || '').trim();
          if (remoteId && GOOGLE_CLIENT_ID_PATTERN.test(remoteId)) {
            setGoogleClientId(remoteId);
          }
        })
        .catch(() => {});
    }
  }, [googleClientId]);

  const parseEmailMetadata = (rawEmail) => {
    const clean = (rawEmail || '').trim().toLowerCase();
    if (!clean.endsWith(`@${ALLOWED_DOMAIN}`) || clean.startsWith('@')) return null;
    const prefix = clean.split('@')[0];

    // Do not show preview card for emails that do not have roll numbers/digits
    if (!/\d/.test(prefix)) {
      return null;
    }

    const match = prefix.match(/^([a-z]+(?:[._][a-z]+)*?)(?:20)?(\d{2})(\d{2,5})$/i);
    if (!match) return null;

    const rawName = match[1].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
    const code = match[3];
    let dept = 'Computer Science & Engineering';
    let deptCode = 'CSE';
    if (code.startsWith('101') || code.endsWith('01')) {
      dept = 'Data Science & Artificial Intelligence';
      deptCode = 'DSAI';
    } else if (code.startsWith('102') || code.endsWith('02') || code === '302') {
      dept = 'Electronics & Communication Engineering';
      deptCode = 'ECE';
    }
    return { fullName: rawName, department: dept, deptCode };
  };

  const livePreview = useMemo(() => parseEmailMetadata(email), [email]);
  const pwStrength = useMemo(() => evaluatePasswordStrength(password), [password]);

  const handleContinueWithGoogle = async () => {
    setError(null);
    let activeClientId = (googleClientId || getInitialGoogleClientId()).trim();
    if (!activeClientId) {
      try {
        setGoogleLoading(true);
        const cfg = await fetchAuthConfig();
        const remoteId = (cfg?.google_client_id || '').trim();
        if (remoteId && GOOGLE_CLIENT_ID_PATTERN.test(remoteId)) {
          activeClientId = remoteId;
          setGoogleClientId(remoteId);
        }
      } catch (_) {
      } finally {
        setGoogleLoading(false);
      }
    }
    if (!activeClientId) {
      if (IS_PROD_BUILD) {
        setError('Google SSO is not configured. Please register with email and password.');
        return;
      }
      setShowClientIdModal(true);
      return;
    }
    try {
      setGoogleLoading(true);
      await ensureGoogleSdkLoaded();
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: activeClientId,
        scope: 'openid email profile',
        hosted_domain: ALLOWED_DOMAIN,
        hd: ALLOWED_DOMAIN,
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setError(tokenResponse.error);
            setGoogleLoading(false);
            return;
          }
          try {
            const user = await loginGoogle({
              access_token: tokenResponse.access_token,
              hd: ALLOWED_DOMAIN,
              remember_me: rememberMe,
              is_registration: true,
            });
            if (isUndergradHostelStudent(user?.email)) {
              navigate('/residence-info', { replace: true });
            } else {
              navigate('/submit', { replace: true });
            }
          } catch (err) {
            setError(err.response?.data?.detail || err.message);
            setGoogleLoading(false);
          }
        },
      });
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  const handleContinueWithEmail = (e) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setError(`Registration requires an official @${ALLOWED_DOMAIN} email.`);
      return;
    }
    setStep('password');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const meta = parseEmailMetadata(cleanEmail);
      const user = await register({
        name: meta?.fullName || cleanEmail.split('@')[0],
        email: cleanEmail,
        password,
        role: 'STUDENT',
        department_name: meta?.department || 'Computer Science & Engineering',
        remember_me: rememberMe,
      });
      if (isUndergradHostelStudent(cleanEmail)) {
        navigate('/residence-info', { replace: true });
      } else {
        navigate('/submit', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Registration failed.');
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#0e1117] text-zinc-100' : 'bg-white text-slate-800'
      }`}
    >
      {/* Ambient background glows & mesh */}
      {isDark ? (
        <>
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[540px] h-[540px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 right-1/4 w-[420px] h-[420px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[540px] h-[540px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 right-1/4 w-[420px] h-[420px] bg-slate-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        </>
      )}

      {/* Top Theme Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center justify-center ${
            isDark
              ? 'bg-[#161b22] hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-amber-400'
              : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-700 hover:text-slate-900 shadow-2xs'
          }`}
        >
          {isDark ? (
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div
            className={`inline-flex p-3 rounded-2xl border transition-colors ${
              isDark
                ? 'bg-[#161b22] border-zinc-800 shadow-xl shadow-black/40 ring-1 ring-emerald-500/20'
                : 'bg-[#f1f5f9] border-slate-300 shadow-sm'
            }`}
          >
            <img
              src="/iiitnr_logo.png"
              alt="IIIT Naya Raipur"
              className="h-12 w-auto object-contain drop-shadow"
            />
          </div>
          <div>
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border ${
                isDark
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`}></span>
              Institutional Onboarding
            </div>
            <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Create IIIT-NR Account
            </h1>
            <p className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Step {step === 'password' ? '2' : '1'} of 2 · Student &amp; Staff Registration
            </p>
          </div>
        </div>

        <div
          className={`rounded-3xl border p-7 sm:p-8 space-y-5 relative overflow-hidden transition-colors ${
            isDark
              ? 'bg-[#161b22] border-zinc-800 shadow-2xl shadow-black/60 text-zinc-100'
              : 'bg-[#f1f5f9] border-slate-300 shadow-sm text-slate-900'
          }`}
        >
          {/* Top emerald accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

          {error && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-semibold space-y-2 ${
                error.toLowerCase().includes('google sign-in')
                  ? isDark
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                  : isDark
                  ? 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}
            >
              <div className="flex items-start gap-2">
                {error.toLowerCase().includes('google sign-in') ? (
                  <svg className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="leading-relaxed">{error}</span>
              </div>
              {error.toLowerCase().includes('google sign-in') && (
                <div className={`pt-2 border-t flex flex-col sm:flex-row items-center justify-between gap-2 ${isDark ? 'border-amber-900/60' : 'border-amber-200'}`}>
                  <span className={`text-[11px] font-normal ${isDark ? 'text-amber-300/90' : 'text-amber-800'}`}>
                    Authenticate via Google to continue:
                  </span>
                  <button
                    type="button"
                    onClick={handleContinueWithGoogle}
                    disabled={googleLoading}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors border ${
                      isDark
                        ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-500 shadow-xs'
                    }`}
                  >
                    <span>Sign in with Google</span>
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'email' ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleContinueWithGoogle}
                disabled={googleLoading || loading}
                className={`w-full py-3 px-4 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50 border ${
                  isDark
                    ? 'bg-[#0e1117] hover:bg-zinc-800 hover:border-emerald-500/40 border-zinc-800 text-zinc-100'
                    : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 hover:border-slate-400 text-slate-800 hover:text-slate-950'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>{googleLoading ? 'Connecting...' : 'Sign up with Google (@iiitnr.edu.in)'}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className={`grow border-t ${isDark ? 'border-zinc-800' : 'border-slate-300'}`} />
                <span className={`shrink mx-3 text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                  or email
                </span>
                <div className={`grow border-t ${isDark ? 'border-zinc-800' : 'border-slate-300'}`} />
              </div>

              <form onSubmit={handleContinueWithEmail} className="space-y-3.5">
                <div>
                  <label htmlFor="register-email" className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Institutional Email Address
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    required
                    autoFocus
                    placeholder="Email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    className={`w-full rounded-xl border px-4 py-3 text-xs sm:text-sm font-mono transition-all ${
                      isDark
                        ? 'border-zinc-800 bg-[#0e1117] text-zinc-100 placeholder-zinc-500 hover:border-zinc-700 focus:bg-[#161b22] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'
                        : 'border-slate-300 bg-[#e2e8f0] text-slate-900 placeholder-slate-500 hover:border-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>

                {livePreview && (
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      isDark
                        ? 'bg-[#0e1117] border-emerald-500/30 text-zinc-100'
                        : 'bg-[#e2e8f0] border-emerald-300 text-slate-900'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className={`font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {livePreview.fullName}
                      </div>
                      <div className={`text-[11px] truncate ${isDark ? 'text-emerald-400' : 'text-emerald-700 font-semibold'}`}>
                        {livePreview.department}
                      </div>
                    </div>
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                        isDark
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {livePreview.deptCode}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/25 transition-all cursor-pointer"
                >
                  Continue →
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div
                className={`flex items-center justify-between p-3 rounded-2xl border ${
                  isDark
                    ? 'bg-[#0e1117] border-zinc-800 text-zinc-200'
                    : 'bg-[#e2e8f0] border-slate-300 text-slate-900'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                    Email
                  </span>
                  <span className={`text-xs font-bold truncate block font-mono ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
                    {email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    isDark
                      ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                      : 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  Change
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`text-xs font-bold transition-colors cursor-pointer ${
                        isDark ? 'text-zinc-400 hover:text-emerald-400' : 'text-slate-600 hover:text-emerald-700'
                      }`}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full rounded-xl border px-4 py-3 text-xs sm:text-sm transition-all ${
                      isDark
                        ? 'border-zinc-800 bg-[#0e1117] text-zinc-100 placeholder-zinc-500 hover:border-zinc-700 focus:bg-[#161b22] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
                        : 'border-slate-300 bg-[#e2e8f0] text-slate-900 placeholder-slate-500 hover:border-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
                    }`}
                  />
                  <div className="mt-2 grid grid-cols-4 gap-1.5 h-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`rounded-full transition-all ${
                          pwStrength.score >= bar ? pwStrength.color : (isDark ? 'bg-zinc-800' : 'bg-slate-300')
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full rounded-xl border px-4 py-3 text-xs sm:text-sm transition-all ${
                      isDark
                        ? 'border-zinc-800 bg-[#0e1117] text-zinc-100 placeholder-zinc-500 hover:border-zinc-700 focus:bg-[#161b22] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
                        : 'border-slate-300 bg-[#e2e8f0] text-slate-900 placeholder-slate-500 hover:border-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          )}

          <div className={`pt-4 border-t flex items-center justify-between text-xs ${isDark ? 'border-zinc-800' : 'border-slate-300'}`}>
            <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>Already registered?</span>
            <Link
              to="/login"
              className={`font-bold transition-colors inline-flex items-center gap-1 ${
                isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-700 hover:text-emerald-800'
              }`}
            >
              <span>Sign in</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
