/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AIS proxy — Cloudflare Worker edition.
 *
 * Why this exists
 * ---------------
 * AIS providers (aisstream.io and every commercial vendor) forbid direct
 * browser connections and require an API key. A key shipped inside a static
 * bundle is a public key, so the client can never talk to the provider itself.
 * This Worker is the missing hop: it holds the key, collects positions on a
 * schedule, and republishes a normalised snapshot that the static site can read
 * with an ordinary key-less GET.
 *
 * Wire-up
 * -------
 *   wrangler secret put AISSTREAM_API_KEY
 *   npx wrangler deploy
 *   # then build the site with:
 *   #   VITE_AIS_PROXY_URL=https://velocortex-ais-proxy.<account>.workers.dev
 *
 * Without that env var the site falls back to the key-less Digitraffic feed and
 * labels its Baltic-only extent in the UI.
 */

const AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";

/** Hard cap on parsed messages for one collection run — this is the CPU budget. */
const DEFAULT_MAX_MESSAGES = 1500;

/** How long to hold the socket open. Wall-clock wait is not billed as CPU. */
const DEFAULT_COLLECT_MS = 45_000;

/** Positions older than this are dropped by the client anyway; mirror it here. */
const SNAPSHOT_TTL_SECONDS = 900;

const DEFAULT_BBOX = "1.0,102.0,7.5,105.0"; // Singapore Strait / Malacca approaches

function parseBbox(value) {
  const parts = String(value || DEFAULT_BBOX)
    .split(",")
    .map((n) => Number(n.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    throw new Error("BBOX must be lat1,lon1,lat2,lon2");
  }
  const [lat1, lon1, lat2, lon2] = parts;
  return [
    [Math.min(lat1, lat2), Math.min(lon1, lon2)],
    [Math.max(lat1, lat2), Math.max(lon1, lon2)],
  ];
}

/** AIS "not available" sentinels, and speeds beyond any hull, become null. */
function speed(value) {
  const n = Number(value);
  return Number.isFinite(n) && n < 102.2 ? n : null;
}

function bearing(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n < 360 ? n : null;
}

function categorise(shipType) {
  if (!Number.isFinite(shipType)) return "OTHER";
  if (shipType >= 80 && shipType <= 89) return "TANKER";
  if (shipType >= 70 && shipType <= 79) return "CARGO";
  if (shipType >= 60 && shipType <= 69) return "PASSENGER";
  if (shipType === 31 || shipType === 32 || shipType === 52) return "TUG";
  return "OTHER";
}

async function collect(env) {
  const apiKey = env.AISSTREAM_API_KEY;
  if (!apiKey) {
    console.error("AISSTREAM_API_KEY is not set; skipping collection");
    return;
  }

  const maxMessages = Number(env.MAX_MESSAGES) || DEFAULT_MAX_MESSAGES;
  const collectMs = Number(env.COLLECT_MS) || DEFAULT_COLLECT_MS;
  const bbox = parseBbox(env.BBOX);

  // PositionReport alone keeps parsing cheap. Adding ShipStaticData would give
  // real vessel classes at roughly double the message volume — opt in only if
  // the deployment has CPU headroom.
  const types = String(env.MESSAGE_TYPES || "PositionReport")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const latest = new Map(); // mmsi -> normalised vessel
  let parsed = 0;
  let socket;

  await new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket?.close();
      } catch {
        /* already closed */
      }
      resolve();
    };

    const timer = setTimeout(finish, collectMs);

    try {
      socket = new WebSocket(AISSTREAM_URL);
    } catch (err) {
      console.error("WebSocket open failed", err);
      finish();
      return;
    }

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          APIKey: apiKey,
          BoundingBoxes: [bbox],
          FilterMessageTypes: types,
        }),
      );
    });

    socket.addEventListener("message", (event) => {
      if (parsed >= maxMessages) {
        finish();
        return;
      }

      let payload;
      try {
        payload = JSON.parse(typeof event.data === "string" ? event.data : "{}");
      } catch {
        return;
      }
      parsed += 1;

      const meta = payload?.MetaData ?? {};
      const mmsi = Number(meta.MMSI);
      if (!Number.isFinite(mmsi)) return;

      if (payload.MessageType === "ShipStaticData") {
        const staticData = payload?.Message?.ShipStaticData ?? {};
        const existing = latest.get(mmsi) ?? {};
        latest.set(mmsi, {
          ...existing,
          mmsi,
          name: typeof staticData.Name === "string" ? staticData.Name.trim() || null : existing.name ?? null,
          shipType: Number.isFinite(staticData.Type) ? staticData.Type : existing.shipType ?? null,
          destination:
            typeof staticData.Destination === "string"
              ? staticData.Destination.trim() || null
              : existing.destination ?? null,
          imo: Number.isFinite(staticData.ImoNumber) ? staticData.ImoNumber : existing.imo ?? null,
        });
        return;
      }

      const report = payload?.Message?.PositionReport ?? {};
      const lat = Number.isFinite(report.Latitude) ? report.Latitude : Number(meta.latitude);
      const lon = Number.isFinite(report.Longitude) ? report.Longitude : Number(meta.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

      const existing = latest.get(mmsi) ?? {};
      const shipType = existing.shipType ?? null;

      latest.set(mmsi, {
        ...existing,
        mmsi,
        name: existing.name ?? (typeof meta.ShipName === "string" ? meta.ShipName.trim() || null : null),
        lat,
        lon,
        sog: speed(report.Sog),
        cog: bearing(report.Cog),
        heading: bearing(report.TrueHeading),
        shipType,
        category: categorise(shipType),
        destination: existing.destination ?? null,
        imo: existing.imo ?? null,
        lastSeen: Date.now(),
      });
    });

    socket.addEventListener("error", () => finish());
    socket.addEventListener("close", () => finish());
  });

  const vessels = [...latest.values()].filter(
    (v) => Number.isFinite(v.lat) && Number.isFinite(v.lon),
  );

  const snapshot = {
    coverageId: `bbox-${bbox[0][0]}-${bbox[0][1]}-${bbox[1][0]}-${bbox[1][1]}`,
    coverageLabelEn: `Bounding box ${bbox[0][0]},${bbox[0][1]} → ${bbox[1][0]},${bbox[1][1]}`,
    coverageLabelZh: `自定义范围 ${bbox[0][0]},${bbox[0][1]} → ${bbox[1][0]},${bbox[1][1]}`,
    sourceName: "aisstream.io (proxied)",
    sourceUrl: "https://aisstream.io/",
    dataUpdatedTime: new Date().toISOString(),
    vessels,
    // Reported for observability; the client recomputes its own aggregates.
    diagnostics: { parsed, collected: vessels.length, messageTypes: types },
  };

  await env.AIS_KV.put("snapshot", JSON.stringify(snapshot), {
    expirationTtl: SNAPSHOT_TTL_SECONDS,
  });
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=60",
};

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(collect(env));
  },

  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    if (url.pathname !== "/snapshot") {
      return new Response(JSON.stringify({ error: "not found", hint: "GET /snapshot" }), {
        status: 404,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const cached = await env.AIS_KV.get("snapshot");
    if (cached === null) {
      return new Response(
        JSON.stringify({ error: "no snapshot yet", hint: "wait for the next cron tick" }),
        { status: 503, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    // Serve the stored string as-is: re-serialising costs CPU for nothing.
    return new Response(cached, {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  },
};
