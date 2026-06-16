import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Modal } from './ui/Modal';

/** A source-agnostic set of photos for the lightbox (a place's Google photos, a stay's Airbnb photos, …). */
export interface LightboxItem {
  title: string;
  urls: string[];
  attribution?: string; // e.g. author names — appended after the source label
  sourceLabel?: string; // "Google" | "Airbnb"
  sourceUrl?: string; // external link to the source/listing
}

interface Props {
  item: LightboxItem | null;
  onClose: () => void;
}

/** A modal photo viewer with carousel + attribution, for any cached photo set (places or stays). */
export function PhotoLightbox({ item, onClose }: Props) {
  const [idx, setIdx] = useState(0);
  const urls = item?.urls ?? [];

  // Reset to the first photo whenever the viewed item changes.
  useEffect(() => setIdx(0), [item?.title, urls[0]]);

  const open = !!item && urls.length > 0;
  if (!open || !item) return null;

  const safe = Math.min(idx, urls.length - 1);
  const step = (delta: number) => setIdx((i) => (i + delta + urls.length) % urls.length);
  const credit = [item.sourceLabel ? `Photo via ${item.sourceLabel}` : '', item.attribution]
    .filter(Boolean)
    .join(' · ');

  return (
    <Modal open={open} onClose={onClose} title={item.title} maxWidth="max-w-2xl">
      <div className="relative">
        <img
          src={urls[safe]}
          alt={item.title}
          loading="lazy"
          className="max-h-[70vh] w-full rounded-2xl bg-slate-50 object-contain"
        />

        {urls.length > 1 && (
          <>
            <button
              onClick={() => step(-1)}
              className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-slate-700 shadow-lift backdrop-blur transition hover:bg-white"
              aria-label="Previous photo"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => step(1)}
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-slate-700 shadow-lift backdrop-blur transition hover:bg-white"
              aria-label="Next photo"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {urls.map((_, i) => (
                <span
                  key={i}
                  className={i === safe ? 'h-1.5 w-1.5 rounded-full bg-white' : 'h-1.5 w-1.5 rounded-full bg-white/50'}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <p className="mt-3 flex items-center justify-center gap-2 text-center text-[11px] text-slate-400">
        {credit}
        {item.sourceUrl && (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 font-medium text-slate-500 hover:text-ink"
          >
            View on {item.sourceLabel ?? 'source'} <ExternalLink size={11} />
          </a>
        )}
      </p>
    </Modal>
  );
}
