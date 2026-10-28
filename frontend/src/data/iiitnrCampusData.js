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

export const IIITNR_CAMPUS_STORAGE_KEY = 'iiitnr_canonical_campus_buildings_v14';
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
let inMemoryCampusBuildings = null;

export function getCampusBuildings() {
  return inMemoryCampusBuildings || DEFAULT_IIITNR_BUILDINGS;
}

/**
 * Persist custom buildings to memory and notify all listeners.
 */
export function saveCustomCampusBuildings(buildings) {
  inMemoryCampusBuildings = buildings;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(IIITNR_MAP_UPDATED_EVENT, { detail: buildings }));
  }
}

/**
 * Asynchronously synchronizes campus catalog from the backend database into in-memory catalog.
 */
export async function fetchAndCacheCampusBuildings() {
  try {
    const remote = await fetchCampusBuildings();
    if (Array.isArray(remote) && remote.length > 0) {
      saveCustomCampusBuildings(remote);
      return remote;
    }
  } catch (err) {
    console.warn('Could not fetch campus buildings from database, using default:', err);
  }
  return getCampusBuildings();
}

/**
 * Reset campus catalog to institutional defaults.
 */
export function resetCampusBuildingsToDefault() {
  inMemoryCampusBuildings = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(IIITNR_MAP_UPDATED_EVENT, { detail: DEFAULT_IIITNR_BUILDINGS }));
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
      label: fl === 'G' ? 'Ground Floor' : `Floor ${fl}`,
    }));
  }
  return target.floors.map((f) => ({ id: f.id, label: f.label || (f.id === 'G' ? 'Ground Floor' : `Floor ${f.id}`) }));
}

/**
 * Infer floor string ('1', '2', '3', '4', 'G') from room/amenity label.
 */
export function inferFloorFromItem(itemStr = '') {
  const clean = String(itemStr || '').trim();
  if (!clean) return null;

  // 1. Explicit "(Floor X)" or "Floor X" or "Level X"
  const explicitMatch = clean.match(/\b(?:floor|level)\s*([G0-9]+)\b/i);
  if (explicitMatch) {
    return explicitMatch[1].toUpperCase();
  }

  // 2. Ground floor mentions
  if (/\bground\b/i.test(clean)) {
    return 'G';
  }

  // 3. Room / Lab numbering with floor digit e.g. "Room 311", "Lab 210", "303", "G05", "G-12"
  const roomNumMatch = clean.match(/\b(?:room|lab|cabin|hall|office)?\s*([G1-9])[-]?(\d{2}[A-Z]?)\b/i);
  if (roomNumMatch) {
    return roomNumMatch[1].toUpperCase();
  }

  return null;
}

/**
 * Retrieves authentic rooms entered by the user in the GIS dataset.
 * When floorId is provided, filters strictly to that floor's rooms and amenities.
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
  if (!Array.isArray(custom) || custom.length === 0) {
    return [];
  }

  // If no floor requested, or floor is 'all'/'none', or target only has 1 floor
  if (
    !floorId ||
    floorId === 'all' ||
    floorId === 'ALL' ||
    floorId === 'None' ||
    !Array.isArray(target.floors) ||
    target.floors.length <= 1
  ) {
    return custom;
  }

  const normalizedTargetFloor = String(floorId).replace(/^floor\s*/i, '').trim().toUpperCase();

  // If building custom rooms have floor markers, filter strictly to this floor
  const hasFloorDistinction = custom.some((rm) => inferFloorFromItem(rm) !== null);
  if (!hasFloorDistinction) {
    return custom;
  }

  return custom.filter((rm) => {
    const itemFloor = inferFloorFromItem(rm);
    return itemFloor === normalizedTargetFloor;
  });
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
