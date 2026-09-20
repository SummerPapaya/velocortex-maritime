/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { MetricCards } from "./components/MetricCards";
import { GlobalTradeMap } from "./components/GlobalTradeMap";
import { ContainerList } from "./components/ContainerList";
import { ContainerDetailModal } from "./components/ContainerDetailModal";
import { RouteHeatmapView } from "./components/RouteHeatmapView";
import { AlertsDashboard } from "./components/AlertsDashboard";
import { ArchitectureModal } from "./components/ArchitectureModal";
import { BulkLookupAudit } from "./components/BulkLookupAudit";
import { DemoDataBanner } from "./components/DemoDataBanner";
import { LivePortWeather } from "./components/LivePortWeather";
import { ChokepointBoard } from "./components/ChokepointBoard";
import { NearshoreAis } from "./components/NearshoreAis";
import { DEMO_BASELINE_LABEL, DEMO_BUILD_LABEL } from "./data/demoMeta";
import { 
  MOCK_CONTAINERS, 
  MOCK_ROUTES, 
  MOCK_ALERTS, 
  INITIAL_METRICS, 
  ARCHITECTURE_SECTIONS 
} from "./data/mockLogistics";
import { ShippingContainer, AlertNotification, StakeholderMetrics } from "./types";
import { 
  Ship, 
  AlertTriangle, 
  Activity, 
  ShieldCheck, 
  Box, 
  Map as MapIcon, 
  Sparkles, 
  Terminal, 
  RefreshCw,
  TrendingUp,
  LayoutGrid,
  Columns,
  Maximize2,
  List,
  Grid,
  Monitor,
  CheckCircle2,
  ChevronRight,
  Layers,
  Radio,
  Filter,
  Compass,
  FileSpreadsheet
} from "lucide-react";
import { useLanguage } from "./context/LanguageContext";

