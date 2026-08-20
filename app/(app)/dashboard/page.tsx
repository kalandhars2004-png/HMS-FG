'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  RefreshCw, Plus, Maximize, ArrowUpToLine, ShoppingCart, Calendar,
  ArrowUpRight, ArrowDownRight, ChevronDown, FileText, Pill, Package,
} from '@/components/ui/LucideIcon';
import { ProductsAPI, CategoriesAPI, TransactionsAPI, InvoicesAPI, BatchesAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { takeDashboardBootData, DATA_CHANGED_EVENT } from '@/lib/boot-cache';
import { formatCurrency } from '@/lib/currency';
import { getStockStatus, getStockLevel, DEFAULT_LOW_STOCK, type StockLevel } from '@/lib/stock-status';
import ExportModal from '@/components/dashboard/ExportModal';
import StockAlertDialog from '@/components/dashboard/StockAlertDialog';
import SalesPurchasePanel from '@/components/dashboard/SalesPurchasePanel';
import { CardSkeleton, ChartSkeleton } from '@/components/ui/Loading';

const LOW_STOCK_THRESHOLD = DEFAULT_LOW_STOCK;

/**
 * One card treatment everywhere. A hairline plus a barely-there shadow reads as
 * a lifted surface; a hard 1px grey box reads as a wireframe. Colour is reserved
 * for meaning, so the containers stay quiet.
 */
const CARD =
  'rounded-2xl bg-white dark:bg-[#121218] border border-slate-900/[0.06] dark:border-white/[0.06] ' +
  'shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.03)]';

const MUTED = 'text-[#667085] dark:text-gray-400';

/** Small circular ghost button used across every card header in the reference. */
function RoundBtn({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 dark:text-gray-500
                 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.06]
                 transition-colors duration-150 shrink-0"
    >
      {children}
    </button>
  );
}

