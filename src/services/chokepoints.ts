/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Daily chokepoint transit volumes, sourced from the IMF PortWatch programme.
 *
 * Why this layer exists
 * ---------------------
 * Community (terrestrial) AIS receivers have almost no coverage in the Red Sea,
 * the Gulf of Aden and the Persian Gulf — precisely the corridors a supply-chain
 * narrative leans on hardest. Rather than pretend otherwise, this panel swaps
 * the metric: instead of "where are the ships" it answers "how many ships went
 * through", which is the number an analyst actually reasons with, and which is
 * published officially for 28 chokepoints regardless of AIS density.
 *
 * Source: IMF PortWatch, "Daily Chokepoint Transit Calls and Shipment Volume
 * Estimates" (ArcGIS feature service). Free, key-less, CORS-enabled, so it can
 * be called straight from a static bundle with no proxy.
 */

const QUERY_URL =
  "https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Chokepoints_Data/FeatureServer/0/query";

/** Rolling window pulled per refresh. 28 chokepoints x 28 days < one page cap. */
const WINDOW_DAYS = 28;
const PAGE_SIZE = 1000;
const MAX_PAGES = 4;
const REQUEST_TIMEOUT_MS = 15_000;
const DAY_MS = 86_400_000;

export type AisAvailability = "GOOD" | "SPARSE" | "GAP";

export type ChokepointGroup = "RED_SEA" | "GULF" | "DETOUR" | "EUROPE" | "ASIA" | "AMERICAS";

/**
 * Reference window for the "normal" baseline.
 *
 * It ends the day before the present Hormuz crisis began and runs back seven
 * months, so every chokepoint is compared against its own recent pre-crisis
 * norm on identical terms. This matters more than it sounds: without it a
 * chokepoint running at 6% of normal still shows a green "+68% week on week"
 * and reads as a recovery. The UI states the window rather than hiding it in
 * a constant.
 */
export const BASELINE_START = "2025-08-01";
export const BASELINE_END = "2026-02-27";

export interface ChokepointMeta {
  zh: string;
  group: ChokepointGroup;
  /** Approximate position of the passage, for the map layer. */
  lat: number;
  lng: number;
}

export const GROUP_LABEL: Record<ChokepointGroup, { en: string; zh: string }> = {
  RED_SEA: { en: "Red Sea & Suez corridor", zh: "红海—苏伊士走廊" },
  GULF: { en: "Persian Gulf", zh: "波斯湾" },
  DETOUR: { en: "Cape route comparison", zh: "绕行对比航线" },
  EUROPE: { en: "European waters", zh: "欧洲近海" },
  ASIA: { en: "Asia–Pacific", zh: "亚洲—太平洋" },
  AMERICAS: { en: "Americas", zh: "美洲" },
};

/** Display order of the corridor groups. */
export const GROUP_ORDER: ChokepointGroup[] = ["RED_SEA", "GULF", "DETOUR", "EUROPE", "ASIA", "AMERICAS"];

/**
 * Localisation, grouping and map position per chokepoint. Coordinates are the
 * approximate midpoint of each passage — good enough to place a marker on a
 * world map, not survey-grade.
 */
