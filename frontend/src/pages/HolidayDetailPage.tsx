import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, LayoutList, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import {
  useDeleteHoliday,
  useDeletePlace,
  useDeleteSubPeriod,
  useHoliday,
  usePlacesForHoliday,
  useSubPeriods,
} from '../hooks/data';
import { getCountryTheme } from '../lib/countryTheme';
import { fmtDateRange, toDateInput, tripLength } from '../lib/format';
import { colorForIndex } from '../lib/palette';
import { categoryEmoji, categoryLabel } from '../lib/categories';
import { FlagBand } from '../components/FlagBand';
import { Button } from '../components/ui/Button';
import { HolidayForm } from '../components/HolidayForm';
import { SubPeriodForm } from '../components/SubPeriodForm';
import { SubPeriodCard } from '../components/SubPeriodCard';
import { PlaceForm } from '../components/PlaceForm';
import { TripMap } from '../components/TripMap';
import type { Place, SubPeriod } from '../types';

export default function HolidayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const holiday = useHoliday(id);
  const subsQ = useSubPeriods(id);
  const subs = subsQ.data ?? [];
  const placesQ = usePlacesForHoliday(subs.map((s) => s.id));
  const places = placesQ.data ?? [];

  const delHoliday = useDeleteHoliday();
  const delSub = useDeleteSubPeriod();
  const delPlace = useDeletePlace();

  const [editHoliday, setEditHoliday] = useState(false);
  const [subForm, setSubForm] = useState<{ open: boolean; sub?: SubPeriod | null }>({ open: false });
  const [placeForm, setPlaceForm] = useState<{ open: boolean; sub: SubPeriod; place?: Place | null } | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [collapsedSubs, setCollapsedSubs] = useState<Set<string>>(new Set());
  const [filterCat, setFilterCat] = useState<string | null>(null);

  const toggleSub = (id: string) => {
    setCollapsedSubs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    if (!collapsedSubs.has(id) && selectedPlaceId) {
      if (places.some((p) => p.id === selectedPlaceId && p.subperiod === id))
        setSelectedPlaceId(null);
    }
  };

  if (holiday.isLoading) {
    return <div className="card h-64 animate-pulse" />;
  }
  if (!holiday.data) {
    return (
      <div className="card grid place-items-center p-16 text-center">
        <p className="text-slate-500">Holiday not found.</p>
        <Link to="/" className="mt-3 font-semibold text-ink underline">
          Back to holidays
        </Link>
      </div>
    );
  }

  const h = holiday.data;
  const theme = getCountryTheme(h.countryCode, h.accentOverride || undefined);
  const days = tripLength(h.startDate, h.endDate);

  const visibleSubs = subs.filter((s) => !collapsedSubs.has(s.id));
  const visiblePlaces = places.filter((p) => !collapsedSubs.has(p.subperiod));
  const activeCategories = [...new Set(places.map((p) => p.category))];
  const filteredPlaces = filterCat ? visiblePlaces.filter((p) => p.category === filterCat) : visiblePlaces;

  const removeHoliday = async () => {
    if (!confirm(`Delete "${h.title}" and everything in it?`)) return;
    await delHoliday.mutateAsync(h.id);
    navigate('/');
  };

  return (
    <div className="animate-fade-up">
      <Link to="/" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-ink">
        <ArrowLeft size={16} /> All holidays
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl shadow-card" style={{ backgroundColor: theme.accent }}>
        <div className="absolute right-0 top-0 h-full w-32 sm:w-44">
          <FlagBand theme={theme} rounded="rounded-none" className="h-full" showFlag={false} />
        </div>
        <div className="relative p-6 text-white sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-4 sm:pr-32">
              <span className="hidden text-6xl leading-none sm:block">{theme.flag}</span>
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                  {h.title} {h.emoji && <span>{h.emoji}</span>}
                </h1>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-white/90">
                  <CalendarDays size={15} /> {fmtDateRange(h.startDate, h.endDate)}
                  {days ? ` · ${days} days` : ''}
                </p>
                {h.locationName && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-white/90">
                    <MapPin size={15} /> <span className="truncate">{h.locationName}</span>
                  </p>
                )}
                {(subs.length > 0 || places.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="chip bg-white/20 text-white backdrop-blur">
                      <LayoutList size={12} /> {subs.length} stop{subs.length !== 1 ? 's' : ''}
                    </span>
                    <span className="chip bg-white/20 text-white backdrop-blur">
                      <MapPin size={12} /> {places.length} place{places.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="z-10 flex shrink-0 gap-2">
              <Button variant="primary" accent="rgba(255,255,255,.18)" onClick={() => setEditHoliday(true)} className="backdrop-blur">
                <Pencil size={15} /> <span className="hidden sm:inline">Edit</span>
              </Button>
              <button
                onClick={removeHoliday}
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                aria-label="Delete holiday"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {h.notes && (
        <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-card ring-1 ring-slate-100">
          {h.notes}
        </p>
      )}

      {/* Body */}
      <div className="mt-6 grid gap-5 lg:grid-cols-12">
        {/* Itinerary rail */}
        <section className="lg:col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Itinerary</h2>
            <Button accent={theme.accent} onClick={() => setSubForm({ open: true, sub: null })} className="px-3 py-2">
              <Plus size={15} /> Sub-period
            </Button>
          </div>

          {activeCategories.length > 1 && (
            <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
              {activeCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCat((f) => (f === cat ? null : cat))}
                  className={clsx(
                    'chip shrink-0 transition',
                    filterCat === cat
                      ? 'bg-ink text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  )}
                >
                  {categoryEmoji(cat)} {categoryLabel(cat)}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {subs.map((s) => (
              <SubPeriodCard
                key={s.id}
                sub={s}
                places={places.filter((p) => p.subperiod === s.id)}
                collapsed={collapsedSubs.has(s.id)}
                selectedPlaceId={selectedPlaceId}
                onToggle={() => toggleSub(s.id)}
                onEdit={() => setSubForm({ open: true, sub: s })}
                onDelete={async () => {
                  if (confirm(`Delete sub-period "${s.name}" and its places?`)) await delSub.mutateAsync(s.id);
                }}
                onAddPlace={() => setPlaceForm({ open: true, sub: s, place: null })}
                onEditPlace={(p) => setPlaceForm({ open: true, sub: s, place: p })}
                onDeletePlace={async (p) => {
                  if (confirm(`Remove "${p.name}"?`)) await delPlace.mutateAsync(p.id);
                }}
                onSelectPlace={setSelectedPlaceId}
              />
            ))}

            {subs.length === 0 && (
              <div className="card border-2 border-dashed border-slate-200 bg-transparent p-6 text-center text-sm text-slate-400 shadow-none ring-0">
                Add a sub-period to set where you stay and the places you want to visit.
              </div>
            )}
          </div>
        </section>

        {/* Map */}
        <section className="lg:col-span-8">
          <div className="h-[400px] lg:h-[560px]">
            <TripMap subs={visibleSubs} places={filteredPlaces} selectedPlaceId={selectedPlaceId} onSelectPlace={setSelectedPlaceId} />
          </div>
        </section>
      </div>

      {/* Modals */}
      <HolidayForm open={editHoliday} onClose={() => setEditHoliday(false)} holiday={h} />
      {subForm.open && (
        <SubPeriodForm
          open={subForm.open}
          onClose={() => setSubForm({ open: false })}
          holidayId={h.id}
          subperiod={subForm.sub}
          defaultColor={colorForIndex(subs.length)}
          minDate={toDateInput(h.startDate)}
          maxDate={toDateInput(h.endDate)}
        />
      )}
      {placeForm?.open && (
        <PlaceForm
          open={placeForm.open}
          onClose={() => setPlaceForm(null)}
          subperiod={placeForm.sub}
          place={placeForm.place}
        />
      )}
    </div>
  );
}
