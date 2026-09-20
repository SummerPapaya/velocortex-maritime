/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Radar, RefreshCw, WifiOff, Navigation, Info, Ship, Droplets, Users, Wrench, ExternalLink } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { fetchAisSnapshot, hasGlobalAisProxy, type AisSnapshot, type VesselCategory } from "../services/ais";

const AUTO_REFRESH_MS = 5 * 60 * 1000;

const CATEGORY_STYLE: Record<VesselCategory, { dot: string; chip: string; labelEn: string; labelZh: string }> = {
  CARGO: {
    dot: "#4f46e5",
    chip: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300/70 dark:border-indigo-800/70",
    labelEn: "Cargo",
    labelZh: "货船",
  },
  TANKER: {
    dot: "#d97706",
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/70 dark:border-amber-800/70",
    labelEn: "Tanker",
    labelZh: "油轮",
  },
  PASSENGER: {
    dot: "#0284c7",
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border-sky-300/70 dark:border-sky-800/70",
    labelEn: "Passenger",
    labelZh: "客船",
  },
  TUG: {
    dot: "#64748b",
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300/70 dark:border-slate-700",
    labelEn: "Tug / service",
    labelZh: "拖轮/作业",
  },
  OTHER: {
    dot: "#94a3b8",
    chip: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300/70 dark:border-slate-700",
    labelEn: "Other",
    labelZh: "其他",
  },
};

const CATEGORY_ORDER: VesselCategory[] = ["CARGO", "TANKER", "PASSENGER", "TUG", "OTHER"];

/**
 * Where the open-data picture stops, the commercial one continues. These are
 * the vendors whose satellite AIS actually reaches the Red Sea, Gulf of Aden
 * and Persian Gulf — the corridors terrestrial receivers leave blank.
 *
 * They are linked, never called: all three are licensed data products with no
 * key-less public endpoint and terms that forbid browser-side extraction, so
 * wiring them in would mean a paid contract plus a server-side proxy. Linking
 * out keeps the boundary explicit instead of silently showing nothing.
 */
const COMMERCIAL_AIS_VENDORS = [
  {
    name: "MarineTraffic",
    url: "https://www.marinetraffic.com/",
    noteEn: "Terrestrial + satellite AIS, port calls, vessel particulars",
    noteZh: "岸基 + 卫星 AIS、挂靠、船舶档案",
  },
  {
    name: "HiFleet 船队在线",
    url: "https://www.hifleet.com/",
    noteEn: "3,000+ shore stations and 58 AIS satellites per vendor",
    noteZh: "官方口径：3000+ 岸基站、58 颗 AIS 卫星",
  },
  {
    name: "船讯网 Shipxy",
    url: "https://www.shipxy.com/",
    noteEn: "Chinese-language console, area and track APIs",
    noteZh: "中文控制台，提供区域与轨迹 API",
  },
];

/** Equirectangular projection with a latitude correction so the basin is not stretched. */

