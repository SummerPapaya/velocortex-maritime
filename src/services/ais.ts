/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Nearshore AIS vessel positions.
 *
 * Two providers, chosen at runtime:
 *
 * 1. `VITE_AIS_PROXY_URL` — a server-side proxy (Cloudflare Worker or similar)
 *    that normalises a commercial/community AIS feed into the snapshot shape
 *    below. Global coverage needs this, because providers such as aisstream.io
 *    explicitly forbid direct browser connections and require an API key that
 *    must never ship to the client. See `workers/ais-proxy` in the repo.
 *
 * 2. Digitraffic (default fallback) — the Finnish Transport Agency's open AIS
 *    feed. Free, key-less, CORS-enabled, so a static bundle can call it
 *    directly. Coverage is realistically limited to the Baltic Sea and the
 *    Gulf of Finland / Bothnia, so the UI labels the extent honestly instead of
 *    implying a global picture.
 *
 * Both paths return the same shape, so the component does not care which is
 * active — it only reads `coverageLabel*` and `sourceName` to caption itself.
 */

const DIGITRAFFIC_BASE = "https://meri.digitraffic.fi/api/ais/v1";
const REQUEST_TIMEOUT_MS = 20_000;

/** A vessel is treated as under way above this speed over ground. */
const UNDERWAY_SOG_KN = 1;

export type VesselCategory = "CARGO" | "TANKER" | "PASSENGER" | "TUG" | "OTHER";

export interface AisVessel {
  mmsi: number;
  name: string | null;
  lat: number;
  lon: number;
  /** Speed over ground in knots. */
  sog: number | null;
  cog: number | null;
  heading: number | null;
  shipType: number | null;
  category: VesselCategory;
  destination: string | null;
  imo: number | null;
  /** Provider receive time, epoch ms. */
  lastSeen: number | null;
}

export interface AisSnapshot {
  coverageId: string;
  coverageLabelEn: string;
  coverageLabelZh: string;
  /** Extra sentence describing what the extent does and does not include. */
  coverageNoteEn: string;
  coverageNoteZh: string;
  sourceName: string;
  sourceUrl: string;
  vessels: AisVessel[];
  total: number;
  underway: number;
  byCategory: Record<VesselCategory, number>;
  bbox: { minLat: number; maxLat: number; minLon: number; maxLon: number } | null;
  /** Feed-side observation time reported by the provider. */
  dataUpdatedTime: string | null;
  fetchedAt: number;
}

const EMPTY_CATEGORIES: Record<VesselCategory, number> = {
  CARGO: 0,
  TANKER: 0,
  PASSENGER: 0,
  TUG: 0,
  OTHER: 0,
};

/**
 * AIS ship-type codes (first digit): 6x passenger, 7x cargo, 8x tanker.
 * Container vs dry bulk vs reefer is NOT distinguishable from AIS alone, so the
 * categories here stay deliberately coarse.
 */
export function categoriseShipType(shipType: number | null): VesselCategory {
  if (shipType === null) return "OTHER";
  if (shipType >= 80 && shipType <= 89) return "TANKER";
  if (shipType >= 70 && shipType <= 79) return "CARGO";
  if (shipType >= 60 && shipType <= 69) return "PASSENGER";
  if (shipType === 31 || shipType === 32 || shipType === 52) return "TUG";
  return "OTHER";
}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * AIS encodes "value not available" as a sentinel rather than omitting the
 * field, and the raw feed passes those sentinels straight through:
 *   - speed over ground 1023  -> 102.3 kn
 *   - course over ground 3600 -> 360.0°
 *   - true heading       511  -> 511°
 * Rendering them verbatim produces a "fastest hull" of 102.3 kn, so they are
 * mapped to null at the boundary and never reach the UI.
 */
function speed(value: unknown): number | null {
  const n = finite(value);
  return n === null || n >= 102.2 ? null : n;
}

function bearing(value: unknown): number | null {
  const n = finite(value);
  return n === null || n < 0 || n >= 360 ? null : n;
}

/**
 * Misconfigured transponders emit speeds no hull can reach, and the raw feed
 * carries them through verbatim — a Baltic snapshot readily produces "cargo
 * vessel at 83.6 kn". Ranking on that gives an absurd "fastest hull", so values
 * above a class-specific physical ceiling are discarded as errors rather than
 * displayed. Ceilings are generous: the fastest container ships run ~25 kn and
 * the fastest passenger ferries ~40 kn.
 */
const SOG_CEILING_KN: Record<VesselCategory, number> = {
  CARGO: 30,
  TANKER: 22,
  PASSENGER: 45,
  TUG: 25,
  OTHER: 60,
};

function plausibleSpeed(sog: number | null, category: VesselCategory): number | null {
  if (sog === null) return null;
  return sog > SOG_CEILING_KN[category] ? null : sog;
}

async function getJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`AIS feed responded ${res.status}`);
    return (await res.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

function summarise(
  vessels: AisVessel[],
  base: Pick<
    AisSnapshot,
    | "coverageId"
    | "coverageLabelEn"
    | "coverageLabelZh"
    | "coverageNoteEn"
    | "coverageNoteZh"
    | "sourceName"
    | "sourceUrl"
    | "dataUpdatedTime"
  >,
): AisSnapshot {
  const byCategory = { ...EMPTY_CATEGORIES };
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const v of vessels) {
    byCategory[v.category] += 1;
    if (v.lat < minLat) minLat = v.lat;
    if (v.lat > maxLat) maxLat = v.lat;
    if (v.lon < minLon) minLon = v.lon;
    if (v.lon > maxLon) maxLon = v.lon;
  }

  return {
    ...base,
    vessels,
    total: vessels.length,
    underway: vessels.filter((v) => (v.sog ?? 0) >= UNDERWAY_SOG_KN).length,
    byCategory,
    bbox: vessels.length > 0 ? { minLat, maxLat, minLon, maxLon } : null,
    fetchedAt: Date.now(),
  };
}

