/**
 * frontend/src/data/campusTwin/campusGeometry.js
 *
 * Exact 1:1 GIS GeoJSON-Projected Polygon Geometry for the IIIT Naya Raipur Digital Twin.
 * Generated directly from IIIT_Naya_Raipur_GIS_Complete.geojson (63 survey-traced features:
 * 16 buildings, 13 multi-vertex wing polygons, 3 courtyards, 10 entrances, 10 roads, 11 footpaths).
 * Projected using true-scale equirectangular WGS84 coordinates onto a balanced 1080 x 800 SVG canvas.
 */

export const CAMPUS_VIEWBOX = {
  x: 0,
  y: 0,
  width: 1080,
  height: 800,
  viewBoxStr: '0 0 1080 800',
};

export const IIITNR_CAMPUS_PERIMETER_POINTS = '368,42 685,148 892,468 788,718 562,742 242,628';

export const INNER_CAMPUS_CLIP_POINTS = '368,42 685,148 892,468 788,718 562,742 242,628';

export const IIITNR_CAMPUS_BOUNDARY_CORNERS = [
  { id: 'pillar_nw', x: 368, y: 42, label: 'Northwest Boundary Pillar #1', subtitle: 'North Sports Complex Perimeter' },
  { id: 'pillar_ne', x: 685, y: 148, label: 'Northeast Boundary Pillar #2', subtitle: 'Ramanujan House North Perimeter' },
  { id: 'pillar_e', x: 892, y: 468, label: 'East Boundary Pillar #3', subtitle: 'Raman House East Perimeter' },
  { id: 'pillar_se', x: 788, y: 718, label: 'Southeast Boundary Pillar #4', subtitle: 'New Amphitheater Woodland Corner' },
  { id: 'pillar_s', x: 562, y: 742, label: 'Main Gate Highway Junction #5', subtitle: 'Naya Raipur Marg Main Gate Entry' },
  { id: 'pillar_sw', x: 242, y: 628, label: 'Southwest Boundary Pillar #6', subtitle: 'Bhabha House & West Avenue Corner' },
];

export const SATELLITE_IMAGE_BOUNDS = {
  "x": -103.1,
  "y": -94.6,
  "width": 1327.1,
  "height": 1232.3
};

/**
 * Collision-free callout label positions for all 16 GIS-traced campus buildings
 */
export const LABEL_POSITIONS = {
  "academic_block": { "x": 762, "y": 472 },
  "auditorium_hall": { "x": 298, "y": 526 },
  "canteen_block": { "x": 642, "y": 594 },
  "ramanujan_house": { "x": 758, "y": 222 },
  "bhabha_house": { "x": 188, "y": 608 },
  "bose_house": { "x": 336, "y": 686 },
  "raman_house": { "x": 910, "y": 514 },
  "bldg_1792074173914": { "x": 502, "y": 92 },
  "bldg_1792097005723": { "x": 755, "y": 418 },
  "bldg_1792119172307": { "x": 508, "y": 672 },
  "bldg_1792128996063": { "x": 745, "y": 336 },
  "bldg_1792132762957": { "x": 298, "y": 486 },
  "bldg_1792159282829": { "x": 298, "y": 566 },
  "bldg_1792159326181": { "x": 785, "y": 665 },
  "bldg_1792159559173": { "x": 482, "y": 432 },
  "bldg_1792159926765": { "x": 505, "y": 355 },
  "bldg_1792221838963": { "x": 725, "y": 385 }
};

/**
 * Exact GIS-Traced Polygons, Courtyards, and Entrance Beacons per building ID
 */
