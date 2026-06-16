import { useEffect, useMemo, useRef, useState } from 'react';
import MapGL, { Marker, Popup, NavigationControl, type MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Home, MapPinned } from 'lucide-react';
import { MAPBOX_TOKEN, hasMapbox } from '../lib/config';
import { categoryEmoji } from '../lib/categories';
import { fmtDistance, fmtDuration } from '../lib/format';
import { placePhotoUrls } from '../lib/pocketbase';
import { PhotoLightbox } from './PhotoLightbox';
import type { Place, SubPeriod } from '../types';

interface Props {
  subs: SubPeriod[];
  places: Place[];
}

type Selection = { kind: 'stay' | 'place'; id: string } | null;

const hasCoords = (lat?: number, lng?: number) => !!(lat || lng);

export function TripMap({ subs, places }: Props) {
  const mapRef = useRef<MapRef | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [sel, setSel] = useState<Selection>(null);
  const [lightbox, setLightbox] = useState<Place | null>(null);
  const subById = useMemo(() => new Map(subs.map((s) => [s.id, s])), [subs]);

  const points = useMemo(() => {
    const pts: { lng: number; lat: number }[] = [];
    subs.forEach((s) => hasCoords(s.stayLat, s.stayLng) && pts.push({ lng: s.stayLng, lat: s.stayLat }));
    places.forEach((p) => hasCoords(p.lat, p.lng) && pts.push({ lng: p.lng, lat: p.lat }));
    return pts;
  }, [subs, places]);

  const coordKey = points.map((p) => `${p.lng.toFixed(4)},${p.lat.toFixed(4)}`).join('|');

  useEffect(() => {
    const map = mapRef.current;
    if (!loaded || !map || points.length === 0) return;
    if (points.length === 1) {
      map.easeTo({ center: [points[0].lng, points[0].lat], zoom: 11, duration: 600 });
      return;
    }
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    for (const p of points) {
      minLng = Math.min(minLng, p.lng);
      maxLng = Math.max(maxLng, p.lng);
      minLat = Math.min(minLat, p.lat);
      maxLat = Math.max(maxLat, p.lat);
    }
    map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 72, duration: 600, maxZoom: 13 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, coordKey]);

  if (!hasMapbox) {
    return (
      <div className="grid h-full place-items-center rounded-3xl bg-slate-100 p-8 text-center">
        <div className="max-w-xs text-slate-500">
          <MapPinned className="mx-auto mb-2" />
          <p className="font-semibold text-slate-600">Map needs a Mapbox token</p>
          <p className="mt-1 text-sm">Add <code className="rounded bg-slate-200 px-1">MAPBOX_TOKEN</code> to your <code className="rounded bg-slate-200 px-1">.env</code> and restart.</p>
        </div>
      </div>
    );
  }

  const start = points[0] ?? { lng: 10, lat: 46 };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl">
      <MapGL
        ref={mapRef}
        reuseMaps
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: start.lng, latitude: start.lat, zoom: points.length ? 8 : 4 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
        onLoad={() => setLoaded(true)}
        onClick={() => setSel(null)}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* Stay markers */}
        {subs.map((s) =>
          hasCoords(s.stayLat, s.stayLng) ? (
            <Marker
              key={`stay-${s.id}`}
              longitude={s.stayLng}
              latitude={s.stayLat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSel({ kind: 'stay', id: s.id });
              }}
            >
              <div
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border-[3px] border-white shadow-lift transition hover:scale-110"
                style={{ backgroundColor: s.color }}
                title={s.stayName}
              >
                <Home size={16} color="#fff" />
              </div>
            </Marker>
          ) : null,
        )}

        {/* Place markers */}
        {places.map((p) => {
          if (!hasCoords(p.lat, p.lng)) return null;
          const s = subById.get(p.subperiod);
          return (
            <Marker
              key={`place-${p.id}`}
              longitude={p.lng}
              latitude={p.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSel({ kind: 'place', id: p.id });
              }}
            >
              <div
                className="grid h-7 w-7 cursor-pointer place-items-center rounded-full border-2 border-white text-sm shadow-md transition hover:scale-110"
                style={{ backgroundColor: s?.color ?? '#64748b' }}
                title={p.name}
              >
                <span className="leading-none">{categoryEmoji(p.category)}</span>
              </div>
            </Marker>
          );
        })}

        {/* Popup */}
        {sel?.kind === 'stay' &&
          (() => {
            const s = subById.get(sel.id);
            if (!s || !hasCoords(s.stayLat, s.stayLng)) return null;
            return (
              <Popup longitude={s.stayLng} latitude={s.stayLat} anchor="bottom" offset={20} onClose={() => setSel(null)} closeButton={false}>
                <div className="min-w-[150px]">
                  <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: s.color }}>
                    <Home size={12} /> Stay
                  </p>
                  <p className="text-sm font-semibold text-ink">{s.stayName || 'Accommodation'}</p>
                  {s.stayAddress && <p className="text-xs text-slate-500">{s.stayAddress}</p>}
                </div>
              </Popup>
            );
          })()}

        {sel?.kind === 'place' &&
          (() => {
            const p = places.find((x) => x.id === sel.id);
            if (!p) return null;
            const s = subById.get(p.subperiod);
            return (
              <Popup longitude={p.lng} latitude={p.lat} anchor="bottom" offset={16} onClose={() => setSel(null)} closeButton={false}>
                <div className="min-w-[160px]">
                  <p className="text-sm font-semibold text-ink">
                    {categoryEmoji(p.category)} {p.name}
                  </p>
                  {s && <p className="text-xs text-slate-500">in {s.name}</p>}
                  {p.driveSeconds ? (
                    <p className="mt-1 text-xs font-medium" style={{ color: s?.color }}>
                      🚗 {fmtDuration(p.driveSeconds)} · {fmtDistance(p.driveMeters)} from {s?.stayName || 'stay'}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">No driving time yet</p>
                  )}
                  {p.photos?.length ? (
                    <button
                      type="button"
                      onClick={() => setLightbox(p)}
                      className="mt-2 block w-full overflow-hidden rounded-lg ring-1 ring-black/5 transition hover:opacity-90"
                      title="View photos"
                    >
                      <img
                        src={placePhotoUrls(p, { thumb: '400x300' })[0]}
                        alt={p.name}
                        loading="lazy"
                        className="h-24 w-full object-cover"
                      />
                    </button>
                  ) : null}
                </div>
              </Popup>
            );
          })()}
      </MapGL>

      {/* Legend */}
      {subs.length > 0 && (
        <div className="absolute bottom-3 left-3 max-w-[60%] rounded-2xl bg-white/95 p-3 text-xs shadow-lift ring-1 ring-black/5 backdrop-blur">
          <div className="mb-1.5 flex items-center gap-3 font-semibold text-slate-600">
            <span className="flex items-center gap-1"><Home size={12} /> Stay</span>
            <span className="flex items-center gap-1"><MapPinned size={12} /> Place</span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {subs.map((s) => (
              <span key={s.id} className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <PhotoLightbox place={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
