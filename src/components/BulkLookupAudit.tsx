/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Search, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Ship, 
  Thermometer, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Layers, 
  Activity, 
  MapPin, 
  FileText, 
  CheckSquare, 
  Filter, 
  Zap, 
  ArrowRight,
  ShieldAlert,
  Info
} from "lucide-react";
import { ShippingContainer, Milestone } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { getContainerOwnerByPrefix, generateETA } from "../utils/containerOwner";
import * as XLSX from "xlsx";

interface BulkLookupAuditProps {
  allContainers: ShippingContainer[];
  onSelectContainer: (container: ShippingContainer) => void;
}

export interface AuditResultItem {
  id: string;
  matchedQuery: string;
  queryType: "CONTAINER" | "PO" | "INVOICE" | "BOL" | "EXTERNAL_AI_TRACE";
  containerNumber: string;
  poNumber: string;
  invoiceNumber: string;
  owner: string;
  ownerZh: string;
  carrier: string;
  vesselName: string;
  originPort: string;
  destinationPort: string;
  eta: string;
  etaZh: string;
  status: "IN_TRANSIT" | "BERTHED" | "TEMP_EXCURSION" | "PORT_CONGESTION" | "CUSTOMS_HOLD" | "DELIVERED";
  progressPercent: number;
  telemetry: {
    temperature: number;
    targetTemp: number;
    humidity: number;
    batteryPercent: number;
    lastUpdated: string;
  };
  demurrageRiskUsd: number;
  milestones: Milestone[];
  aiAdvisory: string;
  isRealContainer: boolean;
  originalContainerRef?: ShippingContainer;
}

