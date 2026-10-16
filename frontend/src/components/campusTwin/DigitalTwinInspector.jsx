/**
 * frontend/src/components/campusTwin/DigitalTwinInspector.jsx
 *
 * Interactive Floor, Wing, Room & Lab Inspector Drawer + Super Admin Zone Editor
 * for the IIIT Naya Raipur Campus Digital Twin.
 */
import React from 'react';

export default function DigitalTwinInspector({
  activeBuildingObj,
  hoveredBuildingObj,
  selectedRoom,
  onSelectBuilding,
  onSelectRoom,
  availableFloors,
  inspectorFloor,
  setInspectorFloor,
  inspectorRooms,
  isSuperAdmin,
  isEditMode,
  editingBuilding,
  handleUpdateBuildingField,
  handleDeleteBuilding,
  onResetBuildings,
  onOpenJsonModal,
}) {
  return (
    <div className="space-y-3">
      {/* Active Zone Telemetry & Legend Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-950/95 border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-mono text-[10px] font-bold">
              {hoveredBuildingObj?.trace?.badge || hoveredBuildingObj?.mapPin?.badge || 'TWIN'}
            </span>
            <span className="font-black text-white text-sm">{hoveredBuildingObj?.name}</span>
            <span className="text-slate-500">·</span>
            <span className="text-[11px] text-[#A7AD89] font-medium">{hoveredBuildingObj?.type}</span>
            <span className="hidden md:inline-block text-[10px] font-mono text-slate-400">
              [{hoveredBuildingObj?.gps}]
            </span>
          </div>
          <p className="text-[11px] text-slate-400">{hoveredBuildingObj?.description}</p>
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
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-600 inline-block" /> Auditorium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" /> Canteen/Mess
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#8C906D] inline-block" /> FG/Sports/Amphi
            </span>
          </div>

          {selectedRoom && (
            <div className="px-3 py-1.5 rounded-xl bg-[#8C906D]/20 border border-[#8C906D]/40 text-[#DAD0C6] font-mono text-xs font-bold shrink-0">
              📍 {selectedRoom}
            </div>
          )}
        </div>
      </div>

      {/* Floor, Room & Lab Explorer Drawer */}
      {activeBuildingObj && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-white space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2.5">
              <span className="text-base">🏢</span>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white">
                  {activeBuildingObj.name} — Floor, Room & Lab Directory
                </h4>
                <p className="text-[11px] text-slate-400">
                  Select a floor or wing below, then click any room or laboratory to select it.
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
                      {fl.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>



          {/* Clickable Room / Laboratory Grid */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>
                Mapped Rooms & Labs on{' '}
                {inspectorFloor === 'G' ? 'Ground Floor (1xx / G)' : `Floor ${inspectorFloor}`} (
                {inspectorRooms.length} available)
              </span>
              <span className="text-[#A7AD89]">Click to Select</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
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
                        ? 'bg-[#8C906D]/20 border-[#A7AD89] text-[#DAD0C6] shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-sky-500/50 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="truncate" title={roomName}>
                      {roomName}
                    </span>
                    {isThisRoomSelected && (
                      <span className="text-[#A7AD89] font-bold shrink-0">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Zone Editor Drawer */}
      {isSuperAdmin && isEditMode && editingBuilding && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 text-white space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <span className="font-bold text-amber-300">
              Editing Digital Twin Zone: {editingBuilding.name}
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onOpenJsonModal}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer"
              >
                Export / Import JSON
              </button>
              <button
                type="button"
                onClick={onResetBuildings}
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
  );
}
