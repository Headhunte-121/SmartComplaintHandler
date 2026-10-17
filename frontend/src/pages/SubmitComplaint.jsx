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
    <div className="space-y-6 animate-fade-in pb-12 relative">
      {/* Ambient background glow for visual depth */}
      <div className="absolute -top-10 left-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Clean Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/90 text-xs font-bold text-emerald-800 mb-2 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Smart Maintenance Dispatch</span>
            <span className="text-emerald-300">·</span>
            <span className="font-mono text-[11px] text-emerald-700">Auto-Triage Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Submit Maintenance Request
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Confirm the location and describe the issue—category, squad, and SLA priority are detected automatically.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsMapModalOpen(true)}
            className="btn-botanical-moss shadow-sm"
          >
            <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>Open Digital Twin Map</span>
          </button>
          <Link
            to="/student"
            className="btn-botanical-secondary"
          >
            My Requests →
          </Link>
        </div>
      </div>

      {/* Main 2-Column Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bento-card p-6 sm:p-7 space-y-6 relative overflow-hidden"
        >
          {/* Top card accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500" />

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-800 shadow-2xs">
              {error}
            </div>
          )}

          {residenceSavedNotice && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 shadow-2xs">
              ✓ {residenceSavedNotice}
            </div>
          )}

          {/* STEP 1: Streamlined 3-Mode Location Selector */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-mono text-xs font-black flex items-center justify-center shadow-[0_2px_8px_rgba(22,163,74,0.35)] ring-4 ring-emerald-50">
                  1
                </span>
                <span className="text-sm font-black text-slate-900 tracking-tight">
                  Location
                </span>
              </div>

              {/* 3-Mode Segmented Pill Bar */}
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100/90 border border-slate-200/90 gap-1 shadow-2xs">
                <button
                  type="button"
                  onClick={handleUseMySavedRoom}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    locationMode === 'MY_ROOM'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold shadow-[0_2px_8px_rgba(22,163,74,0.25)]'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <span>My Room</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocationMode('SEARCH')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    locationMode === 'SEARCH'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold shadow-[0_2px_8px_rgba(22,163,74,0.25)]'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <span>Quick Search</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocationMode('BROWSE')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    locationMode === 'BROWSE'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold shadow-[0_2px_8px_rgba(22,163,74,0.25)]'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <span>Browse / Map</span>
                </button>
              </div>
            </div>

            {/* MODE A: 1-Tap My Saved Room Card */}
            {locationMode === 'MY_ROOM' && (
              <div className="p-4.5 rounded-2xl bg-gradient-to-br from-emerald-50/95 via-green-50/40 to-white border border-emerald-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-[0_2px_10px_rgba(22,163,74,0.3)] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-white text-emerald-900 border border-emerald-300 font-black shadow-2xs">
                        Saved Residence
                      </span>
                      <span className="text-[11px] font-mono font-bold text-emerald-800">
                        {activeBuildingObj?.mapPin?.badge || 'HOSTEL'}
                      </span>
                    </div>
                    <div className="text-sm font-black text-slate-900 mt-1">
                      {activeBuildingObj?.name || savedHostel}
                    </div>
                    <div className="text-xs font-mono text-emerald-800 font-bold mt-0.5">
                      📍 {resolvedRoomLabel}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setLocationMode('SEARCH')}
                    className="btn-botanical-secondary"
                  >
                    Search Other Spot
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    className="btn-botanical-moss shadow-xs"
                  >
                    Pick on Map
                  </button>
                </div>
              </div>
            )}

            {/* MODE B: Inline Omni-Search */}
            {locationMode === 'SEARCH' && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="relative">
                  <input
                    type="text"
                    value={spotQuery}
                    onChange={(e) => setSpotQuery(e.target.value)}
                    placeholder="Search room number, lab, or block (e.g. '303', '131C', 'VLSI', 'Canteen', 'Room 204')..."
                    className="enterprise-input pl-9 py-2.5 text-xs sm:text-sm bg-white border-slate-200 focus:border-green-500"
                  />
                  <svg className="w-4 h-4 text-green-600 absolute left-3 top-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {spotQuery && (
                    <button
                      type="button"
                      onClick={() => setSpotQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-800 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 shrink-0 font-semibold">
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
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-green-50 text-slate-700 hover:text-green-800 border border-slate-200 hover:border-green-300 text-[11px] font-medium shrink-0 cursor-pointer transition-all shadow-2xs"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {spotQuery.trim().length > 0 && (
                  <div className="rounded-xl bg-white border border-slate-200 divide-y divide-slate-100 max-h-60 overflow-y-auto shadow-lg">
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
                          className="w-full text-left px-3.5 py-2.5 hover:bg-green-50/60 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-green-800 border border-slate-200">
                                {item.badge}
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {item.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{item.subtitle}</p>
                          </div>
                          <span className="text-[11px] font-mono text-green-700 font-semibold shrink-0">
                            Select →
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                <div className="p-3 rounded-xl bg-white border border-green-200 flex items-center justify-between gap-2 text-xs shadow-2xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 font-mono font-bold text-[10px] uppercase">
                      Selected
                    </span>
                    <span className="font-bold text-slate-900">{activeBuildingObj?.shortName || building}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono text-green-700 font-bold">{resolvedRoomLabel}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    className="text-[11px] font-semibold text-green-700 hover:underline shrink-0 cursor-pointer"
                  >
                    View on Map →
                  </button>
                </div>
              </div>
            )}

            {/* MODE C: Browse Building, Floor & Room */}
            {locationMode === 'BROWSE' && (
              <div className="space-y-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="building" className="block text-xs font-semibold text-slate-700">
                        Hostel or Campus Building
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsMapModalOpen(true)}
                        className="text-[11px] font-semibold text-green-700 hover:text-green-800 cursor-pointer"
                      >
                        Pick visually on Digital Twin →
                      </button>
                    </div>
                    <select
                      id="building"
                      value={activeBuildingObj?.name || ''}
                      onChange={(e) => handleSelectBuilding(e.target.value)}
                      className="enterprise-input font-medium bg-white border-slate-200 text-slate-900"
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
                    <label htmlFor="floorSelect" className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                      className="enterprise-input bg-white border-slate-200 text-slate-900"
                    >
                      {availableFloors.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Campus Zone / Coordinates
                    </label>
                    <div className="enterprise-input bg-white border-slate-200 text-slate-700 font-mono text-xs flex items-center justify-between">
                      <span className="text-green-700 font-bold">{activeBuildingObj?.mapPin?.badge || 'CAMPUS'}</span>
                      <span className="text-[11px] truncate max-w-[180px] text-slate-500">{activeBuildingObj?.gps || 'Institutional Twin'}</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="specificLocation" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Room / Lab / Utility
                    </label>
                    <select
                      id="specificLocation"
                      value={specificLocation}
                      onChange={(e) => {
                        setSpecificLocation(e.target.value);
                        setCustomRoomOverride('');
                      }}
                      className="enterprise-input bg-white border-slate-200 text-slate-900"
                    >
                      {availableRooms.map((rm) => (
                        <option key={rm} value={rm}>
                          {rm}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="customRoomOverride" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Specific Spot (Optional)
                    </label>
                    <input
                      id="customRoomOverride"
                      type="text"
                      placeholder="e.g. Near Balcony, Tap #2"
                      value={customRoomOverride}
                      onChange={(e) => setCustomRoomOverride(e.target.value)}
                      className="enterprise-input bg-white border-slate-200 text-slate-900"
                    />
                  </div>
                </div>

                {isHostelBuilding && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSaveCurrentAsMyRoom}
                      className="text-xs font-semibold text-green-800 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg border border-green-200 shadow-2xs transition-colors cursor-pointer"
                    >
                      Set as My Default Room
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200/80" />

          {/* STEP 2: Issue Title & Details */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-mono text-xs font-black flex items-center justify-center shadow-[0_2px_8px_rgba(22,163,74,0.35)] ring-4 ring-emerald-50">
                  2
                </span>
                <span className="text-sm font-black text-slate-900 tracking-tight">
                  Issue Description
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-800 bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-0.5 rounded-lg font-bold shadow-2xs">
                <span>✨ Auto-detects category &amp; SLA</span>
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="title" className="block text-xs font-bold text-slate-700">
                  Issue Summary
                </label>
                <span className="text-[11px] font-mono font-medium text-slate-400">
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
                className="enterprise-input text-sm rounded-xl focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all shadow-2xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="description" className="block text-xs font-bold text-slate-700">
                  Details &amp; Observations
                </label>
                <span className="text-[11px] font-mono font-bold text-emerald-700">
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
                className="enterprise-input text-sm rounded-xl focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 resize-none leading-relaxed transition-all shadow-2xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:to-green-600 text-white text-xs sm:text-sm font-bold shadow-[0_4px_16px_rgba(22,163,74,0.35)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.45)] transition-all cursor-pointer disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0"
          >
            {submitting
              ? 'Submitting Request...'
              : `Submit Request · ${activeBuildingObj?.shortName || building} (${resolvedRoomLabel})`}
          </button>
        </form>

        {/* Right Sticky Triage & Target Summary Column */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <LiveTriageCard title={title} description={description} />

          {/* Dispatch Target Card */}
          <div className="bento-card p-5 space-y-3.5 text-xs bg-white/95 border border-slate-200/90 shadow-sm rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Dispatch Target
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold shadow-2xs">
                  {activeBuildingObj?.mapPin?.badge || 'BLDG'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(true)}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                >
                  Change on Map →
                </button>
              </div>
            </div>
            <div className="font-black text-slate-900 text-sm">
              {activeBuildingObj?.name || building}
            </div>
            <div className="font-mono text-xs text-slate-900 bg-emerald-50/70 border border-emerald-200/90 px-3.5 py-2.5 rounded-xl font-bold flex items-center justify-between shadow-2xs">
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-600">📍</span>
                <span>{resolvedRoomLabel}</span>
              </span>
              <span className="text-[10px] text-emerald-800 font-sans font-bold bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                Verified ✓
              </span>
            </div>
          </div>

          {/* SLA Resolution Windows Matrix */}
          <div className="bento-card p-5 space-y-3 text-xs bg-white/95 border border-slate-200/90 shadow-sm rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500 uppercase tracking-wider font-mono text-[10px] block">
                SLA Resolution Windows
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-semibold">Response Matrix</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-50/80 to-rose-50/30 border border-rose-200/90 flex items-center justify-between shadow-2xs hover:border-rose-300 transition-colors">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-bold text-rose-700">CRITICAL</span>
                </div>
                <span className="text-rose-900 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-rose-200 shadow-2xs">2h</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-50/80 to-amber-50/30 border border-amber-200/90 flex items-center justify-between shadow-2xs hover:border-amber-300 transition-colors">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-bold text-amber-700">HIGH</span>
                </div>
                <span className="text-amber-900 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-200 shadow-2xs">8h</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-50/80 to-sky-50/30 border border-sky-200/90 flex items-center justify-between shadow-2xs hover:border-sky-300 transition-colors">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span className="font-bold text-sky-700">MEDIUM</span>
                </div>
                <span className="text-sky-900 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-sky-200 shadow-2xs">24h</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-50/80 to-emerald-50/30 border border-emerald-200/90 flex items-center justify-between shadow-2xs hover:border-emerald-300 transition-colors">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-emerald-700">LOW</span>
                </div>
                <span className="text-emerald-900 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200 shadow-2xs">72h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map Picker Modal */}
      {isMapModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMapModalOpen(false);
          }}
        >
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Campus Digital Twin — Location Picker
                </h2>
                <p className="text-[11px] text-slate-500">
                  Click any building, floor, or room to lock in your complaint location
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Confirm Selection
                </button>
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-xs cursor-pointer"
                  title="Close Map (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-4 overflow-y-auto flex-1 bg-slate-50">
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
