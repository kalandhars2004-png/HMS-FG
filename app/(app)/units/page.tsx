'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Unit } from '@/types';
import { UnitsAPI } from '@/lib/api';
import AddUnitDialog from '@/components/units/AddUnitDialog';
import { GlobalConfirmModal } from '@/components/ui/GlobalModal';
import {
  Search, Plus, X, RotateCw, Maximize, Minimize, CalendarDays, Grid, SortDesc,
  Upload, ChevronDown, EllipsisVertical, Edit, Trash2, House, FileSpreadsheet, Printer, Info,
  SlidersHorizontal, Filter, Layers, Archive, XCircle,
} from '@/components/ui/LucideIcon';

const CATEGORY_OPTIONS = ['WEIGHT', 'VOLUME', 'LENGTH', 'QUANTITY', 'PACKAGING', 'MEDICAL', 'LIQUID', 'CUSTOM'];
const MEASUREMENT_OPTIONS = ['METRIC', 'IMPERIAL', 'US_CUSTOMARY', 'OTHER'];
const MEASUREMENT_LABELS: Record<string, string> = {
  METRIC: 'Metric',
  IMPERIAL: 'Imperial',
  US_CUSTOMARY: 'US Customary',
  OTHER: 'Other',
};
const USAGE_OPTIONS = [
  { key: 'PURCHASE', label: 'Purchases' },
  { key: 'SALES', label: 'Sales' },
  { key: 'INVENTORY', label: 'Inventory' },
  { key: 'MANUFACTURING', label: 'Manufacturing' },
  { key: 'PRESCRIPTIONS', label: 'Prescriptions' },
  { key: 'REPORTS', label: 'Reports' },
  { key: 'BARCODE', label: 'Barcode Printing' },
];
const SORT_OPTIONS = [
  { value: 'NEWEST', label: 'Newest First' },
  { value: 'OLDEST', label: 'Oldest First' },
  { value: 'NAME_AZ', label: 'Name A-Z' },
  { value: 'NAME_ZA', label: 'Name Z-A' },
  { value: 'CATEGORY', label: 'Category' },
  { value: 'STATUS', label: 'Status' },
  { value: 'RECENTLY_UPDATED', label: 'Recently Updated' },
  { value: 'MOST_USED', label: 'Most Used' },
  { value: 'LEAST_USED', label: 'Least Used' },
];

const CATEGORY_BADGE: Record<string, string> = {
  WEIGHT: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  VOLUME: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400',
  LENGTH: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  QUANTITY: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  PACKAGING: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
  MEDICAL: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  LIQUID: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400',
  CUSTOM: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  Solid: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  Liquid: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400',
  Powder: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  Capsule: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  Injection: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  Other: 'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400',
};

const CATEGORY_DOTS: Record<string, string> = {
  WEIGHT: 'bg-amber-400', VOLUME: 'bg-cyan-400', LENGTH: 'bg-blue-400', QUANTITY: 'bg-purple-400',
  PACKAGING: 'bg-indigo-400', MEDICAL: 'bg-rose-400', LIQUID: 'bg-teal-400', CUSTOM: 'bg-orange-400',
};

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', dot: 'bg-emerald-500' },
  { value: 'INACTIVE', label: 'Inactive', dot: 'bg-red-500' },
  { value: 'ARCHIVED', label: 'Archived', dot: 'bg-gray-400 dark:bg-gray-500' },
];

const badgeSoft = (cls: string, dot = true) =>
  `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`;

const COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Unit Name' },
  { key: 'shortCode', label: 'Short Code' },
  { key: 'category', label: 'Category' },
  { key: 'baseUnit', label: 'Base Unit' },
  { key: 'conversionRate', label: 'Conversion Rate' },
  { key: 'status', label: 'Status' },
];

const iso = (d: Date) => {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};

const QUICK_RANGES: { key: string; label: string; get: () => { from: string; to: string } }[] = [
  { key: 'TODAY', label: 'Today', get: () => { const n = new Date(); return { from: iso(n), to: iso(n) }; } },
  { key: 'YESTERDAY', label: 'Yesterday', get: () => { const n = new Date(); n.setDate(n.getDate() - 1); return { from: iso(n), to: iso(n) }; } },
  { key: 'LAST_7', label: 'Last 7 Days', get: () => { const n = new Date(); const f = new Date(); f.setDate(f.getDate() - 6); return { from: iso(f), to: iso(n) }; } },
  { key: 'LAST_30', label: 'Last 30 Days', get: () => { const n = new Date(); const f = new Date(); f.setDate(f.getDate() - 29); return { from: iso(f), to: iso(n) }; } },
  { key: 'LAST_90', label: 'Last 90 Days', get: () => { const n = new Date(); const f = new Date(); f.setDate(f.getDate() - 89); return { from: iso(f), to: iso(n) }; } },
  { key: 'THIS_MONTH', label: 'This Month', get: () => { const n = new Date(); return { from: iso(new Date(n.getFullYear(), n.getMonth(), 1)), to: iso(n) }; } },
  { key: 'LAST_MONTH', label: 'Last Month', get: () => { const n = new Date(); return { from: iso(new Date(n.getFullYear(), n.getMonth() - 1, 1)), to: iso(new Date(n.getFullYear(), n.getMonth(), 0)) }; } },
  { key: 'THIS_YEAR', label: 'This Year', get: () => { const n = new Date(); return { from: iso(new Date(n.getFullYear(), 0, 1)), to: iso(n) }; } },
];

