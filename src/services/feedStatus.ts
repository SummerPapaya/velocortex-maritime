/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Where a panel's numbers actually came from.
 *
 * Every feed on the Live Data tab tries its provider first. When that fails —
 * an offline demo, a sandboxed preview iframe, a mirror with no egress — the
 * panel falls back to the build-time snapshot in `src/data/liveSnapshot.json`
 * rather than rendering an empty error card. "Live" and "shows nothing" must
 * not be the same setting.
 *
 * Which of the two happened is part of the payload, not a footnote: the UI
 * prints it beside the numbers. A cached figure presented as live would be
 * precisely the kind of quiet inaccuracy this portfolio argues against.
 */
export type FeedOrigin = "live" | "snapshot";

export interface FeedStatus {
  origin: FeedOrigin;
  /** ISO timestamp the fallback snapshot was generated at. Null when live. */
  snapshotAt: string | null;
  /** Reason the live attempt failed. Only set on a fallback. */
  liveError: string | null;
}

export const FEED_LIVE: FeedStatus = { origin: "live", snapshotAt: null, liveError: null };

export function feedFromSnapshot(generatedAt: string, error: unknown): FeedStatus {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "live feed unreachable";
  return { origin: "snapshot", snapshotAt: generatedAt, liveError: message };
}
