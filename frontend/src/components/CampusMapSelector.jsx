/**
 * frontend/src/components/CampusMapSelector.jsx
 * Modular Orchestrator for the IIIT Naya Raipur Interactive Campus Digital Twin.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  IIITNR_MAP_UPDATED_EVENT,
  getCampusBuildings,
  resetCampusBuildingsToDefault,
  getFloorsForBuilding,
  getRoomsForBuilding,
} from '../data/iiitnrCampusData';
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
  const [twinTheme, setTwinTheme] = useState('light');
  const [showLabels, setShowLabels] = useState(true);
  const [showPathsAndCourts, setShowPathsAndCourts] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Inspector floor state
  const [inspectorFloor, setInspectorFloor] = useState('G');

  const svgRef = useRef(null);

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

  const availableFloors = useMemo(() => {
    return getFloorsForBuilding(activeBuildingObj?.id, buildings);
  }, [activeBuildingObj, buildings]);

  const inspectorRooms = useMemo(() => {
    return getRoomsForBuilding(activeBuildingObj?.id, inspectorFloor, 'Wing A', buildings);
  }, [activeBuildingObj, inspectorFloor, buildings]);

  const hostelsList = buildings.filter((b) => b.category === 'HOSTEL');
  const otherBlocksList = buildings.filter((b) => b.category !== 'HOSTEL');

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* Top Header */}
      <div className="px-5 py-3.5 bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs sm:text-sm font-black tracking-tight text-white">
            IIIT Naya Raipur Interactive Digital Twin
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.4, Number((z + 0.25).toFixed(2))))}
              className="px-2 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="px-2 py-1 rounded-lg text-[10px] font-mono text-slate-400 hover:text-white cursor-pointer"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}
              className="px-2 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
            >
              −
            </button>
          </div>

          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setTwinTheme('light')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${twinTheme === 'light' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
            >
              🌿 Light
            </button>
            <button
              type="button"
              onClick={() => setTwinTheme('architectural')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${twinTheme === 'architectural' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              🌙 Dark
            </button>
          </div>
        </div>
      </div>

      {/* Quick Selection Pills */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 shrink-0">Zones:</span>
        {hostelsList.concat(otherBlocksList).map((h) => {
          const isSelected = activeBuildingObj?.id === h.id;
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                if (onSelectBuilding) onSelectBuilding(h.name);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
                isSelected ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-700 border-slate-200 hover:border-green-300'
              }`}
            >
              {h.shortName}
            </button>
          );
        })}
      </div>

      {/* Canvas & Inspector */}
      <div className="bg-slate-900 p-3 sm:p-4 space-y-3">
        <DigitalTwinCanvas
          svgRef={svgRef}
          buildings={buildings}
          activeBuildingObj={activeBuildingObj}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onSelectBuilding={onSelectBuilding}
          twinTheme={twinTheme}
          showLabels={showLabels}
          showPathsAndCourts={showPathsAndCourts}
          showBoundary={showBoundary}
          zoom={zoom}
          pan={pan}
        />

        <DigitalTwinInspector
          activeBuildingObj={activeBuildingObj}
          hoveredBuildingObj={activeBuildingObj}
          selectedRoom={selectedRoom}
          onSelectBuilding={onSelectBuilding}
          onSelectRoom={onSelectRoom}
          availableFloors={availableFloors}
          inspectorFloor={inspectorFloor}
          setInspectorFloor={setInspectorFloor}
          inspectorRooms={inspectorRooms}
          isSuperAdmin={isSuperAdmin}
          isEditMode={false}
          editingBuilding={activeBuildingObj}
          handleUpdateBuildingField={() => {}}
          handleDeleteBuilding={() => {}}
          onResetBuildings={() => setBuildings(resetCampusBuildingsToDefault())}
          onOpenJsonModal={() => {}}
        />
      </div>
    </div>
  );
}
