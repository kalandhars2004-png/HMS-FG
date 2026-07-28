'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Package, Users, Building2, FileText, Layers, ShoppingCart, ArrowRight, Command } from '@/components/ui/LucideIcon';

interface SearchResult {
  id: string;
  label: string;
  description: string;
  type: 'medicine' | 'customer' | 'supplier' | 'invoice' | 'category' | 'batch';
  href: string;
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

const MOCK_PRODUCTS = [
  { id: 1, name: 'Cetirizine 10mg', sku: 'CET-10', quantity: 120 },
  { id: 2, name: 'Aspirin 500mg', sku: 'ASP-500', quantity: 80 },
  { id: 3, name: 'Amoxicillin 500mg', sku: 'AMX-500', quantity: 60 },
  { id: 4, name: 'Vitamin C 1000mg', sku: 'VIT-C', quantity: 0 },
  { id: 5, name: 'Ibuprofen 200mg', sku: 'IBU-200', quantity: 150 },
  { id: 6, name: 'Metformin 500mg', sku: 'MTF-500', quantity: 200 },
  { id: 7, name: 'Atorvastatin 10mg', sku: 'ATR-10', quantity: 75 },
  { id: 8, name: 'Omeprazole 20mg', sku: 'OMZ-20', quantity: 95 },
  { id: 9, name: 'Loratadine 10mg', sku: 'LRT-10', quantity: 110 },
  { id: 10, name: 'Diclofenac 50mg', sku: 'DCL-50', quantity: 90 },
];

const MOCK_CATEGORIES = [
  { id: 1, name: 'Allergy' }, { id: 2, name: 'Pain Relief' },
  { id: 3, name: 'Antibiotics' }, { id: 4, name: 'Cough & Cold' },
  { id: 5, name: 'Cardiac' }, { id: 6, name: 'Diabetes' },
];

const MOCK_CUSTOMERS = [
  { id: 1, name: 'John Smith', email: 'john@email.com' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah@email.com' },
  { id: 3, name: 'Mike Wilson', email: 'mike@email.com' },
];

const MOCK_SUPPLIERS = [
  { id: 1, name: 'MediCorp Supplies', email: 'info@medicorp.com' },
  { id: 2, name: 'PharmaWorld Distributors', email: 'info@pharmaworld.com' },
];

const MOCK_TRANSACTIONS = [
  { id: 1, transactionType: 'SALE', totalPrice: 156.00, description: 'Sale to John Smith' },
  { id: 2, transactionType: 'PURCHASE', totalPrice: 1200.00, description: 'Stock replenishment' },
];

const typeIcons: Record<string, any> = {
  medicine: Package, customer: Users, supplier: Building2,
  invoice: FileText, category: Layers, batch: ShoppingCart,
};

const typeColors: Record<string, string> = {
  medicine: 'bg-emerald-50 text-emerald-600',
  customer: 'bg-blue-50 text-blue-600',
  supplier: 'bg-purple-50 text-purple-600',
  invoice: 'bg-amber-50 text-amber-600',
  category: 'bg-rose-50 text-rose-600',
  batch: 'bg-cyan-50 text-cyan-600',
};

function fuzzyMatch(text: string, query: string): boolean {
  const q = query.toLowerCase().trim();
  return text.toLowerCase().includes(q);
}

export default function SearchModal({ isOpen, onClose, products: apiProducts, categories: apiCategories, transactions: apiTransactions, customers: apiCustomers, suppliers: apiSuppliers }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const products = apiProducts?.length ? apiProducts : MOCK_PRODUCTS;
  const categories = apiCategories?.length ? apiCategories : MOCK_CATEGORIES;
  const customers = apiCustomers?.length ? apiCustomers : MOCK_CUSTOMERS;
  const suppliers = apiSuppliers?.length ? apiSuppliers : MOCK_SUPPLIERS;
  const transactions = apiTransactions?.length ? apiTransactions : MOCK_TRANSACTIONS;

  const results: SearchResult[] = query.trim()
    ? [
        ...products
          .filter((p: any) => fuzzyMatch(p.name || '', query) || fuzzyMatch(p.sku || '', query))
          .slice(0, 5)
          .map((p: any) => ({
            id: `p-${p.id}`, label: p.name, description: `SKU: ${p.sku || '-'}  \u00B7  ${p.quantity ?? p.stockQuantity ?? 0} in stock`,
            type: 'medicine' as const, href: `/medicines/create?id=${p.id}`,
          })),
        ...categories
          .filter((c: any) => fuzzyMatch(c.name || '', query))
          .slice(0, 3)
          .map((c: any) => ({ id: `cat-${c.id}`, label: c.name, description: 'Category', type: 'category' as const, href: '/categories' })),
        ...customers
          .filter((c: any) => fuzzyMatch(c.name || c.username || c.email || '', query))
          .slice(0, 3)
          .map((c: any) => ({ id: `cust-${c.id}`, label: c.name || c.username || c.email, description: c.email || c.phone || '', type: 'customer' as const, href: '/sales/customers' })),
        ...suppliers
          .filter((s: any) => fuzzyMatch(s.name || '', query))
          .slice(0, 3)
          .map((s: any) => ({ id: `sup-${s.id}`, label: s.name, description: s.email || s.phone || '', type: 'supplier' as const, href: '/suppliers' })),
        ...transactions
          .filter((t: any) => fuzzyMatch(`${t.id} ${t.transactionType} ${t.description || ''}`, query))
          .slice(0, 5)
          .map((t: any) => ({
            id: `tx-${t.id}`, label: `#INV-${String(t.id).padStart(4, '0')}`,
            description: `${t.transactionType || 'Transaction'} \u00B7 ₹${Number(t.totalPrice || 0).toLocaleString()}`,
            type: 'invoice' as const, href: '/sales/invoices',
          })),
      ]
    : [];

  const groupedResults = query.trim()
    ? results.reduce<Record<string, { label: string; results: SearchResult[] }>>((acc, r) => {
        if (!acc[r.type]) acc[r.type] = { label: r.type.charAt(0).toUpperCase() + r.type.slice(1) + 's', results: [] };
        acc[r.type].results.push(r);
        return acc;
      }, {})
    : {};

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const el = listRef.current.children[selectedIndex] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      router.push(results[selectedIndex].href);
      onClose();
    }
  }, [isOpen, results, selectedIndex, router, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-start justify-center pt-[10vh] animate-fadeIn" onClick={onClose}>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      <div onClick={e => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden animate-slideDown backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100/80">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input ref={inputRef}
            type="text"
            placeholder="Search medicines, customers, invoices..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-400 font-medium"
          />
          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-1 text-[10px] font-medium text-gray-400 bg-gray-100 rounded-md border border-gray-200/80">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="max-h-[420px] overflow-y-auto overscroll-contain">
          {query && results.length === 0 && (
            <div className="flex flex-col items-center py-14 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-gray-400">Try searching by name, SKU, or category</p>
            </div>
          )}
          {query && results.length > 0 && (
            <div className="p-2" ref={listRef}>
              {results.map((result, i) => {
                const Icon = typeIcons[result.type];
                return (
                  <div key={result.id}
                    onClick={() => handleSelect(result.href)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                      i === selectedIndex
                        ? 'bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 border border-gray-100/80 ${typeColors[result.type]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-gray-800">{result.label}</p>
                      <p className="text-xs text-gray-400 truncate">{result.description}</p>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${typeColors[result.type]}`}>
                      {result.type}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-all duration-200 ${i === selectedIndex ? 'text-gray-400 translate-x-0.5' : 'text-gray-200'}`} />
                  </div>
                );
              })}
            </div>
          )}
          {!query && (
            <div className="flex flex-col items-center py-14 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mb-4 shadow-sm">
                <Command className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-3">Quick Search</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {[
                  { label: 'Medicines', icon: Package, color: 'bg-emerald-50 text-emerald-600 border-emerald-200/50' },
                  { label: 'Customers', icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-200/50' },
                  { label: 'Invoices', icon: FileText, color: 'bg-amber-50 text-amber-600 border-amber-200/50' },
                  { label: 'Categories', icon: Layers, color: 'bg-rose-50 text-rose-600 border-rose-200/50' },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <span key={s.label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border ${s.color}`}>
                      <Icon className="w-3 h-3" />{s.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-gray-100/80 bg-gray-50/50 text-[11px] text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-[10px] font-medium shadow-sm">\u2191\u2193</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-[10px] font-medium shadow-sm">\u21A9</kbd> Open</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-[10px] font-medium shadow-sm">ESC</kbd> Close</span>
          </div>
          <span className="text-[10px] text-gray-300">{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
