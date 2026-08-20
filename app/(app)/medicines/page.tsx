'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProductsAPI } from '@/lib/api';
import { CATEGORY_ICONS } from '@/lib/constants';
import { formatCurrency } from '@/lib/currency';
import { getStockStatus, STOCK_STATUS_LABELS, type StockStatusMeta } from '@/lib/stock-status';
import {
  Search, Edit, Trash2, Timer, ScanBarcode,
  RotateCw, Plus, Maximize, EllipsisVertical,
  House, X, AlertTriangle, CheckCircle2, Pill, Ban, Package as PackageIcon, Calendar, ArrowUpToLine,
} from '@/components/ui/LucideIcon';
import GlobalModal, { GlobalConfirmModal } from '@/components/ui/GlobalModal';
import DropdownMenu, { DropdownItem, DropdownSeparator } from '@/components/ui/DropdownMenu';
import MedicineDetailsDialog from '@/components/medicines/MedicineDetailsDialog';

interface MedicineDisplay {
  id: string;
  sku: string;
  name: string;
  genericName: string;
  category: string;
  quantity: number;
  price: number;
  stockValue: number;
  stockStatus: string;
  stockMeta: StockStatusMeta;
  expiryDate: string;
  expiryRaw: string | null;
}

function getStats(medicines: MedicineDisplay[]) {
  const total = medicines.length;
  const inStock = medicines.filter(m => m.stockMeta.level === 'healthy').length;
  const lowStock = medicines.filter(m => m.stockMeta.level === 'low').length;
  const outOfStock = medicines.filter(m => m.stockMeta.level === 'out').length;
  const critical = medicines.filter(m => m.stockMeta.level === 'critical').length;
  const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : '0%');
  return [
    // `statuses: []` means "clear the filter" — the Total card is the reset.
    { label: 'Total Medicine', value: total.toLocaleString(), trend: null, up: true, Icon: Pill, tone: 'text-[#8A38F5] bg-[#8A38F5]/10', statuses: [] as string[] },
    { label: 'In Stock', value: inStock.toLocaleString(), trend: pct(inStock), up: true, Icon: PackageIcon, tone: 'text-[#0F9291] bg-[#0F9291]/10', statuses: ['In Stock'] },
    // This card counts low + critical, so selecting it must select both.
    { label: 'Low Stock', value: (lowStock + critical).toLocaleString(), trend: pct(lowStock + critical), up: false, Icon: AlertTriangle, tone: 'text-[#D97F06] bg-[#D97F06]/10', statuses: ['Low Stock', 'Critical'] },
    { label: 'Out of Stock', value: outOfStock.toLocaleString(), trend: pct(outOfStock), up: false, Icon: Ban, tone: 'text-[#D42314] bg-[#D42314]/10', statuses: ['Out of Stock'] },
  ];
}

/** Soft pill hues per dosage form, matching the reference table. */
const CATEGORY_PILL: Record<string, string> = {
  tablet: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  capsule: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  syrup: 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300',
  injection: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  ointment: 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300',
  drops: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300',
};

function categoryPill(category: string): string {
  const key = Object.keys(CATEGORY_PILL).find(k => category.toLowerCase().includes(k));
  return key ? CATEGORY_PILL[key] : 'bg-gray-100 text-gray-600 dark:bg-gray-700/40 dark:text-gray-300';
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '-';
  }
}

function extractGenericName(name: string): string {
  return name.replace(/\s+\d+.*$/, '').trim();
}

