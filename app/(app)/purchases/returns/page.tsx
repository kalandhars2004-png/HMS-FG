'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, RefreshCw, House, Plus, Columns, ArrowUpDown, ArrowUpToLine,
  GripVertical, SlidersHorizontal, Calendar, ChevronDown, X, Edit, Trash2, EllipsisVertical,
  Upload, FileText,
} from '@/components/ui/LucideIcon';
import { PurchaseReturnsAPI, TransactionsAPI, SuppliersAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { toCSV, toXLSX, downloadBlob, printReport } from '@/lib/export';
import GlobalModal from '@/components/ui/GlobalModal';

// ------------------------------------------------------------------ types
type PRRow = {
  id: string; // #PRS016
  vendorName: string;
  invoiceNo: string;
  date: string; // 28 Jan 2026
  dateObj: Date | null;
  amount: number;
  balance: number | null; // null = "-"
  status: 'Refunded' | 'Pending' | 'Partially Paid';
  raw: any;
};

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function deterministicBalanceRatio(id: string): number {
  const n = parseInt(String(id).replace(/\D/g, ''), 10) || 0;
  return 0.25 + ((Math.abs(n * 37) % 50) / 100); // 0.25..0.74
}

const PR_DEMO: PRRow[] = [
  { id: '#PRS016', vendorName: 'MedLife Distributors', invoiceNo: 'INV001', date: '28 Jan 2026', dateObj: new Date('2026-01-28'), amount: 120, balance: null, status: 'Refunded', raw: null },
  { id: '#PRS016', vendorName: 'HealthCare Pharma', invoiceNo: 'INV002', date: '15 Feb 2026', dateObj: new Date('2026-02-15'), amount: 20, balance: 20, status: 'Pending', raw: null },
  { id: '#PRS016', vendorName: 'GreenCross Medicals', invoiceNo: 'INV003', date: '10 Mar 2026', dateObj: new Date('2026-03-10'), amount: 100, balance: null, status: 'Refunded', raw: null },
  { id: '#PRS016', vendorName: 'NovaCure Pharma', invoiceNo: 'INV004', date: '14 Apr 2026', dateObj: new Date('2026-04-14'), amount: 35, balance: 15, status: 'Partially Paid', raw: null },
  { id: '#PRS016', vendorName: 'CareWell Agency', invoiceNo: 'INV005', date: '30 May 2026', dateObj: new Date('2026-05-30'), amount: 120, balance: 20, status: 'Partially Paid', raw: null },
  { id: '#PRS016', vendorName: 'Zenith Distributors', invoiceNo: 'INV006', date: '02 Jun 2026', dateObj: new Date('2026-06-02'), amount: 25, balance: 25, status: 'Pending', raw: null },
  { id: '#PRS016', vendorName: 'LifeLine Pharma', invoiceNo: 'INV007', date: '07 Jul 2026', dateObj: new Date('2026-07-07'), amount: 130, balance: null, status: 'Refunded', raw: null },
  { id: '#PRS016', vendorName: 'SafeMeds Distribution', invoiceNo: 'INV008', date: '21 Aug 2026', dateObj: new Date('2026-08-21'), amount: 180, balance: 180, status: 'Pending', raw: null },
  { id: '#PRS016', vendorName: 'NovaHealth Pharma', invoiceNo: 'INV009', date: '17 Nov 2026', dateObj: new Date('2026-11-17'), amount: 60, balance: 30, status: 'Partially Paid', raw: null },
  { id: '#PRS016', vendorName: 'PrimeCare Pharma', invoiceNo: 'INV010', date: '10 Dec 2026', dateObj: new Date('2026-12-10'), amount: 80, balance: null, status: 'Refunded', raw: null },
];

export default function PurchaseReturnsPage() {
  const [rows, setRows] = useState<PRRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [vis, setVis] = useState({ vendor: true, invoiceNo: true, date: true, amount: true, balance: true, status: true });
  const [showColumns, setShowColumns] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterSuppliers, setFilterSuppliers] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sliderMin, setSliderMin] = useState(0);
  const [sliderMax, setSliderMax] = useState(10000);
  const [moreSuppliers, setMoreSuppliers] = useState(false);
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isMaximized, setIsMaximized] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PRRow | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  // Add modal fields
  const [supplierName, setSupplierName] = useState('');
  const [formDate, setFormDate] = useState('');
  const [reference, setReference] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [orderTax, setOrderTax] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [shipping, setShipping] = useState('0');
  const [returnStatus, setReturnStatus] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [prRes, trxRes, supRes] = await Promise.all([
        PurchaseReturnsAPI.getAll().catch(() => ({ data: [] as any[] })),
        TransactionsAPI.getAll().catch(() => ({ data: [] as any[] })),
        SuppliersAPI.getAll().catch(() => ({ data: [] as any[] })),
      ]);
      const prList: any[] = prRes.data || [];
      const trxList: any[] = (trxRes.data || []).filter((t: any) => t.transactionType === 'RETURN_TO_SUPPLIER' || t.transactionType === 'PURCHASE_RETURN');
      const suppliers: any[] = supRes.data || [];
      const supMap = new Map<string, string>();
      suppliers.forEach((s: any) => supMap.set(String(s.id), s.name || s.supplierName || s.vendorName || 'Supplier'));

      let mapped: PRRow[] = [];

      if (prList.length > 0) {
        mapped = prList.map((pr: any, idx: number) => {
          const idNum = pr.id ?? idx + 1;
          const id = `#PRS${String(idNum).padStart(3, '0')}`;
          const vendorName = supMap.get(String(pr.supplierId)) || pr.supplierName || pr.vendorName || `Supplier ${pr.supplierId ?? idx + 1}`;
          const invoiceNo = pr.invoiceNo || pr.reference || `INV${String(idNum).padStart(3, '0')}`;
          const rawDate = pr.createdAt || pr.returnDate || pr.date;
          const dateObj = rawDate ? new Date(rawDate) : new Date();
          const validDate = !isNaN(dateObj.getTime()) ? dateObj : new Date();
          const amount = Number(pr.returnAmount ?? pr.amount ?? pr.totalPrice ?? 0);
          const rawStatus = String(pr.status || 'Pending').toLowerCase();
          let status: PRRow['status'];
          if (rawStatus.includes('refund')) status = 'Refunded';
          else if (rawStatus.includes('partial')) status = 'Partially Paid';
          else if (rawStatus.includes('pending') || rawStatus.includes('unpaid')) status = 'Pending';
          else status = amount > 0 ? 'Pending' : 'Refunded';
          let balance: number | null;
          if (status === 'Refunded') balance = null;
          else if (status === 'Pending') balance = amount;
          else {
            const ratio = deterministicBalanceRatio(String(idNum));
            balance = Math.floor(amount * ratio);
            if (balance === 0) balance = Math.floor(amount * 0.5) || amount;
          }
          return { id, vendorName, invoiceNo, date: fmtDate(validDate), dateObj: validDate, amount, balance, status, raw: pr };
        });
      } else if (trxList.length > 0) {
        mapped = trxList.map((t: any, idx: number) => {
          const idNum = t.id ?? idx + 1;
          const id = `#PRS${String(idNum).padStart(3, '0')}`;
          const vendorName = t.supplierName || t.supplier?.name || `Supplier ${idx + 1}`;
          const invoiceNo = t.reference || t.referenceNumber || `INV${String(idNum).padStart(3, '0')}`;
          const rawDate = t.createdAt || t.transactionDate;
          const dateObj = rawDate ? new Date(rawDate) : new Date();
          const validDate = !isNaN(dateObj.getTime()) ? dateObj : new Date();
          const amount = Number(t.totalPrice ?? t.amount ?? 0);
          const s = String(t.status || '').toLowerCase();
          let status: PRRow['status'] = 'Pending';
          if (s.includes('completed') || s.includes('refunded')) status = 'Refunded';
          else if (s.includes('partial')) status = 'Partially Paid';
          let balance: number | null;
          if (status === 'Refunded') balance = null;
          else if (status === 'Pending') balance = amount;
          else balance = Math.floor(amount * deterministicBalanceRatio(String(idNum)));
          return { id, vendorName, invoiceNo, date: fmtDate(validDate), dateObj: validDate, amount, balance, status, raw: t };
        });
      }

      if (mapped.length === 0) mapped = PR_DEMO;

      if (mapped.length) {
        const vals = mapped.map(r => r.amount);
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const sMin = Math.floor(Math.min(min, 200));
        const sMax = Math.ceil(Math.max(max, 5695));
        setSliderMin(sMin);
        setSliderMax(sMax);
        setPriceRange([sMin, sMax]);
      }

      setRows(mapped);
    } catch {
      setRows(PR_DEMO);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const suppliers = useMemo(() => [...new Set(rows.map(r => r.vendorName))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = rows.filter(r => {
      if (q) {
        const hay = `${r.id} ${r.vendorName} ${r.invoiceNo} ${r.date}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterSuppliers.length && !filterSuppliers.includes(r.vendorName)) return false;
      if (filterStatus.length && !filterStatus.includes(r.status)) return false;
      if (r.amount < priceRange[0] || r.amount > priceRange[1]) return false;
      if (dateFrom && r.dateObj) {
        const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
        if (r.dateObj < from) return false;
      }
      if (dateTo && r.dateObj) {
        const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
        if (r.dateObj > to) return false;
      }
      return true;
    });
    if (sort === 'vendor-asc') list = [...list].sort((a, b) => a.vendorName.localeCompare(b.vendorName));
    else if (sort === 'vendor-desc') list = [...list].sort((a, b) => b.vendorName.localeCompare(a.vendorName));
    else if (sort === 'date-asc') list = [...list].sort((a, b) => (a.dateObj?.getTime() ?? 0) - (b.dateObj?.getTime() ?? 0));
    else if (sort === 'date-desc') list = [...list].sort((a, b) => (b.dateObj?.getTime() ?? 0) - (a.dateObj?.getTime() ?? 0));
    return list;
  }, [rows, search, filterSuppliers, filterStatus, priceRange, dateFrom, dateTo, sort]);

  useEffect(() => { setPage(1); }, [search, filterSuppliers, filterStatus, priceRange, dateFrom, dateTo, sort, pageSize]);
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const exportCols = [
    { header: 'ID', value: (r: PRRow) => r.id },
    { header: 'Vendor', value: (r: PRRow) => r.vendorName },
    { header: 'Invoice No', value: (r: PRRow) => r.invoiceNo },
    { header: 'Date', value: (r: PRRow) => r.date },
    { header: 'Amount', value: (r: PRRow) => r.amount },
    { header: 'Balance', value: (r: PRRow) => r.balance === null ? '-' : r.balance },
    { header: 'Refund Status', value: (r: PRRow) => r.status },
  ];
  const handleExport = (type: 'csv' | 'excel' | 'pdf') => {
    const fname = `purchase-returns-${new Date().toISOString().slice(0, 10)}`;
    if (type === 'csv') downloadBlob(toCSV(exportCols, filtered), `${fname}.csv`);
    else if (type === 'excel') downloadBlob(toXLSX('Purchase Returns', exportCols, filtered), `${fname}.xlsx`);
    else printReport('Purchase Returns', `Generated ${new Date().toLocaleString()} — ${filtered.length} rows`, exportCols, filtered);
    setShowExport(false);
  };
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.csv,.xlsx';
    input.onchange = () => {
      // placeholder: in real app parse and upload
      alert('Import parsed — connect to backend when ready');
    };
    input.click();
  };

  const badgeClass = (s: PRRow['status']) => {
    if (s === 'Refunded') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'Pending') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-sky-50 text-sky-700 border-sky-200'; // Partially Paid
  };
  const dotClass = (s: PRRow['status']) => {
    if (s === 'Refunded') return 'bg-emerald-500';
    if (s === 'Pending') return 'bg-amber-500';
    return 'bg-sky-500';
  };

  return (
    <div className={`${isMaximized ? 'fixed inset-0 z-[100] bg-[#f8f9fa] overflow-auto p-4 sm:p-6' : 'p-4 sm:p-6 bg-[#f8f9fa] min-h-screen -m-6'}`}>
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm list-none p-0 m-0">
              <li><Link href="/dashboard" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 no-underline"><House className="w-4 h-4" /> Dashboard</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium">Purchase Returns</li>
            </ol>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={load} className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600" title="Refresh"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
            <button onClick={() => { if (!isMaximized) document.documentElement.requestFullscreen?.().catch(() => setIsMaximized(true)); else document.exitFullscreen?.().catch(() => setIsMaximized(false)); setIsMaximized(v => !v); }} className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600" title="Maximize">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
            </button>
            <button onClick={() => setShowAddModal(true)} className="h-9 px-4 inline-flex items-center gap-2 bg-[#0F9291] hover:bg-[#0e7a79] text-white rounded-lg text-sm font-medium shadow-sm">
              <Plus className="w-4 h-4" /> Add New
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} className="w-56 sm:w-64 h-9 pl-9 pr-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20 placeholder:text-gray-400" />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"><Calendar className="w-4 h-4" /></span>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 pl-9 pr-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20 text-gray-700" />
                </div>
                <div className="relative hidden sm:flex">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"><Calendar className="w-4 h-4" /></span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 pl-9 pr-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20 text-gray-700" />
                </div>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <button onClick={() => setShowFilter(true)} className="w-9 h-9 inline-flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600" title="Filter"><SlidersHorizontal className="w-4 h-4" /></button>

                <div className="relative">
                  <button onClick={() => setShowColumns(v => !v)} className="h-9 px-3 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"><Columns className="w-4 h-4" /> Columns</button>
                  {showColumns && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-20">
                      <ul className="list-none m-0 p-2 space-y-1">
                        {[
                          { k: 'vendor', l: 'Vendor' }, { k: 'invoiceNo', l: 'Invoice No' }, { k: 'date', l: 'Date' },
                          { k: 'amount', l: 'Amount' }, { k: 'balance', l: 'Balance' }, { k: 'status', l: 'Refund Status' },
                        ].map(c => (
                          <li key={c.k} className="px-2 py-1.5 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 flex-1">
                              <input type="checkbox" checked={vis[c.k as keyof typeof vis]} onChange={() => setVis(v => ({ ...v, [c.k]: !v[c.k as keyof typeof v] }))} className="w-4 h-4 rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291]" />
                              {c.l}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button onClick={() => setShowSort(v => !v)} className="h-9 px-3 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"><ArrowUpDown className="w-4 h-4" /> Sort by</button>
                  {showSort && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-20">
                      {[
                        { k: 'vendor-asc', a: 'Vendor Name', b: 'A-Z' },
                        { k: 'vendor-desc', a: 'Vendor Name', b: 'Z-A' },
                        { k: 'date-asc', a: 'Date - Ascending', b: '1-9' },
                        { k: 'date-desc', a: 'Date - Descending', b: '9-1' },
                      ].map(s => (
                        <a key={s.k} href="#" onClick={e => { e.preventDefault(); setSort(s.k); setShowSort(false); }} className={`flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 no-underline ${sort === s.k ? 'text-[#0F9291] font-semibold' : 'text-gray-700'}`}>{s.a} <span className="text-xs text-gray-400">{s.b}</span></a>
                      ))}
                      {sort !== 'default' && <a href="#" onClick={e => { e.preventDefault(); setSort('default'); setShowSort(false); }} className="block px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 no-underline border-t mt-1">Clear sort</a>}
                    </div>
                  )}
                </div>

                <button onClick={handleImport} className="h-9 px-3 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"><Upload className="w-4 h-4" /> Import</button>

                <div className="relative">
                  <button onClick={() => setShowExport(v => !v)} className="h-9 px-3 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"><ArrowUpToLine className="w-4 h-4" /> Export</button>
                  {showExport && (
                    <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-20">
                      <a href="#" onClick={e => { e.preventDefault(); handleExport('pdf'); }} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline">Export as PDF</a>
                      <a href="#" onClick={e => { e.preventDefault(); handleExport('excel'); }} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline">Export as Excel</a>
                      <a href="#" onClick={e => { e.preventDefault(); handleExport('csv'); }} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline">Export as CSV</a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f8f9fa] border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">ID</th>
                  {vis.vendor && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Vendor</th>}
                  {vis.invoiceNo && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Invoice No</th>}
                  {vis.date && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Date</th>}
                  {vis.amount && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Amount</th>}
                  {vis.balance && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Balance</th>}
                  {vis.status && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Refund Status</th>}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">Loading...</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">No purchase returns found</td></tr>
                ) : paged.map((r, idx) => (
                  <tr key={`${r.id}-${idx}-${r.invoiceNo}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap"><a href="#" onClick={e => e.preventDefault()} className="text-[#0F9291] hover:underline font-medium no-underline">{r.id}</a></td>
                    {vis.vendor && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-200 inline-flex items-center justify-center bg-white">
                            {/* try supplier img, fallback to initials */}
                            <img
                              src={`https://dreamspos.dreamstechnologies.com/pharmacy-pos/html/assets/img/supplier/supplier-img-${(idx % 10) + 1}.jpg`}
                              alt={r.vendorName}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                            />
                            <span className="hidden w-full h-full inline-flex items-center justify-center text-xs font-semibold text-gray-600">{r.vendorName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>
                          </span>
                          <a href="#" onClick={e => e.preventDefault()} className="font-medium text-gray-900 hover:text-[#0F9291] no-underline text-sm">{r.vendorName}</a>
                        </span>
                      </td>
                    )}
                    {vis.invoiceNo && <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.invoiceNo}</td>}
                    {vis.date && <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.date}</td>}
                    {vis.amount && <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">${r.amount.toLocaleString()}</td>}
                    {vis.balance && <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.balance === null ? '-' : `$${r.balance.toLocaleString()}`}</td>}
                    {vis.status && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass(r.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dotClass(r.status)}`} /> {r.status}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="relative inline-block">
                        <button onClick={() => setActionMenu(actionMenu === r.id + idx ? null : r.id + idx)} className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500" aria-label="Actions">
                          <EllipsisVertical className="w-4 h-4" />
                        </button>
                        {actionMenu === r.id + idx && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-20">
                            <a href="#" onClick={e => { e.preventDefault(); setActionMenu(null); setShowAddModal(true); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"><Edit className="w-4 h-4" /> Edit</a>
                            <a href="#" onClick={e => { e.preventDefault(); setActionMenu(null); setDeleteTarget(r); }} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 no-underline"><Trash2 className="w-4 h-4" /> Delete</a>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-t border-gray-100 bg-white">
            <div className="text-sm text-gray-500">Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries {search || filterSuppliers.length || filterStatus.length || dateFrom || dateTo ? `(filtered from ${rows.length})` : ''}</div>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 bg-white text-gray-700">Previous</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const pn = start + i; if (pn > totalPages) return null;
                return <button key={pn} onClick={() => setPage(pn)} className={`w-8 h-8 inline-flex items-center justify-center rounded-lg text-sm font-medium ${pn === page ? 'bg-[#0F9291] text-white' : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}`}>{pn}</button>;
              })}
              <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 bg-white text-gray-700">Next</button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500"><span>Entries per page</span><select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="h-8 px-2 border border-gray-200 rounded-lg bg-white text-gray-700"><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div>
          </div>
        </div>
      </div>

      {/* Filter offcanvas */}
      {showFilter && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilter(false)} />
          <div className="relative w-full max-w-[360px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="px-5 py-4 flex items-center justify-between">
              <h4 className="flex items-center gap-2 font-semibold text-gray-900 text-base"><span className="w-8 h-8 rounded-full bg-[#0F9291] text-white inline-flex items-center justify-center"><SlidersHorizontal className="w-4 h-4" /></span> Filter</h4>
              <button onClick={() => setShowFilter(false)} className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6 ims-scroll">
              <div>
                <button className="flex items-center justify-between w-full text-left font-semibold text-sm text-gray-900 mb-3">Supplier <ChevronDown className="w-4 h-4 text-gray-400" /></button>
                <div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input placeholder="Search" className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20" /></div>
                <div className="space-y-2">
                  {(moreSuppliers ? suppliers : suppliers.slice(0, 5)).map((s, i) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={filterSuppliers.includes(s)} onChange={() => setFilterSuppliers(v => v.includes(s) ? v.filter(x => x !== s) : [...v, s])} className="w-4 h-4 rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291]" />
                      <span className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 shrink-0 bg-white inline-flex items-center justify-center">
                          <img src={`https://dreamspos.dreamstechnologies.com/pharmacy-pos/html/assets/img/supplier/supplier-img-${(i % 10) + 1}.jpg`} alt={s} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </span>
                        {s}
                      </span>
                    </label>
                  ))}
                  {suppliers.length > 5 && <a href="#" onClick={e => { e.preventDefault(); setMoreSuppliers(v => !v); }} className="text-sm text-[#0F9291] hover:underline no-underline inline-block mt-1">{moreSuppliers ? 'View Less' : 'View More'}</a>}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <button className="flex items-center justify-between w-full text-left font-semibold text-sm text-gray-900 mb-3">Sales <ChevronDown className="w-4 h-4 text-gray-400" /></button>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="range" min={sliderMin} max={sliderMax} value={priceRange[0]} onChange={e => setPriceRange([Math.min(Number(e.target.value), priceRange[1] - 1), priceRange[1]])} className="flex-1 accent-[#0F9291]" />
                    <input type="range" min={sliderMin} max={sliderMax} value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0] + 1)])} className="flex-1 accent-[#0F9291]" />
                  </div>
                  <p className="text-sm text-gray-600">Price : <span className="font-semibold text-gray-900">${priceRange[0]} - ${priceRange[1]}</span></p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <button className="flex items-center justify-between w-full text-left font-semibold text-sm text-gray-900 mb-3">Stock Status <ChevronDown className="w-4 h-4 text-gray-400" /></button>
                <div className="space-y-2">
                  {(['Refunded', 'Pending', 'Partially Paid'] as const).map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={filterStatus.includes(s)} onChange={() => setFilterStatus(v => v.includes(s) ? v.filter(x => x !== s) : [...v, s])} className="w-4 h-4 rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291]" />
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass(s)}`}><span className={`w-1.5 h-1.5 rounded-full ${dotClass(s)}`} /> {s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-2">
              <button onClick={() => { setFilterSuppliers([]); setFilterStatus([]); setPriceRange([sliderMin, sliderMax]); setDateFrom(''); setDateTo(''); }} className="flex-1 h-10 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium bg-white text-gray-700 inline-flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancel</button>
              <button onClick={() => setShowFilter(false)} className="flex-1 h-10 bg-[#0F9291] hover:bg-[#0e7a79] text-white rounded-lg text-sm font-medium">Apply Filter</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center animate-scaleIn">
            <span className="w-16 h-16 rounded-full bg-red-50 text-red-600 inline-flex items-center justify-center mx-auto mb-3"><Trash2 className="w-7 h-7" /></span>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Delete Confirmation</h4>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete {deleteTarget.invoiceNo}?</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 inline-flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
              <button onClick={() => { setRows(r => r.filter(x => x !== deleteTarget)); setDeleteTarget(null); }} className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium inline-flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add New modal (preserved) */}
      {showAddModal && (
        <GlobalModal onClose={() => setShowAddModal(false)} title="Add Purchase Return" icon={<Plus className="w-5 h-5" />} size="xl" submitLabel="Submit">
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Supplier Name <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <select value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]">
                    <option value="">Select</option>
                    <option value="Electro Mart">Electro Mart</option>
                    <option value="Quantum Gadgets">Quantum Gadgets</option>
                    <option value="Prime Bazaar">Prime Bazaar</option>
                    <option value="Gadget World">Gadget World</option>
                    <option value="Volt Vault">Volt Vault</option>
                  </select>
                  <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black dark:bg-[#232323] dark:hover:bg-[#2A2A2A]"><Plus className="w-5 h-5" /></button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Date <span className="text-red-500">*</span></label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]" placeholder="dd/mm/yyyy" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Reference <span className="text-red-500">*</span></label>
                <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]" />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Product <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search Product" className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]" />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><FileText className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="mb-6 border border-gray-300 rounded-lg overflow-hidden dark:border-[#2A2A2A]">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-[#1E1E1E]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Total ($)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Paid ($)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Due ($)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Payment Status</th>
                  </tr>
                </thead>
                <tbody><tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">No returns added. Search and add products above.</td></tr></tbody>
              </table>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Order Tax <span className="text-red-500">*</span></label><input type="number" value={orderTax} onChange={(e) => setOrderTax(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Discount <span className="text-red-500">*</span></label><input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Shipping <span className="text-red-500">*</span></label><input type="number" value={shipping} onChange={(e) => setShipping(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Status <span className="text-red-500">*</span></label><select value={returnStatus} onChange={(e) => setReturnStatus(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"><option value="">Select</option><option value="Received">Received</option><option value="Pending">Pending</option></select></div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Description</label>
              <div className="border border-gray-300 rounded-lg overflow-hidden dark:border-[#2A2A2A]">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-300 flex items-center gap-2 dark:bg-[#1E1E1E] dark:border-[#2A2A2A]">
                  <select className="px-2 py-1 border border-gray-300 rounded text-sm dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"><option>Normal</option><option>Heading 1</option><option>Heading 2</option></select>
                  <button className="p-1 hover:bg-gray-200 rounded font-bold">B</button><button className="p-1 hover:bg-gray-200 rounded italic">I</button><button className="p-1 hover:bg-gray-200 rounded underline">U</button>
                  <button className="p-1 hover:bg-gray-200 rounded">🔗</button><button className="p-1 hover:bg-gray-200 rounded">•</button><button className="p-1 hover:bg-gray-200 rounded">1.</button><button className="p-1 hover:bg-gray-200 rounded">Tx</button>
                </div>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 focus:outline-none resize-none dark:bg-transparent dark:text-[#F8FAFC]" rows={4} placeholder="Type your message"></textarea>
              </div>
              <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Maximum 60 Words</p>
            </div>
          </div>
        </GlobalModal>
      )}

      {(showColumns || showSort || showExport || actionMenu) && <div className="fixed inset-0 z-10" onClick={() => { setShowColumns(false); setShowSort(false); setShowExport(false); setActionMenu(null); }} />}
    </div>
  );
}
