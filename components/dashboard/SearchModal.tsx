'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';
import {
  Search, X, Package, Users, Building2, FileText, Layers, ShoppingCart,
  ArrowRight, Command, Clock, TrendingUp, Star, ChevronRight, Plus,
  BarChart3, LayoutDashboard, ClipboardPen, Star as PinIcon,
  Filter, Hash, Zap, Tag, Truck, Eye, DollarSign,
  CalendarDays, Phone, CreditCard,
} from '@/components/ui/LucideIcon';

type EntityType =
  | 'medicine' | 'customer' | 'supplier' | 'invoice'
  | 'category' | 'manufacturer' | 'batch' | 'prescription'
  | 'report' | 'page' | 'rack' | 'stock' | 'pos';

interface SearchResult {
  id: string;
  label: string;
  description: string;
  type: EntityType;
  href: string;
  meta?: Record<string, string | number>;
}

interface SearchFilter {
  type: EntityType | 'all';
  label: string;
  icon: any;
}

interface QuickAction {
  label: string;
  href: string;
  icon: any;
  emoji: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  categories: any[];
  transactions: any[];
  customers: any[];
  suppliers: any[];
}

const RECENT_KEY = 'cmd_recent_searches';

const quickActions: QuickAction[] = [
  { label: 'Add Medicine', href: '/medicines/create', icon: Plus, emoji: '\u2795' },
  { label: 'New Invoice', href: '/sales/invoices', icon: FileText, emoji: '\uD83D\uDCC4' },
  { label: 'New Sale', href: '/pos', icon: ShoppingCart, emoji: '\uD83D\uDED2' },
  { label: 'New Purchase', href: '/purchases/create', icon: Truck, emoji: '\uD83D\uDE9A' },
  { label: 'Add Customer', href: '/sales/customers', icon: Users, emoji: '\uD83D\uDC64' },
  { label: 'Add Supplier', href: '/suppliers', icon: Building2, emoji: '\uD83C\uDFE2' },
];

const recentlyOpened = [
  { label: 'Medicine List', href: '/medicines', icon: Package, desc: 'View all medicines' },
  { label: 'POS Billing', href: '/pos', icon: ShoppingCart, desc: 'Point of sale terminal' },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, desc: 'Business analytics' },
  { label: 'Customers', href: '/sales/customers', icon: Users, desc: 'Customer management' },
  { label: 'Invoices', href: '/sales/invoices', icon: FileText, desc: 'Sales invoices' },
  { label: 'Batch Management', href: '/batch-management', icon: Hash, desc: 'Batch tracking' },
  { label: 'Expiry Tracking', href: '/dashboard/expiry', icon: CalendarDays, desc: 'Expiry monitoring' },
  { label: 'Stock Adjustment', href: '/stock/adjustment', icon: Truck, desc: 'Stock corrections' },
];

const typeIcons: Record<string, any> = {
  medicine: Package, customer: Users, supplier: Building2,
  invoice: FileText, category: Layers, manufacturer: Building2,
  batch: Hash, prescription: ClipboardPen, report: BarChart3,
  page: LayoutDashboard, rack: Tag, stock: Package, pos: ShoppingCart,
};

const groupLabels: Record<string, string> = {
  medicine: 'Medicines', customer: 'Customers', supplier: 'Suppliers',
  invoice: 'Invoices', category: 'Categories', manufacturer: 'Manufacturers',
  batch: 'Batches', prescription: 'Prescriptions', report: 'Reports',
  page: 'Pages', rack: 'Racks', stock: 'Stock', pos: 'POS',
};

function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function setStorage(key: string, val: any) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ }
}

function fuzzyMatch(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase().trim());
}

interface ParsedQuery {
  text: string;
  filters: Record<string, string>;
  stockUnder?: number;
  expiryUnder?: number;
}

