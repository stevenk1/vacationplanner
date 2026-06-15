import { useState } from 'react';
import { Home } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { LocationSearch } from './LocationSearch';
import { SUB_COLORS } from '../lib/palette';
import { flagEmoji } from '../lib/countryTheme';
import { toDateInput } from '../lib/format';
import { useCreateSubPeriod, useUpdateSubPeriod } from '../hooks/data';
import type { SubPeriod } from '../types';

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

  const create = useCreateSubPeriod();
  const update = useUpdateSubPeriod();
  const busy = create.isPending || update.isPending;

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
    };
    if (editing) {
      const stayMoved = stayLat !== subperiod!.stayLat || stayLng !== subperiod!.stayLng;
      await update.mutateAsync({ id: subperiod!.id, data, recompute: stayMoved });
    } else {
      await create.mutateAsync({ ...data, holiday: holidayId });
    }
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
