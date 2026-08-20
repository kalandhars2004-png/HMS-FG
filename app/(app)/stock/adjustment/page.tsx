'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Plus, RotateCw, Maximize, ChevronDown, ChevronUp, X, Edit, Trash2,
  EllipsisVertical, Filter, Columns, CalendarDays, Clock, House, Layers,
  Check, FileSpreadsheet, Printer, ArrowUpToLine, ArrowUpDown, Save, Loader2,
} from '@/components/ui/LucideIcon';
import GlobalModal, { GlobalConfirmModal } from '@/components/ui/GlobalModal';
import { StockAdjustmentsAPI, ProductsAPI, RacksAPI, UsersAPI } from '@/lib/api';

/* ───────────── Types (real backend model) ───────────── */

interface AdjustmentRow {
  id: number;
  productId: number;
  item: string;
  date: string;
  ts: number;
  type: 'Increase' | 'Decrease';
  qty: number;
  reason: string;
  referenceNo: string;
}

interface ProductOption { id: number; name: string; }
interface RackOption { id: number; code: string; }
interface UserOption { id: number; name: string; }

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-rose-500',
  'bg-indigo-500', 'bg-amber-500', 'bg-cyan-500', 'bg-fuchsia-500',
  'bg-teal-500', 'bg-blue-500',
];

const COLUMN_DEFS = [
  { key: 'item', label: 'Item' },
  { key: 'date', label: 'Adjustment Date' },
  { key: 'type', label: 'Adjustment Type' },
  { key: 'qty', label: 'Adj Qty' },
  { key: 'reason', label: 'Reason' },
  { key: 'referenceNo', label: 'Reference No' },
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

function formatDateTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 === 0 ? 12 : h % 12;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(h).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
}

const daysAgo = (n: number) => Date.now() - n * 86400000;

const thCls = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap';
const tdCls = 'px-4 py-4 whitespace-nowrap';
const inputCls = 'w-full h-11 px-3.5 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all text-gray-900 dark:text-gray-100 bg-white';
const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

/* ─────────────── Adjustment Form Modal ─────────────── */

interface AdjustmentForm {
  productId: number;
  item: string;
  type: string;
  qty: string;
  reason: string;
  referenceNo: string;
}

