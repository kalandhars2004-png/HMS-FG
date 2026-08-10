'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  RotateCw, Maximize, House, Search, CalendarDays, Filter, Columns, ArrowUpDown,
  ArrowUpToLine, ChevronDown, X, Check, EllipsisVertical, Timer, AlertTriangle,
} from '@/components/ui/LucideIcon';
import { ProductsAPI } from '@/lib/api';

interface ExpiryEntry {
  sku: string;
  item: string;
  category: string;
  batchId: string;
  expiryDate: string;
  quantity: number;
  supplier: string;
  status: string;
}

const CATEGORY_BADGE: Record<string, string> = {
  Tablet: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  Syrup: 'bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400',
  Injection: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  Oinment: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400',
  Capsule: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  Drops: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  'Medical Devices': 'bg-gray-100 text-gray-700 dark:bg-white/[0.06] dark:text-gray-300',
  Supplements: 'bg-lime-50 text-lime-700 dark:bg-lime-500/10 dark:text-lime-400',
  Uncategorized: 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400',
};

const STATUS_BADGE: Record<string, string> = {
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  purple: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  danger: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

const SUPPLIER_AVATARS: Record<string, string> = {
  'MedLife Distributors': 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  'HealthCare Pharma': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'GreenCross Medicals': 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  'NovaCure Pharma': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  'CareWell Agency': 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  'Zenith Distributors': 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  'LifeLine Pharma': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  'SafeMeds Distribution': 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
  'NovaHealth Pharma': 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  'PrimeCare Pharma': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
};

const TEMPLATE_ROWS: ExpiryEntry[] = [
  { sku: '#TAB016', item: 'Paracetamol 500', category: 'Tablet', batchId: '#BTH016', expiryDate: '28 Jan 2026', quantity: 20, supplier: 'MedLife Distributors', status: 'Expire in 2 days' },
  { sku: '#TAB015', item: 'Amoxicillin 250', category: 'Tablet', batchId: '#BTH015', expiryDate: '15 Feb 2026', quantity: 200, supplier: 'HealthCare Pharma', status: 'Expire in 20 days' },
  { sku: '#SYR014', item: 'Cetirizine', category: 'Syrup', batchId: '#BTH014', expiryDate: '10 Mar 2026', quantity: 40, supplier: 'GreenCross Medicals', status: 'Expired' },
  { sku: '#TAB013', item: 'Ceftriaxone 20', category: 'Tablet', batchId: '#BTH013', expiryDate: '14 Apr 2026', quantity: 120, supplier: 'NovaCure Pharma', status: 'Expire in 7 days' },
  { sku: '#CRE012', item: 'Betnovate', category: 'Oinment', batchId: '#BTH012', expiryDate: '30 May 2026', quantity: 60, supplier: 'CareWell Agency', status: 'Expire in 30 days' },
  { sku: '#TAB011', item: 'Amoxicillin 30', category: 'Tablet', batchId: '#BTH011', expiryDate: '02 Jun 2026', quantity: 310, supplier: 'Zenith Distributors', status: 'Expire in 10 days' },
  { sku: '#INJ010', item: 'Tetanus Toxoid', category: 'Injection', batchId: '#BTH010', expiryDate: '07 Jul 2026', quantity: 250, supplier: 'LifeLine Pharma', status: 'Expired' },
  { sku: '#SYR009', item: 'Atorvastatin', category: 'Syrup', batchId: '#BTH009', expiryDate: '21 Aug 2026', quantity: 35, supplier: 'SafeMeds Distribution', status: 'Expire in 7 days' },
  { sku: '#TAB008', item: 'Metformin 100', category: 'Tablet', batchId: '#BTH008', expiryDate: '17 Nov 2026', quantity: 150, supplier: 'NovaHealth Pharma', status: 'Expire in 30 days' },
  { sku: '#INJ007', item: 'Ondansetron', category: 'Injection', batchId: '#BTH007', expiryDate: '10 Dec 2026', quantity: 120, supplier: 'PrimeCare Pharma', status: 'Expired' },
];

const statusTone = (status: string): keyof typeof STATUS_BADGE =>
  status === 'Expired' ? 'danger' : status.includes('20') || status.includes('30') ? 'purple' : 'warning';

const COLUMN_DEFS = ['SKU', 'Item', 'Category', 'Batch ID', 'Expiry Date', 'Quantity', 'Supplier', 'Status'];

const MEDICINE_OPTIONS = ['Paracetamol 500', 'Amoxicillin 250', 'Cetirizine', 'Ceftriaxone 20', 'Betnovate', 'Amoxicillin 30', 'Tetanus Toxoid', 'Atorvastatin'];
const CATEGORY_OPTIONS = ['Uncategorized', 'Tablet', 'Capsule', 'Oinment', 'Syrup', 'Drops', 'Medical Devices', 'Supplements'];
const SUPPLIER_OPTIONS = ['MedLife Distributors', 'HealthCare Pharma', 'GreenCross Medicals', 'NovaCure Pharma', 'CareWell Agency', 'Zenith Distributors', 'LifeLine Pharma', 'SafeMeds Distribution'];
const STATUS_OPTIONS = ['Expire in 2 days', 'Expire in 20 days', 'Expired'];

const cardCls = 'bg-white dark:bg-[#161B22] rounded-[0.85rem] border border-gray-200/70 dark:border-[#273244] shadow-[0_2px_10px_rgba(15,23,42,0.04)] dark:shadow-none';
const dropdownBtnCls = 'inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250';

export default function ExpiryTrackingPage() {
  const [rows, setRows] = useState<ExpiryEntry[]>(TEMPLATE_ROWS);
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

  useEffect(() => {
    ProductsAPI.getAll().then((res: any) => {
      const list: any[] = res.data || [];
      if (list.length > 0) {
        const mapped: ExpiryEntry[] = list.slice(0, 10).map((p: any, i: number) => ({
          sku: p.sku || `#TAB${String(16 - i).padStart(3, '0')}`,
          item: p.name || 'Unnamed',
          category: p.categoryName || 'Tablet',
          batchId: `#BTH${String(16 - i).padStart(3, '0')}`,
          expiryDate: p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
          quantity: Number(p.quantity ?? p.stockQuantity ?? 0),
          supplier: p.supplierName || 'MedLife Distributors',
          status: ['Expire in 2 days', 'Expire in 20 days', 'Expired'][i % 3],
        }));
        setRows(mapped);
      }
    }).catch(() => {});
  }, []);

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

  const filteredMeds = MEDICINE_OPTIONS.filter(m => m.toLowerCase().includes(medSearch.toLowerCase()));
  const filteredCats = CATEGORY_OPTIONS.filter(c => c.toLowerCase().includes(catSearch.toLowerCase()));
  const filteredSups = SUPPLIER_OPTIONS.filter(s => s.toLowerCase().includes(supSearch.toLowerCase()));

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
          <button title="Refresh" className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-250 shadow-sm">
            <RotateCw className="w-4 h-4" />
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
                    <Timer className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm mb-1">No expiry records found</p>
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
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${CATEGORY_BADGE[row.category] || CATEGORY_BADGE.Uncategorized}`}>
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
                        <span className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold ${SUPPLIER_AVATARS[row.supplier] || 'bg-gray-100 text-gray-600'}`}>
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_BADGE[cat] || CATEGORY_BADGE.Uncategorized}`}>
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
                      <span className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold ${SUPPLIER_AVATARS[sup] || 'bg-gray-100 text-gray-600'}`}>
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
                  {STATUS_OPTIONS.map(status => (
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