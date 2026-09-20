# velocortex-ais-proxy

Turns a keyed AIS feed into a key-less JSON snapshot the static site can read.

## Why a proxy is required

AIS providers are unanimous on one point: the browser must not connect directly,
and the API key must not ship to the client. A key inside a static bundle is a
public key. This Worker is the missing hop — it holds the key, collects
positions on a schedule, and republishes a normalised snapshot over an ordinary
`GET`. The site then loads it when built with:

```
VITE_AIS_PROXY_URL=https://velocortex-ais-proxy.<account>.workers.dev
```

Without that variable the site falls back to the key-less Digitraffic feed and
labels its Baltic-only extent in the UI. Nothing breaks either way.

## Deploy

```bash
cd workers/ais-proxy
npm install -g wrangler                 # if you do not have it
wrangler kv namespace create AIS_KV     # copy the id into wrangler.toml
wrangler secret put AISSTREAM_API_KEY   # free key from https://aisstream.io/
wrangler deploy
```

Then point the site at it and rebuild.

## What it returns

`GET /snapshot` → JSON

```json
{
  "coverageId": "bbox-1-102-7.5-105",
  "coverageLabelEn": "Bounding box 1,102 → 7.5,105",
  "sourceName": "aisstream.io (proxied)",
  "dataUpdatedTime": "2026-09-20T05:40:00.000Z",
  "vessels": [
    { "mmsi": 563012345, "name": "EXAMPLE", "lat": 1.24, "lon": 103.8,
      "sog": 12.4, "cog": 87.1, "heading": 88, "shipType": 70,
      "category": "CARGO", "destination": "SGSIN", "imo": 9876543,
      "lastSeen": 1789846800000 }
  ]
}
```

`GET /health` → `{"ok":true}`

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `AISSTREAM_API_KEY` | — | **Secret.** Set with `wrangler secret put`. |
| `BBOX` | `1.0,102.0,7.5,105.0` | `lat1,lon1,lat2,lon2`. Keep it tight — see below. |
| `COLLECT_MS` | `45000` | How long the socket stays open per run. |
| `MAX_MESSAGES` | `1500` | Hard cap on parsed messages; this is the CPU budget guard. |
| `MESSAGE_TYPES` | `PositionReport` | Add `ShipStaticData` for real vessel classes. |

## Honest limitations

- **The free plan is tight.** Cron-triggered Workers get a 10 ms CPU budget
  (network waiting is not billed, parsing is). A wide bounding box will blow
  through it and fail with `Error 1102`. Keep `BBOX` to one corridor, keep
  `MAX_MESSAGES` low, and start with `PositionReport` only. Sustained
  multi-region collection wants a paid plan or an ordinary small server.
- **Community AIS has no coverage where you may want it most.** aisstream
  aggregates volunteer shore stations: the Red Sea, Gulf of Aden and Persian
  Gulf are effectively blank, while the Baltic, North Sea, Mediterranean and
  Malacca Strait are dense. Satellite AIS is the only fix, and it is a paid
  product (MarineTraffic/Kpler, HiFleet, Spire).
- **Vessel classes need `ShipStaticData`.** Without it every vessel reports as
  `OTHER`, because a position report carries no ship-type code.
- **This template is not exercised against a live key in this repository.** It
  mirrors the runtime contract in `src/services/ais.ts`; verify it against your
  own key before relying on it.