function AdjustmentFormModal({ mode, initial, saving, products, onClose, onSave }: {
  mode: 'create' | 'edit';
  initial: AdjustmentRow | null;
  saving: boolean;
  products: ProductOption[];
  onClose: () => void;
  onSave: (form: AdjustmentForm) => void;
}) {
  const [form, setForm] = useState<AdjustmentForm>(() => ({
    productId: initial?.productId ?? 0,
    item: initial?.item || '',
    type: initial?.type ?? 'Increase',
    qty: initial ? String(initial.qty) : '',
    reason: initial?.reason ?? '',
    referenceNo: initial?.referenceNo ?? '',
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const errs: Record<string, string> = {};
    if (!form.productId) errs.item = 'Please select an item';
    if (!form.type) errs.type = 'Please select type';
    if (!form.qty || parseInt(form.qty, 10) <= 0) errs.qty = 'Quantity must be greater than 0';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave(form);
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
          <select value={form.productId} onChange={e => {
            const id = Number(e.target.value);
            const prod = products.find(p => p.id === id);
            setForm({ ...form, productId: id, item: prod?.name || '' });
          }} className={`${inputCls} appearance-none cursor-pointer`}>
            <option value={0}>Select</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {errors.item && <p className="text-xs text-red-500 mt-1">{errors.item}</p>}
        </div>

        <div className="col-span-12 sm:col-span-6">
          <label className={labelCls}>Adjustment Type <span className="text-red-500">*</span></label>
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={`${inputCls} appearance-none cursor-pointer`}>
            <option value="Increase">Increase</option>
            <option value="Decrease">Decrease</option>
          </select>
          {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
        </div>
        <div className="col-span-12 sm:col-span-6">
          <label className={labelCls}>Adjustment Quantity <span className="text-red-500">*</span></label>
          <input type="number" min="1" placeholder="0" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} className={inputCls} />
          {errors.qty && <p className="text-xs text-red-500 mt-1">{errors.qty}</p>}
        </div>

        <div className="col-span-12">
          <label className={labelCls}>Reason</label>
          <textarea rows={4} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reason for adjustment"
            className={`${inputCls} h-auto min-h-[96px] py-3 resize-none`} />
        </div>

        <div className="col-span-12">
          <label className={labelCls}>Reference No</label>
          <input type="text" value={form.referenceNo} onChange={e => setForm({ ...form, referenceNo: e.target.value })} placeholder="Optional reference number"
            className={inputCls} />
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

function FilterSidebar({ draftMedicines, setDraftMedicines, draftTypes, setDraftTypes, collapseMed, setCollapseMed, collapseType, setCollapseType, medSearch, setMedSearch, allMedicines, onCancel, onApply }: {
  draftMedicines: string[]; setDraftMedicines: (v: string[]) => void;
  draftTypes: string[]; setDraftTypes: (v: string[]) => void;
  collapseMed: boolean; setCollapseMed: (v: boolean) => void;
  collapseType: boolean; setCollapseType: (v: boolean) => void;
  medSearch: string; setMedSearch: (v: string) => void;
  allMedicines: string[];
  onCancel: () => void;
  onApply: () => void;
}) {
  const toggleIn = (list: string[], v: string, set: (v: string[]) => void) => set(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const visibleMedicines = allMedicines.filter(i => i.toLowerCase().includes(medSearch.toLowerCase()));
  const shownMedicines = visibleMedicines.slice(0, 50);

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
                {visibleMedicines.length === 0 && <p className="text-xs text-gray-400 py-2">No medicines found</p>}
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
  const [rows, setRows] = useState<AdjustmentRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
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
  const [draftTypes, setDraftTypes] = useState<string[]>([]);
  const [filterMedicines, setFilterMedicines] = useState<string[]>([]);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [medSearch, setMedSearch] = useState('');

  const [moreOpen, setMoreOpen] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editingRow, setEditingRow] = useState<AdjustmentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdjustmentRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const allMedicines = useMemo(() => products.map(p => p.name), [products]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [adjRes, prodRes, userRes] = await Promise.all([
        StockAdjustmentsAPI.getAll().catch(() => ({ data: [] })),
        ProductsAPI.getAll().catch(() => ({ data: [] })),
        UsersAPI.getAll().catch(() => ({ data: [] })),
      ]);
      const prodList: ProductOption[] = (prodRes.data || []).map((p: any) => ({ id: p.id, name: p.name }));
      setProducts(prodList);
      setUsers((userRes.data || []).map((u: any) => ({ id: u.id, name: u.name })));

      const nameOf = (productId: number) => prodList.find(p => p.id === productId)?.name || `Product #${productId}`;
      const mapped: AdjustmentRow[] = (adjRes.data || []).map((a: any) => ({
        id: a.id,
        productId: a.productId,
        item: a.productName || nameOf(a.productId),
        date: formatDateTime(a.createdAt),
        ts: a.createdAt ? new Date(a.createdAt).getTime() : 0,
        type: (a.adjustmentType === 'Decrease' ? 'Decrease' : 'Increase'),
        qty: a.quantity ?? 0,
        reason: a.reason || '',
        referenceNo: a.referenceNo || `#ADJ${String(a.id).padStart(3, '0')}`,
      }));
      setRows(mapped);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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
      if (q && !`${r.referenceNo} ${r.item} ${r.reason}`.toLowerCase().includes(q)) return false;
      if (datePreset !== 'all' && r.ts < daysAgo(datePreset === '7d' ? 7 : datePreset === '30d' ? 30 : 90)) return false;
      if (filterMedicines.length && !filterMedicines.includes(r.item)) return false;
      if (filterTypes.length && !filterTypes.includes(r.type)) return false;
      return true;
    });
  }, [rows, searchQuery, datePreset, filterMedicines, filterTypes]);

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

  useEffect(() => { setPage(1); }, [searchQuery, datePreset, filterMedicines, filterTypes, pageSize]);
  useEffect(() => { if (safePage < 1) setPage(1); }, [safePage]);

  const activeFilterCount = filterMedicines.length + filterTypes.length;

  const avatarColor = (name: string) => {
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  };

  const handleRefresh = () => { loadData(); };

  const handleCreate = async (form: AdjustmentForm) => {
    setSaving(true);
    try {
      await StockAdjustmentsAPI.create({
        productId: form.productId,
        adjustmentType: form.type,
        quantity: Math.max(0, parseInt(form.qty, 10) || 0),
        reason: form.reason || null,
        referenceNo: form.referenceNo || null,
      });
      setShowCreate(false);
      await loadData();
    } catch {
      alert('Failed to create adjustment');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (form: AdjustmentForm) => {
    if (!editingRow) return;
    setSaving(true);
    try {
      await StockAdjustmentsAPI.update(String(editingRow.id), {
        productId: form.productId,
        adjustmentType: form.type,
        quantity: Math.max(0, parseInt(form.qty, 10) || 0),
        reason: form.reason || null,
        referenceNo: form.referenceNo || null,
      });
      setEditingRow(null);
      await loadData();
    } catch {
      alert('Failed to update adjustment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await StockAdjustmentsAPI.delete(String(deleteTarget.id));
      setDeleteTarget(null);
      await loadData();
    } catch {
      alert('Failed to delete adjustment');
    }
  };

  const exportCSV = () => {
    const headers = COLUMN_DEFS.map(c => c.label).join(',');
    const lines = sorted.map(r => `${r.referenceNo},${r.item},${r.date},${r.type},${r.qty},${r.reason}`);
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
                      <td className={tdCls}><span className="text-[#0F9291] font-medium text-sm">{r.referenceNo}</span></td>
                      {visibleColumns.includes('item') && <td className={tdCls}><span className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.item}</span></td>}
                      {visibleColumns.includes('date') && <td className={tdCls}><span className="text-sm text-gray-600 dark:text-gray-300">{r.date}</span></td>}
                      {visibleColumns.includes('type') && (
                        <td className={tdCls}>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${r.type === 'Increase' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>{r.type}</span>
                        </td>
                      )}
                      {visibleColumns.includes('qty') && (
                        <td className={tdCls}><span className={`text-sm font-bold ${r.type === 'Increase' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>{r.type === 'Increase' ? '+' : '-'}{r.qty}</span></td>
                      )}
                      {visibleColumns.includes('reason') && <td className={tdCls}><span className="text-sm text-gray-600 dark:text-gray-300">{r.reason || '—'}</span></td>}
                      {visibleColumns.includes('referenceNo') && <td className={tdCls}><span className="text-sm text-gray-600 dark:text-gray-300">{r.referenceNo}</span></td>}
                      <td className={`${tdCls} text-right`}>
                        <div className="relative inline-block">
                          <button onClick={() => setMoreOpen(moreOpen === String(r.id) ? null : String(r.id))}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#232323] transition-all" aria-label="Actions">
                            <EllipsisVertical className="w-4 h-4" />
                          </button>
                          {moreOpen === String(r.id) && (
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
          products={products}
          onClose={() => { setShowCreate(false); setEditingRow(null); }}
          onSave={editingRow ? handleEdit : handleCreate}
        />
      )}

      {deleteTarget && (
        <GlobalConfirmModal
          onClose={() => setDeleteTarget(null)}
          title="Delete Confirmation"
          message={<>Are you sure you want to delete <strong>&ldquo;{deleteTarget.item}&rdquo;</strong> adjustment <strong>{deleteTarget.referenceNo}</strong>?</>}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
        />
      )}

      {filterOpen && (
        <FilterSidebar
          draftMedicines={draftMedicines} setDraftMedicines={setDraftMedicines}
          draftTypes={draftTypes} setDraftTypes={setDraftTypes}
          collapseMed={true} setCollapseMed={() => {}}
          collapseType={true} setCollapseType={() => {}}
          medSearch={medSearch} setMedSearch={setMedSearch}
          allMedicines={allMedicines}
          onCancel={() => setFilterOpen(false)}
          onApply={() => { setFilterMedicines(draftMedicines); setFilterTypes(draftTypes); setFilterOpen(false); }}
        />
      )}
    </div>
  );
}
