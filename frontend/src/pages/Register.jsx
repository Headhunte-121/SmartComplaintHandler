/**
 * SmartComplaintHandler - Enterprise Split-Screen Institutional Registration Portal (IIIT Naya Raipur)
 * Design Pattern: Inspired by Linear, Clerk, and Vercel onboarding flows with live password strength
 *                 scoring, automatic roll/department extraction, IIIT-NR Hostel & Room assignment,
 *                 and Google Workspace SSO.
 * Security:
 * - Disables localStorage Client-ID injection in production builds (`IS_PROD_BUILD`).
 * - Enforces GOOGLE_CLIENT_ID_PATTERN validation.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAuthConfig } from '../api/auth';
import {
  IIITNR_HOSTELS,
  HOSTEL_FLOORS,
  HOSTEL_WINGS,
  getRoomsForBuilding,
} from '../data/iiitnrCampusData';

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
        reject(new Error('Google Identity Services SDK timed out while loading. Please check your connection.'));
      }
    }, 100);
  });
}

function evaluatePasswordStrength(pw) {
  if (!pw) return { score: 0, label: 'Enter at least 6 characters', color: 'bg-slate-200' };
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1;

  const map = {
    1: { label: 'Fair — add numbers or uppercase letters', color: 'bg-amber-500' },
    2: { label: 'Good — meets institutional baseline', color: 'bg-blue-500' },
    3: { label: 'Strong — resilient campus credential', color: 'bg-indigo-600' },
    4: { label: 'Excellent — high-entropy password', color: 'bg-emerald-500' },
  };
  return { score, ...(map[score] || map[1]) };
}

export default function Register() {
  const navigate = useNavigate();
  const { register, loginGoogle, currentUser } = useAuth();

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // IIIT-NR Student Residence Selection State
  const [selectedHostel, setSelectedHostel] = useState(IIITNR_HOSTELS[0].name);
  const [selectedFloor, setSelectedFloor] = useState('2');
  const [selectedWing, setSelectedWing] = useState('Wing A');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('Wing A, Room 204');

  const [googleClientId, setGoogleClientId] = useState(getInitialGoogleClientId);
  const [showClientIdModal, setShowClientIdModal] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');

  const [departmentInfo, setDepartmentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successUser, setSuccessUser] = useState(null);

  const availableRooms = useMemo(
    () => getRoomsForBuilding(selectedHostel, selectedFloor, selectedWing),
    [selectedHostel, selectedFloor, selectedWing]
  );

  useEffect(() => {
    if (availableRooms.length > 0 && !availableRooms.includes(selectedRoomNumber)) {
      setSelectedRoomNumber(availableRooms[0]);
    }
  }, [availableRooms]);

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
    const match = prefix.match(/^([a-z]+(?:[._][a-z]+)*?)(\d{2})(\d{2,5})$/i);
    if (match) {
      const rawName = match[1]
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
      const year = match[2];
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

      return {
        fullName: rawName,
        department: dept,
        deptCode,
        rollNo: `20${year}${deptCode}${code}`,
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
      deptCode: 'STAFF',
      rollNo: prefix.toUpperCase(),
    };
  };

  const livePreview = useMemo(() => parseEmailMetadata(email), [email]);
  const pwStrength = useMemo(() => evaluatePasswordStrength(password), [password]);

  const handleRoleRedirect = (user) => {
    setSuccessUser(user);
    let targetRoute = '/submit';
    if (user.role === 'SUPER_ADMIN') targetRoute = '/superadmin';
    else if (user.role === 'ADMIN') targetRoute = '/admin';
    else if (user.role === 'TECHNICIAN') targetRoute = '/technician';

    setTimeout(() => {
      navigate(targetRoute, { replace: true });
    }, 450);
  };

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
      } catch (_) {
        // Fallback to next endpoint or server-side verification
      }
    }
    return null;
  };

  const launchGoogleWorkspaceFlow = async (activeClientId) => {
    try {
      setGoogleLoading(true);
      await ensureGoogleSdkLoaded();

      const cleanHint = email.trim().toLowerCase();
      const tokenClientConfig = {
        client_id: activeClientId,
        scope: 'openid email profile',
        hosted_domain: ALLOWED_DOMAIN,
        hd: ALLOWED_DOMAIN,
        prompt: 'select_account',
        error_callback: (errObj) => {
          if (errObj?.type !== 'popup_closed') {
            setError(`Google Sign-Up popup error: ${errObj?.message || errObj?.type || 'Unable to open popup'}`);
          }
          setGoogleLoading(false);
        },
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setError(`Google Sign-Up was cancelled or failed: ${tokenResponse.error_description || tokenResponse.error}`);
            setGoogleLoading(false);
            return;
          }

          try {
            const profile = await fetchGoogleUserProfile(tokenResponse.access_token);

            if (profile) {
              const userEmail = (profile.email || '').trim().toLowerCase();
              const userHd = (profile.hd || '').trim().toLowerCase();
              const isVerified = profile.email_verified !== false;

              if (!isVerified || !userEmail.endsWith(`@${ALLOWED_DOMAIN}`) || (userHd && userHd !== ALLOWED_DOMAIN)) {
                if (window.google?.accounts?.oauth2?.revoke) {
                  window.google.accounts.oauth2.revoke(tokenResponse.access_token, () => {});
                }
                setError(
                  `Access denied: Google Sign-Up is strictly restricted to official @${ALLOWED_DOMAIN} institutional accounts (${userEmail || 'personal account'} is not permitted).`
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
      setError(`Failed to initialize Google Workspace Sign-Up: ${err.message}`);
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
        // Ignore config fetch error and fall through
      } finally {
        setGoogleLoading(false);
      }
    }

    if (!activeClientId) {
      if (IS_PROD_BUILD) {
        setError('Google Workspace SSO is currently being configured by the Campus Directorate. Please sign up with your institutional email and password.');
        return;
      }
      setShowClientIdModal(true);
      return;
    }

    await launchGoogleWorkspaceFlow(activeClientId);
  };

  const handleSaveClientIdAndContinue = async (e) => {
    e.preventDefault();
    const cleaned = clientIdInput.trim();
    if (!GOOGLE_CLIENT_ID_PATTERN.test(cleaned)) {
      setError('Please enter a valid Google Cloud OAuth 2.0 Client ID matching <number>-<id>.apps.googleusercontent.com');
      return;
    }
    if (!IS_PROD_BUILD) {
      localStorage.setItem('smart_complaint_google_client_id', cleaned);
    }
    setGoogleClientId(cleaned);
    setShowClientIdModal(false);
    setError(null);
    await launchGoogleWorkspaceFlow(cleaned);
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
      setError(`Registration is restricted to official @${ALLOWED_DOMAIN} institutional email addresses.`);
      return;
    }

    const parsed = parseEmailMetadata(cleanEmail);
    setDepartmentInfo(parsed);
    setStep('password');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);

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
      const cleanEmail = email.trim().toLowerCase();
      const meta = departmentInfo || parseEmailMetadata(cleanEmail);

      const user = await register({
        name: meta?.fullName || cleanEmail.split('@')[0],
        email: cleanEmail,
        password,
        role: 'STUDENT',
        department_name: meta?.department || 'Computer Science & Engineering',
        hostel_name: selectedHostel,
        room_number: selectedRoomNumber,
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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#f4f7f5] bg-architectural-grid">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <img
            src="/iiitnr_logo.png"
            alt="IIIT Naya Raipur Official Logo"
            className="h-16 w-auto mx-auto object-contain drop-shadow-xs"
          />
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              IIIT Naya Raipur
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Campus Facilities &amp; Grievance Management Portal
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-900/[0.04] p-7 sm:p-9 space-y-6">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/80">
                Account Registration
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                Step {step === 'password' ? '2' : '1'} of 2
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight pt-1">
                {step === 'password' ? 'Select Hostel & Set Password' : 'Create your IIIT-NR account'}
              </h2>
              <p className="text-xs text-slate-500">
                {step === 'password'
                  ? 'Select your IIIT-NR hostel room and set your account password'
                  : 'Register with Google Workspace or your @iiitnr.edu.in email'}
              </p>
            </div>

            {successUser ? (
              <div className="py-8 text-center space-y-3 animate-fade-in">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-xl font-bold shadow-xs">
                  ✓
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Welcome to IIIT-NR Facilities, {successUser.name}!
                </h3>
                {successUser.hostel_name && (
                  <p className="text-xs text-indigo-600 font-semibold">
                    🏠 {successUser.hostel_name} • {successUser.room_number}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Your account is active. Opening your portal...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start space-x-2.5 animate-fade-in">
                    <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {step === 'email' ? (
                  <div className="space-y-4 animate-fade-in">
                    <button
                      type="button"
                      onClick={handleContinueWithGoogle}
                      disabled={googleLoading || loading}
                      className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300/90 hover:border-slate-400 active:scale-[0.99] text-slate-800 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
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
                        <span>Signing up with IIIT-NR Google...</span>
                      ) : (
                        <span>Sign up with Google (@iiitnr.edu.in)</span>
                      )}
                    </button>

                    <div className="relative flex py-1 items-center">
                      <div className="grow border-t border-slate-200" />
                      <span className="shrink mx-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        or email
                      </span>
                      <div className="grow border-t border-slate-200" />
                    </div>

                    <form onSubmit={handleContinueWithEmail} className="space-y-3.5">
                      <div className="space-y-1.5">
                        <label htmlFor="register-email" className="block text-xs font-bold text-slate-700">
                          Institutional Email Address
                        </label>
                        <input
                          id="register-email"
                          type="email"
                          required
                          autoFocus
                          autoComplete="username"
                          placeholder="name26100@iiitnr.edu.in"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError(null);
                          }}
                          className="enterprise-input"
                        />
                      </div>

                      {livePreview && (
                        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs animate-fade-in">
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-emerald-950 truncate">
                              {livePreview.fullName} ({livePreview.rollNo})
                            </div>
                            <div className="text-[11px] text-emerald-700 truncate">
                              {livePreview.department}
                            </div>
                          </div>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-emerald-700 border border-emerald-200 shrink-0">
                            {livePreview.deptCode} Verified
                          </span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading || googleLoading}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                      >
                        <span>Continue with Email</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </form>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Email
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate block font-mono">
                          {email}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setStep('email');
                          setError(null);
                          setPassword('');
                          setConfirmPassword('');
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded-lg hover:bg-indigo-50 shrink-0 cursor-pointer"
                      >
                        Change
                      </button>
                    </div>

                    {departmentInfo && (
                      <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-200/70 flex items-center justify-between text-xs select-none">
                        <div className="min-w-0 pr-2">
                          <span className="text-indigo-400 font-bold uppercase text-[10px] block">
                            Auto-Detected Academic Department
                          </span>
                          <span className="font-bold text-indigo-950 text-xs truncate block">
                            {departmentInfo.department}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                          🔒 Verified
                        </span>
                      </div>
                    )}

                    {/* IIIT-NR Hostel & Room Number Selector */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                          🏠 IIIT-NR Hostel &amp; Room Assignment
                        </span>
                        <span className="text-[10px] font-mono text-indigo-600 font-bold">
                          Auto-Fills Complaints
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Select Your Hostel House
                        </label>
                        <select
                          value={selectedHostel}
                          onChange={(e) => setSelectedHostel(e.target.value)}
                          className="enterprise-input text-xs"
                        >
                          {IIITNR_HOSTELS.map((h) => (
                            <option key={h.id} value={h.name}>
                              {h.name}
                            </option>
                          ))}
                          <option value="Day Scholar (Off-Campus)">
                            Day Scholar (Non-Hosteller)
                          </option>
                        </select>
                      </div>

                      {selectedHostel !== 'Day Scholar (Off-Campus)' && (
                        <>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Floor
                              </label>
                              <select
                                value={selectedFloor}
                                onChange={(e) => setSelectedFloor(e.target.value)}
                                className="enterprise-input text-xs"
                              >
                                {HOSTEL_FLOORS.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Wing
                              </label>
                              <select
                                value={selectedWing}
                                onChange={(e) => setSelectedWing(e.target.value)}
                                className="enterprise-input text-xs"
                              >
                                {HOSTEL_WINGS.slice(0, 2).map((w) => (
                                  <option key={w.id} value={w.id}>
                                    {w.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Room Number
                            </label>
                            <select
                              value={selectedRoomNumber}
                              onChange={(e) => setSelectedRoomNumber(e.target.value)}
                              className="enterprise-input text-xs"
                            >
                              {availableRooms
                                .filter((r) => r.includes('Room') || r.includes('Suite'))
                                .map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Create Password
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoFocus
                          autoComplete="new-password"
                          placeholder="Minimum 6 characters"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setError(null);
                          }}
                          className="enterprise-input"
                        />

                        {/* 4-Bar Live Password Strength Indicator */}
                        <div className="mt-2 space-y-1">
                          <div className="grid grid-cols-4 gap-1.5 h-1">
                            {[1, 2, 3, 4].map((bar) => (
                              <div
                                key={bar}
                                className={`rounded-full transition-all duration-200 ${
                                  pwStrength.score >= bar ? pwStrength.color : 'bg-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {pwStrength.label}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Confirm Password
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoComplete="new-password"
                          placeholder="Re-enter your password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setError(null);
                          }}
                          className="enterprise-input"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          />
                          <span className="text-xs font-medium text-slate-600">
                            Keep me signed in for 30 days
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span>Creating Institutional Account...</span>
                      ) : (
                        <span>Complete Registration</span>
                      )}
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStep('email');
                          setError(null);
                          setPassword('');
                          setConfirmPassword('');
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

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Already registered?</span>
              <Link
                to="/login"
                className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Sign in to portal →
              </Link>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            Protected by institutional domain verification (<code className="font-mono">@iiitnr.edu.in</code>)
          </p>
        </div>

        {!IS_PROD_BUILD && showClientIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Local Dev Google OAuth Setup
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Configure IIIT-NR Google Client ID
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowClientIdModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClientIdAndContinue} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google OAuth 2.0 Client ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="1234567890-abcdefg.apps.googleusercontent.com"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  className="enterprise-input font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClientIdModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                >
                  Save &amp; Launch Google Sign-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
