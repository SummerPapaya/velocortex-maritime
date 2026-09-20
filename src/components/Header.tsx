/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Ship, 
  Search, 
  Moon, 
  Sun, 
  Layers, 
  AlertTriangle, 
  Activity, 
  ShieldCheck, 
  RefreshCw,
  Box,
  Map,
  TrendingDown,
  FileSpreadsheet,
  Globe,
  FlaskConical,
  Radio
} from "lucide-react";
import { ShippingContainer } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface HeaderProps {
  activeTab: "live" | "dashboard" | "containers" | "heatmap" | "alerts" | "architecture" | "bulk_audit";
  setActiveTab: (tab: "live" | "dashboard" | "containers" | "heatmap" | "alerts" | "architecture" | "bulk_audit") => void;
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectContainerFromSearch: (container: ShippingContainer) => void;
  allContainers: ShippingContainer[];
  onRefreshTelemetry: () => void;
  isRefreshing: boolean;
  alertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  searchQuery,
  setSearchQuery,
  onSelectContainerFromSearch,
  allContainers,
  onRefreshTelemetry,
  isRefreshing,
  alertCount
}) => {
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const { t, language, toggleLanguage } = useLanguage();

  const filteredSearchResults = searchQuery.trim() === "" ? [] : allContainers.filter(c => 
    c.containerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.billOfLading.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.vesselName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.cargoType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-surface/90 border-b border-line transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Ship className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  {t("brand.title")}
                </span>
                {/* 窄屏只保留烧瓶图标：演示口径由页面顶部 DemoDataBanner 完整承载，此处不重复占位 */}
                <span className="text-xs px-1.5 lg:px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 flex items-center gap-1 shrink-0">
                  <FlaskConical className="w-3 h-3" />
                  <span className="hidden lg:inline">{t("brand.live")}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                {t("brand.subtitle")}
              </p>
            </div>
          </div>

          {/* Quick Search Bar — 768px 以下会被挤到不可用宽度（390px 实测仅剩 58px），故窄屏隐藏；
              搜索能力在「集装箱」标签页仍完整可用。断点用 md：实测 640px 放行会溢出 61px。 */}
          <div className="relative flex-1 min-w-0 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 250)}
                placeholder={t("header.searchPlaceholder")}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {t("header.clear")}
                </button>
              )}
            </div>

            {/* Search Autocomplete Dropdown */}
            {showSearchDropdown && filteredSearchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-80 overflow-y-auto z-50 divide-y divide-slate-100 dark:divide-slate-700/60">
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                  {t("header.matching")} ({filteredSearchResults.length})
                </div>
                {filteredSearchResults.map((container) => (
                  <button
                    key={container.id}
                    onClick={() => {
                      onSelectContainerFromSearch(container);
                      setShowSearchDropdown(false);
                      setSearchQuery("");
                    }}
                    className="w-full px-3 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-start justify-between gap-2 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                          {container.containerNumber}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                          {container.poNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {container.vesselName} • {container.originPort.split(" ")[0]} ➔ {container.destinationPort.split(" ")[0]}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                        {container.cargoType} • Inv: {container.invoiceNumber}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        container.status === "TEMP_EXCURSION" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
                        container.status === "PORT_CONGESTION" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                        container.status === "CUSTOMS_HOLD" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" :
                        "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                      }`}>
                        {container.status.replace("_", " ")}
                      </span>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                        {container.telemetry.temperature}°C
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showSearchDropdown && searchQuery.trim() !== "" && filteredSearchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center text-sm text-slate-500 dark:text-slate-400 shadow-xl z-50">
                {t("header.noMatch")} "{searchQuery}". {t("header.trySearch")} <span className="font-mono font-bold text-blue-500">MSCU7849201</span> {language === "zh" ? "或" : "or"} <span className="font-mono font-bold text-blue-500">PO-99842</span>.
              </div>
            )}
          </div>

          {/* Action Buttons & Theme Toggle & Language Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleLanguage}
              title="Switch Language / 切换语言"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 dark:from-indigo-950/60 dark:to-blue-950/60 dark:hover:from-indigo-900/80 dark:hover:to-blue-900/80 text-indigo-700 dark:text-indigo-300 transition-all border border-indigo-200 dark:border-indigo-800 shrink-0 shadow-sm"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 animate-spin-slow" />
              <span className="hidden lg:inline">{t("header.langSwitch")}</span>
            </button>

            <button
              onClick={onRefreshTelemetry}
              disabled={isRefreshing}
              title="Refresh IoT Telemetry & GPS Satellites"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all border border-slate-200/80 dark:border-slate-700 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
              {/* 文案放行断点统一到 lg：768px 下三项文案同时显示会让按钮组涨到 305px，把行撑出 60px */}
              <span className="hidden lg:inline">{isRefreshing ? t("header.syncing") : t("header.sync")}</span>
            </button>

            <button
              onClick={() => setDarkMode(prev => !prev)}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all border border-slate-200/80 dark:border-slate-700"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-2.5 border-t border-slate-100 dark:border-slate-800/80 scrollbar-none">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "dashboard"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{t("tab.dashboard")}</span>
          </button>

          <button
            onClick={() => setActiveTab("live")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "live"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>{t("tab.live")}</span>
          </button>

          <button
            onClick={() => setActiveTab("containers")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "containers" || activeTab === "bulk_audit"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Box className="w-4 h-4" />
            <span>{t("tab.containers")} ({allContainers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("heatmap")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "heatmap"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Map className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>{t("tab.heatmap")}</span>
          </button>

          <button
            onClick={() => setActiveTab("alerts")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap relative ${
              activeTab === "alerts"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 animate-pulse" />
            <span>{t("tab.alerts")}</span>
            {alertCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-red-500 text-white font-bold ml-1 animate-bounce">
                {alertCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("architecture")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "architecture"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>{t("tab.architecture")}</span>
          </button>
        </div>

      </div>
    </header>
  );
};

