/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PortRef, TRACKED_PORTS } from "../data/ports";

/**
 * Live port weather + sea state, sourced from the public Open-Meteo APIs.
 *
 * Both endpoints are free, key-less and CORS-enabled, which is what makes a
 * genuinely live layer possible from a purely static bundle:
 *   - https://api.open-meteo.com/v1/forecast          (air / wind / precip)
 *   - https://marine-api.open-meteo.com/v1/marine     (wave / swell)
 *
 * No API key is required, so nothing sensitive is embedded in the client.
 */

export type MarineRisk = "CALM" | "WATCH" | "ALERT";

export interface PortWeather {
  code: string;
  name: string;
  nameZh: string;
  corridor: PortRef["corridor"];
  localTime: string | null;
  tempC: number | null;
  windKt: number | null;
  gustKt: number | null;
  precipMm: number | null;
  weatherCode: number | null;
  waveM: number | null;
  wavePeriodS: number | null;
  swellM: number | null;
  risk: MarineRisk;
}

export interface PortWeatherSnapshot {
  ports: PortWeather[];
  fetchedAt: number;
  /** Open-Meteo model observation time of the freshest returned sample. */
  observedAt: string | null;
  /** Whether these samples came from Open-Meteo or from the bundled snapshot. */
  feed: FeedStatus;
}

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const MARINE_URL = "https://marine-api.open-meteo.com/v1/marine";
const REQUEST_TIMEOUT_MS = 12_000;

function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Operational thresholds for a container terminal approach: sustained wind and
 * combined sea state are the two factors that actually force berth windows to
 * slip, so the flag is driven by whichever is worse.
 */
export function classifyRisk(windKt: number | null, waveM: number | null): MarineRisk {
  const wind = windKt ?? 0;
  const wave = waveM ?? 0;
  if (wind >= 34 || wave >= 4.0) return "ALERT";
  if (wind >= 22 || wave >= 2.5) return "WATCH";
  return "CALM";
}

