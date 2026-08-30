'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, Plus, RotateCw, Maximize, ChevronDown, ChevronRight, ChevronUp, X, Edit, Trash2, EllipsisVertical,
  Filter, Columns, CalendarDays, Check,
  FileSpreadsheet, Printer, ArrowUpToLine, ArrowUpDown, House, Users,
  ShoppingBag, Truck, CheckCircle2, ArrowDownRight, ArrowUpRight,
} from '@/components/ui/LucideIcon';
import GlobalModal, { GlobalConfirmModal } from '@/components/ui/GlobalModal';
import { PurchaseOrdersAPI } from '@/lib/api';
import { useBranch } from '@/lib/branch-context';

/* ───────────── Types & Demo Data (DreamPOS Purchase Orders) ───────────── */

interface PurchaseOrder {
  id: string;
  vendor: string;
  ordered: string;
  expected: string;
  items: number;
  amount: number;
  status: 'Approved' | 'Closed' | 'Ordered' | 'Draft';
}

const VENDORS_BASE = [
  'MedLife Distributors', 'HealthCare Pharma', 'GreenCross Medicals', 'NovaCure Pharma', 'CareWell Agency',
  'Zenith Distributors', 'LifeLine Pharma', 'SafeMeds Distribution', 'NovaHealth Pharma', 'PrimeCare Pharma',
];

