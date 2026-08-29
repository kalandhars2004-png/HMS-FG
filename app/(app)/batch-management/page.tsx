'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { RotateCw, Maximize, Minimize, House, Search, Timer, ChevronDown, X, Box, Package, Filter, Check } from '@/components/ui/LucideIcon';
import { ProductsAPI, BatchesAPI } from '@/lib/api';

interface BatchEntry {
  id: number;
  batchNo: string;
  rackNo: string;
  purchaseDate: string;
  expiryDate: string;
  expiryRaw?: string;
  qtyReceived: number;
  qtySold: number;
  qtyAvailable: number;
  supplier: { name: string; avatar: string };
  status: 'Active' | 'Near Expiry' | 'Expired';
  productId?: number;
}

const EXPIRY_STATUSES = ['Active', 'Near Expiry', 'Expired'] as const;

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

interface ProductSummary { id: string; sku: string; name: string; brandName?: string; supplierName?: string; }

const cardCls = 'bg-white dark:bg-[#161B22] rounded-[0.85rem] border border-gray-200/70 dark:border-[#273244] shadow-[0_2px_10px_rgba(15,23,42,0.04)] dark:shadow-none';
const dropdownBtnCls = 'inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250';

function formatDate(iso?: string | null) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '-'; }
}

function computeStatus(expiry?: string | null): BatchEntry['status'] {
  if (!expiry) return 'Active';
  const d = new Date(expiry);
  if (isNaN(d.getTime())) return 'Active';
  const now = new Date();
  const diffDays = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'Expired';
  if (diffDays <= 30) return 'Near Expiry';
  return 'Active';
}

