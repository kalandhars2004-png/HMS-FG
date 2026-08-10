'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ShoppingCart, AlertTriangle, FileText, FileInput, FileX, RefreshCw,
  Box, Plus, Calendar, Maximize, ArrowUpToLine,
  ArrowUpRight, ArrowDownRight, ChevronDown, ChevronRight, Package, Layers, Clock,
  Timer, Ban, MapPin, Trash2, Building2,
} from '@/components/ui/LucideIcon';
import { ProductsAPI, CategoriesAPI, TransactionsAPI, UsersAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import ExportModal from '@/components/dashboard/ExportModal';
import DateRangePicker from '@/components/dashboard/DateRangePicker';

const STOCK_LOW_THRESHOLD = 30;

function TrendBadge({ value, up, danger, small }: { value: string; up: boolean; danger?: boolean; small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full transition-all duration-250 ${
        small ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'
      } ${danger ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}
    >
      {value}
      {up ? <ArrowUpRight className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} /> : <ArrowDownRight className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
    </span>
  );
}

function IconBtn({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 dark:border-[#222230] bg-white dark:bg-[#121218] cursor-pointer text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a24] dark:bg-[#1a1a24]/50 hover:text-gray-700 dark:text-gray-300 hover:shadow-sm transition-all duration-250 active:scale-95 ${className}`}>
      {children}
    </button>
  );
}

function Btn48({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-50 dark:bg-[#1a1a24]/50 hover:bg-gray-100 dark:bg-[#1a1a24] text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-all duration-250 hover:scale-105 active:scale-95 group"
    >
      <span className="transition-transform duration-250 group-hover:rotate-12">{children}</span>
    </button>
  );
}

function SkeletonRow({ h = 'h-[72px]' }: { h?: string }) {
  return (
    <div className={`${h} rounded-2xl bg-gray-100 dark:bg-[#1a1a24] animate-pulse flex items-center px-4 gap-3`}>
      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/5 bg-gray-200 dark:bg-gray-600 rounded-lg" />
        <div className="h-3 w-2/5 bg-gray-200 dark:bg-gray-600 rounded-lg" />
      </div>
      <div className="h-6 w-24 bg-gray-200 dark:bg-gray-600 rounded-full" />
    </div>
  );
}

function CountUp({ end, duration = 1500, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let start: number | null = null;
    const anim = (t: number) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      setCount(Math.floor(p * end));
      if (p < 1) requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }, [end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const catPics: Record<string, string> = {
  Tablet: '\u{1F48A}',
  Capsule: '\u{1F48A}',
  Syrup: '\u{1F9EA}',
  Injection: '\u{1F489}',
  Ointment: '\u{1F9F4}',
  Drops: '\u{1F4A7}',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getDefaultDateRange() {
  const start = new Date();
  const end = new Date(Date.now() + 6 * 86400000);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  return `${fmt(start)} - ${fmt(end)}`;
}

interface DashboardData {
  products: any[];
  categories: any[];
  transactions: any[];
}

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('User');
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [chartPeriod, setChartPeriod] = useState('Weekly');
  const [showChartPeriod, setShowChartPeriod] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, txRes] = await Promise.all([
        ProductsAPI.getAll(),
        CategoriesAPI.getAll(),
        TransactionsAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setData({
        products: prodRes.data || [],
        categories: catRes.data || [],
        transactions: txRes.data || [],
      });
    } catch (e) {
      console.error('Dashboard load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    loadDashboard();
    UsersAPI.getCurrent().then(u => {
      if (u?.name) setUserName(u.name);
    }).catch(() => {});
    const onFocus = () => loadDashboard();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadDashboard]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'r' && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        e.preventDefault();
        loadDashboard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadDashboard]);

  const products = data?.products || [];
  const categories = data?.categories || [];
  const transactions = data?.transactions || [];

  const totalProducts = products.length;
  const inStockCount = products.filter((p: any) => (p.quantity ?? p.stockQuantity ?? 0) >= STOCK_LOW_THRESHOLD).length;
  const lowStockCount = products.filter((p: any) => {
    const q = p.quantity ?? p.stockQuantity ?? 0;
    return q > 0 && q < STOCK_LOW_THRESHOLD;
  }).length;
  const outOfStockCount = products.filter((p: any) => (p.quantity ?? p.stockQuantity ?? 0) === 0).length;
  const totalQty = products.reduce((s: number, p: any) => s + (p.quantity ?? p.stockQuantity ?? 0), 0);

  const lowStockItems = products
    .filter((p: any) => (p.quantity ?? p.stockQuantity ?? 0) <= 10)
    .slice(0, 8);

  const catMap: Record<string, { name: string; count: number; totalQty: number }> = {};
  products.forEach((p: any) => {
    const cn = p.categoryName || p.category?.name || 'Uncategorized';
    if (!catMap[cn]) catMap[cn] = { name: cn, count: 0, totalQty: 0 };
    catMap[cn].count += 1;
    catMap[cn].totalQty += (p.quantity ?? p.stockQuantity ?? 0);
  });
  const catInventory = Object.values(catMap);
  const maxCatQty = Math.max(...catInventory.map(c => c.totalQty), 1);
  const catColors = ['#0F9291','#14B8A6','#FA9200','#E65B0D','#3848F5','#8A38F5','#D42314','#FA0051','#0EA5E2','#6366F1'];

  const catChartData = catInventory.map((c, i) => ({
    name: c.name,
    percentage: Math.round((c.totalQty / maxCatQty) * 100),
    count: c.totalQty.toLocaleString(),
    color: catColors[i % catColors.length],
  }));

  const totalStockValue = products.reduce((s: number, p: any) => {
    const qty = p.quantity ?? p.stockQuantity ?? 0;
    return s + (Number(p.price) || 0) * qty;
  }, 0);

  const statCardsData = [
    { label: 'Total Medicines', value: `${totalProducts}`, trend: '-', trendUp: true, href: '/medicines' },
    { label: 'Stock Value', value: formatCurrency(totalStockValue), trend: '-', trendUp: true, href: '/stock' },
    { label: 'Low Stock Items', value: `${lowStockCount}`, trend: '-', trendUp: false, href: '/medicines' },
    { label: 'Out of Stock', value: `${outOfStockCount}`, trend: '-', trendUp: false, href: '/medicines' },
    { label: 'Categories', value: `${categories.length}`, trend: '-', trendUp: true, href: '/categories' },
  ];

  const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const daysMap: Record<string, number> = {};
  products.forEach((p: any) => {
    if (p.createdAt) {
      const d = new Date(p.createdAt);
      const dn = d.getDay();
      const key = dayLabels[dn === 0 ? 6 : dn - 1];
      daysMap[key] = (daysMap[key] || 0) + 1;
    }
  });
  const weeklySalesData = dayLabels.map(day => ({ day, value: daysMap[day] || 0 }));

  const chartData = useMemo(() => {
    if (chartPeriod === 'Monthly') {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const map: Record<string, number> = {};
      products.forEach((p: any) => {
        if (p.createdAt) {
          const d = new Date(p.createdAt);
          map[months[d.getMonth()]] = (map[months[d.getMonth()]] || 0) + 1;
        }
      });
      return months.map(m => ({ day: m, value: map[m] || 0 }));
    }
    if (chartPeriod === 'Yearly') {
      const years: Record<string, number> = {};
      products.forEach((p: any) => {
        if (p.createdAt) {
          const y = new Date(p.createdAt).getFullYear().toString();
          years[y] = (years[y] || 0) + 1;
        }
      });
      return Object.entries(years).map(([day, value]) => ({ day, value }));
    }
    return weeklySalesData;
  }, [chartPeriod, products, weeklySalesData]);

  const purchaseChartData = useMemo(() => {
    const purchases = transactions.filter((t: any) => t.transactionType === 'PURCHASE');
    const dayMap: Record<string, number> = {};
    dayLabels.forEach(d => dayMap[d] = 0);
    purchases.forEach((t: any) => {
      if (t.createdAt) {
        const d = new Date(t.createdAt);
        const dn = d.getDay();
        dayMap[dayLabels[dn === 0 ? 6 : dn - 1]] += Number(t.totalProducts || t.totalPrice || 0);
      }
    });
    return dayLabels.map(day => ({ day, value: dayMap[day] || 0 }));
  }, [transactions]);

  const recentTxs = transactions.slice(0, 5).map((t: any) => ({
    id: t.id,
    customer: t.description || t.id || 'TX-001',
    code: `#INV-${String(t.id || 0).padStart(4, '0')}`,
    amount: Number(t.totalPrice || 0),
    method: t.transactionType === 'PURCHASE' ? 'UPI' : 'Cash',
    avatar: (t.description || 'TX').charAt(0).toUpperCase(),
    type: t.transactionType || 'SALE',
  }));

  const totalSalesVal = transactions
    .filter((t: any) => t.transactionType === 'SALE')
    .reduce((s: number, t: any) => s + Number(t.totalPrice || 0), 0);
  const totalPurchaseVal = transactions
    .filter((t: any) => t.transactionType === 'PURCHASE')
    .reduce((s: number, t: any) => s + Number(t.totalPrice || 0), 0);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="space-y-2">
            <div className="skeleton h-12 w-72 rounded-xl" />
            <div className="skeleton h-4 w-96 rounded-lg" />
          </div>
          <div className="flex gap-2">
            {[1,2,3].map(i => <div key={i} className="skeleton h-[42px] w-[42px] rounded-xl" />)}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-5 gap-3">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
        <div className="flex flex-wrap -mx-3">
          <div className="w-full px-3 2xl:w-8/12"><div className="skeleton h-[400px] rounded-2xl" /></div>
          <div className="w-full px-3 2xl:w-4/12"><div className="skeleton h-[400px] rounded-2xl" /></div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-6 space-y-6 animate-fadeIn">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
      `}</style>

      {/* Export Modal */}
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />

      {/* ========== WELCOME HEADER ========== */}
      <motion.div variants={fadeIn} initial="initial" animate="animate" className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="text-[32px] font-bold mb-1 flex items-center gap-2 flex-wrap text-gray-900 dark:text-white leading-none">
            {getGreeting()}, {userName}
          </h3>
          <p className="text-[13px] mb-0 text-gray-500 dark:text-gray-400">
            This report was generated on {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} -{' '}
            <a href="javascript:void(0);" onClick={loadDashboard} className="text-[#0F9291] dark:text-[#14B8A6] hover:underline">Refresh Report</a>
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <button onClick={() => router.push('/pos')}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D42314] to-[#E65B0D] text-white font-semibold px-5 py-2.5 rounded-xl border-0 text-[15px] cursor-pointer hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-250">
            <ShoppingCart className="w-4 h-4" />
            POS
          </button>
          <DateRangePicker value={dateRange} onChange={(val) => setDateRange(val)} />
          <IconBtn onClick={() => {}}><Maximize className="w-4 h-4" /></IconBtn>
          <div className="relative">
            <button onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#222230] bg-white dark:bg-[#121218] text-gray-700 dark:text-gray-300 text-[15px] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a24] dark:bg-[#1a1a24]/50 hover:shadow-sm transition-all duration-250 active:scale-95"
            >
              <ArrowUpToLine className="w-4 h-4" />
              Export
            </button>
            {mounted && showExportDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#121218] rounded-2xl border border-gray-200 dark:border-[#222230] min-w-[180px] z-[1050] p-1.5 animate-slideDown shadow-lg">
                <button onClick={() => { setShowExportDropdown(false); setShowExportModal(true); }}
                  className="block w-full text-left px-3 py-2.5 rounded-xl border-0 bg-transparent text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a24] dark:bg-[#1a1a24]/50 transition-colors">Export as PDF</button>
                <button onClick={() => { setShowExportDropdown(false); setShowExportModal(true); }}
                  className="block w-full text-left px-3 py-2.5 rounded-xl border-0 bg-transparent text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a24] dark:bg-[#1a1a24]/50 transition-colors">Export as Excel</button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ========== STAT CARDS ========== */}
      <motion.div variants={stagger} initial="initial" animate="animate" className="card bg-white dark:bg-[#121218] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="card-body p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-5 gap-3 gap-y-4">
            {statCardsData.map((stat, i) => (
              <motion.div key={i} variants={fadeIn}
                onClick={() => router.push(stat.href)}
                className={`relative cursor-pointer ${i < statCardsData.length - 1 ? '2xl:border-r 2xl:border-gray-200 dark:border-[#222230]' : ''} ${i > 0 ? '2xl:pl-4' : ''}`}
              >
                <h3 className="flex items-center gap-2 font-['Space_Grotesk'] text-[28px] font-bold text-gray-900 dark:text-white mb-1 hover:text-[#0F9291] dark:text-[#14B8A6] transition-colors duration-200">
                  {stat.value}
                  <span className="font-normal text-sm text-gray-500 dark:text-gray-400">{stat.label}</span>
                </h3>
                <div className="flex items-center gap-1 flex-wrap">
                  <TrendBadge value={stat.trend} up={stat.trendUp} danger={!stat.trendUp} small />
                  <p className="text-[13px] mb-0 text-gray-400">Since Last Month</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ========== ROW 1: Sales & Purchase + Right Column ========== */}
      <div className="flex flex-wrap -mx-3">
        <motion.div variants={fadeIn} initial="initial" animate="animate" className="w-full px-3 2xl:w-8/12 flex">
          <div className="w-full bg-white dark:bg-[#121218] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <h4 className="m-0 font-['Space_Grotesk'] text-xl font-bold text-gray-900 dark:text-white">Medicines Added</h4>
                <div className="relative">
                  <button onClick={() => setShowChartPeriod(!showChartPeriod)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-[#222230] bg-white dark:bg-[#121218] text-gray-700 dark:text-gray-300 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a24] dark:bg-[#1a1a24]/50 hover:shadow-sm transition-all duration-250 active:scale-95">
                    <Calendar className="w-4 h-4" />
                    {chartPeriod}
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  {showChartPeriod && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#121218] rounded-2xl border border-gray-200 dark:border-[#222230] min-w-[140px] z-[1050] p-1.5 animate-slideDown shadow-lg">
                      {['Weekly', 'Monthly', 'Yearly'].map(p => (
                        <button key={p} onClick={() => { setChartPeriod(p); setShowChartPeriod(false); }}
                          className={`block w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                            chartPeriod === p ? 'bg-[#0F9291]/10 text-[#0F9291] dark:text-[#14B8A6] font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a24] dark:bg-[#1a1a24]/50'
                          }`}>{p}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="mb-0 flex items-center gap-2 font-['Space_Grotesk'] text-lg font-bold text-gray-900 dark:text-white">
                      <span className="font-normal text-sm text-gray-500 dark:text-gray-400">Medicines</span>
                      {totalProducts}
                    </h5>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="mb-0 flex items-center gap-2 font-['Space_Grotesk'] text-lg font-bold text-gray-900 dark:text-white">
                      <span className="font-normal text-sm text-gray-500 dark:text-gray-400">Categories</span>
                      {categories.length}
                    </h5>
                  </div>
                </div>
              </div>
              <div id="products-chart" className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="spSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0F9291" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#0F9291" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false}
                      tick={{ fontSize: 14, fill: '#9CA3AF', fontWeight: 500 }} tickMargin={8} />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fontSize: 14, fill: '#9CA3AF', fontWeight: 500 }}
                      tickFormatter={(v: number) => `${v}`} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-white dark:bg-[#121218] rounded-2xl shadow-xl border border-gray-100 dark:border-[#222230] p-4 animate-fadeIn">
                          <p className="text-xs font-semibold text-gray-400 m-0 mb-2 uppercase tracking-wider">{label}</p>
                          {payload.map((p: any, i: number) => (
                            <div key={i} className="flex items-center justify-between gap-6">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Medicines Added</span>
                              <span className="text-[15px] font-bold text-gray-900 dark:text-white">{p.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }} />
                    <Area type="monotone" dataKey="value" stroke="#0F9291" strokeWidth={3}
                      fill="url(#spSales)" dot={false}
                      activeDot={{ r: 7, fill: '#0F9291', stroke: '#FFFFFF', strokeWidth: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <h6 className="font-bold text-sm mt-4 mb-3 text-gray-800 dark:text-gray-200">Overview</h6>
              <div className="flex flex-wrap -mx-2">
                {[
                  { label: 'In Stock Items', value: inStockCount.toLocaleString(), icon: TrendingUp, bg: '#0F9291', href: '/medicines' },
                  { label: 'Low Stock Items', value: lowStockCount.toLocaleString(), icon: ShoppingCart, bg: '#FA9200', href: '/medicines' },
                ].map((item, i) => (
                  <div key={i} className="w-full sm:w-1/2 px-2 mb-2 sm:mb-0">
                    <div onClick={() => router.push(item.href)}
                      className="border border-gray-100 dark:border-[#222230] rounded-xl p-4 flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 bg-gradient-to-br from-white dark:from-[#121218] to-gray-50/50 dark:to-[#1a1a24]/50 cursor-pointer">
                      <div>
                        <p className="font-semibold m-0 mb-1 text-sm text-gray-800 dark:text-gray-200">{item.label}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h6 className="m-0 font-['Space_Grotesk'] text-lg font-bold text-gray-900 dark:text-white">{item.value}</h6>
                        </div>
                      </div>
                      <div className="flex items-center justify-center shrink-0 w-11 h-11 rounded-xl shadow-md" style={{ background: item.bg }}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} initial="initial" animate="animate" className="w-full px-3 2xl:w-4/12 flex flex-col mt-6 2xl:mt-0">
          <div className="flex flex-wrap -mx-2">
            <div className="w-full 2xl:w-full md:w-1/2 px-2 mb-4 2xl:mb-4 md:mb-0 2xl:md:mb-4">
              <div className="relative overflow-hidden rounded-[20px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/20"
                style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(15,146,145,0.15),transparent_50%)] pointer-events-none"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,122,255,0.08),transparent_50%)] pointer-events-none"></div>
                <div className="flex items-center justify-between mb-5 relative z-[1]">
                  <div>
                    <h4 className="text-lg font-bold text-white m-0 tracking-tight">Medicine Statistics</h4>
                    <p className="text-[11px] text-white/50 m-0 mt-0.5">{totalProducts} total products</p>
                  </div>
                  <button onClick={loadDashboard} className="flex items-center justify-center w-9 h-9 rounded-xl border-0 text-white/70 cursor-pointer transition-all duration-250 hover:bg-white dark:bg-[#121218]/10 hover:text-white active:scale-90 relative" style={{ background: 'rgba(255,255,255,.06)' }}>
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-stretch gap-3 relative z-[1]">
                  <div className="flex flex-col gap-2.5 flex-1">
                    {[
                      { label: 'Low Stock', value: lowStockCount, icon: AlertTriangle, color: '#FA9200', bg: 'rgba(250,146,0,0.15)' },
                      { label: 'Available', value: inStockCount, icon: TrendingUp, color: '#0F9BA8', bg: 'rgba(15,155,168,0.15)' },
                      { label: 'Out of Stock', value: outOfStockCount, icon: Ban, color: '#FF453A', bg: 'rgba(255,69,58,0.15)' },
                    ].map((item, i) => (
                      <div key={i}
                        className="flex items-center gap-3 transition-all duration-250 hover:-translate-y-0.5 cursor-default group"
                        style={{ background: item.bg, borderRadius: 12, padding: '10px 14px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <div className="flex items-center justify-center shrink-0 w-9 h-9 rounded-[10px] transition-all duration-250 group-hover:scale-110" style={{ background: `${item.color}22` }}>
                          <item.icon className="w-4.5 h-4.5" style={{ color: item.color }} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-white/50 m-0">{item.label}</p>
                          <h5 className="text-[15px] font-bold text-white m-0 tracking-tight">{item.value.toLocaleString()}</h5>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2 pl-2" style={{ minWidth: 120 }}>
                    <div className="relative" style={{ width: 100, height: 100 }}>
                      <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                        {(() => {
                          const total = Math.max(totalProducts, 1);
                          const inPct = inStockCount / total;
                          const lowPct = lowStockCount / total;
                          const outPct = outOfStockCount / total;
                          const circ = 2 * Math.PI * 42;
                          let offset = 0;
                          const segments = [
                            { pct: inPct, color: '#0F9BA8', label: 'In Stock' },
                            { pct: lowPct, color: '#FA9200', label: 'Low' },
                            { pct: outPct, color: '#FF453A', label: 'Out' },
                          ].filter(s => s.pct > 0);
                          if (segments.length === 0) segments.push({ pct: 1, color: '#333', label: 'Empty' });
                          return segments.map((seg, si) => {
                            const len = seg.pct * circ;
                            const dash = `${len} ${circ - len}`;
                            const el = (
                              <circle key={si} cx="50" cy="50" r="42" fill="none" stroke={seg.color} strokeWidth="8"
                                strokeDasharray={dash} strokeDashoffset={-offset} strokeLinecap="round"
                                className="transition-all duration-700" />
                            );
                            offset += len;
                            return el;
                          });
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-white leading-none">{totalProducts}</span>
                        <span className="text-[9px] text-white/40 font-medium mt-0.5">Total</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {[
                        { color: '#0F9BA8', pct: Math.round((inStockCount / Math.max(totalProducts, 1)) * 100) },
                        { color: '#FA9200', pct: Math.round((lowStockCount / Math.max(totalProducts, 1)) * 100) },
                        { color: '#FF453A', pct: Math.round((outOfStockCount / Math.max(totalProducts, 1)) * 100) },
                      ].map((d, di) => (
                        <div key={di} className="flex items-center gap-1">
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: d.color }}></div>
                          <span className="text-[10px] font-semibold text-white/70">{d.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full 2xl:w-full md:w-1/2 px-2">
              <div className="bg-white dark:bg-[#121218] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <div className="p-6">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <h4 className="m-0 font-['Space_Grotesk'] text-xl font-bold text-gray-900 dark:text-white">Stock Overview</h4>
                    <IconBtn onClick={loadDashboard}><RefreshCw className="w-4 h-4" /></IconBtn>
                  </div>
                  <div id="sale-chart" className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklySalesData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="wsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0F9291" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#0F9291" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false}
                          tick={{ fontSize: 12, fill: '#9CA3AF', fontWeight: 500 }} />
                        <YAxis hide />
                        <Tooltip content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="bg-white dark:bg-[#121218] rounded-xl shadow-lg border border-gray-100 dark:border-[#222230] p-3 animate-fadeIn">
                              <p className="text-xs font-medium text-gray-400 m-0 mb-1">{label}</p>
                              <p className="text-sm font-bold text-gray-900 dark:text-white m-0">{payload[0]?.value} items</p>
                            </div>
                          );
                        }} />
                        <Area type="monotone" dataKey="value" stroke="#0F9291" strokeWidth={2.5}
                          fill="url(#wsGrad)" dot={false}
                          activeDot={{ r: 5, fill: '#0F9291', stroke: '#FFFFFF', strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2 mt-1">
                    <div>
                      <p className="text-xs m-0 mb-0.5 text-gray-500 dark:text-gray-400">Total Items</p>
                      <h5 className="m-0 font-['Space_Grotesk'] text-xl font-bold text-gray-900 dark:text-white">{totalQty.toLocaleString()}</h5>
                    </div>
                    <div className="flex items-center gap-1.5 border border-gray-200 dark:border-[#222230] rounded-full py-0.5 pl-0.5 pr-3 hover:shadow-sm transition-shadow duration-250">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">{Math.round((inStockCount / Math.max(totalProducts, 1)) * 100)}%</span>
                      <p className="m-0 text-xs text-gray-400">In Stock</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ===== PURCHASE CHART ===== */}
      <motion.div variants={fadeIn} initial="initial" animate="animate" className="w-full bg-white dark:bg-[#121218] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h4 className="font-['Space_Grotesk'] text-xl font-bold text-gray-900 dark:text-white m-0">Purchase Activity</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Purchases: {formatCurrency(totalPurchaseVal)}</span>
            </div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={purchaseChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="purchaseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FA9200" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#FA9200" stopOpacity={0} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false}
                  tick={{ fontSize: 14, fill: '#9CA3AF', fontWeight: 500 }} tickMargin={8} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fontSize: 14, fill: '#9CA3AF', fontWeight: 500 }}
                  tickFormatter={(v: number) => `${v}`} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-white dark:bg-[#121218] rounded-2xl shadow-xl border border-gray-100 dark:border-[#222230] p-4 animate-fadeIn">
                      <p className="text-xs font-semibold text-gray-400 m-0 mb-2 uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white m-0">Purchase Qty: {payload[0]?.value}</p>
                    </div>
                  );
                }} />
                <Area type="monotone" dataKey="value" stroke="#FA9200" strokeWidth={3}
                  fill="url(#purchaseGrad)" dot={false}
                  activeDot={{ r: 7, fill: '#FA9200', stroke: '#FFFFFF', strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* ========== ROW 2: Category + Stock Alerts + Expired ========== */}
      <div className="flex flex-wrap -mx-3">
        {/* ---------- 1. INVENTORY BY CATEGORY ---------- */}
        <motion.div variants={fadeIn} initial="initial" animate="animate" className="w-full px-3 2xl:w-5/12 md:w-1/2 flex mb-6 2xl:mb-0">
          <div className="w-full bg-white dark:bg-[#121218] rounded-[20px] border border-[#EEF2F7] dark:border-[#222230] shadow-[0_12px_35px_rgba(15,23,42,0.06)] hover:shadow-lg hover:-translate-y-1 transition-all duration-250 flex flex-col p-6">
            <div className="flex items-start justify-between flex-wrap gap-2 mb-1">
              <div>
                <h4 className="font-['Space_Grotesk'] text-lg font-bold text-gray-900 dark:text-white m-0">Inventory by Category</h4>
                <p className="text-[13px] text-gray-400 m-0 mt-0.5">Current Stock Distribution</p>
              </div>
              <div className="flex gap-1.5">
                <Btn48 onClick={() => router.push('/categories')}><Plus className="w-5 h-5" /></Btn48>
                <Btn48 onClick={loadDashboard}><RefreshCw className="w-5 h-5" /></Btn48>
              </div>
            </div>
            <div className="flex flex-col gap-4 py-5 my-4 border-y border-[#EEF2F7] dark:border-[#222230]">
              {catChartData.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">No products yet</div>
              ) : (
                catChartData.slice(0, 6).map((cat, i) => (
                  <div key={i} onClick={() => router.push('/categories')} className="group flex items-center gap-3 cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-[#1a1a24]/50 flex items-center justify-center shrink-0 text-base group-hover:scale-110 transition-transform duration-250">
                      {catPics[cat.name] || '\u{1F4E6}'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{cat.name}</span>
                        <span className="text-[11px] font-medium text-gray-400">{cat.percentage}%</span>
                      </div>
                      <div className="relative">
                        <div className="h-4 rounded-full bg-[#F1F5F9] dark:bg-[#1a1a24] w-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r flex items-center justify-end pr-0.5 transition-all duration-1000 ease-out group-hover:brightness-110 group-hover:scale-[1.02] origin-left"
                            style={{ width: `${cat.percentage}%`, background: `linear-gradient(90deg, ${cat.color}, ${['#14B8A6','#0F9291','#E65B0D','#D42314','#8A38F5','#D42314'][i % 6]})` }}
                          />
                        </div>
                        <span className="absolute -top-[18px] right-0 bg-white dark:bg-[#121218] text-gray-900 dark:text-white border border-[#EEF2F7] dark:border-[#222230] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Stock: {cat.count}
                        </span>
                        <span className="absolute -bottom-5 right-0 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                          {cat.count} units · {cat.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center">
              <div className="flex-1 text-center relative">
                <div className="flex items-center justify-center gap-2 mb-0.5">
                  <Package className="w-4 h-4 text-[#0F9291] dark:text-[#14B8A6]" />
                  <h5 className="font-['Space_Grotesk'] text-[26px] font-bold text-gray-900 dark:text-white m-0">
                    <CountUp end={totalProducts} />
                  </h5>
                </div>
                <p className="text-[12px] text-gray-400 m-0">Medicines</p>
                <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-10 bg-[#EEF2F7]" />
              </div>
              <div className="flex-1 text-center relative">
                <div className="flex items-center justify-center gap-2 mb-0.5">
                  <Layers className="w-4 h-4 text-[#FA9200]" />
                  <h5 className="font-['Space_Grotesk'] text-[26px] font-bold text-gray-900 dark:text-white m-0">
                    <CountUp end={categories.length} />
                  </h5>
                </div>
                <p className="text-[12px] text-gray-400 m-0">Categories</p>
                <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-10 bg-[#EEF2F7]" />
              </div>
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2 mb-0.5">
                  <AlertTriangle className="w-4 h-4 text-[#D42314]" />
                  <h5 className="font-['Space_Grotesk'] text-[26px] font-bold text-gray-900 dark:text-white m-0">
                    <CountUp end={lowStockCount} />
                  </h5>
                </div>
                <p className="text-[12px] text-gray-400 m-0">Low Stock</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ---------- 2. STOCK ALERTS ---------- */}
        <motion.div variants={fadeIn} initial="initial" animate="animate" className="w-full px-3 2xl:w-4/12 md:w-1/2 flex mb-6 2xl:mb-0">
          <div className="w-full bg-white dark:bg-[#121218] rounded-[20px] border border-[#EEF2F7] dark:border-[#222230] shadow-[0_12px_35px_rgba(15,23,42,0.06)] hover:shadow-lg hover:-translate-y-1 transition-all duration-250 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between flex-wrap gap-2 px-6 pt-6 pb-4">
              <div className="flex flex-col">
                <h4 className="font-['Space_Grotesk'] text-lg font-bold text-gray-900 dark:text-white m-0">Stock Alerts</h4>
                <p className="text-[13px] text-gray-400 m-0 mt-0.5">Items requiring attention</p>
              </div>
              <div className="flex gap-1.5">
                <Btn48 onClick={loadDashboard}><RefreshCw className="w-5 h-5" /></Btn48>
              </div>
            </div>
            <div className="flex-1 flex flex-col mx-3 mb-3 rounded-2xl bg-[#F8FAFC] dark:bg-[#121218]">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {lowStockItems.length} alerts
                </span>
                <Link href="/medicines" className="text-[12px] font-semibold text-[#0F9291] dark:text-[#14B8A6] hover:text-teal-700 dark:hover:text-teal-400 transition-colors">
                  View All
                </Link>
              </div>
              <div className="flex-1 px-4 pb-4">
                {lowStockItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                      <Package className="w-7 h-7 text-emerald-400 dark:text-emerald-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white m-0">All stocked up!</p>
                    <p className="text-xs text-gray-400 mt-1">No alerts at the moment</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1 -mr-1">
                    {lowStockItems.map((item: any, i: number) => {
                      const qty = item.quantity ?? item.stockQuantity ?? 0;
                      const isCritical = qty === 0;
                      const isLow = qty > 0 && qty <= 5;
                      const badgeCfg = isCritical
                        ? { bg: '#FEF2F2', text: '#DC2626', dot: '#DC2626', label: '0 in Stock' }
                        : isLow
                        ? { bg: '#FFF7ED', text: '#EA580C', dot: '#EA580C', label: `${qty} in Stock` }
                        : { bg: '#EFF6FF', text: '#2563EB', dot: '#2563EB', label: `${qty} in Stock` };
                      return (
                        <div key={i} onClick={() => router.push(`/medicines/create?id=${item.id}`)}
                          className="h-[72px] rounded-2xl p-3.5 flex items-center justify-between gap-2 cursor-pointer transition-all duration-250 bg-white dark:bg-[#121218] border border-[#EEF2F7] dark:border-[#222230] hover:bg-[#F8FAFC] dark:hover:bg-[#1a1a24] dark:bg-[#121218] hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.99] group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br ${
                              isCritical ? 'from-red-100 dark:from-red-900/40 to-red-50 dark:to-red-800/40' : isLow ? 'from-orange-100 dark:from-orange-900/40 to-orange-50 dark:to-orange-800/40' : 'from-blue-100 dark:from-blue-900/40 to-blue-50 dark:to-blue-800/40'
                            }`}>
                              <Box className={`w-5 h-5 ${
                                isCritical ? 'text-red-500 dark:text-red-400' : isLow ? 'text-orange-500 dark:text-orange-400' : 'text-blue-500 dark:text-blue-400'
                              }`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[15px] font-bold text-gray-900 dark:text-white m-0 truncate leading-tight">{item.name}</p>
                              <p className="text-[12px] text-gray-400 m-0 mt-0.5">{item.sku}</p>
                            </div>
                          </div>
                          <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap ${isCritical ? 'animate-pulse-dot' : ''}`}
                            style={{ background: badgeCfg.bg, color: badgeCfg.text }}>
                            <span className={`w-2 h-2 rounded-full inline-block ${isCritical ? 'animate-pulse' : ''}`}
                              style={{ background: badgeCfg.dot }} />
                            {badgeCfg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ---------- 3. STOCK OVERVIEW + CHART ---------- */}
        <motion.div variants={fadeIn} initial="initial" animate="animate" className="w-full px-3 2xl:w-3/12 flex flex-col gap-6">
          <div className="w-full bg-white dark:bg-[#121218] rounded-[20px] border border-[#EEF2F7] dark:border-[#222230] shadow-[0_12px_35px_rgba(15,23,42,0.06)] hover:shadow-lg hover:-translate-y-1 transition-all duration-250 flex flex-col p-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div>
                <h4 className="font-['Space_Grotesk'] text-xl font-bold text-gray-900 dark:text-white m-0">Stock Summary</h4>
                <p className="text-[13px] text-gray-400 m-0 mt-0.5">Inventory status breakdown</p>
              </div>
              <Btn48 onClick={() => router.push('/stock')}><ArrowUpRight className="w-5 h-5" /></Btn48>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: 'In Stock', count: inStockCount, color: '#0F9291', pct: totalProducts ? Math.round((inStockCount / totalProducts) * 100) : 0 },
                { label: 'Low Stock', count: lowStockCount, color: '#FA9200', pct: totalProducts ? Math.round((lowStockCount / totalProducts) * 100) : 0 },
                { label: 'Out of Stock', count: outOfStockCount, color: '#D42314', pct: totalProducts ? Math.round((outOfStockCount / totalProducts) * 100) : 0 },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-[#1a1a24]/50 hover:bg-gray-100 dark:bg-[#1a1a24] transition-colors cursor-pointer" onClick={() => router.push('/medicines')}>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.label}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{s.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.pct}%`, background: s.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full bg-white dark:bg-[#121218] rounded-[20px] border border-[#EEF2F7] dark:border-[#222230] shadow-[0_12px_35px_rgba(15,23,42,0.06)] hover:shadow-lg hover:-translate-y-1 transition-all duration-250 flex flex-col p-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div>
                <h4 className="font-['Space_Grotesk'] text-xl font-bold text-gray-900 dark:text-white m-0">Categories</h4>
                <p className="text-[13px] text-gray-400 m-0 mt-0.5">Medicine category distribution</p>
              </div>
              <Btn48 onClick={loadDashboard}><RefreshCw className="w-5 h-5" /></Btn48>
            </div>
            <div className="relative">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={catInventory.slice(0, 6).map((c, i) => ({ name: c.name, value: c.totalQty, color: catColors[i % catColors.length] }))}
                      cx="50%" cy="50%" innerRadius={55} outerRadius={88}
                      paddingAngle={3} dataKey="value"
                      animationBegin={200} animationDuration={1500}
                      strokeLinecap="round"
                      cornerRadius={6}
                    >
                      {catInventory.slice(0, 6).map((entry, idx) => (
                        <Cell key={idx} fill={catColors[idx % catColors.length]}
                          stroke={catColors[idx % catColors.length]}
                          strokeWidth={3}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-[#121218] rounded-xl shadow-lg border border-gray-100 dark:border-[#222230] p-3 animate-fadeIn">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white m-0">{d.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Items: <span className="font-bold text-gray-900 dark:text-white">{d.value}</span></p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-[10px] font-medium text-gray-400 m-0 uppercase tracking-wider">Categories</p>
                <p className="font-['Space_Grotesk'] text-[26px] font-bold text-gray-900 dark:text-white m-0 -mt-0.5 leading-none">
                  <CountUp end={categories.length} />
                </p>
                <p className="text-[10px] text-gray-400 m-0 mt-0.5">Total</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 pt-3.5 border-t border-[#EEF2F7] dark:border-[#222230] flex-wrap">
              {catInventory.slice(0, 5).map((c, i) => (
                <div key={i} onClick={() => router.push('/categories')} className="flex items-center gap-1.5 group cursor-pointer">
                  <span className="w-3 h-3 rounded-full transition-all duration-250 group-hover:scale-125 group-hover:shadow-md" style={{ background: catColors[i % catColors.length] }} />
                  <span className="text-[12px] text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:text-gray-200 font-medium transition-colors duration-250">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ========== ROW 3: Invoice Stats + Recent Transactions ========== */}
      <div className="flex flex-wrap -mx-3">
        <motion.div variants={fadeIn} initial="initial" animate="animate" className="w-full px-3 2xl:w-4/12 md:w-1/2 flex mb-6 2xl:mb-0">
          <div className="w-full bg-white dark:bg-[#121218] rounded-[20px] border border-[#EEF2F7] dark:border-[#222230] shadow-[0_12px_35px_rgba(15,23,42,0.06)] hover:shadow-lg hover:-translate-y-1 transition-all duration-250 flex flex-col p-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div>
                <h4 className="font-['Space_Grotesk'] text-xl font-bold text-gray-900 dark:text-white m-0">Medicine Overview</h4>
                <p className="text-[13px] text-gray-400 m-0 mt-0.5">Current inventory distribution</p>
              </div>
              <Btn48 onClick={loadDashboard}><RefreshCw className="w-5 h-5" /></Btn48>
            </div>
            <div className="text-center relative mb-4">
              <div className="h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'In Stock', value: Math.max(inStockCount, 1) },
                        { name: 'Low Stock', value: Math.max(lowStockCount, 1) },
                        { name: 'Out of Stock', value: Math.max(outOfStockCount, 1) },
                      ]}
                      cx="50%" cy="50%" innerRadius={65} outerRadius={98}
                      paddingAngle={3} dataKey="value"
                      animationBegin={200} animationDuration={1500}
                      strokeLinecap="round" strokeWidth={2} cornerRadius={8}
                    >
                      {[
                        { name: 'In Stock', color: '#0F9291' },
                        { name: 'Low Stock', color: '#FA9200' },
                        { name: 'Out of Stock', color: '#D42314' },
                      ].map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} stroke={entry.color} strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        const total = inStockCount + lowStockCount + outOfStockCount || 1;
                        return (
                          <div className="bg-white dark:bg-[#121218] rounded-xl shadow-lg border border-gray-100 dark:border-[#222230] p-3 animate-fadeIn">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white m-0">{d.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Count: <span className="font-bold text-gray-900 dark:text-white">{d.value}</span></p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Share: <span className="font-bold text-gray-900 dark:text-white">{Math.round(d.value / total * 100)}%</span></p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <h5 className="font-['Space_Grotesk'] text-[28px] font-bold text-gray-900 dark:text-white m-0 leading-none">
                  <CountUp end={totalProducts} />
                </h5>
                <p className="text-[11px] text-gray-400 m-0 mt-0.5">Total Medicines</p>
                <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                  <ArrowUpRight className="w-3 h-3" />
                  {totalProducts ? Math.round((inStockCount / totalProducts) * 100) : 0}% In Stock
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'In Stock', count: inStockCount, color: '#0F9291' },
                { label: 'Low Stock', count: lowStockCount, color: '#FA9200' },
                { label: 'Out of Stock', count: outOfStockCount, color: '#D42314' },
              ].map((s, i) => {
                const total = inStockCount + lowStockCount + outOfStockCount || 1;
                return (
                  <div key={i} onClick={() => router.push('/medicines')}
                    className="group rounded-2xl p-3 flex items-center justify-between transition-all duration-250 hover:bg-gray-50 dark:hover:bg-[#1a1a24] dark:bg-[#1a1a24]/50 cursor-pointer border border-transparent hover:border-gray-100 dark:border-[#222230]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0 transition-transform duration-250 group-hover:scale-125" style={{ background: s.color }} />
                      <div>
                        <h5 className="m-0 text-base font-bold text-gray-900 dark:text-white">
                          <span className="font-['Space_Grotesk']">{s.count}</span>
                        </h5>
                        <p className="text-[13px] text-gray-500 dark:text-gray-400 m-0">{s.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-400">{Math.round((s.count / total) * 100)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div variants={stagger} initial="initial" animate="animate" className="w-full px-3 2xl:w-4/12 md:w-1/2 flex flex-col gap-4 mb-6 2xl:mb-0">
          {[
            { label: 'Total Products', value: totalProducts.toLocaleString(), icon: FileText, iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500', sparkColor: '#0F9291', pct: 100, href: '/medicines' },
            { label: 'Total Categories', value: categories.length.toLocaleString(), icon: FileInput, iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-500', sparkColor: '#3848F5', pct: categories.length ? 85 : 0, href: '/categories' },
            { label: 'Total Stock Qty', value: totalQty.toLocaleString(), icon: FileX, iconBg: 'bg-gradient-to-br from-rose-500 to-pink-500', sparkColor: '#D42314', pct: totalQty ? 72 : 0, href: '/stock' },
          ].map((inv, i) => {
            const IconComp = inv.icon;
            const sparkData = [30, 45, 25, 60, 40, 55, 70, 50, 65, 45, 80, 65];
            return (
              <motion.div key={i} variants={fadeIn} onClick={() => router.push(inv.href)}
                className="w-full bg-white dark:bg-[#121218] rounded-[20px] border border-[#EEF2F7] dark:border-[#222230] shadow-[0_12px_35px_rgba(15,23,42,0.06)] overflow-hidden relative transition-all duration-250 hover:shadow-lg hover:-translate-y-1 group z-[1] cursor-pointer"
              >
                <div className="p-5 relative z-[2]">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <div className={`flex items-center justify-center w-11 h-11 rounded-xl text-white shrink-0 shadow-lg transition-transform duration-250 group-hover:scale-110 ${inv.iconBg}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-end justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 m-0 mb-1">{inv.label}</p>
                      <h3 className="font-['Space_Grotesk'] text-[30px] font-bold text-gray-900 dark:text-white m-0 leading-none">
                        {inv.value}
                      </h3>
                    </div>
                    <div className="flex items-end gap-1 h-10">
                      {sparkData.slice(0, 8).map((v, j) => (
                        <div key={j}
                          className="w-1.5 rounded-sm transition-all duration-250 group-hover:opacity-80"
                          style={{
                            height: `${v * 0.5}px`,
                            background: inv.sparkColor,
                            opacity: 0.3 + (j / sparkData.length) * 0.4,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 h-1 rounded-full bg-gray-100 dark:bg-[#1a1a24] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${inv.pct}%`,
                        background: `linear-gradient(90deg, ${inv.sparkColor}, ${inv.sparkColor}88)`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div variants={fadeIn} initial="initial" animate="animate" className="w-full px-3 2xl:w-4/12 flex flex-col gap-4 mb-6 2xl:mb-0">
          <div className="w-full bg-white dark:bg-[#121218] rounded-[20px] border border-[#EEF2F7] dark:border-[#222230] shadow-[0_12px_35px_rgba(15,23,42,0.06)] hover:shadow-lg hover:-translate-y-1 transition-all duration-250 flex flex-col p-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div>
                <h4 className="font-['Space_Grotesk'] text-xl font-bold text-gray-900 dark:text-white m-0">Recent Transactions</h4>
                <p className="text-[13px] text-gray-400 m-0 mt-0.5">Latest inventory movements</p>
              </div>
              <Btn48 onClick={loadDashboard}><RefreshCw className="w-5 h-5" /></Btn48>
            </div>
            <div className="flex flex-col gap-3">
              {recentTxs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ShoppingCart className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No transactions yet</p>
                  <p className="text-xs text-gray-400 mt-1">Start by adding a purchase or sale</p>
                </div>
              ) : (
                recentTxs.map((tx, i) => (
                  <div key={i} onClick={() => router.push('/sales/invoices')}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-[#1a1a24]/50 hover:bg-gray-100 dark:bg-[#1a1a24] transition-all duration-250 cursor-pointer group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      tx.type === 'PURCHASE' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {tx.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate m-0">{tx.code}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 m-0 mt-0.5">{tx.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white m-0">{formatCurrency(tx.amount)}</p>
                      <p className="text-[11px] text-gray-400 m-0 mt-0.5">{tx.method}</p>
                    </div>
                  </div>
                ))
              )}
              {recentTxs.length > 0 && (
                <Link href="/sales/invoices"
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#222230] text-sm font-medium text-[#0F9291] dark:text-[#14B8A6] hover:bg-[#0F9291]/5 dark:hover:bg-[#0F9291]/10 transition-all duration-250 no-underline mt-1"
                >
                  <span>View All Transactions</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}