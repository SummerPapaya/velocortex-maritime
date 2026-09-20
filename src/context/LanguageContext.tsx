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
  "brand.subtitle": { en: "Global Cargo & Container Telemetry Command Center (Demo Build)", zh: "全球集装箱物联网监控与智慧供应链调度（演示构建）" },
  "brand.live": { en: "Demo Dataset", zh: "演示数据集" },
  "header.searchPlaceholder": { en: "Search Container # (MSCU78...), PO, Invoice, BOL, Vessel...", zh: "输入集装箱号 (MSCU78...)、PO订单、发票号、提单或船名搜索..." },
  "header.sync": { en: "Sync Demo Data", zh: "同步演示数据" },
  "header.syncing": { en: "Re-rolling...", zh: "重算中..." },
  "header.clear": { en: "Clear", zh: "清除" },
  "header.matching": { en: "Matching Containers & Shipments", zh: "符合条件的货物与集装箱" },
  "header.noMatch": { en: "No containers found matching", zh: "未找到符合的集装箱：" },
  "header.trySearch": { en: "Try searching for", zh: "尝试搜索" },
  "header.langSwitch": { en: "🇨🇳 简体中文", zh: "🇺🇸 English" },

  // Navigation Tabs
  "tab.dashboard": { en: "Command Center", zh: "控制台总览" },
  "tab.live": { en: "Live Data", zh: "实时数据" },
  "tab.containers": { en: "Track & Trace", zh: "货物追踪与批量查验" },
  "tab.heatmap": { en: "Route Heatmap & Bottlenecks", zh: "航线热力图与港口拥堵分析" },
  "tab.alerts": { en: "Alerts & AI Savings", zh: "智能预警与滞期费开销控制" },
  "tab.architecture": { en: "Architecture & Security Specs", zh: "系统架构与数据安全规格" },

  // Track & Trace Sub-tabs
  "trace.subtab.list": { en: "📦 Individual & Filtered Tracking", zh: "📦 逐票货物与筛选清单" },
  "trace.subtab.bulk": { en: "📋 Massive Bulk Lookup & Audit", zh: "📋 批量单号查询与里程碑审计" },

  // Bulk Lookup & Audit
  "bulk.badge": { en: "Enterprise Mass Lookup Engine", zh: "企业级批量查询与协同引擎" },
  "bulk.realtime": { en: "Sample EDI & AIS Resolution Workflow", zh: "演示：EDI 与 AIS 解析流程" },
  "bulk.title": { en: "Bulk Identifier Lookup & Milestone Audit", zh: "海运批量查验与全链路里程碑审计" },
  "bulk.desc": { 
    en: "Paste or drag-and-drop a massive list of Container Numbers, Purchase Orders (POs), Invoices, or Bills of Lading. The correlation engine matches them against the built-in demo dataset, identifies container owners by prefix, projects sample ETAs, and calculates demurrage risk across all carriers.", 
    zh: "在下方粘贴或拖入大批量集装箱号、PO采购订单号、发票号或提单编号。关联引擎将在内置演示数据集中匹配，根据箱号前缀识别箱主/租赁公司，演算样例到港 ETA，并评估滞期费风险。" 
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
  "list.editTitle": { en: "Edit Container Record", zh: "编辑集装箱档案" },
  "list.addTitle": { en: "Create New Container Tracking Record", zh: "创建新集装箱监控档案" },
  "list.saveBtn": { en: "Save Container Changes", zh: "保存修改" },
  "list.createBtn": { en: "Create & Track Container", zh: "创建并开启追踪" },
  "list.deleteBtn": { en: "Remove Container", zh: "移除集装箱" },
  "list.confirmDelete": { en: "Are you sure you want to remove this container from the demo dashboard?", zh: "确定要从演示大屏中删除此集装箱吗？" },

  "bulk.inputLabel": { en: "Input Identifier Manifest (Comma, Space, or Newline)", zh: "输入查询清单 (支持逗号、空格或换行分隔)" },
  "bulk.inputSupport": { en: "Supports PO#, Inv#, Container#, BOL#", zh: "支持混合输入: 订单号/发票号/箱号/提单号" },
  "bulk.placeholder": { 
    en: "Paste list of container IDs, PO numbers, or invoices here...\ne.g. MSCU7849201, PO-99842, TGHU-8821943, INV-2026-8812, CSQU-3049182, NYKU-4401923...", 
    zh: "在此粘贴或输入需要批量查询的单号...\n例如: MSCU7849201, PO-99842, TGHU-8821943, INV-2026-8812, CSQU-3049182, NYKU-4401923..." 
  },
  "bulk.dropzone": { en: "Drop CSV / Excel manifest here or Click to attach +3 IDs", zh: "拖曳文件至此处或点击追加 +3 组演示单号" },
  "bulk.scanning": { en: "Scanning sample manifest...", zh: "正在解析演示清单…" },
  "bulk.execute": { en: "Execute Massive Audit", zh: "立即执行批量审计" },

  // Bulk Stats & AI
  "bulk.stats.summary": { en: "Audit Batch Sample Summary", zh: "批量审计数据概览（样例）" },
  "bulk.stats.audited": { en: "Items Audited", zh: "票单号已查询" },
  "bulk.stats.alerts": { en: "Critical Alerts Found", zh: "发现异常在途告警" },
  "bulk.stats.shipments": { en: "Shipments", zh: "票异常" },
  "bulk.stats.attention": { en: "Requires immediate attention", zh: "建议立即干预处置" },
  "bulk.stats.demurrage": { en: "Demurrage Risk Exposure", zh: "预估港口滞期费风险" },
  "bulk.stats.shield": { en: "▲ AI Demurrage Shield Active", zh: "▲ AI智能避险策略已启动" },
  "bulk.ai.title": { en: "Gemini-Style Audit Synthesis (sample):", zh: "Gemini 风格综合诊断报告（样例）:" },
  "bulk.ai.nominal": { en: "All audited identifiers show nominal telemetry and schedule compliance. Zero intermodal bottlenecks identified across your uploaded manifest. (Sample text — no model call was made.)", zh: "所核验的批量单号运行指标全部正常，船期与温度遥测数据均在安全范围内，未发现多式联运瓶颈或滞港风险。（样例文案，未调用任何在线模型）" },
  "bulk.ai.anomalies": { en: "Audited batch detected", zh: "本次查验共识别出" },
  "bulk.ai.anomalies2": { en: "anomalies (thermal variance and terminal berth queueing). Our automated dispatch has pre-notified carrier engineering teams and reserved alternate rail chassis at", zh: "处重要异常 (包括冷链温漂与港口泊位拥堵)。自动化流程已向船东轮机长发函修正，并于" },
  "bulk.ai.anomalies3": { en: "to mitigate $42,000 in potential demurrage. (Sample narrative.)", zh: "预留了替代车架，预估规避约 42,000 美元滞港罚金。（样例叙述）" },
  "bulk.avgProgress": { en: "Average Transit Progress:", zh: "批量平均航程进度:" },
  "bulk.aisConfidence": { en: "Manifest Match Confidence:", zh: "清单匹配置信度:" },

  // Table Headers
  "table.title": { en: "Sample Audit Results & Milestone Timelines", zh: "样例查询结果与里程碑追踪时间轴" },
  "table.subtitle": { en: "Click any shipment row to expand its 5-stage checkpoint milestone timeline and AI Demurrage Advisory (sample output).", zh: "点击任意一行即可展开查看该集装箱的 5 阶段物流里程碑时间轴及 AI 智能避险建议（样例输出）。" },
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
  "col.status": { en: "Status & Environment (sample)", zh: "状态与环境监测（样例）" },
  "col.progress": { en: "Progress", zh: "进度" },
  "row.stage": { en: "Stage", zh: "阶段" },
  "row.viewTrace": { en: "View Full Trace & Map", zh: "查看全景地图与温度曲线" },
  "row.demurrageRisk": { en: "Demurrage Risk Exposure:", zh: "预计滞港滞期风险金额:" },

  // Demo-data provenance disclosure (see src/data/demoMeta.ts)
  "demo.bannerTitle": { en: "Demo dataset — not live IoT telemetry", zh: "演示数据集 —— 非实时 IoT 遥测" },
  "demo.bannerBody": {
    en: "Container, vessel, milestone and temperature figures below are frozen build-time samples, not connected to any carrier EDI, IoT gateway or AIS feed. Interactive actions re-roll the sample values.",
    zh: "以下集装箱、船舶、里程碑与温度数值均为构建期固化的样例数据，未接入任何船司 EDI、IoT 网关或 AIS 数据源；交互操作只是重新演算样例数值。",
  },
  "demo.baseline": { en: "Data baseline", zh: "数据基准" },
  "demo.bannerLive": {
    en: "All three panels on the Live Data tab are real: Open-Meteo port weather, IMF PortWatch transit volumes, and an open AIS vessel feed — free, key-less, browser-direct.",
    zh: "「实时数据」标签页的三块面板为真实实时数据：Open-Meteo 港口气象、IMF PortWatch 咽喉点过境量、开放 AIS 船位 —— 均免费、免密钥、浏览器可直连。",
  },
  "demo.bannerLiveShort": {
    en: "3 live feeds on the Live Data tab.",
    zh: "「实时数据」标签页有 3 路真实数据。",
  },
  "demo.bannerMore": { en: "Data provenance", zh: "数据说明" },
  "demo.bannerLess": { en: "Collapse", zh: "收起" },
  "demo.bannerFinTitle": { en: "How the money figures are derived", zh: "财务口径说明" },
  "demo.bannerFinBody": {
    en: "Demurrage exposure is either an AI estimate (the prompt supplies no price benchmark, so it drifts between calls) or a status-mapped constant — US$18,500 for port congestion, US$34,200 for a cold-chain excursion, US$0 within standard tolerance. The US$284,500 saved and the six-month trend are fixed demo values, not back-calculated from the recommended actions; a production build needs carrier demurrage invoices and insurance claims.",
    zh: "滞期费敞口取 AI 估计值（提示词未提供价格基准，逐次调用会漂移），或按状态映射的固定值 —— 港口拥堵 18,500 美元、冷链超限 34,200 美元、正常在途 0 美元。首页 28.45 万节省额与 6 个月趋势为演示固定值，并非由建议动作反算得出；生产环境需对接船司滞期费账单与保险理赔数据。",
  },
  "demo.bannerFinRange": {
    en: "Industry reference bands (not the source of these figures): dry detention US$150–350/container/day after free time; reefer terminal power & monitoring US$400–850/container/day; biopharma batch discard US$14,500–34,200.",
    zh: "行业参考区间（非本演示数据来源）：免箱期后干箱滞箱费 150–350 美元/箱/天；冷箱码头电力与监控 400–850 美元/箱/天；生物医药批次判废 14,500–34,200 美元。",
  },

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
