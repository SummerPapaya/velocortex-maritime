/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Freezes one real snapshot of the three live feeds into src/data/liveSnapshot.json.
 *
 * Why this exists
 * ---------------
 * Every panel on the Live Data tab calls a third-party service at runtime. That
 * is the point — the numbers are genuinely live — but it also means the tab
 * renders as an empty error card wherever the network is unavailable: an
 * offline demo, a sandboxed preview iframe, a reviewer on a plane, a mirror
 * without egress. "Live" and "never shows anything" must not be the same
 * setting.
 *
 * So the services fall back to this file. It is generated from the same
 * endpoints, carries its own `generatedAt` stamp, and the UI labels it as a
 * cached snapshot — the fallback is stated, never passed off as live.
 *
 * The file stores *provider payloads*, not derived values: the parsing that
 * turns a Digitraffic GeoJSON feature into a vessel, or an ArcGIS row into a
 * chokepoint day, stays in `src/services/*` and runs identically on live and
 * cached data. Only the transport differs.
 *
 * Run: npm run snapshot:live
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TRACKED_PORTS } from "../src/data/ports";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src/data/liveSnapshot.json");

const TIMEOUT_MS = 30_000;
const DAY_MS = 86_400_000;

/** Kept in lockstep with src/services/chokepoints.ts. */
const CHOKEPOINT_QUERY =
  "https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Chokepoints_Data/FeatureServer/0/query";
const WINDOW_DAYS = 28;
const BASELINE_START = "2025-08-01";
const BASELINE_END = "2026-02-27";

const DIGITRAFFIC_BASE = "https://meri.digitraffic.fi/api/ais/v1";

interface SnapshotFile {
  generatedAt: string;
  chokepoints?: unknown;
  ais?: unknown;
  ports?: unknown;
  [key: string]: unknown;
}

