/**
 * SmartComplaintHandler - Clean Institutional Login Portal (IIIT Naya Raipur)
 * Production-Grade Two-Step Authentication + Google Workspace SSO (@iiitnr.edu.in Internal Org):
 * Step 1: Identifier Screen
 *   - [ Email Address ]
 *   - [ Continue with Email ] -> validates @iiitnr.edu.in domain and transitions to Step 2 (Password)
 *   - [ Continue with Google ] -> opens Google Workspace account chooser locked to
 *     hosted_domain: 'iiitnr.edu.in', verifies @iiitnr.edu.in email & hd claim, and issues a 30-day session.
 * Step 2: Password Screen
 *   - Displays active institutional email with 'Change' action
 *   - [ Password ] field with show/hide toggle and Remember Me
 *   - [ Log In ] button
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAuthConfig } from '../api/auth';

const ALLOWED_DOMAIN = 'iiitnr.edu.in';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginGoogle, rememberedEmail, currentUser } = useAuth();

  const [step, setStep] = useState(rememberedEmail ? 'password' : 'email');
  const [email, setEmail] = useState(rememberedEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [googleClientId, setGoogleClientId] = useState(
    () => import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('smart_complaint_google_client_id') || ''
  );
  const [showClientIdModal, setShowClientIdModal] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');

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
      setStep('password');
    }
  }, [rememberedEmail]);

  useEffect(() => {
    if (!googleClientId) {
      fetchAuthConfig()
        .then((cfg) => {
          if (cfg?.google_client_id) {
            setGoogleClientId(cfg.google_client_id);
          }
        })
        .catch(() => {});
    }
  }, [googleClientId]);

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

  // Fetch Google user profile with fallback endpoint if primary googleapis URL is blocked by browser extensions
  const fetchGoogleUserProfile = async (accessToken) => {
    const endpoints = [
      'https://www.googleapis.com/oauth2/v3/userinfo',
      'https://openidconnect.googleapis.com/v1/userinfo',
    ];
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        // Try next endpoint
      }
    }
    return null;
  };

  const launchGoogleWorkspaceFlow = (activeClientId) => {
    if (!window.google?.accounts?.oauth2) {
      setError('Google Identity Services SDK is still loading. Please check your internet connection and try again.');
      return;
    }

    try {
      setGoogleLoading(true);
      const cleanHint = email.trim().toLowerCase();
      const tokenClientConfig = {
        client_id: activeClientId,
        scope: 'openid email profile',
        hosted_domain: ALLOWED_DOMAIN,
        hd: ALLOWED_DOMAIN,
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setError(`Google Sign-In was cancelled or failed: ${tokenResponse.error_description || tokenResponse.error}`);
            setGoogleLoading(false);
            return;
          }

          try {
            const profile = await fetchGoogleUserProfile(tokenResponse.access_token);

            if (profile) {
              const userEmail = (profile.email || '').trim().toLowerCase();
              const userHd = (profile.hd || '').trim().toLowerCase();
              const isVerified = profile.email_verified !== false;

              // Enforce @iiitnr.edu.in email and (if hd is present) hd === 'iiitnr.edu.in'
              if (!isVerified || !userEmail.endsWith(`@${ALLOWED_DOMAIN}`) || (userHd && userHd !== ALLOWED_DOMAIN)) {
                if (window.google?.accounts?.oauth2?.revoke) {
                  window.google.accounts.oauth2.revoke(tokenResponse.access_token, () => {});
                }
                setError(
                  `Access denied: Google Sign-In is strictly restricted to official @${ALLOWED_DOMAIN} institutional accounts (${userEmail || 'personal account'} is not permitted).`
                );
                setGoogleLoading(false);
                return;
              }

              const user = await loginGoogle({
                access_token: tokenResponse.access_token,
                email: userEmail,
                name: profile.name,
                picture: profile.picture,
                hd: userHd || ALLOWED_DOMAIN,
                email_verified: isVerified,
                remember_me: true,
              });
              handleRoleRedirect(user);
            } else {
              // Browser blocked direct userinfo fetch; delegate token resolution to backend
              const user = await loginGoogle({
                access_token: tokenResponse.access_token,
                email: cleanHint.endsWith(`@${ALLOWED_DOMAIN}`) ? cleanHint : undefined,
                hd: ALLOWED_DOMAIN,
                remember_me: true,
              });
              handleRoleRedirect(user);
            }
          } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Institutional Google account verification failed.');
            setGoogleLoading(false);
          }
        },
      };

      if (cleanHint.endsWith(`@${ALLOWED_DOMAIN}`)) {
        tokenClientConfig.hint = cleanHint;
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient(tokenClientConfig);
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setError(`Failed to initialize Google Workspace Sign-In: ${err.message}`);
      setGoogleLoading(false);
    }
  };

  const handleContinueWithGoogle = () => {
    setError(null);
    const activeClientId = (
      googleClientId ||
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      localStorage.getItem('smart_complaint_google_client_id') ||
      ''
    ).trim();

    if (!activeClientId) {
      setShowClientIdModal(true);
      return;
    }

    launchGoogleWorkspaceFlow(activeClientId);
  };

  const handleSaveClientIdAndContinue = (e) => {
    e.preventDefault();
    const cleaned = clientIdInput.trim();
    if (!cleaned || !cleaned.includes('.apps.googleusercontent.com')) {
      setError('Please enter a valid Google Cloud OAuth 2.0 Client ID ending in .apps.googleusercontent.com');
      return;
    }
    localStorage.setItem('smart_complaint_google_client_id', cleaned);
    setGoogleClientId(cleaned);
    setShowClientIdModal(false);
    setError(null);
    launchGoogleWorkspaceFlow(cleaned);
  };

  const handleContinueWithEmail = (e) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your institutional email address.');
      return;
    }

    if (!cleanEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setError(`Access restricted: Only official @${ALLOWED_DOMAIN} institutional accounts are permitted.`);
      return;
    }

    setStep('password');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
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
              Campus Facilities &amp; Grievance Management System
            </p>
          </div>
        </div>

        {/* Clean Vercel-Style Login Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-7 sm:p-9 space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="text-lg font-black text-slate-900">
              {step === 'password' ? 'Enter Password' : 'Log in to IIIT-NR'}
            </h2>
            <p className="text-xs text-slate-500">
              {step === 'password'
                ? 'Sign in with your institutional credentials'
                : 'Access your student or campus facilities account'}
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
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start space-x-2 animate-fade-in">
                  <span className="shrink-0">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: Identifier View */}
              {step === 'email' ? (
                <div className="space-y-3.5 animate-fade-in">
                  <form onSubmit={handleContinueWithEmail} className="space-y-3">
                    <div>
                      <input
                        type="email"
                        required
                        autoFocus
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError(null);
                        }}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-600/15 transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || googleLoading}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      <span>Continue with Email</span>
                    </button>
                  </form>

                  {/* Official Google Workspace OAuth Button (Internal @iiitnr.edu.in) */}
                  <button
                    type="button"
                    onClick={handleContinueWithGoogle}
                    disabled={googleLoading || loading}
                    className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-300 active:scale-[0.99] text-slate-800 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                      <span>Signing in with IIIT-NR Google...</span>
                    ) : (
                      <span>Continue with Google</span>
                    )}
                  </button>
                </div>
              ) : (
                /* Step 2: Password Screen */
                <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
                      <span className="text-xs font-semibold text-slate-900 truncate">{email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setError(null);
                        setPassword('');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 ml-3 shrink-0 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoFocus
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
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span>Verifying credentials...</span>
                    ) : (
                      <span>Log In</span>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setError(null);
                        setPassword('');
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      ← Use a different email
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

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

        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          Dr. Shyama Prasad Mukherjee International Institute of Information Technology, Naya Raipur
        </p>
      </div>

      {showClientIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Google Workspace OAuth Setup
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Configure IIIT-NR Google Client ID
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowClientIdModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Set <code className="font-mono font-bold text-slate-700">VITE_GOOGLE_CLIENT_ID</code> in <code className="font-mono text-slate-700">frontend/.env</code>, or paste your OAuth 2.0 Web Client ID below:
            </p>
            <form onSubmit={handleSaveClientIdAndContinue} className="space-y-3">
              <input
                type="text"
                required
                autoFocus
                placeholder="xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:border-indigo-600 focus:outline-none"
              />
              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowClientIdModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white"
                >
                  Save &amp; Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