const META: Record<string, ChokepointMeta> = {
  // Red Sea & Suez
  "Suez Canal": { zh: "苏伊士运河", group: "RED_SEA", lat: 30.5, lng: 32.35 },
  "Bab el-Mandeb Strait": { zh: "曼德海峡", group: "RED_SEA", lat: 12.6, lng: 43.4 },
  // Persian Gulf
  "Strait of Hormuz": { zh: "霍尔木兹海峡", group: "GULF", lat: 26.57, lng: 56.25 },
  // Cape route — the detour benchmark for the Red Sea crisis.
  "Cape of Good Hope": { zh: "好望角", group: "DETOUR", lat: -34.36, lng: 18.49 },
  "Magellan Strait": { zh: "麦哲伦海峡", group: "DETOUR", lat: -53.5, lng: -70.5 },
  // European waters
  "Gibraltar Strait": { zh: "直布罗陀海峡", group: "EUROPE", lat: 35.96, lng: -5.6 },
  "Dover Strait": { zh: "多佛海峡", group: "EUROPE", lat: 51.05, lng: 1.45 },
  "Oresund Strait": { zh: "厄勒海峡", group: "EUROPE", lat: 55.75, lng: 12.75 },
  "Bosporus Strait": { zh: "博斯普鲁斯海峡", group: "EUROPE", lat: 41.12, lng: 29.05 },
  "Kerch Strait": { zh: "刻赤海峡", group: "EUROPE", lat: 45.25, lng: 36.5 },
  // Asia–Pacific
  "Malacca Strait": { zh: "马六甲海峡", group: "ASIA", lat: 1.8, lng: 102.5 },
  "Taiwan Strait": { zh: "台湾海峡", group: "ASIA", lat: 24.5, lng: 119.5 },
  "Korea Strait": { zh: "朝鲜海峡", group: "ASIA", lat: 34.3, lng: 128.8 },
  "Tsugaru Strait": { zh: "津轻海峡", group: "ASIA", lat: 41.4, lng: 140.5 },
  "Luzon Strait": { zh: "吕宋海峡", group: "ASIA", lat: 20.5, lng: 121.0 },
  "Mindoro Strait": { zh: "民都洛海峡", group: "ASIA", lat: 12.6, lng: 120.5 },
  "Balabac Strait": { zh: "巴拉巴克海峡", group: "ASIA", lat: 7.8, lng: 117.0 },
  "Lombok Strait": { zh: "龙目海峡", group: "ASIA", lat: -8.5, lng: 115.8 },
  "Ombai Strait": { zh: "翁拜海峡", group: "ASIA", lat: -8.5, lng: 125.0 },
  "Sunda Strait": { zh: "巽他海峡", group: "ASIA", lat: -5.9, lng: 105.5 },
  "Makassar Strait": { zh: "望加锡海峡", group: "ASIA", lat: -2.0, lng: 118.0 },
  "Torres Strait": { zh: "托雷斯海峡", group: "ASIA", lat: -10.0, lng: 142.0 },
  "Bohai Strait": { zh: "渤海海峡", group: "ASIA", lat: 38.5, lng: 120.5 },
  "Bering Strait": { zh: "白令海峡", group: "ASIA", lat: 65.8, lng: -169.0 },
  // Americas
  "Panama Canal": { zh: "巴拿马运河", group: "AMERICAS", lat: 9.1, lng: -79.7 },
  "Yucatan Channel": { zh: "尤卡坦海峡", group: "AMERICAS", lat: 21.5, lng: -85.5 },
  "Windward Passage": { zh: "向风海峡", group: "AMERICAS", lat: 20.0, lng: -73.5 },
  "Mona Passage": { zh: "莫纳海峡", group: "AMERICAS", lat: 18.5, lng: -67.8 },
};

export interface ChokepointDay {
  date: string;
  nTotal: number;
  nContainer: number;
  nTanker: number;
  capacity: number;
}

/** A raw ArcGIS row: one reported day for one chokepoint. */
type ChokepointRow = ChokepointDay & { portname: string };

/** How far a chokepoint sits from its own pre-crisis norm. */
export type ChokepointSeverity = "SEVERE" | "STRESSED" | "NORMAL" | "SURGE";

export interface Chokepoint {
  id: string;
  name: string;
  nameZh: string;
  group: ChokepointGroup;
  lat: number;
  lng: number;
  /** Ascending by date. */
  series: ChokepointDay[];
  latest: ChokepointDay | null;
  /** Mean daily transit calls over the trailing 7 reported days. */
  avg7: number | null;
  /** Mean over the 7 days before that, for the trend arrow. */
  prev7: number | null;
  deltaPct: number | null;
  avg28: number | null;
  /**
   * Mean daily transit calls over BASELINE_START..BASELINE_END — this
   * chokepoint's own recent pre-crisis norm. Null if the window held no rows.
   */
  baseline: number | null;
  /** avg7 as a percentage of baseline. The figure that makes 5/day legible. */
  pctOfBaseline: number | null;
  severity: ChokepointSeverity | null;
  /** Container ships as a share of all transit calls, last 7 days. */
  containerSharePct: number | null;
  /** Busiest single day in the window. */
  peak: ChokepointDay | null;
}

