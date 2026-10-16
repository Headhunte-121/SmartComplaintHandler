/**
 * SmartComplaintHandler - Institutional Login Portal (IIIT Naya Raipur)
 * Rich visual design with ambient background, glass badge, auto-detected student/staff card,
 * and quick role switcher — zero promotional filler advertising.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAuthConfig, resolveIiitnrProfileFromEmail } from '../api/auth';

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
  const { login, loginGoogle, rememberedEmail, currentUser } = useAuth();

  const [step, setStep] = useState(rememberedEmail ? 'password' : 'email');
  const [email, setEmail] = useState(rememberedEmail || '');
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
      setStep('password');
    }
  }, [rememberedEmail]);

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
              });
              handleRoleRedirect(user);
            } else {
              const user = await loginGoogle({
                access_token: tokenResponse.access_token,
                email: cleanHint.endsWith(`@${ALLOWED_DOMAIN}`) ? cleanHint : undefined,
                hd: ALLOWED_DOMAIN,
                remember_me: rememberMe,
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

  const handleContinueWithEmail = (e) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setError(`Please use your @${ALLOWED_DOMAIN} email address.`);
      return;
    }
    setStep('password');
  };

  const handlePasswordSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    if (!password || password.length < 4) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email.trim().toLowerCase(), password, rememberMe);
      handleRoleRedirect(user);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Invalid email or password.');
      setLoading(false);
    }
  };

  const handleQuickDemoSignIn = async (demoEmail) => {
    setError(null);
    setLoading(true);
    try {
      const user = await login(demoEmail, 'password123', true);
      handleRoleRedirect(user);
    } catch (err) {
      setError(err.response?.data?.detail || 'Quick sign-in failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 bg-slate-50 bg-architectural-grid relative overflow-hidden">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="text-center space-y-2.5">
          <div className="inline-flex p-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <img
              src="/iiitnr_logo.png"
              alt="IIIT Naya Raipur"
              className="h-12 w-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              IIIT Naya Raipur Portal
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Campus Facilities &amp; Hostel Maintenance
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-900/[0.04] p-7 sm:p-8 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleContinueWithGoogle}
                disabled={googleLoading || loading}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300/90 hover:border-slate-400 text-slate-800 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
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
                <div className="grow border-t border-slate-200" />
                <span className="shrink mx-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  or email
                </span>
                <div className="grow border-t border-slate-200" />
              </div>

              <form onSubmit={handleContinueWithEmail} className="space-y-3.5">
                <div>
                  <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Institutional Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoFocus
                    placeholder="name26100@iiitnr.edu.in"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    className="enterprise-input"
                  />
                </div>

                {detectedProfile && (
                  <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-indigo-950 truncate">{detectedProfile.name}</div>
                      <div className="text-[11px] text-indigo-700 truncate">
                        {detectedProfile.identifier} · {detectedProfile.department_name}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-indigo-700 border border-indigo-200 shrink-0">
                      {detectedProfile.role}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Continue →
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handlePasswordSignIn} className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Account
                  </span>
                  <span className="text-xs font-bold text-slate-900 truncate block font-mono">
                    {email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setPassword('');
                    setError(null);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded-lg hover:bg-indigo-50 cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="enterprise-input"
                />
              </div>

              <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Keep me signed in for 30 days</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Quick Role Switch
            </span>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoSignIn('nikhil26100@iiitnr.edu.in')}
                className="py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-bold border border-slate-200/80 transition-colors cursor-pointer"
              >
                🎓 Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoSignIn('admin@iiitnr.edu.in')}
                className="py-2 rounded-xl bg-slate-50 hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-bold border border-slate-200/80 transition-colors cursor-pointer"
              >
                🛡️ Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoSignIn('tech.ramesh@iiitnr.edu.in')}
                className="py-2 rounded-xl bg-slate-50 hover:bg-[#8C906D]/15 hover:text-[#3C4233] text-slate-700 font-bold border border-slate-200/80 transition-colors cursor-pointer"
              >
                🔧 Tech
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoSignIn('superadmin@iiitnr.edu.in')}
                className="py-2 rounded-xl bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-700 font-bold border border-slate-200/80 transition-colors cursor-pointer"
              >
                👑 Director
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">New student or staff?</span>
            <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-800">
              Create account →
            </Link>
          </div>
        </div>
      </div>

      {!IS_PROD_BUILD && showClientIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="text-base font-black text-slate-900">Configure Google Client ID</h3>
            <input
              type="text"
              placeholder="123456-abc.apps.googleusercontent.com"
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
              className="enterprise-input font-mono text-xs"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowClientIdModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600"
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
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
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
