'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { RotateCw, Maximize, Minimize, House, Search, User, Timer, ChevronDown, X, Box, Package, Filter, Check } from '@/components/ui/LucideIcon';
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

const SUPPLIERS = ['MedLife Distributors', 'HealthCare Pharma', 'GreenCross Medicals', 'NovaCure Pharma', 'CareWell Agency', 'PrimeCare Pharma'];
const AVATARS: Record<string, string> = {
  'MedLife Distributors': 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  'HealthCare Pharma': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'GreenCross Medicals': 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  'NovaCure Pharma': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  'CareWell Agency': 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  'PrimeCare Pharma': 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
};

const EXPIRY_STATUSES = ['Active', 'Near Expiry', 'Expired'] as const;

const BATCH_ROWS: Omit<BatchEntry, 'supplier' | 'status'>[] = [
  { batchNo: 'BT2604110', rackNo: 'R1S1A1', purchaseDate: '24 Apr 2026', expiryDate: '24 Apr 2028', qtyReceived: 180, qtySold: 180, qtyAvailable: 150 },
  { batchNo: 'BT2604012', rackNo: 'R1S2A4', purchaseDate: '20 Apr 2026', expiryDate: '19 Apr 2029', qtyReceived: 200, qtySold: 200, qtyAvailable: 120 },
  { batchNo: 'BT2603205', rackNo: 'R3S1A3', purchaseDate: '10 Apr 2026', expiryDate: '08 Apr 2028', qtyReceived: 150, qtySold: 150, qtyAvailable: 70 },
  { batchNo: 'BT2603145', rackNo: 'R1S1B2', purchaseDate: '21 Mar 2026', expiryDate: '20 Mar 2028', qtyReceived: 120, qtySold: 120, qtyAvailable: 50 },
  { batchNo: 'BT2602126', rackNo: 'R2S1B4', purchaseDate: '18 Mar 2026', expiryDate: '15 Mar 2030', qtyReceived: 160, qtySold: 160, qtyAvailable: 20 },
  { batchNo: 'BT2601045', rackNo: 'R1S2B2', purchaseDate: '12 Jan 2026', expiryDate: '10 Mar 2026', qtyReceived: 120, qtySold: 120, qtyAvailable: 10 },
];

const SUPPLIER_ROWS: { name: string; status: BatchEntry['status'] }[] = [
  { name: 'MedLife Distributors', status: 'Active' },
  { name: 'HealthCare Pharma', status: 'Active' },
  { name: 'GreenCross Medicals', status: 'Active' },
  { name: 'NovaCure Pharma', status: 'Active' },
  { name: 'CareWell Agency', status: 'Near Expiry' },
  { name: 'PrimeCare Pharma', status: 'Expired' },
];

const generateBatches = (): BatchEntry[] =>
  BATCH_ROWS.map((row, i) => ({ ...row, supplier: { name: SUPPLIER_ROWS[i].name, avatar: SUPPLIER_ROWS[i].name.charAt(0) }, status: SUPPLIER_ROWS[i].status }));

const TEMPLATE_PRODUCTS = [
  { sku: '#TAB0016', name: 'Paracetamol 500' },
  { sku: '#TAB015', name: 'Amoxicillin 250' },
  { sku: '#SYR014', name: 'Cetirizine' },
  { sku: '#TAB013', name: 'Ceftriaxone 20' },
  { sku: '#CRE012', name: 'Betnovate' },
  { sku: '#TAB011', name: 'Amoxicillin 30' },
  { sku: '#INJ010', name: 'Tetanus Toxoid' },
];

const statusBadge = (status: BatchEntry['status']) => {
  const map = {
    Active: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    'Near Expiry': 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    Expired: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  };
  const dot = {
    Active: 'text-emerald-500 dark:text-emerald-400',
    'Near Expiry': 'text-amber-500 dark:text-amber-400',
    Expired: 'text-red-500 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${map[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${dot[status]}`} />
      {status}
    </span>
  );
};

const badgeSoft = {
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
};

interface ProductSummary { id: string; sku: string; name: string; }

