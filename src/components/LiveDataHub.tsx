/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from "react";
import { Anchor, Radar, CloudSun, Layers } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { LiveMapLayer, type LiveTab } from "./LiveMapLayer";
import { ChokepointBoard } from "./ChokepointBoard";
import { NearshoreAis } from "./NearshoreAis";
import { LivePortWeather } from "./LivePortWeather";
import type { ChokepointSnapshot } from "../services/chokepoints";
import type { AisSnapshot } from "../services/ais";
import type { PortWeatherSnapshot } from "../services/weather";

/**
 * One map, three feeds.
 *
 * Each panel used to draw its own visual and stack vertically, which read as
 * three unrelated widgets and left the AIS block as a bare lat/long scatter
 * with no geography under it. Here the three share a single map layer: the tab
 * picks which feed is drawn on it and which table is shown underneath. The
 * panels stay mounted so switching tabs never refetches, and each keeps owning
 * its own data — the hub only listens.
 */
export const LiveDataHub: React.FC = () => {
  const { language } = useLanguage();
  const zh = language === "zh";

  const [tab, setTab] = useState<LiveTab>("chokepoints");
  const [zoomed, setZoomed] = useState(true);
  const [focusGroup, setFocusGroup] = useState<string | null>(null);

  const [chokepoints, setChokepoints] = useState<ChokepointSnapshot | null>(null);
  const [ais, setAis] = useState<AisSnapshot | null>(null);
  const [ports, setPorts] = useState<PortWeatherSnapshot | null>(null);

  const onChokepoints = useCallback((s: ChokepointSnapshot | null) => setChokepoints(s), []);
  const onAis = useCallback((s: AisSnapshot | null) => setAis(s), []);
  const onPorts = useCallback((s: PortWeatherSnapshot | null) => setPorts(s), []);

  const TABS: { id: LiveTab; zh: string; en: string; hintZh: string; hintEn: string; Icon: typeof Anchor; count: number | null }[] = useMemo(
    () => [
      {
        id: "chokepoints",
        zh: "咽喉点过境量",
        en: "Chokepoint transits",
        hintZh: "IMF 官方日度统计",
        hintEn: "Official IMF daily statistics",
        Icon: Anchor,
        count: chokepoints?.chokepoints.length ?? null,
      },
      {
        id: "vessels",
        zh: "近岸 AIS 船位",
        en: "Near-shore AIS",
        hintZh: "区域开放 AIS 实测",
        hintEn: "Regional open AIS",
        Icon: Radar,
        count: ais?.total ?? null,
      },
      {
        id: "ports",
        zh: "枢纽港气象",
        en: "Hub port weather",
        hintZh: "Open-Meteo 实时风浪",
        hintEn: "Live Open-Meteo wind & sea",
        Icon: CloudSun,
        count: ports?.ports.length ?? null,
      },
    ],
    [chokepoints, ais, ports],
  );

  const activeHint = TABS.find((t) => t.id === tab);

  const switchTab = useCallback((id: LiveTab) => {
    setTab(id);
    // The open AIS feed only covers the Baltic, so the vessel tab should open
    // on the zoomed footprint rather than a near-empty world map.
    if (id === "vessels") setZoomed(true);
  }, []);

  return (
    <div className="space-y-4">
      {/* Feed switcher — drives both the map and the table below */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0 px-1">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {zh ? "切换数据层" : "Switch data layer"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
            {TABS.map(({ id, zh: labelZh, en, hintZh, hintEn, Icon, count }) => {
              const on = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => switchTab(id)}
                  aria-pressed={on}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                    on
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{zh ? labelZh : en}</span>
                  {count !== null && (
                    <span className={`font-mono text-[10px] px-1.5 rounded-full ${on ? "bg-white/20 dark:bg-slate-900/15" : "bg-slate-200/80 dark:bg-slate-700"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {activeHint && (
          <p className="text-[11px] text-slate-400 mt-2 px-1">
            {zh ? activeHint.hintZh : activeHint.hintEn}
          </p>
        )}
      </div>

      {/* Side-by-side: the map stays pinned while the detail table scrolls. */}
      <div className="lg:flex lg:gap-4 lg:items-start">
        <div className="sticky top-2 z-20 h-[42vh] overflow-y-auto lg:top-16 lg:z-10 lg:w-[42%] lg:self-start lg:h-auto lg:max-h-[calc(100vh-5rem)] lg:overflow-visible lg:mb-0 mb-4">
          <LiveMapLayer
            tab={tab}
            lang={language}
            chokepoints={chokepoints?.chokepoints ?? null}
            ais={ais}
            ports={ports}
            focusGroup={focusGroup}
            zoomed={zoomed}
            onToggleZoom={setZoomed}
          />
        </div>

        <div className="lg:flex-1 min-w-0 space-y-4">
          <div hidden={tab !== "chokepoints"}>
            <ChokepointBoard onSnapshot={onChokepoints} onFocusGroup={setFocusGroup} />
          </div>
          <div hidden={tab !== "vessels"}>
            <NearshoreAis onSnapshot={onAis} />
          </div>
          <div hidden={tab !== "ports"}>
            <LivePortWeather onSnapshot={onPorts} />
          </div>
        </div>
      </div>
    </div>
  );
};
