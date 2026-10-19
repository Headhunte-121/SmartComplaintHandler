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
  if (!target) return HOSTEL_FLOORS;

  if (Array.isArray(target.floors) && target.floors.length > 0) {
    if (typeof target.floors[0] === 'string') {
      return target.floors.map((fl) => ({
        id: fl,
        label: fl === 'G' ? 'Ground Floor (G)' : `Floor ${fl}`,
      }));
    }
    return target.floors.map((f) => ({ id: f.id, label: f.label || `Floor ${f.id}` }));
  }
  return HOSTEL_FLOORS;
}

/**
 * Generates or retrieves authentic room numbers for any building and floor.
 */
export function getRoomsForBuilding(buildingNameOrId, floorId = '1', wingId = 'Wing A', customBuildingsList = null) {
  const list = customBuildingsList || getCampusBuildings();
  const target = list.find(
    (b) => b.id === buildingNameOrId || b.name === buildingNameOrId || b.shortName === buildingNameOrId
  );
  if (!target) {
    return ['Room 101', 'Room 102', 'Room 103', 'Room 104', 'Room 105'];
  }

  const strFloor = String(floorId || '1');

  // 1. Hostels: Generate authentic room numbers based on roomsPerFloor + common zones
  if (target.category === 'HOSTEL') {
    const roomsCount = Number(target.roomsPerFloor || target.rooms_per_floor) || 24;
    const prefix = strFloor === 'G' ? 'G' : strFloor;
    const rooms = [];

    for (let i = 1; i <= roomsCount; i++) {
      const numStr = i < 10 ? `0${i}` : `${i}`;
      rooms.push(`Room ${prefix}${numStr}`);
    }

    // Common facilities on every hostel floor
    rooms.push('Common Room / TV Lounge');
    rooms.push('Corridor RO Water Cooler');
    rooms.push('Washroom & Shower Block');
    rooms.push('Wi-Fi Access Point Zone');
    return rooms;
  }

  // 2. Academic Block: Authentic classroom & laboratory catalog
  if (target.id === 'academic_block' || target.category === 'ACADEMIC') {
    if (strFloor === 'G') {
      return [
        'Smart E-Classroom E-101',
        'Smart E-Classroom E-102',
        'Lecture Hall LH-1',
        'Room 104 (Estate Office)',
        'Room 131C (Data Centre)',
        'Room 131E (NOC)',
        'AICTE IDEA Lab',
        '3D Printing Lab',
        'Central Library Reading Hall',
        'Board Room',
        'Registrar Office',
      ];
    }
    if (strFloor === '1') {
      return [
        'Smart E-Classroom E-201',
        'Smart E-Classroom E-202',
        'Room 206 (IoT & Sensor Lab)',
        'Room 208 (Language Lab)',
        'Room 210 (AIDL Lab)',
        'Room 212 (Biomedical Lab)',
        'Room 216 (Big Data Lab)',
      ];
    }
    if (strFloor === '2') {
      return [
        'Smart E-Classroom E-301',
        'Room 302 (Electronic Circuit Lab)',
        'Room 303 (VLSI & Embedded Lab)',
        'Room 305 (Communication Lab)',
        'Room 308 (Antenna Lab)',
        'Room 310 (PCB Lab)',
        'Room 314 (Blockchain Lab)',
        'Room 317 (Robotics Lab)',
      ];
    }
    if (strFloor === '3') {
      return [
        'Research Scholar Workstation Lab',
        'Dean Academic Office',
        'Faculty Chambers 1-16',
        'Seminar Hall 3',
      ];
    }
  }

  // 3. Canteen Rotunda & Dining Arcade
  if (target.id === 'canteen_block') {
    return [
      'Dining Hall',
      'Kitchen & Service Pantry',
      'Night Canteen Counter',
      'Beverage & Juice Counter',
      'Drinking Water Point',
      'Open-Air Dining Arcade',
    ];
  }

  // 4. Central Campus Auditorium
  if (target.id === 'auditorium_hall') {
    return [
      'Main Acoustic Auditorium Hall (800 Seater)',
      'Green Room 1',
      'Green Room 2',
      'AV & Lighting Control Booth',
      'Auditorium Front Plaza',
    ];
  }

  // 5. Sports Complex & Athletic Grounds
  if (target.id === 'bldg_1792074173914' || target.category === 'INFRASTRUCTURE') {
    return [
      'Basketball Court (Indoor)',
      'Badminton Court 1 & 2',
      'Gymnasium & Fitness Hall',
      'Table Tennis Room',
      'Outdoor Football Turf Pitch',
      'Volleyball Court',
    ];
  }

  // 6. Generic custom rooms if defined on building
  if (Array.isArray(target.customRooms) && target.customRooms.length > 0) {
    return target.customRooms;
  }
  if (Array.isArray(target.custom_rooms) && target.custom_rooms.length > 0) {
    return target.custom_rooms;
  }

  return ['Room 101', 'Room 102', 'Room 103', 'Room 104', 'Room 105'];
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
