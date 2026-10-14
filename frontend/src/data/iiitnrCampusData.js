/**
 * SmartComplaintHandler - Official IIIT Naya Raipur Campus Master Plan, Hostels, Rooms & Labs Dataset
 * Campus: Dr. SPM International Institute of Information Technology, Naya Raipur
 * Address: Plot No. 7, Sector 24, Near Purkhoti Muktangan, Atal Nagar – Nava Raipur, Chhattisgarh 493661
 * Coordinates: 21.1284° N, 81.7661° E (50-Acre Residential Campus)
 */

export const IIITNR_CAMPUS_METADATA = {
  instituteName: 'Dr. SPM IIIT Naya Raipur',
  shortName: 'IIIT Naya Raipur',
  address: 'Plot No. 7, Sector 24, Near Purkhoti Muktangan, Atal Nagar – Nava Raipur, Chhattisgarh 493661',
  latitude: 21.1284,
  longitude: 81.7661,
  campusArea: '50 Acres Residential Wi-Fi Campus',
  osmEmbedUrl:
    'https://www.openstreetmap.org/export/embed.html?bbox=81.7605%2C21.1240%2C81.7720%2C21.1330&layer=mapnik&marker=21.1284%2C81.7661',
  googleMapsUrl:
    'https://www.google.com/maps/search/?api=1&query=IIIT+Naya+Raipur+Plot+No+7+Sector+24+Atal+Nagar+Chhattisgarh',
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

function generateHostelRoomsForFloor(floorCode, maxRoom = 24) {
  const rooms = [];
  for (let i = 1; i <= maxRoom; i += 1) {
    const padded = String(i).padStart(2, '0');
    if (floorCode === 'G') {
      rooms.push(`Room G-${padded}`);
    } else {
      rooms.push(`Room ${floorCode}${padded}`);
    }
  }
  return rooms;
}

export const HOSTEL_FLOORS = [
  { id: 'G', label: 'Ground Floor (G-01 – G-24)' },
  { id: '1', label: '1st Floor (101 – 124)' },
  { id: '2', label: '2nd Floor (201 – 224)' },
  { id: '3', label: '3rd Floor (301 – 324)' },
];

export const HOSTEL_WINGS = [
  { id: 'Wing A', label: 'Wing A (Rooms 01–12)' },
  { id: 'Wing B', label: 'Wing B (Rooms 13–24)' },
  { id: 'Common Area', label: 'Corridor / Common Utilities' },
];

export const HOSTEL_COMMON_ZONES = [
  'Corridor RO Water Cooler (Wing A)',
  'Corridor RO Water Cooler (Wing B)',
  'Washroom & Shower Block (Wing A)',
  'Washroom & Shower Block (Wing B)',
  'Common Room & TV Lounge',
  'Indoor Badminton / TT Court',
  'Staircase & Corridor Lighting',
  'Wi-Fi Ceiling Access Point',
  'Washing Machine / Laundry Area',
];

export const IIITNR_HOSTELS = [
  {
    id: 'ramanujan_house',
    name: 'Ramanujan House (Boys Hostel 1)',
    shortName: 'Ramanujan House',
    type: 'Boys Hostel',
    category: 'HOSTEL',
    gender: 'Boys',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    capacity: '280+ Students (Single & Double Occupancy)',
    amenities: ['LAN & Campus Wi-Fi', 'RO Water Coolers', 'Indoor Badminton Court', 'TV Common Room'],
    mapZone: { x: 110, y: 88, width: 150, height: 64, color: '#4f46e5', badge: 'BH-1' },
    gps: '21.1296° N, 81.7648° E',
    description: 'Primary undergraduate boys residential house with Wing A & Wing B blocks and central courtyard.',
  },
  {
    id: 'bhabha_house',
    name: 'Bhabha House (Boys Hostel 2)',
    shortName: 'Bhabha House',
    type: 'Boys Hostel',
    category: 'HOSTEL',
    gender: 'Boys',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    capacity: '280+ Students (Single & Double Occupancy)',
    amenities: ['High-Speed Wi-Fi & LAN', 'RO Water Coolers', 'Table Tennis Lounge', 'Solar Water Heaters'],
    mapZone: { x: 280, y: 88, width: 150, height: 64, color: '#4f46e5', badge: 'BH-2' },
    gps: '21.1298° N, 81.7656° E',
    description: 'Boys residential block adjacent to the North Sports Complex and Mess Block.',
  },
  {
    id: 'bose_house',
    name: 'Bose House (Boys Hostel 3)',
    shortName: 'Bose House',
    type: 'Boys Hostel',
    category: 'HOSTEL',
    gender: 'Boys',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    capacity: '300+ Students (Senior & PG Wing)',
    amenities: ['Fiber LAN Ports', 'RO Water Coolers', 'Reading & Study Room', 'Common Recreation Hall'],
    mapZone: { x: 450, y: 88, width: 150, height: 64, color: '#4f46e5', badge: 'BH-3' },
    gps: '21.1299° N, 81.7665° E',
    description: 'Senior undergraduate and postgraduate boys hostel block in the northern residential zone.',
  },
  {
    id: 'raman_house',
    name: 'Raman House (Girls Hostel 1)',
    shortName: 'Raman House',
    type: 'Girls Hostel',
    category: 'HOSTEL',
    gender: 'Girls',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    capacity: '220+ Students',
    amenities: ['24/7 Biometric Security', 'Dedicated Mess Hall', 'Badminton Court', 'RO Water Coolers'],
    mapZone: { x: 640, y: 88, width: 145, height: 64, color: '#db2777', badge: 'GH-1' },
    gps: '21.1291° N, 81.7676° E',
    description: 'Primary girls residential hostel with enclosed courtyard, dedicated dining hall, and indoor recreation.',
  },
  {
    id: 'shabhari_house',
    name: 'Shabhari House (Girls Hostel 2)',
    shortName: 'Shabhari House',
    type: 'Girls Hostel',
    category: 'HOSTEL',
    gender: 'Girls',
    wings: ['Wing A', 'Wing B'],
    floors: ['G', '1', '2', '3'],
    capacity: '200+ Students',
    amenities: ['24/7 Security Desk', 'Campus Wi-Fi', 'Common Study Lounge', 'Solar Hot Water'],
    mapZone: { x: 640, y: 170, width: 145, height: 64, color: '#db2777', badge: 'GH-2' },
    gps: '21.1286° N, 81.7679° E',
    description: 'Girls residential house located along the eastern residential avenue near KRC.',
  },
  {
    id: 'transit_hostel',
    name: 'Transit Hostel & Faculty Residences',
    shortName: 'Transit Hostel',
    type: 'Guest & Faculty Housing',
    category: 'HOSTEL',
    gender: 'All',
    wings: ['Main Block', 'Faculty Quarters'],
    floors: ['G', '1', '2'],
    capacity: 'Visiting Faculty, PhD Scholars & Official Guests',
    amenities: ['AC Suites', 'Conference Lounge', 'Faculty Residential Towers'],
    mapZone: { x: 640, y: 252, width: 145, height: 60, color: '#0d9488', badge: 'TH-1' },
    gps: '21.1278° N, 81.7681° E',
    description: 'Visiting faculty transit suites and campus residential quarters.',
  },
];

export const IIITNR_ACADEMIC_BLOCKS = [
  {
    id: 'academic_block',
    name: 'Academic & Administrative Block (Main Building)',
    shortName: 'Academic Block',
    type: 'Academic & Labs',
    category: 'ACADEMIC',
    mapZone: { x: 250, y: 235, width: 230, height: 95, color: '#0284c7', badge: 'ACAD' },
    gps: '21.1283° N, 81.7660° E',
    description: 'Central academic complex housing 120-seat Smart E-Classrooms, CSE/DSAI/ECE Research Labs, Data Centre (131C/131E), and Estate Office.',
    floors: [
      {
        id: 'G',
        label: 'Ground Floor (Classrooms, IDEA Lab & Estate Office)',
        rooms: [
          'Smart E-Classroom E-101 (120-Seat AC)',
          'Lecture Hall LH-1',
          'Lecture Hall LH-2',
          'AICTE IDEA Lab (Ground Floor)',
          'Estate & Facilities Office (Room G-04)',
          'Registrar & Administration Office',
          'Directorate Secretariat',
          'Ground Floor Restroom Block (East)',
          'Ground Floor Restroom Block (West)',
          'Ground Floor RO Water Cooler',
        ],
      },
      {
        id: '1',
        label: '1st Floor (Data Centre NOC 131C/131E, CSE & DSAI Labs)',
        rooms: [
          'Room 131C — Data Centre & Server NOC',
          'Room 131E — Network Operations Center',
          'Smart E-Classroom E-102 (120-Seat AC)',
          'CSE Programming & Systems Lab 1 (Room 104)',
          'Data Science & AI Research Lab (Room 108)',
          'Cybersecurity & Network Security Lab (Room 112)',
          'Lecture Hall LH-3',
          'Lecture Hall LH-4',
          'Faculty Cabins Wing A (1st Floor)',
          '1st Floor Restroom & RO Water Cooler',
        ],
      },
      {
        id: '2',
        label: '2nd Floor (VLSI, IoT, Embedded & ECE Research Labs)',
        rooms: [
          'VLSI & Microelectronics Lab (Room 202)',
          'IoT, Robotics & Autonomous Systems Lab (Room 205)',
          'Embedded Systems & Microcontrollers Lab (Room 208)',
          'RF, Microwave & 5G Communications Lab (Room 211)',
          'Signal Processing & Communication Lab (Room 214)',
          'Lecture Hall LH-5',
          'Lecture Hall LH-6',
          'Faculty Cabins Wing B (2nd Floor)',
          '2nd Floor Restroom & RO Water Cooler',
        ],
      },
      {
        id: '3',
        label: '3rd Floor (Seminar Hall, PhD Scholars & Solar Plant)',
        rooms: [
          'Main Seminar & Conference Hall (Room 301)',
          'PhD & M.Tech Research Scholars Bay (Room 305)',
          'Incubation & Startup Cell (TIH)',
          'Terrace Central HVAC & Solar Inverter Room',
          '3rd Floor Restroom & RO Cooler',
        ],
      },
    ],
  },
  {
    id: 'krc_library',
    name: 'Knowledge Resource Centre (KRC / Central Library)',
    shortName: 'KRC Library',
    type: 'Library & Digital Center',
    category: 'ACADEMIC',
    mapZone: { x: 500, y: 242, width: 120, height: 80, color: '#7c3aed', badge: 'KRC' },
    gps: '21.1282° N, 81.7668° E',
    description: 'Central library, 24x7 reading rooms, digital e-resource terminals, and RFID circulation desk.',
    floors: [
      {
        id: 'G',
        label: 'Ground Floor (Circulation & Main Reading Hall)',
        rooms: [
          'Main Reading Hall (Ground Floor)',
          'RFID Issue / Return Desk',
          'Periodical & Newspaper Lounge',
          'KRC Ground Floor Restroom & Water Cooler',
        ],
      },
      {
        id: '1',
        label: '1st Floor (Digital Library & Discussion Rooms)',
        rooms: [
          'Digital Library & Computer Terminals',
          'Reference & Thesis Archive Section',
          'Group Discussion Room GD-1',
          'Group Discussion Room GD-2',
          'KRC Server & Wi-Fi Rack',
        ],
      },
    ],
  },
  {
    id: 'sac_mph',
    name: 'Student Activity Centre (SAC) & Multi-Purpose Hall (MPH)',
    shortName: 'SAC & MPH',
    type: 'Student Center & Auditorium',
    category: 'AMENITY',
    mapZone: { x: 95, y: 242, width: 135, height: 80, color: '#ea580c', badge: 'SAC' },
    gps: '21.1285° N, 81.7651° E',
    description: 'Multi-Purpose Hall auditorium, indoor gymnasium, badminton courts, and student club rooms.',
    floors: [
      {
        id: 'G',
        label: 'Ground Floor (MPH Auditorium & Indoor Courts)',
        rooms: [
          'Multi-Purpose Hall (MPH) Main Auditorium',
          'MPH Stage Lighting & Sound Control Room',
          'Indoor Wooden Badminton Court 1',
          'Indoor Wooden Badminton Court 2',
          'SAC Restroom & Changing Rooms',
        ],
      },
      {
        id: '1',
        label: '1st Floor (Gymnasium & Student Club Rooms)',
        rooms: [
          'Central Student Gymnasium (Cardio & Weights)',
          'Table Tennis, Carrom & Chess Arena',
          'Music, Dance & Drama Club Room',
          'Coding, Robotics & IEEE Student Chapter Room',
        ],
      },
    ],
  },
  {
    id: 'cafeteria_mess',
    name: 'Central Mess Block, Cafeteria & Medical Dispensary',
    shortName: 'Mess & Cafeteria',
    type: 'Dining & Campus Utilities',
    category: 'AMENITY',
    mapZone: { x: 95, y: 165, width: 155, height: 60, color: '#d97706', badge: 'MESS' },
    gps: '21.1290° N, 81.7650° E',
    description: 'Student dining halls, night canteen, medical health center, and campus ATM.',
    floors: [
      {
        id: 'G',
        label: 'Ground Floor (Mess Halls, Canteen & Dispensary)',
        rooms: [
          'Central Mess Dining Hall 1 (Ground Floor)',
          'Night Canteen & Nescafé Kiosk',
          'Campus Medical Dispensary & First-Aid Room',
          'Mess Handwash & RO Water Station',
          'Campus ATM & Utility Counter',
        ],
      },
      {
        id: '1',
        label: '1st Floor (Dining Hall 2 & Kitchen Exhaust)',
        rooms: [
          'Central Mess Dining Hall 2 (1st Floor)',
          'Mess Dishwashing & RO Filtration Plant',
          '1st Floor Dining Hall AC & Ventilation Fans',
        ],
      },
    ],
  },
  {
    id: 'sports_substation',
    name: 'Sports Complex, Amphitheater & 33/11kV Substation',
    shortName: 'Sports & Substation',
    type: 'Grounds & Power Grid',
    category: 'INFRASTRUCTURE',
    mapZone: { x: 270, y: 165, width: 330, height: 55, color: '#059669', badge: 'SPORTS' },
    gps: '21.1292° N, 81.7661° E',
    description: 'Floodlit basketball and volleyball courts, football/cricket ground, open-air amphitheater, and 33/11kV substation.',
    floors: [
      {
        id: 'G',
        label: 'Outdoor Campus Zones & Utility Grid',
        rooms: [
          'Open-Air Amphitheater Stage & Seating',
          'Floodlit Basketball Court',
          'Volleyball Court 1 & Court 2',
          'Main Football & Cricket Ground Floodlights',
          'Open-Air Fitness Gym',
          '33/11kV Main Electrical Substation & DG Set',
          'Sewage Treatment Plant (STP) & Pump House',
          'Main Gate No. 1 Security Plaza (Sector 24 Road)',
        ],
      },
    ],
  },
];

export const ALL_IIITNR_BUILDINGS = [
  ...IIITNR_HOSTELS,
  ...IIITNR_ACADEMIC_BLOCKS,
];

/**
 * Returns structured floor list and room options for any IIIT Naya Raipur hostel or academic building.
 */
export function getFloorsForBuilding(buildingNameOrId) {
  const target = ALL_IIITNR_BUILDINGS.find(
    (b) => b.id === buildingNameOrId || b.name === buildingNameOrId || b.shortName === buildingNameOrId
  );

  if (!target) {
    return HOSTEL_FLOORS;
  }

  if (target.category === 'HOSTEL') {
    if (target.id === 'transit_hostel') {
      return [
        { id: 'G', label: 'Ground Floor (Suites G-01 – G-08)' },
        { id: '1', label: '1st Floor (Suites 101 – 108)' },
        { id: '2', label: '2nd Floor (Faculty Residences)' },
      ];
    }
    return HOSTEL_FLOORS;
  }

  return (target.floors || []).map((f) => ({ id: f.id, label: f.label }));
}

export function getRoomsForBuilding(buildingNameOrId, floorId = '1', wingId = 'Wing A') {
  const target = ALL_IIITNR_BUILDINGS.find(
    (b) => b.id === buildingNameOrId || b.name === buildingNameOrId || b.shortName === buildingNameOrId
  );

  if (!target) {
    return generateHostelRoomsForFloor(floorId, 24);
  }

  if (target.category === 'HOSTEL') {
    if (target.id === 'transit_hostel') {
      return [
        `Transit Suite ${floorId}-01`,
        `Transit Suite ${floorId}-02`,
        `Transit Suite ${floorId}-03`,
        `Transit Suite ${floorId}-04`,
        `Transit Suite ${floorId}-05`,
        `Transit Suite ${floorId}-06`,
        'Faculty Quarter Block A',
        'Faculty Quarter Block B',
        'Transit Hostel Reception & Dining Lounge',
      ];
    }

    if (wingId === 'Common Area') {
      return HOSTEL_COMMON_ZONES.map((z) => `${floorId === 'G' ? 'Ground Floor' : `${floorId}st/nd/rd Floor`} — ${z}`);
    }

    const allFloorRooms = generateHostelRoomsForFloor(floorId, 24);
    const wingRooms =
      wingId === 'Wing B' ? allFloorRooms.slice(12, 24) : allFloorRooms.slice(0, 12);

    return [
      ...wingRooms.map((r) => `${wingId}, ${r}`),
      ...HOSTEL_COMMON_ZONES.map((z) => `${wingId} (${floorId} Floor) — ${z}`),
    ];
  }

  const floorObj = (target.floors || []).find((f) => f.id === floorId) || (target.floors || [])[0];
  return floorObj ? floorObj.rooms : ['General Area'];
}
