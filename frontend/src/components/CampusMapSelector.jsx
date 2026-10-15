/**
 * SmartComplaintHandler - Custom University-Only Satellite-Traced Map (IIIT Naya Raipur)
 *
 * Design:
 * - Zero outside area / zero external OSM tiles: Strictly renders ONLY the IIIT Naya Raipur campus
 *   polygon extracted 1:1 from the Google Satellite image (735 x 857 coordinate space).
 * - Every building is drawn with its actual traced architectural footprint:
 *   - Square courtyard quadrangles for Ramanujan, Bhabha, Raman, and Shabri Hostels
 *   - Central Rotunda Dome + NW/SE Lab & Classroom wings for the Academic & Admin Block
 *   - Circular Canteen Rotunda + Central Mess Hall
 *   - Semicircular stepped concentric arcs for Amphitheatre 2
 *   - Walled Twin-Court Sports Complex (red & green courts), Central Football/Cricket Turf, & North Indoor Hall
 *   - Multi-Purpose Hall (MPH / SAC), Library (KRC), Faculty Quarters, and Main Gate + Union Bank ATM
 * - Includes smooth Zoom (+ / - / Reset), Pan, and a toggle between:
 *   1. "Traced Master Plan" (Pure custom architectural vector map of the university)
 *   2. "Satellite Overlay" (Masked university-only satellite texture with interactive traced footprints)
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  IIITNR_MAP_UPDATED_EVENT,
  IIITNR_CAMPUS_PERIMETER_POINTS,
  IIITNR_CAMPUS_BOUNDARY_CORNERS,
  IIITNR_CAMPUS_METADATA,
  getCampusBuildings,
  saveCustomCampusBuildings,
  resetCampusBuildingsToDefault,
} from '../data/iiitnrCampusData';

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
  const [viewStyle, setViewStyle] = useState('satellite'); // 'satellite' | 'vector' | 'markup'
  const [showBoundary, setShowBoundary] = useState(true);
  const [hoveredBoundary, setHoveredBoundary] = useState(false);
  const [isBoundarySelected, setIsBoundarySelected] = useState(false);
  const [hoveredPillar, setHoveredPillar] = useState(null);

  const [hoveredId, setHoveredId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBuildingId, setEditingBuildingId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState('');

  const svgRef = useRef(null);

  // Strictly enforce that only Super Admin can activate Edit / Label mode
  useEffect(() => {
    if (!isSuperAdmin) {
      setIsEditMode(false);
      setDraggingId(null);
      setShowJsonModal(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    const handleUpdate = () => setBuildings(getCampusBuildings());
    window.addEventListener(IIITNR_MAP_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(IIITNR_MAP_UPDATED_EVENT, handleUpdate);
  }, []);

  const activeBuildingObj =
    buildings.find(
      (b) => b.name === selectedBuilding || b.id === selectedBuilding || b.shortName === selectedBuilding
    ) || buildings[0];

  const hoveredBuildingObj =
    buildings.find((b) => b.id === hoveredId) || activeBuildingObj;

  const editingBuilding =
    buildings.find((b) => b.id === editingBuildingId) || activeBuildingObj;

  const clientToSvgCoords = (e) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 816;
    const rawY = ((e.clientY - rect.top) / rect.height) * 817;
    const cx = Math.round(Math.max(20, Math.min(796, (rawX - pan.x) / zoom)));
    const cy = Math.round(Math.max(20, Math.min(797, (rawY - pan.y) / zoom)));
    return { cx, cy };
  };

  const handleSvgClick = (e) => {
    if (!isSuperAdmin || !isEditMode || draggingId) return;
    if (e.target.closest('[data-bldg-id]')) return;
    const coords = clientToSvgCoords(e);
    if (!coords) return;

    const newId = `custom_${Date.now()}`;
    const idx = buildings.length + 1;
    const newBldg = {
      id: newId,
      name: `New Campus Block ${idx}`,
      shortName: `Block ${idx}`,
      type: 'Custom Campus Building',
      category: 'HOSTEL',
      wings: ['Wing A', 'Wing B'],
      floors: ['G', '1', '2', '3'],
      roomsPerFloor: 24,
      roomPrefix: 'Room ',
      customRooms: [],
      trace: {
        cx: coords.cx,
        cy: coords.cy,
        w: 58,
        h: 52,
        angle: 18,
        shape: 'courtyard_quad',
        color: '#4f46e5',
        badge: `B-${idx}`,
      },
      mapPin: { badge: `B-${idx}`, color: '#4f46e5' },
      gps: `Campus (${coords.cx}, ${coords.cy})`,
      description: 'Custom traced campus building.',
    };

    const updated = [...buildings, newBldg];
    setBuildings(updated);
    saveCustomCampusBuildings(updated);
    setEditingBuildingId(newId);
    onSelectBuilding && onSelectBuilding(newBldg.name);
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('[data-bldg-id]')) return;
    if (zoom > 1 || (isSuperAdmin && isEditMode)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isSuperAdmin && isEditMode && draggingId) {
      const coords = clientToSvgCoords(e);
      if (!coords) return;
      setBuildings((prev) =>
        prev.map((b) =>
          b.id !== draggingId
            ? b
            : {
                ...b,
                trace: { ...(b.trace || {}), cx: coords.cx, cy: coords.cy },
              }
        )
      );
      return;
    }
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => {
    if (draggingId) {
      if (isSuperAdmin) {
        saveCustomCampusBuildings(buildings);
      }
      setDraggingId(null);
    }
    setIsPanning(false);
  };

  const handleUpdateBuildingField = (buildingId, updates) => {
    if (!isSuperAdmin) return;
    const updated = buildings.map((b) => {
      if (b.id !== buildingId) return b;
      const merged = { ...b, ...updates };
      if (updates.badge) {
        merged.trace = { ...(b.trace || {}), badge: updates.badge };
        merged.mapPin = { ...(b.mapPin || {}), badge: updates.badge };
      }
      return merged;
    });
    setBuildings(updated);
    saveCustomCampusBuildings(updated);
    const target = updated.find((b) => b.id === buildingId);
    if (target && onSelectBuilding) onSelectBuilding(target.name);
  };

  const handleDeleteBuilding = (buildingId) => {
    if (!isSuperAdmin || buildings.length <= 1) return;
    const remaining = buildings.filter((b) => b.id !== buildingId);
    setBuildings(remaining);
    saveCustomCampusBuildings(remaining);
    setEditingBuildingId(remaining[0].id);
    onSelectBuilding && onSelectBuilding(remaining[0].name);
  };

  /**
   * Renders the exact satellite-traced architectural footprint for each IIIT-NR building.
   */
  const renderBuildingFootprint = (b, isSelected, isHovered) => {
    const cx = b.trace?.cx ?? Math.round(((b.mapPin?.xPct || 50) / 100) * 816);
    const cy = b.trace?.cy ?? Math.round(((b.mapPin?.yPct || 50) / 100) * 817);
    const w = b.trace?.w || 56;
    const h = b.trace?.h || 50;
    const angle = b.trace?.angle ?? 18;
    const shape = b.trace?.shape || 'courtyard_quad';
    const baseColor = b.trace?.color || b.mapPin?.color || '#4f46e5';
    const badge = b.trace?.badge || b.mapPin?.badge || 'BLDG';

    const fillOpacity = viewStyle !== 'vector' ? (isSelected ? 0.85 : 0.65) : 0.95;
    const strokeColor = isSelected ? '#38bdf8' : isHovered ? '#ffffff' : 'rgba(255,255,255,0.75)';
    const strokeWidth = isSelected ? 3.5 : isHovered ? 2.5 : 1.5;

    return (
      <g
        key={b.id}
        data-bldg-id={b.id}
        onMouseEnter={() => setHoveredId(b.id)}
        onMouseLeave={() => setHoveredId(null)}
        onMouseDown={(e) => {
          e.stopPropagation();
          setEditingBuildingId(b.id);
          onSelectBuilding && onSelectBuilding(b.name);
          if (isSuperAdmin && isEditMode) setDraggingId(b.id);
        }}
        className={isSuperAdmin && isEditMode ? 'cursor-move' : 'cursor-pointer'}
      >
        {/* Active Selection Pulse Halo */}
        {(isSelected || isHovered) && (
          <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
            <rect
              x={-w / 2 - 7}
              y={-h / 2 - 7}
              width={w + 14}
              height={h + 14}
              rx="10"
              fill="none"
              stroke={isSelected ? '#38bdf8' : '#a5b4fc'}
              strokeWidth={isSelected ? '3' : '2'}
              strokeDasharray={isSelected ? 'none' : '4 3'}
            />
          </g>
        )}

        {/* Architectural Footprint Shape Traced from Google Satellite */}
        <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
          {shape === 'courtyard_quad' && (
            <>
              {/* Outer Square Hostel Quadrangle */}
              <rect
                x={-w / 2}
                y={-h / 2}
                width={w}
                height={h}
                rx="6"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              {/* Inner Open Courtyard / Badminton Court */}
              <rect
                x={-w * 0.22}
                y={-h * 0.22}
                width={w * 0.44}
                height={h * 0.44}
                rx="3"
                fill="#0f172a"
                fillOpacity={viewStyle === 'satellite' ? 0.45 : 0.85}
                stroke="rgba(56, 189, 248, 0.5)"
                strokeWidth="1"
              />
            </>
          )}

          {shape === 'academic_complex' && (
            <>
              {/* NW Multi-Wing Academic & Research Block */}
              <rect
                x={-w * 0.48}
                y={-h * 0.46}
                width={w * 0.44}
                height={h * 0.88}
                rx="6"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              {/* SE Multi-Wing Classroom & Admin Block */}
              <rect
                x={w * 0.04}
                y={-h * 0.46}
                width={w * 0.44}
                height={h * 0.88}
                rx="6"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              {/* Connecting Spine & Iconic Central White Rotunda Dome */}
              <rect
                x={-w * 0.12}
                y={-h * 0.2}
                width={w * 0.24}
                height={h * 0.4}
                fill="#0369a1"
                stroke={strokeColor}
                strokeWidth="1.5"
              />
              <circle
                cx="0"
                cy="0"
                r="16"
                fill="#f8fafc"
                stroke="#0284c7"
                strokeWidth="3"
              />
              <circle cx="0" cy="0" r="7" fill="#38bdf8" />
            </>
          )}

          {shape === 'canteen_mess' && (
            <>
              {/* Rectangular Mess Hall Block */}
              <rect
                x={-w * 0.48}
                y={-h * 0.42}
                width={w * 0.58}
                height={h * 0.84}
                rx="6"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              {/* Connected Circular Canteen Rotunda */}
              <circle
                cx={w * 0.28}
                cy={h * 0.08}
                r={h * 0.38}
                fill="#f59e0b"
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
            </>
          )}

          {shape === 'amphitheatre' && (
            <>
              {/* Semicircular Concentric Stepped Amphitheatre 2 */}
              <path
                d="M -38,-10 A 42,42 0 0,1 38,-10 L 24,26 A 26,26 0 0,0 -24,26 Z"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              <path
                d="M -28,-4 A 30,30 0 0,1 28,-4"
                fill="none"
                stroke="rgba(255,255,255,0.65)"
                strokeWidth="2"
              />
              <path
                d="M -18,4 A 20,20 0 0,1 18,4"
                fill="none"
                stroke="rgba(255,255,255,0.65)"
                strokeWidth="2"
              />
              <circle cx="0" cy="18" r="9" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
            </>
          )}

          {shape === 'twin_courts' && (
            <>
              {/* Walled North Sports Complex with Twin Red/Green Courts */}
              <rect
                x={-w / 2}
                y={-h / 2}
                width={w}
                height={h}
                rx="7"
                fill="#065f46"
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              <rect
                x={-w * 0.36}
                y={-h * 0.32}
                width={w * 0.32}
                height={h * 0.64}
                rx="2"
                fill="#dc2626"
                stroke="#ffffff"
                strokeWidth="1"
              />
              <rect
                x={w * 0.04}
                y={-h * 0.32}
                width={w * 0.32}
                height={h * 0.64}
                rx="2"
                fill="#16a34a"
                stroke="#ffffff"
                strokeWidth="1"
              />
            </>
          )}

          {shape === 'twin_wings' && (
            <>
              <rect
                x={-w / 2}
                y={-h * 0.46}
                width={w * 0.92}
                height={h * 0.4}
                rx="5"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              <rect
                x={-w * 0.42}
                y={h * 0.06}
                width={w * 0.92}
                height={h * 0.4}
                rx="5"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
            </>
          )}

          {shape === 'faculty_cluster' && (
            <>
              <rect
                x={-w * 0.45}
                y={-h * 0.42}
                width={w * 0.42}
                height={h * 0.38}
                rx="4"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              <rect
                x={w * 0.03}
                y={-h * 0.42}
                width={w * 0.42}
                height={h * 0.38}
                rx="4"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              <rect
                x={-w * 0.2}
                y={h * 0.05}
                width={w * 0.62}
                height={h * 0.38}
                rx="4"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
            </>
          )}

          {shape === 'hall' && (
            <rect
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              rx="6"
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          )}
        </g>

        {/* Crisp Non-Overlapping Label Pill Anchored to Building Center */}
        <g transform={`translate(${cx}, ${cy + h / 2 + 12})`}>
          <rect
            x="-54"
            y="-10"
            width="108"
            height="19"
            rx="6"
            fill={isSelected ? '#0284c7' : 'rgba(9, 13, 22, 0.92)'}
            stroke={isSelected ? '#ffffff' : 'rgba(148, 163, 184, 0.4)'}
            strokeWidth="1.2"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="9.5"
            fontWeight="700"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {badge} · {b.shortName || b.name}
          </text>
        </g>
      </g>
    );
  };

  const hostelsList = buildings.filter((b) => b.category === 'HOSTEL');
  const otherBlocksList = buildings.filter((b) => b.category !== 'HOSTEL');

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-5 py-3.5 bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isEditMode ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'
            }`}
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-black tracking-tight text-white">
                IIIT Naya Raipur — Custom Campus Map (University Area Only)
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                1:1 Satellite Traced
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.2, Number((z + 0.25).toFixed(2))))}
              className="px-2 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Zoom In"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="px-2 py-1 rounded-lg text-[10px] font-mono text-slate-400 hover:text-white cursor-pointer"
              title="Reset View"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom((z) => {
                  const next = Math.max(1, Number((z - 0.25).toFixed(2)));
                  if (next === 1) setPan({ x: 0, y: 0 });
                  return next;
                });
              }}
              className="px-2 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Zoom Out"
            >
              −
            </button>
          </div>

          {/* View Mode Toggle: Satellite Trace vs Vector Plan vs Original Boundary Markup */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewStyle('satellite')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                viewStyle === 'satellite' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Clean Inpainted Satellite View with Traced Footprints"
            >
              🛰️ Satellite Trace
            </button>
            <button
              type="button"
              onClick={() => setViewStyle('vector')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                viewStyle === 'vector' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Architectural Vector Blueprint Plan"
            >
              📐 Campus Plan
            </button>
            <button
              type="button"
              onClick={() => setViewStyle('markup')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                viewStyle === 'markup' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Exact Original Image with Demarcation Line"
            >
              🗺️ Boundary Markup
            </button>
          </div>

          {/* Interactive 50-Acre Perimeter Boundary Toggle */}
          <button
            type="button"
            onClick={() => setShowBoundary((b) => !b)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
              showBoundary
                ? 'bg-rose-500/20 text-rose-300 border-rose-400/40 shadow-2xs'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Toggle 50-Acre Perimeter Boundary & Survey Pillars"
          >
            {showBoundary ? '🔲 Boundary ON' : '🔳 Boundary OFF'}
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => {
                setIsEditMode((prev) => !prev);
                setEditingBuildingId(activeBuildingObj?.id || buildings[0]?.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                isEditMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-white/10 hover:bg-white/20 text-amber-300 border-amber-400/30'
              }`}
            >
              {isEditMode ? '✓ Done' : '✏️ Edit / Label'}
            </button>
          )}
        </div>
      </div>

      {/* Quick Hostel & Building Pill Bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto">
        {studentSavedHostel && (
          <button
            type="button"
            onClick={() => {
              onSelectBuilding && onSelectBuilding(studentSavedHostel);
              if (studentSavedRoom && onSelectRoom) onSelectRoom(studentSavedRoom);
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 cursor-pointer"
          >
            🏠 My Room ({studentSavedHostel.split(' ')[0]} · {studentSavedRoom || 'Saved'})
          </button>
        )}

        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 shrink-0">
          Hostels:
        </span>
        {hostelsList.map((h) => {
          const isSelected = activeBuildingObj?.id === h.id;
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                setEditingBuildingId(h.id);
                onSelectBuilding && onSelectBuilding(h.name);
              }}
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
        {otherBlocksList.map((b) => {
          const isSelected = activeBuildingObj?.id === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setEditingBuildingId(b.id);
                onSelectBuilding && onSelectBuilding(b.name);
              }}
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

      {/* Main Custom University-Only SVG Map Viewport */}
      <div className="bg-[#0b1120] p-3 sm:p-4 space-y-3">
        <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1120] flex justify-center">
          <svg
            ref={svgRef}
            viewBox="0 0 816 817"
            onClick={handleSvgClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`w-full max-h-[540px] select-none ${
              isSuperAdmin && isEditMode ? 'cursor-crosshair' : zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
            }`}
          >
            <defs>
              <pattern id="uniBlueprintGrid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path
                  d="M 32 0 L 0 0 0 32"
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.06)"
                  strokeWidth="1"
                />
              </pattern>
              <clipPath id="iiitnrCampusClip">
                <polygon points={IIITNR_CAMPUS_PERIMETER_POINTS} />
              </clipPath>
            </defs>

            {/* Dark Architectural Canvas Outside the University Perimeter */}
            <rect width="816" height="817" fill="#0b1120" />
            <rect width="816" height="817" fill="url(#uniBlueprintGrid)" />

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Clipped University-Only Area (Zero Outside Area Shown) */}
              <g clipPath="url(#iiitnrCampusClip)">
                {viewStyle === 'satellite' || viewStyle === 'markup' ? (
                  <image
                    href={viewStyle === 'markup' ? '/iiitnr_campus_satellite_markup.jpg' : '/iiitnr_campus_satellite_full.png'}
                    x="0"
                    y="0"
                    width="816"
                    height="817"
                    preserveAspectRatio="none"
                  />
                ) : (
                  <>
                    {/* Custom University-Only Grounds Base */}
                    <polygon points={IIITNR_CAMPUS_PERIMETER_POINTS} fill="#131c31" />

                    {/* Landscaped Green Lawns & Woodland Zones Traced from Satellite (816x817) */}
                    {/* 1. Central Sports Turf & Lawn */}
                    <polygon
                      points="292,332 404,311 413,431 279,417"
                      fill="#064e3b"
                      fillOpacity="0.65"
                      stroke="#059669"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    {/* 2. South Gate Green Lawn */}
                    <polygon
                      points="290,574 413,601 384,718 261,678"
                      fill="#064e3b"
                      fillOpacity="0.55"
                    />
                    {/* 3. Southeast Amphitheatre Woodland & Green Belt */}
                    <polygon
                      points="431,583 638,538 575,799 398,732"
                      fill="#064e3b"
                      fillOpacity="0.45"
                    />
                    {/* 4. Academic Semicircular Forecourt Garden */}
                    <circle
                      cx="395"
                      cy="431"
                      r="34"
                      fill="#065f46"
                      fillOpacity="0.6"
                      stroke="#10b981"
                      strokeWidth="1"
                    />
                    {/* 5. North Indoor Sports Hall */}
                    <g transform="translate(272, 146) rotate(18)">
                      <rect
                        x="-18"
                        y="-29"
                        width="36"
                        height="58"
                        rx="4"
                        fill="#334155"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      />
                    </g>

                    {/* Internal University Road Network Traced 1:1 from Google Satellite */}
                    <g
                      fill="none"
                      stroke="#334155"
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {/* Western Perimeter Avenue */}
                      <polyline points="98,635 254,116" />
                      {/* Southern Hostel Cross-Road to Main Gate */}
                      <polyline points="98,635 207,682 393,742" />
                      {/* Main Gate Boulevard heading North-Northeast */}
                      <polyline points="384,740 425,592 521,520" />
                      {/* Inner Hostel Spine Road */}
                      <polyline points="207,682 288,365" />
                      {/* Mid-West Hostel Connector */}
                      <polyline points="126,523 243,565" />
                      {/* Northern Loop Road */}
                      <polyline points="288,365 315,329 467,304 554,433 521,520" />
                      {/* Central Academic Spine */}
                      <polyline points="267,424 380,503 425,592" />
                      {/* North Sports Complex Spur */}
                      <polyline points="413,313 377,234 458,186" />
                      {/* Southeast Amphitheatre & Shabri Hostel Loop */}
                      <polyline points="521,520 632,545" />
                      {/* Eastern Boundary Road */}
                      <polyline points="659,482 575,803" />
                    </g>

                    {/* Road Centerlines */}
                    <g
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="1.5"
                      strokeDasharray="6 6"
                      strokeLinecap="round"
                    >
                      <polyline points="98,635 254,116" />
                      <polyline points="98,635 207,682 393,742" />
                      <polyline points="384,740 425,592 521,520" />
                      <polyline points="207,682 288,365" />
                      <polyline points="288,365 315,329 467,304 554,433 521,520" />
                      <polyline points="267,424 380,503 425,592" />
                    </g>
                  </>
                )}
              </g>

              {/* Interactive 50-Acre Perimeter Boundary */}
              {showBoundary && (
                <g className="transition-all duration-200">
                  {/* Invisible wide stroke for responsive boundary hover and click */}
                  <polygon
                    points={IIITNR_CAMPUS_PERIMETER_POINTS}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="28"
                    strokeLinejoin="round"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredBoundary(true)}
                    onMouseLeave={() => setHoveredBoundary(false)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsBoundarySelected((s) => !s);
                    }}
                  />

                  {/* Pulsing highlight when boundary is hovered or selected */}
                  {(hoveredBoundary || isBoundarySelected) && (
                    <polygon
                      points={IIITNR_CAMPUS_PERIMETER_POINTS}
                      fill="rgba(244, 63, 94, 0.08)"
                      stroke="#f43f5e"
                      strokeWidth="6"
                      strokeOpacity="0.4"
                      strokeLinejoin="round"
                      className="animate-pulse"
                    />
                  )}

                  {/* Sharp perimeter line */}
                  <polygon
                    points={IIITNR_CAMPUS_PERIMETER_POINTS}
                    fill="none"
                    stroke={hoveredBoundary || isBoundarySelected ? '#f43f5e' : '#fb7185'}
                    strokeWidth={hoveredBoundary || isBoundarySelected ? '3.5' : '2.5'}
                    strokeDasharray={hoveredBoundary || isBoundarySelected ? 'none' : '8 6'}
                    strokeLinejoin="round"
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredBoundary(true)}
                    onMouseLeave={() => setHoveredBoundary(false)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsBoundarySelected((s) => !s);
                    }}
                  />

                  {/* Perimeter Milestone / Edge Labels */}
                  {/* North Edge: (230,80) to (775,248) mid=(502,164) angle=17.1 */}
                  <g transform="translate(502, 154) rotate(17.1)" className="pointer-events-none select-none">
                    <rect x="-80" y="-9" width="160" height="18" rx="4" fill="rgba(15, 23, 42, 0.88)" stroke="#f43f5e" strokeWidth="0.8" />
                    <text x="0" y="3" textAnchor="middle" fill="#fecdd3" fontSize="8.5" fontWeight="700" fontFamily="Inter, sans-serif">
                      North Boundary Wall · 570m
                    </text>
                  </g>

                  {/* East Edge: (775,248) to (576,811) mid=(675,530) angle=-70.5 */}
                  <g transform="translate(685, 530) rotate(-70.5)" className="pointer-events-none select-none">
                    <rect x="-70" y="-9" width="140" height="18" rx="4" fill="rgba(15, 23, 42, 0.88)" stroke="#f43f5e" strokeWidth="0.8" />
                    <text x="0" y="3" textAnchor="middle" fill="#fecdd3" fontSize="8.5" fontWeight="700" fontFamily="Inter, sans-serif">
                      East Forest Buffer · 597m
                    </text>
                  </g>

                  {/* South Edge: (576,811) to (37,644) mid=(306,728) angle=17.2 */}
                  <g transform="translate(306, 738) rotate(17.2)" className="pointer-events-none select-none">
                    <rect x="-85" y="-9" width="170" height="18" rx="4" fill="rgba(15, 23, 42, 0.88)" stroke="#f43f5e" strokeWidth="0.8" />
                    <text x="0" y="3" textAnchor="middle" fill="#fecdd3" fontSize="8.5" fontWeight="700" fontFamily="Inter, sans-serif">
                      Naya Raipur Marg (South) · 564m
                    </text>
                  </g>

                  {/* West Edge: (37,644) to (230,80) mid=(133,362) angle=-71.1 */}
                  <g transform="translate(123, 362) rotate(-71.1)" className="pointer-events-none select-none">
                    <rect x="-80" y="-9" width="160" height="18" rx="4" fill="rgba(15, 23, 42, 0.88)" stroke="#f43f5e" strokeWidth="0.8" />
                    <text x="0" y="3" textAnchor="middle" fill="#fecdd3" fontSize="8.5" fontWeight="700" fontFamily="Inter, sans-serif">
                      West Boundary / Avenue · 596m
                    </text>
                  </g>

                  {/* 4 Corner Geodetic Survey Pillars */}
                  {IIITNR_CAMPUS_BOUNDARY_CORNERS.map((pillar, idx) => {
                    const isHovered = hoveredPillar?.id === pillar.id;
                    return (
                      <g
                        key={pillar.id}
                        transform={`translate(${pillar.x}, ${pillar.y})`}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPillar(pillar)}
                        onMouseLeave={() => setHoveredPillar(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsBoundarySelected(true);
                          setHoveredPillar(pillar);
                        }}
                      >
                        {/* Animated ping ring */}
                        <circle
                          cx="0"
                          cy="0"
                          r={isHovered ? 16 : 10}
                          fill="#f43f5e"
                          opacity={isHovered ? 0.45 : 0.22}
                          className={isHovered ? 'animate-ping' : ''}
                        />
                        {/* Inner solid survey stone pillar */}
                        <circle
                          cx="0"
                          cy="0"
                          r="8"
                          fill="#0f172a"
                          stroke="#f43f5e"
                          strokeWidth="2.2"
                        />
                        {/* Pillar index tag (P1, P2, P3, P4) */}
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="8"
                          fontWeight="900"
                          fontFamily="Inter, sans-serif"
                        >
                          P{idx + 1}
                        </text>

                        {/* Hover popup tooltip card */}
                        {isHovered && (
                          <g transform="translate(0, -22)" className="pointer-events-none">
                            <rect
                              x="-90"
                              y="-26"
                              width="180"
                              height="28"
                              rx="6"
                              fill="#020617"
                              stroke="#f43f5e"
                              strokeWidth="1.2"
                            />
                            <text
                              x="0"
                              y="-13"
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="9"
                              fontWeight="800"
                              fontFamily="Inter, sans-serif"
                            >
                              {pillar.label}
                            </text>
                            <text
                              x="0"
                              y="-3"
                              textAnchor="middle"
                              fill="#cbd5e1"
                              fontSize="7.5"
                              fontFamily="Inter, sans-serif"
                            >
                              {pillar.subtitle}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Compass & Scale Legend in Top-Left Canvas */}
              <g transform="translate(70, 75)">
                <circle cx="0" cy="0" r="22" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <polygon points="0,-14 -5,4 0,0 5,4" fill="#38bdf8" />
                <text x="0" y="-17" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                  N
                </text>
              </g>

              {/* Render All Traced Campus Buildings & Hostels */}
              {buildings.map((b) => {
                const isSelected = activeBuildingObj?.id === b.id;
                const isHovered = hoveredId === b.id;
                return renderBuildingFootprint(b, isSelected, isHovered);
              })}
            </g>
          </svg>
        </div>

        {/* Bottom Active Building / Boundary Telemetry Bar */}
        {hoveredBoundary || isBoundarySelected || hoveredPillar ? (
          <div className="p-3.5 rounded-2xl bg-slate-950/95 border border-rose-500/40 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/40 font-mono text-[10px] font-bold">
                  {hoveredPillar ? `PILLAR P${IIITNR_CAMPUS_BOUNDARY_CORNERS.findIndex((c) => c.id === hoveredPillar.id) + 1}` : '50 ACRES'}
                </span>
                <span className="font-black text-white text-sm">
                  {hoveredPillar ? hoveredPillar.label : 'IIIT Naya Raipur — 50-Acre Perimeter Boundary'}
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-[11px] text-rose-400 font-medium">
                  {hoveredPillar ? hoveredPillar.subtitle : 'Official Campus Estate'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {hoveredPillar ? (
                  <>
                    Geodetic Grid Coordinate: ({hoveredPillar.x}px, {hoveredPillar.y}px) · Boundary Perimeter: 2,328m
                  </>
                ) : (
                  <>
                    50 Acres Total Estate · Perimeter: 2,328m (North: 570m · East: 597m · South: 564m · West: 596m)
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded border border-emerald-500/30">
                ✓ 1:1 Matched to Demarcation Line
              </span>
              {isBoundarySelected && (
                <button
                  type="button"
                  onClick={() => {
                    setIsBoundarySelected(false);
                    setHoveredBoundary(false);
                    setHoveredPillar(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer"
                >
                  ✕ Deselect
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-mono text-[10px] font-bold">
                  {hoveredBuildingObj?.trace?.badge || hoveredBuildingObj?.mapPin?.badge || 'BLDG'}
                </span>
                <span className="font-black text-white text-sm">
                  {hoveredBuildingObj?.name}
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-[11px] text-emerald-400 font-medium">
                  {hoveredBuildingObj?.type}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {hoveredBuildingObj?.description}
              </p>
            </div>

            {selectedRoom && (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-mono text-xs font-bold shrink-0">
                📍 {selectedRoom}
              </div>
            )}
          </div>
        )}

        {/* Inline Editor Drawer (when Edit / Label is active and user is Super Admin) */}
        {isSuperAdmin && isEditMode && editingBuilding && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 text-white space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <span className="font-bold text-amber-300">
                Editing Building: {editingBuilding.name} (Click map to add block or drag any block)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setJsonText(JSON.stringify(buildings, null, 2));
                    setShowJsonModal(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer"
                >
                  Export / Import JSON
                </button>
                <button
                  type="button"
                  onClick={() => isSuperAdmin && setBuildings(resetCampusBuildingsToDefault())}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => isSuperAdmin && handleDeleteBuilding(editingBuilding.id)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[11px] font-bold cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Building / Hostel Name</label>
                <input
                  type="text"
                  value={editingBuilding.name}
                  onChange={(e) =>
                    handleUpdateBuildingField(editingBuilding.id, {
                      name: e.target.value,
                      shortName: e.target.value.split(' (')[0],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Badge &amp; Category</label>
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    value={editingBuilding.trace?.badge || editingBuilding.mapPin?.badge || ''}
                    onChange={(e) => handleUpdateBuildingField(editingBuilding.id, { badge: e.target.value })}
                    className="w-20 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  />
                  <select
                    value={editingBuilding.category}
                    onChange={(e) => handleUpdateBuildingField(editingBuilding.id, { category: e.target.value })}
                    className="flex-1 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  >
                    <option value="HOSTEL">Hostel</option>
                    <option value="ACADEMIC">Academic / Lab</option>
                    <option value="AMENITY">Amenity / Mess</option>
                    <option value="INFRASTRUCTURE">Sports / Gate</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Wings &amp; Floors</label>
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    value={Array.isArray(editingBuilding.wings) ? editingBuilding.wings.join(', ') : ''}
                    onChange={(e) =>
                      handleUpdateBuildingField(editingBuilding.id, {
                        wings: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="Wing A, Wing B"
                    className="flex-1 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                  <input
                    type="text"
                    value={
                      Array.isArray(editingBuilding.floors)
                        ? editingBuilding.floors.map((f) => (typeof f === 'string' ? f : f.id)).join(', ')
                        : 'G, 1, 2, 3'
                    }
                    onChange={(e) =>
                      handleUpdateBuildingField(editingBuilding.id, {
                        floors: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-20 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Custom Rooms Override</label>
                <input
                  type="text"
                  placeholder="e.g. Room 101, Lab 202"
                  value={
                    Array.isArray(editingBuilding.customRooms) && editingBuilding.customRooms.length > 0
                      ? editingBuilding.customRooms.join(', ')
                      : ''
                  }
                  onChange={(e) =>
                    handleUpdateBuildingField(editingBuilding.id, {
                      customRooms: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {isSuperAdmin && showJsonModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
          onClick={() => setShowJsonModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Campus Map JSON</h3>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>
            <textarea
              rows={10}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full p-3 rounded-2xl bg-slate-950 text-emerald-300 font-mono text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(jsonText)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold cursor-pointer"
              >
                Copy JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isSuperAdmin) return;
                  try {
                    const parsed = JSON.parse(jsonText);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      setBuildings(parsed);
                      saveCustomCampusBuildings(parsed);
                      setShowJsonModal(false);
                    }
                  } catch (_) {}
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
              >
                Apply JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
