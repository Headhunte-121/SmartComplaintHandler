/**
 * SmartComplaintHandler - Dedicated First-Time Residence Onboarding Page
 * Glossy Obsidian Command Desk Standard with Smoked Black Glass
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isUndergradHostelStudent, resolveIiitnrProfileFromEmail } from '../api/auth';
import { Home, MapPin, GraduationCap, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import {
  HOSTEL_FLOORS,
  getHostelBuildings,
  getFloorsForBuilding,
  getRoomsForBuilding,
  inferFloorFromItem,
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

  const hostels = hostelList;

  const [selectedHostel, setSelectedHostel] = useState(
    currentUser?.hostel_name || hostels[0]?.name || 'Raman House (Boys Hostel 1)'
  );
  const [selectedFloor, setSelectedFloor] = useState(() => {
    return inferFloorFromItem(currentUser?.room_number) || '2';
  });
  const [selectedRoomNumber, setSelectedRoomNumber] = useState(
    currentUser?.room_number || ''
  );
  const [phone, setPhone] = useState(currentUser?.phone || '');

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

  const availableFloors = useMemo(
    () => getFloorsForBuilding(selectedHostel, hostels),
    [selectedHostel, hostels]
  );

  const availableRooms = useMemo(
    () => getRoomsForBuilding(selectedHostel, selectedFloor, null, hostels),
    [selectedHostel, selectedFloor, hostels]
  );

  const filteredRooms = useMemo(() => {
    const onlyRooms = availableRooms.filter((r) => r.includes('Room') || r.includes('Suite'));
    return onlyRooms.length > 0 ? onlyRooms : availableRooms;
  }, [availableRooms]);

  const handleHostelChange = (newHostel) => {
    setSelectedHostel(newHostel);
    if (newHostel === 'Day Scholar (Off-Campus)') {
      setSelectedRoomNumber('Day Scholar');
      return;
    }
    const targetFloors = getFloorsForBuilding(newHostel, hostels);
    const validFloorIds = targetFloors.map((f) => String(f.id));
    const nextFloor = validFloorIds.includes(String(selectedFloor))
      ? selectedFloor
      : (targetFloors[0]?.id || '1');
    setSelectedFloor(nextFloor);
    const targetRooms = getRoomsForBuilding(newHostel, nextFloor, null, hostels);
    const roomCandidates = targetRooms.filter((r) => r.includes('Room') || r.includes('Suite'));
    const finalRoomList = roomCandidates.length > 0 ? roomCandidates : targetRooms;
    if (finalRoomList.length > 0) {
      setSelectedRoomNumber(finalRoomList[0]);
    } else {
      setSelectedRoomNumber('');
    }
  };

  const handleFloorChange = (newFloor) => {
    setSelectedFloor(newFloor);
    const nextRooms = getRoomsForBuilding(selectedHostel, newFloor, null, hostels);
    const roomCandidates = nextRooms.filter((r) => r.includes('Room') || r.includes('Suite'));
    const finalRoomList = roomCandidates.length > 0 ? roomCandidates : nextRooms;
    if (finalRoomList.length > 0) {
      setSelectedRoomNumber(finalRoomList[0]);
    } else {
      setSelectedRoomNumber('');
    }
  };

  useEffect(() => {
    if (
      selectedHostel !== 'Day Scholar (Off-Campus)' &&
      filteredRooms.length > 0 &&
      !filteredRooms.includes(selectedRoomNumber)
    ) {
      setSelectedRoomNumber(filteredRooms[0]);
    }
  }, [filteredRooms, selectedHostel]);

  useEffect(() => {
    if (authInitializing) return;

    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    if (!isUndergradHostelStudent(currentUser.email)) {
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

      setSavedSuccess(true);
      setTimeout(() => {
        navigate('/submit', { replace: true });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to save residence info.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipOrProceed = () => {
    navigate('/submit', { replace: true });
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden bg-[#050608] text-zinc-100 font-sans antialiased selection:bg-white/20 selection:text-white">
      {/* Subtle Specular Ambient */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-lg space-y-6">
        {/* Emblem & Institutional Header */}
        <div className="text-center space-y-3">
          <div className="relative inline-flex p-3 rounded-2xl bg-white/[0.04] border border-white/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_6px_20px_rgba(0,0,0,0.5)]">
            <img
              src="/iiitnr_logo.png"
              alt="IIIT Naya Raipur"
              className="h-12 w-auto object-contain drop-shadow"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mb-2 border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Mandatory Residence Setup
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Hostel &amp; Residence Details
            </h1>
            <p className="text-xs font-mono text-zinc-400 tracking-wide">
              One-time verification for IIIT-NR undergraduate B.Tech scholars
            </p>
          </div>
        </div>

        {/* Smoked Black Glass Main Card */}
        <div className="rounded-2xl border border-white/[0.12] bg-[#0c0d12]/90 backdrop-blur-xl p-6 sm:p-8 space-y-5 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
          <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Already Completed Banner */}
          {alreadyCompleted && (
            <div className="p-3.5 rounded-xl border border-white/20 bg-white/[0.05] text-xs flex items-center justify-between text-zinc-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Your residence info is already verified. You may update it below or proceed.</span>
              </div>
              <button
                type="button"
                onClick={handleSkipOrProceed}
                className="px-2.5 py-1 text-[11px] font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                Proceed →
              </button>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/50 text-xs font-semibold text-rose-300 flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/60 text-xs font-bold text-emerald-200 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Residence verified successfully! Redirecting to Campus Portal...</span>
            </div>
          )}

          {/* Student Verified Roll Card */}
          <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080c] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                Student Account
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-indigo-500/30 bg-indigo-500/15 text-indigo-300 uppercase tracking-wider">
                <GraduationCap size={12} />
                <span>Undergrad Scholar</span>
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-sm font-bold text-white">
                  {currentUser.name || studentMeta?.name || 'IIIT-NR Student'}
                </div>
                <div className="text-xs font-mono text-zinc-400">
                  {currentUser.email}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white font-mono">
                  {currentUser.department || studentMeta?.department_name || 'B.Tech Program'}
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  Institutional Resident
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Hostel Residence House <span className="text-white">*</span>
              </label>
              <select
                value={selectedHostel}
                onChange={(e) => handleHostelChange(e.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-[#050608] text-white px-3.5 py-2.5 text-xs sm:text-sm focus:border-white/30 focus:outline-none transition-all"
              >
                {hostels.map((h) => (
                  <option key={h.id} value={h.name} className="bg-[#050608] text-white">
                    {h.name}
                  </option>
                ))}
                <option value="Day Scholar (Off-Campus)" className="bg-[#050608] text-white">
                  Day Scholar (Off-Campus Commuter)
                </option>
              </select>
            </div>

            {selectedHostel !== 'Day Scholar (Off-Campus)' && (
              <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#07080c] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Floor <span className="text-white">*</span>
                    </label>
                    <select
                      value={selectedFloor}
                      onChange={(e) => handleFloorChange(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.1] bg-[#050608] text-white px-3 py-2 text-xs focus:border-white/30"
                    >
                      {availableFloors.length > 0 ? (
                        availableFloors.map((f) => (
                          <option key={f.id} value={f.id} className="bg-[#050608] text-white">
                            {f.label}
                          </option>
                        ))
                      ) : (
                        <option value="1" className="bg-[#050608] text-white">
                          Floor 1
                        </option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Room Number <span className="text-white">*</span>
                    </label>
                    <input
                      type="text"
                      list="res-room-options"
                      required
                      placeholder="e.g. Room 204"
                      value={selectedRoomNumber}
                      onChange={(e) => setSelectedRoomNumber(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.1] bg-[#050608] text-white placeholder-zinc-500 px-3 py-2 text-xs font-mono focus:border-white/30 focus:outline-none"
                    />
                    <datalist id="res-room-options">
                      {filteredRooms.map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {filteredRooms.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-1.5 text-zinc-500">
                      Quick Select ({availableFloors.find((f) => String(f.id) === String(selectedFloor))?.label || `Floor ${selectedFloor}`}):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {filteredRooms.slice(0, 15).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setSelectedRoomNumber(r)}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
                            selectedRoomNumber === r
                              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-bold shadow-[inset_0_1px_0_0_rgba(129,140,248,0.2)]'
                              : 'bg-[#050608] text-zinc-300 border-white/[0.08] hover:border-white/20'
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

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Contact Phone Number
                </label>
                <span className="text-[10px] font-mono text-zinc-500">Optional for SMS/Delivery</span>
              </div>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-white/[0.16] bg-[#08090f] text-white placeholder-zinc-500 px-4 py-2.5 text-xs font-mono shadow-inner focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={loading || savedSuccess}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-[0_2px_14px_rgba(59,130,246,0.25)] border border-blue-400/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Saving Residence...' : 'Save Residence & Enter Portal →'}</span>
              </button>

              <div className="text-center pt-2">
                <p className="text-[11px] font-mono text-zinc-500">
                  This confirmation is requested only once. You can update your room later in Profile Settings.
                </p>
              </div>
            </div>
          </form>

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-mono text-[11px]">Logged in as {currentUser.email}</span>
            <Link
              to="/submit"
              className="transition-colors text-[11px] font-mono text-zinc-300 hover:text-white underline"
            >
              Skip to Lodge Grievance →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
