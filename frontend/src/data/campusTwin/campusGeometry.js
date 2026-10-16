/**
 * frontend/src/data/campusTwin/campusGeometry.js
 *
 * Clean Vectorized Campus Map Geometry for IIIT Naya Raipur.
 * Source of truth: Authentic GIS GeoJSON dataset (16 buildings, 10 roads, 11 footpaths).
 * Extracted directly from IIIT_Naya_Raipur_GIS_Complete (1).geojson via exact affine conversion.
 * ViewBox: -55 0 840 857 (Campus active bounds: X=[230..490], Y=[180..620])
 */

// Outer 50-Acre Campus Perimeter & Clipped Digital Twin Zone
export const IIITNR_CAMPUS_PERIMETER_POINTS = '200,160 520,160 520,645 200,645';
export const INNER_CAMPUS_CLIP_POINTS = '210,165 510,165 510,635 210,635';

export const IIITNR_CAMPUS_BOUNDARY_CORNERS = [
  { id: 'pillar_nw', x: 200, y: 160, label: 'Northwest Boundary Pillar #1', subtitle: 'Sports Complex Corridor' },
  { id: 'pillar_ne', x: 520, y: 160, label: 'Northeast Boundary Pillar #2', subtitle: 'North Woodland Perimeter Wall' },
  { id: 'pillar_se', x: 520, y: 645, label: 'Southeast Boundary Pillar #3', subtitle: 'Naya Raipur Marg & East Avenue' },
  { id: 'pillar_sw', x: 200, y: 645, label: 'Southwest Boundary Pillar #4', subtitle: 'Naya Raipur Marg & West Avenue Junction' },
];

/**
 * Non-overlapping label pill positions for all 16 authentic Digital Twin zones
 */
export const LABEL_POSITIONS = {
  academic_block: { x: 387.0, y: 481.0 },
  auditorium_hall: { x: 330.4, y: 494.0 },
  canteen_block: { x: 362.6, y: 542.6 },
  ramanujan_house: { x: 376.6, y: 270.5 },
  bhabha_house: { x: 263.4, y: 539.3 },
  bose_house: { x: 310.9, y: 572.4 },
  raman_house: { x: 474.6, y: 469.7 },
  bldg_1792074173914: { x: 287.6, y: 204.2 },
  bldg_1792097005723: { x: 409.5, y: 411.2 },
  bldg_1792119172307: { x: 358.9, y: 584.0 },
  bldg_1792128996063: { x: 385.8, y: 347.4 },
  bldg_1792132762957: { x: 304.2, y: 465.7 },
  bldg_1792159282829: { x: 312.5, y: 514.4 },
  bldg_1792159326181: { x: 443.9, y: 572.0 },
  bldg_1792159559173: { x: 362.9, y: 448.0 },
  bldg_1792159926765: { x: 338.0, y: 391.1 },
};

/**
 * Exact Authentic Satellite/GIS-Traced Polygons for all 16 campus buildings
 */
