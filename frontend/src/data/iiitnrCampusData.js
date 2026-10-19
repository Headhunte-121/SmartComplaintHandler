/**
 * frontend/src/data/iiitnrCampusData.js
 * Clean Facade Module for IIIT Naya Raipur Interactive Campus Digital Twin.
 * Synchronized with the backend database (Supabase PostgreSQL / SQLite) and
 * authoritative GIS ground-truth from frontend/public/iiitnr_gis_studio.html.
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

import { fetchCampusBuildings } from '../api/campus';

export const IIITNR_CAMPUS_STORAGE_KEY = 'iiitnr_canonical_campus_buildings_v11';
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

/**
 * Returns current campus buildings, checking localStorage cache first, then falling back to canonical defaults.
 */
export function getCampusBuildings() {
  if (typeof window === 'undefined') return DEFAULT_IIITNR_BUILDINGS;
  try {
    const raw = window.localStorage.getItem(IIITNR_CAMPUS_STORAGE_KEY);
    if (!raw) return DEFAULT_IIITNR_BUILDINGS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (err) {
    console.warn('Failed to parse cached campus map:', err);
  }
  return DEFAULT_IIITNR_BUILDINGS;
}

/**
 * Persist custom buildings to localStorage and notify all listeners.
 */
export function saveCustomCampusBuildings(buildings) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(IIITNR_CAMPUS_STORAGE_KEY, JSON.stringify(buildings));
    window.dispatchEvent(new CustomEvent(IIITNR_MAP_UPDATED_EVENT, { detail: buildings }));
  } catch (err) {
    console.warn('Failed to save campus map cache:', err);
  }
}

/**
 * Asynchronously synchronizes campus catalog from the backend database into frontend cache.
 */
export async function fetchAndCacheCampusBuildings() {
  try {
    const remote = await fetchCampusBuildings();
    if (Array.isArray(remote) && remote.length > 0) {
      saveCustomCampusBuildings(remote);
      return remote;
    }
  } catch (err) {
    console.warn('Could not fetch campus buildings from database, using cached/default:', err);
  }
  return getCampusBuildings();
}

/**
 * Reset campus catalog to institutional defaults.
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

/**
 * Return floors available for a given building.
 */
export function getFloorsForBuilding(buildingNameOrId, customBuildingsList = null) {
  const list = customBuildingsList || getCampusBuildings();
  const target = list.find((b) => b.id === buildingNameOrId || b.name === buildingNameOrId || b.shortName === buildingNameOrId);
  if (!target || !Array.isArray(target.floors) || target.floors.length === 0) {
    return [];
  }

  if (typeof target.floors[0] === 'string') {
    return target.floors.map((fl) => ({
      id: fl,
      label: `Floor ${fl}`,
    }));
  }
  return target.floors.map((f) => ({ id: f.id, label: f.label || `Floor ${f.id}` }));
}

/**
 * Retrieves authentic rooms entered by the user in the GIS dataset.
 * Zero generic fallback or synthetic generation: either entered by user in GIS data, or returns [] (None).
 */
export function getRoomsForBuilding(buildingNameOrId, floorId = null, wingId = null, customBuildingsList = null) {
  const list = customBuildingsList || getCampusBuildings();
  const target = list.find(
    (b) => b.id === buildingNameOrId || b.name === buildingNameOrId || b.shortName === buildingNameOrId
  );
  if (!target) {
    return [];
  }

  // Return strictly what the user entered in the GIS dataset (no synthetic rooms)
  const custom = target.customRooms || target.custom_rooms;
  if (Array.isArray(custom) && custom.length > 0) {
    return custom;
  }

  // Not entered by user -> return empty (None)
  return [];
}

export {
  SUB_LOCATION_PIN_OVERRIDES,
  buildCampusSearchIndex,
  queryCampusSearchIndex,
  autoDetectCampusLocation,
};

/**
 * Returns strictly residential student hostels.
 */
export function getHostelBuildings(customList = null) {
  const list = customList || getCampusBuildings();
  return list.filter((b) => b.category === 'HOSTEL');
}

/**
 * Returns strictly non-hostel campus blocks (Academic, Dining, Auditorium, Sports).
 */
export function getNonHostelBuildings(customList = null) {
  const list = customList || getCampusBuildings();
  return list.filter((b) => b.category !== 'HOSTEL');
}