function parseQuery(raw: string): ParsedQuery {
  const q: ParsedQuery = { text: '', filters: {} };
  let remainder = raw;
  const stockMatch = remainder.match(/\bstock\s*[<:]\s*(\d+)/i);
  if (stockMatch) { q.stockUnder = parseInt(stockMatch[1]); remainder = remainder.replace(stockMatch[0], ''); }
  const expiryMatch = remainder.match(/\bexpiry\s*[<:]\s*(\d+)/i);
  if (expiryMatch) { q.expiryUnder = parseInt(expiryMatch[1]); remainder = remainder.replace(expiryMatch[0], ''); }
  const filterMatches = remainder.matchAll(/(\w+)\s*:\s*(\w+)/gi);
  for (const m of filterMatches) {
    const key = m[1].toLowerCase();
    if (['category', 'supplier', 'brand', 'manufacturer', 'invoice', 'type'].includes(key)) {
      q.filters[key] = m[2];
      remainder = remainder.replace(m[0], '');
    }
  }
  q.text = remainder.trim();
  return q;
}

export default function SearchModal({ isOpen, onClose, products, categories, transactions, customers, suppliers }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<EntityType | 'all'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [closing, setClosing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getStorage<string[]>(RECENT_KEY, []));
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setDebouncedQuery('');
      setSelectedIndex(0);
      setActiveFilter('all');
      setClosing(false);
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => { setSelectedIndex(0); }, [debouncedQuery, activeFilter]);

  const saveRecent = useCallback((q: string) => {
    if (!q.trim()) return;
    const list = [q.trim(), ...getStorage<string[]>(RECENT_KEY, []).filter(s => s !== q.trim())].slice(0, 6);
    setStorage(RECENT_KEY, list);
    setRecentSearches(list);
  }, []);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => onClose(), 200);
    saveRecent(query);
    document.body.style.overflow = '';
  }, [onClose, saveRecent, query]);

  const parsed = useMemo(() => parseQuery(debouncedQuery), [debouncedQuery]);

  const results: SearchResult[] = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = parsed.text || debouncedQuery;
    const out: SearchResult[] = [];

    products
      .filter((p: any) => {
        const nameMatch = fuzzyMatch(p.name || '', q);
        const skuMatch = fuzzyMatch(p.sku || '', q);
        const genericMatch = fuzzyMatch(p.genericName || '', q);
        const barcodeMatch = fuzzyMatch(p.barcode || '', q);
        const brandMatch = fuzzyMatch(p.brandName || p.manufacturer || '', q);
        const rackMatch = fuzzyMatch(p.rackName || '', q);
        const catMatch = parsed.filters.category ? fuzzyMatch(p.categoryName || '', parsed.filters.category) : true;
        const manMatch = parsed.filters.manufacturer ? fuzzyMatch(p.manufacturer || '', parsed.filters.manufacturer) : true;
        const stockOk = parsed.stockUnder != null ? (p.quantity ?? p.stockQuantity ?? 0) < parsed.stockUnder : true;
        const expiryOk = parsed.expiryUnder != null
          ? (() => {
              if (!p.expiryDate) return false;
              const diff = (new Date(p.expiryDate).getTime() - Date.now()) / 86400000;
              return diff >= 0 && diff < parsed.expiryUnder!;
            })()
          : true;
        return (nameMatch || skuMatch || genericMatch || barcodeMatch || brandMatch || rackMatch) && catMatch && manMatch && stockOk && expiryOk;
      })
      .slice(0, 6)
      .forEach((p: any) => {
        const qty = p.quantity ?? p.stockQuantity ?? 0;
        out.push({
          id: `p-${p.id}`, label: p.name,
          description: `SKU: ${p.sku || '-'}  \u2022  ${p.categoryName || 'Uncategorized'}  \u2022  Stock: ${qty}`,
          type: 'medicine', href: `/medicines/create?id=${p.id}`,
          meta: { sku: p.sku || '-', category: p.categoryName || 'Uncategorized', stock: qty, price: p.price ? `${formatCurrency(p.price)}` : '-', expiry: p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A' },
        });
      });

    customers
      .filter((c: any) => fuzzyMatch(c.name || c.username || c.email || c.phone || '', q))
      .slice(0, 4)
      .forEach((c: any) => {
        out.push({
          id: `cust-${c.id}`, label: c.name || c.username || c.email,
          description: `Phone: ${c.phone || '-'}  \u2022  Balance: ${formatCurrency(c.outstandingBalance || c.lifetimeSpend || 0)}`,
          type: 'customer', href: '/sales/customers',
          meta: { phone: c.phone || '-', outstanding: c.outstandingBalance || 0 },
        });
      });

    suppliers
      .filter((s: any) => fuzzyMatch(s.name || '', q))
      .slice(0, 4)
      .forEach((s: any) => {
        out.push({
          id: `sup-${s.id}`, label: s.name,
          description: `Pending Orders: ${s.pendingOrders || 0}  \u2022  Outstanding: ${formatCurrency(s.outstandingBalance || 0)}`,
          type: 'supplier', href: '/suppliers',
          meta: { pendingOrders: s.pendingOrders || 0, outstanding: s.outstandingBalance || 0 },
        });
      });

    transactions
      .filter((t: any) => {
        const idMatch = fuzzyMatch(String(t.id), q);
        const descMatch = fuzzyMatch(t.description || '', q);
        const typeMatch = fuzzyMatch(t.transactionType || '', q);
        const numMatch = fuzzyMatch(`INV-${String(t.id).padStart(4, '0')}`, q);
        return idMatch || descMatch || typeMatch || numMatch;
      })
      .slice(0, 5)
      .forEach((t: any) => {
        out.push({
          id: `tx-${t.id}`, label: `#INV-${String(t.id).padStart(4, '0')}`,
          description: `${t.transactionType || 'Transaction'}  \u2022  ${formatCurrency(t.totalPrice || 0)}`,
          type: 'invoice', href: '/sales/invoices',
          meta: { amount: Number(t.totalPrice || 0), type: t.transactionType || 'SALE' },
        });
      });

    categories
      .filter((c: any) => fuzzyMatch(c.name || '', q))
      .slice(0, 3)
      .forEach((c: any) => {
        out.push({ id: `cat-${c.id}`, label: c.name, description: 'Category', type: 'category', href: '/categories' });
      });

    return out;
  }, [debouncedQuery, parsed, products, customers, suppliers, transactions, categories]);

  const flatResults = results;

  const groupedResults = useMemo(() => {
    if (flatResults.length === 0) return {};
    return flatResults.reduce<Record<string, SearchResult[]>>((acc, r) => {
      if (!acc[r.type]) acc[r.type] = [];
      acc[r.type].push(r);
      return acc;
    }, {});
  }, [flatResults]);

  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const items = listRef.current.querySelectorAll<HTMLElement>('[data-cmd-item]');
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); handleClose(); }
    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, flatResults.length - 1)); }
    if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, flatResults.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && flatResults[selectedIndex]) {
      e.preventDefault();
      saveRecent(query);
      router.push(flatResults[selectedIndex].href);
      handleClose();
    }
  }, [isOpen, flatResults, selectedIndex, router, saveRecent, query, handleClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSelect = useCallback((href: string) => {
    saveRecent(query);
    router.push(href);
    handleClose();
  }, [query, router, handleClose, saveRecent]);

  const groupEntries = Object.entries(groupedResults);

  if (!isOpen && !closing) return null;

  return (
    <>
      <style>{`
        @keyframes spotlightIn {
          from { opacity: 0; backdrop-filter: blur(0px); -webkit-backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
        }
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.95) translateY(-6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes popupOut {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.95) translateY(-6px); }
        }
        .spotlight-overlay { animation: spotlightIn 220ms ease-out both; }
        .spotlight-popup { animation: popupIn 220ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .spotlight-popup-out { animation: popupOut 180ms ease-in both; }
        .spotlight-hide-scrollbar::-webkit-scrollbar { width: 0; display: none; }
        .spotlight-hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div
        className={`fixed inset-0 z-[1100] flex items-start justify-center pt-[12%] ${closing ? '' : 'spotlight-overlay'}`}
        style={{ background: 'rgba(15,23,42,.28)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
        onClick={handleClose}
      >
        <div
          onClick={e => e.stopPropagation()}
          className={`${closing ? 'spotlight-popup-out' : 'spotlight-popup'} relative w-[760px] max-h-[80vh] flex flex-col bg-white rounded-[24px] overflow-hidden`}
          style={{ boxShadow: '0 0 0 0 transparent, 0 4px 28px rgba(15,23,42,0.06), 0 12px 60px rgba(15,23,42,0.1), 0 24px 100px rgba(15,23,42,0.06)' }}
        >
          {/* ====== SEARCH BAR ====== */}
          <div className="flex items-center gap-3 px-5 h-[60px] shrink-0 border-b border-gray-100/80">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search medicines, invoices, suppliers, customers, batches..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 text-[18px] text-gray-900 bg-transparent outline-none placeholder:text-gray-400 font-medium"
            />
            {query && (
              <button onClick={() => setQuery('')} className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-150">
                <X className="w-[18px] h-[18px]" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-[8px] py-[5px] text-[11px] font-semibold text-gray-400 bg-gray-50 rounded-[8px] border border-gray-200/60">
              <Command className="w-[11px] h-[11px]" />K
            </kbd>
          </div>

          {/* ====== BODY ====== */}
          <div className="flex-1 overflow-y-auto overscroll-contain spotlight-hide-scrollbar">
            {/* Empty state - Recent */}
            {!debouncedQuery.trim() && (
              <div className="p-4">
                {/* Quick Actions */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 px-1 mb-2.5">
                    <Zap className="w-[13px] h-[13px] text-gray-400" />
                    <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-gray-400">Quick Actions</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {quickActions.map((a, i) => {
                      const Icon = a.icon;
                      return (
                        <button
                          key={i}
                          onClick={() => { saveRecent(''); router.push(a.href); handleClose(); }}
                          className="group flex items-center gap-2.5 h-[48px] px-3.5 rounded-xl transition-all duration-150 cursor-pointer text-left border border-transparent hover:border-gray-100 hover:bg-[#F5F9FF] hover:shadow-sm"
                          style={{ minWidth: 0, background: 'transparent' }}
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-white border border-gray-100 group-hover:border-gray-200 text-gray-500 shrink-0 transition-all duration-150 group-hover:scale-105 group-hover:text-[#0F9291]">
                            <Icon className="w-[16px] h-[16px]" />
                          </div>
                          <span className="text-[14px] font-medium text-gray-700 group-hover:text-gray-900 whitespace-nowrap transition-colors duration-150">{a.emoji} {a.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Recently Opened */}
                <div>
                  <div className="flex items-center gap-2 px-1 mb-2.5">
                    <Clock className="w-[13px] h-[13px] text-gray-400" />
                    <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-gray-400">Recently Opened</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {recentlyOpened.map((page, i) => {
                      const Icon = page.icon;
                      return (
                        <button
                          key={i}
                          onClick={() => handleSelect(page.href)}
                          className="group flex items-center gap-3 px-3 h-[44px] rounded-xl transition-all duration-150 cursor-pointer text-left hover:bg-[#F5F9FF]"
                        >
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 shrink-0 group-hover:text-[#0F9291] transition-colors duration-150">
                            <Icon className="w-[16px] h-[16px]" />
                          </div>
                          <span className="text-[14px] font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-150">{page.label}</span>
                          <span className="text-[12px] text-gray-400 ml-1 hidden sm:inline">{page.desc}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-200 group-hover:text-gray-400 ml-auto transition-all duration-150" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Search Results */}
            {debouncedQuery.trim() && flatResults.length > 0 && (
              <div ref={listRef} className="py-3 px-3">
                {groupEntries.map(([type, typeResults], gi) => (
                  <div key={type} className="mb-1 last:mb-0">
                    <div className="flex items-center gap-2 px-3 py-2">
                      {(() => { const Icon = typeIcons[type] || Package; return <Icon className="w-3.5 h-3.5 text-gray-400" />; })()}
                      <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-gray-400">{groupLabels[type] || type}</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    {typeResults.map((result, ri) => {
                      const globalIdx = flatResults.indexOf(result);
                      const Icon = typeIcons[result.type] || Package;
                      return (
                        <div
                          key={result.id}
                          data-cmd-item
                          onClick={() => handleSelect(result.href)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                            globalIdx === selectedIndex ? 'bg-[#F5F9FF] ring-1 ring-blue-100/50' : 'hover:bg-[#F5F9FF]'
                          }`}
                        >
                          <div className={`flex items-center justify-center w-[38px] h-[38px] rounded-xl shrink-0 border transition-all duration-150 ${
                            globalIdx === selectedIndex
                              ? 'bg-white border-gray-200 text-gray-600 shadow-sm scale-105'
                              : 'bg-gray-50 border-gray-100 text-gray-400 group-hover:bg-white group-hover:border-gray-200 group-hover:scale-105 group-hover:text-[#0F9291]'
                          }`}>
                            <Icon className="w-[17px] h-[17px]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[14px] font-semibold truncate m-0 ${
                              globalIdx === selectedIndex ? 'text-gray-900' : 'text-gray-800'
                            }`}>
                              {(() => {
                                if (!query.trim()) return result.label;
                                const idx = result.label.toLowerCase().indexOf(query.toLowerCase());
                                if (idx === -1) return result.label;
                                return (
                                  <>
                                    {result.label.slice(0, idx)}
                                    <span className="text-[#0F9291] font-semibold">{result.label.slice(idx, idx + query.length)}</span>
                                    {result.label.slice(idx + query.length)}
                                  </>
                                );
                              })()}
                            </p>
                            <p className="text-[12px] text-gray-400 truncate mt-0.5 m-0">
                              {(() => {
                                if (!query.trim()) return result.description;
                                const idx = result.description.toLowerCase().indexOf(query.toLowerCase());
                                if (idx === -1) return result.description;
                                return (
                                  <>
                                    {result.description.slice(0, idx)}
                                    <span className="text-[#0F9291] font-medium">{result.description.slice(idx, idx + query.length)}</span>
                                    {result.description.slice(idx + query.length)}
                                  </>
                                );
                              })()}
                            </p>
                          </div>
                          {globalIdx === selectedIndex && (
                            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 text-gray-400 shrink-0">
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* No results */}
            {debouncedQuery.trim() && flatResults.length === 0 && (
              <div className="flex flex-col items-center py-16 text-center px-6">
                <div className="w-[60px] h-[60px] rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-[16px] font-semibold text-gray-700 mb-2">No matching results</p>
                <p className="text-[13px] text-gray-400 mb-1">Try searching by</p>
                <div className="flex flex-wrap gap-2 justify-center mt-1">
                  {['Medicine', 'Barcode', 'Customer', 'Invoice', 'Supplier', 'Batch Number'].map(s => (
                    <span key={s} className="text-[12px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ====== FOOTER ====== */}
          <div className="flex items-center justify-between px-4 h-[40px] shrink-0 border-t border-gray-100/80">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[12px] text-gray-400">
                <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-white rounded-[5px] border border-gray-200 text-[9px] font-semibold text-gray-500">\u2191\u2193</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1 text-[12px] text-gray-400">
                <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-white rounded-[5px] border border-gray-200 text-[9px] font-semibold text-gray-500">\u21A9</kbd>
                Open
              </span>
              <span className="flex items-center gap-1 text-[12px] text-gray-400">
                <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-white rounded-[5px] border border-gray-200 text-[9px] font-semibold text-gray-500">ESC</kbd>
                Close
              </span>
            </div>
            <span className="text-[12px] text-gray-300">{flatResults.length} result{flatResults.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </>
  );
}
