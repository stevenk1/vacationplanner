import { MAPBOX_TOKEN } from './config';

export interface GeoResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  countryCode: string;
  category?: string; // mapped from the POI category, used to prefill a place's category
}

export interface GeoOptions {
  signal?: AbortSignal;
  proximity?: { lat: number; lng: number } | null;
}

/** Map a Mapbox POI category to one of our place categories. */
function mapPoiCategory(cats?: string[]): string | undefined {
  const s = (cats || []).join(' ').toLowerCase();
  if (!s) return undefined;
  if (/beach/.test(s)) return 'beach';
  if (/restaurant|food|cafe|coffee|\bbar\b|bakery|grocery|dining|winery|brewery/.test(s)) return 'food';
  if (/museum|gallery|\bart\b|theatre|theater|cultural/.test(s)) return 'culture';
  if (/park|garden|nature|mountain|lake|viewpoint|trail|forest|scenic|waterfall/.test(s)) return 'nature';
  if (/attraction|landmark|monument|historic|castle|church|temple|mosque|worship|tower|ruin|palace|cathedral/.test(s))
    return 'landmark';
  return undefined;
}

/**
 * Forward search via the Mapbox Search Box API — returns POIs (attractions,
 * restaurants, …) as well as places/addresses, which suits a "places to visit" planner.
 */
export async function geocode(query: string, opts: GeoOptions = {}): Promise<GeoResult[]> {
  const q = query.trim();
  if (!q || !MAPBOX_TOKEN) return [];
  const proximity = opts.proximity ? `${opts.proximity.lng},${opts.proximity.lat}` : 'ip';
  const url =
    `https://api.mapbox.com/search/searchbox/v1/forward?q=${encodeURIComponent(q)}` +
    `&limit=6&language=en&proximity=${proximity}&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url, { signal: opts.signal });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.features || [])
    .map((f: any): GeoResult => {
      const p = f.properties || {};
      const coords = f.geometry?.coordinates || [];
      const lng = coords[0] ?? p.coordinates?.longitude ?? 0;
      const lat = coords[1] ?? p.coordinates?.latitude ?? 0;
      const cc = p.context?.country?.country_code || '';
      return {
        id: p.mapbox_id || f.id || `${lat},${lng}`,
        name: p.name || p.name_preferred || '',
        address: p.full_address || p.place_formatted || p.name || '',
        lat,
        lng,
        countryCode: String(cc).toUpperCase(),
        category: mapPoiCategory(p.poi_category),
      };
    })
    .filter((r: GeoResult) => r.lat !== 0 || r.lng !== 0);
}

export interface Route {
  seconds: number;
  meters: number;
}

/** Driving duration + distance between two points via the Mapbox Directions API. */
export async function drivingRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<Route | null> {
  if (!MAPBOX_TOKEN) return null;
  if (!from?.lat && !from?.lng) return null;
  if (!to?.lat && !to?.lng) return null;
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
    `?overview=false&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return null;
  return { seconds: Math.round(route.duration), meters: Math.round(route.distance) };
}
