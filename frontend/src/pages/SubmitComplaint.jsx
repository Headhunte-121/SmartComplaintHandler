/**
 * SmartComplaintHandler - Submit Maintenance Request Workstation
 * Glossy Obsidian Command Desk Standard with Smoked Black Glass
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { submitComplaint } from '../api/complaints';
import LiveTriageCard from '../components/LiveTriageCard';
import SubmissionSuccessModal from '../components/SubmissionSuccessModal';
import CampusMapSelector from '../components/CampusMapSelector';
import {
  MapPin, Compass, Search, Home as HomeIcon, CheckCircle2,
  AlertTriangle, Sparkles, ArrowRight, X, Clock, Layers,
} from 'lucide-react';
import {
  IIITNR_MAP_UPDATED_EVENT,
  getCampusBuildings,
  fetchAndCacheCampusBuildings,
  getHostelBuildings,
  getNonHostelBuildings,
  getFloorsForBuilding,
  getRoomsForBuilding,
  inferFloorFromItem,
  buildCampusSearchIndex,
  queryCampusSearchIndex,
} from '../data/iiitnrCampusData';

const QUICK_SPOT_CHIPS = [
  { label: 'VLSI Lab (303)', query: '303' },
  { label: 'Data Centre (131C)', query: '131c' },
  { label: 'AIDL Lab (210)', query: '210' },
  { label: 'Auditorium', query: 'auditorium' },
  { label: 'Canteen Rotunda', query: 'canteen' },
];

function inferFloorFromRoomString(roomStr = '') {
  return inferFloorFromItem(roomStr) || '1';
}

export default function SubmitComplaint() {
  const { currentUser, updateProfile } = useAuth();
  const activeUser = currentUser;
  const [searchParams] = useSearchParams();

  const [allBuildings, setAllBuildings] = useState(() => getCampusBuildings());

  useEffect(() => {
    fetchAndCacheCampusBuildings().then((b) => {
      if (Array.isArray(b) && b.length > 0) setAllBuildings(b);
    });
    const syncBuildings = () => setAllBuildings(getCampusBuildings());
    window.addEventListener(IIITNR_MAP_UPDATED_EVENT, syncBuildings);
    return () => window.removeEventListener(IIITNR_MAP_UPDATED_EVENT, syncBuildings);
  }, []);

  const hostelsList = useMemo(() => getHostelBuildings(allBuildings), [allBuildings]);
  const nonHostelsList = useMemo(() => getNonHostelBuildings(allBuildings), [allBuildings]);

  const savedHostel = activeUser?.hostel_name || hostelsList[0]?.name || allBuildings[0]?.name;
  const savedRoom = activeUser?.room_number || 'Room 204';

  const initialBuildingFromUrl = searchParams.get('building');
  const initialModeFromUrl = searchParams.get('mode');

  const [locationMode, setLocationMode] = useState(
    initialModeFromUrl === 'search'
      ? 'SEARCH'
      : initialBuildingFromUrl
      ? 'BROWSE'
      : 'MY_ROOM'
  );

  const [building, setBuilding] = useState(
    initialBuildingFromUrl || savedHostel || allBuildings[0]?.name
  );
  const [selectedFloor, setSelectedFloor] = useState(() => inferFloorFromRoomString(savedRoom));
  const [specificLocation, setSpecificLocation] = useState(savedRoom);
  const [customRoomOverride, setCustomRoomOverride] = useState('');

  const [spotQuery, setSpotQuery] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [residenceSavedNotice, setResidenceSavedNotice] = useState(null);

  useEffect(() => {
    if (!isMapModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsMapModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMapModalOpen]);

  const searchIndex = useMemo(() => buildCampusSearchIndex(allBuildings), [allBuildings]);
  const spotResults = useMemo(
    () => queryCampusSearchIndex(spotQuery, searchIndex, 7),
    [spotQuery, searchIndex]
  );

  const activeBuildingObj = useMemo(
    () =>
      allBuildings.find(
        (b) => b.name === building || b.id === building || b.shortName === building
      ) || allBuildings[0],
    [allBuildings, building]
  );

  const isHostelBuilding = activeBuildingObj?.category === 'HOSTEL';

  const availableFloors = useMemo(
    () => getFloorsForBuilding(activeBuildingObj?.name, allBuildings),
    [activeBuildingObj, allBuildings]
  );

  const availableRooms = useMemo(
    () => getRoomsForBuilding(activeBuildingObj?.name, selectedFloor, null, allBuildings),
    [activeBuildingObj, selectedFloor, allBuildings]
  );

  useEffect(() => {
    const validFloorIds = availableFloors.map((f) => String(f.id));
    if (!validFloorIds.includes(String(selectedFloor))) {
      setSelectedFloor(availableFloors[0]?.id || 'G');
    }
  }, [activeBuildingObj, availableFloors]);

  const handleSelectBuilding = (newBuildingName) => {
    setBuilding(newBuildingName);
    setCustomRoomOverride('');
    const targetFloors = getFloorsForBuilding(newBuildingName, allBuildings);
    const nextFloor = targetFloors[0]?.id || '1';
    setSelectedFloor(nextFloor);
    const targetRooms = getRoomsForBuilding(newBuildingName, nextFloor, null, allBuildings);
    setSpecificLocation(targetRooms.length > 0 ? targetRooms[0] : 'None');
  };

  const handleUseMySavedRoom = () => {
    setLocationMode('MY_ROOM');
    setBuilding(savedHostel);
    const inferredFloor = inferFloorFromRoomString(savedRoom);
    setSelectedFloor(inferredFloor);
    setSpecificLocation(savedRoom);
    setCustomRoomOverride('');
  };

  const handlePickSpotResult = (item) => {
    setBuilding(item.buildingName);
    if (item.floorId) setSelectedFloor(String(item.floorId));
    const nextRoom = item.roomName || item.title;
    setSpecificLocation(nextRoom);
    setCustomRoomOverride('');
    setSpotQuery('');
  };

  const handleSaveCurrentAsMyRoom = async () => {
    if (!isHostelBuilding || !activeBuildingObj) return;
    const finalRoom = customRoomOverride.trim() || specificLocation;
    await updateProfile({
      hostel_name: activeBuildingObj.name,
      room_number: finalRoom,
    });
    setResidenceSavedNotice(`Saved ${activeBuildingObj.shortName} · ${finalRoom} as your default room.`);
    setTimeout(() => setResidenceSavedNotice(null), 3200);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (title.trim().length < 5 || description.trim().length < 10) {
      setError('Please enter an issue summary (5+ chars) and details (10+ chars).');
      return;
    }

    setSubmitting(true);
    setError(null);

    const cleanRoom = customRoomOverride.trim() || (specificLocation && specificLocation !== 'None' ? specificLocation.trim() : '');
    const bName = activeBuildingObj?.name || building;
    const fullLocation = cleanRoom ? `${bName}, ${cleanRoom}` : bName;

    try {
      const ticket = await submitComplaint({
        title: title.trim(),
        description: description.trim(),
        location: fullLocation,
        student_name: activeUser?.name || null,
        student_email: activeUser?.email || null,
      });

      setCreatedTicket(ticket);
      setIsSuccessModalOpen(true);
      setTitle('');
      setDescription('');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const resolvedRoomLabel = customRoomOverride.trim() || specificLocation;

  return (
    <div className="w-full min-h-screen bg-[#050608] text-zinc-100 font-sans antialiased selection:bg-white/20 selection:text-white p-4 sm:p-6 lg:p-8 space-y-6 relative overflow-hidden">
      {/* Subtle Specular Ambient */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent_60%)]" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border border-white/[0.1] bg-white/[0.04] text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Service Dispatch Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Submit Maintenance Request
          </h1>
          <p className="text-xs text-zinc-400">
            Specify the campus location and problem description. NLP triage auto-routes to the responsible squad.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsMapModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/30 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <Compass size={15} />
            <span>Digital Twin Map</span>
          </button>
          <Link
            to="/student"
            className="px-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-semibold text-xs transition flex items-center gap-2"
          >
            <span>My Requests</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Main Workstation Layout */}
      <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Request Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 xl:col-span-8 p-6 sm:p-8 space-y-6 rounded-2xl border border-white/[0.12] bg-[#0c0d12]/90 backdrop-blur-xl relative shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)] overflow-hidden"
        >
          {/* Specular Top Rim */}
          <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {error && (
            <div className="rounded-xl p-3.5 text-xs font-semibold border bg-rose-950/50 border-rose-500/40 text-rose-300 flex items-start gap-2 shadow-inner">
              <AlertTriangle size={15} className="text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {residenceSavedNotice && (
            <div className="rounded-xl p-3 text-xs font-bold border bg-emerald-950/40 border-emerald-500/40 text-emerald-300 flex items-center gap-2 shadow-inner">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span>{residenceSavedNotice}</span>
            </div>
          )}

          {/* STEP 1: Streamlined 3-Mode Location Selector */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-white/[0.08] border border-white/20 text-white font-mono text-xs font-black flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]">
                  1
                </span>
                <span className="text-sm font-black tracking-tight text-white">
                  Location Selector
                </span>
              </div>

              {/* 3-Mode Segmented Pill Bar */}
              <div className="inline-flex items-center p-1.5 rounded-2xl border border-white/[0.1] bg-[#050608] gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={handleUseMySavedRoom}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    locationMode === 'MY_ROOM'
                      ? 'bg-white/[0.12] text-white border border-white/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <HomeIcon size={13} />
                  <span>My Room</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocationMode('SEARCH')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    locationMode === 'SEARCH'
                      ? 'bg-white/[0.12] text-white border border-white/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Search size={13} />
                  <span>Quick Search</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocationMode('BROWSE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    locationMode === 'BROWSE'
                      ? 'bg-white/[0.12] text-white border border-white/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Layers size={13} />
                  <span>Browse / Map</span>
                </button>
              </div>
            </div>

            {/* MODE A: 1-Tap My Saved Room Card */}
            {locationMode === 'MY_ROOM' && (
              <div className="p-5 rounded-2xl border border-white/[0.1] bg-[#07080c] hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 bg-white/[0.05] text-white shadow-inner">
                    <HomeIcon size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md font-bold border border-white/20 bg-white/[0.06] text-white">
                        Default Residence
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-white/[0.08] bg-white/[0.04] text-zinc-300">
                        {activeBuildingObj?.mapPin?.badge || 'HOSTEL'}
                      </span>
                    </div>
                    <div className="text-base font-black mt-1 text-white">
                      {activeBuildingObj?.name || savedHostel}
                    </div>
                    <div className="text-xs font-mono font-bold mt-0.5 flex items-center gap-1.5 text-zinc-300">
                      <MapPin size={12} className="text-white" />
                      <span>{resolvedRoomLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setLocationMode('SEARCH')}
                    className="px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Change Room
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl border border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Compass size={13} />
                    <span>View Map</span>
                  </button>
                </div>
              </div>
            )}

            {/* MODE B: Live Instant Omni-Search */}
            {locationMode === 'SEARCH' && (
              <div className="space-y-3 p-5 rounded-2xl border border-white/[0.1] bg-[#07080c] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search any classroom, lab, auditorium, court, RO cooler (e.g. 303, AI Lab, Ground)..."
                    value={spotQuery}
                    onChange={(e) => setSpotQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/[0.1] bg-[#050608] text-white placeholder-zinc-500 text-xs sm:text-sm font-mono focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/10"
                  />
                  {spotQuery && (
                    <button
                      type="button"
                      onClick={() => setSpotQuery('')}
                      className="absolute right-3 top-3 text-xs text-zinc-500 hover:text-white cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Quick chip shortcuts */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                    Quick Spots:
                  </span>
                  {QUICK_SPOT_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setSpotQuery(chip.query)}
                      className="px-2.5 py-0.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Search Results Drawer */}
                {spotQuery.trim() && (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pt-1">
                    {spotResults.length === 0 ? (
                      <div className="p-3 text-center text-xs text-zinc-500">
                        No campus spot matches &quot;{spotQuery}&quot;. Try room numbers like 101, 204 or &apos;Lab&apos;.
                      </div>
                    ) : (
                      spotResults.map((item) => (
                        <div
                          key={`${item.buildingId}-${item.title}`}
                          onClick={() => handlePickSpotResult(item)}
                          className="p-2.5 rounded-xl border border-white/[0.06] bg-[#050608] hover:bg-white/[0.05] hover:border-white/20 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-zinc-400 block truncate">
                              {item.buildingName} {item.floorLabel ? `· ${item.floorLabel}` : ''}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono border border-white/20 bg-white/[0.05] text-white shrink-0">
                            Select
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Selected Result Lock */}
                <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Locked In:</span>
                  <span className="font-mono font-bold text-white flex items-center gap-1.5">
                    <MapPin size={12} className="text-emerald-400" />
                    <span>{activeBuildingObj?.shortName || building} · {resolvedRoomLabel}</span>
                  </span>
                </div>
              </div>
            )}

            {/* MODE C: Hierarchical Dropdown Cascade & Map Modal */}
            {locationMode === 'BROWSE' && (
              <div className="space-y-4 p-5 rounded-2xl border border-white/[0.1] bg-[#07080c] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="buildingSelect" className="block text-xs font-semibold text-zinc-300">
                        Campus Facility / Building
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsMapModalOpen(true)}
                        className="text-xs font-semibold text-white hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Compass size={12} />
                        <span>Pick on Map</span>
                      </button>
                    </div>
                    <select
                      id="buildingSelect"
                      value={building}
                      onChange={(e) => handleSelectBuilding(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#050608] text-white text-xs sm:text-sm focus:outline-none focus:border-white/30"
                    >
                      <optgroup label="Hostels" className="bg-[#050608] text-white">
                        {hostelsList.map((h) => (
                          <option key={h.id} value={h.name} className="bg-[#050608] text-white">
                            {h.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Academic, Labs & Campus" className="bg-[#050608] text-white">
                        {nonHostelsList.map((b) => (
                          <option key={b.id} value={b.name} className="bg-[#050608] text-white">
                            {b.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="floorSelect" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Floor
                    </label>
                    <select
                      id="floorSelect"
                      value={selectedFloor}
                      onChange={(e) => {
                        const newFloor = e.target.value;
                        setSelectedFloor(newFloor);
                        const nextRooms = getRoomsForBuilding(activeBuildingObj?.name, newFloor, null, allBuildings);
                        if (nextRooms.length > 0) {
                          setSpecificLocation(nextRooms[0]);
                          setCustomRoomOverride('');
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#050608] text-white text-xs sm:text-sm focus:outline-none focus:border-white/30"
                    >
                      {availableFloors.length > 0 ? (
                        availableFloors.map((f) => (
                          <option key={f.id} value={f.id} className="bg-[#050608] text-white">
                            {f.label}
                          </option>
                        ))
                      ) : (
                        <option value="None" className="bg-[#050608] text-white">
                          None
                        </option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Campus Zone / Coordinates
                    </label>
                    <div className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#050608] font-mono text-xs flex items-center justify-between text-zinc-300">
                      <span className="font-bold text-white">{activeBuildingObj?.mapPin?.badge || 'CAMPUS'}</span>
                      <span className="text-[11px] truncate max-w-[180px] text-zinc-500">{activeBuildingObj?.gps || 'Institutional Twin'}</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="specificLocation" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Room / Lab / Utility
                    </label>
                    <select
                      id="specificLocation"
                      value={specificLocation}
                      onChange={(e) => {
                        setSpecificLocation(e.target.value);
                        setCustomRoomOverride('');
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#050608] text-white text-xs sm:text-sm focus:outline-none focus:border-white/30"
                    >
                      {availableRooms.length > 0 ? (
                        availableRooms.map((rm) => (
                          <option key={rm} value={rm} className="bg-[#050608] text-white">
                            {rm}
                          </option>
                        ))
                      ) : (
                        <option value="None" className="bg-[#050608] text-white">
                          None
                        </option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="customRoomOverride" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Specific Spot (Optional)
                    </label>
                    <input
                      id="customRoomOverride"
                      type="text"
                      placeholder="e.g. Near Balcony, Tap #2"
                      value={customRoomOverride}
                      onChange={(e) => setCustomRoomOverride(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#050608] text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                {isHostelBuilding && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSaveCurrentAsMyRoom}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-white/20 bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors cursor-pointer"
                    >
                      Set as My Default Room
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.08]" />

          {/* STEP 2: Issue Title & Details */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-white/[0.08] border border-white/20 text-white font-mono text-xs font-black flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]">
                  2
                </span>
                <span className="text-sm font-black tracking-tight text-white">
                  Issue Description
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono border border-white/20 bg-white/[0.05] text-zinc-200 px-2.5 py-0.5 rounded-lg font-bold">
                <Sparkles size={11} />
                <span>AI Auto-Triage Active</span>
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="title" className="block text-xs font-semibold text-zinc-300">
                  Issue Summary
                </label>
                <span className="text-[11px] font-mono text-zinc-500">
                  {title.trim().length}/150
                </span>
              </div>
              <input
                id="title"
                type="text"
                required
                minLength={5}
                maxLength={150}
                placeholder="e.g. Ceiling fan regulator broken, or LAN port dead"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-[#050608] text-white placeholder-zinc-500 text-sm focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="description" className="block text-xs font-semibold text-zinc-300">
                  Details &amp; Observations
                </label>
                <span className={`text-[11px] font-mono font-bold ${
                  description.trim().length >= 10 ? 'text-emerald-400' : 'text-zinc-500'
                }`}>
                  {description.trim().length >= 10 ? '✓ Ready for Auto-Triage' : 'Min 10 chars'}
                </span>
              </div>
              <textarea
                id="description"
                required
                minLength={10}
                rows={4}
                placeholder="Describe what needs repair so the assigned maintenance squad can bring the right tools..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-[#050608] text-white placeholder-zinc-500 text-sm resize-none leading-relaxed focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm shadow-[0_2px_16px_rgba(255,255,255,0.12)] border border-white/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? 'Submitting to Dispatch...'
              : `Submit Request · ${activeBuildingObj?.shortName || building} (${resolvedRoomLabel})`}
          </button>
        </form>

        {/* Right Sticky Triage & Target Summary Column */}
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-8 space-y-4">
          <LiveTriageCard title={title} description={description} />

          {/* Dispatch Target Card */}
          <div className="p-5 sm:p-6 space-y-3.5 border border-white/[0.12] bg-[#0c0d12]/90 backdrop-blur-xl rounded-2xl relative overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
            <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-400">
                Dispatch Target
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-lg border border-white/20 bg-white/[0.05] text-zinc-200 font-bold">
                  {activeBuildingObj?.mapPin?.badge || 'BLDG'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(true)}
                  className="text-[11px] font-bold text-white hover:underline cursor-pointer"
                >
                  Change on Map →
                </button>
              </div>
            </div>
            <div className="font-black text-sm text-white">
              {activeBuildingObj?.name || building}
            </div>
            <div className="font-mono text-xs px-3.5 py-2.5 rounded-xl font-bold flex items-center justify-between border border-white/[0.08] bg-[#07080c] text-zinc-200">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-white" />
                <span>{resolvedRoomLabel}</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-white/20 bg-white/[0.05] text-white uppercase">
                Verified ✓
              </span>
            </div>
          </div>

          {/* SLA Resolution Windows Matrix */}
          <div className="p-5 sm:p-6 space-y-3.5 border border-white/[0.12] bg-[#0c0d12]/90 backdrop-blur-xl rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.08)] relative overflow-hidden">
            <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider font-mono text-[10px] block text-zinc-400">
                SLA Resolution Windows
              </span>
              <span className="text-[10px] font-mono font-bold text-zinc-500">
                Response Matrix
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-[11px]">
              <div className="p-3 rounded-xl border border-rose-500/25 bg-rose-500/10 flex items-center justify-between text-rose-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="font-bold">CRITICAL</span>
                </div>
                <span className="font-mono font-bold px-2 py-0.5 rounded-lg border border-rose-500/30 bg-black/40 text-rose-300">
                  2h
                </span>
              </div>
              <div className="p-3 rounded-xl border border-amber-500/25 bg-amber-500/10 flex items-center justify-between text-amber-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="font-bold">HIGH</span>
                </div>
                <span className="font-mono font-bold px-2 py-0.5 rounded-lg border border-amber-500/30 bg-black/40 text-amber-300">
                  8h
                </span>
              </div>
              <div className="p-3 rounded-xl border border-white/20 bg-white/[0.05] flex items-center justify-between text-zinc-200">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-300" />
                  <span className="font-bold">MEDIUM</span>
                </div>
                <span className="font-mono font-bold px-2 py-0.5 rounded-lg border border-white/20 bg-black/40 text-zinc-200">
                  24h
                </span>
              </div>
              <div className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-between text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-500" />
                  <span className="font-bold">LOW</span>
                </div>
                <span className="font-mono font-bold px-2 py-0.5 rounded-lg border border-white/[0.08] bg-black/40 text-zinc-400">
                  72h
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map Picker Modal */}
      {isMapModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMapModalOpen(false);
          }}
        >
          <div className="border border-white/[0.14] rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden bg-[#0c0d12]/95 text-zinc-100">
            <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between gap-3 shrink-0 bg-[#07080c]">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Compass size={16} className="text-white" />
                  <span>Campus Digital Twin — Location Picker</span>
                </h2>
                <p className="text-[11px] font-mono text-zinc-400">
                  Select building, floor, or room to lock in your maintenance dispatch target
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Confirm Selection
                </button>
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(false)}
                  className="w-8 h-8 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-xs text-zinc-400 hover:text-white cursor-pointer transition-colors"
                  title="Close Map (Esc)"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="p-2 sm:p-3 overflow-y-auto flex-1 bg-[#050608]">
              <CampusMapSelector
                flush={true}
                selectedBuilding={activeBuildingObj?.name}
                onSelectBuilding={(bName) => {
                  handleSelectBuilding(bName);
                }}
                selectedRoom={resolvedRoomLabel}
                onSelectRoom={(rm) => {
                  setSpecificLocation(rm);
                  setCustomRoomOverride('');
                  const inferred = inferFloorFromItem(rm);
                  if (inferred) setSelectedFloor(inferred);
                }}
                studentSavedHostel={savedHostel}
                studentSavedRoom={savedRoom}
              />
            </div>
          </div>
        </div>
      )}

      <SubmissionSuccessModal
        isOpen={isSuccessModalOpen}
        ticket={createdTicket}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </div>
  );
}
