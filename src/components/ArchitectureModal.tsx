/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Cpu, 
  Radio, 
  Database, 
  Lock, 
  Server, 
  CheckCircle2, 
  Layers, 
  Key, 
  Globe, 
  Terminal, 
  FileText,
  Activity,
  Zap
} from "lucide-react";
import { ArchitectureSection } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface ArchitectureModalProps {
  sections: ArchitectureSection[];
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ sections }) => {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const filteredSections = selectedCategory === "ALL" ? sections : sections.filter(s => s.category === selectedCategory);

  const translateCategory = (cat: string) => {
    if (!isZh) return cat;
    if (cat === "IoT Ingestion") return "物联网遥测摄取";
    if (cat === "Security & Zero-Trust") return "网络安全与零信任";
    if (cat === "Predictive AI Engine") return "AI 预测决策引擎";
    if (cat === "Data Layer & Blockchain") return "区块链与数据层";
    return cat;
  };

  const translateTitle = (title: string, id: string) => {
    if (!isZh) return title;
    if (id === "arch-1" || title.includes("Zero-Trust IoT & Telemetry")) return "零信任物联网 IoT 与传感器遥测数据摄取";
    if (id === "arch-2" || title.includes("Zero-Trust Security & Encryption")) return "零信任网络安全与端到端加密架构";
    if (id === "arch-3" || title.includes("Gemini AI Predictive Analytics")) return "Gemini AI 预测分析与智能路由调度引擎";
    if (id === "arch-4" || title.includes("Immutable Blockchain Audit")) return "不可篡改区块链审计追踪与海量数据层";
    return title;
  };

  const translateSummary = (summary: string, id: string) => {
    if (!isZh) return summary;
    if (id === "arch-1") return "来自智能集装箱的实时传感器遥测数据（温度、湿度、G力冲击振动、门状态电子铅封、高精度 GPS）通过双模卫星（Iridium 铱星/Inmarsat 国际海事卫星）和 4G LTE 蜂窝调制解调器实现全天候无死角回传。";
    if (id === "arch-2") return "企业级零信任网络准入 (ZTNA) 体系，全面保护所有供应链参与方终端、API 网关及集装箱遥测数据流，抵御中间人攻击、数据包伪造或通信窃听。";
    if (id === "arch-3") return "云端集成的 Google Gemini 3.6 / 3.1 Pro AI 深度分析引擎，实时处理历史海运航道流量、船舶 AIS 动态坐标、气象气旋模型以及目的港码头泊位处理速率。";
    if (id === "arch-4") return "基于分布式不可篡改联盟账本，锚定集装箱物流生命周期的关键里程碑（进场卸货、海关放行、冷藏箱温度合规日志、电子铅封校验），确保数据绝对真实可审计。";
    return summary;
  };

  const translateSpec = (spec: string, id: string, idx: number) => {
    if (!isZh) return spec;
    if (id === "arch-1") {
      const zhSpecs = [
        "所有物联网边缘网关均强制启用基于互操作证书验证 (mTLS) 的 MQTT over TLS 1.3 双向安全通信。",
        "冷藏箱微控制器边缘计算模块自动过滤瞬态电磁噪声，并每隔 15 分钟回传经过高压缩算法处理的遥测数据包。",
        "双模蜂窝网络/卫星通信自动切换机制，确保即便在远洋公海信号盲区仍能保持 99.99% 的遥测数据在线率。",
        "支持无线远端固件升级 (OTA)，所有升级包均通过 ECDSA 非对称密码学签名严格核验。"
      ];
      return zhSpecs[idx] || spec;
    }
    if (id === "arch-2") {
      const zhSpecs = [
        "全链路数据加密：云数据库静态存储数据 (Data at Rest) 采用 AES-256-GCM 加密，传输层数据 (Data in Transit) 采用 TLS 1.3 加密。",
        "细粒度基于角色的权限访问控制 (RBAC)，针对货运代理、报关行、船舶船长及货主等角色进行严格数据隔离。",
        "专用硬件安全模块 (HSM) 物理隔离存储电子集装箱铅封的非对称加密私钥。",
        "持续自动化的全网漏洞扫描与入侵检测系统，实时拦截异常或伪造的 IoT 遥测数据包。"
      ];
      return zhSpecs[idx] || spec;
    }
    if (id === "arch-3") {
      const zhSpecs = [
        "预测性到港时间 (ETA) 算法模型持续动态重算抵港窗口，将海上供应链时间不确定性降低多达 34%。",
        "自动化滞港费及滞期费 (D&D) 降本优化引擎，可根据海关与拥堵态势动态推荐海陆铁多式联运替代路线。",
        "多模态时序异常检测神经网络，在冷藏药物货损不可逆变质前毫秒级触发多途径预警。",
        "支持自然语言对话式查询，允许供应链管理人员直接提问：“如何为红海拥堵中的 PO-99842 工单规划最快的分流路线？”"
      ];
      return zhSpecs[idx] || spec;
    }
    if (id === "arch-4") {
      const zhSpecs = [
        "基于密码学 SHA-256 里程碑哈希算法，彻底杜绝高价值冷链生物医药温控记录的任何事后篡改可能。",
        "自动化智能合约，在核验船舶 GPS 靠港及温度合规后，即时触发信用证质保金释放与保单理赔。",
        "高吞吐量时序云数据库 (Cloud Spanner / Bigtable)，每日高效索引并分区管理数千万条 IoT 遥测数据。",
        "跨组织电子数据交换 (EDI) API 接口网桥，全面兼容国际航运 ANSI X12 与 UN/EDIFACT 核心规范。"
      ];
      return zhSpecs[idx] || spec;
    }
    return spec;
  };

  return (
    <div className="space-y-8">
      
      {/* Top Architectural Overview Banner */}
      <div className="feature-panel accent-indigo p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              {isZh ? "企业级物联网 IoT 与海运冷链架构蓝图" : "Enterprise IoT & Logistics Blueprint"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isZh ? "系统整体架构、技术栈与零信任数据安全安全规格" : "Comprehensive Architecture, Tech Stack & Security Protocols"}
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            {isZh ? "VeloCortex 运行在基于零信任 (Zero-Trust) 的高可用海运物联网基础架构之上，旨在通过卫星网关与蜂窝网络实时摄取高频传感器遥测数据，利用不可篡改的加密数字账本核验合规性，并结合 Gemini AI 执行实时冷链调控与路径优化。" : "VeloCortex operates on a high-availability, Zero-Trust maritime IoT infrastructure designed to ingest high-frequency sensor telemetry across cellular and satellite gateways, verify compliance via cryptographic immutable ledgers, and execute real-time Gemini AI optimization."}
          </p>
        </div>

        {/* Scope disclosure: this is the target design, not the running demo */}
        <div className="mt-5 rounded-2xl border border-amber-400/50 bg-amber-500/10 px-4 py-3 relative z-10">
          <p className="text-[11px] leading-relaxed text-amber-100">
            {isZh
              ? "说明：以下为 VeloCortex 的「目标生产架构」设计规格（参考架构）。本次部署的演示版并未实现该架构 —— 演示版为纯静态前端，数据来自构建期样例集；真实实时数据集中在「实时数据」标签页的三块面板（Open-Meteo 港口气象、IMF PortWatch 咽喉点过境量、开放 AIS 船位）。"
              : "Note: the specifications below describe VeloCortex's intended production architecture (reference design). The deployed demo does not implement it — the demo is a static front end running on a build-time sample set, with the real live feeds confined to the three panels on the Live Data tab (Open-Meteo port weather, IMF PortWatch chokepoint transits, open AIS positions)."}
          </p>
        </div>

        {/* Quick architecture diagram pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-500/20 relative z-10 text-center font-mono text-xs">
          <div className="bg-indigo-900/40 p-3 rounded-2xl border border-indigo-500/30">
            <span className="text-[10px] text-indigo-300 block uppercase font-sans font-bold">{isZh ? "1. 遥测数据摄取" : "1. Telemetry Ingest"}</span>
            <span className="font-bold text-white mt-1 block">MQTT / TLS 1.3</span>
          </div>
          <div className="bg-indigo-900/40 p-3 rounded-2xl border border-indigo-500/30">
            <span className="text-[10px] text-indigo-300 block uppercase font-sans font-bold">{isZh ? "2. 安全与网络准入" : "2. Security & Access"}</span>
            <span className="font-bold text-white mt-1 block">{isZh ? "零信任 ZTNA 架构" : "Zero-Trust ZTNA"}</span>
          </div>
          <div className="bg-indigo-900/40 p-3 rounded-2xl border border-indigo-500/30">
            <span className="text-[10px] text-indigo-300 block uppercase font-sans font-bold">{isZh ? "3. 智能决策引擎" : "3. Intelligence"}</span>
            <span className="font-bold text-white mt-1 block">Gemini 3.6-Flash</span>
          </div>
          <div className="bg-indigo-900/40 p-3 rounded-2xl border border-indigo-500/30">
            <span className="text-[10px] text-indigo-300 block uppercase font-sans font-bold">{isZh ? "4. 审计与合规" : "4. Compliance"}</span>
            <span className="font-bold text-white mt-1 block">{isZh ? "SHA-256 加密账本" : "SHA-256 Ledger"}</span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedCategory === "ALL" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"}`}
        >
          {isZh ? `全部技术规格 (${sections.length})` : `All Specifications (${sections.length})`}
        </button>
        <button
          onClick={() => setSelectedCategory("IoT Ingestion")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${selectedCategory === "IoT Ingestion" ? "bg-indigo-600 text-white shadow-md" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"}`}
        >
          <Radio className="w-3.5 h-3.5 text-blue-500" />
          <span>{isZh ? "物联网遥测摄取" : "IoT Ingestion"}</span>
        </button>
        <button
          onClick={() => setSelectedCategory("Security & Zero-Trust")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${selectedCategory === "Security & Zero-Trust" ? "bg-indigo-600 text-white shadow-md" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{isZh ? "网络安全与零信任" : "Security & ZTNA"}</span>
        </button>
        <button
          onClick={() => setSelectedCategory("Predictive AI Engine")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${selectedCategory === "Predictive AI Engine" ? "bg-indigo-600 text-white shadow-md" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"}`}
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-500" />
          <span>{isZh ? "AI 预测决策引擎" : "Predictive AI Engine"}</span>
        </button>
        <button
          onClick={() => setSelectedCategory("Data Layer & Blockchain")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${selectedCategory === "Data Layer & Blockchain" ? "bg-indigo-600 text-white shadow-md" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"}`}
        >
          <Database className="w-3.5 h-3.5 text-amber-500" />
          <span>{isZh ? "区块链与数据层" : "Blockchain Data Layer"}</span>
        </button>
      </div>

      {/* Architecture Specs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSections.map((sec) => {
          const icon = sec.iconName === "Radio" ? <Radio className="w-6 h-6 text-blue-500" /> :
                       sec.iconName === "ShieldCheck" ? <ShieldCheck className="w-6 h-6 text-emerald-500" /> :
                       sec.iconName === "Cpu" ? <Cpu className="w-6 h-6 text-indigo-500" /> :
                       <Database className="w-6 h-6 text-amber-500" />;

          return (
            <div 
              key={sec.id}
              className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-800 shadow-inner">
                    {icon}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      {translateCategory(sec.category)}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {translateTitle(sec.title, sec.id)}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                  {translateSummary(sec.summary, sec.id)}
                </p>

                {/* Technical Specs Checklist */}
                <div className="space-y-2.5 mb-6">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {isZh ? "核心工程与数据安全架构规范:" : "Core Engineering & Security Protocols:"}
                  </h4>
                  {sec.technicalSpecs.map((spec, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="font-medium">{translateSpec(spec, sec.id, idx)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supported Standards & Protocols Pills */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                  {isZh ? "兼容国际标准与密码学套件" : "Compliant Standards & Cryptography"}
                </span>
                <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                  {sec.protocols.map((proto, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 font-bold">
                      {proto}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* End-to-End Security Diagram Card */}
      <div className="feature-panel accent-emerald p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              <span>{isZh ? "零信任 ZTNA 端到端物联网遥测数据传输链路" : "Zero-Trust ZTNA IoT Telemetry Pipeline"}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isZh ? "从远洋货轮集装箱冷藏传感器到云端多方企业指挥中心看板的端到端加密数据包核验机制。" : "End-to-end cryptographic packet verification from ocean container reefer sensor to cloud stakeholder dashboard."}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
            {isZh ? "🔒 AES-256-GCM + mTLS 1.3 双向加密已启用" : "🔒 AES-256-GCM + mTLS 1.3 Active"}
          </span>
        </div>

        {/* Visual Pipeline Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 relative">
          
          {/* Node 1 */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 relative group hover:border-blue-500 transition-all">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs mb-3">
              01
            </div>
            <h4 className="text-sm font-bold text-white">{isZh ? "智能货柜物联网终端 (Edge)" : "Smart Container IoT Edge"}</h4>
            <p className="text-xs text-slate-400 mt-1">
              {isZh ? "冷藏温控探头与电子铅封 (#SEAL-9981) 每 15 秒采样，硬件安全模块 HSMM 自动签署密文及验签。" : "Reefer thermal probes & electronic bolt seal (#SEAL-9981) sample data every 15s. Hardware security module signs packet."}
            </p>
          </div>

          {/* Node 2 */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 relative group hover:border-indigo-500 transition-all">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs mb-3">
              02
            </div>
            <h4 className="text-sm font-bold text-white">{isZh ? "双模海陆通信卫星网关" : "Dual-Mode Satellite Gateway"}</h4>
            <p className="text-xs text-slate-400 mt-1">
              {isZh ? "经由 Iridium 铱星低轨星座或近岸 4G LTE 基站，基于 TLS 1.3/mTLS 传输 MQTT 安全遥测流。" : "MQTT over TLS 1.3 transmits telemetry via Iridium LEO satellite constellation or 4G LTE port towers with mTLS handshake."}
            </p>
          </div>

          {/* Node 3 */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 relative group hover:border-purple-500 transition-all">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs mb-3">
              03
            </div>
            <h4 className="text-sm font-bold text-white">{isZh ? "Gemini AI 实时推演引擎" : "Gemini AI & Analytics Engine"}</h4>
            <p className="text-xs text-slate-400 mt-1">
              {isZh ? "服务端引擎持续动态计算 ETA 抵港窗口，结合气象雷达与码头工情对温度超限和滞期风险即时预警。" : "Server-side engine recalculates arrival windows, scans weather patterns, and flags temperature excursions instantly."}
            </p>
          </div>

          {/* Node 4 */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 relative group hover:border-emerald-500 transition-all">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mb-3">
              04
            </div>
            <h4 className="text-sm font-bold text-white">{isZh ? "不可篡改数字账本锚定" : "Immutable Ledger Anchor"}</h4>
            <p className="text-xs text-slate-400 mt-1">
              {isZh ? "SHA-256 关键节点哈希锚定至分布式联盟链账本，通过 FDA/USDA 审计，自动释放信用证质保金。" : "SHA-256 milestone hashes anchored to distributed ledger for FDA/USDA audit compliance and smart contract escrow release."}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