interface Filters {
  search: string;
  status: string;
  category: string;
  measurementSystem: string;
  baseUnit: string;
  usages: string[];
  sort: string;
  from: string;
  to: string;
  ufrom: string;
  uto: string;
  createdBy: string;
  min: string;
  max: string;
}

const EMPTY_FILTERS: Filters = {
  search: '', status: '', category: '', measurementSystem: '', baseUnit: '', usages: [],
  sort: 'NEWEST', from: '', to: '', ufrom: '', uto: '', createdBy: '', min: '', max: '',
};

function filtersFromParams(sp: URLSearchParams): Filters {
  return {
    search: sp.get('search') || '',
    status: sp.get('status') || '',
    category: sp.get('category') || '',
    measurementSystem: sp.get('ms') || '',
    baseUnit: sp.get('base') || '',
    usages: (sp.get('usage') || '').split(',').filter(Boolean),
    sort: sp.get('sort') || 'NEWEST',
    from: sp.get('from') || '',
    to: sp.get('to') || '',
    ufrom: sp.get('ufrom') || '',
    uto: sp.get('uto') || '',
    createdBy: sp.get('cb') || '',
    min: sp.get('min') || '',
    max: sp.get('max') || '',
  };
}

function buildQuery(f: Filters, page: number): string {
  const p: Record<string, string> = {};
  if (f.search) p.search = f.search;
  if (f.status) p.status = f.status;
  if (f.category) p.category = f.category;
  if (f.measurementSystem) p.ms = f.measurementSystem;
  if (f.baseUnit) p.base = f.baseUnit;
  if (f.usages.length) p.usage = f.usages.join(',');
  if (f.sort !== 'NEWEST') p.sort = f.sort;
  if (f.from) p.from = f.from;
  if (f.to) p.to = f.to;
  if (f.ufrom) p.ufrom = f.ufrom;
  if (f.uto) p.uto = f.uto;
  if (f.createdBy) p.cb = f.createdBy;
  if (f.min) p.min = f.min;
  if (f.max) p.max = f.max;
  if (page > 1) p.page = String(page);
  return new URLSearchParams(p).toString();
}

const PAGE_SIZE = 8;