export const EXACT_BUILDING_POLYGONS = {
  "academic_block": {
    "cx": 615.9,
    "cy": 524.3,
    "w": 129.3,
    "h": 126.8,
    "color": "#0284c7",
    "badge": "ACAD",
    "wings": [
      {
        "name": "Academic Block Wing #1",
        "points": "602.1,575.2 613.6,566.7 617.0,570.4 629.2,564.1 629.2,558.5 646.6,547.0 651.0,552.2 661.0,545.2 660.6,538.9 676.6,528.2 668.1,513.4 655.8,521.5 646.9,504.8 655.8,498.9 646.6,482.3 637.3,490.0 633.6,478.9 646.9,470.8 663.2,500.0 675.1,491.9 655.8,459.7 649.9,463.4 642.9,451.5 633.2,458.9 624.7,448.6 557.3,487.4 560.7,494.5 561.0,501.5 547.3,507.1 557.0,524.1 578.8,513.0 582.4,520.7 573.8,525.2 583.3,542.2 592.0,537.7 601.4,552.9 591.1,558.8 599.8,575.4"
      }
    ],
    "courtyards": [],
    "entrances": [
      { "name": "Front Main Portico Entrance", "x": 644.5, "y": 553.3, "lat": 21.128164, "lng": 81.766357 },
      { "name": "West Wing Entrance", "x": 579.9, "y": 522.1, "lat": 21.128375, "lng": 81.765889 }
    ]
  },
  "auditorium_hall": {
    "cx": 509.1,
    "cy": 539.9,
    "w": 70.6,
    "h": 72.8,
    "color": "#e11d48",
    "badge": "AUD",
    "wings": [
      {
        "name": "Auditorium Wing #1",
        "points": "508.3,568.0 512.7,574.5 528.4,565.3 523.9,559.1 532.2,555.5 527.9,546.5 535.8,542.0 531.7,534.8 546.3,525.9 534.0,503.4 519.6,513.7 516.2,506.9 505.4,512.1 502.1,507.1 497.7,509.3 492.9,501.7 477.0,511.3 480.3,518.0 475.7,522.5 503.3,570.4"
      }
    ],
    "courtyards": [],
    "entrances": [
      { "name": "Auditorium Front Plaza Entrance", "x": 540.8, "y": 516.9, "lat": 21.12841, "lng": 81.765606 },
      { "name": "Auditorium Entrance Back", "x": 524.0, "y": 567.2, "lat": 21.12807, "lng": 81.765484 },
      { "name": "Auditorium Entrance Side", "x": 481.6, "y": 529.5, "lat": 21.128325, "lng": 81.765177 }
    ]
  },
  "canteen_block": {
    "cx": 547.3,
    "cy": 588.4,
    "w": 46.0,
    "h": 44.5,
    "color": "#f59e0b",
    "badge": "CANTEEN",
    "wings": [
      {
        "name": "Canteen Wing #1",
        "points": "555.8,606.1 561.2,601.7 565.7,594.3 566.7,589.6 566.0,582.8 563.4,576.7 559.9,573.2 554.7,568.8 548.0,567.3 540.6,567.8 537.2,569.9 538.0,573.2 537.5,572.5 531.3,576.0 532.8,577.7 527.5,580.6 520.7,584.1 523.1,589.0 521.2,590.1 530.5,608.0 533.0,606.8 535.4,611.8 547.8,604.4 549.5,607.1 554.0,604.1"
      }
    ],
    "courtyards": [],
    "entrances": [
      { "name": "Canteen Arcade Entry", "x": 548.4, "y": 573.0, "lat": 21.128031, "lng": 81.765661 }
    ]
  },
  "ramanujan_house": {
    "cx": 629.2,
    "cy": 235.9,
    "w": 115.2,
    "h": 112.6,
    "color": "#4f46e5",
    "badge": "BH-3",
    "wings": [
      {
        "name": "Ramanujan House Wing #1",
        "points": "603.1,291.2 609.8,287.3 608.7,284.7 616.4,280.9 613.2,275.6 614.1,275.1 616.1,277.9 619.8,275.0 622.7,272.3 624.0,274.7 664.3,250.2 663.4,248.8 665.0,247.8 668.3,252.8 680.5,245.4 674.0,231.7 688.6,224.1 664.0,178.6 653.4,184.7 648.4,189.1 646.4,186.5 637.9,190.2 638.6,192.8 634.4,194.7 636.4,198.0 630.7,202.1 628.2,200.6 586.8,223.4 584.6,221.5 573.4,226.5 575.1,236.2"
      }
    ],
    "courtyards": [],
    "entrances": []
  },
  "bhabha_house": {
    "cx": 331.1,
    "cy": 602.0,
    "w": 67.6,
    "h": 72.4,
    "color": "#9333ea",
    "badge": "GH-2",
    "wings": [
      {
        "name": "Bhabha House Wing #1",
        "points": "341.5,635.1 359.0,582.3 317.9,569.5 316.3,573.9 312.8,572.9 315.8,565.3 307.1,562.7 304.9,569.6 299.4,568.1 291.4,591.8 299.1,594.2 296.2,602.3 298.7,603.4 296.5,609.0 291.7,621.5 296.5,622.3 298.5,616.6 301.2,617.5 299.9,620.6"
      }
    ],
    "courtyards": [],
    "entrances": [
      { "name": "Bhabha House Entrance #1", "x": 352.5, "y": 606.2, "lat": 21.127807, "lng": 81.764242 }
    ]
  },
  "bose_house": {
    "cx": 414.4,
    "cy": 631.8,
    "w": 60.7,
    "h": 63.8,
    "color": "#6366f1",
    "badge": "BH-2",
    "wings": [
      {
        "name": "Bose House Wing #1",
        "points": "420.2,655.9 418.5,660.9 427.4,663.9 432.0,650.9 429.7,650.2 431.9,645.0 439.8,647.3 447.5,624.0 441.1,622.5 445.7,610.0 436.4,607.0 434.8,610.9 402.2,600.1 386.8,646.0"
      }
    ],
    "courtyards": [],
    "entrances": [
      { "name": "Bose House Entrance #1", "x": 391.0, "y": 625.0, "lat": 21.12768, "lng": 81.764521 }
    ]
  },
  "raman_house": {
    "cx": 803.3,
    "cy": 514.7,
    "w": 73.7,
    "h": 72.2,
    "color": "#7c3aed",
    "badge": "BH-1",
    "wings": [
      {
        "name": "Raman House Wing #1",
        "points": "766.1,529.5 811.1,544.1 810.1,549.1 817.4,550.4 822.7,538.6 820.5,536.2 822.5,531.2 831.1,534.3 835.7,518.4 839.8,505.8 832.4,503.9 837.0,491.7 828.8,489.9 828.1,493.9 784.0,478.2"
      }
    ],
    "courtyards": [],
    "entrances": []
  },
  "bldg_1792074173914": {
    "cx": 425.6,
    "cy": 122.9,
    "w": 51.6,
    "h": 66.0,
    "color": "#0891b2",
    "badge": "SC",
    "wings": [
      {
        "name": "Sports Complex Wing #1",
        "points": "433.4,146.6 451.1,91.3 418.2,80.6 399.5,135.5"
      }
    ],
    "courtyards": [],
    "entrances": [
      { "name": "Sports Complex Entrance #1", "x": 405.7, "y": 106.1, "lat": 21.131186, "lng": 81.764627 }
    ]
  },
  "bldg_1792097005723": {
    "cx": 629.5,
    "cy": 433.3,
    "w": 41.6,
    "h": 26.0,
    "color": "#ea580c",
    "badge": "BC",
    "wings": [
      {
        "name": "Basketball Wing #1",
        "points": "609.6,445.9 650.9,444.1 651.2,419.9 610.8,420.7"
      }
    ],
    "courtyards": [],
    "entrances": []
  },
  "bldg_1792119172307": {
    "cx": 530.3,
    "cy": 648.0,
    "w": 128.1,
    "h": 100.0,
    "color": "#16a34a",
    "badge": "P",
    "wings": [],
    "courtyards": [
      {
        "name": "Palm Park Courtyard #1",
        "points": "460.5,665.3 566.4,701.4 588.6,639.8 584.2,629.6 487.5,601.4"
      }
    ],
    "entrances": []
  },
  "bldg_1792128996063": {
    "cx": 636.6,
    "cy": 348.1,
    "w": 73.2,
    "h": 63.4,
    "color": "#db2777",
    "badge": "GH-1",
    "wings": [
      {
        "name": "Sabari Wing #1",
        "points": "602.3,336.0 652.9,309.7 675.5,346.4 625.1,373.1"
      }
    ],
    "courtyards": [],
    "entrances": [
      { "name": "Sabari Entrance #1", "x": 625.6, "y": 322.2, "lat": 21.129726, "lng": 81.76622 }
    ]
  },
  "bldg_1792132762957": {
    "cx": 437.4,
    "cy": 521.2,
    "w": 51.4,
    "h": 57.5,
    "color": "#0d9488",
    "badge": "AGH",
    "wings": [
      {
        "name": "Guest House  Wing #1",
        "points": "418.6,517.1 424.7,519.2 425.5,517.1 431.3,517.9 421.6,544.4 437.7,549.3 443.5,531.6 463.6,538.8 470.0,520.8 448.5,514.2 454.9,495.6 438.0,491.8 432.2,506.6 434.8,508.0 432.4,514.9 427.2,512.6 428.6,510.0 420.9,508.2"
      }
    ],
    "courtyards": [],
    "entrances": []
  },
  "bldg_1792159282829": {
    "cx": 471.0,
    "cy": 569.6,
    "w": 35.0,
    "h": 22.0,
    "color": "#2563eb",
    "badge": "VC",
    "wings": [
      {
        "name": "Volleyball Court Surface",
        "points": "455.0,559.6 487.0,564.6 484.0,581.6 452.0,576.6"
      }
    ],
    "courtyards": [],
    "entrances": []
  },
  "bldg_1792159326181": {
    "cx": 703.6,
    "cy": 639.9,
    "w": 89.2,
    "h": 87.7,
    "color": "#10b981",
    "badge": "Am-2",
    "wings": [
      {
        "name": "Building 14 Wing #1",
        "points": "664.4,665.3 671.2,672.7 677.6,677.5 690.1,683.3 700.9,684.6 713.5,683.1 726.0,678.4 732.4,672.8 739.9,662.3 743.8,652.5 744.8,646.1 744.1,631.3 741.0,624.0 736.6,616.3 732.1,610.5 715.5,623.5 719.6,629.1 722.2,634.8 722.2,642.4 720.1,650.4 713.9,656.7 705.6,660.3 695.8,660.1 685.7,653.2 682.4,649.7"
      }
    ],
    "courtyards": [
      {
        "name": "Building 14 Courtyard #1",
        "points": "664.4,665.3 682.4,649.7 685.7,653.2 695.8,660.1 705.6,660.3 713.9,656.7 720.1,650.4 722.2,642.4 722.2,634.8 719.6,629.1 715.5,623.5 732.1,610.5 736.3,604.6 736.9,600.9 725.2,596.9 712.8,597.2 700.9,599.8 686.1,606.2 678.0,612.2 667.2,622.3 663.3,626.9 658.6,637.1 655.6,651.3 655.8,659.7 658.7,663.4"
      }
    ],
    "entrances": []
  },
  "bldg_1792159559173": {
    "cx": 579.8,
    "cy": 444.7,
    "w": 72.5,
    "h": 66.4,
    "color": "#d97706",
    "badge": "Am-1",
    "wings": [
      {
        "name": "Building 15 Wing #1",
        "points": "557.3,487.4 624.7,448.6 609.6,449.1 600.8,435.7 603.3,426.4 586.3,421.0 555.6,438.3 552.2,456.5 564.6,459.4 569.7,470.1"
      }
    ],
    "courtyards": [],
    "entrances": []
  },
  "bldg_1792159926765": {
    "cx": 538.1,
    "cy": 391.0,
    "w": 150.8,
    "h": 92.9,
    "color": "#15803d",
    "badge": "FG",
    "wings": [],
    "courtyards": [
      {
        "name": "Football Ground  Courtyard #1",
        "points": "574.7,332.1 609.6,397.6 506.2,425.0 458.8,412.4 474.4,352.1"
      }
    ],
    "entrances": []
  },
  "bldg_1792221838963": {
    "cx": 709.9,
    "cy": 440.5,
    "w": 64.0,
    "h": 65.0,
    "color": "#6366f1",
    "badge": "B-17",
    "wings": [
      {
        "name": "Incubation Center Wing #1",
        "points": "675.2,431.6 700.7,470.0 738.9,443.7 712.5,404.9"
      }
    ],
    "courtyards": [],
    "entrances": []
  }
};

