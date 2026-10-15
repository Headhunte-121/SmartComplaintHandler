/**
 * SmartComplaintHandler - Authentic IIIT Naya Raipur Georeferenced Campus Map, Hostels & Labs Store
 * Grounded in:
 * - Google Maps Plus Codes:
 *   - Bhabha House: 4QH7+4PR (21.12786° N, 81.76427° E)
 *   - Guest House / Transit Hostel: 4QH7+9WH (21.12844° N, 81.76486° E)
 *   - Sports Ground / Phase 2: 4QH7+PM9 (21.12929° N, 81.76423° E)
 *   - Canteen / Central Mess: 4QH8+56F (21.12794° N, 81.76555° E)
 *   - Academic & Admin Block (D-Loop): 21.12815° N, 81.76605° E
 * - Official IIIT-NR Building Blocks & Labs (iiitnr.ac.in/content/building-blocks)
 */

export const IIITNR_CAMPUS_STORAGE_KEY = 'iiitnr_custom_campus_map_v2';
export const IIITNR_MAP_UPDATED_EVENT = 'iiitnr-campus-map-updated';

export const IIITNR_CAMPUS_METADATA = {
  instituteName: 'Dr. SPM IIIT Naya Raipur',
  shortName: 'IIIT Naya Raipur',
  address: 'Plot No. 7, Sector 24, Near Purkhoti Muktangan, Atal Nagar – Nava Raipur, Chhattisgarh 493661',
  latitude: 21.12815,
  longitude: 81.7655,
  campusArea: '50 Acres Residential Campus',
  osmEmbedUrl:
    'https://www.openstreetmap.org/export/embed.html?bbox=81.7625%2C21.1255%2C81.7685%2C21.1312&layer=mapnik&marker=21.12815%2C81.76605',
  googleMapsUrl:
    'https://www.google.com/maps/place/International+Institute+of+Information+Technology,+Naya+Raipur/@21.12815,81.7655,550m/data=!3m1!1e3',
  contacts: [
    {
      role: 'Estate Officer',
      name: 'Rakesh Kumar Mishra',
      email: 'rakesh@iiitnr.edu.in',
      phone: '0771-2474104',
      office: 'Academic Block, Ground Floor',
    },
    {
      role: 'JE (Electrical)',
      name: 'Ranjeet Singh Thakur',
      email: 'ranjeet@iiitnr.edu.in',
      phone: '0771-2474109',
      office: 'Electrical Substation & Control Room',
    },
    {
      role: 'Sr. Network Engineer',
      name: 'Abir Bhattacharya',
      email: 'abir@iiitnr.edu.in',
      phone: '0771-2474131',
      office: 'Academic Block, Room 131C',
    },
    {
      role: 'Network Engineer',
      name: 'Parvinder Singh',
      email: 'parvinder@iiitnr.edu.in',
      phone: '0771-2474132',
      office: 'Academic Block, Room 131E',
    },
  ],
};

export const HOSTEL_FLOORS = [
  { id: 'G', label: 'Ground Floor (G)' },
  { id: '1', label: '1st Floor (1xx)' },
  { id: '2', label: '2nd Floor (2xx)' },
  { id: '3', label: '3rd Floor (3xx)' },
];

export const HOSTEL_WINGS = [
  { id: 'Wing A', label: 'Wing A / Block A' },
  { id: 'Wing B', label: 'Wing B / Block B' },
  { id: 'Common Area', label: 'Corridor / Washroom / Utility' },
];

export const HOSTEL_COMMON_ZONES = [
  'Corridor RO Water Cooler',
  'Washroom & Shower Block',
  'Common Room / TV Lounge',
  'Badminton Court',
  'Staircase & Corridor Lighting',
  'Wi-Fi Ceiling Access Point',
  'Washing Machine / Laundry Area',
];

