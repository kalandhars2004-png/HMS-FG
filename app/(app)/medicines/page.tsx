'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProductsAPI } from '@/lib/api';
import { CATEGORY_ICONS } from '@/lib/constants';
import { formatCurrency } from '@/lib/currency';
import {
  Search, Edit, Trash2, Timer, ScanBarcode,
  RotateCw, Plus, Maximize, EllipsisVertical,
  House, X, AlertTriangle, CheckCircle2,
} from '@/components/ui/LucideIcon';
import GlobalModal, { GlobalConfirmModal } from '@/components/ui/GlobalModal';

interface MedicineDisplay {
  id: string;
  sku: string;
  name: string;
  genericName: string;
  category: string;
  quantity: number;
  price: number;
  stockValue: number;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  expiryDate: string;
  isActive: boolean;
}

const STOCK_STATUS_STYLES: Record<string, { dot: string; bg: string }> = {
  'In Stock': { dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/30' },
  'Low Stock': { dot: 'bg-orange-500', bg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700/30' },
  'Out of Stock': { dot: 'bg-red-500', bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700/30' },
};

function getStockStatus(qty: number): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  if (qty === 0) return 'Out of Stock';
  if (qty < 30) return 'Low Stock';
  return 'In Stock';
}

function getStats(medicines: MedicineDisplay[]) {
  const total = medicines.length;
  const inStock = medicines.filter(m => m.stockStatus === 'In Stock').length;
  const lowStock = medicines.filter(m => m.stockStatus === 'Low Stock').length;
  const outOfStock = medicines.filter(m => m.stockStatus === 'Out of Stock').length;
  return [
    { label: 'Total Medicine', value: total.toLocaleString(), trend: total > 0 ? `+${inStock}` : '0', up: true, icon: '💊' },
    { label: 'In Stock', value: inStock.toLocaleString(), trend: inStock > 0 ? `+${inStock}` : '0', up: true, icon: '📦' },
    { label: 'Low Stock', value: lowStock.toLocaleString(), trend: lowStock > 0 ? `${lowStock}` : '0', up: false, icon: '⚠️' },
    { label: 'Out of Stock', value: outOfStock.toLocaleString(), trend: outOfStock > 0 ? `${outOfStock}` : '0', up: false, icon: '🚫' },
  ];
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
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterStockStatus, setFilterStockStatus] = useState<string[]>([]);
  const [barcodeTarget, setBarcodeTarget] = useState<MedicineDisplay | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
          stockStatus: getStockStatus(qty),
          expiryDate: formatDate(p.expiryDate),
          isActive: true,
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
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    return true;
  });

  const uniqueCategories = [...new Set(medicines.map(m => m.category))].sort();

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const stats = getStats(filtered);

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
        {stats.map((card, i) => (
          <div key={i} className="bg-white dark:bg-[#161B22] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.35)] p-5 transition-all duration-250 hover:shadow-[0_15px_40px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 dark:hover:border-[#14B8A6]/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-[#94A3B8] m-0 flex items-center gap-2 mb-3">
                  <span className="text-base">{card.icon}</span> {card.label}
                </p>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-[#F8FAFC] m-0 flex items-center gap-2">
                  {card.value}
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 ${
                    card.up ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {card.trend}
                  </span>
                </h4>
              </div>
            </div>
          </div>
        ))}
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
                  {['In Stock', 'Low Stock', 'Out of Stock'].map(status => (
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
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Generic Name</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Category</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Quantity</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Price</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Stock Value</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">HTS Code</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Stock Status</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Manufacture</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Supplier</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Expiry Date</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#111827]">
                  {paginated.length === 0 ? (
                    <tr><td colSpan={14} className="px-4 py-16 text-center text-gray-400 dark:text-[#64748B] text-sm">No medicines found</td></tr>
                  ) : (
                    paginated.map((m) => {
                      const ss = STOCK_STATUS_STYLES[m.stockStatus];
                      const icon = CATEGORY_ICONS[m.category] || '📦';
                      return (
                        <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-[#1F2937]/50 transition-colors duration-250">
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-[#0F9291] text-sm font-medium">{m.sku}</span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-[#1F2937] text-xs">{icon}</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-[#F8FAFC]">{m.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500 dark:text-[#94A3B8]">{m.genericName}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700/30">
                              {m.category}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-900 dark:text-[#F8FAFC]">{m.quantity}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-900 dark:text-[#F8FAFC] font-medium">{formatCurrency(m.price)}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-900 dark:text-[#F8FAFC] font-medium">{formatCurrency(m.stockValue)}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500 dark:text-[#94A3B8]">-</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${ss.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                              {m.stockStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700 dark:text-[#F8FAFC]">-</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700 dark:text-[#F8FAFC]">-</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500 dark:text-[#94A3B8]">{m.expiryDate}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              m.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/30'
                                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700/30'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${m.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              {m.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-right">
                            <div className="relative" ref={dropdownRef}>
                              <button onClick={() => setOpenDropdown(openDropdown === m.id ? null : m.id)}
                                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 dark:text-[#64748B] hover:bg-gray-100 dark:hover:bg-[#1F2937] hover:text-gray-600 dark:hover:text-[#94A3B8] transition-all duration-250"
                              ><EllipsisVertical className="w-4 h-4" /></button>
                              {openDropdown === m.id && (
                                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#161B22] rounded-2xl border border-gray-200 dark:border-[#273244] w-[200px] z-50 p-2 animate-scaleIn shadow-xl">
                                  <button onClick={() => { router.push(`/medicines/create?id=${m.id}`); setOpenDropdown(null); }}
                                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#1F2937] hover:text-gray-900 dark:hover:text-[#F8FAFC] transition-all duration-250"
                                  ><Edit className="w-4 h-4" /> Edit</button>
                                  <button onClick={() => { showToast(`Inventory history for ${m.name} is not available`, 'success'); setOpenDropdown(null); }}
                                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#1F2937] hover:text-gray-900 dark:hover:text-[#F8FAFC] transition-all duration-250"
                                  ><Timer className="w-4 h-4" /> Inventory History</button>
                                  <button onClick={() => { setBarcodeTarget(m); setOpenDropdown(null); }}
                                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#1F2937] hover:text-gray-900 dark:hover:text-[#F8FAFC] transition-all duration-250"
                                  ><ScanBarcode className="w-4 h-4" /> Barcode/QR</button>
                                  <div className="pt-1 mt-1 border-t border-gray-100 dark:border-[#273244]">
                                    <button onClick={() => { setDeleteTarget(m); setOpenDropdown(null); }}
                                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-250"
                                    ><Trash2 className="w-4 h-4" /> Delete</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

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
