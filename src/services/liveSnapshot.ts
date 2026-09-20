/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The build-time snapshot, as written by `scripts/snapshot-live.ts`.
 *
 * Payloads, not derived values: the parsing that turns a Digitraffic feature
 * into a vessel, or an ArcGIS row into a chokepoint day, stays in the services
 * and runs identically on live and cached data.
 */
export interface LiveSnapshotFile {
  generatedAt: string;
  chokepoints?: {
    latestDate?: string;
    windowDays?: number;
    baselineWindow?: { start?: string; end?: string };
    rowFields?: string[];
    rows?: unknown[][];
    baselines?: [string, number][];
  };
  ais?: {
    dataUpdatedTime?: string | null;
    locations?: { dataUpdatedTime?: string | null; features?: unknown[] };
    vessels?: unknown[];
  };
  ports?: { forecast?: unknown; marine?: unknown };
}

/**
 * Loads the snapshot on demand.
 *
 * Deliberately a dynamic import: the file is a quarter of a megabyte of raw
 * provider payloads, and only the Live Data tab ever needs it. Bundled eagerly
 * it would tax every visitor to every other tab; split out, it is fetched the
 * first time a panel actually falls back. It is also not a *network* request in
 * the sense that matters here — it is same-origin, so a sandbox that blocks
 * external egress still serves it.
 *
 * Cached after the first load, so three panels falling back cost one fetch.
 */
let pending: Promise<LiveSnapshotFile> | null = null;

export function loadLiveSnapshot(): Promise<LiveSnapshotFile> {
  if (!pending) {
    pending = import("../data/liveSnapshot.json").then((mod) => {
      // Depending on the bundler, a JSON module arrives either as the value
      // itself or under `default`; accept both rather than betting on one.
      const shape = mod as unknown as LiveSnapshotFile & { default?: LiveSnapshotFile };
      return shape.default ?? (shape as LiveSnapshotFile);
    });
  }
  return pending;
}

/** Generation stamp of the snapshot, or the epoch when it is missing. */
export function snapshotStamp(raw: LiveSnapshotFile | undefined | null): string {
  const value = raw?.generatedAt;
  return typeof value === "string" && value !== "" ? value : new Date(0).toISOString();
}