export const DEFAULT_IIITNR_BUILDINGS = [
  {
    id: 'ramanujan_house',
    name: 'Ramanujan House (Boys Hostel)',
    shortName: 'Ramanujan House',
    type: '3rd & 4th Year Boys Hostel',
    category: 'HOSTEL',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    mapPin: { xPct: 22, yPct: 71, lat: 21.12735, lng: 81.76395, color: '#4f46e5', badge: 'RAMANUJAN' },
    mapZone: { badge: 'RAMANUJAN', color: '#4f46e5' },
    gps: '21.12735° N, 81.76395° E',
    description: 'Southwest hostel block along the western campus avenue.',
  },
  {
    id: 'bhabha_house',
    name: 'Bhabha House (Hostel Block)',
    shortName: 'Bhabha House',
    type: 'Residential Hostel (4QH7+4PR)',
    category: 'HOSTEL',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    mapPin: { xPct: 26, yPct: 58, lat: 21.12786, lng: 81.76427, color: '#4f46e5', badge: 'BHABHA' },
    mapZone: { badge: 'BHABHA', color: '#4f46e5' },
    gps: '21.12786° N, 81.76427° E',
    description: 'Georeferenced at Google Maps Plus Code 4QH7+4PR on the western residential avenue.',
  },
  {
    id: 'bose_house',
    name: 'Bose House (Boys Hostel)',
    shortName: 'Bose House',
    type: '2nd Year Boys Hostel',
    category: 'HOSTEL',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    mapPin: { xPct: 29, yPct: 46, lat: 21.12835, lng: 81.76445, color: '#4f46e5', badge: 'BOSE' },
    mapZone: { badge: 'BOSE', color: '#4f46e5' },
    gps: '21.12835° N, 81.76445° E',
    description: 'West-central boys hostel block north of Bhabha House.',
  },
  {
    id: 'raman_house',
    name: 'Raman House (Hostel Block)',
    shortName: 'Raman House',
    type: '1st Year Hostel Block',
    category: 'HOSTEL',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    mapPin: { xPct: 39, yPct: 41, lat: 21.12865, lng: 81.76515, color: '#4f46e5', badge: 'RAMAN' },
    mapZone: { badge: 'RAMAN', color: '#4f46e5' },
    gps: '21.12865° N, 81.76515° E',
    description: 'Inner residential block near the northern hostel court.',
  },
  {
    id: 'shabhari_house',
    name: 'Shabri House (Girls Hostel)',
    shortName: 'Shabri House',
    type: 'Girls Residential Hostel',
    category: 'HOSTEL',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    mapPin: { xPct: 35, yPct: 68, lat: 21.12745, lng: 81.76485, color: '#db2777', badge: 'SHABRI' },
    mapZone: { badge: 'SHABRI', color: '#db2777' },
    gps: '21.12745° N, 81.76485° E',
    description: 'Girls residential hostel block.',
  },
  {
    id: 'transit_hostel',
    name: 'Guest House & Transit Hostel',
    shortName: 'Guest House',
    type: 'Guest & Transit Block (4QH7+9WH)',
    category: 'HOSTEL',
    wings: ['Main Block'],
    floors: ['G', '1', '2'],
    roomsPerFloor: 12,
    roomPrefix: 'Suite ',
    customRooms: [],
    mapPin: { xPct: 35, yPct: 50, lat: 21.12844, lng: 81.76486, color: '#0d9488', badge: 'GUEST' },
    mapZone: { badge: 'GUEST', color: '#0d9488' },
    gps: '21.12844° N, 81.76486° E',
    description: 'Georeferenced at Google Maps Plus Code 4QH7+9WH.',
  },
  {
    id: 'academic_block',
    name: 'Academic & Administrative Block',
    shortName: 'Academic Block',
    type: 'Classrooms, Labs & Admin',
    category: 'ACADEMIC',
    floors: [
      {
        id: 'G',
        label: 'Ground Floor',
        rooms: [
          'Smart E-Classroom E-101',
          'Lecture Hall LH-1',
          'Lecture Hall LH-2',
          'AICTE IDEALAB',
          '3D Printing & Fabrication Lab',
          'Estate & Facilities Office',
          'Registrar & Admin Office',
          'Directorate Secretariat',
        ],
      },
      {
        id: '1',
        label: '1st Floor',
        rooms: [
          'Room 131C — Data Centre & Server NOC',
          'Room 131E — Network Operations Center',
          'Smart E-Classroom E-102',
          'Computer Programming Lab',
          'Data Science Lab',
          'Artificial Intelligence & Deep Learning Lab',
          'Big Data Computing Lab',
          'Information Security & Blockchain Lab',
          'Networks Lab',
          'Language Lab',
        ],
      },
      {
        id: '2',
        label: '2nd Floor',
        rooms: [
          'VLSI & Embedded Lab',
          'IoT & Sensor Lab',
          'Intelligent Autonomous Systems Lab',
          'Antenna & Microwave Circuit Design Lab',
          'Communication Lab',
          'Electronic Circuit Lab',
          'PCB Design Lab',
          'Biomedical & Speech Processing Lab',
          'Faculty Cabins (2nd Floor)',
        ],
      },
      {
        id: '3',
        label: '3rd Floor',
        rooms: [
          'Seminar & Conference Hall',
          'PhD & M.Tech Research Scholars Bay',
          'IIIT-NR TBI&E Incubation Cell',
          'Center for Applied Mathematics',
        ],
      },
    ],
    mapPin: { xPct: 54, yPct: 56, lat: 21.12815, lng: 81.76605, color: '#0284c7', badge: 'ACAD' },
    mapZone: { badge: 'ACAD', color: '#0284c7' },
    gps: '21.12815° N, 81.76605° E',
    description: 'Main academic & administrative complex at the central semicircular D-loop.',
  },
  {
    id: 'krc_library',
    name: 'Central Library (Knowledge Resource Centre)',
    shortName: 'Library (KRC)',
    type: 'Library & Digital Center',
    category: 'ACADEMIC',
    floors: [
      {
        id: 'G',
        label: 'Ground Floor',
        rooms: ['Main Reading Hall', 'Circulation & RFID Desk', 'Restroom & RO Cooler'],
      },
      {
        id: '1',
        label: '1st Floor',
        rooms: ['Digital Library', 'Reference Section', 'Discussion Room 1', 'Discussion Room 2'],
      },
    ],
    mapPin: { xPct: 61, yPct: 49, lat: 21.12838, lng: 81.76638, color: '#7c3aed', badge: 'LIB' },
    mapZone: { badge: 'LIB', color: '#7c3aed' },
    gps: '21.12838° N, 81.76638° E',
    description: 'Central library and e-resource reading halls.',
  },
  {
    id: 'cafeteria_mess',
    name: 'Cafeteria, Central Mess & Shopping/ATM Block',
    shortName: 'Mess & Canteen',
    type: 'Dining & ATM (4QH8+56F)',
    category: 'AMENITY',
    floors: [
      {
        id: 'G',
        label: 'Ground Floor',
        rooms: ['Central Mess Hall 1', 'Campus Canteen', 'Shopping Center Block', 'ATM Center', 'Medical Dispensary'],
      },
      {
        id: '1',
        label: '1st Floor',
        rooms: ['Central Mess Hall 2', 'RO Water Filtration Plant'],
      },
    ],
    mapPin: { xPct: 44, yPct: 58, lat: 21.12794, lng: 81.76555, color: '#d97706', badge: 'MESS' },
    mapZone: { badge: 'MESS', color: '#d97706' },
    gps: '21.12794° N, 81.76555° E',
    description: 'Georeferenced at Google Maps Plus Code 4QH8+56F between the Academic Block and Hostels.',
  },
  {
    id: 'sac_mph',
    name: 'Multi-Purpose Hall (MPH), SAC & Amphitheater',
    shortName: 'MPH & Amphitheater',
    type: 'Auditorium, Gym & SAC',
    category: 'AMENITY',
    floors: [
      {
        id: 'G',
        label: 'Ground Floor',
        rooms: ['Multi-Purpose Hall (MPH) Auditorium', 'Open-Air Amphitheater', 'Indoor Badminton Courts', 'Student Gymnasium', 'SAC Club Rooms'],
      },
    ],
    mapPin: { xPct: 51, yPct: 38, lat: 21.12885, lng: 81.76585, color: '#ea580c', badge: 'MPH' },
    mapZone: { badge: 'MPH', color: '#ea580c' },
    gps: '21.12885° N, 81.76585° E',
    description: 'Auditorium, Student Activity Center (SAC), and Open-Air Amphitheater north of Academic Block.',
  },
  {
    id: 'sports_ground',
    name: 'Sports Ground & Phase 2 Complex',
    shortName: 'Sports Ground',
    type: 'Grounds & Courts (4QH7+PM9)',
    category: 'INFRASTRUCTURE',
    floors: [
      {
        id: 'G',
        label: 'Outdoor Grounds',
        rooms: ['Main Football & Cricket Ground', 'Basketball Court', 'Volleyball Courts', 'Outdoor Floodlights'],
      },
    ],
    mapPin: { xPct: 33, yPct: 27, lat: 21.12929, lng: 81.76423, color: '#059669', badge: 'SPORTS' },
    mapZone: { badge: 'SPORTS', color: '#059669' },
    gps: '21.12929° N, 81.76423° E',
    description: 'Georeferenced at Google Maps Plus Code 4QH7+PM9 in the northwest campus sector.',
  },
  {
    id: 'staff_quarters',
    name: 'Staff Quarters, Director Bungalow & Main Gate',
    shortName: 'Staff Quarters & Gate',
    type: 'Faculty Housing & Gate',
    category: 'INFRASTRUCTURE',
    floors: [
      {
        id: 'G',
        label: 'Campus Zone',
        rooms: ['Staff Quarters Block A', 'Staff Quarters Block B', 'Director Bungalow', 'Main Gate Security Plaza', '33/11kV Electrical Substation'],
      },
    ],
    mapPin: { xPct: 63, yPct: 73, lat: 21.12715, lng: 81.76655, color: '#475569', badge: 'STAFF' },
    mapZone: { badge: 'STAFF', color: '#475569' },
    gps: '21.12715° N, 81.76655° E',
    description: 'Southeastern residential quarters and Main Gate entrance road.',
  },
];

