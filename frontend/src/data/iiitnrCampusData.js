/**
 * SmartComplaintHandler - Satellite-Traced IIIT Naya Raipur University-Only Campus Dataset
 * Every building position, footprint dimension, rotation angle, and internal road is traced 1:1
 * from the Google Satellite imagery of IIIT Naya Raipur (735 x 857 campus coordinate space).
 * Zero outside farmland or external OSM tiles are shown.
 */

export const IIITNR_CAMPUS_STORAGE_KEY = 'iiitnr_custom_campus_map_v3';
export const IIITNR_MAP_UPDATED_EVENT = 'iiitnr-campus-map-updated';

export const IIITNR_CAMPUS_METADATA = {
  instituteName: 'Dr. SPM IIIT Naya Raipur',
  shortName: 'IIIT Naya Raipur',
  address: 'Plot No. 7, Sector 24, Near Purkhoti Muktangan, Atal Nagar – Nava Raipur, Chhattisgarh 493661',
  latitude: 21.12815,
  longitude: 81.7655,
  campusArea: '50 Acres Residential Campus',
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
  'Badminton Courtyard',
  'Staircase & Corridor Lighting',
  'Wi-Fi Ceiling Access Point',
  'Washing Machine / Laundry Area',
];

/**
 * Exact 1:1 satellite-traced buildings in IIIT Naya Raipur (735 x 857 campus coordinate system).
 * `footprint` defines the exact architectural shape traced from Google Satellite view:
 *   - 'courtyard_quad': Square residential quadrangle with inner open courtyard
 *   - 'academic_complex': Iconic central rotunda dome + symmetrical multi-wing academic/lab blocks
 *   - 'canteen_mess': Circular Canteen rotunda + rectangular Mess dining hall
 *   - 'amphitheatre': Concentric fan-shaped stepped open-air arena
 *   - 'twin_courts': Walled rectangular complex with twin red & green sports courts
 *   - 'twin_wings': Parallel winged residential blocks
 *   - 'faculty_cluster': 3 stepped residential blocks
 *   - 'hall': Large rectangular auditorium / library / sports hall
 */
