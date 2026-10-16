/**
 * SmartComplaintHandler - Submit Maintenance Request Workstation (Modern SaaS UI)
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  getWingsForBuilding,
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

function inferFloorAndWingFromRoomString(roomStr = '') {
  const clean = (roomStr || '').trim();
  let wing = 'Wing A';
  if (/\bwing\s*b\b|\bb-room|\bb-\d/i.test(clean)) {
    wing = 'Wing B';
  } else if (/corridor|washroom|cooler|common|mess|balcony/i.test(clean)) {
    wing = 'Common Area';
  }

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
  return { floor, wing };
}

export default function SubmitComplaint() {
  const { currentPersona, currentUser, updateProfile } = useAuth();
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
  const savedRoom = activeUser?.room_number || 'Wing A, Room 204';

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
  const initialInferred = useMemo(() => inferFloorAndWingFromRoomString(savedRoom), [savedRoom]);
  const [selectedFloor, setSelectedFloor] = useState(initialInferred.floor);
  const [selectedWing, setSelectedWing] = useState(initialInferred.wing);
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

  const availableWings = useMemo(
    () => getWingsForBuilding(activeBuildingObj?.name, allBuildings),
    [activeBuildingObj, allBuildings]
  );

  const availableRooms = useMemo(
    () => getRoomsForBuilding(activeBuildingObj?.name, selectedFloor, selectedWing, allBuildings),
    [activeBuildingObj, selectedFloor, selectedWing, allBuildings]
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
    const targetWings = getWingsForBuilding(newBuildingName, allBuildings);
    const nextWing = targetWings[0]?.id || 'Wing A';
    setSelectedFloor(nextFloor);
    setSelectedWing(nextWing);
    const targetRooms = getRoomsForBuilding(newBuildingName, nextFloor, nextWing, allBuildings);
    if (targetRooms.length > 0) {
      setSpecificLocation(targetRooms[0]);
    }
  };

  const handleUseMySavedRoom = () => {
    setLocationMode('MY_ROOM');
    setBuilding(savedHostel);
    const inferred = inferFloorAndWingFromRoomString(savedRoom);
    setSelectedFloor(inferred.floor);
    setSelectedWing(inferred.wing);
    setSpecificLocation(savedRoom);
    setCustomRoomOverride('');
  };

  const handlePickSpotResult = (item) => {
    setBuilding(item.buildingName);
    if (item.floorId) setSelectedFloor(String(item.floorId));
    if (item.wingId) setSelectedWing(item.wingId);
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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Clean Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Smart Maintenance Dispatch</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 font-mono text-[11px]">Auto-Triage Enabled</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Submit Maintenance Request
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Confirm the location and describe the issue—category, squad, and SLA priority are detected automatically.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsMapModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-200 font-medium text-xs transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>Open Digital Twin Map</span>
          </button>
          <Link
            to="/student"
            className="px-3.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-300 font-medium text-xs transition-all"
          >
            My Requests →
          </Link>
        </div>
      </div>

      {/* Main 2-Column Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bento-card p-6 sm:p-7 space-y-6"
        >
          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs font-medium text-rose-200">
              {error}
            </div>
          )}

          {residenceSavedNotice && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-medium text-emerald-300">
              ✓ {residenceSavedNotice}
            </div>
          )}

          {/* STEP 1: Streamlined 3-Mode Location Selector */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-semibold flex items-center justify-center">
                  1
                </span>
                <span className="text-sm font-semibold text-white tracking-tight">
                  Location
                </span>
              </div>

              {/* 3-Mode Segmented Pill Bar */}
              <div className="inline-flex items-center p-1 rounded-lg bg-[#070b12] border border-white/[0.08] gap-1">
                <button
                  type="button"
                  onClick={handleUseMySavedRoom}
                  className={`px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    locationMode === 'MY_ROOM'
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-white font-medium'
                  }`}
                >
                  <span>My Room</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocationMode('SEARCH')}
                  className={`px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    locationMode === 'SEARCH'
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-white font-medium'
                  }`}
                >
                  <span>Quick Search</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocationMode('BROWSE')}
                  className={`px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    locationMode === 'BROWSE'
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-white font-medium'
                  }`}
                >
                  <span>Browse / Map</span>
                </button>
              </div>
            </div>

            {/* MODE A: 1-Tap My Saved Room Card */}
            {locationMode === 'MY_ROOM' && (
              <div className="p-4 rounded-xl bg-[#070b12] border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold">
                        Saved Residence
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {activeBuildingObj?.mapPin?.badge || 'HOSTEL'}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white mt-1">
                      {activeBuildingObj?.name || savedHostel}
                    </div>
                    <div className="text-xs font-mono text-emerald-400 font-medium mt-0.5">
                      {resolvedRoomLabel}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setLocationMode('SEARCH')}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Search Other Spot
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Pick on Map
                  </button>
                </div>
              </div>
            )}

            {/* MODE B: Inline Omni-Search */}
            {locationMode === 'SEARCH' && (
              <div className="space-y-3 p-4 rounded-xl bg-[#070b12] border border-white/[0.08]">
                <div className="relative">
                  <input
                    type="text"
                    value={spotQuery}
                    onChange={(e) => setSpotQuery(e.target.value)}
                    placeholder="Search room number, lab, or block (e.g. '303', '131C', 'VLSI', 'Canteen', 'B-204')..."
                    className="enterprise-input pl-9 py-2.5 text-xs sm:text-sm bg-[#0b101b]"
                  />
                  <svg className="w-4 h-4 text-emerald-400 absolute left-3 top-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {spotQuery && (
                    <button
                      type="button"
                      onClick={() => setSpotQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 shrink-0">
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
                      className="px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-emerald-500/15 text-slate-300 hover:text-emerald-300 border border-white/[0.07] hover:border-emerald-500/30 text-[11px] font-medium shrink-0 cursor-pointer transition-all"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {spotQuery.trim().length > 0 && (
                  <div className="rounded-xl bg-[#05080e] border border-white/[0.08] divide-y divide-white/[0.06] max-h-60 overflow-y-auto">
                    {spotResults.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No matching room or building found. Use Browse mode for custom spots.
                      </div>
                    ) : (
                      spotResults.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePickSpotResult(item)}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-500/10 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-white/[0.05] text-emerald-300 border border-white/[0.08]">
                                {item.badge}
                              </span>
                              <span className="text-xs font-medium text-white">
                                {item.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</p>
                          </div>
                          <span className="text-[11px] font-mono text-emerald-400 shrink-0">
                            Select →
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                <div className="p-3 rounded-lg bg-white/[0.02] border border-emerald-500/25 flex items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-semibold text-[10px] uppercase">
                      Selected
                    </span>
                    <span className="font-semibold text-white">{activeBuildingObj?.shortName || building}</span>
                    <span className="text-slate-600">·</span>
                    <span className="font-mono text-emerald-400 font-medium">{resolvedRoomLabel}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    className="text-[11px] font-medium text-emerald-400 hover:underline shrink-0 cursor-pointer"
                  >
                    View on Map →
                  </button>
                </div>
              </div>
            )}

            {/* MODE C: Browse Building, Floor, Wing & Room */}
            {locationMode === 'BROWSE' && (
              <div className="space-y-3.5 p-4 rounded-xl bg-[#070b12] border border-white/[0.08]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="building" className="block text-xs font-medium text-slate-300">
                        Hostel or Campus Building
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsMapModalOpen(true)}
                        className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                      >
                        Pick visually on Digital Twin →
                      </button>
                    </div>
                    <select
                      id="building"
                      value={activeBuildingObj?.name || ''}
                      onChange={(e) => handleSelectBuilding(e.target.value)}
                      className="enterprise-input font-medium bg-[#0b101b]"
                    >
                      <optgroup label="Hostels">
                        {hostelsList.map((h) => (
                          <option key={h.id} value={h.name}>
                            {h.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Academic, Labs & Campus">
                        {nonHostelsList.map((b) => (
                          <option key={b.id} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="floorSelect" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Floor
                    </label>
                    <select
                      id="floorSelect"
                      value={selectedFloor}
                      onChange={(e) => {
                        const newFloor = e.target.value;
                        setSelectedFloor(newFloor);
                        const nextRooms = getRoomsForBuilding(activeBuildingObj?.name, newFloor, selectedWing, allBuildings);
                        if (nextRooms.length > 0) {
                          setSpecificLocation(nextRooms[0]);
                          setCustomRoomOverride('');
                        }
                      }}
                      className="enterprise-input bg-[#0b101b]"
                    >
                      {availableFloors.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isHostelBuilding ? (
                    <div>
                      <label htmlFor="wingSelect" className="block text-xs font-medium text-slate-300 mb-1.5">
                        Wing / Zone
                      </label>
                      <select
                        id="wingSelect"
                        value={selectedWing}
                        onChange={(e) => {
                          const newWing = e.target.value;
                          setSelectedWing(newWing);
                          const nextRooms = getRoomsForBuilding(activeBuildingObj?.name, selectedFloor, newWing, allBuildings);
                          if (nextRooms.length > 0) {
                            setSpecificLocation(nextRooms[0]);
                            setCustomRoomOverride('');
                          }
                        }}
                        className="enterprise-input bg-[#0b101b]"
                      >
                        {availableWings.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Digital Twin Zone
                      </label>
                      <div className="enterprise-input bg-[#0b101b] text-slate-400 font-mono text-xs flex items-center justify-between">
                        <span className="text-emerald-400 font-semibold">{activeBuildingObj?.mapPin?.badge || 'BLDG'}</span>
                        <span>{activeBuildingObj?.gps || ''}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="specificLocation" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Room / Lab / Utility
                    </label>
                    <select
                      id="specificLocation"
                      value={specificLocation}
                      onChange={(e) => {
                        setSpecificLocation(e.target.value);
                        setCustomRoomOverride('');
                      }}
                      className="enterprise-input bg-[#0b101b]"
                    >
                      {availableRooms.map((rm) => (
                        <option key={rm} value={rm}>
                          {rm}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="customRoomOverride" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Specific Spot (Optional)
                    </label>
                    <input
                      id="customRoomOverride"
                      type="text"
                      placeholder="e.g. Near Balcony, Tap #2"
                      value={customRoomOverride}
                      onChange={(e) => setCustomRoomOverride(e.target.value)}
                      className="enterprise-input bg-[#0b101b]"
                    />
                  </div>
                </div>

                {isHostelBuilding && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSaveCurrentAsMyRoom}
                      className="text-xs font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/15 px-3 py-1.5 rounded-lg border border-emerald-500/25 transition-colors cursor-pointer"
                    >
                      Set as My Default Room
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.06]" />

          {/* STEP 2: Issue Title & Details */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-semibold flex items-center justify-center">
                  2
                </span>
                <span className="text-sm font-semibold text-white tracking-tight">
                  Issue Description
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                <span>Auto-detects category &amp; priority</span>
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="title" className="block text-xs font-medium text-slate-300">
                  Issue Summary
                </label>
                <span className="text-[11px] font-mono text-slate-500">
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
                className="enterprise-input text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="description" className="block text-xs font-medium text-slate-300">
                  Details &amp; Observations
                </label>
                <span className="text-[11px] font-mono text-slate-500">
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
                className="enterprise-input text-sm resize-none leading-relaxed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-semibold shadow-[0_1px_20px_rgba(16,185,129,0.28)] transition-all cursor-pointer disabled:bg-slate-800 disabled:text-slate-500"
          >
            {submitting
              ? 'Submitting Request...'
              : `Submit Request · ${activeBuildingObj?.shortName || building} (${resolvedRoomLabel})`}
          </button>
        </form>

        {/* Right Sticky Triage & Target Summary Column */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <LiveTriageCard title={title} description={description} />

          <div className="bento-card p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Dispatch Target
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 border border-white/[0.08] font-medium">
                  {activeBuildingObj?.mapPin?.badge || 'BLDG'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(true)}
                  className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  Change on Map →
                </button>
              </div>
            </div>
            <div className="font-semibold text-white text-sm">
              {activeBuildingObj?.name || building}
            </div>
            <div className="font-mono text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg font-medium flex items-center justify-between">
              <span>{resolvedRoomLabel}</span>
              <span className="text-[10px] text-emerald-400 font-sans">Verified</span>
            </div>
          </div>

          <div className="bento-card p-5 space-y-3 text-xs">
            <span className="font-medium text-slate-400 uppercase tracking-wider font-mono text-[10px] block">
              SLA Resolution Windows
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <span className="font-semibold text-rose-400">CRITICAL</span>
                <span className="text-slate-300 font-mono">2h</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <span className="font-semibold text-orange-400">HIGH</span>
                <span className="text-slate-300 font-mono">8h</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <span className="font-semibold text-amber-300">MEDIUM</span>
                <span className="text-slate-300 font-mono">24h</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <span className="font-semibold text-emerald-400">LOW</span>
                <span className="text-slate-300 font-mono">72h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map Picker Modal */}
      {isMapModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMapModalOpen(false);
          }}
        >
          <div className="bg-[#080c14] border border-white/[0.1] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.08] bg-[#0c111b] flex items-center justify-between gap-3 shrink-0">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-white">
                  Campus Digital Twin — Location Picker
                </h2>
                <p className="text-[11px] text-slate-400">
                  Click any building, wing, or room to lock in your complaint location
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition-all cursor-pointer"
                >
                  Confirm Selection
                </button>
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white flex items-center justify-center text-xs cursor-pointer"
                  title="Close Map (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-4 overflow-y-auto flex-1 bg-[#080c14]">
              <CampusMapSelector
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