export default function BatchManagementPage() {
  const [expiryFilter, setExpiryFilter] = useState<string[]>([...EXPIRY_STATUSES]);
  const [draftExpiry, setDraftExpiry] = useState<string[]>([...EXPIRY_STATUSES]);
  const [openDropdown, setOpenDropdown] = useState<'expiry' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(5);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [batches, setBatches] = useState<BatchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [prodRes, batchRes] = await Promise.all([
          ProductsAPI.getAll().catch(() => ({ data: [] as unknown[] })),
          BatchesAPI.getAll().catch(() => ({ data: [] as unknown[] })),
        ]);
        if (cancelled) return;
        const prodList: unknown[] = (prodRes as { data: unknown[] })?.data || [];
        const batchList: unknown[] = (batchRes as { data: unknown[] })?.data || [];
        const mappedProducts: ProductSummary[] = (prodList as Record<string, unknown>[]).map((p) => ({
          id: String((p as Record<string, unknown>)['id'] ?? ''),
          sku: String((p as Record<string, unknown>)['sku'] ?? '-'),
          name: String((p as Record<string, unknown>)['name'] ?? 'Unnamed'),
          brandName: (p as Record<string, unknown>)['brandName'] as string | undefined,
          supplierName: (p as Record<string, unknown>)['supplierName'] as string | undefined,
        }));
        const productMap = new Map<string, ProductSummary>(mappedProducts.map((p) => [p.id, p]));
        const mappedBatches: BatchEntry[] = (batchList as Record<string, unknown>[]).map((b) => {
          const expiryRaw = b['expiryDate'] as string | undefined;
          const mfgRaw = (b['manufacturingDate'] as string | undefined) || (b['createdAt'] as string | undefined);
          const pid = b['productId'] as number | undefined;
          const prod = pid != null ? productMap.get(String(pid)) : undefined;
          const status = computeStatus(expiryRaw);
          const supplierName = prod?.supplierName || prod?.brandName || '-';
          return {
            id: Number(b['id'] ?? 0),
            batchNo: String(b['batchNo'] ?? '-'),
            rackNo: '-',
            purchaseDate: formatDate(mfgRaw),
            expiryDate: formatDate(expiryRaw),
            expiryRaw,
            qtyReceived: Number(b['quantity'] ?? 0),
            qtySold: 0,
            qtyAvailable: Number(b['quantity'] ?? 0),
            supplier: { name: supplierName, avatar: supplierName.charAt(0).toUpperCase() || '-' },
            status,
            productId: pid,
          };
        });
        setProducts(mappedProducts);
        setBatches(mappedBatches);
        // auto-expand all when real data loads
        if (mappedProducts.length > 0) {
          setExpandedIds(new Set(mappedProducts.map((p) => p.id)));
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load batches');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

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
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .map((product) => {
        const productBatches = batches.filter((b) => String(b.productId) === product.id);
        // if batch has no productId, show under first product? Instead hide orphan
        const filtered = productBatches.filter((b) => expiryFilter.includes(b.status));
        // also apply search on batches if product didn't match but batch did
        const batchMatches = !q || filtered.some((b) => b.batchNo.toLowerCase().includes(q));
        if (q && !product.name.toLowerCase().includes(q) && !product.sku.toLowerCase().includes(q) && !batchMatches) {
          return null;
        }
        return { product, batches: filtered, stocks: filtered.reduce((s, b) => s + b.qtyAvailable, 0) };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null && x.batches.length > 0);
  }, [products, batches, expiryFilter, searchQuery]);

  // Also show orphan batches (no product link) as separate group
  const orphanBatches = useMemo(() => {
    const productIds = new Set(products.map((p) => p.id));
    return batches.filter((b) => !b.productId || !productIds.has(String(b.productId))).filter((b) => expiryFilter.includes(b.status) && (!searchQuery || b.batchNo.toLowerCase().includes(searchQuery.toLowerCase())));
  }, [batches, products, expiryFilter, searchQuery]);

  const toggleExpanded = (id: string) =>
    setExpandedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const toggleDraft = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const hasFilter = expiryFilter.length !== EXPIRY_STATUSES.length;

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
          <button onClick={() => window.location.reload()} title="Refresh" className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1F2937] shadow-sm transition-all duration-250">
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
                placeholder="Search batch or product"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'expiry' ? null : 'expiry'); }}
                className={dropdownBtnCls}
              >
                <Timer className="w-4 h-4" /> Expiry <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'expiry' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'expiry' && (
                <div className="absolute left-0 mt-2 w-56 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] shadow-lg shadow-gray-200/50 dark:shadow-black/40 p-1.5 z-50 animate-scaleIn">
                  {EXPIRY_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setDraftExpiry(toggleDraft(draftExpiry, s))}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors"
                    >
                      <span className="inline-flex items-center gap-1.5">{statusBadge(s as BatchEntry['status'])}</span>
                      <span className={`flex h-4 w-4 items-center justify-center rounded border ${draftExpiry.includes(s) ? 'bg-[#0F9291] border-[#0F9291]' : 'border-gray-300 dark:border-[#3A3A3A]'}`}>
                        {draftExpiry.includes(s) && <Check className="w-3 h-3 text-white" />}
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
                onClick={() => { setDraftExpiry([...EXPIRY_STATUSES]); setExpiryFilter([...EXPIRY_STATUSES]); }}
                className="text-xs font-medium text-gray-400 hover:text-[#0F9291] transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => { setExpiryFilter(draftExpiry); }}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-[#0F9291] text-white text-sm font-semibold shadow-sm hover:bg-teal-700 hover:shadow-md active:scale-95 transition-all duration-250"
            >
              <Filter className="w-4 h-4" /> Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* ── Loading / Error / Empty ── */}
      {loading ? (
        <div className={`${cardCls} p-12 text-center`}>
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#0F9291] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading batches...</p>
        </div>
      ) : error ? (
        <div className={`${cardCls} p-10 text-center`}>
          <Package className="w-10 h-10 text-red-300 mx-auto mb-3" />
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-medium text-[#0F9291] hover:underline">Retry</button>
        </div>
      ) : batches.length === 0 ? (
        <div className={`${cardCls} p-12 text-center`}>
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-900 font-semibold mb-1">No batches yet</p>
          <p className="text-sm text-gray-500 mb-4">Batches will appear here once you receive stock. The dummy data has been removed — this is real inventory.</p>
          <a href="/medicines/create" className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#0F9291] text-white text-sm font-semibold hover:bg-teal-700 no-underline">Add Product &amp; Batch</a>
        </div>
      ) : (
        <>
          {/* ── Product Cards ── */}
          <div className="space-y-3">
            {filteredProducts.length === 0 && orphanBatches.length === 0 ? (
              <div className={`${cardCls} p-10 text-center`}>
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No batches match the applied filters</p>
              </div>
            ) : (
              <>
                {filteredProducts.slice(0, visibleCount).map(({ product, batches: productBatches, stocks }) => {
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
                                    {['Batch No', 'Rack No', 'Purchase Date', 'Expiry Date', 'Qty Available', 'Supplier', 'Status'].map((h) => (
                                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {productBatches.map((batch) => (
                                    <tr key={batch.id} className="border-b border-gray-50 dark:border-[#273244]/60 last:border-0 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                                      <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100 font-medium">{batch.batchNo}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{batch.rackNo}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{batch.purchaseDate}</td>
                                      <td className={`px-4 py-3 whitespace-nowrap ${batch.status === 'Expired' ? 'text-red-600 dark:text-red-400 font-medium' : batch.status === 'Near Expiry' ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>{batch.expiryDate}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100 font-semibold">{batch.qtyAvailable}</td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                          <span className="flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold shrink-0 bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">{batch.supplier.avatar}</span>
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
                })}
                {orphanBatches.length > 0 && (
                  <div className={`${cardCls} overflow-hidden`}>
                    <div className="p-4">
                      <h5 className="text-base font-bold text-gray-900 dark:text-[#F8FAFC]">Unlinked Batches</h5>
                      <p className="text-xs text-gray-500">Batches without a linked product</p>
                    </div>
                    <div className="px-4 pb-4">
                      <div className="border border-gray-200/70 dark:border-[#273244] rounded-lg overflow-hidden overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="bg-gray-50/70 dark:bg-white/[0.02] border-b border-gray-100 dark:border-[#273244]">{['Batch No','Expiry Date','Qty','Status'].map(h=> <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">{h}</th>)}</tr></thead>
                          <tbody>{orphanBatches.map(b=> <tr key={b.id} className="border-b last:border-0"><td className="px-4 py-3">{b.batchNo}</td><td className="px-4 py-3">{b.expiryDate}</td><td className="px-4 py-3">{b.qtyAvailable}</td><td className="px-4 py-3">{statusBadge(b.status)}</td></tr>)}</tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Load More ── */}
          {visibleCount < filteredProducts.length && (
            <div className="text-center mt-4">
              <button
                onClick={() => setVisibleCount((prev) => prev + 5)}
                className="inline-flex items-center gap-2 h-9 px-6 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250"
              >
                Load More <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
