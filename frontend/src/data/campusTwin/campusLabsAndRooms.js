/**
 * frontend/src/data/campusTwin/campusLabsAndRooms.js
 *
 * Lightweight client metadata presets for IIIT Naya Raipur.
 * Canonical campus entities (buildings, polygons, floors, and rooms) are stored
 * and managed strictly in the backend database (API: /api/v1/campus/buildings & /campus/roads).
 * Zero static building dictionaries in frontend bundle.
 */

export const IIITNR_CAMPUS_METADATA = {
  instituteName: 'Dr. SPM IIIT Naya Raipur',
  shortName: 'IIIT Naya Raipur',
  address: 'Plot No. 7, Sector 24, Near Purkhoti Muktangan, Atal Nagar – Nava Raipur, Chhattisgarh 493661',
  latitude: 21.12815,
  longitude: 81.7655,
  campusArea: '50 Acres Residential Digital Twin',
  boundaryPerimeter: '2,328 Meters',
  contacts: [
    {
      role: 'Estate & Civil Maintenance',
      name: 'Campus Facilities Service Desk',
      email: 'facilities@iiitnr.edu.in',
      phone: '0771-2474104',
      office: 'Academic Block, Estate Office (Room 104)',
    },
    {
      role: 'Electrical & Power Supply',
      name: 'Power & Utilities Helpdesk',
      email: 'electrical@iiitnr.edu.in',
      phone: '0771-2474109',
      office: 'Electrical Substation Service Desk',
    },
    {
      role: 'Campus IT & Wi-Fi NOC',
      name: 'Information Technology Desk',
      email: 'it-support@iiitnr.edu.in',
      phone: '0771-2474010',
      office: 'Data Centre & Network Lab (Room 131C)',
    },
    {
      role: 'General Administration',
      name: 'Institutional Administration Desk',
      email: 'admin@iiitnr.edu.in',
      phone: '0771-2474034',
      office: 'Administration Wing (Room 105)',
    },
  ],
};

export const HOSTEL_FLOORS = [
  { id: '1', label: 'Floor 1 (1xx)' },
  { id: '2', label: 'Floor 2 (2xx)' },
  { id: '3', label: 'Floor 3 (3xx)' },
  { id: '4', label: 'Floor 4 (4xx)' },
  { id: '5', label: 'Floor 5 (5xx)' },
  { id: '6', label: 'Floor 6 (6xx)' },
];

export const HOSTEL_WINGS = [];

export const HOSTEL_COMMON_ZONES = [
  'Corridor RO Water Cooler',
  'Washroom & Shower Block',
  'Common Room / TV Lounge',
  'Inner Courtyard Badminton / Sports Court',
  'Staircase & Corridor Lighting',
  'Wi-Fi Ceiling Access Point',
];

// Zero static building details in frontend bundle.
// All campus buildings and rooms are loaded dynamically from the backend database via /api/v1/campus/buildings.
export const DEFAULT_IIITNR_BUILDINGS = [];
