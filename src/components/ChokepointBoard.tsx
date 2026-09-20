/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Anchor, RefreshCw, WifiOff, Ship, Info, TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  fetchChokepoints,
  severityOf,
  sparklinePath,
  GROUP_LABEL,
  GROUP_ORDER,
  type Chokepoint,
  type ChokepointGroup,
  type ChokepointSeverity,
  type ChokepointSnapshot,
} from "../services/chokepoints";
import { SEVERITY_COLOR, SEVERITY_LABEL } from "./LiveMapLayer";

const AUTO_REFRESH_MS = 30 * 60 * 1000;

/**
 * Groups that should read as primary context. Red Sea / Suez describes why the
 * Cape is busy; the Cape anchors what "normal" looks like for a chokepoint
 * nobody is disrupting; the Cape's group also carries the rerouting benchmark.
 */
const DEFAULT_OPEN: ChokepointGroup[] = ["RED_SEA", "GULF"];

interface Props {
  onSnapshot?: (s: ChokepointSnapshot | null) => void;
  /** Lets the shared map dim everything outside the group being read. */
  onFocusGroup?: (group: string | null) => void;
}

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

const SeverityChip: React.FC<{ severity: ChokepointSeverity | null; pct: number | null; lang: "en" | "zh" }> = ({ severity, pct, lang }) => {
  if (!severity || pct === null) {
    return <span className="font-mono text-xs text-slate-400">—</span>;
  }
  const colour = SEVERITY_COLOR[severity];
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-xs font-bold"
      style={{ color: colour }}
      title={lang === "zh" ? "相对该咽喉点自身的战前常态" : "against this chokepoint's own pre-crisis norm"}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colour }} />
      {pct.toFixed(0)}%
      <span className="font-normal text-[10px] opacity-75">
        {SEVERITY_LABEL[severity][lang]}
      </span>
    </span>
  );
};

const ChokepointRow: React.FC<{ point: Chokepoint; lang: "en" | "zh" }> = ({ point, lang }) => {
  const path = useMemo(() => sparklinePath(point.series, 96, 22), [point.series]);
  const peakLabel = point.peak ? `${lang === "zh" ? "峰值" : "Peak"} ${point.peak.nTotal} · ${point.peak.date}` : "";

  return (
    <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[minmax(0,1.5fr)_96px_88px_104px_88px_80px] items-center gap-x-4 gap-y-2 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="min-w-0 flex items-center gap-2">
        <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
          {lang === "zh" ? point.nameZh : point.name}
        </span>
      </div>

      <svg
        viewBox="0 0 96 22"
        className="hidden sm:block w-[96px] h-[22px] overflow-visible"
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
        <SeverityChip severity={point.severity} pct={point.pctOfBaseline} lang={lang} />
      </div>

      <div className="hidden sm:block">
        <Delta pct={point.deltaPct} />
      </div>

      <div className="hidden sm:block text-[11px] font-mono text-slate-500 dark:text-slate-400">
        {point.containerSharePct === null ? "—" : `${point.containerSharePct.toFixed(0)}% ${lang === "zh" ? "集装箱" : "cont."}`}
      </div>

      {/* Mobile-only compact meta line */}
      <div className="col-span-2 flex flex-wrap items-center gap-3 sm:hidden text-[11px] font-mono text-slate-500 dark:text-slate-400">
        <SeverityChip severity={point.severity} pct={point.pctOfBaseline} lang={lang} />
        <Delta pct={point.deltaPct} />
        <span>
          {point.baseline === null ? "" : `${lang === "zh" ? "常态" : "norm"} ${point.baseline.toFixed(0)}/d`}
        </span>
      </div>
    </div>
  );
};

