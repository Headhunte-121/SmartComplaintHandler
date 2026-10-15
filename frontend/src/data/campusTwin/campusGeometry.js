/**
 * frontend/src/data/campusTwin/campusGeometry.js
 *
 * Exact 1:1 Satellite-Traced Polygon Geometry for the IIIT Naya Raipur Digital Twin.
 * Traced directly from the 735 x 857 satellite survey grid (viewBox: -55 0 840 857).
 * Every building wing, courtyard, dome, sports court, amphitheatre, road, and footpath
 * uses its exact satellite pixel vertices so nothing is misaligned.
 */

export const IIITNR_CAMPUS_PERIMETER_POINTS = '171,25 777,212 556,840 -45,654';

export const INNER_CAMPUS_CLIP_POINTS =
  '195,28 255,48 236,128 295,160 360,185 425,132 478,215 442,265 548,412 662,468 562,835 328,760 15,645';

export const IIITNR_CAMPUS_BOUNDARY_CORNERS = [
  { id: 'pillar_nw', x: 171, y: 25, label: 'Northwest Boundary Pillar #1', subtitle: 'North Boundary Wall · Railway Corridor' },
  { id: 'pillar_ne', x: 777, y: 212, label: 'Northeast Boundary Pillar #2', subtitle: 'North Woodland Perimeter Wall' },
  { id: 'pillar_se', x: 556, y: 840, label: 'Southeast Boundary Pillar #3', subtitle: 'Naya Raipur Marg (East Sector Entry)' },
  { id: 'pillar_sw', x: -45, y: 654, label: 'Southwest Boundary Pillar #4', subtitle: 'Naya Raipur Marg & West Avenue Junction' },
];

/**
 * Non-overlapping label pill positions for all 18 Digital Twin zones
 */
export const LABEL_POSITIONS = {
  sports_ground: { x: 206, y: 46 },
  ramanujan_house: { x: 405, y: 138 },
  football_ground: { x: 306, y: 346 },
  transit_hostel: { x: 438, y: 282 },
  old_amphitheatre: { x: 352, y: 374 },
  sac_mph: { x: 522, y: 378 },
  krc_library: { x: 514, y: 472 },
  academic_block: { x: 402, y: 524 },
  shabhari_house: { x: 578, y: 526 },
  raman_house: { x: 148, y: 340 },
  central_mess: { x: 216, y: 402 },
  auditorium_hall: { x: 268, y: 458 },
  canteen_block: { x: 328, y: 574 },
  outdoor_courts: { x: 174, y: 502 },
  bose_house: { x: 112, y: 610 },
  bhabha_house: { x: 204, y: 632 },
  amphitheatre: { x: 472, y: 646 },
  main_gate: { x: 338, y: 780 },
};

/**
 * Exact 1:1 Satellite-Traced Polygons for each building & complex
 */
