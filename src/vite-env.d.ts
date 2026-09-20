/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional URL of a server-side AIS proxy (e.g. a Cloudflare Worker) that
   * returns a normalised global AIS snapshot. AIS providers such as
   * aisstream.io forbid direct browser connections and require an API key, so
   * global coverage only becomes available once such a proxy is deployed.
   *
   * When this is unset the nearshore panel falls back to the key-less
   * Digitraffic open feed, which covers the Baltic Sea only.
   */
  readonly VITE_AIS_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Build timestamp injected at bundle time (see vite.config.ts). */
declare const __BUILD_STAMP__: string;
