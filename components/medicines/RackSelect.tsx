'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ChevronDown, Check, Inbox, AlertTriangle, Plus } from '@/components/ui/LucideIcon';

export interface RackRow {
  id: number | string;
  code: string;
  category?: string;
  bins?: number;              // total capacity
  assignedMedicines?: number; // used
  capacityPercent?: number;   // computed server-side
  temperature?: string;
  status?: string;
}

export interface RackSpace {
  total: number;
  used: number;
  free: number;
  pct: number;
  tone: 'free' | 'tight' | 'full';
  label: string;
  bar: string;
  text: string;
}

/** Capacity maths in one place so the list, the summary and validation agree. */
export function rackSpace(r: RackRow): RackSpace {
  const total = Number(r.bins || 0);
  const used = Number(r.assignedMedicines || 0);
  const free = Math.max(0, total - used);
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

  if (total === 0) {
    return { total, used, free, pct, tone: 'full', label: 'No capacity set', bar: 'bg-gray-300', text: 'text-gray-400' };
  }
  if (free <= 0) {
    return { total, used, free, pct, tone: 'full', label: 'Full', bar: 'bg-red-500', text: 'text-red-600' };
  }
  if (pct >= 85) {
    return { total, used, free, pct, tone: 'tight', label: `${free} free`, bar: 'bg-amber-500', text: 'text-amber-600' };
  }
  return { total, used, free, pct, tone: 'free', label: `${free} free`, bar: 'bg-emerald-500', text: 'text-emerald-600' };
}

interface Props {
  racks: RackRow[];
  value: string;
  onChange: (id: string) => void;
  /** Opening stock, used to flag racks that cannot hold it. */
  quantity: number;
  onAddNew?: () => void;
  label?: string;
  /** True when the rack request failed — distinct from "there are none". */
  loadError?: boolean;
  onRetry?: () => void;
}

