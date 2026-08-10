'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, RotateCw, Maximize, ChevronDown, ChevronRight, ChevronUp, X,
  EllipsisVertical, Filter, Columns, CalendarDays, Check,
  FileSpreadsheet, Printer, ArrowUpToLine, ArrowUpDown, House, Pill, Users, Layers,
} from '@/components/ui/LucideIcon';

/* ───────────── Types & Demo Data (DreamPOS Inventory Logs) ───────────── */

interface LogRow {
  sku: string;
  item: string;
  batch: string;
  type: 'Purchase' | 'Sales' | 'Return' | 'Adjustment' | 'Transfer';
  qtyIn: string;
  qtyOut: string;
  balance: number;
  refId: string;
  dateISO: string;
  time24: string;
  ts: number;
  category: string;
  supplier: string;
}

const CATEGORIES = ['Uncategorized', 'Tablet', 'Capsule', 'Oinment', 'Syrup', 'Drops', 'Medical Devices', 'Supplements'];

const SUPPLIERS = ['MedLife Distributors', 'HealthCare Pharma', 'GreenCross Medicals', 'NovaCure Pharma', 'CareWell Agency', 'Zenith Distributors', 'LifeLine Pharma', 'SafeMeds Distribution'];

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

const L = (sku: string, item: string, batch: string, type: LogRow['type'], qtyIn: string, qtyOut: string, balance: number, refId: string, d: string, time: string, category: string, supplier: string): LogRow => {
  const [h, m] = time.split(':').map(Number);
  return {
    sku, item, batch, type, qtyIn, qtyOut, balance, refId,
    dateISO: d, time24: time, ts: new Date(`${d}T${time}`).getTime(),
    category, supplier,
  };
};

const INITIAL_ROWS: LogRow[] = [
  L('#TAB016', 'Paracetamol 500', '#BTH016', 'Purchase', '10', '0', 30, '#PUR016', '2026-04-24', '10:00', 'Tablet', 'MedLife Distributors'),
  L('#TAB016', 'Amoxicillin 250', '#BTH015', 'Sales', '0', '10', 190, '#SAL015', '2026-04-20', '16:15', 'Capsule', 'HealthCare Pharma'),
  L('#SYR016', 'Cetirizine', '#BTH014', 'Return', '05', '0', 45, '#RTN014', '2026-04-10', '11:30', 'Syrup', 'GreenCross Medicals'),
  L('#TAB016', 'Ceftriaxone 20', '#BTH013', 'Adjustment', '0', '10', 110, '#ADJ013', '2026-03-21', '09:10', 'Uncategorized', 'NovaCure Pharma'),
  L('#CRE016', 'Betnovate', '#BTH012', 'Transfer', '10', '0', 70, '#TRA012', '2026-03-18', '15:00', 'Oinment', 'CareWell Agency'),
  L('#TAB016', 'Amoxicillin 30', '#BTH011', 'Purchase', '20', '0', 330, '#PUR011', '2026-03-06', '09:30', 'Capsule', 'Zenith Distributors'),
  L('#INJ016', 'Tetanus Toxoid', '#BTH010', 'Adjustment', '0', '20', 220, '#ADJ010', '2026-02-26', '17:40', 'Uncategorized', 'LifeLine Pharma'),
  L('#SYR016', 'Atorvastatin', '#BTH009', 'Sales', '0', '10', 25, '#SAL009', '2026-02-17', '09:00', 'Tablet', 'SafeMeds Distribution'),
  L('#TAB016', 'Metformin 100', '#BTH008', 'Transfer', '0', '10', 140, '#TRA008', '2026-01-20', '13:15', 'Tablet', 'MedLife Distributors'),
  L('#INJ016', 'Ondansetron', '#BTH007', 'Sales', '0', '20', 100, '#SAL007', '2026-01-12', '16:30', 'Tablet', 'HealthCare Pharma'),
];

