/**
 * SmartComplaintHandler - Campus Grievance Submission Workstation (IIIT Naya Raipur)
 * Rich 2-column Bento layout with Interactive Campus Map, Hostel/Wing/Room pickers,
 * Visual Service Category Cards, and Live Triage Preview — zero promotional filler.
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
  { id: 'Electrical', icon: '⚡', label: 'Electrical & Power', hint: 'Fans, AC, switchboards, lighting' },
  { id: 'Plumbing', icon: '🚰', label: 'Plumbing & Water', hint: 'RO coolers, taps, washroom drainage' },
  { id: 'IT Support', icon: '🌐', label: 'IT & Campus Wi-Fi', hint: 'LAN ports, Wi-Fi APs, lab PCs' },
  { id: 'Carpentry', icon: '🪑', label: 'Carpentry & Civil', hint: 'Doors, locks, windows, cots, desks' },
  { id: 'Sanitation', icon: '🧹', label: 'Sanitation & Hygiene', hint: 'Washroom cleaning, waste, pests' },
  { id: 'General', icon: '🏛️', label: 'General Facilities', hint: 'Mess, pathways, common areas' },
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
    setResidenceSavedNotice(`Saved ${activeBuildingObj.shortName} · ${finalRoom} as your default hostel room.`);
    setTimeout(() => setResidenceSavedNotice(null), 3000);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (title.trim().length < 5 || description.trim().length < 10) {
      setError('Please enter an issue title (5+ chars) and details (10+ chars).');
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
      setError(err.response?.data?.detail || err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      {/* Compact Dark Header Bar */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-5 sm:px-7 shadow-lg bg-dark-architectural-grid border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Submit Maintenance Request
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Click your Hostel or Academic Block on the map or select your room below
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleUseMySavedRoom}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 font-bold text-xs transition-all cursor-pointer"
          >
            🏠 My Room: {(savedHostel || '').split(' ')[0]} · {savedRoom}
          </button>
          <Link
            to="/student"
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs transition-all"
          >
            My Issues →
          </Link>
        </div>
      </div>

      {/* Interactive IIIT Naya Raipur Map (OSM + Satellite + Campus Plan) */}
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

      {/* Main 2-Column Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bento-card p-6 sm:p-7 space-y-6"
        >
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {residenceSavedNotice && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800">
              ✓ {residenceSavedNotice}
            </div>
          )}

          {/* Building, Floor, Wing & Room Picker */}
          <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                📍 Location &amp; Room Number
              </span>
              {isHostelBuilding && (
                <button
                  type="button"
                  onClick={handleSaveCurrentAsMyRoom}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs cursor-pointer"
                >
                  💾 Save as My Room
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="building" className="block text-xs font-bold text-slate-700 mb-1">
                  Hostel or Campus Building
                </label>
                <select
                  id="building"
                  value={activeBuildingObj?.name || ''}
                  onChange={(e) => handleSelectBuilding(e.target.value)}
                  className="enterprise-input font-semibold"
                >
                  <optgroup label="🏠 Hostels">
                    {hostelsList.map((h) => (
                      <option key={h.id} value={h.name}>
                        {h.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🏛️ Academic, Labs & Campus">
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
                    Wing / Area
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
                    Coordinates
                  </label>
                  <div className="enterprise-input bg-slate-100 text-slate-600 font-mono text-xs flex items-center justify-between">
                    <span>{activeBuildingObj?.mapPin?.badge || 'BLDG'}</span>
                    <span>{activeBuildingObj?.gps || ''}</span>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="specificLocation" className="block text-xs font-bold text-slate-700 mb-1">
                  Room / Lab / Utility
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
                  Or Type Custom Room No.
                </label>
                <input
                  id="customRoomOverride"
                  type="text"
                  placeholder="e.g. Room 209, Balcony, Table 2"
                  value={customRoomOverride}
                  onChange={(e) => setCustomRoomOverride(e.target.value)}
                  className="enterprise-input"
                />
              </div>
            </div>
          </div>

          {/* Visual Category Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Category
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
                      {selected && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1.5">{cat.label}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{cat.hint}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Issue Title & Description */}
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Issue Title
              </label>
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
              <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Details
              </label>
              <textarea
                id="description"
                required
                minLength={10}
                rows={4}
                placeholder="Describe what needs repair..."
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
            className="w-full py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:bg-slate-300"
          >
            {submitting
              ? 'Submitting...'
              : `Submit Request for ${activeBuildingObj?.shortName || building} (${customRoomOverride.trim() || specificLocation})`}
          </button>
        </form>

        {/* Right Sticky Triage & Target Summary Column */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <LiveTriageCard title={title} description={description} />

          <div className="bento-card p-5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                📍 Selected Location
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                {activeBuildingObj?.mapPin?.badge || 'BLDG'}
              </span>
            </div>
            <div className="font-black text-slate-900 text-sm">
              {activeBuildingObj?.name || building}
            </div>
            <div className="font-mono text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold">
              {customRoomOverride.trim() || specificLocation}
            </div>
          </div>

          <div className="bento-card p-5 space-y-2.5 text-xs">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
              SLA Resolution Targets
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/70">
                <span className="font-black text-rose-700 block">CRITICAL</span>
                <span className="text-rose-600 font-mono">2 Hours</span>
              </div>
              <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200/70">
                <span className="font-black text-orange-700 block">HIGH</span>
                <span className="text-orange-600 font-mono">8 Hours</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
                <span className="font-black text-amber-800 block">MEDIUM</span>
                <span className="text-amber-700 font-mono">24 Hours</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
                <span className="font-black text-emerald-700 block">LOW</span>
                <span className="text-emerald-600 font-mono">72 Hours</span>
              </div>
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