export interface ChokepointSnapshot {
  chokepoints: Chokepoint[];
  /** Most recent date PortWatch has published. */
  latestDate: string;
  windowDays: number;
  /** Human-readable reference window the baselines were computed over. */
  baselineWindow: { start: string; end: string };
  fetchedAt: number;
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

async function getJson(url: string): Promise<any> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`PortWatch responded ${res.status}`);
    return await res.json();
  } finally {
    window.clearTimeout(timer);
  }
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Most recent published date; the dataset lags real time by design. */
async function fetchLatestDate(): Promise<string> {
  const params = new URLSearchParams({
    where: "1=1",
    outFields: "date",
    orderByFields: "date DESC",
    resultRecordCount: "1",
    returnGeometry: "false",
    f: "json",
  });
  const data = await getJson(`${QUERY_URL}?${params.toString()}`);
  const value = data?.features?.[0]?.attributes?.date;
  if (typeof value !== "string") throw new Error("PortWatch returned no dated rows");
  return value.slice(0, 10);
}

/**
 * Pulls the trailing window in pages. ArcGIS caps a single response at 1000
 * features, and the window is ~784 rows today, so this usually costs one call —
 * the loop only exists so added chokepoints cannot silently truncate the data.
 */
async function fetchWindow(startDate: string): Promise<ChokepointRow[]> {
  const rows: ChokepointRow[] = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params = new URLSearchParams({
      where: `date>'${startDate}'`,
      outFields: "date,portname,n_total,n_container,n_tanker,capacity",
      orderByFields: "date ASC",
      resultRecordCount: String(PAGE_SIZE),
      resultOffset: String(page * PAGE_SIZE),
      returnGeometry: "false",
      f: "json",
    });

    const data = await getJson(`${QUERY_URL}?${params.toString()}`);
    const features: any[] = Array.isArray(data?.features) ? data.features : [];

    for (const feature of features) {
      const a = feature?.attributes ?? {};
      const date = typeof a.date === "string" ? a.date.slice(0, 10) : null;
      const name = typeof a.portname === "string" ? a.portname : null;
      if (!date || !name) continue;
      rows.push({
        date,
        portname: name,
        nTotal: num(a.n_total),
        nContainer: num(a.n_container),
        nTanker: num(a.n_tanker),
        capacity: num(a.capacity),
      });
    }

    if (features.length < PAGE_SIZE) break;
  }

  return rows;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Per-chokepoint "normal", as one server-side aggregate.
 *
 * ArcGIS does the averaging, so this costs a single request returning ~28 rows
 * instead of paging a year of dailies. Done once per refresh and reused for
 * every row.
 */
async function fetchBaselines(): Promise<Map<string, number>> {
  const params = new URLSearchParams({
    where: `date>='${BASELINE_START}' AND date<='${BASELINE_END}'`,
    groupByFieldsForStatistics: "portname",
    outStatistics: JSON.stringify([
      { statisticType: "avg", onStatisticField: "n_total", outStatisticFieldName: "baseline" },
      { statisticType: "count", onStatisticField: "date", outStatisticFieldName: "days" },
    ]),
    returnGeometry: "false",
    f: "json",
  });

  const data = await getJson(`${QUERY_URL}?${params.toString()}`);
  const out = new Map<string, number>();
  const features: any[] = Array.isArray(data?.features) ? data.features : [];
  for (const feature of features) {
    const a = feature?.attributes ?? {};
    const name = typeof a.portname === "string" ? a.portname : null;
    const value = typeof a.baseline === "number" ? a.baseline : null;
    const days = typeof a.days === "number" ? a.days : 0;
    // Guard against a chokepoint that only appears for a handful of days in the
    // window — its "average" would be noise, and a wrong baseline is worse than
    // no baseline because the UI prints it as fact.
    if (name && value !== null && value > 0 && days >= 120) out.set(name, value);
  }
  return out;
}

