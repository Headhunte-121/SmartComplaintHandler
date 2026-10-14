/**
 * SmartComplaintHandler - Interactive IIIT Naya Raipur Campus Master Plan & Live Satellite Map Selector
 * Features:
 * 1. Interactive SVG Master Plan of IIIT Naya Raipur (Plot No. 7, Sector 24, Atal Nagar) with clickable
 *    Hostels (Ramanujan, Bhabha, Bose, Raman, Shabhari, Transit) and Academic/Amenity Blocks (Academic Block, KRC, SAC, Mess, Sports/Substation).
 * 2. Live OpenStreetMap / Google Maps Satellite view centered on IIIT Naya Raipur (21.1284° N, 81.7661° E).
 * 3. Structured Wing, Floor, and Room Number selector so students can pinpoint their exact room or corridor utility.
 */
import React, { useState } from 'react';
import {
  ALL_IIITNR_BUILDINGS,
  IIITNR_CAMPUS_METADATA,
  IIITNR_HOSTELS,
  IIITNR_ACADEMIC_BLOCKS,
} from '../data/iiitnrCampusData';

export default function CampusMapSelector({
  selectedBuilding,
  onSelectBuilding,
  selectedRoom = '',
  onSelectRoom,
  studentSavedHostel = '',
  studentSavedRoom = '',
  compact = false,
}) {
  const [mapMode, setMapMode] = useState('blueprint'); // 'blueprint' | 'osm'
  const [hoveredBuildingId, setHoveredBuildingId] = useState(null);

  const activeBuildingObj =
    ALL_IIITNR_BUILDINGS.find(
      (b) => b.name === selectedBuilding || b.id === selectedBuilding || b.shortName === selectedBuilding
    ) || ALL_IIITNR_BUILDINGS[0];

  const hoveredObj =
    ALL_IIITNR_BUILDINGS.find((b) => b.id === hoveredBuildingId) || activeBuildingObj;

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* Top Bar: Map Header & Mode Switcher */}
      <div className="px-4 sm:px-5 py-3.5 bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-black tracking-tight text-white">
                IIIT Naya Raipur Interactive Campus Map
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Sector 24 • 21.1284° N, 81.7661° E
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Click any Hostel or Academic Block on the map to select its floors &amp; room numbers
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMapMode('blueprint')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              mapMode === 'blueprint'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🗺️ Interactive Master Plan
          </button>
          <button
            type="button"
            onClick={() => setMapMode('osm')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              mapMode === 'osm'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🛰️ Live Street Map (GPS)
          </button>
        </div>
      </div>

      {/* Quick Hostel & Building Pill Bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto">
        {studentSavedHostel && (
          <button
            type="button"
            onClick={() => {
              onSelectBuilding && onSelectBuilding(studentSavedHostel);
              if (studentSavedRoom && onSelectRoom) {
                onSelectRoom(studentSavedRoom);
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 flex items-center space-x-1 shadow-2xs cursor-pointer"
          >
            <span>🏠 My Room ({studentSavedHostel.split(' ')[0]} • {studentSavedRoom || 'Saved'})</span>
          </button>
        )}

        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 shrink-0">
          Hostels:
        </span>
        {IIITNR_HOSTELS.map((h) => {
          const isSelected = activeBuildingObj.id === h.id;
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => onSelectBuilding && onSelectBuilding(h.name)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-700'
              }`}
            >
              {h.shortName}
            </button>
          );
        })}

        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 shrink-0">
          Campus:
        </span>
        {IIITNR_ACADEMIC_BLOCKS.map((b) => {
          const isSelected = activeBuildingObj.id === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelectBuilding && onSelectBuilding(b.name)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
                isSelected
                  ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:text-sky-700'
              }`}
            >
              {b.shortName}
            </button>
          );
        })}
      </div>

      {/* Main Map Viewport */}
      {mapMode === 'blueprint' ? (
        <div className="relative bg-slate-900 p-3 sm:p-4">
          <svg
            viewBox="0 0 840 380"
            className="w-full h-auto rounded-2xl bg-slate-950 border border-slate-800 shadow-inner select-none"
            role="img"
            aria-label="IIIT Naya Raipur 50-Acre Campus Master Plan Map"
          >
            <defs>
              <pattern id="iiitnrGrid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path
                  d="M 28 0 L 0 0 0 28"
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.08)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>

            {/* Architectural Grid Background */}
            <rect width="840" height="380" fill="url(#iiitnrGrid)" />

            {/* Campus Perimeter Boundary (50-Acre Plot No. 7, Sector 24) */}
            <rect
              x="24"
              y="22"
              width="792"
              height="336"
              rx="20"
              fill="rgba(15, 23, 42, 0.7)"
              stroke="rgba(99, 102, 241, 0.35)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />

            {/* Campus Internal Road Network */}
            <path
              d="M 400 356 L 400 160 M 80 228 L 780 228 M 80 158 L 620 158 M 625 75 L 625 340"
              stroke="rgba(71, 85, 105, 0.55)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 400 356 L 400 160 M 80 228 L 780 228 M 80 158 L 620 158 M 625 75 L 625 340"
              stroke="rgba(148, 163, 184, 0.25)"
              strokeWidth="1.5"
              strokeDasharray="5 5"
              strokeLinecap="round"
            />

            {/* Zone Labels */}
            <text x="45" y="48" fill="#94a3b8" fontSize="11" fontWeight="bold" letterSpacing="1">
              NORTH RESIDENTIAL ZONE — BOYS HOSTELS (RAMANUJAN • BHABHA • BOSE)
            </text>
            <text x="635" y="48" fill="#f472b6" fontSize="11" fontWeight="bold" letterSpacing="1">
              EAST ZONE — GIRLS HOSTELS
            </text>
            <text x="45" y="346" fill="#38bdf8" fontSize="10" fontWeight="bold">
              PLOT NO. 7, SECTOR 24, NEAR PURKHOTI MUKTANGAN, ATAL NAGAR – NAVA RAIPUR (C.G.)
            </text>

            {/* Main Gate No. 1 Marker at Bottom Center */}
            <g transform="translate(345, 336)">
              <rect x="0" y="0" width="115" height="22" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="57" y="14" textAnchor="middle" fill="#e2e8f0" fontSize="9.5" fontWeight="bold">
                ⛩️ MAIN GATE NO. 1
              </text>
            </g>

            {/* Render Clickable Campus Buildings & Hostels */}
            {ALL_IIITNR_BUILDINGS.map((b) => {
              const { x, y, width, height, color, badge } = b.mapZone;
              const isSelected = activeBuildingObj.id === b.id;
              const isHovered = hoveredBuildingId === b.id;

              return (
                <g
                  key={b.id}
                  onClick={() => onSelectBuilding && onSelectBuilding(b.name)}
                  onMouseEnter={() => setHoveredBuildingId(b.id)}
                  onMouseLeave={() => setHoveredBuildingId(null)}
                  className="cursor-pointer transition-all"
                >
                  {/* Selection Glow Halo */}
                  {(isSelected || isHovered) && (
                    <rect
                      x={x - 4}
                      y={y - 4}
                      width={width + 8}
                      height={height + 8}
                      rx="14"
                      fill="none"
                      stroke={isSelected ? '#38bdf8' : '#a5b4fc'}
                      strokeWidth={isSelected ? '3' : '2'}
                    />
                  )}

                  {/* Building Footprint */}
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx="10"
                    fill={isSelected ? color : 'rgba(30, 41, 59, 0.92)'}
                    stroke={isSelected ? '#ffffff' : color}
                    strokeWidth={isSelected ? '2.5' : '1.8'}
                  />

                  {/* Badge Pill */}
                  <rect
                    x={x + 8}
                    y={y + 8}
                    width="42"
                    height="16"
                    rx="4"
                    fill={isSelected ? 'rgba(15, 23, 42, 0.45)' : color}
                  />
                  <text
                    x={x + 29}
                    y={y + 19}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    {badge}
                  </text>

                  {/* Active Pin Indicator */}
                  {isSelected && (
                    <circle cx={x + width - 14} cy={y + 16} r="5" fill="#4ade80" />
                  )}

                  {/* Building Short Name */}
                  <text
                    x={x + 10}
                    y={y + 39}
                    fill="#ffffff"
                    fontSize="11.5"
                    fontWeight="bold"
                  >
                    {b.shortName}
                  </text>

                  {/* Building Sub-label */}
                  <text
                    x={x + 10}
                    y={y + 53}
                    fill={isSelected ? '#e0f2fe' : '#94a3b8'}
                    fontSize="9.5"
                  >
                    {b.type}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Bottom Selected Building Telemetry Strip */}
          <div className="mt-3 p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-mono text-[10px] font-bold">
                  {hoveredObj.mapZone.badge}
                </span>
                <span className="font-black text-white text-sm">
                  {hoveredObj.name}
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  ({hoveredObj.gps})
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {hoveredObj.description}
              </p>
            </div>

            {selectedRoom && (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-mono text-xs font-bold shrink-0">
                📍 Target: {selectedRoom}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Live OpenStreetMap / GPS Satellite Embed for IIIT Naya Raipur */
        <div className="bg-slate-900 p-3 sm:p-4 space-y-3">
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 h-64 sm:h-72 relative">
            <iframe
              title="IIIT Naya Raipur Official Campus Map (Sector 24, Atal Nagar)"
              src={IIITNR_CAMPUS_METADATA.osmEmbedUrl}
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 px-1">
            <div>
              <span className="font-bold text-white">{IIITNR_CAMPUS_METADATA.instituteName}</span> —{' '}
              <span className="text-slate-400">{IIITNR_CAMPUS_METADATA.address}</span>
            </div>
            <a
              href={IIITNR_CAMPUS_METADATA.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-all"
            >
              Open in Google Maps ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
