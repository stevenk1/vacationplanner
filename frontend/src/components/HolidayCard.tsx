import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin } from 'lucide-react';
import { FlagBand } from './FlagBand';
import { getCountryTheme } from '../lib/countryTheme';
import { fmtDateRange } from '../lib/format';
import type { Holiday } from '../types';

interface Props {
  holiday: Holiday;
  subCount: number;
  placeCount: number;
}

export function HolidayCard({ holiday, subCount, placeCount }: Props) {
  const theme = getCountryTheme(holiday.countryCode, holiday.accentOverride || undefined);
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
      <Link to={`/holiday/${holiday.id}`} className="card group block overflow-hidden transition hover:shadow-lift">
        <FlagBand theme={theme} className="h-24" />
        <div className="relative px-5 pb-5 pt-4">
          <div className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: theme.accent }} />
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-bold leading-tight text-ink">{holiday.title}</h3>
            {holiday.emoji && <span className="text-xl">{holiday.emoji}</span>}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
            <CalendarDays size={14} /> {fmtDateRange(holiday.startDate, holiday.endDate)}
          </p>
          {holiday.locationName && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin size={14} /> <span className="truncate">{holiday.locationName}</span> <span>{theme.flag}</span>
            </p>
          )}
          <div className="mt-3 border-t border-slate-100 pt-3 text-xs font-semibold" style={{ color: theme.accent }}>
            {subCount} {subCount === 1 ? 'sub-period' : 'sub-periods'} · {placeCount} {placeCount === 1 ? 'place' : 'places'}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