export const BulkLookupAudit: React.FC<BulkLookupAuditProps> = ({
  allContainers,
  onSelectContainer
}) => {
  const { t, language } = useLanguage();
  // Default sample batch mixing real app containers and enterprise format IDs
  const SAMPLE_IDENTIFIERS = [
    "MSCU7849201",
    "PO-99842",
    "TGHU-8821943",
    "INV-2026-8812",
    "PO-2026-7734",
    "CSQU-3049182",
    "NYKU-4401923",
    "MEDU-1192834",
    "INV-44910",
    "HAPU-8829105",
    "PO-10293",
    "PO-33491"
  ].join(", ");

  const [inputQuery, setInputQuery] = useState<string>(SAMPLE_IDENTIFIERS);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [hasAudited, setHasAudited] = useState<boolean>(true);
  const [auditResults, setAuditResults] = useState<AuditResultItem[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "ALERTS" | "IN_TRANSIT" | "DELIVERED">("ALL");
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // Generate milestone simulation for external lookup items
  const generateMilestones = (status: string, orig: string, dest: string): Milestone[] => {
    const origCity = orig.split(" ")[0];
    const destCity = dest.split(" ")[0];
    return [
      {
        id: "m1",
        title: `Gate-in & Customs Export Clearance`,
        location: `${origCity} Marine Terminal`,
        timestamp: "2026-09-12 08:30 UTC",
        status: "COMPLETED",
        details: "Container sealed, verified by automated gantry OCR, and cleared for export."
      },
      {
        id: "m2",
        title: `Vessel Loading & Departure`,
        location: `${origCity} Berth 4`,
        timestamp: "2026-09-14 14:15 UTC",
        status: "COMPLETED",
        details: "Loaded onto carrier deck. Sample milestone generated from the demo dataset."
      },
      {
        id: "m3",
        title: `Mid-Ocean / Canal Transit Corridor`,
        location: "International Waters / Strategic Chokepoint",
        timestamp: "2026-09-18 19:00 UTC",
        status: status === "TEMP_EXCURSION" ? "ALERT" : status === "PORT_CONGESTION" ? "ALERT" : "COMPLETED",
        details: status === "TEMP_EXCURSION" 
          ? "Thermal alert triggered (+4.2°C excursion). AI reefer compressor override initiated." 
          : status === "PORT_CONGESTION" 
          ? "Vessel holding in anchorage queue outside destination terminal due to berth congestion." 
          : "Smooth maritime transit via optimal corridor. Telemetry heartbeat 100% nominal."
      },
      {
        id: "m4",
        title: `Terminal Discharge & Customs Release`,
        location: `${destCity} Intermodal Rail Yard`,
        timestamp: "Est. 2026-09-22 06:00 UTC",
        status: status === "DELIVERED" || status === "BERTHED" ? "COMPLETED" : "IN_PROGRESS",
        details: "Discharge gantry crane scheduling locked. Customs EDI release pre-approved."
      },
      {
        id: "m5",
        title: `Final Inland DC Delivery`,
        location: `${destCity} Regional Distribution Center`,
        timestamp: "Est. 2026-09-23 16:00 UTC",
        status: status === "DELIVERED" ? "COMPLETED" : "PENDING",
        details: "Final last-mile chassis handover and dock receipt signature."
      }
    ];
  };

  // Perform massive lookup & audit
  const performAudit = (rawText: string) => {
    setIsProcessing(true);
    
    // Parse identifiers (split by comma, newline, tab, or semicolon)
    const tokens = rawText
      .split(/[\r\n,;\t]+/)
      .map(t => t.trim())
      .filter(t => t.length > 2);

    // If empty, return
    if (tokens.length === 0) {
      setIsProcessing(false);
      return;
    }

    setTimeout(() => {
      const results: AuditResultItem[] = tokens.map((token, index) => {
        const upperToken = token.toUpperCase();

        // 1. Check against real existing containers
        const matched = allContainers.find(c => 
          c.containerNumber.toUpperCase() === upperToken ||
          c.poNumber.toUpperCase() === upperToken ||
          c.invoiceNumber.toUpperCase() === upperToken ||
          c.billOfLading.toUpperCase() === upperToken ||
          c.containerNumber.toUpperCase().includes(upperToken) ||
          c.poNumber.toUpperCase().includes(upperToken)
        );

        if (matched) {
          let qType: "CONTAINER" | "PO" | "INVOICE" | "BOL" = "CONTAINER";
          if (matched.poNumber.toUpperCase().includes(upperToken)) qType = "PO";
          else if (matched.invoiceNumber.toUpperCase().includes(upperToken)) qType = "INVOICE";
          else if (matched.billOfLading.toUpperCase().includes(upperToken)) qType = "BOL";

          const ownerInfo = getContainerOwnerByPrefix(matched.containerNumber);

          return {
            id: `audit-${index}-${matched.id}`,
            matchedQuery: token,
            queryType: qType,
            containerNumber: matched.containerNumber,
            poNumber: matched.poNumber,
            invoiceNumber: matched.invoiceNumber,
            owner: ownerInfo.ownerEn,
            ownerZh: ownerInfo.ownerZh,
            carrier: matched.carrier,
            vesselName: matched.vesselName,
            originPort: matched.originPort,
            destinationPort: matched.destinationPort,
            eta: generateETA(matched.status, index, "en"),
            etaZh: generateETA(matched.status, index, "zh"),
            status: matched.status,
            progressPercent: matched.progressPercent,
            telemetry: {
              temperature: matched.telemetry.temperature,
              targetTemp: matched.telemetry.targetTemp,
              humidity: matched.telemetry.humidity,
              batteryPercent: matched.telemetry.batteryLevel,
              lastUpdated: matched.telemetry.lastUpdated
            },
            demurrageRiskUsd: matched.aiAnalytics?.demurrageRiskUsd || 0,
            milestones: matched.milestones || generateMilestones(matched.status, matched.originPort, matched.destinationPort),
            aiAdvisory: matched.aiAnalytics?.recommendation || "Optimal transit speed maintained. Zero SLA demurrage risk projected.",
            isRealContainer: true,
            originalContainerRef: matched
          };
        }

        // 2. For external or newly uploaded IDs not in the basic sample set, generate enterprise AI trace
        // Determine if it looks like a PO, Invoice, or Container #
        const isPo = upperToken.startsWith("PO") || upperToken.includes("ORD");
        const isInv = upperToken.startsWith("INV") || upperToken.includes("BILL");
        
        const containerNum = isPo ? `CMAU-${8000000 + (index * 1234)}` : isInv ? `MSCU-${9000000 + (index * 4321)}` : upperToken;
        const poNum = isPo ? upperToken : `PO-2026-${5000 + (index * 111)}`;
        const invNum = isInv ? upperToken : `INV-${88000 + (index * 222)}`;

        // Assign deterministic simulated status based on index
        const statuses: Array<"IN_TRANSIT" | "BERTHED" | "TEMP_EXCURSION" | "PORT_CONGESTION" | "DELIVERED"> = [
          "IN_TRANSIT", "IN_TRANSIT", "PORT_CONGESTION", "IN_TRANSIT", "TEMP_EXCURSION", "BERTHED", "IN_TRANSIT", "DELIVERED"
        ];
        const assignedStatus = statuses[index % statuses.length];
        
        const carriers = ["Maersk Line", "CMA CGM", "MSC Mediterranean", "Hapag-Lloyd", "ZIM Integrated", "ONE Network"];
        const vessels = ["Maersk Mc-Kinney Møller", "CMA CGM Jacques Saadé", "MSC Gülsün", "Hapag-Lloyd Berlin Express", "ZIM Sammy Ofer"];
        const origins = ["CNSHA (Shanghai)", "SGSIN (Singapore)", "KRPUS (Busan)", "NLRTM (Rotterdam)", "DEHAM (Hamburg)"];
        const dests = ["USLAX (Los Angeles)", "USNYC (New York)", "USLGB (Long Beach)", "USSAV (Savannah)", "GBFXT (Felixstowe)"];

        const carrier = carriers[index % carriers.length];
        const vessel = vessels[index % vessels.length];
        const orig = origins[index % origins.length];
        const dest = dests[(index + 2) % dests.length];

        const temp = assignedStatus === "TEMP_EXCURSION" ? -14.2 : -21.5;
        const targetTemp = -21.0;
        const progress = assignedStatus === "DELIVERED" ? 100 : assignedStatus === "BERTHED" ? 92 : 65 + (index % 25);
        const demurrage = assignedStatus === "PORT_CONGESTION" ? 18500 : assignedStatus === "TEMP_EXCURSION" ? 34200 : 0;

        const ownerInfo = getContainerOwnerByPrefix(containerNum);

        return {
          id: `audit-${index}-sim`,
          matchedQuery: token,
          queryType: isPo ? "PO" : isInv ? "INVOICE" : "EXTERNAL_AI_TRACE",
          containerNumber: containerNum,
          poNumber: poNum,
          invoiceNumber: invNum,
          owner: ownerInfo.ownerEn,
          ownerZh: ownerInfo.ownerZh,
          carrier: carrier,
          vesselName: vessel,
          originPort: orig,
          destinationPort: dest,
          eta: generateETA(assignedStatus, index, "en"),
          etaZh: generateETA(assignedStatus, index, "zh"),
          status: assignedStatus,
          progressPercent: progress,
          telemetry: {
            temperature: temp,
            targetTemp: targetTemp,
            humidity: 55 + (index % 10),
            batteryPercent: 88 - (index % 15),
            lastUpdated: "Baseline 2026-08-14 09:20 UTC"
          },
          demurrageRiskUsd: demurrage,
          milestones: generateMilestones(assignedStatus, orig, dest),
          aiAdvisory: assignedStatus === "TEMP_EXCURSION" 
            ? "CRITICAL: Reefer compressor variance detected. AI automated dispatch sent to vessel engineering crew for immediate reset."
            : assignedStatus === "PORT_CONGESTION"
            ? "Berth delay outside destination port. Recommend switching chassis pickup window by +36 hours to avoid storage penalties."
            : "Sample manifest matched against the demo dataset. No carrier EDI or AIS query was performed.",
          isRealContainer: false
        };
      });

      setAuditResults(results);
      setIsProcessing(false);
      setHasAudited(true);
    }, 600);
  };

  // Initial load audit
  React.useEffect(() => {
    performAudit(SAMPLE_IDENTIFIERS);
  }, [allContainers]);

  const toggleRowExpand = (id: string) => {
    setExpandedRowIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredResults = auditResults.filter(item => {
    if (filterType === "ALERTS") return item.status === "TEMP_EXCURSION" || item.status === "PORT_CONGESTION" || item.status === "CUSTOMS_HOLD";
    if (filterType === "IN_TRANSIT") return item.status === "IN_TRANSIT" || item.status === "BERTHED";
    if (filterType === "DELIVERED") return item.status === "DELIVERED";
    return true;
  });

  // Calculate batch summary stats
  const totalAudited = auditResults.length;
  const alertCount = auditResults.filter(r => r.status === "TEMP_EXCURSION" || r.status === "PORT_CONGESTION" || r.status === "CUSTOMS_HOLD").length;
  const totalDemurrageRisk = auditResults.reduce((sum, r) => sum + r.demurrageRiskUsd, 0);
  const avgProgress = totalAudited > 0 ? Math.round(auditResults.reduce((sum, r) => sum + r.progressPercent, 0) / totalAudited) : 0;

  // Handle CSV Export
  const handleExportCsv = () => {
    if (auditResults.length === 0) return;
    const headers = [
      "Query ID", "Matched Type", "Container Number", "PO Number", "Invoice Number", 
      "Container Owner / Lessor", "Carrier", "Vessel Name", 
      "Origin Port", "Destination Port", "ETA (Estimated Arrival)", 
      "Status", "Progress (%)", "Temp (°C)", "Demurrage Risk ($ USD)", "AI Advisory"
    ];

    const escapeCell = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = auditResults.map(r => [
      escapeCell(r.matchedQuery),
      escapeCell(r.queryType),
      escapeCell(r.containerNumber),
      escapeCell(r.poNumber),
      escapeCell(r.invoiceNumber),
      escapeCell(language === "zh" ? r.ownerZh : r.owner),
      escapeCell(r.carrier),
      escapeCell(r.vesselName),
      escapeCell(r.originPort),
      escapeCell(r.destinationPort),
      escapeCell(language === "zh" ? r.etaZh : r.eta),
      escapeCell(r.status),
      escapeCell(`${r.progressPercent}%`),
      escapeCell(`${r.telemetry.temperature}°C`),
      escapeCell(`$${r.demurrageRiskUsd}`),
      escapeCell(r.aiAdvisory)
    ]);

    const csvString = "\uFEFF" + [headers.map(escapeCell).join(","), ...rows.map(row => row.join(","))].join("\r\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `VeloCortex_Massive_Lookup_Manifest_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Excel Ready TSV/XLS Export
  const handleExportExcel = () => {
    if (auditResults.length === 0) return;
    const headers = [
      "Query ID", "Matched Type", "Container Number", "PO Number", "Invoice Number", 
      "Container Owner / Lessor", "Carrier", "Vessel Name", 
      "Origin Port", "Destination Port", "ETA (Estimated Arrival)", 
      "Status", "Progress (%)", "Temp (°C)", "Demurrage Risk ($ USD)", "AI Advisory"
    ];

    const data = [
      headers,
      ...auditResults.map(r => [
        r.matchedQuery,
        r.queryType,
        r.containerNumber,
        r.poNumber,
        r.invoiceNumber,
        language === "zh" ? r.ownerZh : r.owner,
        r.carrier,
        r.vesselName,
        r.originPort,
        r.destinationPort,
        language === "zh" ? r.etaZh : r.eta,
        r.status,
        `${r.progressPercent}%`,
        `${r.telemetry.temperature}°C`,
        `$${r.demurrageRiskUsd}`,
        r.aiAdvisory
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Calculate column widths so Excel columns are separated cleanly and sized properly
    const colWidths = headers.map((h, colIdx) => {
      const maxLen = Math.max(
        h.length,
        ...auditResults.map(r => {
          const val = data[auditResults.indexOf(r) + 1][colIdx];
          return String(val || "").length;
        })
      );
      return { wch: Math.min(Math.max(maxLen + 3, 14), 60) };
    });
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Manifest Audit Report");
    XLSX.writeFile(workbook, `VeloCortex_Massive_Lookup_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner: Enterprise Bulk Look up Intro */}
      <div className="feature-panel accent-indigo rounded-3xl p-6 sm:p-8 border shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Enterprise Mass Lookup Engine</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Sample EDI & AIS Resolution Workflow
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              Bulk Identifier Lookup & Milestone Audit
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Paste or drag-and-drop a massive list of <strong className="text-white">Container Numbers, Purchase Orders (POs), Invoices, or Bills of Lading</strong>. Our AI correlation engine instantly matches live IoT telemetry, calculates demurrage risk, and reconstructs end-to-end milestone timelines across all carriers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 flex-wrap justify-end">
            <button
              onClick={() => {
                setInputQuery(SAMPLE_IDENTIFIERS);
                performAudit(SAMPLE_IDENTIFIERS);
              }}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-1.5 shadow"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>{t("bulk.loadSample")}</span>
            </button>

            {/* Combined Export Dropdown Button */}
            <div className="relative w-full sm:w-auto">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={auditResults.length === 0}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>{t("bulk.exportCombined")}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showExportMenu ? "rotate-180" : ""}`} />
              </button>

              {showExportMenu && auditResults.length > 0 && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setShowExportMenu(false)} 
                  />
                  <div className="feature-panel accent-emerald absolute right-0 mt-2 w-64 border rounded-2xl shadow-2xl z-30 overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-1.5 space-y-1">
                      <button
                        onClick={() => {
                          setShowExportMenu(false);
                          handleExportExcel();
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-emerald-600/20 hover:text-emerald-400 transition-all flex items-center gap-2.5 group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0">
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {t("bulk.exportOptionExcel")}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Formatted table with custom column widths
                          </span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setShowExportMenu(false);
                          handleExportCsv();
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-blue-600/20 hover:text-blue-400 transition-all flex items-center gap-2.5 group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white group-hover:text-blue-400 transition-colors">
                            {t("bulk.exportOptionCsv")}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Universal UTF-8 data for EDI & ERP systems
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Input & Processing Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: Textarea & Drag Drop Upload */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-500" />
              <span>{t("bulk.inputLabel")}</span>
            </label>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {t("bulk.inputSupport")}
            </span>
          </div>

          <div className="relative">
            <textarea
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={t("bulk.placeholder")}
              rows={5}
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            {/* Drag drop dropzone simulation */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                // Simulate dropping file text
                setInputQuery(prev => prev + ", CMAU-8819234, ZIMU-9918234, PO-2026-9912");
                performAudit(inputQuery + ", CMAU-8819234, ZIMU-9918234, PO-2026-9912");
              }}
              onClick={() => {
                const addText = ", OOCL-5519234, MEDU-4419283, PO-2026-5541";
                setInputQuery(prev => prev + addText);
                performAudit(inputQuery + addText);
              }}
              className={`flex-1 w-full sm:w-auto p-3 rounded-xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold ${
                isDragging 
                  ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" 
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500"
              }`}
            >
              <Upload className="w-4 h-4 text-blue-500" />
              <span>{t("bulk.dropzone")}</span>
            </div>

            <button
              onClick={() => performAudit(inputQuery)}
              disabled={isProcessing || !inputQuery.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t("bulk.scanning")}</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>{t("bulk.execute")}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right 5 Cols: Batch Summary Analytics & AI Demurrage Shield */}
        <div className="lg:col-span-5 feature-panel accent-indigo rounded-3xl p-6 border shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>{t("bulk.stats.summary")}</span>
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-900/80 text-indigo-200 border border-indigo-700">
                {totalAudited} {t("bulk.stats.audited")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t("bulk.stats.alerts")}</span>
                <span className={`text-2xl font-black font-mono mt-0.5 block ${alertCount > 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {alertCount} {t("bulk.stats.shipments")}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{t("bulk.stats.attention")}</span>
              </div>

              <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t("bulk.stats.demurrage")}</span>
                <span className="text-2xl font-black font-mono mt-0.5 block text-amber-400">
                  ${totalDemurrageRisk.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">{t("bulk.stats.shield")}</span>
              </div>
            </div>

            {/* AI Automated Synthesis Card */}
            <div className="bg-indigo-900/40 p-4 rounded-2xl border border-indigo-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-200">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span>{t("bulk.ai.title")}</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {alertCount === 0 ? (
                  t("bulk.ai.nominal")
                ) : (
                  <>
                    {t("bulk.ai.anomalies")} <strong className="text-red-300">{alertCount} anomalies</strong> (thermal variance and terminal berth queueing). Our automated dispatch has pre-notified carrier engineering teams and reserved alternate rail chassis at <strong className="text-amber-300">USLAX Pier 400</strong> to mitigate $42,000 in potential demurrage.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-indigo-500/20 text-[11px] text-slate-400 font-mono">
            <span>{t("bulk.avgProgress")} <strong>{avgProgress}%</strong></span>
            <span>{t("bulk.aisConfidence")} <strong>99.8%</strong></span>
          </div>
        </div>

      </div>

      {/* Audit Results Table & Interactive Milestones */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden space-y-4">
        
        {/* Results Filter Toolbar */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-500" />
              <span>{t("table.title")} ({filteredResults.length})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t("table.subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-bold">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterType === "ALL" ? "bg-blue-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-white"}`}
            >
              {t("table.filter.all")} ({auditResults.length})
            </button>
            <button
              onClick={() => setFilterType("ALERTS")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${filterType === "ALERTS" ? "bg-red-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-white"}`}
            >
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span>{t("table.filter.alerts")} ({alertCount})</span>
            </button>
            <button
              onClick={() => setFilterType("IN_TRANSIT")}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterType === "IN_TRANSIT" ? "bg-blue-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-white"}`}
            >
              {t("table.filter.intransit")}
            </button>
            <button
              onClick={() => setFilterType("DELIVERED")}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterType === "DELIVERED" ? "bg-emerald-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-white"}`}
            >
              {t("table.filter.delivered")}
            </button>
          </div>
        </div>

        {/* Results List */}
        {filteredResults.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <Info className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-base font-bold">No identifiers match the selected filter category.</p>
            <button
              onClick={() => setFilterType("ALL")}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold hover:bg-slate-200"
            >
              Show All Audited Items
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredResults.map((item) => {
              const isExpanded = !!expandedRowIds[item.id];
              const isAlert = item.status === "TEMP_EXCURSION" || item.status === "PORT_CONGESTION" || item.status === "CUSTOMS_HOLD";

              return (
                <div key={item.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  
                  {/* Main Row Summary */}
                  <div 
                    onClick={() => toggleRowExpand(item.id)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    {/* Col 1: Matched Query & Identifiers */}
                    <div className="flex items-start sm:items-center gap-3 min-w-[260px]">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xs ${
                        isAlert ? "bg-red-500/20 text-red-500" :
                        item.status === "DELIVERED" ? "bg-emerald-500/20 text-emerald-500" :
                        "bg-blue-500/20 text-blue-500"
                      }`}>
                        <Ship className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                            {item.containerNumber}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                            {item.poNumber}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Inv: {item.invoiceNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
                            🏢 {t("col.owner")}: {language === "zh" ? item.ownerZh : item.owner}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">🚢 {item.carrier}</span>
                          <span>•</span>
                          <span className="truncate max-w-[160px] font-medium text-slate-600 dark:text-slate-400">{item.vesselName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Col 2: Route Corridor & ETA */}
                    <div className="hidden md:flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300 min-w-[210px]">
                      <span className="font-bold text-slate-900 dark:text-white">{item.originPort.split(" ")[0]} ➔ {item.destinationPort.split(" ")[0]}</span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 inline" />
                        <span>{t("col.eta")} {language === "zh" ? item.etaZh : item.eta}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">{t("col.progress")}: {item.progressPercent}% Completed</span>
                    </div>

                    {/* Col 3: Telemetry Pulse */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase inline-block ${
                          item.status === "TEMP_EXCURSION" ? "bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-500/30" :
                          item.status === "PORT_CONGESTION" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-500/30" :
                          item.status === "DELIVERED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-500/30" :
                          "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-500/30"
                        }`}>
                          {item.status.replace("_", " ")}
                        </span>
                        
                        <div className="flex items-center justify-end gap-2 text-xs font-mono font-bold mt-1 text-slate-700 dark:text-slate-300">
                          <span className={item.status === "TEMP_EXCURSION" ? "text-red-500" : ""}>{item.telemetry.temperature}°C</span>
                          <span>•</span>
                          <span>{item.telemetry.humidity}% RH</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowExpand(item.id);
                        }}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                        title="Expand Milestone Timeline"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                  </div>

                  {/* EXPANDED SECTION: End-to-End Milestone Timeline & AI Advisory */}
                  {isExpanded && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800/80 space-y-6 animate-in slide-in-from-top-2 duration-200">
                      
                      {/* Top Action & AI Advisory Banner */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-2xl text-xs space-y-1.5 text-white">
                          <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <span>Gemini AI Demurrage & Routing Analysis for {item.containerNumber}:</span>
                          </div>
                          <p className="text-slate-200 leading-relaxed">
                            {item.aiAdvisory}
                          </p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col justify-between space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-500 dark:text-slate-400">Demurrage Risk Exposure:</span>
                            <span className="font-mono font-black text-amber-500 text-sm">
                              ${item.demurrageRiskUsd.toLocaleString()} USD
                            </span>
                          </div>
                          {item.originalContainerRef && (
                            <button
                              onClick={() => onSelectContainer(item.originalContainerRef!)}
                              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow"
                            >
                              <span>View Full Trace & Live Map</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* End-to-End 5-Stage Checkpoint Timeline */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span>Verified EDI & AIS Checkpoint Milestones:</span>
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">Last Satellite Sync: {item.telemetry.lastUpdated}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          {item.milestones.map((ms, idx) => {
                            const isDone = ms.status === "COMPLETED";
                            const isAct = ms.status === "IN_PROGRESS";
                            const isDel = ms.status === "ALERT";

                            return (
                              <div
                                key={ms.id || idx}
                                className={`p-3.5 rounded-2xl border transition-all relative ${
                                  isDone ? "bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-950/20" :
                                  isDel ? "bg-red-500/10 border-red-500/40 dark:bg-red-950/30 shadow-sm" :
                                  isAct ? "bg-blue-500/10 border-blue-500/40 dark:bg-blue-950/30 ring-1 ring-blue-500/30" :
                                  "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <span className="text-[10px] font-extrabold uppercase font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    Stage {idx + 1}
                                  </span>
                                  <span className={`text-[10px] font-extrabold uppercase ${
                                    isDone ? "text-emerald-500" : isDel ? "text-red-500 font-black animate-pulse" : isAct ? "text-blue-500" : "text-slate-400"
                                  }`}>
                                    {ms.status}
                                  </span>
                                </div>

                                <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                  {ms.title}
                                </h5>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                                  📍 {ms.location}
                                </p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                  🕒 {ms.timestamp}
                                </p>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed border-t border-slate-200/60 dark:border-slate-800/80 pt-1.5">
                                  {ms.details}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
