/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MapLandmass {
  id: string;
  name: string;
  region: string;
  coordinates: Array<[number, number]>; // [lat, lng] pairs
}

export interface MapWaterLabel {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "OCEAN" | "SEA" | "CHOKEPOINT" | "REGION";
}

export interface MaritimeChokepoint {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  status: "CRITICAL" | "SEVERE" | "MODERATE" | "OPTIMAL";
  delayHours: number;
  impactedRoutes: string[];
  description: string;
  aiMitigationStrategy: string;
  dailyVesselTransit: number;
}

// High-precision geographic polygons for clean, recognizable global trade map rendering
export const WORLD_LANDMASSES: MapLandmass[] = [
  {
    id: "north_america",
    name: "North America",
    region: "Americas",
    coordinates: [
      [70, -160], [75, -120], [70, -80], [60, -65], [50, -55], [45, -62], [40, -74],
      [35, -75], [28, -80], [30, -88], [26, -97], [21, -87], [16, -83], [9, -80],
      [8, -83], [16, -98], [23, -110], [32, -117], [34, -120], [48, -124], [58, -138],
      [60, -148], [66, -168]
    ]
  },
  {
    id: "south_america",
    name: "South America",
    region: "Americas",
    coordinates: [
      [9, -79], [11, -73], [10, -62], [5, -51], [-3, -38], [-8, -35], [-13, -38],
      [-23, -43], [-35, -57], [-40, -62], [-55, -67], [-53, -74], [-45, -75],
      [-33, -71], [-20, -70], [-12, -77], [-4, -81], [4, -77]
    ]
  },
  {
    id: "europe_mainland",
    name: "Europe",
    region: "Europe",
    coordinates: [
      [36, -5], [39, -9], [44, -1], [48, -4], [51, 2], [53, 7], [57, 9],
      [62, 5], [68, 14], [71, 25], [66, 40], [60, 30], [55, 20], [54, 14],
      [45, 30], [41, 29], [40, 26], [38, 24], [38, 16], [44, 9], [43, 5], [40, 0]
    ]
  },
  {
    id: "british_isles",
    name: "British Isles",
    region: "Europe",
    coordinates: [
      [50, -5], [52, -10], [55, -8], [58, -6], [58, -3], [54, 0], [51, 1]
    ]
  },
  {
    id: "africa",
    name: "Africa",
    region: "Africa",
    coordinates: [
      [35, -6], [30, -10], [20, -17], [15, -17], [5, -10], [4, 8], [-5, 12],
      [-15, 12], [-22, 14], [-34, 18], [-34, 26], [-30, 31], [-15, 40], [-5, 39],
      [2, 45], [11, 51], [12, 43], [20, 37], [28, 33], [31, 32], [32, 20], [37, 10]
    ]
  },
  {
    id: "arabian_peninsula",
    name: "Arabian Peninsula & Middle East",
    region: "Middle East",
    coordinates: [
      [30, 33], [28, 35], [20, 40], [13, 43], [13, 45], [17, 54], [22, 60],
      [26, 56], [24, 51], [29, 48], [34, 36]
    ]
  },
  {
    id: "asia_mainland",
    name: "Asia Mainland",
    region: "Asia",
    coordinates: [
      [41, 42], [45, 52], [50, 50], [60, 60], [70, 70], [72, 140], [60, 165],
      [52, 156], [42, 131], [38, 128], [35, 129], [31, 121], [22, 114], [20, 110],
      [10, 107], [8, 103], [1.3, 103.8], [6, 100], [16, 95], [22, 89], [16, 82],
      [10, 79], [8, 77], [15, 73], [22, 69], [25, 60], [36, 53]
    ]
  },
  {
    id: "japan",
    name: "Japan",
    region: "Asia",
    coordinates: [
      [31, 130], [35, 135], [41, 140], [44, 144], [40, 140], [35, 138], [33, 133]
    ]
  },
  {
    id: "taiwan_philippines",
    name: "Taiwan & Philippines",
    region: "Asia",
    coordinates: [
      [25, 121], [22, 120], [18, 120], [14, 122], [8, 126], [6, 125], [8, 118], [14, 120]
    ]
  },
  {
    id: "indonesia_archipelago",
    name: "Indonesia & Southeast Asia Islands",
    region: "Asia",
    coordinates: [
      [5, 95], [0, 100], [-6, 105], [-8, 114], [-8, 120], [-10, 124], [-2, 140],
      [-8, 147], [-1, 131], [1, 118], [7, 117], [3, 98]
    ]
  },
  {
    id: "australia",
    name: "Australia",
    region: "Oceania",
    coordinates: [
      [-12, 130], [-12, 142], [-18, 146], [-28, 153], [-37, 150], [-38, 145],
      [-35, 136], [-33, 134], [-35, 118], [-32, 115], [-22, 114], [-15, 124]
    ]
  },
  {
    id: "new_zealand",
    name: "New Zealand",
    region: "Oceania",
    coordinates: [
      [-35, 174], [-38, 178], [-46, 169], [-45, 167], [-41, 172], [-37, 175]
    ]
  },
  {
    id: "madagascar",
    name: "Madagascar",
    region: "Africa",
    coordinates: [
      [-12, 49], [-16, 50], [-25, 47], [-23, 43], [-16, 44]
    ]
  },
  {
    id: "greenland",
    name: "Greenland & Iceland",
    region: "North",
    coordinates: [
      [60, -44], [65, -38], [75, -20], [80, -35], [77, -70], [68, -52], [64, -22], [66, -14]
    ]
  }
];