export const EXACT_BUILDING_POLYGONS = {
  // Academic & Administrative Block (Academic Block)
  academic_block: {
    pin: { x: 387.0, y: 481.0 },
    wings: [
      { name: 'Academic Block Wing #1', points: '384.1,514.5 388.3,508.6 389.9,511.0 394.5,506.5 394.2,502.9 400.7,495.0 402.8,498.2 406.5,493.4 406.0,489.3 411.8,481.8 407.6,472.4 403.0,478.0 398.5,467.4 401.8,463.3 397.1,452.7 393.8,458.0 391.7,450.9 396.7,445.2 404.9,463.8 409.3,458.2 399.7,437.7 397.5,440.3 394.0,432.8 390.4,437.8 386.4,431.3 361.1,458.5 362.9,463.0 363.4,467.5 358.1,471.5 363.0,482.4 371.3,474.6 373.1,479.5 369.9,482.7 374.7,493.5 378.0,490.3 382.6,500.0 378.8,504.1 383.2,514.7' },
    ],
    courtyards: [
    ],
    entrances: [
      { name: 'Front Main Portico Entrance', x: 400.2, y: 499.1 },
      { name: 'West Wing Entrance', x: 372.2, y: 480.5 },
    ],
  },
  // Central Campus Auditorium (Auditorium)
  auditorium_hall: {
    pin: { x: 344.4, y: 494.0 },
    wings: [
      { name: 'Auditorium Wing #1', points: '345.6,512.4 347.7,516.5 353.6,510.1 351.4,506.1 354.6,503.6 352.4,497.8 355.4,494.6 353.3,490.0 358.7,483.9 352.5,469.5 347.2,476.6 345.5,472.3 341.3,476.0 339.7,472.8 338.1,474.3 335.7,469.5 329.7,476.2 331.5,480.5 329.8,483.5 343.7,514.0' },
    ],
    courtyards: [
    ],
    entrances: [
      { name: 'Auditorium Front Plaza Entrance', x: 356.0, y: 478.1 },
      { name: 'Auditorium Entrance Back', x: 351.9, y: 511.4 },
      { name: 'Auditorium Entrance Side', x: 332.6, y: 487.9 },
    ],
  },
  // Canteen IIIT Naya Raipur (Rotunda & Arcade) (Canteen)
  canteen_block: {
    pin: { x: 362.6, y: 524.6 },
    wings: [
      { name: 'Canteen Wing #1', points: '367.0,535.9 368.9,532.9 370.4,527.9 370.5,524.9 369.9,520.5 368.5,516.5 366.9,514.4 364.5,511.6 361.7,510.8 358.7,511.3 357.4,512.8 358.0,514.9 357.7,514.5 355.4,516.9 356.1,518.0 354.1,520.0 351.5,522.5 352.8,525.7 352.0,526.4 356.8,537.8 357.7,537.0 359.0,540.2 363.6,535.0 364.5,536.7 366.1,534.6' },
    ],
    courtyards: [
    ],
    entrances: [
      { name: 'Canteen Arcade Entry', x: 362.2, y: 514.5 },
    ],
  },
  // Ramanujan House (Boys Hostel 1) (Ramanujan House)
  ramanujan_house: {
    pin: { x: 376.6, y: 292.5 },
    wings: [
      { name: 'Ramanujan House Wing #1', points: '369.0,329.2 371.5,326.5 370.9,324.9 373.9,322.2 372.3,318.8 372.6,318.4 373.6,320.2 374.9,318.2 375.9,316.4 376.6,317.9 391.7,300.9 391.2,300.0 391.8,299.3 393.4,302.4 398.0,297.3 394.6,288.5 400.1,283.2 387.6,254.2 383.7,258.4 381.9,261.5 380.9,259.8 377.6,262.5 378.1,264.1 376.5,265.4 377.5,267.6 375.4,270.4 374.3,269.5 358.7,285.4 357.7,284.3 353.4,287.9 354.6,294.1' },
    ],
    courtyards: [
    ],
    entrances: [
    ],
  },
  // Bhabha House (Boys Hostel 2) (Bhabha House)
  bhabha_house: {
    pin: { x: 275.4, y: 539.3 },
    wings: [
      { name: 'Bhabha House Wing #1', points: '281.4,560.5 285.6,525.7 268.2,518.4 267.8,521.3 266.3,520.8 267.1,515.7 263.5,514.3 262.9,518.8 260.6,518.0 258.6,533.7 261.9,535.0 261.2,540.4 262.3,541.1 261.6,544.7 260.4,553.1 262.4,553.4 262.9,549.7 264.1,550.2 263.7,552.2' },
    ],
    courtyards: [
    ],
    entrances: [
      { name: 'Bhabha House Entrance #1', x: 284.3, y: 541.4 },
    ],
  },
  // Bose House (Boys Hostel 3) (Bose House)
  bose_house: {
    pin: { x: 310.9, y: 556.4 },
    wings: [
      { name: 'Bose House Wing #1', points: '314.6,572.0 314.1,575.3 317.9,577.0 319.1,568.4 318.1,568.0 318.7,564.6 322.0,565.9 323.9,550.5 321.2,549.7 322.4,541.4 318.5,539.7 318.0,542.3 304.2,536.1 300.4,566.5' },
    ],
    courtyards: [
    ],
    entrances: [
      { name: 'Bose House Entrance #1', x: 301.0, y: 552.6 },
    ],
  },
  // Raman House (Girls Hostel 1) (Raman House)
  raman_house: {
    pin: { x: 462.6, y: 469.7 },
    wings: [
      { name: 'Raman House Wing #1', points: '448.3,480.3 467.4,488.6 467.3,491.9 470.3,492.6 471.9,484.7 470.8,483.2 471.4,479.9 475.0,481.7 476.0,471.2 477.0,462.9 473.9,461.9 475.1,453.8 471.7,452.8 471.6,455.5 452.8,446.4' },
    ],
    courtyards: [
    ],
    entrances: [
    ],
  },
  // Sports Complex (Sports Complex)
  bldg_1792074173914: {
    pin: { x: 287.6, y: 224.2 },
    wings: [
      { name: 'Sports Complex Wing #1', points: '292.1,239.5 296.2,202.9 282.3,196.8 277.7,233.1' },
    ],
    courtyards: [
    ],
    entrances: [
      { name: 'Sports Complex Entrance #1', x: 278.6, y: 213.8 },
    ],
  },
  // Basketball Court (Outdoor) (Basketball Court)
  bldg_1792097005723: {
    pin: { x: 387.5, y: 421.2 },
    wings: [
      { name: 'Basketball Wing #1', points: '380.1,430.0 396.8,427.7 395.6,411.9 379.2,413.5' },
    ],
    courtyards: [
    ],
    entrances: [
    ],
  },
  // Palm Park & Central Garden (Palm Park)
  bldg_1792119172307: {
    pin: { x: 358.9, y: 564.0 },
    wings: [
    ],
    courtyards: [
      { name: 'Palm Park Courtyard #1', points: '331.5,577.1 376.5,597.8 382.2,557.0 379.8,550.5 339.0,534.7' },
    ],
    entrances: [
    ],
  },
  // Sabari House (Girls Hostel 2) (Sabari House)
  bldg_1792128996063: {
    pin: { x: 385.8, y: 365.4 },
    wings: [
      { name: 'Sabari Wing #1', points: '371.1,358.5 390.3,340.0 401.5,363.3 382.4,382.1' },
    ],
    courtyards: [
    ],
    entrances: [
      { name: 'Sabari Entrance #1', x: 379.9, y: 348.8 },
    ],
  },
  // Aranya Guest House (Guest House)
  bldg_1792132762957: {
    pin: { x: 314.2, y: 483.7 },
    wings: [
      { name: 'Guest House  Wing #1', points: '306.3,481.5 308.9,482.7 309.1,481.4 311.5,481.7 309.0,499.3 315.9,502.1 317.2,490.3 325.8,494.5 327.4,482.5 318.3,478.8 319.9,466.5 312.8,464.5 311.3,474.3 312.4,475.1 311.8,479.7 309.6,478.4 310.0,476.6 306.8,475.6' },
    ],
    courtyards: [
    ],
    entrances: [
    ],
  },
  // Volleyball Court (Outdoor) (Volleyball Court)
  bldg_1792159282829: {
    pin: { x: 330.5, y: 514.4 },
    wings: [
    ],
    courtyards: [
    ],
    entrances: [
    ],
  },
  // New Amphitheatre (Open-Air Stage) (New Amphi)
  bldg_1792159326181: {
    pin: { x: 428.9, y: 554.0 },
    wings: [
      { name: 'Building 14 Wing #1', points: '414.4,571.6 417.6,576.3 420.4,579.2 425.8,582.6 430.3,583.3 435.3,581.9 440.2,578.5 442.5,574.7 444.9,567.7 446.0,561.2 446.0,557.0 444.9,547.3 443.3,542.6 441.1,537.7 438.9,534.1 432.9,543.0 434.9,546.5 436.2,550.2 436.7,555.2 436.2,560.4 434.0,564.7 430.9,567.3 426.9,567.4 422.4,563.1 420.9,560.9' },
    ],
    courtyards: [
      { name: 'Building 14 Courtyard #1', points: '414.4,571.6 420.9,560.9 422.4,563.1 426.9,567.4 430.9,567.3 434.0,564.7 436.2,560.4 436.7,555.2 436.2,550.2 434.9,546.5 432.9,543.0 438.9,534.1 440.3,530.1 440.4,527.7 435.4,525.4 430.3,525.9 425.6,527.9 420.0,532.5 417.0,536.6 413.2,543.5 411.8,546.6 410.5,553.4 410.1,562.7 410.6,568.2 412.0,570.5' },
    ],
    entrances: [
    ],
  },
  // Old Amphitheatre (Old Amphi)
  bldg_1792159559173: {
    pin: { x: 367.9, y: 430.0 },
    wings: [
      { name: 'Building 15 Wing #1', points: '361.1,458.5 386.4,431.3 380.3,432.0 376.0,423.6 376.5,417.4 369.3,414.4 357.7,426.5 357.4,438.4 362.5,440.0 365.2,446.8' },
    ],
    courtyards: [
    ],
    entrances: [
    ],
  },
  // Main Football Ground (Football Ground)
  bldg_1792159926765: {
    pin: { x: 348.0, y: 396.1 },
    wings: [
    ],
    courtyards: [
      { name: 'Football Ground  Courtyard #1', points: '359.7,356.7 377.5,398.5 336.9,419.1 317.0,412.2 320.0,372.4' },
    ],
    entrances: [
    ],
  },
};