export function getCampusBuildings() {
  if (typeof window === 'undefined') {
    return DEFAULT_IIITNR_BUILDINGS;
  }
  try {
    const raw = localStorage.getItem(IIITNR_CAMPUS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (_) {}
  return DEFAULT_IIITNR_BUILDINGS;
}

export function saveCustomCampusBuildings(buildingsList) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(IIITNR_CAMPUS_STORAGE_KEY, JSON.stringify(buildingsList));
  window.dispatchEvent(new CustomEvent(IIITNR_MAP_UPDATED_EVENT, { detail: buildingsList }));
}

export function resetCampusBuildingsToDefault() {
  if (typeof window === 'undefined') return DEFAULT_IIITNR_BUILDINGS;
  localStorage.removeItem(IIITNR_CAMPUS_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(IIITNR_MAP_UPDATED_EVENT, { detail: DEFAULT_IIITNR_BUILDINGS }));
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

export const IIITNR_HOSTELS = DEFAULT_IIITNR_BUILDINGS.filter((b) => b.category === 'HOSTEL');
export const IIITNR_ACADEMIC_BLOCKS = DEFAULT_IIITNR_BUILDINGS.filter((b) => b.category !== 'HOSTEL');
export const ALL_IIITNR_BUILDINGS = DEFAULT_IIITNR_BUILDINGS;

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
        label: fl === 'G' ? 'Ground Floor (G)' : `Floor ${fl}`,
      }));
    }
    return target.floors.map((f) => ({ id: f.id, label: f.label }));
  }

  return HOSTEL_FLOORS;
}

