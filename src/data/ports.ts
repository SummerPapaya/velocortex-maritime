/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Ports queried against the public Open-Meteo forecast + marine APIs.
 * Coordinates are the port authority reference point; timezone strings are
 * IANA names passed straight through to Open-Meteo so local time is correct.
 */
export interface PortRef {
  code: string;
  name: string;
  nameZh: string;
  lat: number;
  lng: number;
  tz: string;
  /** Corridor tag used to group the tiles in the UI. */
  corridor: "ASIA" | "EUROPE" | "AMERICAS" | "MIDDLE_EAST";
  /**
   * Optional open-water reference point for the wave model. Estuary and
   * river-berth ports (Shanghai, Ningbo, Hamburg, Yantian) sit on grid cells
   * the wave model treats as land and returns null for, so sea state is read
   * from the nearest offshore cell instead. Air temperature and wind always
   * come from the port's own coordinates.
   */
  seaLat?: number;
  seaLng?: number;
}

export const TRACKED_PORTS: PortRef[] = [
  { code: "CNSHA", name: "Shanghai", nameZh: "上海港", lat: 31.2304, lng: 121.4737, tz: "Asia/Shanghai", corridor: "ASIA", seaLat: 31.10, seaLng: 122.50 },
  { code: "CNNGB", name: "Ningbo-Zhoushan", nameZh: "宁波舟山港", lat: 29.8683, lng: 121.5440, tz: "Asia/Shanghai", corridor: "ASIA", seaLat: 29.80, seaLng: 122.60 },
  { code: "CNYTN", name: "Shenzhen Yantian", nameZh: "深圳盐田港", lat: 22.5710, lng: 114.2380, tz: "Asia/Shanghai", corridor: "ASIA", seaLat: 22.50, seaLng: 114.40 },
  { code: "SGSIN", name: "Singapore", nameZh: "新加坡港", lat: 1.2644, lng: 103.8400, tz: "Asia/Singapore", corridor: "ASIA" },
  { code: "KRPUS", name: "Busan", nameZh: "釜山港", lat: 35.1028, lng: 129.0403, tz: "Asia/Seoul", corridor: "ASIA" },
  { code: "NLRTM", name: "Rotterdam", nameZh: "鹿特丹港", lat: 51.9500, lng: 4.1400, tz: "Europe/Amsterdam", corridor: "EUROPE" },
  { code: "DEHAM", name: "Hamburg", nameZh: "汉堡港", lat: 53.5461, lng: 9.9500, tz: "Europe/Berlin", corridor: "EUROPE", seaLat: 54.05, seaLng: 7.95 },
  { code: "GRPIR", name: "Piraeus", nameZh: "比雷埃夫斯港", lat: 37.9420, lng: 23.6200, tz: "Europe/Athens", corridor: "EUROPE" },
  { code: "USLAX", name: "Los Angeles", nameZh: "洛杉矶港", lat: 33.7400, lng: -118.2700, tz: "America/Los_Angeles", corridor: "AMERICAS" },
  { code: "USNYC", name: "New York / NJ", nameZh: "纽约-新泽西港", lat: 40.6700, lng: -74.0400, tz: "America/New_York", corridor: "AMERICAS" },
  { code: "BRSSZ", name: "Santos", nameZh: "桑托斯港", lat: -23.9600, lng: -46.3000, tz: "America/Sao_Paulo", corridor: "AMERICAS" },
  { code: "AEJEA", name: "Jebel Ali", nameZh: "杰贝阿里港", lat: 25.0100, lng: 55.0600, tz: "Asia/Dubai", corridor: "MIDDLE_EAST" },
  { code: "EGPSD", name: "Port Said", nameZh: "塞得港", lat: 31.2600, lng: 32.3000, tz: "Africa/Cairo", corridor: "MIDDLE_EAST" },
];

export const CORRIDOR_LABELS: Record<PortRef["corridor"], { en: string; zh: string }> = {
  ASIA: { en: "Asia – Pacific", zh: "亚太" },
  EUROPE: { en: "North Europe / Med", zh: "北欧与地中海" },
  AMERICAS: { en: "Americas", zh: "美洲" },
  MIDDLE_EAST: { en: "Middle East / Suez", zh: "中东与苏伊士" },
};
