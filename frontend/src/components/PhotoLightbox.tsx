import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from './ui/Modal';
import { placePhotoUrls } from '../lib/pocketbase';
import { categoryEmoji } from '../lib/categories';
import type { Place } from '../types';

interface Props {
  place: Place | null;
  onClose: () => void;
}

/** A modal photo viewer for a place's cached Google Places photos (with carousel + attribution). */
export function PhotoLightbox({ place, onClose }: Props) {
  const [idx, setIdx] = useState(0);
  const urls = place ? placePhotoUrls(place, { thumb: '1200x900' }) : [];

  // Reset to the first photo whenever the viewed place changes.
  useEffect(() => setIdx(0), [place?.id]);

  const open = !!place && urls.length > 0;
  if (!open || !place) return null;

  const safe = Math.min(idx, urls.length - 1);
  const authors = (place.photoAttribution ?? [])
    .map((a) => a.displayName)
    .filter(Boolean)
    .slice(0, 2)
    .join(', ');
  const step = (delta: number) => setIdx((i) => (i + delta + urls.length) % urls.length);

  return (
    <Modal open={open} onClose={onClose} title={`${categoryEmoji(place.category)} ${place.name}`} maxWidth="max-w-2xl">
      <div className="relative">
        <img
          src={urls[safe]}
          alt={place.name}
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

      <p className="mt-3 text-center text-[11px] text-slate-400">
        Photo via Google{authors ? ` · ${authors}` : ''}
      </p>
    </Modal>
  );
}
