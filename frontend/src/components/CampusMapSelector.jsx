/**
 * SmartComplaintHandler - 1:1 Satellite-Aligned Custom University-Only Map (IIIT Naya Raipur)
 *
 * Key Corrections Grounded in Satellite View (735 x 857 space):
 * 1. Ramanujan House is the northern complex at (405, 210) with twin red/green inner courts.
 * 2. Sports Complex is the far north-west indoor sports building at (218, 98), connected to Ramanujan House
 *    by the diagonal footpath ((332, 195) -> (295, 160) -> (258, 142) -> (226, 125)) and bordered by the open sports ground.
 * 3. Academic & Admin Complex at (398, 470) is accurately drawn with its central white Rotunda Dome (392, 468),
 *    4 parallel NE/SE wings ((402,436), (414,456), (418,492), (430,510)), North Arc (382,400), and Green Court (412,398).
 * 4. Every western, central, and northeastern building block visible in the satellite view is rendered at its exact
 *    position and angle: Long North Wing (382,338), 3 Faculty/Guest blocks ((416,312), (442,342), (462,370)),
 *    MPH (488,405), Library/KRC (482,462), Shabri House + Annex ((572,478) & (612,492)), Canteen Rotunda (332,542) +
 *    Mess Wings ((272,512), (225,482), (236,425), (218,448)) + Red Outdoor Court (195,525), Bose House (118,558),
 *    Bhabha House (204,588), Raman House + West Blocks ((175,376), (112,392), (152,442), (95,448)),
 *    Amphitheatre 2 + NE Terraces (472,598), Union Bank ATM (345,688), Main Gate Arch on Naya Raipur Marg (338,755),
 *    and West Gate (22,642).
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
  const [showLabels, setShowLabels] = useState(true);
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
        w: 54,
        h: 50,
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
   * Renders the exact 1:1 satellite-aligned architectural geometry for each building cluster.
   */
  const renderBuildingFootprint = (b, isSelected, isHovered) => {
    const cx = b.trace?.cx ?? 395;
    const cy = b.trace?.cy ?? 472;
    const w = b.trace?.w || 58;
    const h = b.trace?.h || 52;
    const angle = b.trace?.angle ?? 18;
    const shape = b.trace?.shape || 'courtyard_quad';
    const baseColor = b.trace?.color || b.mapPin?.color || '#4f46e5';

    const fillOpacity = viewStyle === 'satellite' ? (isSelected ? 0.8 : 0.52) : 0.94;
    const strokeColor = isSelected ? '#38bdf8' : isHovered ? '#ffffff' : 'rgba(255,255,255,0.75)';
    const strokeWidth = isSelected ? 2.8 : isHovered ? 2.2 : 1.3;

    // Label position overrides so no two labels ever collide
    let labelX = cx;
    let labelY = cy + h / 2 + 11;
    if (b.id === 'ramanujan_house') {
      labelX = 405;
      labelY = 152;
    } else if (b.id === 'sports_ground') {
      labelX = 218;
      labelY = 142;
    } else if (b.id === 'transit_hostel') {
      labelX = 448;
      labelY = 296;
    } else if (b.id === 'sac_mph') {
      labelX = 522;
      labelY = 382;
    } else if (b.id === 'krc_library') {
      labelX = 508;
      labelY = 492;
    } else if (b.id === 'academic_block') {
      labelX = 398;
      labelY = 538;
    } else if (b.id === 'cafeteria_mess') {
      labelX = 285;
      labelY = 556;
    } else if (b.id === 'bose_house') {
      labelX = 112;
      labelY = 600;
    } else if (b.id === 'bhabha_house') {
      labelX = 204;
      labelY = 626;
    } else if (b.id === 'raman_house') {
      labelX = 152;
      labelY = 342;
    } else if (b.id === 'shabhari_house') {
      labelX = 582;
      labelY = 522;
    } else if (b.id === 'amphitheatre') {
      labelX = 472;
      labelY = 644;
    } else if (b.id === 'main_gate') {
      labelX = 338;
      labelY = 776;
    }

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
          if (isEditMode) setDraggingId(b.id);
        }}
        className={isEditMode ? 'cursor-move' : 'cursor-pointer'}
      >
        {/* 1. RAMANUJAN HOUSE (Top-center complex at 405,210 with twin red/green courts) */}
        {shape === 'ramanujan_complex' && (
          <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
            <rect
              x={-42}
              y={-29}
              width={84}
              height={58}
              rx="5"
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <rect
              x={-24}
              y={-16}
              width={48}
              height={32}
              rx="2"
              fill="#0f172a"
              fillOpacity="0.9"
            />
            {/* Twin Inner Badminton / Sports Courts */}
            <rect
              x={-20}
              y={-13}
              width={18}
              height={26}
              rx="1.5"
              fill="#dc2626"
              stroke="#ffffff"
              strokeWidth="1"
            />
            <rect
              x={2}
              y={-13}
              width={18}
              height={26}
              rx="1.5"
              fill="#16a34a"
              stroke="#ffffff"
              strokeWidth="1"
            />
          </g>
        )}

        {/* 2. SPORTS COMPLEX (Far top-left indoor hall at 218,98) */}
        {shape === 'sports_hall' && (
          <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
            <rect
              x={-18}
              y={-31}
              width={36}
              height={62}
              rx="4"
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <line x1="-18" y1="0" x2="18" y2="0" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          </g>
        )}

        {/* 3. ACADEMIC & ADMIN COMPLEX (Exact satellite alignment: Central Dome + 4 NE/SE parallel wings + N Arc) */}
        {shape === 'academic_complex' && (
          <g>
            {/* North Curved Arc & Green Court */}
            <g transform="translate(382, 400) rotate(-10)">
              <rect
                x="-24"
                y="-7"
                width="48"
                height="14"
                rx="3"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth="1.2"
              />
            </g>
            <g transform="translate(412, 398) rotate(-32)">
              <rect
                x="-12"
                y="-7"
                width="24"
                height="14"
                rx="2"
                fill="#10b981"
                fillOpacity="0.85"
                stroke="#ffffff"
                strokeWidth="1"
              />
            </g>
            {/* Main NW-SE Spine */}
            <g transform="translate(388, 472) rotate(-32)">
              <rect
                x="-12"
                y="-46"
                width="24"
                height="92"
                rx="4"
                fill="#0369a1"
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
            </g>
            {/* 4 Parallel NE/SE Multi-Wing Fingers */}
            {[
              { x: 402, y: 436, w: 48, h: 14 },
              { x: 414, y: 456, w: 48, h: 14 },
              { x: 418, y: 492, w: 52, h: 15 },
              { x: 430, y: 510, w: 52, h: 15 },
            ].map((wing, i) => (
              <g key={i} transform={`translate(${wing.x}, ${wing.y}) rotate(-32)`}>
                <rect
                  x={-wing.w / 2}
                  y={-wing.h / 2}
                  width={wing.w}
                  height={wing.h}
                  rx="3"
                  fill={baseColor}
                  fillOpacity={fillOpacity}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                />
              </g>
            ))}
            {/* Iconic Central White Rotunda Dome at (392, 468) */}
            <circle
              cx="392"
              cy="468"
              r="13"
              fill="#f8fafc"
              stroke={isSelected ? '#38bdf8' : '#0284c7'}
              strokeWidth="2.5"
            />
            <circle cx="392" cy="468" r="5.5" fill="#38bdf8" />
          </g>
        )}

        {/* 4. FACULTY QUARTERS, GUEST HOUSE & LONG NORTH WING */}
        {shape === 'faculty_cluster' && (
          <g>
            {/* Long Narrow Wing bordering the Central Green Lawn (382, 338) */}
            <g transform="translate(382, 338) rotate(-32)">
              <rect
                x="-8"
                y="-37"
                width="16"
                height="74"
                rx="3"
                fill="#0ea5e9"
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
            </g>
            {/* 3 Stepped Northeast Residential Blocks */}
            {[
              { x: 416, y: 312, w: 36, h: 32 },
              { x: 442, y: 342, w: 32, h: 26 },
              { x: 462, y: 370, w: 32, h: 26 },
            ].map((blk, i) => (
              <g key={i} transform={`translate(${blk.x}, ${blk.y}) rotate(-32)`}>
                <rect
                  x={-blk.w / 2}
                  y={-blk.h / 2}
                  width={blk.w}
                  height={blk.h}
                  rx="4"
                  fill={baseColor}
                  fillOpacity={fillOpacity}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                />
              </g>
            ))}
          </g>
        )}

        {/* 5. SHABRI HOUSE (East Girls Hostel Quadrangle + East Annex) */}
        {shape === 'shabri_quad' && (
          <g>
            <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
              <rect
                x={-29}
                y={-27}
                width={58}
                height={54}
                rx="5"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              <rect
                x={-12}
                y={-11}
                width={24}
                height={22}
                rx="2"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="1"
              />
            </g>
            <g transform="translate(612, 492) rotate(18)">
              <rect
                x="-9"
                y="-17"
                width="18"
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

        {/* 6. RAMAN HOUSE & UPPER-WEST RESIDENTIAL CLUSTER (4 blocks at Phase 2) */}
        {shape === 'west_hostel_cluster' && (
          <g>
            {/* Main Courtyard Quad at (175, 376) */}
            <g transform="translate(175, 376) rotate(18)">
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
              <rect x="-8" y="-7" width="16" height="14" rx="1.5" fill="#0f172a" />
            </g>
            {/* Outer-West Block at (112, 392) */}
            <g transform="translate(112, 392) rotate(18)">
              <rect
                x="-14"
                y="-17"
                width="28"
                height="34"
                rx="3"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
            </g>
            {/* Mid-West Elongated Wing at (152, 442) */}
            <g transform="translate(152, 442) rotate(18)">
              <rect
                x="-23"
                y="-12"
                width="46"
                height="24"
                rx="3"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
            </g>
            {/* Outer-West Small Block at (95, 448) */}
            <g transform="translate(95, 448) rotate(18)">
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

        {/* 7. CANTEEN ROTUNDA, CENTRAL MESS WINGS & RED COURT */}
        {shape === 'canteen_mess' && (
          <g>
            {/* Block C1 & Annex at (236, 425) & (218, 448) */}
            <g transform="translate(236, 425) rotate(18)">
              <rect
                x="-17"
                y="-14"
                width="34"
                height="28"
                rx="3"
                fill="#0284c7"
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth="1.2"
              />
            </g>
            <g transform="translate(218, 448) rotate(18)">
              <rect
                x="-9"
                y="-10"
                width="18"
                height="20"
                rx="2.5"
                fill="#0284c7"
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth="1.2"
              />
            </g>
            {/* Mess Wing North (225, 482) */}
            <g transform="translate(225, 482) rotate(18)">
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
            </g>
            {/* Mess Wing South (272, 512) */}
            <g transform="translate(272, 512) rotate(18)">
              <rect
                x="-20"
                y="-18"
                width="40"
                height="36"
                rx="4"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
            </g>
            {/* Red Outdoor Court (195, 525) */}
            <g transform="translate(195, 525) rotate(18)">
              <rect
                x="-9"
                y="-13"
                width="18"
                height="26"
                rx="2"
                fill="#dc2626"
                stroke="#ffffff"
                strokeWidth="1"
              />
            </g>
            {/* Circular Canteen Rotunda (332, 542) */}
            <circle
              cx="332"
              cy="542"
              r="18"
              fill="#f59e0b"
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <circle cx="332" cy="542" r="7" fill="#78350f" />
          </g>
        )}

        {/* 8. COURTYARD QUADRANGLES (Bose House 118,558 & Bhabha House 204,588) */}
        {shape === 'courtyard_quad' && (
          <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
            <rect
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              rx="5"
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <rect
              x={-w * 0.22}
              y={-h * 0.22}
              width={w * 0.44}
              height={h * 0.44}
              rx="2"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1"
            />
          </g>
        )}

        {/* 9. AMPHITHEATRE 2 & NE TERRACES (472, 598) */}
        {shape === 'amphitheatre' && (
          <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
            <path
              d="M -34,-8 A 36,36 0 0,1 34,-8 L 20,22 A 22,22 0 0,0 -20,22 Z"
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <path d="M -25,-2 A 26,26 0 0,1 25,-2" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
            <path d="M -16,5 A 17,17 0 0,1 16,5" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
            <circle cx="0" cy="15" r="8" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
          </g>
        )}

        {/* 10. MAIN GATE ARCH (338, 755), UNION BANK ATM (345, 688) & WEST GATE (22, 642) */}
        {shape === 'gate_and_atm' && (
          <g>
            {/* Union Bank of India ATM & Security Kiosk at (345, 688) */}
            <g transform="translate(345, 688) rotate(18)">
              <rect
                x="-10"
                y="-12"
                width="20"
                height="24"
                rx="3"
                fill="#475569"
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
            </g>
            {/* Main Entrance Gate Arch on Naya Raipur Marg at (338, 755) */}
            <g transform="translate(338, 755) rotate(18)">
              <rect
                x="-16"
                y="-6"
                width="32"
                height="12"
                rx="3"
                fill="#0284c7"
                stroke="#ffffff"
                strokeWidth="1.8"
              />
            </g>
            {/* West Gate on Western Avenue at (22, 642) */}
            <g transform="translate(22, 642) rotate(18)">
              <rect
                x="-10"
                y="-5"
                width="20"
                height="10"
                rx="2"
                fill="#0284c7"
                stroke="#ffffff"
                strokeWidth="1.2"
              />
            </g>
          </g>
        )}

        {/* 11. STANDARD HALL (MPH 488,405 & Library 482,462) */}
        {shape === 'hall' && (
          <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
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
          </g>
        )}

        {/* Compact, Non-Overlapping Label Pill */}
        {(showLabels || isSelected || isHovered) && (
          <g transform={`translate(${labelX}, ${labelY})`}>
            <rect
              x="-44"
              y="-8"
              width="88"
              height="16"
              rx="5"
              fill={isSelected ? '#0284c7' : 'rgba(9, 13, 22, 0.88)'}
              stroke={isSelected ? '#ffffff' : 'rgba(148, 163, 184, 0.45)'}
              strokeWidth="1"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="8.2"
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
      {/* Top Header Bar */}
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
            1:1 Satellite Aligned
          </span>
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

          <button
            type="button"
            onClick={() => setShowLabels((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white cursor-pointer"
          >
            {showLabels ? 'Labels: On' : 'Labels: Hover'}
          </button>

          {/* View Mode Toggle: Satellite Trace vs Vector Plan vs Original Boundary Markup */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewStyle('satellite')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                viewStyle === 'satellite' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Clean Satellite Trace with Traced Footprints"
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
              title="Exact Demarcation Line Markup"
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
            viewBox="-55 0 840 857"
            onClick={handleSvgClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`w-full max-h-[560px] select-none ${
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

            <rect x="-55" y="0" width="840" height="857" fill="#0b1120" />
            <rect x="-55" y="0" width="840" height="857" fill="url(#uniBlueprintGrid)" />

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Clipped University-Only Area */}
              <g clipPath="url(#iiitnrCampusClip)">
                {viewStyle === 'satellite' || viewStyle === 'markup' ? (
                  <image
                    href={viewStyle === 'markup' ? '/iiitnr_campus_satellite_markup.jpg' : '/iiitnr_campus_satellite_full.png'}
                    x="-85"
                    y="-65"
                    width="908"
                    height="910"
                    preserveAspectRatio="none"
                  />
                ) : (
                  <>
                    <polygon points={IIITNR_CAMPUS_PERIMETER_POINTS} fill="#11192c" />

                    {/* 1. Open Sports Ground (Between Sports Complex, Western Ave & Ramanujan House) */}
                    <polygon
                      points="132,330 195,130 295,162 355,268 258,298"
                      fill="#14302a"
                      fillOpacity="0.7"
                      stroke="#059669"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    {/* 2. Central Green Lawn (West of Long Wing) */}
                    <polygon
                      points="238,345 268,305 358,290 392,375 345,425 222,402"
                      fill="#104434"
                      fillOpacity="0.8"
                    />
                    {/* 3. South Gate Green Lawn */}
                    <polygon
                      points="235,580 368,608 338,735 202,688"
                      fill="#104434"
                      fillOpacity="0.7"
                    />
                    {/* 4. Southeast Woodland around Amphitheatre */}
                    <polygon
                      points="395,590 628,540 555,825 355,748"
                      fill="#0e362c"
                      fillOpacity="0.7"
                    />
                    {/* 5. West Hostel Green Courtyard */}
                    <polygon
                      points="75,390 218,355 185,505 58,465"
                      fill="#104434"
                      fillOpacity="0.65"
                    />
                    {/* 6. Amphitheatre NE Curved Landscaped Terraces */}
                    <polygon
                      points="445,535 505,518 568,545 525,585"
                      fill="#1e4034"
                      fillOpacity="0.7"
                    />
                    <path
                      d="M 452,550 Q 505,525 555,552 M 462,565 Q 505,542 542,566"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                    />

                    {/* Internal Campus Roads & Footpaths Traced 1:1 from Satellite */}
                    <g
                      fill="none"
                      stroke="#334155"
                      strokeWidth="11"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {/* Western Perimeter Avenue (from West Gate 22,642 up to Sports Complex 198,65) */}
                      <polyline points="22,642 198,65" />
                      {/* Ramanujan House Perimeter Loop Road */}
                      <polyline points="372,272 328,196 424,138 470,214 378,272" strokeWidth="9" />
                      {/* Southern Hostel Cross-Road to Main Gate */}
                      <polyline points="22,642 145,695 342,758" />
                      {/* Main Gate Entrance Boulevard */}
                      <polyline points="338,758 385,592 495,515" strokeWidth="12" />
                      {/* Inner Western Hostel Spine Road */}
                      <polyline points="145,695 235,342" strokeWidth="10" />
                      {/* Mid-West Hostel Cross Street */}
                      <polyline points="55,518 185,565" strokeWidth="8" />
                      {/* Northern Loop Road */}
                      <polyline points="235,342 265,302 435,274 532,418 495,515" />
                      {/* Central Spine Road (between Hostels, Canteen & Academic Block) */}
                      <polyline points="212,408 338,495 385,592" strokeWidth="10" />
                      {/* Academic Forecourt Semicircular Loop Road */}
                      <polyline points="338,495 355,468 392,445" strokeWidth="7" />
                      {/* Southeast Road past Amphitheatre */}
                      <polyline points="495,515 618,542" strokeWidth="10" />
                      {/* Eastern Boundary Road */}
                      <polyline points="648,472 555,830" />
                    </g>

                    {/* Direct Path from Ramanujan House (332,195) to Sports Complex (226,125)! */}
                    <polyline
                      points="332,195 295,160 258,142 226,125"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points="332,195 295,160 258,142 226,125"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                    />

                    {/* Road Centerlines */}
                    <g
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="1.2"
                      strokeDasharray="6 6"
                      strokeLinecap="round"
                    >
                      <polyline points="22,642 198,65" />
                      <polyline points="22,642 145,695 342,758" />
                      <polyline points="338,758 385,592 495,515" />
                      <polyline points="145,695 235,342" />
                      <polyline points="235,342 265,302 435,274 532,418 495,515" />
                      <polyline points="212,408 338,495 385,592" />
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
                  {/* North Edge: (171,25) to (777,212) mid=(474,118) angle=17.1 */}
                  <g transform="translate(474, 108) rotate(17.1)" className="pointer-events-none select-none">
                    <rect x="-80" y="-9" width="160" height="18" rx="4" fill="rgba(15, 23, 42, 0.88)" stroke="#f43f5e" strokeWidth="0.8" />
                    <text x="0" y="3" textAnchor="middle" fill="#fecdd3" fontSize="8.5" fontWeight="700" fontFamily="Inter, sans-serif">
                      North Boundary Wall · 570m
                    </text>
                  </g>

                  {/* East Edge: (777,212) to (556,840) mid=(666,526) angle=-70.5 */}
                  <g transform="translate(676, 526) rotate(-70.5)" className="pointer-events-none select-none">
                    <rect x="-70" y="-9" width="140" height="18" rx="4" fill="rgba(15, 23, 42, 0.88)" stroke="#f43f5e" strokeWidth="0.8" />
                    <text x="0" y="3" textAnchor="middle" fill="#fecdd3" fontSize="8.5" fontWeight="700" fontFamily="Inter, sans-serif">
                      East Forest Buffer · 597m
                    </text>
                  </g>

                  {/* South Edge: (556,840) to (-45,654) mid=(255,747) angle=17.2 */}
                  <g transform="translate(255, 757) rotate(17.2)" className="pointer-events-none select-none">
                    <rect x="-85" y="-9" width="170" height="18" rx="4" fill="rgba(15, 23, 42, 0.88)" stroke="#f43f5e" strokeWidth="0.8" />
                    <text x="0" y="3" textAnchor="middle" fill="#fecdd3" fontSize="8.5" fontWeight="700" fontFamily="Inter, sans-serif">
                      Naya Raipur Marg (South) · 564m
                    </text>
                  </g>

                  {/* West Edge: (-45,654) to (171,25) mid=(63,339) angle=-71.1 */}
                  <g transform="translate(53, 339) rotate(-71.1)" className="pointer-events-none select-none">
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

              {/* Compass Rose */}
              <g transform="translate(15, 65)">
                <circle cx="0" cy="0" r="22" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <polygon points="0,-14 -5,4 0,0 5,4" fill="#38bdf8" />
                <text x="0" y="-17" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                  N
                </text>
              </g>

              {/* Render All 1:1 Traced Campus Buildings & Hostels */}
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

        {/* Inline Editor Drawer */}
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
