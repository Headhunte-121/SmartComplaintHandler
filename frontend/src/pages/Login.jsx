/**
 * SmartComplaintHandler - Institutional Login Portal (IIIT Naya Raipur)
 * Rich visual design with ambient background, glass badge, auto-detected student/staff card,
 * and quick role switcher — zero promotional filler advertising.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAuthConfig, resolveIiitnrProfileFromEmail, isUndergradHostelStudent } from '../api/auth';

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
        reject(new Error('Google SDK timed out while loading.'));
      }
    }, 100);
  });
}

export default function Login() {
  const navigate = useNavigate();
  const { login, loginGoogle, currentUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [googleClientId, setGoogleClientId] = useState(getInitialGoogleClientId);
  const [showClientIdModal, setShowClientIdModal] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      localStorage.removeItem('smart_complaint_remember_email');
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (currentUser) {
      handleRoleRedirect(currentUser);
    }
  }, [currentUser, navigate]);

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

  const detectedProfile = useMemo(() => {
    const clean = email.trim().toLowerCase();
    if (!clean.endsWith(`@${ALLOWED_DOMAIN}`) || clean.startsWith('@')) return null;
    return resolveIiitnrProfileFromEmail(clean);
  }, [email]);

  const handleRoleRedirect = (user) => {
    if (isUndergradHostelStudent(user?.email)) {
      const isCompleted = localStorage.getItem(`iiitnr_residence_completed_${(user.email || '').toLowerCase()}`);
      if (!isCompleted && (!user.hostel_name || !user.room_number)) {
        navigate('/residence-info', { replace: true });
        return;
      }
    }
    const targetRoute =
      user.role === 'SUPER_ADMIN'
        ? '/superadmin'
        : user.role === 'ADMIN'
        ? '/admin'
        : user.role === 'TECHNICIAN'
        ? '/technician'
        : '/submit';
    navigate(targetRoute, { replace: true });
  };

  const fetchGoogleUserProfile = async (accessToken) => {
    const endpoints = [
      'https://www.googleapis.com/oauth2/v3/userinfo',
      'https://openidconnect.googleapis.com/v1/userinfo',
    ];
    for (const url of endpoints) {
      try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (res.ok) return await res.json();
      } catch (_) {}
    }
    return null;
  };

  const launchGoogleWorkspaceFlow = async (activeClientId) => {
    try {
      setGoogleLoading(true);
      await ensureGoogleSdkLoaded();
      const cleanHint = email.trim().toLowerCase();

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: activeClientId,
        scope: 'openid email profile',
        hosted_domain: ALLOWED_DOMAIN,
        hd: ALLOWED_DOMAIN,
        hint: cleanHint.endsWith(`@${ALLOWED_DOMAIN}`) ? cleanHint : undefined,
        prompt: 'select_account',
        error_callback: (errObj) => {
          if (errObj?.type !== 'popup_closed') {
            setError(errObj?.message || 'Unable to open Google Sign-In popup.');
          }
          setGoogleLoading(false);
        },
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setError(tokenResponse.error_description || tokenResponse.error);
            setGoogleLoading(false);
            return;
          }
          try {
            const profile = await fetchGoogleUserProfile(tokenResponse.access_token);
            if (profile) {
              const userEmail = (profile.email || '').trim().toLowerCase();
              const userHd = (profile.hd || '').trim().toLowerCase();
              if (!userEmail.endsWith(`@${ALLOWED_DOMAIN}`) || (userHd && userHd !== ALLOWED_DOMAIN)) {
                setError(`Only @${ALLOWED_DOMAIN} accounts are permitted.`);
                setGoogleLoading(false);
                return;
              }
              const user = await loginGoogle({
                access_token: tokenResponse.access_token,
                email: userEmail,
                name: profile.name,
                picture: profile.picture,
                hd: userHd || ALLOWED_DOMAIN,
                email_verified: profile.email_verified !== false,
                remember_me: rememberMe,
                is_registration: false,
              });
              handleRoleRedirect(user);
            } else {
              const user = await loginGoogle({
                access_token: tokenResponse.access_token,
                email: cleanHint.endsWith(`@${ALLOWED_DOMAIN}`) ? cleanHint : undefined,
                hd: ALLOWED_DOMAIN,
                remember_me: rememberMe,
                is_registration: false,
              });
              handleRoleRedirect(user);
            }
          } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Google verification failed.');
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
        setError('Google SSO is not configured on this server. Please sign in with email and password.');
        return;
      }
      setShowClientIdModal(true);
      return;
    }
    await launchGoogleWorkspaceFlow(activeClientId);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your institutional email.');
      return;
    }
    if (!cleanEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setError(`Please use your @${ALLOWED_DOMAIN} email address.`);
      return;
    }
    if (!password || password.length < 4) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(cleanEmail, password, rememberMe);
      handleRoleRedirect(user);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Invalid email or password.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 bg-[#080C14] text-slate-100 relative overflow-hidden">
      {/* Ambient background glows & mesh */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[540px] h-[540px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-[420px] h-[420px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-[#0B101D] border border-slate-800 shadow-xl shadow-black/40 ring-1 ring-emerald-500/20">
            <img
              src="/iiitnr_logo.png"
              alt="IIIT Naya Raipur"
              className="h-12 w-auto object-contain drop-shadow"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Institutional Access
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              IIIT Naya Raipur Portal
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Campus Facilities &amp; Maintenance Command Center
            </p>
          </div>
        </div>

        <div className="bg-[#0B101D] rounded-3xl border border-slate-800 shadow-2xl shadow-black/60 p-7 sm:p-8 space-y-5 text-white relative overflow-hidden ring-1 ring-slate-800/80">
          {/* Top emerald accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-semibold space-y-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
              {(error.toLowerCase().includes('not found') || error.toLowerCase().includes('register')) && (
                <div className="pt-2 border-t border-rose-900/60 flex items-center justify-between">
                  <span className="text-[11px] text-rose-300/80">Unregistered institutional account?</span>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
                  >
                    <span>Register Here</span>
                    <span>→</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Google SSO Button */}
          <button
            type="button"
            onClick={handleContinueWithGoogle}
            disabled={googleLoading || loading}
            className="w-full py-3 px-4 bg-slate-900/90 hover:bg-slate-800 hover:border-emerald-500/40 border border-slate-700/90 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <span>{googleLoading ? 'Connecting...' : 'Sign in with Google (@iiitnr.edu.in)'}</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-800" />
            <span className="shrink mx-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              or institutional credentials
            </span>
            <div className="grow border-t border-slate-800" />
          </div>

          {/* Standard Single Login Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-300 mb-1.5">
                Institutional Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoFocus
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-mono"
              />
            </div>

            {detectedProfile && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-white truncate">{detectedProfile.name}</div>
                  <div className="text-[11px] text-emerald-400 truncate">
                    {detectedProfile.identifier} · {detectedProfile.department_name}
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                  {detectedProfile.role}
                </span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-xs font-bold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
              />
            </div>

            <label className="flex items-center space-x-2 text-xs font-medium text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500/30"
              />
              <span>Keep me signed in for 30 days</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">New student or staff?</span>
            <Link to="/register" className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1">
              <span>Create account</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {!IS_PROD_BUILD && showClientIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0B101D] rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-800 shadow-2xl text-white">
            <h3 className="text-base font-black text-white">Configure Google Client ID</h3>
            <p className="text-xs text-slate-400">Development mode Google OAuth Client ID setup</p>
            <input
              type="text"
              placeholder="123456-abc.apps.googleusercontent.com"
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowClientIdModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const cleaned = clientIdInput.trim();
                  if (GOOGLE_CLIENT_ID_PATTERN.test(cleaned)) {
                    localStorage.setItem('smart_complaint_google_client_id', cleaned);
                    setGoogleClientId(cleaned);
                    setShowClientIdModal(false);
                    launchGoogleWorkspaceFlow(cleaned);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-bold shadow-sm"
              >
                Save &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
