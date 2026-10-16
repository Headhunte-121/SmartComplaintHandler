/**
 * frontend/src/components/CampusMapSelector.jsx
 *
 * Modular Orchestrator for the IIIT Naya Raipur Interactive Campus Digital Twin.
 * Composes:
 * - DigitalTwinSearchBar (Smart Omni-Search & Sub-Wing Auto-Detector)
 * - DigitalTwinCanvas (Pure-Vector 1:1 Satellite-Traced Polygon SVG Renderer)
 * - DigitalTwinInspector (Floor, Wing, Room & Lab Explorer + Super Admin Editor)
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  IIITNR_MAP_UPDATED_EVENT,
  getCampusBuildings,
  saveCustomCampusBuildings,
  resetCampusBuildingsToDefault,
  getFloorsForBuilding,
  getRoomsForBuilding,
  buildCampusSearchIndex,
  queryCampusSearchIndex,
} from '../data/iiitnrCampusData';
import DigitalTwinSearchBar from './campusTwin/DigitalTwinSearchBar';
import DigitalTwinCanvas from './campusTwin/DigitalTwinCanvas';
import DigitalTwinInspector from './campusTwin/DigitalTwinInspector';

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
  const [twinTheme, setTwinTheme] = useState('architectural'); // 'architectural' | 'blueprint'
  const [showLabels, setShowLabels] = useState(true);
  const [showPathsAndCourts, setShowPathsAndCourts] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [hoveredBoundary, setHoveredBoundary] = useState(false);
  const [hoveredPillar, setHoveredPillar] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  // SVG Camera Viewport State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Radar Locator Beam for Auto-Detection
  const [radarTarget, setRadarTarget] = useState(null);

  // Super Admin Edit Controls
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBuildingId, setEditingBuildingId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState('');

  // Omni-Search & Auto-Detector State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [autoDetectNotice, setAutoDetectNotice] = useState(null);

  // Digital Twin Floor & Facility Inspector State
  const [inspectorFloor, setInspectorFloor] = useState('G');

  const svgRef = useRef(null);
  const radarTimerRef = useRef(null);

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

  const activeBuildingObj = useMemo(() => {
    return (
      buildings.find(
        (b) => b.name === selectedBuilding || b.id === selectedBuilding || b.shortName === selectedBuilding
      ) || buildings[0]
    );
  }, [buildings, selectedBuilding]);

  const hoveredBuildingObj = useMemo(() => {
    return buildings.find((b) => b.id === hoveredId) || activeBuildingObj;
  }, [buildings, hoveredId, activeBuildingObj]);

  const editingBuilding = useMemo(() => {
    return buildings.find((b) => b.id === editingBuildingId) || activeBuildingObj;
  }, [buildings, editingBuildingId, activeBuildingObj]);

  const availableFloors = useMemo(() => {
    if (!activeBuildingObj) return [];
    return getFloorsForBuilding(activeBuildingObj.id, buildings);
  }, [activeBuildingObj, buildings]);

  const inspectorRooms = useMemo(() => {
    if (!activeBuildingObj) return [];
    return getRoomsForBuilding(activeBuildingObj.id, inspectorFloor, null, buildings);
  }, [activeBuildingObj, inspectorFloor, buildings]);

  useEffect(() => {
    if (availableFloors.length > 0) {
      const matchFloor = availableFloors.find((f) => String(f.id) === String(inspectorFloor));
      if (!matchFloor) setInspectorFloor(availableFloors[0].id);
    }
  }, [activeBuildingObj?.id, availableFloors]);

  // Search Index & Ranked Query Results
  const searchIndex = useMemo(() => buildCampusSearchIndex(buildings), [buildings]);
  const searchResults = useMemo(
    () => queryCampusSearchIndex(searchQuery, searchIndex, 10),
    [searchQuery, searchIndex]
  );

  const panToTarget = (cx, cy, targetZoom = 1.42, label = '') => {
    const clampedZoom = Math.min(2.4, Math.max(1, targetZoom));
    const targetPanX = 390 - cx * clampedZoom;
    const targetPanY = 428 - cy * clampedZoom;

    setZoom(clampedZoom);
    setPan({ x: targetPanX, y: targetPanY });

    setRadarTarget({ cx, cy, label });
    if (radarTimerRef.current) clearTimeout(radarTimerRef.current);
    radarTimerRef.current = setTimeout(() => {
      setRadarTarget(null);
    }, 4500);
  };

  const handleSelectSearchResult = (item) => {
    setSearchQuery('');
    setIsSearchFocused(false);

    if (onSelectBuilding) onSelectBuilding(item.buildingName);
    setEditingBuildingId(item.buildingId);

    if (item.floorId) setInspectorFloor(item.floorId);
    if (item.roomName && onSelectRoom) onSelectRoom(item.roomName);

    panToTarget(item.cx, item.cy, 1.48, item.roomName || item.shortName);

    setAutoDetectNotice({
      title: item.title,
      building: item.buildingName,
      room: item.roomName,
      floor: item.floorLabel || (item.floorId ? `Floor ${item.floorId}` : 'Ground Floor'),
      gps: `(${Math.round(item.cx)}, ${Math.round(item.cy)})`,
    });
  };

  const clientToSvgCoords = (e) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = -55 + ((e.clientX - rect.left) / rect.width) * 840;
    const rawY = ((e.clientY - rect.top) / rect.height) * 857;
    const cx = Math.round(Math.max(-50, Math.min(780, (rawX - pan.x) / zoom)));
    const cy = Math.round(Math.max(15, Math.min(850, (rawY - pan.y) / zoom)));
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
      name: `Custom Digital Twin Zone ${idx}`,
      shortName: `Zone ${idx}`,
      type: 'Custom Twin Facility',
      category: 'AMENITY',
      floors: [{ id: 'G', label: 'Ground Floor', rooms: [`Zone ${idx} Main Facility`] }],
      roomsPerFloor: 12,
      roomPrefix: 'Room ',
      customRooms: [],
      trace: {
        cx: coords.cx,
        cy: coords.cy,
        w: 48,
        h: 44,
        angle: 18,
        shape: 'courtyard_quad',
        color: '#4f46e5',
        badge: `Z-${idx}`,
      },
      mapPin: { badge: `Z-${idx}`, color: '#4f46e5' },
      gps: `Campus (${coords.cx}, ${coords.cy})`,
      description: 'Custom facility placed into the IIIT Naya Raipur Digital Twin.',
    };

    const updated = [...buildings, newBldg];
    setBuildings(updated);
    saveCustomCampusBuildings(updated);
    setEditingBuildingId(newId);
    if (onSelectBuilding) onSelectBuilding(newBldg.name);
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
      if (isSuperAdmin) saveCustomCampusBuildings(buildings);
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
    if (onSelectBuilding) onSelectBuilding(remaining[0].name);
  };

  const hostelsList = buildings.filter((b) => b.category === 'HOSTEL');
  const otherBlocksList = buildings.filter((b) => b.category !== 'HOSTEL');

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* Top Digital Twin Control & Header Bar */}
      <div className="px-5 py-3.5 bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isEditMode ? 'bg-amber-400 animate-ping' : 'bg-[#A7AD89] animate-pulse'
            }`}
          />
          <span className="text-xs sm:text-sm font-black tracking-tight text-white">
            IIIT Naya Raipur Interactive Digital Twin
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-[#A7AD89]/20 text-[#DAD0C6] border border-[#A7AD89]/30">
            1:1 Polygon Traced · 18 Zones · Official Labs (1xx–3xx)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.4, Number((z + 0.25).toFixed(2))))}
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

          <button
            type="button"
            onClick={() => setShowBoundary((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
              showBoundary
                ? 'bg-purple-500/20 border-purple-400/40 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {showBoundary ? 'Boundary: 50 Acres' : 'Boundary: Off'}
          </button>

          <button
            type="button"
            onClick={() => setShowPathsAndCourts((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
              showPathsAndCourts
                ? 'bg-[#8C906D]/20 border-[#8C906D]/40 text-[#DAD0C6]'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {showPathsAndCourts ? 'Paths: On' : 'Paths: Minimal'}
          </button>

          <button
            type="button"
            onClick={() => setShowLabels((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white cursor-pointer"
          >
            {showLabels ? 'Labels: On' : 'Labels: Hover'}
          </button>

          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setTwinTheme('architectural')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                twinTheme === 'architectural' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🏛️ 3D Twin
            </button>
            <button
              type="button"
              onClick={() => setTwinTheme('blueprint')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                twinTheme === 'blueprint' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              📐 Blueprint
            </button>
          </div>

          <a
            href="/iiitnr_gis_studio.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-xl bg-sky-500/15 border border-sky-400/40 text-[11px] font-bold text-sky-300 hover:bg-sky-500/25 transition-all inline-flex items-center gap-1.5 cursor-pointer no-underline"
            title="Open Interactive GIS Studio with real Google Satellite footage and vector curb editor"
          >
            <span>🛰️</span>
            <span>GIS Studio</span>
          </a>

          {isSuperAdmin ? (
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
              {isEditMode ? '✓ Done Editing' : '✏️ Edit / Label'}
            </button>
          ) : (
            <span className="text-[10px] font-mono text-slate-500 px-2 py-1 rounded bg-slate-900 border border-slate-800">
              🔒 Twin Locked
            </span>
          )}
        </div>
      </div>

      {/* Smart Omni-Search & Auto-Detector Bar */}
      <DigitalTwinSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchFocused={isSearchFocused}
        setIsSearchFocused={setIsSearchFocused}
        searchResults={searchResults}
        onSelectSearchResult={handleSelectSearchResult}
        autoDetectNotice={autoDetectNotice}
        setAutoDetectNotice={setAutoDetectNotice}
      />

      {/* Quick Hostel & Digital Twin Zone Selector Pills */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto">
        {studentSavedHostel && (
          <button
            type="button"
            onClick={() => {
              if (onSelectBuilding) onSelectBuilding(studentSavedHostel);
              if (studentSavedRoom && onSelectRoom) onSelectRoom(studentSavedRoom);
              const target = buildings.find((b) => b.name === studentSavedHostel);
              if (target?.trace) panToTarget(target.trace.cx, target.trace.cy, 1.4, studentSavedRoom);
            }}
            className="px-2.5 py-1 rounded-lg bg-[#8C906D] hover:bg-[#A7AD89] text-[#0A110D] text-[11px] font-bold shrink-0 cursor-pointer shadow-xs transition-colors"
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
                if (onSelectBuilding) onSelectBuilding(h.name);
                if (h.trace) panToTarget(h.trace.cx, h.trace.cy, 1.35, h.shortName);
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
          Campus, Labs, Canteen, Aud. & Grounds:
        </span>
        {otherBlocksList.map((b) => {
          const isSelected = activeBuildingObj?.id === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setEditingBuildingId(b.id);
                if (onSelectBuilding) onSelectBuilding(b.name);
                if (b.trace) panToTarget(b.trace.cx, b.trace.cy, 1.35, b.shortName);
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

      {/* Main Digital Twin Canvas + Floor/Room/Lab Inspector */}
      <div className="bg-[#070c18] p-3 sm:p-4 space-y-3">
        <DigitalTwinCanvas
          svgRef={svgRef}
          buildings={buildings}
          activeBuildingObj={activeBuildingObj}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onSelectBuilding={onSelectBuilding}
          setEditingBuildingId={setEditingBuildingId}
          setDraggingId={setDraggingId}
          isSuperAdmin={isSuperAdmin}
          isEditMode={isEditMode}
          twinTheme={twinTheme}
          showLabels={showLabels}
          showPathsAndCourts={showPathsAndCourts}
          showBoundary={showBoundary}
          hoveredBoundary={hoveredBoundary}
          setHoveredBoundary={setHoveredBoundary}
          hoveredPillar={hoveredPillar}
          setHoveredPillar={setHoveredPillar}
          zoom={zoom}
          pan={pan}
          radarTarget={radarTarget}
          handleSvgClick={handleSvgClick}
          handleMouseDown={handleMouseDown}
          handleMouseMove={handleMouseMove}
          handleMouseUp={handleMouseUp}
        />

        <DigitalTwinInspector
          activeBuildingObj={activeBuildingObj}
          hoveredBuildingObj={hoveredBuildingObj}
          selectedRoom={selectedRoom}
          onSelectBuilding={onSelectBuilding}
          onSelectRoom={onSelectRoom}
          availableFloors={availableFloors}
          inspectorFloor={inspectorFloor}
          setInspectorFloor={setInspectorFloor}
          inspectorRooms={inspectorRooms}
          isSuperAdmin={isSuperAdmin}
          isEditMode={isEditMode}
          editingBuilding={editingBuilding}
          handleUpdateBuildingField={handleUpdateBuildingField}
          handleDeleteBuilding={handleDeleteBuilding}
          onResetBuildings={() => setBuildings(resetCampusBuildingsToDefault())}
          onOpenJsonModal={() => {
            setJsonText(JSON.stringify(buildings, null, 2));
            setShowJsonModal(true);
          }}
        />
      </div>

      {/* JSON Export / Import Modal */}
      {isSuperAdmin && showJsonModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 space-y-3 text-white">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm">IIIT Naya Raipur Digital Twin JSON</h4>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <textarea
              rows={12}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#0A110D] border border-[#8C906D]/30 font-mono text-xs text-[#A7AD89]"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(jsonText);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      setBuildings(parsed);
                      saveCustomCampusBuildings(parsed);
                      setShowJsonModal(false);
                    }
                  } catch {
                    alert('Invalid JSON format');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
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
