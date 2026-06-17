import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarRange, CheckCircle2, ChevronDown, Circle, ExternalLink, Home, MapPinned, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { CATEGORIES, categoryEmoji } from '../lib/categories';
import { fmtShortRange, fmtDuration, fmtDistance } from '../lib/format';
import { flagEmoji } from '../lib/countryTheme';
import { stayPhotoUrls } from '../lib/pocketbase';
import { useRecomputePlace, useUpdatePlace } from '../hooks/data';
import type { Place, SubPeriod } from '../types';

interface Props {
  sub: SubPeriod;
  places: Place[];
  collapsed: boolean;
  selectedPlaceId?: string | null;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddPlace: () => void;
  onEditPlace: (p: Place) => void;
  onDeletePlace: (p: Place) => void;
  onSelectPlace?: (id: string) => void;
}

export function SubPeriodCard({ sub, places, collapsed, selectedPlaceId, onToggle, onEdit, onDelete, onAddPlace, onEditPlace, onDeletePlace, onSelectPlace }: Props) {
  const [tab, setTab] = useState<'places' | 'drive'>('places');
  const recompute = useRecomputePlace();
  const updatePlace = useUpdatePlace();
  const range = fmtShortRange(sub.startDate, sub.endDate);
  const stay = { lat: sub.stayLat, lng: sub.stayLng };
  const hasStay = !!(sub.stayLat || sub.stayLng);

  const grouped = CATEGORIES
    .map((cat) => ({ cat, items: places.filter((p) => p.category === cat.value) }))
    .filter((g) => g.items.length > 0);

  const sortedByDrive = [...places].sort((a, b) => (a.driveSeconds ?? Infinity) - (b.driveSeconds ?? Infinity));

  return (
    <div className="card overflow-hidden">
      <div className="flex">
        <div className="w-1.5 shrink-0" style={{ backgroundColor: sub.color }} />
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <button
              onClick={onToggle}
              className="min-w-0 flex-1 cursor-pointer text-left"
              aria-expanded={!collapsed}
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: sub.color }} />
                <h4 className="truncate font-display text-base font-bold text-ink">{sub.name}</h4>
                <ChevronDown
                  size={14}
                  className="ml-auto shrink-0 text-slate-400 transition-transform duration-200"
                  style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                />
              </div>
              {range && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <CalendarRange size={13} /> {range}
                </p>
              )}
              {collapsed && places.length > 0 && (
                <p className="mt-1.5 flex flex-wrap gap-1">
                  {[...new Set(places.map((p) => p.category))].slice(0, 4).map((cat) => (
                    <span key={cat} className="chip bg-slate-100 text-slate-500 px-2 py-0.5 text-[11px]">
                      {categoryEmoji(cat)}
                    </span>
                  ))}
                  <span className="chip bg-slate-100 text-slate-500 px-2 py-0.5 text-[11px]">
                    {places.length} places
                  </span>
                </p>
              )}
            </button>
            <div className="flex shrink-0 gap-1">
              <button onClick={onEdit} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Edit sub-period">
                <Pencil size={14} />
              </button>
              <button onClick={onDelete} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete sub-period">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div className="mt-2 flex items-center gap-2">
                  {sub.stayPhotos?.length ? (
                    <img
                      src={stayPhotoUrls(sub, { thumb: '400x300' })[0]}
                      alt={sub.stayName}
                      loading="lazy"
                      className="h-9 w-12 flex-none rounded-md object-cover ring-1 ring-black/5"
                    />
                  ) : null}
                  <p className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-slate-600">
                    <Home size={13} style={{ color: sub.color }} />
                    <span className="truncate">{sub.stayName || sub.stayAddress || 'No stay set'}</span>
                    {sub.stayCountryCode && <span>{flagEmoji(sub.stayCountryCode)}</span>}
                  </p>
                  {sub.stayAirbnbUrl && (
                    <a
                      href={sub.stayAirbnbUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 text-slate-400 hover:text-rose-500"
                      title="View on Airbnb"
                      aria-label="View on Airbnb"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>

                {places.length === 0 ? (
                  <p className="mt-3 flex items-center gap-2 px-1.5 py-1 text-xs text-slate-400">
                    <MapPinned size={13} /> No places yet
                  </p>
                ) : (
                  <>
                    <div className="mt-3 flex gap-1 rounded-xl bg-slate-100 p-1">
                      {(['places', 'drive'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTab(t)}
                          className={clsx(
                            'flex-1 rounded-lg py-1 text-xs font-semibold transition',
                            tab === t ? 'bg-white shadow-sm text-ink' : 'text-slate-500 hover:text-ink',
                          )}
                        >
                          {t === 'places' ? 'Places' : '🚗 Drive times'}
                        </button>
                      ))}
                    </div>

                    {tab === 'places' && (
                      <ul className="mt-3 space-y-2">
                        {grouped.map(({ cat, items }) => (
                          <li key={cat.value}>
                            {grouped.length > 1 && (
                              <p className="mb-1 px-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {cat.emoji} {cat.label}
                              </p>
                            )}
                            <ul className="space-y-0.5">
                              {items.map((p) => (
                                <li
                                  key={p.id}
                                  id={`place-${p.id}`}
                                  onClick={() => onSelectPlace?.(p.id)}
                                  className={clsx(
                                    'group flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 transition',
                                    selectedPlaceId === p.id ? 'bg-slate-100 ring-1 ring-slate-200' : 'hover:bg-slate-50',
                                    p.visited && 'opacity-50',
                                  )}
                                >
                                  <button
                                    onClick={(e) => { e.stopPropagation(); updatePlace.mutate({ id: p.id, data: { visited: !p.visited } }); }}
                                    className="shrink-0 text-slate-300 transition hover:text-slate-500"
                                    aria-label={p.visited ? 'Mark as not visited' : 'Mark as visited'}
                                  >
                                    {p.visited
                                      ? <CheckCircle2 size={15} className="text-green-500" />
                                      : <Circle size={15} />}
                                  </button>
                                  <span className={clsx('text-base leading-none', p.visited && 'grayscale')}>{categoryEmoji(p.category)}</span>
                                  <span className={clsx('min-w-0 flex-1 truncate text-sm text-ink', p.visited && 'line-through')}>{p.name}</span>
                                  {p.driveSeconds ? (
                                    <span className="shrink-0 text-xs font-medium text-slate-400">🚗 {fmtDuration(p.driveSeconds)}</span>
                                  ) : null}
                                  <span className="hidden shrink-0 gap-0.5 group-hover:flex">
                                    <button onClick={(e) => { e.stopPropagation(); onEditPlace(p); }} className="grid h-6 w-6 place-items-center rounded text-slate-400 hover:text-slate-700" aria-label="Edit place">
                                      <Pencil size={12} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onDeletePlace(p); }} className="grid h-6 w-6 place-items-center rounded text-slate-400 hover:text-rose-600" aria-label="Delete place">
                                      <Trash2 size={12} />
                                    </button>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    )}

                    {tab === 'drive' && (
                      <ul className="mt-3 space-y-0.5">
                        {sortedByDrive.map((p) => {
                          const pending = recompute.isPending && recompute.variables?.place.id === p.id;
                          return (
                            <li
                              key={p.id}
                              onClick={() => onSelectPlace?.(p.id)}
                              className={clsx(
                                'flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 transition',
                                selectedPlaceId === p.id ? 'bg-slate-100 ring-1 ring-slate-200' : 'hover:bg-slate-50',
                                p.visited && 'opacity-50',
                              )}
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); updatePlace.mutate({ id: p.id, data: { visited: !p.visited } }); }}
                                className="shrink-0 text-slate-300 transition hover:text-slate-500"
                                aria-label={p.visited ? 'Mark as not visited' : 'Mark as visited'}
                              >
                                {p.visited
                                  ? <CheckCircle2 size={15} className="text-green-500" />
                                  : <Circle size={15} />}
                              </button>
                              <span className={clsx('text-base leading-none', p.visited && 'grayscale')}>{categoryEmoji(p.category)}</span>
                              <span className={clsx('min-w-0 flex-1 truncate text-sm text-ink', p.visited && 'line-through')}>{p.name}</span>
                              <span className="shrink-0 text-right">
                                <span className="block text-xs font-semibold" style={{ color: sub.color }}>
                                  🚗 {fmtDuration(p.driveSeconds)}
                                </span>
                                {p.driveMeters ? (
                                  <span className="block text-[11px] text-slate-400">{fmtDistance(p.driveMeters)}</span>
                                ) : null}
                              </span>
                              {hasStay && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); recompute.mutate({ place: p, stay }); }}
                                  disabled={pending}
                                  className="grid h-6 w-6 shrink-0 place-items-center rounded text-slate-300 hover:text-slate-600"
                                  title="Recompute driving time"
                                >
                                  <RefreshCw size={12} className={clsx(pending && 'animate-spin')} />
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                )}

                <button
                  onClick={onAddPlace}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold transition hover:bg-slate-100"
                  style={{ color: sub.color }}
                >
                  <Plus size={14} /> Add place
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
