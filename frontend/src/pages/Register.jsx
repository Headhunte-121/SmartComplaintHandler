/**
 * SmartComplaintHandler - Institutional Registration Portal (IIIT Naya Raipur)
 * Rich visual design with auto-detected Roll/Branch card, IIIT-NR Hostel/Wing/Room selector,
 * and 4-bar password strength meter — zero promotional filler advertising.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAuthConfig } from '../api/auth';
import {
  HOSTEL_FLOORS,
  HOSTEL_WINGS,
  getHostelBuildings,
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
    2: { label: 'Good', color: 'bg-blue-500' },
    3: { label: 'Strong', color: 'bg-indigo-600' },
    4: { label: 'Excellent', color: 'bg-emerald-500' },
  };
  return { score, ...(map[score] || map[1]) };
}

export default function Register() {
  const navigate = useNavigate();
  const { register, loginGoogle, currentUser } = useAuth();

  const hostels = useMemo(() => getHostelBuildings(), []);
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [selectedHostel, setSelectedHostel] = useState(hostels[0]?.name || 'Ramanujan House (Boys Hostel)');
  const [selectedFloor, setSelectedFloor] = useState('2');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('Room 204');

  const [googleClientId, setGoogleClientId] = useState(getInitialGoogleClientId);
  const [showClientIdModal, setShowClientIdModal] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  const availableRooms = useMemo(
    () => getRoomsForBuilding(selectedHostel, selectedFloor),
    [selectedHostel, selectedFloor]
  );

  useEffect(() => {
    if (availableRooms.length > 0 && !availableRooms.includes(selectedRoomNumber)) {
      setSelectedRoomNumber(availableRooms[0]);
    }
  }, [availableRooms]);

  useEffect(() => {
    if (currentUser) {
      navigate('/submit', { replace: true });
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
      const rawName = match[1].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
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
      return { fullName: rawName, department: dept, deptCode, rollNo: `20${year}${deptCode}${code}` };
    }
    return {
      fullName: prefix.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim(),
      department: 'Computer Science & Engineering',
      deptCode: 'IIIT-NR',
      rollNo: prefix.toUpperCase(),
    };
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
            await loginGoogle({
              access_token: tokenResponse.access_token,
              hd: ALLOWED_DOMAIN,
              remember_me: rememberMe,
            });
            navigate('/submit', { replace: true });
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
      await register({
        name: meta?.fullName || cleanEmail.split('@')[0],
        email: cleanEmail,
        password,
        role: 'STUDENT',
        department_name: meta?.department || 'Computer Science & Engineering',
        hostel_name: selectedHostel,
        room_number: selectedRoomNumber,
        remember_me: rememberMe,
      });
      navigate('/submit', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Registration failed.');
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
              Create IIIT-NR Account
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Step {step === 'password' ? '2' : '1'} of 2 · Student &amp; Staff Onboarding
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
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300/90 hover:border-slate-400 text-slate-800 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
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
                <div className="grow border-t border-slate-200" />
                <span className="shrink mx-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  or email
                </span>
                <div className="grow border-t border-slate-200" />
              </div>

              <form onSubmit={handleContinueWithEmail} className="space-y-3.5">
                <div>
                  <label htmlFor="register-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Institutional Email Address
                  </label>
                  <input
                    id="register-email"
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

                {livePreview && (
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-emerald-950 truncate">
                        {livePreview.fullName} ({livePreview.rollNo})
                      </div>
                      <div className="text-[11px] text-emerald-700 truncate">
                        {livePreview.department}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-emerald-700 border border-emerald-200 shrink-0">
                      {livePreview.deptCode}
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
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
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
                  onClick={() => setStep('email')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded-lg hover:bg-indigo-50 cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* IIIT-NR Hostel & Room Assignment Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  🏠 Select Your Hostel &amp; Room
                </span>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Hostel House
                  </label>
                  <select
                    value={selectedHostel}
                    onChange={(e) => setSelectedHostel(e.target.value)}
                    className="enterprise-input text-xs"
                  >
                    {hostels.map((h) => (
                      <option key={h.id} value={h.name}>
                        {h.name}
                      </option>
                    ))}
                    <option value="Day Scholar (Off-Campus)">Day Scholar</option>
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
                          Room Number
                        </label>
                        <input
                          type="text"
                          list="reg-room-options"
                          value={selectedRoomNumber}
                          onChange={(e) => setSelectedRoomNumber(e.target.value)}
                          className="enterprise-input text-xs"
                        />
                        <datalist id="reg-room-options">
                          {availableRooms
                            .filter((r) => r.includes('Room') || r.includes('Suite'))
                            .map((r) => (
                              <option key={r} value={r} />
                            ))}
                        </datalist>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
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
                    className="enterprise-input"
                  />
                  <div className="mt-2 grid grid-cols-4 gap-1.5 h-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`rounded-full transition-all ${
                          pwStrength.score >= bar ? pwStrength.color : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="enterprise-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Already registered?</span>
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-800">
              Sign in →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
