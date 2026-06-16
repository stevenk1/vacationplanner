import PocketBase from 'pocketbase';
import type { Place, SubPeriod } from '../types';

// Same-origin: the dev server (Vite) and the Docker reverse proxy (Caddy) both
// forward "/api" to PocketBase, so a relative base URL works in both.
export const pb = new PocketBase('/');

// React Query manages request lifecycles; disable PB's own auto-cancellation
// so parallel/refetched queries don't cancel each other.
pb.autoCancellation(false);

/**
 * URLs for a record's cached photo files, served by PocketBase from its file storage
 * (local volume or S3). Pass a `thumb` (e.g. '400x300') to get a generated thumbnail.
 */
function recordPhotoUrls(
  record: { id: string; collectionId?: string; collectionName?: string },
  filenames: string[] | undefined,
  opts?: { thumb?: string },
): string[] {
  return (filenames ?? []).map((filename) =>
    pb.files.getUrl(record, filename, opts?.thumb ? { thumb: opts.thumb } : undefined),
  );
}

/** URLs for a place's cached Google Places photos. */
export function placePhotoUrls(place: Place, opts?: { thumb?: string }): string[] {
  return recordPhotoUrls(place, place.photos, opts);
}

/** URLs for a sub-period stay's cached Airbnb listing photos. */
export function stayPhotoUrls(sub: SubPeriod, opts?: { thumb?: string }): string[] {
  return recordPhotoUrls(sub, sub.stayPhotos, opts);
}
