/**
 * frontend/src/components/campusTwin/DigitalTwinCanvas.jsx
 *
 * Clean, High-Readability Vectorized SVG Campus Map for IIIT Naya Raipur.
 * 100% faithful to authentic GIS geometry from IIIT_Naya_Raipur_GIS_Complete (1).geojson:
 * - 16 Campus Buildings & Facilities (with 2.5D architectural roof plinths & details).
 * - 10 Campus Road Polylines (clean asphalt transit loop with curbs & lane dividers).
 * - 11 Pedestrian Walkway Polylines (stone-paved pathways with delicate walking guides).
 * - Zero-collision, high-contrast label cards with category badges and subtle leader lines.
 * - Perfectly scaled viewport: campus fills the screen comfortably with no dead margins.
 */
import React from 'react';
import {
  CAMPUS_VIEWBOX,
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
  showLabels = true,
  showPathsAndCourts = true,
  showBoundary = true,
  hoveredBoundary,
  setHoveredBoundary,
  hoveredPillar,
  setHoveredPillar,
  zoom = 1,
  pan = { x: 0, y: 0 },
  radarTarget,
  handleSvgClick,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
}) {
  const isBlueprint = twinTheme === 'blueprint';

  // Architectural Category Styling (Primary White & Secondary Light Green)
  const getCategoryStyles = (category, isSelected, isHovered) => {
    if (isSelected) {
      return {
        fill: '#dcfce7', // light green selection tint
        stroke: '#15803d', // deep green border
        strokeWidth: 2.2,
        badgeBg: '#15803d',
        badgeText: '#ffffff',
      };
    }
    if (isHovered) {
      return {
        fill: '#f0fdf4', // soft mint hover
        stroke: '#16a34a', // bright green border
        strokeWidth: 1.8,
        badgeBg: '#16a34a',
        badgeText: '#ffffff',
      };
    }

    switch (category) {
      case 'ACADEMIC':
        return {
          fill: '#ffffff',
          stroke: '#16a34a',
          strokeWidth: 1.3,
          badgeBg: '#15803d',
          badgeText: '#ffffff',
        };
      case 'AMENITY':
        return {
          fill: '#ffffff',
          stroke: '#0d9488',
          strokeWidth: 1.3,
          badgeBg: '#0f766e',
          badgeText: '#ffffff',
        };
      case 'HOSTEL':
        return {
          fill: '#ffffff',
          stroke: '#047857',
          strokeWidth: 1.3,
          badgeBg: '#065f46',
          badgeText: '#ffffff',
        };
      case 'INFRASTRUCTURE':
      default:
        return {
          fill: '#ffffff',
          stroke: '#0284c7',
          strokeWidth: 1.3,
          badgeBg: '#0369a1',
          badgeText: '#ffffff',
        };
    }
  };

  /**
   * Renders specialized architectural interior details for campus facilities
   */
  const renderBuildingAccents = (bId, pin) => {
    switch (bId) {
      case 'academic_block':
        return (
          <g>
            {/* Central Rotunda Dome & Glass Skylight */}
            <circle cx={387} cy={481} r="7.5" fill="#f8fafc" stroke="#16a34a" strokeWidth="1.2" />
            <circle cx={387} cy={481} r="3.8" fill="#dcfce7" stroke="#15803d" strokeWidth="0.8" />
            <circle cx={387} cy={481} r="1.2" fill="#15803d" />
          </g>
        );

      case 'canteen_block':
        return (
          <g>
            {/* Circular Dining Rotunda Roof */}
            <circle cx={362.6} cy={524.6} r="6.5" fill="#f8fafc" stroke="#0d9488" strokeWidth="1.2" />
            <circle cx={362.6} cy={524.6} r="3" fill="#ccfbf1" stroke="#0f766e" strokeWidth="0.8" />
          </g>
        );

      case 'bldg_1792159926765': // Football Ground
        return (
          <g transform="translate(348, 388) rotate(-14)">
            {/* Football Field Turf & Regulation Markings */}
            <rect x="-24" y="-15" width="48" height="30" rx="1.5" fill="#15803d" fillOpacity="0.85" stroke="#ffffff" strokeWidth="0.9" />
            {/* Field Stripes */}
            {[-18, -6, 6, 18].map((sx, idx) => (
              <rect key={idx} x={sx - 3} y="-15" width="6" height="30" fill="#166534" fillOpacity="0.35" />
            ))}
            <line x1="0" y1="-15" x2="0" y2="15" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="5" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="0.8" fill="#ffffff" />
            <rect x="-24" y="-7.5" width="6" height="15" fill="none" stroke="#ffffff" strokeWidth="0.7" />
            <rect x="18" y="-7.5" width="6" height="15" fill="none" stroke="#ffffff" strokeWidth="0.7" />
          </g>
        );

      case 'bldg_1792097005723': // Basketball Court
        return (
          <g transform="translate(387.5, 421.2) rotate(16)">
            {/* Court Royal Blue Surface & Lines */}
            <rect x="-8.5" y="-6.5" width="17" height="13" rx="1" fill="#0284c7" stroke="#ffffff" strokeWidth="0.7" />
            <line x1="0" y1="-6.5" x2="0" y2="6.5" stroke="#ffffff" strokeWidth="0.6" />
            <circle cx="0" cy="0" r="2.8" fill="none" stroke="#ffffff" strokeWidth="0.6" />
          </g>
        );

      case 'bldg_1792159282829': // Volleyball Court
        return (
          <g transform="translate(330.5, 514.4)">
            {/* Sand Court & Net */}
            <rect x="-11" y="-7" width="22" height="14" rx="1.5" fill="#fef3c7" stroke="#d97706" strokeWidth="0.9" />
            <line x1="0" y1="-7" x2="0" y2="7" stroke="#b45309" strokeWidth="0.8" strokeDasharray="2 1.5" />
          </g>
        );

      case 'bldg_1792159559173': // Old Amphitheatre
        return (
          <g transform="translate(367.9, 430)">
            {/* Stepped Acoustic Bowl Arcs */}
            <path d="M -10,-4 Q 0,-10 10,-4" fill="none" stroke="#0d9488" strokeWidth="0.8" opacity="0.7" />
            <path d="M -7,-1 Q 0,-6 7,-1" fill="none" stroke="#0d9488" strokeWidth="0.8" opacity="0.7" />
            <circle cx="0" cy="2" r="2.2" fill="#0f766e" />
          </g>
        );

      case 'bldg_1792119172307': // Palm Park
        return (
          <g transform="translate(358.9, 564)">
            {/* Miniature Palm Park Landscape Accents */}
            <circle cx="-8" cy="-6" r="3.5" fill="#22c55e" opacity="0.8" />
            <circle cx="6" cy="-8" r="4" fill="#16a34a" opacity="0.8" />
            <circle cx="-4" cy="8" r="3.8" fill="#15803d" opacity="0.8" />
            <circle cx="8" cy="6" r="3.2" fill="#22c55e" opacity="0.8" />
          </g>
        );

      default:
        return null;
    }
  };

  /**
   * Renders a single interactive campus building using its authentic GIS geometry
   */
  const renderBuildingEntity = (b) => {
    const isSelected = activeBuildingObj?.id === b.id;
    const isHovered = hoveredId === b.id;
    const geom = EXACT_BUILDING_POLYGONS[b.id] || {};
    const pin = geom.pin || { x: b.trace?.cx ?? 380, y: b.trace?.cy ?? 480 };
    const labelPos = LABEL_POSITIONS[b.id] || pin;
    const styles = getCategoryStyles(b.category, isSelected, isHovered);

    const wings = geom.wings || [];
    const courtyards = geom.courtyards || [];
    const entrances = geom.entrances || [];

    // Calculate if a subtle leader line (tether) is needed from building pin to label card
    const distToPin = Math.hypot(labelPos.x - pin.x, labelPos.y - pin.y);
    const showLeaderLine = distToPin > 18;

    return (
      <g
        key={b.id}
        data-bldg-id={b.id}
        onMouseEnter={() => setHoveredId(b.id)}
        onMouseLeave={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          setEditingBuildingId(b.id);
          if (onSelectBuilding) onSelectBuilding(b.name);
        }}
        onMouseDown={(e) => {
          if (isSuperAdmin && isEditMode) {
            e.stopPropagation();
            setDraggingId(b.id);
          }
        }}
        className={isSuperAdmin && isEditMode ? 'cursor-move' : 'cursor-pointer'}
      >
        {/* Selection / Hover Glow & Pulse Rings */}
        {(isSelected || isHovered) && (
          <circle
            cx={pin.x}
            cy={pin.y}
            r={isSelected ? '24' : '18'}
            fill="none"
            stroke={isSelected ? '#16a34a' : '#86efac'}
            strokeWidth={isSelected ? '2.2' : '1.4'}
            strokeDasharray={isSelected ? '4 3' : '2 2'}
            opacity="0.85"
            className="animate-pulse"
          />
        )}

        {/* 1. Building Plinth Drop Shadows (Authentic 2.5D architectural depth) */}
        {wings.map((w, idx) => (
          <polygon
            key={`shadow-${idx}`}
            points={w.points}
            fill="rgba(15, 23, 42, 0.07)"
            transform="translate(1.2, 1.8)"
            strokeLinejoin="round"
          />
        ))}

        {/* 2. Building Wing Polygons (Crisp White Roofs with Category Outlines) */}
        {wings.map((w, idx) => (
          <polygon
            key={`wing-${idx}`}
            points={w.points}
            fill={styles.fill}
            stroke={styles.stroke}
            strokeWidth={styles.strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* 3. Building Courtyards / Open Spaces (Palm Park, Football Ground, Amphitheatre) */}
        {courtyards.map((c, idx) => (
          <polygon
            key={`court-${idx}`}
            points={c.points}
            fill="#dcfce7"
            fillOpacity="0.75"
            stroke="#16a34a"
            strokeWidth="1.1"
            strokeDasharray="4 3"
            strokeLinejoin="round"
          />
        ))}

        {/* 4. Architectural Interior Details (Rotundas, courts, turfs) */}
        {renderBuildingAccents(b.id, pin)}

        {/* 5. Building Entrances (Delicate green gateway pins) */}
        {entrances.map((ent, idx) => (
          <g key={`ent-${idx}`} transform={`translate(${ent.x}, ${ent.y})`}>
            <circle r="2.8" fill="#16a34a" stroke="#ffffff" strokeWidth="0.9" />
            <circle r="1" fill="#ffffff" />
          </g>
        ))}

        {/* 6. Subtle Leader Line connecting offset label card to building center */}
        {showLabels && showLeaderLine && (
          <line
            x1={pin.x}
            y1={pin.y}
            x2={labelPos.x}
            y2={labelPos.y}
            stroke="#cbd5e1"
            strokeWidth="0.8"
            strokeDasharray="2 2"
            opacity="0.7"
          />
        )}

        {/* 7. Zero-Collision, High-Contrast Interactive Label Pill Card */}
        {(showLabels || isSelected || isHovered) && (
          <g transform={`translate(${labelPos.x}, ${labelPos.y})`}>
            {/* Card Background Container */}
            <rect
              x="-41"
              y="-8"
              width="82"
              height="16"
              rx="4.5"
              fill={isSelected ? '#15803d' : '#ffffff'}
              stroke={isSelected ? '#14532d' : isHovered ? '#16a34a' : '#cbd5e1'}
              strokeWidth={isSelected ? '1.4' : '0.9'}
              style={{ filter: 'drop-shadow(0 2px 4px rgba(15, 23, 42, 0.12))' }}
            />
            {/* Left Category Badge Chip */}
            <rect
              x="-38.5"
              y="-6"
              width="20"
              height="12"
              rx="3"
              fill={isSelected ? '#ffffff' : styles.badgeBg}
            />
            <text
              x="-28.5"
              y="2.5"
              textAnchor="middle"
              fill={isSelected ? '#15803d' : styles.badgeText}
              fontSize="5.2"
              fontWeight="800"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {b.badge || 'ZONE'}
            </text>
            {/* Building Name Title (Full, Crisp, Non-Truncated) */}
            <text
              x="8"
              y="2.5"
              textAnchor="middle"
              fill={isSelected ? '#ffffff' : '#0f172a'}
              fontSize="6.2"
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
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#f8fafc] flex justify-center shadow-sm">
      <svg
        ref={svgRef}
        viewBox={CAMPUS_VIEWBOX.viewBoxStr}
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
          {/* Subtle Modern Technical Grid */}
          <pattern id="campusArchitecturalGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(203, 213, 225, 0.45)" strokeWidth="0.6" />
          </pattern>
          {/* Campus Terrain Gradient */}
          <radialGradient id="campusTerrainGradLight" cx="48%" cy="48%" r="62%">
            <stop offset="0%" stopColor="#f0fdf4" />
            <stop offset="100%" stopColor="#ecfdf5" />
          </radialGradient>
        </defs>

        {/* 1. Base Canvas Ground */}
        <rect x="150" y="130" width="420" height="530" fill="#f8fafc" />
        <rect x="150" y="130" width="420" height="530" fill="url(#campusArchitecturalGrid)" />

        {/* Camera Pan & Zoom Container */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 2. Campus Garden Base Terrain (50-Acre Perimeter) */}
          <polygon
            points={IIITNR_CAMPUS_PERIMETER_POINTS}
            fill="url(#campusTerrainGradLight)"
            stroke="#86efac"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />

          {/* 3. Complete Internal Road Network (10 GIS Roads - Clean Asphalt Transit Loop) */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Outer curb layer */}
            {CAMPUS_ROAD_POLYLINES.map((r, i) => (
              <polyline key={`curb-${i}`} points={r.points} stroke="#cbd5e1" strokeWidth={r.width + 2.6} />
            ))}
            {/* Smooth pale roadway surface */}
            {CAMPUS_ROAD_POLYLINES.map((r, i) => (
              <polyline key={`road-${i}`} points={r.points} stroke="#e2e8f0" strokeWidth={r.width} />
            ))}
            {/* Center lane divider dashes */}
            {CAMPUS_ROAD_POLYLINES.map((r, i) => (
              <polyline
                key={`dash-${i}`}
                points={r.points}
                stroke="#ffffff"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.85"
              />
            ))}
          </g>

          {/* 4. Complete Pedestrian Footpaths (11 GIS Footpaths - Refined Stone Walkways) */}
          {showPathsAndCourts && (
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              {/* Stone paving base */}
              {CAMPUS_FOOTPATH_POLYLINES.map((fp, i) => (
                <polyline key={`fp-base-${i}`} points={fp.points} stroke="#e2e8f0" strokeWidth={fp.width + 1.8} />
              ))}
              {/* Paved path surface */}
              {CAMPUS_FOOTPATH_POLYLINES.map((fp, i) => (
                <polyline key={`fp-surface-${i}`} points={fp.points} stroke="#f8fafc" strokeWidth={fp.width} />
              ))}
              {/* Delicate guide dash */}
              {CAMPUS_FOOTPATH_POLYLINES.map((fp, i) => (
                <polyline
                  key={`fp-dash-${i}`}
                  points={fp.points}
                  stroke="#16a34a"
                  strokeWidth="0.85"
                  strokeDasharray="3 3"
                  opacity="0.75"
                />
              ))}
            </g>
          )}

          {/* 5. Landscape Canopy Trees */}
          {FOREST_CLUSTERS.map((tree, idx) => (
            <g key={`tree-${idx}`}>
              <circle cx={tree.x} cy={tree.y} r={tree.r} fill="#86efac" fillOpacity="0.4" stroke="#22c55e" strokeWidth="0.7" />
              <circle cx={tree.x - 1} cy={tree.y - 1} r={tree.r * 0.55} fill="#22c55e" fillOpacity="0.65" />
            </g>
          ))}
          {BOULEVARD_TREES.map((t, idx) => (
            <circle
              key={`bt-${idx}`}
              cx={t.x}
              cy={t.y}
              r="3.2"
              fill="#22c55e"
              stroke="#15803d"
              strokeWidth="0.8"
              fillOpacity="0.85"
            />
          ))}

          {/* 6. Campus Perimeter Boundary & Pillars */}
          {showBoundary && (
            <g>
              <polygon
                points={IIITNR_CAMPUS_PERIMETER_POINTS}
                fill="none"
                stroke={hoveredBoundary ? '#16a34a' : '#22c55e'}
                strokeWidth={hoveredBoundary ? '2.4' : '1.4'}
                strokeDasharray="6 5"
                strokeLinejoin="round"
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
                      r={isPillarHovered ? '7' : '4.5'}
                      fill="rgba(22, 163, 74, 0.3)"
                      className="animate-ping"
                    />
                    <polygon points="0,-5 4,0 0,5 -4,0" fill="#16a34a" stroke="#ffffff" strokeWidth="0.8" />
                  </g>
                );
              })}
            </g>
          )}

          {/* 7. North Compass Rose */}
          <g transform="translate(195, 185)">
            <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <polygon points="0,-10 -3.5,1.5 0,0 3.5,1.5" fill="#16a34a" />
            <polygon points="0,10 -2.5,-1 0,0 2.5,-1" fill="#94a3b8" />
            <text x="0" y="-12" textAnchor="middle" fill="#16a34a" fontSize="5.5" fontWeight="800">
              N
            </text>
          </g>

          {/* 8. Render All 16 Authentic Campus Buildings */}
          {buildings.map((b) => renderBuildingEntity(b))}

          {/* 9. Animated Radar Locator Wave on Search / Auto-Detect */}
          {radarTarget && (
            <g transform={`translate(${radarTarget.cx}, ${radarTarget.cy})`}>
              <circle
                cx="0"
                cy="0"
                r="32"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2.2"
                className="animate-ping"
                opacity="0.85"
              />
              <circle
                cx="0"
                cy="0"
                r="18"
                fill="none"
                stroke="#22c55e"
                strokeWidth="1.6"
                strokeDasharray="4 4"
              />
              <circle cx="0" cy="0" r="4.5" fill="#16a34a" stroke="#ffffff" strokeWidth="1.2" />
              {radarTarget.label && (
                <g transform="translate(0, -25)">
                  <rect
                    x="-55"
                    y="-10"
                    width="110"
                    height="17"
                    rx="4.5"
                    fill="#16a34a"
                    stroke="#ffffff"
                    strokeWidth="1"
                    style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))' }}
                  />
                  <text x="0" y="1.5" textAnchor="middle" fill="#ffffff" fontSize="6.8" fontWeight="800">
                    🎯 {radarTarget.label}
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