export default function UnitsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() => filtersFromParams(searchParams));
  const [searchInput, setSearchInput] = useState(filtersFromParams(searchParams).search);
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));

  const [units, setUnits] = useState<Unit[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    id: true, name: true, shortCode: true, category: true, baseUnit: true, conversionRate: true, status: true,
  });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [deleteUnit, setDeleteUnit] = useState<Unit | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [datePreset, setDatePreset] = useState('CUSTOM');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [catIndex, setCatIndex] = useState(-1);
  const [statusIndex, setStatusIndex] = useState(-1);

  const patch = useCallback((p: Partial<Filters>) => {
    setFilters(f => ({ ...f, ...p }));
    setPage(1);
  }, []);

  const debouncedSearch = searchInput.trim();

  useEffect(() => {
    const t = setTimeout(() => {
      patch({ search: searchInput.trim() });
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, patch]);

  const queryKey = useMemo(() => buildQuery(filters, page), [filters, page]);

  useEffect(() => {
    router.replace(`/units${queryKey ? `?${queryKey}` : ''}`, { scroll: false });
  }, [queryKey, router]);

  const fetchUnits = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await UnitsAPI.filter({
        page,
        limit: PAGE_SIZE,
        search: filters.search,
        status: filters.status,
        category: filters.category,
        measurementSystem: filters.measurementSystem,
        baseUnit: filters.baseUnit,
        usage: filters.usages,
        sort: filters.sort,
        fromDate: filters.from || undefined,
        toDate: filters.to || undefined,
        updatedFromDate: filters.ufrom || undefined,
        updatedToDate: filters.uto || undefined,
        createdBy: filters.createdBy || undefined,
        minConversionRate: filters.min || undefined,
        maxConversionRate: filters.max || undefined,
      });
      setUnits(res.data);
      setTotalElements(res.totalElements);
      setTotalPages(Math.max(1, res.totalPages));
      if (page > 1 && res.data.length === 0 && res.totalElements > 0) {
        setPage(p => Math.max(1, p - 1));
      }
    } catch (error) {
      console.error('Failed to load units:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideAnchor = (el: HTMLDivElement | null) => el && el.contains(target);
      if (!insideAnchor(dropdownRef.current) && !insideAnchor(categoryRef.current) && !insideAnchor(statusRef.current)) setOpenDropdown(null);
      if (menuRef.current && !menuRef.current.contains(target)) setOpenMenuId(null);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpenDropdown(null); setOpenMenuId(null); }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (filters.search) chips.push({ key: 'search', label: `Search: "${filters.search}"` });
    if (filters.status) chips.push({ key: 'status', label: `Status: ${filters.status.charAt(0) + filters.status.slice(1).toLowerCase()}` });
    if (filters.category) chips.push({ key: 'category', label: `Category: ${filters.category}` });
    if (filters.measurementSystem) chips.push({ key: 'measurementSystem', label: `System: ${MEASUREMENT_LABELS[filters.measurementSystem] || filters.measurementSystem}` });
    if (filters.baseUnit) chips.push({ key: 'baseUnit', label: `Base: ${filters.baseUnit}` });
    filters.usages.forEach(u => {
      const opt = USAGE_OPTIONS.find(o => o.key === u);
      if (opt) chips.push({ key: `usage-${u}`, label: opt.label });
    });
    if (filters.from || filters.to) {
      const preset = QUICK_RANGES.find(q => q.key === datePreset && q.key !== 'CUSTOM');
      chips.push({ key: 'date', label: preset ? `Created: ${preset.label}` : `Created: ${filters.from || '…'} - ${filters.to || '…'}` });
    }
    if (filters.ufrom || filters.uto) chips.push({ key: 'udate', label: `Updated: ${filters.ufrom || '…'} - ${filters.uto || '…'}` });
    if (filters.createdBy) chips.push({ key: 'createdBy', label: `Created by: ${filters.createdBy}` });
    if (filters.min || filters.max) chips.push({ key: 'rate', label: `Rate: ${filters.min || '0'} - ${filters.max || '∞'}` });
    return chips;
  }, [filters, datePreset]);

  const hasFilters = activeChips.length > 0;

  // Data-driven: seeded from the shared CATEGORY_OPTIONS config, then extended
  // with any category value actually present in the loaded data, so new backend
  // categories appear without UI changes. Stable while loading (config only).
  const allCategories = useMemo(() => {
    const set = new Set<string>(CATEGORY_OPTIONS);
    units.forEach(u => { if (u.category) set.add(u.category); });
    return [...set].sort();
  }, [units]);

  const pickCategory = useCallback((value: string) => {
    patch({ category: value });
    setOpenDropdown(null);
    setCatIndex(-1);
  }, [patch]);

  const openCategoryPopover = () => {
    setOpenDropdown('category');
    setOpenMenuId(null);
    setCatIndex(filters.category ? allCategories.indexOf(filters.category) + 1 : -1);
  };

  const onCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (openDropdown !== 'category') return;
    const count = allCategories.length + 1; // index 0 = All Categories
    if (e.key === 'ArrowDown') { e.preventDefault(); setCatIndex(i => (i + 1) % count); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCatIndex(i => (i <= 0 ? count - 1 : i - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setCatIndex(0); }
    else if (e.key === 'End') { e.preventDefault(); setCatIndex(count - 1); }
    else if (e.key === 'Enter' && catIndex >= 0) { e.preventDefault(); pickCategory(catIndex === 0 ? '' : allCategories[catIndex - 1]); }
  };

  const pickStatus = useCallback((value: string) => {
    patch({ status: value });
    setOpenDropdown(null);
    setStatusIndex(-1);
  }, [patch]);

  const openStatusPopover = () => {
    setOpenDropdown('status');
    setOpenMenuId(null);
    setStatusIndex(filters.status ? STATUS_OPTIONS.findIndex(s => s.value === filters.status) + 1 : -1);
  };

  const onStatusKeyDown = (e: React.KeyboardEvent) => {
    if (openDropdown !== 'status') return;
    const count = STATUS_OPTIONS.length + 1; // index 0 = All Status
    if (e.key === 'ArrowDown') { e.preventDefault(); setStatusIndex(i => (i + 1) % count); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setStatusIndex(i => (i <= 0 ? count - 1 : i - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setStatusIndex(0); }
    else if (e.key === 'End') { e.preventDefault(); setStatusIndex(count - 1); }
    else if (e.key === 'Enter' && statusIndex >= 0) { e.preventDefault(); pickStatus(statusIndex === 0 ? '' : STATUS_OPTIONS[statusIndex - 1].value); }
  };

  const clearAll = () => {
    setFilters({ ...EMPTY_FILTERS });
    setSearchInput('');
    setDatePreset('CUSTOM');
    setPage(1);
  };

  const removeChip = (key: string) => {
    if (key === 'search') { setSearchInput(''); patch({ search: '' }); return; }
    if (key === 'date') { setDatePreset('CUSTOM'); patch({ from: '', to: '' }); return; }
    if (key === 'udate') { patch({ ufrom: '', uto: '' }); return; }
    if (key === 'createdBy') { patch({ createdBy: '' }); return; }
    if (key === 'rate') { patch({ min: '', max: '' }); return; }
    if (key.startsWith('usage-')) { patch({ usages: filters.usages.filter(u => u !== key.replace('usage-', '')) }); return; }
    patch({ [key]: '' } as Partial<Filters>);
  };

  const applyQuickRange = (key: string) => {
    const q = QUICK_RANGES.find(r => r.key === key);
    if (q) {
      const { from, to } = q.get();
      patch({ from, to });
    } else {
      patch({ from: '', to: '' });
    }
    setDatePreset(key);
    setOpenDropdown(null);
  };

  const exportCSV = () => {
    const rows = [['ID', 'Unit Name', 'Short Code', 'Category', 'Base Unit', 'Conversion Rate', 'Status']];
    units.forEach(u => rows.push([`#UNT${String(u.id).padStart(3, '0')}`, u.name, u.shortName || '', u.category || '', u.baseUnit || '', String(u.conversionRate ?? ''), u.archived ? 'Archived' : u.status ? 'Active' : 'Inactive']));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'units.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    setOpenDropdown(null);
  };

  const exportPDF = () => {
    window.print();
    setOpenDropdown(null);
  };

  const handleDeleted = async () => {
    if (!deleteUnit) return;
    try {
      await UnitsAPI.delete(deleteUnit.id);
      setDeleteUnit(null);
      fetchUnits();
    } catch (error) {
      console.error('Failed to delete unit:', error);
    }
  };

  const start = totalElements === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalElements);

  const inputCls = 'w-full h-10 px-3.5 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250';
  const labelCls = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5';
  const selectCls = (value: string) => `${inputCls} appearance-none pr-8 bg-no-repeat bg-[right_12px_center] ${value ? '' : 'text-gray-400'} bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%2212%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%2399a1af%22%20stroke-width=%222.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')]`;

  const headerFilterBtn = (active: boolean) =>
    `inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-medium transition-all duration-250 ${active
      ? 'border-[#0F9291]/40 bg-[#0F9291]/5 text-[#0F9291]'
      : 'border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]'}`;

  return (
    <div className="p-6 animate-fadeIn" onClick={() => { setOpenDropdown(null); setOpenMenuId(null); }}>
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-1.5 m-0 p-0 list-none text-sm">
            <li className="flex items-center gap-1.5">
              <a href="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 no-underline flex items-center gap-1.5">
                <House className="w-4 h-4" /> Dashboard
              </a>
              <span className="text-gray-300 dark:text-gray-600 mx-1">/</span>
            </li>
            <li className="text-gray-900 dark:text-[#F8FAFC] font-medium" aria-current="page">Units</li>
          </ol>
        </nav>
        <div className="flex items-center justify-end gap-2">
          <button onClick={fetchUnits} title="Refresh" className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1F2937] shadow-sm transition-all duration-250">
            <RotateCw className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen} title="Maximize" className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1F2937] shadow-sm transition-all duration-250">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { setEditUnit(null); setAddOpen(true); }}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-[#0F9291] text-white text-sm font-semibold shadow-sm hover:bg-teal-700 hover:shadow-md active:scale-95 transition-all duration-250"
          >
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>
      </div>

      {/* ── Card ── */}
      <div className="bg-white dark:bg-[#161B22] rounded-[0.85rem] border border-gray-200/70 dark:border-[#273244] shadow-[0_2px_10px_rgba(15,23,42,0.04)] dark:shadow-none">
        {/* Card header */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-[#273244] flex items-center justify-between gap-2 flex-wrap">
          <div className="inline-flex items-center flex-wrap gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search units..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="h-9 w-52 pl-9 pr-8 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250"
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(''); patch({ search: '' }); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category */}
            <div className="relative" ref={categoryRef} onKeyDown={onCategoryKeyDown}>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); openDropdown === 'category' ? setOpenDropdown(null) : openCategoryPopover(); }}
                className={headerFilterBtn(Boolean(filters.category))}
                aria-haspopup="listbox"
                aria-expanded={openDropdown === 'category'}
              >
                <Layers className="w-4 h-4" />
                <span className="max-w-28 truncate">{filters.category || 'Category'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'category' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'category' && (
                <div role="listbox" aria-label="Filter by category" className="absolute left-0 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] shadow-lg shadow-gray-200/50 dark:shadow-black/40 z-50 overflow-hidden animate-slideDown">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-[#273244] bg-gray-50/70 dark:bg-[#111827]/60">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Filter by Category</span>
                    {filters.category && (
                      <button onClick={() => pickCategory('')} className="text-[11px] font-semibold text-red-500 hover:underline">Clear</button>
                    )}
                  </div>
                  <div className="p-1.5 max-h-60 overflow-y-auto overscroll-contain">
                    <button
                      type="button"
                      role="option"
                      aria-selected={!filters.category}
                      onMouseEnter={() => setCatIndex(0)}
                      onClick={() => pickCategory('')}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${!filters.category ? 'text-[#0F9291] bg-[#0F9291]/5 font-medium' : catIndex === 0 ? 'bg-gray-50 dark:bg-[#1F2937] text-gray-700 dark:text-gray-200' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]'}`}
                    >
                      All Categories
                      {!filters.category && <CheckIcon />}
                    </button>
                    {allCategories.length === 0 ? (
                      <p className="px-3 py-4 text-xs text-center text-gray-400">No categories available</p>
                    ) : allCategories.map((c, i) => {
                      const idx = i + 1;
                      const selected = filters.category === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onMouseEnter={() => setCatIndex(idx)}
                          onClick={() => pickCategory(selected ? '' : c)}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${selected ? 'text-[#0F9291] bg-[#0F9291]/5 font-medium' : catIndex === idx ? 'bg-gray-50 dark:bg-[#1F2937] text-gray-700 dark:text-gray-200' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]'}`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${CATEGORY_DOTS[c] || 'bg-orange-400'}`} />
                            <span className="truncate">{c}</span>
                          </span>
                          {selected && <CheckIcon />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="relative" ref={statusRef} onKeyDown={onStatusKeyDown}>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); openDropdown === 'status' ? setOpenDropdown(null) : openStatusPopover(); }}
                className={headerFilterBtn(Boolean(filters.status))}
                aria-haspopup="listbox"
                aria-expanded={openDropdown === 'status'}
              >
                <span className={`w-2 h-2 rounded-full ${filters.status ? STATUS_OPTIONS.find(s => s.value === filters.status)?.dot || 'bg-[#0F9291]' : 'bg-gray-300 dark:bg-gray-600'}`} />
                <span className="max-w-24 truncate">{filters.status ? STATUS_OPTIONS.find(s => s.value === filters.status)?.label || filters.status : 'Status'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'status' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'status' && (
                <div role="listbox" aria-label="Filter by status" className="absolute left-0 mt-2 w-52 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] shadow-lg shadow-gray-200/50 dark:shadow-black/40 z-50 overflow-hidden animate-slideDown">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-[#273244] bg-gray-50/70 dark:bg-[#111827]/60">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Filter by Status</span>
                    {filters.status && (
                      <button onClick={() => pickStatus('')} className="text-[11px] font-semibold text-red-500 hover:underline">Clear</button>
                    )}
                  </div>
                  <div className="p-1.5 max-h-60 overflow-y-auto overscroll-contain">
                    <button
                      type="button"
                      role="option"
                      aria-selected={!filters.status}
                      onMouseEnter={() => setStatusIndex(0)}
                      onClick={() => pickStatus('')}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${!filters.status ? 'text-[#0F9291] bg-[#0F9291]/5 font-medium' : statusIndex === 0 ? 'bg-gray-50 dark:bg-[#1F2937] text-gray-700 dark:text-gray-200' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]'}`}
                    >
                      All Status
                      {!filters.status && <CheckIcon />}
                    </button>
                    {STATUS_OPTIONS.map((s, i) => {
                      const idx = i + 1;
                      const selected = filters.status === s.value;
                      return (
                        <button
                          key={s.value}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onMouseEnter={() => setStatusIndex(idx)}
                          onClick={() => pickStatus(selected ? '' : s.value)}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${selected ? 'text-[#0F9291] bg-[#0F9291]/5 font-medium' : statusIndex === idx ? 'bg-gray-50 dark:bg-[#1F2937] text-gray-700 dark:text-gray-200' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]'}`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                            <span className="truncate">{s.label}</span>
                          </span>
                          {selected && <CheckIcon />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Date range */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={e => { e.stopPropagation(); setOpenDropdown(openDropdown === 'date' ? null : 'date'); setOpenMenuId(null); }}
                className={headerFilterBtn(Boolean(filters.from || filters.to))}
              >
                <CalendarDays className="w-4 h-4" />
                <span>
                  {filters.from || filters.to
                    ? `${filters.from || '…'} - ${filters.to || '…'}`
                    : 'Date'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'date' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'date' && (
                <div className="absolute left-0 mt-2 w-80 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] shadow-lg shadow-gray-200/50 dark:shadow-black/40 z-50 overflow-hidden animate-slideDown">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-[#273244] bg-gray-50/70 dark:bg-[#111827]/60">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Created Date</span>
                    {(filters.from || filters.to) && (
                      <button onClick={() => applyQuickRange('CUSTOM')} className="text-[11px] font-semibold text-red-500 hover:underline">Clear</button>
                    )}
                  </div>
                  <div className="p-2 grid grid-cols-2 gap-1">
                    <button
                      onClick={() => applyQuickRange('CUSTOM')}
                      className={`col-span-2 flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!filters.from && !filters.to ? 'text-[#0F9291] bg-[#0F9291]/5 ring-1 ring-inset ring-[#0F9291]/20' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]'}`}
                    >
                      All Time
                      {!filters.from && !filters.to && <CheckIcon />}
                    </button>
                    {QUICK_RANGES.map(q => {
                      const active = datePreset === q.key;
                      return (
                        <button
                          key={q.key}
                          onClick={() => applyQuickRange(q.key)}
                          className={`flex items-center justify-between gap-1 px-3 py-2 rounded-lg text-[13px] transition-colors ${active ? 'text-[#0F9291] bg-[#0F9291]/5 ring-1 ring-inset ring-[#0F9291]/20 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]'}`}
                        >
                          <span className="truncate">{q.label}</span>
                          {active && <CheckIcon />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-gray-100 dark:border-[#273244] px-3.5 py-3 bg-gray-50/50 dark:bg-[#111827]/40">
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Custom Range</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">From</label>
                        <input
                          type="date"
                          value={filters.from}
                          onChange={e => { setDatePreset('CUSTOM'); patch({ from: e.target.value }); }}
                          className="w-full h-9 px-2.5 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#273244] rounded-lg outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 [color-scheme:light] dark:[color-scheme:dark]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">To</label>
                        <input
                          type="date"
                          value={filters.to}
                          onChange={e => { setDatePreset('CUSTOM'); patch({ to: e.target.value }); }}
                          className="w-full h-9 px-2.5 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#273244] rounded-lg outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 [color-scheme:light] dark:[color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Advanced filters */}
            <button onClick={() => { setDrawerOpen(true); setOpenDropdown(null); }} className={headerFilterBtn(hasFilters)}>
              <SlidersHorizontal className="w-4 h-4" /> Filters
              {hasFilters && <span className="w-5 h-5 rounded-full bg-[#0F9291] text-white text-[10px] font-bold flex items-center justify-center">{activeChips.length}</span>}
            </button>

            {/* Columns */}
            <div className="relative">
              <button onClick={e => { e.stopPropagation(); setOpenDropdown(openDropdown === 'columns' ? null : 'columns'); setOpenMenuId(null); }} className={headerFilterBtn(false)}>
                <Grid className="w-4 h-4" /> Columns <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'columns' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'columns' && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] shadow-lg shadow-gray-200/50 dark:shadow-black/40 z-50 overflow-hidden animate-slideDown">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-[#273244] bg-gray-50/70 dark:bg-[#111827]/60">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Visible Columns</span>
                    <div className="flex items-center gap-2.5">
                      <button onClick={() => setVisibleCols(Object.fromEntries(COLUMNS.map(c => [c.key, true])))} className="text-[11px] font-semibold text-[#0F9291] hover:underline">All</button>
                      <button onClick={() => setVisibleCols(Object.fromEntries(COLUMNS.map(c => [c.key, false])))} className="text-[11px] font-semibold text-gray-400 hover:text-red-500">None</button>
                    </div>
                  </div>
                  <div className="p-1.5 max-h-64 overflow-y-auto">
                    {COLUMNS.map(col => (
                      <label key={col.key} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={visibleCols[col.key]}
                          onChange={() => setVisibleCols(p => ({ ...p, [col.key]: !p[col.key] }))}
                          className="w-4 h-4 rounded border-gray-300 accent-[#0F9291]"
                        />
                        <span className="flex-1">{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sort by */}
            <div className="relative">
              <button onClick={e => { e.stopPropagation(); setOpenDropdown(openDropdown === 'sort' ? null : 'sort'); setOpenMenuId(null); }} className={headerFilterBtn(false)}>
                <SortDesc className="w-4 h-4" /> Sort by <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'sort' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'sort' && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] shadow-lg shadow-gray-200/50 dark:shadow-black/40 z-50 overflow-hidden animate-slideDown">
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-[#273244] bg-gray-50/70 dark:bg-[#111827]/60 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sort By</span>
                    <span className="text-[11px] text-gray-400">{SORT_OPTIONS.find(o => o.value === filters.sort)?.label}</span>
                  </div>
                  <div className="p-1.5 max-h-72 overflow-y-auto">
                    {SORT_OPTIONS.map(opt => {
                      const active = filters.sort === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => { patch({ sort: opt.value }); setOpenDropdown(null); }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'text-[#0F9291] bg-[#0F9291]/5 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]'}`}
                        >
                          {opt.label}
                          {active && <CheckIcon />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Export */}
            <div className="relative">
              <button onClick={e => { e.stopPropagation(); setOpenDropdown(openDropdown === 'export' ? null : 'export'); setOpenMenuId(null); }} className={headerFilterBtn(false)}>
                <Upload className="w-4 h-4" /> Export <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'export' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'export' && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] shadow-lg shadow-gray-200/50 dark:shadow-black/40 p-1.5 z-50 overflow-hidden animate-slideDown">
                  <button onClick={exportPDF} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors">
                    <Printer className="w-4 h-4 text-gray-400" /> Export as PDF
                  </button>
                  <button onClick={exportCSV} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors">
                    <FileSpreadsheet className="w-4 h-4 text-gray-400" /> Export as Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter chips */}
        {hasFilters && (
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-[#273244] bg-gray-50/60 dark:bg-[#111827]/40 flex items-center flex-wrap gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {activeChips.map(chip => (
              <span key={chip.key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-[#273244] text-xs font-medium text-gray-700 dark:text-gray-300">
                {chip.label}
                <button onClick={() => removeChip(chip.key)} className="text-gray-400 hover:text-red-500 transition-colors" aria-label={`Remove ${chip.label}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button onClick={clearAll} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
              <XCircle className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>
        )}

        {/* Result count */}
        <div className="px-4 pt-3 pb-0">
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            {filters.search
              ? <>Search Results: <span className="font-semibold text-gray-800 dark:text-gray-100">{totalElements}</span> Unit{filters.search ? (totalElements === 1 ? '' : 's') : 's'} Found</>
              : <>Showing <span className="font-semibold text-gray-800 dark:text-gray-100">{totalElements === 0 ? 0 : start}</span> - <span className="font-semibold text-gray-800 dark:text-gray-100">{end}</span> of <span className="font-semibold text-gray-800 dark:text-gray-100">{totalElements}</span> Units</>}
            {hasFilters && !filters.search && totalElements > 0 && <> &middot; <button onClick={clearAll} className="text-[#0F9291] hover:underline font-medium">Reset Filters</button></>}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#111827]">
              <tr>
                {COLUMNS.filter(c => visibleCols[c.key]).map(col => (
                  <th key={col.key} className="px-4 py-3 text-left text-[13px] font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap border-b border-gray-100 dark:border-[#273244]">{col.label}</th>
                ))}
                <th className="px-4 py-3 text-right text-[13px] font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap border-b border-gray-100 dark:border-[#273244]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-[#1F2937]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {COLUMNS.filter(c => visibleCols[c.key]).map(col => (
                      <td key={col.key} className="px-4 py-3.5">
                        <div className={`h-3.5 rounded-full bg-gray-100 dark:bg-[#1F2937] animate-pulse ${col.key === 'name' ? 'w-28' : col.key === 'id' ? 'w-14' : col.key === 'status' ? 'w-16' : 'w-20'}`} />
                      </td>
                    ))}
                    <td className="px-4 py-3.5">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#1F2937] animate-pulse ml-auto" />
                    </td>
                  </tr>
                ))
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.filter(c => visibleCols[c.key]).length + 1} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-[#1F2937] flex items-center justify-center">
                        {hasFilters ? <Archive className="w-6 h-6 text-gray-300 dark:text-gray-600" /> : <Info className="w-6 h-6 text-gray-300 dark:text-gray-600" />}
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{hasFilters ? 'No units match your filters' : 'No data found'}</p>
                        <p className="text-gray-400 dark:text-gray-600 text-xs mt-0.5">
                          {hasFilters ? 'Try adjusting or clearing your filters' : 'Click "Add New" to create a unit'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {hasFilters && (
                          <button onClick={clearAll} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-gray-200 dark:border-[#273244] text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all">
                            <RotateCw className="w-4 h-4" /> Reset Filters
                          </button>
                        )}
                        <button onClick={() => { setEditUnit(null); setAddOpen(true); }} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[#0F9291] text-white text-sm font-semibold hover:bg-teal-700 transition-all">
                          <Plus className="w-4 h-4" /> Create Unit
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                units.map(unit => (
                  <tr key={unit.id} className="hover:bg-gray-50/60 dark:hover:bg-[#1F2937]/50 transition-colors duration-200">
                    {visibleCols.id && <td className="px-4 py-3 whitespace-nowrap"><a className="text-[#0F9291] font-medium text-sm no-underline">#UNT{String(unit.id).padStart(3, '0')}</a></td>}
                    {visibleCols.name && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-[#F8FAFC]">{unit.name}</span>
                        {unit.symbol && <span className="ml-1.5 text-xs text-gray-400">({unit.symbol})</span>}
                      </td>
                    )}
                    {visibleCols.shortCode && <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{unit.shortName || '-'}</td>}
                    {visibleCols.category && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={badgeSoft(CATEGORY_BADGE[unit.category || ''] || CATEGORY_BADGE.Other, false)}>{unit.category || '-'}</span>
                      </td>
                    )}
                    {visibleCols.baseUnit && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={badgeSoft('bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400')}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {unit.baseUnit || 'Self'}
                        </span>
                      </td>
                    )}
                    {visibleCols.conversionRate && <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{String(unit.conversionRate ?? '1')}</td>}
                    {visibleCols.status && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        {unit.archived ? (
                          <span className={badgeSoft('bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400')}>
                            <Archive className="w-3 h-3" /> Archived
                          </span>
                        ) : (
                          <span className={badgeSoft(unit.status ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400')}>
                            <span className={`w-1.5 h-1.5 rounded-full ${unit.status ? 'bg-emerald-500' : 'bg-red-500'}`} /> {unit.status ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block" ref={menuRef}>
                        <button
                          onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === unit.id ? null : unit.id); setOpenDropdown(null); }}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors"
                          aria-label="Actions"
                        >
                          <EllipsisVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === unit.id && (
                          <div className="absolute right-0 mt-1 w-40 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] shadow-lg shadow-gray-200/50 dark:shadow-black/40 p-1.5 z-50 text-left">
                            <button
                              onClick={e => { e.stopPropagation(); setOpenMenuId(null); setEditUnit(unit); }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); setOpenMenuId(null); setDeleteUnit(unit); }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
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

        {/* Table footer / pagination */}
        <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-t border-gray-100 dark:border-[#273244]">
          <span className="text-[13px] text-gray-500 dark:text-gray-400">
            Showing {start} - {end} of {totalElements} Units
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="h-8 px-3 rounded-lg border border-gray-200 dark:border-[#273244] text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-[#161B22] hover:bg-gray-50 dark:hover:bg-[#1F2937] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                disabled={isLoading}
                className={`h-8 min-w-8 px-2 rounded-lg text-xs font-medium transition-all ${page === i + 1 ? 'bg-[#0F9291] text-white' : 'border border-gray-200 dark:border-[#273244] text-gray-600 dark:text-gray-300 bg-white dark:bg-[#161B22] hover:bg-gray-50 dark:hover:bg-[#1F2937]'}`}
              >
                {i + 1}
              </button>
            ))}
            {totalPages > 5 && <span className="text-xs text-gray-400 px-0.5">…</span>}
            <span className="text-xs text-gray-500 dark:text-gray-400 px-1">Page {page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="h-8 px-3 rounded-lg border border-gray-200 dark:border-[#273244] text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-[#161B22] hover:bg-gray-50 dark:hover:bg-[#1F2937] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── Advanced Filter Drawer ── */}
      <div className={`fixed inset-0 z-50 ${drawerOpen ? '' : 'pointer-events-none'}`} aria-hidden={!drawerOpen}>
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 right-0 w-[380px] max-w-full bg-white dark:bg-[#161B22] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#273244]">
            <h4 className="flex items-center gap-2.5 text-base font-semibold text-gray-900 dark:text-[#F8FAFC] m-0">
              <span className="w-8 h-8 rounded-full bg-[#0F9291]/10 text-[#0F9291] flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4" />
              </span>
              Advanced Filters
            </h4>
            <button onClick={() => setDrawerOpen(false)} className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Category */}
            <div>
              <label className={labelCls}>Category</label>
              <select value={filters.category} onChange={e => patch({ category: e.target.value })} className={`${selectCls(filters.category)} w-full`}>
                <option value="">All Categories</option>
                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className={labelCls}>Status</label>
              <select value={filters.status} onChange={e => patch({ status: e.target.value })} className={`${selectCls(filters.status)} w-full`}>
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Measurement system */}
            <div>
              <label className={labelCls}>Measurement System</label>
              <select value={filters.measurementSystem} onChange={e => patch({ measurementSystem: e.target.value })} className={`${selectCls(filters.measurementSystem)} w-full`}>
                <option value="">All Systems</option>
                {MEASUREMENT_OPTIONS.map(m => <option key={m} value={m}>{MEASUREMENT_LABELS[m] || m}</option>)}
              </select>
            </div>

            {/* Base unit */}
            <div>
              <label className={labelCls}>Base Unit</label>
              <select value={filters.baseUnit} onChange={e => patch({ baseUnit: e.target.value })} className={`${selectCls(filters.baseUnit)} w-full`}>
                <option value="">All Base Units</option>
                {[...new Set(units.map(u => u.baseUnit).filter(Boolean) as string[])].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Usage */}
            <div>
              <label className={`${labelCls} mb-2`}>Used In</label>
              <div className="grid grid-cols-1 gap-1.5">
                {USAGE_OPTIONS.map(opt => {
                  const checked = filters.usages.includes(opt.key);
                  return (
                    <label key={opt.key} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all duration-200 ${checked ? 'border-[#0F9291]/40 bg-[#0F9291]/5 text-[#0F9291]' : 'border-gray-200 dark:border-[#273244] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => patch({ usages: checked ? filters.usages.filter(u => u !== opt.key) : [...filters.usages, opt.key] })}
                        className="w-4 h-4 rounded border-gray-300 accent-[#0F9291]"
                      />
                      <Layers className="w-4 h-4 opacity-60" /> {opt.label}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Created date */}
            <div>
              <label className={labelCls}>Created Date</label>
              <div className="flex items-center gap-1.5">
                <input type="date" value={filters.from} onChange={e => { setDatePreset('CUSTOM'); patch({ from: e.target.value }); }} className="w-full h-9 px-2.5 text-xs border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] text-gray-600 dark:text-gray-300 [color-scheme:light] dark:[color-scheme:dark]" />
                <span className="text-gray-300 dark:text-gray-600">-</span>
                <input type="date" value={filters.to} onChange={e => { setDatePreset('CUSTOM'); patch({ to: e.target.value }); }} className="w-full h-9 px-2.5 text-xs border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] text-gray-600 dark:text-gray-300 [color-scheme:light] dark:[color-scheme:dark]" />
              </div>
            </div>

            {/* Updated date */}
            <div>
              <label className={labelCls}>Updated Date</label>
              <div className="flex items-center gap-1.5">
                <input type="date" value={filters.ufrom} onChange={e => patch({ ufrom: e.target.value })} className="w-full h-9 px-2.5 text-xs border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] text-gray-600 dark:text-gray-300 [color-scheme:light] dark:[color-scheme:dark]" />
                <span className="text-gray-300 dark:text-gray-600">-</span>
                <input type="date" value={filters.uto} onChange={e => patch({ uto: e.target.value })} className="w-full h-9 px-2.5 text-xs border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] text-gray-600 dark:text-gray-300 [color-scheme:light] dark:[color-scheme:dark]" />
              </div>
            </div>

            {/* Created by */}
            <div>
              <label className={labelCls}>Created By</label>
              <input type="text" placeholder="e.g. admin" value={filters.createdBy} onChange={e => patch({ createdBy: e.target.value })} className={`${inputCls} w-full`} />
            </div>

            {/* Conversion rate range */}
            <div>
              <label className={labelCls}>Conversion Rate</label>
              <div className="flex items-center gap-1.5">
                <input type="number" min="0" step="any" placeholder="Min" value={filters.min} onChange={e => patch({ min: e.target.value })} className={`${inputCls} w-full`} />
                <span className="text-gray-300 dark:text-gray-600">-</span>
                <input type="number" min="0" step="any" placeholder="Max" value={filters.max} onChange={e => patch({ max: e.target.value })} className={`${inputCls} w-full`} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-gray-100 dark:border-[#273244]">
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-gray-200 dark:border-[#273244] bg-gray-50 dark:bg-[#1F2937] text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-[#273244] transition-all"
            >
              <RotateCw className="w-4 h-4" /> Reset All
            </button>
            <button
              onClick={() => setDrawerOpen(false)}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-[#0F9291] text-white text-sm font-semibold shadow-sm hover:bg-teal-700 hover:shadow-md active:scale-95 transition-all duration-250"
            >
              <CheckIcon /> Apply Filters
            </button>
          </div>
        </aside>
      </div>

      {/* ── Add / Edit Enterprise Global Dialog ── */}
      <AddUnitDialog
        open={addOpen || Boolean(editUnit)}
        unit={editUnit}
        existingUnits={units}
        onClose={() => { setAddOpen(false); setEditUnit(null); }}
        onSaved={() => { fetchUnits(); setAddOpen(false); setEditUnit(null); }}
      />

      {/* ── Delete Confirmation (Global Modal) ── */}
      <GlobalConfirmModal
        open={Boolean(deleteUnit)}
        title="Delete Confirmation"
        message={<>Are you sure you want to delete <strong>&ldquo;{deleteUnit?.name}&rdquo;</strong>? This action cannot be undone.</>}
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleted}
        onClose={() => setDeleteUnit(null)}
      />
    </div>
  );
}

function CheckIcon() {
  return (
    <span className="w-4 h-4 rounded-full bg-[#0F9291] text-white flex items-center justify-center shrink-0">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
    </span>
  );
}
