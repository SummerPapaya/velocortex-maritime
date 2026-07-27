/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShippingContainer, TradeRoute, AlertNotification, StakeholderMetrics, ArchitectureSection } from "../types";

export const MOCK_CONTAINERS: ShippingContainer[] = [
  {
    id: "cnt-1",
    containerNumber: "MSCU7849201",
    poNumber: "PO-99842",
    invoiceNumber: "INV-2026-8819",
    billOfLading: "BOL-884920",
    vesselName: "MSC Gulsun",
    carrier: "MSC",
    origin: "Shanghai, China",
    originPort: "CNSHA (Yangshan Terminal)",
    destination: "Los Angeles, USA",
    destinationPort: "USLAX (Pier 400)",
    status: "TEMP_EXCURSION",
    priority: "CRITICAL",
    cargoType: "Reefer (mRNA Vaccines & Bio-Pharma)",
    eta: "2026-08-01T14:30:00Z",
    revisedEta: "2026-08-02T08:15:00Z",
    coordinates: { lat: 28.5, lng: 168.2 },
    progressPercent: 55,
    routeId: "trans_pacific",
    telemetry: {
      temperature: -14.2, // WARNING: Excursion! Target is -20°C
      targetTemp: -20.0,
      humidity: 42,
      batteryLevel: 88,
      shockEvents: 1,
      doorStatus: "SEALED",
      signalStrength: "Satellite (Iridium)",
      lastUpdated: "2 mins ago",
      tempHistory: [
        { time: "00:00", temp: -20.1, humidity: 40 },
        { time: "04:00", temp: -20.0, humidity: 41 },
        { time: "08:00", temp: -19.8, humidity: 41 },
        { time: "12:00", temp: -18.5, humidity: 43 },
        { time: "16:00", temp: -16.0, humidity: 44 },
        { time: "20:00", temp: -14.2, humidity: 42 },
      ]
    },
    milestones: [
      { id: "m1", title: "Gate-In & Reefer Plug Connect", location: "CNSHA Yangshan Terminal", timestamp: "2026-07-20 08:30", status: "COMPLETED", details: "Verified setpoint -20.0°C. Customs export declaration cleared.", txHash: "0x8f9a2b4e...91c" },
      { id: "m2", title: "Loaded onto Vessel MSC Gulsun", location: "Berth 4, Yangshan", timestamp: "2026-07-21 16:45", status: "COMPLETED", details: "Stowed in Bay 14, Tier 82. IoT telemetry active.", txHash: "0x3a7c819d...4f2" },
      { id: "m3", title: "Mid-Pacific Transit Telemetry Anomaly", location: "Lat 28.5°N, Lng 168.2°E", timestamp: "2026-07-26 21:10", status: "ALERT", details: "Compressor defrost cycle extended. Temp rose above -18°C threshold.", txHash: "0x6e2b110a...8d1" },
      { id: "m4", title: "Approaching USLAX Outer Harbor", location: "Los Angeles Pilot Area", timestamp: "Est. 2026-08-01", status: "PENDING", details: "Priority health clearance requested to minimize runway demurrage.", txHash: "Pending" },
      { id: "m5", title: "Final Cold-Chain Drayage Delivery", location: "McKesson Distribution Hub, CA", timestamp: "Est. 2026-08-02", status: "PENDING", details: "Scheduled direct transfer to active refrigerated trailer.", txHash: "Pending" }
    ],
    aiAnalytics: {
      demurrageRiskUsd: 14500,
      riskLevel: "CRITICAL",
      recommendation: "Immediate alert dispatched to vessel Chief Engineer. Recommend remote reset of reefer controller #4 and pre-arranging priority express customs clearance at USLAX Pier 400 to prevent vaccine batch spoilage.",
      actionItems: [
        "Instruct vessel engineering crew to perform physical check on Bay 14 Reefer plug power.",
        "File priority USDA/FDA pre-clearance notice referencing BOL-884920.",
        "Book standby refrigerated drayage team for instant dockside pickup."
      ]
    }
  },
  {
    id: "cnt-2",
    containerNumber: "TGHU4920184",
    poNumber: "PO-44182",
    invoiceNumber: "INV-2026-1049",
    billOfLading: "BOL-104928",
    vesselName: "Madrid Maersk",
    carrier: "Maersk",
    origin: "Ningbo, China",
    originPort: "CNNGB (Beilun Port)",
    destination: "Rotterdam, Netherlands",
    destinationPort: "NLRTM (Maasvlakte 2)",
    status: "PORT_CONGESTION",
    priority: "HIGH",
    cargoType: "Dry Cargo (High-End GPU Servers & AI Chips)",
    eta: "2026-08-08T10:00:00Z",
    revisedEta: "2026-08-11T18:00:00Z",
    coordinates: { lat: 14.2, lng: 43.1 }, // Red Sea / Bab el-Mandeb approach
    progressPercent: 42,
    routeId: "asia_europe",
    telemetry: {
      temperature: 22.4,
      targetTemp: 22.0,
      humidity: 55,
      batteryLevel: 94,
      shockEvents: 0,
      doorStatus: "SEALED",
      signalStrength: "Satellite (Iridium)",
      lastUpdated: "5 mins ago",
      tempHistory: [
        { time: "00:00", temp: 21.8, humidity: 54 },
        { time: "04:00", temp: 22.0, humidity: 55 },
        { time: "08:00", temp: 22.2, humidity: 56 },
        { time: "12:00", temp: 22.5, humidity: 55 },
        { time: "16:00", temp: 22.3, humidity: 55 },
        { time: "20:00", temp: 22.4, humidity: 55 },
      ]
    },
    milestones: [
      { id: "m21", title: "Factory Departure & High-Security Seal", location: "Ningbo Tech Park", timestamp: "2026-07-12 11:00", status: "COMPLETED", details: "RFID electronic bolt seal #SEAL-9981 attached.", txHash: "0x71a2c90f...33e" },
      { id: "m22", title: "Loaded onto Vessel Madrid Maersk", location: "Beilun Terminal", timestamp: "2026-07-14 09:20", status: "COMPLETED", details: "Underdeck stowage to minimize temperature variance.", txHash: "0x12b4e88a...901" },
      { id: "m23", title: "Bab el-Mandeb / Red Sea Traffic Queue", location: "Lat 14.2°N, Lng 43.1°E", timestamp: "2026-07-26 14:00", status: "ALERT", details: "Navigational convoy queue causing 72-hour transit slippage.", txHash: "0x55d1a09b...41c" },
      { id: "m24", title: "Suez Canal Northbound Transit", location: "Port Said", timestamp: "Est. 2026-07-31", status: "PENDING", details: "Convoy slot confirmed. Pilotage scheduled.", txHash: "Pending" },
      { id: "m25", title: "Discharge at Maasvlakte 2 Automated Terminal", location: "Rotterdam, NL", timestamp: "Est. 2026-08-11", status: "PENDING", details: "Automated AGV routing to customs bonded warehouse.", txHash: "Pending" }
    ],
    aiAnalytics: {
      demurrageRiskUsd: 8200,
      riskLevel: "HIGH",
      recommendation: "Due to 72-hour canal convoy backlog, ETA at Rotterdam is delayed. Recommend changing final delivery mode from barge to direct freight train to meet European data center launch schedule.",
      actionItems: [
        "Request carrier destination diversion from Rhine barge to Betuweroute express rail.",
        "Notify receiver tech team of revised arrival date August 11.",
        "Verify electronic bolt seal integrity via satellite telemetry."
      ]
    }
  },
  {
    id: "cnt-3",
    containerNumber: "HLXU3891042",
    poNumber: "PO-88190",
    invoiceNumber: "INV-2026-3392",
    billOfLading: "BOL-993810",
    vesselName: "Hapag-Lloyd Berlin",
    carrier: "Hapag-Lloyd",
    origin: "Hamburg, Germany",
    originPort: "DEHAM (Container Terminal Altenwerder)",
    destination: "New York, USA",
    destinationPort: "USNYC (Maher Terminal)",
    status: "IN_TRANSIT",
    priority: "STANDARD",
    cargoType: "Dry Cargo (Automotive Precision Parts & Sensors)",
    eta: "2026-07-30T06:00:00Z",
    coordinates: { lat: 46.8, lng: -28.4 }, // Mid North Atlantic
    progressPercent: 78,
    routeId: "trans_atlantic",
    telemetry: {
      temperature: 18.5,
      targetTemp: 18.0,
      humidity: 48,
      batteryLevel: 97,
      shockEvents: 0,
      doorStatus: "SEALED",
      signalStrength: "Satellite (Iridium)",
      lastUpdated: "1 min ago",
      tempHistory: [
        { time: "00:00", temp: 18.2, humidity: 48 },
        { time: "04:00", temp: 18.3, humidity: 48 },
        { time: "08:00", temp: 18.5, humidity: 49 },
        { time: "12:00", temp: 18.6, humidity: 48 },
        { time: "16:00", temp: 18.4, humidity: 47 },
        { time: "20:00", temp: 18.5, humidity: 48 },
      ]
    },
    milestones: [
      { id: "m31", title: "Automated Rail Gate-In", location: "DEHAM CTA Hamburg", timestamp: "2026-07-18 14:10", status: "COMPLETED", details: "Optical OCR container scan passed. Zero damage reported.", txHash: "0x99a1b2c3...11a" },
      { id: "m32", title: "Vessel Departure Hapag-Lloyd Berlin", location: "Elbe River Estuary", timestamp: "2026-07-19 22:30", status: "COMPLETED", details: "Sailing at 19.4 knots. Atlantic weather window favorable.", txHash: "0x44c8d10e...88f" },
      { id: "m33", title: "Mid-Atlantic Telemetry Checkpoint", location: "Lat 46.8°N, Lng 28.4°W", timestamp: "2026-07-26 12:00", status: "IN_PROGRESS", details: "All environmental parameters nominal. ETA on schedule.", txHash: "0x22f1a09c...33b" },
      { id: "m34", title: "Ambrose Channel Pilot Boarding", location: "New York Harbor", timestamp: "Est. 2026-07-30", status: "PENDING", details: "Tugboat escort and Maher Terminal crane slot reserved.", txHash: "Pending" }
    ],
    aiAnalytics: {
      demurrageRiskUsd: 0,
      riskLevel: "LOW",
      recommendation: "Vessel is making optimal speed across the North Atlantic with zero weather delays. No intervention required. Standard gate clearance expected.",
      actionItems: [
        "Maintain automated daily telemetry logging.",
        "Confirm receiver warehouse receiving window in Newark."
      ]
    }
  },
  {
    id: "cnt-4",
    containerNumber: "MAEU1948201",
    poNumber: "PO-55102",
    invoiceNumber: "INV-2026-4410",
    billOfLading: "BOL-551029",
    vesselName: "CMA CGM Jacques Saade",
    carrier: "CMA CGM",
    origin: "Singapore",
    originPort: "SGSIN (Pasir Panjang Terminal)",
    destination: "Savannah, USA",
    destinationPort: "USSAV (Garden City Terminal)",
    status: "CUSTOMS_HOLD",
    priority: "HIGH",
    cargoType: "Hazardous (Lithium-Ion Battery Modules)",
    eta: "2026-08-04T16:00:00Z",
    revisedEta: "2026-08-06T12:00:00Z",
    coordinates: { lat: 9.1, lng: -79.7 }, // Approaching Panama Canal
    progressPercent: 68,
    routeId: "panama_canal",
    telemetry: {
      temperature: 19.8,
      targetTemp: 20.0,
      humidity: 38,
      batteryLevel: 91,
      shockEvents: 2, // Minor turbulence reported
      doorStatus: "SEALED",
      signalStrength: "4G LTE",
      lastUpdated: "Just now",
      tempHistory: [
        { time: "00:00", temp: 19.5, humidity: 39 },
        { time: "04:00", temp: 19.6, humidity: 38 },
        { time: "08:00", temp: 19.8, humidity: 38 },
        { time: "12:00", temp: 20.1, humidity: 37 },
        { time: "16:00", temp: 19.9, humidity: 38 },
        { time: "20:00", temp: 19.8, humidity: 38 },
      ]
    },
    milestones: [
      { id: "m41", title: "Dangerous Goods (DG) Inspection & Loading", location: "SGSIN Singapore Terminal", timestamp: "2026-07-08 10:00", status: "COMPLETED", details: "IMO Class 9 hazardous certification verified. Thermal sensors calibrated.", txHash: "0x88e2c10a...77d" },
      { id: "m42", title: "Pacific Ocean Crossing", location: "Equatorial Pacific", timestamp: "2026-07-20 18:00", status: "COMPLETED", details: "Two minor shock events recorded during oceanic swell (max 1.4G). Cargo secure.", txHash: "0x11d4e55b...22a" },
      { id: "m43", title: "Panama Canal Anchorage & Customs Hold", location: "Colon Anchorage, Panama", timestamp: "2026-07-26 15:30", status: "ALERT", details: "Random CBP container security initiative (CSI) non-intrusive X-ray hold triggered.", txHash: "0x33b1f90c...88e" },
      { id: "m44", title: "Panama Canal Gatun Locks Transit", location: "Gatun Locks", timestamp: "Est. 2026-07-29", status: "PENDING", details: "Awaiting release from CSI scan queue.", txHash: "Pending" },
      { id: "m45", title: "Discharge & HAZMAT Drayage", location: "Garden City Terminal, GA", timestamp: "Est. 2026-08-06", status: "PENDING", details: "Escorted transport to battery assembly plant.", txHash: "Pending" }
    ],
    aiAnalytics: {
      demurrageRiskUsd: 6400,
      riskLevel: "MEDIUM",
      recommendation: "CSI X-ray scan hold at Panama transit point typically resolves within 36 hours. Automatically submitted Form 3461 compliance documentation to expedite clearance.",
      actionItems: [
        "Upload verified manufacturer SDS (Safety Data Sheet) to US Customs portal.",
        "Monitor container internal thermal sensors for any heat accumulation.",
        "Reschedule Savannah terminal pickup slot from Aug 4 to Aug 6."
      ]
    }
  },
  {
    id: "cnt-5",
    containerNumber: "CMAU8810293",
    poNumber: "PO-33109",
    invoiceNumber: "INV-2026-7712",
    billOfLading: "BOL-331092",
    vesselName: "Evergreen Ever Apex",
    carrier: "Evergreen",
    origin: "Busan, South Korea",
    originPort: "KRPUS (Busan New Port)",
    destination: "Shanghai, China",
    destinationPort: "CNSHA (Yangshan Terminal)",
    status: "BERTHED",
    priority: "STANDARD",
    cargoType: "Reefer (Specialty Seafood & Wagyu Beef)",
    eta: "2026-07-27T08:00:00Z",
    coordinates: { lat: 30.6, lng: 122.1 }, // Yangshan port
    progressPercent: 96,
    routeId: "intra_asia",
    telemetry: {
      temperature: -22.1,
      targetTemp: -22.0,
      humidity: 40,
      batteryLevel: 99,
      shockEvents: 0,
      doorStatus: "SEALED",
      signalStrength: "4G LTE",
      lastUpdated: "Just now",
      tempHistory: [
        { time: "00:00", temp: -22.0, humidity: 40 },
        { time: "04:00", temp: -22.1, humidity: 40 },
        { time: "08:00", temp: -22.2, humidity: 41 },
        { time: "12:00", temp: -22.0, humidity: 40 },
        { time: "16:00", temp: -22.1, humidity: 40 },
        { time: "20:00", temp: -22.1, humidity: 40 },
      ]
    },
    milestones: [
      { id: "m51", title: "Cold Storage Gate-Out", location: "Busan Logistics Hub", timestamp: "2026-07-25 06:00", status: "COMPLETED", details: "Ultra-low temp reefer locked at -22.0°C.", txHash: "0x55f1e20a...99b" },
      { id: "m52", title: "Yellow Sea Short-Sea Transit", location: "Yellow Sea", timestamp: "2026-07-26 14:00", status: "COMPLETED", details: "Smooth 24-hour crossing. Excellent satellite connectivity.", txHash: "0x77c2a11b...44f" },
      { id: "m53", title: "Berth Arrival at Yangshan Terminal", location: "CNSHA Berth 12", timestamp: "2026-07-27 01:30", status: "IN_PROGRESS", details: "Vessel berthed. Gantry crane discharge commencing.", txHash: "0x88d1b30c...11e" }
    ],
    aiAnalytics: {
      demurrageRiskUsd: 0,
      riskLevel: "LOW",
      recommendation: "Container is discharging on schedule at Yangshan Berth 12. Cold chain unbroken throughout entire transit.",
      actionItems: [
        "Dispatch cold-chain delivery truck to Gate 4.",
        "Perform digital signature sign-off upon container touchdown."
      ]
    }
  }
];

