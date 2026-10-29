/**
 * SmartComplaintHandler - Clean & Direct Residence Onboarding Page
 * Streamlined: Select Hostel + Enter Room Number with zero auto-suggest clutter.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isUndergradHostelStudent, resolveIiitnrProfileFromEmail } from '../api/auth';
import { Home, MapPin, GraduationCap, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import {
  getHostelBuildings,
  fetchAndCacheCampusBuildings,
  IIITNR_MAP_UPDATED_EVENT,
} from '../data/iiitnrCampusData';

export default function ResidenceInfo() {
  const navigate = useNavigate();
  const { currentUser, updateProfile, authInitializing } = useAuth();

  const [hostelList, setHostelList] = useState(() => getHostelBuildings());

  useEffect(() => {
    fetchAndCacheCampusBuildings().then((buildings) => {
      setHostelList(getHostelBuildings(buildings));
    });
    const onMapUpdated = () => setHostelList(getHostelBuildings());
    window.addEventListener(IIITNR_MAP_UPDATED_EVENT, onMapUpdated);
    return () => window.removeEventListener(IIITNR_MAP_UPDATED_EVENT, onMapUpdated);
  }, []);

  const [selectedHostel, setSelectedHostel] = useState(currentUser?.hostel_name || '');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState(currentUser?.room_number || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  useEffect(() => {
    if (currentUser?.hostel_name && !selectedHostel) {
      setSelectedHostel(currentUser.hostel_name);
    }
    if (currentUser?.room_number && !selectedRoomNumber) {
      setSelectedRoomNumber(currentUser.room_number);
    }
    if (currentUser?.phone && !phone) {
      setPhone(currentUser.phone);
    }
  }, [currentUser]);

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);

  const cleanEmail = (currentUser?.email || '').trim().toLowerCase();

  const alreadyCompleted = useMemo(() => {
    if (!cleanEmail) return false;
    return Boolean(currentUser?.hostel_name && currentUser?.room_number);
  }, [cleanEmail, currentUser]);

  const studentMeta = useMemo(() => {
    if (!cleanEmail) return null;
    return resolveIiitnrProfileFromEmail(cleanEmail, currentUser?.name);
  }, [cleanEmail, currentUser?.name]);

  const handleHostelChange = (newHostel) => {
    setSelectedHostel(newHostel);
    if (newHostel === 'Day Scholar (Off-Campus)') {
      setSelectedRoomNumber('Day Scholar');
      return;
    }
    if (selectedRoomNumber === 'Day Scholar') {
      setSelectedRoomNumber('');
    }
  };

  useEffect(() => {
    if (authInitializing) return;

    const token =
      localStorage.getItem('smart_complaint_auth_token') ||
      sessionStorage.getItem('smart_complaint_auth_token');

    const activeUser =
      currentUser ||
      (() => {
        try {
          const raw =
            localStorage.getItem('smart_complaint_auth_user') ||
            sessionStorage.getItem('smart_complaint_auth_user');
          return raw ? JSON.parse(raw) : null;
        } catch (_) {
          return null;
        }
      })();

    if (!activeUser && !token) {
      navigate('/login', { replace: true });
      return;
    }

    if (activeUser && !isUndergradHostelStudent(activeUser.email)) {
      navigate(activeUser.targetRoute || '/submit', { replace: true });
    }
  }, [currentUser, authInitializing, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!selectedHostel) {
        throw new Error('Please select your hostel residence house or choose Day Scholar.');
      }

      const isDayScholar = selectedHostel === 'Day Scholar (Off-Campus)';
      const finalHostel = selectedHostel;
      const finalRoom = isDayScholar ? 'Day Scholar' : selectedRoomNumber.trim();

      if (!isDayScholar && !finalRoom) {
        throw new Error('Please enter your hostel room number.');
      }

      await updateProfile({
        hostel_name: finalHostel,
        room_number: finalRoom,
        phone: phone.trim() || undefined,
      });

      setSavedSuccess(true);
      setTimeout(() => {
        navigate('/submit', { replace: true });
      }, 800);
    } catch (err) {
      setError(err.message || 'Failed to save residence info.');
    } finally {
      setLoading(false);
    }
  };

  const resolvedUser =
    currentUser ||
    (() => {
      try {
        const raw =
          localStorage.getItem('smart_complaint_auth_user') ||
          sessionStorage.getItem('smart_complaint_auth_user');
        return raw ? JSON.parse(raw) : null;
      } catch (_) {
        return null;
      }
    })();

  const tokenExists = Boolean(
    localStorage.getItem('smart_complaint_auth_token') ||
    sessionStorage.getItem('smart_complaint_auth_token')
  );

  if (!resolvedUser && !tokenExists) return null;

  const isDayScholar = selectedHostel === 'Day Scholar (Off-Campus)';

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden bg-[#050608] text-zinc-100 font-sans antialiased selection:bg-white/20 selection:text-white">
      {/* Subtle Specular Ambient */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-md space-y-5">
        {/* Emblem & Header */}
        <div className="text-center space-y-2.5">
          <div className="relative inline-flex p-3 rounded-2xl bg-white/[0.04] border border-white/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_6px_20px_rgba(0,0,0,0.5)]">
            <img
              src="/iiitnr_logo.png"
              alt="IIIT Naya Raipur"
              className="h-10 w-auto object-contain drop-shadow"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5 border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Residence Setup
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Hostel &amp; Room Details
            </h1>
            <p className="text-xs text-zinc-400">
              Set your campus room for fast 1-tap grievance filing
            </p>
          </div>
        </div>

        {/* Smoked Black Glass Main Card */}
        <div className="rounded-2xl border border-white/[0.12] bg-[#0c0d12]/90 backdrop-blur-xl p-5 sm:p-6 space-y-4 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
          <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Already Completed Notice */}
          {alreadyCompleted && (
            <div className="p-3 rounded-xl border border-white/20 bg-white/[0.05] text-xs flex items-center justify-between text-zinc-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span>Verified room: <b>{currentUser.hostel_name} · {currentUser.room_number}</b></span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/submit', { replace: true })}
                className="px-2.5 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                Proceed →
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/50 text-xs font-semibold text-rose-300 flex items-center gap-2">
              <AlertTriangle size={15} className="text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/60 text-xs font-bold text-emerald-200 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span>Residence saved! Entering portal...</span>
            </div>
          )}

          {/* Student Account Info */}
          <div className="p-3 rounded-xl border border-white/[0.08] bg-[#07080c] flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-white">
                {currentUser?.name || studentMeta?.name || 'IIIT-NR Student'}
              </div>
              <div className="font-mono text-zinc-400 text-[11px]">
                {currentUser?.email}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-indigo-500/30 bg-indigo-500/15 text-indigo-300 uppercase">
                <GraduationCap size={11} />
                <span>{currentUser?.department || studentMeta?.department_name || 'B.Tech'}</span>
              </span>
            </div>
          </div>

          {/* Clean Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Hostel Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Hostel Residence House <span className="text-white">*</span>
              </label>
              <select
                value={selectedHostel}
                onChange={(e) => handleHostelChange(e.target.value)}
                required
                className="w-full rounded-xl border border-white/[0.1] bg-[#050608] text-white px-3.5 py-2.5 text-xs sm:text-sm focus:border-white/30 focus:outline-none transition-all cursor-pointer"
              >
                <option value="" disabled className="bg-[#050608] text-zinc-500">
                  Select your Hostel...
                </option>
                {hostelList.map((h) => (
                  <option key={h.id} value={h.name} className="bg-[#050608] text-white">
                    {h.name}
                  </option>
                ))}
                <option value="Day Scholar (Off-Campus)" className="bg-[#050608] text-white">
                  Day Scholar (Off-Campus Commuter)
                </option>
              </select>
            </div>

            {/* Simple Room Number Input (hidden only for Day Scholar) */}
            {!isDayScholar && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Room Number <span className="text-white">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 331, 204, B-312"
                  value={selectedRoomNumber}
                  onChange={(e) => setSelectedRoomNumber(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#050608] text-white placeholder-zinc-500 px-3.5 py-2.5 text-xs sm:text-sm font-mono focus:border-white/30 focus:outline-none"
                />
              </div>
            )}

            {/* Optional Phone Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Contact Phone Number
                </label>
                <span className="text-[10px] font-mono text-zinc-500">Optional</span>
              </div>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-[#050608] text-white placeholder-zinc-500 px-3.5 py-2.5 text-xs sm:text-sm font-mono focus:border-white/30 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || savedSuccess}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-[0_2px_14px_rgba(59,130,246,0.25)] border border-blue-400/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Saving...' : 'Save Residence & Enter Portal →'}</span>
              </button>
            </div>
          </form>

          {/* Skip link */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end">
            <Link
              to="/submit"
              className="text-[11px] font-mono text-zinc-400 hover:text-white transition-colors"
            >
              Skip to Grievance Filing →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