async function getJson<T = any>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url.slice(0, 90)}`);
  return (await res.json()) as T;
}

const round = (n: number | null | undefined, digits = 5): number | null =>
  typeof n === "number" && Number.isFinite(n) ? Number(n.toFixed(digits)) : null;

/* ------------------------------------------------------------------ */
/* Chokepoints — IMF PortWatch                                         */
/* ------------------------------------------------------------------ */

async function snapshotChokepoints() {
  const latestData = await getJson(
    `${CHOKEPOINT_QUERY}?` +
      new URLSearchParams({
        where: "1=1",
        outFields: "date",
        orderByFields: "date DESC",
        resultRecordCount: "1",
        returnGeometry: "false",
        f: "json",
      }).toString(),
  );
  const latestDate: string | undefined = latestData?.features?.[0]?.attributes?.date;
  if (typeof latestDate !== "string") throw new Error("PortWatch returned no dated rows");

  const start = new Date(Date.parse(`${latestDate.slice(0, 10)}T00:00:00Z`) - WINDOW_DAYS * DAY_MS)
    .toISOString()
    .slice(0, 10);

  /*
   * ArcGIS field names and the tuple labels are not the same string: the service
   * exposes `n_total` / `n_container` / `n_tanker`, while the rest of the app
   * reads them back as camelCase. Asking for the camelCase name is a hard 400
   * ("'outFields' parameter is invalid"), so the query uses one list and the
   * stored tuple documents the other.
   */
  const queryFields = ["portname", "date", "n_total", "n_container", "n_tanker", "capacity"];
  const rowFields = ["portname", "date", "nTotal", "nContainer", "nTanker", "capacity"];
  const rows: unknown[][] = [];

  for (let offset = 0; ; offset += 1000) {
    const data = await getJson(
      `${CHOKEPOINT_QUERY}?` +
        new URLSearchParams({
          where: `date>'${start}'`,
          outFields: queryFields.join(","),
          orderByFields: "date ASC",
          resultRecordCount: "1000",
          resultOffset: String(offset),
          returnGeometry: "false",
          f: "json",
        }).toString(),
    );
    const features: any[] = Array.isArray(data?.features) ? data.features : [];
    for (const feature of features) {
      const a = feature?.attributes ?? {};
      if (typeof a.portname !== "string" || typeof a.date !== "string") continue;
      rows.push([
        a.portname,
        a.date.slice(0, 10),
        Number(a.n_total) || 0,
        Number(a.n_container) || 0,
        Number(a.n_tanker) || 0,
        Number(a.capacity) || 0,
      ]);
    }
    if (features.length < 1000) break;
    if (offset > 4000) break;
  }

  const baselineData = await getJson(
    `${CHOKEPOINT_QUERY}?` +
      new URLSearchParams({
        where: `date>='${BASELINE_START}' AND date<='${BASELINE_END}'`,
        groupByFieldsForStatistics: "portname",
        outStatistics: JSON.stringify([
          { statisticType: "avg", onStatisticField: "n_total", outStatisticFieldName: "baseline" },
          { statisticType: "count", onStatisticField: "date", outStatisticFieldName: "days" },
        ]),
        returnGeometry: "false",
        f: "json",
      }).toString(),
  );

  const baselines: [string, number][] = [];
  for (const feature of Array.isArray(baselineData?.features) ? baselineData.features : []) {
    const a = feature?.attributes ?? {};
    // Same guard as the service: a chokepoint present for only a few days would
    // produce a noise average that the UI would then print as fact.
    if (typeof a?.portname === "string" && typeof a?.baseline === "number" && Number(a?.days) >= 120) {
      baselines.push([a.portname, Number(a.baseline.toFixed(3))]);
    }
  }

  if (rows.length === 0) throw new Error("PortWatch window query returned no rows");

  return {
    latestDate: latestDate.slice(0, 10),
    windowDays: WINDOW_DAYS,
    baselineWindow: { start: BASELINE_START, end: BASELINE_END },
    rowFields,
    rows,
    baselines,
  };
}

/* ------------------------------------------------------------------ */
/* Nearshore AIS — Digitraffic                                         */
/* ------------------------------------------------------------------ */

/**
 * Only the fields the parser actually reads are kept, and the static register
 * is reduced to the vessels observed in this snapshot — the full register runs
 * to megabytes of vessels that are nowhere near the Baltic picture.
 */
async function snapshotAis() {
  const [locations, register] = await Promise.all([
    getJson<any>(`${DIGITRAFFIC_BASE}/locations`),
    getJson<any>(`${DIGITRAFFIC_BASE}/vessels`).catch(() => []),
  ]);

  const features: any[] = Array.isArray(locations?.features) ? locations.features : [];
  if (features.length === 0) throw new Error("Digitraffic returned no positions");

  const seen = new Set<number>();
  const slimFeatures = features.map((f) => {
    const mmsi = Number(f?.mmsi ?? f?.properties?.mmsi);
    if (Number.isFinite(mmsi)) seen.add(mmsi);
    const coords = f?.geometry?.coordinates;
    const p = f?.properties ?? {};
    return {
      mmsi,
      geometry: { coordinates: [round(coords?.[0]), round(coords?.[1])] },
      properties: {
        sog: round(p.sog, 1),
        cog: round(p.cog, 1),
        heading: round(p.heading, 1),
        timestampExternal: typeof p.timestampExternal === "number" ? p.timestampExternal : null,
      },
    };
  });

  const slimRegister = (Array.isArray(register) ? register : [])
    .filter((v: any) => seen.has(Number(v?.mmsi)))
    .map((v: any) => ({
      mmsi: Number(v.mmsi),
      name: typeof v?.name === "string" ? v.name : null,
      shipType: Number.isFinite(Number(v?.shipType)) ? Number(v.shipType) : null,
      destination: typeof v?.destination === "string" ? v.destination : null,
      imo: Number.isFinite(Number(v?.imo)) ? Number(v.imo) : null,
    }));

  return {
    dataUpdatedTime: typeof locations?.dataUpdatedTime === "string" ? locations.dataUpdatedTime : null,
    locations: { dataUpdatedTime: locations?.dataUpdatedTime ?? null, features: slimFeatures },
    vessels: slimRegister,
  };
}

/* ------------------------------------------------------------------ */
/* Hub port weather — Open-Meteo                                       */
/* ------------------------------------------------------------------ */

async function snapshotPorts() {
  const ports = TRACKED_PORTS;
  const lat = ports.map((p) => p.lat).join(",");
  const lng = ports.map((p) => p.lng).join(",");
  const tz = ports.map((p) => encodeURIComponent(p.tz)).join(",");
  const seaLat = ports.map((p) => p.seaLat ?? p.lat).join(",");
  const seaLng = ports.map((p) => p.seaLng ?? p.lng).join(",");

  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code` +
    `&wind_speed_unit=kn&timezone=${tz}`;
  const marineUrl =
    `https://marine-api.open-meteo.com/v1/marine?latitude=${seaLat}&longitude=${seaLng}` +
    `&current=wave_height,wave_period,swell_wave_height&timezone=${tz}`;

  const [forecast, marine] = await Promise.all([
    getJson<any>(forecastUrl),
    getJson<any>(marineUrl).catch(() => []),
  ]);

  return { forecast, marine };
}

