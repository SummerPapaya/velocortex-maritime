/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { DatabaseZap } from "lucide-react";
import type { FeedStatus } from "../services/feedStatus";

/** Snapshot stamp, to the minute, in the reader's locale. */
function stamp(iso: string | null, lang: "en" | "zh"): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(lang === "zh" ? "zh-CN" : "en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * The live/cached marker that sits beside every panel title.
 *
 * A panel that quietly fell back to its bundled snapshot would be presenting
 * stale numbers as live — precisely the failure mode this portfolio is about.
 * So the origin is rendered rather than hidden: a pulsing LIVE chip when the
 * provider answered, an amber "cached snapshot" chip with its timestamp when it
 * did not.
 */
export const FeedBadge: React.FC<{ feed: FeedStatus; lang: "en" | "zh" }> = ({ feed, lang }) => {
  if (feed.origin === "live") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/70 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/70 dark:text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
        LIVE
      </span>
    );
  }
  return (
    <span
      title={feed.liveError ?? undefined}
      className="inline-flex items-center gap-1 rounded-full border border-amber-300/70 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:border-amber-800/70 dark:bg-amber-950/70 dark:text-amber-300"
    >
      <DatabaseZap className="h-3 w-3" />
      {lang === "zh" ? `缓存快照 ${stamp(feed.snapshotAt, lang)}` : `cached ${stamp(feed.snapshotAt, lang)}`}
    </span>
  );
};

/**
 * One sentence explaining *why* a panel is showing cached numbers.
 *
 * Without it the fallback is invisible in the worst way: the panel looks live.
 * With it, a viewer on a restricted network still gets real official figures and
 * knows their exact vintage.
 */
export const FeedNotice: React.FC<{ feed: FeedStatus; lang: "en" | "zh" }> = ({ feed, lang }) => {
  if (feed.origin === "live") return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 dark:border-amber-800/70 dark:bg-amber-950/30">
      <DatabaseZap className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="space-y-1 text-xs text-amber-800 dark:text-amber-200">
        <p className="font-bold">
          {lang === "zh" ? "当前显示的是构建期缓存快照，不是实时数据" : "Showing a build-time snapshot, not live data"}
        </p>
        <p className="text-amber-700/90 dark:text-amber-300/90">
          {lang === "zh"
            ? `这个环境访问不到外部接口（离线预览、受限沙箱或出口被拦截），面板因此回落到快照，数据截至 ${stamp(feed.snapshotAt, lang)}。数值取自官方源、未作改动；恢复联网后点右上角刷新即可切回实时。`
            : `This environment cannot reach the external API (offline preview, restricted sandbox or blocked egress), so the panel fell back to its snapshot — data as of ${stamp(feed.snapshotAt, lang)}. The values are the provider's own, unmodified; press refresh once the network is back to switch to live.`}
        </p>
        {feed.liveError && (
          <p className="font-mono text-[10px] text-amber-700/70 dark:text-amber-400/70">{feed.liveError}</p>
        )}
      </div>
    </div>
  );
};
