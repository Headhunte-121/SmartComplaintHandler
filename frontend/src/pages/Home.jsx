/**
 * SmartComplaintHandler - IIIT Naya Raipur Campus Map & Hostel Hub (Botanical Earth Tone Theme)
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CampusMapSelector from '../components/CampusMapSelector';
import {
  IIITNR_CAMPUS_METADATA,
  IIITNR_MAP_UPDATED_EVENT,
  getCampusBuildings,
  getHostelBuildings,
} from '../data/iiitnrCampusData';

export default function Home() {
  const navigate = useNavigate();
  const { currentUser, isStudent, canAccessOperations, isTechnician, isSuperAdmin } = useAuth();
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

  const hostels = getHostelBuildings(buildings);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    const cleaned = trackingCode.trim().toUpperCase();
    if (!cleaned) return;
    navigate(`/track?code=${encodeURIComponent(cleaned)}`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      {/* Clean White Action Header */}
      <div className="rounded-3xl bg-white text-slate-900 p-6 sm:p-8 shadow-sm border border-slate-200/90 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>IIIT Naya Raipur · Sector 24, Atal Nagar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Campus Digital Twin &amp; Maintenance Desk
          </h1>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Link
              to={`/submit?building=${encodeURIComponent(selectedMapBuilding)}`}
              className="btn-botanical-primary"
            >
              + Submit Issue ({selectedMapBuilding.split(' (')[0]})
            </Link>
            {isStudent && (
              <Link
                to="/student"
                className="btn-botanical-secondary"
              >
                My Issues →
              </Link>
            )}
            {canAccessOperations && (
              <Link
                to="/admin"
                className="btn-botanical-secondary"
              >
                Operations Desk →
              </Link>
            )}
            {isSuperAdmin && (
              <Link
                to="/superadmin"
                className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-bold text-xs"
              >
                Directorate Console →
              </Link>
            )}
            {isTechnician && (
              <Link
                to="/technician"
                className="btn-botanical-secondary"
              >
                Work Orders →
              </Link>
            )}
          </div>
        </div>

        <form
          onSubmit={handleTrackSubmit}
          className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 w-full lg:w-auto"
        >
          <input
            type="text"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            placeholder="Track Code (e.g. SCH-...)"
            className="w-full sm:w-52 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
          <button
            type="submit"
            className="btn-botanical-primary"
          >
            Track →
          </button>
        </form>
      </div>

      {/* Interactive IIIT Naya Raipur Map */}
      <CampusMapSelector
        selectedBuilding={selectedMapBuilding}
        onSelectBuilding={setSelectedMapBuilding}
        studentSavedHostel={currentUser?.hostel_name}
        studentSavedRoom={currentUser?.room_number}
      />

      {/* Hostels & Estate Contacts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bento-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">
              🏠 IIIT-NR Hostels (Floors G–3)
            </h3>
            <span className="text-[11px] font-mono font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
              Click to Report
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hostels.map((h) => (
              <div
                key={h.id}
                onClick={() => navigate(`/submit?building=${encodeURIComponent(h.name)}`)}
                className="p-4 rounded-2xl border border-slate-200/80 hover:border-green-400/80 bg-slate-50/50 hover:bg-green-50/40 transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    {h.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                    {h.mapPin?.badge || 'HOSTEL'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {h.type} · <span className="font-mono text-[10px]">{h.gps}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bento-card p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">
              📞 Campus Estate &amp; Engineering Contacts
            </h3>
          </div>

          <div className="space-y-2.5">
            {IIITNR_CAMPUS_METADATA.contacts.map((c) => (
              <div
                key={c.email}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-green-700 block">
                    {c.role}
                  </span>
                  <div className="font-bold text-slate-900">{c.name}</div>
                  <div className="text-[11px] text-slate-500">{c.office}</div>
                </div>
                <div className="text-right font-mono text-[11px] shrink-0">
                  <div className="font-bold text-slate-800">{c.phone}</div>
                  <div className="text-green-700 font-medium">{c.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