/** Digitraffic open AIS: free, key-less, CORS-enabled, Baltic Sea coverage. */
async function fetchDigitraffic(): Promise<AisSnapshot> {
  const [locations, vessels] = await Promise.all([
    getJson<any>(`${DIGITRAFFIC_BASE}/locations`),
    // The static register is a nice-to-have: positions still render without it.
    getJson<any>(`${DIGITRAFFIC_BASE}/vessels`).catch(() => []),
  ]);

  const register = new Map<number, any>();
  if (Array.isArray(vessels)) {
    for (const v of vessels) {
      const mmsi = finite(v?.mmsi);
      if (mmsi !== null) register.set(mmsi, v);
    }
  }

  const features: any[] = Array.isArray(locations?.features) ? locations.features : [];
  const out: AisVessel[] = [];

  for (const feature of features) {
    const coords = feature?.geometry?.coordinates;
    const lat = Array.isArray(coords) ? finite(coords[1]) : null;
    const lon = Array.isArray(coords) ? finite(coords[0]) : null;
    const mmsi = finite(feature?.mmsi ?? feature?.properties?.mmsi);
    if (lat === null || lon === null || mmsi === null) continue;

    const props = feature?.properties ?? {};
    const meta = register.get(mmsi);
    const shipType = finite(meta?.shipType);
    const category = categoriseShipType(shipType);
    const destination = typeof meta?.destination === "string" ? meta.destination.trim() : null;

    out.push({
      mmsi,
      name: typeof meta?.name === "string" && meta.name.trim() !== "" ? meta.name.trim() : null,
      lat,
      lon,
      sog: plausibleSpeed(speed(props.sog), category),
      cog: bearing(props.cog),
      heading: bearing(props.heading),
      shipType,
      category,
      destination: destination && destination !== "" ? destination : null,
      imo: finite(meta?.imo),
      lastSeen: finite(props.timestampExternal),
    });
  }

  return summarise(out, {
    coverageId: "baltic-digitraffic",
    coverageLabelEn: "Baltic Sea & Gulf of Finland",
    coverageLabelZh: "波罗的海与芬兰湾",
    coverageNoteEn:
      "Digitraffic open feed (Finnish Transport Agency). Terrestrial receivers cover the Baltic basin only — this is a real but regional picture, not a global one.",
    coverageNoteZh:
      "数据来自芬兰交通局 Digitraffic 开放接口。岸基接收站仅覆盖波罗的海海域——这是真实的区域视图，不代表全球。",
    sourceName: "Digitraffic (Fintraffic)",
    sourceUrl: "https://www.digitraffic.fi/en/marine-traffic/",
    dataUpdatedTime: typeof locations?.dataUpdatedTime === "string" ? locations.dataUpdatedTime : null,
  });
}

/** Global feed via a deployed proxy. Expects the snapshot shape back. */
async function fetchViaProxy(proxyUrl: string): Promise<AisSnapshot> {
  const data = await getJson<any>(proxyUrl.replace(/\/$/, "") + "/snapshot");
  const raw: any[] = Array.isArray(data?.vessels) ? data.vessels : [];

  const out: AisVessel[] = [];
  for (const v of raw) {
    const lat = finite(v?.lat);
    const lon = finite(v?.lon);
    const mmsi = finite(v?.mmsi);
    if (lat === null || lon === null || mmsi === null) continue;
    const shipType = finite(v?.shipType);
    const category = categoriseShipType(shipType);
    out.push({
      mmsi,
      name: typeof v?.name === "string" && v.name.trim() !== "" ? v.name.trim() : null,
      lat,
      lon,
      sog: plausibleSpeed(speed(v?.sog), category),
      cog: bearing(v?.cog),
      heading: bearing(v?.heading),
      shipType,
      category,
      destination: typeof v?.destination === "string" ? v.destination : null,
      imo: finite(v?.imo),
      lastSeen: finite(v?.lastSeen),
    });
  }

  return summarise(out, {
    coverageId: typeof data?.coverageId === "string" ? data.coverageId : "proxy-global",
    coverageLabelEn: typeof data?.coverageLabelEn === "string" ? data.coverageLabelEn : "Global (proxied feed)",
    coverageLabelZh: typeof data?.coverageLabelZh === "string" ? data.coverageLabelZh : "全球（代理feed）",
    coverageNoteEn:
      "Served through your own server-side proxy, which holds the provider key. Terrestrial community coverage still thins out in the Red Sea, Gulf of Aden and Persian Gulf.",
    coverageNoteZh:
      "经由自建服务端代理获取，密钥保留在服务端。社区岸基网络在红海、亚丁湾与波斯湾的覆盖依然稀疏。",
    sourceName: typeof data?.sourceName === "string" ? data.sourceName : "aisstream.io",
    sourceUrl: typeof data?.sourceUrl === "string" ? data.sourceUrl : "https://aisstream.io/",
    dataUpdatedTime: typeof data?.dataUpdatedTime === "string" ? data.dataUpdatedTime : null,
  });
}

export function hasGlobalAisProxy(): boolean {
  return typeof import.meta.env?.VITE_AIS_PROXY_URL === "string" && import.meta.env.VITE_AIS_PROXY_URL !== "";
}

export async function fetchAisSnapshot(): Promise<AisSnapshot> {
  const proxyUrl = import.meta.env?.VITE_AIS_PROXY_URL;
  if (typeof proxyUrl === "string" && proxyUrl !== "") {
    return fetchViaProxy(proxyUrl);
  }
  return fetchDigitraffic();
}
