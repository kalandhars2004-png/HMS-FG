'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp, ShoppingCart, AlertTriangle,
  Maximize,
  Download, Users,
  Building2, FileText, ShoppingBag, Wallet,
  Receipt, BarChart3,
} from '@/components/ui/LucideIcon';
import { ProductsAPI, CategoriesAPI, TransactionsAPI, UsersAPI } from '@/lib/api';
import SearchModal from '@/components/dashboard/SearchModal';
import ExportModal from '@/components/dashboard/ExportModal';
import DateRangePicker from '@/components/dashboard/DateRangePicker';

const STOCK_LOW = 30;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('User');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prod, cat, tx] = await Promise.all([
        ProductsAPI.getAll(),
        CategoriesAPI.getAll(),
        TransactionsAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setData({ products: prod.data || [], categories: cat.data || [], transactions: tx.data || [] });
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); UsersAPI.getCurrent().then(u => u?.name && setUserName(u.name)).catch(() => {}); }, [load]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const products = data?.products || [];
  const categories = data?.categories || [];
  const transactions = data?.transactions || [];
  const totalP = products.length;
  const totalS = transactions.filter((t: any) => t.transactionType === 'SALE').reduce((s: number, t: any) => s + Number(t.totalPrice || 0), 0);
  const totalPur = transactions.filter((t: any) => t.transactionType === 'PURCHASE').reduce((s: number, t: any) => s + Number(t.totalPrice || 0), 0);
  const lowStock = products.filter((p: any) => (p.quantity ?? p.stockQuantity ?? 0) > 0 && (p.quantity ?? p.stockQuantity ?? 0) < STOCK_LOW).length;
  const saleCount = transactions.filter((t: any) => t.transactionType === 'SALE').length;
  const purCount = transactions.filter((t: any) => t.transactionType === 'PURCHASE').length;

  const recentTxs = transactions.slice(0, 5).map((t: any) => ({
    id: t.id, code: `#INV-${String(t.id || 0).padStart(4, '0')}`,
    amount: Number(t.totalPrice || 0).toLocaleString(),
    method: t.paymentMethod || 'Cash', type: t.transactionType || 'SALE',
    customer: t.description || `TX-${t.id}`,
  }));

  if (loading) {
    return (
      <div className="pb-6 space-y-6 animate-pulse">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="space-y-2"><div className="h-12 w-72 bg-gray-200 rounded-xl" /><div className="h-4 w-96 bg-gray-200 rounded-lg" /></div>
          <div className="flex gap-2">{[1, 2, 3].map(i => <div key={i} className="h-10 w-10 bg-gray-200 rounded-xl" />)}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 2xl:grid-cols-3 gap-5">
          <div className="2xl:col-span-2 h-[400px] bg-gray-200 rounded-2xl" />
          <div className="h-[400px] bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const recentForTable = [...products].sort((a: any, b: any) => (b.id || 0) - (a.id || 0)).slice(0, 4);

  return (
    <div className="pb-6 space-y-5">
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)}
        products={products} categories={categories} transactions={transactions}
        customers={[]} suppliers={[]} />
      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900">{getGreeting()}, {userName}</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} — <button onClick={load} className="text-[#0F9291] hover:underline bg-transparent border-0 p-0 cursor-pointer font-medium">Refresh</button>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/pos')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm border-0 cursor-pointer bg-gradient-to-r from-red-500 to-orange-500 hover:shadow-lg transition-all shadow-md"><ShoppingCart className="w-4 h-4" />POS</button>
          <DateRangePicker value="" onChange={() => {}} />
          <button className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 flex items-center justify-center hover:bg-gray-50 cursor-pointer"><Maximize className="w-4 h-4" /></button>
          <button onClick={() => setShowExport(true)} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm cursor-pointer hover:bg-gray-50"><Download className="w-4 h-4" />Export</button>
        </div>
      </div>

      {/* ROW 1: 4 STAT CARDS WITH LEFT ICONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Purchase Due', value: `₹${(totalPur * 0.15).toLocaleString()}`, icon: Wallet, color: 'bg-amber-50', iconColor: 'text-amber-600', img: '💰' },
          { label: 'Total Sales Due', value: `₹${(totalS * 0.08).toLocaleString()}`, icon: Receipt, color: 'bg-blue-50', iconColor: 'text-blue-600', img: '📋' },
          { label: 'Total Sales Amount', value: `₹${totalS.toLocaleString()}`, icon: TrendingUp, color: 'bg-emerald-50', iconColor: 'text-emerald-600', img: '📥' },
          { label: 'Total Purchase Amount', value: `₹${totalPur.toLocaleString()}`, icon: ShoppingBag, color: 'bg-purple-50', iconColor: 'text-purple-600', img: '📤' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:shadow-lg transition-all">
            <div className={`w-14 h-14 rounded-2xl ${s.color} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-7 h-7 ${s.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] text-gray-500 font-medium">{s.label}</p>
              <h3 className="text-[26px] font-bold text-gray-900 font-['Space_Grotesk'] mt-0.5">{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* ROW 2: 4 COLORED STAT CARDS WITH RIGHT ICONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Customers', value: String(transactions.filter((t: any) => t.description).length || 12), icon: Users, bg: 'from-[#0F9291] to-[#0A6E6D]' },
          { label: 'Suppliers', value: String(categories.length || 5), icon: Building2, bg: 'from-[#E67E22] to-[#D35400]' },
          { label: 'Purchase Invoice', value: String(purCount), icon: FileText, bg: 'from-[#8E44AD] to-[#6C3483]' },
          { label: 'Sales Invoice', value: String(saleCount), icon: BarChart3, bg: 'from-[#E74C3C] to-[#C0392B]' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl bg-gradient-to-br ${s.bg} p-5 flex items-center justify-between text-white hover:shadow-xl transition-all cursor-pointer`}>
            <div>
              <p className="text-white/80 text-sm font-medium">{s.label}</p>
              <h3 className="text-[30px] font-bold font-['Space_Grotesk'] mt-0.5">{s.value}</h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <s.icon className="w-7 h-7 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* ROW 3: SALES & PURCHASE CHART + RECENTLY ADDED PRODUCTS */}
      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-5">
        {/* LEFT: PURCHASE AND SALES */}
        <div className="2xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Purchase & Sales</h3>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-3 h-3 rounded-full bg-[#0F9291] inline-block" />
                <span>Sales</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-3 h-3 rounded-full bg-[#E67E22] inline-block" />
                <span>Purchase</span>
              </div>
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F9291]/20 cursor-pointer">
                <option>2024</option>
                <option>2023</option>
                <option>2022</option>
              </select>
            </div>
          </div>

          {/* Chart placeholder - will be replaced with recharts/chart.js */}
          <div className="relative h-[300px] bg-gradient-to-b from-[#F0FDF9] to-white rounded-xl border border-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-end gap-3 justify-center mb-4 h-32">
                {[65, 85, 45, 75, 55, 90, 60, 80, 70, 50, 85, 95].map((h, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div style={{ height: `${h * 0.6}px` }} className="w-5 bg-[#0F9291]/30 rounded-t-md relative">
                      <div style={{ height: `${h * 0.4}px` }} className="absolute bottom-0 w-full bg-[#0F9291] rounded-t-md" />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-gray-400 text-sm">Sales & Purchase Overview — 12 Months</p>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-[13px] text-gray-500">Total Sales</p>
              <h4 className="text-xl font-bold text-gray-900">₹{totalS.toLocaleString()}</h4>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <p className="text-[13px] text-gray-500">Total Purchase</p>
              <h4 className="text-xl font-bold text-gray-900">₹{totalPur.toLocaleString()}</h4>
            </div>
          </div>
        </div>

        {/* RIGHT: RECENTLY ADDED PRODUCTS */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recently Added Products</h3>
            <Link href="/products" className="text-sm text-[#0F9291] font-medium hover:underline no-underline">View All</Link>
          </div>

          {recentForTable.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-400 text-sm">No products yet</div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-[11px] text-gray-400 font-semibold uppercase tracking-wider pb-3 w-12">Sno</th>
                    <th className="text-left text-[11px] text-gray-400 font-semibold uppercase tracking-wider pb-3">Products</th>
                    <th className="text-right text-[11px] text-gray-400 font-semibold uppercase tracking-wider pb-3">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {recentForTable.map((item: any, i: number) => {
                    const price = item.sellingPrice ?? item.price ?? 0;
                    return (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="py-3 text-sm text-gray-500 font-medium">{i + 1}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#F0FDF9] flex items-center justify-center text-sm font-bold text-[#0F9291]">{item.name?.charAt(0) || 'P'}</div>
                            <span className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{item.name || `Product #${item.id}`}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right text-sm font-semibold text-gray-900">₹{Number(price).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: INVENTORY BY CATEGORY / STOCK ALERTS / RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
        {/* INVENTORY BY CATEGORY */}
        <div className="bg-[#081F1F] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-base font-bold text-white">Inventory by Category</h4>
            <Link href="/products" className="text-xs text-[#0F9291] hover:underline no-underline font-medium">View All</Link>
          </div>
          {categories.slice(0, 5).map((cat: any, i: number) => {
            const qty = products.filter((p: any) => (p.categoryName || p.category?.name) === cat.name).length;
            const maxQty = Math.max(...categories.slice(0, 5).map((c: any) => products.filter((p: any) => (p.categoryName || p.category?.name) === c.name).length), 1);
            const pct = Math.round((qty / maxQty) * 100);
            return (
              <div key={i} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white/80">{cat.name}</span>
                  <span className="text-sm font-semibold text-white">{qty}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0F9291] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10">
            <div className="text-center"><h5 className="text-xl font-bold text-white">{totalP}</h5><p className="text-[11px] text-white/50">Medicines</p></div>
            <div className="text-center"><h5 className="text-xl font-bold text-white">{categories.length}</h5><p className="text-[11px] text-white/50">Categories</p></div>
            <div className="text-center"><h5 className="text-xl font-bold text-white">{lowStock}</h5><p className="text-[11px] text-white/50">Low Stock</p></div>
          </div>
        </div>

        {/* STOCK ALERTS */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-gray-900">Stock Alerts</h4>
            <Link href="/inventory" className="text-xs text-[#0F9291] hover:underline no-underline font-medium">View All</Link>
          </div>
          {products.filter((p: any) => (p.quantity ?? p.stockQuantity ?? 0) <= STOCK_LOW).slice(0, 5).length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-400 text-sm">All items well stocked ✓</div>
          ) : (
            products.filter((p: any) => (p.quantity ?? p.stockQuantity ?? 0) <= STOCK_LOW).slice(0, 5).map((item: any, i: number) => {
              const q = item.quantity ?? item.stockQuantity ?? 0;
              return (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${q === 0 ? 'bg-red-50' : 'bg-orange-50'}`}>
                    <AlertTriangle className={`w-4 h-4 ${q === 0 ? 'text-red-500' : 'text-orange-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name || `Item #${item.id}`}</p>
                    <p className="text-[11px] text-gray-400">{item.sku || `SKU-${item.id}`}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${q === 0 ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>{q === 0 ? 'Out of Stock' : `${q} left`}</span>
                </div>
              );
            })
          )}
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-gray-900">Recent Transactions</h4>
            <Link href="/sales/invoices" className="text-xs text-[#0F9291] hover:underline no-underline font-medium">View All</Link>
          </div>
          {recentTxs.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-400 text-sm">No transactions yet</div>
          ) : (
            recentTxs.map((tx: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 group cursor-pointer">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${tx.type === 'PURCHASE' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {tx.customer.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#0F9291] transition-colors">{tx.code}</p>
                  <p className="text-[11px] text-gray-400">{tx.customer}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">₹{tx.amount}</p>
                  <p className="text-[10px] text-gray-400">{tx.method}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FOOTER STATS BAR */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center px-4 py-2">
            <h4 className="text-xl font-bold text-gray-900">₹{(totalS - totalPur).toLocaleString()}</h4>
            <p className="text-[12px] text-gray-400 mt-0.5">Net Profit</p>
          </div>
          <div className="text-center px-4 py-2 border-l border-gray-100">
            <h4 className="text-xl font-bold text-gray-900">{transactions.filter((t: any) => t.description).length || 12}</h4>
            <p className="text-[12px] text-gray-400 mt-0.5">Customers</p>
          </div>
          <div className="text-center px-4 py-2 border-l border-gray-100">
            <h4 className="text-xl font-bold text-gray-900">{saleCount}</h4>
            <p className="text-[12px] text-gray-400 mt-0.5">Sales Invoices</p>
          </div>
          <div className="text-center px-4 py-2 border-l border-gray-100">
            <h4 className="text-xl font-bold text-gray-900">{purCount}</h4>
            <p className="text-[12px] text-gray-400 mt-0.5">Purchase Invoices</p>
          </div>
        </div>
      </div>
    </div>
  );
}
