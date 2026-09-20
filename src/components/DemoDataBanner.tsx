/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FlaskConical, ChevronDown, ChevronUp, Radio, Database, Coins } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { DEMO_BASELINE_LABEL } from "../data/demoMeta";

/**
 * Always-visible provenance strip. The dashboard is a UI/UX showcase built on a
 * frozen sample set, so the one thing it must never do is imply that the
 * numbers are live. Collapsed to a single line by default, expandable for the
 * full explanation.
 */
export const DemoDataBanner: React.FC = () => {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const zh = language === "zh";

  return (
    <div className="rounded-2xl border border-amber-300/80 dark:border-amber-800/70 bg-amber-50/80 dark:bg-amber-950/25 overflow-hidden">
      <div className="flex items-start sm:items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-[11px] sm:text-xs text-amber-900 dark:text-amber-200 leading-snug">
            <strong className="font-extrabold">{t("demo.bannerTitle")}</strong>
            <span className="mx-1.5 text-amber-500/70">·</span>
            <span className="font-mono font-bold">
              {t("demo.baseline")} {DEMO_BASELINE_LABEL}
            </span>
            <span className="hidden sm:inline">
              <span className="mx-1.5 text-amber-500/70">·</span>
              {t("demo.bannerLiveShort")}
            </span>
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/40 hover:bg-amber-200/80 dark:hover:bg-amber-900/70 border border-amber-300/70 dark:border-amber-800/70 transition-colors"
        >
          <span>{open ? t("demo.bannerLess") : t("demo.bannerMore")}</span>
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-amber-300/60 dark:border-amber-800/50 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="flex items-start gap-2.5">
            <Database className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900/90 dark:text-amber-200/90 space-y-1">
              <p className="font-extrabold">{t("demo.bannerTitle")}</p>
              <p className="leading-relaxed">{t("demo.bannerBody")}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Radio className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900/90 dark:text-amber-200/90 space-y-1">
              <p className="font-extrabold">{zh ? "真实实时数据" : "What is actually live"}</p>
              <p className="leading-relaxed">{t("demo.bannerLive")}</p>
              <p className="leading-relaxed">
                {zh
                  ? "港口气象的风险分级口径：风 ≥22 kn 或 浪 ≥2.5 m 记为「注意」，风 ≥34 kn 或 浪 ≥4.0 m 记为「警戒」。"
                  : "Port-weather risk bands: wind ≥22 kn or wave ≥2.5 m = Monitor; wind ≥34 kn or wave ≥4.0 m = Alert."}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900/90 dark:text-amber-200/90 space-y-1">
              <p className="font-extrabold">{t("demo.bannerFinTitle")}</p>
              <p className="leading-relaxed">{t("demo.bannerFinBody")}</p>
              <p className="leading-relaxed opacity-75">{t("demo.bannerFinRange")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
