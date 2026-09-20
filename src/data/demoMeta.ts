/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Single source of truth for the provenance of this dashboard's data.
 *
 * Everything in this app that is NOT explicitly marked as LIVE comes from a
 * frozen, build-time sample set (`mockLogistics.ts`). It is not connected to
 * any carrier EDI, IoT gateway or AIS feed.
 *
 * Real-time surfaces, all of them browser-direct and key-less:
 *   - port weather & sea state .......... Open-Meteo (forecast + marine)
 *   - chokepoint transit volumes ........ IMF PortWatch
 *   - nearshore vessel positions ........ Digitraffic open AIS
 *
 * Both labels below are DERIVED rather than hand-written, because a hard-coded
 * "data as of" string silently rots: it keeps claiming a fixed date while the
 * sample rows get edited forward. Deriving them means the disclosure cannot
 * drift out of sync with the data it describes.
 */

import { MOCK_CONTAINERS } from "./mockLogistics";

const DAY_MS = 86_400_000;

/** Authored milestone stamps look like `2026-09-19 12:30`; estimates are prefixed. */
const AUTHORED_STAMP = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/;

function latestAuthoredStamp(): string | null {
  let best: string | null = null;

  for (const container of MOCK_CONTAINERS) {
    for (const milestone of container.milestones ?? []) {
      const raw = (milestone.timestamp ?? "").trim();
      // "Est. ..." rows are projections, not observations — they must not
      // define the cut-off, or the baseline would sit in the future.
      if (!AUTHORED_STAMP.test(raw)) continue;
      const iso = `${raw.replace(" ", "T")}:00Z`;
      if (best === null || iso > best) best = iso;
    }
  }

  return best;
}

/** Latest observed event in the sample dataset — i.e. the data cut-off. */
export const DEMO_BASELINE_ISO = latestAuthoredStamp() ?? "2026-01-01T00:00:00Z";

function label(iso: string): string {
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}

/** Human-readable baseline, shown in the UI as the data cut-off. */
export const DEMO_BASELINE_LABEL = label(DEMO_BASELINE_ISO);

/** Actual bundle build time, injected by Vite. Never hand-maintained. */
export const DEMO_BUILD_ISO = typeof __BUILD_STAMP__ === "string" ? __BUILD_STAMP__ : new Date().toISOString();

/** Build stamp of the deployed demo bundle, e.g. `2026.09.20`. */
export const DEMO_BUILD_LABEL = DEMO_BUILD_ISO.slice(0, 10).replace(/-/g, ".");

/**
 * Renders an authored date as an offset from the data cut-off instead of a
 * bare calendar date, so the sample set stays legible however far in the past
 * it drifts.
 */
export function etaFromBaseline(iso: string, lang: "en" | "zh"): string {
  const target = Date.parse(iso);
  if (Number.isNaN(target)) return iso;

  const days = Math.round((target - Date.parse(DEMO_BASELINE_ISO)) / DAY_MS);
  const tag = days === 0 ? "T+0" : `T${days > 0 ? "+" : "-"}${Math.abs(days)}`;

  return lang === "zh" ? `${tag} 天` : `${tag}d`;
}

/** Full tooltip form: keeps the authored calendar date available on hover. */
export function baselineTooltip(iso: string, lang: "en" | "zh"): string {
  return lang === "zh"
    ? `样例日期 ${iso} · 数据基准 ${DEMO_BASELINE_LABEL}（非实时）`
    : `Sample date ${iso} · baseline ${DEMO_BASELINE_LABEL} (not live)`;
}
