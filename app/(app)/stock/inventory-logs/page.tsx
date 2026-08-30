'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, RotateCw, Maximize, ChevronDown, ChevronRight, ChevronUp, X,
  EllipsisVertical, Filter, Columns, CalendarDays, Check,
  FileSpreadsheet, Printer, ArrowUpToLine, ArrowUpDown, House, Pill, Users, Layers,
} from '@/components/ui/LucideIcon';
import { ApiClient, TransactionsAPI } from '@/lib/api';
import { useBranch } from '@/lib/branch-context';
import GlobalModal from '@/components/ui/GlobalModal';

/* ───────────── Types ───────────── */

interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  batchNo: string | null;
  movementType: string;
  quantityIn: number | null;
  quantityOut: number | null;
  balanceStock: number;
  referenceId: number | null;
  referenceType: string | null;
  changedBy: string | null;
  createdAt: string;
}

const TYPE_BADGES: Record<string, { cls: string; label: string }> = {
  PURCHASE: { cls: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400', label: 'Purchase' },
  SALE: { cls: 'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400', label: 'Sales' },
  RETURN_TO_SUPPLIER: { cls: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400', label: 'Return' },
  ADJUSTMENT: { cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400', label: 'Adjustment' },
  TRANSFER: { cls: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400', label: 'Transfer' },
};

const COLUMN_DEFS = [
  { key: 'productSku', label: 'SKU' },
  { key: 'productName', label: 'Item' },
  { key: 'batchNo', label: 'Batch No' },
  { key: 'movementType', label: 'Transaction Type' },
  { key: 'quantityIn', label: 'Quantity In' },
  { key: 'quantityOut', label: 'Quantity Out' },
  { key: 'balanceStock', label: 'Balance Stock' },
  { key: 'referenceId', label: 'Reference ID' },
  { key: 'changedBy', label: 'Changed By' },
  { key: 'datetime', label: 'Date & Time' },
];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const h = d.getHours();
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(hh).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`;
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

function FilterGroup({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#273244]">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#151E35] rounded-t-2xl transition-colors">
        {title}
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

function FilterSidebar({ items, categories, types, draftItems, setDraftItems, draftTypes, setDraftTypes, onCancel, onApply }: {
  items: string[]; categories: string[]; types: string[];
  draftItems: string[]; setDraftItems: (v: string[]) => void;
  draftTypes: string[]; setDraftTypes: (v: string[]) => void;
  onCancel: () => void; onApply: () => void;
}) {
  const [collapseMed, setCollapseMed] = useState(true);
  const [collapseType, setCollapseType] = useState(true);
  const [moreMed, setMoreMed] = useState(false);
  const [medSearch, setMedSearch] = useState('');

  const toggleIn = <T,>(list: T[], v: T, set: (v: T[]) => void) => set(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const visibleItems = items.filter(i => i.toLowerCase().includes(medSearch.toLowerCase()));
  const shownItems = moreMed ? visibleItems : visibleItems.slice(0, 5);

  return (
    <div className="fixed inset-0 z-[1100]">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[360px] bg-white dark:bg-[#0F1525] shadow-2xl flex flex-col animate-slide-in-right border-l border-gray-100 dark:border-[#273244]">
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
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <FilterGroup title="Medicine" open={collapseMed} onToggle={() => setCollapseMed(!collapseMed)}>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={medSearch} onChange={e => setMedSearch(e.target.value)} placeholder="Search" className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10" />
            </div>
            {shownItems.map(i => (
              <FilterCheckRow key={i} checked={draftItems.includes(i)} onToggle={() => toggleIn(draftItems, i, setDraftItems)} badge={
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0"><Pill className="w-3.5 h-3.5" /></span>
                  {i}
                </span>
              } />
            ))}
            {visibleItems.length > 5 && (
              <button onClick={() => setMoreMed(!moreMed)} className="text-[#0F9291] text-xs font-medium hover:underline mt-1">
                {moreMed ? 'View Less' : 'View More'}
              </button>
            )}
          </FilterGroup>

          <FilterGroup title="Transaction Type" open={collapseType} onToggle={() => setCollapseType(!collapseType)}>
            {types.map(t => (
              <FilterCheckRow key={t} checked={draftTypes.includes(t)} onToggle={() => toggleIn(draftTypes, t, setDraftTypes)} badge={
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_BADGES[t]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                  {TYPE_BADGES[t]?.label ?? t}
                </span>
              } />
            ))}
          </FilterGroup>
        </div>
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

export default function InventoryLogsPage() {
  const { selectedBranchId, isSuperAdmin } = useBranch();
  const [rows, setRows] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRef, setSelectedRef] = useState<StockMovement | null>(null);
  const [refDetail, setRefDetail] = useState<unknown>(null);
  const [refLoading, setRefLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMN_DEFS.map(c => c.key));
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftItems, setDraftItems] = useState<string[]>([]);
  const [draftTypes, setDraftTypes] = useState<string[]>([]);
  const [filterItems, setFilterItems] = useState<string[]>([]);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // fetch data — branch-aware via X-Branch-Id header (ApiClient) + reset on branch switch
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    ApiClient.get<any>(`/stock-movements/all?page=${page}&size=${pageSize}${debouncedSearch ? `&searchText=${encodeURIComponent(debouncedSearch)}` : ''}`)
      .then((res) => {
        if (cancelled) return;
        const data = res.stockMovements ?? [];
        setRows(data);
        setTotalPages(res.totalPages ?? 1);
        setTotalElements(res.totalElements ?? 0);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError('Failed to load inventory logs');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, pageSize, debouncedSearch, selectedBranchId]);

  // Branch switch should reset to first page and refetch (branch header changes)
  useEffect(() => {
    const handler = () => setPage(0);
    window.addEventListener('ims:branch-changed', handler);
    return () => window.removeEventListener('ims:branch-changed', handler);
  }, []);

  const handleRefClick = async (r: StockMovement) => {
    if (!r.referenceId) return;
    setSelectedRef(r);
    setRefDetail(null);
    setRefLoading(true);
    try {
      // Transaction is the billing source for PURCHASE/SALE/RETURN
      const t = await TransactionsAPI.getById(String(r.referenceId));
      setRefDetail(t);
    } catch {
      setRefDetail(null);
    } finally { setRefLoading(false); }
  };

  // unique items/types for filter sidebar
  const uniqueItems = useMemo(() => [...new Set(rows.map(r => r.productName))].sort(), [rows]);
  const uniqueTypes = useMemo(() => [...new Set(rows.map(r => r.movementType))].sort(), [rows]);

  // client-side filter for type/item (applied after fetch for the current page)
  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filterItems.length && !filterItems.includes(r.productName)) return false;
      if (filterTypes.length && !filterTypes.includes(r.movementType)) return false;
      return true;
    });
  }, [rows, filterItems, filterTypes]);

  const activeFilterCount = filterItems.length + filterTypes.length;

  // KPI — how stock came vs sold (billing levels)
  const kpi = useMemo(() => {
    const inQty = filtered.reduce((s, r) => s + (r.quantityIn ?? 0), 0);
    const outQty = filtered.reduce((s, r) => s + (r.quantityOut ?? 0), 0);
    const purchaseQty = filtered.filter(r => r.movementType === 'PURCHASE').reduce((s, r) => s + (r.quantityIn ?? 0), 0);
    const saleQty = filtered.filter(r => r.movementType === 'SALE').reduce((s, r) => s + (r.quantityOut ?? 0), 0);
    return { inQty, outQty, purchaseQty, saleQty, net: inQty - outQty, count: filtered.length };
  }, [filtered]);

  const from = totalElements === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalElements);

  const pageItems = () => {
    const pages: (number | 'dots')[] = [];
    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
    const end = Math.min(totalPages - 1, start + 4);
    if (start > 0) pages.push(0);
    if (start > 1) pages.push('dots');
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < totalPages - 2) pages.push('dots');
    if (end < totalPages - 1) pages.push(totalPages - 1);
    return pages;
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns(v => v.includes(key) ? v.filter(k => k !== key) : [...v, key]);
  };

  const resetAll = () => {
    setSearchQuery('');
    setFilterItems([]);
    setFilterTypes([]);
    setPage(0);
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen?.(); setIsFullscreen(true); }
    else { document.exitFullscreen?.(); setIsFullscreen(false); }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setColumnsOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const exportCSV = () => {
    const header = 'SKU,Item,Batch No,Transaction Type,Quantity In,Quantity Out,Balance Stock,Reference ID,Changed By,Date & Time';
    const lines = filtered.map(r => [r.productSku, r.productName, r.batchNo ?? '', r.movementType, r.quantityIn ?? 0, r.quantityOut ?? 0, r.balanceStock, r.referenceId ? `#${r.referenceType}${r.referenceId}` : '', r.changedBy ?? '', formatDateTime(r.createdAt)].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = '\uFEFF' + [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'inventory-logs.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const renderDropdown = (close: () => void, children: React.ReactNode) => (
    <>
      <div className="fixed inset-0 z-[1040]" onClick={close} />
      <div className="absolute top-full right-0 mt-1.5 w-52 bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-[#2A2A2A] rounded-xl shadow-xl py-1.5 z-[1050] animate-dialog-field">
        {children}
      </div>
    </>
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto space-y-5">
        {/* Breadcrumb + Actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 hover:text-[#0F9291] transition-colors">
              <House className="w-4 h-4" /> Dashboard
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            <span className="text-gray-800 dark:text-gray-100 font-medium">Inventory Logs</span>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => { resetAll(); setPage(0); }} title="Refresh"
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#141B2E] text-gray-500 dark:text-gray-400 hover:text-[#0F9291] hover:border-[#0F9291]/40 transition-all">
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={toggleFullscreen} title="Maximize"
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#141B2E] text-gray-500 dark:text-gray-400 hover:text-[#0F9291] hover:border-[#0F9291]/40 transition-all">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Logs</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Real stock ledger — how stock came (Purchase/Adjustment) vs sold (Sale/Return) with billing link
              {isSuperAdmin && selectedBranchId && <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-[#0F9291] bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">Branch: {selectedBranchId}</span>}
              {isSuperAdmin && !selectedBranchId && <span className="ml-2 text-xs text-amber-600">All Branches</span>}
            </p>
          </div>
        </div>

        {/* KPI — Billing level how stock came vs sold */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white dark:bg-[#0F1525] rounded-2xl border border-gray-100 dark:border-[#273244] p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock In</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">+{kpi.inQty.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Purchase {kpi.purchaseQty} units</p>
          </div>
          <div className="bg-white dark:bg-[#0F1525] rounded-2xl border border-gray-100 dark:border-[#273244] p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock Out</p>
            <p className="text-xl font-bold text-red-500 mt-1">-{kpi.outQty.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Sale {kpi.saleQty} units</p>
          </div>
          <div className="bg-white dark:bg-[#0F1525] rounded-2xl border border-gray-100 dark:border-[#273244] p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Net (page)</p>
            <p className={`text-xl font-bold mt-1 ${kpi.net >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600'}`}>{kpi.net >= 0 ? '+' : ''}{kpi.net.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">{kpi.count} movements</p>
          </div>
          <div className="bg-white dark:bg-[#0F1525] rounded-2xl border border-gray-100 dark:border-[#273244] p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Balance Snapshot</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{filtered[0]?.balanceStock ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Latest balanceStock</p>
          </div>
          <div className="bg-white dark:bg-[#0F1525] rounded-2xl border border-gray-100 dark:border-[#273244] p-4 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Billing</p>
            <p className="text-sm font-semibold text-[#0F9291] mt-1">Click Ref ID → Transaction</p>
            <p className="text-xs text-gray-500">Purchase/Sale billing linked</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#0F1525] rounded-2xl border border-gray-100 dark:border-[#273244] shadow-sm">
          <div className="px-4 sm:px-5 py-4 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center flex-wrap sm:flex-nowrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-52 sm:w-64 h-10 pl-9 pr-3 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all" />
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <button onClick={() => setFilterOpen(true)} title="Filter"
                className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#141B2E] text-gray-500 dark:text-gray-400 hover:text-[#0F9291] hover:border-[#0F9291]/40 transition-all">
                <Filter className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#0F9291] text-white text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>
                )}
              </button>

              <div className="relative">
                <button onClick={() => setColumnsOpen(o => !o)}
                  className="h-10 px-3.5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl hover:border-gray-300 transition-all">
                  <Columns className="w-4 h-4" /> Columns
                </button>
                {columnsOpen && renderDropdown(() => setColumnsOpen(false), (
                  <div className="max-h-72 overflow-y-auto">
                    {COLUMN_DEFS.map(c => (
                      <label key={c.key} className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#232323] cursor-pointer transition-colors">
                        <input type="checkbox" checked={visibleColumns.includes(c.key)} onChange={() => toggleColumn(c.key)}
                          className="w-4 h-4 rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291]" />
                        {c.label}
                      </label>
                    ))}
                  </div>
                ))}
              </div>

              <button onClick={exportCSV}
                className="h-10 px-3.5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl hover:border-gray-300 transition-all">
                <ArrowUpToLine className="w-4 h-4" /> Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#151E35] border-y border-gray-100 dark:border-[#273244]">
                <tr>
                  {COLUMN_DEFS.filter(c => visibleColumns.includes(c.key)).map(c => (
                    <th key={c.key} className={thCls}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#1D2738]">
                {loading ? (
                  <tr>
                    <td colSpan={COLUMN_DEFS.length} className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <RotateCw className="w-4 h-4 animate-spin" /> Loading inventory logs...
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={COLUMN_DEFS.length} className="px-4 py-12 text-center text-sm text-red-500">{error}</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMN_DEFS.length} className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                      No inventory logs found
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-[#151E35] transition-colors">
                      {visibleColumns.includes('productSku') && <td className={`${tdCls} text-[#0F9291] font-semibold`}>{r.productSku}</td>}
                      {visibleColumns.includes('productName') && <td className={`${tdCls} font-medium text-gray-800 dark:text-gray-100`}>{r.productName}</td>}
                      {visibleColumns.includes('batchNo') && <td className={`${tdCls} text-[#0F9291] font-medium`}>{r.batchNo ?? '—'}</td>}
                      {visibleColumns.includes('movementType') && (
                        <td className={tdCls}>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_BADGES[r.movementType]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                            {TYPE_BADGES[r.movementType]?.label ?? r.movementType}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('quantityIn') && <td className={`${tdCls} ${(r.quantityIn ?? 0) > 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>{r.quantityIn ?? 0}</td>}
                      {visibleColumns.includes('quantityOut') && <td className={`${tdCls} ${(r.quantityOut ?? 0) > 0 ? 'text-red-500 dark:text-red-400 font-medium' : ''}`}>{r.quantityOut ?? 0}</td>}
                      {visibleColumns.includes('balanceStock') && <td className={`${tdCls} font-medium`}>{r.balanceStock}</td>}
                      {visibleColumns.includes('referenceId') && <td className={`${tdCls} font-medium`}>{r.referenceId ? <button onClick={() => handleRefClick(r)} className="text-[#0F9291] hover:underline hover:text-teal-700 font-semibold">#{r.referenceType}{r.referenceId} ↗</button> : '—'}</td>}
                      {visibleColumns.includes('changedBy') && <td className={tdCls}>{r.changedBy ?? '—'}</td>}
                      {visibleColumns.includes('datetime') && <td className={tdCls}>{formatDateTime(r.createdAt)}</td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-4 border-t border-gray-100 dark:border-[#273244]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Showing {from} to {to} of {totalElements} entries</p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page <= 0}
                className="w-8 h-8 text-xs font-semibold rounded-lg border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#1F1F1F] text-gray-600 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">&lt;</button>
              {pageItems().map((p, i) => p === 'dots'
                ? <span key={i} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">...</span>
                : <button key={i} onClick={() => setPage(p)} disabled={p === page}
                    className={`w-8 h-8 text-xs font-semibold rounded-lg border transition-all ${p === page ? 'bg-[#0F9291] text-white border-[#0F9291]' : 'border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#1F1F1F] text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}>{p + 1}</button>
              )}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="w-8 h-8 text-xs font-semibold rounded-lg border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#1F1F1F] text-gray-600 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">&gt;</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">Entries per page</label>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
                className="h-8 px-2 text-xs border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1F1F1F] rounded-lg focus:outline-none focus:border-[#0F9291]">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {filterOpen && (
        <FilterSidebar
          items={uniqueItems} categories={[]} types={uniqueTypes}
          draftItems={draftItems} setDraftItems={setDraftItems}
          draftTypes={draftTypes} setDraftTypes={setDraftTypes}
          onCancel={() => setFilterOpen(false)}
          onApply={() => { setFilterItems(draftItems); setFilterTypes(draftTypes); setFilterOpen(false); }}
        />
      )}

      {/* Billing detail — how stock came / sold */}
      {selectedRef && (
        <GlobalModal
          open
          onClose={() => setSelectedRef(null)}
          title={`Billing — ${selectedRef.movementType}`}
          subtitle={`${selectedRef.productName} (${selectedRef.productSku}) · ${selectedRef.movementType === 'PURCHASE' ? 'Stock In' : selectedRef.movementType === 'SALE' ? 'Stock Sold' : selectedRef.movementType} ${selectedRef.quantityIn ?? selectedRef.quantityOut ?? 0} units`}
          size="md"
          hideFooter
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-3">
                <p className="text-xs text-gray-400">Product</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedRef.productName}</p>
                <p className="text-xs text-[#0F9291]">{selectedRef.productSku} · Batch {selectedRef.batchNo ?? '—'}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-3">
                <p className="text-xs text-gray-400">Movement</p>
                <p className="font-semibold">{selectedRef.movementType} <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${selectedRef.quantityIn ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{selectedRef.quantityIn ? `+${selectedRef.quantityIn}` : `-${selectedRef.quantityOut}`}</span></p>
                <p className="text-xs text-gray-500">Balance after: {selectedRef.balanceStock}</p>
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 dark:border-[#273244] p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase">Reference (Billing)</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{selectedRef.referenceType} #{selectedRef.referenceId ?? '—'} {selectedRef.changedBy ? `· by ${selectedRef.changedBy}` : ''}</p>
              <p className="text-xs text-gray-500">{formatDateTime(selectedRef.createdAt)}</p>
              {refLoading ? <p className="text-xs text-gray-400 mt-2">Loading billing...</p> : refDetail ? <pre className="text-xs bg-gray-50 dark:bg-[#0F1525] p-2 rounded-lg overflow-x-auto mt-2">{JSON.stringify(refDetail, null, 2).slice(0, 800)}</pre> : <p className="text-xs text-gray-400 mt-2">No additional billing data.</p>}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setSelectedRef(null)} className="h-9 px-4 rounded-xl bg-gray-100 dark:bg-[#232323] text-sm font-semibold">Close</button>
            </div>
          </div>
        </GlobalModal>
      )}
    </div>
  );
}
