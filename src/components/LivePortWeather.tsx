/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CloudSun,
  Waves,
  RefreshCw,
  Wind,
  Thermometer,
  Droplets,
  AlertTriangle,
  Activity,
  WifiOff,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { CORRIDOR_LABELS } from "../data/ports";
import {
  fetchPortWeather,
  weatherCodeLabel,
  type MarineRisk,
  type PortWeather,
  type PortWeatherSnapshot,
} from "../services/weather";

const AUTO_REFRESH_MS = 10 * 60 * 1000;

const RISK_STYLE: Record<MarineRisk, { chip: string; dot: string; bar: string }> = {
  CALM: {
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300/70 dark:border-emerald-800/70",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
  },
  WATCH: {
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/70 dark:border-amber-800/70",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
  },
  ALERT: {
    chip: "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300 border-red-300/70 dark:border-red-800/70",
    dot: "bg-red-500",
    bar: "bg-red-500",
  },
};

const RISK_LABEL: Record<MarineRisk, { en: string; zh: string }> = {
  CALM: { en: "Normal", zh: "正常" },
  WATCH: { en: "Monitor", zh: "注意" },
  ALERT: { en: "Alert", zh: "警戒" },
};

const RISK_ORDER: Record<MarineRisk, number> = { ALERT: 0, WATCH: 1, CALM: 2 };

function fmt(value: number | null, digits: number, unit = ""): string {
  return value === null ? "—" : `${value.toFixed(digits)}${unit}`;
}

/** Short local clock derived from the ISO local time Open-Meteo already returns. */
function localClock(iso: string | null): string {
  if (!iso) return "--:--";
  const parts = iso.split("T");
  return parts.length === 2 ? parts[1].slice(0, 5) : "--:--";
}

const PortTile: React.FC<{ port: PortWeather; lang: "en" | "zh" }> = ({ port, lang }) => {
  const style = RISK_STYLE[port.risk];
  const windPct = Math.min(100, ((port.windKt ?? 0) / 40) * 100);
  const wavePct = Math.min(100, ((port.waveM ?? 0) / 5) * 100);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">{port.code}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${style.chip}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
              {RISK_LABEL[port.risk][lang]}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5">
            {lang === "zh" ? port.nameZh : port.name}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] font-mono text-slate-400 block">{localClock(port.localTime)}</span>
          <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
            {CORRIDOR_LABELS[port.corridor][lang]}
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xl font-mono font-extrabold text-slate-900 dark:text-white leading-none">
            {fmt(port.tempC, 1, "°")}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {weatherCodeLabel(port.weatherCode, lang)}
          </span>
        </div>
        <Droplets className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          {fmt(port.precipMm, 1)} mm
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Wind className="w-3 h-3" />
              {lang === "zh" ? "风" : "Wind"}
            </span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
              {fmt(port.windKt, 0, " kn")}
              <span className="text-slate-400 font-normal">
                {" "}/ {lang === "zh" ? "阵风" : "gust"} {fmt(port.gustKt, 0, " kn")}
              </span>
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700/70 h-1.5 rounded-full overflow-hidden mt-1">
            <div className={`h-full ${style.bar}`} style={{ width: `${windPct}%` }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Waves className="w-3 h-3" />
              {lang === "zh" ? "浪高" : "Wave"}
            </span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
              {fmt(port.waveM, 1, " m")}
              <span className="text-slate-400 font-normal">
                {" "}
                · {lang === "zh" ? "周期" : "period"} {fmt(port.wavePeriodS, 0, " s")}
              </span>
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700/70 h-1.5 rounded-full overflow-hidden mt-1">
            <div className={`h-full ${style.bar}`} style={{ width: `${wavePct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const LivePortWeather: React.FC = () => {
  const { language } = useLanguage();
  const lang = language;
  const [snapshot, setSnapshot] = useState<PortWeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchPortWeather();
      if (!mounted.current) return;
      setSnapshot(data);
      setFailed(false);
    } catch {
      if (!mounted.current) return;
      setFailed(true);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    const timer = window.setInterval(() => load(true), AUTO_REFRESH_MS);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
    };
  }, [load]);

  const sorted = useMemo(() => {
    if (!snapshot) return [];
    return [...snapshot.ports].sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk]);
  }, [snapshot]);

  const alertCount = sorted.filter((p) => p.risk !== "CALM").length;
  const fetchedLabel = snapshot
    ? new Date(snapshot.fetchedAt).toLocaleTimeString(lang === "zh" ? "zh-CN" : "en-GB", { hour12: false })
    : "--:--:--";

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-cyan-500/30 shadow-sm space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{lang === "zh" ? "全球枢纽港 · 实时气象与海况" : "Global Hub Ports · Live Weather & Sea State"}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-800/70 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                LIVE
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === "zh"
                ? "真实实时数据 · Open-Meteo 开放接口（免费、免密钥）· 每 10 分钟自动刷新"
                : "Genuinely live · Open-Meteo open APIs (free, key-less) · auto-refreshes every 10 min"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {lang === "zh" ? "最近拉取" : "Last fetched"}
            </span>
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
              {fetchedLabel}
            </span>
          </div>
          <div
            className={`text-right px-3 py-1.5 rounded-xl border ${
              alertCount > 0
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300/70 dark:border-amber-800/70"
                : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300/70 dark:border-emerald-800/70"
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              {lang === "zh" ? "风浪需关注" : "Under watch"}
            </span>
            <span
              className={`font-mono text-xs font-extrabold ${
                alertCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {alertCount} / {sorted.length || 0}
            </span>
          </div>
          <button
            onClick={() => load()}
            disabled={loading}
            title={lang === "zh" ? "立即刷新实时气象" : "Refresh live weather now"}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-500" : ""}`} />
          </button>
        </div>
      </div>

      {failed && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/70 dark:border-amber-800/70">
          <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
            <p className="font-bold">
              {lang === "zh"
                ? "实时气象暂不可用（离线预览或网络受限）"
                : "Live weather unavailable (offline preview or network restricted)"}
            </p>
            <p className="text-amber-700/90 dark:text-amber-300/90">
              {lang === "zh"
                ? "本模块依赖 Open-Meteo 在线接口；其余演示数据集照常显示，不受影响。"
                : "This module depends on the online Open-Meteo APIs; the rest of the demo dataset renders unaffected."}
            </p>
          </div>
        </div>
      )}

      {loading && !snapshot ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 h-[186px] animate-pulse"
            />
          ))}
        </div>
      ) : sorted.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((port) => (
            <PortTile key={port.code} port={port} lang={lang} />
          ))}
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyan-500" />
          <span>
            {lang === "zh"
              ? "风险分级：风 ≥22 kn 或 浪 ≥2.5 m 为「注意」，风 ≥34 kn 或 浪 ≥4.0 m 为「警戒」。河口/内河泊位（上海、宁波、盐田、汉堡）的浪高取港外海况参考格点，风与气温仍用港口本点。"
              : "Risk bands: wind ≥22 kn or wave ≥2.5 m = Monitor; wind ≥34 kn or wave ≥4.0 m = Alert. Wave height for estuary/river berths (Shanghai, Ningbo, Yantian, Hamburg) is read from an offshore reference cell; wind and air temperature still use the port's own point."}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>
            {lang === "zh"
              ? "数据来源：Open-Meteo（CC BY 4.0）· 本模块为真实实时数据，与上方演示数据集相互独立"
              : "Source: Open-Meteo (CC BY 4.0) · this module is real live data, independent of the demo dataset above"}
          </span>
        </div>
      </div>
    </section>
  );
};
