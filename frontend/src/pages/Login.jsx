/**
 * SmartComplaintHandler - Institutional Login Portal (IIIT Naya Raipur)
 * High-Density Obsidian Command Desk Standard:
 *  - Official circular IIIT-NR logo emblem with cyan pulse heartbeat
 *  - Ambient deep space obsidian background with technical mesh grid
 *  - Translucent glassmorphic card container with cyan telemetry accents
 *  - Auto-detected student/staff roll & department profile preview
 *  - Google Workspace SSO + Institutional credentials dual authentication
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAuthConfig, resolveIiitnrProfileFromEmail, isUndergradHostelStudent } from '../api/auth';
import { Shield, Sparkles, KeyRound, Mail, ArrowRight, ExternalLink, AlertTriangle } from 'lucide-react';

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
  const { login, loginGoogle, currentUser, authInitializing } = useAuth();

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

  const handleRoleRedirect = (user) => {
    if (!user) return;
    if (isUndergradHostelStudent(user?.email)) {
      let isCompleted = false;
      try {
        isCompleted = localStorage.getItem(`iiitnr_residence_completed_${(user.email || '').toLowerCase()}`) === 'true';
      } catch (_) {}
      if (!isCompleted && (!user.hostel_name || !user.room_number)) {
        navigate('/residence-info', { replace: true });
        return;
      }
    }
    const targetRoute =
      user.role === 'SUPER_ADMIN'
        ? '/superadmin'
        : user.role === 'ADMIN'
        ? '/operations'
        : user.role === 'TECHNICIAN'
        ? '/technician'
        : '/student';
    navigate(targetRoute, { replace: true });
  };

  useEffect(() => {
    try {
      localStorage.removeItem('smart_complaint_remember_email');
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!authInitializing && currentUser) {
      handleRoleRedirect(currentUser);
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

  const detectedProfile = useMemo(() => {
    const clean = email.trim().toLowerCase();
    if (!clean.endsWith(`@${ALLOWED_DOMAIN}`) || clean.startsWith('@')) return null;
    return resolveIiitnrProfileFromEmail(clean);
  }, [email]);

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
        hint: cleanHint.endsWith(`@${ALLOWED_DOMAIN}`) ? cleanHint : undefined,
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setError(`Google authorization failed: ${tokenResponse.error}`);
            setGoogleLoading(false);
            return;
          }
          try {
            const googleProfile = await fetchGoogleUserProfile(tokenResponse.access_token);
            const userEmail = googleProfile?.email || '';
            const cleanUserEmail = userEmail.trim().toLowerCase();

            if (!cleanUserEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
              setError(`Restricted domain: Only @${ALLOWED_DOMAIN} accounts are authorized to sign in.`);
              setGoogleLoading(false);
              return;
            }

            const user = await loginGoogle({
              access_token: tokenResponse.access_token,
              email: cleanUserEmail,
              name: googleProfile?.name || cleanUserEmail.split('@')[0],
              picture: googleProfile?.picture,
            });

            if (user) {
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
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden bg-[#090d14] text-slate-100 font-sans antialiased selection:bg-cyan-500/30">
      {/* Ambient background glows & technical mesh grid */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-35 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Emblem & Institutional Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-white/[0.04] border border-white/[0.1] shadow-2xl backdrop-blur-md">
            <img
              src="/iiitnr_logo.png"
              alt="IIIT Naya Raipur"
              className="h-12 w-auto object-contain drop-shadow"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mb-2 border bg-cyan-500/10 border-cyan-500/25 text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Institutional Access Gate
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              IIIT Naya Raipur Portal
            </h1>
            <p className="text-xs font-mono text-slate-400 tracking-wide">
              Campus Facilities &amp; Maintenance Command Desk
            </p>
          </div>
        </div>

        {/* Obsidian Glassmorphic Card Container */}
        <div className="rounded-3xl border border-white/[0.08] bg-[#0e131f]/85 backdrop-blur-xl p-7 sm:p-8 space-y-5 relative overflow-hidden shadow-2xl shadow-black/80">
          {/* Top Cyan Glowing Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

          {/* Error Banner */}
          {error && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-semibold space-y-2.5 ${
                error.toLowerCase().includes('google sign-in')
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
              {error.toLowerCase().includes('google sign-in') ? (
                <div className="pt-2 border-t border-amber-900/60 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="text-[11px] font-normal text-amber-300/90">
                    Click below to authenticate via Google:
                  </span>
                  <button
                    type="button"
                    onClick={handleContinueWithGoogle}
                    disabled={googleLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors border bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-xs"
                  >
                    <span>Sign In With Google</span>
                    <span>→</span>
                  </button>
                </div>
              ) : (error.toLowerCase().includes('not found') || error.toLowerCase().includes('register')) && (
                <div className="pt-2 border-t border-rose-900/60 flex items-center justify-between">
                  <span className="text-[11px] text-rose-300/80">Unregistered institutional account?</span>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1 font-bold underline cursor-pointer text-cyan-400 hover:text-cyan-300"
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
            className="w-full py-3 px-4 font-bold text-xs rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] hover:border-cyan-500/40 text-slate-200 hover:text-white shadow-xs transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <span>{googleLoading ? 'Connecting to Google SSO...' : 'Sign in with Google (@iiitnr.edu.in)'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-white/[0.08]" />
            <span className="shrink mx-3 text-[10px] font-mono uppercase tracking-wider text-slate-500">
              or institutional credentials
            </span>
            <div className="grow border-t border-white/[0.08]" />
          </div>

          {/* Institutional Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Institutional Email
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  required
                  autoFocus
                  placeholder="name@iiitnr.edu.in"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#0b0f19] text-white placeholder-slate-500 px-4 py-3 text-xs sm:text-sm font-mono focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 hover:border-white/[0.14] transition"
                />
              </div>
            </div>

            {/* Auto-detected Profile Chip */}
            {detectedProfile && (
              <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-[#0b0f19]/90 text-slate-100 flex items-center justify-between text-xs animate-fade-in shadow-inner">
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-white truncate">{detectedProfile.name}</div>
                  <div className="text-[11px] text-cyan-400 font-mono truncate">
                    {detectedProfile.department_name}
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shrink-0 uppercase tracking-wider">
                  {detectedProfile.role}
                </span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-mono font-medium text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter account password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-xl border border-white/[0.08] bg-[#0b0f19] text-white placeholder-slate-500 px-4 py-3 text-xs sm:text-sm transition font-mono focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 hover:border-white/[0.14]"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer select-none text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-white/[0.15] bg-[#0b0f19] text-cyan-500 focus:ring-cyan-500/30 cursor-pointer"
                />
                <span>Keep me signed in</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Campus Desk'}
            </button>
          </form>

          {/* Footer Register Link */}
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-slate-400">New scholar or faculty member?</span>
            <Link
              to="/register"
              className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Create account</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Dev Mode Google Client ID Setup Dialog */}
      {!IS_PROD_BUILD && showClientIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="rounded-3xl max-w-md w-full p-6 space-y-4 border border-white/[0.12] bg-[#0c1017]/95 text-slate-100 shadow-2xl">
            <h3 className="text-base font-black text-white">Configure Google Client ID</h3>
            <p className="text-xs text-slate-400">
              Provide your Google OAuth 2.0 Client ID for localhost testing.
            </p>
            <input
              type="text"
              placeholder="123456-abc.apps.googleusercontent.com"
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
              className="w-full rounded-xl border border-white/[0.1] bg-[#0b0f19] text-white placeholder-slate-500 px-4 py-2.5 text-xs font-mono focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClientIdModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
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
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
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
