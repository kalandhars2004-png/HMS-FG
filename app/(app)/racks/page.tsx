'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Rack } from '@/types';
import { RacksAPI, CategoriesAPI, ProductsAPI } from '@/lib/api';
import GlobalModal, {
  modalInputCls,
  modalSelectCls,
  modalLabelCls,
  modalHintCls,
  GlobalConfirmModal,
} from '@/components/ui/GlobalModal';
import {
  Search, Plus, RotateCw, Maximize, Minimize, ChevronDown, EllipsisVertical, Edit, Trash2,
  House, FileSpreadsheet, Printer, SlidersHorizontal, X, Package, Check,
  SunDim, Droplet, Snowflake, Table, Layers, Gauge, Box, Pill,
} from '@/components/ui/LucideIcon';

const TEMPERATURE_OPTIONS = [
  { value: 'ROOM_TEMP', label: 'Room Temp' },
  { value: 'COOL_DRY', label: 'Cool & Dry' },
  { value: 'REFRIGERATED', label: 'Refrigerated' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const ROWS_OPTIONS = [3, 4, 5, 6, 7];
const COLUMNS_OPTIONS = [2, 4, 6, 8, 10];
const BINS_OPTIONS = [150, 200, 250, 300];
const ALERT_OPTIONS = [10, 20, 30, 40];

const COLUMNS_LIST = [
  { key: 'id', label: 'ID' },
  { key: 'category', label: 'Categories' },
  { key: 'rows', label: 'Rows' },
  { key: 'bins', label: 'Bin' },
  { key: 'temperature', label: 'Temperature' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'status', label: 'Status' },
];

const TEMP_ICON: Record<string, any> = {
  ROOM_TEMP: SunDim,
  COOL_DRY: Droplet,
  REFRIGERATED: Snowflake,
};

const TEMP_BADGE: Record<string, string> = {
  ROOM_TEMP: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  COOL_DRY: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  REFRIGERATED: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  INACTIVE: 'bg-gray-100 text-gray-500 dark:bg-gray-500/10 dark:text-gray-400',
  MAINTENANCE: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
};

const CATEGORY_COLORS = ['#0F9291', '#E67E22', '#8E44AD', '#C0392B', '#2980B9', '#27AE60', '#9B59B6', '#16A085'];

const tempLabel = (t?: string) => TEMPERATURE_OPTIONS.find(o => o.value === t)?.label ?? 'Room Temp';
const statusLabel = (s?: string) => STATUS_OPTIONS.find(o => o.value === s)?.label ?? 'Active';

export default function RacksPage() {
  const [racks, setRacks] = useState<Rack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterTemps, setFilterTemps] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMNS_LIST.map(c => c.key));
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingRack, setEditingRack] = useState<Rack | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Rack | null>(null);
  const [assignTarget, setAssignTarget] = useState<Rack | null>(null);
  const [saving, setSaving] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; type: 'success' | 'error'; message: string }[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await RacksAPI.getAll();
      setRacks(res.data);
    } catch {
      setError('Failed to load racks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setColumnsOpen(false); setExportOpen(false); setMoreOpen(null); setFilterOpen(false); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return racks.filter(r => {
      if (q && !`${r.code} ${r.category}`.toLowerCase().includes(q)) return false;
      if (filterCategories.length && !filterCategories.includes(r.category)) return false;
      if (filterTemps.length && !filterTemps.includes(r.temperature || '')) return false;
      if (filterStatuses.length && !filterStatuses.includes(r.status || '')) return false;
      return true;
    });
  }, [racks, search, filterCategories, filterTemps, filterStatuses]);

  const activeFilterCount = filterCategories.length + filterTemps.length + filterStatuses.length;

  const catColor = (category: string) => {
    let h = 0;
    for (const c of category) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return CATEGORY_COLORS[h % CATEGORY_COLORS.length];
  };

  const toggleColumn = (key: string) =>
    setVisibleColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const handleExport = (type: 'pdf' | 'excel') => {
    setExportOpen(false);
    const rows = [
      ['ID', 'Categories', 'Rows', 'Bin', 'Temperature', 'Capacity', 'Status'],
      ...filtered.map(r => [r.code, r.category, String(r.rowsCount ?? 0), String(r.bins ?? 0), tempLabel(r.temperature), `${r.capacityPercent ?? 0}%`, statusLabel(r.status)]),
    ];
    const csv = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    if (type === 'excel') {
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'racks.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(`<html><head><title>Racks</title></head><body><table border="1" cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:13px">${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table></body></html>`);
        w.document.close();
        w.print();
      }
    }
    addToast('success', `Racks exported as ${type.toUpperCase()}`);
  };

  const openAdd = () => { setEditingRack(null); setShowModal(true); };
  const openEdit = (rack: Rack) => { setEditingRack(rack); setShowModal(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await RacksAPI.delete(deleteTarget.id);
      addToast('success', `Rack ${deleteTarget.code} deleted`);
      setDeleteTarget(null);
      loadItems();
    } catch {
      addToast('error', 'Failed to delete rack');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full h-9 px-3.5 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250';
  const headerFilterBtn = (active: boolean) =>
    `inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-medium transition-all duration-250 ${active
      ? 'border-[#0F9291]/40 bg-[#0F9291]/5 text-[#0F9291]'
      : 'border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]'}`;

  return (
    <div className="p-6 animate-fadeIn" onClick={() => { setMoreOpen(null); setColumnsOpen(false); setExportOpen(false); }}>
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
            <li className="text-gray-900 dark:text-[#F8FAFC] font-medium" aria-current="page">Racks</li>
          </ol>
        </nav>
        <div className="flex items-center justify-end gap-2">
          <button onClick={loadItems} title="Refresh" className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1F2937] shadow-sm transition-all duration-250">
            <RotateCw className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen} title="Maximize" className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1F2937] shadow-sm transition-all duration-250">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          <button
            onClick={openAdd}
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
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search racks..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') setSearch(searchInput); }}
                className="h-9 w-52 pl-9 pr-8 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250"
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(''); setSearch(''); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={e => { e.stopPropagation(); setFilterOpen(true); }}
              className={`${headerFilterBtn(activeFilterCount > 0)}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#0F9291] text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={() => { setFilterCategories([]); setFilterTemps([]); setFilterStatuses([]); }}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-250"
              >
                <X className="w-3.5 h-3.5" /> Clear All
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Columns */}
            <div className="relative" ref={columnsRef}>
              <button
                onClick={e => { e.stopPropagation(); setColumnsOpen(o => !o); setExportOpen(false); }}
                className={`${headerFilterBtn(false)}`}
              >
                <Table className="w-4 h-4" /> Columns <ChevronDown className={`w-3.5 h-3.5 transition-transform ${columnsOpen ? 'rotate-180' : ''}`} />
              </button>
              {columnsOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] shadow-lg shadow-gray-200/50 dark:shadow-black/40 p-1.5 z-50">
                  {COLUMNS_LIST.map(c => (
                    <button
                      key={c.key}
                      onClick={() => toggleColumn(c.key)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors"
                    >
                      {c.label}
                      <span className={`flex h-4 w-4 items-center justify-center rounded border ${visibleColumns.includes(c.key) ? 'bg-[#0F9291] border-[#0F9291] text-white' : 'border-gray-300 dark:border-[#3A3A3A]'}`}>
                        {visibleColumns.includes(c.key) && <Check className="w-3 h-3" />}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export */}
            <div className="relative" ref={exportRef}>
              <button
                onClick={e => { e.stopPropagation(); setExportOpen(o => !o); setColumnsOpen(false); }}
                className={`${headerFilterBtn(false)}`}
              >
                <FileSpreadsheet className="w-4 h-4" /> Export <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
              </button>
              {exportOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] shadow-lg shadow-gray-200/50 dark:shadow-black/40 p-1.5 z-50">
                  <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors">
                    <Printer className="w-4 h-4 text-gray-400" /> Export as PDF
                  </button>
                  <button onClick={() => handleExport('excel')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors">
                    <FileSpreadsheet className="w-4 h-4 text-gray-400" /> Export as Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#273244] bg-gray-50/70 dark:bg-white/[0.02]">
                {COLUMNS_LIST.filter(c => visibleColumns.includes(c.key)).map(c => (
                  <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={COLUMNS_LIST.length + 1} className="px-4 py-16 text-center">
                    <div className="inline-flex items-center gap-3 text-gray-400">
                      <span className="w-5 h-5 border-2 border-[#0F9291] border-t-transparent rounded-full animate-spin" />
                      Loading racks...
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && error && (
                <tr>
                  <td colSpan={COLUMNS_LIST.length + 1} className="px-4 py-16 text-center text-red-500">{error}</td>
                </tr>
              )}
              {!isLoading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS_LIST.length + 1} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Package className="w-10 h-10" />
                      <p className="text-sm font-medium">No racks found</p>
                      <p className="text-xs">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && !error && filtered.map(rack => (
                <tr key={rack.id} className="border-b border-gray-50 dark:border-[#273244]/60 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                  {visibleColumns.includes('id') && (
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-2 text-[#0F9291] font-semibold">
                        <Box className="w-4 h-4" /> {rack.code}
                      </span>
                    </td>
                  )}
                  {visibleColumns.includes('category') && (
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-200 font-medium">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white text-xs font-bold" style={{ backgroundColor: catColor(rack.category) }}>
                          {rack.category.charAt(0)}
                        </span>
                        {rack.category}
                      </span>
                    </td>
                  )}
                  {visibleColumns.includes('rows') && (
                    <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300">{rack.rowsCount ?? 0}</td>
                  )}
                  {visibleColumns.includes('bins') && (
                    <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300">{rack.bins ?? 0}</td>
                  )}
                  {visibleColumns.includes('temperature') && (
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${TEMP_BADGE[rack.temperature || 'ROOM_TEMP']}`}>
                        {(() => { const Icon = TEMP_ICON[rack.temperature || 'ROOM_TEMP']; return <Icon className="w-3.5 h-3.5" />; })()}
                        {tempLabel(rack.temperature)}
                      </span>
                    </td>
                  )}
                  {visibleColumns.includes('capacity') && (
                    <td className="px-4 py-3.5 min-w-[180px]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${(rack.capacityPercent ?? 0) >= 80 ? 'bg-red-500' : (rack.capacityPercent ?? 0) >= 50 ? 'bg-amber-400' : 'bg-[#0F9291]'}`}
                            style={{ width: `${rack.capacityPercent ?? 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-9 text-right">{rack.capacityPercent ?? 0}%</span>
                      </div>
                      <button
                        onClick={() => setAssignTarget(rack)}
                        className="text-xs font-medium text-[#0F9291] hover:text-teal-700 hover:underline transition-colors mt-1"
                      >
                        Assign Medicine
                      </button>
                    </td>
                  )}
                  {visibleColumns.includes('status') && (
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[rack.status || 'ACTIVE']}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {statusLabel(rack.status)}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(rack)} className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-[#0F9291] hover:bg-[#0F9291]/10 transition-all duration-250" title="Edit">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(rack)} className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-250" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-[#273244]">
          <span className="text-xs text-gray-500">
            Showing {filtered.length} of {racks.length} racks
          </span>
        </div>
      </div>

      {/* ── Filter Drawer ── */}
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={[...new Set(racks.map(r => r.category).filter(Boolean))]}
        filterCategories={filterCategories}
        filterTemps={filterTemps}
        filterStatuses={filterStatuses}
        setFilterCategories={setFilterCategories}
        setFilterTemps={setFilterTemps}
        setFilterStatuses={setFilterStatuses}
      />

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <RackModal
          rack={editingRack}
          onClose={() => setShowModal(false)}
          onSave={() => { loadItems(); setShowModal(false); }}
          addToast={addToast}
        />
      )}

      {/* ── Assign Medicines Modal ── */}
      {assignTarget && (
        <AssignMedicinesModal
          rack={assignTarget}
          onClose={() => setAssignTarget(null)}
          onSaved={(count) => {
            addToast('success', `Assigned ${count} medicines to ${assignTarget.code}`);
            setAssignTarget(null);
            loadItems();
          }}
          addToast={addToast}
        />
      )}

      {/* ── Delete Confirmation ── */}
      {deleteTarget && (
        <GlobalConfirmModal
          open
          onClose={() => !saving && setDeleteTarget(null)}
          title="Delete Confirmation"
          message={<>Are you sure you want to delete <strong>&ldquo;{deleteTarget.code}&rdquo;</strong>? This action cannot be undone.</>}
          confirmLabel="Delete"
          danger
          submitting={saving}
          onConfirm={handleDelete}
        />
      )}

      {/* ── Toasts ── */}
      <ToastContainer items={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
}

/* ═══════════════════ Filter Drawer ═══════════════════ */

function FilterDrawer({
  open, onClose, categories, filterCategories, filterTemps, filterStatuses,
  setFilterCategories, setFilterTemps, setFilterStatuses,
}: {
  open: boolean;
  onClose: () => void;
  categories: string[];
  filterCategories: string[];
  filterTemps: string[];
  filterStatuses: string[];
  setFilterCategories: (v: string[]) => void;
  setFilterTemps: (v: string[]) => void;
  setFilterStatuses: (v: string[]) => void;
}) {
  const [draftCategories, setDraftCategories] = useState<string[]>(filterCategories);
  const [draftTemps, setDraftTemps] = useState<string[]>(filterTemps);
  const [draftStatuses, setDraftStatuses] = useState<string[]>(filterStatuses);

  useEffect(() => {
    if (open) {
      setDraftCategories(filterCategories);
      setDraftTemps(filterTemps);
      setDraftStatuses(filterStatuses);
    }
  }, [open, filterCategories, filterTemps, filterStatuses]);

  if (!open) return null;

  const toggle = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];

  return (
    <div className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-gray-900/40 dark:bg-black/50 backdrop-blur-[2px] animate-dialogOverlayIn" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-[320px] bg-white dark:bg-[#161B22] border-l border-gray-200 dark:border-[#273244] shadow-2xl flex flex-col animate-slideInRight">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#273244]">
          <h3 className="text-base font-bold text-gray-900 dark:text-[#F8FAFC]">Filter</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 [scrollbar-width:thin]">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Category</h4>
            <div className="space-y-1">
              {categories.map(cat => (
                <label key={cat} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                  <span className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${draftCategories.includes(cat) ? 'bg-[#0F9291] border-[#0F9291]' : 'border-gray-300 dark:border-[#3A3A3A]'}`}>
                    {draftCategories.includes(cat) && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <input type="checkbox" className="hidden" checked={draftCategories.includes(cat)} onChange={() => setDraftCategories(toggle(draftCategories, cat))} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{cat}</span>
                </label>
              ))}
              {categories.length === 0 && <p className="text-xs text-gray-400 px-2">No categories available</p>}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Temperature</h4>
            <div className="space-y-1">
              {TEMPERATURE_OPTIONS.map(t => (
                <label key={t.value} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                  <span className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${draftTemps.includes(t.value) ? 'bg-[#0F9291] border-[#0F9291]' : 'border-gray-300 dark:border-[#3A3A3A]'}`}>
                    {draftTemps.includes(t.value) && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <input type="checkbox" className="hidden" checked={draftTemps.includes(t.value)} onChange={() => setDraftTemps(toggle(draftTemps, t.value))} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Status</h4>
            <div className="space-y-1">
              {STATUS_OPTIONS.map(s => (
                <label key={s.value} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                  <span className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${draftStatuses.includes(s.value) ? 'bg-[#0F9291] border-[#0F9291]' : 'border-gray-300 dark:border-[#3A3A3A]'}`}>
                    {draftStatuses.includes(s.value) && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <input type="checkbox" className="hidden" checked={draftStatuses.includes(s.value)} onChange={() => setDraftStatuses(toggle(draftStatuses, s.value))} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{s.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 dark:border-[#273244] flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1F1F1F] ring-1 ring-gray-200 dark:ring-[#2A2A2A] hover:bg-gray-50 dark:hover:bg-[#232323] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => { setFilterCategories(draftCategories); setFilterTemps(draftTemps); setFilterStatuses(draftStatuses); onClose(); }}
            className="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#0F9291] to-teal-600 shadow-lg shadow-[#0F9291]/25 hover:shadow-[#0F9291]/35 transition-all"
          >
            Apply Filter
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ═══════════════════ Rack Modal ═══════════════════ */

function RackModal({
  rack, onClose, onSave, addToast,
}: {
  rack: Rack | null;
  onClose: () => void;
  onSave: () => void;
  addToast: (type: 'success' | 'error', message: string) => void;
}) {
  const [formData, setFormData] = useState({
    code: rack?.code || '',
    category: rack?.category || '',
    rowsCount: rack?.rowsCount ?? 3,
    columns: rack?.columns ?? 2,
    bins: rack?.bins ?? 150,
    alertThreshold: rack?.alertThreshold ?? 20,
    temperature: rack?.temperature || 'ROOM_TEMP',
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    CategoriesAPI.getAll()
      .then(res => setCategories(res.data.map((c: any) => c.name)))
      .catch(() => setCategories([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!formData.code.trim()) errs.code = 'Rack code is required';
    if (!formData.category) errs.category = 'Category is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      if (rack) {
        await RacksAPI.update(rack.id, formData);
        addToast('success', `Rack ${formData.code} updated`);
      } else {
        await RacksAPI.create(formData);
        addToast('success', `Rack ${formData.code} created`);
      }
      onSave();
    } catch (err: any) {
      const msg = err?.message?.replace(/^Error:\s*/i, '');
      addToast('error', msg || `Failed to ${rack ? 'update' : 'create'} rack`);
      try { setErrors({ code: JSON.parse(msg || '{}').message || '' }); } catch { /* ignore */ }
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlobalModal
      onClose={onClose}
      title={rack ? 'Edit Rack' : 'Create New Rack'}
      subtitle="Define a storage rack with its physical layout and storage conditions."
      icon={<Table className="w-5 h-5" />}
      size="lg"
      scrollable={false}
      formId="rack-form"
      submitting={saving}
      onSubmit={() => {}}
      submitLabel={rack ? 'Save Changes' : 'Create New'}
    >
      <form id="rack-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={modalLabelCls}>Rack Code <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="e.g. RCK017"
              className={modalInputCls}
              value={formData.code}
              onChange={e => { setFormData({ ...formData, code: e.target.value }); if (errors.code) setErrors(prev => { const { code, ...rest } = prev; return rest; }); }}
            />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
          </div>
          <div>
            <label className={modalLabelCls}>Category <span className="text-red-500">*</span></label>
            <select
              value={formData.category}
              onChange={e => { setFormData({ ...formData, category: e.target.value }); if (errors.category) setErrors(prev => { const { category, ...rest } = prev; return rest; }); }}
              className={modalSelectCls}
            >
              <option value="">Select Category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={modalLabelCls}>Rows <span className="text-red-500">*</span></label>
            <select value={formData.rowsCount} onChange={e => setFormData({ ...formData, rowsCount: Number(e.target.value) })} className={modalSelectCls}>
              {ROWS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={modalLabelCls}>Columns <span className="text-red-500">*</span></label>
            <select value={formData.columns} onChange={e => setFormData({ ...formData, columns: Number(e.target.value) })} className={modalSelectCls}>
              {COLUMNS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={modalLabelCls}>Bins <span className="text-red-500">*</span></label>
            <select value={formData.bins} onChange={e => setFormData({ ...formData, bins: Number(e.target.value) })} className={modalSelectCls}>
              {BINS_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={modalLabelCls}>Alert Threshold (%) <span className="text-red-500">*</span></label>
            <select value={formData.alertThreshold} onChange={e => setFormData({ ...formData, alertThreshold: Number(e.target.value) })} className={modalSelectCls}>
              {ALERT_OPTIONS.map(a => <option key={a} value={a}>{a}%</option>)}
            </select>
            <p className={modalHintCls}>Alerts when assigned capacity crosses this level.</p>
          </div>
          <div>
            <label className={modalLabelCls}>Temperature <span className="text-red-500">*</span></label>
            <select value={formData.temperature} onChange={e => setFormData({ ...formData, temperature: e.target.value })} className={modalSelectCls}>
              {TEMPERATURE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </form>
    </GlobalModal>
  );
}

/* ═══════════════════ Assign Medicines Modal ═══════════════════ */

function AssignMedicinesModal({
  rack, onClose, onSaved, addToast,
}: {
  rack: Rack;
  onClose: () => void;
  onSaved: (count: number) => void;
  addToast: (type: 'success' | 'error', message: string) => void;
}) {
  const [products, setProducts] = useState<{ id: string; name: string; sku?: string }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    ProductsAPI.getAll()
      .then((res: any) => setProducts(res.data))
      .catch(() => addToast('error', 'Failed to load medicines'))
      .finally(() => setLoading(false));
  }, [addToast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => !q || p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q));
  }, [products, search]);

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await RacksAPI.update(rack.id, {
        code: rack.code,
        category: rack.category,
        rowsCount: rack.rowsCount,
        columns: rack.columns,
        bins: rack.bins,
        alertThreshold: rack.alertThreshold,
        temperature: rack.temperature,
        status: rack.status,
        assignedMedicines: selected.length,
      });
      onSaved(selected.length);
    } catch {
      addToast('error', 'Failed to assign medicines');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlobalModal
      onClose={onClose}
      title={`Assign Medicines — ${rack.code}`}
      subtitle="Select medicines to store in this rack. Capacity updates automatically."
      icon={<Pill className="w-5 h-5" />}
      size="lg"
      scrollable={false}
      formId="assign-form"
      submitting={saving}
      onSubmit={() => {}}
      submitLabel={`Assign (${selected.length})`}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-3.5 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/80 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#0F9291]" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Capacity</span>
          </div>
          <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${Math.min(100, Math.round((selected.length || rack.assignedMedicines || 0) * 100 / (rack.bins || 1))) >= 80 ? 'bg-red-500' : 'bg-[#0F9291]'}`}
              style={{ width: `${Math.min(100, Math.round((selected.length || rack.assignedMedicines || 0) * 100 / (rack.bins || 1)))}%` }}
            />
          </div>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
            {selected.length || rack.assignedMedicines || 0} / {rack.bins || 0}
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search medicines..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`${modalInputCls} h-11 pl-9`}
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto border border-gray-100 dark:border-white/[0.06] rounded-xl divide-y divide-gray-50 dark:divide-white/[0.04] [scrollbar-width:thin]">
          {loading && (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
              <span className="w-5 h-5 border-2 border-[#0F9291] border-t-transparent rounded-full animate-spin mr-3" />
              Loading medicines...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-10 text-center text-gray-400 text-sm">No medicines found</div>
          )}
          {!loading && filtered.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${selected.includes(p.id) ? 'bg-[#0F9291]/5' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'}`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${selected.includes(p.id) ? 'bg-[#0F9291] border-[#0F9291]' : 'border-gray-300 dark:border-[#3A3A3A]'}`}>
                {selected.includes(p.id) && <Check className="w-3.5 h-3.5 text-white" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.name}</span>
                {p.sku && <span className="block text-xs text-gray-400">{p.sku}</span>}
              </span>
            </button>
          ))}
        </div>
      </div>
    </GlobalModal>
  );
}

/* ═══════════════════ Toasts ═══════════════════ */

function ToastContainer({ items, onRemove }: { items: { id: number; type: 'success' | 'error'; message: string }[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[1300] flex flex-col gap-2">
      {items.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-toastIn ${
            t.type === 'success'
              ? 'bg-white dark:bg-[#1F1F1F] border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-white dark:bg-[#1F1F1F] border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400'
          }`}
        >
          <span className={`flex h-6 w-6 items-center justify-center rounded-full ${t.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
            {t.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          </span>
          <span className="text-sm">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
