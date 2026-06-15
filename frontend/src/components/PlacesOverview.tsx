import { useState } from 'react';
import { ArrowUpDown, Clock, Home, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { categoryEmoji } from '../lib/categories';
import { fmtDistance, fmtDuration } from '../lib/format';
import { useRecomputePlace } from '../hooks/data';
import type { Place, SubPeriod } from '../types';

interface Props {
  subs: SubPeriod[];
  places: Place[];
}

type Sort = 'time' | 'name';

export function PlacesOverview({ subs, places }: Props) {
  const [sort, setSort] = useState<Sort>('time');
  const recompute = useRecomputePlace();

  const bySub = (id: string) => {
    const list = places.filter((p) => p.subperiod === id);
    return list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      return (a.driveSeconds ?? Infinity) - (b.driveSeconds ?? Infinity);
    });
  };

  const total = places.length;

  return (
    <div className="card flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
          <Clock size={16} /> Drive from stay
        </h3>
        <button
          onClick={() => setSort((s) => (s === 'time' ? 'name' : 'time'))}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
        >
          <ArrowUpDown size={13} /> {sort === 'time' ? 'time' : 'name'}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {total === 0 && <p className="px-3 py-6 text-center text-sm text-slate-400">No places yet — add some to see driving times.</p>}

        {subs.map((s) => {
          const list = bySub(s.id);
          if (list.length === 0) return null;
          const stay = { lat: s.stayLat, lng: s.stayLng };
          const hasStay = !!(s.stayLat || s.stayLng);
          return (
            <div key={s.id} className="mb-2">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="truncate">{s.name}</span>
                <span className="flex items-center gap-1 truncate font-normal text-slate-400">
                  <Home size={11} /> {s.stayName || 'stay'}
                </span>
              </div>
              <ul>
                {list.map((p) => {
                  const pending = recompute.isPending && recompute.variables?.place.id === p.id;
                  return (
                    <li key={p.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                      <span className="text-base leading-none">{categoryEmoji(p.category)}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{p.name}</span>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm font-semibold" style={{ color: s.color }}>
                          🚗 {fmtDuration(p.driveSeconds)}
                        </span>
                        <span className="block text-[11px] text-slate-400">{fmtDistance(p.driveMeters)}</span>
                      </span>
                      {hasStay && (
                        <button
                          onClick={() => recompute.mutate({ place: p, stay })}
                          disabled={pending}
                          className="grid h-6 w-6 shrink-0 place-items-center rounded text-slate-300 hover:text-slate-600 group-hover:text-slate-400"
                          title="Recompute driving time"
                        >
                          <RefreshCw size={12} className={clsx(pending && 'animate-spin')} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
