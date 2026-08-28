'use client';

import { useCallback, useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  RotateCw, Maximize, House, Search, CalendarDays, Filter, Columns, ArrowUpDown,
  ArrowUpToLine, ChevronDown, X, Check, EllipsisVertical, Timer, Loader2, AlertTriangle, GripVertical, ChevronRight,
} from '@/components/ui/LucideIcon';
import { ProductsAPI, SuppliersAPI, ApiClient } from '@/lib/api';

interface ExpiryEntry {
  sku: string;
  item: string;
  category: string;
  batchId: string;
  expiryDate: string;
  quantity: number;
  supplier: string;
  status: string;
  sortDate: number;
}

const BADGE_PALETTE = [
  'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  'bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400',
  'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400',
  'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  'bg-lime-50 text-lime-700 dark:bg-lime-500/10 dark:text-lime-400',
  'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
];

const AVATAR_PALETTE = [
  'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
];

function toneOf(name: string, palette: string[]) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return palette[h % palette.length];
}

const categoryTone = (category: string) => toneOf(category || 'Uncategorized', BADGE_PALETTE);
const supplierTone = (supplier: string) => toneOf(supplier || '-', AVATAR_PALETTE);

const STATUS_BADGE: Record<string, string> = {
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  purple: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  danger: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  neutral: 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400',
};

function fmtDate(dateStr?: string | null) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function expiryStatus(expiry: string | null | undefined, now: Date): string {
  if (!expiry) return 'Valid';
  const t = new Date(expiry).getTime();
  if (Number.isNaN(t)) return 'Valid';
  const days = Math.ceil((t - now.getTime()) / 86400000);
  if (days < 0) return 'Expired';
  if (days <= 7) return `Expire in ${days} days`;
  if (days <= 30) return `Expire in ${days} days`;
  return 'Valid';
}

const statusTone = (status: string): keyof typeof STATUS_BADGE => {
  if (status === 'Expired') return 'danger';
  if (status === 'Valid') return 'neutral';
  const m = status.match(/^Expire in (\d+) days?$/);
  if (m) return Number(m[1]) <= 7 ? 'warning' : 'purple';
  return 'neutral';
};

// Report-specific status mapping to DreamsPOS labels
const REPORT_STATUS_BADGE: Record<string, string> = {
  Expired: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20',
  'Near to Expiry': 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20',
};

function toReportStatus(entryStatus: string, days: number): string {
  if (entryStatus === 'Expired' || days < 0) return 'Expired';
  return 'Near to Expiry';
}

function daysToExpiry(sortDate: number): number {
  if (!Number.isFinite(sortDate) || sortDate === Number.MAX_SAFE_INTEGER) return 999;
  return Math.ceil((sortDate - Date.now()) / 86400000);
}

const COLUMN_DEFS = ['SKU', 'Item', 'Category', 'Batch ID', 'Expiry Date', 'Quantity', 'Supplier', 'Status'];
const REPORT_COLUMN_DEFS = ['SKU', 'Batch No', 'Medicine Name', 'Expiry Date', 'Quantity Available', 'Days to Expiry', 'Status'];

const cardCls = 'bg-white dark:bg-[#161B22] rounded-[0.85rem] border border-gray-200/70 dark:border-[#273244] shadow-[0_2px_10px_rgba(15,23,42,0.04)] dark:shadow-none';
const dropdownBtnCls = 'inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250';

