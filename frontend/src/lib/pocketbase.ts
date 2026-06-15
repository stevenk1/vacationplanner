import PocketBase from 'pocketbase';

// Same-origin: the dev server (Vite) and the Docker reverse proxy (Caddy) both
// forward "/api" to PocketBase, so a relative base URL works in both.
export const pb = new PocketBase('/');

// React Query manages request lifecycles; disable PB's own auto-cancellation
// so parallel/refetched queries don't cancel each other.
pb.autoCancellation(false);
