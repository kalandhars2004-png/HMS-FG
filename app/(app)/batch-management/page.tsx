'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { RotateCw, Maximize, House, ChevronDown, ChevronRight, Filter, Package, AlertTriangle, Timer, Ban, LayoutList, LayoutGrid, Pill, Building2, CalendarDays, TrendingDown, TrendingUp, Eye, Search, Trash2, DollarSign, CheckCircle } from '@/components/ui/LucideIcon';
import { CATEGORY_ICONS } from '@/lib/constants';
import { ProductsAPI } from '@/lib/api';

interface BatchEntry {
  batchNo: string;
  rackNo: string;
  purchaseDate: string;
  expiryDate: string;
  qtyReceived: number;
  qtySold: number;
  qtyAvailable: number;
  supplier: { name: string; avatar: string };
  status: 'Active' | 'Near Expiry' | 'Expired';
}

const SUPPLIERS = ['MedLife Distributors', 'PharmaCare Wholesale', 'HealthFirst Logistics', 'MediSync Supplies', 'CureWell Traders', 'VitalCare Solutions'];
const AVATARS = ['ML', 'PW', 'HF', 'MS', 'CW', 'VC'];

const generateBatches = (productId: string): BatchEntry[] => {
  const baseDate = new Date(2026, 3, 20);
  const statuses: BatchEntry['status'][] = ['Active', 'Active', 'Active', 'Active', 'Near Expiry', 'Expired'];
  return statuses.map((status, i) => {
    const dayOffset = i * 10;
    const d = new Date(baseDate);
    d.setDate(d.getDate() - dayOffset);
    const expiry = new Date(d);
    expiry.setFullYear(expiry.getFullYear() + (status === 'Expired' ? 0 : status === 'Near Expiry' ? 1 : 2));
    if (status === 'Expired') expiry.setDate(expiry.getDate() - 60);
    if (status === 'Near Expiry') expiry.setDate(expiry.getDate() + 30);

    const received = [180, 200, 150, 120, 160, 120][i];
    const sold = received - [150, 120, 70, 50, 20, 10][i];

    return {
      batchNo: `BT${d.toLocaleDateString('en-GB').replace(/\//g, '')}${String(i + 1).padStart(2, '0')}`,
      rackNo: ['R1S1A1', 'R1S2A4', 'R3S1A3', 'R1S1B2', 'R2S1B4', 'R1S2B2'][i],
      purchaseDate: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      expiryDate: expiry.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      qtyReceived: received,
      qtySold: sold,
      qtyAvailable: received - sold,
      supplier: { name: SUPPLIERS[i], avatar: AVATARS[i] },
      status,
    };
  });
};

