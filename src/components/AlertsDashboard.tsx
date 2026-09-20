/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  TrendingUp, 
  ShieldAlert, 
  Clock, 
  ChevronRight, 
  Filter, 
  Sparkles, 
  RefreshCw, 
  FileText, 
  Zap,
  Box
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { AlertNotification, ShippingContainer } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface AlertsDashboardProps {
  alerts: AlertNotification[];
  onAcknowledgeAlert: (alertId: string) => void;
  onSelectContainerByNumber: (containerNumber: string) => void;
  containers: ShippingContainer[];
}

export const AlertsDashboard: React.FC<AlertsDashboardProps> = ({
  alerts,
  onAcknowledgeAlert,
  onSelectContainerByNumber,
  containers
}) => {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity !== "ALL" && a.severity !== filterSeverity) return false;
    if (filterType !== "ALL" && a.type !== filterType) return false;
    return true;
  });

  const totalCostAtRisk = alerts.reduce((acc, a) => acc + (a.acknowledged ? 0 : a.estimatedCostImpactUsd), 0);
  const totalCostSaved = 284500; // Simulated historical savings

  const savingsChartData = [
    { month: isZh ? "4月" : "Apr", demurrageSaved: 38000, spoilageAvoided: 22000 },
    { month: isZh ? "5月" : "May", demurrageSaved: 54000, spoilageAvoided: 31000 },
    { month: isZh ? "6月" : "Jun", demurrageSaved: 49000, spoilageAvoided: 28000 },
    { month: isZh ? "7月" : "Jul", demurrageSaved: 62000, spoilageAvoided: 45000 },
    { month: isZh ? "8月" : "Aug", demurrageSaved: 68000, spoilageAvoided: 52000 },
    { month: isZh ? "9月" : "Sep", demurrageSaved: 74000, spoilageAvoided: 58000 },
  ];

  const translateAlertType = (type: string) => {
    if (!isZh) return type.replace("_", " ");
    if (type === "TEMPERATURE_EXCURSION") return "温度超限告警";
    if (type === "PORT_CONGESTION") return "港口拥堵延误";
    if (type === "CUSTOMS_HOLD") return "海关查验扣留";
    if (type === "LOW_BATTERY") return "设备低电量";
    return type.replace("_", " ");
  };

  const translateAlertMsg = (msg: string, id: string) => {
    if (!isZh) return msg;
    if (id === "alt-101" || msg.includes("Reefer temperature rose")) return "冷藏箱温度异常升至 -14.2°C (设定的目标阈值: -20.0°C)。高价值疫苗货物面临热失控变质风险。";
    if (id === "alt-102" || msg.includes("Red Sea convoy queue")) return "红海护航编队排队致使鹿特丹到港时间延误 72 小时。下游汽车制造流水线面临停工风险。";
    if (id === "alt-103" || msg.includes("Random US Customs CSI")) return "在巴拿马中转枢纽触发美国海关 CSI 随机非侵入式 X 射线安全查验扣留。";
    if (id === "alt-104" || msg.includes("IoT Telemetry sensor battery")) return "物联网 IoT 终端传感器电量降至 88%。太阳能自动充电板循环已开启。";
    return msg;
  };

  const translateAlertRec = (rec: string, id: string) => {
    if (!isZh) return rec;
    if (id === "alt-101" || rec.includes("Dispatch automated satellite command")) return "自动下发卫星远程指令重启 #2 号压缩机组，并通知目的港提前准备优先港区冷链驳接车。";
    if (id === "alt-102" || rec.includes("Switch final European leg")) return "将欧洲最后一段内河航运（莱茵河驳船）紧急更改为 Betuweroute 中欧快铁专列直达。";
    if (id === "alt-103" || rec.includes("Electronically transmit verified")) return "通过美国海关 CBP 自动化申报门户即时电子提交已核实鉴定的锂电池危险品 SDS 安全技术说明书。";
    if (id === "alt-104" || rec.includes("Monitor solar voltage gain")) return "在船舶跨越太平洋航行期间，持续监测白昼时段的太阳能充电电压增益。";
    return rec;
  };

  const translateTimestamp = (ts: string) => {
    if (!isZh) return ts;
    if (ts.includes("2 mins ago")) return "2 分钟前";
    if (ts.includes("18 mins ago")) return "18 分钟前";
    if (ts.includes("1 hour ago")) return "1 小时前";
    if (ts.includes("3 hours ago")) return "3 小时前";
    return ts;
  };

  return (
    <div className="space-y-8">
      
      {/* Top Banner: Financial Savings & AI Predictive Impact */}
      <div className="feature-panel accent-emerald p-6 sm:p-8 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              {isZh ? "智能预警与财务滞期费优化引擎" : "Automated Alerts & Financial Optimization Engine"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isZh ? "滞期费 (Demurrage) 与冷链货损风险管控台" : "Demurrage & Spoilage Prevention Dashboard"}
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            {isZh ? "演示叙述：IoT 异常遥测可在触及港口滞期费阈值或医药温度失控前触发多方预警；模型评估码头拥堵与海关查验排队时长，给出降本改道建议。" : "Demo narrative: IoT anomaly detection would trigger automated stakeholder notifications before demurrage thresholds or thermal degradation occur, with a model evaluating port congestion and customs holds to recommend cost-saving diversions."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 relative z-10 shrink-0">
          <div className="bg-slate-800/80 backdrop-blur p-4 rounded-2xl border border-emerald-500/40 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{isZh ? "过去6个月累计节省滞期费" : "Total D&D Savings (6m)"}</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono mt-0.5 block">
              ${(totalCostSaved / 1000).toFixed(1)}k USD
            </span>
            <span className="text-[10px] text-emerald-300 font-bold mt-1 block">
              {isZh ? "↑ 较人工调控提升 34%" : "↑ 34% vs Manual Routing"}
            </span>
          </div>

          <div className="bg-slate-800/80 backdrop-blur p-4 rounded-2xl border border-red-500/40 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{isZh ? "当前未处置风险曝露总额" : "Current Unmitigated Risk"}</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-red-400 font-mono mt-0.5 block">
              ${(totalCostAtRisk / 1000).toFixed(1)}k USD
            </span>
            <span className="text-[10px] text-red-300 font-bold mt-1 block">
              {alerts.filter(a => !a.acknowledged).length} {isZh ? "个待处置紧急工单" : "Active Action Items"}
            </span>
          </div>
        </div>
      </div>

      {/* Historical Savings Chart */}
      <div className="bg-white dark:bg-slate-800/90 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span>{isZh ? "AI 降本优化月度增速（美元累计节省）" : "AI Cost Optimization Velocity ($ USD Saved by Month)"}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isZh ? "累计避免滞港滞期罚金与高价值冷链生物医药温限货损额度统计。" : "Cumulative demurrage avoidance and cold-chain pharmaceutical spoilage prevention."}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> {isZh ? "滞港费与滞期费避免 (D&D Avoidance)" : "Demurrage & Detention Avoidance"}
            </span>
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> {isZh ? "医药/冷链果蔬货损避免 (Spoilage Avoided)" : "Pharma/Produce Spoilage Avoided"}
            </span>
          </div>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={savingsChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDemurrage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorSpoilage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} unit="$" tickFormatter={(val) => `${val/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                formatter={(val: any, name: any) => [`$${val.toLocaleString()}`, name === "demurrageSaved" ? (isZh ? "已省滞期费" : "Demurrage Saved") : (isZh ? "避免货损金额" : "Spoilage Avoided")]}
              />
              <Area type="monotone" dataKey="demurrageSaved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDemurrage)" />
              <Area type="monotone" dataKey="spoilageAvoided" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSpoilage)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 italic">
          {isZh
            ? "演示固定值：本图与上方 28.45 万美元节省额均为预设样例，并非由建议动作反算。滞期费敞口另有两套口径（AI 估计值 / 按状态固定值），详见页面顶部「数据说明」。行业参考区间：干箱 150–350、冷箱 400–850 美元/箱/天。"
            : "Fixed demo values: this chart and the US$284,500 saved above are preset samples, not back-calculated from the recommended actions. Demurrage exposure has two other bases (AI estimate / status-mapped constant) — see the Data provenance panel at the top. Industry reference bands: US$150–350 dry, US$400–850 reefer per container/day."}
        </p>
      </div>

      {/* Automated Alerts List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
              <span>{isZh ? `实时物联网 IoT 与物流异常监控流 (${filteredAlerts.length})` : `Active IoT & Logistics Anomaly Feed (${filteredAlerts.length})`}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isZh ? "立即进行人工介入或 AI 自动调度，以确保冷链货运 SLA 并消除巨额财务滞期损失风险。" : "Immediate intervention required to preserve cargo SLAs and mitigate financial exposure."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">{isZh ? "全部告警等级" : "All Severities"}</option>
              <option value="CRITICAL">{isZh ? "🚨 仅限紧急告警" : "🚨 Critical Only"}</option>
              <option value="WARNING">{isZh ? "⚠️ 重要警告" : "⚠️ Warnings"}</option>
              <option value="INFO">{isZh ? "ℹ️ 提示日志" : "ℹ️ Info Logs"}</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">{isZh ? "全部异常类型" : "All Anomaly Types"}</option>
              <option value="TEMPERATURE_EXCURSION">{isZh ? "🌡️ 温度超限" : "🌡️ Temp Excursion"}</option>
              <option value="PORT_CONGESTION">{isZh ? "⚓ 港口拥堵" : "⚓ Port Congestion"}</option>
              <option value="CUSTOMS_HOLD">{isZh ? "🛑 海关查验/扣留" : "🛑 Customs Hold"}</option>
              <option value="LOW_BATTERY">{isZh ? "🔋 低电量提醒" : "🔋 Low Battery"}</option>
            </select>
          </div>
        </div>

        {/* Alerts Cards */}
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const isCritical = alert.severity === "CRITICAL";
            const isAck = alert.acknowledged;
            const targetContainer = containers.find(c => c.containerNumber === alert.containerNumber);

            return (
              <div 
                key={alert.id}
                className={`p-6 rounded-3xl border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                  isAck ? "bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75" :
                  isCritical ? "bg-red-50/40 dark:bg-red-950/20 border-red-300 dark:border-red-900/60" :
                  "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60"
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    isCritical ? "bg-red-500 text-white shadow-lg shadow-red-500/30" :
                    alert.severity === "WARNING" ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" :
                    "bg-blue-500 text-white"
                  }`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isCritical ? "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300" :
                        alert.severity === "WARNING" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300" :
                        "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300"
                      }`}>
                        {translateAlertType(alert.type)}
                      </span>

                      <button
                        onClick={() => onSelectContainerByNumber(alert.containerNumber)}
                        className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <span>{alert.containerNumber}</span>
                        <span className="text-xs text-slate-500">({alert.poNumber})</span>
                      </button>

                      <span className="text-xs font-mono text-slate-400">• {translateTimestamp(alert.timestamp)}</span>

                      {isAck && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {isZh ? "已确认处置" : "Acknowledged"}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {translateAlertMsg(alert.message, alert.id)}
                    </p>

                    <div className="mt-3 bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{isZh ? "AI 推荐处置方案: " : "AI Recommended Remediation: "}</strong>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{translateAlertRec(alert.recommendedAction, alert.id)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right actions and cost impact */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{isZh ? "预计面临滞期费损耗" : "Financial Exposure at Risk"}</span>
                    <span className={`text-lg sm:text-xl font-extrabold font-mono ${alert.estimatedCostImpactUsd > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      ${alert.estimatedCostImpactUsd.toLocaleString()} USD
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {!isAck && (
                      <button
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isZh ? "确认并执行 AI 优化方案" : "Acknowledge & Execute AI Plan"}</span>
                      </button>
                    )}
                    <button
                      onClick={() => onSelectContainerByNumber(alert.containerNumber)}
                      className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1"
                    >
                      <span>{isZh ? "查看货柜详情" : "Inspect Container"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

