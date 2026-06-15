import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'ghost' | 'subtle' | 'danger' | 'outline';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  accent?: string; // background for the primary variant
}

const VARIANTS: Record<Variant, string> = {
  primary: 'text-white shadow-sm hover:brightness-105',
  outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  subtle: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
};

export function Button({ variant = 'primary', accent, className, style, ...props }: Props) {
  const s = variant === 'primary' ? { backgroundColor: accent || '#0f172a', ...style } : style;
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        className,
      )}
      style={s}
      {...props}
    />
  );
}
