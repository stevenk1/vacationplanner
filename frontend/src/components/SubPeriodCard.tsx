import { AnimatePresence, motion } from 'framer-motion';
import { CalendarRange, ChevronDown, ExternalLink, Home, MapPinned, Pencil, Plus, Trash2 } from 'lucide-react';
import { categoryEmoji } from '../lib/categories';
import { fmtShortRange, fmtDuration } from '../lib/format';
import { flagEmoji } from '../lib/countryTheme';
import { stayPhotoUrls } from '../lib/pocketbase';
import type { Place, SubPeriod } from '../types';

interface Props {
  sub: SubPeriod;
  places: Place[];
  collapsed: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddPlace: () => void;
  onEditPlace: (p: Place) => void;
  onDeletePlace: (p: Place) => void;
}

export function SubPeriodCard({ sub, places, collapsed, onToggle, onEdit, onDelete, onAddPlace, onEditPlace, onDeletePlace }: Props) {
  const range = fmtShortRange(sub.startDate, sub.endDate);
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

                <ul className="mt-3 space-y-1">
                  {places.map((p) => (
                    <li key={p.id} className="group flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-50">
                      <span className="text-base leading-none">{categoryEmoji(p.category)}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{p.name}</span>
                      {p.driveSeconds ? (
                        <span className="shrink-0 text-xs font-medium text-slate-400">🚗 {fmtDuration(p.driveSeconds)}</span>
                      ) : null}
                      <span className="hidden shrink-0 gap-0.5 group-hover:flex">
                        <button onClick={() => onEditPlace(p)} className="grid h-6 w-6 place-items-center rounded text-slate-400 hover:text-slate-700" aria-label="Edit place">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => onDeletePlace(p)} className="grid h-6 w-6 place-items-center rounded text-slate-400 hover:text-rose-600" aria-label="Delete place">
                          <Trash2 size={12} />
                        </button>
                      </span>
                    </li>
                  ))}
                  {places.length === 0 && (
                    <li className="flex items-center gap-2 px-1.5 py-1 text-xs text-slate-400">
                      <MapPinned size={13} /> No places yet
                    </li>
                  )}
                </ul>

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
