'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, Plus, RotateCw, Maximize, ChevronDown, ChevronRight, ChevronUp, X, Edit, Trash2,
  EllipsisVertical, Filter, Columns, CalendarDays, Clock, House, Check,
  FileSpreadsheet, Printer, ArrowUpToLine, ArrowUpDown, Save, Loader2, Truck, Pill, Users,
} from '@/components/ui/LucideIcon';
import GlobalModal, { GlobalConfirmModal } from '@/components/ui/GlobalModal';

/* ───────────── Types & Demo Data (DreamPOS Stock Transfer) ───────────── */

interface TransferRow {
  id: string;
  item: string;
  dateISO: string;
  time24: string;
  ts: number;
  from: string;
  to: string;
  qty: number;
  reason: string;
  by: string;
  status: 'Active' | 'Inactive';
}

const STOCK_ITEMS = [
  'Paracetamol 500', 'Amoxicillin 250', 'Cetirizine', 'Ceftriaxone 20',
  'Betnovate', 'Amoxicillin 30', 'Tetanus Toxoid', 'Atorvastatin',
  'Metformin 100', 'Ondansetron',
];

const BRANCHES = [
  'Main Branch, Newyork', 'Branch 2, Los Angeles', 'Branch 3, San Diego',
  'Branch 4, Dallas', 'Branch 5, San Antonio',
];

const USERS = ['Mervin Nesmith', 'Joyce Kerns', 'John Baxter', 'Margaret Fehr', 'Benjamin Walker', 'Elizabeth Porter', 'Freddie Brown', 'Dawn Peterson', 'James Howard', 'Doris Crosby'];

function to12(h: number, m: number): string {
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ap}`;
}

function formatDisplay(iso: string, time24: string): string {
  const d = new Date(`${iso}T${time24}`);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [h, m] = time24.split(':').map(Number);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${to12(h, m)}`;
}

const T = (id: string, item: string, d: string, time: string, from: string, to: string, qty: number, by: string): TransferRow => {
  const [h, m] = time.split(':').map(Number);
  return {
    id, item, dateISO: d, time24: time,
    ts: new Date(`${d}T${time}`).getTime(),
    from, to, qty, reason: '', by, status: 'Active',
  };
};

const INITIAL_ROWS: TransferRow[] = [
  T('#TRA016', 'Paracetamol 500', '2026-04-24', '10:00', 'Main Branch, Newyork', 'Branch 2, Los Angeles', 30, 'Mervin Nesmith'),
  T('#TRA015', 'Amoxicillin 250', '2026-04-20', '16:15', 'Branch 2, Los Angeles', 'Branch 3, San Diego', 180, 'Joyce Kerns'),
  T('#TRA014', 'Cetirizine', '2026-04-10', '11:30', 'Branch 4, Dallas', 'Branch 2, Los Angeles', 50, 'John Baxter'),
  T('#TRA013', 'Ceftriaxone 20', '2026-03-21', '09:10', 'Main Branch, Newyork', 'Branch 3, San Diego', 110, 'Margaret Fehr'),
  T('#TRA012', 'Betnovate', '2026-03-18', '15:00', 'Branch 2, Los Angeles', 'Branch 5, San Antonio', 70, 'Benjamin Walker'),
  T('#TRA011', 'Amoxicillin 30', '2026-03-06', '09:30', 'Branch 4, Dallas', 'Branch 3, San Diego', 300, 'Elizabeth Porter'),
  T('#TRA010', 'Tetanus Toxoid', '2026-02-26', '17:40', 'Branch 5, San Antonio', 'Main Branch, Newyork', 230, 'Freddie Brown'),
  T('#TRA009', 'Atorvastatin', '2026-02-17', '09:00', 'Main Branch, Newyork', 'Branch 2, Los Angeles', 50, 'Dawn Peterson'),
  T('#TRA008', 'Metformin 100', '2026-01-20', '13:15', 'Branch 3, San Diego', 'Branch 5, San Antonio', 140, 'James Howard'),
  T('#TRA007', 'Ondansetron', '2026-01-12', '16:30', 'Branch 2, Los Angeles', 'Main Branch, Newyork', 130, 'Doris Crosby'),
];

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-rose-500',
  'bg-indigo-500', 'bg-amber-500', 'bg-cyan-500', 'bg-fuchsia-500',
];