export const EXACT_BUILDING_POLYGONS = {
  // 1. Sports Complex (Far NW Indoor Stadium at 206, 92)
  sports_ground: {
    mainHall: '199,60 231,71 213,124 181,113',
    westAnnex: '189,57 199,60 181,113 171,110',
    southApron: '176,113 213,125 209,135 172,123',
    trussLines: [
      [196, 70, 228, 81],
      [192, 81, 224, 92],
      [189, 92, 221, 103],
      [185, 103, 217, 114],
    ],
  },

  // 2. Ramanujan House (Boys Hostel 1 at 405, 210)
  ramanujan_house: {
    outerHull: '346,196 420,152 452,208 378,252',
    innerCourtyard: '364,200 416,169 436,204 384,235',
    westGreenCourt: '382,208 398,198 409,216 393,226',
    eastRedCourt: '398,198 414,188 425,206 409,216',
    sawtoothEastFingers: [
      '418,158 430,151 435,159 423,166',
      '425,169 437,162 442,170 430,177',
      '431,180 443,173 448,181 436,188',
      '438,191 450,184 455,192 443,199',
      '444,202 456,195 461,203 449,210',
    ],
  },

  // 3. Main Football Ground (FG at 314, 352)
  football_ground: {
    turfPolygon: '234,394 252,304 362,284 395,368 342,418 282,410',
    trackCurve: 'M 240,392 Q 312,360 366,388',
    floodlights: [
      { x: 256, y: 308, id: 'FG-1' },
      { x: 358, y: 290, id: 'FG-2' },
      { x: 388, y: 365, id: 'FG-3' },
      { x: 242, y: 390, id: 'FG-4' },
    ],
  },

  // 4. Faculty Residences, Staff Quarters, Transit Hostel & Long North Wing
  transit_hostel: {
    longNorthWing: '363,303 376,296 408,364 395,371',
    longWingLine: [369, 300, 401, 367],
    facultyBlock1West: '394,308 406,301 422,328 410,335',
    facultyBlock1East: '408,298 422,290 438,318 424,326',
    facultyBlock1Bridge: '402,312 428,298 434,308 408,322',
    facultyBlock2: '426,342 448,329 460,349 438,362',
    facultyBlock3: '446,368 468,355 480,374 458,387',
    solarUtilityShed: '427,382 441,374 453,395 439,403',
  },

  // 5. Old Amphitheatre (North Academic Stepped Acoustic Bowl at 374, 392)
  old_amphitheatre: {
    outerBowl: '356,388 382,374 392,394 366,408',
    stepArc1: 'M 360,390 Q 374,380 385,388',
    stepArc2: 'M 364,396 Q 375,388 388,394',
    stageCenter: { x: 378, y: 398, r: 4.5 },
  },

  // 6. Multi-Purpose Hall (MPH) & Student Activity Centre (SAC at 486, 400)
  sac_mph: {
    westCourtyardWing: '456,390 477,378 494,416 473,427',
    westInnerCourt: '464,393 475,387 484,407 473,413',
    eastWhiteRoofHall: '477,378 497,368 514,406 494,416',
  },

  // 7. Central Library / Knowledge Resource Centre (KRC at 478, 458)
  krc_library: {
    mainBlock: '456,454 486,436 502,463 472,481',
    courtyardCutout: '462,452 476,444 483,456 469,464',
  },

  // 8. Main Academic & Administrative Building (Exact satellite trace with Dome at 387, 483)
  academic_block: {
    northAngledWing: '358,421 403,411 406,423 361,433',
    nwFrontCourtyardWing: '346,458 384,435 396,455 358,478',
    nwFrontInnerAtrium: '356,458 378,445 385,455 363,468',
    swFrontAdminWing: '366,506 394,489 406,508 378,525',
    centralSpine: '376,425 389,418 435,498 422,506',
    neLabWing1: '385,436 418,416 425,428 392,448',
    neLabWing2: '396,454 430,433 437,445 403,466',
    neLabWing3: '410,478 445,457 452,469 417,490',
    neLabWing4: '421,497 456,476 463,488 428,509',
    rearConnectorSpine: '414,420 421,416 462,486 455,490',
    rotundaDome: { cx: 387, cy: 483, rOuter: 11.5, rInner: 5 },
  },

  // 9. Central Mess, Dining Block & Shopping Complex (Block C1)
  central_mess: {
    shoppingBlockC1: '220,411 252,421 244,444 212,434',
    substationAnnex: '213,438 228,443 223,457 208,452',
    messNorthWing: '208,458 246,470 242,482 204,470',
    messWestSpine: '204,466 218,471 206,508 192,503',
    messSouthWing: '192,494 236,508 232,520 188,506',
  },

  // 10. Main Auditorium Hall (Exact building pinned as "Auditorium" on Google Maps at 266, 496)
  auditorium_hall: {
    upperAngledHall: '246,480 272,464 284,484 258,500',
    lowerMainHall: '246,498 286,510 278,532 238,520',
  },

  // 11. Canteen IIIT Naya Raipur (Circular Rotunda at 315,534 & Curved Arcade Plaza at 326,538)
  canteen_block: {
    rotunda: { cx: 315, cy: 534, r: 12.5 },
    curvedArcadePath: 'M 316,513 A 25,25 0 1,1 312,558 L 320,550 A 15,15 0 1,0 322,521 Z',
    plazaCenter: { cx: 326, cy: 536, r: 19 },
  },

  // 12. Outdoor Sports Courts (West Twin Red Courts at 188,526 & Academic North Green Court at 406,392)
  outdoor_courts: {
    westRedCourtPad: '180,512 204,520 196,542 172,534',
    westRedCourt1: '180,513 191,517 184,538 173,534',
    westRedCourt2: '192,517 203,521 196,542 185,538',
    academicGreenCourt: '392,386 416,376 422,392 398,402',
  },

  // 13. Shabri House (Girls Hostel at 570, 478 + East Annex at 610, 488)
  shabhari_house: {
    outerQuad: '550,444 606,462 590,512 534,494',
    innerCourtyard: '556,456 594,468 584,500 546,488',
    westBlueCourt: '558,459 574,464 566,491 550,486',
    eastTanCourt: '575,465 591,470 583,497 567,492',
    eastAnnex: '608,470 623,475 613,507 598,502',
  },

  // 14. Raman House & Phase-2 Upper-West Hostel Cluster
  raman_house: {
    mainQuad: '158,352 202,366 190,404 146,390',
    mainQuadCourt: '168,364 190,371 184,391 162,384',
    dLawnCourt: '122,374 148,382 140,408 114,400',
    outerWestBlock: '96,372 124,381 114,413 86,404',
    southSteppedWing: '128,418 174,433 165,460 119,445',
    westAnnexBlock: '84,431 104,438 97,460 77,453',
  },

  // 15. Bose House (Boys Hostel 3 at 115, 560)
  bose_house: {
    outerQuad: '94,524 154,544 136,598 76,578',
    innerCourtyard: '104,539 140,551 129,583 93,571',
    innerGreenCourt: '107,543 136,553 127,579 98,569',
  },

  // 16. Bhabha House (Boys Hostel 2 at 200, 586)
  bhabha_house: {
    outerQuad: '180,554 232,571 216,620 164,603',
    innerCourtyard: '189,567 220,577 210,607 179,597',
    innerGreenCourt: '192,571 216,579 208,603 184,595',
  },

  // 17. New Amphitheatre (Amphitheatre 2 at 468, 595 + NE Landscaped Terraces)
  amphitheatre: {
    neTerracePolygon: '448,538 508,518 572,546 528,582',
    neTerraceArcs: [
      'M 454,544 Q 508,522 562,548',
      'M 462,555 Q 508,535 550,558',
      'M 470,566 Q 508,548 538,568',
    ],
    stageCenter: { cx: 456, cy: 580, r: 10 },
    bowlCenter: { cx: 468, cy: 595, angle: 35 },
    nwRamp: '430,554 454,574 448,582 424,562',
  },

  // 18. Main Gate No. 1, Union Bank of India ATM, Crossroads Plinth & West Gate
  main_gate: {
    mainGateArch: '322,746 354,756 350,768 318,758',
    atmKiosk: '336,674 356,680 348,702 328,696',
    crossroadsPlinth: { cx: 358, cy: 582, r: 7 },
    westGate: '32,604 52,611 48,621 28,614',
  },
};

