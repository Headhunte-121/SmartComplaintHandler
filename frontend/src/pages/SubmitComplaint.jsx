/**
 * SmartComplaintHandler - Official Campus Grievance Intake Portal (IIIT Naya Raipur)
 * Blueprint Reference: V1/M2/frontend/02_submit_complaint_page.md
 * Features:
 * - Live-Synced Interactive IIIT Naya Raipur Campus Map & Labeler (Plot No. 7, Sector 24, Atal Nagar)
 * - Dynamically updates Hostels, Buildings, Floors, Wings, and Room Numbers whenever edited on the map
 * - Structured Floor, Wing, and Room Number selector + 1-click "My Saved Hostel Room" auto-fill & persistence
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
} from '../data/iiitnrCampusData';

const SERVICE_CATEGORIES = [
  { id: 'Electrical', icon: '⚡', label: 'Electrical & Power', hint: 'Wiring, fans, AC, switchboards, lighting' },
  { id: 'Plumbing', icon: '🚰', label: 'Plumbing & Water', hint: 'RO coolers, pipe leaks, washroom drainage' },
  { id: 'IT Support', icon: '🌐', label: 'IT & Campus Wi-Fi', hint: 'LAN ports, access points, NOC 131C/131E' },
  { id: 'Carpentry', icon: '🪑', label: 'Carpentry & Civil', hint: 'Doors, locks, windows, hostel cots, desks' },
  { id: 'Sanitation', icon: '🧹', label: 'Sanitation & Hygiene', hint: 'Washroom cleaning, waste, pest control' },
  { id: 'General', icon: '🏛️', label: 'General Facilities', hint: 'Estate Office, mess, pathways, common areas' },
];

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
  const [building, setBuilding] = useState(
    initialBuildingFromUrl || savedHostel || allBuildings[0]?.name
  );
  const [selectedFloor, setSelectedFloor] = useState('2');
  const [selectedWing, setSelectedWing] = useState('Wing A');
  const [specificLocation, setSpecificLocation] = useState(savedRoom);
  const [customRoomOverride, setCustomRoomOverride] = useState('');
  const [saveAsDefaultResidence, setSaveAsDefaultResidence] = useState(false);

  const [category, setCategory] = useState(SERVICE_CATEGORIES[0].id);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [residenceSavedNotice, setResidenceSavedNotice] = useState(null);

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
    const validFloorIds = availableFloors.map((f) => f.id);
    const nextFloor = validFloorIds.includes(selectedFloor)
      ? selectedFloor
      : availableFloors[0]?.id || 'G';
    if (nextFloor !== selectedFloor) {
      setSelectedFloor(nextFloor);
    }
  }, [activeBuildingObj, availableFloors]);

  const handleSelectBuilding = (newBuildingName) => {
    setBuilding(newBuildingName);
    setCustomRoomOverride('');
    const targetRooms = getRoomsForBuilding(newBuildingName, selectedFloor, selectedWing, allBuildings);
    if (targetRooms.length > 0) {
      setSpecificLocation(targetRooms[0]);
    }
  };

  const handleUseMySavedRoom = () => {
    setBuilding(savedHostel);
    setSpecificLocation(savedRoom);
    setCustomRoomOverride('');
  };

  const handleSaveCurrentAsMyRoom = async () => {
    if (!isHostelBuilding || !activeBuildingObj) return;
    const finalRoom = customRoomOverride.trim() || specificLocation;
    await updateProfile({
      hostel_name: activeBuildingObj.name,
      room_number: finalRoom,
    });
    setResidenceSavedNotice(`Saved ${activeBuildingObj.shortName} • ${finalRoom} as your default hostel room!`);
    setTimeout(() => setResidenceSavedNotice(null), 3500);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (title.trim().length < 5 || description.trim().length < 10) {
      setError('Please provide a descriptive title (at least 5 characters) and detailed narrative (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    setError(null);

    const resolvedRoom = customRoomOverride.trim() || specificLocation.trim() || 'General Area';
    const fullLocation = `${activeBuildingObj?.name || building}, ${resolvedRoom}`;

    try {
      if (saveAsDefaultResidence && isHostelBuilding && activeBuildingObj) {
        await updateProfile({
          hostel_name: activeBuildingObj.name,
          room_number: resolvedRoom,
        });
      }

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
      setError(err.response?.data?.detail || err.message || 'Network error occurred while submitting grievance.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Enterprise Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl bg-dark-architectural-grid border border-slate-800">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[11px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>IIIT Naya Raipur • Interactive Campus Map &amp; Hostel Intake</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Lodge Hostel &amp; Campus Maintenance Request
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Click any pin on the interactive IIIT-NR Campus Map below to select your Hostel or Academic Block—or click{' '}
              <strong className="text-amber-300">&quot;✏️ Label / Edit Campus Map&quot;</strong> on the map to add, drag, or rename any hostel, wing, floor, or room number.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleUseMySavedRoom}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 font-bold text-xs transition-all cursor-pointer"
            >
              🏠 My Room: {(savedHostel || '').split(' ')[0]} ({savedRoom})
            </button>
            <Link
              to="/student"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs transition-all"
            >
              View My History →
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive & User-Labelable IIIT Naya Raipur Campus Map */}
      <CampusMapSelector
        selectedBuilding={activeBuildingObj?.name}
        onSelectBuilding={handleSelectBuilding}
        selectedRoom={customRoomOverride.trim() || specificLocation}
        onSelectRoom={(rm) => {
          setSpecificLocation(rm);
          setCustomRoomOverride('');
        }}
        studentSavedHostel={savedHostel}
        studentSavedRoom={savedRoom}
      />

      {/* Main Grid: Form on Left (7 cols), Sticky Safety Intelligence Panel on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bento-card p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Hostel / Building Room &amp; Technical Narrative
              </h2>
              <p className="text-xs text-slate-500">
                Select or type your exact IIIT-NR room or lab and describe the issue.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 shrink-0">* Required fields</span>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700 flex items-start space-x-2.5 animate-fade-in">
              <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {residenceSavedNotice && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center space-x-2 animate-fade-in">
              <span>✓</span>
              <span>{residenceSavedNotice}</span>
            </div>
          )}

          {/* Structured IIIT-NR Building, Floor, Wing & Room Number Picker */}
          <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                📍 Step 1: Select Building / Hostel &amp; Room Number
              </span>
              {isHostelBuilding && (
                <button
                  type="button"
                  onClick={handleSaveCurrentAsMyRoom}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs cursor-pointer"
                >
                  💾 Save as My Hostel Room
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label htmlFor="building" className="block text-xs font-bold text-slate-700 mb-1">
                  Hostel House or Campus Building <span className="text-rose-500">*</span>
                </label>
                <select
                  id="building"
                  value={activeBuildingObj?.name || ''}
                  onChange={(e) => handleSelectBuilding(e.target.value)}
                  className="enterprise-input font-semibold"
                >
                  <optgroup label="🏠 Student Hostels">
                    {hostelsList.map((h) => (
                      <option key={h.id} value={h.name}>
                        {h.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🏛️ Academic Blocks, Labs, Library & Amenities">
                    {nonHostelsList.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label htmlFor="floorSelect" className="block text-xs font-bold text-slate-700 mb-1">
                  Floor Level
                </label>
                <select
                  id="floorSelect"
                  value={selectedFloor}
                  onChange={(e) => {
                    const newFloor = e.target.value;
                    setSelectedFloor(newFloor);
                    const nextRooms = getRoomsForBuilding(
                      activeBuildingObj?.name,
                      newFloor,
                      selectedWing,
                      allBuildings
                    );
                    if (nextRooms.length > 0) {
                      setSpecificLocation(nextRooms[0]);
                      setCustomRoomOverride('');
                    }
                  }}
                  className="enterprise-input"
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
                  <label htmlFor="wingSelect" className="block text-xs font-bold text-slate-700 mb-1">
                    Hostel Wing / Block
                  </label>
                  <select
                    id="wingSelect"
                    value={selectedWing}
                    onChange={(e) => {
                      const newWing = e.target.value;
                      setSelectedWing(newWing);
                      const nextRooms = getRoomsForBuilding(
                        activeBuildingObj?.name,
                        selectedFloor,
                        newWing,
                        allBuildings
                      );
                      if (nextRooms.length > 0) {
                        setSpecificLocation(nextRooms[0]);
                        setCustomRoomOverride('');
                      }
                    }}
                    className="enterprise-input"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Building Zone Code
                  </label>
                  <div className="enterprise-input bg-slate-100 text-slate-600 font-mono text-xs flex items-center justify-between">
                    <span>{activeBuildingObj?.mapPin?.badge || activeBuildingObj?.mapZone?.badge || 'BLDG'}</span>
                    <span>{activeBuildingObj?.gps || ''}</span>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="specificLocation" className="block text-xs font-bold text-slate-700 mb-1">
                  Select Room Number / Lab / Utility <span className="text-rose-500">*</span>
                </label>
                <select
                  id="specificLocation"
                  value={specificLocation}
                  onChange={(e) => {
                    setSpecificLocation(e.target.value);
                    setCustomRoomOverride('');
                  }}
                  className="enterprise-input"
                >
                  {availableRooms.map((rm) => (
                    <option key={rm} value={rm}>
                      {rm}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="customRoomOverride" className="block text-xs font-bold text-slate-700 mb-1">
                  Or Type Exact Room / Spot Number
                </label>
                <input
                  id="customRoomOverride"
                  type="text"
                  placeholder="Type any exact room number or spot..."
                  value={customRoomOverride}
                  onChange={(e) => setCustomRoomOverride(e.target.value)}
                  className="enterprise-input"
                />
              </div>
            </div>

            {isHostelBuilding && activeBuildingObj && (
              <label className="flex items-center space-x-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveAsDefaultResidence}
                  onChange={(e) => setSaveAsDefaultResidence(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs font-medium text-slate-600">
                  Update my student profile with <strong>{activeBuildingObj.shortName} ({customRoomOverride.trim() || specificLocation})</strong>
                </span>
              </label>
            )}
          </div>

          {/* Interactive Service Category Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Step 2: Facility Domain Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SERVICE_CATEGORIES.map((cat) => {
                const selected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/15 shadow-2xs'
                        : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{cat.icon}</span>
                      {selected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1.5">
                      {cat.label}
                    </div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {cat.hint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Issue Title */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Step 3: Incident Summary Title <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[10px] font-mono font-semibold ${
                  title.trim().length >= 5 ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {title.trim().length} / 5+ chars
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

          {/* Detailed Narrative */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Detailed Technical Description <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[10px] font-mono font-semibold ${
                  description.trim().length >= 10 ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {description.trim().length} / 10+ chars
              </span>
            </div>
            <textarea
              id="description"
              required
              minLength={10}
              rows={4}
              placeholder="Describe the physical defect, duration, and any safety symptoms..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              className="enterprise-input text-sm resize-none leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span>Dispatching Grievance to Maintenance Queue...</span>
            ) : (
              <>
                <span>
                  Submit Request for {activeBuildingObj?.shortName || building} ({customRoomOverride.trim() || specificLocation})
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Right Sticky Triage Telemetry Column */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live Triage &amp; SLA Preview
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ● Deterministic Engine Active
            </span>
          </div>

          <LiveTriageCard title={title} description={description} />

          {/* Selected Location Dispatch Summary Card */}
          <div className="bento-card p-5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                📍 Selected Campus Target
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                {activeBuildingObj?.mapPin?.badge || activeBuildingObj?.mapZone?.badge || 'BLDG'}
              </span>
            </div>
            <div className="font-black text-slate-900 text-sm">
              {activeBuildingObj?.name || building}
            </div>
            <div className="font-mono text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold">
              Room / Zone: {customRoomOverride.trim() || specificLocation}
            </div>
          </div>
        </div>
      </div>

      <SubmissionSuccessModal
        isOpen={isSuccessModalOpen}
        ticket={createdTicket}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </div>
  );
}
