/**
 * frontend/src/data/iiitnrCampusData.js
 *
 * Clean Facade Module for the IIIT Naya Raipur Interactive Campus Digital Twin.
 * Re-exports the modularized geometry, authentic building/lab/room directory, and
 * smart auto-detection search engine so all existing components work seamlessly.
 */

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
} from './campusTwin/campusGeometry';

import {
  IIITNR_CAMPUS_METADATA,
  HOSTEL_FLOORS,
  HOSTEL_WINGS,
  HOSTEL_COMMON_ZONES,
  DEFAULT_IIITNR_BUILDINGS,
} from './campusTwin/campusLabsAndRooms';

import {
  SUB_LOCATION_PIN_OVERRIDES,
  buildCampusSearchIndex,
  queryCampusSearchIndex,
  autoDetectCampusLocation,
} from './campusTwin/campusSearchEngine';

export const IIITNR_CAMPUS_STORAGE_KEY = 'iiitnr_campus_gis_master_v1';
export const IIITNR_MAP_UPDATED_EVENT = 'iiitnr-campus-map-updated';

export {
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
  IIITNR_CAMPUS_METADATA,
  HOSTEL_FLOORS,
  HOSTEL_WINGS,
  HOSTEL_COMMON_ZONES,
  DEFAULT_IIITNR_BUILDINGS,
  SUB_LOCATION_PIN_OVERRIDES,
  buildCampusSearchIndex,
  queryCampusSearchIndex,
  autoDetectCampusLocation,
};

export const IIITNR_BUILDINGS = DEFAULT_IIITNR_BUILDINGS;
export const ALL_IIITNR_BUILDINGS = DEFAULT_IIITNR_BUILDINGS;
export const IIITNR_HOSTELS = DEFAULT_IIITNR_BUILDINGS.filter((b) => b.category === 'HOSTEL');
export const IIITNR_ACADEMIC_BLOCKS = DEFAULT_IIITNR_BUILDINGS.filter((b) => b.category !== 'HOSTEL');

/**
 * Loads the campus building list from localStorage if customized, otherwise returns the default Digital Twin dataset.
 */
export function getCampusBuildings() {
  if (typeof window === 'undefined') return DEFAULT_IIITNR_BUILDINGS;
  try {
    const raw = window.localStorage.getItem(IIITNR_CAMPUS_STORAGE_KEY);
    if (!raw) return DEFAULT_IIITNR_BUILDINGS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to parse custom campus map from localStorage:', err);
  }
  return DEFAULT_IIITNR_BUILDINGS;
}

/**
 * Persists custom-labeled or repositioned buildings to localStorage and notifies mounted map components.
 */
export function saveCustomCampusBuildings(buildings) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(IIITNR_CAMPUS_STORAGE_KEY, JSON.stringify(buildings));
    window.dispatchEvent(new CustomEvent(IIITNR_MAP_UPDATED_EVENT, { detail: buildings }));
  } catch (err) {
    console.warn('Failed to save custom campus map:', err);
  }
}

/**
 * Resets the campus map back to the default satellite-traced Digital Twin layout.
 */
export function resetCampusBuildingsToDefault() {
  if (typeof window === 'undefined') return DEFAULT_IIITNR_BUILDINGS;
  try {
    window.localStorage.removeItem(IIITNR_CAMPUS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(IIITNR_MAP_UPDATED_EVENT, { detail: DEFAULT_IIITNR_BUILDINGS }));
  } catch (err) {
    console.warn('Failed to reset campus map:', err);
  }
  return DEFAULT_IIITNR_BUILDINGS;
}

export function getHostelBuildings(buildings = null) {
  const list = buildings || getCampusBuildings();
  return list.filter((b) => b.category === 'HOSTEL');
}

export function getNonHostelBuildings(buildings = null) {
  const list = buildings || getCampusBuildings();
  return list.filter((b) => b.category !== 'HOSTEL');
}

function generateHostelRoomsForFloor(floorCode, maxRoom = 24, prefix = 'Room ') {
  const rooms = [];
  for (let i = 1; i <= maxRoom; i += 1) {
    const padded = String(i).padStart(2, '0');
    if (floorCode === 'G') {
      rooms.push(`${prefix}G-${padded}`);
    } else {
      rooms.push(`${prefix}${floorCode}${padded}`);
    }
  }
  return rooms;
}

export function getFloorsForBuilding(buildingNameOrId, customBuildingsList = null) {
  const list = customBuildingsList || getCampusBuildings();
  const target = list.find(
    (b) => b.id === buildingNameOrId || b.name === buildingNameOrId || b.shortName === buildingNameOrId
  );

  if (!target) return HOSTEL_FLOORS;

  if (Array.isArray(target.floors) && target.floors.length > 0) {
    if (typeof target.floors[0] === 'string') {
      return target.floors.map((fl) => ({
        id: fl,
        label: fl === 'G' ? 'Ground Floor (G)' : `Floor ${fl} (${fl}xx)`,
      }));
    }
    return target.floors.map((f) => ({ id: f.id, label: f.label }));
  }

  return HOSTEL_FLOORS;
}