export function getWingsForBuilding(buildingNameOrId, customBuildingsList = null) {
  const list = customBuildingsList || getCampusBuildings();
  const target = list.find(
    (b) => b.id === buildingNameOrId || b.name === buildingNameOrId || b.shortName === buildingNameOrId
  );
  if (target && Array.isArray(target.wings) && target.wings.length > 0) {
    return [
      ...target.wings.map((w) => ({ id: w, label: w })),
      { id: 'Common Area', label: 'Corridor / Washroom / Utility' },
    ];
  }
  return HOSTEL_WINGS;
}

export function getRoomsForBuilding(buildingNameOrId, floorId = '1', wingId = 'Wing A', customBuildingsList = null) {
  const list = customBuildingsList || getCampusBuildings();
  const target = list.find(
    (b) => b.id === buildingNameOrId || b.name === buildingNameOrId || b.shortName === buildingNameOrId
  );

  if (!target) return generateHostelRoomsForFloor(floorId, 24);

  if (Array.isArray(target.customRooms) && target.customRooms.length > 0) {
    return target.customRooms;
  }

  if (target.category === 'HOSTEL') {
    const maxRooms = Number(target.roomsPerFloor) || 24;
    const prefix = target.roomPrefix || 'Room ';

    if (wingId === 'Common Area') {
      return HOSTEL_COMMON_ZONES.map((z) => `Floor ${floorId} — ${z}`);
    }

    const allFloorRooms = generateHostelRoomsForFloor(floorId, maxRooms, prefix);
    const wings = Array.isArray(target.wings) && target.wings.length > 0 ? target.wings : ['Wing A', 'Wing B'];
    const wingIndex = Math.max(0, wings.indexOf(wingId));
    const chunkSize = Math.ceil(allFloorRooms.length / Math.max(1, wings.length));
    const sliced = allFloorRooms.slice(wingIndex * chunkSize, (wingIndex + 1) * chunkSize);
    const activeRooms = sliced.length > 0 ? sliced : allFloorRooms;

    return [
      ...activeRooms.map((r) => (wingId ? `${wingId}, ${r}` : r)),
      ...HOSTEL_COMMON_ZONES.map((z) => `${wingId || 'Floor ' + floorId} — ${z}`),
    ];
  }

  if (Array.isArray(target.floors)) {
    const floorObj = target.floors.find((f) => typeof f === 'object' && f.id === floorId) || target.floors[0];
    if (floorObj && Array.isArray(floorObj.rooms)) {
      return floorObj.rooms;
    }
  }

  return ['General Area'];
}
