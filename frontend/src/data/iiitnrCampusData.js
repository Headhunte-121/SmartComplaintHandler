/**
 * SmartComplaintHandler - Dynamic & User-Labelable IIIT Naya Raipur Campus Map, Hostels & Rooms Store
 * Campus: Dr. SPM International Institute of Information Technology, Naya Raipur
 * Address: Plot No. 7, Sector 24, Near Purkhoti Muktangan, Atal Nagar – Nava Raipur, Chhattisgarh 493661
 * Coordinates: 21.1284° N, 81.7661° E
 *
 * Key Capability:
 * - Supports live in-app interactive map pinning, dragging, renaming, and custom room-range configuration!
 * - Any building, hostel, wing, floor, or room number edited in the Interactive Map Labeler is persisted
 *   in `localStorage` (`iiitnr_custom_campus_map_v1`) and broadcast via `iiitnr-campus-map-updated`
 *   so Register, StudentDashboard, SubmitComplaint, and Home update immediately without code changes.
 */

export const IIITNR_CAMPUS_STORAGE_KEY = 'iiitnr_custom_campus_map_v1';
export const IIITNR_MAP_UPDATED_EVENT = 'iiitnr-campus-map-updated';

export const IIITNR_CAMPUS_METADATA = {
  instituteName: 'Dr. SPM IIIT Naya Raipur',
  shortName: 'IIIT Naya Raipur',
  address: 'Plot No. 7, Sector 24, Near Purkhoti Muktangan, Atal Nagar – Nava Raipur, Chhattisgarh 493661',
  latitude: 21.1284,
  longitude: 81.7661,
  campusArea: '50 Acres Residential Campus',
  osmEmbedUrl:
    'https://www.openstreetmap.org/export/embed.html?bbox=81.7615%2C21.1250%2C81.7705%2C21.1318&layer=mapnik&marker=21.1284%2C81.7661',
  googleMapsUrl:
    'https://www.google.com/maps/search/?api=1&query=21.1284,81.7661',
  contacts: [
    {
      role: 'Estate Officer',
      name: 'Rakesh Kumar Mishra',
      email: 'rakesh@iiitnr.edu.in',
      phone: '0771-2474104',
      office: 'Academic Block, Ground Floor (Estate Office)',
    },
    {
      role: 'JE (Electrical)',
      name: 'Ranjeet Singh Thakur',
      email: 'ranjeet@iiitnr.edu.in',
      phone: '0771-2474109',
      office: 'Substation & Electrical Control Room',
    },
    {
      role: 'Sr. Network Engineer',
      name: 'Abir Bhattacharya',
      email: 'abir@iiitnr.edu.in',
      phone: '0771-2474131',
      office: 'Academic Block, Room 131C (Data Centre)',
    },
    {
      role: 'Network Engineer',
      name: 'Parvinder Singh',
      email: 'parvinder@iiitnr.edu.in',
      phone: '0771-2474132',
      office: 'Academic Block, Room 131E (NOC)',
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
  { id: 'Common Area', label: 'Corridor / Washroom / Common Utility' },
];

export const HOSTEL_COMMON_ZONES = [
  'Corridor RO Water Cooler',
  'Washroom & Shower Block',
  'Common Room / TV Lounge',
  'Badminton / TT Court',
  'Staircase & Corridor Lighting',
  'Wi-Fi Ceiling Access Point',
  'Washing Machine / Laundry Bay',
];

export const DEFAULT_IIITNR_BUILDINGS = [
  {
    id: 'ramanujan_house',
    name: 'Ramanujan House (Boys Hostel)',
    shortName: 'Ramanujan House',
    type: 'Boys Hostel',
    category: 'HOSTEL',
    gender: 'Boys',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    capacity: 'Boys Residential Block',
    amenities: ['LAN & Campus Wi-Fi', 'RO Water Coolers', 'Common Room'],
    // Map coordinates: xPct/yPct on the interactive map canvas (0-100%) + GPS lat/lng
    mapPin: { xPct: 24, yPct: 26, lat: 21.1296, lng: 81.7648, color: '#4f46e5', badge: 'BH-1' },
    mapZone: { x: 110, y: 88, width: 150, height: 64, color: '#4f46e5', badge: 'BH-1' },
    gps: '21.1296° N, 81.7648° E',
    description: 'Boys residential house. Click "Edit / Label Map" to customize wings, floors, or exact room numbers.',
  },
  {
    id: 'bhabha_house',
    name: 'Bhabha House (Boys Hostel)',
    shortName: 'Bhabha House',
    type: 'Boys Hostel',
    category: 'HOSTEL',
    gender: 'Boys',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    capacity: 'Boys Residential Block',
    amenities: ['High-Speed Wi-Fi & LAN', 'RO Water Coolers', 'TT Lounge'],
    mapPin: { xPct: 42, yPct: 24, lat: 21.1298, lng: 81.7656, color: '#4f46e5', badge: 'BH-2' },
    mapZone: { x: 280, y: 88, width: 150, height: 64, color: '#4f46e5', badge: 'BH-2' },
    gps: '21.1298° N, 81.7656° E',
    description: 'Boys residential block. Fully customizable via the interactive map labeler.',
  },
  {
    id: 'bose_house',
    name: 'Bose House (Boys Hostel)',
    shortName: 'Bose House',
    type: 'Boys Hostel',
    category: 'HOSTEL',
    gender: 'Boys',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    capacity: 'Boys Residential Block',
    amenities: ['Fiber LAN Ports', 'RO Water Coolers', 'Study Room'],
    mapPin: { xPct: 60, yPct: 24, lat: 21.1299, lng: 81.7665, color: '#4f46e5', badge: 'BH-3' },
    mapZone: { x: 450, y: 88, width: 150, height: 64, color: '#4f46e5', badge: 'BH-3' },
    gps: '21.1299° N, 81.7665° E',
    description: 'Boys hostel block in the residential zone.',
  },
  {
    id: 'raman_house',
    name: 'Raman House (Girls Hostel)',
    shortName: 'Raman House',
    type: 'Girls Hostel',
    category: 'HOSTEL',
    gender: 'Girls',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    capacity: 'Girls Residential Block',
    amenities: ['24/7 Security', 'Dedicated Mess', 'RO Water Coolers'],
    mapPin: { xPct: 79, yPct: 28, lat: 21.1291, lng: 81.7676, color: '#db2777', badge: 'GH-1' },
    mapZone: { x: 640, y: 88, width: 145, height: 64, color: '#db2777', badge: 'GH-1' },
    gps: '21.1291° N, 81.7676° E',
    description: 'Girls residential hostel block.',
  },
  {
    id: 'shabhari_house',
    name: 'Shabhari House (Girls Hostel)',
    shortName: 'Shabhari House',
    type: 'Girls Hostel',
    category: 'HOSTEL',
    gender: 'Girls',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    capacity: 'Girls Residential Block',
    amenities: ['24/7 Security Desk', 'Campus Wi-Fi', 'Common Lounge'],
    mapPin: { xPct: 81, yPct: 48, lat: 21.1286, lng: 81.7679, color: '#db2777', badge: 'GH-2' },
    mapZone: { x: 640, y: 170, width: 145, height: 64, color: '#db2777', badge: 'GH-2' },
    gps: '21.1286° N, 81.7679° E',
    description: 'Girls residential hostel block.',
  },
  {
    id: 'academic_block',
    name: 'Academic & Administrative Block',
    shortName: 'Academic Block',
    type: 'Academic & Labs',
    category: 'ACADEMIC',
    wings: ['Main Wing'],
    floors: [
      {
        id: 'G',
        label: 'Ground Floor',
        rooms: [
          'Smart E-Classroom E-101',
          'Lecture Hall LH-1',
          'Lecture Hall LH-2',
          'AICTE IDEA Lab',
          'Estate & Facilities Office',
          'Registrar & Admin Office',
          'Directorate Office',
        ],
      },
      {
        id: '1',
        label: '1st Floor',
        rooms: [
          'Room 131C — Data Centre & Server NOC',
          'Room 131E — Network Operations Center',
          'Smart E-Classroom E-102',
          'Computer Science Lab 1',
          'Data Science & AI Lab',
          'Lecture Hall LH-3',
          'Lecture Hall LH-4',
        ],
      },
      {
        id: '2',
        label: '2nd Floor',
        rooms: [
          'VLSI & Embedded Systems Lab',
          'IoT & Robotics Lab',
          'RF & Microwave Comm. Lab',
          'Faculty Cabins (2nd Floor)',
          'Lecture Hall LH-5',
        ],
      },
      {
        id: '3',
        label: '3rd Floor',
        rooms: [
          'Seminar Hall',
          'PhD Research Scholars Bay',
          'Incubation Cell',
        ],
      },
    ],
    mapPin: { xPct: 46, yPct: 68, lat: 21.1283, lng: 81.7660, color: '#0284c7', badge: 'ACAD' },
    mapZone: { x: 250, y: 235, width: 230, height: 95, color: '#0284c7', badge: 'ACAD' },
    gps: '21.1283° N, 81.7660° E',
    description: 'Main academic complex housing classrooms, CSE/DSAI/ECE labs, Data Centre (131C/131E), and Estate Office.',
  },
  {
    id: 'krc_library',
    name: 'Knowledge Resource Centre (Library)',
    shortName: 'KRC Library',
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
    mapPin: { xPct: 66, yPct: 68, lat: 21.1282, lng: 81.7668, color: '#7c3aed', badge: 'KRC' },
    mapZone: { x: 500, y: 242, width: 120, height: 80, color: '#7c3aed', badge: 'KRC' },
    gps: '21.1282° N, 81.7668° E',
    description: 'Central library, reading halls, and digital resource center.',
  },
  {
    id: 'sac_mph',
    name: 'Student Activity Centre (SAC) & MPH',
    shortName: 'SAC & MPH',
    type: 'Student Center & Auditorium',
    category: 'AMENITY',
    floors: [
      {
        id: 'G',
        label: 'Ground Floor',
        rooms: ['Multi-Purpose Hall (MPH)', 'Indoor Badminton Courts', 'Stage & Audio Room'],
      },
      {
        id: '1',
        label: '1st Floor',
        rooms: ['Student Gymnasium', 'Table Tennis & Indoor Games', 'Club & Music Rooms'],
      },
    ],
    mapPin: { xPct: 22, yPct: 68, lat: 21.1285, lng: 81.7651, color: '#ea580c', badge: 'SAC' },
    mapZone: { x: 95, y: 242, width: 135, height: 80, color: '#ea580c', badge: 'SAC' },
    gps: '21.1285° N, 81.7651° E',
    description: 'Auditorium, indoor sports courts, gymnasium, and student club rooms.',
  },
  {
    id: 'cafeteria_mess',
    name: 'Central Mess, Cafeteria & Dispensary',
    shortName: 'Mess & Canteen',
    type: 'Dining & Utilities',
    category: 'AMENITY',
    floors: [
      {
        id: 'G',
        label: 'Ground Floor',
        rooms: ['Mess Dining Hall 1', 'Canteen / Nescafé', 'Medical Dispensary', 'ATM Kiosk'],
      },
      {
        id: '1',
        label: '1st Floor',
        rooms: ['Mess Dining Hall 2', 'RO Water Filtration Plant'],
      },
    ],
    mapPin: { xPct: 22, yPct: 46, lat: 21.1290, lng: 81.7650, color: '#d97706', badge: 'MESS' },
    mapZone: { x: 95, y: 165, width: 155, height: 60, color: '#d97706', badge: 'MESS' },
    gps: '21.1290° N, 81.7650° E',
    description: 'Student mess halls, canteen, medical dispensary, and ATM.',
  },
  {
    id: 'sports_substation',
    name: 'Sports Complex, Amphitheater & Substation',
    shortName: 'Sports & Grounds',
    type: 'Grounds & Power Grid',
    category: 'INFRASTRUCTURE',
    floors: [
      {
        id: 'G',
        label: 'Outdoor & Utility Grid',
        rooms: [
          'Open-Air Amphitheater',
          'Basketball & Volleyball Courts',
          'Football / Cricket Ground',
          '33/11kV Electrical Substation',
          'Main Gate Security Plaza',
        ],
      },
    ],
    mapPin: { xPct: 48, yPct: 46, lat: 21.1292, lng: 81.7661, color: '#059669', badge: 'GROUND' },
    mapZone: { x: 270, y: 165, width: 330, height: 55, color: '#059669', badge: 'GROUND' },
    gps: '21.1292° N, 81.7661° E',
    description: 'Sports grounds, open-air amphitheater, main gate, and electrical substation.',
  },
];

/**
 * Load user-customized IIIT-NR campus buildings from localStorage, falling back to DEFAULT_IIITNR_BUILDINGS.
 */
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
  } catch (e) {
    console.warn('Failed to parse custom campus map data:', e);
  }
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

// Static exports for backward compatibility
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

  if (!target) {
    return HOSTEL_FLOORS;
  }

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
      { id: 'Common Area', label: 'Corridor / Washroom / Common Utility' },
    ];
  }
  return HOSTEL_WINGS;
}

export function getRoomsForBuilding(buildingNameOrId, floorId = '1', wingId = 'Wing A', customBuildingsList = null) {
  const list = customBuildingsList || getCampusBuildings();
  const target = list.find(
    (b) => b.id === buildingNameOrId || b.name === buildingNameOrId || b.shortName === buildingNameOrId
  );

  if (!target) {
    return generateHostelRoomsForFloor(floorId, 24);
  }

  // If user defined explicit custom rooms list on this building
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
