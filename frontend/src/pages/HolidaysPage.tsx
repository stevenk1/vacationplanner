import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useAllPlaces, useAllSubPeriods, useHolidays } from '../hooks/data';
import { HolidayCard } from '../components/HolidayCard';
import { HolidayForm } from '../components/HolidayForm';
import { Button } from '../components/ui/Button';

export default function HolidaysPage() {
  const holidays = useHolidays();
  const subs = useAllSubPeriods();
  const places = useAllPlaces();
  const [showForm, setShowForm] = useState(false);

  const subCount = (hid: string) => subs.data?.filter((s) => s.holiday === hid).length ?? 0;
  const placeCount = (hid: string) => {
    const ids = new Set(subs.data?.filter((s) => s.holiday === hid).map((s) => s.id));
    return places.data?.filter((p) => ids.has(p.subperiod)).length ?? 0;
  };

  const list = holidays.data ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Your Holidays</h1>
          <p className="mt-1 text-slate-500">Ideas and itineraries for your next trips.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} /> New Holiday
        </Button>
      </div>

      {holidays.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-64 animate-pulse" />
          ))}
        </div>
      ) : list.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((h) => (
            <HolidayCard key={h.id} holiday={h} subCount={subCount(h.id)} placeCount={placeCount(h.id)} />
          ))}
          <button
            onClick={() => setShowForm(true)}
            className="grid min-h-[16rem] place-items-center rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-white hover:text-slate-500"
          >
            <span className="text-center">
              <Plus className="mx-auto mb-1" />
              <span className="font-semibold">New Holiday</span>
            </span>
          </button>
        </div>
      ) : (
        <div className="card grid place-items-center px-6 py-20 text-center">
          <div className="max-w-sm">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl">🌍</div>
            <h2 className="font-display text-xl font-bold text-ink">Plan your first holiday</h2>
            <p className="mt-1.5 text-slate-500">
              Add a trip, give it sub-periods with their own stays, and pin the places you want to visit on the map.
            </p>
            <Button className="mt-5" onClick={() => setShowForm(true)}>
              <Sparkles size={16} /> Create a holiday
            </Button>
          </div>
        </div>
      )}

      <HolidayForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}