/** Buckets a chokepoint by how far it sits from its own pre-crisis norm. */
export function severityOf(pct: number | null): ChokepointSeverity | null {
  if (pct === null) return null;
  if (pct < 70) return "SEVERE";
  if (pct < 90) return "STRESSED";
  if (pct <= 115) return "NORMAL";
  return "SURGE";
}

export async function fetchChokepoints(): Promise<ChokepointSnapshot> {
  const latestDate = await fetchLatestDate();
  const start = isoDay(new Date(Date.parse(`${latestDate}T00:00:00Z`) - WINDOW_DAYS * DAY_MS));

  // The baseline is a nice-to-have: if the aggregate query is refused, the panel
  // still renders levels and week-on-week moves rather than failing whole.
  const [rows, baselines] = await Promise.all([
    fetchWindow(start),
    fetchBaselines().catch(() => new Map<string, number>()),
  ]);

  const byName = new Map<string, ChokepointDay[]>();
  for (const row of rows) {
    const list = byName.get(row.portname) ?? [];
    list.push({
      date: row.date,
      nTotal: row.nTotal,
      nContainer: row.nContainer,
      nTanker: row.nTanker,
      capacity: row.capacity,
    });
    byName.set(row.portname, list);
  }

  const chokepoints: Chokepoint[] = [];

  byName.forEach((series, name) => {
    series.sort((a, b) => a.date.localeCompare(b.date));

    const meta: ChokepointMeta =
      META[name] ?? { zh: name, group: "ASIA", lat: 0, lng: 0 };

    const last7 = series.slice(-7);
    const prev7 = series.slice(-14, -7);

    const avg7 = mean(last7.map((d) => d.nTotal));
    const prevAvg = mean(prev7.map((d) => d.nTotal));

    const containers7 = last7.reduce((sum, d) => sum + d.nContainer, 0);
    const totals7 = last7.reduce((sum, d) => sum + d.nTotal, 0);

    const peak = series.reduce<ChokepointDay | null>(
      (best, day) => (best === null || day.nTotal > best.nTotal ? day : best),
      null,
    );

    const baseline = baselines.get(name) ?? null;
    const pctOfBaseline =
      avg7 !== null && baseline !== null && baseline > 0 ? (avg7 / baseline) * 100 : null;

    chokepoints.push({
      id: slug(name),
      name,
      nameZh: meta.zh,
      group: meta.group,
      lat: meta.lat,
      lng: meta.lng,
      series,
      latest: series.length > 0 ? series[series.length - 1] : null,
      avg7,
      prev7: prevAvg,
      deltaPct: avg7 !== null && prevAvg !== null && prevAvg > 0 ? ((avg7 - prevAvg) / prevAvg) * 100 : null,
      avg28: mean(series.map((d) => d.nTotal)),
      baseline,
      pctOfBaseline,
      severity: severityOf(pctOfBaseline),
      containerSharePct: totals7 > 0 ? (containers7 / totals7) * 100 : null,
      peak,
    });
  });

  chokepoints.sort((a, b) => (b.avg7 ?? 0) - (a.avg7 ?? 0));

  return {
    chokepoints,
    latestDate,
    windowDays: WINDOW_DAYS,
    baselineWindow: { start: BASELINE_START, end: BASELINE_END },
    fetchedAt: Date.now(),
  };
}

/**
 * Renders the whole window as an inline SVG area chart. Kept here rather than in
 * the component so the geometry is unit-testable and cheap to reason about.
 */
export function sparklinePath(series: ChokepointDay[], width: number, height: number): string {
  if (series.length < 2) return "";
  const values = series.map((d) => d.nTotal);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const stepX = width / (series.length - 1);

  return values
    .map((value, i) => {
      const x = i * stepX;
      const y = height - ((value - min) / span) * (height - 2) - 1;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}