/**
 * Complete Internal Road Network Polylines (1:1 satellite-traced)
 */
export const CAMPUS_ROAD_POLYLINES = [
  // 1. Western Boundary Avenue (from West Gate 42,612 up to Sports Complex 198,65)
  { points: '42,612 198,65', width: 11 },
  // 2. Ramanujan House Rectangular Loop Road & Dual Southern Stems
  { points: '330,194 426,138 470,214 375,272 330,194', width: 9.5 },
  { points: '352,232 380,278', width: 8.5 },
  { points: '375,272 385,278', width: 8.5 },
  // 3. Southern Hostel Road (from Western Ave 48,592 past Bose & Bhabha to ATM 352,688)
  { points: '48,592 145,625 352,688', width: 10.5 },
  // 4. Main Gate Entrance Boulevard (from Main Gate 338,755 past ATM 352,688 to Central Crossroads 378,580)
  { points: '338,755 352,688 378,580', width: 13 },
  // 5. Academic Teardrop Roundabout Loop (wrapping around 416,532)
  { points: '378,580 395,532 438,512 496,512', width: 10 },
  { points: '378,580 438,548 496,512', width: 10 },
  // 6. Inner Western Hostel Spine Road (from 145,625 between Bose/Bhabha up to FG NW 252,302)
  { points: '145,625 178,515 212,402 252,302', width: 11 },
  // 7. Mid-West Hostel Cross Street (between Raman House and Bose House)
  { points: '62,508 178,546', width: 8.5 },
  // 8. Tree-Lined Northern & Eastern Main Loop Road
  { points: '235,342 252,302 380,278 445,278 532,412 518,458 496,512', width: 11.5 },
  // 9. Central Spine Road (between Block C1 / Auditorium / Canteen and Main Academic Building)
  { points: '212,402 305,442 338,495 378,580', width: 11 },
  // 10. Academic Rotunda Portico Semicircular Drop-Off Loop
  { points: '338,495 356,472 376,483', width: 7.5 },
  // 11. Southeast Avenue between Shabri House & New Amphitheatre Terraces
  { points: '496,512 618,542', width: 10.5 },
  // 12. Eastern Boundary Road
  { points: '648,472 555,830', width: 10.5 },
];