export const ChokepointBoard: React.FC<Props> = ({ onSnapshot, onFocusGroup }) => {
  const { language } = useLanguage();
  const lang = language;
  const [snapshot, setSnapshot] = useState<ChokepointSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<Set<ChokepointGroup>>(() => new Set(DEFAULT_OPEN));
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

  // Hand the snapshot up so the shared map can plot it
  useEffect(() => { onSnapshot?.(snapshot); }, [snapshot, onSnapshot]);

  const grouped = useMemo(() => {
    if (!snapshot) return [];
    return GROUP_ORDER.map((group) => {
      const items = snapshot.chokepoints
        .filter((c) => c.group === group)
        .sort((a, b) => (b.avg7 ?? 0) - (a.avg7 ?? 0));
      const total = items.reduce((s, c) => s + (c.avg7 ?? 0), 0);
      const withPct = items.filter((c) => c.pctOfBaseline !== null);
      return {
        group,
        items,
        total,
        pct: withPct.length ? withPct.reduce((s, c) => s + (c.pctOfBaseline ?? 0), 0) / withPct.length : null,
      };
    }).filter((entry) => entry.items.length > 0);
  }, [snapshot]);

  const byId = useMemo(() => {
    const map = new Map<string, Chokepoint>();
    snapshot?.chokepoints.forEach((c) => map.set(c.id, c));
    return map;
  }, [snapshot]);

  const suez = byId.get("suez-canal")?.avg7 ?? null;
  const cape = byId.get("cape-of-good-hope")?.avg7 ?? null;
  const capeToSuez = suez !== null && cape !== null && suez > 0 ? cape / suez : null;
  const hormuz = byId.get("strait-of-hormuz") ?? null;

  const belowNorm = snapshot?.chokepoints.filter((c) => c.severity === "SEVERE").length ?? 0;

  const toggle = (group: ChokepointGroup) => {
    const willOpen = !open.has(group);
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
    // Dim the other corridors on the shared map while a group is being read,
    // so opening a block visibly narrows the world map to that corridor.
    onFocusGroup?.(willOpen ? group : null);
  };

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
                ? "IMF 官方日度过境统计 · 覆盖 28 个咽喉点 · 卫星 AIS 与挂靠记录推算，不依赖岸基接收站"
                : "Official IMF daily transit statistics · 28 chokepoints · derived from satellite AIS and port-call records, independent of shore receivers"}
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
              {lang === "zh" ? "低于常态 30% 以上" : "Below 70% of own norm"}
            </span>
            <span className="font-mono text-lg font-extrabold text-rose-600 dark:text-rose-400">{belowNorm}</span>
            <span className="text-[10px] text-slate-400 block">
              {lang === "zh" ? `共 ${snapshot.chokepoints.length} 个` : `of ${snapshot.chokepoints.length}`}
            </span>
          </div>
        </div>
      )}

      {/* The single most important number on this panel, called out rather than
          left for the reader to spot inside a 28-row table. */}
      {hormuz && hormuz.pctOfBaseline !== null && (
        <div
          className="flex items-start gap-3 p-4 rounded-2xl border"
          style={{ borderColor: `${SEVERITY_COLOR[hormuz.severity ?? "NORMAL"]}66`, background: `${SEVERITY_COLOR[hormuz.severity ?? "NORMAL"]}14` }}
        >
          <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: SEVERITY_COLOR[hormuz.severity ?? "NORMAL"] }} />
          <div className="text-xs space-y-1 min-w-0">
            <p className="font-extrabold text-slate-800 dark:text-slate-100">
              {lang === "zh"
                ? `霍尔木兹海峡：${fmt(hormuz.avg7, 1)} 艘/日，为其常态（${fmt(hormuz.baseline, 1)} 艘/日）的 ${hormuz.pctOfBaseline.toFixed(0)}%`
                : `Strait of Hormuz: ${fmt(hormuz.avg7, 1)}/day — ${hormuz.pctOfBaseline.toFixed(0)}% of its own norm of ${fmt(hormuz.baseline, 1)}/day`}
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === "zh"
                ? "这里的数字来自 IMF 官方统计，据此该海峡处于近乎中断的状态；「环比」显示的回升（相对此前更低的基数）不代表已恢复正常。判断严重程度请以「相对常态」列为准。"
                : "This figure comes from the official IMF series and describes a near-total interruption; the week-on-week move is an uptick off a lower base, not a recovery. Read the \u201cvs own norm\u201d column to judge severity."}
            </p>
          </div>
        </div>
      )}

      {loading && !snapshot ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : (
        snapshot && (
          <div className="space-y-3">
            <div className="hidden sm:grid grid-cols-[minmax(0,1.5fr)_96px_88px_104px_88px_80px] gap-x-4 px-3 text-[10px] uppercase font-bold text-slate-400">
              <span>{lang === "zh" ? "咽喉点" : "Chokepoint"}</span>
              <span>{lang === "zh" ? `${snapshot.windowDays} 天走势` : `${snapshot.windowDays}-day trend`}</span>
              <span>{lang === "zh" ? "7 日均值" : "7-day avg"}</span>
              <span>{lang === "zh" ? "相对常态" : "vs own norm"}</span>
              <span>{lang === "zh" ? "环比前 7 日" : "vs prior 7d"}</span>
              <span>{lang === "zh" ? "集装箱占比" : "Container share"}</span>
            </div>

            {/* One collapsible block per corridor: 28 flat rows is a wall, and the
                groups are how an analyst actually reads this table. */}
            {grouped.map(({ group, items, total, pct }) => {
              const isOpen = open.has(group);
              const groupSeverity = severityOf(pct);
              return (
                <div key={group} className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <button
                    onClick={() => toggle(group)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors text-left"
                  >
                    <ChevronRight className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                    <Ship className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-300 truncate">
                      {lang === "zh" ? GROUP_LABEL[group].zh : GROUP_LABEL[group].en}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">{items.length}</span>
                    <span className="flex-1" />
                    <span className="hidden sm:inline-flex items-center gap-3 shrink-0 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span>{lang === "zh" ? "合计" : "total"} {total.toFixed(0)}/d</span>
                      {groupSeverity && pct !== null && (
                        <span className="inline-flex items-center gap-1 font-bold" style={{ color: SEVERITY_COLOR[groupSeverity] }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEVERITY_COLOR[groupSeverity] }} />
                          {pct.toFixed(0)}%
                        </span>
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {items.map((point) => (
                        <ChokepointRow key={point.id} point={point} lang={lang} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      <div className="flex flex-col gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
          <span>
            {lang === "zh"
              ? `口径：过境量 = 当日经该咽喉点的船舶航次数（同一次过境只计一次，同一船 48 小时内不重复计），非在航船数。IMF PortWatch 以卫星 AIS 与港口靠泊记录推算，因此本表数值与岸基接收站覆盖无关 —— 岸基 AIS 在部分海域稀疏，只影响本作品集「近岸 AIS」面板能否显示船位，不影响本表任何一行。`
              : "Definition: transit calls = ships passing the chokepoint that day (a multi-day transit counts once; the same ship is not recounted within 48 hours), not vessels under way. PortWatch derives them from satellite AIS plus port-call records, so nothing in this table depends on shore-receiver density — thin terrestrial coverage only limits whether the Near-shore AIS panel can plot positions, never a row here."}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>
            {lang === "zh"
              ? `「相对常态」= 最近 7 日均值 ÷ 该咽喉点自身常态。常态取 ${snapshot?.baselineWindow.start ?? "2025-08-01"} 至 ${snapshot?.baselineWindow.end ?? "2026-02-27"} 的日均值（本轮危机爆发前的 7 个月），来自同一数据源，因此同一行内的比较是自洽的。分级：<70% 严重、70–90% 承压、90–115% 常态、>115% 激增。`
              : `\u201cVs own norm\u201d = trailing 7-day mean ÷ that chokepoint's own baseline. The baseline is the daily mean over ${snapshot?.baselineWindow.start ?? "2025-08-01"} to ${snapshot?.baselineWindow.end ?? "2026-02-27"} — the seven months before the present crisis — read from the same series, so the comparison inside a row is internally consistent. Bands: <70% severe, 70–90% stressed, 90–115% normal, >115% surge.`}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>
            {lang === "zh"
              ? "「环比前 7 日」只看最近 14 天，在低位时容易被放大：一条航线从 3 艘/日涨到 5 艘/日显示为 +67%，但仍是常态的 7%。判断趋势方向可用它，判断严重程度请用「相对常态」。来源按周更新，最新日期通常滞后实测 3–7 天，且最近 1–2 天常因统计回补而偏低。"
              : "\u201cVs prior 7d\u201d looks at only the last 14 days and amplifies easily at low levels: a lane going from 3 to 5 calls/day prints as +67% while still sitting at 7% of normal. Use it for direction, use \u201cvs own norm\u201d for severity. The series is published weekly, typically lags 3–7 days behind real time, and the most recent 1–2 days tend to read low before revisions land."}
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
