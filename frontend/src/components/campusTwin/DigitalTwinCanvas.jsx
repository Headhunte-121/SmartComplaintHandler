/**
 * frontend/src/components/campusTwin/DigitalTwinCanvas.jsx
 * Highly Interactive, Fluid GIS Digital Twin Renderer for IIIT Naya Raipur.
 * Supports smooth drag-to-pan, cursor-centered wheel zoom, double-click focus,
 * entrance inspection, and active plinth glow effects.
 */
import React, { useState, useEffect } from 'react';
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
  twinTheme = 'architectural',
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
  handleKeyDown = () => {},
}) {
  const [hoveredEntrance, setHoveredEntrance] = useState(null);
  const isLight = false;
  const isBlueprint = twinTheme === 'blueprint';

  // Attach non-passive wheel event listener strictly to the SVG canvas.
  // When cursor is over the selection tab or UI overlays, wheel events are never intercepted,
  // allowing free scrolling of the selection card and webpage.
  useEffect(() => {
    const svgEl = svgRef?.current;
    if (!svgEl) return;

    const onWheelNative = (e) => {
      // Only intercept if the event target is directly inside the SVG canvas
      const isTargetOnSvg = e.target && (e.target === svgEl || svgEl.contains(e.target));
      if (!isTargetOnSvg) {
        return;
      }

      // Zoom the map and prevent browser window scroll while cursor is over the campus canvas
      e.preventDefault();
      e.stopPropagation();
      if (handleWheel) {
        handleWheel(e);
      }
    };

    svgEl.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      svgEl.removeEventListener('wheel', onWheelNative);
    };
  }, [svgRef, handleWheel]);

  const renderBuildingGeometry = (b) => {
    const isSelected = activeBuildingObj?.id === b.id;
    const isHovered = hoveredId === b.id;
    const P = EXACT_BUILDING_POLYGONS[b.id];
    const cx = b.trace?.cx ?? P?.cx ?? 606;
    const cy = b.trace?.cy ?? P?.cy ?? 524;
    const w = b.trace?.w || P?.w || 54;
    const h = b.trace?.h || P?.h || 46;
    const baseColor = b.color || b.trace?.color || b.mapPin?.color || P?.color || '#0284c7';

    const fillOpacity = isBlueprint ? 0.35 : isSelected ? 0.98 : isLight ? 0.92 : 0.88;
    const strokeColor = isSelected
      ? '#22c55e'
      : isHovered
      ? (isLight ? '#334155' : '#94a3b8')
      : (isLight ? '#cbd5e1' : '#27272a');
    const strokeWidth = isSelected ? 2.8 : isHovered ? 2.2 : 1.4;

    const wings = P?.wings || [];
    const courtyards = P?.courtyards || [];
    const entrances = b.entrances || P?.entrances || [];

    const filterUrl = isSelected ? 'url(#activeShadow)' : isHovered ? 'url(#hoverShadow)' : undefined;

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
            stroke={isLight ? '#cbd5e1' : '#27272a'}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        ))}

        {wings.map((wing, idx) => (
          <g key={`wing-${idx}`}>
            <polygon
              points={wing.points}
              transform="translate(2.5, 3.5)"
              fill={isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(0, 0, 0, 0.45)'}
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
                stroke={isLight ? '#ffffff' : '#161b22'}
                strokeWidth="1.5"
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
    const baseColor = b.color || b.trace?.color || b.mapPin?.color || P?.color || '#0284c7';
    const labelPos = LABEL_POSITIONS[b.id] || { x: cx, y: cy - 32 };

    const badgeText = b.trace?.badge || b.mapPin?.badge || P?.badge || 'ZONE';
    const shortText = b.shortName || b.name || 'Building';

    const badgeWidth = Math.max(24, badgeText.length * 6.4 + 10);
    const textWidth = shortText.length * 6.5;
    const pillWidth = Math.max(108, Math.round(badgeWidth + textWidth + 22));
    const pillHeight = 22;

    const pillBg = isSelected
      ? '#15803d'
      : isLight
      ? 'rgba(255, 255, 255, 0.98)'
      : 'rgba(22, 27, 34, 0.96)';
    const pillTextFill = isSelected ? '#ffffff' : isLight ? '#0f172a' : '#f4f4f5';
    const pillBorderColor = isSelected
      ? '#166534'
      : isLight
      ? '#cbd5e1'
      : '#27272a';

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
          stroke={isSelected ? '#22c55e' : isLight ? '#94a3b8' : '#3f4b5c'}
          strokeWidth={isSelected ? '2' : '1.2'}
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
            stroke={pillBorderColor}
            strokeWidth={isSelected ? '1.8' : '1.2'}
            filter={isSelected ? 'url(#activeShadow)' : undefined}
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
      style={{ backgroundColor: '#0e1117' }}
      className="relative w-full overflow-hidden flex justify-center bg-[#0e1117] border-zinc-800"
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1080 800"
        style={{ backgroundColor: '#0e1117' }}
        onClick={handleSvgClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className={`w-full max-h-[660px] select-none outline-none touch-none overscroll-contain focus:ring-1 focus:ring-emerald-500/30 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <defs>
          <clipPath id="iiitnrCampusClip">
            <polygon points={INNER_CAMPUS_CLIP_POINTS} />
          </clipPath>

          <filter id="activeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity={isLight ? "0.2" : "0.5"} />
          </filter>

          <filter id="hoverShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity={isLight ? "0.15" : "0.4"} />
          </filter>
        </defs>

        <rect x="0" y="0" width="1080" height="800" fill="#0e1117" />

        <g
          transform={`translate(${pan.x.toFixed(2)}, ${pan.y.toFixed(2)}) scale(${zoom.toFixed(4)})`}
          style={{
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          <g clipPath="url(#iiitnrCampusClip)">
            <polygon points={INNER_CAMPUS_CLIP_POINTS} fill={isLight ? '#e4f0e7' : '#161b22'} />

            {/* Roads */}
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              {CAMPUS_ROAD_POLYLINES.map((r, i) => (
                <polyline
                  key={`asphalt-${i}`}
                  points={r.points}
                  stroke={isLight ? '#94a3b8' : '#272e3b'}
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
                    stroke={isLight ? '#94a3b8' : '#3f4b5c'}
                    strokeWidth="1.8"
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
            stroke={isLight ? '#15803d' : '#2e7d32'}
            strokeWidth="2.4"
            pointerEvents="none"
          />

          {/* Boundary */}
          {showBoundary && (
            <polygon
              points={IIITNR_CAMPUS_PERIMETER_POINTS}
              fill="none"
              stroke={isLight ? '#15803d' : '#475569'}
              strokeWidth="1.8"
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
                fill={isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(22, 27, 34, 0.98)'}
                stroke={isLight ? '#cbd5e1' : '#27272a'}
                strokeWidth="1.2"
              />
              <text x="0" y="-4.5" textAnchor="middle" fill={isLight ? '#0f172a' : '#f4f4f5'} fontSize="9" fontWeight="bold">
                Entrance: {hoveredEntrance.name}
              </text>
            </g>
          )}

          {/* Radar Target Focus Ring */}
          {radarTarget && (
            <g transform={`translate(${radarTarget.cx}, ${radarTarget.cy})`} pointerEvents="none">
              <circle cx="0" cy="0" r="32" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 4" className="animate-spin" />
              <circle cx="0" cy="0" r="5" fill="#22c55e" stroke={isLight ? '#ffffff' : '#0e1117'} strokeWidth="1.5" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}