export const CAMPUS_ROAD_POLYLINES = [
  { "name": "Road #1", "width": 9.5, "points": "585.5,702.5 611.4,623.2 641.4,591.4 678.8,564.7 730.3,542.9 764.7,434.3 661.8,292.8 458.8,340.3 367.0,623.2 360.9,642.4 360.4,648.4 361.3,650.1 361.9,650.9 363.5,653.5 428.5,677.6 564.7,724.7" },
  { "name": "Road #2", "width": 13.3, "points": "564.7,724.7 577.6,728.6 585.5,702.5" },
  { "name": "Road #3", "width": 13.3, "points": "636.8,596.3 634.2,586.8 635.6,574.0 641.4,564.7 647.9,561.3 655.8,558.2 664.6,557.7 669.6,559.9 675.0,562.5 677.3,565.8" },
  { "name": "Road #4", "width": 13.3, "points": "611.4,623.2 514.7,457.8 508.3,449.7 495.5,443.9 431.8,423.7" },
  { "name": "Road #5", "width": 9.5, "points": "730.3,542.9 856.8,571.6" },
  { "name": "Road #6", "width": 7.6, "points": "577.6,728.6 604.5,736.3 627.3,659.3 637.7,634.5 651.0,614.1 679.9,594.1 704.7,580.8 721.5,575.8 757.6,574.5 790.2,581.3" },
  { "name": "Road #7", "width": 9.5, "points": "731.8,575.4 730.3,542.9" },
  { "name": "Road #8", "width": 7.6, "points": "605.5,306.0 553.5,216.9 658.4,157.5" },
  { "name": "Road #9", "width": 13.3, "points": "403.3,65.1 343.7,253.9 276.3,440.5 223.5,604.5 228.7,613.5 250.6,621.5 363.5,653.5" },
  { "name": "Road #10", "width": 15.2, "points": "704.5,553.8 671.8,497.7" }
];

