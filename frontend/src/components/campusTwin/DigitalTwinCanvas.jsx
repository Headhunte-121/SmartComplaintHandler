/**
 * frontend/src/components/campusTwin/DigitalTwinCanvas.jsx
 *
 * Pure-Vector 1:1 Satellite-Traced SVG Renderer for the IIIT Naya Raipur Digital Twin.
 * Uses exact polygon vertices from campusGeometry.js so that the Main Academic Building,
 * Canteen Rotunda, Auditorium Hall, Central Mess, Block C1, Faculty Quarters, MPH,
 * Central Library (KRC), Hostels, Sports Complex, Football Ground (FG), Outdoor Courts,
 * Old Amphitheatre, and New Amphitheatre (Amphitheatre 2) are 100% aligned.
 */
import React from 'react';
import {
  IIITNR_CAMPUS_PERIMETER_POINTS,
  INNER_CAMPUS_CLIP_POINTS,
  IIITNR_CAMPUS_BOUNDARY_CORNERS,
  LABEL_POSITIONS,
  EXACT_BUILDING_POLYGONS,
  CAMPUS_ROAD_POLYLINES,
  CAMPUS_FOOTPATH_POLYLINES,
  FOREST_CLUSTERS,
  BOULEVARD_TREES,
} from '../../data/campusTwin/campusGeometry';