const COLUMN_DEFS = [
  { key: 'item', label: 'Item' },
  { key: 'datetime', label: 'Date & Time' },
  { key: 'from', label: 'From' },
  { key: 'to', label: 'To' },
  { key: 'qty', label: 'Quantity' },
  { key: 'by', label: 'By' },
];

const DATE_PRESETS = [
  { key: 'all', label: 'All Time' },
  { key: '7', label: 'Last 7 Days' },
  { key: '30', label: 'Last 30 Days' },
  { key: '90', label: 'Last 90 Days' },
];

const FILTER_MEDICINES = ['Paracetamol 500', 'Amoxicillin 250', 'Cetirizine', 'Ceftriaxone 20', 'Betnovate', 'Amoxicillin 30', 'Tetanus Toxoid', 'Atorvastatin'];
const FILTER_USERS = ['Mervin Nesmith', 'Joyce Kerns', 'John Baxter', 'Margaret Fehr', 'Benjamin Walker', 'Elizabeth Porter', 'Freddie Brown', 'Dawn Peterson'];
const FILTER_TOS = ['Branch 2, Los Angeles', 'Branch 3, San Diego', 'Main Branch, Newyork', 'Branch 5, San Antonio'];

const modalInputCls = 'w-full h-11 px-3.5 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#141B2E] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400';
const modalLabelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

/* ───────────── Create / Edit Transfer Modal ───────────── */

