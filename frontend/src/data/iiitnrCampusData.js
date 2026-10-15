/**
 * SmartComplaintHandler - IIIT Naya Raipur Interactive Campus Digital Twin Dataset
 *
 * Pure vector 1:1 satellite-proportioned Digital Twin (735 x 857 coordinate space) covering:
 * - Hostels: Ramanujan House (with Twin Inner Courts), Bose House (with Inner Green Court),
 *   Bhabha House (with Inner Green Court), Raman House & Phase-2 West Cluster (4 blocks + D-Lawn),
 *   Shabri House (with Twin Inner Courts + East Annex), Faculty Quarters & Guest House (3 NE blocks + Long North Wing)
 * - Academic & Admin: Academic & Admin Complex (Central White Dome, NW-SE Spine, 4 Parallel NE/SE Lab Wings,
 *   North Arc, Teardrop Roundabout), Central Library (KRC), Multi-Purpose Hall (MPH / SAC)
 * - Sports, Grounds & Courts:
 *   - Sports Complex (Far NW Indoor Arena + North Athletics/Cricket Field + Diagonal Footpath to Ramanujan)
 *   - Football Ground (FG - Central Manicured Football Pitch + Spectator Track + Pavilion Wing)
 *   - Outdoor Sports Courts (West Twin Red Courts near Mess/Bhabha + Academic North Green Court + Hostel Courts)
 * - Amphitheatres & Dining:
 *   - Old Amphitheatre (Central Open-Air Theatre & Acoustic Bowl near Canteen Rotunda / Academic North)
 *   - New Amphitheatre / Amphitheatre 2 (Southeast Concentric Stepped Arena + Stage + 3 NE Landscaped Terraces)
 *   - Canteen Rotunda, Central Mess Wings, Auditorium Hall & Block C1
 * - Gates & Infrastructure:
 *   - Main Gate No. 1 Arch on Naya Raipur Marg (338, 755), Union Bank of India ATM & Security Kiosk (345, 688),
 *     Central Crossroads Plinth (358, 582), and West Gate No. 2 (22, 642)
 */

export const IIITNR_CAMPUS_STORAGE_KEY = 'iiitnr_custom_campus_map_v7_twin';
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
  campusArea: '50 Acres Residential Digital Twin',
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
  { id: 'Common Area', label: 'Corridor / Washroom / Court / Utility' },
];

export const HOSTEL_COMMON_ZONES = [
  'Corridor RO Water Cooler',
  'Washroom & Shower Block',
  'Common Room / TV Lounge',
  'Inner Courtyard Sports Court',
  'Staircase & Corridor Lighting',
  'Wi-Fi Ceiling Access Point',
  'Washing Machine / Laundry Area',
];

