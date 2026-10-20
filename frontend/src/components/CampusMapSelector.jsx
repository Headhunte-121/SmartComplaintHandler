/**
 * frontend/src/components/CampusMapSelector.jsx
 *
 * Immersive, Intuitive Interactive Campus Digital Twin Explorer.
 * Replaces static selection boxes with a living, fluid map navigation system:
 * - Fluid drag-to-pan & cursor-centered scroll-wheel zoom
 * - Double-click fly-to focus & smooth cinematic transitions
 * - Smart omni-search with auto-flyto & radar locator beam
 * - Floating glassmorphic Building Place Card with floor & room explorer
 * - Quick Explore zone filters & layer toggles (Labels, Entrances, Themes)
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  IIITNR_MAP_UPDATED_EVENT,
  getCampusBuildings,
  fetchAndCacheCampusBuildings,
  resetCampusBuildingsToDefault,
  getFloorsForBuilding,
  getRoomsForBuilding,
  inferFloorFromItem,
  EXACT_BUILDING_POLYGONS,
} from '../data/iiitnrCampusData';
import DigitalTwinCanvas from './campusTwin/DigitalTwinCanvas';
import { useMapCamera } from './campusTwin/useMapCamera';

const QUICK_EXPLORE_CHIPS = [
  { id: 'all', label: '🌐 All Campus', filter: 'ALL' },
  { id: 'academic_block', label: '🏛️ Academic Block', filter: 'ACADEMIC' },
  { id: 'canteen_block', label: '🍽️ Canteen', filter: 'AMENITY' },
  { id: 'auditorium_hall', label: '🎭 Auditorium', filter: 'AMENITY' },
  { id: 'hostels', label: '🛏️ Hostels', filter: 'HOSTEL' },
  { id: 'bldg_1792074173914', label: '⚽ Sports & Grounds', filter: 'INFRASTRUCTURE' },
];

export default function CampusMapSelector({
  selectedBuilding,
  onSelectBuilding,
  selectedRoom = '',
  onSelectRoom,
  studentSavedHostel = '',
  studentSavedRoom = '',
  flush = false,
}) {
  const { isSuperAdmin } = useAuth();
  const { isDark } = useTheme();
  const [buildings, setBuildings] = useState(() => getCampusBuildings());
  const [twinThemeOverride, setTwinThemeOverride] = useState(null);
  const twinTheme = twinThemeOverride !== null ? twinThemeOverride : (isDark ? 'architectural' : 'light');
  const [showLabels, setShowLabels] = useState(true);
  const [showPathsAndCourts, setShowPathsAndCourts] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);

  // Active Building Selection
  const [activeBuildingId, setActiveBuildingId] = useState(() => {
    const found = buildings.find(
      (b) => b.name === selectedBuilding || b.id === selectedBuilding || b.shortName === selectedBuilding
    );
    return found ? found.id : null;
  });

  // Selected Room
  const [activeRoom, setActiveRoom] = useState(selectedRoom || '');

  // Floating Place Card Visibility
  const [showPlaceCard, setShowPlaceCard] = useState(Boolean(activeBuildingId));

  // Inspector Floor State
  const [inspectorFloor, setInspectorFloor] = useState('G');

  // Search Bar State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Radar Target Beacon for Cinematic Focus
  const [radarTarget, setRadarTarget] = useState(null);

  const svgRef = useRef(null);
  const radarTimerRef = useRef(null);

  // Sync external building changes
  useEffect(() => {
    if (selectedBuilding) {
      const match = buildings.find(
        (b) => b.name === selectedBuilding || b.id === selectedBuilding || b.shortName === selectedBuilding
      );
      if (match && match.id !== activeBuildingId) {
        setActiveBuildingId(match.id);
        setShowPlaceCard(true);
      }
    }
  }, [selectedBuilding, buildings]);

  useEffect(() => {
    if (selectedRoom) {
      setActiveRoom(selectedRoom);
      const inferred = inferFloorFromItem(selectedRoom);
      if (inferred) {
        setInspectorFloor(inferred);
      }
    }
  }, [selectedRoom]);

  useEffect(() => {
    // Proactively fetch campus buildings from backend database on mount
    fetchAndCacheCampusBuildings().then((remote) => {
      if (Array.isArray(remote) && remote.length > 0) {
        setBuildings(remote);
      }
    });

    const handleUpdate = (e) => {
      if (e?.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setBuildings(e.detail);
      } else {
        setBuildings(getCampusBuildings());
      }
    };
    window.addEventListener(IIITNR_MAP_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(IIITNR_MAP_UPDATED_EVENT, handleUpdate);
  }, []);

  const activeBuildingObj = useMemo(() => {
    return buildings.find((b) => b.id === activeBuildingId) || null;
  }, [buildings, activeBuildingId]);

  const hoveredBuildingObj = useMemo(() => {
    return buildings.find((b) => b.id === hoveredId) || null;
  }, [buildings, hoveredId]);

  const availableFloors = useMemo(() => {
    if (!activeBuildingObj) return [];
    return getFloorsForBuilding(activeBuildingObj.id, buildings);
  }, [activeBuildingObj, buildings]);

  // Keep inspector floor synchronized with available floors of the active building
  useEffect(() => {
    if (availableFloors.length > 0) {
      const validIds = availableFloors.map((f) => String(f.id));
      if (!validIds.includes(String(inspectorFloor))) {
        const inferred = inferFloorFromItem(activeRoom);
        if (inferred && validIds.includes(inferred)) {
          setInspectorFloor(inferred);
        } else {
          setInspectorFloor(availableFloors[0].id);
        }
      }
    }
  }, [availableFloors, inspectorFloor, activeRoom]);

  const inspectorRooms = useMemo(() => {
    if (!activeBuildingObj) return [];
    return getRoomsForBuilding(activeBuildingObj.id, inspectorFloor, 'Wing A', buildings);
  }, [activeBuildingObj, inspectorFloor, buildings]);

  // High-precision physics camera engine hook
  const {
    zoom,
    pan,
    isPanning,
    flyTo: cameraFlyTo,
    resetView: cameraResetView,
    zoomBy,
    handleWheel,
    handleDoubleClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
  } = useMapCamera({
    svgRef,
    isPlaceCardOpen: showPlaceCard,
    minZoom: 0.75,
    maxZoom: 4.0,
  });

  // Smooth Cinematic Fly-To Camera Navigation with Locator Ring
  const flyTo = useCallback(
    (targetX, targetY, targetZoom = 1.85, options = {}) => {
      // Pulse radar locator ring
      setRadarTarget({ cx: targetX, cy: targetY });
      if (radarTimerRef.current) clearTimeout(radarTimerRef.current);
      radarTimerRef.current = setTimeout(() => {
        setRadarTarget(null);
      }, 3000);

      cameraFlyTo(targetX, targetY, targetZoom, options);
    },
    [cameraFlyTo]
  );

  // Smooth Reset to 100% Overview
  const resetView = useCallback(() => {
    setRadarTarget(null);
    cameraResetView();
  }, [cameraResetView]);

  // Handle Building Selection & Focus
  const handleSelectBuildingInternal = useCallback(
    (nameOrId, explicitId = null) => {
      const target = buildings.find(
        (b) => b.name === nameOrId || b.id === nameOrId || b.id === explicitId || b.shortName === nameOrId
      );
      if (!target) return;

      setActiveBuildingId(target.id);
      setShowPlaceCard(true);
      if (onSelectBuilding) onSelectBuilding(target.name);

      // Reset floor to G or first available
      const floors = getFloorsForBuilding(target.id, buildings);
      if (floors.length > 0) {
        setInspectorFloor(floors[0].id);
      }

      // Fly camera to building
      const P = EXACT_BUILDING_POLYGONS[target.id];
      const cx = target.trace?.cx ?? P?.cx ?? 540;
      const cy = target.trace?.cy ?? P?.cy ?? 400;
      flyTo(cx, cy, 1.85);
    },
    [buildings, onSelectBuilding, flyTo]
  );

  // Quick Search & Auto-Locate Matches
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const matches = [];
    buildings.forEach((b) => {
      const bName = b.name.toLowerCase();
      const bShort = (b.shortName || '').toLowerCase();
      const bBadge = (b.trace?.badge || '').toLowerCase();

      // Check building name
      if (bName.includes(q) || bShort.includes(q) || bBadge.includes(q)) {
        matches.push({
          type: 'BUILDING',
          title: b.name,
          subtitle: `${b.category} · ${b.gps || 'Campus Sector'}`,
          building: b,
        });
      }

      // Check rooms inside building (customRooms or floors)
      const customList = b.customRooms || b.custom_rooms;
      if (Array.isArray(customList) && customList.length > 0) {
        customList.forEach((rm) => {
          if (rm.toLowerCase().includes(q)) {
            const inferredFloor = inferFloorFromItem(rm) || (b.floors && b.floors[0]) || '1';
            const floorLabel = inferredFloor === 'G' ? 'Ground Floor' : `Floor ${inferredFloor}`;
            matches.push({
              type: 'ROOM',
              title: rm,
              subtitle: `${b.name} (${floorLabel})`,
              building: b,
              floorId: inferredFloor,
              roomName: rm,
            });
          }
        });
      } else if (Array.isArray(b.floors)) {
        b.floors.forEach((fl) => {
          if (typeof fl === 'object' && Array.isArray(fl.rooms)) {
            fl.rooms.forEach((rm) => {
              if (rm.toLowerCase().includes(q)) {
                matches.push({
                  type: 'ROOM',
                  title: rm,
                  subtitle: `${b.name} (${fl.label || `Floor ${fl.id}`})`,
                  building: b,
                  floorId: fl.id,
                  roomName: rm,
                });
              }
            });
          }
        });
      }
    });

    return matches.slice(0, 7);
  }, [searchQuery, buildings]);

  const handleSelectSearchResult = (result) => {
    setSearchQuery('');
    setIsSearchFocused(false);
    handleSelectBuildingInternal(result.building.name, result.building.id);

    if (result.type === 'ROOM') {
      if (result.floorId) setInspectorFloor(result.floorId);
      if (result.roomName) {
        setActiveRoom(result.roomName);
        if (onSelectRoom) onSelectRoom(result.roomName);
      }
    }
  };

  return (
    <div
      className={`relative select-none overflow-hidden transition-all ${
        flush
          ? isDark
            ? 'w-full rounded-none border-y border-zinc-800 bg-[#0e1117]'
            : 'w-full rounded-none border-y border-slate-200 bg-white'
          : isDark
          ? 'rounded-2xl border border-zinc-800 bg-[#161b22]'
          : 'rounded-2xl border border-slate-200 bg-white shadow-xs'
      }`}
    >
      {/* Top Floating Search & Quick Filter Bar */}
      <div className={`p-3.5 ${flush ? 'px-4 sm:px-8 lg:px-12' : ''} border-b transition-colors space-y-2.5 ${
        isDark ? 'bg-[#161b22] text-zinc-100 border-zinc-800' : 'bg-slate-50 text-slate-800 border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Omni Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search any building, lab (VLSI, AIDL), room (303, 131C), or facility..."
              className={`w-full px-4 py-2 pl-9 rounded-xl border text-xs sm:text-sm transition-colors font-sans focus:outline-none ${
                isDark
                  ? 'bg-[#0e1117] border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 shadow-2xs'
              }`}
            />
            <span className="absolute left-3 top-2 text-emerald-500 text-xs">⚡</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 top-2 text-xs font-bold cursor-pointer ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                ✕
              </button>
            )}

            {/* Live Search Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className={`absolute left-0 right-0 mt-2 border rounded-2xl shadow-xl overflow-hidden z-40 divide-y max-h-72 overflow-y-auto ${
                isDark ? 'bg-[#161b22] border-zinc-700 divide-zinc-800 text-zinc-100' : 'bg-white border-slate-200 divide-slate-100 text-slate-800'
              }`}>
                <div className={`px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-wider flex items-center justify-between ${
                  isDark ? 'bg-[#0e1117] text-zinc-400' : 'bg-slate-50 text-slate-500'
                }`}>
                  <span>Digital Twin Matches ({searchResults.length})</span>
                  <span className="text-emerald-500 font-semibold">Click to fly to spot</span>
                </div>
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    className={`w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between gap-3 cursor-pointer group ${
                      isDark ? 'hover:bg-zinc-800/80' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className={`font-bold text-xs flex items-center gap-1.5 ${
                        isDark ? 'text-zinc-100 group-hover:text-emerald-400' : 'text-slate-800 group-hover:text-emerald-600'
                      }`}>
                        <span>{res.type === 'ROOM' ? '📍' : '🏢'}</span>
                        <span>{res.title}</span>
                      </div>
                      <div className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{res.subtitle}</div>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      isDark
                        ? 'text-emerald-400 bg-zinc-800 border-zinc-700'
                        : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    }`}>
                      Fly To →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Zone Exploration Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {QUICK_EXPLORE_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  if (chip.id === 'all') {
                    resetView();
                    setActiveBuildingId(null);
                    setShowPlaceCard(false);
                  } else if (chip.id === 'hostels') {
                    const firstHostel = buildings.find((b) => b.category === 'HOSTEL');
                    if (firstHostel) handleSelectBuildingInternal(firstHostel.name, firstHostel.id);
                  } else {
                    handleSelectBuildingInternal(chip.id, chip.id);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer border ${
                  activeBuildingId === chip.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : isDark
                    ? 'bg-[#0e1117] text-zinc-300 border-zinc-700 hover:border-zinc-500 hover:text-white'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 shadow-2xs'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Map Viewport Container */}
      <div className={`relative w-full overflow-hidden touch-none overscroll-contain ${isDark ? 'bg-[#0e1117]' : 'bg-[#f4f7f4]'}`}>
        {/* SVG Digital Twin Canvas */}
        <DigitalTwinCanvas
          svgRef={svgRef}
          buildings={buildings}
          activeBuildingObj={activeBuildingObj}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onSelectBuilding={(name, id) => handleSelectBuildingInternal(name, id)}
          twinTheme={twinTheme}
          showLabels={showLabels}
          showPathsAndCourts={showPathsAndCourts}
          showBoundary={showBoundary}
          zoom={zoom}
          pan={pan}
          isPanning={isPanning}
          radarTarget={radarTarget}
          handleMouseDown={handleMouseDown}
          handleMouseMove={handleMouseMove}
          handleMouseUp={handleMouseUp}
          handleWheel={handleWheel}
          handleDoubleClick={handleDoubleClick}
          handleTouchStart={handleTouchStart}
          handleTouchMove={handleTouchMove}
          handleTouchEnd={handleTouchEnd}
          handleKeyDown={handleKeyDown}
        />

        {buildings.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-2xs z-30 pointer-events-none">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-900/90 text-zinc-100 border border-zinc-700 shadow-xl">
              <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium tracking-wide">Connecting to campus database...</span>
            </div>
          </div>
        )}

        {/* Floating Camera & Layer Controls Toolbar */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {/* Zoom Buttons */}
          <div className={`p-1 rounded-2xl border shadow-xl flex flex-col items-center backdrop-blur-md ${
            isDark ? 'bg-[#161b22]/90 border-zinc-800' : 'bg-[#f1f5f9]/95 border-slate-300'
          }`}>
            <button
              type="button"
              title="Zoom In (or use mouse scroll / + key)"
              onClick={() => zoomBy(0.25)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold cursor-pointer transition-colors ${
                isDark ? 'text-zinc-100 hover:bg-zinc-800' : 'text-slate-800 hover:bg-slate-200'
              }`}
            >
              +
            </button>
            <div className={`text-[10px] font-mono py-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{Math.round(zoom * 100)}%</div>
            <button
              type="button"
              title="Zoom Out (or use mouse scroll / - key)"
              onClick={() => zoomBy(-0.25)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold cursor-pointer transition-colors ${
                isDark ? 'text-zinc-100 hover:bg-zinc-800' : 'text-slate-800 hover:bg-slate-200'
              }`}
            >
              −
            </button>
            <button
              type="button"
              title="Reset to Campus Overview (or press R / 0)"
              onClick={resetView}
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer transition-colors border-t mt-1 ${
                isDark ? 'text-emerald-400 hover:bg-zinc-800 border-zinc-800' : 'text-emerald-600 hover:bg-slate-200 border-slate-300'
              }`}
            >
              ⟲
            </button>
          </div>

          {/* Quick Layer & Theme Toggles */}
          <div className={`p-1 rounded-2xl border shadow-xl flex flex-col items-center gap-1 backdrop-blur-md ${
            isDark ? 'bg-[#161b22]/90 border-zinc-800' : 'bg-[#f1f5f9]/95 border-slate-300'
          }`}>
            <button
              type="button"
              title={`Switch to ${twinTheme === 'light' ? 'Dark' : 'Light'} Mode`}
              onClick={() => setTwinThemeOverride((t) => (t === 'light' ? 'architectural' : 'light'))}
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm cursor-pointer transition-colors ${
                isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-200 text-slate-700'
              }`}
            >
              {twinTheme === 'light' ? '🌙' : '☀️'}
            </button>
            <button
              type="button"
              title={showLabels ? 'Hide Building Labels' : 'Show Building Labels'}
              onClick={() => setShowLabels((v) => !v)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${
                showLabels
                  ? isDark ? 'bg-zinc-800 text-emerald-400 border border-zinc-700' : 'bg-emerald-100 text-emerald-800'
                  : isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-200'
              }`}
            >
              🏷️
            </button>
            <button
              type="button"
              title={showPathsAndCourts ? 'Hide Walkways & Entrances' : 'Show Walkways & Entrances'}
              onClick={() => setShowPathsAndCourts((v) => !v)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${
                showPathsAndCourts
                  ? isDark ? 'bg-zinc-800 text-emerald-400 border border-zinc-700' : 'bg-emerald-100 text-emerald-800'
                  : isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-200'
              }`}
            >
              🛣️
            </button>
          </div>
        </div>

        {/* Live Hover Telemetry Tooltip (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
          <div className={`px-3.5 py-1.5 rounded-xl border text-[11px] flex items-center gap-2 backdrop-blur-md shadow-md ${
            isDark ? 'bg-[#161b22]/90 border-zinc-800 text-zinc-300' : 'bg-white/95 border-slate-200 text-slate-700'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {hoveredBuildingObj ? (
              <span>
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>{hoveredBuildingObj.name}</strong> ·{' '}
                <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>{hoveredBuildingObj.category}</span>
                <span className={`hidden sm:inline ml-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>· Click to inspect</span>
              </span>
            ) : (
              <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>
                💡 Drag to pan · Scroll wheel to zoom · Click building to inspect
              </span>
            )}
          </div>
        </div>

        {/* Interactive Floating Building Place Card (The "Not Selection Based" Explorer!) */}
        {showPlaceCard && activeBuildingObj && (
          <div className={`absolute top-4 right-4 bottom-4 w-80 sm:w-96 max-w-[92vw] z-30 flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-right-4 backdrop-blur-md ${
            isDark ? 'bg-[#161b22]/95 border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9]/98 border-slate-300 text-slate-900'
          }`}>
            {/* Card Header */}
            <div className={`p-4 border-b flex items-start justify-between gap-3 ${
              isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-[10px] font-bold tracking-wider">
                    {activeBuildingObj.trace?.badge || activeBuildingObj.mapPin?.badge || 'CAMPUS'}
                  </span>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>
                    {activeBuildingObj.category}
                  </span>
                </div>
                <h3 className={`text-sm sm:text-base font-black leading-tight ${
                  isDark ? 'text-zinc-100' : 'text-slate-900'
                }`}>
                  {activeBuildingObj.name}
                </h3>
                <div className={`text-[11px] font-mono ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}>
                  📍 {activeBuildingObj.gps || 'Sector 24 Campus Core'}
                </div>
              </div>

              {/* Close Card Button */}
              <button
                type="button"
                title="Close Explorer Card"
                onClick={() => {
                  setShowPlaceCard(false);
                  setActiveBuildingId(null);
                }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${
                  isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-900'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Selected Location Pill */}
            {activeRoom && (
              <div className={`px-4 py-2 border-b flex items-center justify-between text-xs font-semibold ${
                isDark ? 'bg-zinc-800/90 border-zinc-700 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <div className="flex items-center gap-1.5">
                  <span>✓</span>
                  <span>Target: {activeRoom}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveRoom('');
                    if (onSelectRoom) onSelectRoom('');
                  }}
                  className={`text-[10px] underline cursor-pointer ${isDark ? 'text-zinc-300 hover:text-white' : 'text-emerald-700 hover:text-emerald-900'}`}
                >
                  Clear
                </button>
              </div>
            )}

            {/* Card Body: Interactive Floor & Room Explorer */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {/* Floor Switcher */}
              {availableFloors.length > 0 && (
                <div className="space-y-1.5">
                  <div className={`text-[10px] font-mono uppercase tracking-wider flex items-center justify-between ${
                    isDark ? 'text-zinc-400' : 'text-slate-500'
                  }`}>
                    <span>Select Level / Floor:</span>
                    <span className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>{availableFloors.length} Levels</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {availableFloors.map((fl) => {
                      const isActive = String(inspectorFloor) === String(fl.id);
                      return (
                        <button
                          key={fl.id}
                          type="button"
                          onClick={() => setInspectorFloor(fl.id)}
                          className={`px-2 py-1.5 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer border ${
                            isActive
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-2xs'
                              : isDark
                              ? 'bg-[#0e1117] text-zinc-300 border-zinc-800 hover:border-zinc-700'
                              : 'bg-[#eef2f6] text-slate-700 border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {fl.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rooms & Laboratories List */}
              <div className="space-y-2">
                <div className={`text-[10px] font-mono uppercase tracking-wider flex items-center justify-between ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}>
                  <span>Rooms, Labs & Facilities:</span>
                  <span className={isDark ? 'text-zinc-500' : 'text-slate-400'}>{inspectorRooms.length} Total</span>
                </div>

                {inspectorRooms.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
                    {inspectorRooms.map((roomName, idx) => {
                      const isSelected = activeRoom === roomName;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setActiveRoom(roomName);
                            if (onSelectRoom) onSelectRoom(roomName);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer border ${
                            isSelected
                              ? isDark
                                ? 'bg-zinc-800 text-emerald-400 border-emerald-600 font-bold'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-500 font-bold'
                              : isDark
                              ? 'bg-[#0e1117] text-zinc-300 border-zinc-800/80 hover:bg-zinc-800/60 hover:text-white'
                              : 'bg-[#eef2f6] text-slate-700 border-slate-300 hover:bg-slate-200 hover:text-slate-900'
                          }`}
                        >
                          <span className="truncate">{roomName}</span>
                          {isSelected && <span className="text-emerald-500 font-bold ml-2">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`p-4 rounded-xl border text-center text-xs ${
                    isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-500' : 'bg-[#eef2f6] border-slate-300 text-slate-500'
                  }`}>
                    General building facility zone. Click to select building for reporting.
                  </div>
                )}
              </div>
            </div>

            {/* Card Action Footer */}
            <div className={`p-3.5 border-t flex items-center justify-between gap-2 ${
              isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
            }`}>
              <button
                type="button"
                onClick={() => {
                  const P = EXACT_BUILDING_POLYGONS[activeBuildingObj.id];
                  const cx = activeBuildingObj.trace?.cx ?? P?.cx ?? 540;
                  const cy = activeBuildingObj.trace?.cy ?? P?.cy ?? 400;
                  flyTo(cx, cy, 2.0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border ${
                  isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                }`}
              >
                <span>🎯</span>
                <span>Center</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onSelectBuilding) onSelectBuilding(activeBuildingObj.name);
                  if (onSelectRoom && activeRoom) onSelectRoom(activeRoom);
                  setShowPlaceCard(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>📍</span>
                <span>Confirm Location</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