function TransferFormModal({ mode, initial, saving, onClose, onSave }: {
  mode: 'create' | 'edit';
  initial: TransferRow | null;
  saving: boolean;
  onClose: () => void;
  onSave: (data: { item: string; from: string; to: string; dateISO: string; time24: string; qty: number; reason: string; by: string }) => void;
}) {
  const [form, setForm] = useState({
    item: initial?.item || '',
    from: initial?.from || '',
    to: initial?.to || '',
    date: initial?.dateISO || '',
    time: initial?.time24 || '',
    qty: initial ? String(initial.qty) : '',
    reason: initial?.reason || '',
    by: initial?.by || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!form.item) e.item = 'Please select an item';
    if (!form.from) e.from = 'Please select a source branch';
    if (!form.to) e.to = 'Please select a destination branch';
    if (form.from && form.to && form.from === form.to) e.to = 'Source and destination must differ';
    if (!form.date) e.date = 'Please select a date';
    if (!form.time) e.time = 'Please select a time';
    const qty = Number(form.qty);
    if (!form.qty || isNaN(qty) || qty <= 0) e.qty = 'Quantity must be greater than 0';
    if (!form.by) e.by = 'Please select a user';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSave({ item: form.item, from: form.from, to: form.to, dateISO: form.date, time24: form.time, qty, reason: form.reason, by: form.by });
  };

  return (
    <GlobalModal
      open
      size="lg"
      hideFooter
      title={mode === 'create' ? 'Create New Transfer' : 'Edit Stock Transfer'}
      subtitle="Transfer stock between branches"
      icon={<Truck className="w-4 h-4" />}
      iconTileClass="bg-gradient-to-br from-[#0F9291] to-teal-600"
      onClose={onClose}
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12">
          <label className={modalLabelCls}>Item <span className="text-red-500">*</span></label>
          <select value={form.item} onChange={e => set('item', e.target.value)} className={`${modalInputCls} appearance-none cursor-pointer`}>
            <option value="">Select</option>
            {STOCK_ITEMS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          {errors.item && <p className="text-xs text-red-500 mt-1">{errors.item}</p>}
        </div>
        <div className="col-span-12 sm:col-span-6">
          <label className={modalLabelCls}>From Branch <span className="text-red-500">*</span></label>
          <select value={form.from} onChange={e => set('from', e.target.value)} className={`${modalInputCls} appearance-none cursor-pointer`}>
            <option value="">Select</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          {errors.from && <p className="text-xs text-red-500 mt-1">{errors.from}</p>}
        </div>
        <div className="col-span-12 sm:col-span-6">
          <label className={modalLabelCls}>To Branch <span className="text-red-500">*</span></label>
          <select value={form.to} onChange={e => set('to', e.target.value)} className={`${modalInputCls} appearance-none cursor-pointer`}>
            <option value="">Select</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          {errors.to && <p className="text-xs text-red-500 mt-1">{errors.to}</p>}
        </div>

        <div className="col-span-12 sm:col-span-6">
          <label className={modalLabelCls}>Date <span className="text-red-500">*</span></label>
          <div className="relative">
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={`${modalInputCls} pr-3`} />
            <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
        </div>
        <div className="col-span-12 sm:col-span-6">
          <label className={modalLabelCls}>Time <span className="text-red-500">*</span></label>
          <div className="relative">
            <input type="time" value={form.time} onChange={e => set('time', e.target.value)} className={`${modalInputCls} pr-3`} />
            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time}</p>}
        </div>

        <div className="col-span-12">
          <label className={modalLabelCls}>Quantity <span className="text-red-500">*</span></label>
          <input type="number" min="0" placeholder="0" value={form.qty} onChange={e => set('qty', e.target.value)} className={modalInputCls} />
          {errors.qty && <p className="text-xs text-red-500 mt-1">{errors.qty}</p>}
        </div>

        <div className="col-span-12">
          <label className={modalLabelCls}>Reason</label>
          <textarea rows={4} value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Reason for transfer"
            className={`${modalInputCls} h-auto min-h-[96px] py-3 resize-none`} />
        </div>

        <div className="col-span-12">
          <label className={modalLabelCls}>Adjusted By <span className="text-red-500">*</span></label>
          <select value={form.by} onChange={e => set('by', e.target.value)} className={`${modalInputCls} appearance-none cursor-pointer`}>
            <option value="">Select</option>
            {USERS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          {errors.by && <p className="text-xs text-red-500 mt-1">{errors.by}</p>}
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

/* ───────────── Filter Sidebar (offcanvas) ───────────── */

function FilterCheckRow({ checked, onToggle, badge }: { checked: boolean; onToggle: () => void; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center mb-2">
      <input type="checkbox" checked={checked} onChange={onToggle} className="w-4 h-4 rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291]" />
      <label className="w-full flex items-center gap-2 ms-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
        {badge}
      </label>
    </div>
  );
}

function FilterSidebar({ draftMedicines, setDraftMedicines, draftUsers, setDraftUsers, draftTos, setDraftTos, draftStatuses, setDraftStatuses, onCancel, onApply }: {
  draftMedicines: string[]; setDraftMedicines: (v: string[]) => void;
  draftUsers: string[]; setDraftUsers: (v: string[]) => void;
  draftTos: string[]; setDraftTos: (v: string[]) => void;
  draftStatuses: string[]; setDraftStatuses: (v: string[]) => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  const [collapseMed, setCollapseMed] = useState(true);
  const [collapseUser, setCollapseUser] = useState(true);
  const [collapseTo, setCollapseTo] = useState(true);
  const [collapseStatus, setCollapseStatus] = useState(true);
  const [moreMed, setMoreMed] = useState(false);
  const [moreUser, setMoreUser] = useState(false);
  const [medSearch, setMedSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const toggleIn = (list: string[], v: string, set: (v: string[]) => void) => set(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const visibleMedicines = FILTER_MEDICINES.filter(i => i.toLowerCase().includes(medSearch.toLowerCase()));
  const shownMedicines = moreMed ? visibleMedicines : visibleMedicines.slice(0, 5);
  const visibleUsers = FILTER_USERS.filter(u => u.toLowerCase().includes(userSearch.toLowerCase()));
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
                  <FilterCheckRow key={i} checked={draftMedicines.includes(i)} onToggle={() => toggleIn(draftMedicines, i, setDraftMedicines)} badge={
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0"><Pill className="w-3.5 h-3.5" /></span>
                      {i}
                    </span>
                  } />
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
          <div className="rounded-2xl border border-gray-100 dark:border-[#273244]">
            <button onClick={() => setCollapseUser(!collapseUser)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#151E35] rounded-t-2xl transition-colors">
              Adjusted By
              {collapseUser ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
            </button>
            {collapseUser && (
              <div className="px-4 pb-4 pt-1">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search" className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10" />
                </div>
                {shownUsers.map(u => (
                  <FilterCheckRow key={u} checked={draftUsers.includes(u)} onToggle={() => toggleIn(draftUsers, u, setDraftUsers)} badge={
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-[#232323] border border-gray-100 dark:border-[#273244] flex items-center justify-center flex-shrink-0"><Users className="w-3 h-3 text-gray-500 dark:text-gray-400" /></span>
                      {u}
                    </span>
                  } />
                ))}
                {visibleUsers.length > 5 && (
                  <button onClick={() => setMoreUser(!moreUser)} className="text-[#0F9291] text-xs font-medium hover:underline mt-1">
                    {moreUser ? 'View Less' : 'View More'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* To Branch */}
          <div className="rounded-2xl border border-gray-100 dark:border-[#273244]">
            <button onClick={() => setCollapseTo(!collapseTo)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#151E35] rounded-t-2xl transition-colors">
              To
              {collapseTo ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
            </button>
            {collapseTo && (
              <div className="px-4 pb-4 pt-1">
                {FILTER_TOS.map(b => (
                  <FilterCheckRow key={b} checked={draftTos.includes(b)} onToggle={() => toggleIn(draftTos, b, setDraftTos)} badge={b} />
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="rounded-2xl border border-gray-100 dark:border-[#273244]">
            <button onClick={() => setCollapseStatus(!collapseStatus)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#151E35] rounded-t-2xl transition-colors">
              Status
              {collapseStatus ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
            </button>
            {collapseStatus && (
              <div className="px-4 pb-4 pt-1">
                <FilterCheckRow checked={draftStatuses.includes('Active')} onToggle={() => toggleIn(draftStatuses, 'Active', setDraftStatuses)} badge={
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                  </span>
                } />
                <FilterCheckRow checked={draftStatuses.includes('Inactive')} onToggle={() => toggleIn(draftStatuses, 'Inactive', setDraftStatuses)} badge={
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Inactive
                  </span>
                } />
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

/* ───────────── Main Page ───────────── */

const thCls = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap';
const tdCls = 'px-4 py-3.5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap';

export default function StockTransferPage() {
  const [rows, setRows] = useState<TransferRow[]>(INITIAL_ROWS);

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
  const [draftTos, setDraftTos] = useState<string[]>([]);
  const [draftStatuses, setDraftStatuses] = useState<string[]>([]);
  const [filterMedicines, setFilterMedicines] = useState<string[]>([]);
  const [filterUsers, setFilterUsers] = useState<string[]>([]);
  const [filterTos, setFilterTos] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);

  const [moreOpen, setMoreOpen] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editingRow, setEditingRow] = useState<TransferRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransferRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    const q = searchQuery.toLowerCase();
    let list = rows.filter(r => {
      if (q && !(r.id.toLowerCase().includes(q) || r.item.toLowerCase().includes(q) || r.from.toLowerCase().includes(q) || r.to.toLowerCase().includes(q) || r.by.toLowerCase().includes(q) || String(r.qty).includes(q))) return false;
      if (datePreset !== 'all') {
        const cutoff = Date.now() - Number(datePreset) * 86400000;
        if (r.ts < cutoff) return false;
      }
      if (filterMedicines.length && !filterMedicines.includes(r.item)) return false;
      if (filterUsers.length && !filterUsers.includes(r.by)) return false;
      if (filterTos.length && !filterTos.includes(r.to)) return false;
      if (filterStatuses.length && !filterStatuses.includes(r.status)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'items-asc': return a.item.localeCompare(b.item);
        case 'items-desc': return b.item.localeCompare(a.item);
        case 'date-asc': return a.ts - b.ts;
        default: return b.ts - a.ts;
      }
    });
    return list;
  }, [rows, searchQuery, datePreset, sortBy, filterMedicines, filterUsers, filterTos, filterStatuses]);

  const activeFilterCount = filterMedicines.length + filterUsers.length + filterTos.length + filterStatuses.length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const from = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, filtered.length);

  const pageItems = () => {
    const pages: (number | 'dots')[] = [];
    const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    if (start > 1) pages.push(1);
    if (start > 2) pages.push('dots');
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < totalPages - 1) pages.push('dots');
    if (end < totalPages) pages.push(totalPages);
    return pages;
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns(v => v.includes(key) ? v.filter(k => k !== key) : [...v, key]);
  };

  const resetAll = () => {
    setSearchQuery('');
    setDatePreset('all');
    setSortBy('date-desc');
    setFilterMedicines([]);
    setFilterUsers([]);
    setFilterTos([]);
    setFilterStatuses([]);
    setPage(1);
  };

  const handleCreate = (data: { item: string; from: string; to: string; dateISO: string; time24: string; qty: number; reason: string; by: string }) => {
    const maxNum = rows.reduce((m, r) => Math.max(m, Number(r.id.replace('#TRA', ''))), 16);
    const newRow: TransferRow = T(`#TRA${String(maxNum + 1).padStart(3, '0')}`, data.item, data.dateISO, data.time24, data.from, data.to, data.qty, data.by);
    newRow.reason = data.reason;
    newRow.ts = Date.now();
    setRows(rs => [newRow, ...rs]);
    setSaving(false);
    setShowCreate(false);
  };

  const handleEdit = (data: { item: string; from: string; to: string; dateISO: string; time24: string; qty: number; reason: string; by: string }) => {
    setRows(rs => rs.map(r => r.id === editingRow?.id ? { ...r, item: data.item, from: data.from, to: data.to, dateISO: data.dateISO, time24: data.time24, ts: new Date(`${data.dateISO}T${data.time24}`).getTime(), qty: data.qty, reason: data.reason, by: data.by } : r));
    setSaving(false);
    setEditingRow(null);
  };

  const handleDelete = () => {
    if (deleteTarget) setRows(rs => rs.filter(r => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const exportCSV = () => {
    const header = 'ID,Item,Date & Time,From,To,Quantity,By';
    const lines = filtered.map(r => [r.id, r.item, formatDisplay(r.dateISO, r.time24), r.from, r.to, r.qty, r.by].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = '\uFEFF' + [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock-transfers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const avatarColor = (by: string) => AVATAR_COLORS[USERS.indexOf(by) % AVATAR_COLORS.length];

  const renderDropdown = (close: () => void, children: React.ReactNode) => (
    <>
      <div className="fixed inset-0 z-[1040]" onClick={close} />
      <div className="absolute top-full right-0 mt-1.5 w-44 bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-[#2A2A2A] rounded-xl shadow-xl py-1.5 z-[1050] animate-dialog-field">
        {children}
      </div>
    </>
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto space-y-5">
        {/* ─── Breadcrumb + Actions ─── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 hover:text-[#0F9291] transition-colors">
              <House className="w-4 h-4" /> Dashboard
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            <span className="text-gray-800 dark:text-gray-100 font-medium">Stock Transfer</span>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={resetAll} title="Refresh"
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#141B2E] text-gray-500 dark:text-gray-400 hover:text-[#0F9291] hover:border-[#0F9291]/40 transition-all">
              <RotateCw className="w-4 h-4" />
            </button>
            <button onClick={toggleFullscreen} title="Maximize"
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#141B2E] text-gray-500 dark:text-gray-400 hover:text-[#0F9291] hover:border-[#0F9291]/40 transition-all">
              <Maximize className="w-4 h-4" />
            </button>
            <button onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0F9291] to-teal-600 shadow-sm shadow-[#0F9291]/30 hover:shadow-md hover:shadow-[#0F9291]/40 transition-all active:scale-95">
              <Plus className="w-4 h-4" /> Add New
            </button>
          </div>
        </div>

        {/* ─── Page Title ─── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Stock Transfer</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Transfer stock between branches</p>
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
                {dateOpen && renderDropdown(() => setDateOpen(false), (
                  <>
                    {DATE_PRESETS.map(p => (
                      <button key={p.key} onClick={() => { setDatePreset(p.key); setDateOpen(false); }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#232323] transition-colors ${datePreset === p.key ? 'text-[#0F9291] font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                        {p.label}
                        {datePreset === p.key && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </>
                ))}
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
                <button onClick={() => { setColumnsOpen(o => !o); setSortOpen(false); setExportOpen(false); setDateOpen(false); }}
                  className="h-10 px-3.5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl hover:border-gray-300 transition-all">
                  <Columns className="w-4 h-4" /> Columns
                </button>
                {columnsOpen && renderDropdown(() => setColumnsOpen(false), (
                  <>
                    {COLUMN_DEFS.map(c => (
                      <label key={c.key} className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#232323] cursor-pointer transition-colors">
                        <input type="checkbox" checked={visibleColumns.includes(c.key)} onChange={() => toggleColumn(c.key)}
                          className="w-4 h-4 rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291]" />
                        {c.label}
                      </label>
                    ))}
                  </>
                ))}
              </div>

              {/* Sort by */}
              <div className="relative">
                <button onClick={() => { setSortOpen(o => !o); setColumnsOpen(false); setExportOpen(false); setDateOpen(false); }}
                  className="h-10 px-3.5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl hover:border-gray-300 transition-all">
                  <ArrowUpDown className="w-4 h-4" /> Sort by
                </button>
                {sortOpen && renderDropdown(() => setSortOpen(false), (
                  <>
                    {[
                      { key: 'items-asc', label: 'Items', badge: 'A-Z' },
                      { key: 'items-desc', label: 'Items', badge: 'Z-A' },
                      { key: 'date-asc', label: 'Date & Time - Ascending', badge: '1-9' },
                      { key: 'date-desc', label: 'Date & Time - Descending', badge: '9-1' },
                    ].map(s => (
                      <button key={s.key} onClick={() => { setSortBy(s.key); setSortOpen(false); }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#232323] transition-colors ${sortBy === s.key ? 'text-[#0F9291] font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                        <span>{s.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#232323] text-gray-500 dark:text-gray-400">{s.badge}</span>
                      </button>
                    ))}
                  </>
                ))}
              </div>

              {/* Export */}
              <div className="relative">
                <button onClick={() => { setExportOpen(o => !o); setColumnsOpen(false); setSortOpen(false); setDateOpen(false); }}
                  className="h-10 px-3.5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl hover:border-gray-300 transition-all">
                  <ArrowUpToLine className="w-4 h-4" /> Export
                </button>
                {exportOpen && renderDropdown(() => setExportOpen(false), (
                  <>
                    <button onClick={() => { setExportOpen(false); window.print(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#232323] hover:text-[#0F9291] transition-colors">
                      <Printer className="w-4 h-4" /> Export as PDF
                    </button>
                    <button onClick={() => { setExportOpen(false); exportCSV(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#232323] hover:text-[#0F9291] transition-colors">
                      <FileSpreadsheet className="w-4 h-4" /> Export as Excel
                    </button>
                  </>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#151E35] border-y border-gray-100 dark:border-[#273244]">
                <tr>
                  <th className={thCls}>ID</th>
                  {visibleColumns.includes('datetime') && <th className={thCls}>Date & Time</th>}
                  {visibleColumns.includes('from') && <th className={thCls}>From</th>}
                  {visibleColumns.includes('to') && <th className={thCls}>To</th>}
                  {visibleColumns.includes('item') && <th className={thCls}>Items</th>}
                  {visibleColumns.includes('qty') && <th className={`${thCls} text-right`}>Quantity</th>}
                  {visibleColumns.includes('by') && <th className={thCls}>By</th>}
                  <th className={`${thCls} text-right`}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#1D2738]">
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                      No transfers found
                    </td>
                  </tr>
                ) : (
                  pageRows.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-[#151E35] transition-colors">
                      <td className={`${tdCls} text-[#0F9291] font-semibold`}>{r.id}</td>
                      {visibleColumns.includes('datetime') && <td className={tdCls}>{formatDisplay(r.dateISO, r.time24)}</td>}
                      {visibleColumns.includes('from') && <td className={`${tdCls} font-medium text-gray-800 dark:text-gray-100`}>{r.from}</td>}
                      {visibleColumns.includes('to') && <td className={`${tdCls} font-medium text-gray-800 dark:text-gray-100`}>{r.to}</td>}
                      {visibleColumns.includes('item') && <td className={tdCls}>{r.item}</td>}
                      {visibleColumns.includes('qty') && <td className={`${tdCls} text-right font-medium`}>{r.qty}</td>}
                      {visibleColumns.includes('by') && (
                        <td className={tdCls}>
                          <div className="flex items-center gap-2.5 font-medium text-gray-800 dark:text-gray-100">
                            <span className={`w-8 h-8 rounded-full ${avatarColor(r.by)} text-white text-xs font-semibold flex items-center justify-center flex-shrink-0`}>
                              {getInitials(r.by)}
                            </span>
                            {r.by}
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
            <p className="text-sm text-gray-500 dark:text-gray-400">Showing {from} to {to} of {filtered.length} entries</p>
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
        <TransferFormModal
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
          message={<>Are you sure you want to delete <strong>&ldquo;{deleteTarget.item}&rdquo;</strong> transfer <strong>{deleteTarget.id}</strong>?</>}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
        />
      )}

      {filterOpen && (
        <FilterSidebar
          draftMedicines={draftMedicines} setDraftMedicines={setDraftMedicines}
          draftUsers={draftUsers} setDraftUsers={setDraftUsers}
          draftTos={draftTos} setDraftTos={setDraftTos}
          draftStatuses={draftStatuses} setDraftStatuses={setDraftStatuses}
          onCancel={() => setFilterOpen(false)}
          onApply={() => { setFilterMedicines(draftMedicines); setFilterUsers(draftUsers); setFilterTos(draftTos); setFilterStatuses(draftStatuses); setFilterOpen(false); }}
        />
      )}
    </div>
  );
}
