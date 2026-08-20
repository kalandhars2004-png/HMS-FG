'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Category } from '@/types';
import { CategoriesAPI, ProductsAPI, RacksAPI } from '@/lib/api';
import {
  Search, Plus, RotateCw, Maximize, X, Edit2, Trash2,
  ChevronDown, ChevronUp, ChevronRight, Download, Printer, FileSpreadsheet,
  FolderOpen, CheckCircle, XCircle, AlertTriangle, Check,
  Columns, House, FolderTree, MoreVertical, ArrowUpDown, ArrowUpToLine,
} from '@/components/ui/LucideIcon';
import GlobalModal, { modalInputCls, modalSelectCls, modalLabelCls, modalHintCls, GlobalConfirmModal } from '@/components/ui/GlobalModal';
import DropdownMenu from '@/components/ui/DropdownMenu';
import { toCSV, toXLSX, downloadBlob, printReport, type Column } from '@/lib/export';

interface ToastItem { id: string; type: 'success' | 'error'; message: string; }

interface SortConfig { key: string; direction: 'asc' | 'desc'; }

interface ColumnDef { key: string; label: string; visible: boolean; sortable: boolean; }

const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: 'code', label: 'Category ID', visible: true, sortable: true },
  { key: 'name', label: 'Category', visible: true, sortable: true },
  { key: 'description', label: 'Description', visible: true, sortable: false },
  { key: 'items', label: 'No of Items', visible: true, sortable: true },
  { key: 'storage', label: 'Storage Type', visible: true, sortable: true },
  { key: 'parent', label: 'Parent Category', visible: false, sortable: true },
  { key: 'displayOrder', label: 'Order', visible: false, sortable: true },
  { key: 'createdAt', label: 'Created Date', visible: false, sortable: true },
];

const SORT_OPTIONS: { key: string; label: string; direction: 'asc' | 'desc' }[] = [
  { key: 'createdAt', label: 'Recently Added', direction: 'desc' },
  { key: 'name', label: 'Category (A–Z)', direction: 'asc' },
  { key: 'name', label: 'Category (Z–A)', direction: 'desc' },
  { key: 'items', label: 'Most Items', direction: 'desc' },
  { key: 'items', label: 'Fewest Items', direction: 'asc' },
];

/** Rack temperature codes are stored as enum-ish strings; show them in plain English. */
const STORAGE_LABELS: Record<string, string> = {
  ROOM_TEMP: 'Room Temp',
  COOL_DRY: 'Cool & Dry',
  REFRIGERATED: 'Refrigerated',
  FROZEN: 'Frozen',
  CONTROLLED: 'Controlled',
};

const storageLabel = (raw?: string) => {
  if (!raw) return '';
  return STORAGE_LABELS[raw] ?? raw.replace(/_/g, ' ').toLowerCase()
    .replace(/\b\w/g, ch => ch.toUpperCase());
};

function generateSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function ToastContainer({ items, onRemove }: { items: ToastItem[]; onRemove: (id: string) => void }) {
  if (!items.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {items.map(t => (
        <div key={t.id} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-slideUp ${t.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {t.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {t.message}
          <button onClick={() => onRemove(t.id)} className="ml-2 opacity-70 hover:opacity-100 p-0.5"><X className="w-3.5 h-3.5" /></button>
        </div>
      ))}
    </div>
  );
}

/**
 * Row menu. Rendered through the portal-based DropdownMenu because the table
 * sits in an `overflow-x-auto` wrapper, which clips an absolutely positioned
 * menu vertically no matter what z-index it carries.
 */
function RowActions({ category, onEdit, onDelete, onToggle }: {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  // A ref per row — a single shared ref would anchor every menu to the last row.
  const btnRef = useRef<HTMLButtonElement>(null);

  const item = 'flex items-center gap-2.5 w-full px-4 py-2.5 text-[14px] transition-colors';

  return (
    <>
      <button ref={btnRef} onClick={() => setOpen(v => !v)} aria-label="Row actions"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-[#1F2937] transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>
      <DropdownMenu open={open} onClose={() => setOpen(false)} anchorEl={btnRef.current} width={190}>
        <button onClick={() => { setOpen(false); onEdit(); }}
          className={`${item} text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]`}>
          <Edit2 className="w-4 h-4 text-gray-400" /> Edit Category
        </button>
        <button onClick={() => { setOpen(false); onToggle(); }}
          className={`${item} text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]`}>
          {category.status
            ? <><XCircle className="w-4 h-4 text-gray-400" /> Deactivate</>
            : <><CheckCircle className="w-4 h-4 text-emerald-500" /> Activate</>}
        </button>
        <div className="border-t border-gray-100 dark:border-[#273244] my-1" />
        <button onClick={() => { setOpen(false); onDelete(); }}
          className={`${item} text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20`}>
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </DropdownMenu>
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-gray-50">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
          <div className="w-4 h-4 bg-gray-200 rounded shrink-0" />
          <div className="w-10 h-10 bg-gray-200 rounded-xl shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-200 rounded w-32" />
            <div className="h-3 bg-gray-200 rounded w-20" />
          </div>
          <div className="h-3.5 bg-gray-200 rounded w-16" />
          <div className="h-3.5 bg-gray-200 rounded w-36 hidden md:block" />
          <div className="h-3.5 bg-gray-200 rounded w-24 hidden lg:block" />
          <div className="h-3.5 bg-gray-200 rounded w-12 hidden lg:block" />
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-3.5 bg-gray-200 rounded w-28 hidden xl:block" />
          <div className="flex gap-1"><div className="w-7 h-7 bg-gray-200 rounded-lg" /><div className="w-7 h-7 bg-gray-200 rounded-lg" /></div>
        </div>
      ))}
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [racks, setRacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColumnDef[]>(DEFAULT_COLUMNS);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  /** Shared pill style for the three toolbar dropdowns. */
  const toolBtn = 'inline-flex items-center gap-2 h-11 px-4 rounded-full border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-[15px] font-medium text-gray-700 dark:text-gray-200 hover:border-[#0F9291]/40 transition-colors';

  useEffect(() => { loadItems(); }, []);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpenDropdown(d => d === 'bulk' ? null : d);
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setOpenDropdown(d => d === 'export' ? null : d);
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) setOpenDropdown(d => d === 'columns' ? null : d);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setOpenDropdown(d => d === 'sort' ? null : d);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Item counts and storage type are not columns on Category — they are
      // derived from the products filed under it and the racks tagged with it.
      const [cats, prods, racks] = await Promise.all([
        CategoriesAPI.getAll(),
        ProductsAPI.getAll().catch(() => ({ data: [] })),
        RacksAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setCategories(cats.data);
      setProducts(prods.data || []);
      setRacks(racks.data || []);
    } catch {
      setError('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Products filed under each category, counted by the category name they carry. */
  const itemCounts = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p: any) => {
      const k = (p.categoryName || '').trim();
      if (k) map.set(k, (map.get(k) || 0) + 1);
    });
    return map;
  }, [products]);

  /** Racks are tagged with a category name and carry the temperature they hold at. */
  const storageTypes = useMemo(() => {
    const map = new Map<string, string[]>();
    racks.forEach((r: any) => {
      const k = (r.category || '').trim();
      const t = storageLabel(r.temperature);
      if (!k || !t) return;
      const list = map.get(k) || [];
      if (!list.includes(t)) list.push(t);
      map.set(k, list);
    });
    return map;
  }, [racks]);

  const storageFor = useCallback(
    (name: string) => (storageTypes.get(name) || []).join(', '),
    [storageTypes],
  );

  const parentMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach(c => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const processedCategories = useMemo(() => {
    let result = [...categories];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.slug && c.slug.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }
    if (sortConfig) {
      // Two columns are computed rather than stored, so they need their own reads.
      const read = (c: Category) => {
        if (sortConfig.key === 'items') return itemCounts.get(c.name) || 0;
        if (sortConfig.key === 'storage') return storageFor(c.name);
        return c[sortConfig.key as keyof Category];
      };
      result.sort((a, b) => {
        const aVal = read(a);
        const bVal = read(b);
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [categories, debouncedSearch, sortConfig, itemCounts, storageFor]);

  const totalPages = Math.ceil(processedCategories.length / perPage);
  const paginatedCategories = useMemo(() => {
    const start = (page - 1) * perPage;
    return processedCategories.slice(start, start + perPage);
  }, [processedCategories, page, perPage]);

  const allSelected = paginatedCategories.length > 0 && paginatedCategories.every(c => selectedIds.has(c.id));

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      return { key, direction: 'asc' };
    });
    setPage(1);
  }, []);

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedCategories.map(c => c.id)));
    }
  }, [allSelected, paginatedCategories]);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleStatus = useCallback(async (category: Category) => {
    try {
      await CategoriesAPI.update(category.id, { ...category, status: !category.status });
      setCategories(prev => prev.map(c => c.id === category.id ? { ...c, status: !c.status } : c));
      addToast('success', `Category ${category.status ? 'deactivated' : 'activated'}`);
    } catch {
      addToast('error', 'Failed to update status');
    }
  }, [addToast]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await CategoriesAPI.delete(deleteTarget.id);
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
      setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteTarget.id); return n; });
      addToast('success', `"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch {
      addToast('error', 'Failed to delete category');
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, addToast]);

  const handleBulkConfirm = useCallback(async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    setSaving(true);
    const ids = Array.from(selectedIds);
    try {
      if (bulkAction === 'delete') {
        await Promise.all(ids.map(id => CategoriesAPI.delete(id)));
        setCategories(prev => prev.filter(c => !selectedIds.has(c.id)));
        addToast('success', `${ids.length} categories deleted`);
      } else {
        const status = bulkAction === 'activate';
        await Promise.all(ids.map(id => CategoriesAPI.update(id, { status })));
        setCategories(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, status } : c));
        addToast('success', `${ids.length} categories ${status ? 'activated' : 'deactivated'}`);
      }
      setSelectedIds(new Set());
      setBulkAction(null);
    } catch {
      addToast('error', `Failed to ${bulkAction} categories`);
    } finally {
      setSaving(false);
    }
  }, [bulkAction, selectedIds, addToast]);

  /** Exports what is on screen — current search and sort, not the raw table. */
  const exportAs = useCallback((fmt: 'csv' | 'excel' | 'pdf') => {
    setOpenDropdown(null);
    const cols: Column<Category>[] = [
      { header: 'Category ID', value: c => c.code || c.slug || String(c.id) },
      { header: 'Category', value: c => c.name },
      { header: 'Description', value: c => c.description || '' },
      { header: 'No of Items', value: c => itemCounts.get(c.name) || 0 },
      { header: 'Storage Type', value: c => storageFor(c.name) || 'Not set' },
      { header: 'Status', value: c => (c.status ? 'Active' : 'Inactive') },
      { header: 'Created', value: c => formatDate(c.createdAt) },
    ];
    const stamp = new Date().toISOString().slice(0, 10);
    if (fmt === 'csv') downloadBlob(toCSV(cols, processedCategories), `categories_${stamp}.csv`);
    else if (fmt === 'excel') downloadBlob(toXLSX('Categories', cols, processedCategories), `categories_${stamp}.xlsx`);
    else printReport('Categories', `${processedCategories.length} records · ${stamp}`, cols, processedCategories);
    if (fmt !== 'pdf') addToast('success', `Exported ${processedCategories.length} categories`);
  }, [processedCategories, itemCounts, storageFor, addToast]);

  const toggleColumn = useCallback((key: string) => {
    setColumnDefs(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  }, []);

  const visibleColumns = useMemo(() => columnDefs.filter(c => c.visible), [columnDefs]);

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ChevronDown className="w-3 h-3 text-gray-300" />;
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-3 h-3 text-[#0F9291]" />
      : <ChevronDown className="w-3 h-3 text-[#0F9291]" />;
  };

  return (
    <div className={expanded
      ? 'fixed inset-0 z-[200] p-6 bg-[#F5F6FA] dark:bg-[#0B0F16] overflow-y-auto ims-scroll'
      : 'p-6 animate-fadeIn'}>
      <h1 className="text-[26px] font-bold text-gray-900 dark:text-white leading-tight mb-4">Categories</h1>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-2 m-0 p-0 list-none text-[15px]">
            <li className="flex items-center gap-2">
              <a href="/dashboard" className="text-gray-500 hover:text-[#0F9291] no-underline flex items-center gap-2 transition-colors">
                <span className="w-7 h-7 rounded-lg bg-[#0F9291]/10 flex items-center justify-center">
                  <House className="w-4 h-4 text-[#0F9291]" />
                </span>
                Dashboard
              </a>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </li>
            <li className="text-gray-900 dark:text-white font-medium" aria-current="page">Categories List</li>
          </ol>
        </nav>
        <div className="flex items-center gap-2.5">
          <button onClick={loadItems} title="Refresh"
            className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 hover:text-[#0F9291] hover:border-[#0F9291]/40 transition-colors">
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setExpanded(v => !v)} title={expanded ? 'Exit full screen' : 'Full screen'}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 hover:text-[#0F9291] hover:border-[#0F9291]/40 transition-colors">
            <Maximize className="w-4 h-4" />
          </button>
          <button onClick={() => { setEditingCategory(null); setShowModal(true); }}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-white font-semibold text-[15px] hover:opacity-90 transition-opacity active:scale-[0.98]"
            style={{ background: 'linear-gradient(103.28deg,#0EA5A4 0%,#175780 100%)' }}>
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="px-4 py-3.5 border-b border-gray-100 dark:border-[#273244]">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="Search categories"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                  className="w-[230px] h-11 pl-10 pr-3 text-[15px] rounded-full border border-gray-200 dark:border-[#273244] dark:bg-[#111827] focus:outline-none focus:border-[#0F9291] transition-colors"
                />
              </div>
              {selectedIds.size > 0 && (
                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setOpenDropdown(o => o === 'bulk' ? null : 'bulk')} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-250">
                    Bulk Actions ({selectedIds.size}) <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {openDropdown === 'bulk' && (
                    <div className="absolute left-0 top-full mt-1 z-50 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden">
                      <button onClick={() => { setBulkAction('activate'); setOpenDropdown(null); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50"><CheckCircle className="w-4 h-4" /> Activate</button>
                      <button onClick={() => { setBulkAction('deactivate'); setOpenDropdown(null); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-700 hover:bg-red-50"><XCircle className="w-4 h-4" /> Deactivate</button>
                      <div className="border-t border-gray-100 my-1" />
                      <button onClick={() => { setBulkAction('delete'); setOpenDropdown(null); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /> Delete</button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative" ref={columnsRef}>
                <button onClick={() => setOpenDropdown(o => o === 'columns' ? null : 'columns')} className={toolBtn}>
                  <Columns className="w-4 h-4 text-gray-400" /> Columns <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
                {openDropdown === 'columns' && (
                  <div className="absolute right-0 top-full mt-1.5 z-50 w-56 bg-white dark:bg-[#161B22] rounded-xl shadow-lg border border-gray-100 dark:border-[#273244] py-3 px-4 space-y-2">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Toggle Columns</p>
                    {columnDefs.map(col => (
                      <label key={col.key} className="flex items-center gap-2 text-[14px] text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                        <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.key)}
                          className="rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291] focus:ring-offset-0" />
                        {col.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative" ref={sortRef}>
                <button onClick={() => setOpenDropdown(o => o === 'sort' ? null : 'sort')} className={toolBtn}>
                  <ArrowUpDown className="w-4 h-4 text-gray-400" /> Sort by <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
                {openDropdown === 'sort' && (
                  <div className="absolute right-0 top-full mt-1.5 z-50 w-52 bg-white dark:bg-[#161B22] rounded-xl shadow-lg border border-gray-100 dark:border-[#273244] py-1.5 overflow-hidden">
                    {SORT_OPTIONS.map(opt => {
                      const active = sortConfig?.key === opt.key && sortConfig.direction === opt.direction;
                      return (
                        <button key={opt.label}
                          onClick={() => { setSortConfig({ key: opt.key, direction: opt.direction }); setPage(1); setOpenDropdown(null); }}
                          className={`flex items-center justify-between w-full px-4 py-2.5 text-[14px] transition-colors ${
                            active ? 'text-[#0F9291] font-semibold bg-[#0F9291]/[0.06]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]'}`}>
                          {opt.label}
                          {active && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="relative" ref={exportRef}>
                <button onClick={() => setOpenDropdown(o => o === 'export' ? null : 'export')} className={toolBtn}>
                  <ArrowUpToLine className="w-4 h-4 text-gray-400" /> Export <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
                {openDropdown === 'export' && (
                  <div className="absolute right-0 top-full mt-1.5 z-50 w-44 bg-white dark:bg-[#161B22] rounded-xl shadow-lg border border-gray-100 dark:border-[#273244] py-1.5 overflow-hidden">
                    <button onClick={() => exportAs('excel')} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[14px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel (.xlsx)
                    </button>
                    <button onClick={() => exportAs('csv')} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[14px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]">
                      <Download className="w-4 h-4 text-blue-600" /> CSV (.csv)
                    </button>
                    <button onClick={() => exportAs('pdf')} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[14px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]">
                      <Printer className="w-4 h-4 text-gray-500" /> PDF (print)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-gray-500 text-sm mb-3">{error}</p>
            <button onClick={loadItems} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0F9291] hover:bg-teal-700 rounded-xl transition-all duration-250">Retry</button>
          </div>
        ) : processedCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="w-14 h-14 text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm font-medium mb-1">No categories found</p>
            <p className="text-gray-300 text-xs mb-4">
              {debouncedSearch ? 'Try a different search term' : 'Create your first category to get started'}
            </p>
            {!debouncedSearch && (
              <button onClick={() => { setEditingCategory(null); setShowModal(true); }} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0F9291] hover:bg-teal-700 rounded-xl transition-all duration-250">
                <Plus className="w-4 h-4" /> Create Category
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F9FB] dark:bg-[#161B22] border-y border-gray-100 dark:border-[#273244]">
                  <th className="px-4 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291] focus:ring-offset-0 cursor-pointer"
                    />
                  </th>
                  {visibleColumns.map(col => (
                    <th key={col.key} className={`px-4 py-4 text-left text-[15px] font-semibold whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none' : ''} ${sortConfig?.key === col.key ? 'text-[#0F9291]' : 'text-gray-700 dark:text-gray-200'}`} onClick={() => col.sortable && handleSort(col.key)}><span className="flex items-center gap-1">{col.label} {col.sortable && getSortIcon(col.key)}</span></th>
                  ))}
                  <th className="px-4 py-4 text-left text-[15px] font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">Status</th>
                  <th className="px-4 py-4 text-right text-[15px] font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#273244]">
                {paginatedCategories.map(category => (
                  <tr key={category.id} className="hover:bg-[#F8F9FB] dark:hover:bg-[#161B22] transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(category.id)}
                        onChange={() => handleSelectOne(category.id)}
                        className="rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291] focus:ring-offset-0 cursor-pointer"
                      />
                    </td>
                    {visibleColumns.map(col => {
                      if (col.key === 'code') return (
                        <td key={col.key} className="px-4 py-4 whitespace-nowrap">
                          <button onClick={() => { setEditingCategory(category); setShowModal(true); }}
                            className="text-[15px] font-medium text-[#4B5AED] hover:underline">
                            #{category.code || category.slug || category.id}
                          </button>
                        </td>
                      );
                      if (col.key === 'name') return (
                        <td key={col.key} className="px-4 py-4 whitespace-nowrap">
                          <span className="flex items-center gap-3">
                            {category.icon && (
                              <span className="flex items-center justify-center w-9 h-9 rounded-xl text-base shrink-0"
                                style={{ backgroundColor: category.color ? `${category.color}20` : '#f3f4f6', color: category.color || '#6b7280' }}>
                                {category.icon}
                              </span>
                            )}
                            <span className="text-[15px] font-semibold text-gray-900 dark:text-white">{category.name}</span>
                          </span>
                        </td>
                      );
                      if (col.key === 'description') return <td key={col.key} className="px-4 py-4 text-[15px] text-gray-500 dark:text-gray-400 max-w-[280px] truncate" title={category.description || ''}>{category.description || '—'}</td>;
                      if (col.key === 'items') {
                        const n = itemCounts.get(category.name) || 0;
                        return <td key={col.key} className="px-4 py-4 whitespace-nowrap text-[15px] text-gray-600 dark:text-gray-300 tabular-nums">{n}</td>;
                      }
                      if (col.key === 'storage') {
                        const s = storageFor(category.name);
                        return (
                          <td key={col.key} className="px-4 py-4 whitespace-nowrap text-[15px] text-gray-600 dark:text-gray-300">
                            {s || <span className="text-gray-300 dark:text-gray-600">Not set</span>}
                          </td>
                        );
                      }
                      if (col.key === 'parent') {
                        const parentName = category.parentId ? parentMap.get(category.parentId) : null;
                        return <td key={col.key} className="px-4 py-4 whitespace-nowrap text-[15px] text-gray-500">{parentName || '—'}</td>;
                      }
                      if (col.key === 'displayOrder') return <td key={col.key} className="px-4 py-4 whitespace-nowrap text-[15px] text-gray-500 tabular-nums">{category.displayOrder ?? '—'}</td>;
                      if (col.key === 'createdAt') return <td key={col.key} className="px-4 py-4 whitespace-nowrap text-[15px] text-gray-500">{formatDate(category.createdAt)}</td>;
                      return <td key={col.key} className="px-4 py-4 text-[15px] text-gray-500">—</td>;
                    })}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {/* Click to toggle — the pill is the control, as in the reference */}
                      <button onClick={() => handleToggleStatus(category)}
                        title={category.status ? 'Click to deactivate' : 'Click to activate'}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[14px] font-medium transition-colors ${
                          category.status
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/25 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-[#1F2937] dark:text-gray-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${category.status ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        {category.status ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <RowActions
                        category={category}
                        onEdit={() => { setEditingCategory(category); setShowModal(true); }}
                        onDelete={() => setDeleteTarget(category)}
                        onToggle={() => handleToggleStatus(category)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && processedCategories.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Rows per page:</span>
              <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="text-xs rounded-xl border border-gray-200 px-2 py-1.5 appearance-none cursor-pointer focus:outline-none focus:border-[#0F9291]">
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{(page - 1) * perPage + 1}-{Math.min(page * perPage, processedCategories.length)} of {processedCategories.length}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1} className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-250 text-xs font-medium">First</button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-250"><ChevronDown className="w-3.5 h-3.5 rotate-90" /></button>
                {(() => { const pages:(number|string)[]=[];const s=Math.max(1,page-1),e=Math.min(totalPages,page+1);if(s>1){pages.push(1);if(s>2)pages.push('...');}for(let i=s;i<=e;i++)pages.push(i);if(e<totalPages){if(e<totalPages-1)pages.push('...');pages.push(totalPages);}return pages.map((p,i)=>typeof p==='string'?<span key={`e${i}`} className="px-1 text-xs text-gray-400">{p}</span>:<button key={p} onClick={()=>setPage(p)} className={`flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-medium transition-all duration-250 ${page===p?'bg-[#0F9291] text-white':'text-gray-500 hover:bg-gray-100'}`}>{p}</button>);})()}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-250"><ChevronDown className="w-3.5 h-3.5 -rotate-90" /></button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-250 text-xs font-medium">Last</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <CategoryModal
          category={editingCategory}
          categories={categories}
          onClose={() => setShowModal(false)}
          onSave={() => { loadItems(); setShowModal(false); }}
          addToast={addToast}
        />
      )}

      {(deleteTarget || bulkAction) && (
        <ConfirmModal
          deleteTarget={deleteTarget}
          bulkAction={bulkAction}
          bulkCount={selectedIds.size}
          saving={saving}
          onCancel={() => { setDeleteTarget(null); setBulkAction(null); }}
          onConfirm={deleteTarget ? handleDelete : handleBulkConfirm}
        />
      )}

      <ToastContainer items={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
}

function CategoryModal({
  category, categories, onClose, onSave, addToast,
}: {
  category: Category | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
  addToast: (type: 'success' | 'error', message: string) => void;
}) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    icon: category?.icon || '',
    color: category?.color || '',
    displayOrder: category?.displayOrder ?? 0,
    parentId: category?.parentId || '',
    status: category?.status ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parentOptions = useMemo(() => categories.filter(c => c.id !== category?.id), [categories, category]);

  const handleNameChange = (name: string) => {
    const clean = name.replace(/^\s+/, '');
    setFormData(prev => ({
      ...prev,
      name: name,
      slug: prev.slug === generateSlug(prev.name) ? generateSlug(clean) : prev.slug,
    }));
    if (errors.name) setErrors(prev => { const { name, ...rest } = prev; return rest; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setErrors({ name: 'Category name is required' });
      return;
    }
    const payload = {
      ...formData,
      name: trimmedName,
      slug: formData.slug.trim() || generateSlug(trimmedName),
      parentId: formData.parentId || undefined,
    };
    setSaving(true);
    try {
      if (category) {
        await CategoriesAPI.update(category.id, payload);
        addToast('success', `"${trimmedName}" updated`);
      } else {
        await CategoriesAPI.create(payload);
        addToast('success', `"${trimmedName}" created`);
      }
      onSave();
    } catch {
      addToast('error', `Failed to ${category ? 'update' : 'create'} category`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlobalModal
      onClose={onClose}
      title={category ? 'Edit Category' : 'Add Category'}
      subtitle="Organize medicines into logical groups."
      icon={<FolderTree className="w-5 h-5" />}
      size="lg"
      scrollable={false}
      formId="category-form"
      submitting={saving}
      onSubmit={() => {}}
      submitLabel={category ? 'Update Category' : 'Create Category'}
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={modalLabelCls}>Name <span className="text-red-500">*</span></label>
            <input type="text" required placeholder="e.g. Tablet" className={modalInputCls} value={formData.name} onChange={e => handleNameChange(e.target.value)} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className={modalLabelCls}>Code</label>
            <input type="text" placeholder="Auto-generated" className={modalInputCls} value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
            <p className={modalHintCls}>Auto-generated from name if left blank</p>
          </div>
        </div>
        <div>
          <label className={modalLabelCls}>Description</label>
          <textarea rows={2} placeholder="Brief description..." className={`${modalInputCls} h-auto min-h-[64px] py-3 resize-none`} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={modalLabelCls}>Icon</label>
            <div className="flex items-center gap-2">
              <div className="w-10 h-14 rounded-xl border border-gray-200 dark:border-[#2A2A2A] shrink-0 flex items-center justify-center text-lg bg-white dark:bg-[#171717]">
                {formData.icon || <span className="text-gray-300">–</span>}
              </div>
              <input type="text" placeholder="📁" className={modalInputCls} value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={modalLabelCls}>Color (hex)</label>
            <div className="flex items-center gap-2">
              <div className="w-10 h-14 rounded-xl border border-gray-200 dark:border-[#2A2A2A] shrink-0" style={{ backgroundColor: formData.color || '#6b7280' }} />
              <input type="text" placeholder="#0F9291" className={modalInputCls} value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={modalLabelCls}>Display Order</label>
            <input type="number" min="0" step="1" className={modalInputCls} value={formData.displayOrder} onChange={e => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })} />
          </div>
        </div>
        <div>
          <label className={modalLabelCls}>Parent Category</label>
          <select value={formData.parentId} onChange={e => setFormData({ ...formData, parentId: e.target.value })} className={modalSelectCls}>
            <option value="">None (Top Level)</option>
            {parentOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/80 dark:bg-white/[0.03] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status</p>
            <p className={modalHintCls}>Inactive categories are hidden from forms and filters.</p>
          </div>
          <button type="button" onClick={() => setFormData({ ...formData, status: !formData.status })} className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-250 ${formData.status ? 'bg-[#0F9291]' : 'bg-gray-300 dark:bg-[#2A2A2A]'}`}>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-250 ${formData.status ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </form>
    </GlobalModal>
  );
}

function ConfirmModal({
  deleteTarget, bulkAction, bulkCount, saving, onCancel, onConfirm,
}: {
  deleteTarget: Category | null;
  bulkAction: string | null;
  bulkCount: number;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isDelete = deleteTarget !== null || bulkAction === 'delete';
  const title = deleteTarget ? 'Delete Category' : bulkAction === 'activate' ? 'Activate Categories' : 'Deactivate Categories';
  const message = deleteTarget
    ? <>Are you sure you want to delete <strong>&ldquo;{deleteTarget.name}&rdquo;</strong>? This action cannot be undone.</>
    : <>{`Are you sure you want to ${bulkAction} ${bulkCount} categor${bulkCount === 1 ? 'y' : 'ies'}?`}{bulkAction === 'delete' && ' This action cannot be undone.'}</>;
  return (
    <GlobalConfirmModal
      onClose={() => !saving && onCancel()}
      title={title}
      message={message}
      confirmLabel={deleteTarget ? 'Delete' : bulkAction === 'activate' ? 'Activate' : 'Deactivate'}
      danger={isDelete}
      submitting={saving}
      onConfirm={onConfirm}
    />
  );
}
