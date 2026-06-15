import { format, differenceInCalendarDays, isValid } from 'date-fns';

/** Parse a PocketBase date string ("2026-07-12 00:00:00.000Z") or ISO date. */
export function parseDate(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s.replace(' ', 'T'));
  return isValid(d) ? d : null;
}

/** PB date -> "YYYY-MM-DD" for <input type="date">. */
export function toDateInput(s?: string | null): string {
  const d = parseDate(s);
  return d ? format(d, 'yyyy-MM-dd') : '';
}

export function fmtDuration(seconds?: number | null): string {
  if (seconds == null || seconds <= 0) return '—';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function fmtDistance(meters?: number | null): string {
  if (meters == null || meters <= 0) return '—';
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

/** "12 – 26 Jul 2026" / "20 Sep – 1 Oct 2026" with sensible collapsing. */
export function fmtDateRange(start?: string | null, end?: string | null): string {
  const s = parseDate(start);
  const e = parseDate(end);
  if (s && e) {
    const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    const sameYear = s.getFullYear() === e.getFullYear();
    if (sameMonth) return `${format(s, 'd')} – ${format(e, 'd MMM yyyy')}`;
    if (sameYear) return `${format(s, 'd MMM')} – ${format(e, 'd MMM yyyy')}`;
    return `${format(s, 'd MMM yyyy')} – ${format(e, 'd MMM yyyy')}`;
  }
  if (s) return format(s, 'd MMM yyyy');
  if (e) return format(e, 'd MMM yyyy');
  return 'Dates TBD';
}

export function fmtShortRange(start?: string | null, end?: string | null): string {
  const s = parseDate(start);
  const e = parseDate(end);
  if (s && e) {
    const sameMonth = s.getMonth() === e.getMonth();
    return sameMonth ? `${format(s, 'd')} – ${format(e, 'd MMM')}` : `${format(s, 'd MMM')} – ${format(e, 'd MMM')}`;
  }
  if (s) return format(s, 'd MMM');
  return '';
}

export function tripLength(start?: string | null, end?: string | null): number | null {
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s || !e) return null;
  return Math.max(1, differenceInCalendarDays(e, s) + 1);
}