export const MOCK_ROUTES: TradeRoute[] = [
  {
    id: "trans_pacific",
    name: "Trans-Pacific Eastbound Corridor",
    originRegion: "East Asia (Shanghai / Ningbo / Busan)",
    destRegion: "North America West Coast (LAX / LBG / SEA)",
    activeVessels: 48,
    congestionLevel: "SEVERE",
    averageDelayDays: 2.8,
    weatherRisk: "Moderate seasonal Pacific swell near International Date Line",
    bottleneckReason: "Terminal chassis shortage and rail car dwell backlog at USLAX / Long Beach ports.",
    heatIntensity: 0.85,
    waypoints: [
      { lat: 31.2, lng: 121.5, label: "Shanghai (CNSHA)" },
      { lat: 30.0, lng: 140.0 },
      { lat: 28.5, lng: 168.2, label: "Mid-Pacific Waypoint" },
      { lat: 32.0, lng: -140.0 },
      { lat: 33.7, lng: -118.2, label: "Los Angeles (USLAX)" }
    ],
    bottleneckCoordinates: { lat: 33.7, lng: -118.2, name: "USLAX Pier 400 Berth Backlog", delayHours: 36 }
  },
  {
    id: "asia_europe",
    name: "Asia-Europe via Bab el-Mandeb / Suez",
    originRegion: "East & South Asia",
    destRegion: "Northern Europe (Rotterdam / Hamburg / Antwerp)",
    activeVessels: 62,
    congestionLevel: "CRITICAL",
    averageDelayDays: 4.5,
    weatherRisk: "Extreme heat affecting reefer cooling efficiency in Red Sea",
    bottleneckReason: "Security convoys in Bab el-Mandeb and slot metering at Suez Canal entrance.",
    heatIntensity: 0.95,
    waypoints: [
      { lat: 29.8, lng: 121.5, label: "Ningbo (CNNGB)" },
      { lat: 1.3, lng: 103.8, label: "Singapore (SGSIN)" },
      { lat: 14.2, lng: 43.1, label: "Bab el-Mandeb Strait" },
      { lat: 31.2, lng: 32.3, label: "Suez Canal" },
      { lat: 51.9, lng: 4.4, label: "Rotterdam (NLRTM)" }
    ],
    bottleneckCoordinates: { lat: 14.2, lng: 43.1, name: "Red Sea Navigational Convoy Queue", delayHours: 72 }
  },
  {
    id: "trans_atlantic",
    name: "Trans-Atlantic Westbound Express",
    originRegion: "Northern Europe (Hamburg / Bremerhaven)",
    destRegion: "North America East Coast (NYC / Savannah)",
    activeVessels: 29,
    congestionLevel: "OPTIMAL",
    averageDelayDays: 0.4,
    weatherRisk: "Favorable summer North Atlantic high-pressure window",
    bottleneckReason: "Minimal friction; normal seasonal gate flow.",
    heatIntensity: 0.25,
    waypoints: [
      { lat: 53.5, lng: 9.9, label: "Hamburg (DEHAM)" },
      { lat: 50.0, lng: -15.0 },
      { lat: 46.8, lng: -28.4, label: "Mid-Atlantic Waypoint" },
      { lat: 40.7, lng: -74.0, label: "New York (USNYC)" }
    ]
  },
  {
    id: "panama_canal",
    name: "Asia-US Gulf / East Coast via Panama Canal",
    originRegion: "East Asia / Southeast Asia",
    destRegion: "US Gulf & South Atlantic (Savannah / Houston)",
    activeVessels: 35,
    congestionLevel: "MODERATE",
    averageDelayDays: 1.8,
    weatherRisk: "Water level draft restrictions in Gatun Lake limiting heavy vessel capacity",
    bottleneckReason: "Canal Authority daily booking slot limits and customs CSI scan queues.",
    heatIntensity: 0.60,
    waypoints: [
      { lat: 1.3, lng: 103.8, label: "Singapore (SGSIN)" },
      { lat: 10.0, lng: 150.0 },
      { lat: 9.1, lng: -79.7, label: "Panama Canal Locks" },
      { lat: 32.0, lng: -81.1, label: "Savannah (USSAV)" }
    ],
    bottleneckCoordinates: { lat: 9.1, lng: -79.7, name: "Panama Canal Gatun Lake Slot Queue", delayHours: 24 }
  },
  {
    id: "intra_asia",
    name: "Intra-Asia Express Shuttle",
    originRegion: "Korea / Japan",
    destRegion: "Eastern & Southern China",
    activeVessels: 54,
    congestionLevel: "OPTIMAL",
    averageDelayDays: 0.2,
    weatherRisk: "Clear weather across Yellow Sea and East China Sea",
    bottleneckReason: "High vessel frequency ensuring immediate berth turnaround.",
    heatIntensity: 0.30,
    waypoints: [
      { lat: 35.1, lng: 129.0, label: "Busan (KRPUS)" },
      { lat: 33.0, lng: 125.0 },
      { lat: 31.2, lng: 121.5, label: "Shanghai (CNSHA)" }
    ]
  }
];

