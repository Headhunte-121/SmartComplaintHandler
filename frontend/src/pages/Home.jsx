/**
 * SmartComplaintHandler - IIIT Naya Raipur Campus Map & Hostel Hub (Obsidian-Slate & Emerald Theme)
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
      {/* Compact Botanical Action Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#111f17] via-[#16271e] to-[#111f17] text-white p-6 sm:p-8 shadow-xl bg-dark-architectural-grid border border-[#588157]/35 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-lemon-400/15 border border-lemon-400/35 text-lemon-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-lemon-400 animate-pulse" />
            <span>IIIT Naya Raipur · Sector 24, Atal Nagar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Campus Digital Twin &amp; Maintenance Desk
          </h1>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Link
              to={`/submit?building=${encodeURIComponent(selectedMapBuilding)}`}
              className="px-5 py-2.5 rounded-xl bg-garden-500 hover:bg-garden-600 text-white font-black text-xs shadow-lg shadow-garden-500/25 transition-all"
            >
              + Submit Issue ({selectedMapBuilding.split(' (')[0]})
            </Link>
            {isStudent && (
              <Link
                to="/student"
                className="px-4 py-2.5 rounded-xl bg-[#132019] hover:bg-[#1c2f25] border border-[#a3b18a]/[0.2] text-slate-200 font-bold text-xs"
              >
                My Issues →
              </Link>
            )}
            {canAccessOperations && (
              <Link
                to="/admin"
                className="px-4 py-2.5 rounded-xl bg-[#132019] hover:bg-[#1c2f25] border border-[#a3b18a]/[0.2] text-slate-200 font-bold text-xs"
              >
                Operations Desk →
              </Link>
            )}
            {isSuperAdmin && (
              <Link
                to="/superadmin"
                className="px-4 py-2.5 rounded-xl bg-lemon-400/15 hover:bg-lemon-400/25 border border-lemon-400/30 text-lemon-300 font-bold text-xs"
              >
                Directorate Console →
              </Link>
            )}
            {isTechnician && (
              <Link
                to="/technician"
                className="px-4 py-2.5 rounded-xl bg-[#132019] hover:bg-[#1c2f25] border border-[#a3b18a]/[0.2] text-slate-200 font-bold text-xs"
              >
                Work Orders →
              </Link>
            )}
          </div>
        </div>

        <form
          onSubmit={handleTrackSubmit}
          className="flex items-center gap-2 bg-[#09110d]/90 backdrop-blur-md p-2.5 rounded-2xl border border-[#a3b18a]/[0.2] w-full lg:w-auto"
        >
          <input
            type="text"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            placeholder="Track Code (e.g. SCH-...)"
            className="w-full sm:w-52 px-3.5 py-2.5 rounded-xl bg-[#0c1410] border border-[#a3b18a]/[0.25] text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-lemon-400"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-garden-500 hover:bg-garden-600 text-white font-black text-xs shrink-0 cursor-pointer shadow-sm transition-all"
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
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-black text-white">
              🏠 IIIT-NR Hostels (Floors G–3 · Wings A &amp; B)
            </h3>
            <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
              Click to Report
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hostels.map((h) => (
              <div
                key={h.id}
                onClick={() => navigate(`/submit?building=${encodeURIComponent(h.name)}`)}
                className="p-4 rounded-2xl border border-slate-800 hover:border-emerald-500/40 bg-[#090f1a] hover:bg-emerald-500/10 transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs sm:text-sm">
                    {h.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-emerald-500/30 text-emerald-300">
                    {h.mapPin?.badge || 'HOSTEL'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {h.type} · <span className="font-mono text-[10px]">{h.gps}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bento-card p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-black text-white">
              📞 Campus Estate &amp; Engineering Contacts
            </h3>
          </div>

          <div className="space-y-2.5">
            {IIITNR_CAMPUS_METADATA.contacts.map((c) => (
              <div
                key={c.email}
                className="p-3.5 rounded-2xl bg-[#090f1a] border border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">
                    {c.role}
                  </span>
                  <div className="font-bold text-white">{c.name}</div>
                  <div className="text-[11px] text-slate-400">{c.office}</div>
                </div>
                <div className="text-right font-mono text-[11px] shrink-0">
                  <div className="font-bold text-slate-200">{c.phone}</div>
                  <div className="text-emerald-400">{c.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
