/**
 * SmartComplaintHandler - Institutional Login Portal (IIIT Naya Raipur)
 * Glossy Obsidian Glass Design:
 *  - Official circular IIIT-NR logo emblem with subtle live status indicator
 *  - Smoked black glass container with specular top highlight and deep shadow
 *  - High-contrast glossy white primary action button
 *  - Auto-detected student/staff roll & department profile preview
 *  - Google Workspace SSO + Institutional credentials dual authentication
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAuthConfig, resolveIiitnrProfileFromEmail, isUndergradHostelStudent } from '../api/auth';
import { Shield, KeyRound, Mail, ArrowRight, ExternalLink, AlertTriangle } from 'lucide-react';

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
            const profile = await fetchGoogleUserProfile(tokenResponse.access_token);
            if (!profile?.email) {
              throw new Error('Google profile could not be verified.');
            }
            const normalizedGoogleEmail = profile.email.toLowerCase().trim();
            if (!normalizedGoogleEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
              throw new Error(`Only official @${ALLOWED_DOMAIN} accounts are authorized.`);
            }

            const authedUser = await loginGoogle({
              email: normalizedGoogleEmail,
              name: profile.name || profile.given_name || normalizedGoogleEmail.split('@')[0],
              google_id: profile.sub || profile.id,
              picture: profile.picture,
              hd: profile.hd || ALLOWED_DOMAIN,
            });

            handleRoleRedirect(authedUser);
          } catch (err) {
            setError(err.message || 'Google Workspace SSO failed.');
          } finally {
            setGoogleLoading(false);
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setError(err.message || 'Failed to initialize Google Workspace login.');
      setGoogleLoading(false);
    }
  };

  const handleContinueWithGoogle = () => {
    setError(null);
    if (!googleClientId) {
      if (!IS_PROD_BUILD) {
        setShowClientIdModal(true);
      } else {
        setError('Google Single Sign-On is not configured on this server.');
      }
      return;
    }
    launchGoogleWorkspaceFlow(googleClientId);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedEmail) {
      setError('Please provide your official institutional email.');
      return;
    }
    if (!cleanedEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setError(`Authentication restricted to official @${ALLOWED_DOMAIN} accounts.`);
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(cleanedEmail, password);
      handleRoleRedirect(user);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('GOOGLE_AUTH_REQUIRED')) {
        setError('This account was provisioned via Google Workspace. Sign in with Google below.');
      } else if (msg.includes('INVALID_CREDENTIALS') || msg.includes('401')) {
        setError('Invalid password. If you registered via Google SSO, use the Google button.');
      } else if (msg.includes('USER_NOT_FOUND') || msg.includes('404')) {
        setError('No account found for this email. Register first.');
      } else {
        setError(msg || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121317] text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 relative font-sans selection:bg-white/20 selection:text-white overflow-hidden">
      {/* Subtle Specular Sheen (No Glaring Neon) */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent_60%)]" />

      {/* Main Glass Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-2xl p-6 sm:p-8 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.12)]">
        {/* Specular Top Rim */}
        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

        {/* Institutional Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08] p-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_6px_20px_rgba(0,0,0,0.5)]">
            <img
              src="/iiitnr_logo.png"
              alt="IIIT Naya Raipur Logo"
              className="h-full w-full object-contain filter drop-shadow"
            />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>IIIT NAYA RAIPUR · CAMPUS DESK</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Institutional Sign In
            </h1>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Secure single sign-on portal for scholars, faculties, and maintenance engineering personnel.
            </p>
          </div>
        </div>

        {/* Error Alert Pod */}
        {error && (
          <div className="p-3.5 rounded-xl text-xs space-y-2 border border-rose-500/30 bg-rose-950/40 text-rose-200 animate-fade-in shadow-inner">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
            {error.toLowerCase().includes('google sign-in') ? (
              <div className="pt-2 border-t border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-300">
                  Authenticate via Google Workspace:
                </span>
                <button
                  type="button"
                  onClick={handleContinueWithGoogle}
                  disabled={googleLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-colors shadow-xs cursor-pointer"
                >
                  Sign In With Google →
                </button>
              </div>
            ) : (error.toLowerCase().includes('not found') || error.toLowerCase().includes('register')) && (
              <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">Unregistered institutional account?</span>
                <Link
                  to="/register"
                  className="font-bold underline text-white hover:text-zinc-200 cursor-pointer"
                >
                  Register Here →
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
          className="w-full py-3 px-4 font-bold text-xs rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/30 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
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
          <span className="shrink mx-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            or institutional credentials
          </span>
          <div className="grow border-t border-white/[0.08]" />
        </div>

        {/* Institutional Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Institutional Email
            </label>
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
              className="w-full rounded-xl border border-white/[0.16] bg-[#08090f] text-white placeholder-zinc-500 px-4 py-3 text-xs sm:text-sm font-mono shadow-inner focus:border-indigo-500/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 hover:border-white/[0.25] transition"
            />
          </div>

          {/* Auto-detected Profile Chip */}
          {detectedProfile && (
            <div className="p-3.5 rounded-xl border border-indigo-500/25 bg-indigo-950/20 text-zinc-100 flex items-center justify-between text-xs animate-fade-in shadow-[inset_0_1px_0_0_rgba(129,140,248,0.15)]">
              <div className="min-w-0 pr-2">
                <div className="font-bold text-white truncate">{detectedProfile.name}</div>
                <div className="text-[11px] text-zinc-400 font-mono truncate">
                  {detectedProfile.department_name}
                </div>
              </div>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/15 text-indigo-300 shrink-0 uppercase tracking-wider">
                {detectedProfile.role}
              </span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="text-xs font-semibold text-zinc-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs font-mono font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
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
              className="w-full rounded-xl border border-white/[0.16] bg-[#08090f] text-white placeholder-zinc-500 px-4 py-3 text-xs sm:text-sm font-mono shadow-inner focus:border-indigo-500/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 hover:border-white/[0.25] transition"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer select-none text-zinc-400 hover:text-zinc-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-white/[0.2] bg-[#121317] text-white focus:ring-white/20 cursor-pointer"
              />
              <span>Keep me signed in</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#ff5a36] to-[#f04824] hover:from-[#ff6b4a] hover:to-[#ff5a36] text-white font-bold text-xs rounded-xl shadow-[0_4px_16px_rgba(240,72,36,0.35)] border border-white/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Campus Desk'}
          </button>
        </form>

        {/* Footer Register Link */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
          <span className="text-zinc-400">New scholar or faculty member?</span>
          <Link
            to="/register"
            className="font-bold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Create account</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Dev Mode Google Client ID Setup Dialog */}
      {!IS_PROD_BUILD && showClientIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="rounded-2xl max-w-md w-full p-6 space-y-4 border border-white/[0.14] bg-gradient-to-b from-[#1b1d24] to-[#14151b] text-zinc-100 shadow-2xl">
            <h3 className="text-base font-black text-white">Configure Google Client ID</h3>
            <p className="text-xs text-zinc-400">
              Provide your Google OAuth 2.0 Client ID for localhost testing.
            </p>
            <input
              type="text"
              placeholder="123456-abc.apps.googleusercontent.com"
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
              className="w-full rounded-xl border border-white/[0.1] bg-[#121317] text-white placeholder-zinc-500 px-4 py-2.5 text-xs font-mono focus:border-white/40 focus:outline-none"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClientIdModal(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
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
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold shadow-xs cursor-pointer transition-colors"
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