/**
 * Complete Campus Road Network Polylines (10 authentic GIS-traced roads)
 */
export const CAMPUS_ROAD_POLYLINES = [
  // Road #1
  { name: 'Road #1', points: '384.3,598.0 390.5,545.6 401.0,524.0 414.7,505.6 434.5,490.0 442.6,418.3 393.0,328.8 313.0,365.1 291.1,552.1 289.7,564.8 289.8,568.7 290.3,569.8 290.6,570.3 291.3,572.0 319.1,585.9 377.1,613.0', width: 10 },
  // Road #2
  { name: 'Road #2', points: '377.1,613.0 382.6,615.3 384.3,598.0', width: 14 },
  // Road #3
  { name: 'Road #3', points: '399.4,527.3 397.8,521.2 397.7,512.8 399.6,506.6 402.0,504.2 405.1,502.0 408.6,501.4 410.8,502.7 413.1,504.3 414.2,506.4', width: 14 },
  // Road #4
  { name: 'Road #4', points: '390.5,545.6 342.2,440.3 339.1,435.2 333.6,431.8 306.6,420.2', width: 14 },
  // Road #5
  { name: 'Road #5', points: '434.5,490.0 487.6,505.4', width: 10 },
  // Road #6
  { name: 'Road #6', points: '382.6,615.3 393.9,619.5 399.0,568.7 401.8,552.2 406.1,538.6 416.8,524.8 426.2,515.4 432.7,511.7 447.3,509.9 461.0,513.5', width: 8 },
  // Road #7
  { name: 'Road #7', points: '436.9,511.2 434.5,490.0', width: 10 },
  // Road #8
  { name: 'Road #8', points: '370.8,338.8 344.8,282.1 384.2,240.5', width: 8 },
  // Road #9
  { name: 'Road #9', points: '275.4,187.1 261.5,311.8 244.2,435.4 231.7,543.7 234.3,549.5 243.7,554.1 291.3,572.0', width: 14 },
  // Road #10
  { name: 'Road #10', points: '424.6,497.8 408.2,462.1', width: 16 },
];

