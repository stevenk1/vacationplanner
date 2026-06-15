import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { geocode, type GeoResult } from '../lib/mapbox';
import { hasMapbox } from '../lib/config';
import { flagEmoji } from '../lib/countryTheme';

interface Props {
  defaultQuery?: string;
  placeholder?: string;
  proximity?: { lat: number; lng: number } | null;
  onSelect: (r: GeoResult) => void;
}

export function LocationSearch({ defaultQuery = '', placeholder = 'Search a place…', proximity, onSelect }: Props) {
  const [q, setQ] = useState(defaultQuery);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const picked = useRef(false);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    if (picked.current) {
      picked.current = false;
      return;
    }
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await geocode(q, { signal: ctrl.signal, proximity });
        setResults(r);
        setOpen(true);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const choose = (r: GeoResult) => {
    picked.current = true;
    setQ(r.name || r.address);
    setOpen(false);
    setResults([]);
    onSelect(r);
  };

  return (
    <div ref={wrap} className="relative">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9"
          value={q}
          placeholder={hasMapbox ? placeholder : 'Set MAPBOX_TOKEN to enable search'}
          disabled={!hasMapbox}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
        />
        {loading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-slate-100 bg-white p-1 shadow-lift">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => choose(r)}
                className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-slate-50"
              >
                <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {r.name} {r.countryCode && <span>{flagEmoji(r.countryCode)}</span>}
                  </span>
                  <span className="block truncate text-xs text-slate-500">{r.address}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
