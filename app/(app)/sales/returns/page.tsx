'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Plus, RefreshCw, Maximize, Filter, Columns, ArrowUpDown, Upload, Eye, Edit2, Trash2, X, ChevronDown, Calendar, MoreVertical, House, ArrowUpToLine } from '@/components/ui/LucideIcon';
import { TransactionsAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';

interface SalesReturn {
  id: string;
  returnCode: string;
  customer: { name: string; initials: string; image?: string };
  invoiceNumber: string;
  date: string;
  amount: number;
  balance: number;
  refundStatus: 'Refunded' | 'Pending' | 'Partially Paid';
}

const MOCK_RETURNS: SalesReturn[] = [
  { id: '1', returnCode: '#SAR016', customer: { name: 'Andrew George', initials: 'AG' }, invoiceNumber: '#INV016', date: '28 Jan 2026', amount: 120, balance: 0, refundStatus: 'Refunded' },
  { id: '2', returnCode: '#SAR016', customer: { name: 'Andrew George', initials: 'AG', image: 'avatar-37' }, invoiceNumber: '#INV017', date: '28 Jan 2026', amount: 20, balance: 0, refundStatus: 'Pending' },
  { id: '3', returnCode: '#SAR016', customer: { name: 'Alex Smith', initials: 'AS' }, invoiceNumber: '#INV018', date: '10 Mar 2026', amount: 100, balance: 0, refundStatus: 'Partially Paid' },
  { id: '4', returnCode: '#SAR016', customer: { name: 'Emily Johnson', initials: 'EJ', image: 'avatar-39' }, invoiceNumber: '#INV019', date: '22 Apr 2026', amount: 100, balance: 15, refundStatus: 'Pending' },
  { id: '5', returnCode: '#SAR016', customer: { name: 'Andrew George', initials: 'AG' }, invoiceNumber: '#INV020', date: '28 Jan 2026', amount: 10, balance: 150, refundStatus: 'Refunded' },
  { id: '6', returnCode: '#SAR016', customer: { name: 'Andrew George', initials: 'AG', image: 'avatar-37' }, invoiceNumber: '#INV021', date: '28 Jan 2026', amount: 20, balance: 10, refundStatus: 'Partially Paid' },
  { id: '7', returnCode: '#SAR016', customer: { name: 'Alex Smith', initials: 'AS' }, invoiceNumber: '#INV022', date: '10 Mar 2026', amount: 20, balance: 10, refundStatus: 'Refunded' },
  { id: '8', returnCode: '#SAR016', customer: { name: 'Emily Johnson', initials: 'EJ', image: 'avatar-39' }, invoiceNumber: '#INV023', date: '22 Apr 2026', amount: 120, balance: 110, refundStatus: 'Refunded' },
];

const AVATAR_STYLES: Record<string, string> = {
  AG: 'bg-orange-50 border border-orange-200 text-orange-700',
  AS: 'bg-teal-50 border border-teal-200 text-teal-700',
  EJ: 'bg-cyan-50 border border-cyan-200 text-cyan-700',
  MB: 'bg-red-50 border border-red-200 text-red-700',
};

function getAvatarStyle(initials: string) {
  return AVATAR_STYLES[initials] || 'bg-gray-100 border border-gray-200 text-gray-700';
}

function getRefundBadge(status: string) {
  switch (status) {
    case 'Refunded': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'Pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'Partially Paid': return 'bg-sky-50 text-sky-700 border border-sky-200';
    default: return 'bg-gray-50 text-gray-700 border border-gray-200';
  }
}

function getRefundDot(status: string) {
  switch (status) {
    case 'Refunded': return 'bg-emerald-500';
    case 'Pending': return 'bg-amber-500';
    case 'Partially Paid': return 'bg-sky-500';
    default: return 'bg-gray-400';
  }
}

export default function SalesReturnPage() {
  const [returns, setReturns] = useState<SalesReturn[]>(MOCK_RETURNS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [visibleCols, setVisibleCols] = useState({ customer: true, invoiceNumber: true, date: true, amount: true, balance: true, refundStatus: true });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await TransactionsAPI.getAll();
        const txs: any[] = res.data || [];
        const filtered = txs.filter((t: any) => String(t.transactionType).toLowerCase().includes('return'));
        if (filtered.length > 0) {
          const mapped: SalesReturn[] = filtered.map((t: any, i: number) => {
            const name = t.user?.username || t.user?.name || 'Customer';
            const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
            const st = String(t.status || '').toLowerCase();
            let refundStatus: SalesReturn['refundStatus'] = 'Pending';
            if (st === 'received' || st === 'completed' || st === 'refunded') refundStatus = 'Refunded';
            else if (st === 'partial' || st === 'partially paid') refundStatus = 'Partially Paid';
            return {
              id: String(t.id ?? i),
              returnCode: `#SAR${String(t.id ?? i).padStart(3, '0')}`,
              customer: { name, initials },
              invoiceNumber: `#INV${String(t.id ?? i).padStart(3, '0')}`,
              date: new Date(t.transactionDate || t.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              amount: t.totalAmount ?? t.totalPrice ?? 0,
              balance: t.dueAmount ?? t.balance ?? 0,
              refundStatus,
            };
          });
          setReturns(mapped);
        }
      } catch { /* keep mock */ } finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { const t = e.target as HTMLElement; if (!t.closest('[data-menu]')) setOpenMenuId(null); if (!t.closest('[data-cols]')) setShowColumns(false); if (!t.closest('[data-sort]')) setShowSort(false); if (!t.closest('[data-export]')) setShowExport(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleDelete = () => {
    if (selectedReturn) { setReturns(r => r.filter(x => x.id !== selectedReturn.id)); setShowDeleteModal(false); setSelectedReturn(null); }
  };

  const filtered = returns.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.returnCode.toLowerCase().includes(q) || r.customer.name.toLowerCase().includes(q) || r.invoiceNumber.toLowerCase().includes(q) || r.refundStatus.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 sm:p-6 bg-[#f8f9fa] min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        {/* Breadcrumb + Actions — exact DreamPOS header */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm mb-0 p-0 list-none">
              <li className="flex items-center gap-1.5">
                <a href="/dashboard" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 no-underline">
                  <House className="w-4 h-4" /> Dashboard
                </a>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium" aria-current="page">Sales Returns</li>
            </ol>
          </nav>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600" aria-label="Refresh" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600" aria-label="Maximize" title="Maximize">
              <Maximize className="w-4 h-4" />
            </button>
            <Link href="/sales/returns/add" className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F9291] hover:bg-[#0e7a79] text-white rounded-lg text-sm font-medium shadow-sm no-underline">
              <Plus className="w-4 h-4" /> Add New
            </Link>
          </div>
        </div>

        {/* Card — DreamPOS .card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* card-header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center flex-wrap gap-2">
                {/* Search — DreamPOS table-search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-64 h-9 pl-9 pr-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20" />
                </div>
                {/* Date Range — DreamPOS bookingrange */}
                <div className="relative hidden sm:flex">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input type="text" placeholder="Date Range" readOnly
                    className="w-44 h-9 pl-9 pr-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none cursor-pointer" />
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                {/* Filter — offcanvas trigger */}
                <button onClick={() => setShowFilter(true)} className="w-9 h-9 inline-flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600" title="Filter">
                  <Filter className="w-4 h-4" />
                </button>
                {/* Columns */}
                <div className="relative" data-cols>
                  <button onClick={() => setShowColumns(v => !v)} className="h-9 px-3 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                    <Columns className="w-4 h-4" /> Columns
                  </button>
                  {showColumns && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-20">
                      <ul className="list-none m-0 p-2">
                        {[
                          { key: 'customer', label: 'Customer' },
                          { key: 'invoiceNumber', label: 'Invoice Number' },
                          { key: 'date', label: 'Date' },
                          { key: 'amount', label: 'Amount' },
                          { key: 'balance', label: 'Balance' },
                          { key: 'refundStatus', label: 'Refund Status' },
                        ].map(col => (
                          <li key={col.key} className="px-2 py-1.5 hover:bg-gray-50 rounded-lg">
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                              <MoreVertical className="w-3 h-3 text-gray-400" />
                              <input type="checkbox" checked={visibleCols[col.key as keyof typeof visibleCols]} onChange={() => setVisibleCols(s => ({ ...s, [col.key]: !s[col.key as keyof typeof s] }))} className="w-4 h-4 rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291]" />
                              {col.label}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {/* Sort by */}
                <div className="relative" data-sort>
                  <button onClick={() => setShowSort(v => !v)} className="h-9 px-3 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                    <ArrowUpDown className="w-4 h-4" /> Sort by
                  </button>
                  {showSort && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-20">
                      <ul className="list-none m-0 p-1">
                        {[
                          { a: 'Name', b: 'Z-A' }, { a: 'Price', b: 'High-Low' }, { a: 'Price', b: 'Low-High' },
                          { a: 'Stock', b: 'High-Low' }, { a: 'Stock', b: 'Low-High' },
                          { a: 'Expiry', b: 'Near Expiry-Valid' }, { a: 'Expiry', b: 'Valid-Near Expiry' },
                        ].map(s => (
                          <li key={s.a + s.b}><a href="#" onClick={e => e.preventDefault()} className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg no-underline"><span>{s.a}</span><span className="text-xs text-gray-400">{s.b}</span></a></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {/* Import */}
                <button className="h-9 px-3 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                  <Upload className="w-4 h-4" /> Import
                </button>
                {/* Export */}
                <div className="relative" data-export>
                  <button onClick={() => setShowExport(v => !v)} className="h-9 px-3 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                    <ArrowUpToLine className="w-4 h-4" /> Export
                  </button>
                  {showExport && (
                    <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-20">
                      <a href="#" onClick={e => { e.preventDefault(); setShowExport(false); window.print(); }} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline">Export as PDF</a>
                      <a href="#" onClick={e => { e.preventDefault(); setShowExport(false); }} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline">Export as Excel</a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* card-body p-0 — table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f8f9fa] border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                  {visibleCols.customer && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>}
                  {visibleCols.invoiceNumber && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice Number</th>}
                  {visibleCols.date && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>}
                  {visibleCols.amount && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>}
                  {visibleCols.balance && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>}
                  {visibleCols.refundStatus && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Refund Status</th>}
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500 text-sm">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500 text-sm">No returns found</td></tr>
                ) : filtered.map((ret) => (
                  <tr key={ret.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3"><a href="#" onClick={e => e.preventDefault()} className="text-[#0ea5e9] hover:underline font-medium no-underline">{ret.returnCode}</a></td>
                    {visibleCols.customer && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-full inline-flex items-center justify-center text-xs font-semibold shrink-0 ${getAvatarStyle(ret.customer.initials)}`}>
                            {ret.customer.initials}
                          </span>
                          <a href="#" onClick={e => e.preventDefault()} className="font-medium text-gray-900 hover:text-[#0F9291] no-underline">{ret.customer.name}</a>
                        </div>
                      </td>
                    )}
                    {visibleCols.invoiceNumber && <td className="px-4 py-3"><a href="#" onClick={e => e.preventDefault()} className="text-[#0ea5e9] hover:underline font-medium no-underline">{ret.invoiceNumber}</a></td>}
                    {visibleCols.date && <td className="px-4 py-3 text-gray-600">{ret.date}</td>}
                    {visibleCols.amount && <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(ret.amount)}</td>}
                    {visibleCols.balance && <td className="px-4 py-3 text-gray-600">{ret.balance > 0 ? formatCurrency(ret.balance) : <span className="text-gray-400">-</span>}</td>}
                    {visibleCols.refundStatus && (
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getRefundBadge(ret.refundStatus)}`}>
                          <span className={`w-2 h-2 rounded-full ${getRefundDot(ret.refundStatus)}`} /> {ret.refundStatus}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-flex" data-menu>
                        <button onClick={() => setOpenMenuId(openMenuId === ret.id ? null : ret.id)} className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === ret.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-30">
                            <a href="#" onClick={e => { e.preventDefault(); setOpenMenuId(null); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"><Eye className="w-4 h-4" /> View Details</a>
                            <a href="#" onClick={e => { e.preventDefault(); setOpenMenuId(null); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"><Edit2 className="w-4 h-4" /> Edit</a>
                            <a href="#" onClick={e => { e.preventDefault(); setSelectedReturn(ret); setShowDeleteModal(true); setOpenMenuId(null); }} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 no-underline"><Trash2 className="w-4 h-4" /> Delete</a>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* DreamPOS datatable footer */}
          <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-t border-gray-100 bg-white">
            <div className="text-sm text-gray-500">Showing {filtered.length} of {returns.length} entries</div>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40" disabled>Previous</button>
              <button className="px-3 py-1.5 text-sm bg-[#0F9291] text-white rounded-lg">1</button>
              <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Next</button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Entries per page</span>
              <select className="h-8 px-2 border border-gray-200 rounded-lg bg-white text-sm"><option>10</option><option>25</option><option>50</option></select>
            </div>
          </div>
        </div>
      </div>

      {/* Offcanvas Filter — DreamPOS #add_filter */}
      {showFilter && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={() => setShowFilter(false)} />
          <div className="relative w-full max-w-[360px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900 m-0">
                <span className="w-8 h-8 rounded-full bg-[#0F9291] text-white inline-flex items-center justify-center"><Filter className="w-4 h-4" /></span> Filter
              </h4>
              <button onClick={() => setShowFilter(false)} className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Customer */}
              <div>
                <button className="flex items-center justify-between w-full text-left font-semibold text-sm text-gray-900 mb-3">Customer <ChevronDown className="w-4 h-4 text-gray-400" /></button>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input placeholder="Search" className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20" />
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Andrew George', ini: 'AG' }, { name: 'Anderson Claire', ini: 'AC', img: true }, { name: 'Alex Smith', ini: 'AS' },
                    { name: 'Emily Johnson', ini: 'EJ', img: true }, { name: 'Michael Brown', ini: 'MB' },
                  ].map(p => (
                    <label key={p.name} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291]" />
                      <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-semibold shrink-0 ${getAvatarStyle(p.ini)}`}>{p.ini}</span>
                      <span className="text-sm text-gray-700">{p.name}</span>
                    </label>
                  ))}
                  <a href="#" onClick={e => e.preventDefault()} className="text-sm text-[#0F9291] hover:underline no-underline">View More</a>
                </div>
              </div>
              {/* Sales */}
              <div className="pt-4 border-t border-gray-100">
                <button className="flex items-center justify-between w-full text-left font-semibold text-sm text-gray-900 mb-3">Sales <ChevronDown className="w-4 h-4 text-gray-400" /></button>
                <p className="text-sm text-gray-600">Price : <span className="font-semibold text-gray-900">₹200 - ₹5,695</span></p>
                <input type="range" className="w-full mt-2 accent-[#0F9291]" />
              </div>
              {/* Refund Status */}
              <div className="pt-4 border-t border-gray-100">
                <button className="flex items-center justify-between w-full text-left font-semibold text-sm text-gray-900 mb-3">Refund Status <ChevronDown className="w-4 h-4 text-gray-400" /></button>
                <div className="space-y-2">
                  {(['Refunded', 'Partially Paid', 'Pending'] as const).map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291]" />
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getRefundBadge(s)}`}><span className={`w-2 h-2 rounded-full ${getRefundDot(s)}`} />{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-2">
              <button onClick={() => setShowFilter(false)} className="flex-1 h-10 inline-flex items-center justify-center gap-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium"> <X className="w-4 h-4" /> Cancel</button>
              <button onClick={() => setShowFilter(false)} className="flex-1 h-10 inline-flex items-center justify-center gap-2 bg-[#0F9291] hover:bg-[#0e7a79] text-white rounded-lg text-sm font-medium">Apply Filter</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal — DreamPOS #delete_modal */}
      {showDeleteModal && selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-8 h-8 text-red-500" /></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Delete Confirmation</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete {selectedReturn.returnCode} ?</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-5 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium">Cancel</button>
              <button onClick={handleDelete} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