/* ------------------------------------------------------------------ */

function loadExisting(): SnapshotFile {
  try {
    return JSON.parse(readFileSync(OUT, "utf8")) as SnapshotFile;
  } catch {
    return { generatedAt: new Date().toISOString() };
  }
}

async function main() {
  /*
   * A section that fails must not erase a section that worked. Each feed is
   * written independently and yesterday's value is carried forward, so one
   * flaky endpoint degrades the snapshot instead of emptying it.
   */
  const existing = loadExisting();
  const next: SnapshotFile = { ...existing, generatedAt: new Date().toISOString() };
  const report: string[] = [];

  const sections: [keyof SnapshotFile, string, () => Promise<unknown>][] = [
    ["chokepoints", "IMF PortWatch chokepoints", snapshotChokepoints],
    ["ais", "Digitraffic AIS positions", snapshotAis],
    ["ports", "Open-Meteo port weather", snapshotPorts],
  ];

  for (const [key, label, run] of sections) {
    try {
      const value = await run();
      next[key] = value;
      report.push(`  ✓ ${label}`);
    } catch (error) {
      const carried = existing[key] ? " — kept the previous snapshot for this feed" : " — NO DATA for this feed";
      report.push(`  ✗ ${label}: ${(error as Error).message}${carried}`);
    }
  }

  writeFileSync(OUT, `${JSON.stringify(next)}\n`, "utf8");

  const bytes = Buffer.byteLength(readFileSync(OUT));
  const chokepoints: any = next.chokepoints ?? {};
  const ais: any = next.ais ?? {};
  const ports: any = next.ports ?? {};

  console.log("live snapshot →", path.relative(ROOT, OUT));
  console.log(report.join("\n"));
  console.log(
    [
      "",
      `  chokepoints : ${chokepoints.rows?.length ?? 0} row(s) · ${chokepoints.baselines?.length ?? 0} baseline(s) · latest ${chokepoints.latestDate ?? "—"}`,
      `  ais         : ${ais.locations?.features?.length ?? 0} position(s) · ${ais.vessels?.length ?? 0} register entr(ies)`,
      `  ports       : ${Array.isArray(ports.forecast) ? ports.forecast.length : ports.forecast ? 1 : 0} forecast payload(s)`,
      `  file        : ${(bytes / 1024).toFixed(1)} KB`,
      "",
    ].join("\n"),
  );
}

main().catch((error) => {
  console.error("snapshot failed:", error);
  process.exit(1);
});
