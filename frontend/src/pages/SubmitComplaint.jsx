/**
 * SmartComplaintHandler - Submit Maintenance Request Workstation
 * Flush Edge-to-Edge Dark Command Twin Layout with Consistent Institutional Palette
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { submitComplaint } from '../api/complaints';
import LiveTriageCard from '../components/LiveTriageCard';
import SubmissionSuccessModal from '../components/SubmissionSuccessModal';
import CampusMapSelector from '../components/CampusMapSelector';
import {
  IIITNR_MAP_UPDATED_EVENT,
  getCampusBuildings,
  getHostelBuildings,
  getNonHostelBuildings,
  getFloorsForBuilding,
  getRoomsForBuilding,
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
  const clean = (roomStr || '').trim();
  let floor = '2';
  const roomNumMatch = clean.match(/\b([G123])[-]?(\d{2})\b/i);
  if (roomNumMatch) {
    floor = roomNumMatch[1].toUpperCase();
  } else if (/ground|\bg-/i.test(clean)) {
    floor = 'G';
  } else if (/floor\s*1|\b1\d{2}\b/i.test(clean)) {
    floor = '1';
  } else if (/floor\s*3|\b3\d{2}\b/i.test(clean)) {
    floor = '3';
  }
  return floor;
}

export default function SubmitComplaint() {
  const { currentPersona, currentUser, updateProfile } = useAuth();
  const { isDark } = useTheme();
  const activeUser = currentUser || currentPersona;
  const [searchParams] = useSearchParams();

  const [allBuildings, setAllBuildings] = useState(() => getCampusBuildings());

  useEffect(() => {
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
    const nextFloor = targetFloors[0]?.id || 'G';
    setSelectedFloor(nextFloor);
    const targetRooms = getRoomsForBuilding(newBuildingName, nextFloor, null, allBuildings);
    if (targetRooms.length > 0) {
      setSpecificLocation(targetRooms[0]);
    }
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

    const resolvedRoom = customRoomOverride.trim() || specificLocation.trim() || 'General Area';
    const fullLocation = `${activeBuildingObj?.name || building}, ${resolvedRoom}`;

    try {
      const ticket = await submitComplaint({
        title: title.trim(),
        description: description.trim(),
        location: fullLocation,
        student_name: activeUser?.name || 'Nikhil (Student)',
        student_email: activeUser?.email || 'nikhil26100@iiitnr.edu.in',
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
    <div className={`w-full min-h-screen flex flex-col space-y-0 transition-colors animate-fade-in ${
      isDark ? 'bg-[#0e1117] text-zinc-100' : 'bg-white text-slate-900'
    }`}>
      {/* Flush Command Deck Hero Header */}
      <div className={`w-full border-b px-4 sm:px-8 lg:px-12 py-8 relative transition-colors ${
        isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
              isDark
                ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-400'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Campus Maintenance Portal</span>
              <span className={isDark ? 'text-emerald-500' : 'text-emerald-400'}>·</span>
              <span className={`font-mono text-[11px] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Auto-Triage Active</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${
              isDark ? 'text-zinc-100' : 'text-slate-900'
            }`}>
              Submit Maintenance Request
            </h1>
            <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${
              isDark ? 'text-zinc-400' : 'text-slate-600'
            }`}>
              Confirm the location and describe the issue—category, squad, and SLA priority are detected automatically.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsMapModalOpen(true)}
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs shadow-2xs transition-all inline-flex items-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-[#0e1117] hover:bg-[#1c2128] border-zinc-700 text-emerald-400 hover:text-emerald-300'
                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-emerald-800 hover:text-emerald-900'
              }`}
            >
              <svg className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>Open Digital Twin Map</span>
            </button>
            <Link
              to="/student"
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs shadow-2xs transition-all inline-flex items-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-[#0e1117] hover:bg-[#1c2128] border-zinc-700 text-zinc-200 hover:text-white'
                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-800 hover:text-slate-950'
              }`}
            >
              My Requests →
            </Link>
          </div>
        </div>
      </div>

      {/* Flush Workstation Layout */}
      <div className={`w-full px-4 sm:px-8 lg:px-12 py-8 lg:py-10 transition-colors ${
        isDark ? 'bg-[#0e1117]' : 'bg-white'
      }`}>
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Request Form */}
          <form
            onSubmit={handleSubmit}
            className={`lg:col-span-7 xl:col-span-8 p-6 sm:p-8 space-y-6 rounded-2xl relative border shadow-sm transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-sm'
            }`}
          >
            {/* Top card accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />

            {error && (
              <div className={`rounded-xl p-3.5 text-xs font-semibold shadow-xs border ${
                isDark ? 'bg-rose-950/60 border-rose-900 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                {error}
              </div>
            )}

            {residenceSavedNotice && (
              <div className={`rounded-xl p-3 text-xs font-bold shadow-xs border ${
                isDark ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                ✓ {residenceSavedNotice}
              </div>
            )}

            {/* STEP 1: Streamlined 3-Mode Location Selector */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`w-7 h-7 rounded-xl bg-emerald-600 text-white font-mono text-xs font-black flex items-center justify-center shadow-xs ring-4 ${
                    isDark ? 'ring-emerald-950/80' : 'ring-emerald-100'
                  }`}>
                    1
                  </span>
                  <span className={`text-sm font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                    Location
                  </span>
                </div>

                {/* 3-Mode Segmented Pill Bar */}
                <div className={`inline-flex items-center p-1.5 rounded-2xl border gap-1.5 shadow-inner transition-colors ${
                  isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#cbd5e1]/80 border-slate-300'
                }`}>
                  <button
                    type="button"
                    onClick={handleUseMySavedRoom}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                      locationMode === 'MY_ROOM'
                        ? 'bg-emerald-600 text-white shadow-xs border border-emerald-600'
                        : isDark
                          ? 'bg-[#161b22] hover:bg-[#1c2128] text-zinc-400 hover:text-zinc-100 border border-zinc-800'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/80 border border-transparent'
                    }`}
                  >
                    <span>🏠 My Room</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationMode('SEARCH')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                      locationMode === 'SEARCH'
                        ? 'bg-emerald-600 text-white shadow-xs border border-emerald-600'
                        : isDark
                          ? 'bg-[#161b22] hover:bg-[#1c2128] text-zinc-400 hover:text-zinc-100 border border-zinc-800'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/80 border border-transparent'
                    }`}
                  >
                    <span>🔍 Quick Search</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationMode('BROWSE')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                      locationMode === 'BROWSE'
                        ? 'bg-emerald-600 text-white shadow-xs border border-emerald-600'
                        : isDark
                          ? 'bg-[#161b22] hover:bg-[#1c2128] text-zinc-400 hover:text-zinc-100 border border-zinc-800'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/80 border border-transparent'
                    }`}
                  >
                    <span>🗺️ Browse / Map</span>
                  </button>
                </div>
              </div>

              {/* MODE A: 1-Tap My Saved Room Card */}
              {locationMode === 'MY_ROOM' && (
                <div className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDark
                    ? 'bg-[#0e1117] border-zinc-800 hover:border-zinc-700'
                    : 'bg-[#e2e8f0] border-slate-300 hover:border-slate-400 shadow-2xs'
                }`}>
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isDark
                        ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400'
                        : 'bg-emerald-100/80 border-emerald-200 text-emerald-700'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-lg font-bold border ${
                          isDark
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          Saved Residence
                        </span>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                          isDark
                            ? 'bg-[#161b22] text-zinc-300 border-zinc-700'
                            : 'bg-white text-slate-700 border-slate-300 shadow-2xs'
                        }`}>
                          {activeBuildingObj?.mapPin?.badge || 'HOSTEL'}
                        </span>
                      </div>
                      <div className={`text-base font-black mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                        {activeBuildingObj?.name || savedHostel}
                      </div>
                      <div className={`text-xs font-mono font-bold mt-0.5 flex items-center gap-1 ${
                        isDark ? 'text-emerald-400' : 'text-emerald-600'
                      }`}>
                        <span>📍</span>
                        <span>{resolvedRoomLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setLocationMode('SEARCH')}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-[#161b22] hover:bg-[#1c2128] border-zinc-700 text-zinc-300'
                          : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-2xs'
                      }`}
                    >
                      Search Other Spot
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMapModalOpen(true)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isDark
                          ? 'bg-[#161b22] hover:bg-[#1c2128] border-emerald-800 text-emerald-400'
                          : 'bg-white hover:bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs'
                      }`}
                    >
                      <span>🗺️</span>
                      <span>Pick on Map</span>
                    </button>
                  </div>
                </div>
              )}

              {/* MODE B: Inline Omni-Search */}
              {locationMode === 'SEARCH' && (
                <div className={`space-y-3 p-4 rounded-xl border transition-colors ${
                  isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
                }`}>
                  <div className="relative">
                    <input
                      type="text"
                      value={spotQuery}
                      onChange={(e) => setSpotQuery(e.target.value)}
                      placeholder="Search room number, lab, or block (e.g. '303', '131C', 'VLSI', 'Canteen', 'Room 204')..."
                      className={`w-full px-4 py-2.5 pl-9 rounded-xl border text-xs sm:text-sm font-sans focus:outline-none transition-all ${
                        isDark
                          ? 'bg-[#161b22] border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs'
                      }`}
                    />
                    <svg className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {spotQuery && (
                      <button
                        type="button"
                        onClick={() => setSpotQuery('')}
                        className={`absolute right-3 top-2.5 text-xs font-bold cursor-pointer ${
                          isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <span className={`text-[10px] font-mono uppercase tracking-wider shrink-0 font-bold ${
                      isDark ? 'text-zinc-500' : 'text-slate-500'
                    }`}>
                      Popular:
                    </span>
                    {QUICK_SPOT_CHIPS.map((chip) => (
                      <button
                        key={chip.query}
                        type="button"
                        onClick={() => {
                          const matches = queryCampusSearchIndex(chip.query, searchIndex, 1);
                          if (matches.length > 0) handlePickSpotResult(matches[0]);
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 cursor-pointer transition-all shadow-2xs ${
                          isDark
                            ? 'bg-[#161b22] hover:bg-[#1c2128] text-zinc-300 hover:text-white border-zinc-700 hover:border-emerald-500/60'
                            : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300 hover:border-emerald-500'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {spotQuery.trim().length > 0 && (
                    <div className={`rounded-xl border divide-y max-h-60 overflow-y-auto shadow-xl ${
                      isDark
                        ? 'bg-[#161b22] border-zinc-700 divide-zinc-800'
                        : 'bg-white border-slate-300 divide-slate-200'
                    }`}>
                      {spotResults.length === 0 ? (
                        <div className={`p-4 text-center text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          No matching room or building found. Use Browse mode for custom spots.
                        </div>
                      ) : (
                        spotResults.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handlePickSpotResult(item)}
                            className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                              isDark ? 'hover:bg-zinc-800/60' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                  isDark
                                    ? 'bg-[#0e1117] text-emerald-400 border-zinc-700'
                                    : 'bg-[#e2e8f0] text-emerald-800 border-slate-300'
                                }`}>
                                  {item.badge}
                                </span>
                                <span className={`text-xs font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                                  {item.title}
                                </span>
                              </div>
                              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{item.subtitle}</p>
                            </div>
                            <span className={`text-[11px] font-mono font-bold shrink-0 ${
                              isDark ? 'text-emerald-400' : 'text-emerald-600'
                            }`}>
                              Select →
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs shadow-2xs ${
                    isDark
                      ? 'bg-[#161b22] border-emerald-800/80'
                      : 'bg-white border-emerald-400'
                  }`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase border ${
                        isDark
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        Selected
                      </span>
                      <span className={`font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                        {activeBuildingObj?.shortName || building}
                      </span>
                      <span className={isDark ? 'text-zinc-600' : 'text-slate-400'}>·</span>
                      <span className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {resolvedRoomLabel}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMapModalOpen(true)}
                      className={`text-[11px] font-bold hover:underline shrink-0 cursor-pointer ${
                        isDark ? 'text-emerald-400' : 'text-emerald-600'
                      }`}
                    >
                      View on Map →
                    </button>
                  </div>
                </div>
              )}

              {/* MODE C: Browse Building, Floor & Room */}
              {locationMode === 'BROWSE' && (
                <div className={`space-y-3.5 p-4 rounded-xl border transition-colors ${
                  isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="building" className={`block text-xs font-bold ${
                          isDark ? 'text-zinc-300' : 'text-slate-700'
                        }`}>
                          Hostel or Campus Building
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsMapModalOpen(true)}
                          className={`text-[11px] font-bold cursor-pointer ${
                            isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
                          }`}
                        >
                          Pick visually on Digital Twin →
                        </button>
                      </div>
                      <select
                        id="building"
                        value={activeBuildingObj?.name || ''}
                        onChange={(e) => handleSelectBuilding(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none ${
                          isDark
                            ? 'bg-[#161b22] border-zinc-700 text-zinc-100 focus:border-emerald-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600 shadow-2xs'
                        }`}
                      >
                        <optgroup label="Hostels" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>
                          {hostelsList.map((h) => (
                            <option key={h.id} value={h.name} className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>
                              {h.name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Academic, Labs & Campus" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>
                          {nonHostelsList.map((b) => (
                            <option key={b.id} value={b.name} className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>
                              {b.name}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="floorSelect" className={`block text-xs font-bold mb-1.5 ${
                        isDark ? 'text-zinc-300' : 'text-slate-700'
                      }`}>
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
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none ${
                          isDark
                            ? 'bg-[#161b22] border-zinc-700 text-zinc-100 focus:border-emerald-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600 shadow-2xs'
                        }`}
                      >
                        {availableFloors.map((f) => (
                          <option key={f.id} value={f.id} className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${
                        isDark ? 'text-zinc-300' : 'text-slate-700'
                      }`}>
                        Campus Zone / Coordinates
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-xs flex items-center justify-between ${
                        isDark ? 'bg-[#161b22] border-zinc-700 text-zinc-300' : 'bg-white border-slate-300 text-slate-700 shadow-2xs'
                      }`}>
                        <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{activeBuildingObj?.mapPin?.badge || 'CAMPUS'}</span>
                        <span className={`text-[11px] truncate max-w-[180px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{activeBuildingObj?.gps || 'Institutional Twin'}</span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="specificLocation" className={`block text-xs font-bold mb-1.5 ${
                        isDark ? 'text-zinc-300' : 'text-slate-700'
                      }`}>
                        Room / Lab / Utility
                      </label>
                      <select
                        id="specificLocation"
                        value={specificLocation}
                        onChange={(e) => {
                          setSpecificLocation(e.target.value);
                          setCustomRoomOverride('');
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none ${
                          isDark
                            ? 'bg-[#161b22] border-zinc-700 text-zinc-100 focus:border-emerald-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600 shadow-2xs'
                        }`}
                      >
                        {availableRooms.map((rm) => (
                          <option key={rm} value={rm} className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>
                            {rm}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="customRoomOverride" className={`block text-xs font-bold mb-1.5 ${
                        isDark ? 'text-zinc-300' : 'text-slate-700'
                      }`}>
                        Specific Spot (Optional)
                      </label>
                      <input
                        id="customRoomOverride"
                        type="text"
                        placeholder="e.g. Near Balcony, Tap #2"
                        value={customRoomOverride}
                        onChange={(e) => setCustomRoomOverride(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none ${
                          isDark
                            ? 'bg-[#161b22] border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500'
                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 shadow-2xs'
                        }`}
                      />
                    </div>
                  </div>

                  {isHostelBuilding && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleSaveCurrentAsMyRoom}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border shadow-2xs transition-colors cursor-pointer ${
                          isDark
                            ? 'bg-emerald-950/60 hover:bg-emerald-950 border-emerald-800 text-emerald-400 hover:text-emerald-300'
                            : 'bg-white hover:bg-slate-50 border-emerald-300 text-emerald-700'
                        }`}
                      >
                        Set as My Default Room
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={`border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`} />

            {/* STEP 2: Issue Title & Details */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`w-7 h-7 rounded-xl bg-emerald-600 text-white font-mono text-xs font-black flex items-center justify-center shadow-xs ring-4 ${
                    isDark ? 'ring-emerald-950/80' : 'ring-emerald-100'
                  }`}>
                    2
                  </span>
                  <span className={`text-sm font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                    Issue Description
                  </span>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono border px-2.5 py-0.5 rounded-lg font-bold shadow-xs ${
                  isDark
                    ? 'bg-emerald-950/80 border-emerald-800/80 text-emerald-400'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                  <span>✨ Auto-detects category &amp; SLA</span>
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="title" className={`block text-xs font-bold ${
                    isDark ? 'text-zinc-300' : 'text-slate-700'
                  }`}>
                    Issue Summary
                  </label>
                  <span className={`text-[11px] font-mono font-medium ${
                    isDark ? 'text-zinc-500' : 'text-slate-500'
                  }`}>
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
                  className={`w-full px-4 py-3 rounded-xl border text-sm transition-all shadow-2xs ${
                    isDark
                      ? 'bg-[#0e1117] border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'
                      : 'bg-[#e2e8f0] hover:bg-slate-200/90 focus:bg-white border-slate-300 hover:border-slate-400 focus:border-emerald-600 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-600'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="description" className={`block text-xs font-bold ${
                    isDark ? 'text-zinc-300' : 'text-slate-700'
                  }`}>
                    Details &amp; Observations
                  </label>
                  <span className={`text-[11px] font-mono font-bold ${
                    isDark ? 'text-emerald-400' : 'text-emerald-600'
                  }`}>
                    {description.trim().length >= 10 ? '✓ Auto-triage active' : 'Min 10 chars'}
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
                  className={`w-full px-4 py-3 rounded-xl border text-sm resize-none leading-relaxed transition-all shadow-2xs ${
                    isDark
                      ? 'bg-[#0e1117] border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'
                      : 'bg-[#e2e8f0] hover:bg-slate-200/90 focus:bg-white border-slate-300 hover:border-slate-400 focus:border-emerald-600 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-600'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm shadow-xs border border-emerald-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Submitting Request...'
                : `Submit Request · ${activeBuildingObj?.shortName || building} (${resolvedRoomLabel})`}
            </button>
          </form>

          {/* Right Sticky Triage & Target Summary Column */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20 space-y-4">
            <LiveTriageCard title={title} description={description} />

            {/* Dispatch Target Card */}
            <div className={`p-5 sm:p-6 space-y-3.5 border shadow-sm rounded-2xl relative overflow-hidden transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-sm'
            }`}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-mono uppercase tracking-wider font-bold ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}>
                  Dispatch Target
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[10px] px-2.5 py-0.5 rounded-lg border font-bold shadow-2xs ${
                    isDark
                      ? 'bg-[#0e1117] text-emerald-400 border-zinc-700'
                      : 'bg-[#e2e8f0] text-slate-800 border-slate-300'
                  }`}>
                    {activeBuildingObj?.mapPin?.badge || 'BLDG'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    className={`text-[11px] font-bold hover:underline cursor-pointer ${
                      isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
                    }`}
                  >
                    Change on Map →
                  </button>
                </div>
              </div>
              <div className={`font-black text-sm ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                {activeBuildingObj?.name || building}
              </div>
              <div className={`font-mono text-xs px-3.5 py-2.5 rounded-xl font-bold flex items-center justify-between border shadow-2xs ${
                isDark
                  ? 'bg-[#0e1117] border-zinc-800 text-zinc-200'
                  : 'bg-[#e2e8f0] border-slate-300 text-slate-900'
              }`}>
                <span className="flex items-center gap-1.5">
                  <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>📍</span>
                  <span>{resolvedRoomLabel}</span>
                </span>
                <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-md border ${
                  isDark
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  Verified ✓
                </span>
              </div>
            </div>

            {/* SLA Resolution Windows Matrix */}
            <div className={`p-5 sm:p-6 space-y-3.5 border shadow-sm rounded-2xl transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold uppercase tracking-wider font-mono text-[10px] block ${
                  isDark ? 'text-zinc-300' : 'text-slate-700'
                }`}>
                  SLA Resolution Windows
                </span>
                <span className={`text-[10px] font-mono font-bold ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}>
                  Response Matrix
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                <div className={`p-3 rounded-xl border flex items-center justify-between shadow-2xs transition-all ${
                  isDark
                    ? 'bg-[#0e1117] border-rose-900/60 hover:border-rose-700 text-rose-300'
                    : 'bg-[#e2e8f0] border-rose-300 hover:border-rose-400 text-rose-900'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="font-bold">CRITICAL</span>
                  </div>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded-lg border shadow-2xs ${
                    isDark
                      ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                      : 'bg-white border-rose-200 text-rose-800'
                  }`}>2h</span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center justify-between shadow-2xs transition-all ${
                  isDark
                    ? 'bg-[#0e1117] border-amber-900/60 hover:border-amber-700 text-amber-300'
                    : 'bg-[#e2e8f0] border-amber-300 hover:border-amber-400 text-amber-900'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="font-bold">HIGH</span>
                  </div>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded-lg border shadow-2xs ${
                    isDark
                      ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                      : 'bg-white border-amber-200 text-amber-800'
                  }`}>8h</span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center justify-between shadow-2xs transition-all ${
                  isDark
                    ? 'bg-[#0e1117] border-sky-900/60 hover:border-sky-700 text-sky-300'
                    : 'bg-[#e2e8f0] border-sky-300 hover:border-sky-400 text-sky-900'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span className="font-bold">MEDIUM</span>
                  </div>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded-lg border shadow-2xs ${
                    isDark
                      ? 'bg-sky-950/80 border-sky-800 text-sky-300'
                      : 'bg-white border-sky-200 text-sky-800'
                  }`}>24h</span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center justify-between shadow-2xs transition-all ${
                  isDark
                    ? 'bg-[#0e1117] border-emerald-900/60 hover:border-emerald-700 text-emerald-300'
                    : 'bg-[#e2e8f0] border-emerald-300 hover:border-emerald-400 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold">LOW</span>
                  </div>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded-lg border shadow-2xs ${
                    isDark
                      ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                      : 'bg-white border-emerald-200 text-emerald-800'
                  }`}>72h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map Picker Modal */}
      {isMapModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMapModalOpen(false);
          }}
        >
          <div className={`border rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden transition-colors ${
            isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
              isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <div>
                <h2 className={`text-sm sm:text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                  Campus Digital Twin — Location Picker
                </h2>
                <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Click any building, floor, or room to lock in your complaint location
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Confirm Selection
                </button>
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(false)}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-[#161b22] hover:bg-[#1c2128] text-zinc-400 hover:text-white border-zinc-700'
                      : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-300 shadow-2xs'
                  }`}
                  title="Close Map (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className={`p-2 sm:p-3 overflow-y-auto flex-1 ${isDark ? 'bg-[#0e1117]' : 'bg-slate-100'}`}>
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
