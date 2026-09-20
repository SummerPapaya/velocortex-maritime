/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  Grid, 
  List as ListIcon, 
  Thermometer, 
  Activity, 
  ChevronRight, 
  AlertTriangle, 
  Box, 
  Anchor, 
  Clock, 
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  FileText,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  X,
  Save,
  Ship
} from "lucide-react";
import { ShippingContainer } from "../types";
import { useLanguage } from "../context/LanguageContext";

const DEFAULT_NEW_CONTAINER: ShippingContainer = {
  id: "c-custom-init",
  containerNumber: "MSCU8819203",
  poNumber: "PO-99102",
  invoiceNumber: "INV-2026-8812",
  billOfLading: "BOL-881920",
  vesselName: "Maersk Mc-Kinney Møller",
  carrier: "Maersk",
  origin: "Shanghai",
  originPort: "CNSHA (Shanghai Megaport)",
  destination: "Los Angeles",
  destinationPort: "USLAX (Los Angeles Pier 400)",
  status: "IN_TRANSIT",
  priority: "HIGH",
  cargoType: "High-Value Biopharma Reefer",
  eta: new Date(Date.now() + 10 * 86400000).toISOString(),
  coordinates: { lat: 31.2304, lng: 121.4737 },
  progressPercent: 35,
  routeId: "route-transpacific",
  telemetry: {
    temperature: -18.0,
    targetTemp: -18.0,
    humidity: 42,
    batteryLevel: 94,
    shockEvents: 0,
    doorStatus: "SEALED",
    signalStrength: "Satellite (Iridium)",
    lastUpdated: "2026-08-14 09:20 UTC",
    tempHistory: [
      { time: "00:00", temp: -18.0, humidity: 42 },
      { time: "06:00", temp: -18.1, humidity: 42 },
      { time: "12:00", temp: -17.9, humidity: 43 }
    ]
  },
  milestones: [
    {
      id: "m-1",
      title: "Gate In & Customs Cleared",
      location: "CNSHA Terminal 4",
      timestamp: "2 days ago",
      status: "COMPLETED",
      details: "Electronic seal verified by automated OCR gantry."
    },
    {
      id: "m-2",
      title: "Vessel Loaded & Departed",
      location: "CNSHA Berth 12",
      timestamp: "Yesterday",
      status: "COMPLETED",
      details: "Reefer power plugged into ship main grid."
    }
  ],
  aiAnalytics: {
    demurrageRiskUsd: 0,
    riskLevel: "LOW",
    recommendation: "Maintain current cruise speed; berth slot confirmed.",
    actionItems: ["Monitor Iridium telemetry signal"]
  }
};

interface ContainerListProps {
  containers: ShippingContainer[];
  onSelectContainer: (container: ShippingContainer) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddContainer?: (container: ShippingContainer) => void;
  onUpdateContainer?: (container: ShippingContainer) => void;
  onDeleteContainer?: (id: string) => void;
  onResetDefaultContainers?: () => void;
}

