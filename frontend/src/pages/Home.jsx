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
      {/* Compact Dark Action Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0F1A14] via-[#14221B] to-[#0F1A14] text-[#FAF7F2] p-6 sm:p-8 shadow-xl border border-[rgba(167,173,137,0.25)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#A7AD89]/15 border border-[#A7AD89]/30 text-[#FAF7F2] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#A7AD89] animate-pulse" />
            <span>IIIT Naya Raipur · Sector 24, Atal Nagar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#FAF7F2]">
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
                className="px-4 py-2 rounded-xl bg-[#8F755E]/20 hover:bg-[#8F755E]/30 border border-[#8F755E]/40 text-[#DAD0C6] font-bold text-xs"
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
          className="flex items-center gap-2 bg-[#0A120E] p-2.5 rounded-2xl border border-[rgba(218,208,198,0.12)] w-full lg:w-auto"
        >
          <input
            type="text"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            placeholder="Track Code (e.g. SCH-...)"
            className="w-full sm:w-52 px-3.5 py-2.5 rounded-xl bg-[#0F1A14] border border-[rgba(218,208,198,0.14)] text-[#FAF7F2] placeholder-[#8C906D]/70 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#A7AD89]"
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
          <div className="flex items-center justify-between border-b border-[rgba(167,173,137,0.15)] pb-3">
            <h3 className="text-base font-black text-[#FAF7F2]">
              🏠 IIIT-NR Hostels (Floors G–3)
            </h3>
            <span className="text-[11px] font-mono font-bold text-[#FAF7F2] bg-[#A7AD89]/15 border border-[#A7AD89]/30 px-2.5 py-1 rounded-lg">
              Click to Report
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hostels.map((h) => (
              <div
                key={h.id}
                onClick={() => navigate(`/submit?building=${encodeURIComponent(h.name)}`)}
                className="p-4 rounded-2xl border border-[rgba(167,173,137,0.15)] hover:border-[#A7AD89]/50 bg-[#0A120E] hover:bg-[#A7AD89]/10 transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#FAF7F2] text-xs sm:text-sm">
                    {h.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0F1A14] border border-[#8C906D]/30 text-[#DAD0C6]">
                    {h.mapPin?.badge || 'HOSTEL'}
                  </span>
                </div>
                <div className="text-[11px] text-[#DAD0C6]/70">
                  {h.type} · <span className="font-mono text-[10px]">{h.gps}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bento-card p-6 space-y-4">
          <div className="border-b border-[rgba(167,173,137,0.15)] pb-3">
            <h3 className="text-base font-black text-[#FAF7F2]">
              📞 Campus Estate &amp; Engineering Contacts
            </h3>
          </div>

          <div className="space-y-2.5">
            {IIITNR_CAMPUS_METADATA.contacts.map((c) => (
              <div
                key={c.email}
                className="p-3.5 rounded-2xl bg-[#0A120E] border border-[rgba(218,208,198,0.1)] flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A7AD89] block">
                    {c.role}
                  </span>
                  <div className="font-bold text-[#FAF7F2]">{c.name}</div>
                  <div className="text-[11px] text-[#DAD0C6]/70">{c.office}</div>
                </div>
                <div className="text-right font-mono text-[11px] shrink-0">
                  <div className="font-bold text-[#DAD0C6]">{c.phone}</div>
                  <div className="text-[#A7AD89]">{c.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
