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

export interface ChokepointMeta {
  zh: string;
  group: ChokepointGroup;
  /**
   * Qualitative read on how well community AIS receivers cover this chokepoint.
   * This is an editorial judgement based on terrestrial receiver density, NOT a
   * field published by PortWatch — the UI says so explicitly.
   */
  ais: AisAvailability;
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

const META: Record<string, ChokepointMeta> = {
  // Red Sea & Suez — the corridors community AIS covers worst.
  "Suez Canal": { zh: "苏伊士运河", group: "RED_SEA", ais: "SPARSE" },
  "Bab el-Mandeb Strait": { zh: "曼德海峡", group: "RED_SEA", ais: "GAP" },
  // Persian Gulf
  "Strait of Hormuz": { zh: "霍尔木兹海峡", group: "GULF", ais: "GAP" },
  // Cape route — the detour benchmark for the Red Sea crisis.
  "Cape of Good Hope": { zh: "好望角", group: "DETOUR", ais: "GOOD" },
  "Magellan Strait": { zh: "麦哲伦海峡", group: "DETOUR", ais: "GOOD" },
  // European waters
  "Gibraltar Strait": { zh: "直布罗陀海峡", group: "EUROPE", ais: "GOOD" },
  "Dover Strait": { zh: "多佛海峡", group: "EUROPE", ais: "GOOD" },
  "Oresund Strait": { zh: "厄勒海峡", group: "EUROPE", ais: "GOOD" },
  "Bosporus Strait": { zh: "博斯普鲁斯海峡", group: "EUROPE", ais: "SPARSE" },
  "Kerch Strait": { zh: "刻赤海峡", group: "EUROPE", ais: "GAP" },
  // Asia–Pacific
  "Malacca Strait": { zh: "马六甲海峡", group: "ASIA", ais: "GOOD" },
  "Taiwan Strait": { zh: "台湾海峡", group: "ASIA", ais: "GOOD" },
  "Korea Strait": { zh: "朝鲜海峡", group: "ASIA", ais: "GOOD" },
  "Tsugaru Strait": { zh: "津轻海峡", group: "ASIA", ais: "GOOD" },
  "Luzon Strait": { zh: "吕宋海峡", group: "ASIA", ais: "GOOD" },
  "Mindoro Strait": { zh: "民都洛海峡", group: "ASIA", ais: "GOOD" },
  "Balabac Strait": { zh: "巴拉巴克海峡", group: "ASIA", ais: "GOOD" },
  "Lombok Strait": { zh: "龙目海峡", group: "ASIA", ais: "GOOD" },
  "Ombai Strait": { zh: "翁拜海峡", group: "ASIA", ais: "SPARSE" },
  "Sunda Strait": { zh: "巽他海峡", group: "ASIA", ais: "GOOD" },
  "Makassar Strait": { zh: "望加锡海峡", group: "ASIA", ais: "GOOD" },
  "Torres Strait": { zh: "托雷斯海峡", group: "ASIA", ais: "SPARSE" },
  "Bohai Strait": { zh: "渤海海峡", group: "ASIA", ais: "GOOD" },
  "Bering Strait": { zh: "白令海峡", group: "ASIA", ais: "SPARSE" },
  // Americas
  "Panama Canal": { zh: "巴拿马运河", group: "AMERICAS", ais: "GOOD" },
  "Yucatan Channel": { zh: "尤卡坦海峡", group: "AMERICAS", ais: "GOOD" },
  "Windward Passage": { zh: "向风海峡", group: "AMERICAS", ais: "SPARSE" },
  "Mona Passage": { zh: "莫纳海峡", group: "AMERICAS", ais: "SPARSE" },
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

export interface Chokepoint {
  id: string;
  name: string;
  nameZh: string;
  group: ChokepointGroup;
  ais: AisAvailability;
  /** Ascending by date. */
  series: ChokepointDay[];
  latest: ChokepointDay | null;
  /** Mean daily transit calls over the trailing 7 reported days. */
  avg7: number | null;
  /** Mean over the 7 days before that, for the trend arrow. */
  prev7: number | null;
  deltaPct: number | null;
  avg28: number | null;
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

export async function fetchChokepoints(): Promise<ChokepointSnapshot> {
  const latestDate = await fetchLatestDate();
  const start = isoDay(new Date(Date.parse(`${latestDate}T00:00:00Z`) - WINDOW_DAYS * DAY_MS));

  const rows = await fetchWindow(start);

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

    const meta: ChokepointMeta = META[name] ?? { zh: name, group: "ASIA", ais: "SPARSE" };

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

    chokepoints.push({
      id: slug(name),
      name,
      nameZh: meta.zh,
      group: meta.group,
      ais: meta.ais,
      series,
      latest: series.length > 0 ? series[series.length - 1] : null,
      avg7,
      prev7: prevAvg,
      deltaPct: avg7 !== null && prevAvg !== null && prevAvg > 0 ? ((avg7 - prevAvg) / prevAvg) * 100 : null,
      avg28: mean(series.map((d) => d.nTotal)),
      containerSharePct: totals7 > 0 ? (containers7 / totals7) * 100 : null,
      peak,
    });
  });

  chokepoints.sort((a, b) => (b.avg7 ?? 0) - (a.avg7 ?? 0));

  return { chokepoints, latestDate, windowDays: WINDOW_DAYS, fetchedAt: Date.now() };
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
