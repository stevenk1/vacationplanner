import { useState } from 'react';
import { Home, Star } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { LocationSearch } from './LocationSearch';
import { SUB_COLORS } from '../lib/palette';
import { flagEmoji } from '../lib/countryTheme';
import { toDateInput } from '../lib/format';
import {
  useCreateSubPeriod,
  useUpdateSubPeriod,
  useScrapeAirbnb,
  useFetchStayPhotos,
} from '../hooks/data';
import { stayPhotoUrls } from '../lib/pocketbase';
import type { SubPeriod, StayListing } from '../types';

function airbnbErrorMessage(code?: string): string {
  switch (code) {
    case 'no_api_key':
      return "Airbnb import isn't configured (no Apify token on the server).";
    case 'bad_url':
      return 'Enter a valid Airbnb listing URL (e.g. https://www.airbnb.com/rooms/12345).';
    case 'empty_dataset':
      return "Couldn't find that listing — double-check the URL.";
    default:
      return 'Airbnb import failed. Please try again.';
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
  holidayId: string;
  subperiod?: SubPeriod | null;
  defaultColor?: string;
  minDate?: string;
  maxDate?: string;
}

export function SubPeriodForm({ open, onClose, holidayId, subperiod, defaultColor, minDate, maxDate }: Props) {
  const editing = !!subperiod;
  const [name, setName] = useState(subperiod?.name ?? '');
  const [startDate, setStartDate] = useState(toDateInput(subperiod?.startDate));
  const [endDate, setEndDate] = useState(toDateInput(subperiod?.endDate));
  const [color, setColor] = useState(subperiod?.color || defaultColor || SUB_COLORS[0]);
  const [stayName, setStayName] = useState(subperiod?.stayName ?? '');
  const [stayAddress, setStayAddress] = useState(subperiod?.stayAddress ?? '');
  const [stayLat, setStayLat] = useState<number | undefined>(subperiod?.stayLat);
  const [stayLng, setStayLng] = useState<number | undefined>(subperiod?.stayLng);
  const [stayCountryCode, setStayCountryCode] = useState(subperiod?.stayCountryCode ?? '');
  const [stayAirbnbUrl, setStayAirbnbUrl] = useState(subperiod?.stayAirbnbUrl ?? '');
  const [listing, setListing] = useState<StayListing | undefined>(subperiod?.stayListing);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [scrapeError, setScrapeError] = useState('');

  const create = useCreateSubPeriod();
  const update = useUpdateSubPeriod();
  const scrape = useScrapeAirbnb();
  const fetchStayPhotos = useFetchStayPhotos();
  const busy = create.isPending || update.isPending;

  // Photos shown in the editor: freshly-scraped URLs if any, otherwise the already-cached stay photos.
  const previewPhotos = photoUrls.length
    ? photoUrls
    : editing && subperiod?.stayPhotos?.length
      ? stayPhotoUrls(subperiod, { thumb: '400x300' })
      : [];

  const fetchAirbnb = async () => {
    const url = stayAirbnbUrl.trim();
    if (!url || scrape.isPending) return;
    setScrapeError('');
    try {
      const res = await scrape.mutateAsync({
        url,
        checkIn: startDate || undefined,
        checkOut: endDate || undefined,
      });
      if (!res.ok) {
        setScrapeError(airbnbErrorMessage(res.error));
        return;
      }
      if (res.stayName) setStayName(res.stayName);
      if (res.stayAddress) setStayAddress(res.stayAddress);
      if (res.stayLat) setStayLat(res.stayLat);
      if (res.stayLng) setStayLng(res.stayLng);
      if (res.stayCountryCode) setStayCountryCode(res.stayCountryCode);
      setPhotoUrls(res.photoUrls ?? []);
      setListing({
        price: res.price ?? null,
        currency: res.currency ?? 'EUR',
        rating: res.rating ?? null,
        reviewsCount: res.reviewsCount ?? null,
        checkIn: startDate || undefined,
        checkOut: endDate || undefined,
      });
    } catch {
      setScrapeError('Airbnb import failed. Please try again.');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const data: Partial<SubPeriod> = {
      name: name.trim(),
      startDate,
      endDate,
      color,
      stayName,
      stayAddress,
      stayLat: stayLat ?? 0,
      stayLng: stayLng ?? 0,
      stayCountryCode,
      stayAirbnbUrl,
      stayListing: listing,
    };
    let rec: SubPeriod;
    if (editing) {
      const stayMoved = stayLat !== subperiod!.stayLat || stayLng !== subperiod!.stayLng;
      rec = await update.mutateAsync({ id: subperiod!.id, data, recompute: stayMoved });
    } else {
      rec = await create.mutateAsync({ ...data, holiday: holidayId });
    }
    // Cache freshly-scraped Airbnb photos in the background (no extra Apify cost).
    if (photoUrls.length) fetchStayPhotos.mutate({ id: rec.id, photoUrls });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit sub-period' : 'Add sub-period'}
      subtitle="A stretch of the trip with its own place to stay."
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Coastal days" autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">From</label>
            <input type="date" className="input" min={minDate} max={maxDate} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input" min={startDate || minDate} max={maxDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Map color</label>
          <div className="flex flex-wrap gap-2">
            {SUB_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-7 w-7 rounded-full ring-2 ring-offset-2 transition"
                style={{ backgroundColor: c, ['--tw-ring-color' as any]: color === c ? '#0f172a' : 'transparent' }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
            <Home size={16} style={{ color }} /> Where you stay {stayCountryCode && <span>{flagEmoji(stayCountryCode)}</span>}
          </div>
          <div className="space-y-3">
            <div className="space-y-2 rounded-xl bg-slate-50 p-2">
              <div className="flex gap-2">
                <input
                  className="input"
                  type="url"
                  value={stayAirbnbUrl}
                  onChange={(e) => setStayAirbnbUrl(e.target.value)}
                  placeholder="Paste an Airbnb listing URL to auto-fill…"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchAirbnb}
                  disabled={!stayAirbnbUrl.trim() || scrape.isPending}
                >
                  {scrape.isPending ? 'Fetching…' : 'Fetch'}
                </Button>
              </div>
              {scrape.isPending && (
                <p className="text-xs text-slate-400">Scraping the listing via Apify — this can take ~40s.</p>
              )}
              {scrapeError && <p className="text-xs text-rose-500">{scrapeError}</p>}
              {listing && (listing.price != null || listing.rating != null) && (
                <p className="flex items-center gap-3 text-xs text-slate-500">
                  {listing.price != null && (
                    <span>≈ {listing.currency ?? 'EUR'} {listing.price}/night</span>
                  )}
                  {listing.rating != null && (
                    <span className="inline-flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" /> {listing.rating}
                      {listing.reviewsCount != null && (
                        <span className="text-slate-400">({listing.reviewsCount})</span>
                      )}
                    </span>
                  )}
                </p>
              )}
              {previewPhotos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {previewPhotos.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="h-16 w-24 flex-none rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
            <input className="input" value={stayName} onChange={(e) => setStayName(e.target.value)} placeholder="Accommodation name (e.g. Villa Mare)" />
            <LocationSearch
              defaultQuery={stayAddress}
              placeholder="Search the stay's location…"
              onSelect={(r) => {
                setStayAddress(r.address || r.name);
                setStayLat(r.lat);
                setStayLng(r.lng);
                setStayCountryCode(r.countryCode);
                if (!stayName.trim()) setStayName(r.name);
              }}
            />
            {stayLat != null && stayLng != null && (stayLat !== 0 || stayLng !== 0) && (
              <p className="text-xs text-slate-400">📍 {stayLat.toFixed(4)}, {stayLng.toFixed(4)} — driving times are measured from here.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" accent={color} disabled={busy || !name.trim()}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add sub-period'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
