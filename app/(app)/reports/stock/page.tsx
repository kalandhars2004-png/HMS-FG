'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, RefreshCw, Maximize, House, Filter, Columns, ArrowUpDown, ArrowUpToLine, Package, DollarSign, AlertTriangle, TrendingDown, TrendingUp, ChevronDown, X, Calendar, Box, Layers, Clock, Sparkles } from '@/components/ui/LucideIcon';
import { ProductsAPI, BatchesAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';

interface ReportRow {
  id: string;
  batchNo: string;
  name: string;
  inStock: number;
  outStock: number;
  stockValue: number;
  expiry: string;
  expiryRaw?: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

function ValuationView() {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<{ sku: string; batchNo: string; stock: number; purchase: number; sale: number; value: number; method: 'FIFO' | 'FEFO' | 'Average' }[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('high');
  const [showColumns, setShowColumns] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [vis, setVis] = useState({ batchNo: true, stock: true, purchase: true, sale: true, value: true, method: true });

  useEffect(() => {
    const demo = [
      { sku: '#MED030', batchNo: 'Batch-2026-011', stock: 250, purchase: 20, sale: 10, value: 30, method: 'FIFO' as const },
      { sku: '#MED031', batchNo: 'Batch-2026-012', stock: 47, purchase: 90, sale: 20, value: 110, method: 'FEFO' as const },
      { sku: '#MED032', batchNo: 'Batch-2026-013', stock: 52, purchase: 13, sale: 17, value: 30, method: 'FIFO' as const },
      { sku: '#MED033', batchNo: 'Batch-2026-014', stock: 30, purchase: 24, sale: 14, value: 38, method: 'FEFO' as const },
      { sku: '#MED034', batchNo: 'Batch-2026-015', stock: 66, purchase: 26, sale: 16, value: 42, method: 'Average' as const },
      { sku: '#MED035', batchNo: 'Batch-2026-016', stock: 416, purchase: 42, sale: 12, value: 54, method: 'FIFO' as const },
      { sku: '#MED036', batchNo: 'Batch-2026-017', stock: 399, purchase: 57, sale: 19, value: 76, method: 'Average' as const },
      { sku: '#MED037', batchNo: 'Batch-2026-018', stock: 60, purchase: 26, sale: 12, value: 38, method: 'FEFO' as const },
    ];
    setRows(demo); setLoading(false);
    ProductsAPI.getAll().then(res => {
      const prods: any[] = res.data || [];
      if (prods.length === 0) return;
      BatchesAPI.getAll().then(bRes => {
        const batches: any[] = bRes.data || [];
        const map = new Map<string, string>(); batches.forEach((b: any) => { if (b.productId && b.batchNo) map.set(String(b.productId), b.batchNo); });
        const mapped = prods.slice(0, 8).map((p: any, i: number) => {
          const qty = p.quantity ?? p.stockQuantity ?? 0;
          const purchase = p.purchasePrice ?? p.price ?? 0;
          const sale = p.price ?? 0;
          const methods: ('FIFO' | 'FEFO' | 'Average')[] = ['FIFO', 'FEFO', 'Average'];
          return { sku: p.sku || `#MED${String(30 + i).padStart(3, '0')}`, batchNo: map.get(String(p.id)) || `Batch-2026-${String(11 + i).padStart(3, '0')}`, stock: qty, purchase, sale, value: qty * (purchase || 0), method: methods[i % 3] };
        });
        if (mapped.length) setRows(mapped);
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = rows.filter(r => !q || r.sku.toLowerCase().includes(q) || r.batchNo.toLowerCase().includes(q));
    list = [...list].sort((a, b) => sort === 'high' ? b.value - a.value : a.value - b.value);
    return list;
  }, [rows, search, sort]);

  return (
    <div className="p-4 sm:p-6 bg-[#f8f9fa] min-h-screen -m-6">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm list-none p-0 m-0">
              <li><Link href="/dashboard" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 no-underline"><House className="w-4 h-4" /> Dashboard</Link></li>
              <li className="text-gray-400">/</li><li className="text-gray-500">Reports</li><li className="text-gray-400">/</li><li className="text-gray-900 font-medium">Stock Valuation</li>
            </ol>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => window.location.reload()} className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={() => document.documentElement.requestFullscreen?.()} className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600"><Maximize className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} className="w-64 h-9 pl-9 pr-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20" />
                </div>
                <div className="relative hidden sm:flex">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Calendar className="w-4 h-4" /></span>
                  <input type="text" placeholder="Date Range" readOnly className="w-44 h-9 pl-9 pr-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none cursor-pointer" />
                </div>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <button onClick={() => setShowFilter(true)} className="w-9 h-9 inline-flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"><Filter className="w-4 h-4" /></button>
                <div className="relative">
                  <button onClick={() => setShowColumns(v => !v)} className="h-9 px-3 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"><Columns className="w-4 h-4" /> Columns</button>
                  {showColumns && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-20">
                      <ul className="list-none m-0 p-2 space-y-1">
                        {[
                          { k: 'batchNo', l: 'Batch No' }, { k: 'stock', l: 'Current Stock' }, { k: 'purchase', l: 'Purchase Price' },
                          { k: 'sale', l: 'Sale Price' }, { k: 'value', l: 'Stock Value' }, { k: 'method', l: 'Valuation Method' },
                        ].map(c => (
                          <li key={c.k} className="px-2 py-1.5 hover:bg-gray-50 rounded-lg">
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
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
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-20">
                      <a href="#" onClick={e => { e.preventDefault(); setSort('high'); setShowSort(false); }} className={`block px-3 py-2 text-sm hover:bg-gray-50 no-underline ${sort === 'high' ? 'text-[#0F9291] font-semibold' : 'text-gray-700'}`}>Amount High-Low</a>
                      <a href="#" onClick={e => { e.preventDefault(); setSort('low'); setShowSort(false); }} className={`block px-3 py-2 text-sm hover:bg-gray-50 no-underline ${sort === 'low' ? 'text-[#0F9291] font-semibold' : 'text-gray-700'}`}>Amount Low-High</a>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button onClick={() => setShowExport(v => !v)} className="h-9 px-3 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"><ArrowUpToLine className="w-4 h-4" /> Export</button>
                  {showExport && (
                    <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-20">
                      <a href="#" onClick={e => { e.preventDefault(); window.print(); setShowExport(false); }} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline">Export as PDF</a>
                      <a href="#" onClick={e => { e.preventDefault(); setShowExport(false); }} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline">Export as Excel</a>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SKU</th>
                  {vis.batchNo && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Batch No</th>}
                  {vis.stock && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Current Stock</th>}
                  {vis.purchase && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Purchase Price</th>}
                  {vis.sale && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sale Price</th>}
                  {vis.value && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stock Value</th>}
                  {vis.method && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Valuation Method</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Loading...</td></tr> : filtered.map(r => (
                  <tr key={r.sku} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><span className="text-[#0ea5e9] font-medium">{r.sku}</span></td>
                    {vis.batchNo && <td className="px-4 py-3 text-gray-700">{r.batchNo}</td>}
                    {vis.stock && <td className="px-4 py-3 text-gray-700">{r.stock}</td>}
                    {vis.purchase && <td className="px-4 py-3 text-gray-700">{formatCurrency(r.purchase)}</td>}
                    {vis.sale && <td className="px-4 py-3 text-gray-700">{formatCurrency(r.sale)}</td>}
                    {vis.value && <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(r.value)}</td>}
                    {vis.method && <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${r.method === 'FIFO' ? 'bg-purple-50 text-purple-700 border-purple-200' : r.method === 'FEFO' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}><span className={`w-2 h-2 rounded-full ${r.method === 'FIFO' ? 'bg-purple-500' : r.method === 'FEFO' ? 'bg-pink-500' : 'bg-gray-500'}`} /> {r.method}</span></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-t border-gray-100">
            <div className="text-sm text-gray-500">Showing {filtered.length} of {rows.length} entries</div>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50" disabled>Previous</button>
              <button className="px-3 py-1.5 text-sm bg-[#0F9291] text-white rounded-lg">1</button>
              <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>
      {showFilter && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilter(false)} />
          <div className="relative w-full max-w-[360px] bg-white h-full shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h4 className="flex items-center gap-2 font-semibold text-gray-900"><span className="w-8 h-8 rounded-full bg-[#0F9291] text-white inline-flex items-center justify-center"><Filter className="w-4 h-4" /></span> Filter</h4>
              <button onClick={() => setShowFilter(false)} className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 text-sm text-gray-500">Filter by SKU, Batch, Valuation Method</div>
            <div className="p-4 border-t border-gray-100 flex gap-2">
              <button onClick={() => setShowFilter(false)} className="flex-1 h-10 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium">Cancel</button>
              <button onClick={() => setShowFilter(false)} className="flex-1 h-10 bg-[#0F9291] hover:bg-[#0e7a79] text-white rounded-lg text-sm font-medium">Apply Filter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InventoryReportsPage() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  if (view === 'valuation') return <ValuationView />;
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [sort, setSort] = useState('name-asc');
  const [vis, setVis] = useState({ batchNo: true, name: true, inStock: true, outStock: true, stockValue: true, expiry: true, status: true });
  const [fMedicine, setFMedicine] = useState<string[]>([]);
  const [fStatus, setFStatus] = useState<string[]>([]);
  const [moreM, setMoreM] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [prodRes, batchRes] = await Promise.all([
          ProductsAPI.getAll().catch(() => ({ data: [] })),
          BatchesAPI.getAll().catch(() => ({ data: [] })),
        ]);
        const products: any[] = prodRes.data || [];
        const batches: any[] = batchRes.data || [];
        const batchMap = new Map<string, string>();
        batches.forEach((b: any) => { if (b.productId && b.batchNo) batchMap.set(String(b.productId), b.batchNo); });
        if (products.length === 0) {
          const demo: ReportRow[] = [
            { id: '#MED016', batchNo: 'Batch-2026-001', name: 'Paracetamol 500mg', inStock: 200, outStock: 50, stockValue: 120, expiry: '28 Jan 2026', status: 'In Stock' },
            { id: '#MED017', batchNo: 'Batch-2026-002', name: 'Amoxicillin 250mg', inStock: 40, outStock: 45, stockValue: 20, expiry: '15 Feb 2026', status: 'Low Stock' },
            { id: '#MED018', batchNo: 'Batch-2026-003', name: 'Cetirizine 10mg', inStock: 50, outStock: 15, stockValue: 100, expiry: '10 Mar 2026', status: 'In Stock' },
            { id: '#MED019', batchNo: 'Batch-2026-004', name: 'Vitamin D3', inStock: 322, outStock: 36, stockValue: 0, expiry: '14 Apr 2026', status: 'Out of Stock' },
            { id: '#MED020', batchNo: 'Batch-2026-005', name: 'Ibuprofen 400mg', inStock: 677, outStock: 68, stockValue: 0, expiry: '30 May 2026', status: 'Out of Stock' },
            { id: '#MED021', batchNo: 'Batch-2026-006', name: 'Metformin 500mg', inStock: 367, outStock: 43, stockValue: 25, expiry: '02 Jun 2026', status: 'Low Stock' },
            { id: '#MED022', batchNo: 'Batch-2026-007', name: 'Azithromycin 500mg', inStock: 97, outStock: 311, stockValue: 130, expiry: '07 Jul 2026', status: 'In Stock' },
            { id: '#MED023', batchNo: 'Batch-2026-008', name: 'Metformin 500mg', inStock: 55, outStock: 612, stockValue: 180, expiry: '21 Aug 2026', status: 'Low Stock' },
            { id: '#MED024', batchNo: 'Batch-2026-009', name: 'Metformin 500mg', inStock: 156, outStock: 15, stockValue: 0, expiry: '17 Nov 2026', status: 'Out of Stock' },
            { id: '#MED025', batchNo: 'Batch-2026-010', name: 'Cetirizine 10mg', inStock: 498, outStock: 67, stockValue: 80, expiry: '10 Dec 2026', status: 'In Stock' },
          ];
          setRows(demo);
        } else {
          const mapped: ReportRow[] = products.map((p: any, i: number) => {
            const qty = p.quantity ?? p.stockQuantity ?? 0;
            const out = Math.floor(Math.random() * 80) + 10;
            const val = (p.price ?? p.mrp ?? 0) * Math.max(qty, 0);
            const status: ReportRow['status'] = qty === 0 ? 'Out of Stock' : qty < 30 ? 'Low Stock' : 'In Stock';
            return {
              id: p.sku || `#MED${String(16 + i).padStart(3, '0')}`,
              batchNo: batchMap.get(String(p.id)) || `Batch-2026-${String(i + 1).padStart(3, '0')}`,
              name: p.name || `Product ${i}`,
              inStock: qty,
              outStock: out,
              stockValue: val,
              expiry: p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
              expiryRaw: p.expiryDate,
              status,
            };
          });
          setRows(mapped);
        }
      } catch { } finally { setLoading(false); }
    };
    load();
  }, []);

  const totalItems = rows.length;
  const totalValue = rows.reduce((a, r) => a + r.stockValue, 0);
  const outCount = rows.filter(r => r.status === 'Out of Stock').length;
  const lowCount = rows.filter(r => r.status === 'Low Stock').length;
  const inCount = totalItems - outCount - lowCount;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = rows.filter(r => {
      if (q && !(r.id.toLowerCase().includes(q) || r.batchNo.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))) return false;
      if (fStatus.length && !fStatus.includes(r.status)) return false;
      if (fMedicine.length && !fMedicine.includes(r.name)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'name-asc') return a.name.localeCompare(b.name);
      if (sort === 'name-desc') return b.name.localeCompare(a.name);
      if (sort === 'value-high') return b.stockValue - a.stockValue;
      if (sort === 'value-low') return a.stockValue - b.stockValue;
      return 0;
    });
    return list;
  }, [rows, search, sort, fStatus, fMedicine]);

  const medicines = useMemo(() => [...new Set(rows.map(r => r.name))].slice(0, 12), [rows]);
  const maxStock = Math.max(...rows.map(r => r.inStock), 1);

  return (
    <div className="min-h-screen bg-[#f8fafb] -m-6">
      <div className="max-w-[1600px] mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col gap-1 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <nav aria-label="breadcrumb" className="mb-1">
                <ol className="flex items-center gap-1.5 text-sm list-none p-0 m-0">
                  <li><Link href="/dashboard" className="flex items-center gap-1.5 text-gray-500 hover:text-[#0F9291] no-underline transition-colors"><House className="w-4 h-4" /> Dashboard</Link></li>
                  <li className="text-gray-300">/</li>
                  <li className="text-gray-500">Reports</li>
                  <li className="text-gray-300">/</li>
                  <li className="text-gray-900 font-semibold">Inventory Reports</li>
                </ol>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                Inventory Reports
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0F9291]/10 text-[#0F9291] text-xs font-semibold border border-[#0F9291]/20"><Sparkles className="w-3 h-3" /> Live</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">Real-time overview of stock levels, valuation and expiry</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => window.location.reload()} className="w-9 h-9 inline-flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm hover:border-[#0F9291]/30 hover:text-[#0F9291] text-gray-600 transition-all" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
              <button onClick={() => document.documentElement.requestFullscreen?.()} className="w-9 h-9 inline-flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm hover:border-[#0F9291]/30 hover:text-[#0F9291] text-gray-600 transition-all" title="Maximize"><Maximize className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Stat cards — premium */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Items', value: totalItems ? totalItems.toLocaleString() : '13,786', sub: 'Across all warehouses', badge: '14.2% ↗', up: true, Icon: Package, grad: 'from-[#0F9291] to-teal-600', soft: 'bg-teal-50', iconColor: 'text-[#0F9291]' },
            { label: 'Stock Valuation', value: formatCurrency(totalValue || 12977), sub: 'Total inventory value', badge: '14.2% ↘', up: false, Icon: DollarSign, grad: 'from-sky-500 to-blue-600', soft: 'bg-sky-50', iconColor: 'text-sky-600' },
            { label: 'Out of Stock', value: String(outCount || 12), sub: 'Needs immediate restock', badge: '15.9% ↗', up: true, Icon: AlertTriangle, grad: 'from-red-500 to-rose-600', soft: 'bg-red-50', iconColor: 'text-red-600' },
            { label: 'Low Stock', value: String(lowCount || 128), sub: 'Below reorder point', badge: '16.2% ↘', up: false, Icon: Layers, grad: 'from-amber-500 to-orange-600', soft: 'bg-amber-50', iconColor: 'text-amber-600' },
          ].map(card => (
            <div key={card.label} className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden p-5">
              <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-[0.06] group-hover:opacity-[0.09] transition-opacity" style={{ background: `radial-gradient(circle, ${card.grad.includes('0F9291') ? '#0F9291' : card.grad.includes('sky') ? '#0ea5e9' : card.grad.includes('red') ? '#ef4444' : '#f59e0b'} 0%, transparent 70%)` }} />
              <div className="relative flex items-start justify-between mb-4">
                <span className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.grad} text-white inline-flex items-center justify-center shadow-sm`}><card.Icon className="w-5 h-5" /></span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${card.up ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {card.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {card.badge}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">{card.label}</p>
              <h3 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">{card.value}</h3>
              <p className="text-xs text-gray-400 flex items-center gap-1"><Box className="w-3 h-3" /> {card.sub}</p>
              <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${card.grad} rounded-full`} style={{ width: card.label === 'Total Items' ? '82%' : card.label === 'Stock Valuation' ? '68%' : card.label === 'Out of Stock' ? '18%' : '42%' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Quick insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#0F9291]/10 text-[#0F9291] inline-flex items-center justify-center"><Clock className="w-5 h-5" /></span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Inventory Health</p>
                <p className="text-xs text-gray-500">{inCount} in stock • {lowCount} low • {outCount} out</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> In Stock {inCount}</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Low {lowCount}</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Out {outCount}</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#0F9291] to-teal-700 rounded-2xl p-4 text-white flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Total Valuation</p>
              <p className="text-2xl font-bold">{formatCurrency(totalValue || 12977)}</p>
            </div>
            <DollarSign className="w-8 h-8 opacity-30" />
          </div>
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-gray-100 bg-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input placeholder="Search by medicine, batch or ID..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full h-10 pl-10 pr-10 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0F9291] focus:ring-4 focus:ring-[#0F9291]/10 transition-all" />
                  {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 inline-flex items-center justify-center"><X className="w-3 h-3" /></button>}
                </div>
                <div className="hidden sm:flex relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Calendar className="w-4 h-4" /></span>
                  <input type="text" placeholder="Date Range" readOnly className="w-44 h-10 pl-9 pr-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none cursor-pointer hover:border-gray-300" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(fMedicine.length > 0 || fStatus.length > 0) && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0F9291]/10 text-[#0F9291] text-xs font-semibold border border-[#0F9291]/20">{fMedicine.length + fStatus.length} filters</span>
                )}
                <button onClick={() => setShowFilter(true)} className={`h-10 w-10 inline-flex items-center justify-center rounded-xl border shadow-sm transition-all ${fMedicine.length + fStatus.length > 0 ? 'bg-[#0F9291] border-[#0F9291] text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-[#0F9291]/30 hover:text-[#0F9291]'}`} title="Filter"><Filter className="w-4 h-4" /></button>
                <div className="relative">
                  <button onClick={() => setShowColumns(v => !v)} className="h-10 px-3.5 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm transition-all"><Columns className="w-4 h-4" /> Columns <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showColumns ? 'rotate-180' : ''}`} /></button>
                  {showColumns && (
                    <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-20">
                      <p className="px-3 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Visible columns</p>
                      <ul className="list-none m-0 p-1 space-y-0.5">
                        {[
                          { k: 'batchNo', l: 'Batch No' }, { k: 'name', l: 'Medicine Name' }, { k: 'inStock', l: 'In Stock' },
                          { k: 'outStock', l: 'Out Stock' }, { k: 'stockValue', l: 'Stock Value' }, { k: 'expiry', l: 'Expiry Date' }, { k: 'status', l: 'Status' },
                        ].map(c => (
                          <li key={c.k} className="px-2 py-1.5 hover:bg-gray-50 rounded-xl">
                            <label className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700">
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
                  <button onClick={() => setShowSort(v => !v)} className="h-10 px-3.5 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm transition-all"><ArrowUpDown className="w-4 h-4" /> Sort</button>
                  {showSort && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl py-1.5 z-20">
                      {[
                        { k: 'name-asc', a: 'Medicine Name', b: 'A → Z' }, { k: 'name-desc', a: 'Medicine Name', b: 'Z → A' },
                        { k: 'value-high', a: 'Stock Value', b: 'High → Low' }, { k: 'value-low', a: 'Stock Value', b: 'Low → High' },
                      ].map(s => (
                        <a key={s.k} href="#" onClick={e => { e.preventDefault(); setSort(s.k); setShowSort(false); }} className={`flex items-center justify-between px-3 py-2.5 text-sm hover:bg-gray-50 rounded-xl mx-1 no-underline ${sort === s.k ? 'bg-[#0F9291]/10 text-[#0F9291] font-semibold' : 'text-gray-700'}`}>{s.a} <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{s.b}</span></a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button onClick={() => setShowExport(v => !v)} className="h-10 px-3.5 inline-flex items-center gap-2 bg-[#0F9291] hover:bg-[#0e7a79] text-white rounded-xl text-sm font-medium shadow-sm transition-all"><ArrowUpToLine className="w-4 h-4" /> Export</button>
                  {showExport && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-20">
                      <a href="#" onClick={e => { e.preventDefault(); window.print(); setShowExport(false); }} className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl mx-1 no-underline">📄 Export as PDF</a>
                      <a href="#" onClick={e => { e.preventDefault(); setShowExport(false); }} className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl mx-1 no-underline">📊 Export as Excel</a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {search && <p className="text-xs text-gray-500 mt-3">{filtered.length} result{filtered.length !== 1 ? 's' : ''} for “{search}”</p>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Medicine</th>
                  {vis.batchNo && <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Batch No</th>}
                  {vis.inStock && <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stock Level</th>}
                  {vis.stockValue && <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Valuation</th>}
                  {vis.expiry && <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Expiry</th>}
                  {vis.status && <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse"><td colSpan={6} className="px-5 py-4"><div className="h-12 bg-gray-100 rounded-xl" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-16 text-center"><div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><Package className="w-8 h-8 text-gray-400" /></div><p className="text-sm font-medium text-gray-900">No records found</p><p className="text-xs text-gray-500">Try adjusting your search or filters</p></td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id} className="group hover:bg-[#f8fafb] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F9291]/15 to-teal-100 border border-[#0F9291]/10 flex items-center justify-center text-[#0F9291] font-bold text-xs shrink-0">{r.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-[#0F9291] transition-colors">{r.name}</p>
                          <p className="text-xs font-mono text-[#0ea5e9]">{r.id}</p>
                        </div>
                      </div>
                    </td>
                    {vis.batchNo && <td className="px-4 py-4"><span className="inline-flex px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-mono font-medium text-gray-700">{r.batchNo}</span></td>}
                    {vis.inStock && (
                      <td className="px-4 py-4">
                        <div className="min-w-[120px]">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-bold text-gray-900">{r.inStock}</span>
                            <span className="text-xs text-gray-400">/ {r.inStock + r.outStock}</span>
                            <span className={`ml-auto text-xs font-semibold px-1.5 py-0.5 rounded ${r.status === 'Out of Stock' ? 'bg-red-50 text-red-700' : r.status === 'Low Stock' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{r.inStock > 0 ? Math.round(r.inStock / (r.inStock + r.outStock) * 100) : 0}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${r.status === 'Out of Stock' ? 'bg-red-500' : r.status === 'Low Stock' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${r.inStock > 0 ? Math.max(8, Math.min(100, (r.inStock / (r.inStock + r.outStock)) * 100)) : 0}%` }} /></div>
                        </div>
                      </td>
                    )}
                    {vis.stockValue && <td className="px-4 py-4"><span className="font-bold text-gray-900">{formatCurrency(r.stockValue)}</span><span className="text-xs text-gray-400 ml-1">• {r.outStock} out</span></td>}
                    {vis.expiry && <td className="px-4 py-4"><span className="inline-flex items-center gap-1.5 text-sm text-gray-600"><Calendar className="w-3.5 h-3.5 text-gray-400" /> {r.expiry}</span></td>}
                    {vis.status && (
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${r.status === 'In Stock' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : r.status === 'Low Stock' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          <span className={`w-2 h-2 rounded-full ${r.status === 'In Stock' ? 'bg-emerald-500' : r.status === 'Low Stock' ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} /> {r.status}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-sm text-gray-600">Showing <span className="font-semibold text-gray-900">{filtered.length}</span> of <span className="font-semibold text-gray-900">{rows.length}</span> medicines</p>
            <div className="flex items-center gap-1">
              <button className="px-3.5 py-2 text-sm font-medium border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-40 shadow-sm" disabled>Previous</button>
              <span className="px-3.5 py-2 text-sm font-bold bg-[#0F9291] text-white rounded-xl shadow-sm">1</span>
              <button className="px-3.5 py-2 text-sm font-medium border border-gray-200 rounded-xl bg-white hover:bg-gray-50 shadow-sm">Next</button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600"><span className="hidden sm:inline">Rows</span><select className="h-9 px-3 border border-gray-200 rounded-xl bg-white text-sm font-medium focus:outline-none focus:border-[#0F9291]"><option>10</option><option>25</option><option>50</option></select></div>
          </div>
        </div>
      </div>

      {/* Filter offcanvas */}
      {showFilter && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowFilter(false)} />
          <div className="relative w-full max-w-[380px] bg-white h-full shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#0F9291]/5 to-transparent">
              <h4 className="flex items-center gap-3 font-bold text-gray-900"><span className="w-9 h-9 rounded-xl bg-[#0F9291] text-white inline-flex items-center justify-center shadow-sm"><Filter className="w-4 h-4" /></span> Filters</h4>
              <button onClick={() => setShowFilter(false)} className="w-9 h-9 inline-flex items-center justify-center rounded-xl hover:bg-gray-100 border border-gray-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <button className="flex items-center justify-between w-full text-left font-bold text-sm text-gray-900 mb-3">Medicine <ChevronDown className="w-4 h-4 text-gray-400" /></button>
                <div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input placeholder="Search medicines..." className="w-full h-10 pl-9 pr-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0F9291] focus:ring-4 focus:ring-[#0F9291]/10" /></div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {(moreM ? medicines : medicines.slice(0, 5)).map(m => (
                    <label key={m} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                      <input type="checkbox" checked={fMedicine.includes(m)} onChange={() => setFMedicine(s => s.includes(m) ? s.filter(x => x !== m) : [...s, m])} className="w-4 h-4 rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291]" />
                      <span className="text-sm font-medium text-gray-700">{m}</span>
                    </label>
                  ))}
                </div>
                {medicines.length > 5 && <button onClick={() => setMoreM(v => !v)} className="text-sm font-semibold text-[#0F9291] hover:underline mt-2">{moreM ? 'View Less' : `View More (${medicines.length - 5})`}</button>}
              </div>
              <div className="pt-6 border-t border-gray-100">
                <button className="flex items-center justify-between w-full text-left font-bold text-sm text-gray-900 mb-3">Batch <ChevronDown className="w-4 h-4 text-gray-400" /></button>
                <div className="space-y-2">
                  {rows.slice(0, 5).map(r => (
                    <label key={r.batchNo} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291]" />
                      <span className="text-sm font-mono text-gray-700">{r.batchNo}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-6 border-t border-gray-100">
                <p className="font-bold text-sm text-gray-900 mb-3">Stock Value</p>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Value : <span className="font-bold text-gray-900">₹0 - ₹10,000</span></p>
                  <input type="range" className="w-full accent-[#0F9291]" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1"><span>₹0</span><span>₹10k</span></div>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-100">
                <button className="flex items-center justify-between w-full text-left font-bold text-sm text-gray-900 mb-3">Stock Status <ChevronDown className="w-4 h-4 text-gray-400" /></button>
                <div className="space-y-2">
                  {(['In Stock', 'Low Stock', 'Out of Stock'] as const).map(s => (
                    <label key={s} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer border border-transparent hover:border-gray-200">
                      <input type="checkbox" checked={fStatus.includes(s)} onChange={() => setFStatus(v => v.includes(s) ? v.filter(x => x !== s) : [...v, s])} className="w-4 h-4 rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291]" />
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${s === 'In Stock' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : s === 'Low Stock' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}><span className={`w-2 h-2 rounded-full ${s === 'In Stock' ? 'bg-emerald-500' : s === 'Low Stock' ? 'bg-amber-500' : 'bg-red-500'}`} />{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button onClick={() => { setFMedicine([]); setFStatus([]); setShowFilter(false); }} className="flex-1 h-11 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 text-sm font-semibold">Reset</button>
              <button onClick={() => setShowFilter(false)} className="flex-1 h-11 bg-[#0F9291] hover:bg-[#0e7a79] text-white rounded-xl text-sm font-bold shadow-sm">Apply Filters</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
