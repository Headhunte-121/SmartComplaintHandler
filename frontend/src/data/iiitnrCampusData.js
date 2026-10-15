/**
 * SmartComplaintHandler - 1:1 Satellite-Traced IIIT Naya Raipur University-Only Campus Dataset
 * Grounded directly in the 735 x 857 Google Satellite view of IIIT Naya Raipur:
 * - Ramanujan House: Northern courtyard hostel complex at (405, 210) with twin inner courts & path to Sports Complex
 * - Sports Complex: Far north-west indoor sports building at (218, 98) + open sports field (215, 230) connected via path from Ramanujan
 * - Bose House: Southwest outer courtyard hostel quadrangle at (118, 558)
 * - Bhabha House: Southwest inner courtyard hostel quadrangle at (204, 588)
 * - Raman House & Phase-2 West Blocks: Upper-west residential quadrangle at (175, 376) + companion blocks at (112, 392), (152, 442), (95, 448)
 * - Shabri House (Girls Hostel): Eastern courtyard quadrangle at (572, 478) + annex at (612, 492)
 * - Academic & Admin Block: Central spine at (388, 472) with white Rotunda Dome (392, 468), 4 parallel NE/SE wings, North Arc (382, 400), and Long North Wing (382, 338)
 * - Canteen & Central Mess: Circular Canteen Rotunda (332, 542) + Mess Wings (272, 512) & (225, 482) + Block C1 (236, 425)
 * - Multi-Purpose Hall (MPH / SAC): White-roofed auditorium hall at (488, 405)
 * - Central Library (KRC): East academic block at (482, 462)
 * - Faculty & Guest House Cluster: 3 stepped northeast residential blocks at (416, 312), (442, 342), (462, 370)
 * - Amphitheatre 2: Semicircular stepped arena at (472, 598) with NE landscaped terraces
 * - Main Gate & Union Bank ATM: Main Gate arch on Naya Raipur Marg (338, 755), ATM & Security Kiosk (345, 688), and West Gate (22, 642)
 */

export const IIITNR_CAMPUS_STORAGE_KEY = 'iiitnr_custom_campus_map_v6';
export const IIITNR_MAP_UPDATED_EVENT = 'iiitnr-campus-map-updated';

/**
 * Authentic 50-Acre Perimeter Boundary of IIIT Naya Raipur:
 * Derived 1:1 from Google Satellite survey and user demarcation line.
 * Coordinate space: 735 x 857 campus space (viewBox: -55 0 840 857).
 */
export const IIITNR_CAMPUS_PERIMETER_POINTS = '171,25 777,212 556,840 -45,654';

export const IIITNR_CAMPUS_BOUNDARY_CORNERS = [
  { id: 'pillar_nw', x: 171, y: 25, label: 'Northwest Boundary Pillar #1', subtitle: 'North Boundary Wall · Railway Corridor' },
  { id: 'pillar_ne', x: 777, y: 212, label: 'Northeast Boundary Pillar #2', subtitle: 'North Woodland Perimeter Wall' },
  { id: 'pillar_se', x: 556, y: 840, label: 'Southeast Boundary Pillar #3', subtitle: 'Naya Raipur Marg (East Sector Entry)' },
  { id: 'pillar_sw', x: -45, y: 654, label: 'Southwest Boundary Pillar #4', subtitle: 'Naya Raipur Marg & West Avenue Junction' },
];

