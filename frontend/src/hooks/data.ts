import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import { drivingRoute } from '../lib/mapbox';
import type { Holiday, Place, SubPeriod } from '../types';

// ── Holidays ───────────────────────────────────────────────────────────────
export function useHolidays() {
  return useQuery({
    queryKey: ['holidays'],
    queryFn: () => pb.collection('holidays').getFullList<Holiday>({ sort: '-startDate,-created' }),
  });
}

export function useHoliday(id?: string) {
  return useQuery({
    enabled: !!id,
    queryKey: ['holiday', id],
    queryFn: () => pb.collection('holidays').getOne<Holiday>(id!),
  });
}

export function useCreateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Holiday>) => pb.collection('holidays').create<Holiday>(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holidays'] }),
  });
}

export function useUpdateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Holiday> }) =>
      pb.collection('holidays').update<Holiday>(id, data),
    onSuccess: (h) => {
      qc.invalidateQueries({ queryKey: ['holidays'] });
      qc.invalidateQueries({ queryKey: ['holiday', h.id] });
    },
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pb.collection('holidays').delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holidays'] });
      qc.invalidateQueries({ queryKey: ['subperiods'] });
      qc.invalidateQueries({ queryKey: ['places'] });
    },
  });
}

// ── Sub-periods ──────────────────────────────────────────────────────────────
export function useSubPeriods(holidayId?: string) {
  return useQuery({
    enabled: !!holidayId,
    queryKey: ['subperiods', holidayId],
    queryFn: () =>
      pb.collection('subperiods').getFullList<SubPeriod>({
        filter: `holiday="${holidayId}"`,
        sort: 'startDate,created',
      }),
  });
}

export function useAllSubPeriods() {
  return useQuery({
    queryKey: ['subperiods', 'all'],
    queryFn: () => pb.collection('subperiods').getFullList<SubPeriod>(),
  });
}

export function useCreateSubPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SubPeriod>) => pb.collection('subperiods').create<SubPeriod>(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subperiods'] }),
  });
}

/** Updates a sub-period and, when the stay moved, recomputes its places' drive times. */
export function useUpdateSubPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
      recompute,
    }: {
      id: string;
      data: Partial<SubPeriod>;
      recompute?: boolean;
    }) => {
      const updated = await pb.collection('subperiods').update<SubPeriod>(id, data);
      if (recompute && updated.stayLat != null && updated.stayLng != null) {
        const places = await pb.collection('places').getFullList<Place>({ filter: `subperiod="${id}"` });
        await Promise.all(
          places.map(async (p) => {
            if (p.lat == null || p.lng == null) return;
            const r = await drivingRoute(
              { lat: updated.stayLat, lng: updated.stayLng },
              { lat: p.lat, lng: p.lng },
            );
            if (r) await pb.collection('places').update(p.id, { driveSeconds: r.seconds, driveMeters: r.meters });
          }),
        );
      }
      return updated;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subperiods'] });
      qc.invalidateQueries({ queryKey: ['places'] });
    },
  });
}

export function useDeleteSubPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pb.collection('subperiods').delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subperiods'] });
      qc.invalidateQueries({ queryKey: ['places'] });
    },
  });
}

// ── Places ───────────────────────────────────────────────────────────────────
export function usePlacesForHoliday(subIds: string[]) {
  const key = subIds.slice().sort().join(',');
  return useQuery({
    enabled: subIds.length > 0,
    queryKey: ['places', 'byHoliday', key],
    queryFn: () => {
      const filter = subIds.map((id) => `subperiod="${id}"`).join(' || ');
      return pb.collection('places').getFullList<Place>({ filter, sort: 'created' });
    },
  });
}

export function useAllPlaces() {
  return useQuery({
    queryKey: ['places', 'all'],
    queryFn: () => pb.collection('places').getFullList<Place>(),
  });
}

type PlaceInput = { data: Partial<Place>; stay?: { lat: number; lng: number } | null };

async function withDrive(data: Partial<Place>, stay?: { lat: number; lng: number } | null) {
  if (stay && (stay.lat || stay.lng) && data.lat != null && data.lng != null) {
    const r = await drivingRoute(stay, { lat: data.lat, lng: data.lng });
    if (r) return { ...data, driveSeconds: r.seconds, driveMeters: r.meters };
  }
  return data;
}

export function useCreatePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, stay }: PlaceInput) =>
      pb.collection('places').create<Place>(await withDrive(data, stay)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['places'] }),
  });
}

export function useUpdatePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data, stay }: PlaceInput & { id: string }) =>
      pb.collection('places').update<Place>(id, await withDrive(data, stay)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['places'] }),
  });
}

export function useDeletePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pb.collection('places').delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['places'] }),
  });
}

/**
 * Asks the backend to fetch + cache Google Places photos for a place (key stays server-side).
 * Fired in the background after a place is added or moved; refreshes places when done.
 */
export function useFetchPlacePhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pb.send(`/api/places/${id}/photos`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['places'] }),
  });
}

// ── Airbnb stay import ─────────────────────────────────────────────────────
/** Normalized result of POST /api/airbnb/scrape (the backend holds the Apify token). */
export interface AirbnbScrapeResult {
  ok: boolean;
  error?: string;
  status?: number;
  stayName?: string;
  stayAddress?: string;
  stayLat?: number;
  stayLng?: number;
  stayCountryCode?: string;
  photoUrls?: string[];
  price?: number | null;
  currency?: string;
  rating?: number | null;
  reviewsCount?: number | null;
  sourceUrl?: string;
}

/**
 * Scrapes an Airbnb listing via Apify (server-side) and returns its name/address/coords,
 * price/rating and photo URLs. Costs one Apify run — fired explicitly from the stay editor.
 */
export function useScrapeAirbnb() {
  return useMutation({
    mutationFn: (body: { url: string; checkIn?: string; checkOut?: string; adults?: number }) =>
      pb.send('/api/airbnb/scrape', { method: 'POST', body }) as Promise<AirbnbScrapeResult>,
  });
}

/**
 * Asks the backend to download + cache the given Airbnb photo URLs onto a sub-period's stayPhotos
 * (no Apify call). Fired in the background after the stay is saved; refreshes sub-periods when done.
 */
export function useFetchStayPhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, photoUrls }: { id: string; photoUrls: string[] }) =>
      pb.send(`/api/subperiods/${id}/stay-photos`, { method: 'POST', body: { photoUrls } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subperiods'] }),
  });
}

export function useRecomputePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ place, stay }: { place: Place; stay: { lat: number; lng: number } }) => {
      const r = await drivingRoute(stay, { lat: place.lat, lng: place.lng });
      if (!r) return place;
      return pb.collection('places').update<Place>(place.id, {
        driveSeconds: r.seconds,
        driveMeters: r.meters,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['places'] }),
  });
}