const STATUS_BADGES: Record<PurchaseOrder['status'], { label: string; dot: string; cls: string }> = {
  Approved: { label: 'Approved', dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
  Closed: { label: 'Closed', dot: 'bg-red-500', cls: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' },
  Ordered: { label: 'Ordered', dot: 'bg-sky-500', cls: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400' },
  Draft: { label: 'Draft', dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400' },
};

const INITIAL_ROWS: PurchaseOrder[] = [
  { id: '#POR017', vendor: 'MedLife Distributors', ordered: '28 Jan 2026', expected: '28 Jan 2027', items: 15, amount: 120, status: 'Approved' },
  { id: '#POR018', vendor: 'HealthCare Pharma', ordered: '15 Feb 2026', expected: '15 Feb 2027', items: 12, amount: 20, status: 'Closed' },
  { id: '#POR019', vendor: 'GreenCross Medicals', ordered: '10 Mar 2026', expected: '10 Mar 2027', items: 14, amount: 100, status: 'Approved' },
  { id: '#POR020', vendor: 'NovaCure Pharma', ordered: '14 Apr 2026', expected: '14 Apr 2027', items: 16, amount: 35, status: 'Ordered' },
  { id: '#POR021', vendor: 'CareWell Agency', ordered: '30 May 2026', expected: '30 May 2027', items: 19, amount: 120, status: 'Ordered' },
  { id: '#POR022', vendor: 'Zenith Distributors', ordered: '02 Jun 2026', expected: '02 Jun 2027', items: 18, amount: 25, status: 'Closed' },
  { id: '#POR023', vendor: 'LifeLine Pharma', ordered: '07 Jul 2026', expected: '07 Jul 2027', items: 20, amount: 130, status: 'Approved' },
  { id: '#POR024', vendor: 'SafeMeds Distribution', ordered: '21 Aug 2026', expected: '21 Aug 2027', items: 24, amount: 180, status: 'Closed' },
  { id: '#POR025', vendor: 'NovaHealth Pharma', ordered: '17 Nov 2026', expected: '17 Nov 2027', items: 26, amount: 60, status: 'Draft' },
  { id: '#POR026', vendor: 'PrimeCare Pharma', ordered: '10 Dec 2026', expected: '10 Dec 2027', items: 29, amount: 80, status: 'Approved' },
];

const COLUMN_DEFS = [
  { key: 'vendor', label: 'Vendor' },
  { key: 'ordered', label: 'Ordered Date' },
  { key: 'expected', label: 'Expected Date' },
  { key: 'items', label: 'No of Items' },
  { key: 'amount', label: 'Total Amount' },
  { key: 'status', label: 'Status' },
];

const DATE_PRESETS = [
  { key: 'all', label: 'All Time' },
  { key: '7', label: 'Last 7 Days' },
  { key: '30', label: 'Last 30 Days' },
  { key: '90', label: 'Last 90 Days' },
];

const FILTER_SUPPLIERS = ['MedLife Distributors', 'HealthCare Pharma', 'GreenCross Medicals', 'NovaCure Pharma', 'CareWell Agency', 'Zenith Distributors', 'SafeMeds Distribution'];
const FILTER_STATUSES: PurchaseOrder['status'][] = ['Approved', 'Draft', 'Ordered', 'Closed'];

const modalInputCls = 'w-full h-11 px-3.5 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#141B2E] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400';
const modalLabelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

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

function FilterSidebarInner({ draftSuppliers, setDraftSuppliers, draftStatuses, setDraftStatuses, minAmount, setMinAmount, maxAmount, setMaxAmount, onCancel, onApply }: {
  draftSuppliers: string[]; setDraftSuppliers: (v: string[]) => void;
  draftStatuses: PurchaseOrder['status'][]; setDraftStatuses: (v: PurchaseOrder['status'][]) => void;
  minAmount: number; setMinAmount: (v: number) => void;
  maxAmount: number; setMaxAmount: (v: number) => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  const [collapseSup, setCollapseSup] = useState(true);
  const [collapseValue, setCollapseValue] = useState(true);
  const [collapseStatus, setCollapseStatus] = useState(true);
  const [moreSup, setMoreSup] = useState(false);
  const [supSearch, setSupSearch] = useState('');

  const toggleIn = (list: string[], v: string, set: (v: string[]) => void) => set(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const toggleStatus = (v: PurchaseOrder['status']) => {
    setDraftStatuses(draftStatuses.includes(v) ? draftStatuses.filter(x => x !== v) : [...draftStatuses, v]);
  };

  const visibleSuppliers = FILTER_SUPPLIERS.filter(i => i.toLowerCase().includes(supSearch.toLowerCase()));
  const shownSuppliers = moreSup ? visibleSuppliers : visibleSuppliers.slice(0, 5);

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

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
          {/* Supplier group */}
          <div className="rounded-2xl border border-gray-100 dark:border-[#273244]">
            <button onClick={() => setCollapseSup(!collapseSup)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#151E35] rounded-t-2xl transition-colors">
              Supplier
              {collapseSup ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
            </button>
            {collapseSup && (
              <div className="px-4 pb-4 pt-1">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={supSearch} onChange={e => setSupSearch(e.target.value)} placeholder="Search" className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10" />
                </div>
                {shownSuppliers.map(s => (
                  <FilterCheckRow key={s} checked={draftSuppliers.includes(s)} onToggle={() => toggleIn(draftSuppliers, s, setDraftSuppliers)} badge={
                    <span className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full ${VENDORS_BASE.indexOf(s) % 2 === 0 ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' : 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400'} border border-gray-200 dark:border-[#273244] flex items-center justify-center text-[10px] font-semibold flex-shrink-0`}>
                        {initials(s)}
                      </span>
                      {s}
                    </span>
                  } />
                ))}
                {visibleSuppliers.length > 5 && (
                  <button onClick={() => setMoreSup(!moreSup)} className="text-[#0F9291] text-xs font-medium hover:underline mt-1">
                    {moreSup ? 'View Less' : 'View More'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Stock Value group */}
          <div className="rounded-2xl border border-gray-100 dark:border-[#273244]">
            <button onClick={() => setCollapseValue(!collapseValue)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#151E35] rounded-t-2xl transition-colors">
              Stock Value
              {collapseValue ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
            </button>
            {collapseValue && (
              <div className="px-4 pb-4 pt-1">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Min Amount ($)</label>
                    <input type="number" min={0} value={minAmount} onChange={e => setMinAmount(Number(e.target.value))} className={`${modalInputCls} h-9`} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Max Amount ($)</label>
                    <input type="number" min={0} value={maxAmount} onChange={e => setMaxAmount(Number(e.target.value))} className={`${modalInputCls} h-9`} />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Price : <span className="font-semibold text-gray-800 dark:text-gray-200">${minAmount} - ${maxAmount}</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Stock Status group */}
          <div className="rounded-2xl border border-gray-100 dark:border-[#273244]">
            <button onClick={() => setCollapseStatus(!collapseStatus)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#151E35] rounded-t-2xl transition-colors">
              Stock Status
              {collapseStatus ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
            </button>
            {collapseStatus && (
              <div className="px-4 pb-4 pt-1">
                {FILTER_STATUSES.map(s => (
                  <FilterCheckRow key={s} checked={draftStatuses.includes(s)} onToggle={() => toggleStatus(s)} badge={
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGES[s].cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_BADGES[s].dot}`} /> {STATUS_BADGES[s].label}
                    </span>
                  } />
                ))}
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

/* ───────────── Create / Edit Order Modal (Add New → separate page in template; kept as modal for app parity) ───────────── */

function OrderFormModal({ mode, initial, onClose }: {
  mode: 'create' | 'edit';
  initial: PurchaseOrder | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    vendor: initial?.vendor || '',
    ordered: initial?.ordered || '',
    expected: initial?.expected || '',
    items: initial ? String(initial.items) : '',
    amount: initial ? String(initial.amount) : '',
    status: initial?.status || 'Draft',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!form.vendor) e.vendor = 'Please select a vendor';
    if (!form.ordered) e.ordered = 'Please select ordered date';
    if (!form.expected) e.expected = 'Please select expected date';
    if (!form.items || Number(form.items) <= 0) e.items = 'Enter number of items';
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter total amount';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onClose();
  };

  return (
    <GlobalModal
      open
      size="lg"
      hideFooter
      title={mode === 'create' ? 'Create Purchase Order' : 'Edit Purchase Order'}
      subtitle="Manage purchase orders with vendors"
      icon={<ShoppingBag className="w-5 h-5" />}
      iconTileClass="bg-gradient-to-br from-[#0F9291] to-teal-600"
      onClose={onClose}
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12">
          <label className={modalLabelCls}>Vendor <span className="text-red-500">*</span></label>
          <select value={form.vendor} onChange={e => set('vendor', e.target.value)} className={`${modalInputCls} appearance-none cursor-pointer`}>
            <option value="">Select</option>
            {VENDORS_BASE.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          {errors.vendor && <p className="text-xs text-red-500 mt-1">{errors.vendor}</p>}
        </div>
        <div className="col-span-12 sm:col-span-6">
          <label className={modalLabelCls}>Ordered Date <span className="text-red-500">*</span></label>
          <div className="relative">
            <input type="date" value={form.ordered} onChange={e => set('ordered', e.target.value)} className={`${modalInputCls} pr-3`} />
            <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.ordered && <p className="text-xs text-red-500 mt-1">{errors.ordered}</p>}
        </div>
        <div className="col-span-12 sm:col-span-6">
          <label className={modalLabelCls}>Expected Date <span className="text-red-500">*</span></label>
          <div className="relative">
            <input type="date" value={form.expected} onChange={e => set('expected', e.target.value)} className={`${modalInputCls} pr-3`} />
            <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.expected && <p className="text-xs text-red-500 mt-1">{errors.expected}</p>}
        </div>
        <div className="col-span-12 sm:col-span-6">
          <label className={modalLabelCls}>No of Items <span className="text-red-500">*</span></label>
          <input type="number" min="0" placeholder="0" value={form.items} onChange={e => set('items', e.target.value)} className={modalInputCls} />
          {errors.items && <p className="text-xs text-red-500 mt-1">{errors.items}</p>}
        </div>
        <div className="col-span-12 sm:col-span-6">
          <label className={modalLabelCls}>Total Amount ($) <span className="text-red-500">*</span></label>
          <input type="number" min="0" placeholder="0" value={form.amount} onChange={e => set('amount', e.target.value)} className={modalInputCls} />
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
        </div>
        <div className="col-span-12">
          <label className={modalLabelCls}>Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className={`${modalInputCls} appearance-none cursor-pointer`}>
            <option value="Draft">Draft</option>
            <option value="Ordered">Ordered</option>
            <option value="Approved">Approved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap pt-4 mt-5 border-t border-gray-100 dark:border-[#273244]">
        <button type="button" onClick={onClose} className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#232323] hover:bg-gray-200 dark:hover:bg-[#2A2A2A] transition-all">
          <X className="w-4 h-4" /> Cancel
        </button>
        <button type="button" onClick={handleSubmit}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0F9291] to-teal-600 shadow-sm shadow-[#0F9291]/30 hover:shadow-md hover:shadow-[#0F9291]/40 transition-all active:scale-95">
          <Plus className="w-4 h-4" /> {mode === 'edit' ? 'Save Changes' : 'Create New'}
        </button>
      </div>
    </GlobalModal>
  );
}

/* ───────────── Main Page ───────────── */

const thCls = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap';
const tdCls = 'px-4 py-3.5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap';

export default function PurchaseOrdersPage() {
  const [rows, setRows] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [dateOpen, setDateOpen] = useState(false);

  const [sortBy, setSortBy] = useState('date-desc');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMN_DEFS.map(c => c.key));
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftSuppliers, setDraftSuppliers] = useState<string[]>([]);
  const [draftStatuses, setDraftStatuses] = useState<PurchaseOrder['status'][]>([]);
  const [draftMin, setDraftMin] = useState(0);
  const [draftMax, setDraftMax] = useState(1000);
  const [filterSuppliers, setFilterSuppliers] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<PurchaseOrder['status'][]>([]);
  const [filterMin, setFilterMin] = useState(0);
  const [filterMax, setFilterMax] = useState(1000);

  const [moreOpen, setMoreOpen] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);
  const [showModal, setShowModal] = useState<'create' | 'edit' | null>(null);
  const [editingRow, setEditingRow] = useState<PurchaseOrder | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { selectedBranchId } = useBranch();

  // Real data — no dummy. Previously INITIAL_ROWS was static DreamPOS demo.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    PurchaseOrdersAPI.getAll().then((res) => {
      if (cancelled) return;
      const list = (res.data || []).map((po: any) => ({
        id: po.poNumber || `#PO${po.id}`,
        vendor: po.supplierName || `Supplier #${po.supplierId}`,
        ordered: po.orderDate ? new Date(po.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
        expected: po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
        items: po.items?.length ?? 0,
        amount: Number(po.totalAmount ?? 0),
        status: (po.status || 'Draft') as PurchaseOrder['status'],
      }));
      setRows(list);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedBranchId]);

  // Branch switch should reset page
  useEffect(() => {
    const h = () => setPage(1);
    window.addEventListener('ims:branch-changed', h);
    return () => window.removeEventListener('ims:branch-changed', h);
  }, []);

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
      if (q && !(r.id.toLowerCase().includes(q) || r.vendor.toLowerCase().includes(q) || String(r.amount).includes(q))) return false;
      if (datePreset !== 'all' && r.ordered.toLowerCase().includes('2024')) return false;
      if (filterSuppliers.length && !filterSuppliers.includes(r.vendor)) return false;
      if (filterStatuses.length && !filterStatuses.includes(r.status)) return false;
      if (r.amount < filterMin || r.amount > filterMax) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'vendor-asc': return a.vendor.localeCompare(b.vendor);
        case 'vendor-desc': return b.vendor.localeCompare(a.vendor);
        case 'date-asc': return a.ordered.localeCompare(b.ordered);
        case 'date-desc': return b.ordered.localeCompare(a.ordered);
        case 'amount-asc': return a.amount - b.amount;
        case 'amount-desc': return b.amount - a.amount;
        default: return b.ordered.localeCompare(a.ordered);
      }
    });
    return list;
  }, [rows, searchQuery, datePreset, sortBy, filterSuppliers, filterStatuses, filterMin, filterMax]);

  const activeFilterCount = filterSuppliers.length + filterStatuses.length + (filterMin > 0 || filterMax < 1000 ? 1 : 0);

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
    setFilterSuppliers([]);
    setFilterStatuses([]);
    setFilterMin(0);
    setFilterMax(1000);
    setDraftMin(0);
    setDraftMax(1000);
    setPage(1);
  };

  const handleDelete = () => {
    if (deleteTarget) setRows(rs => rs.filter(r => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const exportCSV = () => {
    const header = 'ID,Vendor,Ordered Date,Expected Date,No of Items,Total Amount,Status';
    const lines = filtered.map(r => [r.id, r.vendor, r.ordered, r.expected, `${r.items} Items`, `$${r.amount}`, r.status].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = '\uFEFF' + [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'purchase-orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const vendorColor = (name: string) => {
    const colors = ['bg-cyan-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-sky-500', 'bg-fuchsia-500'];
    return colors[VENDORS_BASE.indexOf(name) % colors.length];
  };

  const renderDropdown = (close: () => void, children: React.ReactNode) => (
    <>
      <div className="fixed inset-0 z-[1040]" onClick={close} />
      <div className="absolute top-full right-0 mt-1.5 w-52 bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-[#2A2A2A] rounded-xl shadow-xl py-1.5 z-[1050] animate-dialog-field">
        {children}
      </div>
    </>
  );

  const statCards = [
    { label: 'Total Purchase Order', value: '45', change: '4.2%', up: true, icon: <ShoppingBag className="w-6 h-6" />, iconCls: 'bg-gradient-to-br from-purple-500 to-violet-600' },
    { label: 'Partially Orders', value: '12', change: '12.7%', up: false, icon: <ShoppingBag className="w-6 h-6" />, iconCls: 'bg-gradient-to-br from-rose-500 to-red-600' },
    { label: 'Partially Recieved', value: '35', change: '14.20%', up: true, icon: <Truck className="w-6 h-6" />, iconCls: 'bg-gradient-to-br from-purple-500 to-violet-600' },
    { label: 'Completed Orders', value: '1652', change: '22.6%', up: false, icon: <CheckCircle2 className="w-6 h-6" />, iconCls: 'bg-gradient-to-br from-rose-500 to-red-600' },
  ];

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
            <span className="text-gray-800 dark:text-gray-100 font-medium">Purchase Order</span>
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
            <button onClick={() => { setEditingRow(null); setShowModal('create'); }}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0F9291] to-teal-600 shadow-sm shadow-[#0F9291]/30 hover:shadow-md hover:shadow-[#0F9291]/40 transition-all active:scale-95">
              <Plus className="w-4 h-4" /> Add New
            </button>
          </div>
        </div>

        {/* ─── Page Title ─── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Purchase Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and manage orders placed with vendors</p>
        </div>

        {/* ─── Stat Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white dark:bg-[#0F1525] rounded-2xl border border-gray-100 dark:border-[#273244] shadow-sm p-5 flex items-center gap-4">
              <span className={`w-14 h-14 rounded-full ${s.iconCls} text-white shadow-lg flex items-center justify-center flex-shrink-0`}>
                {s.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{s.label}</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</h2>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.up ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                    {s.change} {s.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  </span>
                </div>
              </div>
            </div>
          ))}
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
                      { key: 'vendor-asc', label: 'Vendor Name', badge: 'A-Z' },
                      { key: 'vendor-desc', label: 'Vendor Name', badge: 'Z-A' },
                      { key: 'date-asc', label: 'Date - Ascending', badge: '1-9' },
                      { key: 'date-desc', label: 'Date - Descending', badge: '9-1' },
                      { key: 'amount-asc', label: 'Total Amount', badge: 'Low-High' },
                      { key: 'amount-desc', label: 'Total Amount', badge: 'High-Low' },
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
                  {visibleColumns.includes('vendor') && <th className={thCls}>Vendor</th>}
                  {visibleColumns.includes('ordered') && <th className={thCls}>Ordered Date</th>}
                  {visibleColumns.includes('expected') && <th className={thCls}>Expected Date</th>}
                  {visibleColumns.includes('items') && <th className={`${thCls} text-right`}>No of Items</th>}
                  {visibleColumns.includes('amount') && <th className={`${thCls} text-right`}>Total Amount</th>}
                  {visibleColumns.includes('status') && <th className={thCls}>Status</th>}
                  <th className={`${thCls} text-right`}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#1D2738]">
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                      No purchase orders found
                    </td>
                  </tr>
                ) : (
                  pageRows.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-[#151E35] transition-colors">
                      <td className={`${tdCls} text-[#0F9291] font-semibold`}>{r.id}</td>
                      {visibleColumns.includes('vendor') && (
                        <td className={tdCls}>
                          <div className="flex items-center gap-2.5 font-medium text-gray-800 dark:text-gray-100">
                            <span className={`w-8 h-8 rounded-full ${vendorColor(r.vendor)} text-white text-xs font-semibold flex items-center justify-center flex-shrink-0`}>
                              {initials(r.vendor)}
                            </span>
                            {r.vendor}
                          </div>
                        </td>
                      )}
                      {visibleColumns.includes('ordered') && <td className={tdCls}>{r.ordered}</td>}
                      {visibleColumns.includes('expected') && <td className={tdCls}>{r.expected}</td>}
                      {visibleColumns.includes('items') && <td className={`${tdCls} text-right font-medium`}>{r.items} Items</td>}
                      {visibleColumns.includes('amount') && <td className={`${tdCls} text-right font-semibold text-gray-900 dark:text-gray-100`}>${r.amount}</td>}
                      {visibleColumns.includes('status') && (
                        <td className={tdCls}>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGES[r.status].cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_BADGES[r.status].dot}`} /> {STATUS_BADGES[r.status].label}
                          </span>
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
                              <button onClick={() => { setMoreOpen(null); setEditingRow(r); setShowModal('edit'); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#232323] hover:text-[#0F9291] transition-colors">
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

      {showModal && (
        <OrderFormModal
          key={showModal}
          mode={showModal}
          initial={showModal === 'edit' ? editingRow : null}
          onClose={() => { setShowModal(null); setEditingRow(null); }}
        />
      )}

      {deleteTarget && (
        <GlobalConfirmModal
          onClose={() => setDeleteTarget(null)}
          title="Delete Confirmation"
          message={<>Are you sure you want to delete the purchase order for <strong>&ldquo;{deleteTarget.vendor}&rdquo;</strong>?</>}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
        />
      )}

      {filterOpen && (
        <FilterSidebarInner
          draftSuppliers={draftSuppliers} setDraftSuppliers={setDraftSuppliers}
          draftStatuses={draftStatuses} setDraftStatuses={setDraftStatuses}
          minAmount={draftMin} setMinAmount={setDraftMin}
          maxAmount={draftMax} setMaxAmount={setDraftMax}
          onCancel={() => setFilterOpen(false)}
          onApply={() => { setFilterSuppliers(draftSuppliers); setFilterStatuses(draftStatuses); setFilterMin(draftMin); setFilterMax(draftMax); setFilterOpen(false); }}
        />
      )}
    </div>
  );
}