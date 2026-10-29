/**
 * frontend/src/components/campusTwin/DigitalTwinSearchBar.jsx
 *
 * Smart Omni-Search & Auto-Detector Bar for the IIIT Naya Raipur Digital Twin.
 * Lets users type any building name, room code ("303", "131C", "210", "314", "A-204"),
 * lab name ("VLSI", "AIDL", "Networks", "IDEA Lab"), or facility ("Canteen", "Auditorium", "FG"),
 * and immediately displays its Floor, Wing, Room, and coordinates while panning the map.
 */
import React from 'react';
import { Search, X, Crosshair } from 'lucide-react';

const QUICK_SEARCH_CHIPS = [
  { label: 'Room 131C (Data Centre)', query: '131c' },
  { label: 'Room 303 (VLSI Lab)', query: '303' },
  { label: 'Room 210 (AIDL Lab)', query: '210' },
  { label: 'Room 314 (ISBN Lab)', query: '314' },
  { label: 'Room 132 (Data Science / Networks)', query: '132' },
  { label: 'Auditorium', query: 'auditorium' },
  { label: 'Canteen Rotunda', query: 'canteen' },
  { label: 'Football Ground (FG)', query: 'football ground' },
];

export default function DigitalTwinSearchBar({
  searchQuery,
  setSearchQuery,
  isSearchFocused,
  setIsSearchFocused,
  searchResults,
  onSelectSearchResult,
  autoDetectNotice,
  setAutoDetectNotice,
}) {
  return (
    <div className="p-3.5 bg-slate-900/95 border-b border-slate-800 relative z-20 space-y-2">
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              placeholder="Search or Auto-Detect any Building, Lab, Room No., or Hostel (e.g. '303', '131C', 'VLSI', 'AIDL', 'Auditorium', 'Canteen', 'A-204')..."
              className="w-full px-4 py-2.5 pl-10 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400 transition-all font-sans"
            />
            <Search size={14} className="absolute left-3.5 top-3 text-zinc-400" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#A7AD89] animate-ping" />
            <span>Auto-Locate Ready</span>
          </div>
        </div>

        {/* Quick Search Chips for Instant Lab / Building Lookup */}
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 shrink-0">
            Quick Locate:
          </span>
          {QUICK_SEARCH_CHIPS.map((chip) => (
            <button
              key={chip.query}
              type="button"
              onClick={() => {
                setSearchQuery(chip.query);
                setIsSearchFocused(true);
              }}
              className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-sky-300 border border-slate-800 text-[10px] font-medium shrink-0 cursor-pointer transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Live Search & Auto-Detect Dropdown */}
        {isSearchFocused && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-30 divide-y divide-slate-800/80 max-h-80 overflow-y-auto">
            <div className="px-3.5 py-2 bg-slate-900/90 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Matched Digital Twin Locations ({searchResults.length})</span>
              <span className="text-sky-400">Click to Auto-Pan & Show Floor/Room Details</span>
            </div>
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectSearchResult(item)}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-900/90 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {item.badge}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                      {item.title}
                    </span>
                    {item.floorLabel && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#8C906D]/20 text-[#DAD0C6] border border-[#8C906D]/30">
                        {item.floorLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                </div>
                <span className="text-[11px] font-mono text-sky-400 shrink-0 opacity-80 group-hover:opacity-100 inline-flex items-center gap-1">
                  <span>Locate</span>
                  <Crosshair size={12} />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Auto-Detected Location Detail Card */}
      {autoDetectNotice && (
        <div className="px-3.5 py-2.5 rounded-xl bg-sky-500/15 border border-sky-400/40 flex flex-wrap items-center justify-between gap-2 text-xs text-sky-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-sky-500 text-slate-950 font-black text-[10px] uppercase inline-flex items-center gap-1">
              <Crosshair size={11} />
              <span>Located on Twin</span>
            </span>
            <span className="font-bold text-white">{autoDetectNotice.building}</span>
            <span className="text-sky-300">·</span>
            <span className="px-2 py-0.5 rounded bg-slate-900/90 border border-sky-400/30 text-[#A7AD89] font-mono text-[11px]">
              {autoDetectNotice.floor}
            </span>

            {autoDetectNotice.room && (
              <span className="font-bold text-amber-300">→ {autoDetectNotice.room}</span>
            )}
            <span className="text-slate-400 font-mono text-[10px]">
              {autoDetectNotice.gps}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAutoDetectNotice(null)}
            className="text-sky-300 hover:text-white text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
