/**
 * frontend/src/components/campusTwin/DigitalTwinCanvas.jsx
 *
 * Clean Vectorized SVG Map Renderer for IIIT Naya Raipur.
 * 100% grounded in authentic GIS GeoJSON data:
 * - 16 Campus Buildings with exact satellite wing polygons, courtyards, and entrances.
 * - 10 Campus Road Polylines forming the internal transit loop and avenues.
 * - 11 Pedestrian Walkway Polylines connecting all entrances, hostels, and plazas.
 * - Styled in the Primary White & Secondary Light Green design system.
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

  // Category Color Accent Mapping (Light Green Secondary Design System)
  const getCategoryStyles = (category, isSelected, isHovered) => {
    if (isSelected) {
      return {
        fill: '#dcfce7', // light green tint
        stroke: '#16a34a', // strong green
        strokeWidth: 2.4,
        badgeBg: '#16a34a',
        badgeText: '#ffffff',
      };
    }
    if (isHovered) {
      return {
        fill: '#f0fdf4', // soft mint
        stroke: '#22c55e', // bright green
        strokeWidth: 1.8,
        badgeBg: '#22c55e',
        badgeText: '#ffffff',
      };
    }

    switch (category) {
      case 'ACADEMIC':
        return {
          fill: '#ffffff',
          stroke: '#16a34a',
          strokeWidth: 1.4,
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
   * Renders a single interactive campus building using its authentic GIS polygons, courtyards, and entrances
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
        {/* Selection / Hover Glow & Pulse */}
        {(isSelected || isHovered) && (
          <circle
            cx={pin.x}
            cy={pin.y}
            r={isSelected ? '28' : '22'}
            fill="none"
            stroke={isSelected ? '#16a34a' : '#86efac'}
            strokeWidth={isSelected ? '2.5' : '1.5'}
            strokeDasharray={isSelected ? '4 3' : '2 2'}
            opacity="0.85"
            className="animate-pulse"
          />
        )}

        {/* 1. Building Wing Polygons */}
        {wings.length > 0 &&
          wings.map((w, idx) => (
            <polygon
              key={`wing-${idx}`}
              points={w.points}
              fill={styles.fill}
              stroke={styles.stroke}
              strokeWidth={styles.strokeWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ filter: isSelected ? 'drop-shadow(0 2px 6px rgba(22,163,74,0.35))' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.08))' }}
            />
          ))}

        {/* 2. Building Courtyards / Open Spaces (e.g. Palm Park, Football Ground, Amphitheatre Bowl) */}
        {courtyards.length > 0 &&
          courtyards.map((c, idx) => (
            <polygon
              key={`court-${idx}`}
              points={c.points}
              fill="#bbf7d0"
              fillOpacity="0.75"
              stroke="#16a34a"
              strokeWidth="1.2"
              strokeDasharray="4 3"
              strokeLinejoin="round"
            />
          ))}

        {/* 3. Fallback for entities with no polygon defined (e.g., Volleyball Court) */}
        {wings.length === 0 && courtyards.length === 0 && (
          <g transform={`translate(${pin.x}, ${pin.y})`}>
            <rect
              x="-15"
              y="-10"
              width="30"
              height="20"
              rx="3"
              fill={styles.fill}
              stroke={styles.stroke}
              strokeWidth={styles.strokeWidth}
            />
            {/* Court net line */}
            <line x1="0" y1="-10" x2="0" y2="10" stroke="#16a34a" strokeWidth="0.8" strokeDasharray="2 2" />
          </g>
        )}

        {/* 4. Interactive Building Entrances */}
        {entrances.map((ent, idx) => (
          <g key={`ent-${idx}`} transform={`translate(${ent.x}, ${ent.y})`}>
            <circle r="3.4" fill="#16a34a" stroke="#ffffff" strokeWidth="1" />
            <circle r="1.3" fill="#ffffff" />
            {isHovered && (
              <text
                x="0"
                y="-6"
                textAnchor="middle"
                fill="#15803d"
                fontSize="5"
                fontWeight="700"
                fontFamily="Inter, system-ui, sans-serif"
              >
                {ent.name}
              </text>
            )}
          </g>
        ))}

        {/* 5. Clean, Non-Overlapping Interactive Label Pill */}
        {(showLabels || isSelected || isHovered) && (
          <g transform={`translate(${labelPos.x}, ${labelPos.y})`}>
            <rect
              x="-36"
              y="-7"
              width="72"
              height="14"
              rx="4"
              fill={isSelected ? '#15803d' : '#ffffff'}
              stroke={isSelected ? '#14532d' : isHovered ? '#16a34a' : '#cbd5e1'}
              strokeWidth={isSelected ? '1.4' : '0.9'}
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }}
            />
            {/* Badge Indicator */}
            <rect
              x="-34"
              y="-5.5"
              width="15"
              height="11"
              rx="2.5"
              fill={isSelected ? '#ffffff' : styles.badgeBg}
            />
            <text
              x="-26.5"
              y="2.5"
              textAnchor="middle"
              fill={isSelected ? '#15803d' : styles.badgeText}
              fontSize="5.2"
              fontWeight="800"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {b.badge || 'ZONE'}
            </text>
            {/* Title Text */}
            <text
              x="5"
              y="2.5"
              textAnchor="middle"
              fill={isSelected ? '#ffffff' : '#0f172a'}
              fontSize="6"
              fontWeight="700"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {(b.shortName || b.name).length > 13 ? (b.shortName || b.name).slice(0, 12) + '…' : (b.shortName || b.name)}
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
          {/* Subtle Modern Architectural Grid */}
          <pattern id="campusArchitecturalGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(203, 213, 225, 0.45)" strokeWidth="0.6" />
          </pattern>
          {/* Campus Terrain Gradient */}
          <radialGradient id="campusTerrainGradLight" cx="45%" cy="48%" r="60%">
            <stop offset="0%" stopColor="#f0fdf4" />
            <stop offset="100%" stopColor="#ecfdf5" />
          </radialGradient>
        </defs>

        {/* 1. Light Paper Canvas Background */}
        <rect x="-55" y="0" width="840" height="857" fill="#f8fafc" />
        <rect x="-55" y="0" width="840" height="857" fill="url(#campusArchitecturalGrid)" />

        {/* Camera Pan & Zoom Container */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 2. Southern Border Highway: Naya Raipur Marg */}
          <g>
            <polyline
              points="-45,628 338,762 560,842"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="24"
              strokeLinecap="round"
            />
            <polyline
              points="-45,628 338,762 560,842"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="22"
              strokeLinecap="round"
            />
            <polyline
              points="-45,628 338,762 560,842"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
            />
            <polyline
              points="-45,623 338,757 560,837"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              strokeDasharray="6 6"
            />
            <polyline
              points="-45,633 338,767 560,847"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              strokeDasharray="6 6"
            />
            <text
              x="215"
              y="724"
              transform="rotate(19.5, 215, 724)"
              textAnchor="middle"
              fill="#64748b"
              fontSize="8.5"
              fontWeight="700"
              letterSpacing="1.2"
            >
              NAYA RAIPUR MARG (MAIN AVENUE)
            </text>
          </g>

          {/* 3. Authentic Campus Terrain Base (50-Acre Perimeter) */}
          <polygon
            points={IIITNR_CAMPUS_PERIMETER_POINTS}
            fill="url(#campusTerrainGradLight)"
            stroke="#86efac"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* 4. Complete Campus Internal Road Network (10 GIS Roads) */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Outer curb layer */}
            {CAMPUS_ROAD_POLYLINES.map((r, i) => (
              <polyline key={`curb-${i}`} points={r.points} stroke="#cbd5e1" strokeWidth={r.width + 3.2} />
            ))}
            {/* Asphalt driving surface */}
            {CAMPUS_ROAD_POLYLINES.map((r, i) => (
              <polyline key={`road-${i}`} points={r.points} stroke="#f1f5f9" strokeWidth={r.width} />
            ))}
            {/* Center dashed white lane divider */}
            {CAMPUS_ROAD_POLYLINES.map((r, i) => (
              <polyline
                key={`dash-${i}`}
                points={r.points}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="5 5"
                opacity="0.8"
              />
            ))}
          </g>

          {/* 5. Complete Pedestrian Footpaths (11 GIS Footpaths) */}
          {showPathsAndCourts && (
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              {CAMPUS_FOOTPATH_POLYLINES.map((fp, i) => (
                <polyline key={`fp-base-${i}`} points={fp.points} stroke="#bbf7d0" strokeWidth={fp.width + 2} />
              ))}
              {CAMPUS_FOOTPATH_POLYLINES.map((fp, i) => (
                <polyline
                  key={`fp-line-${i}`}
                  points={fp.points}
                  stroke="#16a34a"
                  strokeWidth={fp.width}
                  strokeDasharray="4 3"
                />
              ))}
            </g>
          )}

          {/* 6. Canopy Green Trees & Boulevard Landscaping */}
          {FOREST_CLUSTERS.map((tree, idx) => (
            <g key={`tree-${idx}`}>
              <circle cx={tree.x} cy={tree.y} r={tree.r} fill="#86efac" fillOpacity="0.45" stroke="#22c55e" strokeWidth="0.8" />
              <circle cx={tree.x - 1} cy={tree.y - 1} r={tree.r * 0.55} fill="#22c55e" fillOpacity="0.65" />
            </g>
          ))}
          {BOULEVARD_TREES.map((t, idx) => (
            <circle
              key={`bt-${idx}`}
              cx={t.x}
              cy={t.y}
              r="3.5"
              fill="#22c55e"
              stroke="#15803d"
              strokeWidth="0.8"
              fillOpacity="0.85"
            />
          ))}

          {/* 7. Boundary Pillars (50-Acre Perimeter Corners) */}
          {showBoundary && (
            <g>
              <polygon
                points={IIITNR_CAMPUS_PERIMETER_POINTS}
                fill="none"
                stroke={hoveredBoundary ? '#16a34a' : '#22c55e'}
                strokeWidth={hoveredBoundary ? '2.8' : '1.6'}
                strokeDasharray="8 6"
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
                      r={isPillarHovered ? '8' : '5'}
                      fill="rgba(22, 163, 74, 0.3)"
                      className="animate-ping"
                    />
                    <polygon points="0,-6 5,0 0,6 -5,0" fill="#16a34a" stroke="#ffffff" strokeWidth="1" />
                    {isPillarHovered && (
                      <g transform="translate(0, -14)">
                        <rect
                          x="-65"
                          y="-20"
                          width="130"
                          height="20"
                          rx="4"
                          fill="#ffffff"
                          stroke="#16a34a"
                          strokeWidth="1"
                          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                        />
                        <text x="0" y="-10" textAnchor="middle" fill="#0f172a" fontSize="7" fontWeight="700">
                          {pillar.label}
                        </text>
                        <text x="0" y="-3" textAnchor="middle" fill="#16a34a" fontSize="6">
                          ({pillar.x}, {pillar.y}) · Campus Boundary
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* 8. North Compass Rose */}
          <g transform="translate(245, 195)">
            <circle cx="0" cy="0" r="16" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
            <polygon points="0,-12 -4,2 0,0 4,2" fill="#16a34a" />
            <polygon points="0,12 -3,-1 0,0 3,-1" fill="#94a3b8" />
            <text x="0" y="-14" textAnchor="middle" fill="#16a34a" fontSize="6.5" fontWeight="800">
              N
            </text>
          </g>

          {/* 9. Render All 16 Authentic Campus Buildings */}
          {buildings.map((b) => renderBuildingEntity(b))}

          {/* 10. Animated Radar Locator Wave on Search / Auto-Detect */}
          {radarTarget && (
            <g transform={`translate(${radarTarget.cx}, ${radarTarget.cy})`}>
              <circle
                cx="0"
                cy="0"
                r="36"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2.5"
                className="animate-ping"
                opacity="0.85"
              />
              <circle
                cx="0"
                cy="0"
                r="20"
                fill="none"
                stroke="#22c55e"
                strokeWidth="1.8"
                strokeDasharray="4 4"
              />
              <circle cx="0" cy="0" r="5" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />
              {radarTarget.label && (
                <g transform="translate(0, -28)">
                  <rect
                    x="-60"
                    y="-11"
                    width="120"
                    height="18"
                    rx="5"
                    fill="#16a34a"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))' }}
                  />
                  <text x="0" y="1" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="800">
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
