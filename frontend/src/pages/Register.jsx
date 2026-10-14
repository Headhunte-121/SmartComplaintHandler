/**
 * SmartComplaintHandler - Minimal Institutional Registration (IIIT Naya Raipur)
 * Aesthetic: Clean, centered single-card onboarding with Hostel & Room selection.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAuthConfig } from '../api/auth';
import {
  HOSTEL_FLOORS,
  getHostelBuildings,
  getRoomsForBuilding,
  IIITNR_MAP_UPDATED_EVENT,
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

export default function Register() {
  const navigate = useNavigate();
  const { register, loginGoogle, currentUser } = useAuth();

  const [hostels, setHostels] = useState(() => getHostelBuildings());
  useEffect(() => {
    const sync = () => setHostels(getHostelBuildings());
    window.addEventListener(IIITNR_MAP_UPDATED_EVENT, sync);
    return () => window.removeEventListener(IIITNR_MAP_UPDATED_EVENT, sync);
  }, []);

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [selectedHostel, setSelectedHostel] = useState(
    () => hostels[0]?.name || 'Ramanujan House (Boys Hostel)'
  );
  const [selectedFloor, setSelectedFloor] = useState('2');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('Wing A, Room 204');

  const [googleClientId, setGoogleClientId] = useState(getInitialGoogleClientId);
  const [showClientIdModal, setShowClientIdModal] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  const availableRooms = useMemo(
    () => getRoomsForBuilding(selectedHostel, selectedFloor, 'Wing A'),
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
        dept = 'Data Science & AI';
        deptCode = 'DSAI';
      } else if (code.startsWith('102') || code.endsWith('02') || code === '302') {
        dept = 'Electronics & Comm.';
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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 bg-[#fafafa] text-slate-900">
      <div className="w-full max-w-[380px] space-y-5">
        <div className="text-center space-y-2">
          <img
            src="/iiitnr_logo.png"
            alt="IIIT Naya Raipur"
            className="h-10 w-auto mx-auto object-contain"
          />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Create your IIIT-NR account
            </h1>
            <p className="text-xs text-slate-500">
              {step === 'password' ? 'Select your hostel room & password' : 'Sign up with your @iiitnr.edu.in email'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleContinueWithGoogle}
                disabled={googleLoading || loading}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>{googleLoading ? 'Connecting...' : 'Sign up with Google'}</span>
              </button>

              <div className="relative flex items-center">
                <div className="grow border-t border-slate-100" />
                <span className="mx-3 text-[11px] text-slate-400">or</span>
                <div className="grow border-t border-slate-100" />
              </div>

              <form onSubmit={handleContinueWithEmail} className="space-y-3">
                <div>
                  <label htmlFor="register-email" className="block text-xs font-medium text-slate-700 mb-1">
                    Institutional Email
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
                  <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate">
                      {livePreview.fullName} ({livePreview.rollNo})
                    </span>
                    <span className="text-[10px] font-mono text-indigo-600">{livePreview.deptCode}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Continue
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="font-mono text-slate-700 truncate">{email}</span>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-indigo-600 hover:text-indigo-800 font-medium ml-2 cursor-pointer"
                >
                  Edit
                </button>
              </div>

              {/* Minimal Hostel & Room Selection */}
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Hostel
                  </label>
                  <select
                    value={selectedHostel}
                    onChange={(e) => setSelectedHostel(e.target.value)}
                    className="enterprise-input"
                  >
                    {hostels.map((h) => (
                      <option key={h.id} value={h.name}>
                        {h.name}
                      </option>
                    ))}
                    <option value="Day Scholar">Day Scholar</option>
                  </select>
                </div>

                {selectedHostel !== 'Day Scholar' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Floor
                      </label>
                      <select
                        value={selectedFloor}
                        onChange={(e) => setSelectedFloor(e.target.value)}
                        className="enterprise-input"
                      >
                        {HOSTEL_FLOORS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Room No.
                      </label>
                      <input
                        type="text"
                        value={selectedRoomNumber}
                        onChange={(e) => setSelectedRoomNumber(e.target.value)}
                        placeholder="e.g. Room 204"
                        className="enterprise-input"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="enterprise-input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="enterprise-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-slate-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
