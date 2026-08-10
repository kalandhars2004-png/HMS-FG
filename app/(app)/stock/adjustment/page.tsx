'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Plus, RotateCw, Maximize, ChevronDown, ChevronUp, X, Edit, Trash2,
  EllipsisVertical, Filter, Columns, CalendarDays, Clock, House, Layers,
  Check, FileSpreadsheet, Printer, ArrowUpToLine, ArrowUpDown, Save, Loader2,
} from '@/components/ui/LucideIcon';
import GlobalModal, { GlobalConfirmModal } from '@/components/ui/GlobalModal';

/* ───────────── Types & Demo Data (DreamPOS Stock Adjustment) ───────────── */

interface AdjustmentRow {
  id: string;
  item: string;
  date: string;
  ts: number;
  rack: string;
  type: 'Increase' | 'Decrease';
  before: number;
  adjQty: number;
  after: number;
  reason: string;
  adjustedBy: string;
}

const STOCK_ITEMS = [
  'Paracetamol 500', 'Amoxicillin 250', 'Cetirizine', 'Ceftriaxone 20',
  'Betnovate', 'Amoxicillin 30', 'Tetanus Toxoid', 'Atorvastatin',
  'Metformin 100', 'Ondansetron',
];

const RACKS = ['#RCK016', '#RCK020', '#RCK025', '#RCK030', '#RCK035', '#RCK007', '#RCK008', '#RCK009', '#RCK010', '#RCK011', '#RCK012', '#RCK013', '#RCK014', '#RCK015'];

const USERS = ['Mervin Nesmith', 'Joyce Kerns', 'John Baxter', 'Margaret Fehr', 'Benjamin Walker', 'Elizabeth Porter', 'Freddie Brown', 'Dawn Peterson', 'James Howard', 'Doris Crosby'];

const REASONS = ['Physical Count', 'Stock Correction', 'Damaged', 'Expired'];

const ITEM_STOCK: Record<string, number> = {
  'Paracetamol 500': 20, 'Amoxicillin 250': 200, 'Cetirizine': 40,
  'Ceftriaxone 20': 120, 'Betnovate': 60, 'Amoxicillin 30': 310,
  'Tetanus Toxoid': 250, 'Atorvastatin': 35, 'Metformin 100': 150, 'Ondansetron': 120,
};

const INITIAL_ROWS: AdjustmentRow[] = [
  { id: '#ADJ016', item: 'Paracetamol 500', date: '24 Apr 2026, 10:00 AM', ts: 1777104000, rack: '#RCK016', type: 'Increase', before: 20, adjQty: 10, after: 30, reason: 'Physical Count', adjustedBy: 'Mervin Nesmith' },
  { id: '#ADJ015', item: 'Amoxicillin 250', date: '20 Apr 2026, 04:15 PM', ts: 1776687300000, rack: '#RCK015', type: 'Decrease', before: 200, adjQty: 20, after: 180, reason: 'Stock Correction', adjustedBy: 'Joyce Kerns' },
  { id: '#ADJ014', item: 'Cetirizine', date: '10 Apr 2026, 11:30 AM', ts: 1775971800000, rack: '#RCK014', type: 'Increase', before: 40, adjQty: 10, after: 50, reason: 'Physical Count', adjustedBy: 'John Baxter' },
  { id: '#ADJ013', item: 'Ceftriaxone 20', date: '21 Mar 2026, 09:10 AM', ts: 1775520600000, rack: '#RCK013', type: 'Decrease', before: 120, adjQty: 10, after: 110, reason: 'Damaged', adjustedBy: 'Margaret Fehr' },
  { id: '#ADJ012', item: 'Betnovate', date: '18 Mar 2026, 03:00 PM', ts: 1775304900000, rack: '#RCK012', type: 'Increase', before: 60, adjQty: 10, after: 70, reason: 'Stock Correction', adjustedBy: 'Benjamin Walker' },
  { id: '#ADJ011', item: 'Amoxicillin 30', date: '06 Mar 2026, 09:30 AM', ts: 1774744200000, rack: '#RCK011', type: 'Decrease', before: 310, adjQty: 10, after: 300, reason: 'Expired', adjustedBy: 'Elizabeth Porter' },
  { id: '#ADJ010', item: 'Tetanus Toxoid', date: '26 Feb 2026, 05:40 PM', ts: 1774071600000, rack: '#RCK010', type: 'Decrease', before: 250, adjQty: 20, after: 230, reason: 'Physical Count', adjustedBy: 'Freddie Brown' },
  { id: '#ADJ009', item: 'Atorvastatin', date: '17 Feb 2026, 09:00 AM', ts: 1773553800000, rack: '#RCK009', type: 'Increase', before: 35, adjQty: 15, after: 50, reason: 'Damaged', adjustedBy: 'Dawn Peterson' },
  { id: '#ADJ008', item: 'Metformin 100', date: '20 Jan 2026, 01:15 PM', ts: 1772716500000, rack: '#RCK008', type: 'Decrease', before: 150, adjQty: 10, after: 140, reason: 'Expired', adjustedBy: 'James Howard' },
  { id: '#ADJ007', item: 'Ondansetron', date: '12 Jan 2026, 04:30 PM', ts: 1772140500000, rack: '#RCK007', type: 'Increase', before: 120, adjQty: 10, after: 130, reason: 'Stock Correction', adjustedBy: 'Doris Crosby' },
];

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-rose-500',
  'bg-indigo-500', 'bg-amber-500', 'bg-cyan-500', 'bg-fuchsia-500',
  'bg-teal-500', 'bg-blue-500',
];

