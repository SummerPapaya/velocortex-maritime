/**
 * Builds a compact inline world-land SVG path for the VeloCortex live map.
 * Source: Natural Earth 110m land (public domain). Projection: Web Mercator,
 * clamped to ±82° so the poles do not blow the scale up.
 *
 * Output: src/data/worldMap.ts
 */
import { writeFileSync } from "node:fs";

const SRC =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson";

const W = 3600;                 // viewBox width in projected units
const LAT_TOP = 72;             // northern framing edge
const LAT_BOT = -58;            // southern framing edge — crops Antarctica, which
                                // no shipping corridor in this panel needs
const MIN_RING_PX = 7;          // drop rings smaller than this in projected units
const EPSILON = 1.2;            // Douglas-Peucker tolerance, in projected units

const K = W / (2 * Math.PI);    // Mercator scale

function project(lon, lat) {
  const phi = Math.max(LAT_BOT, Math.min(LAT_TOP, lat)) * (Math.PI / 180);
  const x = K * ((lon * Math.PI) / 180 + Math.PI);
  const y = K * (Math.PI - Math.log(Math.tan(Math.PI / 4 + phi / 2)));
  return [x, y];
}

// Web Mercator y for the framing edges, so the viewBox crops exactly there.
const TOP = project(0, LAT_TOP)[1];
const BOT = project(0, LAT_BOT)[1];
const H = BOT - TOP;

/** Perpendicular distance from p to the segment ab. */
function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Iterative Douglas-Peucker (recursion depth is unsafe on long coastlines). */
function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [lo, hi] = stack.pop();
    let far = -1, best = eps;
    for (let i = lo + 1; i < hi; i++) {
      const d = segDist(pts[i], pts[lo], pts[hi]);
      if (d > best) { best = d; far = i; }
    }
    if (far > 0) {
      keep[far] = 1;
      stack.push([lo, far], [far, hi]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

const res = await fetch(SRC);
if (!res.ok) throw new Error("land geojson HTTP " + res.status);
const gj = await res.json();

const rings = [];
function collect(geom) {
  if (!geom) return;
  if (geom.type === "Polygon") geom.coordinates.forEach((r) => rings.push(r));
  else if (geom.type === "MultiPolygon") geom.coordinates.forEach((p) => p.forEach((r) => rings.push(r)));
  else if (geom.type === "GeometryCollection") geom.geometries.forEach(collect);
}
for (const f of gj.features) collect(f.geometry);

const parts = [];
let kept = 0, dropped = 0, points = 0;

for (const ring of rings) {
  const proj = ring.map(([lon, lat]) => project(lon, lat));

  // Ring extent, ignoring any projection clamp artefacts
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of proj) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const maxSpan = Math.max(maxX - minX, maxY - minY);
  if (maxSpan < MIN_RING_PX) { dropped++; continue; }
  // Rings fully outside the framed latitude band (Antarctica) — skip the bytes
  if (maxY < 0 || minY > H) { dropped++; continue; }

  let s = simplify(proj, EPSILON);
  // Close the ring and normalise into viewBox space
  if (s.length < 3) { dropped++; continue; }
  const d = s
    .map(([x, y], i) => {
      const px = Math.round(x * 10) / 10;
      const py = Math.round((y - TOP) * 10) / 10;
      return `${i === 0 ? "M" : "L"}${px} ${py}`;
    })
    .join("");
  parts.push(d + "Z");
  kept++;
  points += s.length;
}

const path = parts.join("");

const file = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Inline world land outline for the live map layer.
 *
 * Generated from Natural Earth 110m land (public domain) by
 * \`scripts/build-world-map.mjs\` — do not hand-edit. Simplified with
 * Douglas-Peucker at ~1 projected unit and framed to ${LAT_BOT}°–${LAT_TOP}° so the
 * frame reads like a maritime chart and Antarctica is out of shot. Inlining it
 * keeps the map working offline and avoids a tile-server dependency and its
 * attribution/ToS obligations.
 */

/** Projected viewBox width. Mercator, so height is not 2:1. */
export const WORLD_VIEWBOX_W = ${W};
export const WORLD_VIEWBOX_H = ${Math.round(H * 10) / 10};
export const WORLD_LAT_TOP = ${LAT_TOP};
export const WORLD_LAT_BOT = ${LAT_BOT};

/** SVG path data in the viewBox space above. */
export const WORLD_LAND_PATH =
  "${path}";

/** Project lon/lat into the same viewBox space as WORLD_LAND_PATH. */
export function projectLonLat(lon: number, lat: number): { x: number; y: number } {
  const clamp = Math.max(WORLD_LAT_BOT, Math.min(WORLD_LAT_TOP, lat));
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const k = WORLD_VIEWBOX_W / (2 * Math.PI);
  const mercY = (deg: number) => k * (Math.PI - Math.log(Math.tan(Math.PI / 4 + rad(deg) / 2)));
  return {
    x: k * (rad(lon) + Math.PI),
    y: mercY(clamp) - mercY(WORLD_LAT_TOP),
  };
}

/** Projected bounding box of a lon/lat extent, for viewport framing. */
export function projectBounds(
  minLon: number, minLat: number, maxLon: number, maxLat: number,
): { x: number; y: number; w: number; h: number } {
  const a = projectLonLat(minLon, maxLat);
  const b = projectLonLat(maxLon, minLat);
  return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
}
`;

writeFileSync(process.argv[2] || "worldMap.ts", file, "utf8");
console.log(
  JSON.stringify({ ringsIn: rings.length, ringsKept: kept, ringsDropped: dropped, points, pathChars: path.length, fileKB: Math.round(file.length / 1024), H: Math.round(H) }, null, 1),
);
