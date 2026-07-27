/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Ship, 
  AlertTriangle, 
  Thermometer, 
  Anchor, 
  Navigation, 
  Layers, 
  ExternalLink, 
  Activity, 
  Zap, 
  Globe, 
  ShieldAlert, 
  Sparkles, 
  ChevronRight, 
  X, 
  MapPin, 
  Compass, 
  Info 
} from "lucide-react";
import { ShippingContainer, TradeRoute } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { 
  WORLD_LANDMASSES, 
  WORLD_WATER_LABELS, 
  MARITIME_CHOKEPOINTS, 
  MaritimeChokepoint 
} from "../data/worldMapData";

interface GlobalTradeMapProps {
  containers: ShippingContainer[];
  routes: TradeRoute[];
  onSelectContainer: (container: ShippingContainer) => void;
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string | null) => void;
}

export const GlobalTradeMap: React.FC<GlobalTradeMapProps> = ({
  containers,
  routes,
  onSelectContainer,
  selectedRouteId,
  onSelectRoute
}) => {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [hoveredContainer, setHoveredContainer] = useState<ShippingContainer | null>(null);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [mapMode, setMapMode] = useState<"STANDARD" | "TOPO" | "CHOKEPOINTS">("STANDARD");
  const [selectedChokepoint, setSelectedChokepoint] = useState<MaritimeChokepoint | null>(
    MARITIME_CHOKEPOINTS[0] // Default to Red Sea for initial visibility
  );
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // Convert lat/lng to SVG coordinate system (ViewBox 0 0 1000 500)
  // Lat ranges from +80 to -60 -> Y from 50 to 450
  // Lng ranges from -180 to +180 -> X from 50 to 950
  const latLngToXY = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 900 + 50;
    const y = ((80 - lat) / 140) * 400 + 50;
    return { x, y };
  };

  const filteredContainers = containers.filter(c => {
    if (selectedRouteId && c.routeId !== selectedRouteId) return false;
    if (filterStatus === "ALERT" && c.status !== "TEMP_EXCURSION" && c.status !== "PORT_CONGESTION" && c.status !== "CUSTOMS_HOLD") return false;
    if (filterStatus === "REEFER" && !c.cargoType.toLowerCase().includes("reefer")) return false;
    if (filterStatus === "DRY" && !c.cargoType.toLowerCase().includes("dry")) return false;
    return true;
  });

  // Theme styles based on mapMode
  const getLandmassStyle = () => {
    if (mapMode === "TOPO") {
      return { fill: "#065f46", stroke: "#047857", opacity: 0.85 };
    }
    if (mapMode === "CHOKEPOINTS") {
      return { fill: "#0f172a", stroke: "#1e293b", opacity: 0.7 };
    }
    return { fill: "#1e293b", stroke: "#334155", opacity: 0.9 }; // STANDARD
  };

  const getOceanBgClass = () => {
    if (mapMode === "TOPO") return "bg-[#02182b]";
    if (mapMode === "CHOKEPOINTS") return "bg-slate-950";
    return "bg-[#09111e]"; // Classic Navy
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden mb-8 text-white space-y-6">
      
      {/* Map Header & Multi-Mode Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">{isZh ? "全球物流指挥调度中心" : "Global Logistics Command"}</span>
            <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded-full font-mono font-bold">
              {isZh ? "高精度海洋岸线地理引擎" : "High-Precision Coastline Engine"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2 mt-1">
            {isZh ? "实时全球 AIS 卫星与海事地理通道大屏" : "Live Global AIS & Maritime Chokepoint Map"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {isZh ? "直观清晰的大陆板块轮廓与主要大洋航线，帮助调度中心秒级识别全球港口拥堵、红海安全改道与码头排队泊位时效。" : "Recognizable continental outlines and oceanic corridors make identifying major trade bottlenecks, Red Sea security rerouting, and terminal delays instantaneous."}
          </p>
        </div>

        {/* Top Controls Strip */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Map Style Segmented Control */}
          <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setMapMode("STANDARD")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${mapMode === "STANDARD" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isZh ? "标准海图" : "Standard"}</span>
            </button>
            <button
              onClick={() => setMapMode("TOPO")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${mapMode === "TOPO" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{isZh ? "地形洋流" : "Topographic"}</span>
            </button>
            <button
              onClick={() => setMapMode("CHOKEPOINTS")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${mapMode === "CHOKEPOINTS" ? "bg-red-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{isZh ? "关键海运通道" : "Chokepoints"}</span>
            </button>
          </div>

          {/* Labels Toggle */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              showLabels 
                ? "bg-slate-800 text-slate-200 border-slate-600" 
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            <span>{showLabels ? (isZh ? "🏷️ 地理标识: 开" : "🏷️ Labels On") : (isZh ? "🏷️ 地理标识: 关" : "🏷️ Labels Off")}</span>
          </button>

          {/* Heatmap Toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              showHeatmap 
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm" 
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showHeatmap ? "Heatmap Active" : "Heatmap Off"}</span>
          </button>

          {/* Route Filter Dropdown */}
          <select
            value={selectedRouteId || ""}
            onChange={(e) => onSelectRoute(e.target.value ? e.target.value : null)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Shipping Lanes ({routes.length})</option>
            {routes.map(r => (
              <option key={r.id} value={r.id}>{r.name} ({r.congestionLevel})</option>
            ))}
          </select>

          {/* Cargo Status Filter */}
          <div className="flex items-center bg-slate-800/90 rounded-xl p-0.5 border border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${filterStatus === "ALL" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              All ({containers.length})
            </button>
            <button
              onClick={() => setFilterStatus("ALERT")}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${filterStatus === "ALERT" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Alerts ({containers.filter(c => c.status !== "IN_TRANSIT" && c.status !== "BERTHED" && c.status !== "DELIVERED").length})</span>
            </button>
            <button
              onClick={() => setFilterStatus("REEFER")}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${filterStatus === "REEFER" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              <Thermometer className="w-3 h-3" />
              <span>Reefers</span>
            </button>
          </div>

        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className={`relative w-full aspect-[2/1] min-h-[400px] max-h-[600px] ${getOceanBgClass()} rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center transition-colors duration-500`}>
        
        {/* Geographic Graticule Grid (Equator & Tropics) */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Subtle Grid Pattern */}
          <div className="w-full h-full bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        </div>

        <svg viewBox="0 0 1000 500" className="w-full h-full select-none">
          
          <defs>
            <linearGradient id="oceanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0369a1" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#1e40af" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#312e81" stopOpacity="0.15" />
            </linearGradient>
            
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Oceanic Tint */}
          <rect x="0" y="0" width="1000" height="500" fill="url(#oceanGlow)" />

          {/* LAYER 1: HIGH-PRECISION WORLD LANDMASSES (Bottom Layer) */}
          <g className="transition-all duration-300">
            {WORLD_LANDMASSES.map((land) => {
              const pts = land.coordinates.map(([lat, lng]) => {
                const { x, y } = latLngToXY(lat, lng);
                return `${x},${y}`;
              }).join(" ");

              const style = getLandmassStyle();

              return (
                <polygon
                  key={land.id}
                  points={pts}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={mapMode === "TOPO" ? "1.5" : "1"}
                  strokeLinejoin="round"
                  className="transition-colors duration-300 hover:fill-slate-700 cursor-default"
                >
                  <title>{land.name} ({land.region})</title>
                </polygon>
              );
            })}
          </g>

          {/* Geographic Reference Lines (Equator & Tropics) */}
          {showLabels && (
            <g className="opacity-20 stroke-slate-500 stroke-1 stroke-dasharray-[4,4] text-[8px] font-mono fill-slate-400">
              {/* Equator (Lat 0 -> y = 278.5) */}
              <line x1="50" y1="278.5" x2="950" y2="278.5" />
              <text x="55" y="275">EQUATOR (0°)</text>

              {/* Tropic of Cancer (Lat 23.5 -> y = 211.4) */}
              <line x1="50" y1="211.4" x2="950" y2="211.4" />
              <text x="55" y="208">TROPIC OF CANCER (23.5°N)</text>

              {/* Tropic of Capricorn (Lat -23.5 -> y = 345.7) */}
              <line x1="50" y1="345.7" x2="950" y2="345.7" />
              <text x="55" y="342">TROPIC OF CAPRICORN (23.5°S)</text>

              {/* Prime Meridian (Lng 0 -> x = 500) */}
              <line x1="500" y1="50" x2="500" y2="450" />
              <text x="504" y="62">PRIME MERIDIAN (0°)</text>
            </g>
          )}

          {/* LAYER 2: STRATEGIC WATER & REGION LABELS */}
          {showLabels && (
            <g className="pointer-events-none select-none font-sans">
              {WORLD_WATER_LABELS.map((lbl) => {
                const { x, y } = latLngToXY(lbl.lat, lbl.lng);
                const isOcean = lbl.type === "OCEAN";
                const isRegion = lbl.type === "REGION";

                return (
                  <text
                    key={lbl.id}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    fontSize={isOcean ? "11" : isRegion ? "10" : "9"}
                    fontWeight={isOcean || isRegion ? "900" : "600"}
                    letterSpacing={isOcean ? "2" : isRegion ? "1.5" : "0.5"}
                    fill={
                      isOcean ? "#38bdf8" :
                      isRegion ? "#94a3b8" : "#64748b"
                    }
                    opacity={isOcean ? "0.35" : isRegion ? "0.3" : "0.5"}
                    className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                  >
                    {lbl.name}
                  </text>
                );
              })}
            </g>
          )}

          {/* LAYER 3: TRADE ROUTE CORRIDORS & HEATMAP GLOW */}
          {routes.map((route) => {
            const isSelected = selectedRouteId === route.id;
            const isDimmed = (selectedRouteId && !isSelected) || (mapMode === "CHOKEPOINTS" && !isSelected);
            if (route.waypoints.length < 2) return null;

            // Generate path string from waypoints
            const pts = route.waypoints.map(wp => latLngToXY(wp.lat, wp.lng));
            let pathD = `M ${pts[0].x} ${pts[0].y}`;
            for (let i = 1; i < pts.length; i++) {
              const prev = pts[i - 1];
              const curr = pts[i];
              const midX = (prev.x + curr.x) / 2;
              const midY = (prev.y + curr.y) / 2 - (i % 2 === 0 ? 20 : -20);
              pathD += ` Q ${midX} ${midY} ${curr.x} ${curr.y}`;
            }

            const strokeColor = route.congestionLevel === "CRITICAL" ? "#ef4444" :
                                route.congestionLevel === "SEVERE" ? "#f97316" :
                                route.congestionLevel === "MODERATE" ? "#eab308" : "#3b82f6";

            return (
              <g key={route.id} className={`transition-opacity duration-300 ${isDimmed ? "opacity-20" : "opacity-90"}`}>
                {/* Heatmap wide glow */}
                {showHeatmap && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 20 : route.heatIntensity * 16}
                    strokeLinecap="round"
                    className="opacity-30 blur-[4px]"
                  />
                )}
                {/* Main route track line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 3.5 : 2.2}
                  strokeDasharray={route.congestionLevel === "CRITICAL" ? "6,6" : "none"}
                  className="transition-all cursor-pointer hover:stroke-white"
                  onClick={() => onSelectRoute(route.id === selectedRouteId ? null : route.id)}
                />
                
                {/* Route label at midpoint */}
                {(isSelected || showLabels) && (
                  <text
                    x={(pts[0].x + pts[pts.length - 1].x) / 2}
                    y={(pts[0].y + pts[pts.length - 1].y) / 2 - 15}
                    fill={isSelected ? "#ffffff" : "#93c5fd"}
                    fontSize={isSelected ? "11" : "9"}
                    fontWeight="bold"
                    textAnchor="middle"
                    className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-sans pointer-events-none"
                    opacity={isSelected ? "1" : "0.75"}
                  >
                    {route.name} ({route.activeVessels} vessels)
                  </text>
                )}
              </g>
            );
          })}

          {/* LAYER 4: INTERACTIVE MARITIME CHOKEPOINTS & BOTTLENECKS */}
          {MARITIME_CHOKEPOINTS.map((cp) => {
            const { x, y } = latLngToXY(cp.lat, cp.lng);
            const isSelectedCp = selectedChokepoint?.id === cp.id;
            const isCritical = cp.status === "CRITICAL" || cp.status === "SEVERE";
            const badgeColor = cp.status === "CRITICAL" ? "#ef4444" :
                               cp.status === "SEVERE" ? "#f97316" :
                               cp.status === "MODERATE" ? "#eab308" : "#10b981";

            return (
              <g
                key={cp.id}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedChokepoint(cp);
                  if (cp.impactedRoutes.length > 0) {
                    onSelectRoute(cp.impactedRoutes[0]);
                  }
                }}
              >
                {/* Radar pulsing ring */}
                <circle
                  r={isSelectedCp ? "28" : isCritical ? "20" : "14"}
                  fill={badgeColor}
                  className="opacity-30 animate-ping"
                />

                {/* Selection target ring */}
                {isSelectedCp && (
                  <circle
                    r="16"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="3,3"
                    className="animate-spin"
                  />
                )}
                
                {/* Core Chokepoint Icon */}
                <circle
                  r={isSelectedCp ? "9" : "7"}
                  fill={badgeColor}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="shadow-2xl transition-transform group-hover:scale-125"
                />

                {/* Chokepoint Label Banner */}
                {(showLabels || isSelectedCp || mapMode === "CHOKEPOINTS") && (
                  <g transform="translate(12, -4)">
                    <rect
                      x="0"
                      y="-11"
                      width={cp.shortName.length * 6 + 48}
                      height="18"
                      rx="6"
                      fill="#0f172ae6"
                      stroke={badgeColor}
                      strokeWidth="1.5"
                    />
                    <text
                      x="6"
                      y="1"
                      fill="#f8fafc"
                      fontSize="9"
                      fontWeight="bold"
                      className="font-sans select-none"
                    >
                      📍 {cp.shortName} (+{cp.delayHours}h)
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* LAYER 5: LIVE VESSEL & CONTAINER MARKERS */}
          {filteredContainers.map((container) => {
            const { x, y } = latLngToXY(container.coordinates.lat, container.coordinates.lng);
            const isAlert = container.status === "TEMP_EXCURSION" || container.status === "PORT_CONGESTION" || container.status === "CUSTOMS_HOLD";
            const markerColor = container.status === "TEMP_EXCURSION" ? "#ef4444" :
                                container.status === "PORT_CONGESTION" ? "#f97316" :
                                container.status === "CUSTOMS_HOLD" ? "#a855f7" :
                                container.status === "BERTHED" ? "#10b981" : "#3b82f6";

            return (
              <g
                key={container.id}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer transition-transform hover:scale-125 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectContainer(container);
                }}
                onMouseEnter={() => setHoveredContainer(container)}
                onMouseLeave={() => setHoveredContainer(null)}
              >
                {/* Outer pulse if alert */}
                {isAlert && (
                  <circle r="13" fill={markerColor} className="opacity-40 animate-ping" />
                )}
                
                {/* Vessel Icon Circle */}
                <circle r="6" fill={markerColor} stroke="#ffffff" strokeWidth="1.5" className="shadow-lg" />
                
                {/* Mini carrier initial */}
                <text x="0" y="2.5" fontSize="7" fill="#ffffff" textAnchor="middle" fontWeight="bold" className="pointer-events-none select-none">
                  {container.carrier[0]}
                </text>
              </g>
            );
          })}

        </svg>

        {/* Hovered Container Quick Popover */}
        {hoveredContainer && (
          <div className="absolute bottom-4 left-4 z-30 bg-slate-900/95 border border-slate-700 p-4 rounded-2xl shadow-2xl max-w-sm backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-2 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-blue-400">
                    {hoveredContainer.containerNumber}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {hoveredContainer.poNumber}
                  </span>
                </div>
                <p className="text-xs font-semibold text-white mt-0.5">
                  Vessel: {hoveredContainer.vesselName} ({hoveredContainer.carrier})
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                hoveredContainer.status === "TEMP_EXCURSION" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                hoveredContainer.status === "PORT_CONGESTION" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              }`}>
                {hoveredContainer.status.replace("_", " ")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="bg-slate-800/60 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Reefer Telemetry</span>
                <span className={`font-mono font-bold ${hoveredContainer.telemetry.temperature > -18 && hoveredContainer.telemetry.targetTemp < 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {hoveredContainer.telemetry.temperature}°C / {hoveredContainer.telemetry.humidity}% RH
                </span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Progress & ETA</span>
                <span className="font-mono font-bold text-slate-200">
                  {hoveredContainer.progressPercent}% • {hoveredContainer.revisedEta ? "Delayed" : "On Time"}
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectContainer(hoveredContainer)}
              className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <span>View Full Trace & AI Advisory</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Selected Chokepoint AI Advisory Floating Card */}
        {selectedChokepoint && (
          <div className="absolute top-4 left-4 z-30 bg-slate-900/95 border border-indigo-500/50 p-5 rounded-3xl shadow-2xl max-w-md backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-200 space-y-3 text-left">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                  selectedChokepoint.status === "CRITICAL" ? "bg-red-500 shadow-lg shadow-red-500/30" :
                  selectedChokepoint.status === "SEVERE" ? "bg-amber-500 shadow-lg shadow-amber-500/30" :
                  "bg-blue-500"
                }`}>
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-indigo-950 text-indigo-300 border border-indigo-800">
                      Maritime Bottleneck Focus
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      selectedChokepoint.status === "CRITICAL" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                      selectedChokepoint.status === "SEVERE" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                      "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    }`}>
                      +{selectedChokepoint.delayHours}h Delay
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white mt-1">
                    {selectedChokepoint.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedChokepoint(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedChokepoint.description}
            </p>

            <div className="bg-indigo-950/60 p-3 rounded-2xl border border-indigo-500/30 space-y-1.5">
              <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gemini AI Mitigation Strategy:</span>
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed">
                {selectedChokepoint.aiMitigationStrategy}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] font-mono text-slate-400">
                Daily Transit: <strong>{selectedChokepoint.dailyVesselTransit} vessels</strong>
              </span>
              {selectedChokepoint.impactedRoutes.length > 0 && (
                <button
                  onClick={() => onSelectRoute(selectedChokepoint.impactedRoutes[0])}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center gap-1 shadow-md"
                >
                  <span>Filter Affected Route</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-4 right-4 z-20 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-[11px] space-y-1.5 shadow-xl hidden sm:block">
          <div className="font-bold text-slate-300 mb-1 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Map Legend</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-400">Normal Transit</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-slate-400">Temp Excursion / Alert</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-400">Port Congestion Delay</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Berthed / Discharging</span>
          </div>
        </div>

      </div>

      {/* Bottleneck & Chokepoints Interactive Strip */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Key Maritime Chokepoints & Route Bottlenecks (Click to Inspect AI Advisory):</span>
          </span>
          <span className="text-slate-500 font-mono text-[11px]">7 Global Chokepoints Monitored</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MARITIME_CHOKEPOINTS.slice(0, 4).map((cp) => {
            const isSelected = selectedChokepoint?.id === cp.id;
            const badgeColor = cp.status === "CRITICAL" ? "border-red-500/40 bg-red-950/20 text-red-400" :
                               cp.status === "SEVERE" ? "border-amber-500/40 bg-amber-950/20 text-amber-400" :
                               "border-blue-500/40 bg-blue-950/20 text-blue-400";

            return (
              <div
                key={cp.id}
                onClick={() => {
                  setSelectedChokepoint(cp);
                  if (cp.impactedRoutes.length > 0) {
                    onSelectRoute(cp.impactedRoutes[0]);
                  }
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer hover:shadow-lg flex items-start gap-3 ${
                  isSelected 
                    ? "bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/30 shadow-indigo-500/10" 
                    : "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${badgeColor}`}>
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 truncate">
                      {cp.shortName}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${badgeColor}`}>
                      +{cp.delayHours}h
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate mt-0.5">
                    {cp.name.split(" ")[0]} {cp.name.split(" ")[1]}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {cp.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
