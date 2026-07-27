/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ContainerOwnerInfo {
  prefix: string;
  ownerEn: string;
  ownerZh: string;
  type: "CARRIER" | "LESSOR";
}

const PREFIX_MAP: Record<string, ContainerOwnerInfo> = {
  MSCU: { prefix: "MSCU", ownerEn: "MSC (Mediterranean Shipping Co.)", ownerZh: "地中海航运 (MSC)", type: "CARRIER" },
  MEDU: { prefix: "MEDU", ownerEn: "MSC (Mediterranean Shipping Co.)", ownerZh: "地中海航运 (MSC)", type: "CARRIER" },
  CMAU: { prefix: "CMAU", ownerEn: "CMA CGM Group", ownerZh: "达飞海运集团 (CMA CGM)", type: "CARRIER" },
  CGMU: { prefix: "CGMU", ownerEn: "CMA CGM Group", ownerZh: "达飞海运集团 (CMA CGM)", type: "CARRIER" },
  MAEU: { prefix: "MAEU", ownerEn: "Maersk Line / A.P. Moller", ownerZh: "马士基航运 (Maersk)", type: "CARRIER" },
  MSKU: { prefix: "MSKU", ownerEn: "Maersk Line / A.P. Moller", ownerZh: "马士基航运 (Maersk)", type: "CARRIER" },
  MRAU: { prefix: "MRAU", ownerEn: "Maersk Line / A.P. Moller", ownerZh: "马士基航运 (Maersk)", type: "CARRIER" },
  OOCL: { prefix: "OOCL", ownerEn: "OOCL (Orient Overseas)", ownerZh: "东方海外货柜 (OOCL)", type: "CARRIER" },
  OOLU: { prefix: "OOLU", ownerEn: "OOCL (Orient Overseas)", ownerZh: "东方海外货柜 (OOCL)", type: "CARRIER" },
  CSQU: { prefix: "CSQU", ownerEn: "COSCO Shipping Lines", ownerZh: "中远海运集运 (COSCO)", type: "CARRIER" },
  COSU: { prefix: "COSU", ownerEn: "COSCO Shipping Lines", ownerZh: "中远海运集运 (COSCO)", type: "CARRIER" },
  CBHU: { prefix: "CBHU", ownerEn: "COSCO Shipping / Florens", ownerZh: "中远海运 / 佛罗伦租赁", type: "LESSOR" },
  HAPU: { prefix: "HAPU", ownerEn: "Hapag-Lloyd AG", ownerZh: "赫伯罗特航运 (Hapag-Lloyd)", type: "CARRIER" },
  HLCU: { prefix: "HLCU", ownerEn: "Hapag-Lloyd AG", ownerZh: "赫伯罗特航运 (Hapag-Lloyd)", type: "CARRIER" },
  NYKU: { prefix: "NYKU", ownerEn: "ONE (Ocean Network Express)", ownerZh: "海洋网联船务 (ONE)", type: "CARRIER" },
  ONEU: { prefix: "ONEU", ownerEn: "ONE (Ocean Network Express)", ownerZh: "海洋网联船务 (ONE)", type: "CARRIER" },
  KKLU: { prefix: "KKLU", ownerEn: "ONE / K-Line", ownerZh: "海洋网联 / 川崎汽船", type: "CARRIER" },
  ZIMU: { prefix: "ZIMU", ownerEn: "ZIM Integrated Shipping Services", ownerZh: "以星综合航运 (ZIM)", type: "CARRIER" },
  TGHU: { prefix: "TGHU", ownerEn: "Textainer Equipment Management", ownerZh: "泰盛国际租赁 (Textainer)", type: "LESSOR" },
  TTNU: { prefix: "TTNU", ownerEn: "Triton International Container Lessor", ownerZh: "特里顿国际租赁 (Triton)", type: "LESSOR" },
  TRIU: { prefix: "TRIU", ownerEn: "Triton International Container Lessor", ownerZh: "特里顿国际租赁 (Triton)", type: "LESSOR" },
  SEGU: { prefix: "SEGU", ownerEn: "Seaco Global Container Leasing", ownerZh: "施科全球集装箱租赁 (Seaco)", type: "LESSOR" },
  SEAU: { prefix: "SEAU", ownerEn: "Seaco Global Container Leasing", ownerZh: "施科全球集装箱租赁 (Seaco)", type: "LESSOR" },
  CAIU: { prefix: "CAIU", ownerEn: "CAI International Containers", ownerZh: "CAI国际货柜租赁", type: "LESSOR" },
  FLSU: { prefix: "FLSU", ownerEn: "FlexiVan Intermodal Leasing", ownerZh: "FlexiVan多式联运租赁", type: "LESSOR" },
  FSCU: { prefix: "FSCU", ownerEn: "Florens Container Services", ownerZh: "佛罗伦货柜服务 (Florens)", type: "LESSOR" },
  WHLU: { prefix: "WHLU", ownerEn: "Wan Hai Lines", ownerZh: "万海航运 (Wan Hai)", type: "CARRIER" },
  EMCU: { prefix: "EMCU", ownerEn: "Evergreen Marine Corporation", ownerZh: "长荣海运 (Evergreen)", type: "CARRIER" },
  EGHU: { prefix: "EGHU", ownerEn: "Evergreen Marine Corporation", ownerZh: "长荣海运 (Evergreen)", type: "CARRIER" }
};