export const CAMPUS_FOOTPATH_POLYLINES = [
  { "name": "Footpath #1", "width": 7.6, "points": "448.6,617.6 517.0,578.8" },
  { "name": "Footpath #2", "width": 7.6, "points": "517.0,578.8 519.6,583.0 537.5,572.5 539.5,570.8 547.6,569.7 554.7,571.5 561.6,578.5 571.0,571.9" },
  { "name": "Footpath #3", "width": 3.8, "points": "517.0,578.8 515.2,574.8 524.3,567.7" },
  { "name": "Footpath #4", "width": 3.8, "points": "629.8,586.6 618.7,584.4 617.4,580.8 615.3,580.0 611.2,581.3 610.6,582.2 591.9,577.4 588.7,576.8 583.7,575.9" },
  { "name": "Footpath #5", "width": 3.8, "points": "553.5,216.9 542.4,212.6 519.9,197.0 489.4,174.3 470.1,160.8 462.2,157.5 436.8,146.0 390.5,130.6 410.0,69.3" },
  { "name": "Footpath #6", "width": 3.8, "points": "536.8,482.8 547.0,433.2 584.9,408.9 609.7,415.8 617.4,422.1 637.0,421.8 638.1,420.1 653.9,410.5 669.4,397.8 695.3,383.4 717.4,369.4" },
  { "name": "Footpath #7", "width": 3.8, "points": "656.2,408.6 646.5,395.3 634.1,392.0 624.7,391.7 591.6,333.7 584.4,320.4 579.0,312.2" },
  { "name": "Footpath #8", "width": 3.8, "points": "664.4,543.9 698.9,544.2" },
  { "name": "Footpath #9", "width": 3.8, "points": "644.7,555.9 664.4,543.9" },
  { "name": "Footpath #10", "width": 3.8, "points": "671.8,497.7 676.2,492.7 659.4,462.3 665.6,433.0 656.2,408.6" },
  { "name": "Footpath #11", "width": 3.8, "points": "660.4,457.3 648.4,444.2 648.1,422.7 637.0,421.8" }
];

export const FOREST_CLUSTERS = [];
export const BOULEVARD_TREES = [];