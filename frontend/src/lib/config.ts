declare global {
  interface Window {
    __APP_CONFIG__?: { mapboxToken?: string };
  }
}

// Mapbox token: runtime config.js (Docker) first, then Vite env (local dev).
export const MAPBOX_TOKEN: string =
  window.__APP_CONFIG__?.mapboxToken || (import.meta.env.VITE_MAPBOX_TOKEN as string) || '';

export const hasMapbox = MAPBOX_TOKEN.trim().length > 0;