export default function RackSelect({ racks, value, onChange, quantity, onAddNew, label = 'Rack', loadError, onRetry }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);

  const selected = racks.find(r => String(r.id) === String(value));
  const space = selected ? rackSpace(selected) : null;
  const overflows = !!space && quantity > 0 && quantity > space.free;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? racks.filter(r => r.code?.toLowerCase().includes(q) || (r.category || '').toLowerCase().includes(q))
      : racks;
    // Most usable racks first: emptiest at the top, full ones last.
    return [...rows].sort((a, b) => rackSpace(b).free - rackSpace(a).free);
  }, [racks, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open]);

  return (
    <div className="min-w-0">
      {/* Create stays visible at all times — it used to live only inside the open
          dropdown, which is unreachable when there are no racks to open it for. */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label className="block text-[13px] font-semibold text-gray-700 dark:text-[#94A3B8]">{label}</label>
        {onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#0F9291] hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Create Rack
          </button>
        )}
      </div>

      <div ref={boxRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className={`w-full h-11 px-3 rounded-xl border bg-white dark:bg-[#111827] text-left text-sm flex items-center gap-2 transition-colors ${
            overflows ? 'border-red-300' : 'border-gray-200 dark:border-[#273244] hover:border-gray-300'
          }`}
        >
          <Inbox className="w-4 h-4 text-gray-400 shrink-0" />
          <span className={`flex-1 truncate ${selected ? 'text-gray-900 dark:text-[#F8FAFC]' : 'text-gray-400'}`}>
            {selected ? `${selected.code}${selected.category ? ` · ${selected.category}` : ''}` : 'Search rack…'}
          </span>
          {space && <span className={`text-[12px] font-semibold shrink-0 ${space.text}`}>{space.label}</span>}
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </button>

        {open && (
          <div className="absolute z-[60] left-0 right-0 mt-1 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] shadow-xl overflow-hidden">
            <div className="relative border-b border-gray-100 dark:border-[#273244]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Type a rack code or category…"
                className="w-full h-10 pl-9 pr-3 text-sm bg-transparent outline-none text-gray-900 dark:text-[#F8FAFC]"
              />
            </div>

            <div className="max-h-[260px] overflow-y-auto ims-scroll py-1">
              {filtered.length ? filtered.map(r => {
                const sp = rackSpace(r);
                const cannotFit = quantity > 0 && quantity > sp.free;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { onChange(String(r.id)); setOpen(false); setQuery(''); }}
                    className="w-full px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13.5px] font-semibold text-gray-900 dark:text-[#F8FAFC] truncate">{r.code}</span>
                        <span className="block text-[11.5px] text-gray-400 truncate">{r.category || '—'}</span>
                      </span>
                      <span className={`text-[12px] font-semibold shrink-0 ${sp.text}`}>
                        {sp.tone === 'full' ? 'Full' : `${sp.free} free`}
                      </span>
                      {String(r.id) === String(value) && <Check className="w-4 h-4 text-[#0F9291] shrink-0" />}
                    </span>

                    {/* Occupancy: filled portion is what is already taken */}
                    <span className="block mt-1.5 h-1.5 rounded-full bg-gray-100 dark:bg-[#1F2937] overflow-hidden">
                      <span className={`block h-full rounded-full ${sp.bar}`} style={{ width: `${sp.pct}%` }} />
                    </span>
                    <span className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                      <span>{sp.used} / {sp.total} used</span>
                      {cannotFit && <span className="text-red-500 font-semibold">Cannot hold {quantity}</span>}
                    </span>
                  </button>
                );
              }) : (
                <p className="px-3 py-6 text-center text-[13px] text-gray-400">No racks found</p>
              )}
            </div>

            {onAddNew && (
              <button
                type="button"
                onClick={() => { onAddNew(); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[#0F9291] border-t border-gray-100 dark:border-[#273244] hover:bg-[#0F9291]/5"
              >
                + Create Rack
              </button>
            )}
          </div>
        )}
      </div>

      {/* A failed request is not the same as an empty shelf — never conflate them */}
      {loadError && (
        <div className="mt-2 rounded-xl border border-dashed border-red-300 bg-red-50/60 dark:bg-red-900/15 px-4 py-3.5 text-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-1.5" />
          <p className="text-[13px] font-semibold text-red-700 dark:text-red-300">Could not load racks</p>
          <p className="text-[12px] text-red-600/80 dark:text-red-400/80 mt-0.5">
            Your session may have expired. Sign in again, or retry.
          </p>
          {onRetry && (
            <button type="button" onClick={onRetry}
              className="mt-2.5 text-[12.5px] font-semibold text-red-700 dark:text-red-300 hover:underline">
              Retry
            </button>
          )}
        </div>
      )}

      {/* No racks exist yet — say so plainly rather than showing an inert picker */}
      {!loadError && racks.length === 0 && (
        <div className="mt-2 rounded-xl border border-dashed border-[#0F9291]/35 bg-[#0F9291]/[0.04] px-4 py-4 text-center">
          <Inbox className="w-5 h-5 text-[#0F9291] mx-auto mb-1.5" />
          <p className="text-[13px] font-semibold text-gray-700 dark:text-[#94A3B8]">No racks created yet</p>
          <p className="text-[12px] text-gray-500 dark:text-[#64748B] mt-0.5">
            Add a rack to assign storage space for this medicine.
          </p>
          {onAddNew && (
            <button type="button" onClick={onAddNew}
              className="mt-3 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(103.28deg,#0EA5A4 0%,#175780 100%)' }}>
              <Plus className="w-3.5 h-3.5" /> Create Rack
            </button>
          )}
        </div>
      )}

      {/* Selected rack summary */}
      {space && (
        <div className="mt-2 rounded-xl border border-gray-100 dark:border-[#273244] px-3 py-2.5">
          <div className="flex items-center justify-between text-[12px] mb-1.5">
            <span className="text-gray-500 dark:text-[#94A3B8]">Occupancy</span>
            <span className={`font-semibold ${space.text}`}>
              {space.used} / {space.total} · {space.pct}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-[#1F2937] overflow-hidden">
            <div className={`h-full rounded-full transition-[width] duration-500 ${space.bar}`} style={{ width: `${space.pct}%` }} />
          </div>
          <p className={`mt-1.5 text-[12px] ${overflows ? 'text-red-600 font-semibold' : 'text-gray-500 dark:text-[#94A3B8]'}`}>
            {overflows ? (
              <span className="inline-flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Only {space.free} space left — cannot assign {quantity}
              </span>
            ) : space.free <= 0
              ? 'This rack is full'
              : `You can assign up to ${space.free} here`}
          </p>
        </div>
      )}
    </div>
  );
}