export const DEFAULT_IIITNR_BUILDINGS = [
  {
    id: 'ramanujan_house',
    name: 'Ramanujan House (Boys Hostel)',
    shortName: 'Ramanujan House',
    type: 'Boys Residential Quadrangle',
    category: 'HOSTEL',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    trace: {
      cx: 118,
      cy: 558,
      w: 66,
      h: 62,
      angle: 18,
      shape: 'courtyard_quad',
      color: '#4f46e5',
      badge: 'BH-1',
    },
    mapPin: { xPct: 16.1, yPct: 65.1, badge: 'BH-1', color: '#4f46e5' },
    gps: 'Southwest Hostel Quadrangle',
    description: 'Boys hostel quadrangle with central open badminton courtyard.',
  },
  {
    id: 'bhabha_house',
    name: 'Bhabha House (Boys Hostel)',
    shortName: 'Bhabha House',
    type: 'Boys Residential Quadrangle',
    category: 'HOSTEL',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    trace: {
      cx: 204,
      cy: 588,
      w: 60,
      h: 56,
      angle: 18,
      shape: 'courtyard_quad',
      color: '#4f46e5',
      badge: 'BH-2',
    },
    mapPin: { xPct: 27.8, yPct: 68.6, badge: 'BH-2', color: '#4f46e5' },
    gps: 'South-Central Hostel Quadrangle',
    description: 'Courtyard hostel block east of the inner hostel spine road.',
  },
  {
    id: 'bose_house',
    name: 'Bose House (Boys Hostel)',
    shortName: 'Bose House',
    type: 'Boys Residential Wing',
    category: 'HOSTEL',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    trace: {
      cx: 132,
      cy: 432,
      w: 68,
      h: 54,
      angle: 18,
      shape: 'twin_wings',
      color: '#4f46e5',
      badge: 'BH-3',
    },
    mapPin: { xPct: 18.0, yPct: 50.4, badge: 'BH-3', color: '#4f46e5' },
    gps: 'Mid-West Residential Blocks',
    description: 'Twin residential hostel wings along the western campus avenue.',
  },
  {
    id: 'raman_house',
    name: 'Raman House (Hostel Block)',
    shortName: 'Raman House',
    type: 'Phase-2 Residential Quadrangle',
    category: 'HOSTEL',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    trace: {
      cx: 175,
      cy: 376,
      w: 54,
      h: 50,
      angle: 18,
      shape: 'courtyard_quad',
      color: '#6366f1',
      badge: 'RH-1',
    },
    mapPin: { xPct: 23.8, yPct: 43.9, badge: 'RH-1', color: '#6366f1' },
    gps: 'Upper-West Hostel Block',
    description: 'Residential quadrangle at the northern end of the western hostel avenue.',
  },
  {
    id: 'shabhari_house',
    name: 'Shabri House (Girls Hostel)',
    shortName: 'Shabri House',
    type: 'Girls Residential Quadrangle',
    category: 'HOSTEL',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    trace: {
      cx: 572,
      cy: 478,
      w: 66,
      h: 62,
      angle: 18,
      shape: 'courtyard_quad',
      color: '#db2777',
      badge: 'GH-1',
    },
    mapPin: { xPct: 77.8, yPct: 55.8, badge: 'GH-1', color: '#db2777' },
    gps: 'East Residential Quadrangle',
    description: 'Enclosed girls hostel quadrangle with central courtyard on the eastern loop.',
  },
  {
    id: 'transit_hostel',
    name: 'Faculty Quarters & Guest House',
    shortName: 'Faculty & Guest House',
    type: 'Residential Enclave',
    category: 'HOSTEL',
    wings: ['Block A', 'Block B', 'Guest Suites'],
    floors: ['G', '1', '2'],
    roomsPerFloor: 12,
    roomPrefix: 'Suite ',
    customRooms: [],
    trace: {
      cx: 432,
      cy: 338,
      w: 76,
      h: 64,
      angle: -32,
      shape: 'faculty_cluster',
      color: '#0d9488',
      badge: 'FAC',
    },
    mapPin: { xPct: 58.8, yPct: 39.4, badge: 'FAC', color: '#0d9488' },
    gps: 'Northeast Residential Enclave',
    description: 'Visiting faculty transit suites and staff residential cluster.',
  },
  {
    id: 'academic_block',
    name: 'Academic & Administrative Block',
    shortName: 'Academic Block',
    type: 'Main Institute Building & Labs',
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
    trace: {
      cx: 395,
      cy: 472,
      w: 112,
      h: 96,
      angle: -32,
      shape: 'academic_complex',
      color: '#0284c7',
      badge: 'ACAD',
    },
    mapPin: { xPct: 53.7, yPct: 55.1, badge: 'ACAD', color: '#0284c7' },
    gps: 'Central Rotunda & Wings',
    description: 'Main academic complex with central rotunda dome, lecture halls, and 17 research labs.',
  },
  {
    id: 'krc_library',
    name: 'Central Library & Knowledge Center (KRC)',
    shortName: 'Library (KRC)',
    type: 'Library & Digital Wing',
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
    trace: {
      cx: 484,
      cy: 462,
      w: 52,
      h: 42,
      angle: -32,
      shape: 'hall',
      color: '#7c3aed',
      badge: 'KRC',
    },
    mapPin: { xPct: 65.8, yPct: 53.9, badge: 'KRC', color: '#7c3aed' },
    gps: 'East Academic Wing',
    description: 'Central library, reading rooms, and digital resource center.',
  },
  {
    id: 'sac_mph',
    name: 'Multi-Purpose Hall (MPH) & SAC',
    shortName: 'MPH & SAC Hall',
    type: 'Auditorium & Indoor Sports',
    category: 'AMENITY',
    floors: [
      {
        id: 'G',
        label: 'Ground Floor',
        rooms: ['Multi-Purpose Hall (MPH) Auditorium', 'Indoor Badminton Courts', 'Stage & Audio Control Room', 'Student Gymnasium', 'SAC Club Rooms'],
      },
    ],
    trace: {
      cx: 488,
      cy: 400,
      w: 56,
      h: 38,
      angle: -32,
      shape: 'hall',
      color: '#ea580c',
      badge: 'MPH',
    },
    mapPin: { xPct: 66.4, yPct: 46.7, badge: 'MPH', color: '#ea580c' },
    gps: 'Northeast Auditorium Hall',
    description: 'White-roofed Multi-Purpose Hall auditorium and Student Activity Center.',
  },
  {
    id: 'cafeteria_mess',
    name: 'Canteen Rotunda & Central Mess Block',
    shortName: 'Canteen & Mess',
    type: 'Dining & Canteen Complex',
    category: 'AMENITY',
    floors: [
      {
        id: 'G',
        label: 'Ground Floor',
        rooms: ['Canteen Rotunda', 'Central Mess Dining Hall 1', 'Night Canteen', 'Medical Dispensary'],
      },
      {
        id: '1',
        label: '1st Floor',
        rooms: ['Central Mess Dining Hall 2', 'RO Water Filtration Plant'],
      },
    ],
    trace: {
      cx: 280,
      cy: 520,
      w: 98,
      h: 58,
      angle: 18,
      shape: 'canteen_mess',
      color: '#d97706',
      badge: 'MESS',
    },
    mapPin: { xPct: 38.1, yPct: 60.7, badge: 'MESS', color: '#d97706' },
    gps: 'Central Canteen Rotunda & Mess',
    description: 'Circular Canteen rotunda and connected student mess dining blocks.',
  },
  {
    id: 'amphitheatre',
    name: 'Open-Air Amphitheatre 2',
    shortName: 'Amphitheatre 2',
    type: 'Stepped Cultural Arena',
    category: 'AMENITY',
    floors: [
      {
        id: 'G',
        label: 'Arena & Stage',
        rooms: ['Amphitheatre Stage', 'Stepped Seating Tiers', 'Stage Lighting & Sound Tower', 'Green Room'],
      },
    ],
    trace: {
      cx: 475,
      cy: 595,
      w: 84,
      h: 74,
      angle: 35,
      shape: 'amphitheatre',
      color: '#10b981',
      badge: 'AMPHI',
    },
    mapPin: { xPct: 64.6, yPct: 69.4, badge: 'AMPHI', color: '#10b981' },
    gps: 'Southeast Stepped Arena',
    description: 'Semicircular stepped open-air amphitheater facing the southeastern woodland.',
  },
  {
    id: 'sports_ground',
    name: 'North Sports Complex & Courts',
    shortName: 'Sports Complex',
    type: 'Courts, Turf & Indoor Hall',
    category: 'INFRASTRUCTURE',
    floors: [
      {
        id: 'G',
        label: 'Outdoor & Indoor Courts',
        rooms: ['Twin Basketball / Tennis Courts (North)', 'Main Football & Cricket Turf', 'Volleyball Courts', 'North Indoor Sports Hall', 'Open-Air Gym'],
      },
    ],
    trace: {
      cx: 405,
      cy: 205,
      w: 92,
      h: 66,
      angle: -32,
      shape: 'twin_courts',
      color: '#059669',
      badge: 'SPORTS',
    },
    mapPin: { xPct: 55.1, yPct: 23.9, badge: 'SPORTS', color: '#059669' },
    gps: 'Northern Sports Complex',
    description: 'Walled sports complex with twin courts, central green football turf, and north indoor hall.',
  },
  {
    id: 'main_gate',
    name: 'Main Gate, Security Plaza & Union Bank ATM',
    shortName: 'Main Gate & ATM',
    type: 'Campus Entrance & ATM',
    category: 'INFRASTRUCTURE',
    floors: [
      {
        id: 'G',
        label: 'Entrance Zone',
        rooms: ['Union Bank of India ATM', 'Main Gate Security Cabin', 'Visitor Waiting Lounge', '33/11kV Electrical Substation'],
      },
    ],
    trace: {
      cx: 348,
      cy: 692,
      w: 58,
      h: 42,
      angle: 18,
      shape: 'hall',
      color: '#475569',
      badge: 'GATE',
    },
    mapPin: { xPct: 47.3, yPct: 80.7, badge: 'GATE', color: '#475569' },
    gps: 'South Entrance on Naya Raipur Marg',
    description: 'Main campus entrance gate, security plaza, and Union Bank of India ATM.',
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