const statusBadge = (status: BatchEntry['status']) => {
  const map = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Near Expiry': 'bg-orange-50 text-orange-700 border-orange-200',
    Expired: 'bg-red-50 text-red-700 border-red-200',
  };
  const dot = {
    Active: 'bg-emerald-500',
    'Near Expiry': 'bg-orange-500',
    Expired: 'bg-red-500',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${map[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status]}`} />
      {status}
    </span>
  );
};

const categoryGradients: Record<string, string> = {
  Tablet: 'from-[#0F9291]/20 to-[#14B8A6]/10',
  Capsule: 'from-[#14B8A6]/20 to-[#0F9291]/10',
  Syrup: 'from-[#FA9200]/20 to-[#FBBF24]/10',
  Injection: 'from-[#E65B0D]/20 to-[#F87171]/10',
  Ointment: 'from-[#3848F5]/20 to-[#6366F1]/10',
  Drops: 'from-[#8A38F5]/20 to-[#A78BFA]/10',
};

const progressColor = (pct: number) => {
  if (pct >= 75) return 'bg-emerald-500';
  if (pct >= 40) return 'bg-amber-500';
  return 'bg-red-500';
};

const daysUntilExpiry = (dateStr: string): number => {
  const [day, month, year] = dateStr.split(/[-\s]/);
  const d = new Date(`${month} ${day}, ${year}`);
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

interface ProductSummary { id: string; sku: string; name: string; categoryName: string; quantity: number; price: number; }

export default function BatchManagementPage() {
  const [expandedId, setExpandedId] = useState<string | null>('1');
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'active' | 'near' | 'expired'>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [disposedIds, setDisposedIds] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);

  useEffect(() => {
    ProductsAPI.getAll().then(res => {
      const list: any[] = res.data || [];
      setProducts(list.map((p: any) => ({
        id: String(p.id),
        sku: p.sku || '-',
        name: p.name || '',
        categoryName: p.categoryName || '',
        quantity: p.quantity ?? p.stockQuantity ?? 0,
        price: Number(p.price) || 0,
      })));
    }).catch(() => {});
  }, []);

  const allBatches = useMemo(() => products.flatMap(p => generateBatches(p.id)), [products]);

  const stats = useMemo(() => ({
    totalBatches: allBatches.length,
    totalAvailable: allBatches.reduce((s, b) => s + b.qtyAvailable, 0),
    totalReceived: allBatches.reduce((s, b) => s + b.qtyReceived, 0),
    totalSold: allBatches.reduce((s, b) => s + b.qtySold, 0),
    activeCount: allBatches.filter(b => b.status === 'Active').length,
    nearCount: allBatches.filter(b => b.status === 'Near Expiry').length,
    expiredCount: allBatches.filter(b => b.status === 'Expired').length,
    totalValue: allBatches.reduce((s, b) => s + b.qtyAvailable * 35, 0),
  }), [allBatches]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase()))
      .map(product => {
        const batches = generateBatches(product.id).filter(b => {
          const matchExpiry = expiryFilter === 'all' ? true
            : expiryFilter === 'active' ? b.status === 'Active'
            : expiryFilter === 'near' ? b.status === 'Near Expiry'
            : b.status === 'Expired';
          const matchSupplier = supplierFilter === 'all' ? true : b.supplier.name === supplierFilter;
          return matchExpiry && matchSupplier;
        });
        return { product, batches };
      }).filter(({ batches }) => batches.length > 0);
  }, [products, expiryFilter, supplierFilter, searchQuery]);

  return (
    <>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 600px; } }
        .animate-slideUp { animation: slideUp 0.25s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
      `}</style>
    <div className="animate-fadeIn">
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
            <li className="text-gray-900 font-medium" aria-current="page">Batch Management</li>
          </ol>
        </nav>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <button onClick={() => setViewMode('list')}
              className={`flex items-center justify-center w-9 h-9 transition-all duration-250 ${viewMode === 'list' ? 'bg-[#0F9291] text-white' : 'text-gray-400 hover:text-gray-600'}`}>
              <LayoutList className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')}
              className={`flex items-center justify-center w-9 h-9 transition-all duration-250 ${viewMode === 'grid' ? 'bg-[#0F9291] text-white' : 'text-gray-400 hover:text-gray-600'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-all shadow-sm" title="Refresh">
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-4 transition-all duration-250 hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500 m-0">Total Batches</p>
              <h4 className="text-lg font-bold text-gray-900 m-0 flex items-center gap-1.5">
                {stats.totalBatches}
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" />{stats.activeCount} active
                </span>
              </h4>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-4 transition-all duration-250 hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500 m-0">Available Stock</p>
              <h4 className="text-lg font-bold text-gray-900 m-0">{stats.totalAvailable.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-4 transition-all duration-250 hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-orange-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500 m-0">Near Expiry</p>
              <h4 className="text-lg font-bold text-gray-900 m-0">
                {stats.nearCount}
                {stats.nearCount > 0 && <span className="text-[10px] font-medium text-orange-600 ml-1.5 bg-orange-50 px-1.5 py-0.5 rounded-full">action needed</span>}
              </h4>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-4 transition-all duration-250 hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-red-600 shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500 m-0">Expired</p>
              <h4 className="text-lg font-bold text-gray-900 m-0">
                {stats.expiredCount}
                {stats.expiredCount > 0 && <span className="text-[10px] font-medium text-red-600 ml-1.5 bg-red-50 px-1.5 py-0.5 rounded-full">dispose</span>}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="bg-gradient-to-r from-[#0F9291] to-[#14B8A6] rounded-2xl p-4 mb-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-white/70 text-xs font-medium uppercase tracking-wider">Stock Health</span>
            <div className="flex gap-1">
              {[
                { label: 'Active', pct: Math.round((stats.activeCount / Math.max(stats.totalBatches, 1)) * 100), color: 'bg-emerald-300' },
                { label: 'Near Expiry', pct: Math.round((stats.nearCount / Math.max(stats.totalBatches, 1)) * 100), color: 'bg-amber-300' },
                { label: 'Expired', pct: Math.round((stats.expiredCount / Math.max(stats.totalBatches, 1)) * 100), color: 'bg-red-300' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white/15 rounded-lg px-2.5 py-1">
                  <span className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span className="text-white text-xs font-medium">{s.pct}%</span>
                  <span className="text-white/60 text-[10px]">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1">
            <DollarSign className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-xs font-medium">Stock Value: ₹{stats.totalValue.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-white/60 text-[10px] m-0 uppercase tracking-wider">Received</p>
            <p className="text-white text-sm font-bold m-0">{stats.totalReceived.toLocaleString()}</p>
          </div>
          <div className="text-white/30 text-lg font-light">|</div>
          <div className="text-right">
            <p className="text-white/60 text-[10px] m-0 uppercase tracking-wider">Sold</p>
            <p className="text-white text-sm font-bold m-0">{stats.totalSold.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] mb-5 overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-2 px-5 py-3.5 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0F9291]/10 text-[#0F9291]">
              <Filter className="w-4 h-4" />
            </div>
            <h5 className="text-sm font-bold text-gray-900 m-0">Filters</h5>
          </div>
          <button onClick={() => { setExpiryFilter('all'); setSupplierFilter('all'); setSearchQuery(''); }}
            className="text-xs font-medium text-gray-400 hover:text-[#0F9291] transition-colors cursor-pointer bg-transparent border-0">
            Clear all
          </button>
        </div>
        <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search medicine..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-xl focus:border-[#0F9291] outline-none bg-gray-50 focus:bg-white transition-all" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">Expiry</span>
            <div className="flex gap-1">
              {(['all', 'active', 'near', 'expired'] as const).map(e => (
                <button key={e} onClick={() => setExpiryFilter(e)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-250 ${
                    expiryFilter === e ? 'bg-[#0F9291] text-white border-[#0F9291] shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}>
                  {e === 'all' ? 'All' : e === 'active' ? 'Active' : e === 'near' ? 'Near Expiry' : 'Expired'}
                </button>
              ))}
            </div>
          </div>
          <div className="w-px h-6 bg-gray-200 shrink-0 hidden sm:block" />
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">Supplier</span>
            <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 bg-white outline-none focus:border-[#0F9291]">
              <option value="all">All Suppliers</option>
              {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Product Views */}
      {viewMode === 'list' ? (
        <div className="space-y-5">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-10 text-center">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No batches match the applied filters</p>
            </div>
          ) : (
            filteredProducts.map(({ product, batches }) => {
              const isOpen = expandedId === product.id;
              const totalAvailable = batches.reduce((sum, b) => sum + b.qtyAvailable, 0);
              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] overflow-hidden">
                  <div
                    className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer select-none hover:bg-gray-50/50 transition-all"
                    onClick={() => setExpandedId(isOpen ? null : product.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isOpen ? <ChevronDown className="w-5 h-5 text-[#0F9291] shrink-0" /> : <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />}
                      <div>
                        <h5 className="text-base font-bold text-gray-900 m-0">{product.name}</h5>
                        <p className="text-xs text-gray-400 m-0 font-medium">SKU : {product.sku}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-500 font-medium">Stocks Available :</span>
                      <span className="text-sm font-bold text-[#0F9291]">{totalAvailable}</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="border-t border-gray-100 animate-slideDown">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                              {['Batch No', 'Rack No', 'Purchase Date', 'Expiry Date', 'Qty Received', 'Qty Sold', 'Qty Available', 'Utilization', 'Supplier', 'Status'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {batches.map((batch, idx) => {
                              const utilization = Math.round((batch.qtySold / Math.max(batch.qtyReceived, 1)) * 100);
                              return (
                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <Link href={`/batch-management/${product.id}`} className="text-sm font-medium text-[#0F9291] no-underline hover:text-teal-700 hover:underline">
                                      {batch.batchNo}
                                    </Link>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{batch.rackNo}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 flex items-center gap-1.5">
                                    <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                                    {batch.purchaseDate}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <span className={`flex items-center gap-1.5 ${batch.status === 'Expired' ? 'text-red-600 font-medium' : batch.status === 'Near Expiry' ? 'text-orange-600 font-medium' : ''}`}>
                                      <Timer className="w-3.5 h-3.5" />
                                      {batch.expiryDate}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{batch.qtyReceived}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{batch.qtySold}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{batch.qtyAvailable}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                        <div className={`h-full rounded-full ${progressColor(utilization)}`} style={{ width: `${utilization}%` }} />
                                      </div>
                                      <span className="text-[11px] font-medium text-gray-500">{utilization}%</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-bold text-gray-600 shrink-0">{batch.supplier.avatar}</span>
                                      <span className="text-sm text-gray-700 whitespace-nowrap">{batch.supplier.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">{statusBadge(batch.status)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-10 text-center">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No batches match the applied filters</p>
            </div>
          ) : (
            filteredProducts.map(({ product, batches }) => {
              const totalAvailable = batches.reduce((sum, b) => sum + b.qtyAvailable, 0);
              const activeCount = batches.filter(b => b.status === 'Active').length;
              const nearCount = batches.filter(b => b.status === 'Near Expiry').length;
              const expiredCount = batches.filter(b => b.status === 'Expired').length;
              const cat = product.categoryName || '';
              const gradient = categoryGradients[cat] || 'from-gray-100 to-gray-50';
              const icon = CATEGORY_ICONS[cat] || '\u{1F4E6}';
              const isDisposed = disposedIds.includes(product.id);
              const nearExpiryBatches = batches.filter(b => b.status === 'Near Expiry');
              const expiredBatches = batches.filter(b => b.status === 'Expired');
              const nearestExpiry = nearExpiryBatches.length > 0
                ? Math.min(...nearExpiryBatches.map(b => daysUntilExpiry(b.expiryDate)))
                : null;
              return (
                <div key={product.id} className={`bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_45px_rgba(15,23,42,0.1)] hover:-translate-y-1 group ${isDisposed ? 'opacity-50' : ''}`}>
                  <Link href={`/batch-management/${product.id}`} className="block no-underline">
                    <div className={`h-36 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
                      <span className="text-5xl transition-transform duration-300 group-hover:scale-110">{icon}</span>
                      <div className="absolute top-3 right-3 flex gap-1.5">
                        <span className="bg-white/80 backdrop-blur-sm text-[10px] font-semibold text-gray-600 px-2 py-0.5 rounded-full shadow-sm">{batches.length} Batches</span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 flex">
                        {activeCount > 0 && <div className="h-1 bg-emerald-400" style={{ width: `${(activeCount / batches.length) * 100}%` }} />}
                        {nearCount > 0 && <div className="h-1 bg-amber-400" style={{ width: `${(nearCount / batches.length) * 100}%` }} />}
                        {expiredCount > 0 && <div className="h-1 bg-red-400" style={{ width: `${(expiredCount / batches.length) * 100}%` }} />}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h5 className="text-sm font-bold text-gray-900 m-0 leading-snug truncate">{product.name}</h5>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{cat}</span>
                            <span className="text-[10px] text-gray-300">|</span>
                            <span className="text-[10px] font-medium text-gray-400">{product.sku}</span>
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-[#0F9291]">{totalAvailable.toLocaleString()}</span>
                      </div>

                      {/* Expiry countdown */}
                      {nearestExpiry !== null && (
                        <div className="mt-2 flex items-center gap-1.5 bg-orange-50 rounded-lg px-2 py-1 border border-orange-100">
                          <Timer className="w-3 h-3 text-orange-500" />
                          <span className="text-[10px] font-medium text-orange-700">Earliest expiry in {nearestExpiry}d</span>
                        </div>
                      )}

                      {isDisposed && (
                        <div className="mt-2 flex items-center gap-1.5 bg-gray-100 rounded-lg px-2 py-1">
                          <CheckCircle className="w-3 h-3 text-gray-500" />
                          <span className="text-[10px] font-medium text-gray-500">Marked as disposed</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                        {activeCount > 0 && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{activeCount} Active</span>}
                        {nearCount > 0 && <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" />{nearCount} Near</span>}
                        {expiredCount > 0 && !isDisposed && <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />{expiredCount} Expired</span>}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                          <Eye className="w-3 h-3" /> View Details
                        </span>
                        <span className="text-[10px] font-medium text-[#0F9291] group-hover:underline">Click to open →</span>
                      </div>
                    </div>
                  </Link>
                  {/* Action buttons */}
                  {expiredCount > 0 && !isDisposed && (
                    <div className="px-4 pb-3 flex gap-2">
                      <button onClick={() => setDisposedIds(prev => [...prev, product.id])}
                        className="flex-1 h-8 rounded-lg bg-red-50 text-red-600 text-[10px] font-semibold hover:bg-red-100 transition-all flex items-center justify-center gap-1 border border-red-200">
                        <Trash2 className="w-3 h-3" /> Dispose
                      </button>
                    </div>
                  )}
                  {isDisposed && (
                    <div className="px-4 pb-3">
                      <button onClick={() => setDisposedIds(prev => prev.filter(id => id !== product.id))}
                        className="w-full h-8 rounded-lg bg-gray-100 text-gray-500 text-[10px] font-medium hover:bg-gray-200 transition-all">
                        Undo
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
    </>
  );
}
