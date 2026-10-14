/**
 * SmartComplaintHandler - Minimal Complaint Submission Page (IIIT Naya Raipur)
 * Aesthetic: Clean, distraction-free single-column card with optional collapsible Campus Map.
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
} from '../data/iiitnrCampusData';

const SERVICE_CATEGORIES = [
  { id: 'Electrical', label: 'Electrical' },
  { id: 'Plumbing', label: 'Plumbing & Water' },
  { id: 'IT Support', label: 'Wi-Fi & LAN' },
  { id: 'Carpentry', label: 'Carpentry' },
  { id: 'Sanitation', label: 'Sanitation' },
  { id: 'General', label: 'General' },
];

export default function SubmitComplaint() {
  const { currentPersona, currentUser, updateProfile } = useAuth();
  const activeUser = currentUser || currentPersona;
  const [searchParams] = useSearchParams();

  const [allBuildings, setAllBuildings] = useState(() => getCampusBuildings());
  const [showMap, setShowMap] = useState(Boolean(searchParams.get('building')));

  useEffect(() => {
    const sync = () => setAllBuildings(getCampusBuildings());
    window.addEventListener(IIITNR_MAP_UPDATED_EVENT, sync);
    return () => window.removeEventListener(IIITNR_MAP_UPDATED_EVENT, sync);
  }, []);

  const hostelsList = useMemo(() => getHostelBuildings(allBuildings), [allBuildings]);
  const nonHostelsList = useMemo(() => getNonHostelBuildings(allBuildings), [allBuildings]);

  const savedHostel = activeUser?.hostel_name || hostelsList[0]?.name || allBuildings[0]?.name;
  const savedRoom = activeUser?.room_number || 'Wing A, Room 204';

  const [building, setBuilding] = useState(
    searchParams.get('building') || savedHostel || allBuildings[0]?.name
  );
  const [selectedFloor, setSelectedFloor] = useState('2');
  const [specificLocation, setSpecificLocation] = useState(savedRoom);
  const [category, setCategory] = useState('Electrical');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [savedToast, setSavedToast] = useState(false);

  const activeBuildingObj = useMemo(
    () =>
      allBuildings.find(
        (b) => b.name === building || b.id === building || b.shortName === building
      ) || allBuildings[0],
    [allBuildings, building]
  );

  const isHostel = activeBuildingObj?.category === 'HOSTEL';

  const availableFloors = useMemo(
    () => getFloorsForBuilding(activeBuildingObj?.name, allBuildings),
    [activeBuildingObj, allBuildings]
  );

  const availableRooms = useMemo(
    () => getRoomsForBuilding(activeBuildingObj?.name, selectedFloor, 'Wing A', allBuildings),
    [activeBuildingObj, selectedFloor, allBuildings]
  );

  const handleSelectBuilding = (bName) => {
    setBuilding(bName);
    const nextRooms = getRoomsForBuilding(bName, selectedFloor, 'Wing A', allBuildings);
    if (nextRooms.length > 0) setSpecificLocation(nextRooms[0]);
  };

  const handleSaveDefaultRoom = async () => {
    if (!activeBuildingObj) return;
    await updateProfile({
      hostel_name: activeBuildingObj.name,
      room_number: specificLocation,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (title.trim().length < 5 || description.trim().length < 10) {
      setError('Please enter a short title (5+ chars) and description (10+ chars).');
      return;
    }

    setSubmitting(true);
    setError(null);

    const fullLocation = `${activeBuildingObj?.name || building}, ${specificLocation.trim() || 'General Area'}`;

    try {
      const ticket = await submitComplaint({
        title: title.trim(),
        description: description.trim(),
        location: fullLocation,
        student_name: activeUser?.name || 'Student',
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
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Minimal Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
            New Maintenance Request
          </h1>
          <p className="text-xs text-slate-500">
            Select your hostel room or campus building below
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              setBuilding(savedHostel);
              setSpecificLocation(savedRoom);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
          >
            🏠 {(savedHostel || '').split(' (')[0]} · {savedRoom}
          </button>

          <button
            type="button"
            onClick={() => setShowMap((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              showMap
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {showMap ? 'Hide Map' : '🗺️ Pick on Map'}
          </button>
        </div>
      </div>

      {/* Collapsible Interactive Campus Map */}
      {showMap && (
        <CampusMapSelector
          selectedBuilding={activeBuildingObj?.name}
          onSelectBuilding={handleSelectBuilding}
          selectedRoom={specificLocation}
          onSelectRoom={setSpecificLocation}
          studentSavedHostel={savedHostel}
          studentSavedRoom={savedRoom}
        />
      )}

      {/* Clean Single-Card Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5"
      >
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Location Row */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-700">Location</label>
            {isHostel && (
              <button
                type="button"
                onClick={handleSaveDefaultRoom}
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                {savedToast ? '✓ Saved as my default room' : 'Save as my default room'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-6">
              <select
                value={activeBuildingObj?.name || ''}
                onChange={(e) => handleSelectBuilding(e.target.value)}
                className="enterprise-input"
              >
                <optgroup label="Hostels">
                  {hostelsList.map((h) => (
                    <option key={h.id} value={h.name}>
                      {h.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Academic & Campus">
                  {nonHostelsList.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="sm:col-span-2">
              <select
                value={selectedFloor}
                onChange={(e) => {
                  const fl = e.target.value;
                  setSelectedFloor(fl);
                  const rms = getRoomsForBuilding(activeBuildingObj?.name, fl, 'Wing A', allBuildings);
                  if (rms.length > 0) setSpecificLocation(rms[0]);
                }}
                className="enterprise-input"
              >
                {availableFloors.map((f) => (
                  <option key={f.id} value={f.id}>
                    Floor {f.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <input
                type="text"
                list="iiitnr-room-suggestions"
                required
                value={specificLocation}
                onChange={(e) => setSpecificLocation(e.target.value)}
                placeholder="Room or lab (e.g. Room 204)"
                className="enterprise-input"
              />
              <datalist id="iiitnr-room-suggestions">
                {availableRooms.map((rm) => (
                  <option key={rm} value={rm} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">Category</label>
          <div className="flex flex-wrap gap-1.5">
            {SERVICE_CATEGORIES.map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <label htmlFor="title" className="block text-xs font-medium text-slate-700">
            Issue Summary
          </label>
          <input
            id="title"
            type="text"
            required
            minLength={5}
            maxLength={150}
            placeholder="e.g. Fan regulator broken, or Wi-Fi AP offline"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
            className="enterprise-input"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label htmlFor="description" className="block text-xs font-medium text-slate-700">
            Details
          </label>
          <textarea
            id="description"
            required
            minLength={10}
            rows={3}
            placeholder="Describe what needs repair..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            className="enterprise-input resize-none"
          />
        </div>

        {/* Compact Auto-Triage Pill (Appears only when typing) */}
        <LiveTriageCard title={title} description={description} />

        {/* Submit */}
        <div className="flex items-center justify-between pt-1">
          <Link to="/student" className="text-xs text-slate-500 hover:text-slate-800">
            View my requests
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>

      <SubmissionSuccessModal
        isOpen={isSuccessModalOpen}
        ticket={createdTicket}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </div>
  );
}