// Strategic text labels on the map canvas for instant geographic recognition
export const WORLD_WATER_LABELS: MapWaterLabel[] = [
  { id: "lbl-pac-n", name: "NORTH PACIFIC OCEAN", lat: 35, lng: -155, type: "OCEAN" },
  { id: "lbl-pac-s", name: "SOUTH PACIFIC OCEAN", lat: -20, lng: -140, type: "OCEAN" },
  { id: "lbl-atl-n", name: "NORTH ATLANTIC", lat: 38, lng: -42, type: "OCEAN" },
  { id: "lbl-atl-s", name: "SOUTH ATLANTIC", lat: -20, lng: -20, type: "OCEAN" },
  { id: "lbl-ind", name: "INDIAN OCEAN", lat: -15, lng: 75, type: "OCEAN" },
  { id: "lbl-med", name: "Mediterranean", lat: 35, lng: 18, type: "SEA" },
  { id: "lbl-scs", name: "South China Sea", lat: 14, lng: 114, type: "SEA" },
  { id: "lbl-arab", name: "Arabian Sea", lat: 16, lng: 64, type: "SEA" },
  { id: "lbl-reg-na", name: "NORTH AMERICA", lat: 48, lng: -100, type: "REGION" },
  { id: "lbl-reg-sa", name: "SOUTH AMERICA", lat: -15, lng: -60, type: "REGION" },
  { id: "lbl-reg-eu", name: "EUROPE", lat: 52, lng: 15, type: "REGION" },
  { id: "lbl-reg-af", name: "AFRICA", lat: 8, lng: 22, type: "REGION" },
  { id: "lbl-reg-as", name: "ASIA", lat: 46, lng: 95, type: "REGION" },
  { id: "lbl-reg-au", name: "AUSTRALIA", lat: -25, lng: 133, type: "REGION" }
];