/**
 * Complete Pedestrian Footpath & Walkway Polylines (1:1 satellite-traced)
 */
export const CAMPUS_FOOTPATH_POLYLINES = [
  // (A) Direct Diagonal Footpath from Ramanujan House (330,194) to Sports Complex (206,118)
  { points: '330,194 296,166 264,142 206,118', label: 'Ramanujan ↔ Sports Path' },
  // (B) North-South Field Connector Path from Diagonal Path (264,142) to Football Ground NW (248,302)
  { points: '264,142 251,215 248,302' },
  // (C) Sports Complex Parallel West Sidewalk
  { points: '175,120 205,124' },
  // (D) Pavilion Service Walkway along East Side of Football Ground
  { points: '368,282 406,366' },
  // (E) Old Amphitheatre (374,392), North Green Court (406,392), Solar Shed & MPH Promenade
  { points: '348,398 374,392 406,392 440,388 475,396' },
  // (F) Academic Rotunda (387,483) to KRC Library (478,458) & Shabri House (550,472)
  { points: '338,495 387,483 478,458 542,472' },
  // (G) Canteen (326,538) -> Auditorium (266,512) -> Mess (222,486) -> West Twin Red Courts (188,526)
  { points: '326,538 268,514 222,492 188,526' },
  // (H) Central Road (305,442) -> Auditorium Upper Hall (264,482) -> Mess North Wing (225,470)
  { points: '305,442 264,482 225,470' },
  // (I) Shopping Complex / Block C1 (232,427) -> Substation Annex (218,448) -> Mess (222,470)
  { points: '232,427 218,448 222,470' },
  // (J) South Central Green Lawn East-West Footpath
  { points: '222,602 358,602' },
  // (K) Raman House Courtyard & Garden Walkways
  { points: '78,422 148,438 198,454' },
  { points: '108,392 136,390 176,376' },
  // (L) Bose House (115,560) to Bhabha House (200,586) Courtyard Path
  { points: '115,560 160,574 200,586' },
  // (M) New Amphitheatre Stage Ramp & Woodland Trail to ATM
  { points: '428,555 456,580' },
  { points: '468,632 425,685 352,688' },
];

export const FOREST_CLUSTERS = [
  { x: 488, y: 248, r: 12 },
  { x: 506, y: 274, r: 14 },
  { x: 522, y: 302, r: 11 },
  { x: 544, y: 338, r: 15 },
  { x: 565, y: 372, r: 13 },
  { x: 585, y: 412, r: 14 },
  { x: 618, y: 445, r: 12 },
  { x: 552, y: 588, r: 15 },
  { x: 582, y: 602, r: 16 },
  { x: 538, y: 635, r: 14 },
  { x: 568, y: 652, r: 15 },
  { x: 515, y: 678, r: 16 },
  { x: 548, y: 698, r: 14 },
  { x: 482, y: 712, r: 15 },
  { x: 524, y: 742, r: 16 },
  { x: 445, y: 738, r: 14 },
  { x: 492, y: 775, r: 15 },
  { x: 535, y: 795, r: 13 },
  { x: 398, y: 722, r: 12 },
  { x: 285, y: 695, r: 10 },
  { x: 248, y: 678, r: 11 },
];

export const BOULEVARD_TREES = [
  { x: 262, y: 296 },
  { x: 282, y: 292 },
  { x: 302, y: 288 },
  { x: 322, y: 285 },
  { x: 342, y: 282 },
  { x: 362, y: 279 },
  { x: 346, y: 732 },
  { x: 354, y: 706 },
  { x: 366, y: 656 },
  { x: 372, y: 628 },
  { x: 378, y: 602 },
];
