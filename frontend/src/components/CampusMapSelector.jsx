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
import {
  IIITNR_MAP_UPDATED_EVENT,
  getCampusBuildings,
  resetCampusBuildingsToDefault,
  getFloorsForBuilding,
  getRoomsForBuilding,
  EXACT_BUILDING_POLYGONS,
} from '../data/iiitnrCampusData';
import DigitalTwinCanvas from './campusTwin/DigitalTwinCanvas';

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
}) {
  const { isSuperAdmin } = useAuth();
  const [buildings, setBuildings] = useState(() => getCampusBuildings());
  const [twinTheme, setTwinTheme] = useState('light');
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

  // Camera Navigation State (1080 x 800 SVG Space)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Radar Target Beacon for Cinematic Focus
  const [radarTarget, setRadarTarget] = useState(null);

  const svgRef = useRef(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const touchStartRef = useRef(null);
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
    }
  }, [selectedRoom]);

  useEffect(() => {
    const handleUpdate = () => setBuildings(getCampusBuildings());
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

  const inspectorRooms = useMemo(() => {
    if (!activeBuildingObj) return [];
    return getRoomsForBuilding(activeBuildingObj.id, inspectorFloor, 'Wing A', buildings);
  }, [activeBuildingObj, inspectorFloor, buildings]);

  // Smooth Cinematic Fly-To Camera Navigation
  const flyTo = useCallback((targetX, targetY, targetZoom = 1.8) => {
    // 1080 x 800 canvas center is (540, 400)
    const newPanX = 540 - targetX * targetZoom;
    const newPanY = 400 - targetY * targetZoom;
    setZoom(targetZoom);
    setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });

    // Pulse radar locator ring
    setRadarTarget({ cx: targetX, cy: targetY });
    if (radarTimerRef.current) clearTimeout(radarTimerRef.current);
    radarTimerRef.current = setTimeout(() => {
      setRadarTarget(null);
    }, 2800);
  }, []);

  // Smooth Reset to 100% Overview
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRadarTarget(null);
  }, []);

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

  // Mouse Drag Panning
  const handleMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isPanning) return;
      const nextPanX = e.clientX - panStartRef.current.x;
      const nextPanY = e.clientY - panStartRef.current.y;
      setPan({
        x: Math.max(-1400, Math.min(1400, nextPanX)),
        y: Math.max(-1200, Math.min(1200, nextPanY)),
      });
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Smooth Cursor-Centered Scroll-Wheel Zoom
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Coordinate in SVG space
      const svgX = (mouseX / rect.width) * 1080;
      const svgY = (mouseY / rect.height) * 800;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const newZoom = Math.min(3.5, Math.max(0.85, Number((zoom * zoomFactor).toFixed(2))));

      const newPanX = svgX - (svgX - pan.x) * (newZoom / zoom);
      const newPanY = svgY - (svgY - pan.y) * (newZoom / zoom);

      setZoom(newZoom);
      setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
    },
    [zoom, pan]
  );

  // Double-Click to Zoom Into That Spot
  const handleDoubleClick = useCallback(
    (e) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const svgX = ((e.clientX - rect.left) / rect.width) * 1080;
      const svgY = ((e.clientY - rect.top) / rect.height) * 800;
      const targetZoom = Math.min(3.0, zoom * 1.55);
      flyTo(svgX, svgY, targetZoom);
    },
    [zoom, flyTo]
  );

  // Touch Handling for Mobile Devices
  const handleTouchStart = useCallback(
    (e) => {
      if (e.touches.length === 1) {
        setIsPanning(true);
        panStartRef.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        touchStartRef.current = { dist, zoom };
      }
    },
    [pan, zoom]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (e.touches.length === 1 && isPanning) {
        const nextPanX = e.touches[0].clientX - panStartRef.current.x;
        const nextPanY = e.touches[0].clientY - panStartRef.current.y;
        setPan({ x: nextPanX, y: nextPanY });
      } else if (e.touches.length === 2 && touchStartRef.current) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const ratio = dist / touchStartRef.current.dist;
        const newZoom = Math.min(3.5, Math.max(0.85, Number((touchStartRef.current.zoom * ratio).toFixed(2))));
        setZoom(newZoom);
      }
    },
    [isPanning]
  );

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    touchStartRef.current = null;
  }, []);

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

      // Check rooms inside building
      if (Array.isArray(b.floors)) {
        b.floors.forEach((fl) => {
          if (Array.isArray(fl.rooms)) {
            fl.rooms.forEach((rm) => {
              if (rm.toLowerCase().includes(q)) {
                matches.push({
                  type: 'ROOM',
                  title: rm,
                  subtitle: `${b.name} (${fl.label})`,
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
    <div className="relative rounded-3xl border border-slate-200/90 bg-white shadow-md overflow-hidden select-none">
      {/* Top Floating Glassmorphic Search & Quick Filter Bar */}
      <div className="p-3.5 bg-slate-950 text-white border-b border-slate-800 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Omni Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search any building, lab (VLSI, AIDL), room (303, 131C), or facility..."
              className="w-full px-4 py-2 pl-9 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-400 transition-all font-sans"
            />
            <span className="absolute left-3 top-2 text-emerald-400 text-xs">⚡</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}

            {/* Live Search Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-40 divide-y divide-slate-800 max-h-72 overflow-y-auto">
                <div className="px-3.5 py-1.5 bg-slate-900/90 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Digital Twin Matches ({searchResults.length})</span>
                  <span className="text-emerald-400">Click to fly to spot</span>
                </div>
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-900 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div>
                      <div className="font-bold text-xs text-white group-hover:text-emerald-400 flex items-center gap-1.5">
                        <span>{res.type === 'ROOM' ? '📍' : '🏢'}</span>
                        <span>{res.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{res.subtitle}</div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
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
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
                  activeBuildingId === chip.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-emerald-400'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Map Viewport Container */}
      <div className="relative w-full bg-slate-950 overflow-hidden">
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
        />

        {/* Floating Camera & Layer Controls Toolbar */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {/* Zoom Buttons */}
          <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-700/80 shadow-xl flex flex-col items-center">
            <button
              type="button"
              title="Zoom In (or use mouse scroll)"
              onClick={() => setZoom((z) => Math.min(3.5, Number((z + 0.3).toFixed(2))))}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 text-sm font-black cursor-pointer transition-colors"
            >
              +
            </button>
            <div className="text-[10px] font-mono text-slate-400 py-1">{Math.round(zoom * 100)}%</div>
            <button
              type="button"
              title="Zoom Out (or use mouse scroll)"
              onClick={() => setZoom((z) => Math.max(0.85, Number((z - 0.3).toFixed(2))))}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 text-sm font-black cursor-pointer transition-colors"
            >
              −
            </button>
            <button
              type="button"
              title="Reset to Campus Overview"
              onClick={resetView}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-emerald-400 hover:bg-slate-800 text-xs font-bold cursor-pointer transition-colors border-t border-slate-800 mt-1"
            >
              ⟲
            </button>
          </div>

          {/* Quick Layer & Theme Toggles */}
          <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-700/80 shadow-xl flex flex-col items-center gap-1">
            <button
              type="button"
              title={`Switch to ${twinTheme === 'light' ? 'Dark' : 'Light'} Mode`}
              onClick={() => setTwinTheme((t) => (t === 'light' ? 'architectural' : 'light'))}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm cursor-pointer hover:bg-slate-800 transition-colors"
            >
              {twinTheme === 'light' ? '🌙' : '🌿'}
            </button>
            <button
              type="button"
              title={showLabels ? 'Hide Building Labels' : 'Show Building Labels'}
              onClick={() => setShowLabels((v) => !v)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${
                showLabels ? 'bg-emerald-600/30 text-emerald-300' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              🏷️
            </button>
            <button
              type="button"
              title={showPathsAndCourts ? 'Hide Walkways & Entrances' : 'Show Walkways & Entrances'}
              onClick={() => setShowPathsAndCourts((v) => !v)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${
                showPathsAndCourts ? 'bg-emerald-600/30 text-emerald-300' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              🛣️
            </button>
          </div>
        </div>

        {/* Live Hover Telemetry Tooltip (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {hoveredBuildingObj ? (
              <span>
                <strong className="text-white">{hoveredBuildingObj.name}</strong> ·{' '}
                <span className="text-emerald-400">{hoveredBuildingObj.category}</span>
                <span className="hidden sm:inline text-slate-400 ml-1">· Click to inspect</span>
              </span>
            ) : (
              <span className="text-slate-400">
                💡 Drag to pan · Scroll wheel to zoom · Click building to inspect
              </span>
            )}
          </div>
        </div>

        {/* Interactive Floating Building Place Card (The "Not Selection Based" Explorer!) */}
        {showPlaceCard && activeBuildingObj && (
          <div className="absolute top-4 right-4 bottom-4 w-80 sm:w-96 max-w-[92vw] z-30 flex flex-col rounded-2xl bg-slate-950/95 backdrop-blur-md border border-slate-700/80 shadow-2xl text-white overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-right-4">
            {/* Card Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-[10px] font-black tracking-wider">
                    {activeBuildingObj.trace?.badge || activeBuildingObj.mapPin?.badge || 'CAMPUS'}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    {activeBuildingObj.category}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                  {activeBuildingObj.name}
                </h3>
                <div className="text-[11px] text-slate-400 font-mono">
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
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Selected Location Pill */}
            {activeRoom && (
              <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-800/60 flex items-center justify-between text-xs text-emerald-200">
                <div className="flex items-center gap-1.5 font-bold">
                  <span>✓</span>
                  <span>Target: {activeRoom}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveRoom('');
                    if (onSelectRoom) onSelectRoom('');
                  }}
                  className="text-[10px] text-emerald-400 hover:text-white underline cursor-pointer"
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
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Select Level / Floor:</span>
                    <span className="text-emerald-400">{availableFloors.length} Levels</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {availableFloors.map((fl) => {
                      const isActive = String(inspectorFloor) === String(fl.id);
                      return (
                        <button
                          key={fl.id}
                          type="button"
                          onClick={() => setInspectorFloor(fl.id)}
                          className={`px-2 py-1.5 rounded-xl text-xs font-bold text-center transition-all cursor-pointer border ${
                            isActive
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
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
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Rooms, Labs & Facilities:</span>
                  <span className="text-slate-500">{inspectorRooms.length} Total</span>
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
                              ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500 font-bold shadow-xs'
                              : 'bg-slate-900/80 text-slate-300 border-slate-800/80 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{roomName}</span>
                          {isSelected && <span className="text-emerald-400 font-bold ml-2">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-500">
                    General building facility zone. Click to select building for reporting.
                  </div>
                )}
              </div>
            </div>

            {/* Card Action Footer */}
            <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const P = EXACT_BUILDING_POLYGONS[activeBuildingObj.id];
                  const cx = activeBuildingObj.trace?.cx ?? P?.cx ?? 540;
                  const cy = activeBuildingObj.trace?.cy ?? P?.cy ?? 400;
                  flyTo(cx, cy, 2.0);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
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
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
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
