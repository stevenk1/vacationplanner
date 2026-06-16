import PocketBase from 'pocketbase';
import type { Place } from '../types';

// Same-origin: the dev server (Vite) and the Docker reverse proxy (Caddy) both
// forward "/api" to PocketBase, so a relative base URL works in both.
export const pb = new PocketBase('/');

// React Query manages request lifecycles; disable PB's own auto-cancellation
// so parallel/refetched queries don't cancel each other.
pb.autoCancellation(false);

/**
 * URLs for a place's cached photos, served by PocketBase from its file storage
 * (local volume or S3). Pass a `thumb` (e.g. '400x300') to get a generated thumbnail.
 */
export function placePhotoUrls(place: Place, opts?: { thumb?: string }): string[] {
  return (place.photos ?? []).map((filename) =>
    pb.files.getUrl(place, filename, opts?.thumb ? { thumb: opts.thumb } : undefined),
  );
}