export default function DigitalTwinCanvas({
  svgRef,
  buildings,
  activeBuildingObj,
  hoveredId,
  setHoveredId,
  onSelectBuilding,
  setEditingBuildingId,
  setDraggingId,
  isSuperAdmin,
  isEditMode,
  twinTheme,
  showLabels,
  showPathsAndCourts,
  showBoundary,
  hoveredBoundary,
  setHoveredBoundary,
  hoveredPillar,
  setHoveredPillar,
  zoom,
  pan,
  radarTarget,
  handleSvgClick,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
}) {
  const isBlueprint = twinTheme === 'blueprint';

  /**
   * Renders a single interactive Digital Twin building or zone using its exact satellite-traced polygons
   */
  const renderBuildingEntity = (b) => {
    const isSelected = activeBuildingObj?.id === b.id;
    const isHovered = hoveredId === b.id;
    const cx = b.trace?.cx ?? 392;
    const cy = b.trace?.cy ?? 472;
    const w = b.trace?.w || 54;
    const h = b.trace?.h || 50;
    const angle = b.trace?.angle ?? 18;
    const shape = b.trace?.shape || 'courtyard_quad';
    const baseColor = b.trace?.color || b.mapPin?.color || '#4f46e5';

    const fillOpacity = isBlueprint ? (isSelected ? 0.48 : 0.25) : 0.95;
    const strokeColor = isSelected
      ? '#38bdf8'
      : isHovered
      ? '#ffffff'
      : isBlueprint
      ? '#38bdf8'
      : 'rgba(255,255,255,0.85)';
    const strokeWidth = isSelected ? 2.4 : isHovered ? 1.9 : 1.15;
    const labelPos = LABEL_POSITIONS[b.id] || { x: cx, y: cy + h / 2 + 12 };

    const P = EXACT_BUILDING_POLYGONS[b.id];

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
        {/* Selection / Hover Pulse Ring */}
        {(isSelected || isHovered) && (
          <circle
            cx={cx}
            cy={cy}
            r={Math.max(w, h) * 0.58}
            fill="none"
            stroke={isSelected ? '#38bdf8' : '#a5b4fc'}
            strokeWidth={isSelected ? '2' : '1.2'}
            strokeDasharray="4 4"
            opacity="0.85"
          />
        )}

        {/* 1. SPORTS COMPLEX (206, 92) */}
        {shape === 'sports_hall' && P && (
          <g>
            <polygon points={P.southApron} fill="#475569" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" />
            <polygon
              points={P.westAnnex}
              fill="#065f46"
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth="1"
            />
            <polygon
              points={P.mainHall}
              fill={isBlueprint ? baseColor : '#e2e8f0'}
              fillOpacity={fillOpacity}
              stroke={isSelected ? '#38bdf8' : '#10b981'}
              strokeWidth={strokeWidth}
            />
            {P.trussLines.map(([x1, y1, x2, y2], idx) => (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#059669"
                strokeWidth="0.9"
                strokeOpacity="0.6"
              />
            ))}
          </g>
        )}

        {/* 2. RAMANUJAN HOUSE (Boys Hostel 1 at 405, 210) */}
        {shape === 'ramanujan_complex' && P && (
          <g>
            <polygon
              points={P.outerHull}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {P.sawtoothEastFingers.map((pts, idx) => (
              <polygon
                key={idx}
                points={pts}
                fill="#6366f1"
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth="0.9"
              />
            ))}
            <polygon points={P.innerCourtyard} fill="#0f172a" stroke="#64748b" strokeWidth="0.9" />
            <polygon points={P.westGreenCourt} fill="#16a34a" stroke="#ffffff" strokeWidth="1" />
            <polygon points={P.eastRedCourt} fill="#dc2626" stroke="#ffffff" strokeWidth="1" />
          </g>
        )}

        {/* 3. MAIN FOOTBALL GROUND (FG at 306, 346) */}
        {shape === 'football_ground' && P && (
          <g>
            <polygon
              points={P.turfPolygon}
              fill="#14532d"
              fillOpacity={isBlueprint ? 0.35 : 0.92}
              stroke={isSelected ? '#38bdf8' : isHovered ? '#ffffff' : '#22c55e'}
              strokeWidth={isSelected ? 2.5 : 1.5}
            />
            <path d={P.trackCurve} fill="none" stroke="#b45309" strokeWidth="4.2" strokeLinecap="round" />
            <path
              d={P.trackCurve}
              fill="none"
              stroke="#fde68a"
              strokeWidth="0.9"
              strokeDasharray="3 3"
            />
            {/* Regulation Rotated Football Pitch Inside the Turf */}
            <g transform="translate(310, 344) rotate(-14)">
              {[-39, -26, -13, 0, 13, 26].map((sx, idx) => (
                <rect
                  key={idx}
                  x={sx}
                  y={-26}
                  width={13}
                  height={52}
                  fill={idx % 2 === 0 ? '#15803d' : '#166534'}
                  fillOpacity={isBlueprint ? 0.25 : 0.85}
                />
              ))}
              <rect
                x={-39}
                y={-26}
                width={78}
                height={52}
                rx="1.5"
                fill="none"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="1.1"
              />
              <line x1="0" y1="-26" x2="0" y2="26" stroke="rgba(255,255,255,0.85)" strokeWidth="1" />
              <circle cx="0" cy="0" r="10" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1" />
              <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
              <rect x={-39} y={-14} width={12} height={28} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.9" />
              <rect x={27} y={-14} width={12} height={28} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.9" />
            </g>
            {P.floodlights.map((fl) => (
              <g key={fl.id}>
                <circle cx={fl.x} cy={fl.y} r="4.2" fill="rgba(250,204,21,0.25)" />
                <circle cx={fl.x} cy={fl.y} r="2" fill="#fde047" stroke="#0f172a" strokeWidth="0.7" />
              </g>
            ))}
          </g>
        )}

        {/* 4. FACULTY RESIDENCES, STAFF QUARTERS, GUEST HOUSE & LONG NORTH WING */}
        {shape === 'faculty_cluster' && P && (
          <g>
            {/* Long North Solar-Roofed Wing bordering Football Ground (363,303 -> 408,364) */}
            <polygon
              points={P.longNorthWing}
              fill="#0ea5e9"
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <line
              x1={P.longWingLine[0]}
              y1={P.longWingLine[1]}
              x2={P.longWingLine[2]}
              y2={P.longWingLine[3]}
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="1"
            />
            {/* Staff Quarters Block A (H-shaped block at 416, 312) */}
            <polygon
              points={P.facultyBlock1West}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <polygon
              points={P.facultyBlock1East}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <polygon
              points={P.facultyBlock1Bridge}
              fill="#14b8a6"
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth="1"
            />
            {/* Faculty Residence Block B (443, 345) */}
            <polygon
              points={P.facultyBlock2}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Transit Hostel / Guest House Block C (463, 371) */}
            <polygon
              points={P.facultyBlock3}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Solar Parking & Utility Shed (440, 388) */}
            <polygon
              points={P.solarUtilityShed}
              fill="#334155"
              fillOpacity={fillOpacity}
              stroke="#38bdf8"
              strokeWidth="1"
            />
          </g>
        )}

        {/* 5. OLD AMPHITHEATRE (North Academic Stepped Bowl at 374, 392) */}
        {shape === 'old_amphitheatre' && P && (
          <g>
            <polygon
              points={P.outerBowl}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <path d={P.stepArc1} fill="none" stroke="#fde68a" strokeWidth="1" />
            <path d={P.stepArc2} fill="none" stroke="#fde68a" strokeWidth="1" />
            <circle
              cx={P.stageCenter.x}
              cy={P.stageCenter.y}
              r={P.stageCenter.r}
              fill="#78350f"
              stroke="#fde68a"
              strokeWidth="1"
            />
          </g>
        )}

        {/* 6. MULTI-PURPOSE HALL (MPH) & SAC (486, 400) */}
        {shape === 'mph_hall' && P && (
          <g>
            <polygon
              points={P.westCourtyardWing}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <polygon points={P.westInnerCourt} fill="#0f172a" stroke="#fdba74" strokeWidth="0.8" />
            <polygon
              points={P.eastWhiteRoofHall}
              fill={isBlueprint ? baseColor : '#f8fafc'}
              fillOpacity={fillOpacity}
              stroke={isSelected ? '#38bdf8' : '#ea580c'}
              strokeWidth={strokeWidth}
            />
          </g>
        )}

        {/* 7. CENTRAL LIBRARY / KRC (478, 458) */}
        {shape === 'krc_hall' && P && (
          <g>
            <polygon
              points={P.mainBlock}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <polygon points={P.courtyardCutout} fill="#1e1b4b" stroke="#c4b5fd" strokeWidth="0.9" />
          </g>
        )}

        {/* 8. MAIN ACADEMIC & ADMINISTRATIVE BUILDING (Exact Satellite Polygon Trace + Dome at 387, 483) */}
        {shape === 'academic_complex' && P && (
          <g>
            {/* North Angled Bar Wing */}
            <polygon
              points={P.northAngledWing}
              fill="#0284c7"
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* NW Front Courtyard Classroom Wing (E-101, LH-1, IDEA Lab, 131C/131E) */}
            <polygon
              points={P.nwFrontCourtyardWing}
              fill="#0284c7"
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <polygon points={P.nwFrontInnerAtrium} fill="#0f172a" stroke="#38bdf8" strokeWidth="0.8" />
            {/* SW Front Admin & Directorate Wing (Estate Office, Registrar, Director) */}
            <polygon
              points={P.swFrontAdminWing}
              fill="#0284c7"
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Rear NE Connecting Corridor */}
            <polygon
              points={P.rearConnectorSpine}
              fill="#0369a1"
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth="1"
            />
            {/* 4 Parallel NE Laboratory & Department Wings */}
            {[P.neLabWing1, P.neLabWing2, P.neLabWing3, P.neLabWing4].map((wPts, idx) => (
              <polygon
                key={idx}
                points={wPts}
                fill="#0ea5e9"
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
            ))}
            {/* Central NW-SE Spine Corridor */}
            <polygon
              points={P.centralSpine}
              fill="#0369a1"
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Central White Rotunda Dome at (387, 483) */}
            <circle
              cx={P.rotundaDome.cx}
              cy={P.rotundaDome.cy}
              r={P.rotundaDome.rOuter}
              fill="#f8fafc"
              stroke={isSelected ? '#38bdf8' : '#0284c7'}
              strokeWidth="2.3"
            />
            <circle
              cx={P.rotundaDome.cx}
              cy={P.rotundaDome.cy}
              r="7.8"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
            <circle
              cx={P.rotundaDome.cx}
              cy={P.rotundaDome.cy}
              r={P.rotundaDome.rInner}
              fill="#0ea5e9"
              stroke="#ffffff"
              strokeWidth="0.9"
            />
          </g>
        )}

        {/* 9. CENTRAL MESS, SHOPPING COMPLEX (BLOCK C1) & SUBSTATION */}
        {shape === 'mess_and_c1' && P && (
          <g>
            {/* Shopping Complex / Block C1 (232, 427) & Substation Annex (218, 448) */}
            <polygon
              points={P.shoppingBlockC1}
              fill="#0284c7"
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            <polygon
              points={P.substationAnnex}
              fill="#0369a1"
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth="1.1"
            />
            {/* H-Shaped Central Mess Building (222, 486) */}
            <polygon
              points={P.messNorthWing}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <polygon
              points={P.messSouthWing}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <polygon
              points={P.messWestSpine}
              fill="#b45309"
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </g>
        )}

        {/* 10. MAIN AUDITORIUM HALL (264, 496) */}
        {shape === 'auditorium_complex' && P && (
          <g>
            <polygon
              points={P.upperAngledHall}
              fill={isBlueprint ? baseColor : '#f1f5f9'}
              fillOpacity={fillOpacity}
              stroke={isSelected ? '#38bdf8' : '#e11d48'}
              strokeWidth={strokeWidth}
            />
            <polygon
              points={P.lowerMainHall}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </g>
        )}

        {/* 11. CANTEEN IIIT NAYA RAIPUR (Circular Rotunda at 315,534 & Curved Arcade at 326,538) */}
        {shape === 'canteen_rotunda' && P && (
          <g>
            {/* Plaza Circle */}
            <circle
              cx={P.plazaCenter.cx}
              cy={P.plazaCenter.cy}
              r={P.plazaCenter.r}
              fill="#78350f"
              fillOpacity="0.55"
              stroke="#fbbf24"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            {/* Curved Semicircular Open-Air Seating Arcade */}
            <path
              d={P.curvedArcadePath}
              fill="#d97706"
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Circular Canteen Rotunda Roof at (315, 534) */}
            <circle
              cx={P.rotunda.cx}
              cy={P.rotunda.cy}
              r={P.rotunda.r}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <circle cx={P.rotunda.cx} cy={P.rotunda.cy} r="4.5" fill="#78350f" stroke="#fde68a" strokeWidth="1" />
          </g>
        )}

        {/* 12. OUTDOOR SPORTS COURTS (West Twin Red Courts 188,526 & Academic North Green Court 406,392) */}
        {shape === 'outdoor_courts' && P && (
          <g>
            <polygon
              points={P.westRedCourtPad}
              fill="#1e293b"
              stroke={isSelected ? '#38bdf8' : '#f87171'}
              strokeWidth={strokeWidth}
            />
            <polygon points={P.westRedCourt1} fill="#dc2626" stroke="#ffffff" strokeWidth="0.9" />
            <polygon points={P.westRedCourt2} fill="#b91c1c" stroke="#ffffff" strokeWidth="0.9" />
            <polygon
              points={P.academicGreenCourt}
              fill="#10b981"
              stroke={isSelected ? '#38bdf8' : '#ffffff'}
              strokeWidth={strokeWidth}
            />
          </g>
        )}

        {/* 13. SHABRI HOUSE (Girls Hostel at 570, 478 + East Annex at 610, 488) */}
        {shape === 'shabri_quad' && P && (
          <g>
            <polygon
              points={P.outerQuad}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <polygon points={P.innerCourtyard} fill="#0f172a" stroke="#f472b6" strokeWidth="0.9" />
            <polygon points={P.westBlueCourt} fill="#0284c7" stroke="#ffffff" strokeWidth="0.8" />
            <polygon points={P.eastTanCourt} fill="#d97706" stroke="#ffffff" strokeWidth="0.8" />
            <polygon
              points={P.eastAnnex}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
          </g>
        )}

        {/* 14. RAMAN HOUSE & PHASE-2 UPPER-WEST CLUSTER (4 Blocks + D-Lawn) */}
        {shape === 'west_hostel_cluster' && P && (
          <g>
            <polygon points={P.dLawnCourt} fill="#15803d" fillOpacity="0.88" stroke="#86efac" strokeWidth="1.1" />
            <polygon
              points={P.mainQuad}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <polygon points={P.mainQuadCourt} fill="#0f172a" stroke="#a5b4fc" strokeWidth="0.8" />
            <polygon
              points={P.outerWestBlock}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <polygon
              points={P.southSteppedWing}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <polygon
              points={P.westAnnexBlock}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
          </g>
        )}

        {/* 15. BOSE HOUSE (Boys Hostel 3 at 115, 560) */}
        {shape === 'bose_quad' && P && (
          <g>
            <polygon
              points={P.outerQuad}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <polygon points={P.innerCourtyard} fill="#0f172a" stroke="#38bdf8" strokeWidth="0.9" />
            <polygon points={P.innerGreenCourt} fill="#16a34a" stroke="#ffffff" strokeWidth="0.9" />
          </g>
        )}

        {/* 16. BHABHA HOUSE (Boys Hostel 2 at 200, 586) */}
        {shape === 'bhabha_quad' && P && (
          <g>
            <polygon
              points={P.outerQuad}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <polygon points={P.innerCourtyard} fill="#0f172a" stroke="#38bdf8" strokeWidth="0.9" />
            <polygon points={P.innerGreenCourt} fill="#16a34a" stroke="#ffffff" strokeWidth="0.9" />
          </g>
        )}

        {/* 17. NEW AMPHITHEATRE (Amphitheatre 2 at 468, 595 + NE Terraces) */}
        {shape === 'amphitheatre' && P && (
          <g>
            <polygon
              points={P.neTerracePolygon}
              fill="#065f46"
              fillOpacity="0.68"
              stroke="#34d399"
              strokeWidth="0.9"
            />
            {P.neTerraceArcs.map((arcD, i) => (
              <path
                key={i}
                d={arcD}
                fill="none"
                stroke="#6ee7b7"
                strokeWidth="1.2"
                strokeDasharray="4 2"
              />
            ))}
            <polygon points={P.nwRamp} fill="#c2410c" stroke="#fed7aa" strokeWidth="0.9" />
            <g transform={`translate(${P.bowlCenter.cx}, ${P.bowlCenter.cy}) rotate(${P.bowlCenter.angle})`}>
              <path
                d="M -40,-10 A 42,42 0 0,1 40,-10 L 20,20 A 20,20 0 0,0 -20,20 Z"
                fill={baseColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              {[37, 33, 29, 25, 21, 17].map((rad, idx) => (
                <path
                  key={idx}
                  d={`M ${-rad},${-8 + idx * 3.2} A ${rad + 2},${rad + 2} 0 0,1 ${rad},${-8 + idx * 3.2}`}
                  fill="none"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="1.1"
                />
              ))}
            </g>
            <circle
              cx={P.stageCenter.cx}
              cy={P.stageCenter.cy}
              r={P.stageCenter.r}
              fill="#15803d"
              stroke="#ffffff"
              strokeWidth="1.4"
            />
          </g>
        )}

        {/* 18. MAIN GATE NO. 1, UNION BANK ATM, CROSSROADS PLINTH & WEST GATE */}
        {shape === 'gate_and_atm' && P && (
          <g>
            <circle
              cx={P.crossroadsPlinth.cx}
              cy={P.crossroadsPlinth.cy}
              r={P.crossroadsPlinth.r}
              fill="#334155"
              stroke="#f59e0b"
              strokeWidth="1.3"
            />
            <polygon
              points={P.atmKiosk}
              fill="#0284c7"
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <text x="342" y="690" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="900">
              ATM
            </text>
            <polygon
              points={P.mainGateArch}
              fill="#0f172a"
              stroke={isSelected ? '#38bdf8' : '#ffffff'}
              strokeWidth="1.8"
            />
            <polygon points={P.westGate} fill="#0f172a" stroke="#38bdf8" strokeWidth="1.4" />
          </g>
        )}

        {/* Fallback for Custom Added Buildings */}
        {!P && (
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
              fontSize="7.8"
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

  return (
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
                isBlueprint
                  ? 'rgba(56, 189, 248, 0.14)'
                  : 'rgba(148, 163, 184, 0.05)'
              }
              strokeWidth="0.8"
            />
          </pattern>
          <radialGradient id="campusTerrainGrad" cx="50%" cy="48%" r="55%">
            <stop offset="0%" stopColor={isBlueprint ? '#08142c' : '#132036'} />
            <stop offset="100%" stopColor={isBlueprint ? '#050b18' : '#0c1526'} />
          </radialGradient>
          <clipPath id="iiitnrCampusClip">
            <polygon points={INNER_CAMPUS_CLIP_POINTS} />
          </clipPath>
        </defs>

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

          {/* Clipped 50-Acre Campus Digital Twin Area */}
          <g clipPath="url(#iiitnrCampusClip)">
            <polygon points={INNER_CAMPUS_CLIP_POINTS} fill="url(#campusTerrainGrad)" />
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
            </g>

            {/* 2. South Central Green Lawn */}
            <polygon
              points="226,568 364,590 342,682 155,622"
              fill="#0f3d2e"
              fillOpacity="0.78"
              stroke="#047857"
              strokeWidth="0.9"
            />

            {/* 3. West Hostel Green Courtyard Lawns */}
            <polygon points="68,388 214,352 182,508 55,468" fill="#0f3d2e" fillOpacity="0.68" />

            {/* 4. East & Southeast Dense Woodland / Tree Canopy Zone */}
            <polygon points="395,585 635,535 555,830 355,750" fill="#0b2e25" fillOpacity="0.82" />
            <polygon
              points="440,145 485,220 452,272 548,412 658,468 615,538 495,508"
              fill="#0b2e25"
              fillOpacity="0.65"
            />
            {!isBlueprint &&
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

            {/* 5. Complete 1:1 Satellite-Traced Internal Road Network */}
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              {CAMPUS_ROAD_POLYLINES.map((r, i) => (
                <polyline key={`kerb-${i}`} points={r.points} stroke="#1e293b" strokeWidth={r.width + 2.5} />
              ))}
              {CAMPUS_ROAD_POLYLINES.map((r, i) => (
                <polyline key={`asphalt-${i}`} points={r.points} stroke="#334155" strokeWidth={r.width} />
              ))}
              {CAMPUS_ROAD_POLYLINES.map((r, i) => (
                <polyline
                  key={`center-${i}`}
                  points={r.points}
                  stroke="#94a3b8"
                  strokeWidth="0.9"
                  strokeDasharray="5 5"
                  opacity="0.75"
                />
              ))}
            </g>

            {/* Academic Front Teardrop Landscaped Roundabout Island at (416, 532) */}
            <g transform="translate(416, 532) rotate(-28)">
              <ellipse cx="0" cy="0" rx="22" ry="9" fill="#15803d" stroke="#86efac" strokeWidth="1.2" />
              <ellipse cx="-4" cy="0" rx="10" ry="4" fill="#22c55e" fillOpacity="0.65" />
            </g>

            {/* West Amphitheatre Parking Bay at (418, 588) */}
            <g transform="translate(418, 588) rotate(18)">
              <rect x="-6" y="-16" width="12" height="32" rx="2" fill="#475569" stroke="#94a3b8" strokeWidth="0.7" />
            </g>

            {/* 6. Complete Pedestrian Footpath Network */}
            {showPathsAndCourts && (
              <g>
                <g fill="none" stroke="#64748b" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round">
                  {CAMPUS_FOOTPATH_POLYLINES.map((p, idx) => (
                    <polyline key={`fp-base-${idx}`} points={p.points} />
                  ))}
                </g>
                <g
                  fill="none"
                  stroke="#f8fafc"
                  strokeWidth="1.15"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                  opacity="0.88"
                >
                  {CAMPUS_FOOTPATH_POLYLINES.map((p, idx) => (
                    <polyline key={`fp-dash-${idx}`} points={p.points} />
                  ))}
                </g>
                {showLabels && (
                  <text
                    x="272"
                    y="145"
                    transform="rotate(29, 272, 145)"
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="6.6"
                    fontWeight="700"
                  >
                    Ramanujan ↔ Sports Path
                  </text>
                )}
              </g>
            )}

            {/* Boulevard Trees */}
            {!isBlueprint &&
              BOULEVARD_TREES.map((t, idx) => (
                <circle
                  key={idx}
                  cx={t.x}
                  cy={t.y}
                  r="3.6"
                  fill="#10b981"
                  fillOpacity="0.82"
                  stroke="#064e3b"
                  strokeWidth="0.8"
                />
              ))}
          </g>

          {/* 50-Acre Perimeter Boundary & Survey Pillars */}
          {showBoundary && (
            <g>
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
                    <polygon points="0,-7 6,0 0,7 -6,0" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.2" />
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
                        <text x="0" y="-11" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="700">
                          {pillar.label}
                        </text>
                        <text x="0" y="-3" textAnchor="middle" fill="#f43f5e" fontSize="6.5">
                          ({pillar.x}, {pillar.y}) · 50-Acre Perimeter
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Inner Campus Perimeter Wall */}
          <polygon
            points={INNER_CAMPUS_CLIP_POINTS}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />

          {/* Compass Rose */}
          <g transform="translate(62, 92)">
            <circle cx="0" cy="0" r="22" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
            <polygon points="0,-15 -5,4 0,0 5,4" fill="#38bdf8" />
            <polygon points="0,15 -4,-2 0,0 4,-2" fill="#475569" />
            <text x="0" y="-17" textAnchor="middle" fill="#e2e8f0" fontSize="7.5" fontWeight="800">
              N
            </text>
          </g>

          {/* Render All 18 Satellite-Traced Digital Twin Entities */}
          {buildings.map((b) => renderBuildingEntity(b))}

          {/* Animated Radar Locator Wave on Search / Auto-Detect Match */}
          {radarTarget && (
            <g transform={`translate(${radarTarget.cx}, ${radarTarget.cy})`}>
              <circle
                cx="0"
                cy="0"
                r="38"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                className="animate-ping"
                opacity="0.88"
              />
              <circle
                cx="0"
                cy="0"
                r="22"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <circle cx="0" cy="0" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
              {radarTarget.label && (
                <g transform="translate(0, -30)">
                  <rect
                    x="-64"
                    y="-12"
                    width="128"
                    height="18"
                    rx="5"
                    fill="#0284c7"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                  />
                  <text x="0" y="1" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="800">
                    🎯 {radarTarget.label.slice(0, 24)}
                  </text>
                </g>
              )}
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
