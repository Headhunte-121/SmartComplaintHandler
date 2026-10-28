/**
 * SmartComplaintHandler - Institutional Registration Portal (IIIT Naya Raipur)
 * High-Density Obsidian Command Desk Standard:
 *  - Official circular IIIT-NR logo emblem with cyan pulse heartbeat
 *  - Ambient deep space obsidian background with technical mesh grid
 *  - Translucent glassmorphic card container with cyan telemetry accents
 *  - 2-Step progressive onboarding (Email Verification -> Password & Security)
 *  - Auto-detected scholar department/roll badge
 *  - 4-Bar segmented password telemetry gauge
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAuthConfig, isUndergradHostelStudent } from '../api/auth';
import { Shield, Sparkles, KeyRound, Mail, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

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
  if (!pw) return { score: 0, label: 'Minimum 6 characters', color: 'bg-white/10' };
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1;

  const map = {
    1: { label: 'Fair', color: 'bg-amber-500' },
    2: { label: 'Good', color: 'bg-sky-500' },
    3: { label: 'Strong', color: 'bg-cyan-400' },
    4: { label: 'Institutional Grade', color: 'bg-emerald-400' },
  };
  return { score, ...(map[score] || map[1]) };
}

export default function Register() {
  const navigate = useNavigate();
  const { register, loginGoogle, currentUser, authInitializing } = useAuth();

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
  const pwStrength = evaluatePasswordStrength(password);

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
              setError(`Restricted domain: Only @${ALLOWED_DOMAIN} accounts are authorized.`);
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
              if (isUndergradHostelStudent(cleanUserEmail)) {
                let isCompleted = false;
                try {
                  isCompleted = localStorage.getItem(`iiitnr_residence_completed_${cleanUserEmail}`) === 'true';
                } catch (_) {}
                if (!isCompleted && (!user.hostel_name || !user.room_number)) {
                  navigate('/residence-info', { replace: true });
                  return;
                }
              }
              navigate('/submit', { replace: true });
            }
          } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Google registration failed.');
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
        setError('Google SSO is not configured on this server. Please complete registration with email & password.');
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

    if (!cleanEmail) {
      setError('Please provide your institutional email address.');
      return;
    }

    if (!cleanEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setError(`Only institutional email addresses ending with @${ALLOWED_DOMAIN} are allowed.`);
      return;
    }

    setStep('password');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
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
      const meta = parseEmailMetadata(cleanEmail);
      await register({
        name: meta?.fullName || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: password,
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
              Institutional Onboarding
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Create IIIT-NR Account
            </h1>
            <p className="text-xs font-mono text-slate-400 tracking-wide">
              Step {step === 'password' ? '2' : '1'} of 2 · Student &amp; Staff Registration
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
              {error.toLowerCase().includes('google sign-in') && (
                <div className="pt-2 border-t border-amber-900/60 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="text-[11px] font-normal text-amber-300/90">
                    Authenticate via Google to continue:
                  </span>
                  <button
                    type="button"
                    onClick={handleContinueWithGoogle}
                    disabled={googleLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors border bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-xs"
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
                <span>{googleLoading ? 'Connecting to Google...' : 'Sign up with Google (@iiitnr.edu.in)'}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-white/[0.08]" />
                <span className="shrink mx-3 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  or institutional email
                </span>
                <div className="grow border-t border-white/[0.08]" />
              </div>

              <form onSubmit={handleContinueWithEmail} className="space-y-4">
                <div>
                  <label htmlFor="register-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Institutional Email Address
                  </label>
                  <input
                    id="register-email"
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

                {livePreview && (
                  <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-[#0b0f19]/90 text-slate-100 flex items-center justify-between text-xs animate-fade-in shadow-inner">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-white truncate">{livePreview.fullName}</div>
                      <div className="text-[11px] text-cyan-400 font-mono truncate">
                        {livePreview.department}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shrink-0 uppercase tracking-wider">
                      {livePreview.deptCode}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                >
                  Continue to Security Setup →
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/[0.08] bg-[#0b0f19] text-slate-200">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider block text-slate-500">
                    Target Institutional Account
                  </span>
                  <span className="text-xs font-bold truncate block font-mono text-cyan-400">
                    {email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-white hover:bg-white/[0.05]"
                >
                  Change
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">Set Account Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs font-mono font-medium text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
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
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0b0f19] text-white placeholder-slate-500 px-4 py-3 text-xs sm:text-sm transition font-mono focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 hover:border-white/[0.14]"
                  />
                  <div className="mt-2 grid grid-cols-4 gap-1.5 h-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`rounded-full transition-all ${
                          pwStrength.score >= bar ? pwStrength.color : 'bg-white/[0.08]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0b0f19] text-white placeholder-slate-500 px-4 py-3 text-xs sm:text-sm transition font-mono focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 hover:border-white/[0.14]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Complete Institutional Registration'}
              </button>
            </form>
          )}

          {/* Footer Login Link */}
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-slate-400">Already registered?</span>
            <Link
              to="/login"
              className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
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
