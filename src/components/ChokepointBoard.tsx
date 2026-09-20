/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Anchor, RefreshCw, WifiOff, Ship, Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  fetchChokepoints,
  sparklinePath,
  GROUP_LABEL,
  GROUP_ORDER,
  type AisAvailability,
  type Chokepoint,
  type ChokepointSnapshot,
} from "../services/chokepoints";

const AUTO_REFRESH_MS = 30 * 60 * 1000;

const AIS_STYLE: Record<AisAvailability, { chip: string; labelEn: string; labelZh: string }> = {
  GOOD: {
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300/70 dark:border-emerald-800/70",
    labelEn: "AIS dense",
    labelZh: "AIS 密集",
  },
  SPARSE: {
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/70 dark:border-amber-800/70",
    labelEn: "AIS sparse",
    labelZh: "AIS 稀疏",
  },
  GAP: {
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300/70 dark:border-rose-800/70",
    labelEn: "No AIS cover",
    labelZh: "AIS 缺失",
  },
};

function fmt(value: number | null, digits = 0): string {
  return value === null ? "—" : value.toFixed(digits);
}

const Delta: React.FC<{ pct: number | null }> = ({ pct }) => {
  if (pct === null) return <span className="text-slate-400 font-mono text-xs">—</span>;
  const flat = Math.abs(pct) < 2;
  const Icon = flat ? Minus : pct > 0 ? TrendingUp : TrendingDown;
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-600 dark:text-slate-300">
      <Icon className="w-3.5 h-3.5 text-slate-400" />
      {pct > 0 ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
};

const ChokepointRow: React.FC<{ point: Chokepoint; lang: "en" | "zh" }> = ({ point, lang }) => {
  const ais = AIS_STYLE[point.ais];
  const path = useMemo(() => sparklinePath(point.series, 104, 22), [point.series]);
  const peakLabel = point.peak ? `${lang === "zh" ? "峰值" : "Peak"} ${point.peak.nTotal} · ${point.peak.date}` : "";

  return (
    <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[minmax(0,1.6fr)_104px_72px_92px_84px] items-center gap-x-4 gap-y-2 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="min-w-0 flex items-center gap-2">
        <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
          {lang === "zh" ? point.nameZh : point.name}
        </span>
        <span className={`hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${ais.chip}`}>
          {lang === "zh" ? ais.labelZh : ais.labelEn}
        </span>
      </div>

      <svg
        viewBox="0 0 104 22"
        className="hidden sm:block w-[104px] h-[22px] overflow-visible"
        aria-hidden="true"
        title={peakLabel}
      >
        <path d={path} fill="none" strokeWidth="1.5" className="stroke-indigo-500/80" strokeLinejoin="round" strokeLinecap="round" />
      </svg>

      <div className="text-right sm:text-left">
        <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">{fmt(point.avg7, 1)}</span>
        <span className="text-[10px] text-slate-400 ml-1">{lang === "zh" ? "日均" : "/d"}</span>
      </div>

      <div className="hidden sm:block">
        <Delta pct={point.deltaPct} />
      </div>

      <div className="hidden sm:block text-[11px] font-mono text-slate-500 dark:text-slate-400">
        {point.containerSharePct === null ? "—" : `${point.containerSharePct.toFixed(0)}% ${lang === "zh" ? "集装箱" : "cont."}`}
      </div>

      {/* Mobile-only compact meta line */}
      <div className="col-span-2 flex items-center gap-3 sm:hidden text-[11px] font-mono text-slate-500 dark:text-slate-400">
        <Delta pct={point.deltaPct} />
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${ais.chip}`}>
          {lang === "zh" ? ais.labelZh : ais.labelEn}
        </span>
        <span>
          {point.containerSharePct === null ? "—" : `${point.containerSharePct.toFixed(0)}% ${lang === "zh" ? "集装箱" : "cont."}`}
        </span>
      </div>
    </div>
  );
};

export const ChokepointBoard: React.FC = () => {
  const { language } = useLanguage();
  const lang = language;
  const [snapshot, setSnapshot] = useState<ChokepointSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchChokepoints();
      if (!mounted.current) return;
      setSnapshot(next);
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
    void load();
    const timer = window.setInterval(() => void load(), AUTO_REFRESH_MS);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
    };
  }, [load]);

  const grouped = useMemo(() => {
    if (!snapshot) return [];
    return GROUP_ORDER.map((group) => ({
      group,
      items: snapshot.chokepoints.filter((c) => c.group === group).sort((a, b) => (b.avg7 ?? 0) - (a.avg7 ?? 0)),
    })).filter((entry) => entry.items.length > 0);
  }, [snapshot]);

  const byName = useMemo(() => {
    const map = new Map<string, Chokepoint>();
    snapshot?.chokepoints.forEach((c) => map.set(c.id, c));
    return map;
  }, [snapshot]);

  const suez = byName.get("suez-canal")?.avg7 ?? null;
  const cape = byName.get("cape-of-good-hope")?.avg7 ?? null;
  const capeToSuez = suez !== null && cape !== null && suez > 0 ? cape / suez : null;
  const gapCount = snapshot?.chokepoints.filter((c) => c.ais === "GAP").length ?? 0;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-indigo-500/30 shadow-sm space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Anchor className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{lang === "zh" ? "咽喉点过境量 · 官方日度统计" : "Chokepoint Transit Volumes · Official Daily Statistics"}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-300/70 dark:border-indigo-800/70">
                IMF PORTWATCH
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === "zh"
                ? "IMF 官方日度过境统计 · 覆盖 28 个咽喉点 · 不依赖 AIS 覆盖"
                : "Official IMF daily transit statistics · 28 chokepoints · independent of AIS coverage"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {lang === "zh" ? "数据日期" : "Data as of"}
            </span>
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
              {snapshot?.latestDate ?? "--"}
            </span>
          </div>
          <button
            onClick={() => void load()}
            disabled={loading}
            title={lang === "zh" ? "立即刷新官方统计" : "Refresh official statistics"}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-500" : ""}`} />
          </button>
        </div>
      </div>

      {failed && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/70 dark:border-amber-800/70">
          <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
            <p className="font-bold">
              {lang === "zh"
                ? "官方统计暂不可用（离线预览或网络受限）"
                : "Official statistics unavailable (offline preview or network restricted)"}
            </p>
            <p className="text-amber-700/90 dark:text-amber-300/90">
              {lang === "zh"
                ? "本模块依赖 IMF PortWatch 在线接口；其余演示数据集照常显示，不受影响。"
                : "This module depends on the live IMF PortWatch service; the rest of the demo dataset renders unaffected."}
            </p>
          </div>
        </div>
      )}

      {snapshot && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {lang === "zh" ? "追踪咽喉点" : "Chokepoints tracked"}
            </span>
            <span className="font-mono text-lg font-extrabold text-slate-900 dark:text-white">
              {snapshot.chokepoints.length}
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {lang === "zh" ? "好望角 ÷ 苏伊士" : "Cape ÷ Suez"}
            </span>
            <span className="font-mono text-lg font-extrabold text-slate-900 dark:text-white">
              {capeToSuez === null ? "—" : `${capeToSuez.toFixed(2)}×`}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {lang === "zh" ? "绕行强度指示" : "rerouting indicator"}
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {lang === "zh" ? "苏伊士 7 日均值" : "Suez 7-day avg"}
            </span>
            <span className="font-mono text-lg font-extrabold text-slate-900 dark:text-white">{fmt(suez, 1)}</span>
            <span className="text-[10px] text-slate-400 block">{lang === "zh" ? "艘/日" : "calls/day"}</span>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {lang === "zh" ? "AIS 覆盖缺失" : "No AIS coverage"}
            </span>
            <span className="font-mono text-lg font-extrabold text-rose-600 dark:text-rose-400">{gapCount}</span>
            <span className="text-[10px] text-slate-400 block">
              {lang === "zh" ? "改由官方统计替代" : "covered by official stats"}
            </span>
          </div>
        </div>
      )}

      {loading && !snapshot ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : (
        snapshot && (
          <div className="space-y-4">
            <div className="hidden sm:grid grid-cols-[minmax(0,1.6fr)_104px_72px_92px_84px] gap-x-4 px-3 text-[10px] uppercase font-bold text-slate-400">
              <span>{lang === "zh" ? "咽喉点" : "Chokepoint"}</span>
              <span>{lang === "zh" ? `${snapshot.windowDays} 天走势` : `${snapshot.windowDays}-day trend`}</span>
              <span>{lang === "zh" ? "7 日均值" : "7-day avg"}</span>
              <span>{lang === "zh" ? "环比前 7 日" : "vs prior 7d"}</span>
              <span>{lang === "zh" ? "集装箱占比" : "Container share"}</span>
            </div>

            {grouped.map(({ group, items }) => (
              <div key={group} className="space-y-1">
                <div className="flex items-center gap-2 px-3 pt-2">
                  <Ship className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {lang === "zh" ? GROUP_LABEL[group].zh : GROUP_LABEL[group].en}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{items.length}</span>
                  <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                </div>
                {items.map((point) => (
                  <ChokepointRow key={point.id} point={point} lang={lang} />
                ))}
              </div>
            ))}
          </div>
        )
      )}

      <div className="flex flex-col gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
          <span>
            {lang === "zh"
              ? "口径：过境量 = 当日经该咽喉点的船舶航次数（PortWatch 依据 AIS 与港口靠泊记录推算），非在航船数。「环比」为最近 7 个已发布日与前 7 日均值之比。来源按周更新，最新日期通常滞后实测 3–7 天，且最近 1–2 天常因统计回补而偏低，读数时需留出修订空间。"
              : "Definition: transit calls = ships passing the chokepoint that day (PortWatch derives this from AIS plus port-call records), not vessels currently under way. \u201cvs prior\u201d compares the latest 7 published days against the 7 before. The series is published weekly and typically lags 3–7 days behind real time; the most recent 1–2 days also tend to read low before revisions land, so leave headroom when quoting them."}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>
            {lang === "zh"
              ? "「AIS 密集/稀疏/缺失」是基于社区岸基接收站分布的经验判断，不是 PortWatch 的字段，仅用于说明本模块为何对部分海域改用官方统计口径。"
              : "The \u201cAIS dense / sparse / no cover\u201d tag is an editorial read on terrestrial receiver density, not a PortWatch field. It exists to explain why this module switches to official statistics for certain waters."}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-slate-400 shrink-0">©</span>
          <span>
            {lang === "zh"
              ? "数据来源：IMF PortWatch《Daily Chokepoint Transit Calls and Shipment Volume Estimates》· 免费公开、浏览器可直连"
              : "Source: IMF PortWatch, \u201cDaily Chokepoint Transit Calls and Shipment Volume Estimates\u201d · open data, browser-direct"}
          </span>
        </div>
      </div>
    </section>
  );
};
