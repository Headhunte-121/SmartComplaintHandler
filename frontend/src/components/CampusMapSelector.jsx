/**
 * SmartComplaintHandler - Georeferenced IIIT Naya Raipur Interactive Map (OSM + Satellite + Vector)
 * Rich visual design with quick hostel/building pills, real Leaflet OSM & Satellite tiles,
 * 1:1 traced OpenStreetMap campus plan, and live pin/room labeling studio — zero promotional filler.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
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
  const { isSuperAdmin } = useAuth();
  const [buildings, setBuildings] = useState(() => getCampusBuildings());
  const [mapMode, setMapMode] = useState('osm'); // 'osm' | 'satellite' | 'vector'
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBuildingId, setEditingBuildingId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState('');

  const leafletContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef({});
  const vectorContainerRef = useRef(null);

  useEffect(() => {
    const handleUpdate = () => setBuildings(getCampusBuildings());
    window.addEventListener(IIITNR_MAP_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(IIITNR_MAP_UPDATED_EVENT, handleUpdate);
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) {
      setIsEditMode(false);
      setDraggingId(null);
    }
  }, [isSuperAdmin]);

  const activeBuildingObj =
    buildings.find(
      (b) => b.name === selectedBuilding || b.id === selectedBuilding || b.shortName === selectedBuilding
    ) || buildings[0];

  const editingBuilding =
    buildings.find((b) => b.id === editingBuildingId) || activeBuildingObj;

  useEffect(() => {
    if (mapMode === 'vector') return;
    if (typeof window === 'undefined' || !window.L || !leafletContainerRef.current) return;

    const L = window.L;
    if (!leafletMapRef.current) {
      const map = L.map(leafletContainerRef.current, {
        center: [21.1282, 81.7653],
        zoom: 17,
        zoomControl: true,
      });
      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (mapMode === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, attribution: 'Esri Satellite · IIIT Naya Raipur' }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19, attribution: '© OpenStreetMap · IIIT Naya Raipur' }
      ).addTo(map);
    }

    setTimeout(() => map.invalidateSize(), 60);
  }, [mapMode]);

  useEffect(() => {
    if (mapMode === 'vector') return;
    const map = leafletMapRef.current;
    if (!map || typeof window === 'undefined' || !window.L) return;
    const L = window.L;

    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};

    buildings.forEach((b, idx) => {
      const lat = b.mapPin?.lat ?? 21.12815;
      const lng = b.mapPin?.lng ?? 81.7655;
      const isSelected = activeBuildingObj?.id === b.id;
      const badge = b.mapPin?.badge || `B-${idx + 1}`;
      const pinColor = b.mapPin?.color || (b.category === 'HOSTEL' ? '#4f46e5' : '#0284c7');

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          display:inline-flex;align-items:center;gap:6px;
          padding:5px 10px;border-radius:12px;
          font-family:Inter,sans-serif;font-size:11px;font-weight:700;white-space:nowrap;
          background:${isSelected ? pinColor : 'rgba(15,23,42,0.92)'};
          color:#ffffff;
          border:2px solid ${isSelected ? '#ffffff' : pinColor};
          box-shadow:0 4px 12px rgba(0,0,0,0.32);
          transform:translate(-50%, -50%);
        ">
          <span style="font-family:monospace;font-size:9.5px;background:rgba(255,255,255,0.18);padding:1px 5px;border-radius:4px;">${badge}</span>
          <span>${b.shortName || b.name}</span>
        </div>`,
        iconAnchor: [0, 0],
      });

      const marker = L.marker([lat, lng], {
        draggable: Boolean(isSuperAdmin && isEditMode),
        icon,
      }).addTo(map);

      marker.on('click', () => {
        setEditingBuildingId(b.id);
        onSelectBuilding && onSelectBuilding(b.name);
      });

      marker.on('dragend', (ev) => {
        if (!isSuperAdmin) return;
        const pos = ev.target.getLatLng();
        const newLat = Number(pos.lat.toFixed(5));
        const newLng = Number(pos.lng.toFixed(5));
        const xPct = Math.max(5, Math.min(95, Number((((newLng - 81.7628) / 0.0054) * 100).toFixed(1))));
        const yPct = Math.max(5, Math.min(95, Number((((21.1308 - newLat) / 0.0052) * 100).toFixed(1))));

        const updated = buildings.map((item) =>
          item.id !== b.id
            ? item
            : {
                ...item,
                gps: `${newLat}° N, ${newLng}° E`,
                mapPin: { ...(item.mapPin || {}), lat: newLat, lng: newLng, xPct, yPct },
              }
        );
        setBuildings(updated);
        saveCustomCampusBuildings(updated);
      });

      markersRef.current[b.id] = marker;
    });

    const handleMapClick = (e) => {
      if (!isSuperAdmin || !isEditMode) return;
      const newLat = Number(e.latlng.lat.toFixed(5));
      const newLng = Number(e.latlng.lng.toFixed(5));
      const xPct = Math.max(5, Math.min(95, Number((((newLng - 81.7628) / 0.0054) * 100).toFixed(1))));
      const yPct = Math.max(5, Math.min(95, Number((((21.1308 - newLat) / 0.0052) * 100).toFixed(1))));
      addPinAt(newLat, newLng, xPct, yPct);
    };

    map.off('click');
    map.on('click', handleMapClick);
  }, [buildings, activeBuildingObj, isEditMode, mapMode, isSuperAdmin]);

  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  const addPinAt = (lat, lng, xPct, yPct) => {
    if (!isSuperAdmin) return;
    const newId = `zone_${Date.now()}`;
    const idx = buildings.length + 1;
    const newZone = {
      id: newId,
      name: `New Building ${idx}`,
      shortName: `Block ${idx}`,
      type: 'Hostel / Campus Block',
      category: 'HOSTEL',
      wings: ['Wing A', 'Wing B'],
      floors: ['G', '1', '2', '3'],
      roomsPerFloor: 24,
      roomPrefix: 'Room ',
      customRooms: [],
      mapPin: { xPct, yPct, lat, lng, color: '#4f46e5', badge: `B-${idx}` },
      gps: `${lat}° N, ${lng}° E`,
    };
    const updated = [...buildings, newZone];
    setBuildings(updated);
    saveCustomCampusBuildings(updated);
    setEditingBuildingId(newId);
    onSelectBuilding && onSelectBuilding(newZone.name);
  };

  const computeVectorCoords = (e) => {
    if (!vectorContainerRef.current) return null;
    const rect = vectorContainerRef.current.getBoundingClientRect();
    const xPct = Math.max(4, Math.min(96, Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1))));
    const yPct = Math.max(6, Math.min(94, Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1))));
    const lat = Number((21.1308 - (yPct / 100) * 0.0052).toFixed(5));
    const lng = Number((81.7628 + (xPct / 100) * 0.0054).toFixed(5));
    return { xPct, yPct, lat, lng };
  };

  const handleVectorClick = (e) => {
    if (!isSuperAdmin || !isEditMode || draggingId) return;
    if (e.target.closest('[data-pin-id]')) return;
    const c = computeVectorCoords(e);
    if (c) addPinAt(c.lat, c.lng, c.xPct, c.yPct);
  };

  const handleVectorMouseMove = (e) => {
    if (!isSuperAdmin || !isEditMode || !draggingId) return;
    const c = computeVectorCoords(e);
    if (!c) return;
    setBuildings((prev) =>
      prev.map((b) =>
        b.id !== draggingId
          ? b
          : {
              ...b,
              gps: `${c.lat}° N, ${c.lng}° E`,
              mapPin: { ...(b.mapPin || {}), xPct: c.xPct, yPct: c.yPct, lat: c.lat, lng: c.lng },
            }
      )
    );
  };

  const handleVectorMouseUp = () => {
    if (!isSuperAdmin) {
      setDraggingId(null);
      return;
    }
    if (draggingId) {
      saveCustomCampusBuildings(buildings);
      setDraggingId(null);
    }
  };

  const handleUpdateBuildingField = (buildingId, updates) => {
    if (!isSuperAdmin) return;
    const updated = buildings.map((b) => {
      if (b.id !== buildingId) return b;
      const merged = { ...b, ...updates };
      if (updates.badge) merged.mapPin = { ...(b.mapPin || {}), badge: updates.badge };
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

  const hostelsList = buildings.filter((b) => b.category === 'HOSTEL');
  const otherBlocksList = buildings.filter((b) => b.category !== 'HOSTEL');

  return (
    <div
      className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden"
      onMouseMove={handleVectorMouseMove}
      onMouseUp={handleVectorMouseUp}
    >
      {/* Dark Architectural Map Header */}
      <div className="px-5 py-3.5 bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isEditMode ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'
            }`}
          />
          <span className="text-xs sm:text-sm font-black tracking-tight text-white">
            IIIT Naya Raipur Campus Map
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            {activeBuildingObj?.gps || '21.1282° N, 81.7655° E'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
              {isEditMode ? '✓ Done Labeling' : '✏️ Edit / Label Map'}
            </button>
          )}

          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setMapMode('osm')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mapMode === 'osm' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🗺️ OSM Map
            </button>
            <button
              type="button"
              onClick={() => setMapMode('satellite')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mapMode === 'satellite' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🛰️ Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapMode('vector')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mapMode === 'vector' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              📐 Campus Plan
            </button>
          </div>
        </div>
      </div>

      {/* Quick Hostel & Building Pill Selector Bar */}
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
                if (leafletMapRef.current && h.mapPin?.lat) {
                  leafletMapRef.current.panTo([h.mapPin.lat, h.mapPin.lng]);
                }
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
                if (leafletMapRef.current && b.mapPin?.lat) {
                  leafletMapRef.current.panTo([b.mapPin.lat, b.mapPin.lng]);
                }
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

      {/* Map Viewport */}
      <div className="bg-slate-900 p-3 sm:p-4 space-y-3">
        <div
          ref={leafletContainerRef}
          style={{
            height: '360px',
            display: mapMode === 'vector' ? 'none' : 'block',
          }}
          className="w-full rounded-2xl border border-slate-800 overflow-hidden z-0"
        />

        {mapMode === 'vector' && (
          <div
            ref={vectorContainerRef}
            onClick={handleVectorClick}
            style={{ height: '360px' }}
            className={`relative w-full rounded-2xl border overflow-hidden select-none bg-[#f1efe9] ${
              isEditMode ? 'border-amber-400 cursor-crosshair' : 'border-slate-800'
            }`}
          >
            {/* 1:1 Traced OpenStreetMap Geometry of IIIT Naya Raipur */}
            <svg
              viewBox="0 0 800 500"
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="xMidYMid slice"
            >
              <polygon points="420,0 800,0 800,260 590,265" fill="#add19e" />
              <polygon
                points="235,68 485,95 628,312 548,478 58,378"
                fill="#ffffe5"
                stroke="#facc15"
                strokeWidth="2"
              />
              <line
                x1="15"
                y1="380"
                x2="245"
                y2="0"
                stroke="#94a3b8"
                strokeWidth="6"
                strokeDasharray="10 8"
              />
              <line x1="0" y1="405" x2="540" y2="510" stroke="#f7fabf" strokeWidth="18" />
              <line x1="0" y1="405" x2="540" y2="510" stroke="#cbd5e1" strokeWidth="1.5" />
              <polyline
                points="290,0 520,270 628,308 800,305"
                fill="none"
                stroke="#b48ead"
                strokeWidth="3"
                strokeDasharray="12 6 3 6"
              />
              <g stroke="#ffffff" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <line x1="72" y1="365" x2="225" y2="85" />
                <line x1="185" y1="395" x2="275" y2="195" />
                <line x1="72" y1="365" x2="365" y2="435" />
                <line x1="115" y1="280" x2="275" y2="195" />
                <polyline points="350,468 395,355 465,335 505,285 450,210 385,125 445,88" />
                <polyline points="275,195 395,355" />
                <path d="M 415,345 Q 455,310 475,335" />
                <polyline points="505,285 528,340 610,355" />
              </g>
              <g stroke="#cbd5e1" strokeWidth="1" fill="none">
                <line x1="72" y1="365" x2="225" y2="85" />
                <polyline points="350,468 395,355 465,335 505,285 450,210 385,125 445,88" />
              </g>
              <text
                x="355"
                y="245"
                textAnchor="middle"
                fill="#78716c"
                fontSize="13"
                fontStyle="italic"
                fontWeight="600"
                opacity="0.65"
              >
                International Institute of Information Technology Naya Raipur
              </text>
            </svg>

            {buildings.map((b, idx) => {
              const xPct = b.mapPin?.xPct ?? 45;
              const yPct = b.mapPin?.yPct ?? 50;
              const badge = b.mapPin?.badge || `B-${idx + 1}`;
              const color = b.mapPin?.color || (b.category === 'HOSTEL' ? '#4f46e5' : '#0284c7');
              const isSelected = activeBuildingObj?.id === b.id;

              return (
                <div
                  key={b.id}
                  data-pin-id={b.id}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setEditingBuildingId(b.id);
                    onSelectBuilding && onSelectBuilding(b.name);
                    if (isSuperAdmin && isEditMode) setDraggingId(b.id);
                  }}
                  style={{
                    left: `${xPct}%`,
                    top: `${yPct}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute z-10 ${isSuperAdmin && isEditMode ? 'cursor-move' : 'cursor-pointer'}`}
                >
                  <div
                    style={{
                      backgroundColor: isSelected ? color : 'rgba(15, 23, 42, 0.92)',
                      borderColor: isSelected ? '#ffffff' : color,
                    }}
                    className={`px-2.5 py-1.5 rounded-xl border-2 text-xs font-bold text-white flex items-center space-x-1.5 shadow-md transition-transform ${
                      isSelected ? 'scale-105 ring-4 ring-sky-400/30' : 'hover:scale-105'
                    }`}
                  >
                    <span className="text-[9.5px] font-mono bg-white/15 px-1.5 py-0.5 rounded">
                      {badge}
                    </span>
                    <span className="truncate max-w-[120px]">{b.shortName || b.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Building Telemetry Bar */}
        <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-mono text-[10px] font-bold">
              {activeBuildingObj?.mapPin?.badge || 'BLDG'}
            </span>
            <span className="font-bold text-white">{activeBuildingObj?.name}</span>
            <span className="text-slate-500">·</span>
            <span className="text-[11px] text-slate-400">{activeBuildingObj?.type}</span>
          </div>

          <div className="flex items-center space-x-2">
            {selectedRoom && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-mono text-[11px] font-bold">
                📍 {selectedRoom}
              </span>
            )}
            <a
              href={IIITNR_CAMPUS_METADATA.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-[11px]"
            >
              Google Maps ↗
            </a>
          </div>
        </div>

        {/* Inline Editor Drawer (when Edit / Label is active) */}
        {isSuperAdmin && isEditMode && editingBuilding && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 text-white space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <span className="font-bold text-amber-300">
                Editing Pin: {editingBuilding.name} ({editingBuilding.gps})
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
                  onClick={() => handleDeleteBuilding(editingBuilding.id)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[11px] font-bold cursor-pointer"
                >
                  Delete Pin
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
                <label className="block text-[11px] text-slate-400 mb-1">Badge Code &amp; Category</label>
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    value={editingBuilding.mapPin?.badge || ''}
                    onChange={(e) => handleUpdateBuildingField(editingBuilding.id, { badge: e.target.value })}
                    className="w-24 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  />
                  <select
                    value={editingBuilding.category}
                    onChange={(e) => handleUpdateBuildingField(editingBuilding.id, { category: e.target.value })}
                    className="flex-1 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  >
                    <option value="HOSTEL">Hostel</option>
                    <option value="ACADEMIC">Academic / Lab</option>
                    <option value="AMENITY">Amenity / Mess</option>
                    <option value="INFRASTRUCTURE">Grounds / Gate</option>
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
                <label className="block text-[11px] text-slate-400 mb-1">Rooms/Floor or Custom List</label>
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

      {showJsonModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
          onClick={() => setShowJsonModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Campus Map JSON</h3>
                <p className="text-[11px] text-slate-500">
                  {isSuperAdmin
                    ? 'Export or import custom IIIT-NR campus layout JSON.'
                    : 'View or copy campus JSON (Super Admin required to apply changes).'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <textarea
              rows={10}
              value={jsonText}
              readOnly={!isSuperAdmin}
              onChange={(e) => isSuperAdmin && setJsonText(e.target.value)}
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
              {isSuperAdmin && (
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
