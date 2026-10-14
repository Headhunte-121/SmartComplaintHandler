/**
 * SmartComplaintHandler - Minimal Campus Map & Quick Intake Hub (IIIT Naya Raipur)
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CampusMapSelector from '../components/CampusMapSelector';
import {
  IIITNR_MAP_UPDATED_EVENT,
  getCampusBuildings,
} from '../data/iiitnrCampusData';

export default function Home() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [buildings, setBuildings] = useState(() => getCampusBuildings());
  const [trackingCode, setTrackingCode] = useState('');
  const [selectedMapBuilding, setSelectedMapBuilding] = useState(
    () => getCampusBuildings()[0]?.name || 'Ramanujan House (Boys Hostel)'
  );

  useEffect(() => {
    const sync = () => setBuildings(getCampusBuildings());
    window.addEventListener(IIITNR_MAP_UPDATED_EVENT, sync);
    return () => window.removeEventListener(IIITNR_MAP_UPDATED_EVENT, sync);
  }, []);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    const cleaned = trackingCode.trim().toUpperCase();
    if (!cleaned) return;
    navigate(`/track?code=${encodeURIComponent(cleaned)}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Minimal Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            IIIT Naya Raipur Campus Facilities
          </h1>
          <p className="text-xs text-slate-500">
            Select a building on the map or click &ldquo;Edit / Label Map&rdquo; to customize hostels and rooms
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <form onSubmit={handleTrackSubmit} className="flex items-center space-x-1.5">
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Track ID (e.g. SCH-...)"
              className="enterprise-input w-40 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
            >
              Track
            </button>
          </form>

          <Link
            to={`/submit?building=${encodeURIComponent(selectedMapBuilding)}`}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shrink-0"
          >
            + New Request
          </Link>
        </div>
      </div>

      {/* Interactive Campus Map & Labeler */}
      <CampusMapSelector
        selectedBuilding={selectedMapBuilding}
        onSelectBuilding={setSelectedMapBuilding}
        studentSavedHostel={currentUser?.hostel_name}
        studentSavedRoom={currentUser?.room_number}
      />

      {/* Compact Building & Hostel Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {buildings.map((b) => {
          const isSelected = b.name === selectedMapBuilding;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => navigate(`/submit?building=${encodeURIComponent(b.name)}`)}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="text-[10px] font-mono opacity-60">
                {b.mapPin?.badge || b.mapZone?.badge || 'BLDG'}
              </div>
              <div className="text-xs font-semibold truncate mt-0.5">
                {b.shortName || b.name}
              </div>
              <div className="text-[10px] opacity-70 truncate">
                {b.category === 'HOSTEL' ? 'Hostel' : 'Campus Block'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