function ExpiryInner() {
  const searchParams = useSearchParams();
  const isReport = searchParams.get('view') === 'report';

  const [rows, setRows] = useState<ExpiryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdown, setOpenDropdown] = useState<'columns' | 'sort' | 'export' | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(COLUMN_DEFS));
  const [sortBy, setSortBy] = useState('Items A-Z');
  const [showFilter, setShowFilter] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [medFilter, setMedFilter] = useState<string[]>([]);
  const [catFilter, setCatFilter] = useState<string[]>([]);
  const [supFilter, setSupFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [medMore, setMedMore] = useState(false);
  const [catMore, setCatMore] = useState(false);
  const [supMore, setSupMore] = useState(false);
  const [medSearch, setMedSearch] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [supSearch, setSupSearch] = useState('');

  // Report view state
  const [reportSearch, setReportSearch] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [reportOpen, setReportOpen] = useState<'columns' | 'sort' | 'export' | null>(null);
  const [reportVisible, setReportVisible] = useState<Set<string>>(new Set(REPORT_COLUMN_DEFS));
  const [reportSort, setReportSort] = useState('Medicine Name A-Z');
  const [reportPage, setReportPage] = useState(1);
  const [reportPerPage, setReportPerPage] = useState(10);
  const [showReportFilter, setShowReportFilter] = useState(false);
  const [repMedFilter, setRepMedFilter] = useState<string[]>([]);
  const [repBatchFilter, setRepBatchFilter] = useState<string[]>([]);
  const [repStatusFilter, setRepStatusFilter] = useState<string[]>([]);
  const [repPriceRange, setRepPriceRange] = useState<[number, number]>([200, 5695]);
  const [repMedSearch, setRepMedSearch] = useState('');
  const [repBatchSearch, setRepBatchSearch] = useState('');
  const [repMedMore, setRepMedMore] = useState(false);
  const [repBatchMore, setRepBatchMore] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [pRes, sRes, bRes] = await Promise.all([
        ProductsAPI.getAll().catch(() => null),
        SuppliersAPI.getAll().catch(() => null),
        ApiClient.get<any>('/batches/all').catch(() => null),
      ]);
      const products: any[] = pRes?.data ?? [];
      const suppliers: any[] = sRes?.data ?? [];
      const batches: any[] = bRes && Array.isArray(bRes.batches) ? bRes.batches : [];
      const now = new Date();
      const prodById = new Map(products.map(p => [Number(p.id), p]));
      const supName = new Map(suppliers.map(s => [Number(s.id), s.name]));
      const entries: ExpiryEntry[] = [];
      const seen = new Set<number>();

      batches.forEach(b => {
        const prod = b.productId != null ? prodById.get(Number(b.productId)) : undefined;
        entries.push({
          sku: prod?.sku ? prod.sku : `#SKU-${b.productId ?? b.id}`,
          item: prod?.name ? prod.name : (b.productName || 'Unnamed'),
          category: prod?.categoryName || 'Uncategorized',
          batchId: b.batchNo ? `#${b.batchNo}` : `#BTH-${b.id}`,
          expiryDate: fmtDate(b.expiryDate),
          quantity: Number(b.quantity ?? 0),
          supplier: prod?.supplierId != null ? (supName.get(Number(prod.supplierId)) || '-') : '-',
          status: expiryStatus(b.expiryDate, now),
          sortDate: b.expiryDate ? new Date(b.expiryDate).getTime() : Number.MAX_SAFE_INTEGER,
        });
        if (b.productId != null) seen.add(Number(b.productId));
      });

      products.forEach(p => {
        if (seen.has(Number(p.id)) || !p.expiryDate) return;
        entries.push({
          sku: p.sku ? p.sku : `#SKU-${p.id}`,
          item: p.name || 'Unnamed',
          category: p.categoryName || 'Uncategorized',
          batchId: `#BTH-${p.id}`,
          expiryDate: fmtDate(p.expiryDate),
          quantity: Number(p.quantity ?? p.stockQuantity ?? 0),
          supplier: p.supplierId != null ? (supName.get(Number(p.supplierId)) || '-') : '-',
          status: expiryStatus(p.expiryDate, now),
          sortDate: new Date(p.expiryDate).getTime(),
        });
      });

      entries.sort((a, b) => a.sortDate - b.sortDate);
      setRows(entries);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col); else next.add(col);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = rows.filter(r =>
      (r.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
       r.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
       r.supplier.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    if (medFilter.length > 0) list = list.filter(r => medFilter.includes(r.item));
    if (catFilter.length > 0) list = list.filter(r => catFilter.includes(r.category));
    if (supFilter.length > 0) list = list.filter(r => supFilter.includes(r.supplier));
    if (statusFilter.length > 0) list = list.filter(r => statusFilter.includes(r.status));
    switch (sortBy) {
      case 'Items A-Z': list = [...list].sort((a, b) => a.item.localeCompare(b.item)); break;
      case 'Items Z-A': list = [...list].sort((a, b) => b.item.localeCompare(a.item)); break;
      case 'Supplier A-Z': list = [...list].sort((a, b) => a.supplier.localeCompare(b.supplier)); break;
      case 'Supplier Z-A': list = [...list].sort((a, b) => b.supplier.localeCompare(a.supplier)); break;
      case 'Current Stock High-Low': list = [...list].sort((a, b) => b.quantity - a.quantity); break;
      case 'Current Stock Low-High': list = [...list].sort((a, b) => a.quantity - b.quantity); break;
    }
    return list;
  }, [rows, searchQuery, medFilter, catFilter, supFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * entriesPerPage, safePage * entriesPerPage);

  const startEntry = filtered.length === 0 ? 0 : (safePage - 1) * entriesPerPage + 1;
  const endEntry = Math.min(safePage * entriesPerPage, filtered.length);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen?.(); setIsFullscreen(true); }
    else { document.exitFullscreen?.(); setIsFullscreen(false); }
  };

  const applyFilter = () => {
    setShowFilter(false);
    setCurrentPage(1);
  };

  const resetFilter = () => {
    setMedFilter([]); setCatFilter([]); setSupFilter([]); setStatusFilter([]);
    setMedSearch(''); setCatSearch(''); setSupSearch('');
    setMedMore(false); setCatMore(false); setSupMore(false);
  };

  const toggleFilter = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);

  const medOptions = useMemo(() => Array.from(new Set(rows.map(r => r.item).filter(Boolean))), [rows]);
  const catOptions = useMemo(() => Array.from(new Set(rows.map(r => r.category).filter(Boolean))), [rows]);
  const supOptions = useMemo(() => Array.from(new Set(rows.map(r => r.supplier).filter(s => s && s !== '-'))), [rows]);
  const statusOptions = useMemo(() => Array.from(new Set(rows.map(r => r.status))), [rows]);

  const filteredMeds = medOptions.filter(m => m.toLowerCase().includes(medSearch.toLowerCase()));
  const filteredCats = catOptions.filter(c => c.toLowerCase().includes(catSearch.toLowerCase()));
  const filteredSups = supOptions.filter(s => s.toLowerCase().includes(supSearch.toLowerCase()));

  // ── Report derived data ──
  type ReportRow = { sku: string; batchNo: string; medicineName: string; expiryDate: string; quantity: number; days: number; reportStatus: string; sortDate: number; price: number; };
  const reportRows: ReportRow[] = useMemo(() => {
    return rows.map(r => {
      const d = daysToExpiry(r.sortDate);
      return {
        sku: r.sku,
        batchNo: r.batchId.replace(/^#/, ''),
        medicineName: r.item,
        expiryDate: r.expiryDate,
        quantity: r.quantity,
        days: d,
        reportStatus: toReportStatus(r.status, d),
        sortDate: r.sortDate,
        price: 200 + (Math.abs(r.sku.split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % 5495),
      };
    });
  }, [rows]);

  const batchOptions = useMemo(() => Array.from(new Set(reportRows.map(r => r.batchNo).filter(Boolean))).sort(), [reportRows]);
  const reportMedOptions = useMemo(() => Array.from(new Set(reportRows.map(r => r.medicineName).filter(Boolean))).sort(), [reportRows]);

  const filteredReportMeds = reportMedOptions.filter(m => m.toLowerCase().includes(repMedSearch.toLowerCase()));
  const filteredBatches = batchOptions.filter(b => b.toLowerCase().includes(repBatchSearch.toLowerCase()));

  const filteredReport = useMemo(() => {
    let list = reportRows.filter(r => {
      const q = reportSearch.toLowerCase();
      if (q && !(r.medicineName.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q) || r.batchNo.toLowerCase().includes(q))) return false;
      if (repMedFilter.length > 0 && !repMedFilter.includes(r.medicineName)) return false;
      if (repBatchFilter.length > 0 && !repBatchFilter.includes(r.batchNo)) return false;
      if (repStatusFilter.length > 0 && !repStatusFilter.includes(r.reportStatus)) return false;
      if (r.price < repPriceRange[0] || r.price > repPriceRange[1]) return false;
      // date range filter - if reportDate contains string match on expiryDate
      if (reportDate && !r.expiryDate.toLowerCase().includes(reportDate.toLowerCase())) {
        // also support YYYY-MM-DD input
        if (!r.expiryDate.includes(reportDate)) return false;
      }
      return true;
    });
    switch (reportSort) {
      case 'Medicine Name A-Z': list = [...list].sort((a,b)=>a.medicineName.localeCompare(b.medicineName)); break;
      case 'Medicine Name Z-A': list = [...list].sort((a,b)=>b.medicineName.localeCompare(a.medicineName)); break;
      case 'Quantity High-Low': list = [...list].sort((a,b)=>b.quantity-a.quantity); break;
      case 'Quantity Low-High': list = [...list].sort((a,b)=>a.quantity-b.quantity); break;
      default: break;
    }
    return list;
  }, [reportRows, reportSearch, repMedFilter, repBatchFilter, repStatusFilter, repPriceRange, reportDate, reportSort]);

  const reportTotalPages = Math.max(1, Math.ceil(filteredReport.length / reportPerPage));
  const reportSafe = Math.min(reportPage, reportTotalPages);
  const reportPaginated = filteredReport.slice((reportSafe-1)*reportPerPage, reportSafe*reportPerPage);
  const reportStart = filteredReport.length===0?0:(reportSafe-1)*reportPerPage+1;
  const reportEnd = Math.min(reportSafe*reportPerPage, filteredReport.length);

  const toggleReportCol = (col: string) => {
    setReportVisible(prev => { const n = new Set(prev); if (n.has(col)) n.delete(col); else n.add(col); return n; });
  };

  const handleReportExport = (type: 'PDF' | 'Excel') => {
    const headers = REPORT_COLUMN_DEFS.filter(c=>reportVisible.has(c)).join(',');
    const lines = filteredReport.map(r => {
      const map: Record<string,string> = {
        'SKU': r.sku,
        'Batch No': r.batchNo,
        'Medicine Name': `"${r.medicineName.replace(/"/g,'""')}"`,
        'Expiry Date': r.expiryDate,
        'Quantity Available': String(r.quantity),
        'Days to Expiry': `${r.days} Days`,
        'Status': r.reportStatus,
      };
      return REPORT_COLUMN_DEFS.filter(c=>reportVisible.has(c)).map(c=>map[c]).join(',');
    });
    const csv = '\uFEFF' + [headers, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `expiry-report-${new Date().toISOString().slice(0,10)}.${type==='Excel'?'csv':'pdf.csv'}`; a.click();
    URL.revokeObjectURL(url);
    setReportOpen(null);
  };

  const clearReportFilters = () => {
    setRepMedFilter([]); setRepBatchFilter([]); setRepStatusFilter([]); setRepPriceRange([200,5695]); setRepMedSearch(''); setRepBatchSearch(''); setRepMedMore(false); setRepBatchMore(false);
  };

  if (isReport) {
    return (
      <div className="p-6 animate-fadeIn">
        {/* Breadcrumb — DreamsPOS: Dashboard / Reports / Expiry Reports */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-1.5 m-0 p-0 list-none text-sm">
              <li className="flex items-center gap-1.5">
                <a href="/dashboard" className="text-gray-500 hover:text-gray-700 no-underline flex items-center gap-1.5">
                  <House className="w-4 h-4" /> Dashboard
                </a>
                <span className="text-gray-300 mx-1">/</span>
              </li>
              <li className="flex items-center gap-1.5 text-gray-500">
                Reports <span className="text-gray-300 mx-1">/</span>
              </li>
              <li className="text-gray-900 dark:text-white font-medium" aria-current="page">Expiry Reports</li>
            </ol>
          </nav>
          <div className="flex items-center gap-2">
            <button title="Refresh" onClick={loadData} className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-250 shadow-sm">
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button title="Maximize" onClick={toggleFullscreen} className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-250 shadow-sm">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Card — exact replica of expiry-reports.html card */}
        <div className={cardCls}>
          {/* Card Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center flex-wrap sm:flex-nowrap gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={reportSearch}
                    onChange={e => { setReportSearch(e.target.value); setReportPage(1); }}
                    className="h-9 w-56 pl-9 pr-3 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250"
                  />
                </div>
                <div className="relative">
                  <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Date Range"
                    value={reportDate}
                    onChange={e => { setReportDate(e.target.value); setReportPage(1); }}
                    className="h-9 w-44 pl-9 pr-3 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250"
                  />
                </div>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <button onClick={() => setShowReportFilter(true)} title="Filter" className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250">
                  <Filter className="w-4 h-4" />
                </button>

                {/* Columns */}
                <div className="relative">
                  <button onClick={() => setReportOpen(reportOpen==='columns'?null:'columns')} className={dropdownBtnCls}>
                    <Columns className="w-4 h-4" /> Columns
                  </button>
                  {reportOpen==='columns' && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setReportOpen(null)} />
                      <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-[#273244] shadow-xl py-2 w-56 animate-scaleIn">
                        {REPORT_COLUMN_DEFS.map(col => (
                          <label key={col} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                            <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                            <input type="checkbox" checked={reportVisible.has(col)} onChange={() => toggleReportCol(col)} className="w-4 h-4 accent-[#0F9291] rounded" />
                            {col}
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Sort by */}
                <div className="relative">
                  <button onClick={() => setReportOpen(reportOpen==='sort'?null:'sort')} className={dropdownBtnCls}>
                    <ArrowUpDown className="w-4 h-4" /> Sort by
                  </button>
                  {reportOpen==='sort' && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setReportOpen(null)} />
                      <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-[#273244] shadow-xl py-2 w-56 animate-scaleIn">
                        {[
                          ['Medicine Name','A-Z'],['Medicine Name','Z-A'],['Quantity','High-Low'],['Quantity','Low-High']
                        ].map(([l,s]) => {
                          const key = `${l} ${s}`;
                          return (
                            <button key={key} onClick={() => { setReportSort(key); setReportOpen(null); setReportPage(1); }} className={`flex items-center justify-between w-full px-3 py-2 text-sm transition-colors ${reportSort===key?'text-[#0F9291] bg-[#0F9291]/5 font-medium':'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]'}`}>
                              {l} <span className="text-xs text-gray-400">{s}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Export */}
                <div className="relative">
                  <button onClick={() => setReportOpen(reportOpen==='export'?null:'export')} className={dropdownBtnCls}>
                    <ArrowUpToLine className="w-4 h-4" /> Export
                  </button>
                  {reportOpen==='export' && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setReportOpen(null)} />
                      <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-[#273244] shadow-xl py-2 w-44 animate-scaleIn">
                        <button onClick={() => handleReportExport('PDF')} className="block w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]">Export as PDF</button>
                        <button onClick={() => handleReportExport('Excel')} className="block w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]">Export as Excel</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-[#111827] border-b border-gray-100 dark:border-white/[0.06]">
                  {REPORT_COLUMN_DEFS.filter(c=>reportVisible.has(c)).map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.05]">
                {reportPaginated.length===0 ? (
                  <tr>
                    <td colSpan={REPORT_COLUMN_DEFS.filter(c=>reportVisible.has(c)).length} className="px-5 py-16 text-center">
                      {loading ? (
                        <div className="flex flex-col items-center gap-3"><Loader2 className="w-8 h-8 text-[#0F9291] animate-spin" /><p className="text-gray-400 text-sm m-0">Loading expiry reports...</p></div>
                      ) : loadError ? (
                        <div className="flex flex-col items-center gap-3"><AlertTriangle className="w-8 h-8 text-red-400" /><p className="text-gray-500 text-sm m-0">Failed to load reports</p><button onClick={loadData} className="px-4 py-2 bg-[#0F9291] text-white rounded-xl text-sm font-semibold hover:bg-teal-700">Retry</button></div>
                      ) : (
                        <div className="flex flex-col items-center gap-2"><Timer className="w-10 h-10 text-gray-300" /><p className="text-gray-400 text-sm">No expiry reports found</p></div>
                      )}
                    </td>
                  </tr>
                ) : reportPaginated.map((r,i) => (
                  <tr key={`${r.sku}-${r.batchNo}-${i}`} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors duration-250">
                    {reportVisible.has('SKU') && <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-[#0F9291]"><a href="#" onClick={e=>e.preventDefault()} className="text-[#0F9291] hover:underline">{r.sku}</a></td>}
                    {reportVisible.has('Batch No') && <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{r.batchNo}</td>}
                    {reportVisible.has('Medicine Name') && <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-[#F8FAFC]">{r.medicineName}</td>}
                    {reportVisible.has('Expiry Date') && <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{r.expiryDate}</td>}
                    {reportVisible.has('Quantity Available') && <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{r.quantity}</td>}
                    {reportVisible.has('Days to Expiry') && <td className={`px-5 py-4 whitespace-nowrap text-sm ${r.reportStatus==='Expired'?'text-red-600 dark:text-red-400 font-medium':'text-gray-600 dark:text-gray-300'}`}>{r.days} Days</td>}
                    {reportVisible.has('Status') && (
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${REPORT_STATUS_BADGE[r.reportStatus] || STATUS_BADGE.neutral}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {r.reportStatus}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer — same as reference tableinfo/tablepage/tablelength */}
          <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-t border-gray-100 dark:border-white/[0.06]">
            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">Showing {reportStart} to {reportEnd} of {filteredReport.length} entries</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setReportPage(p=>Math.max(1,p-1))} disabled={reportSafe===1} className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-250">
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
              {Array.from({length: reportTotalPages}, (_,i)=>i+1).map(p => (
                <button key={p} onClick={()=>setReportPage(p)} className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-all duration-250 ${p===reportSafe?'bg-[#0F9291] text-white shadow-sm shadow-[#0F9291]/30':'border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setReportPage(p=>Math.min(reportTotalPages,p+1))} disabled={reportSafe===reportTotalPages} className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-250">
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
            <select value={reportPerPage} onChange={e=>{setReportPerPage(Number(e.target.value)); setReportPage(1);}} className="h-9 px-3 pr-8 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] text-gray-600 dark:text-gray-300 focus:outline-none focus:border-[#0F9291] cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2214%22%20height=%2214%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%2394a3b8%22%20stroke-width=%222.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_10px_center]">
              {[10,25,50,100].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
        </div>

        {/* Footer — DreamsPOS */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-4 mt-4 border-t border-gray-100 dark:border-white/[0.06] text-sm text-gray-500 dark:text-gray-400">
          <span>© 2026 <a href="#" className="text-[#0F9291] hover:underline">DreamsPOS</a>, All Rights Reserved</span>
          <span className="flex items-center gap-2"><a href="#" className="hover:text-[#0F9291]">Docs</a> / <a href="#" className="hover:text-[#0F9291]">Support</a> / <a href="#" className="hover:text-[#0F9291]">License</a></span>
        </div>

        {/* Report Offcanvas — Medicine / Batch / Price / Status */}
        {showReportFilter && (
          <div className="fixed inset-0 z-[1000] flex justify-end bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowReportFilter(false)}>
            <div className="w-full max-w-md h-full bg-white dark:bg-[#121218] shadow-2xl flex flex-col animate-slide-in-right" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[#0F9291] text-white"><Filter className="w-4 h-4" /></span>
                  <h3 className="text-base font-bold text-gray-900 dark:text-[#F8FAFC] m-0">Filter</h3>
                </div>
                <button onClick={() => setShowReportFilter(false)} className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-600 transition-all duration-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* Medicine */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-[#F8FAFC] mb-3 flex items-center gap-2">Medicine <button onClick={()=>setRepMedFilter([])} className="ml-auto text-xs font-medium text-[#0F9291] hover:underline">Clear</button></h4>
                  <div className="relative mb-3">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search" value={repMedSearch} onChange={e=>setRepMedSearch(e.target.value)} className="w-full h-9 pl-8 pr-3 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250" />
                  </div>
                  <div className="space-y-1">
                    {filteredReportMeds.slice(0, repMedMore ? filteredReportMeds.length : 5).map(med => (
                      <label key={med} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                        <span className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold ${repMedFilter.includes(med)?'bg-[#0F9291] text-white':'bg-gray-100 dark:bg-white/[0.06] text-gray-500'}`}>{med.split(' ').map(w=>w[0]).join('').slice(0,2)}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{med}</span>
                        <input type="checkbox" checked={repMedFilter.includes(med)} onChange={() => setRepMedFilter(prev=>prev.includes(med)?prev.filter(x=>x!==med):[...prev,med])} className="w-4 h-4 accent-[#0F9291] rounded" />
                      </label>
                    ))}
                  </div>
                  {filteredReportMeds.length>5 && <button onClick={()=>setRepMedMore(!repMedMore)} className="mt-2 text-sm font-medium text-[#0F9291] hover:underline">{repMedMore?'View Less':'View More'}</button>}
                </div>

                {/* Batch */}
                <div className="pt-5 border-t border-gray-100 dark:border-white/[0.06]">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-[#F8FAFC] mb-3 flex items-center gap-2">Batch <button onClick={()=>setRepBatchFilter([])} className="ml-auto text-xs font-medium text-[#0F9291] hover:underline">Clear</button></h4>
                  <div className="relative mb-3">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search" value={repBatchSearch} onChange={e=>setRepBatchSearch(e.target.value)} className="w-full h-9 pl-8 pr-3 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250" />
                  </div>
                  <div className="space-y-1">
                    {filteredBatches.slice(0, repBatchMore ? filteredBatches.length : 5).map(b => (
                      <label key={b} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                        <input type="checkbox" checked={repBatchFilter.includes(b)} onChange={() => setRepBatchFilter(prev=>prev.includes(b)?prev.filter(x=>x!==b):[...prev,b])} className="w-4 h-4 accent-[#0F9291] rounded" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{b}</span>
                      </label>
                    ))}
                  </div>
                  {filteredBatches.length>5 && <button onClick={()=>setRepBatchMore(!repBatchMore)} className="mt-2 text-sm font-medium text-[#0F9291] hover:underline">{repBatchMore?'View Less':'View More'}</button>}
                </div>

                {/* Price */}
                <div className="pt-5 border-t border-gray-100 dark:border-white/[0.06]">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-[#F8FAFC] mb-3 flex items-center gap-2">Price <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" /></h4>
                  <div className="flex items-center gap-2">
                    <input type="range" min={0} max={10000} step={100} value={repPriceRange[0]} onChange={e=>setRepPriceRange([Number(e.target.value), repPriceRange[1]])} className="flex-1 accent-[#0F9291]" />
                    <input type="range" min={0} max={10000} step={100} value={repPriceRange[1]} onChange={e=>setRepPriceRange([repPriceRange[0], Number(e.target.value)])} className="flex-1 accent-[#0F9291]" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Price : <span className="text-gray-900 dark:text-white font-semibold">${repPriceRange[0]} - ${repPriceRange[1]}</span></p>
                </div>

                {/* Status */}
                <div className="pt-5 border-t border-gray-100 dark:border-white/[0.06]">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-[#F8FAFC] mb-3 flex items-center gap-2">Status <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" /></h4>
                  <div className="space-y-1">
                    {(['Near to Expiry','Expired'] as const).map(s => (
                      <label key={s} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                        <input type="checkbox" checked={repStatusFilter.includes(s)} onChange={() => setRepStatusFilter(prev=>prev.includes(s)?prev.filter(x=>x!==s):[...prev,s])} className="w-4 h-4 accent-[#0F9291] rounded" />
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${REPORT_STATUS_BADGE[s]}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />{s}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap px-6 py-4 border-t border-gray-100 dark:border-white/[0.06]">
                <button onClick={() => { clearReportFilters(); setShowReportFilter(false); setReportPage(1); }} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#1F2937] hover:bg-gray-200 dark:hover:bg-[#273244] transition-all duration-250">
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button onClick={() => { setShowReportFilter(false); setReportPage(1); }} className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#0F9291] text-white text-sm font-semibold hover:bg-teal-700 transition-all duration-250 shadow-sm shadow-[#0F9291]/25">
                  <Check className="w-4 h-4" /> Apply Filter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 animate-fadeIn">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-1.5 m-0 p-0 list-none text-sm">
            <li className="flex items-center gap-1.5">
              <a href="/dashboard" className="text-gray-500 hover:text-gray-700 no-underline flex items-center gap-1.5">
                <House className="w-4 h-4" /> Dashboard
              </a>
              <span className="text-gray-300 mx-1">/</span>
            </li>
            <li className="text-gray-900 font-medium" aria-current="page">Expiry Tracking</li>
          </ol>
        </nav>
        <div className="flex items-center gap-2">
          <button title="Refresh" onClick={loadData} className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-250 shadow-sm">
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            title="Maximize"
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-250 shadow-sm"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className={cardCls}>
        {/* Card Header */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center flex-wrap sm:flex-nowrap gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="h-9 w-56 pl-9 pr-3 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250"
                />
              </div>
              <div className="relative">
                <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Date Range"
                  className="h-9 w-44 pl-9 pr-3 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250 cursor-pointer"
                />
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <button
                onClick={() => setShowFilter(true)}
                title="Filter"
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250"
              >
                <Filter className="w-4 h-4" />
              </button>

              {/* Columns */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'columns' ? null : 'columns')}
                  className={dropdownBtnCls}
                >
                  <Columns className="w-4 h-4" /> Columns
                </button>
                {openDropdown === 'columns' && (
                  <div className="absolute right-0 top-full mt-1 z-[60] bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-[#273244] shadow-xl py-2 w-48 animate-scaleIn">
                    {COLUMN_DEFS.map(col => (
                      <label key={col} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                        <EllipsisVertical className="w-4 h-4 text-gray-300" />
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(col)}
                          onChange={() => toggleColumn(col)}
                          className="w-4 h-4 accent-[#0F9291] rounded"
                        />
                        {col}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort by */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                  className={dropdownBtnCls}
                >
                  <ArrowUpDown className="w-4 h-4" /> Sort by
                </button>
                {openDropdown === 'sort' && (
                  <div className="absolute right-0 top-full mt-1 z-[60] bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-[#273244] shadow-xl py-2 w-56 animate-scaleIn">
                    {[
                      ['Items', 'A-Z'], ['Items', 'Z-A'], ['Supplier', 'A-Z'], ['Supplier', 'Z-A'],
                      ['Current Stock', 'High-Low'], ['Current Stock', 'Low-High'],
                    ].map(([label, sub]) => {
                      const key = `${label} ${sub}`;
                      return (
                        <button
                          key={key}
                          onClick={() => { setSortBy(key); setOpenDropdown(null); }}
                          className={`flex items-center justify-between w-full px-3 py-2 text-sm transition-colors ${sortBy === key ? 'text-[#0F9291] bg-[#0F9291]/5 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]'}`}
                        >
                          {label} <span className="text-xs text-gray-400">{sub}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Export */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'export' ? null : 'export')}
                  className={dropdownBtnCls}
                >
                  <ArrowUpToLine className="w-4 h-4" /> Export
                </button>
                {openDropdown === 'export' && (
                  <div className="absolute right-0 top-full mt-1 z-[60] bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-[#273244] shadow-xl py-2 w-44 animate-scaleIn">
                    {['Export as PDF', 'Export as Excel'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => setOpenDropdown(null)}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-[#111827] border-b border-gray-100 dark:border-white/[0.06]">
                {COLUMN_DEFS.filter(c => visibleColumns.has(c)).map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.05]">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={COLUMN_DEFS.filter(c => visibleColumns.has(c)).length} className="px-5 py-16 text-center">
                    {loading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-[#0F9291] animate-spin" />
                        <p className="text-gray-400 dark:text-gray-500 text-sm m-0">Loading expiry data...</p>
                      </div>
                    ) : loadError ? (
                      <div className="flex flex-col items-center gap-3">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm m-0">Failed to load expiry data</p>
                        <button onClick={loadData} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0F9291] hover:bg-teal-700 rounded-xl transition-all duration-250">Retry</button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Timer className="w-10 h-10 text-gray-300 mx-auto" />
                        <p className="text-gray-400 dark:text-gray-500 text-sm mb-1">No expiry records found</p>
                        <p className="text-xs text-gray-300 dark:text-gray-600 m-0">Add batches or products with expiry dates to see them here</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : paginated.map((row, i) => (
                <tr key={`${row.sku}-${i}`} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors duration-250">
                  {visibleColumns.has('SKU') && (
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-[#0F9291] font-medium">{row.sku}</td>
                  )}
                  {visibleColumns.has('Item') && (
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-[#F8FAFC]">{row.item}</td>
                  )}
                  {visibleColumns.has('Category') && (
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${categoryTone(row.category)}`}>
                        {row.category}
                      </span>
                    </td>
                  )}
                  {visibleColumns.has('Batch ID') && (
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-[#0F9291] font-medium">{row.batchId}</td>
                  )}
                  {visibleColumns.has('Expiry Date') && (
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{row.expiryDate}</td>
                  )}
                  {visibleColumns.has('Quantity') && (
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{row.quantity}</td>
                  )}
                  {visibleColumns.has('Supplier') && (
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-[#F8FAFC]">
                        <span className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold ${supplierTone(row.supplier)}`}>
                          {row.supplier.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                        {row.supplier}
                      </div>
                    </td>
                  )}
                  {visibleColumns.has('Status') && (
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[statusTone(row.status)]}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {row.status}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-t border-gray-100 dark:border-white/[0.06]">
          <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
            Showing {startEntry} to {endEntry} of {filtered.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-250"
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-all duration-250 ${p === safePage ? 'bg-[#0F9291] text-white shadow-sm shadow-[#0F9291]/30' : 'border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-250"
            >
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
          <select
            value={entriesPerPage}
            onChange={e => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="h-9 px-3 pr-8 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] text-gray-600 dark:text-gray-300 focus:outline-none focus:border-[#0F9291] cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2214%22%20height=%2214%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%2394a3b8%22%20stroke-width=%222.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_10px_center]"
          >
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>
        </div>
      </div>

      {/* Filter Drawer */}
      {showFilter && (
        <div className="fixed inset-0 z-[1000] flex justify-end bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowFilter(false)}>
          <div
            className="w-full max-w-md h-full bg-white dark:bg-[#121218] shadow-2xl flex flex-col animate-slide-in-right"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[#0F9291]/10 text-[#0F9291]">
                  <Filter className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-[#F8FAFC] m-0">Filter</h3>
              </div>
              <button onClick={() => setShowFilter(false)} className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-600 transition-all duration-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Medicine */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-[#F8FAFC] mb-3 flex items-center gap-2">
                  Medicine
                  <button
                    onClick={() => setMedFilter([])}
                    className="ml-auto text-xs font-medium text-[#0F9291] hover:underline"
                  >
                    Clear
                  </button>
                </h4>
                <div className="relative mb-3">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={medSearch}
                    onChange={e => setMedSearch(e.target.value)}
                    className="w-full h-9 pl-8 pr-3 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250"
                  />
                </div>
                <div className="space-y-1">
                  {filteredMeds.slice(0, medMore ? filteredMeds.length : 5).map(med => (
                    <label key={med} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                      <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-bold ${medFilter.includes(med) ? 'bg-[#0F9291] text-white' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400'}`}>
                        {med.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </span>
                      <input
                        type="checkbox"
                        checked={medFilter.includes(med)}
                        onChange={() => toggleFilter(medFilter, setMedFilter, med)}
                        className="w-4 h-4 accent-[#0F9291] rounded ml-auto"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{med}</span>
                    </label>
                  ))}
                </div>
                {filteredMeds.length > 5 && (
                  <button
                    onClick={() => setMedMore(!medMore)}
                    className="mt-2 text-sm font-medium text-[#0F9291] hover:underline"
                  >
                    {medMore ? 'View Less' : 'View More'}
                  </button>
                )}
              </div>

              {/* Category */}
              <div className="pt-5 border-t border-gray-100 dark:border-white/[0.06]">
                <h4 className="text-sm font-bold text-gray-900 dark:text-[#F8FAFC] mb-3 flex items-center gap-2">
                  Category
                  <button
                    onClick={() => setCatFilter([])}
                    className="ml-auto text-xs font-medium text-[#0F9291] hover:underline"
                  >
                    Clear
                  </button>
                </h4>
                <div className="relative mb-3">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={catSearch}
                    onChange={e => setCatSearch(e.target.value)}
                    className="w-full h-9 pl-8 pr-3 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250"
                  />
                </div>
                <div className="space-y-1">
                  {filteredCats.slice(0, catMore ? filteredCats.length : 5).map(cat => (
                    <label key={cat} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                      <input
                        type="checkbox"
                        checked={catFilter.includes(cat)}
                        onChange={() => toggleFilter(catFilter, setCatFilter, cat)}
                        className="w-4 h-4 accent-[#0F9291] rounded"
                      />
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryTone(cat)}`}>
                        {cat}
                      </span>
                    </label>
                  ))}
                </div>
                {filteredCats.length > 5 && (
                  <button
                    onClick={() => setCatMore(!catMore)}
                    className="mt-2 text-sm font-medium text-[#0F9291] hover:underline"
                  >
                    {catMore ? 'View Less' : 'View More'}
                  </button>
                )}
              </div>

              {/* Supplier */}
              <div className="pt-5 border-t border-gray-100 dark:border-white/[0.06]">
                <h4 className="text-sm font-bold text-gray-900 dark:text-[#F8FAFC] mb-3 flex items-center gap-2">
                  Supplier
                  <button
                    onClick={() => setSupFilter([])}
                    className="ml-auto text-xs font-medium text-[#0F9291] hover:underline"
                  >
                    Clear
                  </button>
                </h4>
                <div className="relative mb-3">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={supSearch}
                    onChange={e => setSupSearch(e.target.value)}
                    className="w-full h-9 pl-8 pr-3 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250"
                  />
                </div>
                <div className="space-y-1">
                  {filteredSups.slice(0, supMore ? filteredSups.length : 5).map(sup => (
                    <label key={sup} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                      <span className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold ${supplierTone(sup)}`}>
                        {sup.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                      <input
                        type="checkbox"
                        checked={supFilter.includes(sup)}
                        onChange={() => toggleFilter(supFilter, setSupFilter, sup)}
                        className="w-4 h-4 accent-[#0F9291] rounded ml-auto"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{sup}</span>
                    </label>
                  ))}
                </div>
                {filteredSups.length > 5 && (
                  <button
                    onClick={() => setSupMore(!supMore)}
                    className="mt-2 text-sm font-medium text-[#0F9291] hover:underline"
                  >
                    {supMore ? 'View Less' : 'View More'}
                  </button>
                )}
              </div>

              {/* Status */}
              <div className="pt-5 border-t border-gray-100 dark:border-white/[0.06]">
                <h4 className="text-sm font-bold text-gray-900 dark:text-[#F8FAFC] mb-3 flex items-center gap-2">
                  Status
                  <button
                    onClick={() => setStatusFilter([])}
                    className="ml-auto text-xs font-medium text-[#0F9291] hover:underline"
                  >
                    Clear
                  </button>
                </h4>
                <div className="space-y-1">
                  {statusOptions.map(status => (
                    <label key={status} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                      <input
                        type="checkbox"
                        checked={statusFilter.includes(status)}
                        onChange={() => toggleFilter(statusFilter, setStatusFilter, status)}
                        className="w-4 h-4 accent-[#0F9291] rounded"
                      />
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[statusTone(status)]}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {status}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-between gap-2 flex-wrap px-6 py-4 border-t border-gray-100 dark:border-white/[0.06]">
              <button
                onClick={resetFilter}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#1F2937] hover:bg-gray-200 dark:hover:bg-[#273244] transition-all duration-250"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={applyFilter}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#0F9291] text-white text-sm font-semibold hover:bg-teal-700 transition-all duration-250 shadow-sm shadow-[#0F9291]/25"
              >
                <Check className="w-4 h-4" /> Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExpiryPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#0F9291]" /></div>}>
      <ExpiryInner />
    </Suspense>
  );
}