export default function App() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"live" | "dashboard" | "containers" | "heatmap" | "alerts" | "architecture" | "bulk_audit">("dashboard");
  const [dashboardLayout, setDashboardLayout] = useState<"STANDARD" | "SPLIT_DESK" | "BENTO_GRID" | "CINEMATIC_HUD">("STANDARD");
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const [containers, setContainers] = useState<ShippingContainer[]>(MOCK_CONTAINERS);
  const [routes, setRoutes] = useState(MOCK_ROUTES);
  const [alerts, setAlerts] = useState<AlertNotification[]>(MOCK_ALERTS);
  const [metrics, setMetrics] = useState<StakeholderMetrics>(INITIAL_METRICS);
  
  const [selectedContainer, setSelectedContainer] = useState<ShippingContainer | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Apply dark class to html or root element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Re-roll the frozen sample set. This touches ONLY demo values — it does not
  // contact any carrier, IoT or AIS endpoint, and the UI says so.
  const handleRefreshTelemetry = () => {
    setIsRefreshing(true);
    setNotificationToast(
      language === "zh"
        ? `正在重算演示数据集（数据基准 ${DEMO_BASELINE_LABEL}）…`
        : `Re-rolling the demo dataset (baseline ${DEMO_BASELINE_LABEL})…`
    );

    setTimeout(() => {
      // Slightly fluctuate temperatures and progress
      setContainers(prev => prev.map(c => {
        const deltaTemp = (Math.random() - 0.5) * 0.4;
        const newTemp = Number((c.telemetry.temperature + deltaTemp).toFixed(1));
        const newProg = Math.min(100, c.progressPercent + (c.status === "BERTHED" ? 0 : 1));
        
        return {
          ...c,
          progressPercent: newProg,
          telemetry: {
            ...c.telemetry,
            temperature: newTemp,
            lastUpdated: DEMO_BASELINE_LABEL
          }
        };
      }));

      setIsRefreshing(false);
      setNotificationToast(
        language === "zh"
          ? "演示数据已重算（样例值，非实时遥测）。实时港口气象请见「全球枢纽港 · 实时气象与海况」卡片。"
          : "Demo values re-rolled (sample data, not live telemetry). See the Live Port Weather card for real-time data."
      );
      setTimeout(() => setNotificationToast(null), 4000);
    }, 1200);
  };

  // Acknowledge alert
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    setMetrics(prev => ({
      ...prev,
      criticalAlerts: Math.max(0, prev.criticalAlerts - 1)
    }));
    setNotificationToast("Alert acknowledged. AI Remediation workflow dispatched to carrier terminal.");
    setTimeout(() => setNotificationToast(null), 3500);
  };

  // Select container by number (from alerts or search)
  const handleSelectContainerByNumber = (containerNumber: string) => {
    const found = containers.find(c => c.containerNumber === containerNumber);
    if (found) {
      setSelectedContainer(found);
    }
  };

  // Handler to add a new tracked container
  const handleAddContainer = (newContainer: ShippingContainer) => {
    setContainers(prev => [newContainer, ...prev]);
    setNotificationToast(language === "zh" ? `已添加新箱号 ${newContainer.containerNumber} 至实时追踪大屏！` : `Container ${newContainer.containerNumber} added to active tracking dashboard!`);
    setTimeout(() => setNotificationToast(null), 3500);
  };

  // Handler to update an existing container
  const handleUpdateContainer = (updatedContainer: ShippingContainer) => {
    setContainers(prev => prev.map(c => c.id === updatedContainer.id ? updatedContainer : c));
    if (selectedContainer?.id === updatedContainer.id) {
      setSelectedContainer(updatedContainer);
    }
    setNotificationToast(language === "zh" ? `集装箱 ${updatedContainer.containerNumber} 信息已成功更新。` : `Container ${updatedContainer.containerNumber} updated successfully.`);
    setTimeout(() => setNotificationToast(null), 3500);
  };

  // Handler to delete a container
  const handleDeleteContainer = (id: string) => {
    const container = containers.find(c => c.id === id);
    setContainers(prev => prev.filter(c => c.id !== id));
    if (selectedContainer?.id === id) {
      setSelectedContainer(null);
    }
    setNotificationToast(language === "zh" ? `已从实时监控大屏移除箱号 ${container?.containerNumber || id}` : `Removed container ${container?.containerNumber || id} from tracking dashboard.`);
    setTimeout(() => setNotificationToast(null), 3500);
  };

  // Handler to reset containers to default 5
  const handleResetDefaultContainers = () => {
    setContainers(MOCK_CONTAINERS);
    setSelectedContainer(null);
    setNotificationToast(language === "zh" ? "已重置为默认 5 单演示集装箱数据。" : "Reset active dashboard to the 5 default demo containers.");
    setTimeout(() => setNotificationToast(null), 3500);
  };

  // Unacknowledged alerts count
  const unackAlertCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}>
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectContainerFromSearch={(c) => setSelectedContainer(c)}
        allContainers={containers}
        onRefreshTelemetry={handleRefreshTelemetry}
        isRefreshing={isRefreshing}
        alertCount={unackAlertCount}
      />

      {/* Floating Notification Toast */}
      {notificationToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200 border border-blue-400">
          <Activity className="w-5 h-5 animate-spin" />
          <span className="text-xs sm:text-sm font-bold">{notificationToast}</span>
        </div>
      )}

      {/* Main Container Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Data provenance disclosure — always visible, on every tab */}
        <DemoDataBanner />

        {/* Stakeholder Metric Summary Cards (Visible on Standard/Split layouts & containers) */}
        {((activeTab === "dashboard" && (dashboardLayout === "STANDARD" || dashboardLayout === "SPLIT_DESK")) || activeTab === "containers") && (
          <MetricCards 
            metrics={metrics} 
            onOpenAlerts={() => setActiveTab("alerts")} 
          />
        )}

        {/* TAB 1: COMMAND CENTER DASHBOARD (WITH 4 INTERACTIVE LAYOUTS) */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            
            {/* Workspace Architecture Selector Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/20 shrink-0">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">
                      {language === "zh" ? "工作区监控视图架构切换" : "Workspace Architecture Switcher"}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20">
                      {language === "zh" ? "支持 4 种企业级监控布局" : "4 Enterprise Views Available"}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    {language === "zh" ? "当前主控大屏模式:" : "Active Command Layout:"} <span className="text-blue-500">{
                      dashboardLayout === "STANDARD" ? (language === "zh" ? "1. 标准模块化综合堆叠" : "1. Standard Modular Stack") :
                      dashboardLayout === "SPLIT_DESK" ? (language === "zh" ? "2. 左右分屏作业调度工作台" : "2. Split Operations Desk (Side-by-Side)") :
                      dashboardLayout === "BENTO_GRID" ? (language === "zh" ? "3. 决策层 Bento 便当盒数据分析看板" : "3. Executive Bento Grid Analytics") :
                      (language === "zh" ? "4. 沉浸式全景任务控制中心" : "4. Cinematic Fullscreen Mission HUD")
                    }</span>
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setDashboardLayout("STANDARD")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    dashboardLayout === "STANDARD"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>{language === "zh" ? "标准大屏" : "Standard Stack"}</span>
                </button>

                <button
                  onClick={() => setDashboardLayout("SPLIT_DESK")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    dashboardLayout === "SPLIT_DESK"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>{language === "zh" ? "左右分屏" : "Split Desk"}</span>
                </button>

                <button
                  onClick={() => setDashboardLayout("BENTO_GRID")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    dashboardLayout === "BENTO_GRID"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>{language === "zh" ? "Bento看板" : "Bento Grid"}</span>
                </button>

                <button
                  onClick={() => setDashboardLayout("CINEMATIC_HUD")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    dashboardLayout === "CINEMATIC_HUD"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105 ring-2 ring-indigo-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{language === "zh" ? "全景控制台" : "Cinematic HUD"}</span>
                </button>
              </div>
            </div>

            {/* LAYOUT 1: STANDARD MODULAR STACK */}
            {dashboardLayout === "STANDARD" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <GlobalTradeMap
                  containers={containers}
                  routes={routes}
                  onSelectContainer={(c) => setSelectedContainer(c)}
                  selectedRouteId={selectedRouteId}
                  onSelectRoute={(id) => setSelectedRouteId(id)}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 Cols: Priority Tracked Shipments */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Box className="w-5 h-5 text-blue-500" />
                          <span>{language === "zh" ? "重点货物与冷链冷藏箱实时追踪" : "Priority Cargo & Cold-Chain Reefers"}</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {language === "zh" ? "高价值货运实时监测温度稳定性与到港SLA指标。" : "High-value shipments monitored for temperature stability & arrival SLAs."}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab("containers")}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {language === "zh" ? `查看全部 (${containers.length}) ➔` : `View All (${containers.length}) ➔`}
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {containers.slice(0, 3).map((container) => {
                        const isExcursion = container.status === "TEMP_EXCURSION";
                        return (
                          <div
                            key={container.id}
                            onClick={() => setSelectedContainer(container)}
                            className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 rounded-2xl cursor-pointer transition-colors"
                          >
                            {/* min-w-0：让左侧内容可收缩，否则右侧 shrink-0 的状态块会被挤出卡片 */}
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xs ${
                                isExcursion ? "bg-red-500/20 text-red-500" :
                                container.status === "PORT_CONGESTION" ? "bg-amber-500/20 text-amber-500" :
                                "bg-blue-500/20 text-blue-500"
                              }`}>
                                <Ship className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                                    {container.containerNumber}
                                  </span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    {container.poNumber}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                                  {container.vesselName} • {container.originPort.split(" ")[0]} ➔ {container.destinationPort.split(" ")[0]}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase inline-block ${
                                container.status === "TEMP_EXCURSION" ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300" :
                                container.status === "PORT_CONGESTION" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" :
                                "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                              }`}>
                                {language === "zh" ? (
                                  container.status === "TEMP_EXCURSION" ? "温度超限" :
                                  container.status === "PORT_CONGESTION" ? "港口拥堵" :
                                  container.status === "CUSTOMS_HOLD" ? "海关扣留" :
                                  container.status === "IN_TRANSIT" ? "海运在途" : "已抵港"
                                ) : container.status.replace("_", " ")}
                              </span>
                              <div className={`text-xs font-mono font-bold mt-1 ${isExcursion ? "text-red-500" : "text-slate-700 dark:text-slate-300"}`}>
                                {container.telemetry.temperature}°C • {container.progressPercent}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Col: AI Supply Chain Advisory Feed */}
                  <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-indigo-500/30 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                          {language === "zh" ? "Gemini AI 智慧供应链决策引擎（样例输出）" : "Gemini AI Supply Chain Intelligence (sample output)"}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white">
                        {language === "zh" ? "航线与成本优化样例诊断" : "Sample Route & Cost Optimization Summary"}
                      </h4>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        {language === "zh" ? (
                          <>AI模型预测由于多式联运底盘车架短缺，<strong className="text-amber-300">洛杉矶港 USLAX Pier 400</strong> 泊位积压时效将延长 36 小时。</>
                        ) : (
                          <>Our AI models project terminal berth backlog at <strong className="text-amber-300">USLAX Pier 400</strong> extending by 36h due to intermodal chassis deficits.</>
                        )}
                      </p>

                      <div className="mt-4 bg-indigo-900/40 p-4 rounded-2xl border border-indigo-500/30 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-indigo-200">
                          <span>{language === "zh" ? "预计节省滞期费:" : "Predicted Demurrage Savings:"}</span>
                          <strong className="text-emerald-400 font-mono text-sm">$284,500 USD</strong>
                        </div>
                        <div className="flex items-center justify-between text-indigo-200">
                          <span>{language === "zh" ? "备选多式联运路线:" : "Alternate Intermodal Matches:"}</span>
                          <strong className="text-white font-mono">{language === "zh" ? "14 条备选航线" : "14 Routes Available"}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-indigo-500/20">
                      <button
                        onClick={() => setActiveTab("heatmap")}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 text-center block"
                      >
                        {language === "zh" ? "启动航线拥堵与热力图分析 ➔" : "Analyze Route Bottlenecks & Heatmaps ➔"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LAYOUT 2: SPLIT OPERATIONS DESK (SIDE-BY-SIDE) */}
            {dashboardLayout === "SPLIT_DESK" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
                {/* Left 8 Cols: Sticky Map & Corridor Focus */}
                <div className="lg:col-span-8 space-y-6 lg:sticky lg:top-6">
                  <GlobalTradeMap
                    containers={containers}
                    routes={routes}
                    onSelectContainer={(c) => setSelectedContainer(c)}
                    selectedRouteId={selectedRouteId}
                    onSelectRoute={(id) => setSelectedRouteId(id)}
                  />
                </div>

                {/* Right 4 Cols: Urgent IoT Anomalies & Action Desk */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Urgent Anomaly Stream Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-red-500/30 shadow-lg space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                          {language === "zh" ? `紧急异常告警流 (${alerts.filter(a => !a.acknowledged).length})` : `Urgent Anomaly Feed (${alerts.filter(a => !a.acknowledged).length})`}
                        </h4>
                      </div>
                      <button
                        onClick={() => setActiveTab("alerts")}
                        className="text-[11px] font-bold text-red-500 hover:underline"
                      >
                        {language === "zh" ? "立即处置 ➔" : "Action All ➔"}
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {alerts.filter(a => !a.acknowledged).slice(0, 3).map((alert) => (
                        <div key={alert.id} className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-500/30 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500 text-white uppercase">
                              {language === "zh" ? `${alert.priority === "CRITICAL" ? "紧急" : "重要"} 优先级` : `${alert.priority} PRIORITY`}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              {alert.timestamp}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {alert.title}
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                            {alert.description}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                              {language === "zh" ? `影响: ${alert.impactValue}` : `Impact: ${alert.impactValue}`}
                            </span>
                            <button
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold transition-all"
                            >
                              {language === "zh" ? "确认处置" : "Resolve Issue"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cold-Chain Reefer Watchlist */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-500" />
                        <span>{language === "zh" ? "冷链冷藏箱监控重点" : "Cold-Chain Watchlist"}</span>
                      </h4>
                      <span className="text-[11px] font-mono text-cyan-500 font-bold">{language === "zh" ? "100% 实时监测中" : "100% Monitored"}</span>
                    </div>

                    <div className="space-y-2.5">
                      {containers.filter(c => c.cargoType.toLowerCase().includes("reefer")).slice(0, 3).map(container => (
                        <div
                          key={container.id}
                          onClick={() => setSelectedContainer(container)}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white block">
                              {container.containerNumber}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block max-w-[150px]">
                              {container.vesselName}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded ${
                              container.status === "TEMP_EXCURSION" ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500"
                            }`}>
                              {container.telemetry.temperature}°C
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                              Target: {container.telemetry.targetTemp}°C
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* LAYOUT 3: EXECUTIVE BENTO GRID ANALYTICS */}
            {dashboardLayout === "BENTO_GRID" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Top Bento Strip: 4 Executive Gauges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-900/40 to-slate-900 p-5 rounded-3xl border border-blue-500/30 shadow-md">
                    <span className="text-[10px] uppercase font-bold text-blue-400 block">AI Cost Velocity</span>
                    <h3 className="text-2xl font-extrabold text-white font-mono mt-1">$284.5k USD</h3>
                    <p className="text-xs text-slate-300 mt-1">Projected demurrage mitigation this week</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 p-5 rounded-3xl border border-emerald-500/30 shadow-md">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Cold-Chain SLA</span>
                    <h3 className="text-2xl font-extrabold text-white font-mono mt-1">99.4% Valid</h3>
                    <p className="text-xs text-slate-300 mt-1">1,412 / 1,420 reefers within thermal target</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-900/40 to-slate-900 p-5 rounded-3xl border border-amber-500/30 shadow-md">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block">Chokepoint Queue</span>
                    <h3 className="text-2xl font-extrabold text-white font-mono mt-1">+36.2 Hours</h3>
                    <p className="text-xs text-slate-300 mt-1">Average diversion penalty via Cape of Good Hope</p>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 p-5 rounded-3xl border border-indigo-500/30 shadow-md">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 block">Demo Data Cut-off</span>
                    <h3 className="text-2xl font-extrabold text-white font-mono mt-1">{DEMO_BUILD_LABEL}</h3>
                    <p className="text-xs text-slate-300 mt-1">Frozen sample values · no live AIS handshake</p>
                  </div>
                </div>

                {/* Main Bento Row: 2 Col Map + 1 Col Radar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <GlobalTradeMap
                      containers={containers}
                      routes={routes}
                      onSelectContainer={(c) => setSelectedContainer(c)}
                      selectedRouteId={selectedRouteId}
                      onSelectRoute={(id) => setSelectedRouteId(id)}
                    />
                  </div>
                  <div className="space-y-6">
                    {/* Port Congestion Radar Bento Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                        <span>Port Berth Queue Radar</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300">USLAX (Los Angeles)</span>
                          <span className="font-mono font-bold text-amber-500">36h Backlog (Pier 400)</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full w-[75%]" />
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300">EGPSD (Port Said / Suez)</span>
                          <span className="font-mono font-bold text-red-500">72h Diversion Active</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-red-500 h-full w-[95%]" />
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300">SGSIN (Singapore Megaport)</span>
                          <span className="font-mono font-bold text-emerald-500">4h Normal Transit</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full w-[25%]" />
                        </div>
                      </div>
                    </div>

                    {/* SLA Compliance Bento Card */}
                    <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-indigo-500/30 shadow-md space-y-3">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 block">Automated SLA Guarantee</span>
                      <h4 className="text-base font-extrabold">98.8% On-Time Target</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Zero demurrage penalties recorded across Maersk & CMA CGM Pacific lanes this month.
                      </p>
                      <button
                        onClick={() => setActiveTab("containers")}
                        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow"
                      >
                        Audit All 1,420 Containers
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LAYOUT 4: CINEMATIC FULLSCREEN MISSION HUD */}
            {dashboardLayout === "CINEMATIC_HUD" && (
              <div className="relative bg-slate-950 rounded-3xl border-2 border-indigo-500/50 p-4 sm:p-6 shadow-[0_0_50px_rgba(79,70,229,0.2)] animate-in fade-in zoom-in-95 duration-300 space-y-4">
                
                {/* HUD Top Mission Header */}
                <div className="flex items-center justify-between border-b border-indigo-500/30 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-red-500 animate-ping" />
                    <div>
                      <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                        Geospatial Mission Control • NASA / Maritime Ops Mode
                      </span>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                        {language === "zh" ? "全球船队与通道演示数据集" : "Global Fleet & Corridor Demo Dataset"}
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700">
                      🛰️ DEMO FEED · NO LIVE AIS
                    </span>
                    <button
                      onClick={() => setDashboardLayout("STANDARD")}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                    >
                      Exit HUD ✕
                    </button>
                  </div>
                </div>

                {/* HUD Floating Glass Strip over Map */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-900/90 border border-indigo-500/40 p-4 rounded-2xl backdrop-blur-md">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Sample Records In Dataset</span>
                    <span className="text-xl font-mono font-bold text-white">1,420 Containers</span>
                    <span className="text-[10px] text-amber-400 font-bold ml-2">▲ Demo baseline 2026-08-14</span>
                  </div>
                  <div className="bg-slate-900/90 border border-amber-500/40 p-4 rounded-2xl backdrop-blur-md">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Active Alert Diversions</span>
                    <span className="text-xl font-mono font-bold text-amber-400">12 Red Sea Reroutes</span>
                    <span className="text-[10px] text-slate-400 font-bold ml-2">Cape of Good Hope</span>
                  </div>
                  <div className="bg-slate-900/90 border border-emerald-500/40 p-4 rounded-2xl backdrop-blur-md">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">AI Financial Protection</span>
                    <span className="text-xl font-mono font-bold text-emerald-400">$284,500 Saved</span>
                    <span className="text-[10px] text-indigo-300 font-bold ml-2">Gemini Auto-Dispatch</span>
                  </div>
                </div>

                {/* Immersive Map Area */}
                <div className="pt-2">
                  <GlobalTradeMap
                    containers={containers}
                    routes={routes}
                    onSelectContainer={(c) => setSelectedContainer(c)}
                    selectedRouteId={selectedRouteId}
                    onSelectRoute={(id) => setSelectedRouteId(id)}
                  />
                </div>

                {/* HUD Bottom Ticker Bar */}
                <div className="bg-indigo-950/80 border border-indigo-500/30 p-3 rounded-2xl flex items-center justify-between text-xs font-mono text-indigo-200">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>SYSTEM STATUS: ALL GEOSPATIAL CORRIDORS OPERATIONAL • ZERO SECURITY BREACHES</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("heatmap")}
                    className="text-white font-bold hover:underline"
                  >
                    Launch Route Heatmap Diagnostic ➔
                  </button>
                </div>
              </div>
            )}

            {/* Live feeds live exclusively on the Live Data tab — rendering the
                port-weather board here as well duplicated the same panel, so the
                provenance discussion and the data now sit in one place. */}

          </div>
        )}

        {/* TAB 1.5: LIVE DATA — every panel on this tab is a real external feed */}
        {activeTab === "live" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/30 p-5">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {language === "zh" ? "实时数据层 · 三块都是真实外部数据" : "Live Data Layer · all three panels are real external feeds"}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                {language === "zh"
                  ? "这一页与上方演示数据集无关：港口气象与海况来自 Open-Meteo，咽喉点过境量来自 IMF PortWatch 官方统计，近岸船位来自开放 AIS 接口。三者都免费、免密钥、浏览器可直连，因此纯静态托管也能跑出真实数据。"
                  : "This tab is independent of the demo dataset: port weather comes from Open-Meteo, chokepoint transit volumes from IMF PortWatch official statistics, and nearshore positions from an open AIS feed. All three are free, key-less and browser-direct, which is how a purely static host still serves real data."}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {language === "zh"
                  ? "界面上每块面板都自带来源与覆盖范围标注——数据从哪里来、覆盖到哪、哪里接不上，都写在面板底部。"
                  : "Every panel captions its own source and extent at the foot of the card — where the data comes from, how far it reaches, and where it stops."}
              </p>
            </div>

            <ChokepointBoard />
            <NearshoreAis />
            <LivePortWeather />
          </div>
        )}

        {/* TAB 2 & 2.5 UNIFIED: TRACK & TRACE CONTAINERS & MASSIVE BULK LOOKUP */}
        {(activeTab === "containers" || activeTab === "bulk_audit") && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Segmented Sub-tab Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{t("tab.containers")}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === "zh" 
                      ? "支持单票精细追踪、多维度过滤筛选以及企业级大批量单号协同诊断与里程碑审计" 
                      : "Individual tracking, multi-parameter filtering, and massive enterprise EDI/AIS manifest audit"}
                  </p>
                </div>
              </div>

              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0">
                <button
                  onClick={() => setActiveTab("containers")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "containers"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>{t("trace.subtab.list")}</span>
                </button>
                <button
                  onClick={() => setActiveTab("bulk_audit")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "bulk_audit"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>{t("trace.subtab.bulk")}</span>
                </button>
              </div>
            </div>

            {activeTab === "containers" ? (
              <ContainerList
                containers={containers}
                onSelectContainer={(c) => setSelectedContainer(c)}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onAddContainer={handleAddContainer}
                onUpdateContainer={handleUpdateContainer}
                onDeleteContainer={handleDeleteContainer}
                onResetDefaultContainers={handleResetDefaultContainers}
              />
            ) : (
              <BulkLookupAudit
                allContainers={containers}
                onSelectContainer={(c) => setSelectedContainer(c)}
              />
            )}
          </div>
        )}

        {/* TAB 3: ROUTE HEATMAP & BOTTLENECK ANALYSIS */}
        {activeTab === "heatmap" && (
          <RouteHeatmapView
            routes={routes}
            onSelectRouteForMap={(id) => {
              setSelectedRouteId(id);
              setActiveTab("dashboard");
            }}
          />
        )}

        {/* TAB 4: AUTOMATED ALERTS & AI SAVINGS */}
        {activeTab === "alerts" && (
          <AlertsDashboard
            alerts={alerts}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onSelectContainerByNumber={handleSelectContainerByNumber}
            containers={containers}
          />
        )}

        {/* TAB 5: ARCHITECTURE & SECURITY SPECS */}
        {activeTab === "architecture" && (
          <ArchitectureModal
            sections={ARCHITECTURE_SECTIONS}
          />
        )}

      </main>

      {/* Container Detailed Slide-over Modal */}
      {selectedContainer && (
        <ContainerDetailModal
          container={selectedContainer}
          onClose={() => setSelectedContainer(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-8 mt-16 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Ship className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-slate-700 dark:text-slate-300">{language === "zh" ? "VeloCortex 企业级物联网物流引擎" : "VeloCortex Enterprise IoT Logistics Engine"}</span>
            <span>
              {language === "zh"
                ? "• 演示构建：AI 建议文案为构建期样例，不调用在线模型；真实实时数据见「实时数据」标签页（Open-Meteo 气象 / IMF PortWatch 过境量 / 开放 AIS 船位，均免密钥）"
                : "• Demo build: AI advisory text is baked in at build time, no live model call; the real live feeds sit on the Live Data tab (Open-Meteo weather, IMF PortWatch transits, open AIS positions — all key-less)"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab("architecture")} className="hover:text-blue-500 transition-colors">
              Security Protocols
            </button>
            <button onClick={() => setActiveTab("heatmap")} className="hover:text-blue-500 transition-colors">
              Route Heatmaps
            </button>
            <span>{language === "zh" ? `v2.5（演示构建 ${DEMO_BUILD_LABEL}）` : `v2.5 (demo build ${DEMO_BUILD_LABEL})`}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