const cardCls = 'bg-white dark:bg-[#161B22] rounded-[0.85rem] border border-gray-200/70 dark:border-[#273244] shadow-[0_2px_10px_rgba(15,23,42,0.04)] dark:shadow-none';
const dropdownBtnCls = 'inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250';

export default function BatchManagementPage() {
  const [expiryFilter, setExpiryFilter] = useState<string[]>(['Active', 'Near Expiry', 'Expired']);
  const [supplierFilter, setSupplierFilter] = useState<string[]>(SUPPLIERS);
  const [draftExpiry, setDraftExpiry] = useState<string[]>(expiryFilter);
  const [draftSuppliers, setDraftSuppliers] = useState<string[]>(supplierFilter);
  const [openDropdown, setOpenDropdown] = useState<'expiry' | 'suppliers' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(5);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ProductsAPI.getAll().then((res: any) => {
      const list: any[] = res.data || [];
      if (list.length > 0) {
        setProducts(list.map((p: any) => ({ id: String(p.id), sku: p.sku || '-', name: p.name || '' })));
      } else {
        setProducts(TEMPLATE_PRODUCTS.map((p, i) => ({ id: String(i + 1), sku: p.sku, name: p.name })));
      }
    }).catch(() => setProducts(TEMPLATE_PRODUCTS.map((p, i) => ({ id: String(i + 1), sku: p.sku, name: p.name }))));
  }, []);

  useEffect(() => {
    if (products.length > 0) setExpandedIds(new Set(products.map(p => p.id)));
  }, [products]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen?.(); setIsFullscreen(true); }
    else { document.exitFullscreen?.(); setIsFullscreen(false); }
  };
  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setOpenDropdown(null);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products
      .filter(p => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .map(product => {
        const batches = generateBatches().filter(b =>
          expiryFilter.includes(b.status) && supplierFilter.includes(b.supplier.name)
        );
        return { product, batches, stocks: batches.reduce((s, b) => s + b.qtyAvailable, 0) };
      })
      .filter(({ batches }) => batches.length > 0);
  }, [products, expiryFilter, supplierFilter, searchQuery]);

  const toggleExpanded = (id: string) =>
    setExpandedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const toggleDraft = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

  const hasFilter = expiryFilter.length !== EXPIRY_STATUSES.length || supplierFilter.length !== SUPPLIERS.length;

  return (
    <div className="p-6 animate-fadeIn" onClick={() => setOpenDropdown(null)}>
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
            <li className="text-gray-900 dark:text-[#F8FAFC] font-medium" aria-current="page">Batch Management</li>
          </ol>
        </nav>
        <div className="flex items-center justify-end gap-2">
          <button title="Refresh" className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1F2937] shadow-sm transition-all duration-250">
            <RotateCw className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen} title="Maximize" className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1F2937] shadow-sm transition-all duration-250">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Filter Card ── */}
      <div className={`${cardCls} mb-3`}>
        <div className="p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center flex-wrap gap-2" ref={filterRef}>
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9 w-56 pl-9 pr-8 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Expiry */}
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setOpenDropdown(openDropdown === 'expiry' ? null : 'expiry'); }}
                className={dropdownBtnCls}
              >
                <Timer className="w-4 h-4" /> Expiry <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'expiry' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'expiry' && (
                <div className="absolute left-0 mt-2 w-56 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] shadow-lg shadow-gray-200/50 dark:shadow-black/40 p-1.5 z-50 animate-scaleIn">
                  {EXPIRY_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => setDraftExpiry(toggleDraft(draftExpiry, s))}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors"
                    >
                      <span className="inline-flex items-center gap-1.5">{statusBadge(s)}</span>
                      <span className={`flex h-4 w-4 items-center justify-center rounded border ${draftExpiry.includes(s) ? 'bg-[#0F9291] border-[#0F9291]' : 'border-gray-300 dark:border-[#3A3A3A]'}`}>
                        {draftExpiry.includes(s) && <Check className="w-3 h-3 text-white" />}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Suppliers */}
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setOpenDropdown(openDropdown === 'suppliers' ? null : 'suppliers'); }}
                className={dropdownBtnCls}
              >
                <User className="w-4 h-4" /> Suppliers <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'suppliers' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'suppliers' && (
                <div className="absolute left-0 mt-2 w-60 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] shadow-lg shadow-gray-200/50 dark:shadow-black/40 p-1.5 z-50 animate-scaleIn">
                  {SUPPLIERS.map(s => (
                    <button
                      key={s}
                      onClick={() => setDraftSuppliers(toggleDraft(draftSuppliers, s))}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${AVATARS[s]}`}>{s.charAt(0)}</span>
                        {s}
                      </span>
                      <span className={`flex h-4 w-4 items-center justify-center rounded border ${draftSuppliers.includes(s) ? 'bg-[#0F9291] border-[#0F9291]' : 'border-gray-300 dark:border-[#3A3A3A]'}`}>
                        {draftSuppliers.includes(s) && <Check className="w-3 h-3 text-white" />}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasFilter && (
              <button
                onClick={() => { setDraftExpiry([...EXPIRY_STATUSES]); setDraftSuppliers([...SUPPLIERS]); setExpiryFilter([...EXPIRY_STATUSES]); setSupplierFilter([...SUPPLIERS]); }}
                className="text-xs font-medium text-gray-400 hover:text-[#0F9291] transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => { setExpiryFilter(draftExpiry); setSupplierFilter(draftSuppliers); }}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-[#0F9291] text-white text-sm font-semibold shadow-sm hover:bg-teal-700 hover:shadow-md active:scale-95 transition-all duration-250"
            >
              <Filter className="w-4 h-4" /> Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* ── Product Cards ── */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className={`${cardCls} p-10 text-center`}>
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No batches match the applied filters</p>
          </div>
        ) : (
          filteredProducts.slice(0, visibleCount).map(({ product, batches, stocks }) => {
            const isOpen = expandedIds.has(product.id);
            return (
              <div key={product.id} className={`${cardCls} overflow-hidden`}>
                <div className="p-4 flex items-center justify-between flex-wrap gap-2">
                  <h5 className="text-base font-bold text-gray-900 dark:text-[#F8FAFC] m-0 flex items-center flex-wrap gap-2">
                    {product.name}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeSoft.info}`}>SKU : {product.sku}</span>
                  </h5>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeSoft.warning}`}>
                      <Box className="w-3.5 h-3.5" /> Stocks Available : {stocks}
                    </span>
                    <button
                      onClick={() => toggleExpanded(product.id)}
                      title={isOpen ? 'Collapse' : 'Expand'}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4">
                    <div className="border border-gray-200/70 dark:border-[#273244] rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50/70 dark:bg-white/[0.02] border-b border-gray-100 dark:border-[#273244]">
                              {['Batch No', 'Rack No', 'Purchase Date', 'Expiry Date', 'Qty Received', 'Qty Sold', 'Qty Available', 'Supplier', 'Status'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {batches.map((batch, idx) => (
                              <tr key={idx} className="border-b border-gray-50 dark:border-[#273244]/60 last:border-0 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100 font-medium">{batch.batchNo}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{batch.rackNo}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{batch.purchaseDate}</td>
                                <td className={`px-4 py-3 whitespace-nowrap ${batch.status === 'Expired' ? 'text-red-600 dark:text-red-400 font-medium' : batch.status === 'Near Expiry' ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>{batch.expiryDate}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">{batch.qtyReceived}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">{batch.qtySold}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100 font-semibold">{batch.qtyAvailable}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <span className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold shrink-0 ${AVATARS[batch.supplier.name]}`}>{batch.supplier.name.charAt(0)}</span>
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{batch.supplier.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">{statusBadge(batch.status)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Load More ── */}
      {visibleCount < filteredProducts.length && (
        <div className="text-center mt-4">
          <button
            onClick={() => setVisibleCount(prev => prev + 5)}
            className="inline-flex items-center gap-2 h-9 px-6 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250"
          >
            Load More <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