export const MOCK_ALERTS: AlertNotification[] = [
  {
    id: "alt-101",
    containerNumber: "MSCU7849201",
    poNumber: "PO-99842",
    type: "TEMPERATURE_EXCURSION",
    severity: "CRITICAL",
    message: "Reefer temperature rose to -14.2°C (Target: -20.0°C). Vaccine cargo at risk of thermal degradation.",
    timestamp: "2 mins ago",
    acknowledged: false,
    recommendedAction: "Dispatch automated satellite command to reset compressor unit #2 & prepare priority dockside cold drayage.",
    estimatedCostImpactUsd: 14500
  },
  {
    id: "alt-102",
    containerNumber: "TGHU4920184",
    poNumber: "PO-44182",
    type: "PORT_CONGESTION",
    severity: "WARNING",
    message: "Red Sea convoy queue adding 72 hours to Rotterdam ETA. Potential assembly line downtime.",
    timestamp: "18 mins ago",
    acknowledged: false,
    recommendedAction: "Switch final European leg from Rhine barge to Betuweroute express freight train.",
    estimatedCostImpactUsd: 8200
  },
  {
    id: "alt-103",
    containerNumber: "MAEU1948201",
    poNumber: "PO-55102",
    type: "CUSTOMS_HOLD",
    severity: "WARNING",
    message: "Random US Customs CSI non-intrusive X-ray inspection hold triggered at Panama transit hub.",
    timestamp: "1 hour ago",
    acknowledged: true,
    recommendedAction: "Electronically transmit verified HAZMAT Lithium Battery SDS documentation via CBP automated portal.",
    estimatedCostImpactUsd: 6400
  },
  {
    id: "alt-104",
    containerNumber: "MSCU7849201",
    poNumber: "PO-99842",
    type: "LOW_BATTERY",
    severity: "INFO",
    message: "IoT Telemetry sensor battery level dropped to 88%. Solar recharge cycle active.",
    timestamp: "3 hours ago",
    acknowledged: true,
    recommendedAction: "Monitor solar voltage gain during daytime sailing across Pacific.",
    estimatedCostImpactUsd: 0
  }
];

