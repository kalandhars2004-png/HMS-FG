'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Category } from '@/types';
import { CategoriesAPI } from '@/lib/api';
import {
  Search, Plus, RotateCw, Maximize, X, Edit2, Trash2,
  ChevronDown, ChevronUp, Download, Printer, FileSpreadsheet,
  FolderOpen, CheckCircle, XCircle, AlertTriangle,
  Columns, House, FolderTree,
} from '@/components/ui/LucideIcon';
import GlobalModal, { modalInputCls, modalSelectCls, modalLabelCls, modalHintCls, GlobalConfirmModal } from '@/components/ui/GlobalModal';

interface ToastItem { id: string; type: 'success' | 'error'; message: string; }

interface SortConfig { key: string; direction: 'asc' | 'desc'; }

interface ColumnDef { key: string; label: string; visible: boolean; sortable: boolean; }

const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Category', visible: true, sortable: true },
  { key: 'code', label: 'Code', visible: true, sortable: true },
  { key: 'description', label: 'Description', visible: true, sortable: false },
  { key: 'parent', label: 'Parent Category', visible: true, sortable: true },
  { key: 'displayOrder', label: 'Order', visible: true, sortable: true },
  { key: 'createdAt', label: 'Created Date', visible: true, sortable: true },
];

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);

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
      const res = await CategoriesAPI.getAll();
      setCategories(res.data);
    } catch {
      setError('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      result.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof Category];
        const bVal = b[sortConfig.key as keyof Category];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [categories, debouncedSearch, sortConfig]);

  const totalPages = Math.ceil(processedCategories.length / perPage);
  const paginatedCategories = useMemo(() => {
    const start = (page - 1) * perPage;
    return processedCategories.slice(start, start + perPage);
  }, [processedCategories, page, perPage]);

  const stats = useMemo(() => ({
    total: categories.length,
    active: categories.filter(c => c.status).length,
    inactive: categories.filter(c => !c.status).length,
    withParent: categories.filter(c => c.parentId).length,
  }), [categories]);

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

  const exportCSV = useCallback(() => {
    const headers = ['Name', 'Code', 'Description', 'Parent', 'Display Order', 'Status', 'Created'];
    const rows = categories.map(c => [
      c.name, c.slug, c.description || '', parentMap.get(c.parentId || '') || '', c.displayOrder ?? '', c.status ? 'Active' : 'Inactive', formatDate(c.createdAt),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'categories.csv'; a.click();
    URL.revokeObjectURL(url);
    setOpenDropdown(null);
    addToast('success', 'CSV exported');
  }, [categories, parentMap, addToast]);

  const handlePrint = useCallback(() => {
    setOpenDropdown(null);
    window.print();
  }, []);

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
    <div className="p-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-1.5 m-0 p-0 list-none text-sm">
            <li className="flex items-center gap-1.5">
              <a href="/dashboard" className="text-gray-500 hover:text-gray-700 no-underline flex items-center gap-1.5">
                <House className="w-4 h-4" /> Dashboard
              </a>
              <span className="text-gray-300 mx-1">/</span>
            </li>
            <li className="text-gray-900 font-medium" aria-current="page">Categories</li>
          </ol>
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={loadItems} className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-all duration-250 shadow-sm" title="Refresh"><RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /></button>
          <div className="relative" ref={columnsRef}>
            <button onClick={() => setOpenDropdown(o => o === 'columns' ? null : 'columns')} className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-all duration-250 shadow-sm" title="Columns"><Columns className="w-4 h-4" /></button>
            {openDropdown === 'columns' && (
              <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-3 px-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Toggle Columns</p>
                {columnDefs.map(col => (
                  <label key={col.key} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                    <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.key)} className="rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291] focus:ring-offset-0" />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="relative" ref={exportRef}>
            <button onClick={() => setOpenDropdown(o => o === 'export' ? null : 'export')} className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-all duration-250 shadow-sm" title="Export"><Download className="w-4 h-4" /></button>
            {openDropdown === 'export' && (
              <div className="absolute right-0 top-full mt-1 z-50 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden">
                <button onClick={exportCSV} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV</button>
                <button onClick={() => { setOpenDropdown(null); exportCSV(); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><FileSpreadsheet className="w-4 h-4 text-blue-600" /> Export Excel</button>
                <button onClick={handlePrint} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><Printer className="w-4 h-4 text-gray-600" /> Print</button>
              </div>
            )}
          </div>
          <button onClick={() => document.querySelector('.p-6')?.classList.toggle('maximized')} className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-all duration-250 shadow-sm" title="Maximize"><Maximize className="w-4 h-4" /></button>
          <button onClick={() => { setEditingCategory(null); setShowModal(true); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F9291] text-white font-semibold text-sm hover:bg-teal-700 transition-all duration-250 shadow-sm hover:shadow-md active:scale-95">
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Total Categories', value: stats.total, icon: FolderOpen, color: 'text-[#0F9291]' },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-emerald-600' },
          { label: 'Inactive', value: stats.inactive, icon: XCircle, color: 'text-red-600' },
          { label: 'With Parent', value: stats.withParent, icon: House, color: 'text-purple-600' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-5 transition-all duration-250 hover:shadow-[0_15px_40px_rgba(15,23,42,0.08)] hover:-translate-y-0.5">
            <p className="text-sm font-medium text-gray-500 m-0 flex items-center gap-2 mb-3"><card.icon className={`w-4 h-4 ${card.color}`} /> {card.label}</p>
            <h4 className="text-2xl font-bold text-gray-900 m-0">{card.value}</h4>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="Search name, code, description..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                  className="w-60 pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#0F9291] focus:shadow-[0_0_0_3px_rgba(15,146,145,0.1)]"
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
            <span className="text-xs text-gray-400 font-medium">
              {processedCategories.length} category{processedCategories.length !== 1 ? 'ies' : 'y'}
              {selectedIds.size > 0 && <> &middot; {selectedIds.size} selected</>}
            </span>
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
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291] focus:ring-offset-0 cursor-pointer"
                    />
                  </th>
                  <th className={`px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none ${sortConfig?.key === 'name' ? 'text-[#0F9291]' : ''}`} onClick={() => handleSort('name')}><span className="flex items-center gap-1">Category {getSortIcon('name')}</span></th>
                  {visibleColumns.map(col => col.key !== 'name' && (
                    <th key={col.key} className={`px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none' : ''} ${sortConfig?.key === col.key ? 'text-[#0F9291]' : ''}`} onClick={() => col.sortable && handleSort(col.key)}><span className="flex items-center gap-1">{col.label} {col.sortable && getSortIcon(col.key)}</span></th>
                  ))}
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedCategories.map(category => (
                  <tr key={category.id} className="hover:bg-gray-50/50 transition-colors duration-250">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(category.id)}
                        onChange={() => handleSelectOne(category.id)}
                        className="rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291] focus:ring-offset-0 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-9 h-9 rounded-xl text-base shrink-0" style={{ backgroundColor: category.color ? `${category.color}20` : '#f3f4f6', color: category.color || '#6b7280' }}>
                          {category.icon || '📁'}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 m-0">{category.name}</p>
                        </div>
                      </div>
                    </td>
                    {visibleColumns.map(col => {
                      if (col.key === 'name' || col.key === 'status') return null;
                      if (col.key === 'code') return <td key={col.key} className="px-4 py-3 whitespace-nowrap"><code className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{category.slug}</code></td>;
                      if (col.key === 'description') return <td key={col.key} className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{category.description || '-'}</td>;
                      if (col.key === 'parent') {
                        const parentName = category.parentId ? parentMap.get(category.parentId) : null;
                        return <td key={col.key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{parentName || '-'}</td>;
                      }
                      if (col.key === 'displayOrder') return <td key={col.key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{category.displayOrder ?? '-'}</td>;
                      if (col.key === 'createdAt') return <td key={col.key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(category.createdAt)}</td>;
                      return <td key={col.key} className="px-4 py-3 text-sm text-gray-500">-</td>;
                    })}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(category)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-250 ${category.status ? 'bg-[#0F9291]' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-250 ${category.status ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditingCategory(category); setShowModal(true); }} className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-[#0F9291] hover:bg-[#0F9291]/10 transition-all duration-250" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteTarget(category)} className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-250" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
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
