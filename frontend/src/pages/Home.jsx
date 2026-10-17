/**
 * SmartComplaintHandler - IIIT Naya Raipur Campus Map & Hostel Hub
 * Rich Secondary (Emerald/Teal) & Tertiary (Amber, Sky, Indigo) Accent Theme
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

  // Sports & Recreation (Football, Basketball, Sports, Courts, Amphitheater)
  if (
    name.includes('football') ||
    name.includes('sports') ||
    name.includes('court') ||
    name.includes('amphi') ||
    category === 'INFRASTRUCTURE'
  ) {
    return {
      cardCls:
        'bg-gradient-to-br from-emerald-100/90 via-emerald-50 to-teal-50/70 border-2 border-emerald-300 hover:border-emerald-500 text-emerald-950 shadow-xs hover:shadow-md hover:-translate-y-0.5',
      badgeCls: 'bg-emerald-700 text-white font-black border border-emerald-600',
      icon: '⚽',
      subCls: 'text-emerald-800/80 font-medium',
      gpsCls: 'text-emerald-700 font-bold',
    };
  }

  // Parks, Green Lawns, Guest House (Palm Park, Aranya)
  if (name.includes('park') || name.includes('guest') || name.includes('lawn')) {
    return {
      cardCls:
        'bg-gradient-to-br from-sky-100/90 via-sky-50 to-cyan-50/70 border-2 border-sky-300 hover:border-sky-500 text-sky-950 shadow-xs hover:shadow-md hover:-translate-y-0.5',
      badgeCls: 'bg-sky-700 text-white font-black border border-sky-600',
      icon: '🌿',
      subCls: 'text-sky-800/80 font-medium',
      gpsCls: 'text-sky-700 font-bold',
    };
  }

  // Academic / Amenity / Cultural
  if (
    category === 'ACADEMIC' ||
    category === 'AMENITY' ||
    name.includes('academic') ||
    name.includes('canteen') ||
    name.includes('auditorium')
  ) {
    return {
      cardCls:
        'bg-gradient-to-br from-indigo-100/90 via-indigo-50 to-violet-50/70 border-2 border-indigo-300 hover:border-indigo-500 text-indigo-950 shadow-xs hover:shadow-md hover:-translate-y-0.5',
      badgeCls: 'bg-indigo-700 text-white font-black border border-indigo-600',
      icon: '🏛️',
      subCls: 'text-indigo-800/80 font-medium',
      gpsCls: 'text-indigo-700 font-bold',
    };
  }

  // Default: Student Residential Hostels (Warm Amber / Sand Tone)
  return {
    cardCls:
      'bg-gradient-to-br from-amber-100/90 via-amber-50 to-orange-50/70 border-2 border-amber-300 hover:border-amber-500 text-amber-950 shadow-xs hover:shadow-md hover:-translate-y-0.5',
    badgeCls: 'bg-amber-600 text-white font-black border border-amber-500',
    icon: '🛏️',
    subCls: 'text-amber-800/80 font-medium',
    gpsCls: 'text-amber-700 font-bold',
  };
};

const getContactTheme = (c) => {
  const role = (c.role || '').toLowerCase();
  if (role.includes('electrical')) {
    return {
      cardCls:
        'bg-gradient-to-br from-amber-100/90 via-amber-50 to-yellow-100/50 border-2 border-amber-400 text-amber-950 shadow-xs hover:shadow-md',
      tagCls: 'bg-amber-600 text-white',
      icon: '⚡',
      phoneCls: 'text-amber-900',
      emailCls: 'text-amber-800',
    };
  }
  if (role.includes('sr. network') || role.includes('core')) {
    return {
      cardCls:
        'bg-gradient-to-br from-indigo-100/90 via-indigo-50 to-blue-100/50 border-2 border-indigo-400 text-indigo-950 shadow-xs hover:shadow-md',
      tagCls: 'bg-indigo-700 text-white',
      icon: '📶',
      phoneCls: 'text-indigo-900',
      emailCls: 'text-indigo-800',
    };
  }
  if (role.includes('network') || role.includes('noc')) {
    return {
      cardCls:
        'bg-gradient-to-br from-sky-100/90 via-sky-50 to-cyan-100/50 border-2 border-sky-400 text-sky-950 shadow-xs hover:shadow-md',
      tagCls: 'bg-sky-700 text-white',
      icon: '🌐',
      phoneCls: 'text-sky-900',
      emailCls: 'text-sky-800',
    };
  }
  // Estate Officer (Civil / Infrastructure)
  return {
    cardCls:
      'bg-gradient-to-br from-emerald-100/90 via-emerald-50 to-teal-100/50 border-2 border-emerald-400 text-emerald-950 shadow-xs hover:shadow-md',
    tagCls: 'bg-emerald-700 text-white',
    icon: '🏢',
    phoneCls: 'text-emerald-900',
    emailCls: 'text-emerald-800',
  };
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
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      {/* Rich Secondary/Tertiary Command Deck Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white p-7 sm:p-8 shadow-xl border-2 border-emerald-600/50 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Ambient background glow auras */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

        <div className="space-y-2.5 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>IIIT Naya Raipur · Sector 24, Atal Nagar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Campus Digital Twin &amp; Maintenance Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Explore campus buildings, hostels, and facilities in interactive 2D GIS space, or dispatch a verified maintenance work order with real-time AI triage.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <Link
              to={`/submit?building=${encodeURIComponent(selectedMapBuilding)}`}
              className="btn-botanical-primary"
            >
              + Submit Issue ({selectedMapBuilding.split(' (')[0]})
            </Link>
            {isStudent && (
              <Link
                to="/student"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border-2 border-white/20 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                My Issues →
              </Link>
            )}
            {canAccessOperations && (
              <Link
                to="/admin"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border-2 border-white/20 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                Operations Desk →
              </Link>
            )}
            {isSuperAdmin && (
              <Link
                to="/superadmin"
                className="px-4 py-2.5 rounded-xl bg-purple-500/25 hover:bg-purple-500/35 border-2 border-purple-400/50 text-purple-200 font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                Directorate Console →
              </Link>
            )}
            {isTechnician && (
              <Link
                to="/technician"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border-2 border-white/20 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                Work Orders →
              </Link>
            )}
          </div>
        </div>

        <form
          onSubmit={handleTrackSubmit}
          className="flex items-center gap-2 bg-slate-950/90 p-2.5 rounded-2xl border-2 border-slate-700/80 w-full lg:w-auto shadow-inner relative z-10"
        >
          <input
            type="text"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            placeholder="Track Code (e.g. SCH-...)"
            className="w-full sm:w-56 px-4 py-2.5 rounded-xl bg-slate-900 border-2 border-slate-700 text-white placeholder-slate-400 text-xs font-mono focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
          <button
            type="submit"
            className="btn-botanical-primary shrink-0"
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

      {/* Hostels & Estate Contacts Grid with Rich Category Colors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hostels & Spots Card */}
        <div className="lg:col-span-7 bento-card p-6 space-y-4 bg-white border-2 border-slate-200/90 shadow-md rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-500" />
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏠</span>
              <h3 className="text-base font-black text-slate-900">
                IIIT-NR Hostels &amp; Campus Spots
              </h3>
            </div>
            <span className="text-[11px] font-mono font-black text-emerald-900 bg-emerald-100 border-2 border-emerald-300 px-3 py-1 rounded-xl shadow-2xs">
              Click to Report
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {hostels.map((h) => {
              const theme = getBuildingCardTheme(h);
              return (
                <div
                  key={h.id}
                  onClick={() => navigate(`/submit?building=${encodeURIComponent(h.name)}`)}
                  className={`p-4 rounded-2xl ${theme.cardCls} transition-all cursor-pointer space-y-1.5`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{theme.icon}</span>
                      <span className="font-black text-xs sm:text-sm truncate">
                        {h.name}
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg ${theme.badgeCls} shrink-0 shadow-2xs`}>
                      {h.mapPin?.badge || 'SPOT'}
                    </span>
                  </div>
                  <div className={`text-[11px] ${theme.subCls} flex items-center justify-between`}>
                    <span>{h.type}</span>
                    <span className={`font-mono text-[10px] ${theme.gpsCls}`}>
                      {h.gps}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Campus Estate Contacts Card */}
        <div className="lg:col-span-5 bento-card p-6 space-y-4 bg-white border-2 border-slate-200/90 shadow-md rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📞</span>
              <h3 className="text-base font-black text-slate-900">
                Campus Estate &amp; Engineering Contacts
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-500">
              Immediate Help
            </span>
          </div>

          <div className="space-y-3">
            {IIITNR_CAMPUS_METADATA.contacts.map((c) => {
              const theme = getContactTheme(c);
              return (
                <div
                  key={c.email}
                  className={`p-4 rounded-2xl ${theme.cardCls} flex items-start justify-between gap-3 text-xs transition-all`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{theme.icon}</span>
                      <span className={`text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${theme.tagCls} shadow-2xs`}>
                        {c.role}
                      </span>
                    </div>
                    <div className="font-black text-slate-950 text-sm">{c.name}</div>
                    <div className="text-[11px] text-slate-600 font-medium">{c.office}</div>
                  </div>
                  <div className="text-right font-mono text-[11px] shrink-0 space-y-1">
                    <a
                      href={`tel:${c.phone}`}
                      className={`font-black ${theme.phoneCls} bg-white/90 px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs block hover:underline`}
                    >
                      📞 {c.phone}
                    </a>
                    <a
                      href={`mailto:${c.email}`}
                      className={`text-[10px] font-bold ${theme.emailCls} block hover:underline truncate max-w-[150px]`}
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
  );
}