// Detailed maritime chokepoints and bottlenecks for easy identification
export const MARITIME_CHOKEPOINTS: MaritimeChokepoint[] = [
  {
    id: "cp-redsea",
    name: "Red Sea / Bab el-Mandeb Strait",
    shortName: "Red Sea Convoy Queue",
    lat: 14.2,
    lng: 43.1,
    status: "CRITICAL",
    delayHours: 72,
    impactedRoutes: ["asia_europe"],
    description: "Security escort metering and missile threat avoidance forcing 38% of Asia-Europe container vessels to reroute around Cape of Good Hope, adding ~3,500 nautical miles.",
    aiMitigationStrategy: "AI Rerouting Engine recommends shifting time-sensitive pharma and reefer cargo to air-sea intermodal hub at Dubai (Jebel Ali) or utilizing overland rail through Central Asia.",
    dailyVesselTransit: 42
  },
  {
    id: "cp-panama",
    name: "Panama Canal (Gatun Locks)",
    shortName: "Panama Canal Slot Backlog",
    lat: 9.1,
    lng: -79.7,
    status: "SEVERE",
    delayHours: 24,
    impactedRoutes: ["panama_canal"],
    description: "Gatun Lake freshwater draft restrictions and CBP Non-Intrusive X-ray CSI scan holds causing 24-36 hour queue times at anchorages in Colon and Balboa.",
    aiMitigationStrategy: "Automatically pre-filing CBP Form 3461 compliance data 4 days prior to arrival and matching containers with US West Coast rail landbridge express from LAX to Houston/Savannah.",
    dailyVesselTransit: 31
  },
  {
    id: "cp-uslax",
    name: "USLAX Pier 400 & Long Beach",
    shortName: "USLAX Terminal Berth Backlog",
    lat: 33.7,
    lng: -118.2,
    status: "SEVERE",
    delayHours: 36,
    impactedRoutes: ["trans_pacific"],
    description: "Intermodal chassis deficits and rail car dwell times extending terminal yard congestion. 14 vessels currently at anchor waiting for gantry crane assignment.",
    aiMitigationStrategy: "AI dynamic port diversion algorithm recommending offloading at Port of Oakland or Port of Tacoma for Midwest-bound intermodal rail cargo.",
    dailyVesselTransit: 65
  },
  {
    id: "cp-suez",
    name: "Suez Canal Transit Corridor",
    shortName: "Suez Northbound Slot Queue",
    lat: 31.2,
    lng: 32.3,
    status: "MODERATE",
    delayHours: 16,
    impactedRoutes: ["asia_europe"],
    description: "Northbound convoy slot metering causing minor staging delays in Gulf of Suez.",
    aiMitigationStrategy: "Vessel speed optimization (slow steaming across Indian Ocean) to arrive exactly at assigned convoy window, saving $42,000 in fuel.",
    dailyVesselTransit: 54
  },
  {
    id: "cp-malacca",
    name: "Strait of Malacca / Singapore Hub",
    shortName: "Malacca High Density Area",
    lat: 1.3,
    lng: 103.8,
    status: "MODERATE",
    delayHours: 12,
    impactedRoutes: ["asia_europe", "panama_canal"],
    description: "Heavy vessel traffic and feeder vessel refueling congestion at Singapore Pasir Panjang anchorages.",
    aiMitigationStrategy: "Pre-clearing bunkering barges and digital customs transshipment manifests while vessel is 12 hours out in South China Sea.",
    dailyVesselTransit: 110
  },
  {
    id: "cp-rotterdam",
    name: "Port of Rotterdam (Maasvlakte II)",
    shortName: "Rotterdam Rail Berth Queue",
    lat: 51.9,
    lng: 4.4,
    status: "MODERATE",
    delayHours: 14,
    impactedRoutes: ["asia_europe"],
    description: "Automated guided vehicle (AGV) maintenance cycle and barge terminal congestion along Rhine river network.",
    aiMitigationStrategy: "Diverting regional containers to Antwerp or using direct rail shuttle to Duisburg inland hub.",
    dailyVesselTransit: 78
  },
  {
    id: "cp-shanghai",
    name: "Shanghai Yangshan Deep-Water Terminal",
    shortName: "Yangshan Peak Export Flow",
    lat: 31.2,
    lng: 121.5,
    status: "OPTIMAL",
    delayHours: 4,
    impactedRoutes: ["trans_pacific", "intra_asia"],
    description: "High-volume export departure window operating with automated double-trolley gantry cranes at 98.4% efficiency.",
    aiMitigationStrategy: "Continuous AIS real-time berth tracking ensures zero idle time at dock.",
    dailyVesselTransit: 145
  }
];