const COLUMN_DEFS = [
  { key: 'item', label: 'Item' },
  { key: 'date', label: 'Adjustment Date' },
  { key: 'rack', label: 'Rack ID' },
  { key: 'type', label: 'Adjustment Type' },
  { key: 'before', label: 'Before' },
  { key: 'adjQty', label: 'Adj Qty' },
  { key: 'after', label: 'After' },
  { key: 'reason', label: 'Reason' },
  { key: 'adjustedBy', label: 'Adjusted By' },
];

const DATE_PRESETS = [
  { key: 'all', label: 'All Time' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: '90d', label: 'Last 90 Days' },
];

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDateTime(dateStr: string, timeStr: string): string {
  const d = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  const valid = !isNaN(d.getTime());
  const base = valid ? d : new Date();
  const t = timeStr || `${String(base.getHours()).padStart(2, '0')}:${String(base.getMinutes()).padStart(2, '0')}`;
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr, 10);
  const hh = isNaN(h) ? base.getHours() : h;
  const mm = isNaN(parseInt(mStr, 10)) ? base.getMinutes() : parseInt(mStr, 10);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${base.getDate()} ${months[base.getMonth()]} ${base.getFullYear()}, ${String(h12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`;
}

const daysAgo = (n: number) => Date.now() - n * 86400000;

const thCls = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap';
const tdCls = 'px-4 py-4 whitespace-nowrap';
const inputCls = 'w-full h-11 px-3.5 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all text-gray-900 dark:text-gray-100 bg-white';
const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

/* ─────────────── Adjustment Form Modal ─────────────── */

interface AdjustmentForm {
  item: string;
  rack: string;
  type: string;
  date: string;
  time: string;
  before: number;
  qty: string;
  reason: string;
  adjustedBy: string;
}

function AdjustmentFormModal({ mode, initial, saving, onClose, onSave }: {
  mode: 'create' | 'edit';
  initial: AdjustmentRow | null;
  saving: boolean;
  onClose: () => void;
  onSave: (form: AdjustmentForm) => void;
}) {
  const [form, setForm] = useState<AdjustmentForm>(() => ({
    item: initial?.item || '',
    rack: initial?.rack || '',
    type: initial?.type ?? 'Increase',
    date: '',
    time: '',
    before: initial?.before ?? 20,
    qty: initial ? String(initial.adjQty) : '',
    reason: initial?.reason ?? '',
    adjustedBy: initial?.adjustedBy ?? '',
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const itemBefore = ITEM_STOCK[form.item] ?? form.before;
  const before = mode === 'create' ? itemBefore : form.before;
  const qty = Math.max(0, parseInt(form.qty, 10) || 0);
  const after = form.type === 'Decrease' ? before - qty : before + qty;

  const handleSubmit = () => {
    const errs: Record<string, string> = {};
    if (!form.item) errs.item = 'Please select an item';
    if (!form.rack) errs.rack = 'Please select a rack';
    if (!form.type) errs.type = 'Please select type';
    if (!form.adjustedBy) errs.adjustedBy = 'Please select who adjusted';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ ...form, before });
  };

  return (
    <GlobalModal
      onClose={saving ? () => {} : onClose}
      title={mode === 'edit' ? 'Edit Stock Adjustment' : 'Create New Adjustment'}
      subtitle="Reconcile stock levels for a medicine."
      icon={<Layers className="w-5 h-5" />}
      size="lg"
      hideFooter
    >
      <div className="grid grid-cols-12 gap-y-4 gap-x-4">
        <div className="col-span-12">
          <label className={labelCls}>Item <span className="text-red-500">*</span></label>
          <select value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} className={`${inputCls} appearance-none cursor-pointer`}>
            <option value="">Select</option>
            {STOCK_ITEMS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          {errors.item && <p className="text-xs text-red-500 mt-1">{errors.item}</p>}
        </div>

        <div className="col-span-12 sm:col-span-6">
          <label className={labelCls}>Rack No <span className="text-red-500">*</span></label>
          <select value={form.rack} onChange={e => setForm({ ...form, rack: e.target.value })} className={`${inputCls} appearance-none cursor-pointer`}>
            <option value="">Select</option>
            {RACKS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {errors.rack && <p className="text-xs text-red-500 mt-1">{errors.rack}</p>}
        </div>
        <div className="col-span-12 sm:col-span-6">
          <label className={labelCls}>Adjustment Type <span className="text-red-500">*</span></label>
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={`${inputCls} appearance-none cursor-pointer`}>
            <option value="">Select</option>
            <option value="Increase">Increase</option>
            <option value="Decrease">Decrease</option>
          </select>
        </div>

        <div className="col-span-12 sm:col-span-6">
          <label className={labelCls}>Date <span className="text-red-500">*</span></label>
          <div className="relative">
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={`${inputCls} pr-3`} />
            <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="col-span-12 sm:col-span-6">
          <label className={labelCls}>Time <span className="text-red-500">*</span></label>
          <div className="relative">
            <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className={`${inputCls} pr-3`} />
            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="col-span-12 sm:col-span-4">
          <label className={labelCls}>Before</label>
          <input type="text" readOnly disabled value={before} className={`${inputCls} bg-gray-50 dark:bg-[#192032] text-gray-600 dark:text-gray-400 cursor-not-allowed`} />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <label className={labelCls}>Adjustment Quantity <span className="text-red-500">*</span></label>
          <input type="number" min="0" placeholder="0" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} className={inputCls} />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <label className={labelCls}>After</label>
          <input type="text" value={after} disabled readOnly className={`${inputCls} bg-gray-50 dark:bg-[#192032] text-gray-600 dark:text-gray-400 cursor-not-allowed`} />
        </div>

        <div className="col-span-12">
          <label className={labelCls}>Reason <span className="text-red-500">*</span></label>
          <textarea rows={4} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reason for adjustment"
            className={`${inputCls} h-auto min-h-[96px] py-3 resize-none`} />
        </div>

        <div className="col-span-12">
          <label className={labelCls}>Adjusted By <span className="text-red-500">*</span></label>
          <select value={form.adjustedBy} onChange={e => setForm({ ...form, adjustedBy: e.target.value })} className={`${inputCls} appearance-none cursor-pointer`}>
            <option value="">Select</option>
            {USERS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          {errors.adjustedBy && <p className="text-xs text-red-500 mt-1">{errors.adjustedBy}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap pt-4 mt-5 border-t border-gray-100 dark:border-[#273244]">
        <button type="button" onClick={onClose} disabled={saving} className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#232323] hover:bg-gray-200 dark:hover:bg-[#2A2A2A] transition-all disabled:opacity-50">
          <X className="w-4 h-4" /> Cancel
        </button>
        <button type="button" onClick={handleSubmit} disabled={saving}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0F9291] to-teal-600 shadow-sm shadow-[#0F9291]/30 hover:shadow-md hover:shadow-[#0F9291]/40 transition-all active:scale-95 disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'edit' ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create New'}
        </button>
      </div>
    </GlobalModal>
  );
}

/* ─────────────── Filter Sidebar (offcanvas) ─────────────── */

function FilterSidebar({ draftMedicines, setDraftMedicines, draftUsers, setDraftUsers, draftTypes, setDraftTypes, collapseMed, setCollapseMed, collapseUser, setCollapseUser, collapseType, setCollapseType, moreMed, setMoreMed, moreUser, setMoreUser, medSearch, setMedSearch, userSearch, setUserSearch, onCancel, onApply }: {
  draftMedicines: string[]; setDraftMedicines: (v: string[]) => void;
  draftUsers: string[]; setDraftUsers: (v: string[]) => void;
  draftTypes: string[]; setDraftTypes: (v: string[]) => void;
  collapseMed: boolean; setCollapseMed: (v: boolean) => void;
  collapseUser: boolean; setCollapseUser: (v: boolean) => void;
  collapseType: boolean; setCollapseType: (v: boolean) => void;
  moreMed: boolean; setMoreMed: (v: boolean) => void;
  moreUser: boolean; setMoreUser: (v: boolean) => void;
  medSearch: string; setMedSearch: (v: string) => void;
  userSearch: string; setUserSearch: (v: string) => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  const toggleIn = (list: string[], v: string, set: (v: string[]) => void) => set(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const visibleMedicines = STOCK_ITEMS.filter(i => i.toLowerCase().includes(medSearch.toLowerCase()));
  const shownMedicines = moreMed ? visibleMedicines : visibleMedicines.slice(0, 5);
  const visibleUsers = USERS.filter(u => u.toLowerCase().includes(userSearch.toLowerCase()));
  const shownUsers = moreUser ? visibleUsers : visibleUsers.slice(0, 5);

  return (
    <div className="fixed inset-0 z-[1100]">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[360px] bg-white dark:bg-[#0F1525] shadow-2xl flex flex-col animate-slide-in-right border-l border-gray-100 dark:border-[#273244]">
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-gray-100 dark:border-[#273244]">
          <h4 className="flex items-center gap-2.5 text-lg font-bold text-gray-900 dark:text-gray-100">
            <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0F9291] to-teal-600 text-white flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </span>
            Filter
          </h4>
          <button onClick={onCancel} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-[#232323] hover:text-gray-600 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Medicine group */}
          <div className="rounded-2xl border border-gray-100 dark:border-[#273244]">
            <button onClick={() => setCollapseMed(!collapseMed)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#151E35] rounded-t-2xl transition-colors">
              Medicine
              {collapseMed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
            </button>
            {collapseMed && (
              <div className="px-4 pb-4 pt-1">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={medSearch} onChange={e => setMedSearch(e.target.value)} placeholder="Search" className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10" />
                </div>
                {shownMedicines.map(i => (
                  <FilterCheckbox key={i} checked={draftMedicines.includes(i)} onToggle={() => toggleIn(draftMedicines, i, setDraftMedicines)} label={i} />
                ))}
                {visibleMedicines.length > 5 && (
                  <button onClick={() => setMoreMed(!moreMed)} className="text-[#0F9291] text-xs font-medium hover:underline mt-1">
                    {moreMed ? 'View Less' : 'View More'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Adjusted By */}
          <div className="rounded border-gray-100 dark:border-[#273244]">
            <button onClick={() => setCollapseUser(!collapseUser)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1E1E1E] rounded-md transition-colors">
              Adjusted By
              {collapseUser ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
            </button>
            {collapseUser && (
              <div className="py-2 px-0.5">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search" className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10" />
                </div>
                {shownUsers.map(u => (
                  <div key={u} className="flex items-center py-1.5">
                    <input type="checkbox" checked={draftUsers.includes(u)} onChange={() => toggleIn(draftUsers, u, setDraftUsers)} className="w-4 h-4 rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291]" />
                    <label className="flex items-center gap-2 ms-2 cursor-pointer">
                      <span className="w-6 h-6 rounded-full overflow-hidden border border-gray-200 dark:border-[#2A2A2A]" />
                      <span className="text-sm">{u}</span>
                    </label>
                  </div>
                ))}
                {visibleUsers.length > 5 && (
                  <button onClick={() => setMoreUser(!moreUser)} className="text-xs font-medium text-[#0F9291] hover:underline mt-1">
                    {moreUser ? 'View Less' : 'View More'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Adjustment Type */}
          <div className="border-b-0">
            <button onClick={() => setCollapseType(!collapseType)} className="w-full flex items-center justify-between text-sm font-semibold text-gray-800 dark:text-gray-200 py-1 transition-colors">
              Adjustment Type
              {collapseType ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
            </button>
            {collapseType && (
              <div className="py-2">
                <FilterCheckRow checked={draftTypes.includes('Increase')} onToggle={() => toggleIn(draftTypes, 'Increase', setDraftTypes)} badge={<span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Increase</span>} />
                <FilterCheckRow checked={draftTypes.includes('Decrease')} onToggle={() => toggleIn(draftTypes, 'Decrease', setDraftTypes)} badge={<span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">Decrease</span>} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-[#273244] flex items-center justify-between gap-2 flex-wrap">
          <button onClick={onCancel} className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#232323] hover:bg-gray-200 dark:hover:bg-[#2A2A2A] transition-all">
            <X className="w-4 h-4" /> Cancel
          </button>
          <button onClick={onApply} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0F9291] to-teal-600 shadow-sm shadow-[#0F9291]/25 hover:shadow-md hover:shadow-[#0F9291]/40 transition-all active:scale-95">
            <Check className="w-4 h-4" /> Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterCheckbox({ checked, onToggle, label, badge }: { checked: boolean; onToggle: () => void; label?: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center ps-0 mb-2">
      <input type="checkbox" checked={checked} onChange={onToggle} className="w-4 h-4 rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291]" />
      <label className="w-full flex items-center gap-2 ms-2 cursor-pointer text-sm">
        {badge}
        {label}
      </label>
    </div>
  );
}

function FilterCheckRow({ checked, onToggle, label, badge }: { checked: boolean; onToggle: () => void; label?: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center mb-2">
      <input type="checkbox" checked={checked} onChange={onToggle} className="w-4 h-4 rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291]" />
      <label className="w-full flex items-center gap-2 ms-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
        {badge}
        {label}
      </label>
    </div>
  );
}

/* ─────────────── Main Page ─────────────── */

export default function StockAdjustmentPage() {
  const [rows, setRows] = useState<AdjustmentRow[]>(INITIAL_ROWS);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [dateOpen, setDateOpen] = useState(false);

  const [sortBy, setSortBy] = useState('date-desc');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMN_DEFS.map(c => c.key));
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftMedicines, setDraftMedicines] = useState<string[]>([]);
  const [draftUsers, setDraftUsers] = useState<string[]>([]);
  const [draftTypes, setDraftTypes] = useState<string[]>([]);
  const [filterMedicines, setFilterMedicines] = useState<string[]>([]);
  const [filterUsers, setFilterUsers] = useState<string[]>([]);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [medSearch, setMedSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const [moreOpen, setMoreOpen] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editingRow, setEditingRow] = useState<AdjustmentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdjustmentRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 350); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setColumnsOpen(false); setSortOpen(false); setExportOpen(false); setMoreOpen(null); setDateOpen(false); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen?.(); setIsFullscreen(true); }
    else { document.exitFullscreen?.(); setIsFullscreen(false); }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter(r => {
      if (q && !`${r.id} ${r.item} ${r.rack} ${r.reason} ${r.adjustedBy}`.toLowerCase().includes(q)) return false;
      if (datePreset !== 'all' && r.ts < daysAgo(datePreset === '7d' ? 7 : datePreset === '30d' ? 30 : 90)) return false;
      if (filterMedicines.length && !filterMedicines.includes(r.item)) return false;
      if (filterUsers.length && !filterUsers.includes(r.adjustedBy)) return false;
      if (filterTypes.length && !filterTypes.includes(r.type)) return false;
      return true;
    });
  }, [rows, searchQuery, datePreset, filterMedicines, filterUsers, filterTypes]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'item-asc') arr.sort((a, b) => a.item.localeCompare(b.item));
    else if (sortBy === 'item-desc') arr.sort((a, b) => b.item.localeCompare(a.item));
    else if (sortBy === 'date-asc') arr.sort((a, b) => a.ts - b.ts);
    else arr.sort((a, b) => b.ts - a.ts);
    return arr;
  }, [filtered, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const from = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(sorted.length, safePage * pageSize);

  useEffect(() => { setPage(1); }, [searchQuery, datePreset, filterMedicines, filterUsers, filterTypes, pageSize]);
  useEffect(() => { if (safePage < 1) setPage(1); }, [safePage]);

  const activeFilterCount = filterMedicines.length + filterUsers.length + filterTypes.length;

  const avatarColor = (name: string) => {
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  };

  const handleRefresh = () => { setIsLoading(true); setTimeout(() => setIsLoading(false), 350); };

  const handleCreate = (form: AdjustmentForm) => {
    setSaving(true);
    setTimeout(() => {
      const num = Math.max(...rows.map(r => parseInt(r.id.replace('#ADJ', ''), 10))) + 1;
      const qty = Math.max(0, parseInt(form.qty, 10) || 0);
      const after = form.type === 'Decrease' ? form.before - qty : form.before + qty;
      const newRow: AdjustmentRow = {
        id: `#ADJ${String(num).padStart(3, '0')}`,
        item: form.item, date: formatDateTime(form.date, form.time), ts: Date.now(),
        rack: form.rack, type: form.type as 'Increase' | 'Decrease', before: form.before, adjQty: qty, after,
        reason: form.reason || 'Physical Count', adjustedBy: form.adjustedBy,
      };
      setRows(prev => [newRow, ...prev]);
      setSaving(false);
      setShowCreate(false);
    }, 300);
  };

  const handleEdit = (form: AdjustmentForm) => {
    if (!editingRow) return;
    setSaving(true);
    setTimeout(() => {
      const qty = Math.max(0, parseInt(form.qty, 10) || 0);
      const after = form.type === 'Decrease' ? form.before - qty : form.before + qty;
      setRows(prev => prev.map(r => r.id === editingRow.id
        ? { ...r, item: form.item, rack: form.rack, type: form.type as 'Increase' | 'Decrease', adjQty: qty, after, reason: form.reason, adjustedBy: form.adjustedBy, date: formatDateTime(form.date, form.time), ts: Date.now() }
        : r));
      setSaving(false);
      setEditingRow(null);
    }, 300);
  };

  const handleDelete = () => {
    if (deleteTarget) { setRows(prev => prev.filter(r => r.id !== deleteTarget.id)); setDeleteTarget(null); }
  };

  const exportCSV = () => {
    const headers = COLUMN_DEFS.map(c => c.label).join(',');
    const lines = sorted.map(r => `${r.id},${r.item},${r.date},${r.rack},${r.type},${r.before},${r.adjQty},${r.after},${r.reason},${r.adjustedBy}`);
    const blob = new Blob([`\uFEFF${headers}\n${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'stock-adjustments.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const pageItems = () => {
    const arr: (number | 'dots')[] = [];
    if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) arr.push(i); return arr; }
    if (safePage <= 3) { arr.push(1, 2, 3, 4, 'dots', totalPages); }
    else if (safePage >= totalPages - 2) { arr.push(1, 'dots', totalPages - 3, totalPages - 2, totalPages - 1, totalPages); }
    else { arr.push(1, 'dots', safePage - 1, safePage, safePage + 1, 'dots', totalPages); }
    return arr;
  };

  const closeMenus = () => { setColumnsOpen(false); setSortOpen(false); setExportOpen(false); setMoreOpen(null); setDateOpen(false); };

  const thCls = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap';
  const tdCls = 'px-4 py-4 whitespace-nowrap';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0F1E] p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto">
        {(columnsOpen || sortOpen || exportOpen || moreOpen) && (
          <div className="fixed inset-0 z-[1040]" onClick={closeMenus} />
        )}

        {/* ─── Breadcrumb + Actions ─── */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <House className="w-4 h-4" /> Dashboard
                </span>
              </li>
              <li className="text-gray-300 dark:text-neutral-600">/</li>
              <li className="text-gray-900 dark:text-gray-100 font-medium">Stock Adjustment</li>
            </ol>
          </nav>
          <div className="flex items-center justify-end gap-2">
            <button onClick={handleRefresh} title="Refresh" className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#141B2E] text-gray-500 dark:text-gray-400 hover:text-[#0F9291] hover:border-[#0F9291]/40 transition-all shadow-sm">
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={toggleFullscreen} title="Maximize" className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#141B2E] text-gray-500 dark:text-gray-400 hover:text-[#0F9291] hover:border-[#0F9291]/40 transition-all shadow-sm">
              {isFullscreen ? <X className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
            <button
              onClick={() => { setEditingRow(null); setShowCreate(true); }}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-[#0F9291] to-teal-600 text-white text-sm font-semibold shadow-sm shadow-[#0F9291]/30 hover:shadow-md hover:shadow-[#0F9291]/40 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add New
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Stock Adjustment</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Reconcile on-hand quantities to match the physical stock.</p>
          </div>
        </div>

        {/* ─── Card ─── */}
        <div className="bg-white dark:bg-[#0F1525] rounded-2xl border border-gray-100 dark:border-[#273244] shadow-sm">
          {/* Card Header */}
          <div className="px-4 sm:px-5 py-4 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center flex-wrap sm:flex-nowrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-52 sm:w-64 h-10 pl-9 pr-3 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all" />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarDays className="w-4 h-4" /></span>
                <button onClick={() => { setDateOpen(o => !o); setColumnsOpen(false); setSortOpen(false); setExportOpen(false); }}
                  className="h-10 pl-9 pr-3 min-w-[150px] flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl hover:border-gray-300 transition-all">
                  <span className="flex-1 text-left whitespace-nowrap">{DATE_PRESETS.find(p => p.key === datePreset)?.label}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {dateOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-44 bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-[#2A2A2A] rounded-xl shadow-xl py-1.5 z-[1050] animate-dialog-field">
                    {DATE_PRESETS.map(p => (
                      <button key={p.key} onClick={() => { setDatePreset(p.key); setDateOpen(false); }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#232323] transition-colors ${datePreset === p.key ? 'text-[#0F9291] font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                        {p.label}
                        {datePreset === p.key && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {/* Filter */}
              <button onClick={() => setFilterOpen(true)} title="Filter"
                className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#141B2E] text-gray-500 dark:text-gray-400 hover:text-[#0F9291] hover:border-[#0F9291]/40 transition-all">
                <Filter className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#0F9291] text-white text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>
                )}
              </button>

              {/* Columns */}
              <div className="relative">
                <button onClick={() => { setColumnsOpen(o => !o); setSortOpen(false); setExportOpen(false); }}
                  className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#1E1E1E] text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-[#0F9291]/40 transition-all">
                  <Columns className="w-4 h-4" /> Columns
                </button>
                {columnsOpen && (
                  <div className="absolute left-0 mt-1.5 w-60 bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-[#2A2A2A] rounded-xl shadow-xl max-h-80 overflow-y-auto py-2 z-[1050] animate-dialog-field">
                    {COLUMN_DEFS.map(c => (
                      <label key={c.key} className="flex items-center gap-3 px-3.5 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#232323] transition-colors text-gray-700 dark:text-gray-300">
                        <span className="text-gray-300 dark:text-[#3A3A3A] select-none">≡</span>
                        <input type="checkbox" checked={visibleColumns.includes(c.key)}
                          onChange={() => setVisibleColumns(prev => prev.includes(c.key) ? prev.filter(k => k !== c.key) : [...prev, c.key])}
                          className="w-4 h-4 rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291]" />
                        <span className="capitalize">{c.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort */}
              <div className="relative">
                <button onClick={() => { setSortOpen(o => !o); setColumnsOpen(false); setExportOpen(false); }}
                  className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#1E1E1E] text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-[#0F9291]/40 transition-all">
                  <ArrowUpDown className="w-4 h-4" /> Sort by
                </button>
                {sortOpen && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-[#2A2A2A] rounded-xl shadow-xl py-1.5 z-[1050] animate-dialog-field">
                    {[
                      { key: 'item-asc', label: 'Items', badge: 'A-Z' },
                      { key: 'item-desc', label: 'Items', badge: 'Z-A' },
                      { key: 'date-asc', label: 'Date - Ascending', badge: '1-9' },
                      { key: 'date-desc', label: 'Date - Descending', badge: '9-1' },
                    ].map(s => (
                      <button key={s.key} onClick={() => { setSortBy(s.key); setSortOpen(false); }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#232323] transition-colors ${sortBy === s.key ? 'text-[#0F9291] font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                        <span>{s.label}</span>
                        <span className="text-xs text-gray-400">{s.badge}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Export */}
              <div className="relative">
                <button onClick={() => { setExportOpen(o => !o); setColumnsOpen(false); setSortOpen(false); }}
                  className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#1E1E1E] text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-[#0F9291]/40 transition-all">
                  <ArrowUpToLine className="w-4 h-4" /> Export
                </button>
                {exportOpen && (
                  <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-[#2A2A2A] rounded-xl shadow-xl py-1.5 z-[1050] animate-dialog-field">
                    <button onClick={() => { setExportOpen(false); window.print(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#232323] transition-colors">
                      <Printer className="w-4 h-4" /> Export as PDF
                    </button>
                    <button onClick={() => { setExportOpen(false); exportCSV(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#232323] transition-colors">
                      <FileSpreadsheet className="w-4 h-4" /> Export as Excel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Table ─── */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#192032] border-y border-gray-100 dark:border-[#273244]">
                  <th className={thCls}>ID</th>
                  {COLUMN_DEFS.filter(c => visibleColumns.includes(c.key)).map(c => <th key={c.key} className={thCls}>{c.label}</th>)}
                  <th className={thCls} />
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#0F1525] divide-y divide-gray-100 dark:divide-[#1E2A3D]">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: visibleColumns.length + 2 }).map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className="h-4 rounded-md bg-gray-100 dark:bg-[#1E2A3D] animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 2} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-8 h-8 text-gray-300 dark:text-neutral-600" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No adjustments found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageRows.map(r => (
                    <tr key={r.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#151E35] transition-colors">
                      <td className={tdCls}><span className="text-[#0F9291] font-medium text-sm">{r.id}</span></td>
                      {visibleColumns.includes('item') && <td className={tdCls}><span className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.item}</span></td>}
                      {visibleColumns.includes('date') && <td className={tdCls}><span className="text-sm text-gray-600 dark:text-gray-300">{r.date}</span></td>}
                      {visibleColumns.includes('rack') && <td className={tdCls}><span className="text-sm font-medium text-[#0F9291]">{r.rack}</span></td>}
                      {visibleColumns.includes('type') && (
                        <td className={tdCls}>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${r.type === 'Increase' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>{r.type}</span>
                        </td>
                      )}
                      {visibleColumns.includes('before') && <td className={tdCls}><span className="text-sm text-gray-600 dark:text-gray-300">{r.before}</span></td>}
                      {visibleColumns.includes('adjQty') && (
                        <td className={tdCls}><span className={`text-sm font-bold ${r.type === 'Increase' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>{r.type === 'Increase' ? '+' : '-'}{r.adjQty}</span></td>
                      )}
                      {visibleColumns.includes('after') && <td className={tdCls}><span className="text-sm text-gray-600 dark:text-gray-300">{r.after}</span></td>}
                      {visibleColumns.includes('reason') && <td className={tdCls}><span className="text-sm text-gray-600 dark:text-gray-300">{r.reason}</span></td>}
                      {visibleColumns.includes('adjustedBy') && (
                        <td className={tdCls}>
                          <div className="flex items-center gap-2.5">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-white ${avatarColor(r.adjustedBy)}`}>{getInitials(r.adjustedBy)}</span>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{r.adjustedBy}</span>
                          </div>
                        </td>
                      )}
                      <td className={`${tdCls} text-right`}>
                        <div className="relative inline-block">
                          <button onClick={() => setMoreOpen(moreOpen === r.id ? null : r.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#232323] transition-all" aria-label="Actions">
                            <EllipsisVertical className="w-4 h-4" />
                          </button>
                          {moreOpen === r.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-[#2A2A2A] rounded-xl shadow-xl py-1.5 z-[1050] animate-dialog-field">
                              <button onClick={() => { setMoreOpen(null); setEditingRow(r); setShowCreate(true); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#232323] hover:text-[#0F9291] transition-colors">
                                <Edit className="w-4 h-4" /> Edit
                              </button>
                              <button onClick={() => { setMoreOpen(null); setDeleteTarget(r); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#232323] hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ─── Pagination ─── */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-4 border-t border-gray-100 dark:border-[#273244]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Showing {from} to {to} of {sorted.length} entries</p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
                className="w-8 h-8 text-xs font-semibold rounded-lg border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#1F1F1F] text-gray-600 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">&lt;</button>
              {pageItems().map((p, i) => p === 'dots'
                ? <span key={i} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">...</span>
                : <button key={i} onClick={() => setPage(p)} disabled={p === safePage}
                    className={`w-8 h-8 text-xs font-semibold rounded-lg border transition-all ${p === safePage ? 'bg-[#0F9291] text-white border-[#0F9291]' : 'border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#1F1F1F] text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}>{p}</button>
              )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                className="w-8 h-8 text-xs font-semibold rounded-lg border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#1F1F1F] text-gray-600 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">&gt;</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">Entries per page</label>
              <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
                className="h-8 px-2 text-xs border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1F1F1F] rounded-lg focus:outline-none focus:border-[#0F9291]">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Create / Edit Modal ─── */}
      {(showCreate || editingRow) && (
        <AdjustmentFormModal
          mode={editingRow ? 'edit' : 'create'}
          initial={editingRow}
          saving={saving}
          onClose={() => { setShowCreate(false); setEditingRow(null); }}
          onSave={editingRow ? handleEdit : handleCreate}
        />
      )}

      {deleteTarget && (
        <GlobalConfirmModal
          onClose={() => setDeleteTarget(null)}
          title="Delete Confirmation"
          message={<>Are you sure you want to delete <strong>&ldquo;{deleteTarget.item}&rdquo;</strong> adjustment <strong>{deleteTarget.id}</strong>?</>}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
        />
      )}

      {filterOpen && (
        <FilterSidebar
          draftMedicines={draftMedicines} setDraftMedicines={setDraftMedicines}
          draftUsers={draftUsers} setDraftUsers={setDraftUsers}
          draftTypes={draftTypes} setDraftTypes={setDraftTypes}
          collapseMed={true} setCollapseMed={() => {}}
          collapseUser={true} setCollapseUser={() => {}}
          collapseType={true} setCollapseType={() => {}}
          moreMed={false} setMoreMed={() => {}}
          moreUser={false} setMoreUser={() => {}}
          medSearch={medSearch} setMedSearch={setMedSearch}
          userSearch={userSearch} setUserSearch={setUserSearch}
          onCancel={() => setFilterOpen(false)}
          onApply={() => { setFilterMedicines(draftMedicines); setFilterUsers(draftUsers); setFilterTypes(draftTypes); setFilterOpen(false); }}
        />
      )}
    </div>
  );
}