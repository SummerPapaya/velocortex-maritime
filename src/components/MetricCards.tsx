/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Box, TrendingUp, DollarSign, AlertTriangle, Leaf, Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import { StakeholderMetrics } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface MetricCardsProps {
  metrics: StakeholderMetrics;
  onOpenAlerts: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics, onOpenAlerts }) => {
  const { language } = useLanguage();
  const isZh = language === "zh";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Active Containers & Transit */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {isZh ? "海运在途箱数" : "Active in Transit"}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {metrics.activeInTransit.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              / {metrics.totalContainers.toLocaleString()} {isZh ? "总箱数" : "Total"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg w-fit border border-emerald-200/50 dark:border-emerald-800/40">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isZh ? "99.4% 卫星遥测在线率" : "99.4% Telemetry Uptime"}</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Box className="w-6 h-6" />
        </div>
      </div>

      {/* On-Time Performance & Avg Transit */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {isZh ? "准时到港率 (SLA)" : "On-Time Arrival Rate"}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {metrics.onTimePercentage}%
            </span>
            <span className="text-xs font-semibold text-emerald-500">
              {isZh ? "环比增加 +2.1%" : "+2.1% vs last mo."}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg w-fit border border-blue-200/50 dark:border-blue-800/40">
            <Clock className="w-3.5 h-3.5" />
            <span>{isZh ? `平均航程: ${metrics.avgTransitTimeDays} 天` : `Avg Transit: ${metrics.avgTransitTimeDays} Days`}</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      </div>

      {/* Demurrage & Detention Saved */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {isZh ? "AI规避滞港费与货损" : "Demurrage & Spoilage Saved"}
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              ${(metrics.demurrageSavedUsd / 1000).toFixed(1)}k
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {isZh ? "通过AI动态路径调整" : "via AI Re-routing"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg w-fit border border-indigo-200/50 dark:border-indigo-800/40">
            <DollarSign className="w-3.5 h-3.5" />
            <span>{isZh ? "Gemini AI 智能降本盈益" : "Gemini AI Predictive Gain"}</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <DollarSign className="w-6 h-6" />
        </div>
      </div>

      {/* Critical Alerts & Telemetry Anomalies */}
      <div 
        onClick={onOpenAlerts}
        className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-red-200 dark:border-red-900/60 shadow-sm hover:shadow-md transition-all flex items-start justify-between cursor-pointer group hover:bg-red-50/30 dark:hover:bg-red-950/20"
      >
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
              {isZh ? "重要在途告警数" : "Critical IoT Alerts"}
            </span>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400 tracking-tight">
              {metrics.criticalAlerts} {isZh ? "处需处置" : "Active"}
            </span>
            <span className="text-xs font-semibold text-slate-400 group-hover:text-red-500 transition-colors">
              {isZh ? "点击处理 ➔" : "Click to view ➔"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/60 px-2.5 py-1 rounded-lg w-fit border border-red-300 dark:border-red-800/50">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isZh ? "1项温度超限警告 (MSCU...)" : "1 Temp Excursion (MSCU...)"}</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
        </div>
      </div>

    </div>
  );
};
