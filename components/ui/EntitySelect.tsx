'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ModalLayer from '@/components/ui/ModalLayer';
import { Search, ChevronDown, Plus, Check, X, Loader2 } from '@/components/ui/LucideIcon';

export interface EntityOption {
  id: string | number;
  label: string;
  sub?: string;
}

export interface CreateField {
  key: string;
  label: string;
  required?: boolean;
  type?: 'text' | 'number' | 'email' | 'tel';
  placeholder?: string;
}

interface Props {
  label: string;
  value: string;
  onChange: (id: string) => void;
  options: EntityOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  /** Omit to hide the "create new" affordance. */
  createTitle?: string;
  createFields?: CreateField[];
  onCreateSubmit?: (values: Record<string, string>) => Promise<void>;
  /** Called after a successful create so the parent can refetch and auto-select. */
  onCreated?: () => Promise<EntityOption[] | void>;
}

/**
 * Searchable entity picker with optional inline creation.
 *
 * The point of the inline create is data preservation: the surrounding form is
 * never unmounted, so a half-filled medicine survives creating a category,
 * supplier or rack mid-flow.
 */
export default function EntitySelect({
  label, value, onChange, options, placeholder = 'Select…', required, error, disabled,
  createTitle, createFields, onCreateSubmit, onCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => String(o.id) === String(value));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.label.toLowerCase().includes(q) || (o.sub || '').toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open]);

  const submitCreate = async () => {
    if (!onCreateSubmit || !createFields) return;
    const missing = createFields.filter(f => f.required && !draft[f.key]?.trim());
    if (missing.length) { setCreateError(`${missing[0].label} is required`); return; }

    setSaving(true);
    setCreateError('');
    try {
      await onCreateSubmit(draft);
      const refreshed = await onCreated?.();
      // Auto-select whatever was just created: the newest row wins.
      if (Array.isArray(refreshed) && refreshed.length) {
        const match = refreshed.find(o => o.label.toLowerCase() === (draft.name || draft.warehouse || draft.code || '').toLowerCase());
        onChange(String((match ?? refreshed[refreshed.length - 1]).id));
      }
      setCreating(false);
      setDraft({});
      setOpen(false);
    } catch (e) {
      const raw = e instanceof Error ? e.message : '';
      let msg = '';
      try { msg = JSON.parse(raw)?.message ?? ''; } catch { msg = raw; }
      setCreateError(msg || `Could not create ${label.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-w-0">
      <label className="block text-[13px] font-semibold text-gray-700 dark:text-[#94A3B8] mb-1.5">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>

      <div ref={boxRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(v => !v)}
          className={`w-full h-10 px-3 rounded-xl border bg-white dark:bg-[#111827] text-left text-sm flex items-center gap-2 transition-colors disabled:opacity-50 ${
            error ? 'border-red-300' : 'border-gray-200 dark:border-[#273244] hover:border-gray-300'
          }`}
        >
          <span className={`flex-1 truncate ${selected ? 'text-gray-900 dark:text-[#F8FAFC]' : 'text-gray-400'}`}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </button>

        {open && (
          <div className="absolute z-[60] left-0 right-0 mt-1 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] shadow-xl overflow-hidden">
            <div className="relative border-b border-gray-100 dark:border-[#273244]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                className="w-full h-10 pl-9 pr-3 text-sm bg-transparent outline-none text-gray-900 dark:text-[#F8FAFC]"
              />
            </div>

            <div className="max-h-[220px] overflow-y-auto ims-scroll py-1">
              {filtered.length ? filtered.map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => { onChange(String(o.id)); setOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#1F2937]"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-gray-900 dark:text-[#F8FAFC]">{o.label}</span>
                    {o.sub && <span className="block text-[11px] text-gray-400 truncate">{o.sub}</span>}
                  </span>
                  {String(o.id) === String(value) && <Check className="w-4 h-4 text-[#0F9291] shrink-0" />}
                </button>
              )) : (
                <p className="px-3 py-4 text-center text-[13px] text-gray-400">No {label.toLowerCase()} found</p>
              )}
            </div>

            {createTitle && createFields && (
              <button
                type="button"
                onClick={() => { setCreating(true); setOpen(false); setDraft(query ? { name: query, code: query, warehouse: query } : {}); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[#0F9291] border-t border-gray-100 dark:border-[#273244] hover:bg-[#0F9291]/5"
              >
                <Plus className="w-4 h-4" /> {createTitle}
              </button>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-[12px] text-red-500 mt-1">{error}</p>}

      {/* Nested creation. The parent form stays mounted, so nothing is lost. */}
      {createTitle && createFields && (
        <ModalLayer open={creating} onClose={() => !saving && setCreating(false)}>
          <div className="w-[420px] max-w-full rounded-2xl bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#273244] shadow-2xl overflow-hidden animate-boot-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#273244]">
              <h3 className="text-[16px] font-bold text-gray-900 dark:text-[#F8FAFC]">{createTitle}</h3>
              <button type="button" onClick={() => !saving && setCreating(false)} aria-label="Close"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F2937]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {createFields.map(f => (
                <div key={f.key}>
                  <label className="block text-[13px] font-semibold text-gray-700 dark:text-[#94A3B8] mb-1.5">
                    {f.label}{f.required && <span className="text-red-500"> *</span>}
                  </label>
                  <input
                    type={f.type || 'text'}
                    value={draft[f.key] || ''}
                    onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#111827] text-sm text-gray-900 dark:text-[#F8FAFC] outline-none focus:border-[#0F9291]"
                  />
                </div>
              ))}
              {createError && <p className="text-[12px] text-red-500">{createError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 dark:border-[#273244]">
              <button type="button" onClick={() => !saving && setCreating(false)}
                className="h-10 px-4 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-800">Cancel</button>
              <button type="button" onClick={submitCreate} disabled={saving}
                className="h-10 px-4 rounded-xl text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
                style={{ background: 'linear-gradient(103.28deg,#0EA5A4 0%,#175780 100%)' }}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Create'}
              </button>
            </div>
          </div>
        </ModalLayer>
      )}
    </div>
  );
}