export const INITIAL_METRICS: StakeholderMetrics = {
  totalContainers: 1420,
  activeInTransit: 894,
  onTimePercentage: 91.4,
  delayedContainers: 78,
  criticalAlerts: 3,
  demurrageSavedUsd: 284500,
  carbonFootprintMt: 14280,
  avgTransitTimeDays: 19.4
};

export const ARCHITECTURE_SECTIONS: ArchitectureSection[] = [
  {
    id: "arch-1",
    title: "Zero-Trust IoT & Telemetry Ingestion",
    category: "IoT Ingestion",
    iconName: "Radio",
    summary: "Real-time sensor data from smart shipping containers (temperature, humidity, G-force shock, door seal status, GPS) is transmitted via dual-mode satellite (Iridium/Inmarsat) and 4G LTE cellular modems.",
    technicalSpecs: [
      "MQTT over TLS 1.3 with mutual certificate authentication (mTLS) for every IoT gateway.",
      "Edge computing micro-controllers in reefer units filter transient noise and transmit compressed telemetry packets every 15 minutes.",
      "Dual-mode cellular/satellite fallback ensures 99.99% telemetry uptime even in oceanic dead zones.",
      "Automated over-the-air (OTA) firmware updates secured by ECDSA cryptographic signing."
    ],
    protocols: ["MQTT-SN", "TLS 1.3", "Iridium SBD", "LoRaWAN 1.0.4", "Protobuf v3"]
  },
  {
    id: "arch-2",
    title: "Zero-Trust Security & Encryption Architecture",
    category: "Security & Zero-Trust",
    iconName: "ShieldCheck",
    summary: "Enterprise-grade zero-trust network access (ZTNA) protecting all stakeholder endpoints, API gateways, and container telemetry streams against spoofing or interception.",
    technicalSpecs: [
      "End-to-end encryption: AES-256-GCM for data at rest in cloud databases, TLS 1.3 for data in transit.",
      "Granular Role-Based Access Control (RBAC) separating freight forwarders, customs brokers, ship captains, and cargo owners.",
      "Hardware Security Modules (HSM) store private keys for electronic container bolt seals.",
      "Continuous automated vulnerability scanning and anomaly detection for rogue telemetry packets."
    ],
    protocols: ["AES-256-GCM", "OAuth 2.0 / OIDC", "mTLS", "JWT with RSA-4096", "Zero-Trust Architecture (NIST 800-207)"]
  },
  {
    id: "arch-3",
    title: "Gemini AI Predictive Analytics & Routing Engine",
    category: "Predictive AI Engine",
    iconName: "Cpu",
    summary: "Server-side Google Gemini 3.6 / 3.1 Pro AI engine analyzing historical maritime traffic, real-time AIS vessel coordinates, weather cyclone models, and port terminal berth velocity.",
    technicalSpecs: [
      "Predictive ETA models recalculate arrival windows continuously, reducing supply chain uncertainty by up to 34%.",
      "Automated Demurrage & Detention (D&D) cost mitigation engine dynamically suggests alternate intermodal rail/road routing.",
      "Anomaly detection neural nets flag temperature excursions before cargo spoilage thresholds are breached.",
      "Natural Language Querying allows stakeholders to ask 'What is the fastest way to route PO-99842 around Red Sea delays?'"
    ],
    protocols: ["Google GenAI SDK (@google/genai)", "REST / gRPC APIs", "Time-Series ARIMA / Transformer Models", "AIS AIS-VDES"]
  },
  {
    id: "arch-4",
    title: "Immutable Blockchain Audit Trail & Data Layer",
    category: "Data Layer & Blockchain",
    iconName: "Database",
    summary: "Distributed immutable ledger anchoring key container milestones (Gate-in, customs release, reefer temperature compliance logs, electronic seal verification) for auditability.",
    technicalSpecs: [
      "Cryptographic SHA-256 milestone hashing prevents retroactive tampering with cold-chain pharmaceutical temperature records.",
      "Automated Smart Contracts trigger instant escrow release and insurance claims upon verified GPS port touchdown.",
      "High-throughput time-series database (Cloud Spanner / Bigtable) indexing millions of daily IoT telemetry points.",
      "Cross-organizational EDI (Electronic Data Interchange) API bridge compatible with ANSI X12 and UN/EDIFACT standards."
    ],
    protocols: ["SHA-256 Cryptographic Ledger", "ANSI X12 / EDIFACT", "GraphQL & REST", "Time-Series Partitioning"]
  }
];