export const DEFAULT_IIITNR_BUILDINGS = [
  {
    id: 'ramanujan_house',
    name: 'Ramanujan House (Boys Hostel)',
    shortName: 'Ramanujan House',
    type: 'North Hostel Complex & Twin Courts',
    category: 'HOSTEL',
    wings: ['Wing A (NW)', 'Wing B (SW)', 'Sawtooth East Wing', 'Twin Inner Courts'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 28,
    roomPrefix: 'Room ',
    customRooms: [
      'Ramanujan West Green Court (Badminton/Volleyball)',
      'Ramanujan East Red Court (Basketball/Badminton)',
      'Path to Sports Complex Entrance',
    ],
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
    gps: 'Northern Hostel Complex (405, 210)',
    description:
      'Large northern boys hostel enclosed by a loop road, featuring sawtooth eastern residential fingers, twin red & green inner sports courts, and the direct diagonal footpath to the Sports Complex.',
  },
  {
    id: 'bose_house',
    name: 'Bose House (Boys Hostel)',
    shortName: 'Bose House',
    type: 'Southwest Outer Hostel Quadrangle',
    category: 'HOSTEL',
    wings: ['Wing A', 'Wing B', 'Inner Green Court'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: ['Bose Inner Green Badminton Court', 'Bose Courtyard Lawn'],
    trace: {
      cx: 115,
      cy: 560,
      w: 64,
      h: 56,
      angle: 18,
      shape: 'courtyard_quad',
      color: '#4f46e5',
      badge: 'BOSE',
    },
    mapPin: { badge: 'BOSE', color: '#4f46e5' },
    gps: 'Southwest Outer Quadrangle (115, 560)',
    description:
      'Boys hostel quadrangle along the western boundary avenue with a synthetic green sports court in its central courtyard.',
  },
  {
    id: 'bhabha_house',
    name: 'Bhabha House (Boys Hostel)',
    shortName: 'Bhabha House',
    type: 'Southwest Inner Hostel Quadrangle',
    category: 'HOSTEL',
    wings: ['Wing A', 'Wing B', 'Inner Green Court'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: ['Bhabha Inner Courtyard Court', 'North Red Outdoor Courts Access'],
    trace: {
      cx: 200,
      cy: 585,
      w: 54,
      h: 52,
      angle: 18,
      shape: 'courtyard_quad',
      color: '#4f46e5',
      badge: 'BHABHA',
    },
    mapPin: { badge: 'BHABHA', color: '#4f46e5' },
    gps: 'Southwest Inner Quadrangle (200, 585)',
    description:
      'Courtyard hostel quadrangle east of the inner hostel spine road, bordered by the South Lawn and Twin Red Outdoor Courts.',
  },
  {
    id: 'raman_house',
    name: 'Raman House & Phase-2 West Cluster',
    shortName: 'Raman House',
    type: 'Upper-West Hostel Cluster (4 Blocks)',
    category: 'HOSTEL',
    wings: ['Main Quad (176,376)', 'West Block (108,392)', 'South Wing (148,438)', 'West Annex (92,445)'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: ['D-Shaped Courtyard Lawn', 'Phase-2 West Garden Path'],
    trace: {
      cx: 155,
      cy: 405,
      w: 88,
      h: 78,
      angle: 18,
      shape: 'west_hostel_cluster',
      color: '#6366f1',
      badge: 'RAMAN',
    },
    mapPin: { badge: 'RAMAN', color: '#6366f1' },
    gps: 'Upper-West Residential Cluster (155, 405)',
    description:
      'Four-block upper-west residential cluster featuring the main courtyard quad, D-shaped central lawn, and stepped southern/western residential blocks.',
  },
  {
    id: 'shabhari_house',
    name: 'Shabri House (Girls Hostel)',
    shortName: 'Shabri House',
    type: 'East Girls Hostel & Twin Courts',
    category: 'HOSTEL',
    wings: ['Wing A (West)', 'Wing B (East)', 'East Annex Block', 'Twin Inner Courts'],
    floors: ['G', '1', '2', '3'],
    roomsPerFloor: 24,
    roomPrefix: 'Room ',
    customRooms: ['Shabri West Blue Court', 'Shabri East Terracotta Court', 'East Annex Wing'],
    trace: {
      cx: 572,
      cy: 475,
      w: 60,
      h: 54,
      angle: 18,
      shape: 'shabri_quad',
      color: '#db2777',
      badge: 'SHABRI',
    },
    mapPin: { badge: 'SHABRI', color: '#db2777' },
    gps: 'East Residential Quadrangle (572, 475)',
    description:
      'Eastern girls hostel quadrangle featuring twin blue and terracotta inner courtyard courts plus the detached eastern annex wing.',
  },
  {
    id: 'transit_hostel',
    name: 'Faculty Quarters, Guest House & North Wing',
    shortName: 'Faculty & Guest',
    type: '3 NE Residential Blocks & Pavilion Wing',
    category: 'HOSTEL',
    wings: ['Faculty Block 1 (North)', 'Faculty Block 2 (Mid)', 'Faculty Block 3 (South)', 'Long North Pavilion Wing'],
    floors: ['G', '1', '2'],
    roomsPerFloor: 12,
    roomPrefix: 'Suite ',
    customRooms: ['Visiting Faculty Transit Suites', 'Director Residence', 'Solar Parking Shed'],
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
    gps: 'Northeast Residential Enclave (432, 340)',
    description:
      'Three stepped cruciform faculty/guest residential blocks along the northeast avenue plus the long north wing bordering the Football Ground.',
  },
  {
    id: 'academic_block',
    name: 'Academic & Administrative Complex',
    shortName: 'Academic & Admin',
    type: 'Rotunda Dome, Spine & 4 Lab Wings',
    category: 'ACADEMIC',
    floors: [
      {
        id: 'G',
        label: 'Ground Floor',
        rooms: [
          'Central Rotunda Atrium & Reception',
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
    gps: 'Central Dome & 4 Parallel Wings (392, 468)',
    description:
      'Main academic and administrative complex with the central white Rotunda Dome, NW–SE spine, 4 parallel NE/SE department & lab wings, North Arc, and Teardrop Roundabout.',
  },
  {
    id: 'krc_library',
    name: 'Central Library (KRC) & East Wing',
    shortName: 'Library (KRC)',
    type: 'Knowledge Resource Centre',
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
        rooms: ['Digital Library & IEEE Terminal Bay', 'Reference Section', 'Discussion Room GD-1', 'Discussion Room GD-2'],
      },
    ],
    trace: {
      cx: 478,
      cy: 458,
      w: 44,
      h: 38,
      angle: -32,
      shape: 'krc_hall',
      color: '#7c3aed',
      badge: 'KRC',
    },
    mapPin: { badge: 'KRC', color: '#7c3aed' },
    gps: 'East Academic Block (478, 458)',
    description: 'L-shaped Central Library (Knowledge Resource Centre) between the Academic wings and Shabri House.',
  },
  {
    id: 'sac_mph',
    name: 'Multi-Purpose Hall (MPH) & SAC',
    shortName: 'MPH Auditorium',
    type: 'Auditorium & Student Activity Center',
    category: 'AMENITY',
    floors: [
      {
        id: 'G',
        label: 'Ground Floor',
        rooms: [
          'Multi-Purpose Hall (MPH) Main Stage',
          'Indoor Wooden Badminton Courts 1 & 2',
          'Central Student Gymnasium',
          'Table Tennis & Chess Arena',
          'Music & Coding Club Rooms',
        ],
      },
    ],
    trace: {
      cx: 488,
      cy: 402,
      w: 48,
      h: 38,
      angle: -32,
      shape: 'mph_hall',
      color: '#ea580c',
      badge: 'MPH',
    },
    mapPin: { badge: 'MPH', color: '#ea580c' },
    gps: 'Northeast White-Roof Auditorium (488, 402)',
    description: 'White-roofed Multi-Purpose Hall auditorium and Student Activity Centre along the northeastern loop road.',
  },
  {
    id: 'football_ground',
    name: 'Main Football Ground (FG) & Central Turf',
    shortName: 'Football Ground (FG)',
    type: 'Full-Size Football Pitch & Track',
    category: 'INFRASTRUCTURE',
    floors: [
      {
        id: 'G',
        label: 'Pitch & Perimeter',
        rooms: [
          'Main Football Turf Pitch (FG)',
          'North Goalpost & Penalty Box',
          'South Goalpost & Curved Spectator Track',
          'East Pavilion Gallery Sideline',
          'Floodlight Towers (FG-1 to FG-4)',
        ],
      },
    ],
    trace: {
      cx: 314,
      cy: 348,
      w: 118,
      h: 88,
      angle: -32,
      shape: 'football_ground',
      color: '#16a34a',
      badge: 'FG',
    },
    mapPin: { badge: 'FG', color: '#16a34a' },
    gps: 'Central-North Main Turf (314, 348)',
    description:
      'Main campus Football Ground (FG) bounded by the tree-lined northern avenue, the Long North Pavilion Wing, and the curved southern spectator track.',
  },
  {
    id: 'sports_ground',
    name: 'Sports Complex & North Athletics Field',
    shortName: 'Sports Complex',
    type: 'NW Indoor Sports Arena & Field',
    category: 'INFRASTRUCTURE',
    floors: [
      {
        id: 'G',
        label: 'Indoor Arena & Field',
        rooms: [
          'Indoor Sports Complex Main Hall',
          'West Warm-Up & Gym Bay',
          'Diagonal Footpath to Ramanujan House',
          'North Cricket & Athletics Ground',
          'Sports Equipment Store & Changing Rooms',
        ],
      },
    ],
    trace: {
      cx: 208,
      cy: 94,
      w: 38,
      h: 62,
      angle: 18,
      shape: 'sports_hall',
      color: '#059669',
      badge: 'SPORTS',
    },
    mapPin: { badge: 'SPORTS', color: '#059669' },
    gps: 'Far North-West Indoor Hall (208, 94)',
    description:
      'Far north-west indoor sports stadium hall connected directly to Ramanujan House via the diagonal footpath across the north sports ground.',
  },
  {
    id: 'outdoor_courts',
    name: 'Outdoor Sports Courts (Red & Green Courts)',
    shortName: 'Outdoor Courts',
    type: 'Basketball, Volleyball & Badminton Courts',
    category: 'INFRASTRUCTURE',
    floors: [
      {
        id: 'G',
        label: 'Outdoor Courts',
        rooms: [
          'West Red Outdoor Court 1 (Basketball)',
          'West Red Outdoor Court 2 (Volleyball / Tennis)',
          'Academic North Green Court (Badminton / Basketball)',
          'Court Floodlights & Perimeter Fencing',
        ],
      },
    ],
    trace: {
      cx: 188,
      cy: 526,
      w: 28,
      h: 28,
      angle: 18,
      shape: 'outdoor_courts',
      color: '#dc2626',
      badge: 'COURTS',
    },
    mapPin: { badge: 'COURTS', color: '#dc2626' },
    gps: 'West Red Courts (188, 526) & Acad Green Court (406, 392)',
    description:
      'Synthetic outdoor sports courts including the twin red courts between the Hostel Spine and Mess and the green court north of the Academic Block.',
  },
  {
    id: 'old_amphitheatre',
    name: 'Old Amphitheatre & Open-Air Plaza',
    shortName: 'Old Amphitheatre',
    type: 'Central Stepped OAT & Acoustic Bowl',
    category: 'AMENITY',
    floors: [
      {
        id: 'G',
        label: 'Stage & Stepped Bowl',
        rooms: [
          'Old Amphitheatre Central Circular Stage (328, 542)',
          'Semicircular Stepped Seating Tiers',
          'Academic North Acoustic Bowl (372, 392)',
          'Canteen-Amphitheatre Promenade',
        ],
      },
    ],
    trace: {
      cx: 332,
      cy: 542,
      w: 44,
      h: 42,
      angle: -32,
      shape: 'old_amphitheatre',
      color: '#f59e0b',
      badge: 'OLD-AMPHI',
    },
    mapPin: { badge: 'OLD-AMPHI', color: '#f59e0b' },
    gps: 'Central Canteen Plaza (332, 542) & North Bowl (372, 392)',
    description:
      'Original campus open-air amphitheatre with semicircular stepped seating wrapping around the Canteen Rotunda plaza and the north academic bowl.',
  },
  {
    id: 'amphitheatre',
    name: 'New Amphitheatre (Amphitheatre 2)',
    shortName: 'New Amphitheatre',
    type: 'SE Grand Stepped Arena & NE Terraces',
    category: 'AMENITY',
    floors: [
      {
        id: 'G',
        label: 'Grand Arena & Terraces',
        rooms: [
          'New Amphitheatre Circular Stage Lawn (458, 582)',
          '7-Tier Concentric Stone Seating Bowl',
          'Northwest Terracotta Stage Ramp',
          '3 Curved Northeast Landscaped Terraces',
          'West Amphitheatre Parking Bay',
        ],
      },
    ],
    trace: {
      cx: 468,
      cy: 595,
      w: 78,
      h: 70,
      angle: 35,
      shape: 'amphitheatre',
      color: '#10b981',
      badge: 'NEW-AMPHI',
    },
    mapPin: { badge: 'NEW-AMPHI', color: '#10b981' },
    gps: 'Southeast Stepped Arena (468, 595)',
    description:
      'Large southeastern semicircular stepped amphitheatre (Amphitheatre 2) with 7 concentric stone seating tiers, stage lawn, NW ramp, and 3 curved NE landscaped terraces.',
  },
  {
    id: 'cafeteria_mess',
    name: 'Canteen Rotunda, Central Mess & Auditorium',
    shortName: 'Canteen & Mess',
    type: 'Dining Wings, Auditorium & Block C1',
    category: 'AMENITY',
    floors: [
      {
        id: 'G',
        label: 'Ground Floor',
        rooms: [
          'Circular Canteen Rotunda',
          'Central Mess South Dining Wing',
          'Central Mess North Wing',
          'Central Auditorium Hall (274, 472)',
          'Block C1 & Maintenance Substation (232, 424)',
          'Medical Dispensary & Ambulance Bay',
        ],
      },
      {
        id: '1',
        label: '1st Floor',
        rooms: ['Central Mess Upper Dining Hall', 'RO Water Filtration & Kitchen Plant'],
      },
    ],
    trace: {
      cx: 268,
      cy: 495,
      w: 96,
      h: 82,
      angle: 18,
      shape: 'canteen_mess',
      color: '#d97706',
      badge: 'CANTEEN',
    },
    mapPin: { badge: 'CANTEEN', color: '#d97706' },
    gps: 'Central Mess Wings, Auditorium & Rotunda (268, 495)',
    description:
      'Central dining and student amenity complex comprising the Circular Canteen Rotunda, North & South Mess wings, Central Auditorium Hall, and Block C1.',
  },
  {
    id: 'main_gate',
    name: 'Main Gate No. 1, Union Bank ATM & West Gate',
    shortName: 'Main Gate & ATM',
    type: 'Highway Arch, ATM Kiosk & West Gate',
    category: 'INFRASTRUCTURE',
    floors: [
      {
        id: 'G',
        label: 'Gates & Security',
        rooms: [
          'Main Gate No. 1 Archway (Naya Raipur Marg)',
          'Main Gate 24x7 Security Control Room',
          'Union Bank of India ATM & Kiosk (345, 688)',
          'Central Crossroads Monument Plinth (358, 582)',
          'West Gate No. 2 Security Post (22, 642)',
        ],
      },
    ],
    trace: {
      cx: 338,
      cy: 755,
      w: 44,
      h: 24,
      angle: 18,
      shape: 'gate_and_atm',
      color: '#64748b',
      badge: 'GATE',
    },
    mapPin: { badge: 'GATE', color: '#64748b' },
    gps: 'Naya Raipur Marg Entrance (338, 755)',
    description:
      'Main campus entrance archway on Naya Raipur Marg, Union Bank of India ATM & security kiosk along the entrance boulevard, and West Gate No. 2.',
  },
];

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

export function getWingsForBuilding(buildingNameOrId, customBuildingsList = null) {
  const list = customBuildingsList || getCampusBuildings();
  const target = list.find(
    (b) => b.id === buildingNameOrId || b.name === buildingNameOrId || b.shortName === buildingNameOrId
  );
  if (target && Array.isArray(target.wings) && target.wings.length > 0) {
    return [
      ...target.wings.map((w) => ({ id: w, label: w })),
      { id: 'Common Area', label: 'Corridor / Washroom / Court / Utility' },
    ];
  }
  if (target && target.category !== 'HOSTEL') {
    return [{ id: 'Main Complex', label: 'Main Complex / Central Hall' }];
  }
  return HOSTEL_WINGS;
}

export function getRoomsForBuilding(buildingNameOrId, floorId = '1', wingId = 'Wing A', customBuildingsList = null) {
  const list = customBuildingsList || getCampusBuildings();
  const target = list.find(
    (b) => b.id === buildingNameOrId || b.name === buildingNameOrId || b.shortName === buildingNameOrId
  );

  if (!target) return generateHostelRoomsForFloor(floorId, 24);

  // Structured floors with rooms (Academic Complex, KRC, MPH, Cafeteria/Mess, FG, Courts, Gates, etc.)
  if (Array.isArray(target.floors)) {
    const floorObj =
      target.floors.find((f) => typeof f === 'object' && String(f.id) === String(floorId)) ||
      (typeof target.floors[0] === 'object' ? target.floors[0] : null);
    if (floorObj && Array.isArray(floorObj.rooms)) {
      return floorObj.rooms;
    }
  }

  if (target.category === 'HOSTEL') {
    if (wingId === 'Common Area') {
      return [
        ...(target.customRooms || []),
        ...HOSTEL_COMMON_ZONES.map((z) => `${floorId === 'G' ? 'Ground' : `Floor ${floorId}`} — ${z}`),
      ];
    }
    const maxRooms = Number(target.roomsPerFloor) || 24;
    const prefix = target.roomPrefix || 'Room ';
    const allFloorRooms = generateHostelRoomsForFloor(floorId, maxRooms, prefix);
    const wings = Array.isArray(target.wings) && target.wings.length > 0 ? target.wings : ['Wing A', 'Wing B'];
    const wingIndex = Math.max(0, wings.indexOf(wingId));
    const chunkSize = Math.ceil(allFloorRooms.length / Math.max(1, wings.length));
    const sliced = allFloorRooms.slice(wingIndex * chunkSize, (wingIndex + 1) * chunkSize);
    const activeRooms = sliced.length > 0 ? sliced : allFloorRooms;
    const tag = wingId && wingId.startsWith('Wing ') ? `${wingId.replace('Wing ', '').split(' ')[0]}-` : '';

    return [
      ...activeRooms.map((r) => `${tag}${r}`),
      ...(target.customRooms || []),
      ...HOSTEL_COMMON_ZONES.slice(0, 3).map((z) => `${wingId || 'Floor ' + floorId} — ${z}`),
    ];
  }

  if (Array.isArray(target.customRooms) && target.customRooms.length > 0) {
    return target.customRooms;
  }

  return ['General Area'];
}

/**
 * Generates the authentic list of rooms/spots for a given building, floor, and wing.
 */
export function getRoomsForSelection(buildingNameOrId, floorId = 'G', wingId = 'Wing A') {
  return getRoomsForBuilding(buildingNameOrId, floorId, wingId);
}

/**
 * Formats a clean, structured location string that triggers backend zone-affinity routing.
 */
export function formatIIITNRLocation({ building, wing, floor, room, customSpot }) {
  const parts = [];
  if (building) parts.push(building);
  if (wing && wing !== 'Common Area') parts.push(wing);
  if (floor) {
    const floorLabel =
      floor === 'G' ? 'Ground Floor' : floor === '1' ? '1st Floor' : floor === '2' ? '2nd Floor' : floor === '3' ? '3rd Floor' : `Floor ${floor}`;
    parts.push(floorLabel);
  }
  if (room) parts.push(room);
  if (customSpot && customSpot.trim()) parts.push(customSpot.trim());
  return parts.join(', ');
}

export const IIITNR_QUICK_SCENARIOS = [
  {
    label: '❄️ AC / Split Unit Not Cooling (Lecture Hall / Lab)',
    building: 'Academic & Administrative Complex',
    floor: '1',
    room: 'Smart E-Classroom E-102',
    text: 'The overhead cassette AC units in Smart E-Classroom E-102 (1st Floor, Academic Block) are blowing warm air during lectures.',
  },
  {
    label: '🌐 Wi-Fi / LAN Drop in Hostel Wing',
    building: 'Ramanujan House (Boys Hostel)',
    wing: 'Wing A (NW)',
    floor: '2',
    room: 'Room A-204',
    text: 'IIITNR-Hostel Wi-Fi access point in Ramanujan House Wing A, 2nd Floor corridor near Room A-204 is blinking red with no internet.',
  },
  {
    label: '💧 RO Water Cooler Leaking in Hostel',
    building: 'Bhabha House (Boys Hostel)',
    wing: 'Common Area',
    floor: '1',
    room: 'Floor 1 — Corridor RO Water Cooler',
    text: 'The corridor RO drinking water cooler on the 1st Floor of Bhabha House is leaking onto the floor and not chilling water.',
  },
  {
    label: '🏟️ Floodlight / Turf Issue at Football Ground (FG)',
    building: 'Main Football Ground (FG) & Central Turf',
    floor: 'G',
    room: 'Floodlight Towers (FG-1 to FG-4)',
    text: 'Two floodlight panels on the southeast tower at the Main Football Ground (FG) are not turning on during evening practice.',
  },
];
