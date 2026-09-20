/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Globe2, ZoomIn, Maximize2, ShieldAlert } from "lucide-react";
import {
  WORLD_LAND_PATH,
  WORLD_VIEWBOX_W as VW,
  WORLD_VIEWBOX_H as VH,
  projectLonLat,
} from "../data/worldMap";
import { TRACKED_PORTS } from "../data/ports";
import type { Chokepoint, ChokepointSeverity } from "../services/chokepoints";
import type { AisSnapshot, VesselCategory } from "../services/ais";
import type { PortWeatherSnapshot, MarineRisk } from "../services/weather";

export type LiveTab = "chokepoints" | "vessels" | "ports";

/** Severity palette — shared with the table so a colour means one thing app-wide. */
export const SEVERITY_COLOR: Record<ChokepointSeverity, string> = {
  SEVERE: "#e11d48",
  STRESSED: "#f59e0b",
  NORMAL: "#10b981",
  SURGE: "#6366f1",
};

export const SEVERITY_LABEL: Record<ChokepointSeverity, { en: string; zh: string }> = {
  SEVERE: { en: "Severe", zh: "严重" },
  STRESSED: { en: "Stressed", zh: "承压" },
  NORMAL: { en: "Normal", zh: "常态" },
  SURGE: { en: "Surge", zh: "激增" },
};

const RISK_COLOR: Record<MarineRisk, string> = {
  CALM: "#10b981",
  WATCH: "#f59e0b",
  ALERT: "#e11d48",
};

const VESSEL_COLOR: Record<VesselCategory, string> = {
  CARGO: "#4f46e5",
  TANKER: "#d97706",
  PASSENGER: "#0284c7",
  TUG: "#64748b",
  OTHER: "#94a3b8",
};

interface Props {
  tab: LiveTab;
  lang: "en" | "zh";
  chokepoints: Chokepoint[] | null;
  ais: AisSnapshot | null;
  ports: PortWeatherSnapshot | null;
  /** Chokepoint group highlighted from the table, if any. */
  focusGroup: string | null;
  /** True when the vessel tab is zoomed to the AIS footprint. */
  zoomed: boolean;
  onToggleZoom: (next: boolean) => void;
}

type Mark =
  | { kind: "chokepoint"; cp: Chokepoint; x: number; y: number }
  | { kind: "port"; code: string; name: string; risk: MarineRisk; x: number; y: number }
  | { kind: "vessel"; mmsi: number; name: string | null; cat: VesselCategory; sog: number | null; dest: string | null; x: number; y: number };

