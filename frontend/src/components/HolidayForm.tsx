import { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { FlagBand } from './FlagBand';
import { LocationSearch } from './LocationSearch';
import { getCountryTheme } from '../lib/countryTheme';
import { toDateInput } from '../lib/format';
import { useCreateHoliday, useUpdateHoliday } from '../hooks/data';
import type { Holiday } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  holiday?: Holiday | null;
  onSaved?: (h: Holiday) => void;
}

export function HolidayForm({ open, onClose, holiday, onSaved }: Props) {
  const editing = !!holiday;
  const [title, setTitle] = useState(holiday?.title ?? '');
  const [locationName, setLocationName] = useState(holiday?.locationName ?? '');
  const [countryCode, setCountryCode] = useState(holiday?.countryCode ?? '');
  const [accentOverride, setAccentOverride] = useState(holiday?.accentOverride ?? '');
  const [emoji, setEmoji] = useState(holiday?.emoji ?? '');
  const [startDate, setStartDate] = useState(toDateInput(holiday?.startDate));
  const [endDate, setEndDate] = useState(toDateInput(holiday?.endDate));
  const [notes, setNotes] = useState(holiday?.notes ?? '');

  const create = useCreateHoliday();
  const update = useUpdateHoliday();
  const busy = create.isPending || update.isPending;
  const theme = getCountryTheme(countryCode, accentOverride || undefined);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const data: Partial<Holiday> = {
      title: title.trim(),
      locationName,
      countryCode,
      accentOverride,
      emoji,
      startDate,
      endDate,
      notes,
    };
    const saved = editing
      ? await update.mutateAsync({ id: holiday!.id, data })
      : await create.mutateAsync(data);
    onSaved?.(saved);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit holiday' : 'New holiday'}
      subtitle="Theme, flag and colors come from the destination country."
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summer in Tuscany" autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start date</label>
            <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="label">End date</label>
            <input type="date" className="input" min={startDate || undefined} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Destination</label>
          <LocationSearch
            defaultQuery={locationName}
            placeholder="Search a city, region or country…"
            onSelect={(r) => {
              setLocationName(r.address || r.name);
              setCountryCode(r.countryCode);
            }}
          />
        </div>

        {/* Theme preview */}
        <div className="rounded-2xl border border-slate-100 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="label mb-0">Theme — {theme.name}</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accentOverride || theme.accent}
                onChange={(e) => setAccentOverride(e.target.value)}
                className="h-7 w-9 cursor-pointer rounded-md border border-slate-200 bg-white"
                title="Accent color"
              />
              {accentOverride && (
                <button type="button" className="text-xs font-semibold text-slate-400 hover:text-slate-600" onClick={() => setAccentOverride('')}>
                  auto
                </button>
              )}
            </div>
          </div>
          <FlagBand theme={theme} rounded="rounded-xl" className="h-14" />
        </div>

        <div>
          <label className="label">Theme emoji (optional)</label>
          <input className="input" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="☀️ ⛵ 🍷 …" maxLength={8} />
        </div>

        <div>
          <label className="label">Notes (optional)</label>
          <textarea className="input min-h-[72px] resize-y" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" accent={theme.accent} disabled={busy || !title.trim()}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create holiday'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
