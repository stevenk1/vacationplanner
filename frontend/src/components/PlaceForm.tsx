import { useState } from 'react';
import { Car } from 'lucide-react';
import clsx from 'clsx';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { LocationSearch } from './LocationSearch';
import { CATEGORIES } from '../lib/categories';
import { useCreatePlace, useFetchPlacePhotos, useUpdatePlace } from '../hooks/data';
import type { Place, SubPeriod } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  subperiod: SubPeriod;
  place?: Place | null;
}

export function PlaceForm({ open, onClose, subperiod, place }: Props) {
  const editing = !!place;
  const [name, setName] = useState(place?.name ?? '');
  const [address, setAddress] = useState(place?.address ?? '');
  const [lat, setLat] = useState<number | undefined>(place?.lat);
  const [lng, setLng] = useState<number | undefined>(place?.lng);
  const [category, setCategory] = useState(place?.category || 'sightseeing');
  const [notes, setNotes] = useState(place?.notes ?? '');

  const create = useCreatePlace();
  const update = useUpdatePlace();
  const fetchPhotos = useFetchPlacePhotos();
  const busy = create.isPending || update.isPending;
  const stay = { lat: subperiod.stayLat, lng: subperiod.stayLng };
  const hasStay = !!(subperiod.stayLat || subperiod.stayLng);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || lat == null || lng == null) return;
    const data: Partial<Place> = { name: name.trim(), address, lat, lng, category, notes };
    let rec: Place;
    let locationChanged = true;
    if (editing) {
      rec = await update.mutateAsync({ id: place!.id, data, stay });
      locationChanged = place!.lat !== lat || place!.lng !== lng;
    } else {
      rec = await create.mutateAsync({ data: { ...data, subperiod: subperiod.id }, stay });
    }
    // Fetch a real photo in the background — only for new places or when the location moved,
    // so editing notes/category doesn't trigger needless Google calls.
    if (locationChanged) fetchPhotos.mutate(rec.id);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit place' : 'Add a place to visit'}
      subtitle={`Sub-period: ${subperiod.name}`}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Place</label>
          <LocationSearch
            defaultQuery={place?.name ?? ''}
            placeholder="Search an attraction, town or address…"
            proximity={hasStay ? { lat: subperiod.stayLat, lng: subperiod.stayLng } : null}
            onSelect={(r) => {
              setName(r.name);
              setAddress(r.address);
              setLat(r.lat);
              setLng(r.lng);
              if (r.category && !place) setCategory(r.category);
            }}
          />
          {name && (
            <div className="mt-2">
              <label className="label">Display name</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={name}
              />
              {address && <p className="mt-1 text-xs text-slate-400 truncate">{address}</p>}
            </div>
          )}
        </div>

        <div>
          <label className="label">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition',
                  category === c.value
                    ? 'border-slate-800 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                <span>{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Notes (optional)</label>
          <textarea className="input min-h-[64px] resize-y" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div
          className={clsx(
            'flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs',
            hasStay ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
          )}
        >
          <Car size={15} className="mt-0.5 shrink-0" />
          {hasStay ? (
            <span>
              Driving time is calculated automatically from{' '}
              <span className="font-semibold">{subperiod.stayName || 'the stay'}</span>.
            </span>
          ) : (
            <span>Set a stay location on this sub-period to get driving times.</span>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" accent={subperiod.color} disabled={busy || !name.trim() || lat == null}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add place'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