const TYPE_BADGES: Record<LogRow['type'], { cls: string; label: string }> = {
  Purchase: { cls: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400', label: 'Purchase' },
  Sales: { cls: 'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400', label: 'Sales' },
  Return: { cls: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400', label: 'Return' },
  Adjustment: { cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400', label: 'Adjustment' },
  Transfer: { cls: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400', label: 'Transfer' },
};

const COLUMN_DEFS = [
  { key: 'sku', label: 'SKU' },
  { key: 'item', label: 'Item' },
  { key: 'batch', label: 'Batch No' },
  { key: 'type', label: 'Transaction Type' },
  { key: 'qtyIn', label: 'Quantity In' },
  { key: 'qtyOut', label: 'Quantity Out' },
  { key: 'balance', label: 'Balance Stock' },
  { key: 'refId', label: 'Reference ID' },
  { key: 'datetime', label: 'Date & Time' },
];

const DATE_PRESETS = [
  { key: 'all', label: 'All Time' },
  { key: '7', label: 'Last 7 Days' },
  { key: '30', label: 'Last 30 Days' },
  { key: '90', label: 'Last 90 Days' },
];

const FILTER_MEDICINES = ['Paracetamol 500', 'Amoxicillin 250', 'Cetirizine', 'Ceftriaxone 20', 'Betnovate', 'Amoxicillin 30', 'Tetanus Toxoid', 'Atorvastatin'];
const FILTER_CATEGORIES = ['Uncategorized', 'Tablet', 'Capsule', 'Oinment', 'Syrup', 'Drops', 'Medical Devices', 'Supplements'];
const FILTER_SUPPLIERS = ['MedLife Distributors', 'HealthCare Pharma', 'GreenCross Medicals', 'NovaCure Pharma', 'CareWell Agency', 'Zenith Distributors', 'LifeLine Pharma', 'SafeMeds Distribution'];
const FILTER_TYPES: LogRow['type'][] = ['Purchase', 'Sales', 'Return', 'Adjustment', 'Transfer'];

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

function FilterSidebar({ draftMedicines, setDraftMedicines, draftCategories, setDraftCategories, draftSuppliers, setDraftSuppliers, draftTypes, setDraftTypes, onCancel, onApply }: {
  draftMedicines: string[]; setDraftMedicines: (v: string[]) => void;
  draftCategories: string[]; setDraftCategories: (v: string[]) => void;
  draftSuppliers: string[]; setDraftSuppliers: (v: string[]) => void;
  draftTypes: LogRow['type'][]; setDraftTypes: (v: LogRow['type'][]) => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  const [collapseMed, setCollapseMed] = useState(true);
  const [collapseCat, setCollapseCat] = useState(true);
  const [collapseSup, setCollapseSup] = useState(true);
  const [collapseType, setCollapseType] = useState(true);
  const [moreMed, setMoreMed] = useState(false);
  const [moreCat, setMoreCat] = useState(false);
  const [moreSup, setMoreSup] = useState(false);
  const [medSearch, setMedSearch] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [supSearch, setSupSearch] = useState('');

  const toggleIn = <T,>(list: T[], v: T, set: (v: T[]) => void) => set(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const visibleMedicines = FILTER_MEDICINES.filter(i => i.toLowerCase().includes(medSearch.toLowerCase()));
  const shownMedicines = moreMed ? visibleMedicines : visibleMedicines.slice(0, 5);
  const visibleCategories = FILTER_CATEGORIES.filter(i => i.toLowerCase().includes(catSearch.toLowerCase()));
  const shownCategories = moreCat ? visibleCategories : visibleCategories.slice(0, 5);
  const visibleSuppliers = FILTER_SUPPLIERS.filter(i => i.toLowerCase().includes(supSearch.toLowerCase()));
  const shownSuppliers = moreSup ? visibleSuppliers : visibleSuppliers.slice(0, 5);

  const searchBox = (value: string, set: (v: string) => void) => (
    <div className="relative mb-3">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input value={value} onChange={e => set(e.target.value)} placeholder="Search" className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10" />
    </div>
  );

  const viewMore = (more: boolean, set: (v: boolean) => void) => (
    <button onClick={() => set(!more)} className="text-[#0F9291] text-xs font-medium hover:underline mt-1">
      {more ? 'View Less' : 'View More'}
    </button>
  );

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
          <FilterGroup title="Medicine" open={collapseMed} onToggle={() => setCollapseMed(!collapseMed)}>
            {searchBox(medSearch, setMedSearch)}
            {shownMedicines.map(i => (
              <FilterCheckRow key={i} checked={draftMedicines.includes(i)} onToggle={() => toggleIn(draftMedicines, i, setDraftMedicines)} badge={
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0"><Pill className="w-3.5 h-3.5" /></span>
                  {i}
                </span>
              } />
            ))}
            {visibleMedicines.length > 5 && viewMore(moreMed, setMoreMed)}
          </FilterGroup>

          {/* Category group */}
          <FilterGroup title="Category" open={collapseCat} onToggle={() => setCollapseCat(!collapseCat)}>
            {searchBox(catSearch, setCatSearch)}
            {shownCategories.map(i => (
              <FilterCheckRow key={i} checked={draftCategories.includes(i)} onToggle={() => toggleIn(draftCategories, i, setDraftCategories)} badge={
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0"><Layers className="w-3.5 h-3.5" /></span>
                  {i}
                </span>
              } />
            ))}
            {visibleCategories.length > 5 && viewMore(moreCat, setMoreCat)}
          </FilterGroup>

          {/* Supplier group */}
          <FilterGroup title="Supplier" open={collapseSup} onToggle={() => setCollapseSup(!collapseSup)}>
            {searchBox(supSearch, setSupSearch)}
            {shownSuppliers.map(i => (
              <FilterCheckRow key={i} checked={draftSuppliers.includes(i)} onToggle={() => toggleIn(draftSuppliers, i, setDraftSuppliers)} badge={
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-[#232323] border border-gray-200 dark:border-[#273244] flex items-center justify-center flex-shrink-0"><Users className="w-3 h-3 text-gray-500 dark:text-gray-400" /></span>
                  {i}
                </span>
              } />
            ))}
            {visibleSuppliers.length > 5 && viewMore(moreSup, setMoreSup)}
          </FilterGroup>

          {/* Transaction Type group */}
          <FilterGroup title="Transaction Type" open={collapseType} onToggle={() => setCollapseType(!collapseType)}>
            {FILTER_TYPES.map(t => (
              <FilterCheckRow key={t} checked={draftTypes.includes(t)} onToggle={() => toggleIn(draftTypes, t, setDraftTypes)} badge={
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${t === 'Sales' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : TYPE_BADGES[t].cls}`}>
                  {TYPE_BADGES[t].label}
                </span>
              } />
            ))}
          </FilterGroup>
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

export default function InventoryLogsPage() {
  const [rows, setRows] = useState<LogRow[]>(INITIAL_ROWS);

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
  const [draftCategories, setDraftCategories] = useState<string[]>([]);
  const [draftSuppliers, setDraftSuppliers] = useState<string[]>([]);
  const [draftTypes, setDraftTypes] = useState<LogRow['type'][]>([]);
  const [filterMedicines, setFilterMedicines] = useState<string[]>([]);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterSuppliers, setFilterSuppliers] = useState<string[]>([]);
  const [filterTypes, setFilterTypes] = useState<LogRow['type'][]>([]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setColumnsOpen(false); setSortOpen(false); setExportOpen(false); setDateOpen(false); }
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
      if (q && !(r.sku.toLowerCase().includes(q) || r.item.toLowerCase().includes(q) || r.batch.toLowerCase().includes(q) || r.refId.toLowerCase().includes(q) || String(r.balance).includes(q))) return false;
      if (datePreset !== 'all') {
        const cutoff = Date.now() - Number(datePreset) * 86400000;
        if (r.ts < cutoff) return false;
      }
      if (filterMedicines.length && !filterMedicines.includes(r.item)) return false;
      if (filterCategories.length && !filterCategories.includes(r.category)) return false;
      if (filterSuppliers.length && !filterSuppliers.includes(r.supplier)) return false;
      if (filterTypes.length && !filterTypes.includes(r.type)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'items-asc': return a.item.localeCompare(b.item);
        case 'items-desc': return b.item.localeCompare(a.item);
        case 'balance-desc': return b.balance - a.balance;
        case 'balance-asc': return a.balance - b.balance;
        default: return b.ts - a.ts;
      }
    });
    return list;
  }, [rows, searchQuery, datePreset, sortBy, filterMedicines, filterCategories, filterSuppliers, filterTypes]);

  const activeFilterCount = filterMedicines.length + filterCategories.length + filterSuppliers.length + filterTypes.length;

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
    setFilterCategories([]);
    setFilterSuppliers([]);
    setFilterTypes([]);
    setPage(1);
  };

  const exportCSV = () => {
    const header = 'SKU,Item,Batch No,Transaction Type,Quantity In,Quantity Out,Balance Stock,Reference ID,Date & Time';
    const lines = filtered.map(r => [r.sku, r.item, r.batch, r.type, r.qtyIn, r.qtyOut, r.balance, r.refId, formatDisplay(r.dateISO, r.time24)].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = '\uFEFF' + [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-logs.csv';
    a.click();
    URL.revokeObjectURL(url);
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
        {/* ─── Breadcrumb + Actions ─── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 hover:text-[#0F9291] transition-colors">
              <House className="w-4 h-4" /> Dashboard
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            <span className="text-gray-800 dark:text-gray-100 font-medium">Inventory Logs</span>
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
          </div>
        </div>

        {/* ─── Page Title ─── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track all stock movements across the pharmacy</p>
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

              {/* Sort by */}
              <div className="relative">
                <button onClick={() => { setSortOpen(o => !o); setColumnsOpen(false); setExportOpen(false); setDateOpen(false); }}
                  className="h-10 px-3.5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl hover:border-gray-300 transition-all">
                  <ArrowUpDown className="w-4 h-4" /> Sort by
                </button>
                {sortOpen && renderDropdown(() => setSortOpen(false), (
                  <>
                    {[
                      { key: 'items-asc', label: 'Item', badge: 'A-Z' },
                      { key: 'items-desc', label: 'Item', badge: 'Z-A' },
                      { key: 'balance-desc', label: 'Balance Stock', badge: 'High-Low' },
                      { key: 'balance-asc', label: 'Balance Stock', badge: 'Low-High' },
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
                  {COLUMN_DEFS.filter(c => visibleColumns.includes(c.key)).map(c => (
                    <th key={c.key} className={thCls}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#1D2738]">
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMN_DEFS.length} className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                      No inventory logs found
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-[#151E35] transition-colors">
                      {visibleColumns.includes('sku') && <td className={`${tdCls} text-[#0F9291] font-semibold`}>{r.sku}</td>}
                      {visibleColumns.includes('item') && <td className={`${tdCls} font-medium text-gray-800 dark:text-gray-100`}>{r.item}</td>}
                      {visibleColumns.includes('batch') && <td className={`${tdCls} text-[#0F9291] font-medium`}>{r.batch}</td>}
                      {visibleColumns.includes('type') && (
                        <td className={tdCls}>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_BADGES[r.type].cls}`}>
                            {TYPE_BADGES[r.type].label}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('qtyIn') && <td className={`${tdCls} ${r.qtyIn !== '0' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>{r.qtyIn}</td>}
                      {visibleColumns.includes('qtyOut') && <td className={`${tdCls} ${r.qtyOut !== '0' ? 'text-red-500 dark:text-red-400 font-medium' : ''}`}>{r.qtyOut}</td>}
                      {visibleColumns.includes('balance') && <td className={`${tdCls} font-medium`}>{r.balance}</td>}
                      {visibleColumns.includes('refId') && <td className={`${tdCls} text-[#0F9291] font-medium`}>{r.refId}</td>}
                      {visibleColumns.includes('datetime') && <td className={tdCls}>{formatDisplay(r.dateISO, r.time24)}</td>}
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

      {filterOpen && (
        <FilterSidebar
          draftMedicines={draftMedicines} setDraftMedicines={setDraftMedicines}
          draftCategories={draftCategories} setDraftCategories={setDraftCategories}
          draftSuppliers={draftSuppliers} setDraftSuppliers={setDraftSuppliers}
          draftTypes={draftTypes} setDraftTypes={setDraftTypes}
          onCancel={() => setFilterOpen(false)}
          onApply={() => { setFilterMedicines(draftMedicines); setFilterCategories(draftCategories); setFilterSuppliers(draftSuppliers); setFilterTypes(draftTypes); setFilterOpen(false); }}
        />
      )}
    </div>
  );
}
