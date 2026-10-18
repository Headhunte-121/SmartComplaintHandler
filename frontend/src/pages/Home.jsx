/**
 * SmartComplaintHandler - IIIT Naya Raipur Campus Map & Facility Command Center
 * Flush Edge-to-Edge Dark Command Twin Layout with Consistent Institutional Palette
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  const { isDark } = useTheme();
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
    <div className={`w-full min-h-screen flex flex-col space-y-0 transition-colors ${isDark ? 'bg-[#0e1117] text-zinc-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      {/* Matte Command Deck Hero Header */}
      <div className={`w-full px-4 sm:px-8 lg:px-12 py-8 relative border-b transition-colors ${
        isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border ${
              isDark
                ? 'bg-zinc-800/80 border-zinc-700 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>IIIT Naya Raipur · Sector 24, Atal Nagar</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${
              isDark ? 'text-zinc-100' : 'text-slate-900'
            }`}>
              Campus Digital Twin &amp; Maintenance Desk
            </h1>
            <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${
              isDark ? 'text-zinc-400' : 'text-slate-600'
            }`}>
              Explore campus buildings, hostels, and academic facilities in interactive GIS space, or dispatch a verified maintenance work order with real-time AI triage.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Link
                to={`/submit?building=${encodeURIComponent(selectedMapBuilding)}`}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer border border-emerald-600"
              >
                <span>+ Submit Issue ({selectedMapBuilding.split(' (')[0]})</span>
              </Link>
              {isStudent && (
                <Link
                  to="/student"
                  className={`px-4 py-2 rounded-lg border font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-2 ${
                    isDark
                      ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                  }`}
                >
                  My Issues →
                </Link>
              )}
              {canAccessOperations && (
                <Link
                  to="/admin"
                  className={`px-4 py-2 rounded-lg border font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-2 ${
                    isDark
                      ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                  }`}
                >
                  Operations Desk →
                </Link>
              )}
              {isSuperAdmin && (
                <Link
                  to="/superadmin"
                  className={`px-4 py-2 rounded-lg border font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-2 ${
                    isDark
                      ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-purple-300 hover:text-purple-200'
                      : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800'
                  }`}
                >
                  Directorate Console →
                </Link>
              )}
              {isTechnician && (
                <Link
                  to="/technician"
                  className={`px-4 py-2 rounded-lg border font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-2 ${
                    isDark
                      ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                  }`}
                >
                  Work Orders →
                </Link>
              )}
            </div>
          </div>

          <form
            onSubmit={handleTrackSubmit}
            className={`flex items-center gap-2 p-1.5 rounded-xl border w-full lg:w-auto ${
              isDark ? 'bg-[#0e1117] border-zinc-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Track Code (e.g. SCH-...)"
              className={`w-full sm:w-56 px-3.5 py-2 rounded-lg text-xs font-mono border focus:outline-none transition-colors ${
                isDark
                  ? 'bg-[#161b22] border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
              }`}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
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
      <div className={`w-full px-4 sm:px-8 lg:px-12 py-10 transition-colors ${
        isDark ? 'bg-[#0e1117]' : 'bg-[#f8fafc]'
      }`}>
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Hostels & Campus Spots */}
          <div className={`lg:col-span-7 p-6 sm:p-7 space-y-5 rounded-2xl border transition-colors ${
            isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${
              isDark ? 'border-zinc-800' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🏢</span>
                <div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                    IIIT-NR Hostels &amp; Campus Spots
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Click any spot to select and report an issue
                  </p>
                </div>
              </div>
              <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-lg border ${
                isDark
                  ? 'text-emerald-400 bg-zinc-800/80 border-zinc-700'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}>
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
                    className={`p-3.5 rounded-xl border transition-colors cursor-pointer space-y-2 group ${
                      isDark
                        ? 'bg-[#0e1117] border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{theme.icon}</span>
                        <span className={`font-bold text-xs sm:text-sm truncate ${
                          isDark ? 'text-zinc-200 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-950'
                        }`}>
                          {h.name}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${
                        isDark
                          ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          : 'bg-slate-200 text-slate-700 border-slate-300'
                      }`}>
                        {h.mapPin?.badge || 'SPOT'}
                      </span>
                    </div>
                    <div className={`text-[11px] flex items-center justify-between ${
                      isDark ? 'text-zinc-400' : 'text-slate-500'
                    }`}>
                      <span>{h.type}</span>
                      <span className={`font-mono text-[10px] ${
                        isDark ? 'text-zinc-500 group-hover:text-zinc-400' : 'text-slate-400 group-hover:text-slate-600'
                      }`}>
                        {h.gps}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Campus Estate & Engineering Contacts */}
          <div className={`lg:col-span-5 p-6 sm:p-7 space-y-5 rounded-2xl border transition-colors ${
            isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${
              isDark ? 'border-zinc-800' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📞</span>
                <div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                    Campus Estate &amp; Engineering Contacts
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Duty engineers for emergency facility escalations
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
                isDark
                  ? 'text-zinc-400 bg-zinc-800 border-zinc-700'
                  : 'text-slate-600 bg-slate-100 border-slate-200'
              }`}>
                24/7 Support
              </span>
            </div>

            <div className="space-y-3">
              {IIITNR_CAMPUS_METADATA.contacts.map((c) => {
                const theme = getContactTheme(c);
                return (
                  <div
                    key={c.email}
                    className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs transition-colors ${
                      isDark
                        ? 'bg-[#0e1117] border-zinc-800 hover:border-zinc-700'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{theme.icon}</span>
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isDark
                            ? 'bg-zinc-800 text-emerald-400 border-zinc-700'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {c.role}
                        </span>
                      </div>
                      <div className={`font-bold text-sm ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{c.name}</div>
                      <div className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{c.office}</div>
                    </div>
                    <div className="text-right font-mono text-[11px] shrink-0 space-y-1.5">
                      <a
                        href={`tel:${c.phone}`}
                        className={`font-semibold px-2.5 py-1 rounded-lg border block transition-colors ${
                          isDark
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-2xs'
                        }`}
                      >
                        📞 {c.phone}
                      </a>
                      <a
                        href={`mailto:${c.email}`}
                        className="text-[10px] text-emerald-500 hover:text-emerald-400 block hover:underline truncate max-w-[150px]"
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
