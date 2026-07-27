/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ContainerStatus = 
  | "IN_TRANSIT" 
  | "PORT_CONGESTION" 
  | "CUSTOMS_HOLD" 
  | "DELIVERED" 
  | "BERTHED" 
  | "TEMP_EXCURSION";

export type PriorityLevel = "LOW" | "MEDIUM" | "STANDARD" | "HIGH" | "CRITICAL";

export type TelemetrySignal = "4G LTE" | "Satellite (Iridium)" | "LoRaWAN" | "Weak";

export type DoorStatus = "SEALED" | "OPEN" | "TAMPER_DETECTED";

export interface TelemetryPoint {
  time: string;
  temp: number;
  humidity: number;
}

export interface Milestone {
  id: string;
  title: string;
  location: string;
  timestamp: string;
  status: "COMPLETED" | "IN_PROGRESS" | "PENDING" | "ALERT";
  details: string;
  txHash?: string; // Simulated blockchain immutable ledger verification hash
}

export interface ShippingContainer {
  id: string;
  containerNumber: string; // e.g., MSCU7849201
  poNumber: string;        // e.g., PO-99842
  invoiceNumber: string;   // e.g., INV-2026-8819
  billOfLading: string;    // e.g., BOL-884920
  vesselName: string;      // e.g., Ever Given II
  carrier: "Maersk" | "MSC" | "CMA CGM" | "Hapag-Lloyd" | "Evergreen" | "ONE" | "ZIM";
  origin: string;
  originPort: string;
  destination: string;
  destinationPort: string;
  status: ContainerStatus;
  priority: PriorityLevel;
  cargoType: string;
  eta: string;
  revisedEta?: string;
  coordinates: { lat: number; lng: number };
  progressPercent: number;
  routeId: string;
  telemetry: {
    temperature: number; // in Celsius
    targetTemp: number;  // in Celsius
    humidity: number;    // %
    batteryLevel: number;// %
    shockEvents: number; // G-force spike count
    doorStatus: DoorStatus;
    signalStrength: TelemetrySignal;
    lastUpdated: string;
    tempHistory: TelemetryPoint[];
  };
  milestones: Milestone[];
  aiAnalytics?: {
    demurrageRiskUsd: number;
    riskLevel: PriorityLevel;
    recommendation: string;
    actionItems: string[];
  };
}

export interface TradeRoute {
  id: string;
  name: string;
  originRegion: string;
  destRegion: string;
  activeVessels: number;
  congestionLevel: "OPTIMAL" | "MODERATE" | "SEVERE" | "CRITICAL";
  averageDelayDays: number;
  weatherRisk: string;
  bottleneckReason: string;
  heatIntensity: number; // 0 to 1 for visual heatmap
  waypoints: { lat: number; lng: number; label?: string }[];
  bottleneckCoordinates?: { lat: number; lng: number; name: string; delayHours: number };
}

export interface AlertNotification {
  id: string;
  containerNumber: string;
  poNumber: string;
  type: "TEMPERATURE_EXCURSION" | "ROUTE_DEVIATION" | "CUSTOMS_HOLD" | "PORT_CONGESTION" | "LOW_BATTERY" | "DOOR_TAMPER";
  severity: "CRITICAL" | "WARNING" | "INFO";
  message: string;
  timestamp: string;
  acknowledged: boolean;
  recommendedAction: string;
  estimatedCostImpactUsd: number;
}

export interface StakeholderMetrics {
  totalContainers: number;
  activeInTransit: number;
  onTimePercentage: number;
  delayedContainers: number;
  criticalAlerts: number;
  demurrageSavedUsd: number;
  carbonFootprintMt: number;
  avgTransitTimeDays: number;
}

export interface ArchitectureSection {
  id: string;
  title: string;
  category: "IoT Ingestion" | "Security & Zero-Trust" | "Predictive AI Engine" | "Data Layer & Blockchain";
  iconName: string;
  summary: string;
  technicalSpecs: string[];
  protocols: string[];
}
