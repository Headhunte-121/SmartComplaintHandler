/**
 * frontend/src/components/campusTwin/DigitalTwinCanvas.jsx
 * Highly Interactive, Fluid GIS Digital Twin Renderer for IIIT Naya Raipur.
 * Supports smooth drag-to-pan, cursor-centered wheel zoom, double-click focus,
 * entrance inspection, and active plinth glow effects.
 */
import React, { useState } from 'react';
import {
  IIITNR_CAMPUS_PERIMETER_POINTS,
  INNER_CAMPUS_CLIP_POINTS,
  IIITNR_CAMPUS_BOUNDARY_CORNERS,
  LABEL_POSITIONS,
  EXACT_BUILDING_POLYGONS,
  CAMPUS_ROAD_POLYLINES,
  CAMPUS_FOOTPATH_POLYLINES,
} from '../../data/campusTwin/campusGeometry';

export default function DigitalTwinCanvas({
  svgRef,
  buildings = [],
  activeBuildingObj,
  hoveredId,
  setHoveredId = () => {},
  onSelectBuilding,
  setEditingBuildingId = () => {},
  setDraggingId = () => {},
  isSuperAdmin = false,
  isEditMode = false,
  twinTheme = 'light',
  showLabels = true,
  showPathsAndCourts = true,
  showBoundary = true,
  zoom = 1,
  pan = { x: 0, y: 0 },
  isPanning = false,
  radarTarget,
  handleSvgClick = () => {},
  handleMouseDown = () => {},
  handleMouseMove = () => {},
  handleMouseUp = () => {},
  handleWheel = () => {},
  handleDoubleClick = () => {},
  handleTouchStart = () => {},
  handleTouchMove = () => {},
  handleTouchEnd = () => {},
}) {
  const [hoveredEntrance, setHoveredEntrance] = useState(null);
  const isLight = twinTheme === 'light';
  const isBlueprint = twinTheme === 'blueprint';

  const renderBuildingGeometry = (b) => {
    const isSelected = activeBuildingObj?.id === b.id;
    const isHovered = hoveredId === b.id;
    const P = EXACT_BUILDING_POLYGONS[b.id];
    const cx = b.trace?.cx ?? P?.cx ?? 606;
    const cy = b.trace?.cy ?? P?.cy ?? 524;
    const w = b.trace?.w || P?.w || 54;
    const h = b.trace?.h || P?.h || 46;
    const baseColor = b.trace?.color || b.mapPin?.color || P?.color || '#0284c7';

    const fillOpacity = isBlueprint ? 0.35 : isSelected ? 1 : 0.94;
    const strokeColor = isSelected ? '#16a34a' : isHovered ? (isLight ? '#0f172a' : '#38bdf8') : '#ffffff';
    const strokeWidth = isSelected ? 3.2 : isHovered ? 2.4 : 1.7;

    const wings = P?.wings || [];
    const courtyards = P?.courtyards || [];
    const entrances = b.entrances || P?.entrances || [];

    const filterUrl = isSelected ? 'url(#activeGlow)' : isHovered ? 'url(#hoverGlow)' : undefined;

    return (
      <g
        key={`geom-${b.id}`}
        data-bldg-id={b.id}
        filter={filterUrl}
        onMouseEnter={() => setHoveredId(b.id)}
        onMouseLeave={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          setEditingBuildingId(b.id);
          if (onSelectBuilding) onSelectBuilding(b.name, b.id);
        }}
        className="cursor-pointer transition-all duration-150"
      >
        {courtyards.map((cyard, idx) => (
          <polygon
            key={`cyard-${idx}`}
            points={cyard.points}
            fill={baseColor}
            fillOpacity={0.85}
            stroke="#ffffff"
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        ))}

        {wings.map((wing, idx) => (
          <g key={`wing-${idx}`}>
            <polygon
              points={wing.points}
              transform="translate(3.5, 4.5)"
              fill={isLight ? 'rgba(15, 23, 42, 0.22)' : 'rgba(0, 0, 0, 0.5)'}
            />
            <polygon
              points={wing.points}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          </g>
        ))}

        {wings.length === 0 && courtyards.length === 0 && (
          <g transform={`translate(${cx}, ${cy})`}>
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
          </g>
        )}

        {showPathsAndCourts &&
          entrances.map((ent, idx) => {
            const isEntHovered = hoveredEntrance?.name === ent.name && hoveredEntrance?.bId === b.id;
            return (
              <circle
                key={`ent-${idx}`}
                cx={ent.x}
                cy={ent.y}
                r={isEntHovered ? 7.5 : 4.5}
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="1.6"
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  setHoveredEntrance({ ...ent, bId: b.id });
                }}
                onMouseLeave={(e) => {
                  e.stopPropagation();
                  setHoveredEntrance(null);
                }}
              />
            );
          })}
      </g>
    );
  };

  const renderBuildingLabel = (b) => {
    const isSelected = activeBuildingObj?.id === b.id;
    const isHovered = hoveredId === b.id;
    if (!showLabels && !isSelected && !isHovered) return null;

    const P = EXACT_BUILDING_POLYGONS[b.id];
    const cx = b.trace?.cx ?? P?.cx ?? 606;
    const cy = b.trace?.cy ?? P?.cy ?? 524;
    const baseColor = b.trace?.color || b.mapPin?.color || P?.color || '#0284c7';
    const labelPos = LABEL_POSITIONS[b.id] || { x: cx, y: cy - 32 };

    const badgeText = b.trace?.badge || b.mapPin?.badge || P?.badge || 'ZONE';
    const shortText = b.shortName || b.name || 'Building';

    const badgeWidth = Math.max(24, badgeText.length * 6.4 + 10);
    const textWidth = shortText.length * 6.5;
    const pillWidth = Math.max(108, Math.round(badgeWidth + textWidth + 22));
    const pillHeight = 22;

    const pillBg = isSelected
      ? '#16a34a'
      : isLight
      ? 'rgba(255, 255, 255, 0.97)'
      : 'rgba(15, 23, 42, 0.95)';
    const pillTextFill = isSelected ? '#ffffff' : isLight ? '#0f172a' : '#f8fafc';

    return (
      <g
        key={`lbl-${b.id}`}
        data-bldg-id={b.id}
        onMouseEnter={() => setHoveredId(b.id)}
        onMouseLeave={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          setEditingBuildingId(b.id);
          if (onSelectBuilding) onSelectBuilding(b.name, b.id);
        }}
        className="cursor-pointer transition-transform duration-150"
      >
        <line
          x1={cx}
          y1={cy}
          x2={labelPos.x}
          y2={labelPos.y}
          stroke={isSelected ? '#16a34a' : baseColor}
          strokeWidth={isSelected ? '2.2' : '1.5'}
          strokeDasharray={isSelected ? 'none' : '3 2'}
          opacity="0.85"
          pointerEvents="none"
        />
        <g transform={`translate(${labelPos.x}, ${labelPos.y})`}>
          <rect
            x={-pillWidth / 2}
            y={-pillHeight / 2}
            width={pillWidth}
            height={pillHeight}
            rx="6.5"
            fill={pillBg}
            stroke={isSelected ? '#15803d' : baseColor}
            strokeWidth={isSelected ? '2' : '1.3'}
            filter={isSelected ? 'url(#activeGlow)' : undefined}
          />
          <rect
            x={-pillWidth / 2 + 3.5}
            y={-pillHeight / 2 + 3.5}
            width={badgeWidth}
            height={pillHeight - 7}
            rx="4"
            fill={isSelected ? '#14532d' : baseColor}
          />
          <text
            x={-pillWidth / 2 + 3.5 + badgeWidth / 2}
            y="3.5"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="8.5"
            fontWeight="800"
          >
            {badgeText}
          </text>
          <text
            x={-pillWidth / 2 + badgeWidth + 9}
            y="3.5"
            textAnchor="start"
            fill={pillTextFill}
            fontSize="9.8"
            fontWeight="800"
          >
            {shortText}
          </text>
        </g>
      </g>
    );
  };

  const sortedBuildings = [...buildings].sort((a, b) => {
    const aPri = activeBuildingObj?.id === a.id ? 2 : hoveredId === a.id ? 1 : 0;
    const bPri = activeBuildingObj?.id === b.id ? 2 : hoveredId === b.id ? 1 : 0;
    return aPri - bPri;
  });

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border flex justify-center ${
        isLight ? 'border-slate-200 bg-[#f4f7f4]' : 'border-slate-800 bg-[#080f1d]'
      }`}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1080 800"
        onClick={handleSvgClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`w-full max-h-[660px] select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <defs>
          <clipPath id="iiitnrCampusClip">
            <polygon points={INNER_CAMPUS_CLIP_POINTS} />
          </clipPath>

          <filter id="activeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#16a34a" floodOpacity="0.45" />
          </filter>

          <filter id="hoverGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.35" />
          </filter>
        </defs>

        <rect x="0" y="0" width="1080" height="800" fill={isLight ? '#f4f7f4' : '#080f1d'} />

        <g
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          style={{
            transition: isPanning ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            transformOrigin: '0 0',
          }}
        >
          <g clipPath="url(#iiitnrCampusClip)">
            <polygon points={INNER_CAMPUS_CLIP_POINTS} fill={isLight ? '#e4f0e7' : '#0f1c30'} />

            {/* Roads */}
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              {CAMPUS_ROAD_POLYLINES.map((r, i) => (
                <polyline
                  key={`asphalt-${i}`}
                  points={r.points}
                  stroke={isLight ? '#94a3b8' : '#334155'}
                  strokeWidth={r.width}
                />
              ))}
            </g>

            {/* Footpaths */}
            {showPathsAndCourts && (
              <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                {CAMPUS_FOOTPATH_POLYLINES.map((p, idx) => (
                  <polyline
                    key={`fp-${idx}`}
                    points={p.points}
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                ))}
              </g>
            )}
          </g>

          {/* Highway */}
          <polyline
            points="165,622 562,762 795,844"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2.4"
            pointerEvents="none"
          />

          {/* Boundary */}
          {showBoundary && (
            <polygon
              points={IIITNR_CAMPUS_PERIMETER_POINTS}
              fill="none"
              stroke={isLight ? '#16a34a' : '#38bdf8'}
              strokeWidth="2"
              strokeDasharray="8 5"
            />
          )}

          {/* Buildings */}
          {buildings.map((b) => renderBuildingGeometry(b))}
          {sortedBuildings.map((b) => renderBuildingLabel(b))}

          {/* Entrance Tooltip */}
          {hoveredEntrance && (
            <g transform={`translate(${hoveredEntrance.x}, ${hoveredEntrance.y - 12})`} pointerEvents="none">
              <rect
                x="-65"
                y="-18"
                width="130"
                height="20"
                rx="6"
                fill="rgba(15, 23, 42, 0.95)"
                stroke="#10b981"
                strokeWidth="1.2"
              />
              <text x="0" y="-4.5" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                🚪 {hoveredEntrance.name}
              </text>
            </g>
          )}

          {/* Radar Target Focus Ring */}
          {radarTarget && (
            <g transform={`translate(${radarTarget.cx}, ${radarTarget.cy})`} pointerEvents="none">
              <circle cx="0" cy="0" r="38" fill="none" stroke="#16a34a" strokeWidth="2.5" className="animate-ping" />
              <circle cx="0" cy="0" r="6" fill="#16a34a" stroke="#ffffff" strokeWidth="2" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}