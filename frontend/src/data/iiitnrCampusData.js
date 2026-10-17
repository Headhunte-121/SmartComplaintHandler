/**
 * frontend/src/data/iiitnrCampusData.js
 * Clean Facade Module for IIIT Naya Raipur Interactive Campus Digital Twin.
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
  SUB_LOCATION_PIN_OVERRIDES,
  buildCampusSearchIndex,
  queryCampusSearchIndex,
  autoDetectCampusLocation,
} from './campusTwin/campusSearchEngine';

import {
  IIITNR_CAMPUS_METADATA,
  HOSTEL_FLOORS,
  HOSTEL_WINGS,
  HOSTEL_COMMON_ZONES,
  DEFAULT_IIITNR_BUILDINGS,
} from './campusTwin/campusLabsAndRooms';

export const IIITNR_CAMPUS_STORAGE_KEY = 'iiitnr_custom_campus_map_v10_geojson';
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
};

export const IIITNR_BUILDINGS = DEFAULT_IIITNR_BUILDINGS;
export const ALL_IIITNR_BUILDINGS = DEFAULT_IIITNR_BUILDINGS;
export const IIITNR_HOSTELS = DEFAULT_IIITNR_BUILDINGS.filter((b) => b.category === 'HOSTEL');
export const IIITNR_ACADEMIC_BLOCKS = DEFAULT_IIITNR_BUILDINGS.filter((b) => b.category !== 'HOSTEL');

export function getCampusBuildings() {
  if (typeof window === 'undefined') return DEFAULT_IIITNR_BUILDINGS;
  try {
    const raw = window.localStorage.getItem(IIITNR_CAMPUS_STORAGE_KEY);
    if (!raw) return DEFAULT_IIITNR_BUILDINGS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (err) {
    console.warn('Failed to parse custom campus map:', err);
  }
  return DEFAULT_IIITNR_BUILDINGS;
}

export function saveCustomCampusBuildings(buildings) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(IIITNR_CAMPUS_STORAGE_KEY, JSON.stringify(buildings));
    window.dispatchEvent(new CustomEvent(IIITNR_MAP_UPDATED_EVENT, { detail: buildings }));
  } catch (err) {
    console.warn('Failed to save custom campus map:', err);
  }
}

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

export function getFloorsForBuilding(buildingNameOrId, customBuildingsList = null) {
  const list = customBuildingsList || getCampusBuildings();
  const target = list.find((b) => b.id === buildingNameOrId || b.name === buildingNameOrId || b.shortName === buildingNameOrId);
  if (!target) return HOSTEL_FLOORS;
  if (Array.isArray(target.floors) && target.floors.length > 0) {
    if (typeof target.floors[0] === 'string') {
      return target.floors.map((fl) => ({ id: fl, label: fl === 'G' ? 'Ground Floor (G)' : `Floor ${fl}` }));
    }
    return target.floors.map((f) => ({ id: f.id, label: f.label }));
  }
  return HOSTEL_FLOORS;
}

export function getRoomsForBuilding(buildingNameOrId, floorId = '1', wingId = 'Wing A', customBuildingsList = null) {
  const list = customBuildingsList || getCampusBuildings();
  const target = list.find((b) => b.id === buildingNameOrId || b.name === buildingNameOrId || b.shortName === buildingNameOrId);
  if (!target) return ['Room 101', 'Room 102'];
  if (Array.isArray(target.floors)) {
    const floorObj = target.floors.find((f) => typeof f === 'object' && String(f.id) === String(floorId));
    if (floorObj && Array.isArray(floorObj.rooms)) return floorObj.rooms;
  }
  return ['Room 101', 'Room 102', 'Room 103'];
}

export {
  SUB_LOCATION_PIN_OVERRIDES,
  buildCampusSearchIndex,
  queryCampusSearchIndex,
  autoDetectCampusLocation,
};

export function getHostelBuildings(customList = null) {
  const list = customList || getCampusBuildings();
  return list.filter((b) => b.category === 'HOSTEL');
}

export function getNonHostelBuildings(customList = null) {
  const list = customList || getCampusBuildings();
  return list.filter((b) => b.category !== 'HOSTEL');
}