export const IIITNR_CAMPUS_METADATA = {
  instituteName: 'Dr. SPM IIIT Naya Raipur',
  shortName: 'IIIT Naya Raipur',
  address: 'Plot No. 7, Sector 24, Near Purkhoti Muktangan, Atal Nagar – Nava Raipur, Chhattisgarh 493661',
  latitude: 21.12815,
  longitude: 81.7655,
  campusArea: '50 Acres Official Residential Campus Estate',
  boundaryPerimeter: '2,328 Meters (570m N · 597m E · 564m S · 596m W)',
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

export const DEFAULT_IIITNR_BUILDINGS = [
  {
    id: 'ramanujan_house',
    name: 'Ramanujan House (Boys Hostel)',
    shortName: 'Ramanujan House',
    type: 'North Hostel Complex (Twin Courts)',
    category: 'HOSTEL',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 28,
    roomPrefix: 'Room ',
    customRooms: [],
    trace: {
      cx: 405,
      cy: 210,
      w: 84,
      h: 58,
      angle: -32,
      shape: 'ramanujan_complex',
      color: '#4f46e5',
      badge: 'RAMANUJAN',
    },
    mapPin: { badge: 'RAMANUJAN', color: '#4f46e5' },
    gps: 'Northern Hostel Complex (Path to Sports Complex)',
    description: 'Large northern boys hostel complex with twin inner badminton/sports courts and direct path to the Sports Complex.',
  },
  {
    id: 'bose_house',
    name: 'Bose House (Boys Hostel)',
    shortName: 'Bose House',
    type: 'Southwest Outer Hostel Quadrangle',
    category: 'HOSTEL',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    trace: {
      cx: 118,
      cy: 558,
      w: 60,
      h: 56,
      angle: 18,
      shape: 'courtyard_quad',
      color: '#4f46e5',
      badge: 'BOSE',
    },
    mapPin: { badge: 'BOSE', color: '#4f46e5' },
    gps: 'Southwest Outer Quadrangle',
    description: 'Boys hostel quadrangle with open central courtyard along the western avenue.',
  },
  {
    id: 'bhabha_house',
    name: 'Bhabha House (Boys Hostel)',
    shortName: 'Bhabha House',
    type: 'Southwest Inner Hostel Quadrangle',
    category: 'HOSTEL',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    trace: {
      cx: 204,
      cy: 588,
      w: 54,
      h: 50,
      angle: 18,
      shape: 'courtyard_quad',
      color: '#4f46e5',
      badge: 'BHABHA',
    },
    mapPin: { badge: 'BHABHA', color: '#4f46e5' },
    gps: 'Southwest Inner Quadrangle',
    description: 'Courtyard hostel block east of the inner western spine road.',
  },
  {
    id: 'raman_house',
    name: 'Raman House & West Residential Blocks',
    shortName: 'Raman House',
    type: 'Upper-West Hostel Cluster (Phase 2)',
    category: 'HOSTEL',
    wings: ['Wing A', 'Wing B', 'West Annex'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    trace: {
      cx: 155,
      cy: 405,
      w: 85,
      h: 75,
      angle: 18,
      shape: 'west_hostel_cluster',
      color: '#6366f1',
      badge: 'RAMAN',
    },
    mapPin: { badge: 'RAMAN', color: '#6366f1' },
    gps: 'Upper-West Residential Cluster',
    description: 'Upper-west courtyard hostel and adjacent residential blocks along the western avenue.',
  },
  {
    id: 'shabhari_house',
    name: 'Shabri House (Girls Hostel)',
    shortName: 'Shabri House',
    type: 'East Girls Hostel Quadrangle',
    category: 'HOSTEL',
    wings: ['Wing A', 'Wing B', 'East Annex'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: [],
    trace: {
      cx: 572,
      cy: 478,
      w: 60,
      h: 56,
      angle: 18,
      shape: 'shabri_quad',
      color: '#db2777',
      badge: 'SHABRI',
    },
    mapPin: { badge: 'SHABRI', color: '#db2777' },
    gps: 'East Residential Quadrangle',
    description: 'Girls hostel quadrangle with central courtyard and eastern annex block.',
  },
  {
    id: 'transit_hostel',
    name: 'Faculty Quarters & Guest House',
    shortName: 'Faculty & Guest',
    type: 'Northeast Residential Enclave',
    category: 'HOSTEL',
    wings: ['Block 1', 'Block 2', 'Block 3', 'North Wing'],
    floors: ['G', '1', '2'],
    roomsPerFloor: 12,
    roomPrefix: 'Suite ',
    customRooms: [],
    trace: {
      cx: 432,
      cy: 340,
      w: 84,
      h: 72,
      angle: -32,
      shape: 'faculty_cluster',
      color: '#0d9488',
      badge: 'FACULTY',
    },
    mapPin: { badge: 'FACULTY', color: '#0d9488' },
    gps: 'Northeast Residential Enclave',
    description: 'Three stepped faculty/guest residential blocks and the long north wing along the central lawn.',
  },
  {
    id: 'academic_block',
    name: 'Academic & Administrative Complex',
    shortName: 'Academic & Admin',
    type: 'Main Dome, E-Wings & Labs',
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
      cx: 400,
      cy: 472,
      w: 105,
      h: 110,
      angle: -32,
      shape: 'academic_complex',
      color: '#0284c7',
      badge: 'ACAD',
    },
    mapPin: { badge: 'ACAD', color: '#0284c7' },
    gps: 'Central Dome & Multi-Wing Complex',
    description: 'Main academic & administrative complex with central white rotunda dome, 4 NE/SE parallel wings, and north gallery arc.',
  },
  {
    id: 'krc_library',
    name: 'Central Library (KRC) & East Academic Wing',
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
    trace: {
      cx: 482,
      cy: 462,
      w: 44,
      h: 38,
      angle: -32,
      shape: 'hall',
      color: '#7c3aed',
      badge: 'KRC',
    },
    mapPin: { badge: 'KRC', color: '#7c3aed' },
    gps: 'East Academic Block',
    description: 'Central library and knowledge resource block.',
  },
  {
    id: 'sac_mph',
    name: 'Multi-Purpose Hall (MPH) & SAC',
    shortName: 'MPH Auditorium',
    type: 'White-Roof Auditorium Hall',
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
      cy: 405,
      w: 50,
      h: 34,
      angle: -32,
      shape: 'hall',
      color: '#ea580c',
      badge: 'MPH',
    },
    mapPin: { badge: 'MPH', color: '#ea580c' },
    gps: 'Northeast White-Roof Hall',
    description: 'Multi-Purpose Hall auditorium and Student Activity Center.',
  },
  {
    id: 'cafeteria_mess',
    name: 'Canteen Rotunda & Central Mess Complex',
    shortName: 'Canteen & Mess',
    type: 'Circular Canteen & Mess Blocks',
    category: 'AMENITY',
    floors: [
      {
        id: 'G',
        label: 'Ground Floor',
        rooms: ['Circular Canteen Rotunda', 'Central Mess Dining Hall 1', 'Mess Block N', 'Outdoor Red Court', 'Medical Dispensary'],
      },
      {
        id: '1',
        label: '1st Floor',
        rooms: ['Central Mess Dining Hall 2', 'RO Water Filtration Plant'],
      },
    ],
    trace: {
      cx: 272,
      cy: 505,
      w: 115,
      h: 85,
      angle: 18,
      shape: 'canteen_mess',
      color: '#d97706',
      badge: 'CANTEEN',
    },
    mapPin: { badge: 'CANTEEN', color: '#d97706' },
    gps: 'Central Canteen Rotunda & Mess Wings',
    description: 'Circular Canteen rotunda at (332, 542) and connected dining/mess buildings.',
  },
  {
    id: 'amphitheatre',
    name: 'Open-Air Amphitheatre 2',
    shortName: 'Amphitheatre 2',
    type: 'Stepped Arena & Terraces',
    category: 'AMENITY',
    floors: [
      {
        id: 'G',
        label: 'Arena & Stage',
        rooms: ['Amphitheatre Stage', 'Stepped Seating Tiers', 'Landscaped NE Terraces', 'Stage Lighting Tower'],
      },
    ],
    trace: {
      cx: 472,
      cy: 598,
      w: 76,
      h: 68,
      angle: 35,
      shape: 'amphitheatre',
      color: '#10b981',
      badge: 'AMPHI',
    },
    mapPin: { badge: 'AMPHI', color: '#10b981' },
    gps: 'Southeast Stepped Arena',
    description: 'Semicircular stepped open-air amphitheater with landscaped northeast terraces.',
  },
  {
    id: 'sports_ground',
    name: 'Sports Complex & Athletic Grounds',
    shortName: 'Sports Complex',
    type: 'North-West Indoor Hall & Grounds',
    category: 'INFRASTRUCTURE',
    floors: [
      {
        id: 'G',
        label: 'Sports Complex & Grounds',
        rooms: ['North-West Indoor Sports Complex', 'Path to Ramanujan House', 'Open Football & Cricket Ground', 'Central Green Turf', 'Outdoor Courts'],
      },
    ],
    trace: {
      cx: 218,
      cy: 98,
      w: 38,
      h: 64,
      angle: 18,
      shape: 'sports_hall',
      color: '#059669',
      badge: 'SPORTS',
    },
    mapPin: { badge: 'SPORTS', color: '#059669' },
    gps: 'Far North-West Sports Complex',
    description: 'Indoor Sports Complex at the northern end of the western avenue, connected by a direct path to Ramanujan House.',
  },
  {
    id: 'main_gate',
    name: 'Main Gate Arch, Guard Plaza & Union Bank ATM',
    shortName: 'Main Gate & ATM',
    type: 'Highway Entrance & ATM',
    category: 'INFRASTRUCTURE',
    floors: [
      {
        id: 'G',
        label: 'Gate & ATM Zone',
        rooms: ['Main Entrance Gate Arch (Naya Raipur Marg)', 'Union Bank of India ATM Building', 'West Gate Guardhouse', '33/11kV Substation'],
      },
    ],
    trace: {
      cx: 342,
      cy: 725,
      w: 44,
      h: 75,
      angle: 18,
      shape: 'gate_and_atm',
      color: '#38bdf8',
      badge: 'GATE',
    },
    mapPin: { badge: 'GATE', color: '#38bdf8' },
    gps: 'Naya Raipur Marg Entrance',
    description: 'Main campus entrance gate on Naya Raipur Marg (338, 755) and Union Bank of India ATM building (345, 688).',
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
