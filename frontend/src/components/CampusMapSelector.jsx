/**
 * SmartComplaintHandler - Interactive IIIT Naya Raipur Map & Custom Labeling Studio
 *
 * Capabilities:
 * 1. SELECT MODE: Click any labeled pin on the IIIT Naya Raipur campus map to select that Hostel,
 *    Academic Block, Lab, or Utility and auto-populate its floors, wings, and room numbers.
 * 2. LABEL & EDIT MAP MODE ("✏️ Label / Edit Campus Map"):
 *    - Click ANYWHERE on the interactive map (or drag existing pins) to place or move a building/hostel marker!
 *    - Rename any Hostel or Building, change its badge code, category (HOSTEL / ACADEMIC / AMENITY / INFRASTRUCTURE),
 *      customize its Wings (e.g., Wing A, Wing B, Pod 1), Floors (e.g., G, 1, 2, 3), Rooms-per-floor count,
 *      or enter exact custom room numbers / lab names!
 *    - Upload a custom campus map image URL/file or switch between Satellite/Street Map and Blueprint grid.
 *    - Export / Import JSON config so you can share your exact IIIT-NR layout or save it permanently.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  IIITNR_CAMPUS_METADATA,
  IIITNR_MAP_UPDATED_EVENT,
  getCampusBuildings,
  saveCustomCampusBuildings,
  resetCampusBuildingsToDefault,
} from '../data/iiitnrCampusData';

const CATEGORY_COLORS = {
  HOSTEL: '#4f46e5',
  GIRLS_HOSTEL: '#db2777',
  ACADEMIC: '#0284c7',
  AMENITY: '#ea580c',
  INFRASTRUCTURE: '#059669',
};

export default function CampusMapSelector({
  selectedBuilding,
  onSelectBuilding,
  selectedRoom = '',
  onSelectRoom,
  studentSavedHostel = '',
  studentSavedRoom = '',
}) {
  const [buildings, setBuildings] = useState(() => getCampusBuildings());
  const [mapMode, setMapMode] = useState('interactive'); // 'interactive' | 'osm_live'
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [editingBuildingId, setEditingBuildingId] = useState(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [statusBanner, setStatusBanner] = useState(null);
  const [customMapBg, setCustomMapBg] = useState(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('iiitnr_custom_map_bg') || ''
      : '';
  });

  const mapContainerRef = useRef(null);

  useEffect(() => {
    const handleUpdate = () => {
      setBuildings(getCampusBuildings());
    };
    window.addEventListener(IIITNR_MAP_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(IIITNR_MAP_UPDATED_EVENT, handleUpdate);
  }, []);

  const activeBuildingObj =
    buildings.find(
      (b) => b.name === selectedBuilding || b.id === selectedBuilding || b.shortName === selectedBuilding
    ) || buildings[0];

  const editingBuilding =
    buildings.find((b) => b.id === editingBuildingId) || activeBuildingObj;

  const flashBanner = (msg) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 3500);
  };

  // Convert a mouse click or drag event inside mapContainerRef into (xPct, yPct) and approximate IIIT-NR GPS
  const computeCoordsFromEvent = (e) => {
    if (!mapContainerRef.current) return null;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const xPct = Math.max(4, Math.min(96, Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1))));
    const yPct = Math.max(6, Math.min(94, Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1))));
    const lat = Number((21.1315 - (yPct / 100) * 0.0062).toFixed(4));
    const lng = Number((81.7625 + (xPct / 100) * 0.0072).toFixed(4));
    return { xPct, yPct, lat, lng };
  };

  const handleMapCanvasClick = (e) => {
    if (!isEditMode || draggingId) return;
    // Ignore clicks directly on existing pins
    if (e.target.closest('[data-pin-id]')) return;

    const coords = computeCoordsFromEvent(e);
    if (!coords) return;

    const newId = `custom_zone_${Date.now()}`;
    const newZone = {
      id: newId,
      name: `New Campus Building (${buildings.length + 1})`,
      shortName: `Block ${buildings.length + 1}`,
      type: 'Hostel / Campus Block',
      category: 'HOSTEL',
      gender: 'All',
      wings: ['Wing A', 'Wing B'],
      floors: ['G', '1', '2', '3'],
      roomsPerFloor: 24,
      roomPrefix: 'Room ',
      customRooms: [],
      capacity: 'Custom Labeled Zone',
      amenities: ['Wi-Fi', 'RO Water', 'Electrical'],
      mapPin: {
        xPct: coords.xPct,
        yPct: coords.yPct,
        lat: coords.lat,
        lng: coords.lng,
        color: '#4f46e5',
        badge: `Z-${buildings.length + 1}`,
      },
      mapZone: {
        x: Math.round((coords.xPct / 100) * 760),
        y: Math.round((coords.yPct / 100) * 320),
        width: 130,
        height: 58,
        color: '#4f46e5',
        badge: `Z-${buildings.length + 1}`,
      },
      gps: `${coords.lat}° N, ${coords.lng}° E`,
      description: 'Custom labeled IIIT-NR building. Edit its name, floors, wings, and rooms below.',
    };

    const updated = [...buildings, newZone];
    setBuildings(updated);
    saveCustomCampusBuildings(updated);
    setEditingBuildingId(newId);
    onSelectBuilding && onSelectBuilding(newZone.name);
    flashBanner(`📍 Added "${newZone.shortName}" at (${coords.lat}° N, ${coords.lng}° E). Edit its label & rooms below!`);
  };

  const handleMouseMove = (e) => {
    if (!isEditMode || !draggingId) return;
    const coords = computeCoordsFromEvent(e);
    if (!coords) return;

    setBuildings((prev) =>
      prev.map((b) => {
        if (b.id !== draggingId) return b;
        return {
          ...b,
          gps: `${coords.lat}° N, ${coords.lng}° E`,
          mapPin: {
            ...(b.mapPin || {}),
            xPct: coords.xPct,
            yPct: coords.yPct,
            lat: coords.lat,
            lng: coords.lng,
          },
        };
      })
    );
  };

  const handleMouseUp = () => {
    if (draggingId) {
      saveCustomCampusBuildings(buildings);
      setDraggingId(null);
      flashBanner('✓ Saved new pin position on campus map.');
    }
  };

  const handleUpdateBuildingField = (buildingId, updates) => {
    const updated = buildings.map((b) => {
      if (b.id !== buildingId) return b;
      const merged = { ...b, ...updates };
      if (updates.badge || updates.color) {
        merged.mapPin = {
          ...(b.mapPin || {}),
          badge: updates.badge ?? b.mapPin?.badge ?? 'BLDG',
          color: updates.color ?? b.mapPin?.color ?? '#4f46e5',
        };
        merged.mapZone = {
          ...(b.mapZone || {}),
          badge: updates.badge ?? b.mapZone?.badge ?? 'BLDG',
          color: updates.color ?? b.mapZone?.color ?? '#4f46e5',
        };
      }
      return merged;
    });
    setBuildings(updated);
    saveCustomCampusBuildings(updated);
    const target = updated.find((b) => b.id === buildingId);
    if (target && onSelectBuilding) {
      onSelectBuilding(target.name);
    }
  };

  const handleDeleteBuilding = (buildingId) => {
    if (buildings.length <= 1) return;
    const remaining = buildings.filter((b) => b.id !== buildingId);
    setBuildings(remaining);
    saveCustomCampusBuildings(remaining);
    setEditingBuildingId(remaining[0].id);
    onSelectBuilding && onSelectBuilding(remaining[0].name);
    flashBanner('Removed building from campus map.');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (typeof dataUrl === 'string') {
        setCustomMapBg(dataUrl);
        localStorage.setItem('iiitnr_custom_map_bg', dataUrl);
        flashBanner('✓ Loaded custom campus map image background!');
      }
    };
    reader.readAsDataURL(file);
  };

  const hostelsList = buildings.filter((b) => b.category === 'HOSTEL');
  const otherBlocksList = buildings.filter((b) => b.category !== 'HOSTEL');

  return (
    <div
      className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Bar: Map Header, Edit/Label Toggle & View Switcher */}
      <div className="px-4 sm:px-5 py-3.5 bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isEditMode ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'
            }`}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-black tracking-tight text-white">
                IIIT Naya Raipur Interactive Campus Map
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                {isEditMode ? '✏️ MAP LABELING STUDIO ACTIVE' : '21.1284° N, 81.7661° E'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isEditMode
                ? 'Click anywhere on the map to drop a new Hostel/Building pin, drag pins to move them, and edit rooms below!'
                : 'Click any Hostel or Building pin on the map (or click "✏️ Label / Edit Map" to customize the campus layout)'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsEditMode((prev) => !prev);
              setEditingBuildingId(activeBuildingObj?.id || buildings[0]?.id);
              setMapMode('interactive');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isEditMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-white/10 hover:bg-white/20 text-amber-300 border-amber-400/30'
            }`}
          >
            {isEditMode ? '✓ Done Labeling Map' : '✏️ Label / Edit Campus Map'}
          </button>

          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setMapMode('interactive')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mapMode === 'interactive'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📍 Pin Map
            </button>
            <button
              type="button"
              onClick={() => setMapMode('osm_live')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mapMode === 'osm_live'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛰️ Live OSM GPS
            </button>
          </div>
        </div>
      </div>

      {statusBanner && (
        <div className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold flex items-center justify-between">
          <span>{statusBanner}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-white/80 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}

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
          Hostels ({hostelsList.length}):
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
          Blocks ({otherBlocksList.length}):
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

      {/* Main Interactive Pinning & Labeling Viewport */}
      {mapMode === 'interactive' ? (
        <div className="bg-slate-900 p-3 sm:p-4 space-y-4">
          <div
            ref={mapContainerRef}
            onClick={handleMapCanvasClick}
            style={{
              minHeight: '360px',
              backgroundImage: customMapBg
                ? `url(${customMapBg})`
                : 'radial-gradient(circle at 50% 45%, rgba(30, 58, 138, 0.38), rgba(2, 6, 23, 0.96))',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            className={`relative w-full h-80 sm:h-96 rounded-2xl border-2 overflow-hidden select-none transition-all ${
              isEditMode
                ? 'border-amber-400/80 cursor-crosshair'
                : 'border-slate-800 cursor-default'
            }`}
          >
            {/* Background Campus Roads & Grid Overlay (when no custom image is uploaded) */}
            {!customMapBg && (
              <svg
                viewBox="0 0 840 380"
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern id="pinMapGrid" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path
                      d="M 32 0 L 0 0 0 32"
                      fill="none"
                      stroke="rgba(148, 163, 184, 0.1)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="840" height="380" fill="url(#pinMapGrid)" />
                <rect
                  x="20"
                  y="18"
                  width="800"
                  height="344"
                  rx="18"
                  fill="none"
                  stroke="rgba(99, 102, 241, 0.3)"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
                {/* Campus Road Network */}
                <path
                  d="M 410 360 L 410 140 M 70 220 L 770 220 M 70 140 L 650 140 M 650 60 L 650 340"
                  stroke="rgba(71, 85, 105, 0.45)"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <text x="36" y="42" fill="#94a3b8" fontSize="11" fontWeight="bold">
                  IIIT NAYA RAIPUR CAMPUS MAP (SECTOR 24, ATAL NAGAR) — CLICK PINS OR TOGGLE &quot;LABEL / EDIT MAP&quot;
                </text>
              </svg>
            )}

            {/* Render Interactive Draggable/Clickable Building & Hostel Pins */}
            {buildings.map((b, idx) => {
              const xPct = b.mapPin?.xPct ?? Math.min(88, 15 + (idx % 4) * 22);
              const yPct = b.mapPin?.yPct ?? Math.min(85, 22 + Math.floor(idx / 4) * 28);
              const badge = b.mapPin?.badge || b.mapZone?.badge || `B-${idx + 1}`;
              const color =
                b.mapPin?.color ||
                b.mapZone?.color ||
                (b.category === 'HOSTEL' ? '#4f46e5' : '#0284c7');
              const isSelected = activeBuildingObj?.id === b.id;

              return (
                <div
                  key={b.id}
                  data-pin-id={b.id}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setEditingBuildingId(b.id);
                    onSelectBuilding && onSelectBuilding(b.name);
                    if (isEditMode) {
                      setDraggingId(b.id);
                    }
                  }}
                  style={{
                    left: `${xPct}%`,
                    top: `${yPct}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute z-10 group transition-shadow ${
                    isEditMode ? 'cursor-move' : 'cursor-pointer'
                  }`}
                >
                  <div
                    style={{
                      backgroundColor: isSelected ? color : 'rgba(15, 23, 42, 0.92)',
                      borderColor: isSelected ? '#ffffff' : color,
                    }}
                    className={`px-3 py-2 rounded-2xl border-2 shadow-lg flex items-center space-x-2 min-w-[125px] max-w-[190px] transition-transform ${
                      isSelected ? 'scale-105 ring-4 ring-sky-400/40' : 'hover:scale-105'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: isSelected ? 'rgba(0,0,0,0.35)' : color }}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black text-white shrink-0"
                    >
                      {badge}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-white truncate">
                        {b.shortName || b.name}
                      </div>
                      <div className="text-[10px] text-slate-300 truncate">
                        {b.type || b.category}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Floating Helper Pill inside Map */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <span className="px-3 py-1 rounded-xl bg-slate-950/85 border border-slate-700 text-[11px] font-semibold text-slate-200">
                {isEditMode
                  ? '💡 Tip: Click any empty spot to add a new building, or drag any pin to its real spot on campus!'
                  : `Selected: ${activeBuildingObj?.name || 'None'} ${selectedRoom ? `• ${selectedRoom}` : ''}`}
              </span>
            </div>
          </div>

          {/* LIVE MAP LABELING & ROOM EDITOR PANEL (Shown when isEditMode is true) */}
          {isEditMode && editingBuilding && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-amber-500/40 text-white space-y-4 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block">
                    Editing Pin #{editingBuilding.mapPin?.badge || editingBuilding.id}
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-white">
                    Customize Label, Wings, Floors &amp; Room Numbers for: {editingBuilding.name}
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer border border-slate-700">
                    🖼️ Upload Campus Map Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {customMapBg && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomMapBg('');
                        localStorage.removeItem('iiitnr_custom_map_bg');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-rose-300 text-[11px] font-bold cursor-pointer"
                    >
                      Clear Image
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setJsonText(JSON.stringify(buildings, null, 2));
                      setShowJsonModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer"
                  >
                    📋 Export / Import JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const def = resetCampusBuildingsToDefault();
                      setBuildings(def);
                      flashBanner('Reset campus map to default buildings.');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Full Hostel / Building Name
                  </label>
                  <input
                    type="text"
                    value={editingBuilding.name}
                    onChange={(e) =>
                      handleUpdateBuildingField(editingBuilding.id, { name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Map Pin Short Label
                  </label>
                  <input
                    type="text"
                    value={editingBuilding.shortName || ''}
                    onChange={(e) =>
                      handleUpdateBuildingField(editingBuilding.id, { shortName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Short Badge Code (e.g. BH-1, ACAD)
                  </label>
                  <input
                    type="text"
                    value={editingBuilding.mapPin?.badge || editingBuilding.mapZone?.badge || ''}
                    onChange={(e) =>
                      handleUpdateBuildingField(editingBuilding.id, { badge: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={editingBuilding.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      handleUpdateBuildingField(editingBuilding.id, {
                        category: cat,
                        type: cat === 'HOSTEL' ? 'Student Hostel' : 'Campus Block',
                        color: CATEGORY_COLORS[cat] || '#4f46e5',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold"
                  >
                    <option value="HOSTEL">HOSTEL (Student Residence)</option>
                    <option value="ACADEMIC">ACADEMIC (Classrooms / Labs / Library)</option>
                    <option value="AMENITY">AMENITY (Mess / SAC / Canteen)</option>
                    <option value="INFRASTRUCTURE">INFRASTRUCTURE (Grounds / Gate / Power)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Wings / Blocks (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Wing A, Wing B"
                    value={
                      Array.isArray(editingBuilding.wings)
                        ? editingBuilding.wings.join(', ')
                        : 'Wing A, Wing B'
                    }
                    onChange={(e) => {
                      const wingsArr = e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      handleUpdateBuildingField(editingBuilding.id, { wings: wingsArr });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Floors (comma-separated, e.g. G, 1, 2, 3)
                  </label>
                  <input
                    type="text"
                    placeholder="G, 1, 2, 3"
                    value={
                      Array.isArray(editingBuilding.floors)
                        ? editingBuilding.floors
                            .map((f) => (typeof f === 'string' ? f : f.id))
                            .join(', ')
                        : 'G, 1, 2, 3'
                    }
                    onChange={(e) => {
                      const flArr = e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      handleUpdateBuildingField(editingBuilding.id, { floors: flArr });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Rooms per Floor (e.g. 24, 40)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={editingBuilding.roomsPerFloor || 24}
                    onChange={(e) =>
                      handleUpdateBuildingField(editingBuilding.id, {
                        roomsPerFloor: Number(e.target.value) || 24,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Custom Rooms / Labs Override (comma-sep)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 101, Lab 204, Mess Hall"
                    value={
                      Array.isArray(editingBuilding.customRooms)
                        ? editingBuilding.customRooms.join(', ')
                        : ''
                    }
                    onChange={(e) => {
                      const list = e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      handleUpdateBuildingField(editingBuilding.id, { customRooms: list });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400">
                  Pin Coordinates: <code className="text-emerald-400">{editingBuilding.gps}</code> (X: {editingBuilding.mapPin?.xPct ?? 50}%, Y: {editingBuilding.mapPin?.yPct ?? 50}%)
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteBuilding(editingBuilding.id)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-300 font-bold text-xs cursor-pointer"
                >
                  🗑️ Delete This Pin
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Live OpenStreetMap / GPS Satellite Embed for IIIT Naya Raipur */
        <div className="bg-slate-900 p-3 sm:p-4 space-y-3">
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 h-72 sm:h-80 relative">
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

      {/* JSON Export / Import Modal */}
      {showJsonModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
          onClick={() => setShowJsonModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Export / Import Your Labeled IIIT-NR Campus Map JSON
                </h3>
                <p className="text-xs text-slate-500">
                  Copy this JSON to share your labeled buildings and room numbers, or paste a JSON config to load it.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <textarea
              rows={12}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full p-3 rounded-2xl bg-slate-950 text-emerald-300 font-mono text-xs border border-slate-800"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(jsonText);
                  flashBanner('✓ Copied labeled campus JSON to clipboard!');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
              >
                Copy JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(jsonText);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      setBuildings(parsed);
                      saveCustomCampusBuildings(parsed);
                      setShowJsonModal(false);
                      flashBanner('✓ Imported custom campus map configuration!');
                    }
                  } catch (err) {
                    alert('Invalid JSON format: ' + err.message);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
              >
                Apply &amp; Save JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
