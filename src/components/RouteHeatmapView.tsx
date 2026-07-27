/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Map, 
  AlertTriangle, 
  TrendingUp, 
  Anchor, 
  Navigation, 
  Sparkles, 
  RefreshCw, 
  Clock, 
  Compass, 
  ChevronRight,
  ShieldAlert,
  Activity,
  BarChart2
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { TradeRoute } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface RouteHeatmapViewProps {
  routes: TradeRoute[];
  onSelectRouteForMap: (routeId: string) => void;
}

export const RouteHeatmapView: React.FC<RouteHeatmapViewProps> = ({
  routes,
  onSelectRouteForMap
}) => {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const [analyzingRouteId, setAnalyzingRouteId] = useState<string | null>(null);
  const [aiAdvisories, setAiAdvisories] = useState<Record<string, any>>({
    "asia_europe": {
      routeHealthScore: 64,
      dominantBottleneck: isZh ? "红海曼德海峡护航编队排队与苏伊士运河通航时段管控" : "Red Sea Bab el-Mandeb Navigational Convoy Queue & Suez Slot Metering",
      averageDelayHours: 72,
      recommendedAction: isZh ? "将紧急货物（如AI算力服务器与高价值生物医药）从中海转运枢纽改道至阿尔赫西拉斯或鹿特丹转乘中欧快铁，可挽回 3 天在途时滞。" : "Reroute urgent cargo (like GPU servers and pharmaceuticals) from Mediterranean hubs to express freight rail at Algeciras or Rotterdam to recover 3 days of transit delay.",
      keyInsight: isZh ? "当前航道密度为 62 艘船舶。安保护航间距要求导致通航吞吐量下降 28%。预计北欧目的港将面临底盘车架短缺挑战。" : "Traffic density is 62 vessels. Security convoy spacing has reduced throughput by 28%. Expect container chassis shortages at Northern European discharge ports."
    },
    "trans_pacific": {
      routeHealthScore: 78,
      dominantBottleneck: isZh ? "洛杉矶港 USLAX Pier 400 码头泊位积压与多式联运底盘车短缺" : "USLAX Pier 400 Berth Backlog & Intermodal Chassis Shortage",
      averageDelayHours: 36,
      recommendedAction: isZh ? "指示承运人将美西卸货目的地改转至太平洋西北港口（塔科马 / 鲁珀特王子港），以便更快通过铁海联运转运至美国中西部。" : "Instruct carriers to divert West Coast container drops to Pacific Northwest (Tacoma / Prince Rupert) for faster rail connection into US Midwest.",
      keyInsight: isZh ? "当前 48 艘船舶在途。受季节性进口激增影响，洛杉矶港平均靠泊等待时间已增至 1.8 天。" : "48 vessels active. Berth waiting time at Los Angeles has increased to 1.8 days due to seasonal import surge."
    }
  });

  const handleRunRouteAnalysis = async (route: TradeRoute) => {
    setAnalyzingRouteId(route.id);
    try {
      const response = await fetch("/api/ai/analyze-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeName: route.name,
          originPort: route.originRegion,
          destPort: route.destRegion,
          activeVessels: route.activeVessels,
          reportedDelays: route.averageDelayDays
        })
      });
      const data = await response.json();
      if (data && data.success && data.analysis) {
        setAiAdvisories(prev => ({
          ...prev,
          [route.id]: data.analysis
        }));
      }
    } catch (error) {
      console.error("Route AI Error:", error);
    } finally {
      setAnalyzingRouteId(null);
    }
  };

  const translateRouteName = (name: string, id: string) => {
    if (!isZh) return name;
    if (id === "trans_pacific") return "跨太平洋东向海运走廊";
    if (id === "asia_europe") return "亚欧海路 (经曼德海峡/苏伊士)";
    if (id === "trans_atlantic") return "大西洋西向快航";
    if (id === "panama_canal") return "亚洲-美东/美湾 (经巴拿马运河)";
    if (id === "intra_asia") return "亚洲区域内穿梭快线";
    return name;
  };

  const translateRegion = (text: string) => {
    if (!isZh) return text;
    if (text.includes("East Asia (Shanghai")) return "东亚 (上海 / 宁波 / 釜山)";
    if (text.includes("North America West Coast")) return "北美西海岸 (洛杉矶 / 长滩 / 西雅图)";
    if (text.includes("East & South Asia")) return "东亚与南亚";
    if (text.includes("Northern Europe (Rotterdam")) return "北欧 (鹿特丹 / 汉堡 / 安特卫普)";
    if (text.includes("Northern Europe (Hamburg")) return "北欧 (汉堡 / 不来梅哈芬)";
    if (text.includes("North America East Coast")) return "北美东海岸 (纽约 / 萨凡纳)";
    if (text.includes("East Asia / Southeast Asia")) return "东亚 / 东南亚";
    if (text.includes("US Gulf & South Atlantic")) return "美湾与南大西洋 (萨凡纳 / 休斯敦)";
    if (text.includes("Korea / Japan")) return "韩国 / 日本";
    if (text.includes("Eastern & Southern China")) return "中国华东与华南";
    return text;
  };

  const translateWeather = (text: string) => {
    if (!isZh) return text;
    if (text.includes("Moderate seasonal Pacific swell")) return "国际日期变更线附近受季节性太平洋海浪中度影响";
    if (text.includes("Extreme heat affecting reefer")) return "红海极端高温影响冷藏集装箱制冷系统运行效率";
    if (text.includes("Favorable summer North Atlantic")) return "北大西洋夏季高压天气窗口良好";
    if (text.includes("Water level draft restrictions")) return "加通湖吃水深度限制，重载大型船舶载重量受限";
    if (text.includes("Clear weather across Yellow Sea")) return "黄海与东海海域海况良好、气象晴朗";
    return text;
  };

  const translateBottleneck = (text: string) => {
    if (!isZh) return text;
    if (text.includes("Terminal chassis shortage")) return "洛杉矶/长滩港出现码头底盘车架短缺及铁路转运积压。";
    if (text.includes("Security convoys in Bab el-Mandeb")) return "曼德海峡安保护航编队等待，及苏伊士运河入口分时段通航管控。";
    if (text.includes("Minimal friction")) return "通关与作业顺畅；常规季节性闸口吞吐效率正常。";
    if (text.includes("Canal Authority daily booking")) return "运河管理局每日预订配额限制，以及海关 CSI 扫描排队。";
    if (text.includes("High vessel frequency")) return "航班频次高，确保集装箱到港后无需排队即刻靠泊周转。";
    return text;
  };

  const chartData = routes.map(r => ({
    name: isZh ? (
      r.id === "trans_pacific" ? "跨太平洋航线" :
      r.id === "asia_europe" ? "亚欧海路" :
      r.id === "trans_atlantic" ? "大西洋快航" :
      r.id === "panama_canal" ? "巴拿马航线" : "亚洲快线"
    ) : r.name.split(" ")[0] + " " + (r.name.split(" ")[1] || ""),
    delayDays: r.averageDelayDays,
    vessels: r.activeVessels,
    congestion: r.congestionLevel
  }));

  return (
    <div className="space-y-8">
      
      {/* Header Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-2xl relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              {isZh ? "全球供应链热力图与港口拥堵监测中心" : "Global Supply Chain Heatmap & Bottleneck Monitor"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isZh ? "主要海运走廊与多式联运通道拥堵深度分析" : "Major Trade Route Congestion Analysis"}
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            {isZh ? "实时监测全球各大海事通道的船舶航行密度、码头靠泊平均排队时效及地缘政治摩擦风险。借助 Gemini AI 预测下游滞退时效，并智能推荐跨大洲多式联运替代分流路线。" : "Monitor real-time vessel density, average port dwell times, and geopolitical friction across primary oceanic logistics corridors. Leverage Gemini AI to predict downstream delays and recommend intermodal diversions."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 relative z-10 shrink-0">
          <div className="bg-slate-800/80 backdrop-blur p-4 rounded-2xl border border-slate-700 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{isZh ? "在途船舶总数" : "Total Active Vessels"}</span>
            <span className="text-2xl font-extrabold text-blue-400 font-mono mt-0.5 block">
              {routes.reduce((acc, r) => acc + r.activeVessels, 0)}
            </span>
          </div>

          <div className="bg-slate-800/80 backdrop-blur p-4 rounded-2xl border border-slate-700 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{isZh ? "最高航线延迟" : "Max Corridor Delay"}</span>
            <span className="text-2xl font-extrabold text-red-400 font-mono mt-0.5 block">
              {isZh ? "4.5 天" : "4.5 Days"}
            </span>
          </div>
        </div>
      </div>

      {/* Delay Bar Chart Section */}
      <div className="bg-white dark:bg-slate-800/90 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-500" />
              <span>{isZh ? "全球主要海运航线平均通过时滞（天数）" : "Average Transit Delay by Global Corridor (Days)"}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isZh ? "全球主要跨洲际海运走廊当前通道瓶颈及拥堵严重程度对比视图。" : "Comparative view of current bottleneck severity across major intercontinental routes."}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {isZh ? "畅通 / 极低延迟" : "Optimal / Minimal Delay"}
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> {isZh ? "轻度拥堵 / 中等延迟" : "Moderate Delay"}
            </span>
            <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> {isZh ? "严重拥堵 / 积压警戒" : "Critical Backlog"}
            </span>
          </div>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} unit={isZh ? "天" : "d"} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                formatter={(val: any, name: any) => [
                  name === "delayDays" ? `${val} ${isZh ? "天延迟" : "Days Delay"}` : `${val} ${isZh ? "艘船舶" : "Vessels"}`, 
                  name === "delayDays" ? (isZh ? "平均延迟" : "Avg Delay") : (isZh ? "在途船舶" : "Active Vessels")
                ]}
              />
              <Bar dataKey="delayDays" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => {
                  const color = entry.congestion === "CRITICAL" ? "#ef4444" :
                                entry.congestion === "SEVERE" ? "#f97316" :
                                entry.congestion === "MODERATE" ? "#eab308" : "#10b981";
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {routes.map((route) => {
          const isCritical = route.congestionLevel === "CRITICAL" || route.congestionLevel === "SEVERE";
          const advisory = aiAdvisories[route.id];
          const isAnalyzing = analyzingRouteId === route.id;

          return (
            <div 
              key={route.id}
              className={`bg-white dark:bg-slate-800/90 rounded-3xl p-6 border transition-all shadow-sm hover:shadow-xl flex flex-col justify-between ${
                isCritical ? "border-red-300 dark:border-red-900/60" : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <div>
                {/* Route Name & Congestion Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{translateRouteName(route.name, route.id)}</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {translateRegion(route.originRegion)} ➔ {translateRegion(route.destRegion)}
                    </p>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shrink-0 flex items-center gap-1.5 ${
                    route.congestionLevel === "CRITICAL" ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800" :
                    route.congestionLevel === "SEVERE" ? "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300 dark:border-orange-800" :
                    route.congestionLevel === "MODERATE" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800" :
                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isCritical ? "bg-red-500 animate-ping" : "bg-emerald-500"}`} />
                    <span>{isZh ? (
                      route.congestionLevel === "CRITICAL" ? "严重拥堵" :
                      route.congestionLevel === "SEVERE" ? "重度延迟" :
                      route.congestionLevel === "MODERATE" ? "中度拥堵" : "畅通无阻"
                    ) : route.congestionLevel}</span>
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs mb-4 font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">{isZh ? "在途船舶" : "Active Vessels"}</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{route.activeVessels}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">{isZh ? "平均时滞" : "Avg Delay"}</span>
                    <span className={`font-bold text-sm ${route.averageDelayDays > 2 ? "text-red-500" : "text-emerald-500"}`}>
                      +{route.averageDelayDays} {isZh ? "天" : "Days"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">{isZh ? "通道热度" : "Heat Density"}</span>
                    <span className="font-bold text-blue-500 text-sm">{(route.heatIntensity * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* Bottleneck & Weather Box */}
                <div className="space-y-2 mb-5">
                  <div className="bg-red-50/50 dark:bg-red-950/20 p-3 rounded-xl border border-red-200/60 dark:border-red-900/40 text-xs text-red-900 dark:text-red-200 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-red-800 dark:text-red-300">{isZh ? "主要拥堵成因:" : "Dominant Bottleneck Cause:"}</strong>
                      <span>{translateBottleneck(route.bottleneckReason)}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 dark:bg-slate-800/50 p-3 rounded-xl border border-blue-200/60 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
                    <Compass className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-slate-900 dark:text-white">{isZh ? "海事气象与航行预报:" : "Weather & Navigational Outlook:"}</strong>
                      <span>{translateWeather(route.weatherRisk)}</span>
                    </div>
                  </div>
                </div>

                {/* AI Advisory Box */}
                {advisory ? (
                  <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-4 rounded-2xl border border-indigo-500/30 mb-4 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                        <span>{isZh ? "Gemini AI 智能排障与改道建议" : "Gemini AI Routing Advisory"}</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                        {isZh ? "通道健康分:" : "Health Score:"} {advisory.routeHealthScore}/100
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      💡 <strong>{isZh ? "智能优化建议:" : "Recommended Action:"}</strong> {advisory.recommendedAction}
                    </p>
                    <p className="text-[11px] text-indigo-200/80 mt-2 pt-2 border-t border-indigo-500/20">
                      📊 <em>{advisory.keyInsight}</em>
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                <button
                  onClick={() => onSelectRouteForMap(route.id)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>{isZh ? "在全球海图上高亮定位" : "Highlight on Global Map"}</span>
                </button>

                <button
                  onClick={() => handleRunRouteAnalysis(route)}
                  disabled={isAnalyzing}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                  <span>{isAnalyzing ? (isZh ? "AI正在诊断..." : "Analyzing...") : (isZh ? "刷新 AI 诊断评估" : "Refresh AI Advisory")}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