export const NearshoreAis: React.FC<{ onSnapshot?: (s: AisSnapshot | null) => void }> = ({ onSnapshot }) => {
  const { language } = useLanguage();
  const lang = language;
  const [snapshot, setSnapshot] = useState<AisSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchAisSnapshot();
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

  // Hand the snapshot up so the shared map layer can plot the positions
  useEffect(() => { onSnapshot?.(snapshot); }, [snapshot, onSnapshot]);

  const movers = useMemo(() => {
    if (!snapshot) return [];
    return [...snapshot.vessels]
      .filter((v) => (v.sog ?? 0) >= 3)
      .sort((a, b) => (b.sog ?? 0) - (a.sog ?? 0))
      .slice(0, 8);
  }, [snapshot]);

  const fetchedLabel = snapshot
    ? new Date(snapshot.fetchedAt).toLocaleTimeString(lang === "zh" ? "zh-CN" : "en-GB", { hour12: false })
    : "--:--:--";

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-emerald-500/30 shadow-sm space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Radar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{lang === "zh" ? "近岸 AIS 船位 · 实测实时" : "Nearshore AIS Vessel Positions · Live"}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-800/70 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                LIVE
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {snapshot
                ? `${lang === "zh" ? "覆盖范围" : "Extent"}: ${lang === "zh" ? snapshot.coverageLabelZh : snapshot.coverageLabelEn} · ${
                    lang === "zh" ? "来源" : "Source"
                  }: ${snapshot.sourceName}`
                : lang === "zh"
                  ? "正在连接开放 AIS 接口…"
                  : "Connecting to the open AIS feed…"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {lang === "zh" ? "最近拉取" : "Last fetched"}
            </span>
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{fetchedLabel}</span>
          </div>
          <button
            onClick={() => void load()}
            disabled={loading}
            title={lang === "zh" ? "立即刷新 AIS 船位" : "Refresh AIS positions now"}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-500" : ""}`} />
          </button>
        </div>
      </div>

      {failed && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/70 dark:border-amber-800/70">
          <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
            <p className="font-bold">
              {lang === "zh"
                ? "AIS 船位暂不可用（离线预览或网络受限）"
                : "AIS positions unavailable (offline preview or network restricted)"}
            </p>
            <p className="text-amber-700/90 dark:text-amber-300/90">
              {lang === "zh"
                ? "本模块依赖开放 AIS 接口；其余演示数据集照常显示，不受影响。"
                : "This module depends on the open AIS feed; the rest of the demo dataset renders unaffected."}
            </p>
          </div>
        </div>
      )}

      {snapshot && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {lang === "zh" ? "在线船舶" : "Vessels reporting"}
            </span>
            <span className="font-mono text-lg font-extrabold text-slate-900 dark:text-white">{snapshot.total}</span>
            <span className="text-[10px] text-slate-400 block">{lang === "zh" ? "最近一次定位" : "latest position"}</span>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {lang === "zh" ? "航行中 (≥1 kn)" : "Under way (≥1 kn)"}
            </span>
            <span className="font-mono text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{snapshot.underway}</span>
            <span className="text-[10px] text-slate-400 block">
              {snapshot.total > 0 ? `${((snapshot.underway / snapshot.total) * 100).toFixed(0)}%` : "—"}{" "}
              {lang === "zh" ? "在航" : "moving"}
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {lang === "zh" ? "货船 / 油轮" : "Cargo / tanker"}
            </span>
            <span className="font-mono text-lg font-extrabold text-slate-900 dark:text-white">
              {snapshot.byCategory.CARGO} / {snapshot.byCategory.TANKER}
            </span>
            <span className="text-[10px] text-slate-400 block">{lang === "zh" ? "AIS 船型码 7x / 8x" : "AIS type codes 7x / 8x"}</span>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {lang === "zh" ? "最快航速" : "Fastest hull"}
            </span>
            <span className="font-mono text-lg font-extrabold text-slate-900 dark:text-white">
              {movers[0]?.sog ? `${movers[0].sog.toFixed(1)} kn` : "—"}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">{movers[0]?.name ?? "—"}</span>
          </div>
        </div>
      )}

      {/*
        The positions themselves are drawn on the shared map layer above, which
        gives them real coastlines to sit against and lets the same canvas be
        reused by the other two feeds. This panel keeps the numbers and the
        vessel list.
      */}
      {loading && !snapshot ? (
        <div className="h-[180px] rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
      ) : (
        snapshot && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {lang === "zh" ? "航行中最快的船舶" : "Fastest vessels under way"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORY_ORDER.filter((c) => snapshot.byCategory[c] > 0).map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_STYLE[c].dot }} />
                    {lang === "zh" ? CATEGORY_STYLE[c].labelZh : CATEGORY_STYLE[c].labelEn}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              {lang === "zh"
                ? `船位已绘制在上方地图层 · ${snapshot.bbox.minLat.toFixed(1)}°–${snapshot.bbox.maxLat.toFixed(1)}°N · ${snapshot.bbox.minLon.toFixed(1)}°–${snapshot.bbox.maxLon.toFixed(1)}°E`
                : `positions are drawn on the map layer above · ${snapshot.bbox.minLat.toFixed(1)}°–${snapshot.bbox.maxLat.toFixed(1)}°N · ${snapshot.bbox.minLon.toFixed(1)}°–${snapshot.bbox.maxLon.toFixed(1)}°E`}
            </p>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {movers.map((v) => (
                  <div key={v.mmsi} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {v.name ?? `MMSI ${v.mmsi}`}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {v.destination ? `→ ${v.destination}` : `MMSI ${v.mmsi}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${CATEGORY_STYLE[v.category].chip}`}>
                        {lang === "zh" ? CATEGORY_STYLE[v.category].labelZh : CATEGORY_STYLE[v.category].labelEn}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 w-14 text-right">
                        {v.sog === null ? "—" : `${v.sog.toFixed(1)} kn`}
                      </span>
                    </div>
                  </div>
                ))}
                {movers.length === 0 && (
                  <p className="text-xs text-slate-400 py-3">
                    {lang === "zh" ? "当前没有 ≥3 kn 的船舶。" : "No vessels above 3 kn right now."}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 text-[10px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Ship className="w-3 h-3" /> {snapshot.byCategory.CARGO} {lang === "zh" ? "货船" : "cargo"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Droplets className="w-3 h-3" /> {snapshot.byCategory.TANKER} {lang === "zh" ? "油轮" : "tanker"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3 h-3" /> {snapshot.byCategory.PASSENGER} {lang === "zh" ? "客船" : "pax"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> {snapshot.byCategory.TUG} {lang === "zh" ? "拖轮" : "tug"}
                </span>
              </div>
          </div>
        )
      )}

      <div className="flex flex-col gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            {snapshot
              ? lang === "zh"
                ? snapshot.coverageNoteZh
                : snapshot.coverageNoteEn
              : lang === "zh"
                ? "等待数据…"
                : "Awaiting data…"}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>
            {hasGlobalAisProxy()
              ? lang === "zh"
                ? "当前已接入自建代理，密钥保留在服务端，前端不含任何凭据。"
                : "A server-side proxy is configured; the provider key stays on the server and no credential ships to the client."
              : lang === "zh"
                ? "全球船位需要自建服务端代理——仓库内已附 workers/ais-proxy（Cloudflare Worker + aisstream.io 免费密钥），部署后本页自动切换，密钥留在服务端。但要把这笔账算清楚：社区岸基网络实测在波斯湾/霍尔木兹、阿曼湾、红海/曼德海峡均为 0 艘（2026-07-27 复测），船舶离岸超过约 40 海里即从岸基 feed 中消失。也就是说，本作品集最关心的三条通道，恰是免费 AIS 听不到的海域——它们只有卫星 AIS（Spire / Kpler / MarineTraffic，约 $2k–8k/月）能覆盖。免密钥的开放 AIS 源只有芬兰 Digitraffic 一家，其覆盖就是波罗的海本身。另：集装箱箱号、冷箱温度、清关状态属于船司 EDI 范畴，任何 AIS 源（含卫星）都无法提供。"
                : "Global positions need your own server-side proxy — this repo ships workers/ais-proxy (a Cloudflare Worker plus a free aisstream.io key); deploy it and this page switches over automatically, key staying server-side. Be clear about what that buys, though: the community terrestrial network measured zero vessels in the Persian Gulf / Strait of Hormuz, the Gulf of Oman and the Red Sea / Bab el-Mandeb (re-verified 2026-07-27), and hulls more than ~40 nm offshore drop out of the feed entirely. The three corridors this portfolio is actually about are precisely the waters free AIS cannot hear — they are covered only by satellite AIS (Spire / Kpler / MarineTraffic, roughly $2k–8k/month). The only key-less open AIS feed is Finland's Digitraffic, and its extent is the Baltic itself. Separately: container numbers, reefer temperatures and customs status come from carrier EDI, which no AIS feed — satellite included — can supply."}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>
            {lang === "zh"
              ? "数据清洗：AIS 会把「不可用」编码为哨兵值（航速 102.3 kn、航向 360.0°），部分应答器还会上报超过船舶物理极限的航速。这些值一律按无效处理、显示为「—」，因此「最快航速」不会出现离谱读数。船型按 AIS 代码粗分为货船（7x）/油轮（8x）/客船（6x）/拖轮，AIS 本身无法区分集装箱船、散货船与冷藏船。"
              : "Data hygiene: AIS encodes \u201cnot available\u201d as sentinel values (102.3 kn speed, 360.0° course) and some transponders report speeds beyond any physical limit. Both are treated as invalid and shown as \u201c—\u201d, so the fastest-hull figure never reads absurdly. Vessel classes are coarsened to cargo (7x) / tanker (8x) / passenger (6x) / tug from the AIS code; AIS alone cannot tell a container ship from a bulk carrier or a reefer."}
          </span>
        </div>
        <div className="flex flex-col gap-2 pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            {lang === "zh" ? "这几片海域要看商业全量，去这里（外部站点）" : "For these waters, the commercial picture continues here (external)"}
          </span>
          <div className="flex flex-wrap gap-2">
            {COMMERCIAL_AIS_VENDORS.map((vendor) => (
              <a
                key={vendor.name}
                href={vendor.url}
                target="_blank"
                rel="noopener noreferrer"
                title={lang === "zh" ? vendor.noteZh : vendor.noteEn}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-emerald-400 dark:hover:border-emerald-600 text-slate-600 dark:text-slate-300 text-[11px] font-semibold transition-colors"
              >
                {vendor.name}
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 leading-relaxed">
            {lang === "zh"
              ? "这三家都是授权数据产品，没有免密钥的公开接口，且服务条款禁止在浏览器端抓取或嵌入；本页只提供跳转，不调用其接口。要在页面内直接显示这些船位，需要签服务协议 + 自建服务端代理。"
              : "All three are licensed data products with no key-less public endpoint, and their terms forbid browser-side extraction or embedding. This page only links out; it never calls their APIs. Showing those positions inside the page would require a service contract plus a server-side proxy."}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-slate-400 shrink-0">©</span>
          <span>
            {snapshot
              ? `${lang === "zh" ? "数据来源" : "Source"}: ${snapshot.sourceName} · ${
                  lang === "zh" ? "观测时间" : "observed"
                } ${snapshot.dataUpdatedTime ? new Date(snapshot.dataUpdatedTime).toISOString().slice(0, 19).replace("T", " ") + "Z" : "—"}`
              : ""}
          </span>
        </div>
      </div>
    </section>
  );
};