function CardHead({ title, actions, sub }: { title: string; actions?: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
      <div className="min-w-0">
        <h5 className="text-[18px] font-bold tracking-[-0.01em] text-gray-900 dark:text-white">{title}</h5>
        {sub && <p className={`text-[15px] ${MUTED} mt-0.5`}>{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
    </div>
  );
}

function Delta({ value, up }: { value: string; up: boolean }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-[15px] font-semibold ${
      up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
      {value}
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
    </span>
  );
}

interface DashboardData {
  products: any[]; categories: any[]; transactions: any[];
  invoices: any[]; batches: any[];
}

/**
 * Inventory-by-Category bar fills. The reference cycles decorative hues, but a
 * colour that means nothing is wasted ink — here the hue encodes the category's
 * stock health, on the same scale used everywhere else in the app.
 */
const LEVEL_GRADIENT: Record<StockLevel, string> = {
  healthy:  'linear-gradient(90deg,#CFEDEA 0%,#0F9291 100%)',
  low:      'linear-gradient(90deg,#FBEFC5 0%,#EAB308 100%)',
  critical: 'linear-gradient(90deg,#FCE3CA 0%,#F97316 100%)',
  out:      'linear-gradient(90deg,#FAD7D7 0%,#EF4444 100%)',
};

const LEVEL_NOTE: Record<StockLevel, string> = {
  healthy:  'All items healthy',
  low:      'Contains low-stock items',
  critical: 'Contains critically low items (under 5)',
  out:      'Contains out-of-stock items',
};

/** Stock-alert pills cycle through hues in the reference rather than encoding severity. */
const ALERT_PILL = [
  'bg-red-50 text-red-600 dark:bg-red-900/25 dark:text-red-400',
  'bg-blue-50 text-blue-600 dark:bg-blue-900/25 dark:text-blue-400',
  'bg-purple-50 text-purple-600 dark:bg-purple-900/25 dark:text-purple-400',
  'bg-orange-50 text-orange-600 dark:bg-orange-900/25 dark:text-orange-400',
];

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.username || 'there';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [generatedAt, setGeneratedAt] = useState('');
  const [loadError, setLoadError] = useState(false);

  const loadDashboard = useCallback(async (opts?: { useBootCache?: boolean }) => {
    if (opts?.useBootCache) {
      const cached = takeDashboardBootData();
      if (cached) { setData(cached); setLoading(false); return; }
    }
    setLoading(true);
    setLoadError(false);
    try {
      const [p, c, t, inv, b] = await Promise.all([
        ProductsAPI.getAll(),
        CategoriesAPI.getAll(),
        TransactionsAPI.getAll().catch(() => ({ data: [] })),
        InvoicesAPI.getAll().catch(() => ({ data: [] })),
        BatchesAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setData({
        products: p.data || [], categories: c.data || [], transactions: t.data || [],
        invoices: inv.data || [], batches: b.data || [],
      });
    } catch (e) {
      // Never fall through to rendering zeros — a failed fetch and an empty
      // pharmacy look identical on screen, and one of them is a lie.
      console.error('Dashboard load failed:', e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard({ useBootCache: true });
    // Refetch when the tab regains focus, and when any screen reports that it
    // changed stock or sales (POS checkout, stock adjustment, receiving stock).
    const refresh = () => loadDashboard();
    window.addEventListener('focus', refresh);
    window.addEventListener(DATA_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener(DATA_CHANGED_EVENT, refresh);
    };
  }, [loadDashboard]);

  useEffect(() => {
    setGeneratedAt(new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }));
  }, [data]);

  /**
   * Raise the restock dialog once per sign-in. sessionStorage (not local) is the
   * point: it clears on sign-out, so the next person to log in is warned again,
   * but it does not nag on every return to the dashboard.
   */
  useEffect(() => {
    if (!data) return;
    const qty = (p: any) => Number(p.stockQuantity ?? p.quantity ?? 0);
    const needsAttention = data.products.some(p => qty(p) <= LOW_STOCK_THRESHOLD);
    if (!needsAttention) return;
    if (sessionStorage.getItem('ims.stockAlert.seen')) return;
    sessionStorage.setItem('ims.stockAlert.seen', '1');
    setShowStockAlert(true);
  }, [data]);

  const m = useMemo(() => {
    const products = data?.products ?? [];
    const categories = data?.categories ?? [];
    const tx = data?.transactions ?? [];
    const invoices = data?.invoices ?? [];
    const batches = data?.batches ?? [];

    const qty = (p: any) => Number(p.stockQuantity ?? p.quantity ?? 0);
    const lvl = (p: any) => getStockLevel(qty(p), p.lowStockQuantity ?? undefined);
    const outOfStock = products.filter(p => lvl(p) === 'out');
    const critical = products.filter(p => lvl(p) === 'critical');
    const lowStock = products.filter(p => lvl(p) === 'low');
    const available = products.filter(p => lvl(p) === 'healthy');

    /**
     * POS checkout writes to pos_transactions + invoices + inventory_movements —
     * it never touches the `transactions` table. Reading sales only from
     * /api/transactions therefore missed every counter sale. Invoices are the
     * 1:1 record of a completed POS sale, so revenue is derived from them plus
     * any SALE rows booked through the transactions ledger.
     */
    const VOIDED = ['CANCELLED', 'CANCELED', 'VOID', 'VOIDED'];
    const completedInvoices = invoices.filter(
      (i: any) => !VOIDED.includes(String(i.status).toUpperCase()),
    );

    const txSales = tx.filter((t: any) => t.transactionType === 'SALE');
    const purchases = tx.filter((t: any) => t.transactionType === 'PURCHASE');
    const sum = (rows: any[]) => rows.reduce((s, r) => s + Number(r.totalPrice || 0), 0);
    const sumInv = (rows: any[]) => rows.reduce((s, r) => s + Number(r.totalAmount || 0), 0);

    // Bars measure stock on hand, not how many distinct products exist — the
    // number in the pill and the colour of the bar then describe the same thing.
    const RANK: Record<StockLevel, number> = { healthy: 0, low: 1, critical: 2, out: 3 };
    type CatRow = { units: number; items: number; worst: StockLevel; flagged: number };
    const byCat = new Map<string, CatRow>();
    products.forEach(p => {
      const k = p.categoryName || 'Uncategorised';
      const row = byCat.get(k) || { units: 0, items: 0, worst: 'healthy' as StockLevel, flagged: 0 };
      const level = lvl(p);
      row.units += qty(p);
      row.items += 1;
      // A category is only as healthy as its worst shelf.
      if (RANK[level] > RANK[row.worst]) row.worst = level;
      if (level !== 'healthy') row.flagged += 1;
      byCat.set(k, row);
    });
    const catRows = [...byCat.entries()].sort((a, b) => b[1].units - a[1].units).slice(0, 6);
    const catMax = Math.max(1, ...catRows.map(([, r]) => r.units));

    const amt = (i: any) => Number(i.totalAmount || 0);
    const paid = invoices.filter((i: any) => String(i.status).toUpperCase() === 'PAID');
    const due = invoices.filter((i: any) => String(i.status).toUpperCase() !== 'PAID');

    const payMap = new Map<string, number>();
    invoices.forEach((i: any) => {
      const k = (i.paymentMethod || 'OTHER').toUpperCase();
      payMap.set(k, (payMap.get(k) || 0) + amt(i));
    });
    const payTotal = [...payMap.values()].reduce((s, v) => s + v, 0);
    const PAY_COLORS = ['#FA0051', '#E65B0D', '#00A5E2'];
    const payRows = [...payMap.entries()].sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({
        label, value,
        pct: payTotal ? Math.round((value / payTotal) * 100) : 0,
        color: PAY_COLORS[i % PAY_COLORS.length],
      }));

    const now = Date.now();
    const expired = batches.filter((b: any) => b.expiryDate && new Date(b.expiryDate).getTime() < now);
    const nearExpiry = batches.filter((b: any) => {
      if (!b.expiryDate) return false;
      const d = new Date(b.expiryDate).getTime() - now;
      return d >= 0 && d <= 30 * 86400000;
    });

    return {
      products, categories, tx, invoices, batches,
      // Business-date windows derived from the record's own timestamp.
      todaySales: (() => {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const inWindow = (d?: string) => d && new Date(d).getTime() >= start.getTime();
        return sumInv(completedInvoices.filter((i: any) => inWindow(i.invoiceDate || i.createdAt)))
             + sum(txSales.filter((t: any) => inWindow(t.createdAt)));
      })(),
      weekSales: (() => {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - 6);
        const inWindow = (d?: string) => d && new Date(d).getTime() >= start.getTime();
        return sumInv(completedInvoices.filter((i: any) => inWindow(i.invoiceDate || i.createdAt)))
             + sum(txSales.filter((t: any) => inWindow(t.createdAt)));
      })(),
      salesCount: completedInvoices.length + txSales.length,
      purchaseCount: purchases.length,
      salesTotal: sumInv(completedInvoices) + sum(txSales),
      purchaseTotal: sum(purchases),
      completedInvoices,
      outOfStock, critical, lowStock, available,
      alerts: [...outOfStock, ...critical, ...lowStock].slice(0, 6),
      catRows, catMax,
      invoiceTotal: invoices.reduce((s, i) => s + amt(i), 0),
      paid, paidTotal: paid.reduce((s, i) => s + amt(i), 0),
      due, dueTotal: due.reduce((s, i) => s + amt(i), 0),
      payRows, expired, nearExpiry,
      recent: [...completedInvoices].sort((a: any, b: any) =>
        new Date(b.invoiceDate || b.createdAt).getTime() - new Date(a.invoiceDate || a.createdAt).getTime()).slice(0, 3),
    };
  }, [data]);


  if (loading) {
    return (
      <div className="pb-6 space-y-4">
        <div className="skeleton h-10 w-80 rounded-xl" />
        <div className="skeleton h-[104px] rounded-2xl" />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-8"><ChartSkeleton height={420} /></div>
          <div className="xl:col-span-4 space-y-4"><ChartSkeleton height={200} /><ChartSkeleton height={200} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>
      </div>
    );
  }

  if (loadError && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-route-in">
        <span className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
          <RefreshCw className="w-6 h-6 text-red-500" />
        </span>
        <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white">Unable to load latest dashboard data</h2>
        <p className={`text-[16px] ${MUTED} mt-1 max-w-sm`}>
          The server did not respond. Nothing below is being shown rather than showing figures that may be out of date.
        </p>
        <button
          onClick={() => loadDashboard()}
          className="mt-6 h-10 px-5 rounded-lg text-white text-[17px] font-semibold hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(103.28deg,#0EA5A4 0%,#175780 100%)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="pb-2 animate-route-in">

      {loadError && data && (
        <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 text-[16px] text-amber-800 dark:text-amber-300">
          Could not refresh — showing the last successful load.
          <button onClick={() => loadDashboard()} className="ml-auto font-semibold underline">Retry</button>
        </div>
      )}

      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div>
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em] text-gray-900 dark:text-white">
            Welcome, {userName} 
          </h1>
          <p className={`text-[16px] ${MUTED} mt-1`}>
            This report was generated on {generatedAt || '—'} -{' '}
            <button onClick={() => loadDashboard()} className="text-[#0F9291] font-medium hover:underline">
              Refresh Report
            </button>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/pos"
            className="h-10 px-4 rounded-lg text-white text-[17px] font-semibold flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(103.28deg,#F0603A 0%,#E1442B 100%)' }}
          >
            <ShoppingCart className="w-4 h-4" /> POS
          </Link>

          <div className="h-10 min-w-[210px] px-3 rounded-lg bg-white dark:bg-[#121218] border border-gray-200 dark:border-[#222230] flex items-center justify-between gap-2 text-[16px] text-gray-500">
            <span>{generatedAt ? generatedAt.split(',')[0] : '—'}</span>
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>

          <RoundBtn title="Toggle fullscreen" onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen();
            else document.documentElement.requestFullscreen().catch(() => {});
          }}>
            <Maximize className="w-4 h-4" />
          </RoundBtn>

          <button
            onClick={() => setShowExport(true)}
            className="h-10 px-4 rounded-lg bg-white dark:bg-[#121218] border border-gray-200 dark:border-[#222230] text-[17px] font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#1a1a24] transition-colors"
          >
            <ArrowUpToLine className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* ===================== ROW 1 — one strip, five divided columns ===================== */}
      <div className={`${CARD} mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-900/[0.05] dark:divide-white/[0.05]`}>
        {[
          { v: formatCurrency(m.salesTotal), l: 'Sales', d: String(m.salesCount), up: true },
          { v: formatCurrency(m.purchaseTotal), l: 'Purchases', d: String(m.purchaseCount), up: true },
          { v: m.products.length.toLocaleString(), l: 'Medicines', d: String(m.categories.length), up: true },
          { v: m.invoices.length.toLocaleString(), l: 'Invoices', d: String(m.paid.length), up: true },
          { v: (m.lowStock.length + m.critical.length + m.outOfStock.length).toLocaleString(), l: 'Low Stock Alerts', d: String(m.outOfStock.length), up: false },
        ].map(s => (
          <div key={s.l} className="px-6 py-5">
            <p className={`text-[15px] font-medium uppercase tracking-[0.06em] ${MUTED}`}>{s.l}</p>
            <p className="text-[24px] font-bold tracking-[-0.02em] text-gray-900 dark:text-white tabular-nums leading-none mt-2">{s.v}</p>
            <div className="flex items-center gap-1.5 mt-2.5">
              <Delta value={s.d} up={s.up} />
              <span className={`text-[15px] ${MUTED}`}>Since Last Month</span>
            </div>
          </div>
        ))}
      </div>

      {/* ===================== ROW 2 — 8 / 4 ===================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-4">

        <div className="xl:col-span-8 flex">
          <SalesPurchasePanel
            invoices={m.completedInvoices}
            transactions={m.tx}
            products={m.products}
            loading={loading}
            onRefresh={() => loadDashboard()}
            CARD={CARD}
            MUTED={MUTED}
          />
        </div>

        {/* Medicine Statistics — black panel with gradient bars, per the reference */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="rounded-2xl p-5" style={{ background: '#0A0A0A' }}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <h5 className="text-[18px] font-bold tracking-[-0.01em] text-white leading-tight">Medicine Statistics</h5>
              <button
                onClick={() => loadDashboard()}
                aria-label="Refresh"
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors duration-150 hover:bg-white/[0.12]"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              >
                <RefreshCw className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Fixed-width bars, each fading from its own hue into the panel */}
            <div className="flex flex-col gap-2">
              {[
                { l: 'Low Stock', v: m.lowStock.length + m.critical.length, c: '#0F8F86' },
                { l: 'Available', v: m.available.length, c: '#9A7A0B' },
                { l: 'Out of Stock', v: m.outOfStock.length, c: '#8C1F13' },
              ].map(s => (
                <div
                  key={s.l}
                  className="rounded-lg px-3.5 py-2.5 w-[160px] max-w-full"
                  style={{ background: `linear-gradient(90deg, ${s.c} 0%, #0A0A0A 100%)` }}
                >
                  <p className="text-[15px] text-white/85 leading-tight">{s.l}</p>
                  <p className="text-[19px] font-bold text-white tabular-nums leading-tight mt-0.5">
                    {s.v.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className={CARD}>
            <CardHead
              title="Medicine Statistics"
              actions={<RoundBtn title="Refresh" onClick={() => loadDashboard()}><RefreshCw className="w-4 h-4" /></RoundBtn>}
            />
            {/* Compact rows: colour appears only as a small dot and a thin bar, so
                the four tiers stay readable without four large blocks of colour. */}
            <div className="px-5 pb-5 space-y-3">
              {[
                { l: 'In Stock', v: m.available.length, c: '#0E9F6E' },
                { l: 'Low Stock', v: m.lowStock.length, c: '#D97F06' },
                { l: 'Critical', v: m.critical.length, c: '#E65B0D' },
                { l: 'Out of Stock', v: m.outOfStock.length, c: '#D42314' },
              ].map(s => {
                const total = Math.max(m.products.length, 1);
                const pct = Math.round((s.v / total) * 100);
                return (
                  <div key={s.l} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.c }} />
                    <span className={`w-[86px] shrink-0 text-[16px] ${MUTED}`}>{s.l}</span>
                    <span className="flex-1 h-1.5 rounded-full bg-slate-900/[0.05] dark:bg-white/[0.06] overflow-hidden">
                      <span className="block h-full rounded-full transition-[width] duration-500"
                        style={{ width: `${pct}%`, background: s.c, opacity: 0.75 }} />
                    </span>
                    <span className="w-8 shrink-0 text-right text-[17px] font-semibold text-gray-900 dark:text-white tabular-nums">
                      {s.v.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={CARD}>
            <CardHead title="Weekly Sales" actions={<RoundBtn title="Refresh" onClick={() => loadDashboard()}><RefreshCw className="w-4 h-4" /></RoundBtn>} />
            <div className="px-5 pb-5 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className={`text-[16px] ${MUTED}`}>Total Sales</p>
                <p className="text-[22px] font-bold tracking-[-0.02em] text-gray-900 dark:text-white tabular-nums mt-1">{formatCurrency(m.salesTotal)}</p>
              </div>
              <span className={`text-[16px] ${MUTED}`}>Since Yesterday</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== ROW 3 — 5 / 4 / 3 ===================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-4">

        <div className="xl:col-span-5 flex">
          <div className={`${CARD} w-full flex flex-col`}>
            <CardHead
              title="Inventory by Category"
              actions={<>
                <RoundBtn title="Add category"><Plus className="w-4 h-4" /></RoundBtn>
                <RoundBtn title="Refresh" onClick={() => loadDashboard()}><RefreshCw className="w-4 h-4" /></RoundBtn>
              </>}
            />
            <div className="px-5 pb-4 flex-1 space-y-[18px]">
              {m.catRows.length ? m.catRows.map(([name, row]) => (
                <div
                  key={name}
                  className="flex items-center gap-3"
                  title={`${name} — ${row.units.toLocaleString()} in stock across ${row.items} ${row.items === 1 ? 'product' : 'products'}. ${LEVEL_NOTE[row.worst]}${row.flagged ? ` (${row.flagged})` : ''}.`}
                >
                  <span className="w-[104px] shrink-0 text-[17px] text-gray-600 dark:text-gray-300 truncate">{name}</span>
                  <div className="flex-1 h-[36px] rounded-full bg-[#F4F6FA] dark:bg-[#1a1a24] overflow-hidden">
                    {/* Zero-stock categories still need a visible stub to carry the pill */}
                    <div className="h-full rounded-full flex items-center transition-[width] duration-500"
                      style={{ width: `${Math.max(22, Math.round((row.units / m.catMax) * 100))}%`, background: LEVEL_GRADIENT[row.worst] }}>
                      <span className="ml-1 px-2.5 py-[5px] rounded-full bg-white text-[15px] font-semibold text-gray-800 tabular-nums shadow-sm">
                        {row.units.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="py-10 text-center text-[16px] text-gray-400">No products categorised yet.</p>
              )}
            </div>
            <div className="grid grid-cols-3 border-t border-slate-900/[0.06] dark:border-white/[0.06]">
              {[
                { v: m.products.length, l: 'Medicines' },
                { v: m.categories.length, l: 'Categories' },
                { v: m.lowStock.length + m.critical.length + m.outOfStock.length, l: 'Low Stock' },
              ].map(s => (
                <div key={s.l} className="px-4 py-4 text-center">
                  <p className="text-[26px] font-bold tracking-[-0.02em] text-gray-900 dark:text-white tabular-nums">
                    {s.v < 10 ? String(s.v).padStart(2, '0') : s.v.toLocaleString()}
                  </p>
                  <p className={`text-[16px] ${MUTED} mt-0.5`}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 flex">
          <div className={`${CARD} w-full flex flex-col`}>
            <CardHead title="Stock Alerts" actions={<RoundBtn title="Refresh" onClick={() => loadDashboard()}><RefreshCw className="w-4 h-4" /></RoundBtn>} />
            <div className="px-5 pb-5 flex-1">
              {m.alerts.length ? (
                <ul className="space-y-3">
                  {m.alerts.map((p: any, i: number) => {
                    const q = Number(p.stockQuantity ?? p.quantity ?? 0);
                    return (
                      <li key={p.id} className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-xl bg-[#0F9291]/10 flex items-center justify-center shrink-0">
                          <Pill className="w-5 h-5 text-[#0F9291]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[17px] font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                          <p className="text-[16px] text-gray-400">{p.sku}</p>
                        </div>
                        <span className={`text-[15px] font-medium px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1.5 border ${getStockStatus(q).pill}`}>
                          <span className="status-dot w-1.5 h-1.5">
                            <span className="ring bg-current" />
                            <span className="dot w-1.5 h-1.5 rounded-full bg-current" />
                          </span>
                          {q} in Stock
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="py-10 text-center text-[16px] text-gray-400">Every product is above the reorder level.</p>}
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 flex flex-col gap-4">
          <div className={CARD}>
            <CardHead title="Expired" actions={<RoundBtn title="View all"><ArrowUpRight className="w-4 h-4" /></RoundBtn>} />
            <div className="px-5 pb-5 space-y-3">
              {m.expired.length ? m.expired.slice(0, 2).map((b: any) => (
                <div key={b.id} className="rounded-xl px-3 py-3 flex items-center gap-3"
                  style={{ background: 'linear-gradient(103deg,#EF5B2B 0%,#E33F19 100%)' }}>
                  <span className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <Pill className="w-4 h-4 text-white" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] font-semibold text-white truncate">{b.productName || `Batch ${b.batchNo}`}</p>
                    <p className="text-[15px] text-white/80 truncate">{b.batchNo}</p>
                  </div>
                  <span className="text-[15px] text-white/90 shrink-0">
                    {new Date(b.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              )) : <p className="py-6 text-center text-[16px] text-gray-400">No expired batches.</p>}
            </div>
          </div>

          <div className={`${CARD} flex-1`}>
            <CardHead title="Near Expiry" actions={<RoundBtn title="Refresh" onClick={() => loadDashboard()}><RefreshCw className="w-4 h-4" /></RoundBtn>} />
            <div className="px-5 pb-5 space-y-3">
              {m.nearExpiry.length ? m.nearExpiry.slice(0, 2).map((b: any) => (
                <div key={b.id} className="rounded-xl px-3 py-3 flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20">
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] font-semibold text-gray-900 dark:text-white truncate">{b.productName || b.batchNo}</p>
                    <p className="text-[15px] text-gray-500">{b.batchNo}</p>
                  </div>
                  <span className="text-[15px] text-gray-500 shrink-0">
                    {new Date(b.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              )) : <p className="py-6 text-center text-[16px] text-gray-400">Nothing expiring in 30 days.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ===================== ROW 4 — 4 / 4 / 4 ===================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-4">

        <div className="xl:col-span-4 flex">
          <div className={`${CARD} w-full flex flex-col`}>
            <CardHead title="Prescription Status" actions={<RoundBtn title="Refresh" onClick={() => loadDashboard()}><RefreshCw className="w-4 h-4" /></RoundBtn>} />
            <div className="px-5 pb-5 flex-1 flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center py-8">
                <p className="text-[30px] font-bold tracking-[-0.02em] text-gray-900 dark:text-white tabular-nums">0</p>
                <p className={`text-[16px] ${MUTED}`}>Prescriptions</p>
              </div>
              <div className="space-y-2.5">
                {[
                  { l: 'Completed', dot: '#3848F5' },
                  { l: 'Pending', dot: '#FA9200' },
                  { l: 'Cancelled', dot: '#D42314' },
                ].map(r => (
                  <div key={r.l} className="flex items-center gap-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a24] px-4 py-3">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.dot }} />
                    <span className="text-[18px] font-bold text-gray-900 dark:text-white tabular-nums">0</span>
                    <span className="text-[17px] text-gray-600 dark:text-gray-300 flex-1">{r.l}</span>
                  </div>
                ))}
              </div>
              <p className="text-[15px] text-gray-400 mt-3">Prescriptions are not yet available in the API.</p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-4">
          {[
            { l: 'Total Invoices', n: m.invoices.length, v: m.invoiceTotal, tone: '#0F9291', bg: 'linear-gradient(103deg,#E6F4F3 0%,#FFFFFF 70%)' },
            { l: 'Paid Invoices', n: m.paid.length, v: m.paidTotal, tone: '#3848F5', bg: 'linear-gradient(103deg,#E7ECFD 0%,#FFFFFF 70%)' },
            { l: 'Invoice on Due', n: m.due.length, v: m.dueTotal, tone: '#E33F19', bg: 'linear-gradient(103deg,#FDEAE4 0%,#FFFFFF 70%)' },
          ].map(c => (
            <div key={c.l} className="rounded-2xl border border-slate-900/[0.05] p-5 flex-1" style={{ background: c.bg }}>
              <div className="flex items-start justify-between gap-3">
                <span className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: c.tone }}>
                  <FileText className="w-5 h-5 text-white" />
                </span>
                <span className="text-[15px] font-medium text-gray-600 bg-white/80 border border-gray-200 rounded-full px-2.5 py-1 shrink-0">
                  {c.n.toLocaleString()} {c.n === 1 ? 'Invoice' : 'Invoices'}
                </span>
              </div>
              <p className="text-[17px] text-gray-600 mt-5">{c.l}</p>
              <p className="text-[24px] font-bold text-gray-900 tabular-nums mt-0.5">{formatCurrency(c.v)}</p>
            </div>
          ))}
        </div>

        <div className="xl:col-span-4 flex">
          <div className={`${CARD} w-full flex flex-col`}>
            <CardHead title="Recent Transactions" actions={<RoundBtn title="Refresh" onClick={() => loadDashboard()}><RefreshCw className="w-4 h-4" /></RoundBtn>} />
            <div className="px-5 pb-5 flex-1">
              {m.payRows.length > 0 && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {m.payRows.slice(0, 3).map(p => (
                      <div key={p.label} className="rounded-xl border border-slate-900/[0.06] dark:border-white/[0.06] px-3 py-3 text-center">
                        <p className={`text-[16px] ${MUTED}`}>{p.label}</p>
                        <p className="text-[18px] font-bold text-gray-900 dark:text-white tabular-nums mt-0.5">{formatCurrency(p.value)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    {m.payRows.slice(0, 3).map(p => (
                      <div key={p.label}>
                        <p className={`text-[16px] ${MUTED} mb-1.5 tabular-nums`}>{p.pct}%</p>
                        <div className="h-2 rounded-full" style={{ background: p.color }} />
                      </div>
                    ))}
                  </div>
                  <div className={`flex items-center gap-4 flex-wrap text-[16px] ${MUTED} mb-4`}>
                    {m.payRows.slice(0, 3).map(p => (
                      <span key={p.label} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} /> {p.label}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {m.recent.length ? (
                <ul className="divide-y divide-slate-900/[0.05] dark:divide-white/[0.05] border-t border-slate-900/[0.06] dark:border-white/[0.06]">
                  {m.recent.map((inv: any) => (
                    <li key={inv.id} className="flex items-center gap-3 py-3">
                      <span className="w-10 h-10 rounded-full bg-[#0F9291]/10 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-[#0F9291]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[17px] font-semibold text-gray-900 dark:text-white truncate">{inv.customerName || 'Walk-in Customer'}</p>
                        <p className="text-[15px] text-gray-400">{inv.invoiceNumber}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[15px] text-gray-400">Total Sales</p>
                        <p className="text-[17px] font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(inv.totalAmount)}</p>
                      </div>
                      <span className="text-[15px] font-medium px-2.5 py-1 rounded-full bg-[#0F9291]/10 text-[#0F9291] shrink-0">
                        {inv.paymentMethod || '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : <p className="py-8 text-center text-[16px] text-gray-400">No transactions recorded yet.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ===================== FOOTER ===================== */}
      <div className={`flex items-center justify-between flex-wrap gap-2 pt-4 border-t border-slate-900/[0.06] dark:border-white/[0.06] text-[16px] ${MUTED}`}>
        <span>© {new Date().getFullYear()} <span className="text-[#0F9291] font-medium">Inventory MS</span>, All Rights Reserved</span>
        <span className="flex items-center gap-2">
          <Link href="/settings/business" className="hover:text-[#0F9291]">Docs</Link> /
          <Link href="/settings/business" className="hover:text-[#0F9291]">Support</Link> /
          <Link href="/settings/business" className="hover:text-[#0F9291]">License</Link>
        </span>
      </div>

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        invoices={m.completedInvoices}
        transactions={data?.transactions ?? []}
        products={m.products}
      />

      <StockAlertDialog
        open={showStockAlert}
        onClose={() => setShowStockAlert(false)}
        outOfStock={m.outOfStock}
        lowStock={m.lowStock}
        threshold={LOW_STOCK_THRESHOLD}
      />
    </div>
  );
}
