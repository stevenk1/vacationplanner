import { Link, Route, Routes } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { hasMapbox } from './lib/config';
import HolidaysPage from './pages/HolidaysPage';
import HolidayDetailPage from './pages/HolidayDetailPage';

export default function App() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-extrabold text-ink">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-ink text-base">🌍</span>
            Holiday Planner
          </Link>
          <span className="hidden text-sm text-slate-400 sm:block">plan trips beautifully</span>
        </div>
      </header>

      {!hasMapbox && (
        <div className="bg-amber-50 text-amber-800">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-sm sm:px-6">
            <AlertTriangle size={16} className="shrink-0" />
            No Mapbox token set — maps, location search and driving times are disabled. Add
            <code className="rounded bg-amber-100 px-1">MAPBOX_TOKEN</code> to your <code className="rounded bg-amber-100 px-1">.env</code>.
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Routes>
          <Route path="/" element={<HolidaysPage />} />
          <Route path="/holiday/:id" element={<HolidayDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}
