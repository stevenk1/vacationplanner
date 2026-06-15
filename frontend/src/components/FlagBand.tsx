import clsx from 'clsx';
import type { CountryTheme } from '../lib/countryTheme';

interface Props {
  theme: CountryTheme;
  className?: string; // controls height, e.g. "h-24"
  rounded?: string;
  showFlag?: boolean;
  showLandmark?: boolean;
}

/** Country-themed flag-color stripe band with flag + landmark chips. */
export function FlagBand({
  theme,
  className,
  rounded = 'rounded-t-3xl',
  showFlag = true,
  showLandmark = true,
}: Props) {
  return (
    <div className={clsx('relative flex overflow-hidden', rounded, className)}>
      {theme.colors.map((c, i) => (
        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
      ))}
      <div className="pointer-events-none absolute inset-0 bg-black/[.03] ring-1 ring-inset ring-black/5" />
      {showFlag && (
        <div className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl bg-white/95 text-2xl shadow-sm ring-1 ring-black/5">
          <span className="leading-none">{theme.flag}</span>
        </div>
      )}
      {showLandmark && (
        <div className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl bg-white/95 text-2xl shadow-sm ring-1 ring-black/5">
          <span className="leading-none">{theme.landmark}</span>
        </div>
      )}
    </div>
  );
}