export function getContainerOwnerByPrefix(identifier: string): { ownerEn: string; ownerZh: string; prefix: string; type: string } {
  const clean = identifier.trim().toUpperCase();
  
  // Try 4-letter prefix first
  const prefix4 = clean.substring(0, 4);
  if (PREFIX_MAP[prefix4]) {
    return PREFIX_MAP[prefix4];
  }

  // Try 3-letter prefix
  const prefix3 = clean.substring(0, 3);
  for (const key of Object.keys(PREFIX_MAP)) {
    if (key.startsWith(prefix3)) {
      return PREFIX_MAP[key];
    }
  }

  // Check if it's a PO number or Invoice
  if (clean.startsWith("PO-") || clean.includes("ORD")) {
    return {
      prefix: "PO-EDI",
      ownerEn: "Dedicated Supply Chain Charter (Buyer Owned)",
      ownerZh: "专属买家供应链定制箱 (自备箱)",
      type: "CARRIER"
    };
  }

  if (clean.startsWith("INV-") || clean.includes("BILL")) {
    return {
      prefix: "INV-EDI",
      ownerEn: "Commercial Trade Manifest Pool",
      ownerZh: "国际贸易结算专用池 (承运商代管)",
      type: "CARRIER"
    };
  }

  // Fallback for unknown prefixes
  const extractedPrefix = (clean.match(/^[A-Z]{3,4}/) || ["IGLU"])[0];
  return {
    prefix: extractedPrefix,
    ownerEn: `Global Intermodal Lessor (${extractedPrefix})`,
    ownerZh: `国际海运货柜租赁 (${extractedPrefix})`,
    type: "LESSOR"
  };
}

export function generateETA(status: string, index: number, lang: "en" | "zh"): string {
  if (status === "DELIVERED") {
    return lang === "zh" ? "已于 2026-07-26 抵达并完成放行" : "Arrived & Cleared 2026-07-26";
  }
  if (status === "BERTHED") {
    return lang === "zh" ? "今日靠泊 预计完成卸货 +12小时" : "Berthed Today • Discharge in +12 hrs";
  }
  if (status === "PORT_CONGESTION") {
    return lang === "zh" ? "预计 2026-08-01 (因泊位排队顺延+48小时)" : "Est. 2026-08-01 (+48h Berth Delay)";
  }
  if (status === "TEMP_EXCURSION") {
    return lang === "zh" ? "预计 2026-07-30 (紧急温控干预中)" : "Est. 2026-07-30 (Active Temp Intervention)";
  }

  // Calculate future dates based on index
  const baseDay = 28 + (index % 6);
  const month = baseDay > 31 ? "08" : "07";
  const day = baseDay > 31 ? (baseDay - 31).toString().padStart(2, "0") : baseDay.toString().padStart(2, "0");
  const time = `${10 + (index % 8)}:00 UTC`;

  return lang === "zh" ? `预计 2026-${month}-${day} ${time}` : `Est. 2026-${month}-${day} ${time}`;
}
