/**
 * frontend/src/data/campusTwin/campusLabsAndRooms.js
 *
 * Authentic IIIT Naya Raipur Building, Floor, Room & Laboratory Directory.
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
      role: 'Estate Officer',
      name: 'Rakesh Kumar Mishra',
      email: 'estate@iiitnr.edu.in',
      phone: '0771-2474104',
      office: 'Academic Block, Ground Floor (Room 104)',
    },
    {
      role: 'JE (Electrical)',
      name: 'Ranjeet Singh Thakur',
      email: 'ranjeet@iiitnr.edu.in',
      phone: '0771-2474109',
      office: 'Electrical Substation & Estate Office',
    },
    {
      role: 'Sr. Network Engineer',
      name: 'Abir Bhattacharya',
      email: 'abir@iiitnr.edu.in',
      phone: '0771-2474010',
      office: 'Academic Block, Ground Floor, Room 131C',
    },
    {
      role: 'Network Engineer',
      name: 'Parvinder Singh',
      email: 'parvinder@iiitnr.edu.in',
      phone: '0771-2474034',
      office: 'Academic Block, Ground Floor, Room 131E',
    },
  ],
};

export const HOSTEL_FLOORS = [
  { id: '1', label: 'Floor 1 (1xx)' },
  { id: '2', label: 'Floor 2 (2xx)' },
  { id: '3', label: 'Floor 3 (3xx)' },
  { id: '4', label: 'Floor 4 (4xx)' },
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

// Institutional Canonical Campus Buildings & Labs Catalog (IIIT Naya Raipur)
// Auto-generated from canonical_gis_data.json
export const DEFAULT_IIITNR_BUILDINGS = [
  {
    "id": "academic_block",
    "name": "Academic & Administrative Block",
    "shortName": "Academic Block",
    "badge": "ACAD",
    "category": "ACADEMIC",
    "color": "#0284c7",
    "mapPin": {
      "lat": 21.12836,
      "lng": 81.76615
    },
    "wings": [
      "Main Building",
      "East Lab Wings",
      "Directorate Wing"
    ],
    "floors": [
      "1",
      "2",
      "3"
    ],
    "roomsPerFloor": 20,
    "customRooms": [],
    "description": "Iconic central academic rotunda dome and classroom/laboratory complex",
    "polygons": [
      {
        "id": "wing_1792073780860",
        "name": "Academic Block Wing #1",
        "color": "#0284c7",
        "fillOpacity": 0.45,
        "latlngs": [
          [
            21.128016425421734,
            81.7660501599312
          ],
          [
            21.128073952232114,
            81.76613330841066
          ],
          [
            21.128048940578147,
            81.76615744829179
          ],
          [
            21.128091460387356,
            81.76624596118928
          ],
          [
            21.128128977855937,
            81.76624596118928
          ],
          [
            21.128206513927577,
            81.76637202501298
          ],
          [
            21.12817149764217,
            81.76640421152116
          ],
          [
            21.12821901974178,
            81.76647663116456
          ],
          [
            21.128261539502187,
            81.76647394895555
          ],
          [
            21.128334073182984,
            81.76658928394319
          ],
          [
            21.12843411958107,
            81.76652759313585
          ],
          [
            21.12837909407049,
            81.76643908023836
          ],
          [
            21.128491646229385,
            81.766374707222
          ],
          [
            21.128531664754174,
            81.76643908023836
          ],
          [
            21.12864421679726,
            81.76637202501298
          ],
          [
            21.128591692521113,
            81.7663049697876
          ],
          [
            21.12866672719561,
            81.76627814769746
          ],
          [
            21.12872175259944,
            81.766374707222
          ],
          [
            21.1285241612816,
            81.76649272441864
          ],
          [
            21.128579186738342,
            81.76657855510713
          ],
          [
            21.128796787208117,
            81.76643908023836
          ],
          [
            21.128771775676128,
            81.76639616489412
          ],
          [
            21.12885181256369,
            81.76634520292284
          ],
          [
            21.128801789514014,
            81.76627546548845
          ],
          [
            21.12887182177883,
            81.7662137746811
          ],
          [
            21.128609200615223,
            81.7657256126404
          ],
          [
            21.128561678640683,
            81.76574975252153
          ],
          [
            21.128514156650905,
            81.76575243473054
          ],
          [
            21.128476639279786,
            81.765653192997
          ],
          [
            21.128361585949204,
            81.76572293043137
          ],
          [
            21.128436620740164,
            81.76588118076326
          ],
          [
            21.12838475629564,
            81.76590699702503
          ],
          [
            21.128354117083216,
            81.76584463566543
          ],
          [
            21.12823943216431,
            81.76591336727144
          ],
          [
            21.128269446109964,
            81.76597639918329
          ],
          [
            21.128166980109636,
            81.76604479551315
          ],
          [
            21.12812696148639,
            81.76597036421299
          ],
          [
            21.128015034342216,
            81.76603339612485
          ]
        ]
      }
    ],
    "entrances": [
      {
        "id": "ent_acad_main",
        "name": "Front Main Portico Entrance",
        "lat": 21.128164,
        "lng": 81.766357
      },
      {
        "id": "ent_acad_west",
        "name": "West Wing Entrance",
        "lat": 21.128375,
        "lng": 81.765889
      }
    ]
  },
  {
    "id": "auditorium_hall",
    "name": "Central Campus Auditorium",
    "shortName": "Auditorium",
    "badge": "AUD",
    "category": "AMENITY",
    "color": "#e11d48",
    "mapPin": {
      "lat": 21.128255,
      "lng": 81.765376
    },
    "wings": [],
    "floors": [
      "1"
    ],
    "roomsPerFloor": 6,
    "customRooms": [
      "Main Auditorium Hall",
      "Balcony Seating",
      "Stage & Green Rooms",
      "AV Control Booth",
      "Foyer & Reception"
    ],
    "description": "Main campus auditorium located west of the central spine",
    "polygons": [
      {
        "id": "wing_1792074374091",
        "name": "Auditorium Wing #1",
        "color": "#e11d48",
        "fillOpacity": 0.45,
        "latlngs": [
          [
            21.128064671514963,
            81.76537013277192
          ],
          [
            21.128020881663236,
            81.76540231252027
          ],
          [
            21.12808281302117,
            81.76551628246224
          ],
          [
            21.128124726147714,
            81.76548343230249
          ],
          [
            21.128149123335337,
            81.76554376933058
          ],
          [
            21.128210429071093,
            81.76551225999368
          ],
          [
            21.128240456360995,
            81.7655699153761
          ],
          [
            21.128289250694106,
            81.76553974686206
          ],
          [
            21.12834930523592,
            81.76564567186695
          ],
          [
            21.12850131818611,
            81.76555650714762
          ],
          [
            21.12843188019117,
            81.7654519229656
          ],
          [
            21.128477546623934,
            81.76542778815437
          ],
          [
            21.12844251484115,
            81.76534935001783
          ],
          [
            21.12847629623648,
            81.76532521520659
          ],
          [
            21.12846128261618,
            81.76529370586968
          ],
          [
            21.12851269604628,
            81.76525877983454
          ],
          [
            21.12844763702994,
            81.76514346906973
          ],
          [
            21.12840259615574,
            81.76516760388095
          ],
          [
            21.128372568898662,
            81.76513408330979
          ],
          [
            21.128048524362594,
            81.76533386591393
          ]
        ]
      }
    ],
    "entrances": [
      {
        "id": "ent_audi_front",
        "name": "Auditorium Front Plaza Entrance",
        "lat": 21.12841,
        "lng": 81.765606
      },
      {
        "id": "ent_1792074395963",
        "name": "Auditorium Entrance Back",
        "lat": 21.12807,
        "lng": 81.765484
      },
      {
        "id": "ent_1792074432755",
        "name": "Auditorium Entrance Side",
        "lat": 21.128325,
        "lng": 81.765177
      }
    ]
  },
  {
    "id": "canteen_block",
    "name": "Canteen IIIT Naya Raipur (Circular Rotunda & Arcade)",
    "shortName": "Canteen",
    "badge": "CANTEEN",
    "category": "AMENITY",
    "color": "#f59e0b",
    "mapPin": {
      "lat": 21.127927,
      "lng": 81.765653
    },
    "wings": [],
    "floors": [
      "1"
    ],
    "roomsPerFloor": 6,
    "customRooms": [
      "Main Dining Hall",
      "Juice & Snacks Counter",
      "Outdoor Dining Arcade",
      "Kitchen & Service Area",
      "Staff Dining Section"
    ],
    "description": "Iconic circular canteen rotunda with curved dining arcade",
    "polygons": [
      {
        "id": "wing_1792075246395",
        "name": "Canteen Wing #1",
        "color": "#f59e0b",
        "fillOpacity": 0.45,
        "latlngs": [
          [
            21.127807389963753,
            81.76571454854013
          ],
          [
            21.12783740691083,
            81.76575377584956
          ],
          [
            21.127887435142448,
            81.76578629763601
          ],
          [
            21.127918713296303,
            81.76579367370442
          ],
          [
            21.12796467670952,
            81.76578864456215
          ],
          [
            21.128006262642558,
            81.76576953382167
          ],
          [
            21.128029585395925,
            81.76574438810394
          ],
          [
            21.128059417577536,
            81.76570616662951
          ],
          [
            21.12806992654608,
            81.76565788686291
          ],
          [
            21.128066296450097,
            81.76560424268018
          ],
          [
            21.12805222602864,
            81.76557976752129
          ],
          [
            21.128029713351523,
            81.76558580249197
          ],
          [
            21.12803471616894,
            81.76558211445435
          ],
          [
            21.128011133793056,
            81.76553718745681
          ],
          [
            21.127999248696714,
            81.76554758101851
          ],
          [
            21.127979685167908,
            81.76550935952997
          ],
          [
            21.127955921774785,
            81.76546040921221
          ],
          [
            21.127922778088518,
            81.76547784357197
          ],
          [
            21.127915273856633,
            81.76546376197372
          ],
          [
            21.127794893418347,
            81.76553148775584
          ],
          [
            21.12780239765631,
            81.76554925739174
          ],
          [
            21.127768941259102,
            81.76556635647535
          ],
          [
            21.127819110679102,
            81.76565621048229
          ],
          [
            21.127800972097837,
            81.76566861569897
          ],
          [
            21.127821158249585,
            81.76570113748724
          ]
        ]
      }
    ],
    "entrances": [
      {
        "id": "ent_canteen_entry",
        "name": "Canteen Arcade Entry",
        "lat": 21.128031,
        "lng": 81.765661
      }
    ]
  },
  {
    "id": "ramanujan_house",
    "name": "Ramanujan House (Boys Hostel 3)",
    "shortName": "Ramanujan House",
    "badge": "BH-3",
    "category": "HOSTEL",
    "color": "#4f46e5",
    "mapPin": {
      "lat": 21.130309,
      "lng": 81.766246
    },
    "wings": [],
    "floors": [
      "1",
      "2",
      "3",
      "4"
    ],
    "roomsPerFloor": 24,
    "customRooms": [],
    "description": "Boys Hostel 3 in the northeast residential sector",
    "polygons": [
      {
        "id": "wing_1792119138596",
        "name": "Ramanujan House Wing #1",
        "color": "#4f46e5",
        "fillOpacity": 0.45,
        "latlngs": [
          [
            21.129935202032236,
            81.76605686545373
          ],
          [
            21.129961457488207,
            81.76610581576826
          ],
          [
            21.12997896112295,
            81.76609776914121
          ],
          [
            21.130004591441484,
            81.76615342497827
          ],
          [
            21.130040223828217,
            81.76612995564939
          ],
          [
            21.13004397156391,
            81.76613666117191
          ],
          [
            21.1300252176777,
            81.7661514133215
          ],
          [
            21.1300445966934,
            81.76617823541166
          ],
          [
            21.130063092752078,
            81.76619902253151
          ],
          [
            21.130046839386267,
            81.76620841026308
          ],
          [
            21.13021222997921,
            81.76650010049345
          ],
          [
            21.13022160691079,
            81.76649406552316
          ],
          [
            21.130228483326906,
            81.76650546491146
          ],
          [
            21.130194726372036,
            81.76652960479261
          ],
          [
            21.130244736672793,
            81.76661744713785
          ],
          [
            21.130337068149114,
            81.76657050848009
          ],
          [
            21.130388328657965,
            81.76667645573616
          ],
          [
            21.130696100853594,
            81.76649808883668
          ],
          [
            21.130654842482283,
            81.76642164587976
          ],
          [
            21.13062483638686,
            81.76638543605806
          ],
          [
            21.13064233994327,
            81.76637068390848
          ],
          [
            21.130617334862073,
            81.76630899310113
          ],
          [
            21.130599817785605,
            81.76631435751916
          ],
          [
            21.13058731524194,
            81.76628351211549
          ],
          [
            21.130564810660694,
            81.76629826426507
          ],
          [
            21.13053730505674,
            81.76625669002534
          ],
          [
            21.13054730709513,
            81.76623925566673
          ],
          [
            21.13039334319939,
            81.76593884825706
          ],
          [
            21.130405845759405,
            81.76592275500299
          ],
          [
            21.13037208884492,
            81.76584228873253
          ],
          [
            21.130307075506483,
            81.76585435867311
          ]
        ]
      }
    ],
    "entrances": []
  },
  {
    "id": "bhabha_house",
    "name": "Bhabha House (Girls Hostel 2)",
    "shortName": "Bhabha House",
    "badge": "GH-2",
    "category": "HOSTEL",
    "color": "#ec4899",
    "mapPin": {
      "lat": 21.127835,
      "lng": 81.764087
    },
    "wings": [],
    "floors": [
      "1",
      "2",
      "3",
      "4"
    ],
    "roomsPerFloor": 24,
    "customRooms": [],
    "description": "Girls Hostel 2 located in the southwestern hostel zone",
    "polygons": [
      {
        "id": "wing_1792095410995",
        "name": "Bhabha House Wing #1",
        "color": "#4f46e5",
        "fillOpacity": 0.45,
        "latlngs": [
          [
            21.127611715127482,
            81.76416245999195
          ],
          [
            21.127968229507047,
            81.76428916775095
          ],
          [
            21.12805455809015,
            81.76399150507896
          ],
          [
            21.12802520551131,
            81.7639798292141
          ],
          [
            21.12803145732731,
            81.76395401823346
          ],
          [
            21.128083378313505,
            81.76397580005612
          ],
          [
            21.128100584921068,
            81.76391311489806
          ],
          [
            21.12805397927077,
            81.76389702086938
          ],
          [
            21.128063941628756,
            81.76385742279429
          ],
          [
            21.127903820115783,
            81.7637990603846
          ],
          [
            21.12788760158033,
            81.763855110579
          ],
          [
            21.127832871673412,
            81.76383398600011
          ],
          [
            21.127825374548504,
            81.76385241477985
          ],
          [
            21.12778815367592,
            81.76383599160114
          ],
          [
            21.12770308439528,
            81.76380145724471
          ],
          [
            21.1276977705011,
            81.76383632976433
          ],
          [
            21.127736236183743,
            81.76385074839814
          ],
          [
            21.127730294944783,
            81.76387052961923
          ],
          [
            21.12770926775031,
            81.76386073823554
          ]
        ]
      }
    ],
    "entrances": [
      {
        "id": "ent_1792095506597",
        "name": "Bhabha House Entrance #1",
        "lat": 21.127807,
        "lng": 81.764242
      }
    ]
  },
  {
    "id": "bose_house",
    "name": "Bose House (Boys Hostel 2)",
    "shortName": "Bose House",
    "badge": "BH-2",
    "category": "HOSTEL",
    "color": "#4f46e5",
    "mapPin": {
      "lat": 21.127634,
      "lng": 81.76469
    },
    "wings": [],
    "floors": [
      "1",
      "2",
      "3",
      "4"
    ],
    "roomsPerFloor": 24,
    "customRooms": [],
    "description": "Boys Hostel 2 in the southwestern hostel zone",
    "polygons": [
      {
        "id": "wing_1792095363652",
        "name": "Bose House Wing #1",
        "color": "#4f46e5",
        "fillOpacity": 0.45,
        "latlngs": [
          [
            21.127470980337907,
            81.76473241349379
          ],
          [
            21.127437199461035,
            81.7647196756767
          ],
          [
            21.12741718115999,
            81.76478403517335
          ],
          [
            21.12750476120709,
            81.76481755574456
          ],
          [
            21.12750976577964,
            81.76480079545895
          ],
          [
            21.12754479778282,
            81.7648168853331
          ],
          [
            21.127529158496717,
            81.76487387030409
          ],
          [
            21.12768649124351,
            81.76492959479738
          ],
          [
            21.127696500376192,
            81.7648833364092
          ],
          [
            21.127780935587268,
            81.76491719218606
          ],
          [
            21.127801266624374,
            81.7648494806323
          ],
          [
            21.127774679883,
            81.7648380836381
          ],
          [
            21.127847871606566,
            81.76460204741402
          ],
          [
            21.12753762260138,
            81.76449005913193
          ]
        ]
      }
    ],
    "entrances": [
      {
        "id": "ent_1792095376708",
        "name": "Bose House Entrance #1",
        "lat": 21.12768,
        "lng": 81.764521
      }
    ]
  },
  {
    "id": "raman_house",
    "name": "Raman House (Boys Hostel 1)",
    "shortName": "Raman House",
    "badge": "BH-1",
    "category": "HOSTEL",
    "color": "#4f46e5",
    "mapPin": {
      "lat": 21.128425,
      "lng": 81.767507
    },
    "wings": [],
    "floors": [
      "1",
      "2",
      "3",
      "4"
    ],
    "roomsPerFloor": 24,
    "customRooms": [],
    "description": "Boys Hostel 1 located east of the central library & academic complex",
    "polygons": [
      {
        "id": "wing_1792095680796",
        "name": "Raman House Wing #1",
        "color": "#db2777",
        "fillOpacity": 0.45,
        "latlngs": [
          [
            21.128325085077357,
            81.76723774000004
          ],
          [
            21.12822624528157,
            81.76756355995178
          ],
          [
            21.128192464576774,
            81.76755685583755
          ],
          [
            21.128183706615005,
            81.76760914792857
          ],
          [
            21.128263779388995,
            81.76764803179114
          ],
          [
            21.128280044165933,
            81.76763194191695
          ],
          [
            21.128313824850782,
            81.76764669096829
          ],
          [
            21.128292555531594,
            81.76770836881923
          ],
          [
            21.128400153232654,
            81.7677418893904
          ],
          [
            21.128485230429376,
            81.76777138749303
          ],
          [
            21.128497741777736,
            81.76771775457918
          ],
          [
            21.128580316650318,
            81.76775127515033
          ],
          [
            21.12859282799061,
            81.76769227894508
          ],
          [
            21.128565303040524,
            81.76768691565367
          ],
          [
            21.128671649410357,
            81.76736779981616
          ]
        ]
      }
    ],
    "entrances": [],
    "courtyards": []
  },
  {
    "id": "bldg_1792074173914",
    "name": "Sports Complex",
    "shortName": "Sports Complex",
    "badge": "SC",
    "category": "INFRASTRUCTURE",
    "color": "#6366f1",
    "mapPin": {
      "lat": 21.131072,
      "lng": 81.764771
    },
    "wings": [],
    "floors": [
      "1",
      "2"
    ],
    "roomsPerFloor": 24,
    "customRooms": [
      "Indoor Badminton Courts",
      "Table Tennis Arena",
      "Gymnasium & Weights",
      "Sports Officer Office"
    ],
    "description": "Sports Complex",
    "polygons": [
      {
        "id": "wing_1792095278735",
        "name": "Sports Complex Wing #1",
        "color": "#6366f1",
        "fillOpacity": 0.45,
        "latlngs": [
          [
            21.130912322944123,
            81.76482759755119
          ],
          [
            21.13128606656754,
            81.76495574556074
          ],
          [
            21.131358318224684,
            81.7647174142997
          ],
          [
            21.130987402231778,
            81.76458260034241
          ]
        ]
      }
    ],
    "entrances": [
      {
        "id": "ent_1792095296515",
        "name": "Sports Complex Entrance #1",
        "lat": 21.131186,
        "lng": 81.764627
      }
    ]
  },
  {
    "id": "bldg_1792097005723",
    "name": "Basketball Court Out Doors",
    "shortName": "Basketball Court",
    "badge": "BC",
    "category": "INFRASTRUCTURE",
    "color": "#6366f1",
    "mapPin": {
      "lat": 21.128975,
      "lng": 81.766248
    },
    "wings": [],
    "floors": [],
    "roomsPerFloor": 24,
    "customRooms": [
      "Basketball Court",
      "East Hoop",
      "West Hoop",
      "Team Bench Area"
    ],
    "description": "Outdoor full-sized basketball court",
    "polygons": [
      {
        "id": "wing_1792119020812",
        "name": "Basketball Wing #1",
        "color": "#6366f1",
        "fillOpacity": 0.45,
        "latlngs": [
          [
            21.12889009996945,
            81.76610447466375
          ],
          [
            21.12890197752192,
            81.7664035409689
          ],
          [
            21.129065762622233,
            81.76640555262566
          ],
          [
            21.129060136419508,
            81.7661125212908
          ]
        ]
      }
    ],
    "entrances": []
  },
  {
    "id": "bldg_1792119172307",
    "name": "Palm Park",
    "shortName": "Palm Park",
    "badge": "P",
    "category": "AMENITY",
    "color": "#6366f1",
    "mapPin": {
      "lat": 21.127524,
      "lng": 81.76553
    },
    "wings": [],
    "floors": [],
    "roomsPerFloor": 24,
    "customRooms": [
      "Main Lawn Area",
      "Palm Grove Walkway",
      "Gazebo Seating",
      "East Perimeter Path"
    ],
    "description": "Landscaped green park situated between the canteen, auditorium, and sports grounds",
    "polygons": [],
    "entrances": [],
    "courtyards": [
      {
        "id": "court_1792119214668",
        "name": "Palm Park Courtyard #1",
        "type": "courtyard",
        "color": "#10b981",
        "fillOpacity": 0.55,
        "latlngs": [
          [
            21.127407367046377,
            81.765024214983
          ],
          [
            21.127163562005094,
            81.76579132676125
          ],
          [
            21.12758004768875,
            81.76595225930215
          ],
          [
            21.127648813060635,
            81.76592007279397
          ],
          [
            21.127838956757166,
            81.76522001624107
          ]
        ]
      }
    ]
  },
  {
    "id": "bldg_1792128996063",
    "name": "Sabari House (Girls Hostel 1)",
    "shortName": "Sabari House",
    "badge": "GH-1",
    "category": "HOSTEL",
    "color": "#ec4899",
    "mapPin": {
      "lat": 21.129551,
      "lng": 81.7663
    },
    "wings": [],
    "floors": [
      "1",
      "2",
      "3",
      "4"
    ],
    "roomsPerFloor": 24,
    "customRooms": [],
    "description": "Girls Hostel 1 located in the northern residential sector",
    "polygons": [
      {
        "id": "wing_1792129078377",
        "name": "Sabari Wing #1",
        "color": "#030577",
        "fillOpacity": 0.45,
        "latlngs": [
          [
            21.129632645557937,
            81.76605150103569
          ],
          [
            21.12981018272239,
            81.76641762256624
          ],
          [
            21.129561893509386,
            81.76658123731615
          ],
          [
            21.129381855518478,
            81.76621645689012
          ]
        ]
      }
    ],
    "entrances": [
      {
        "id": "ent_1792129083792",
        "name": "Sabari Entrance #1",
        "lat": 21.129726,
        "lng": 81.76622
      }
    ]
  },
  {
    "id": "bldg_1792132762957",
    "name": "Aranya Guest House",
    "shortName": "Guest House",
    "badge": "AGH",
    "category": "AMENITY",
    "color": "#6366f1",
    "mapPin": {
      "lat": 21.128381,
      "lng": 81.764857
    },
    "wings": [],
    "floors": [
      "1",
      "2"
    ],
    "roomsPerFloor": 24,
    "customRooms": [
      "VIP Suite 1",
      "VIP Suite 2",
      "Guest Room 101",
      "Guest Room 102",
      "Dining Hall",
      "Reception Lounge"
    ],
    "description": "Institute guest house for visiting faculty, delegates, and guests",
    "polygons": [
      {
        "id": "wing_1792134536830",
        "name": "Guest House  Wing #1",
        "color": "#6366f1",
        "fillOpacity": 0.45,
        "latlngs": [
          [
            21.1284091065997,
            81.76472045481205
          ],
          [
            21.128394728461934,
            81.76476471126081
          ],
          [
            21.128408481463296,
            81.7647707462311
          ],
          [
            21.12840348037204,
            81.76481232047081
          ],
          [
            21.128224066111603,
            81.76474258303644
          ],
          [
            21.128190933837676,
            81.76485925912857
          ],
          [
            21.128310960153346,
            81.76490083336832
          ],
          [
            21.12826219947432,
            81.76504634320737
          ],
          [
            21.128384101141823,
            81.76509328186513
          ],
          [
            21.12842848582665,
            81.76493704319002
          ],
          [
            21.1285542158965,
            81.76498331129551
          ],
          [
            21.12857984646135,
            81.76486127078533
          ],
          [
            21.128479824719776,
            81.76481902599336
          ],
          [
            21.128470447678023,
            81.76483780145645
          ],
          [
            21.128423562460455,
            81.76482036709787
          ],
          [
            21.12843919086797,
            81.76478281617165
          ],
          [
            21.128456694682413,
            81.76479287445547
          ],
          [
            21.128469197405757,
            81.76473721861841
          ]
        ]
      }
    ],
    "entrances": [],
    "courtyards": []
  },
  {
    "id": "bldg_1792159282829",
    "name": "Volleyball Court",
    "shortName": "Volleyball Court",
    "badge": "VC",
    "category": "INFRASTRUCTURE",
    "color": "#6366f1",
    "mapPin": {
      "lat": 21.128054,
      "lng": 81.7651
    },
    "wings": [],
    "floors": [],
    "roomsPerFloor": 24,
    "customRooms": [
      "Court #1",
      "Court #2",
      "Referee Stand",
      "Spectator Seating"
    ],
    "description": "Outdoor volleyball arena",
    "polygons": [],
    "entrances": []
  },
  {
    "id": "bldg_1792159326181",
    "name": "New Amphitheater",
    "shortName": "New Amphi",
    "badge": "Am-2",
    "category": "AMENITY",
    "color": "#1d1f90",
    "mapPin": {
      "lat": 21.127579,
      "lng": 81.766785
    },
    "wings": [],
    "floors": [
      "1"
    ],
    "roomsPerFloor": 24,
    "customRooms": [
      "Central Performance Stage",
      "Circular Tiered Seating",
      "Audio/Lighting Desk"
    ],
    "description": "Large circular open-air amphitheater",
    "polygons": [
      {
        "id": "wing_1792159385694",
        "name": "Building 14 Wing #1",
        "color": "#6366f1",
        "fillOpacity": 0.45,
        "latlngs": [
          [
            21.12740737618014,
            81.76650144159794
          ],
          [
            21.127357364922307,
            81.76655039191246
          ],
          [
            21.127324854216315,
            81.76659666001798
          ],
          [
            21.127286095471387,
            81.76668718457222
          ],
          [
            21.127276718354164,
            81.7667656391859
          ],
          [
            21.127287345753654,
            81.76685683429243
          ],
          [
            21.127319227947524,
            81.76694735884666
          ],
          [
            21.12735678033363,
            81.76699362695219
          ],
          [
            21.12742742123069,
            81.76704794168474
          ],
          [
            21.12749376383726,
            81.7670761048794
          ],
          [
            21.1275369187845,
            81.76708348095417
          ],
          [
            21.127637015507663,
            81.76707811653614
          ],
          [
            21.127686401531715,
            81.76705598831178
          ],
          [
            21.127738288096268,
            81.76702380180359
          ],
          [
            21.127777671862034,
            81.76699161529542
          ],
          [
            21.127689527228902,
            81.76687158644201
          ],
          [
            21.127652018858473,
            81.76690109074116
          ],
          [
            21.127613794096643,
            81.76691986620426
          ],
          [
            21.12756190748854,
            81.76691986620426
          ],
          [
            21.12750814544173,
            81.76690444350243
          ],
          [
            21.12746563590253,
            81.76685951650143
          ],
          [
            21.127441255426024,
            81.76679983735085
          ],
          [
            21.12744250570697,
            81.76672875881196
          ],
          [
            21.127489391234754,
            81.76665566861631
          ],
          [
            21.127513146563174,
            81.76663152873516
          ]
        ]
      }
    ],
    "entrances": [],
    "courtyards": [
      {
        "id": "court_1792159435877",
        "name": "Building 14 Courtyard #1",
        "type": "courtyard",
        "color": "#10b981",
        "fillOpacity": 0.55,
        "latlngs": [
          [
            21.12740737618014,
            81.76650144159794
          ],
          [
            21.127513146563174,
            81.76663152873516
          ],
          [
            21.127489391234754,
            81.76665566861631
          ],
          [
            21.12744250570697,
            81.76672875881196
          ],
          [
            21.127441255426024,
            81.76679983735085
          ],
          [
            21.12746563590253,
            81.76685951650143
          ],
          [
            21.12750814544173,
            81.76690444350243
          ],
          [
            21.12756190748854,
            81.76691986620426
          ],
          [
            21.127613794096643,
            81.76691986620426
          ],
          [
            21.127652018858473,
            81.76690109074116
          ],
          [
            21.127689527228902,
            81.76687158644201
          ],
          [
            21.127777671862034,
            81.76699161529542
          ],
          [
            21.127817363624704,
            81.76702179014683
          ],
          [
            21.12784236917814,
            81.76702614873649
          ],
          [
            21.127869562712746,
            81.76694132387638
          ],
          [
            21.12786737472739,
            81.7668514698744
          ],
          [
            21.127849870843356,
            81.76676530390979
          ],
          [
            21.127806670366155,
            81.76665835082532
          ],
          [
            21.127766036329877,
            81.76659934222698
          ],
          [
            21.127698158031357,
            81.76652122288944
          ],
          [
            21.127667211938572,
            81.76649305969478
          ],
          [
            21.127597782572998,
            81.76645919680595
          ],
          [
            21.12750208883969,
            81.76643773913383
          ],
          [
            21.127445157137448,
            81.76643908023836
          ],
          [
            21.127420464087287,
            81.76645986735822
          ]
        ]
      }
    ]
  },
  {
    "id": "bldg_1792159559173",
    "name": "Old Amphitheater",
    "shortName": "Old Amphi",
    "badge": "Am-1",
    "category": "AMENITY",
    "color": "#6366f1",
    "mapPin": {
      "lat": 21.128898,
      "lng": 81.765888
    },
    "wings": [],
    "floors": [
      "1"
    ],
    "roomsPerFloor": 24,
    "customRooms": [
      "Amphitheater Stage",
      "Tiered Stone Seating",
      "Backstage Area"
    ],
    "description": "Open-air amphitheater with tiered seating",
    "polygons": [
      {
        "id": "wing_1792159615829",
        "name": "Building 15 Wing #1",
        "color": "#6366f1",
        "fillOpacity": 0.45,
        "latlngs": [
          [
            21.128609200615223,
            81.7657256126404
          ],
          [
            21.12887182177883,
            81.7662137746811
          ],
          [
            21.12886856325084,
            81.76610447466375
          ],
          [
            21.128958582585277,
            81.76604010164739
          ],
          [
            21.12902172111363,
            81.76605820655824
          ],
          [
            21.12905797887025,
            81.76593549549581
          ],
          [
            21.12894107883008,
            81.76571287214756
          ],
          [
            21.128818552485864,
            81.76568873226643
          ],
          [
            21.128798903302783,
            81.76577791571619
          ],
          [
            21.128726340343583,
            81.7658154666424
          ]
        ]
      }
    ],
    "entrances": []
  },
  {
    "id": "bldg_1792159926765",
    "name": "Football Ground",
    "shortName": "Football Ground",
    "badge": "FG",
    "category": "INFRASTRUCTURE",
    "color": "#6366f1",
    "mapPin": {
      "lat": 21.129261,
      "lng": 81.765586
    },
    "wings": [],
    "floors": [],
    "roomsPerFloor": 24,
    "customRooms": [
      "Football Turf",
      "North Goal Area",
      "South Goal Area",
      "Team Dugout & Player Bench"
    ],
    "description": "Full-sized outdoor football sports turf and athletic field",
    "polygons": [],
    "entrances": [],
    "courtyards": [
      {
        "id": "court_1792159967413",
        "name": "Football Ground  Courtyard #1",
        "type": "courtyard",
        "color": "#10b981",
        "fillOpacity": 0.55,
        "latlngs": [
          [
            21.129658789598494,
            81.7658516764641
          ],
          [
            21.129216196101503,
            81.7661038041115
          ],
          [
            21.129031156620684,
            81.76535546779634
          ],
          [
            21.1291161747892,
            81.76501214504243
          ],
          [
            21.129523761214042,
            81.76512479782106
          ]
        ]
      }
    ]
  },
  {
    "id": "bldg_1792221838963",
    "name": "Shopping Complex & Incubation Center",
    "shortName": "Incubation Center",
    "badge": "B-17",
    "category": "AMENITY",
    "color": "#6366f1",
    "mapPin": {
      "lat": 21.128913,
      "lng": 81.76686
    },
    "wings": [],
    "floors": [
      "1",
      "2"
    ],
    "roomsPerFloor": 24,
    "customRooms": [
      "Gym",
      "Mess",
      "B-mart",
      "clinic",
      "Incubation center"
    ],
    "description": "Newly placed building on campus",
    "polygons": [
      {
        "id": "wing_1792221980227",
        "name": "Incubation Center Wing #1",
        "color": "#6366f1",
        "fillOpacity": 0.45,
        "latlngs": [
          [
            21.12898224879295,
            81.76660403609276
          ],
          [
            21.1287209425601,
            81.76676228642465
          ],
          [
            21.128883477591614,
            81.76707878708841
          ],
          [
            21.12914728407115,
            81.76691383123399
          ]
        ]
      }
    ],
    "entrances": [
      {
        "id": "ent_1792221988747",
        "name": "Incubation Center Entrance #1",
        "lat": 21.12902,
        "lng": 81.767016
      }
    ]
  }
];
