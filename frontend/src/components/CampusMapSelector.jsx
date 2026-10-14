/**
 * SmartComplaintHandler - Minimal Interactive IIIT Naya Raipur Map & Pin Labeler
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  IIITNR_CAMPUS_METADATA,
  IIITNR_MAP_UPDATED_EVENT,
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
  const [buildings, setBuildings] = useState(() => getCampusBuildings());
  const [mapMode, setMapMode] = useState('interactive'); // 'interactive' | 'osm_live'
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [editingBuildingId, setEditingBuildingId] = useState(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [customMapBg, setCustomMapBg] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('iiitnr_custom_map_bg') || '' : ''
  );

  const mapContainerRef = useRef(null);

  useEffect(() => {
    const handleUpdate = () => setBuildings(getCampusBuildings());
    window.addEventListener(IIITNR_MAP_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(IIITNR_MAP_UPDATED_EVENT, handleUpdate);
  }, []);

  const activeBuildingObj =
    buildings.find(
      (b) => b.name === selectedBuilding || b.id === selectedBuilding || b.shortName === selectedBuilding
    ) || buildings[0];

  const editingBuilding =
    buildings.find((b) => b.id === editingBuildingId) || activeBuildingObj;

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
    if (e.target.closest('[data-pin-id]')) return;

    const coords = computeCoordsFromEvent(e);
    if (!coords) return;

    const newId = `zone_${Date.now()}`;
    const idx = buildings.length + 1;
    const newZone = {
      id: newId,
      name: `New Building ${idx}`,
      shortName: `Block ${idx}`,
      type: 'Hostel / Block',
      category: 'HOSTEL',
      wings: ['Wing A', 'Wing B'],
      floors: ['G', '1', '2', '3'],
      roomsPerFloor: 24,
      roomPrefix: 'Room ',
      customRooms: [],
      mapPin: {
        xPct: coords.xPct,
        yPct: coords.yPct,
        lat: coords.lat,
        lng: coords.lng,
        color: '#4f46e5',
        badge: `B-${idx}`,
      },
      gps: `${coords.lat}° N, ${coords.lng}° E`,
    };

    const updated = [...buildings, newZone];
    setBuildings(updated);
    saveCustomCampusBuildings(updated);
    setEditingBuildingId(newId);
    onSelectBuilding && onSelectBuilding(newZone.name);
  };

  const handleMouseMove = (e) => {
    if (!isEditMode || !draggingId) return;
    const coords = computeCoordsFromEvent(e);
    if (!coords) return;

    setBuildings((prev) =>
      prev.map((b) =>
        b.id !== draggingId
          ? b
          : {
              ...b,
              gps: `${coords.lat}° N, ${coords.lng}° E`,
              mapPin: { ...(b.mapPin || {}), xPct: coords.xPct, yPct: coords.yPct, lat: coords.lat, lng: coords.lng },
            }
      )
    );
  };

  const handleMouseUp = () => {
    if (draggingId) {
      saveCustomCampusBuildings(buildings);
      setDraggingId(null);
    }
  };

  const handleUpdateBuildingField = (buildingId, updates) => {
    const updated = buildings.map((b) => {
      if (b.id !== buildingId) return b;
      const merged = { ...b, ...updates };
      if (updates.badge) {
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
    if (buildings.length <= 1) return;
    const remaining = buildings.filter((b) => b.id !== buildingId);
    setBuildings(remaining);
    saveCustomCampusBuildings(remaining);
    setEditingBuildingId(remaining[0].id);
    onSelectBuilding && onSelectBuilding(remaining[0].name);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setCustomMapBg(ev.target.result);
        localStorage.setItem('iiitnr_custom_map_bg', ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Minimal Toolbar */}
      <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-slate-800">Campus Map</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">
            {isEditMode
              ? 'Click map to add pin, or drag pins to reposition'
              : activeBuildingObj?.name}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setMapMode('interactive')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                mapMode === 'interactive' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Pins
            </button>
            <button
              type="button"
              onClick={() => setMapMode('osm_live')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                mapMode === 'osm_live' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Live Map
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsEditMode((prev) => !prev);
              setEditingBuildingId(activeBuildingObj?.id || buildings[0]?.id);
              setMapMode('interactive');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
              isEditMode
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isEditMode ? 'Done Editing' : 'Edit / Label Map'}
          </button>
        </div>
      </div>

      {/* Map Surface */}
      {mapMode === 'interactive' ? (
        <div className="p-3 space-y-3">
          <div
            ref={mapContainerRef}
            onClick={handleMapCanvasClick}
            style={{
              height: '290px',
              backgroundImage: customMapBg ? `url(${customMapBg})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            className={`relative w-full rounded-xl border overflow-hidden select-none bg-slate-950 ${
              isEditMode ? 'border-indigo-500 cursor-crosshair' : 'border-slate-200'
            }`}
          >
            {!customMapBg && (
              <svg
                viewBox="0 0 840 360"
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern id="minGrid" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path
                      d="M 32 0 L 0 0 0 32"
                      fill="none"
                      stroke="rgba(148, 163, 184, 0.08)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="840" height="360" fill="url(#minGrid)" />
                <path
                  d="M 410 350 L 410 130 M 70 210 L 770 210 M 70 130 L 650 130 M 650 50 L 650 330"
                  stroke="rgba(71, 85, 105, 0.35)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
              </svg>
            )}

            {buildings.map((b, idx) => {
              const xPct = b.mapPin?.xPct ?? Math.min(88, 15 + (idx % 4) * 22);
              const yPct = b.mapPin?.yPct ?? Math.min(85, 22 + Math.floor(idx / 4) * 28);
              const badge = b.mapPin?.badge || b.mapZone?.badge || `B-${idx + 1}`;
              const isSelected = activeBuildingObj?.id === b.id;

              return (
                <div
                  key={b.id}
                  data-pin-id={b.id}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setEditingBuildingId(b.id);
                    onSelectBuilding && onSelectBuilding(b.name);
                    if (isEditMode) setDraggingId(b.id);
                  }}
                  style={{
                    left: `${xPct}%`,
                    top: `${yPct}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute z-10 ${isEditMode ? 'cursor-move' : 'cursor-pointer'}`}
                >
                  <div
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center space-x-1.5 shadow-sm transition-transform ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-white scale-105'
                        : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-[10px] font-mono opacity-75">{badge}</span>
                    <span className="truncate max-w-[120px]">{b.shortName || b.name}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compact Inline Editor Drawer (Only when Edit Mode is active) */}
          {isEditMode && editingBuilding && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">
                  Editing: {editingBuilding.name}
                </span>
                <div className="flex items-center space-x-2">
                  <label className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-medium cursor-pointer hover:bg-slate-100">
                    Upload Map Image
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setJsonText(JSON.stringify(buildings, null, 2));
                      setShowJsonModal(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-medium cursor-pointer hover:bg-slate-100"
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuildings(resetCampusBuildingsToDefault())}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-500 text-[11px] cursor-pointer hover:bg-slate-100"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBuilding(editingBuilding.id)}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-medium cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Building / Hostel Name</label>
                  <input
                    type="text"
                    value={editingBuilding.name}
                    onChange={(e) =>
                      handleUpdateBuildingField(editingBuilding.id, {
                        name: e.target.value,
                        shortName: e.target.value.split(' (')[0],
                      })
                    }
                    className="enterprise-input"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Code &amp; Category</label>
                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      value={editingBuilding.mapPin?.badge || ''}
                      onChange={(e) => handleUpdateBuildingField(editingBuilding.id, { badge: e.target.value })}
                      className="enterprise-input w-20 font-mono"
                      placeholder="BH-1"
                    />
                    <select
                      value={editingBuilding.category}
                      onChange={(e) => handleUpdateBuildingField(editingBuilding.id, { category: e.target.value })}
                      className="enterprise-input flex-1"
                    >
                      <option value="HOSTEL">Hostel</option>
                      <option value="ACADEMIC">Academic / Lab</option>
                      <option value="AMENITY">Amenity / Mess</option>
                      <option value="INFRASTRUCTURE">Grounds / Gate</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Wings &amp; Floors (comma-sep)</label>
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
                      className="enterprise-input flex-1"
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
                      placeholder="G, 1, 2, 3"
                      className="enterprise-input w-24 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3">
          <div className="rounded-xl overflow-hidden border border-slate-200 h-64">
            <iframe
              title="IIIT Naya Raipur Live Map"
              src={IIITNR_CAMPUS_METADATA.osmEmbedUrl}
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {showJsonModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setShowJsonModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-3 shadow-xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Campus Map JSON</h3>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>
            <textarea
              rows={9}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 text-emerald-300 font-mono text-xs"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(jsonText)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
              >
                Copy
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
                    }
                  } catch (_) {}
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
