/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "zh";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language | ((prev: Language) => Language)) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Brand & Header
  "brand.title": { en: "VeloCortex", zh: "VeloCortex 智联物控" },
  "brand.subtitle": { en: "Global Cargo & Container Telemetry Command Center", zh: "全球集装箱物联网实时监控与智慧供应链调度中心" },
  "brand.live": { en: "IoT Live", zh: "IoT 实时连接" },
  "header.searchPlaceholder": { en: "Search Container # (MSCU78...), PO, Invoice, BOL, Vessel...", zh: "输入集装箱号 (MSCU78...)、PO订单、发票号、提单或船名搜索..." },
  "header.sync": { en: "Sync Telemetry", zh: "同步卫星数据" },
  "header.syncing": { en: "Syncing...", zh: "同步中..." },
  "header.clear": { en: "Clear", zh: "清除" },
  "header.matching": { en: "Matching Containers & Shipments", zh: "符合条件的货物与集装箱" },
  "header.noMatch": { en: "No containers found matching", zh: "未找到符合的集装箱：" },
  "header.trySearch": { en: "Try searching for", zh: "尝试搜索" },
  "header.langSwitch": { en: "🇨🇳 简体中文", zh: "🇺🇸 English" },

  // Navigation Tabs
  "tab.dashboard": { en: "Command Center", zh: "控制台总览" },
  "tab.containers": { en: "Track & Trace", zh: "货物追踪与批量查验" },
  "tab.heatmap": { en: "Route Heatmap & Bottlenecks", zh: "航线热力图与港口拥堵分析" },
  "tab.alerts": { en: "Automated Alerts & AI Savings", zh: "智能预警与滞期费开销控制" },
  "tab.architecture": { en: "Architecture & Security Specs", zh: "系统架构与数据安全规格" },

  // Track & Trace Sub-tabs
  "trace.subtab.list": { en: "📦 Individual & Filtered Tracking", zh: "📦 逐票货物与筛选清单" },
  "trace.subtab.bulk": { en: "📋 Massive Bulk Lookup & Audit", zh: "📋 批量单号查询与里程碑审计" },

  // Bulk Lookup & Audit
  "bulk.badge": { en: "Enterprise Mass Lookup Engine", zh: "企业级批量查询与协同引擎" },
  "bulk.realtime": { en: "Real-Time EDI & AIS Satellite Resolution", zh: "实时EDI与AIS北斗/海事卫星追踪" },
  "bulk.title": { en: "Bulk Identifier Lookup & Milestone Audit", zh: "海运批量查验与全链路里程碑审计" },
  "bulk.desc": { 
    en: "Paste or drag-and-drop a massive list of Container Numbers, Purchase Orders (POs), Invoices, or Bills of Lading. Our AI correlation engine instantly matches live IoT telemetry, identifies container owners by prefix, projects accurate ETAs, and calculates demurrage risk across all carriers.", 
    zh: "在下方粘贴或拖入大批量集装箱号、PO采购订单号、发票号或提单编号。AI关联引擎将瞬间同步实时IoT温度与经纬度，根据箱号前缀智能识别箱主/租赁公司，精确演算到港ETA，并全盘评估滞期费风险。" 
  },
  "bulk.loadSample": { en: "Load Sample Batch (12 IDs)", zh: "加载演示案例 (12单批量)" },
  "bulk.exportCsv": { en: "Export Manifest (CSV)", zh: "导出完整数据 (CSV格式)" },
  "bulk.exportExcel": { en: "Download Report (Excel Ready)", zh: "下载详细报表 (Excel表格)" },
  "bulk.exportCombined": { en: "Export Report", zh: "导出数据报表" },
  "bulk.exportOptionCsv": { en: "CSV (.csv) - Comma Separated", zh: "CSV (.csv) - 逗号分隔格式" },
  "bulk.exportOptionExcel": { en: "Excel (.xlsx) - Spreadsheet", zh: "Excel (.xlsx) - 标准表格格式" },

  // Container List & CRUD Actions
  "list.addBtn": { en: "+ Add Tracking Container", zh: "+ 添加追踪箱号" },
  "list.resetBtn": { en: "Reset Default (5)", zh: "恢复默认 (5单)" },
  "list.editTitle": { en: "Edit Live Container Record", zh: "编辑集装箱实时监控档案" },
  "list.addTitle": { en: "Create New Container Tracking Record", zh: "创建新集装箱监控档案" },
  "list.saveBtn": { en: "Save Container Changes", zh: "保存修改" },
  "list.createBtn": { en: "Create & Track Container", zh: "创建并开启追踪" },
  "list.deleteBtn": { en: "Remove Container", zh: "移除集装箱" },
  "list.confirmDelete": { en: "Are you sure you want to remove this container from live tracking?", zh: "确定要从实时监控大屏中删除此集装箱吗？" },

  "bulk.inputLabel": { en: "Input Identifier Manifest (Comma, Space, or Newline)", zh: "输入查询清单 (支持逗号、空格或换行分隔)" },
  "bulk.inputSupport": { en: "Supports PO#, Inv#, Container#, BOL#", zh: "支持混合输入: 订单号/发票号/箱号/提单号" },
  "bulk.placeholder": { 
    en: "Paste list of container IDs, PO numbers, or invoices here...\ne.g. MSCU7849201, PO-99842, TGHU-8821943, INV-2026-8812, CSQU-3049182, NYKU-4401923...", 
    zh: "在此粘贴或输入需要批量查询的单号...\n例如: MSCU7849201, PO-99842, TGHU-8821943, INV-2026-8812, CSQU-3049182, NYKU-4401923..." 
  },
  "bulk.dropzone": { en: "Drop CSV / Excel manifest here or Click to attach +3 IDs", zh: "拖曳文件至此处或点击追加 +3 组演示单号" },
  "bulk.scanning": { en: "Scanning AIS & EDI...", zh: "正在连接全球EDI港口及卫星数据..." },
  "bulk.execute": { en: "Execute Massive Audit", zh: "立即执行批量审计" },

  // Bulk Stats & AI
  "bulk.stats.summary": { en: "Audit Batch Telemetry Summary", zh: "批量审计实时数据概览" },
  "bulk.stats.audited": { en: "Items Audited", zh: "票单号已查询" },
  "bulk.stats.alerts": { en: "Critical Alerts Found", zh: "发现异常在途告警" },
  "bulk.stats.shipments": { en: "Shipments", zh: "票异常" },
  "bulk.stats.attention": { en: "Requires immediate attention", zh: "建议立即干预处置" },
  "bulk.stats.demurrage": { en: "Demurrage Risk Exposure", zh: "预估港口滞期费风险" },
  "bulk.stats.shield": { en: "▲ AI Demurrage Shield Active", zh: "▲ AI智能避险策略已启动" },
  "bulk.ai.title": { en: "Gemini Audit Synthesis Report:", zh: "Gemini AI 综合诊断与调度报告:" },
  "bulk.ai.nominal": { en: "All audited identifiers show nominal telemetry and schedule compliance. Zero intermodal bottlenecks identified across your uploaded manifest.", zh: "所核验的批量单号运行指标全部正常，船期与温度遥测数据均在安全范围内，未发现多式联运瓶颈或滞港风险。" },
  "bulk.ai.anomalies": { en: "Audited batch detected", zh: "本次查验共识别出" },
  "bulk.ai.anomalies2": { en: "anomalies (thermal variance and terminal berth queueing). Our automated dispatch has pre-notified carrier engineering teams and reserved alternate rail chassis at", zh: "处重要异常 (包括冷链温漂与港口泊位拥堵)。AI自动化系统已向船东轮机长发函修正，并于" },
  "bulk.ai.anomalies3": { en: "to mitigate $42,000 in potential demurrage.", zh: "预留了替代车架，成功规避约 42,000 美元滞港罚金。" },
  "bulk.avgProgress": { en: "Average Transit Progress:", zh: "批量平均航程进度:" },
  "bulk.aisConfidence": { en: "AIS Satellite Confidence:", zh: "AIS卫星信号置信度:" },

  // Table Headers
  "table.title": { en: "Real-Time Audit Results & Milestone Timelines", zh: "实时查询结果与里程碑追踪时间轴" },
  "table.subtitle": { en: "Click any shipment row to expand its real-time 5-stage checkpoint milestone timeline and AI Demurrage Advisory.", zh: "点击任意一行即可展开查看该集装箱的 5 阶段物流里程碑时间轴及 AI 智能避险建议。" },
  "table.filter.all": { en: "All Audited", zh: "全部单号" },
  "table.filter.alerts": { en: "Alerts", zh: "异常告警" },
  "table.filter.intransit": { en: "In Transit", zh: "海运在途" },
  "table.filter.delivered": { en: "Delivered", zh: "已抵港签收" },

  // Columns & Row labels
  "col.container": { en: "Container #", zh: "集装箱号" },
  "col.owner": { en: "Container Owner / Lessor", zh: "箱主 / 租赁公司" },
  "col.vessel": { en: "Vessel & Carrier", zh: "承运船公司 & 航次" },
  "col.route": { en: "Route & ETA", zh: "航线与预计到港 (ETA)" },
  "col.eta": { en: "ETA:", zh: "预计到港:" },
  "col.status": { en: "Status & Telemetry", zh: "实时状态与环境监测" },
  "col.progress": { en: "Progress", zh: "进度" },
  "row.stage": { en: "Stage", zh: "阶段" },
  "row.viewTrace": { en: "View Full Trace & Live Map", zh: "查看全景地图与温度曲线" },
  "row.demurrageRisk": { en: "Demurrage Risk Exposure:", zh: "预计滞港滞期风险金额:" },

  // Dashboard & Common
  "common.export": { en: "Export Manifest", zh: "导出清单" },
  "common.download": { en: "Download Report", zh: "下载报表" }
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("en");

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "zh" : "en"));
  };

  const t = (key: string): string => {
    const item = translations[key];
    if (!item) return key;
    return item[language] || item.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