export const ContainerList: React.FC<ContainerListProps> = ({
  containers,
  onSelectContainer,
  searchQuery,
  setSearchQuery,
  onAddContainer,
  onUpdateContainer,
  onDeleteContainer,
  onResetDefaultContainers
}) => {
  const { language, t } = useLanguage();
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [carrierFilter, setCarrierFilter] = useState<string>("ALL");
  const [editingContainer, setEditingContainer] = useState<ShippingContainer | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const filteredContainers = containers.filter(c => {
    // Search filter across special identifiers
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const match = 
        c.containerNumber.toLowerCase().includes(q) ||
        c.poNumber.toLowerCase().includes(q) ||
        c.invoiceNumber.toLowerCase().includes(q) ||
        c.billOfLading.toLowerCase().includes(q) ||
        c.vesselName.toLowerCase().includes(q) ||
        c.cargoType.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Status filter
    if (statusFilter !== "ALL") {
      if (statusFilter === "ALERT" && c.status !== "TEMP_EXCURSION" && c.status !== "PORT_CONGESTION" && c.status !== "CUSTOMS_HOLD") return false;
      if (statusFilter !== "ALERT" && c.status !== statusFilter) return false;
    }

    // Carrier filter
    if (carrierFilter !== "ALL" && c.carrier !== carrierFilter) return false;

    return true;
  });

  const carriers = Array.from(new Set(containers.map(c => c.carrier)));

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Identifier Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === "zh" ? "按集装箱号、PO订单、发票、提单号或船名过滤查询..." : "Filter by Container #, PO Number, Invoice, BOL, or Vessel Name..."}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {language === "zh" ? "清除" : "Clear"}
            </button>
          )}
        </div>

        {/* Filter dropdowns and view toggle */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">{language === "zh" ? `全部运行状态 (${containers.length})` : `All Statuses (${containers.length})`}</option>
            <option value="ALERT">{language === "zh" ? `🚨 异常警告 / 温度漂移 (${containers.filter(c => c.status !== "IN_TRANSIT" && c.status !== "BERTHED").length})` : `🚨 Active Alerts / Excursions (${containers.filter(c => c.status !== "IN_TRANSIT" && c.status !== "BERTHED").length})`}</option>
            <option value="IN_TRANSIT">{language === "zh" ? "🚢 海运在途" : "🚢 In Transit"}</option>
            <option value="TEMP_EXCURSION">{language === "zh" ? "🌡️ 温度超限" : "🌡️ Temp Excursion"}</option>
            <option value="PORT_CONGESTION">{language === "zh" ? "⚓ 港口拥堵" : "⚓ Port Congestion"}</option>
            <option value="CUSTOMS_HOLD">{language === "zh" ? "🛑 海关扣留" : "🛑 Customs Hold"}</option>
            <option value="BERTHED">{language === "zh" ? "🏢 靠泊 / 卸港" : "🏢 Berthed / Discharging"}</option>
          </select>

          {/* Carrier filter */}
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">{language === "zh" ? "全部承运船东" : "All Carriers"}</option>
            {carriers.map(carrier => (
              <option key={carrier} value={carrier}>{carrier}</option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid Cards View"
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Table List View"
              className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Add Container Button */}
          {onAddContainer && (
            <button
              onClick={() => {
                setIsCreating(true);
                setEditingContainer({
                  ...DEFAULT_NEW_CONTAINER,
                  id: `c-custom-${Date.now()}`,
                  containerNumber: "MSCU" + Math.floor(1000000 + Math.random() * 9000000),
                });
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>{t("list.addBtn")}</span>
            </button>
          )}

          {/* Reset Default Button */}
          {onResetDefaultContainers && (
            <button
              onClick={onResetDefaultContainers}
              title="Reset to initial 5 demo containers"
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("list.resetBtn")}</span>
            </button>
          )}

        </div>
      </div>

      {/* Empty State */}
      {filteredContainers.length === 0 && (
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-700/50 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Box className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Shipping Containers Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            We couldn't find any containers matching your current search identifiers or filter criteria. Try clearing the search query or selecting "All Statuses".
          </p>
          <button
            onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); setCarrierFilter("ALL"); }}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* GRID CARDS VIEW */}
      {viewMode === "grid" && filteredContainers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContainers.map((container) => {
            const isExcursion = container.status === "TEMP_EXCURSION";
            const isAlert = container.status === "TEMP_EXCURSION" || container.status === "PORT_CONGESTION" || container.status === "CUSTOMS_HOLD";

            return (
              <div
                key={container.id}
                onClick={() => onSelectContainer(container)}
                className={`bg-white dark:bg-slate-800/90 rounded-2xl p-5 border transition-all duration-200 cursor-pointer hover:-translate-y-1 shadow-sm hover:shadow-xl flex flex-col justify-between ${
                  isExcursion ? "border-red-300 dark:border-red-900/60 bg-gradient-to-b from-red-50/20 to-transparent dark:from-red-950/10" :
                  isAlert ? "border-amber-300 dark:border-amber-900/60 bg-gradient-to-b from-amber-50/20 to-transparent dark:from-amber-950/10" :
                  "border-slate-200 dark:border-slate-700/80 hover:border-blue-500/50"
                }`}
              >
                <div>
                  {/* Top Bar: Container # & Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-black text-blue-600 dark:text-blue-400 tracking-tight">
                          {container.containerNumber}
                        </span>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {container.poNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Vessel: <strong className="text-slate-800 dark:text-slate-200">{container.vesselName}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                        container.status === "TEMP_EXCURSION" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
                        container.status === "PORT_CONGESTION" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                        container.status === "CUSTOMS_HOLD" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" :
                        "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isAlert ? "bg-red-500 animate-ping" : "bg-blue-500"}`} />
                        {container.status.replace("_", " ")}
                      </span>

                      {onUpdateContainer && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsCreating(false);
                            setEditingContainer(JSON.parse(JSON.stringify(container)));
                          }}
                          title="Edit Container Record"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors border border-slate-200/60 dark:border-slate-700"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Special Identifiers Strip */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] font-mono mb-4">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">Invoice Number</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{container.invoiceNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">Bill of Lading</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{container.billOfLading}</span>
                    </div>
                  </div>

                  {/* Origin ➔ Destination */}
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 mb-3">
                    <div className="truncate max-w-[42%]">
                      <span className="text-[10px] text-slate-400 block">Origin</span>
                      <span className="truncate block">{container.originPort.split(" ")[0]}</span>
                    </div>
                    <div className="text-slate-400 font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      ➔ {container.progressPercent}%
                    </div>
                    <div className="truncate max-w-[42%] text-right">
                      <span className="text-[10px] text-slate-400 block">Destination</span>
                      <span className="truncate block">{container.destinationPort.split(" ")[0]}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                    <div 
                      className={`h-full transition-all duration-500 ${isExcursion ? "bg-red-500" : "bg-blue-500"}`} 
                      style={{ width: `${container.progressPercent}%` }} 
                    />
                  </div>

                  {/* Telemetry preview */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Thermometer className={`w-4 h-4 ${isExcursion ? "text-red-500 animate-bounce" : "text-blue-500"}`} />
                      <span className={`font-mono font-bold ${isExcursion ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}`}>
                        {container.telemetry.temperature}°C
                      </span>
                      <span className="text-slate-400 text-[10px]">({container.telemetry.humidity}% RH)</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>ETA: {new Date(container.eta).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* AI Demurrage Badge at Bottom */}
                {container.aiAnalytics && container.aiAnalytics.demurrageRiskUsd > 0 && (
                  <div className="mt-3 pt-2 border-t border-red-200/60 dark:border-red-900/40 flex items-center justify-between text-xs font-bold text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 px-3 py-1.5 rounded-xl">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-red-500" />
                      <span>AI D&D Risk:</span>
                    </span>
                    <span className="font-mono">${container.aiAnalytics.demurrageRiskUsd.toLocaleString()} USD</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE LIST VIEW */}
      {viewMode === "table" && filteredContainers.length > 0 && (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Container & PO #</th>
                  <th className="py-3 px-4">Invoice / BOL</th>
                  <th className="py-3 px-4">Vessel & Carrier</th>
                  <th className="py-3 px-4">Origin ➔ Destination</th>
                  <th className="py-3 px-4">IoT Telemetry</th>
                  <th className="py-3 px-4">Status & ETA</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                {filteredContainers.map((container) => {
                  const isExcursion = container.status === "TEMP_EXCURSION";
                  return (
                    <tr 
                      key={container.id}
                      onClick={() => onSelectContainer(container)}
                      className="hover:bg-blue-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                          {container.containerNumber}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {container.poNumber}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="text-slate-800 dark:text-slate-200 font-bold">{container.invoiceNumber}</div>
                        <div className="text-slate-500 dark:text-slate-400 mt-0.5">{container.billOfLading}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{container.vesselName}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{container.carrier}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {container.originPort.split(" ")[0]} ➔ {container.destinationPort.split(" ")[0]}
                        </div>
                        <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1.5">
                          <div className={`h-full ${isExcursion ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${container.progressPercent}%` }} />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <div className={`flex items-center gap-1 ${isExcursion ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}`}>
                          <Thermometer className="w-3.5 h-3.5" />
                          <span>{container.telemetry.temperature}°C</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-sans block mt-0.5">{container.telemetry.humidity}% RH • {container.telemetry.signalStrength}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-block ${
                          container.status === "TEMP_EXCURSION" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
                          container.status === "PORT_CONGESTION" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                          "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        }`}>
                          {container.status.replace("_", " ")}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          ETA: {new Date(container.eta).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          {onUpdateContainer && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsCreating(false);
                                setEditingContainer(JSON.parse(JSON.stringify(container)));
                              }}
                              title="Edit Container Record"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectContainer(container)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all inline-flex items-center gap-1"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT / CREATE CONTAINER MODAL OVERLAY */}
      {editingContainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isCreating ? t("list.addTitle") : t("list.editTitle")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {editingContainer.containerNumber} ({editingContainer.poNumber})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingContainer(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Row 1: Identifiers */}
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-2.5">
                  1. Core Shipment Identifiers
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">Container Number</label>
                    <input
                      type="text"
                      value={editingContainer.containerNumber}
                      onChange={(e) => setEditingContainer({ ...editingContainer, containerNumber: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">PO Number (Purchase Order)</label>
                    <input
                      type="text"
                      value={editingContainer.poNumber}
                      onChange={(e) => setEditingContainer({ ...editingContainer, poNumber: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">Invoice Number</label>
                    <input
                      type="text"
                      value={editingContainer.invoiceNumber}
                      onChange={(e) => setEditingContainer({ ...editingContainer, invoiceNumber: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">Bill of Lading (BOL)</label>
                    <input
                      type="text"
                      value={editingContainer.billOfLading}
                      onChange={(e) => setEditingContainer({ ...editingContainer, billOfLading: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Vessel & Route */}
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-2.5">
                  2. Vessel, Carrier & Routing
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">Vessel Name</label>
                    <input
                      type="text"
                      value={editingContainer.vesselName}
                      onChange={(e) => setEditingContainer({ ...editingContainer, vesselName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">Shipping Line / Carrier</label>
                    <select
                      value={editingContainer.carrier}
                      onChange={(e) => setEditingContainer({ ...editingContainer, carrier: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Maersk">Maersk</option>
                      <option value="MSC">MSC</option>
                      <option value="CMA CGM">CMA CGM</option>
                      <option value="Hapag-Lloyd">Hapag-Lloyd</option>
                      <option value="Evergreen">Evergreen</option>
                      <option value="ONE">ONE</option>
                      <option value="ZIM">ZIM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">Origin Port / Terminal</label>
                    <input
                      type="text"
                      value={editingContainer.originPort}
                      onChange={(e) => setEditingContainer({ ...editingContainer, originPort: e.target.value, origin: e.target.value.split(" ")[0] })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">Destination Port / Terminal</label>
                    <input
                      type="text"
                      value={editingContainer.destinationPort}
                      onChange={(e) => setEditingContainer({ ...editingContainer, destinationPort: e.target.value, destination: e.target.value.split(" ")[0] })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Status & Progress & Telemetry */}
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-2.5">
                  3. Live Status, Progress & Cold-Chain IoT Telemetry
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">Operational Status</label>
                    <select
                      value={editingContainer.status}
                      onChange={(e) => setEditingContainer({ ...editingContainer, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="IN_TRANSIT">🚢 IN TRANSIT (Normal)</option>
                      <option value="TEMP_EXCURSION">🌡️ TEMP EXCURSION (Alert)</option>
                      <option value="PORT_CONGESTION">⚓ PORT CONGESTION (Alert)</option>
                      <option value="CUSTOMS_HOLD">🛑 CUSTOMS HOLD (Alert)</option>
                      <option value="BERTHED">🏢 BERTHED / DISCHARGING</option>
                      <option value="DELIVERED">✅ DELIVERED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">Route Progress ({editingContainer.progressPercent}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editingContainer.progressPercent}
                      onChange={(e) => setEditingContainer({ ...editingContainer, progressPercent: Number(e.target.value) })}
                      className="w-full mt-2 accent-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">ETA Date</label>
                    <input
                      type="date"
                      value={editingContainer.eta.split('T')[0] || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setEditingContainer({ ...editingContainer, eta: new Date(e.target.value).toISOString() })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">Current Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingContainer.telemetry.temperature}
                      onChange={(e) => setEditingContainer({
                        ...editingContainer,
                        telemetry: { ...editingContainer.telemetry, temperature: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">Target Temp SLA (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingContainer.telemetry.targetTemp}
                      onChange={(e) => setEditingContainer({
                        ...editingContainer,
                        telemetry: { ...editingContainer.telemetry, targetTemp: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">Humidity (% RH)</label>
                    <input
                      type="number"
                      value={editingContainer.telemetry.humidity}
                      onChange={(e) => setEditingContainer({
                        ...editingContainer,
                        telemetry: { ...editingContainer.telemetry, humidity: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                {!isCreating && onDeleteContainer && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t("list.confirmDelete"))) {
                        onDeleteContainer(editingContainer.id);
                        setEditingContainer(null);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t("list.deleteBtn")}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingContainer(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isCreating) {
                      onAddContainer && onAddContainer(editingContainer);
                    } else {
                      onUpdateContainer && onUpdateContainer(editingContainer);
                    }
                    setEditingContainer(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isCreating ? t("list.createBtn") : t("list.saveBtn")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
