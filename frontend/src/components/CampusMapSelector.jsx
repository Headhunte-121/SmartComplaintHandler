/**
 * SmartComplaintHandler - Interactive Campus Digital Twin (IIIT Naya Raipur)
 *
 * Pure-vector 1:1 satellite-proportioned Digital Twin covering all 16 entities:
 * - Hostels: Ramanujan House (sawtooth fingers & twin red/green courts), Bose House,
 *   Bhabha House, Raman House & Phase-2 West Cluster (4 blocks + D-Lawn), Shabri House
 *   (twin blue/terracotta courts + East Annex), Faculty Quarters & Guest House
 * - Academic & Admin: Central White Rotunda Dome, NW-SE Spine, 4 Parallel Lab Wings,
 *   North Arc, Teardrop Roundabout, Central Library (KRC), Multi-Purpose Hall (SAC / MPH)
 * - Grounds & Courts: Main Football Ground (FG) with regulation pitch & track, Sports Complex
 *   & North Athletics Oval, Outdoor Sports Courts (West Twin Red + Academic Green)
 * - Amphitheatres & Dining: Old Amphitheatre (Central OAT Bowl + Academic North Bowl),
 *   New Amphitheatre (Amphitheatre 2 - 7 stone tiers, stage lawn, NE terraces),
 *   Circular Canteen Rotunda, Central Mess North/South Wings, Auditorium Hall, Block C1
 * - Gates & Roads: Main Gate No. 1 on Naya Raipur Marg, Union Bank ATM & Kiosk,
 *   Central Crossroads Plinth, West Gate No. 2, and 50-Acre Perimeter Boundary with Survey Pillars.
 *
 * Key Capabilities:
 * 1. Omni-Search & Smart Auto-Detector: searches any building, floor, room, lab, or hostel
 *    (e.g., 'mana', 'raman', '131c', 'e-101', 'idealab', 'fg', 'mess') and auto-pans/zooms
 *    the camera with a pulsing radar locator wave, auto-selecting building and room.
 * 2. Digital Twin Floor & Facility Inspector Drawer: allows users to explore floors
 *    (G, 1, 2, 3), wings, and click any room or facility tile to select it for complaint.
 * 3. Super Admin Lockdown: only Super Admins can toggle edit mode, drag, delete, or import JSON.
 * 4. 50-Acre Perimeter Boundary: 4 authentic survey boundary pillars with hover pulse and toggle.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  IIITNR_MAP_UPDATED_EVENT,
  IIITNR_CAMPUS_PERIMETER_POINTS,
  IIITNR_CAMPUS_BOUNDARY_CORNERS,
  IIITNR_CAMPUS_METADATA,
  getCampusBuildings,
  saveCustomCampusBuildings,
  resetCampusBuildingsToDefault,
  getFloorsForBuilding,
  getWingsForBuilding,
  getRoomsForBuilding,
} from '../data/iiitnrCampusData';

// Authentic 50-Acre coordinate polygon (viewBox: -55 0 840 857)
const CAMPUS_PERIMETER_POINTS =
  '195,28 255,48 236,128 295,160 360,185 425,132 478,215 442,265 548,412 662,468 562,835 328,760 15,645';

// Non-overlapping label coordinates for all 16 Digital Twin entities
const LABEL_POSITIONS = {
  ramanujan_house: { x: 405, y: 146 },
  sports_ground: { x: 208, y: 46 },
  football_ground: { x: 308, y: 348 },
  transit_hostel: { x: 448, y: 292 },
  sac_mph: { x: 526, y: 382 },
  krc_library: { x: 512, y: 486 },
  academic_block: { x: 404, y: 530 },
  old_amphitheatre: { x: 332, y: 572 },
  amphitheatre: { x: 472, y: 646 },
  cafeteria_mess: { x: 262, y: 492 },
  outdoor_courts: { x: 186, y: 500 },
  bose_house: { x: 112, y: 604 },
  bhabha_house: { x: 204, y: 626 },
  raman_house: { x: 148, y: 344 },
  shabhari_house: { x: 584, y: 522 },
  main_gate: { x: 338, y: 780 },
};

// Decorative woodland canopy clusters in the East and South-East forest zones
const FOREST_CLUSTERS = [
  { x: 488, y: 248, r: 12 },
  { x: 506, y: 274, r: 14 },
  { x: 522, y: 302, r: 11 },
  { x: 544, y: 338, r: 15 },
  { x: 565, y: 372, r: 13 },
  { x: 585, y: 412, r: 14 },
  { x: 618, y: 445, r: 12 },
  { x: 552, y: 588, r: 15 },
  { x: 582, y: 602, r: 16 },
  { x: 538, y: 635, r: 14 },
  { x: 568, y: 652, r: 15 },
  { x: 515, y: 678, r: 16 },
  { x: 548, y: 698, r: 14 },
  { x: 482, y: 712, r: 15 },
  { x: 524, y: 742, r: 16 },
  { x: 445, y: 738, r: 14 },
  { x: 492, y: 775, r: 15 },
  { x: 535, y: 795, r: 13 },
  { x: 398, y: 722, r: 12 },
  { x: 285, y: 695, r: 10 },
  { x: 248, y: 678, r: 11 },
];

// Tree-lined boulevard trees along the Northern Loop Road & Main Entrance Boulevard
const BOULEVARD_TREES = [
  { x: 262, y: 296 },
  { x: 282, y: 292 },
  { x: 302, y: 288 },
  { x: 322, y: 285 },
  { x: 342, y: 282 },
  { x: 362, y: 279 },
  { x: 346, y: 732 },
  { x: 354, y: 706 },
  { x: 366, y: 656 },
  { x: 372, y: 628 },
  { x: 378, y: 602 },
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
  const [radarTarget, setRadarTarget] = useState(null); // { cx, cy, label }

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

  // Digital Twin Floor & Facility Inspector Drawer State
  const [inspectorFloor, setInspectorFloor] = useState('G');
  const [inspectorWing, setInspectorWing] = useState('Wing A');

  const svgRef = useRef(null);
  const radarTimerRef = useRef(null);

  // Strictly enforce Super Admin protection
  useEffect(() => {
    if (!isSuperAdmin) {
      setIsEditMode(false);
      setDraggingId(null);
      setShowJsonModal(false);
    }
  }, [isSuperAdmin]);

  // Sync with global updates
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

  // Available floors and wings for the currently active building in the inspector
  const availableFloors = useMemo(() => {
    if (!activeBuildingObj) return [];
    return getFloorsForBuilding(activeBuildingObj.id, buildings);
  }, [activeBuildingObj, buildings]);

  const availableWings = useMemo(() => {
    if (!activeBuildingObj) return [];
    return getWingsForBuilding(activeBuildingObj.id, buildings);
  }, [activeBuildingObj, buildings]);

  // Rooms for the inspector's current floor and wing
  const inspectorRooms = useMemo(() => {
    if (!activeBuildingObj) return [];
    return getRoomsForBuilding(activeBuildingObj.id, inspectorFloor, inspectorWing, buildings);
  }, [activeBuildingObj, inspectorFloor, inspectorWing, buildings]);

  // When active building changes, reset inspector floor & wing to sensible defaults
  useEffect(() => {
    if (availableFloors.length > 0) {
      const matchFloor = availableFloors.find((f) => f.id === inspectorFloor);
      if (!matchFloor) {
        setInspectorFloor(availableFloors[0].id);
      }
    }
    if (availableWings.length > 0) {
      const matchWing = availableWings.find((w) => w.id === inspectorWing);
      if (!matchWing) {
        setInspectorWing(availableWings[0].id);
      }
    }
  }, [activeBuildingObj?.id, availableFloors, availableWings]);

  // -------------------------------------------------------------
  // Omni-Search Index Construction
  // -------------------------------------------------------------
  const searchIndex = useMemo(() => {
    const list = [];

    buildings.forEach((b) => {
      // 1. Building Entity itself
      list.push({
        type: 'BUILDING',
        buildingId: b.id,
        buildingName: b.name,
        shortName: b.shortName,
        badge: b.trace?.badge || 'ZONE',
        floorId: 'G',
        wingId: b.wings ? b.wings[0] : 'Main',
        roomName: '',
        title: b.name,
        subtitle: `${b.type} · ${b.gps || 'Campus'}`,
        searchKey: `${b.name} ${b.shortName} ${b.trace?.badge || ''} ${b.type}`.toLowerCase(),
        cx: b.trace?.cx ?? 395,
        cy: b.trace?.cy ?? 472,
      });

      // 2. Specialty & Custom Rooms / Labs
      if (Array.isArray(b.customRooms)) {
        b.customRooms.forEach((r) => {
          list.push({
            type: 'ROOM',
            buildingId: b.id,
            buildingName: b.name,
            shortName: b.shortName,
            badge: b.trace?.badge || 'ROOM',
            floorId: 'G',
            wingId: 'Common Area',
            roomName: r,
            title: r,
            subtitle: `${b.shortName} · Custom Facility`,
            searchKey: `${r} ${b.name} ${b.shortName}`.toLowerCase(),
            cx: b.trace?.cx ?? 395,
            cy: b.trace?.cy ?? 472,
          });
        });
      }

      // 3. Structured Floors & Labs (Academic, KRC, MPH, Mess, FG, etc.)
      if (Array.isArray(b.floors)) {
        b.floors.forEach((fl) => {
          if (typeof fl === 'object' && Array.isArray(fl.rooms)) {
            fl.rooms.forEach((r) => {
              list.push({
                type: 'ROOM',
                buildingId: b.id,
                buildingName: b.name,
                shortName: b.shortName,
                badge: b.trace?.badge || 'ROOM',
                floorId: fl.id,
                wingId: 'Main Complex',
                roomName: r,
                title: r,
                subtitle: `${b.shortName} · Floor ${fl.id} (${fl.label || fl.id})`,
                searchKey: `${r} ${b.name} ${b.shortName} floor ${fl.id} ${fl.label || ''}`.toLowerCase(),
                cx: b.trace?.cx ?? 395,
                cy: b.trace?.cy ?? 472,
              });
            });
          }
        });
      }

      // 4. Sample Hostel Rooms (101, 102, 204, etc.)
      if (b.category === 'HOSTEL') {
        ['1', '2', '3'].forEach((fl) => {
          ['Wing A', 'Wing B'].forEach((w) => {
            const sampleRooms = [1, 2, 4, 10, 12, 18, 24];
            sampleRooms.forEach((num) => {
              const padded = String(num).padStart(2, '0');
              const rName = `Room ${w.replace('Wing ', '')}-${fl}${padded}`;
              list.push({
                type: 'HOSTEL_ROOM',
                buildingId: b.id,
                buildingName: b.name,
                shortName: b.shortName,
                badge: b.trace?.badge || 'HOSTEL',
                floorId: fl,
                wingId: w,
                roomName: rName,
                title: `${b.shortName} — ${rName}`,
                subtitle: `${w} · Floor ${fl}`,
                searchKey: `${rName} ${b.name} ${b.shortName} ${w} room ${fl}${padded}`.toLowerCase(),
                cx: b.trace?.cx ?? 395,
                cy: b.trace?.cy ?? 472,
              });
            });
          });
        });
      }
    });

    return list;
  }, [buildings]);

  // Filtered Search Results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return searchIndex
      .filter((item) => item.searchKey.includes(q))
      .slice(0, 8);
  }, [searchQuery, searchIndex]);

  // -------------------------------------------------------------
  // Auto-Detect & Camera Pan Action
  // -------------------------------------------------------------
  const panToTarget = (cx, cy, targetZoom = 1.4, label = '') => {
    // Coordinate space: [-55, 0] to [785, 857]
    const clampedZoom = Math.min(2.4, Math.max(1, targetZoom));
    const targetPanX = 390 - cx * clampedZoom;
    const targetPanY = 428 - cy * clampedZoom;

    setZoom(clampedZoom);
    setPan({ x: targetPanX, y: targetPanY });

    // Set animated locator radar beam
    setRadarTarget({ cx, cy, label });
    if (radarTimerRef.current) clearTimeout(radarTimerRef.current);
    radarTimerRef.current = setTimeout(() => {
      setRadarTarget(null);
    }, 4500);
  };

  const handleSelectSearchResult = (item) => {
    setSearchQuery('');
    setIsSearchFocused(false);

    // 1. Select building
    if (onSelectBuilding) {
      onSelectBuilding(item.buildingName);
    }
    setEditingBuildingId(item.buildingId);

    // 2. Select room & inspector location
    if (item.roomName) {
      if (onSelectRoom) onSelectRoom(item.roomName);
      if (item.floorId) setInspectorFloor(item.floorId);
      if (item.wingId) setInspectorWing(item.wingId);
    }

    // 3. Pan SVG Camera
    panToTarget(item.cx, item.cy, 1.45, item.roomName || item.shortName);

    // 4. Trigger Auto-Detection Notice
    setAutoDetectNotice({
      title: item.title,
      building: item.buildingName,
      room: item.roomName,
      floor: item.floorId ? `Floor ${item.floorId}` : 'Main Level',
      gps: `(${Math.round(item.cx)}, ${Math.round(item.cy)})`,
    });
  };

  // Convert Client pointer coordinates to SVG coordinate space [-55 0 840 857]
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
      wings: ['Wing A', 'Wing B'],
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
    if (onSelectBuilding) onSelectBuilding(remaining[0].name);
  };

  /**
   * Helper to draw a regulation sports court with center line and service lines
   */
  const renderCourtMarkings = (x, y, w, h, fillColor, strokeColor = '#ffffff') => (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="1.5"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="0.9"
      />
      <line
        x1={x}
        y1={y + h / 2}
        x2={x + w}
        y2={y + h / 2}
        stroke={strokeColor}
        strokeWidth="0.7"
        strokeOpacity="0.85"
      />
      <rect
        x={x + w * 0.15}
        y={y + h * 0.15}
        width={w * 0.7}
        height={h * 0.7}
        fill="none"
        stroke={strokeColor}
        strokeWidth="0.5"
        strokeOpacity="0.65"
      />
    </g>
  );

  /**
   * Pure vector rendering for each interactive Digital Twin building, ground, court, and amphitheatre
   */
  const renderDigitalTwinEntity = (b, isSelected, isHovered) => {
    const cx = b.trace?.cx ?? 395;
    const cy = b.trace?.cy ?? 472;
    const w = b.trace?.w || 58;
    const h = b.trace?.h || 52;
    const angle = b.trace?.angle ?? 18;
    const shape = b.trace?.shape || 'courtyard_quad';
    const baseColor = b.trace?.color || b.mapPin?.color || '#4f46e5';

    const isBlueprint = twinTheme === 'blueprint';
    const fillOpacity = isBlueprint ? (isSelected ? 0.45 : 0.22) : 0.96;
    const strokeColor = isSelected
      ? '#38bdf8'
      : isHovered
      ? '#ffffff'
      : isBlueprint
      ? '#38bdf8'
      : 'rgba(255,255,255,0.82)';
    const strokeWidth = isSelected ? 2.6 : isHovered ? 2.0 : 1.2;
    const labelPos = LABEL_POSITIONS[b.id] || { x: cx, y: cy + h / 2 + 12 };

    return (
      <g
        key={b.id}
        data-bldg-id={b.id}
        onMouseEnter={() => setHoveredId(b.id)}
        onMouseLeave={() => setHoveredId(null)}
        onMouseDown={(e) => {
          e.stopPropagation();
          setEditingBuildingId(b.id);
          if (onSelectBuilding) onSelectBuilding(b.name);
          if (isSuperAdmin && isEditMode) setDraggingId(b.id);
        }}
        className={isSuperAdmin && isEditMode ? 'cursor-move' : 'cursor-pointer'}
      >
        {/* Selection / Hover Pulse Halo */}
        {(isSelected || isHovered) && shape !== 'academic_complex' && (
          <circle
            cx={cx}
            cy={cy}
            r={Math.max(w, h) * 0.54}
            fill="none"
            stroke={isSelected ? '#38bdf8' : '#a5b4fc'}
            strokeWidth={isSelected ? '2' : '1.2'}
            strokeDasharray="4 4"
            opacity="0.8"
          />
        )}

        {/* 1. RAMANUJAN HOUSE (Boys Hostel 1 at 405,210 with Sawtooth East Fingers & Twin Inner Courts) */}
        {shape === 'ramanujan_complex' && (
          <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
            <rect x={-41} y={-27} width={86} height={60} rx="5" fill="rgba(2,6,23,0.65)" />
            <rect
              x={-43}
              y={-30}
              width={86}
              height={60}
              rx="5"
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Sawtooth Eastern Residential Fingers */}
            {[-22, -11, 0, 11, 22].map((ry, idx) => (
              <rect
                key={idx}
                x={30}
                y={ry - 4}
                width={15}
                height={8}
                rx="1.5"
                fill="#6366f1"
                stroke={strokeColor}
                strokeWidth="0.8"
              />
            ))}
            {/* Roof Corridor Lines */}
            <rect
              x={-38}
              y={-25}
              width={66}
              height={50}
              rx="3"
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="0.8"
            />
            {/* Inner Courtyard with Twin Sports Courts */}
            <rect
              x={-28}
              y={-18}
              width={52}
              height={36}
              rx="2.5"
              fill="#0f172a"
              stroke="rgba(148,163,184,0.4)"
              strokeWidth="0.9"
            />
            {renderCourtMarkings(-24, -14, 20, 28, '#16a34a')}
            {renderCourtMarkings(0, -14, 20, 28, '#dc2626')}
            <line x1="-2" y1="-18" x2="-2" y2="18" stroke="#94a3b8" strokeWidth="1.8" />
          </g>
        )}

        {/* 2. SPORTS COMPLEX (Far NW Indoor Arena at 208,94) */}
        {shape === 'sports_hall' && (
          <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
            <rect
              x={-22}
              y={26}
              width={40}
              height={12}
              rx="2"
              fill="#475569"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="0.8"
            />
            <rect
              x={-24}
              y={-27}
              width={11}
              height={54}
              rx="2"
              fill="#065f46"
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth="1"
            />
            <rect x={-11} y={-28} width={34} height={58} rx="4" fill="rgba(2,6,23,0.6)" />
            <rect
              x={-13}
              y={-30}
              width={34}
              height={58}
              rx="4"
              fill={isBlueprint ? baseColor : '#e2e8f0'}
              fillOpacity={fillOpacity}
              stroke={isSelected ? '#38bdf8' : '#10b981'}
              strokeWidth={strokeWidth}
            />
            {[-20, -10, 0, 10, 20].map((ty, i) => (
              <line
                key={i}
                x1="-13"
                y1={ty}
                x2="21"
                y2={ty}
                stroke="rgba(148,163,184,0.5)"
                strokeWidth="0.8"
              />
            ))}
          </g>
        )}

        {/* 3. MAIN FOOTBALL GROUND (FG at 314,348) */}
        {shape === 'football_ground' && (
          <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
            {/* Curved Spectator Track & Floodlight Perimeter */}
            <rect
              x={-57}
              y={-42}
              width={114}
              height={84}
              rx="18"
              fill="#78350f"
              stroke="#ca8a04"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            <rect
              x={-52}
              y={-37}
              width={104}
              height={74}
              rx="12"
              fill="#b45309"
              fillOpacity="0.45"
            />
            {/* Manicured Football Pitch Turf with Alternating Green Stripes */}
            <rect
              x={-46}
              y={-32}
              width={92}
              height={64}
              rx="3"
              fill="#15803d"
              stroke={isSelected ? '#38bdf8' : '#ffffff'}
              strokeWidth={isSelected ? '2.2' : '1.3'}
            />
            {[-46, -28, -10, 8, 26].map((sx, idx) => (
              <rect
                key={idx}
                x={sx}
                y={-32}
                width={9}
                height={64}
                fill="#16a34a"
                fillOpacity="0.4"
              />
            ))}
            {/* Pitch Regulation Markings */}
            <line x1="0" y1="-32" x2="0" y2="32" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.9" />
            <circle cx="0" cy="0" r="10" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.9" />
            <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
            {/* North Penalty Box & Goal */}
            <rect x="-46" y="-14" width="14" height="28" fill="none" stroke="#ffffff" strokeWidth="0.9" />
            <rect x="-46" y="-7" width="5" height="14" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <path d="M -32,-7 A 7,7 0 0,1 -32,7" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            {/* South Penalty Box & Goal */}
            <rect x="32" y="-14" width="14" height="28" fill="none" stroke="#ffffff" strokeWidth="0.9" />
            <rect x="41" y="-7" width="5" height="14" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <path d="M 32,-7 A 7,7 0 0,0 32,7" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            {/* 4 Corner Pitch Flags */}
            {[
              [-46, -32],
              [46, -32],
              [-46, 32],
              [46, 32],
            ].map(([fx, fy], i) => (
              <circle key={i} cx={fx} cy={fy} r="1.5" fill="#facc15" />
            ))}
            {/* FG East Spectator Pavilion Wing */}
            <rect
              x="-48"
              y="37"
              width={96}
              height={7}
              rx="2"
              fill="#334155"
              stroke="#64748b"
              strokeWidth="0.8"
            />
            {/* Floodlight Towers */}
            {[
              [-55, -40],
              [55, -40],
              [-55, 40],
              [55, 40],
            ].map(([lx, ly], idx) => (
              <circle key={idx} cx={lx} cy={ly} r="2.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
            ))}
          </g>
        )}

        {/* 4. FACULTY QUARTERS & GUEST HOUSE (3 NE Stepped Blocks + Long North Wing) */}
        {shape === 'faculty_cluster' && (
          <g>
            {/* Long North Pavilion Wing at (380, 338) */}
            <g transform="translate(380, 338) rotate(-32)">
              <rect
                x="-40"
                y="-7"
                width={80}
                height={14}
                rx="3"
                fill="#475569"
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth="1.2"
              />
              <line x1="-30" y1="0" x2="30" y2="0" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
            </g>
            {/* Solar Parking Shed at (442, 388) */}
            <g transform="translate(442, 388) rotate(-32)">
              <rect
                x="-14"
                y="-6"
                width={28}
                height={12}
                rx="2"
                fill="#0284c7"
                fillOpacity="0.75"
                stroke="#38bdf8"
                strokeWidth="0.9"
              />
            </g>
            {/* 3 Stepped Cruciform Residential Blocks */}
            {[
              { x: 416, y: 312 },
              { x: 442, y: 342 },
              { x: 462, y: 370 },
            ].map((blk, idx) => (
              <g key={idx} transform={`translate(${blk.x}, ${blk.y}) rotate(-32)`}>
                <rect x="-14" y="-8" width="28" height="16" rx="2.5" fill={baseColor} fillOpacity={fillOpacity} stroke={strokeColor} strokeWidth="1" />
                <rect x="-8" y="-14" width="16" height="28" rx="2.5" fill={baseColor} fillOpacity={fillOpacity} stroke={strokeColor} strokeWidth="1" />
                <circle cx="0" cy="0" r="3" fill="#0f172a" />
              </g>
            ))}
          </g>
        )}

        {/* 5. SAC & MULTI-PURPOSE HALL (MPH Auditorium at 488,402) */}
        {shape === 'mph_hall' && (
          <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
            <rect x="-22" y="-17" width={44} height={34} rx="4" fill="rgba(2,6,23,0.6)" />
            <rect
              x="-24"
              y="-19"
              width={48}
              height={38}
              rx="4"
              fill={isBlueprint ? baseColor : '#f1f5f9'}
              fillOpacity={fillOpacity}
              stroke={isSelected ? '#38bdf8' : '#ea580c'}
              strokeWidth={strokeWidth}
            />
            {/* Gable Roof Centerline */}
            <line x1="-24" y1="0" x2="24" y2="0" stroke="#94a3b8" strokeWidth="1.2" />
            <polygon points="-24,0 -16,-19 -8,0 0,-19 8,0 16,-19 24,0" fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth="0.8" />
            {/* Entrance Portico */}
            <rect x="-12" y="16" width="24" height="6" rx="1.5" fill="#ea580c" />
          </g>
        )}

        {/* 6. SHABRI HOUSE (Girls Hostel Quadrangle at 572,475 with Twin Courts + Annex) */}
        {shape === 'shabri_quad' && (
          <g>
            <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
              <rect x={-28} y={-25} width={60} height={54} rx="5" fill="rgba(2,6,23,0.65)" />
              <rect
                x={-30}
                y={-27}
                width={60}
                height={54}
                rx="5"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              <rect x={-18} y={-14} width={36} height={28} rx="2" fill="#0f172a" stroke="#f472b6" strokeWidth="0.9" />
              {renderCourtMarkings(-15, -11, 14, 22, '#0284c7')}
              {renderCourtMarkings(1, -11, 14, 22, '#d97706')}
            </g>
            {/* Detached Eastern Annex Wing at (612, 488) */}
            <g transform="translate(612, 488) rotate(18)">
              <rect
                x="-8"
                y="-17"
                width="16"
                height="34"
                rx="3"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth="1.2"
              />
            </g>
          </g>
        )}

        {/* 7. RAMAN HOUSE & UPPER-WEST PHASE-2 CLUSTER (4 Blocks + D-Shaped Lawn) */}
        {shape === 'west_hostel_cluster' && (
          <g>
            {/* D-Shaped Central Garden & Court at (136, 392) */}
            <g transform="translate(136, 392) rotate(18)">
              <path
                d="M -14,-14 L 8,-14 A 14,14 0 0,1 8,14 L -14,14 Z"
                fill="#15803d"
                fillOpacity="0.85"
                stroke="#86efac"
                strokeWidth="1.1"
              />
            </g>
            {/* Main Courtyard Quad at (176, 376) */}
            <g transform="translate(176, 376) rotate(18)">
              <rect x="-21" y="-19" width="44" height="40" rx="4" fill="rgba(2,6,23,0.6)" />
              <rect
                x="-22"
                y="-20"
                width="44"
                height="40"
                rx="4"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              <rect x="-9" y="-8" width="18" height="16" rx="1.5" fill="#0f172a" stroke="#a5b4fc" strokeWidth="0.8" />
            </g>
            {/* Outer-West Block at (108, 392) */}
            <g transform="translate(108, 392) rotate(18)">
              <rect
                x="-14"
                y="-17"
                width="28"
                height="34"
                rx="3.5"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              <rect x="-5" y="-7" width="10" height="14" rx="1" fill="#0f172a" />
            </g>
            {/* Mid-West Stepped Wing at (148, 438) */}
            <g transform="translate(148, 438) rotate(18)">
              <rect
                x="-23"
                y="-13"
                width="46"
                height="26"
                rx="3.5"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              <rect x="-10" y="-5" width="20" height="10" rx="1" fill="#0f172a" />
            </g>
            {/* Outer-West Annex Block at (92, 445) */}
            <g transform="translate(92, 445) rotate(18)">
              <rect
                x="-10"
                y="-12"
                width="20"
                height="24"
                rx="3"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth="1.2"
              />
            </g>
          </g>
        )}

        {/* 8. CANTEEN ROTUNDA, CENTRAL MESS WINGS, AUDITORIUM & BLOCK C1 */}
        {shape === 'canteen_mess' && (
          <g>
            {/* Block C1 at (232, 424) */}
            <g transform="translate(232, 424) rotate(18)">
              <rect
                x="-17"
                y="-13"
                width="34"
                height="26"
                rx="3"
                fill="#0284c7"
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth="1.2"
              />
              <rect x="-8" y="-5" width="16" height="10" rx="1" fill="#0f172a" fillOpacity="0.6" />
            </g>
            {/* Maintenance Substation Annex at (218, 448) */}
            <g transform="translate(218, 448) rotate(18)">
              <rect
                x="-9"
                y="-9"
                width="18"
                height="18"
                rx="2.5"
                fill="#0284c7"
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth="1.1"
              />
            </g>
            {/* Central Auditorium Hall at (274, 472) */}
            <g transform="translate(274, 472) rotate(-32)">
              <rect
                x="-16"
                y="-12"
                width="32"
                height="24"
                rx="3.5"
                fill="#e2e8f0"
                fillOpacity={fillOpacity}
                stroke={isSelected ? '#38bdf8' : '#f59e0b'}
                strokeWidth={strokeWidth}
              />
              <rect x="-10" y="-6" width="20" height="12" rx="1.5" fill="#94a3b8" fillOpacity="0.55" />
            </g>
            {/* Central Mess North Wing at (225, 475) */}
            <g transform="translate(225, 475) rotate(18)">
              <rect
                x="-21"
                y="-18"
                width="42"
                height="36"
                rx="4"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              <rect x="-8" y="-6" width="16" height="12" rx="1.5" fill="#0f172a" fillOpacity="0.7" />
            </g>
            {/* Central Mess South Wing at (268, 512) */}
            <g transform="translate(268, 512) rotate(18)">
              <rect
                x="-20"
                y="-16"
                width="40"
                height="32"
                rx="4"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              <rect x="-7" y="-5" width="14" height="10" rx="1.5" fill="#0f172a" fillOpacity="0.7" />
            </g>
            {/* Circular Canteen Rotunda at (318, 532) */}
            <circle
              cx="318"
              cy="532"
              r="15"
              fill="#f59e0b"
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <circle cx="318" cy="532" r="9" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" strokeDasharray="2 2" />
            <circle cx="318" cy="532" r="4.5" fill="#78350f" stroke="#fde68a" strokeWidth="0.9" />
          </g>
        )}

        {/* 9. OUTDOOR SPORTS COURTS (West Red Courts at 188,526 + Academic Green Court at 406,392) */}
        {shape === 'outdoor_courts' && (
          <g>
            {/* West Twin Red Courts (188, 526) */}
            <g transform="translate(188, 526) rotate(18)">
              <rect
                x="-15"
                y="-15"
                width="30"
                height="30"
                rx="3"
                fill="#1e293b"
                stroke={isSelected ? '#38bdf8' : '#f87171'}
                strokeWidth={strokeWidth}
              />
              {renderCourtMarkings(-13, -13, 12, 26, '#dc2626')}
              {renderCourtMarkings(1, -13, 12, 26, '#b91c1c')}
            </g>
            {/* Academic North Green Court (406, 392) */}
            <g transform="translate(406, 392) rotate(-32)">
              <rect
                x="-15"
                y="-9"
                width="30"
                height="18"
                rx="2.5"
                fill="#064e3b"
                stroke={isSelected ? '#38bdf8' : '#34d399'}
                strokeWidth={strokeWidth}
              />
              {renderCourtMarkings(-13, -7, 26, 14, '#10b981')}
            </g>
          </g>
        )}

        {/* 10. OLD AMPHITHEATRE (Central Canteen Stepped OAT at 332,542 + North Bowl at 372,392) */}
        {shape === 'old_amphitheatre' && (
          <g>
            {/* Central Open-Air Theatre (332, 542) */}
            <g transform="translate(330, 540) rotate(28)">
              <path
                d="M -22,-4 A 24,24 0 0,1 22,-4 L 14,16 A 14,14 0 0,0 -14,16 Z"
                fill="#d97706"
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              <path d="M -19,0 A 20,20 0 0,1 19,0" fill="none" stroke="#fef3c7" strokeWidth="1.1" />
              <path d="M -16,5 A 17,17 0 0,1 16,5" fill="none" stroke="#fef3c7" strokeWidth="1.1" />
              <path d="M -13,10 A 14,14 0 0,1 13,10" fill="none" stroke="#fef3c7" strokeWidth="1.1" />
              <circle cx="0" cy="13" r="5.5" fill="#78350f" stroke="#fde68a" strokeWidth="1.1" />
            </g>
            {/* Academic North Acoustic Bowl (372, 392) */}
            <g transform="translate(372, 392) rotate(-32)">
              <path
                d="M -16,-6 A 18,18 0 0,1 16,-6 L 10,10 A 10,10 0 0,0 -10,10 Z"
                fill="#b45309"
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth="1.2"
              />
              <path d="M -13,-1 A 14,14 0 0,1 13,-1" fill="none" stroke="#fde68a" strokeWidth="0.9" />
              <path d="M -10,4 A 11,11 0 0,1 10,4" fill="none" stroke="#fde68a" strokeWidth="0.9" />
            </g>
          </g>
        )}

        {/* 11. NEW AMPHITHEATRE (Amphitheatre 2 at 468,595 - 7 Stone Tiers, Stage Lawn, Ramp & Terraces) */}
        {shape === 'amphitheatre' && (
          <g>
            {/* 3 Curved NE Landscaped Terraces */}
            <polygon
              points="448,538 508,518 572,546 528,582"
              fill="#065f46"
              fillOpacity="0.65"
              stroke="#34d399"
              strokeWidth="0.9"
            />
            <path d="M 458,546 Q 512,532 555,555" fill="none" stroke="#6ee7b7" strokeWidth="0.9" />
            <path d="M 472,560 Q 518,548 546,568" fill="none" stroke="#6ee7b7" strokeWidth="0.9" />
            {/* Main Stepped Arena Bowl at (468, 595) */}
            <g transform="translate(468, 595) rotate(35)">
              <path
                d="M -35,-8 A 38,38 0 0,1 35,-8 L 22,24 A 20,20 0 0,0 -22,24 Z"
                fill={isBlueprint ? baseColor : '#334155'}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              {/* 7 Concentric Stone Seating Tiers */}
              {[-5, 0, 5, 10, 15, 19, 23].map((rTier, idx) => (
                <path
                  key={idx}
                  d={`M ${-32 + idx * 1.8},${rTier} A ${35 - idx * 2.5},${35 - idx * 2.5} 0 0,1 ${
                    32 - idx * 1.8
                  },${rTier}`}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="0.9"
                  strokeOpacity="0.85"
                />
              ))}
              {/* Circular Stage Lawn */}
              <circle cx="0" cy="20" r="8" fill="#15803d" stroke="#86efac" strokeWidth="1.2" />
              {/* Northwest Terracotta Stage Ramp */}
              <rect x="-24" y="16" width="10" height="4" rx="1" fill="#ea580c" />
            </g>
          </g>
        )}

        {/* 12. COURTYARD QUAD (Bose House at 115,560 & Bhabha House at 200,585) */}
        {shape === 'courtyard_quad' && (
          <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
            <rect x={-w / 2 + 2} y={-h / 2 + 2} width={w} height={h} rx="4" fill="rgba(2,6,23,0.6)" />
            <rect
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              rx="4"
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Inner Courtyard with Synthetic Green Court */}
            <rect
              x={-w * 0.28}
              y={-h * 0.28}
              width={w * 0.56}
              height={h * 0.56}
              rx="2.5"
              fill="#0f172a"
              stroke="#64748b"
              strokeWidth="0.9"
            />
            {renderCourtMarkings(-w * 0.22, -h * 0.22, w * 0.44, h * 0.44, '#16a34a')}
          </g>
        )}

        {/* 13. ACADEMIC & ADMIN COMPLEX (Authentic Stepped Footprint & Central Dome) */}
        {shape === 'academic_complex' && (
          <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
            {/* 2.5D Architectural Shadow */}
            <polygon
              points="-44,-40 48,-40 48,-24 44,-24 44,20 38,20 0,44 -38,20 -44,20 -44,-24"
              fill="rgba(2,6,23,0.65)"
            />
            {/* Main Cohesive Stepped Building Perimeter */}
            <polygon
              points="-46,-42 46,-42 46,-26 42,-26 42,18 36,18 0,42 -36,18 -42,18 -42,-26 -46,-26"
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Rear North Wing Parapet Line */}
            <line
              x1="-44"
              y1="-26"
              x2="42"
              y2="-26"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1"
            />
            {/* Dual Inner Lightwell Courtyards */}
            <rect
              x="-28"
              y="-16"
              width="14"
              height="20"
              rx="2"
              fill="#0f172a"
              fillOpacity="0.75"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="0.8"
            />
            <rect
              x="14"
              y="-16"
              width="14"
              height="20"
              rx="2"
              fill="#0f172a"
              fillOpacity="0.75"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="0.8"
            />
            {/* Front Grand Entrance Portal on the Southeast Prow */}
            <polygon
              points="-18,20 18,20 0,38"
              fill={isBlueprint ? 'rgba(56,189,248,0.3)' : '#0369a1'}
              stroke={strokeColor}
              strokeWidth="0.9"
            />
            <rect
              x="-12"
              y="38"
              width="24"
              height="5"
              rx="1.5"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="0.8"
            />
            {/* Central Rotunda White Dome & Atrium */}
            <circle
              cx="0"
              cy="0"
              r="17"
              fill={isBlueprint ? baseColor : '#f8fafc'}
              fillOpacity={fillOpacity}
              stroke={isSelected ? '#38bdf8' : '#0284c7'}
              strokeWidth={strokeWidth}
            />
            <circle
              cx="0"
              cy="0"
              r="11"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.2"
              strokeDasharray="2.5 2.5"
            />
            <circle cx="0" cy="0" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
            <circle cx="0" cy="0" r="2" fill="#ffffff" />
          </g>
        )}

        {/* 14. CENTRAL LIBRARY (KRC at 478,458) */}
        {shape === 'krc_hall' && (
          <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
            <rect x="-21" y="-17" width="42" height="34" rx="4" fill="rgba(2,6,23,0.6)" />
            <rect
              x="-22"
              y="-19"
              width="44"
              height="38"
              rx="4"
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* L-Shaped Wing Notch */}
            <rect x="2" y="-19" width="20" height="18" fill="#0f172a" />
            {/* Skylight Reading Atrium */}
            <rect
              x="-16"
              y="-11"
              width="14"
              height="22"
              rx="2"
              fill="#1e1b4b"
              stroke="#a78bfa"
              strokeWidth="0.9"
            />
            <line x1="-9" y1="-11" x2="-9" y2="11" stroke="#38bdf8" strokeWidth="0.8" />
          </g>
        )}

        {/* 15. MAIN GATE NO. 1, ATM & WEST GATE */}
        {shape === 'gate_and_atm' && (
          <g>
            {/* Main Entrance Archway at (338, 755) */}
            <g transform="translate(338, 755) rotate(19.5)">
              <rect x="-24" y="-8" width="48" height="16" rx="3" fill="#0f172a" stroke={isSelected ? '#38bdf8' : '#ffffff'} strokeWidth="1.6" />
              <rect x="-20" y="-5" width="8" height="10" rx="1.5" fill="#38bdf8" />
              <rect x="12" y="-5" width="8" height="10" rx="1.5" fill="#38bdf8" />
              <line x1="-12" y1="0" x2="12" y2="0" stroke="#facc15" strokeWidth="2.5" />
            </g>
            {/* Union Bank ATM & Security Kiosk at (345, 688) */}
            <g transform="translate(345, 688) rotate(19.5)">
              <rect x="-10" y="-8" width="20" height="16" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" />
              <text x="0" y="3.5" textAnchor="middle" fill="#38bdf8" fontSize="6.5" fontWeight="800">
                ATM
              </text>
            </g>
            {/* Central Crossroads Monument Plinth at (358, 582) */}
            <g transform="translate(358, 582)">
              <circle cx="0" cy="0" r="9" fill="#0f172a" stroke="#ca8a04" strokeWidth="1.2" />
              <circle cx="0" cy="0" r="5" fill="#eab308" />
            </g>
            {/* West Gate No. 2 at (22, 642) */}
            <g transform="translate(22, 642) rotate(-62)">
              <rect x="-12" y="-5" width="24" height="10" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.4" />
              <text x="0" y="2.5" textAnchor="middle" fill="#38bdf8" fontSize="5.5" fontWeight="800">
                G2
              </text>
            </g>
          </g>
        )}

        {/* Clean, Non-Overlapping Interactive Label Pill */}
        {(showLabels || isSelected || isHovered) && (
          <g transform={`translate(${labelPos.x}, ${labelPos.y})`}>
            <rect
              x="-46"
              y="-8"
              width="92"
              height="16"
              rx="5"
              fill={isSelected ? '#0284c7' : 'rgba(9, 13, 24, 0.92)'}
              stroke={isSelected ? '#ffffff' : isHovered ? '#38bdf8' : 'rgba(148, 163, 184, 0.45)'}
              strokeWidth={isSelected ? '1.4' : '0.9'}
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="8"
              fontWeight="700"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {b.shortName || b.name}
            </text>
          </g>
        )}
      </g>
    );
  };

  const hostelsList = buildings.filter((b) => b.category === 'HOSTEL');
  const otherBlocksList = buildings.filter((b) => b.category !== 'HOSTEL');

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* ----------------------------------------------------------- */}
      {/* Top Digital Twin Control & Header Bar */}
      {/* ----------------------------------------------------------- */}
      <div className="px-5 py-3.5 bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isEditMode ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'
            }`}
          />
          <span className="text-xs sm:text-sm font-black tracking-tight text-white">
            IIIT Naya Raipur Interactive Digital Twin
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Pure Vector Twin · 16 Zones · Full Floor Mapping
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

          {/* 50-Acre Perimeter Boundary Toggle */}
          <button
            type="button"
            onClick={() => setShowBoundary((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
              showBoundary
                ? 'bg-purple-500/20 border-purple-400/40 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle authentic 50-Acre Perimeter Boundary & 4 Survey Pillars"
          >
            {showBoundary ? 'Boundary: 50 Acres' : 'Boundary: Off'}
          </button>

          {/* Paths & Courts Toggle */}
          <button
            type="button"
            onClick={() => setShowPathsAndCourts((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
              showPathsAndCourts
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {showPathsAndCourts ? 'Paths: On' : 'Paths: Minimal'}
          </button>

          {/* Labels Toggle */}
          <button
            type="button"
            onClick={() => setShowLabels((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white cursor-pointer"
          >
            {showLabels ? 'Labels: On' : 'Labels: Hover'}
          </button>

          {/* Digital Twin Theme Toggle */}
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

          {/* Super Admin Edit Mode Button */}
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
            <span
              className="text-[10px] font-mono text-slate-500 px-2 py-1 rounded bg-slate-900 border border-slate-800"
              title="Map modifications require Directorate Super Admin authentication"
            >
              🔒 Twin Locked
            </span>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* Omni-Search & Smart Auto-Detector Engine Bar */}
      {/* ----------------------------------------------------------- */}
      <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 relative z-20">
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
                placeholder="🔍 Smart Auto-Detector: type any building, room, lab, or hostel (e.g. 'mana', 'raman', '131c', 'e-101', 'idealab', 'fg', 'mess', 'atm')..."
                className="w-full px-4 py-2.5 pl-10 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400 transition-all font-sans"
              />
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">
                ⚡
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Auto-Detect Status Pill */}
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span>Smart Radar: Ready</span>
            </div>
          </div>

          {/* Live Search & Auto-Detect Dropdown */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-30 divide-y divide-slate-800/80 max-h-72 overflow-y-auto">
              <div className="px-3.5 py-1.5 bg-slate-900/60 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Auto-Detected Campus Locations ({searchResults.length} matches)</span>
                <span className="text-sky-400">Click to Auto-Pan & Select</span>
              </div>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-900/80 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {item.badge}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                  </div>
                  <span className="text-[11px] font-mono text-sky-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    Auto-Detect 🎯
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Auto-Detection Notification Banner */}
        {autoDetectNotice && (
          <div className="mt-2.5 px-3.5 py-2 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-between text-xs text-sky-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm">🎯</span>
              <span>
                <strong>Auto-Detected:</strong> {autoDetectNotice.building}{' '}
                {autoDetectNotice.floor && `· ${autoDetectNotice.floor}`}{' '}
                {autoDetectNotice.room && `→ ${autoDetectNotice.room}`}{' '}
                <span className="text-slate-400 font-mono text-[10px]">
                  {autoDetectNotice.gps}
                </span>
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

      {/* ----------------------------------------------------------- */}
      {/* Quick Hostel & Digital Twin Zone Selector Pills */}
      {/* ----------------------------------------------------------- */}
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
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 cursor-pointer shadow-xs"
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
          Campus & Grounds:
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

      {/* ----------------------------------------------------------- */}
      {/* Main Interactive Digital Twin SVG Viewport */}
      {/* ----------------------------------------------------------- */}
      <div className="bg-[#070c18] p-3 sm:p-4 space-y-3">
        <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#070c18] flex justify-center">
          <svg
            ref={svgRef}
            viewBox="-55 0 840 857"
            onClick={handleSvgClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`w-full max-h-[620px] select-none ${
              isSuperAdmin && isEditMode
                ? 'cursor-crosshair'
                : zoom > 1
                ? 'cursor-grab active:cursor-grabbing'
                : 'cursor-default'
            }`}
          >
            <defs>
              <pattern id="twinSubtleGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path
                  d="M 25 0 L 0 0 0 25"
                  fill="none"
                  stroke={
                    twinTheme === 'blueprint'
                      ? 'rgba(56, 189, 248, 0.14)'
                      : 'rgba(148, 163, 184, 0.05)'
                  }
                  strokeWidth="0.8"
                />
              </pattern>
              <radialGradient id="campusTerrainGrad" cx="50%" cy="48%" r="55%">
                <stop offset="0%" stopColor={twinTheme === 'blueprint' ? '#08142c' : '#132036'} />
                <stop offset="100%" stopColor={twinTheme === 'blueprint' ? '#050b18' : '#0c1526'} />
              </radialGradient>
              <clipPath id="iiitnrCampusClip">
                <polygon points={CAMPUS_PERIMETER_POINTS} />
              </clipPath>
            </defs>

            {/* Outer Dark Engineering Backdrop */}
            <rect x="-55" y="0" width="840" height="857" fill="#060b16" />
            <rect x="-55" y="0" width="840" height="857" fill="url(#twinSubtleGrid)" />

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* External Highway along Southern Boundary: Naya Raipur Marg (4-Lane Divided Highway) */}
              <g>
                <polyline
                  points="-45,628 338,762 560,842"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="24"
                  strokeLinecap="round"
                />
                <polyline
                  points="-45,628 338,762 560,842"
                  fill="none"
                  stroke="#15803d"
                  strokeWidth="2.5"
                />
                <polyline
                  points="-45,623 338,757 560,837"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="1"
                  strokeDasharray="6 6"
                />
                <polyline
                  points="-45,633 338,767 560,847"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="1"
                  strokeDasharray="6 6"
                />
                <text
                  x="215"
                  y="724"
                  transform="rotate(19.5, 215, 724)"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="8.5"
                  fontWeight="700"
                  letterSpacing="1.2"
                >
                  NAYA RAIPUR MARG (4-LANE HIGHWAY)
                </text>
              </g>

              {/* Clipped 50-Acre IIIT Naya Raipur Campus Digital Twin Area */}
              <g clipPath="url(#iiitnrCampusClip)">
                <polygon points={CAMPUS_PERIMETER_POINTS} fill="url(#campusTerrainGrad)" />
                <rect x="-55" y="0" width="840" height="857" fill="url(#twinSubtleGrid)" />

                {/* 1. North Cricket & Athletics Practice Ground */}
                <g>
                  <polygon
                    points="132,330 195,125 328,194 368,272 252,298"
                    fill="#112e28"
                    fillOpacity="0.82"
                    stroke="#059669"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <ellipse
                    cx="240"
                    cy="224"
                    rx="48"
                    ry="38"
                    transform="rotate(18, 240, 224)"
                    fill="#133b2f"
                    fillOpacity="0.7"
                    stroke="rgba(52, 211, 153, 0.35)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <rect
                    x="237"
                    y="214"
                    width="6"
                    height="20"
                    rx="1"
                    transform="rotate(18, 240, 224)"
                    fill="#d6d3d1"
                    fillOpacity="0.65"
                  />
                  {showLabels && (
                    <text
                      x="240"
                      y="246"
                      textAnchor="middle"
                      fill="rgba(110, 231, 183, 0.65)"
                      fontSize="7"
                      fontWeight="700"
                    >
                      NORTH ATHLETICS & CRICKET OVAL
                    </text>
                  )}
                </g>

                {/* 2. South Central Green Lawn */}
                <polygon
                  points="226,568 364,590 338,735 202,688"
                  fill="#0f3d2e"
                  fillOpacity="0.78"
                  stroke="#047857"
                  strokeWidth="0.9"
                />

                {/* 3. West Hostel Green Courtyard Lawns */}
                <polygon
                  points="68,388 214,352 182,508 55,468"
                  fill="#0f3d2e"
                  fillOpacity="0.68"
                />

                {/* 4. East & Southeast Dense Woodland / Tree Canopy Zone */}
                <polygon
                  points="395,585 635,535 555,830 355,750"
                  fill="#0b2e25"
                  fillOpacity="0.82"
                />
                <polygon
                  points="440,145 485,220 452,272 548,412 658,468 615,538 495,508"
                  fill="#0b2e25"
                  fillOpacity="0.65"
                />
                {twinTheme === 'architectural' &&
                  FOREST_CLUSTERS.map((tree, idx) => (
                    <g key={idx}>
                      <circle
                        cx={tree.x}
                        cy={tree.y}
                        r={tree.r}
                        fill="#064e3b"
                        fillOpacity="0.65"
                        stroke="#047857"
                        strokeWidth="0.7"
                      />
                      <circle cx={tree.x - 2} cy={tree.y - 2} r={tree.r * 0.55} fill="#065f46" fillOpacity="0.7" />
                    </g>
                  ))}

                {/* 5. Complete Internal Road Network */}
                <g
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="13.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22,642 198,65" />
                  <polyline points="330,194 426,138 472,214 376,272 330,194" strokeWidth="10.5" />
                  <polyline points="352,232 380,278" strokeWidth="9.5" />
                  <polyline points="376,272 386,278" strokeWidth="9.5" />
                  {/* Main Gate Entrance Boulevard to Crossroads */}
                  <polyline points="338,755 355,688 358,582" strokeWidth="14" />
                  {/* Crossroads to West / Canteen Road */}
                  <polyline points="358,582 336,520 305,442 212,402" strokeWidth="11.5" />
                  {/* Crossroads through Academic Front Road past Amphitheatre 2 */}
                  <polyline points="358,582 405,570 458,586 505,625 555,830" strokeWidth="11" />
                  {/* Academic Front Grand Portico Drop-Off Driveway Loop */}
                  <path
                    d="M 374,566 C 382,536 398,522 414,522 C 430,522 444,536 450,566"
                    strokeWidth="11"
                  />
                  {/* Northeast Loop Road past KRC & MPH */}
                  <polyline points="450,566 496,512 532,412 445,278" strokeWidth="11" />
                  {/* Inner Western Hostel Spine Road */}
                  <polyline points="142,692 155,625 178,515 212,402 252,302" strokeWidth="11.5" />
                  {/* Mid-West Hostel Cross Street */}
                  <polyline points="55,518 178,558" strokeWidth="9.5" />
                  {/* Tree-Lined Northern & Eastern Main Loop Road */}
                  <polyline points="235,342 252,302 380,278 445,278" strokeWidth="12" />
                  <polyline points="496,512 618,542" strokeWidth="11" />
                  <polyline points="648,472 555,830" strokeWidth="11" />
                </g>

                {/* Asphalt Surface Fill */}
                <g
                  fill="none"
                  stroke="#334155"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22,642 198,65" />
                  <polyline points="330,194 426,138 472,214 376,272 330,194" strokeWidth="7.5" />
                  <polyline points="352,232 380,278" strokeWidth="7" />
                  <polyline points="22,642 142,692 338,755" />
                  <polyline points="155,625 352,688" strokeWidth="7" />
                  <polyline points="338,755 355,688 358,582" strokeWidth="11" />
                  <polyline points="358,582 336,520 305,442 212,402" strokeWidth="8.5" />
                  <polyline points="358,582 405,570 458,586 505,625 555,830" strokeWidth="8.5" />
                  <path
                    d="M 374,566 C 382,536 398,522 414,522 C 430,522 444,536 450,566"
                    strokeWidth="8"
                  />
                  <polyline points="450,566 496,512 532,412 445,278" strokeWidth="8.5" />
                  <polyline points="142,692 155,625 178,515 212,402 252,302" strokeWidth="8.5" />
                  <polyline points="55,518 178,558" strokeWidth="7" />
                  <polyline points="235,342 252,302 380,278 445,278" strokeWidth="9" />
                  <polyline points="496,512 618,542" strokeWidth="8.5" />
                  <polyline points="648,472 555,830" strokeWidth="8.5" />
                </g>

                {/* Landscaped Green Island inside the Front Portico Loop */}
                <ellipse
                  cx="412"
                  cy="544"
                  rx="16"
                  ry="9"
                  transform="rotate(-15, 412, 544)"
                  fill="#15803d"
                  stroke="#86efac"
                  strokeWidth="1.2"
                />

                {/* West Amphitheatre Parking Bay at (418, 588) */}
                <g transform="translate(418, 588) rotate(18)">
                  <rect x="-6" y="-16" width="12" height="32" rx="2" fill="#475569" stroke="#94a3b8" strokeWidth="0.7" />
                  {[-11, -5, 1, 7, 13].map((py, i) => (
                    <line key={i} x1="-5" y1={py} x2="5" y2={py} stroke="#e2e8f0" strokeWidth="0.7" />
                  ))}
                </g>

                {/* Dashed Road Centerlines */}
                <g
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="5 5"
                  strokeLinecap="round"
                  opacity="0.75"
                >
                  <polyline points="22,642 198,65" />
                  <polyline points="330,194 426,138 472,214 376,272 330,194" />
                  <polyline points="22,642 142,692 338,755" />
                  <polyline points="338,755 355,688 358,582" />
                  <polyline points="358,582 336,520 305,442 212,402" />
                  <polyline points="358,582 405,570 458,586 505,625 555,830" />
                  <path d="M 374,566 C 382,536 398,522 414,522 C 430,522 444,536 450,566" />
                  <polyline points="450,566 496,512 532,412" />
                  <polyline points="142,692 155,625 178,515 212,402 252,302" />
                  <polyline points="235,342 252,302 380,278 445,278" />
                  <polyline points="496,512 618,542" />
                </g>

                {/* 6. Pedestrian Footpaths & Walkways */}
                {showPathsAndCourts && (
                  <g>
                    <g
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="4.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="330,194 295,165 265,142 208,114" />
                      <polyline points="265,142 250,215 248,300" />
                      <polyline points="175,120 205,122" />
                      <polyline points="368,282 412,368" />
                      <polyline points="355,395 372,392 406,392 442,388 488,402" />
                      {/* Rear Academic North Terrace Promenade */}
                      <polyline points="360,422 395,418 438,422" />
                      <polyline points="332,542 268,512 188,526" />
                      <polyline points="305,442 274,472 225,475 188,526" />
                      <polyline points="232,424 218,448 225,475" />
                      <polyline points="222,602 358,602" />
                      <polyline points="68,422 148,438 198,458" />
                      <polyline points="108,392 136,392 176,376" />
                      <polyline points="115,560 162,574 200,585" />
                      <polyline points="428,555 458,580" />
                      <polyline points="468,632 425,685 355,688" />
                    </g>

                    <g
                      fill="none"
                      stroke="#f8fafc"
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                      strokeLinecap="round"
                      opacity="0.85"
                    >
                      <polyline points="330,194 295,165 265,142 208,114" />
                      <polyline points="265,142 250,215 248,300" />
                      <polyline points="368,282 412,368" />
                      <polyline points="355,395 372,392 406,392 442,388 488,402" />
                      <polyline points="360,422 395,418 438,422" />
                      <polyline points="332,542 268,512 188,526" />
                      <polyline points="305,442 274,472 225,475 188,526" />
                      <polyline points="222,602 358,602" />
                      <polyline points="68,422 148,438 198,458" />
                      <polyline points="115,560 162,574 200,585" />
                      <polyline points="468,632 425,685 355,688" />
                    </g>

                    {showLabels && (
                      <text
                        x="272"
                        y="145"
                        transform="rotate(29, 272, 145)"
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize="6.8"
                        fontWeight="700"
                      >
                        Ramanujan ↔ Sports Path
                      </text>
                    )}
                  </g>
                )}

                {/* Boulevard Trees */}
                {twinTheme === 'architectural' &&
                  BOULEVARD_TREES.map((t, idx) => (
                    <circle
                      key={idx}
                      cx={t.x}
                      cy={t.y}
                      r="3.8"
                      fill="#10b981"
                      fillOpacity="0.8"
                      stroke="#064e3b"
                      strokeWidth="0.8"
                    />
                  ))}
              </g>

              {/* --------------------------------------------------- */}
              {/* 50-Acre Perimeter Boundary & Survey Pillars Overlay */}
              {/* --------------------------------------------------- */}
              {showBoundary && (
                <g>
                  {/* Outer Demarcation Glow */}
                  <polygon
                    points={IIITNR_CAMPUS_PERIMETER_POINTS}
                    fill="none"
                    stroke={hoveredBoundary ? '#38bdf8' : '#6366f1'}
                    strokeWidth={hoveredBoundary ? '3.5' : '2.2'}
                    strokeLinejoin="round"
                    strokeDasharray="8 6"
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setHoveredBoundary(true)}
                    onMouseLeave={() => setHoveredBoundary(false)}
                  />

                  {/* 4 Boundary Survey Pillars */}
                  {IIITNR_CAMPUS_BOUNDARY_CORNERS.map((pillar) => {
                    const isPillarHovered = hoveredPillar?.id === pillar.id;
                    return (
                      <g
                        key={pillar.id}
                        transform={`translate(${pillar.x}, ${pillar.y})`}
                        onMouseEnter={() => setHoveredPillar(pillar)}
                        onMouseLeave={() => setHoveredPillar(null)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx="0"
                          cy="0"
                          r={isPillarHovered ? '9' : '6'}
                          fill="rgba(244, 63, 94, 0.3)"
                          className="animate-ping"
                        />
                        <polygon
                          points="0,-7 6,0 0,7 -6,0"
                          fill="#f43f5e"
                          stroke="#ffffff"
                          strokeWidth="1.2"
                        />
                        {isPillarHovered && (
                          <g transform="translate(0, -14)">
                            <rect
                              x="-65"
                              y="-22"
                              width="130"
                              height="22"
                              rx="5"
                              fill="rgba(15, 23, 42, 0.95)"
                              stroke="#f43f5e"
                              strokeWidth="1"
                            />
                            <text
                              x="0"
                              y="-11"
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="7.5"
                              fontWeight="700"
                            >
                              {pillar.label}
                            </text>
                            <text
                              x="0"
                              y="-3"
                              textAnchor="middle"
                              fill="#f43f5e"
                              fontSize="6.5"
                            >
                              ({pillar.x}, {pillar.y}) · 50-Acre Perimeter
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Glowing Inner Perimeter Wall */}
              <polygon
                points={CAMPUS_PERIMETER_POINTS}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.8"
                strokeLinejoin="round"
              />
              <polygon
                points={CAMPUS_PERIMETER_POINTS}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="6 4"
                strokeLinejoin="round"
              />

              {/* Compass Rose & Scale Indicator */}
              <g transform="translate(62, 92)">
                <circle cx="0" cy="0" r="22" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                <polygon points="0,-15 -5,4 0,0 5,4" fill="#38bdf8" />
                <polygon points="0,15 -4,-2 0,0 4,-2" fill="#475569" />
                <text x="0" y="-17" textAnchor="middle" fill="#e2e8f0" fontSize="7.5" fontWeight="800">
                  N
                </text>
              </g>

              {/* Render All 16 Interactive Digital Twin Entities */}
              {buildings.map((b) => {
                const isSelected = activeBuildingObj?.id === b.id;
                const isHovered = hoveredId === b.id;
                return renderDigitalTwinEntity(b, isSelected, isHovered);
              })}

              {/* Animated Radar Locator Wave on Auto-Detect / Search Match */}
              {radarTarget && (
                <g transform={`translate(${radarTarget.cx}, ${radarTarget.cy})`}>
                  <circle
                    cx="0"
                    cy="0"
                    r="40"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    className="animate-ping"
                    opacity="0.85"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="24"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <circle cx="0" cy="0" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                  {radarTarget.label && (
                    <g transform="translate(0, -32)">
                      <rect
                        x="-55"
                        y="-12"
                        width="110"
                        height="18"
                        rx="5"
                        fill="#0284c7"
                        stroke="#ffffff"
                        strokeWidth="1.2"
                      />
                      <text
                        x="0"
                        y="1"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="8"
                        fontWeight="800"
                      >
                        🎯 {radarTarget.label}
                      </text>
                    </g>
                  )}
                </g>
              )}
            </g>
          </svg>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* Active Zone Telemetry & Legend Bar */}
        {/* ----------------------------------------------------------- */}
        <div className="p-3.5 rounded-2xl bg-slate-950/95 border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-mono text-[10px] font-bold">
                {hoveredBuildingObj?.trace?.badge || hoveredBuildingObj?.mapPin?.badge || 'TWIN'}
              </span>
              <span className="font-black text-white text-sm">
                {hoveredBuildingObj?.name}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-[11px] text-emerald-400 font-medium">
                {hoveredBuildingObj?.type}
              </span>
              <span className="hidden md:inline-block text-[10px] font-mono text-slate-400">
                [{hoveredBuildingObj?.gps}]
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {hoveredBuildingObj?.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden xl:flex items-center space-x-3 text-[10px] text-slate-400 mr-2">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" /> Hostels
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-600 inline-block" /> Academic/KRC
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" /> FG / Sports / Amphi
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-red-600 inline-block" /> Courts
              </span>
            </div>

            {selectedRoom && (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-mono text-xs font-bold shrink-0">
                📍 {selectedRoom}
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* Digital Twin Floor & Facility Inspector Drawer */}
        {/* ----------------------------------------------------------- */}
        {activeBuildingObj && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-white space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2.5">
                <span className="text-base">🏢</span>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white">
                    {activeBuildingObj.name} — Floor & Room Inspector
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Click any room, lab, or facility tile below to immediately lock it into your complaint.
                  </p>
                </div>
              </div>

              {/* Floor Switcher Tabs */}
              {availableFloors.length > 1 && (
                <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 px-2 uppercase font-bold">
                    Floor:
                  </span>
                  {availableFloors.map((fl) => {
                    const isFlActive = String(inspectorFloor) === String(fl.id);
                    return (
                      <button
                        key={fl.id}
                        type="button"
                        onClick={() => setInspectorFloor(fl.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isFlActive
                            ? 'bg-sky-600 text-white shadow-2xs'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {fl.label.includes('(') ? fl.label.split(' (')[0] : fl.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Wing Switcher (For Hostels) */}
            {activeBuildingObj.category === 'HOSTEL' && availableWings.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                  Wing / Zone:
                </span>
                {availableWings.map((w) => {
                  const isWingActive = inspectorWing === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setInspectorWing(w.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
                        isWingActive
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-2xs'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Interactive Clickable Room / Facility Grid */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>
                  Available Facilities & Rooms on {inspectorFloor === 'G' ? 'Ground Floor' : `Floor ${inspectorFloor}`} ({inspectorRooms.length} detected)
                </span>
                <span className="text-emerald-400">Click to Select</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                {inspectorRooms.map((roomName, idx) => {
                  const isThisRoomSelected = selectedRoom === roomName;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (onSelectRoom) onSelectRoom(roomName);
                        if (onSelectBuilding) onSelectBuilding(activeBuildingObj.name);
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                        isThisRoomSelected
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-sky-500/50 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{roomName}</span>
                      {isThisRoomSelected && (
                        <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* Inline Digital Twin Editor Drawer (Super Admin Only) */}
        {/* ----------------------------------------------------------- */}
        {isSuperAdmin && isEditMode && editingBuilding && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 text-white space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <span className="font-bold text-amber-300">
                Editing Digital Twin Zone: {editingBuilding.name} (Click map to add zone or drag any zone)
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
                  onClick={() => setBuildings(resetCampusBuildingsToDefault())}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer"
                >
                  Reset Twin
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBuilding(editingBuilding.id)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[11px] font-bold cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Zone / Building Name</label>
                <input
                  type="text"
                  value={editingBuilding.name}
                  onChange={(e) =>
                    handleUpdateBuildingField(editingBuilding.id, {
                      name: e.target.value,
                      shortName: e.target.value.split(' (')[0],
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Map Pill Label</label>
                <input
                  type="text"
                  value={editingBuilding.shortName || ''}
                  onChange={(e) =>
                    handleUpdateBuildingField(editingBuilding.id, { shortName: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Badge Code</label>
                <input
                  type="text"
                  value={editingBuilding.trace?.badge || editingBuilding.mapPin?.badge || ''}
                  onChange={(e) =>
                    handleUpdateBuildingField(editingBuilding.id, { badge: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Category</label>
                <select
                  value={editingBuilding.category || 'HOSTEL'}
                  onChange={(e) =>
                    handleUpdateBuildingField(editingBuilding.id, { category: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                >
                  <option value="HOSTEL">HOSTEL</option>
                  <option value="ACADEMIC">ACADEMIC</option>
                  <option value="AMENITY">AMENITY</option>
                  <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------- */}
      {/* Super Admin JSON Export / Import Modal */}
      {/* ----------------------------------------------------------- */}
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
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300"
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