export const LiveMapLayer: React.FC<Props> = ({
  tab, lang, chokepoints, ais, ports, focusGroup, zoomed, onToggleZoom,
}) => {
  const zh = lang === "zh";

  /**
   * Markers and labels are drawn in viewBox units, but they have to stay a
   * constant size on screen — otherwise the 3600-unit world map squashes every
   * label down to ~5px, and zooming to the Baltic blows them up to 20px. So
   * measure the rendered width and derive "how many viewBox units is one CSS
   * pixel"; every non-geographic dimension is then expressed in pixels.
   */
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pxWidth, setPxWidth] = useState(1080);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (typeof ResizeObserver === "undefined") {
      setPxWidth(el.clientWidth || 1080);
      return;
    }
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w && w > 0) setPxWidth(w);
    });
    ro.observe(el);
    if (el.clientWidth) setPxWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  /** World view, or a framed viewport around the AIS footprint. */
  const view = useMemo(() => {
    if (tab === "vessels" && zoomed && ais?.bbox) {
      const b = ais.bbox;
      const a = projectLonLat(b.minLon, b.maxLat);
      const c = projectLonLat(b.maxLon, b.minLat);
      let x = a.x, y = a.y, w = c.x - a.x, h = c.y - a.y;
      // Keep a minimum span so the 110m coastline is not magnified into blocks.
      const MIN_SPAN = VW * 0.10;
      if (w < MIN_SPAN) { const d = (MIN_SPAN - w) / 2; x -= d; w = MIN_SPAN; }
      if (h < MIN_SPAN * 0.6) { const d = (MIN_SPAN * 0.6 - h) / 2; y -= d; h = MIN_SPAN * 0.6; }
      const padX = w * 0.12, padY = h * 0.12;
      return { x: x - padX, y: y - padY, w: w + padX * 2, h: h + padY * 2 };
    }
    return { x: 0, y: 0, w: VW, h: VH };
  }, [tab, zoomed, ais]);

  /** viewBox units per CSS pixel — the conversion for every screen-sized feature. */
  const u = view.w / Math.max(pxWidth, 1);
  const px = useCallback((n: number) => n * u, [u]);

  const marks = useMemo<Mark[]>(() => {
    const out: Mark[] = [];
    if (tab === "chokepoints" && chokepoints) {
      for (const cp of chokepoints) {
        if (!cp.lat && !cp.lng) continue;
        const { x, y } = projectLonLat(cp.lng, cp.lat);
        out.push({ kind: "chokepoint", cp, x, y });
      }
    } else if (tab === "ports" && ports) {
      for (const p of ports.ports) {
        const ref = TRACKED_PORTS.find((r) => r.code === p.code);
        if (!ref) continue;
        const { x, y } = projectLonLat(ref.lng, ref.lat);
        out.push({ kind: "port", code: p.code, name: zh ? p.nameZh : p.name, risk: p.risk, x, y });
      }
    } else if (tab === "vessels" && ais) {
      for (const v of ais.vessels) {
        const { x, y } = projectLonLat(v.lon, v.lat);
        out.push({ kind: "vessel", mmsi: v.mmsi, name: v.name, cat: v.category, sog: v.sog, dest: v.destination, x, y });
      }
    }
    return out;
  }, [tab, chokepoints, ports, ais, zh]);

  /**
   * Labels are rationed, twice over.
   *
   * First by importance: on a world map 28 chokepoint names collide into noise,
   * so only the passages a reader needs are candidates — anything off its norm,
   * plus the busiest few. Ports are ranked by risk.
   *
   * Then by screen-space collision: Shanghai and Ningbo sit ~5px apart at world
   * scale, so their names can never both fit. This greedily places labels in
   * priority order and drops whichever would overlap an already-placed one —
   * which is why the map is quiet instead of a pile of words.
   */
  const labelSet = useMemo(() => {
    const keep = new Set<string>();
    const placed: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const fontSize = px(11);
    const lineH = px(13);

    const fits = (x: number, y: number, text: string) => {
      const w = text.length * fontSize * 0.56;
      const box = { x1: x, y1: y - lineH / 2, x2: x + w, y2: y + lineH / 2 };
      const hit = placed.some(
        (q) => !(box.x2 < q.x1 || box.x1 > q.x2 || box.y2 < q.y1 || box.y1 > q.y2),
      );
      if (!hit) placed.push(box);
      return !hit;
    };

    if (tab === "chokepoints" && chokepoints) {
      const rank: Record<string, number> = { SEVERE: 0, STRESSED: 1 };
      const ordered = [...chokepoints].sort((a, b) => {
        const ra = rank[a.severity ?? ""] ?? (a.avg7 ?? 0) > 150 ? 2 : 3;
        const rb = rank[b.severity ?? ""] ?? (b.avg7 ?? 0) > 150 ? 2 : 3;
        if (ra !== rb) return ra - rb;
        return (b.avg7 ?? 0) - (a.avg7 ?? 0);
      });
      for (const cp of ordered) {
        if (!cp.lat && !cp.lng) continue;
        const { x, y } = projectLonLat(cp.lng, cp.lat);
        const r = px(5 + Math.min(17, Math.sqrt(Math.max(cp.avg7 ?? 0, 0)) * 0.9));
        const text = `${zh ? cp.nameZh : cp.name} · ${cp.pctOfBaseline === null ? "—" : `${cp.pctOfBaseline.toFixed(0)}%`}`;
        if (fits(x + r + px(6), y + px(4), text)) keep.add(cp.id);
      }
    } else if (tab === "ports" && ports) {
      const rank: Record<MarineRisk, number> = { ALERT: 0, WATCH: 1, CALM: 2 };
      const ordered = [...ports.ports].sort((a, b) => rank[a.risk] - rank[b.risk]);
      for (const p of ordered) {
        const ref = TRACKED_PORTS.find((r) => r.code === p.code);
        if (!ref) continue;
        const { x, y } = projectLonLat(ref.lng, ref.lat);
        const text = zh ? p.nameZh : p.name;
        if (fits(x + px(9) / 2 + px(4), y + px(4), text)) keep.add(p.code);
      }
    }
    return keep;
  }, [tab, chokepoints, ports, zh, px]);

  const aisBox = useMemo(() => {
    if (!ais?.bbox) return null;
    const a = projectLonLat(ais.bbox.minLon, ais.bbox.maxLat);
    const c = projectLonLat(ais.bbox.maxLon, ais.bbox.minLat);
    return { x: a.x, y: a.y, w: c.x - a.x, h: c.y - a.y };
  }, [ais]);

  const radius = (cp: Chokepoint) => {
    const v = cp.avg7 ?? 0;
    // 5–22 CSS px, so the busiest lane reads as a blob and a quiet strait as a dot
    return px(5 + Math.min(17, Math.sqrt(Math.max(v, 0)) * 0.9));
  };

  return (
    <div
      ref={wrapRef}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <Globe2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate">
            {tab === "chokepoints"
              ? zh ? "全球咽喉点 · 相对常态" : "World chokepoints · vs own norm"
              : tab === "vessels"
                ? zh ? "近岸 AIS 船位 · 实时" : "Near-shore AIS positions · live"
                : zh ? "枢纽港 · 实时风浪" : "Hub ports · live wind & sea"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {tab === "chokepoints" && (["SEVERE", "STRESSED", "NORMAL", "SURGE"] as ChokepointSeverity[]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLOR[s] }} />
              {SEVERITY_LABEL[s][lang]}
            </span>
          ))}
          {tab === "ports" && (["ALERT", "WATCH", "CALM"] as MarineRisk[]).map((r) => (
            <span key={r} className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full" style={{ background: RISK_COLOR[r] }} />
              {r === "ALERT" ? (zh ? "警戒" : "Alert") : r === "WATCH" ? (zh ? "注意" : "Monitor") : zh ? "正常" : "Normal"}
            </span>
          ))}
          {tab === "vessels" && (
            <button
              onClick={() => onToggleZoom(!zoomed)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:border-emerald-400 text-slate-600 dark:text-slate-300 text-[10px] font-semibold transition-colors"
            >
              {zoomed ? <Globe2 className="w-3 h-3" /> : <ZoomIn className="w-3 h-3" />}
              {zoomed ? (zh ? "回到全球视角" : "World view") : zh ? "聚焦覆盖区" : "Zoom to footprint"}
            </button>
          )}
        </div>
      </div>

      <svg
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={zh ? "实时数据地图层" : "Live data map layer"}
      >
        {/* Sea */}
        <rect x={view.x} y={view.y} width={view.w} height={view.h} className="fill-sky-50 dark:fill-slate-950" />

        {/* Land — real Natural Earth outline, inlined so the map never needs a tile server */}
        <path
          d={WORLD_LAND_PATH}
          className="fill-slate-200/90 dark:fill-slate-800/90 stroke-slate-300 dark:stroke-slate-700"
          strokeWidth={px(0.8)}
        />

        {/* Equator, as a quiet orientation cue */}
        {(() => { const { y } = projectLonLat(0, 0); return (
          <line x1={view.x} x2={view.x + view.w} y1={y} y2={y}
                className="stroke-slate-300/60 dark:stroke-slate-700/60"
                strokeDasharray={`${px(4)} ${px(5)}`} strokeWidth={px(0.8)} />
        ); })()}

        {/*
          The open AIS feed only reaches the Baltic, so its footprint is drawn
          on every tab rather than only where it is incidental — an empty world
          map must never be mistaken for an empty sea. On the vessel tab it is
          suppressed only while zoomed, because then the footprint *is* the
          viewport and the caption would fall outside the viewBox.
        */}
        {aisBox && (tab !== "vessels" || !zoomed) && (
          <g>
            <rect
              x={aisBox.x} y={aisBox.y} width={aisBox.w} height={aisBox.h}
              fill="none" stroke="#10b981" strokeWidth={px(1.2)}
              strokeDasharray={`${px(5)} ${px(4)}`} opacity="0.6"
            />
            <text
              x={aisBox.x + aisBox.w + px(6)} y={aisBox.y + px(4)}
              className="fill-emerald-600 dark:fill-emerald-400"
              fontSize={px(10)} fontWeight="700"
              stroke="rgba(255,255,255,.85)" strokeWidth={px(3)} paintOrder="stroke"
            >
              {tab === "vessels"
                ? zh
                  ? `实时覆盖：${ais?.coverageLabelZh ?? ""}`
                  : `live extent: ${ais?.coverageLabelEn ?? ""}`
                : zh
                  ? "开放 AIS 覆盖区"
                  : "open AIS footprint"}
            </text>
          </g>
        )}

        {/* Chokepoint marks */}
        {marks.filter((m) => m.kind === "chokepoint").map((m) => {
          const cp = (m as Extract<Mark, { kind: "chokepoint" }>).cp;
          const colour = cp.severity ? SEVERITY_COLOR[cp.severity] : "#94a3b8";
          const dim = focusGroup && cp.group !== focusGroup;
          const r = radius(cp);
          const pct = cp.pctOfBaseline === null ? "—" : `${cp.pctOfBaseline.toFixed(0)}%`;
          return (
            <g key={cp.id} opacity={dim ? 0.22 : 1}>
              <circle cx={m.x} cy={m.y} r={r} fill={colour} fillOpacity={0.28} stroke={colour} strokeWidth={px(1.4)} />
              <circle cx={m.x} cy={m.y} r={px(1.8)} fill={colour} />
              {labelSet.has(cp.id) && (
                <text
                  x={m.x + r + px(6)} y={m.y + px(4)}
                  className="fill-slate-700 dark:fill-slate-200"
                  fontSize={px(11)} fontWeight="700"
                  stroke="rgba(255,255,255,.85)" strokeWidth={px(3.4)} paintOrder="stroke"
                >
                  {(zh ? cp.nameZh : cp.name)} · {pct}
                </text>
              )}
              <title>
                {`${zh ? cp.nameZh : cp.name}\n` +
                 `${zh ? "7 日均值" : "7-day avg"}: ${cp.avg7?.toFixed(1) ?? "—"}/d\n` +
                 `${zh ? "常态基线" : "own norm"}: ${cp.baseline?.toFixed(1) ?? "—"}/d\n` +
                 `${zh ? "相对常态" : "vs norm"}: ${pct}\n` +
                 `${zh ? "环比前 7 日" : "vs prior 7d"}: ${cp.deltaPct === null ? "—" : `${cp.deltaPct > 0 ? "+" : ""}${cp.deltaPct.toFixed(1)}%`}`}
              </title>
            </g>
          );
        })}

        {/* Port marks */}
        {marks.filter((m) => m.kind === "port").map((m) => {
          const p = m as Extract<Mark, { kind: "port" }>;
          const colour = RISK_COLOR[p.risk];
          const s = px(9);
          const showLabel = labelSet.has(p.code);
          return (
            <g key={p.code}>
              <rect x={p.x - s / 2} y={p.y - s / 2} width={s} height={s} rx={px(2)} fill={colour} fillOpacity={0.35} stroke={colour} strokeWidth={px(1.3)} />
              {showLabel && (
                <text
                  x={p.x + s / 2 + px(4)} y={p.y + px(4)}
                  className="fill-slate-700 dark:fill-slate-200"
                  fontSize={px(11)} fontWeight="700"
                  stroke="rgba(255,255,255,.85)" strokeWidth={px(3.4)} paintOrder="stroke"
                >
                  {p.name}
                </text>
              )}
              <title>{`${p.code} · ${p.name}\n${p.risk}`}</title>
            </g>
          );
        })}

        {/* Vessel marks */}
        {marks.filter((m) => m.kind === "vessel").map((m) => {
          const v = m as Extract<Mark, { kind: "vessel" }>;
          const r = px(2 + Math.min(3, (v.sog ?? 0) / 10));
          return (
            <circle key={v.mmsi} cx={v.x} cy={v.y} r={r} fill={VESSEL_COLOR[v.cat]} opacity={v.cat === "OTHER" ? 0.45 : 0.85}>
              <title>
                {(v.name ?? `MMSI ${v.mmsi}`) +
                  ` · ${v.sog === null ? "—" : `${v.sog.toFixed(1)} kn`}` +
                  (v.dest ? ` → ${v.dest}` : "")}
              </title>
            </circle>
          );
        })}
      </svg>

      {/*
        Coverage scope, stated rather than implied.

        This canvas draws the whole world, but the free AIS feed behind it
        reaches one basin. Left unsaid, a tight cluster of dots over the Baltic
        reads as a broken map — so the three tiers are named outright: what is
        live here, what a self-hosted proxy would add, and what no free feed can
        ever reach. The third tier is the honest part: the corridors this
        portfolio is actually about are exactly the ones community receivers
        cannot hear, so a reader must not mistake silence for an empty sea.
      */}
      {tab === "vessels" && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 border-t border-slate-200/80 dark:border-slate-800">
          <span
            className="inline-flex items-center gap-1.5 text-[10px]"
            title={
              zh
                ? "免密钥且允许浏览器直连的开放 AIS 源只有芬兰 Digitraffic 一家，因此本页显示的就是它能覆盖的全部范围。"
                : "Only one open AIS feed is both key-less and browser-callable (Finland's Digitraffic), so what you see here is the whole of its extent."
            }
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{zh ? "本页实时" : "Live here"}</span>
            <span className="text-slate-600 dark:text-slate-300">
              {(zh ? ais?.coverageLabelZh : ais?.coverageLabelEn) ?? "—"}
            </span>
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-[10px]"
            title={
              zh
                ? "仓库内已附 workers/ais-proxy（Cloudflare Worker + aisstream.io 免费密钥）。部署后本页自动切换，密钥留在服务端、不进前端。"
                : "This repo ships workers/ais-proxy (a Cloudflare Worker plus a free aisstream.io key). Deploy it and this page switches over automatically, with the key staying server-side."
            }
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className="font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{zh ? "自建代理可达" : "With a proxy"}</span>
            <span className="text-slate-600 dark:text-slate-300">
              {zh ? "北海 · 地中海 · 马六甲 · 英吉利海峡" : "North Sea · Mediterranean · Malacca · English Channel"}
            </span>
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-[10px]"
            title={
              zh
                ? "社区岸基 AIS 实测：波斯湾/霍尔木兹 0 艘、阿曼湾 0 艘、红海/曼德海峡 0 艘（2026-07-27 复测）；船舶离岸超过约 40 海里即从岸基 feed 中消失。只有卫星 AIS（Spire / Kpler / MarineTraffic，约 $2k–8k/月）覆盖这些海域。"
                : "Measured on community terrestrial AIS: Persian Gulf / Strait of Hormuz 0 vessels, Gulf of Oman 0, Red Sea / Bab el-Mandeb 0 (re-verified 2026-07-27); hulls more than ~40 nm offshore drop out of the feed entirely. Only satellite AIS (Spire / Kpler / MarineTraffic, roughly $2k–8k/month) reaches these waters."
            }
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{zh ? "仅卫星 AIS" : "Satellite only"}</span>
            <span className="text-slate-600 dark:text-slate-300">
              {zh ? "红海 · 亚丁湾 · 波斯湾" : "Red Sea · Gulf of Aden · Persian Gulf"}
            </span>
          </span>
        </div>
      )}

      {/* Provenance strip: every mark on this canvas, named at the point of use */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 border-t border-slate-200/80 dark:border-slate-800 text-[10px] font-mono text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Maximize2 className="w-3 h-3" />
          {tab === "vessels" && zoomed && ais?.bbox
            ? `${ais.bbox.minLat.toFixed(1)}°–${ais.bbox.maxLat.toFixed(1)}°N · ${ais.bbox.minLon.toFixed(1)}°–${ais.bbox.maxLon.toFixed(1)}°E`
            : `${zh ? "全球视野" : "world view"} · Mercator`}
        </span>
        {tab === "chokepoints" && (
          <span className="inline-flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            {zh ? "圆面积 ∝ 7 日均过境量 · 颜色 = 相对自身常态" : "area ∝ 7-day transits · colour = vs own norm"}
          </span>
        )}
        <span className="ml-auto">{zh ? "底图：Natural Earth 110m（公有领域）" : "Basemap: Natural Earth 110m (public domain)"}</span>
      </div>
    </div>
  );
};