/**
 * Complete Pedestrian Walkway Polylines (11 authentic GIS-traced footpaths)
 */
export const CAMPUS_FOOTPATH_POLYLINES = [
  // Footpath #1
  { name: 'Footpath #1', points: '324.0,546.3 349.7,519.2', width: 9 },
  // Footpath #2
  { name: 'Footpath #2', points: '349.7,519.2 351.0,521.8 357.7,514.5 358.4,513.3 361.6,512.4 364.6,513.4 367.8,517.7 371.3,513.2', width: 9 },
  // Footpath #3
  { name: 'Footpath #3', points: '349.7,519.2 348.7,516.6 352.1,511.7', width: 4.5 },
  // Footpath #4
  { name: 'Footpath #4', points: '396.0,521.2 391.4,520.1 390.7,517.8 389.8,517.3 388.2,518.3 388.0,518.9 380.1,516.2 378.8,515.9 376.7,515.4', width: 4.5 },
  // Footpath #5
  { name: 'Footpath #5', points: '344.8,282.1 340.0,279.6 330.0,270.1 316.4,256.0 307.8,247.7 304.4,245.8 293.4,239.0 273.8,230.2 278.3,189.7', width: 4.5 },
  // Footpath #6
  { name: 'Footpath #6', points: '352.5,456.0 353.9,423.3 368.1,406.5 378.5,410.3 382.0,414.2 389.9,413.5 390.3,412.4 396.2,405.7 401.8,397.0 411.5,386.9 419.8,377.2', width: 4.5 },
  // Footpath #7
  { name: 'Footpath #7', points: '397.0,404.4 392.4,396.0 387.1,394.2 383.3,394.2 366.7,357.3 363.0,348.8 360.3,343.6', width: 4.5 },
  // Footpath #8
  { name: 'Footpath #8', points: '407.7,492.4 421.8,491.7', width: 4.5 },
  // Footpath #9
  { name: 'Footpath #9', points: '400.4,500.8 407.7,492.4', width: 4.5 },
  // Footpath #10
  { name: 'Footpath #10', points: '408.2,462.1 409.8,458.7 401.2,439.4 402.2,420.0 397.0,404.4', width: 4.5 },
  // Footpath #11
  { name: 'Footpath #11', points: '401.4,436.1 395.8,427.8 394.5,413.8 389.9,413.5', width: 4.5 },
];

export const FOREST_CLUSTERS = [
  { x: 440, y: 320, r: 12 },
  { x: 460, y: 350, r: 14 },
  { x: 475, y: 390, r: 11 },
  { x: 480, y: 430, r: 13 },
  { x: 450, y: 520, r: 10 },
  { x: 470, y: 550, r: 12 },
];

export const BOULEVARD_TREES = [
  { x: 380, y: 580 },
  { x: 382, y: 560 },
  { x: 395, y: 535 },
  { x: 405, y: 515 },
  { x: 418, y: 495 },
  { x: 360, y: 320 },
  { x: 345, y: 340 },
  { x: 330, y: 365 },
];
