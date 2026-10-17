/**
 * SmartComplaintHandler - IIIT Naya Raipur Campus Map & Facility Command Center
 * Flush Edge-to-Edge Dark Command Twin Layout with Consistent Institutional Palette
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
    <div className="w-full bg-[#080C14] text-white min-h-screen flex flex-col space-y-0 animate-fade-in">
      {/* Flush Command Deck Hero Header */}
      <div className="w-full bg-[#0B0F19] border-b border-slate-800/80 px-4 sm:px-8 lg:px-12 py-8 relative overflow-hidden">
        {/* Ambient background glow auras */}
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -top-24 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>IIIT Naya Raipur · Sector 24, Atal Nagar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Campus Digital Twin &amp; Maintenance Desk
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Explore campus buildings, hostels, and academic facilities in interactive GIS space, or dispatch a verified maintenance work order with real-time AI triage.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Link
                to={`/submit?building=${encodeURIComponent(selectedMapBuilding)}`}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:to-green-600 text-white font-black text-xs shadow-md shadow-emerald-700/30 transition-all inline-flex items-center gap-2 cursor-pointer border border-emerald-500/50 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>+ Submit Issue ({selectedMapBuilding.split(' (')[0]})</span>
              </Link>
              {isStudent && (
                <Link
                  to="/student"
                  className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  My Issues →
                </Link>
              )}
              {canAccessOperations && (
                <Link
                  to="/admin"
                  className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  Operations Desk →
                </Link>
              )}
              {isSuperAdmin && (
                <Link
                  to="/superadmin"
                  className="px-4 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-700/60 text-purple-200 font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  Directorate Console →
                </Link>
              )}
              {isTechnician && (
                <Link
                  to="/technician"
                  className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  Work Orders →
                </Link>
              )}
            </div>
          </div>

          <form
            onSubmit={handleTrackSubmit}
            className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-700/80 w-full lg:w-auto shadow-inner relative z-10"
          >
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Track Code (e.g. SCH-...)"
              className="w-full sm:w-56 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
            >
              Track →
            </button>
          </form>
        </div>
      </div>

      {/* Flush Interactive Digital Twin Map */}
      <div className="w-full">
        <CampusMapSelector
          flush={true}
          selectedBuilding={selectedMapBuilding}
          onSelectBuilding={setSelectedMapBuilding}
          studentSavedHostel={currentUser?.hostel_name}
          studentSavedRoom={currentUser?.room_number}
        />
      </div>

      {/* Flush Hostels & Campus Engineering Contacts Grid */}
      <div className="w-full bg-[#080C14] px-4 sm:px-8 lg:px-12 py-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Hostels & Campus Spots */}
          <div className="lg:col-span-7 p-6 sm:p-7 space-y-5 bg-[#0B101D] border border-slate-800 shadow-2xl rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🏢</span>
                <div>
                  <h3 className="text-base font-black text-white">
                    IIIT-NR Hostels &amp; Campus Spots
                  </h3>
                  <p className="text-[11px] text-slate-400">Click any spot to select and report an issue</p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-3 py-1 rounded-xl">
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
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/80 hover:bg-slate-850 hover:shadow-lg transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{theme.icon}</span>
                        <span className="font-bold text-xs sm:text-sm text-slate-200 group-hover:text-white truncate">
                          {h.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 group-hover:bg-emerald-950 text-emerald-400 border border-slate-700 group-hover:border-emerald-700/60 shrink-0">
                        {h.mapPin?.badge || 'SPOT'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>{h.type}</span>
                      <span className="font-mono text-[10px] text-slate-500 group-hover:text-slate-400">
                        {h.gps}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Campus Estate & Engineering Contacts */}
          <div className="lg:col-span-5 p-6 sm:p-7 space-y-5 bg-[#0B101D] border border-slate-800 shadow-2xl rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📞</span>
                <div>
                  <h3 className="text-base font-black text-white">
                    Campus Estate &amp; Engineering Contacts
                  </h3>
                  <p className="text-[11px] text-slate-400">Duty engineers for emergency facility escalations</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                24/7 Support
              </span>
            </div>

            <div className="space-y-3">
              {IIITNR_CAMPUS_METADATA.contacts.map((c) => {
                const theme = getContactTheme(c);
                return (
                  <div
                    key={c.email}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-start justify-between gap-3 text-xs transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{theme.icon}</span>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                          {c.role}
                        </span>
                      </div>
                      <div className="font-bold text-white text-sm">{c.name}</div>
                      <div className="text-[11px] text-slate-400">{c.office}</div>
                    </div>
                    <div className="text-right font-mono text-[11px] shrink-0 space-y-1.5">
                      <a
                        href={`tel:${c.phone}`}
                        className="font-bold text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 block transition-colors"
                      >
                        📞 {c.phone}
                      </a>
                      <a
                        href={`mailto:${c.email}`}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 block hover:underline truncate max-w-[150px]"
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
