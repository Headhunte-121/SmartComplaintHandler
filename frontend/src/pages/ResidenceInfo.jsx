/**
 * SmartComplaintHandler - Dedicated First-Time Residence Onboarding Page
 * Domain: One-time mandatory hostel & room collection exclusively for undergraduate
 *         B.Tech scholars (active batches from current year down to last 4 years).
 *         Non-undergraduate scholars (PhD, faculty, staff, technicians) bypass this page.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isUndergradHostelStudent, resolveIiitnrProfileFromEmail } from '../api/auth';
import {
  HOSTEL_FLOORS,
  getHostelBuildings,
  getRoomsForBuilding,
} from '../data/iiitnrCampusData';

export default function ResidenceInfo() {
  const navigate = useNavigate();
  const { currentUser, updateProfile, authInitializing } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const hostels = useMemo(() => getHostelBuildings(), []);

  const [selectedHostel, setSelectedHostel] = useState(
    currentUser?.hostel_name || hostels[0]?.name || 'Ramanujan House (Boys Hostel 1)'
  );
  const [selectedFloor, setSelectedFloor] = useState('2');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState(
    currentUser?.room_number || 'Room 204'
  );
  const [phone, setPhone] = useState(currentUser?.phone || '');

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);

  const cleanEmail = (currentUser?.email || '').trim().toLowerCase();

  // Determine if already completed
  const alreadyCompleted = useMemo(() => {
    if (!cleanEmail) return false;
    const flag = localStorage.getItem(`iiitnr_residence_completed_${cleanEmail}`);
    return flag === 'true' && Boolean(currentUser?.hostel_name && currentUser?.room_number);
  }, [cleanEmail, currentUser]);

  // Derived metadata from institutional email
  const studentMeta = useMemo(() => {
    if (!cleanEmail) return null;
    return resolveIiitnrProfileFromEmail(cleanEmail, currentUser?.name);
  }, [cleanEmail, currentUser?.name]);

  // Available room suggestions based on selected hostel & floor
  const availableRooms = useMemo(
    () => getRoomsForBuilding(selectedHostel, selectedFloor),
    [selectedHostel, selectedFloor]
  );

  // Auto-sync room if current selection doesn't match available rooms
  useEffect(() => {
    if (
      selectedHostel !== 'Day Scholar (Off-Campus)' &&
      availableRooms.length > 0 &&
      !availableRooms.includes(selectedRoomNumber)
    ) {
      setSelectedRoomNumber(availableRooms[0]);
    }
  }, [availableRooms, selectedHostel]);

  // Redirect guard: only undergraduate students matching 26(100-102) belong here
  useEffect(() => {
    if (authInitializing) return;

    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    if (!isUndergradHostelStudent(currentUser.email)) {
      // PhD, faculty, staff, technicians do not have this requirement
      navigate(currentUser.targetRoute || '/submit', { replace: true });
    }
  }, [currentUser, authInitializing, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const isDayScholar = selectedHostel === 'Day Scholar (Off-Campus)';
      const finalHostel = selectedHostel;
      const finalRoom = isDayScholar ? 'Day Scholar' : selectedRoomNumber.trim();

      if (!isDayScholar && !finalRoom) {
        throw new Error('Please enter or select your hostel room number.');
      }

      await updateProfile({
        hostel_name: finalHostel,
        room_number: finalRoom,
        phone: phone.trim() || undefined,
      });

      // Mark as completed once in localStorage so student is never prompted again
      localStorage.setItem(`iiitnr_residence_completed_${cleanEmail}`, 'true');

      setSavedSuccess(true);
      setTimeout(() => {
        navigate('/submit', { replace: true });
      }, 900);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to update residence details.');
      setLoading(false);
    }
  };

  const handleSkipOrProceed = () => {
    localStorage.setItem(`iiitnr_residence_completed_${cleanEmail}`, 'true');
    navigate('/submit', { replace: true });
  };

  if (authInitializing || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080C14] text-slate-400 text-sm">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying student profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#0e1117] text-zinc-100' : 'bg-white text-slate-800'
      }`}
    >
      {/* Ambient background glows */}
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

      {/* Top Header: Campus Portal Link & Theme Switcher */}
      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 flex items-center justify-between z-20 pointer-events-auto">
        <Link
          to="/"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            isDark
              ? 'bg-[#161b22] hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
              : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-700 hover:text-slate-900 shadow-2xs'
          }`}
          title="Return to Facilities Campus Map"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">Campus Map</span>
        </Link>

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

      <div className="relative z-10 w-full max-w-lg space-y-6">
        {/* Header Branding */}
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
              One-Time Residence Setup
            </div>
            <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Hostel &amp; Residence Details
            </h1>
            <p className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Mandatory one-time verification for IIIT-NR undergraduate B.Tech scholars (Current &amp; Active Batches)
            </p>
          </div>
        </div>

        {/* Bento Main Card */}
        <div
          className={`rounded-3xl border p-6 sm:p-8 space-y-5 relative overflow-hidden transition-colors ${
            isDark
              ? 'bg-[#161b22] border-zinc-800 shadow-2xl shadow-black/60 text-zinc-100'
              : 'bg-[#f1f5f9] border-slate-300 shadow-sm text-slate-900'
          }`}
        >
          {/* Top Emerald Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

          {/* Already Completed Banner */}
          {alreadyCompleted && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                isDark
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-base ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>✓</span>
                <span>Your residence info is already verified. You may update it below or proceed.</span>
              </div>
              <button
                type="button"
                onClick={handleSkipOrProceed}
                className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Proceed →
              </button>
            </div>
          )}

          {error && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                isDark
                  ? 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}
            >
              <svg className={`w-4 h-4 shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {savedSuccess && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 animate-fade-in ${
                isDark
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                  : 'bg-emerald-100 border-emerald-400 text-emerald-900'
              }`}
            >
              <span className={`text-base ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>✓</span>
              <span>Residence verified successfully! Redirecting to Campus Portal...</span>
            </div>
          )}

          {/* Student Verified Roll Card */}
          <div
            className={`p-4 rounded-2xl border space-y-2 ${
              isDark
                ? 'bg-[#0e1117] border-zinc-800'
                : 'bg-[#e2e8f0] border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                Student Account
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  isDark
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                <span>🎓 Undergrad Scholar</span>
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {currentUser.name || studentMeta?.name || 'IIIT-NR Student'}
                </div>
                <div className={`text-xs font-mono ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  {currentUser.email}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  {currentUser.department || studentMeta?.department_name || 'B.Tech Program'}
                </div>
                <div className={`text-[11px] truncate max-w-[180px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                  Undergraduate Scholar
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hostel Selector */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                Hostel Residence House <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedHostel}
                onChange={(e) => setSelectedHostel(e.target.value)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm transition-all ${
                  isDark
                    ? 'border-zinc-800 bg-[#0e1117] text-zinc-100 focus:bg-[#161b22] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
                    : 'border-slate-300 bg-[#e2e8f0] text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
                }`}
              >
                {hostels.map((h) => (
                  <option key={h.id} value={h.name} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
                    {h.name}
                  </option>
                ))}
                <option value="Day Scholar (Off-Campus)" className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
                  Day Scholar (Off-Campus Commuter)
                </option>
              </select>
            </div>

            {/* Floor & Room (if residing on campus) */}
            {selectedHostel !== 'Day Scholar (Off-Campus)' && (
              <div
                className={`p-3.5 rounded-2xl border space-y-3 ${
                  isDark
                    ? 'bg-[#0e1117] border-zinc-800'
                    : 'bg-[#e2e8f0] border-slate-300'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Floor <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedFloor}
                      onChange={(e) => setSelectedFloor(e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 text-xs transition-all ${
                        isDark
                          ? 'border-zinc-700 bg-zinc-900 text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
                          : 'border-slate-300 bg-white text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
                      }`}
                    >
                      {HOSTEL_FLOORS.map((f) => (
                        <option key={f.id} value={f.id} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Room Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      list="res-room-options"
                      required
                      placeholder="e.g. Room 204"
                      value={selectedRoomNumber}
                      onChange={(e) => setSelectedRoomNumber(e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-mono transition-all ${
                        isDark
                          ? 'border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
                          : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
                      }`}
                    />
                    <datalist id="res-room-options">
                      {availableRooms
                        .filter((r) => r.includes('Room') || r.includes('Suite'))
                        .map((r) => (
                          <option key={r} value={r} />
                        ))}
                    </datalist>
                  </div>
                </div>

                {/* Quick Selection Pills */}
                {availableRooms.length > 0 && (
                  <div className="pt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                      Quick Select ({HOSTEL_FLOORS.find((f) => String(f.id) === String(selectedFloor))?.label || `Floor ${selectedFloor}`}):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {availableRooms.slice(0, 10).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setSelectedRoomNumber(r)}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
                            selectedRoomNumber === r
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                              : isDark
                              ? 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                              : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Contact Phone (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Contact Phone Number
                </label>
                <span className={`text-[10px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Optional for SMS/Delivery</span>
              </div>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full rounded-xl border px-4 py-2.5 text-xs font-mono transition-all ${
                  isDark
                    ? 'border-zinc-800 bg-[#0e1117] text-zinc-100 placeholder-zinc-500 focus:bg-[#161b22] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
                    : 'border-slate-300 bg-[#e2e8f0] text-slate-900 placeholder-slate-500 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
                }`}
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={loading || savedSuccess}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Saving Residence...' : 'Save Residence & Enter Portal →'}</span>
              </button>

              <div className="text-center pt-2">
                <p className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                  This confirmation is requested only once. You can update your room later in Profile Settings.
                </p>
              </div>
            </div>
          </form>

          {/* Footer Navigation */}
          <div className={`pt-4 border-t flex items-center justify-between text-xs ${isDark ? 'border-zinc-800' : 'border-slate-300'}`}>
            <span className={isDark ? 'text-zinc-500' : 'text-slate-500'}>Logged in as {currentUser.email}</span>
            <Link
              to="/submit"
              className={`transition-colors text-[11px] ${isDark ? 'text-zinc-400 hover:text-emerald-400' : 'text-slate-600 hover:text-emerald-700'}`}
            >
              Skip to Lodge Grievance →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