export function getWingsForBuilding() {
  // IIIT Naya Raipur campus architecture does not use wings - returning empty array for compatibility
  return [];
}

export function getRoomsForBuilding(buildingNameOrId, floorId = '1', _legacyWingId = null, customBuildingsList = null) {
  const list = customBuildingsList || getCampusBuildings();
  const target = list.find(
    (b) => b.id === buildingNameOrId || b.name === buildingNameOrId || b.shortName === buildingNameOrId
  );

  if (!target) return generateHostelRoomsForFloor(floorId, 24);

  // If building has structured floor objects with explicit room arrays (e.g. Academic Block)
  if (Array.isArray(target.floors)) {
    const floorObj =
      target.floors.find((f) => typeof f === 'object' && String(f.id) === String(floorId)) ||
      (typeof target.floors[0] === 'object' ? target.floors[0] : null);
    if (floorObj && Array.isArray(floorObj.rooms)) {
      return floorObj.rooms;
    }
  }

  // If hostel building: generate clean, direct rooms without wing prefixes
  if (target.category === 'HOSTEL') {
    const maxRooms = Number(target.roomsPerFloor) || 24;
    const prefix = target.roomPrefix || 'Room ';
    const allFloorRooms = generateHostelRoomsForFloor(floorId, maxRooms, prefix);
    return [
      ...allFloorRooms,
      ...(target.customRooms || []),
      ...HOSTEL_COMMON_ZONES.map((z) => `${floorId === 'G' ? 'Ground' : `Floor ${floorId}`} — ${z}`),
    ];
  }

  return generateHostelRoomsForFloor(floorId, 24);
}

export function getRoomsForSelection(buildingNameOrId, floorId = 'G') {
  return getRoomsForBuilding(buildingNameOrId, floorId);
}

export function formatIIITNRLocation({ building, floor, room, customSpot }) {
  const parts = [];
  if (building) parts.push(building);
  if (floor) {
    const floorLabel =
      floor === 'G'
        ? 'Ground Floor'
        : floor === '1'
        ? '1st Floor'
        : floor === '2'
        ? '2nd Floor'
        : floor === '3'
        ? '3rd Floor'
        : `Floor ${floor}`;
    parts.push(floorLabel);
  }
  if (room) parts.push(room);
  if (customSpot && customSpot.trim()) parts.push(customSpot.trim());
  return parts.join(', ');
}

export const IIITNR_QUICK_SCENARIOS = [
  {
    id: 'ac_e101',
    label: '❄️ AC Not Cooling (Room 101 / E-101)',
    building: 'Main Academic & Administrative Building',
    floor: 'G',
    room: 'Room 101 — Smart E-Classroom E-101 (120-Seat AC)',
    category: 'Electrical',
    title: 'Split AC units blowing warm air in Smart E-Classroom E-101 (Room 101)',
    text: 'The overhead cassette AC units in Room 101 (Smart E-Classroom E-101, Ground Floor, Academic Block) are not cooling during lectures.',
  },
  {
    id: 'wifi_ramanujan',
    label: '🌐 Wi-Fi Drop in Ramanujan Hostel',
    building: 'Ramanujan House (Boys Hostel 1)',
    floor: '2',
    room: 'Room 204',
    category: 'IT',
    title: 'Hostel Wi-Fi router offline in Ramanujan House, 2nd Floor',
    text: 'The ceiling Wi-Fi access point near Room 204 in Ramanujan House (2nd Floor) is blinking red with no internet connectivity.',
  },
  {
    id: 'lab_vlsi_303',
    label: '🖥️ Lab Workstation / LAN Issue (Room 303 VLSI Lab)',
    building: 'Main Academic & Administrative Building',
    floor: '2',
    room: 'Room 303 — VLSI & Embedded Systems Lab (Dr. Manoj K. Majumder, 0771-2474042)',
    category: 'IT',
    title: 'License server / LAN unreachable in Room 303 (VLSI & Embedded Lab)',
    text: 'Workstations in Room 303 (VLSI & Embedded Systems Lab, 2nd Floor, Academic Building) cannot reach the Cadence/Vivado license server over LAN.',
  },
  {
    id: 'ro_bhabha',
    label: '💧 RO Water Cooler Leaking (Bhabha House)',
    building: 'Bhabha House (Boys Hostel 2)',
    floor: '1',
    room: 'Floor 1 — Corridor RO Water Cooler',
    category: 'Plumbing',
    title: 'Corridor RO drinking water cooler leaking on 1st Floor of Bhabha House',
    text: 'The RO drinking water cooler on the 1st Floor corridor of Bhabha House is leaking water onto the floor and needs urgent plumbing repair.',
  },
];

