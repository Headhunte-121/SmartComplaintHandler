/**
 * SmartComplaintHandler - IIIT Naya Raipur Campus Map & Facility Command Center
 * Deep Space Obsidian Command Deck Twin Layout with Institutional Precision
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

const getBuildingCardTheme = (h) => {
  const name = (h.name || '').toLowerCase();
  const category = (h.category || '').toUpperCase();

  if (
    name.includes('football') ||
    name.includes('sports') ||
    name.includes('court') ||
    name.includes('amphi') ||
    category === 'INFRASTRUCTURE'
  ) {
    return { icon: '⚽' };
  }

  if (name.includes('park') || name.includes('guest') || name.includes('lawn')) {
    return { icon: '🌿' };
  }

  if (
    category === 'ACADEMIC' ||
    category === 'AMENITY' ||
    name.includes('academic') ||
    name.includes('canteen') ||
    name.includes('auditorium')
  ) {
    return { icon: '🏛️' };
  }

  return { icon: '🛏️' };
};

const getContactTheme = (c) => {
  const role = (c.role || '').toLowerCase();
  if (role.includes('electrical')) return { icon: '⚡' };
  if (role.includes('sr. network') || role.includes('core')) return { icon: '📶' };
  if (role.includes('network') || role.includes('noc')) return { icon: '🌐' };
  return { icon: '🏢' };
};

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
    <div className="w-full min-h-screen flex flex-col space-y-0 bg-[#090d14] text-white relative font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      {/* Ambient Lighting Gradients */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.05),transparent_40%)]" />
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />

      {/* Obsidian Command Deck Hero Header */}
      <div className="w-full px-4 sm:px-8 lg:px-12 py-7 relative z-10 border-b border-white/[0.08] bg-[#0c1017]/80 backdrop-blur-xl">
        <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-xs shadow-cyan-400" />
              <span>IIIT Naya Raipur · Sector 24, Atal Nagar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              Campus Digital Twin &amp; Facility Command Desk
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Explore campus buildings, hostels, and academic facilities in interactive GIS space, or dispatch a verified maintenance work order with real-time AI triage.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Link
                to={`/submit?building=${encodeURIComponent(selectedMapBuilding)}`}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all inline-flex items-center gap-2 cursor-pointer border border-cyan-400/30"
              >
                <span>+ Report Issue ({selectedMapBuilding.split(' (')[0]})</span>
              </Link>
              {isStudent && (
                <Link
                  to="/student"
                  className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-500/30 text-zinc-300 hover:text-white font-semibold text-xs transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  My Issues →
                </Link>
              )}
              {canAccessOperations && (
                <Link
                  to="/operations"
                  className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-500/30 text-zinc-300 hover:text-white font-semibold text-xs transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  Operations Desk →
                </Link>
              )}
              {isSuperAdmin && (
                <Link
                  to="/superadmin"
                  className="px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-purple-200 font-semibold text-xs transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  Directorate Console →
                </Link>
              )}
              {isTechnician && (
                <Link
                  to="/technician"
                  className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 font-semibold text-xs transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  Work Orders →
                </Link>
              )}
            </div>
          </div>

          <form
            onSubmit={handleTrackSubmit}
            className="flex items-center gap-2 p-1.5 rounded-xl border border-white/[0.08] bg-[#0e131f]/90 backdrop-blur-md focus-within:border-cyan-500/50 shadow-lg shadow-black/40 w-full lg:w-auto"
          >
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Track Code (e.g. SCH-...)"
              className="w-full sm:w-56 px-3.5 py-2 rounded-lg text-xs font-mono bg-[#090d14] border border-white/[0.06] text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer shrink-0"
            >
              Track →
            </button>
          </form>
        </div>
      </div>

      {/* Flush Interactive Digital Twin Map */}
      <div className="w-full relative z-10">
        <CampusMapSelector
          flush={true}
          selectedBuilding={selectedMapBuilding}
          onSelectBuilding={setSelectedMapBuilding}
          studentSavedHostel={currentUser?.hostel_name}
          studentSavedRoom={currentUser?.room_number}
        />
      </div>

      {/* Hostels & Campus Engineering Contacts Grid */}
      <div className="w-full px-4 sm:px-8 lg:px-12 py-10 relative z-10 bg-transparent">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Hostels & Campus Spots */}
          <div className="lg:col-span-7 p-6 sm:p-7 space-y-5 rounded-2xl bg-[#0e131f]/80 backdrop-blur-md border border-white/[0.08] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🏢</span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    IIIT-NR Hostels &amp; Campus Spots
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Click any spot to select and report a verified issue
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Live Navigator
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {hostels.map((h) => {
                const theme = getBuildingCardTheme(h);
                return (
                  <div
                    key={h.id}
                    onClick={() => {
                      setSelectedMapBuilding(h.name);
                      navigate(`/submit?building=${encodeURIComponent(h.name)}`);
                    }}
                    className="p-3.5 rounded-xl bg-[#0a0d14]/70 hover:bg-[#121927] border border-white/[0.06] hover:border-cyan-500/40 transition-all cursor-pointer space-y-2 group shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{theme.icon}</span>
                        <span className="font-bold text-xs sm:text-sm text-zinc-200 group-hover:text-cyan-300 transition-colors truncate">
                          {h.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.05] text-cyan-300 shrink-0">
                        {h.mapPin?.badge || 'SPOT'}
                      </span>
                    </div>
                    <div className="text-[11px] flex items-center justify-between text-zinc-400 group-hover:text-zinc-300 transition-colors">
                      <span>{h.type}</span>
                      <span className="font-mono text-[10px] text-zinc-500 group-hover:text-cyan-400/80 transition-colors">
                        {h.gps}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Campus Estate & Engineering Contacts */}
          <div className="lg:col-span-5 p-6 sm:p-7 space-y-5 rounded-2xl bg-[#0e131f]/80 backdrop-blur-md border border-white/[0.08] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📞</span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Campus Estate &amp; Engineering Contacts
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Duty facility engineers for urgent maintenance escalations
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                24/7 Support
              </span>
            </div>

            <div className="space-y-3">
              {IIITNR_CAMPUS_METADATA.contacts.map((c) => {
                const theme = getContactTheme(c);
                return (
                  <div
                    key={c.email}
                    className="p-3.5 rounded-xl bg-[#0a0d14]/70 hover:bg-[#121927] border border-white/[0.06] hover:border-white/[0.12] flex items-start justify-between gap-3 text-xs transition-all shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{theme.icon}</span>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                          {c.role}
                        </span>
                      </div>
                      <div className="font-bold text-sm text-white">{c.name}</div>
                      <div className="text-[11px] text-zinc-400">{c.office}</div>
                    </div>
                    <div className="text-right font-mono text-[11px] shrink-0 space-y-1.5">
                      <a
                        href={`tel:${c.phone}`}
                        className="font-semibold px-2.5 py-1 rounded-lg border border-white/[0.08] bg-white/[0.06] hover:bg-white/[0.1] hover:border-cyan-500/30 text-zinc-100 block transition-all shadow-xs"
                      >
                        📞 {c.phone}
                      </a>
                      <a
                        href={`mailto:${c.email}`}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 block hover:underline truncate max-w-[150px]"
                      >
                        {c.email}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
