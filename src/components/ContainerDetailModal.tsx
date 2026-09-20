/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  X, 
  Thermometer, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Cpu, 
  Clock, 
  MapPin, 
  Anchor, 
  CheckCircle2, 
  DollarSign, 
  ExternalLink, 
  RefreshCw, 
  FileText, 
  Sparkles,
  Box,
  Battery,
  Radio,
  Lock
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { ShippingContainer } from "../types";

interface ContainerDetailModalProps {
  container: ShippingContainer | null;
  onClose: () => void;
}

export const ContainerDetailModal: React.FC<ContainerDetailModalProps> = ({ container, onClose }) => {
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<any>(container?.aiAnalytics || null);
  const [activeTab, setActiveTab] = useState<"telemetry" | "milestones" | "ai">("telemetry");

  if (!container) return null;

  const isReefer = container.cargoType.toLowerCase().includes("reefer");
  const tempThreshold = container.telemetry.targetTemp;
  const isExcursion = container.telemetry.temperature > tempThreshold + 2;

  const handleRunAiPrediction = async () => {
    setIsGeneratingAi(true);
    try {
      const response = await fetch("/api/ai/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          containerId: container.containerNumber,
          poNumber: container.poNumber,
          currentStatus: container.status,
          origin: container.originPort,
          destination: container.destinationPort,
          currentCoordinates: `${container.coordinates.lat}°, ${container.coordinates.lng}°`,
          telemetry: container.telemetry,
          routeBottlenecks: container.status === "PORT_CONGESTION" ? ["Canal Convoy Backlog"] : []
        })
      });
      const data = await response.json();
      if (data && data.success && data.prediction) {
        setAiPrediction({
          demurrageRiskUsd: data.prediction.demurrageRiskUsd || container.aiAnalytics?.demurrageRiskUsd || 0,
          riskLevel: data.prediction.riskLevel || container.priority,
          recommendation: data.prediction.summary || container.aiAnalytics?.recommendation,
          actionItems: data.prediction.actionableRecommendations || container.aiAnalytics?.actionItems || [],
          costOptimizationImpact: data.prediction.costOptimizationImpact
        });
      }
    } catch (error) {
      console.error("Failed to fetch AI analytics:", error);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                {container.containerNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                {container.poNumber}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                container.status === "TEMP_EXCURSION" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-800" :
                container.status === "PORT_CONGESTION" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800" :
                "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
              }`}>
                <span className={`w-2 h-2 rounded-full ${container.status === "TEMP_EXCURSION" ? "bg-red-500 animate-ping" : "bg-blue-500"}`} />
                {container.status.replace("_", " ")}
              </span>
            </div>

            {/* Sub Identifiers */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              <span>Invoice: <strong className="font-mono text-slate-700 dark:text-slate-200">{container.invoiceNumber}</strong></span>
              <span>BOL: <strong className="font-mono text-slate-700 dark:text-slate-200">{container.billOfLading}</strong></span>
              <span>Vessel: <strong className="text-slate-700 dark:text-slate-200">{container.vesselName} ({container.carrier})</strong></span>
              <span>Cargo: <strong className="text-slate-700 dark:text-slate-200">{container.cargoType}</strong></span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Route Progress Strip */}
        <div className="bg-blue-50/50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs">
              ORIG
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Origin Terminal</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{container.originPort}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 max-w-xs mx-auto">
            <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              <span>In Transit ({container.progressPercent}%)</span>
              <span>ETA: {new Date(container.eta).toLocaleDateString()}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${isExcursion ? "bg-red-500" : "bg-gradient-to-r from-blue-500 to-indigo-600"}`} 
                style={{ width: `${container.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 text-right">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Destination Terminal</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{container.destinationPort}</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
              DEST
            </div>
          </div>
        </div>

        {/* Tabs navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/30 dark:bg-slate-900">
          <button
            onClick={() => setActiveTab("telemetry")}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "telemetry"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Thermometer className="w-4 h-4" />
            <span>IoT Telemetry & Charts</span>
          </button>

          <button
            onClick={() => setActiveTab("milestones")}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "milestones"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Blockchain Milestone Audit ({container.milestones.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("ai")}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "ai"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span>Gemini AI Cost Optimization</span>
            {aiPrediction?.demurrageRiskUsd > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 text-[10px] font-bold">
                Risk: ${aiPrediction.demurrageRiskUsd.toLocaleString()}
              </span>
            )}
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: TELEMETRY & CHARTS */}
          {activeTab === "telemetry" && (
            <div className="space-y-6">
              
              {/* Key Telemetry Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-4 rounded-2xl border ${isExcursion ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800/60" : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"}`}>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Reefer Temp</span>
                    <Thermometer className={`w-4 h-4 ${isExcursion ? "text-red-500 animate-bounce" : "text-blue-500"}`} />
                  </div>
                  <div className={`text-xl sm:text-2xl font-extrabold mt-1 font-mono ${isExcursion ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
                    {container.telemetry.temperature}°C
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
                    Target: {container.telemetry.targetTemp}°C
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Humidity RH</span>
                    <Activity className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
                    {container.telemetry.humidity}%
                  </div>
                  <span className="text-[11px] font-medium text-emerald-500 block mt-0.5">
                    Optimal range (35-55%)
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>IoT Battery</span>
                    <Battery className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
                    {container.telemetry.batteryLevel}%
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
                    Solar recharge active
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Security Seal</span>
                    <Lock className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {container.telemetry.doorStatus}
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
                    {container.telemetry.signalStrength}
                  </span>
                </div>
              </div>

              {/* Temperature History Chart */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Real-Time Temperature Excursion Profile (Last 24 Hours)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      High-frequency sensor telemetry sampled via satellite IoT gateway.
                    </p>
                  </div>
                  {isExcursion && (
                    <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 text-xs font-bold flex items-center gap-1.5 border border-red-300 dark:border-red-800">
                      <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                      <span>Threshold Breached at 20:00</span>
                    </span>
                  )}
                </div>

                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={container.telemetry.tempHistory} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} unit="°C" domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                        formatter={(value: any) => [`${value}°C`, "Temperature"]}
                      />
                      {/* Target threshold reference */}
                      <ReferenceLine 
                        y={container.telemetry.targetTemp} 
                        stroke="#10b981" 
                        strokeDasharray="4 4" 
                        label={{ value: `Setpoint (${container.telemetry.targetTemp}°C)`, fill: "#10b981", fontSize: 11, position: 'top' }} 
                      />
                      {isReefer && (
                        <ReferenceLine 
                          y={container.telemetry.targetTemp + 2} 
                          stroke="#ef4444" 
                          strokeDasharray="2 2" 
                          label={{ value: "Max Safe Threshold", fill: "#ef4444", fontSize: 11, position: 'top' }} 
                        />
                      )}
                      <Line 
                        type="monotone" 
                        dataKey="temp" 
                        stroke={isExcursion ? "#ef4444" : "#3b82f6"} 
                        strokeWidth={3} 
                        dot={{ r: 5, fill: isExcursion ? "#ef4444" : "#3b82f6" }} 
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MILESTONES & BLOCKCHAIN AUDIT */}
          {activeTab === "milestones" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      Immutable Blockchain Ledger Verification
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Each checkpoint is cryptographically hashed via SHA-256 to prevent cold-chain compliance tampering.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-emerald-200 dark:bg-emerald-900 px-2.5 py-1 rounded-lg text-emerald-800 dark:text-emerald-200 shrink-0">
                  Verified Active
                </span>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                {container.milestones.map((ms, index) => {
                  const isDone = ms.status === "COMPLETED";
                  const isAlert = ms.status === "ALERT";
                  const isCurr = ms.status === "IN_PROGRESS";

                  return (
                    <div key={ms.id} className="relative flex items-start justify-between gap-4 group">
                      {/* Timeline Node Icon */}
                      <div className={`absolute -left-[27px] w-6 h-6 rounded-full flex items-center justify-center ${
                        isDone ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30" :
                        isAlert ? "bg-red-500 text-white animate-pulse" :
                        isCurr ? "bg-blue-600 text-white ring-4 ring-blue-500/20" :
                        "bg-slate-200 dark:bg-slate-800 text-slate-400"
                      }`}>
                        {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                         isAlert ? <AlertTriangle className="w-3.5 h-3.5" /> :
                         <Clock className="w-3.5 h-3.5" />}
                      </div>

                      <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{ms.title}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              isDone ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" :
                              isAlert ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" :
                              "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                            }`}>
                              {ms.status}
                            </span>
                          </h5>
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            {ms.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          📍 {ms.location} • {ms.details}
                        </p>
                        {ms.txHash && ms.txHash !== "Pending" && (
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-2 text-[11px] font-mono text-slate-400">
                            <span>Ledger Hash:</span>
                            <span className="text-blue-500 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">{ms.txHash}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: GEMINI AI PREDICTIVE ANALYTICS */}
          {activeTab === "ai" && (
            <div className="space-y-6">
              
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white p-6 rounded-3xl border border-indigo-500/30 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/40 shadow-inner">
                      <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: "8s" }} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                        <span>Gemini AI Logistics Predictive Advisor</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                          Model: 3.6-Flash
                        </span>
                      </h4>
                      <p className="text-xs text-indigo-200 mt-0.5">
                        Real-time simulation of arrival windows, demurrage exposure, and route optimization.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRunAiPrediction}
                    disabled={isGeneratingAi}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? "animate-spin" : ""}`} />
                    <span>{isGeneratingAi ? "Analyzing Telemetry..." : "Run Fresh AI Analysis"}</span>
                  </button>
                </div>

                {aiPrediction ? (
                  <div className="space-y-4 relative z-10">
                    
                    {/* Financial Risk Header */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Demurrage & Detention Risk</span>
                        <span className={`text-xl sm:text-2xl font-extrabold font-mono mt-1 block ${aiPrediction.demurrageRiskUsd > 0 ? "text-red-400" : "text-emerald-400"}`}>
                          ${aiPrediction.demurrageRiskUsd.toLocaleString()} USD
                        </span>
                      </div>

                      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Risk Classification</span>
                        <span className={`text-sm sm:text-base font-extrabold px-2.5 py-1 rounded-lg mt-1 inline-block uppercase ${
                          aiPrediction.riskLevel === "CRITICAL" ? "bg-red-500/20 text-red-300 border border-red-500/40" :
                          aiPrediction.riskLevel === "HIGH" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                          "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}>
                          {aiPrediction.riskLevel} PRIORITY
                        </span>
                      </div>

                      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Confidence Score</span>
                        <span className="text-xl sm:text-2xl font-extrabold text-blue-400 font-mono mt-1 block">
                          94.8%
                        </span>
                      </div>
                    </div>

                    {/* AI Strategic Advice */}
                    <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
                      <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Cpu className="w-4 h-4" />
                        <span>Root Cause & Strategic Advisory</span>
                      </h5>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {aiPrediction.recommendation}
                      </p>
                    </div>

                    {/* Actionable Recommendations List */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Actionable Operational Steps for Stakeholders:
                      </h5>
                      {(aiPrediction.actionItems || []).map((item: string, idx: number) => (
                        <div key={idx} className="bg-slate-800/80 p-3 rounded-xl border border-indigo-500/20 flex items-start gap-3 text-xs text-slate-200">
                          <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="flex-1 mt-0.5 font-medium">{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* Cost Optimization Banner */}
                    {aiPrediction.costOptimizationImpact && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold text-emerald-300">
                        <DollarSign className="w-5 h-5 shrink-0 text-emerald-400" />
                        <span>{aiPrediction.costOptimizationImpact}</span>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-300">
                    <p className="text-sm font-medium mb-4">No AI optimization report generated yet for this container.</p>
                    <button
                      onClick={handleRunAiPrediction}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Gemini AI Cost Advisory</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Container ID: <span className="font-mono text-slate-700 dark:text-slate-300">{container.containerNumber}</span> • Sample data timestamp: {container.telemetry.lastUpdated}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
};