async function getJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
    return (await res.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

import { FEED_LIVE, feedFromSnapshot, type FeedStatus } from "./feedStatus";
import { loadLiveSnapshot, snapshotStamp } from "./liveSnapshot";

/** Batched Open-Meteo request URLs — one call covers every tracked port. */
function buildUrls(ports: PortRef[]): { forecastUrl: string; marineUrl: string } {
  const lat = ports.map((p) => p.lat).join(",");
  const lng = ports.map((p) => p.lng).join(",");
  const tz = ports.map((p) => encodeURIComponent(p.tz)).join(",");
  // Wave model runs on an ocean grid: estuary berths fall on land cells and
  // return null, so sea state uses the port's offshore reference point.
  const seaLat = ports.map((p) => p.seaLat ?? p.lat).join(",");
  const seaLng = ports.map((p) => p.seaLng ?? p.lng).join(",");

  return {
    forecastUrl:
      `${FORECAST_URL}?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code` +
      `&wind_speed_unit=kn&timezone=${tz}`,
    marineUrl:
      `${MARINE_URL}?latitude=${seaLat}&longitude=${seaLng}` +
      `&current=wave_height,wave_period,swell_wave_height&timezone=${tz}`,
  };
}

/**
 * The single parser for an Open-Meteo response. Live payloads and the bundled
 * snapshot are decoded by the same code, so a cached panel and a live one can
 * only differ in freshness — never in shape.
 */
function parsePortWeather(
  ports: PortRef[],
  forecastRaw: unknown,
  marineRaw: unknown,
  feed: FeedStatus,
  fetchedAt: number,
): PortWeatherSnapshot {
  const forecastList = asArray(forecastRaw as Record<string, unknown>);
  const marineList = asArray(marineRaw as Record<string, unknown>);

  const result: PortWeather[] = ports.map((port, i) => {
    const f = (forecastList[i] ?? {}) as Record<string, any>;
    const m = (marineList[i] ?? {}) as Record<string, any>;

    const windKt = num(f?.current?.wind_speed_10m);
    const waveM = num(m?.current?.wave_height);

    return {
      code: port.code,
      name: port.name,
      nameZh: port.nameZh,
      corridor: port.corridor,
      localTime: typeof f?.current?.time === "string" ? f.current.time : null,
      tempC: num(f?.current?.temperature_2m),
      windKt,
      gustKt: num(f?.current?.wind_gusts_10m),
      precipMm: num(f?.current?.precipitation),
      weatherCode: num(f?.current?.weather_code),
      waveM,
      wavePeriodS: num(m?.current?.wave_period),
      swellM: num(m?.current?.swell_wave_height),
      risk: classifyRisk(windKt, waveM),
    };
  });

  const observedAt =
    (forecastList.find((f: any) => typeof f?.current?.time === "string") as any)?.current?.time ?? null;

  return { ports: result, fetchedAt, observedAt, feed };
}

export async function fetchPortWeatherLive(ports: PortRef[] = TRACKED_PORTS): Promise<PortWeatherSnapshot> {
  const { forecastUrl, marineUrl } = buildUrls(ports);
  const [forecastRaw, marineRaw] = await Promise.all([
    getJson<unknown>(forecastUrl),
    // Sea state is a bonus layer: if the marine model has no cell for a port we
    // still want wind and temperature to render.
    getJson<unknown>(marineUrl).catch(() => []),
  ]);
  const snapshot = parsePortWeather(ports, forecastRaw, marineRaw, FEED_LIVE, Date.now());
  if (snapshot.ports.every((p) => p.tempC === null && p.windKt === null)) {
    throw new Error("Open-Meteo returned no usable samples");
  }
  return snapshot;
}

/**
 * Decodes the bundled build-time snapshot.
 *
 * The snapshot was captured for TRACKED_PORTS in their declared order, which is
 * the only way this is ever called, so the position-to-port mapping holds.
 */
export async function portWeatherFromSnapshot(
  error: unknown,
  ports: PortRef[] = TRACKED_PORTS,
): Promise<PortWeatherSnapshot> {
  const snapshot = await loadLiveSnapshot();
  const raw = snapshot.ports ?? {};
  if (!raw.forecast) {
    throw new Error(`live Open-Meteo unreachable and the bundled snapshot holds no weather (${String(error)})`);
  }
  const generatedAt = snapshotStamp(snapshot);
  return parsePortWeather(
    ports,
    raw.forecast,
    raw.marine,
    feedFromSnapshot(generatedAt, error),
    Date.parse(generatedAt),
  );
}

/** Live first, bundled snapshot second. See `feedStatus.ts` for why. */
export async function fetchPortWeather(ports: PortRef[] = TRACKED_PORTS): Promise<PortWeatherSnapshot> {
  try {
    return await fetchPortWeatherLive(ports);
  } catch (error) {
    return portWeatherFromSnapshot(error, ports);
  }
}

/** WMO weather interpretation codes, compressed to the cases worth labelling. */
export function weatherCodeLabel(code: number | null, lang: "en" | "zh"): string {
  if (code === null) return lang === "zh" ? "—" : "—";
  const zh: Record<number, string> = {
    0: "晴", 1: "晴间多云", 2: "多云", 3: "阴",
    45: "雾", 48: "雾凇", 51: "小毛毛雨", 53: "毛毛雨", 55: "大毛毛雨",
    61: "小雨", 63: "中雨", 65: "大雨", 66: "冻雨", 67: "强冻雨",
    71: "小雪", 73: "中雪", 75: "大雪", 77: "米雪",
    80: "阵雨", 81: "强阵雨", 82: "暴雨", 85: "阵雪", 86: "强阵雪",
    95: "雷暴", 96: "雷暴伴冰雹", 99: "强雷暴伴冰雹",
  };
  const en: Record<number, string> = {
    0: "Clear", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
    61: "Light rain", 63: "Rain", 65: "Heavy rain", 66: "Freezing rain", 67: "Heavy freezing rain",
    71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
    80: "Rain showers", 81: "Heavy showers", 82: "Violent showers", 85: "Snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Severe thunderstorm",
  };
  const table = lang === "zh" ? zh : en;
  return table[code] ?? (lang === "zh" ? `代码 ${code}` : `Code ${code}`);
}