export default function MedicinesPage() {
  const router = useRouter();
  const [medicines, setMedicines] = useState<MedicineDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MedicineDisplay | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [showFilter, setShowFilter] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterStockStatus, setFilterStockStatus] = useState<string[]>([]);
  const [barcodeTarget, setBarcodeTarget] = useState<MedicineDisplay | null>(null);
  const menuAnchors = useRef<Record<string, HTMLButtonElement | null>>({});

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  const loadMedicines = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await ProductsAPI.getAll();
      const list: any[] = res.data || [];
      const mapped: MedicineDisplay[] = list.map((p: any) => {
        const qty = p.quantity ?? p.stockQuantity ?? 0;
        const price = Number(p.price) || 0;
        return {
          id: String(p.id),
          sku: p.sku || '-',
          name: p.name || 'Unnamed',
          genericName: extractGenericName(p.name || ''),
          category: p.categoryName || 'Uncategorized',
          quantity: qty,
          price,
          stockValue: price * qty,
          stockStatus: getStockStatus(qty, p.lowStockQuantity ?? undefined).label,
          stockMeta: getStockStatus(qty, p.lowStockQuantity ?? undefined),
          expiryDate: formatDate(p.expiryDate),
          expiryRaw: p.expiryDate ?? null,
        };
      });
      setMedicines(mapped);
    } catch {
      showToast('Failed to load medicines', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedicines();
    const onFocus = () => { if (!isLoading) loadMedicines(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadMedicines]);


  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
      return () => clearTimeout(t);
    }
  }, [toast.show]);

  const filtered = medicines.filter(m => {
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !m.sku.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !m.genericName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterCategory.length > 0 && !filterCategory.includes(m.category)) return false;
    if (filterStockStatus.length > 0 && !filterStockStatus.includes(m.stockStatus)) return false;
    if (filterDate && m.expiryRaw && m.expiryRaw.slice(0, 10) !== filterDate) return false;
    return true;
  });

  const uniqueCategories = [...new Set(medicines.map(m => m.category))].sort();

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const stats = getStats(medicines);

  /** Exports exactly what the user is looking at — filters and search included. */
  const exportCsv = () => {
    const cols = ['SKU', 'Item', 'Generic Name', 'Category', 'Quantity', 'Price', 'Stock Value', 'Stock Status', 'Expiry Date'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filtered.map(x => [x.sku, x.name, x.genericName, x.category, x.quantity, x.price, x.stockValue, x.stockStatus, x.expiryDate].map(esc).join(','));
    const blob = new Blob([[cols.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medicines-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filtered.length} medicines`, 'success');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await ProductsAPI.delete(deleteTarget.id);
      setMedicines(prev => prev.filter(m => m.id !== deleteTarget.id));
      showToast(`"${deleteTarget.name}" deleted successfully`, 'success');
      setDeleteTarget(null);
    } catch {
      showToast('Failed to delete medicine', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 animate-fadeIn">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[1060] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-slideDown ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700/30 dark:text-emerald-300' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700/30 dark:text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <GlobalConfirmModal
          onClose={() => !isDeleting && setDeleteTarget(null)}
          title="Delete Medicine"
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          submitting={isDeleting}
          danger
        >
          <p className="text-sm text-gray-500 dark:text-[#94A3B8] mb-1">Are you sure you want to delete</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-[#F8FAFC] mb-6">&ldquo;{deleteTarget.name}&rdquo;?</p>
          <p className="text-xs text-gray-400 dark:text-[#64748B] mb-6">This action cannot be undone.</p>
        </GlobalConfirmModal>
      )}

      {/* Barcode/QR Modal */}
      {barcodeTarget && (
        <GlobalModal
          onClose={() => setBarcodeTarget(null)}
          title="Barcode / QR"
          subtitle={barcodeTarget.sku}
          size="sm"
          hideFooter
          icon={<ScanBarcode className="w-5 h-5" />}
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-full border-2 border-dashed border-gray-200 dark:border-[#273244] rounded-2xl p-6 mb-4">
              <div className="flex justify-center mb-3">
                <div className="font-mono text-3xl tracking-[0.3em] text-gray-800 dark:text-[#F8FAFC]">||||||||||</div>
              </div>
              <div className="text-center font-mono text-sm text-gray-500 dark:text-[#94A3B8] tracking-widest">{barcodeTarget.sku}</div>
            </div>
            <div className="w-full space-y-2 text-left text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-[#94A3B8]">Medicine</span><span className="font-medium text-gray-900 dark:text-[#F8FAFC]">{barcodeTarget.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-[#94A3B8]">SKU</span><span className="font-medium text-gray-900 dark:text-[#F8FAFC]">{barcodeTarget.sku}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-[#94A3B8]">Category</span><span className="font-medium text-gray-900 dark:text-[#F8FAFC]">{barcodeTarget.category}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-[#94A3B8]">Price</span><span className="font-medium text-gray-900 dark:text-[#F8FAFC]">{formatCurrency(barcodeTarget.price)}</span></div>
            </div>
            <button onClick={() => setBarcodeTarget(null)}
              className="w-full px-5 py-3 rounded-2xl bg-[#0F9291] text-white text-sm font-semibold hover:bg-teal-700 transition-all duration-250"
            >Close</button>
          </div>
        </GlobalModal>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-1.5 m-0 p-0 list-none text-sm">
            <li className="flex items-center gap-1.5">
              <a href="/dashboard" className="text-gray-500 dark:text-[#94A3B8] hover:text-gray-700 dark:hover:text-[#F8FAFC] no-underline flex items-center gap-1.5">
                <House className="w-4 h-4" /> Dashboard
              </a>
              <span className="text-gray-300 dark:text-[#4B5563] mx-1">/</span>
            </li>
            <li className="text-gray-900 dark:text-[#F8FAFC] font-medium" aria-current="page">Medicine List</li>
          </ol>
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={loadMedicines} className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250 shadow-sm" title="Refresh">
            <RotateCw className="w-4 h-4" />
          </button>
          <button className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250 shadow-sm" title="Maximize">
            <Maximize className="w-4 h-4" />
          </button>
          <Link href="/medicines/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F9291] text-white font-semibold text-sm hover:bg-teal-700 transition-all duration-250 shadow-sm hover:shadow-md active:scale-95 no-underline"
          ><Plus className="w-4 h-4" /> Add New</Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {stats.map((card, i) => {
          const active = card.statuses.length === 0
            ? filterStockStatus.length === 0
            : card.statuses.length === filterStockStatus.length &&
              card.statuses.every(x => filterStockStatus.includes(x));
          return (
          <button
            key={i}
            type="button"
            onClick={() => { setFilterStockStatus(active && card.statuses.length ? [] : card.statuses); setCurrentPage(1); }}
            aria-pressed={active}
            aria-label={`Filter by ${card.label}`}
            className="text-left w-full bg-white dark:bg-[#161B22] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.35)] p-5 transition-all duration-250 hover:shadow-[0_15px_40px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0F9291]/50"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-[#94A3B8] m-0 flex items-center gap-2 mb-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${card.tone}`}>
                    <card.Icon className="w-4 h-4" />
                  </span>
                  {card.label}
                </p>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-[#F8FAFC] m-0 flex items-center gap-2">
                  {card.value}
                  {card.trend && (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 ${
                      card.up ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                    }`}>
                      {card.trend}
                    </span>
                  )}
                </h4>
              </div>
            </div>
          </button>
          );
        })}
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-[#161B22] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-[#273244]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#64748B]" />
                <input type="text" placeholder="Search" value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="h-9 text-sm text-gray-900 dark:text-[#F8FAFC] border border-gray-200 dark:border-[#273244] rounded-xl bg-gray-50 dark:bg-[#111827] pl-9 pr-3 w-[180px] outline-none transition-all duration-250 focus:w-[220px] focus:border-[#0F9291] focus:bg-white dark:focus:bg-[#161B22] focus:shadow-[0_0_0_3px_rgba(15,146,145,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(20,184,166,0.15)]"
                />
              </div>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#64748B] pointer-events-none" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={e => { setFilterDate(e.target.value); setCurrentPage(1); }}
                  aria-label="Filter by expiry date"
                  className="h-9 text-sm text-gray-900 dark:text-[#F8FAFC] border border-gray-200 dark:border-[#273244] rounded-xl bg-gray-50 dark:bg-[#111827] pl-9 pr-3 w-[170px] outline-none transition-colors duration-200 focus:border-[#0F9291] focus:bg-white dark:focus:bg-[#161B22]"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-250 shadow-sm ${
                  showFilter || filterCategory.length > 0 || filterStockStatus.length > 0
                    ? 'bg-[#0F9291] text-white border-[#0F9291]'
                    : 'bg-white dark:bg-[#161B22] text-gray-500 dark:text-[#94A3B8] border-gray-200 dark:border-[#273244] hover:bg-gray-50 dark:hover:bg-[#1F2937]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              </button>
              <button className="inline-flex items-center gap-2 px-3 h-9 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-sm text-gray-600 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250 shadow-sm whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 4h6m-6 4h6m-6 4h6m-3 4v4m-4 0h8" /></svg> Columns
              </button>
              <button className="inline-flex items-center gap-2 px-3 h-9 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-sm text-gray-600 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250 shadow-sm whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h6l3-4 3 4h6l-3 4 3 4h-6l-3 4-3-4H3l3-4-3-4z" /></svg> Sort by
              </button>
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-2 px-3 h-9 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-sm text-gray-600 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250 shadow-sm whitespace-nowrap"
              >
                <ArrowUpToLine className="w-4 h-4" /> Export
              </button>
              <button className="inline-flex items-center gap-2 px-3 h-9 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-sm text-gray-600 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250 shadow-sm whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Export
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <div className="px-4 py-3 border-b border-gray-100 dark:border-[#273244] bg-gray-50/50 dark:bg-[#111827]/50 animate-slideDown">
            <div className="flex items-start gap-6 flex-wrap">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {uniqueCategories.map(cat => (
                    <label key={cat} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={filterCategory.includes(cat)}
                        onChange={e => {
                          setFilterCategory(prev => e.target.checked ? [...prev, cat] : prev.filter(c => c !== cat));
                          setCurrentPage(1);
                        }}
                        className="rounded border-gray-300 dark:border-[#273244] text-[#0F9291] focus:ring-[#0F9291] w-3.5 h-3.5"
                      />
                      <span className="text-sm text-gray-700 dark:text-[#F8FAFC] whitespace-nowrap">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider mb-2">Stock Status</p>
                <div className="flex flex-wrap gap-2">
                  {STOCK_STATUS_LABELS.map(status => (
                    <label key={status} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={filterStockStatus.includes(status)}
                        onChange={e => {
                          setFilterStockStatus(prev => e.target.checked ? [...prev, status] : prev.filter(s => s !== status));
                          setCurrentPage(1);
                        }}
                        className="rounded border-gray-300 dark:border-[#273244] text-[#0F9291] focus:ring-[#0F9291] w-3.5 h-3.5"
                      />
                      <span className="text-sm text-gray-700 dark:text-[#F8FAFC] whitespace-nowrap">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={() => { setFilterCategory([]); setFilterStockStatus([]); setSearchQuery(''); setCurrentPage(1); }}
                className="text-xs text-[#0F9291] hover:text-teal-700 font-medium underline underline-offset-2 mt-5"
              >Clear all filters</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="p-12">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-12 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-[#1A2232] border-b border-gray-100 dark:border-[#273244]">
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">SKU</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Item</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Category</th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Quantity</th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Price</th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Stock Value</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Stock Status</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Expiry Date</th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#111827]">
                  {paginated.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-16 text-center text-gray-400 dark:text-[#64748B] text-sm">No medicines found</td></tr>
                  ) : (
                    paginated.map((m) => {
                      const ss = m.stockMeta;
                      const icon = CATEGORY_ICONS[m.category] || '📦';
                      return (
                        <tr
                          key={m.id}
                          onClick={() => setDetailsId(m.id)}
                          tabIndex={0}
                          role="button"
                          aria-label={`View details for ${m.name}`}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailsId(m.id); } }}
                          className="cursor-pointer hover:bg-gray-50/50 dark:hover:bg-[#1F2937]/50 transition-colors duration-250 focus:outline-none focus-visible:bg-[#0F9291]/5"
                        >
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-[#0F9291] text-sm font-medium">{m.sku}</span>
                          </td>
                          {/* Generic name sits under the item rather than in its own
                              column — it is derived from the name, so a separate
                              column repeated most of the same string. */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-[#1F2937] text-xs shrink-0">{icon}</span>
                              <span className="min-w-0">
                                <span className="block text-sm font-medium text-gray-900 dark:text-[#F8FAFC] truncate">{m.name}</span>
                                {m.genericName && m.genericName !== m.name && (
                                  <span className="block text-xs text-gray-400 dark:text-[#64748B] truncate">{m.genericName}</span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${categoryPill(m.category)}`}>
                              {m.category}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm text-right tabular-nums text-gray-900 dark:text-[#F8FAFC]">{m.quantity}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm text-right tabular-nums text-gray-900 dark:text-[#F8FAFC] font-medium">{formatCurrency(m.price)}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm text-right tabular-nums text-gray-900 dark:text-[#F8FAFC] font-medium">{formatCurrency(m.stockValue)}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${ss.pill}`}>
                              {!ss.needsAttention ? (
                                <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                              ) : (
                                /* Only unhealthy stock animates, so the eye is drawn to real problems */
                                <span className="status-dot w-1.5 h-1.5">
                                  <span className={`ring ${ss.dot}`} />
                                  <span className={`dot w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                                </span>
                              )}
                              {m.stockStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500 dark:text-[#94A3B8]">{m.expiryDate}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                            <button
                              ref={el => { menuAnchors.current[m.id] = el; }}
                              onClick={() => setOpenDropdown(openDropdown === m.id ? null : m.id)}
                              aria-haspopup="menu"
                              aria-expanded={openDropdown === m.id}
                              aria-label={`Actions for ${m.name}`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 dark:text-[#64748B] hover:bg-gray-100 dark:hover:bg-[#1F2937] hover:text-gray-600 dark:hover:text-[#94A3B8] transition-colors duration-200"
                            ><EllipsisVertical className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Rendered once, outside the overflow container, anchored to the open row */}

            <MedicineDetailsDialog
              open={!!detailsId}
              productId={detailsId}
              onClose={() => setDetailsId(null)}
              onEdit={(id) => { setDetailsId(null); router.push(`/medicines/create?id=${id}`); }}
              onHistory={(id) => {
                const row = medicines.find(x => x.id === id);
                setDetailsId(null);
                showToast(`Inventory history for ${row?.name ?? 'this medicine'} is not available`, 'success');
              }}
            />

            <DropdownMenu
              open={!!openDropdown}
              onClose={() => setOpenDropdown(null)}
              anchorEl={openDropdown ? menuAnchors.current[openDropdown] ?? null : null}
            >
              {(() => {
                const row = paginated.find(x => x.id === openDropdown);
                if (!row) return null;
                return (
                  <>
                    <DropdownItem icon={<Edit className="w-4 h-4" />}
                      onClick={() => { setOpenDropdown(null); router.push(`/medicines/create?id=${row.id}`); }}>
                      Edit
                    </DropdownItem>
                    <DropdownItem icon={<Timer className="w-4 h-4" />}
                      onClick={() => { setOpenDropdown(null); showToast(`Inventory history for ${row.name} is not available`, 'success'); }}>
                      Inventory History
                    </DropdownItem>
                    <DropdownItem icon={<ScanBarcode className="w-4 h-4" />}
                      onClick={() => { setOpenDropdown(null); setBarcodeTarget(row); }}>
                      Barcode/QR
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem destructive icon={<Trash2 className="w-4 h-4" />}
                      onClick={() => { setOpenDropdown(null); setDeleteTarget(row); }}>
                      Delete
                    </DropdownItem>
                  </>
                );
              })()}
            </DropdownMenu>

            {/* Pagination */}
            <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-t border-gray-100 dark:border-[#273244]">
              <span className="text-sm text-gray-500 dark:text-[#94A3B8]">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 dark:text-[#94A3B8] text-sm hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250 disabled:opacity-40 disabled:cursor-not-allowed"
                >&lt;</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setCurrentPage(p)}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-all duration-250 ${
                      p === currentPage ? 'bg-[#0F9291] text-white shadow-sm' : 'border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#1F2937]'
                    }`}
                  >{p}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 dark:text-[#94A3B8] text-sm hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250 disabled:opacity-40 disabled:cursor-not-allowed"
                >&gt;</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-[#94A3B8]">Show</span>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="h-8 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#111827] text-gray-700 dark:text-[#F8FAFC] px-2 outline-none"
                >
                  {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <span className="text-sm text-gray-500 dark:text-[#94A3B8]">entries</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
