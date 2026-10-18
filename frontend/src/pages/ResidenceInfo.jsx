/**
 * SmartComplaintHandler - Dedicated First-Time Residence Onboarding Page
 * Domain: One-time mandatory hostel & room collection exclusively for undergraduate
 *         B.Tech scholars (active batches from current year down to last 4 years).
 *         Non-undergraduate scholars (PhD, faculty, staff, technicians) bypass this page.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isUndergradHostelStudent, resolveIiitnrProfileFromEmail } from '../api/auth';
import {
  HOSTEL_FLOORS,
  getHostelBuildings,
  getRoomsForBuilding,
} from '../data/iiitnrCampusData';

export default function ResidenceInfo() {
  const navigate = useNavigate();
  const { currentUser, updateProfile, authInitializing } = useAuth();

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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 bg-[#080C14] text-slate-100 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[540px] h-[540px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-[420px] h-[420px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg space-y-6">
        {/* Header Branding */}
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
              One-Time Residence Setup
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Hostel &amp; Residence Details
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Mandatory one-time verification for IIIT-NR undergraduate B.Tech scholars (Current &amp; Active Batches)
            </p>
          </div>
        </div>

        {/* Bento Main Card */}
        <div className="bg-[#0B101D] rounded-3xl border border-slate-800 shadow-2xl shadow-black/60 p-6 sm:p-8 space-y-5 text-white relative overflow-hidden ring-1 ring-slate-800/80">
          {/* Top Emerald Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

          {/* Already Completed Banner */}
          {alreadyCompleted && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-base">✓</span>
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
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <span className="text-emerald-400 text-base">✓</span>
              <span>Residence verified successfully! Redirecting to Campus Portal...</span>
            </div>
          )}

          {/* Student Verified Roll Card */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Student Account
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span>🎓 Undergrad Scholar</span>
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-sm font-bold text-white">
                  {currentUser.name || studentMeta?.name || 'IIIT-NR Student'}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {currentUser.email}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-400">
                  {currentUser.department || studentMeta?.department_name || 'B.Tech Program'}
                </div>
                <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                  Undergraduate Scholar
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hostel Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Hostel Residence House <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedHostel}
                onChange={(e) => setSelectedHostel(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
              >
                {hostels.map((h) => (
                  <option key={h.id} value={h.name} className="bg-slate-900 text-white">
                    {h.name}
                  </option>
                ))}
                <option value="Day Scholar (Off-Campus)" className="bg-slate-900 text-white">
                  Day Scholar (Off-Campus Commuter)
                </option>
              </select>
            </div>

            {/* Floor & Room (if residing on campus) */}
            {selectedHostel !== 'Day Scholar (Off-Campus)' && (
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Floor <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={selectedFloor}
                      onChange={(e) => setSelectedFloor(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      {HOSTEL_FLOORS.map((f) => (
                        <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Room Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      list="res-room-options"
                      required
                      placeholder="e.g. Room 204"
                      value={selectedRoomNumber}
                      onChange={(e) => setSelectedRoomNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono"
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
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
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
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
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
                <label className="text-xs font-bold text-slate-300">
                  Contact Phone Number
                </label>
                <span className="text-[10px] text-slate-500 font-medium">Optional for SMS/Delivery</span>
              </div>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-mono"
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
                <p className="text-[11px] text-slate-500">
                  This confirmation is requested only once. You can update your room later in Profile Settings.
                </p>
              </div>
            </div>
          </form>

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Logged in as {currentUser.email}</span>
            <Link
              to="/submit"
              className="text-slate-400 hover:text-emerald-400 transition-colors text-[11px]"
            >
              Skip to Lodge Grievance →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
