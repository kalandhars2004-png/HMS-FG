'use client';

import { useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import { ChevronDown, Calendar, Pill, RefreshCw } from '@/components/ui/LucideIcon';

type Any = Record<string, any>;

export type RangeKey =
  | 'today' | 'yesterday' | 'thisWeek' | 'lastWeek'
  | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

const RANGE_LABELS: Record<RangeKey, string> = {
  today: 'Today', yesterday: 'Yesterday', thisWeek: 'This Week', lastWeek: 'Last Week',
  thisMonth: 'This Month', lastMonth: 'Last Month', thisYear: 'This Year', custom: 'Custom Range',
};

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

/** Weeks start Monday, matching how a pharmacy books its trading week. */
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  return x;
}

export function resolveRange(key: RangeKey, from: string, to: string): { start: Date; end: Date } {
  const now = new Date();
  switch (key) {
    case 'today': return { start: startOfDay(now), end: endOfDay(now) };
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      return { start: startOfDay(y), end: endOfDay(y) };
    }
    case 'thisWeek': return { start: startOfWeek(now), end: endOfDay(now) };
    case 'lastWeek': {
      const s = startOfWeek(now); s.setDate(s.getDate() - 7);
      const e = new Date(s); e.setDate(e.getDate() + 6);
      return { start: s, end: endOfDay(e) };
    }
    case 'thisMonth': return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now) };
    case 'lastMonth': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: s, end: endOfDay(e) };
    }
    case 'thisYear': return { start: new Date(now.getFullYear(), 0, 1), end: endOfDay(now) };
    case 'custom':
      return {
        start: from ? startOfDay(new Date(from)) : new Date(0),
        end: to ? endOfDay(new Date(to)) : endOfDay(now),
      };
  }
}

interface ProductLine {
  key: string;
  name: string;
  sku?: string;
  qty: number;
  amount: number;
  unit: number;
}

interface Props {
  /** Completed (non-void) invoices — the POS sales record. */
  invoices: Any[];
  /** Transactions ledger; PURCHASE rows are the receiving record. */
  transactions: Any[];
  /** Product catalogue, used to resolve SKUs for invoice lines. */
  products: Any[];
  loading?: boolean;
  onRefresh?: () => void;
  CARD: string;
  MUTED: string;
}

const MAX_ROWS = 5;

export default function SalesPurchasePanel({
  invoices, transactions, products, loading, onRefresh, CARD, MUTED,
}: Props) {
  const [range, setRange] = useState<RangeKey>('thisWeek');
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showAllSold, setShowAllSold] = useState(false);
  const [showAllBought, setShowAllBought] = useState(false);

  const { start, end } = useMemo(() => resolveRange(range, from, to), [range, from, to]);
  const within = (iso?: string) => {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    return t >= start.getTime() && t <= end.getTime();
  };

  const skuFor = (productId: any) =>
    products.find(p => String(p.id) === String(productId))?.sku;

  /* ---------------- sales, grouped by product ---------------- */
  const sales = useMemo(() => {
    const rows = invoices.filter(i => within(i.invoiceDate || i.createdAt));
    const byProduct = new Map<string, ProductLine>();
    let amount = 0;

    rows.forEach(inv => {
      amount += Number(inv.totalAmount || 0);
      (inv.items || []).forEach((it: Any) => {
        const key = String(it.productId ?? it.productName ?? 'unknown');
        const prev = byProduct.get(key);
        const qty = Number(it.quantity || 0);
        const total = Number(it.totalPrice || 0);
        if (prev) { prev.qty += qty; prev.amount += total; }
        else byProduct.set(key, {
          key,
          name: it.productName || products.find(p => String(p.id) === key)?.name || 'Unknown product',
          sku: skuFor(it.productId),
          qty, amount: total, unit: Number(it.unitPrice || 0),
        });
      });
    });

    const lines = [...byProduct.values()].sort((a, b) => b.qty - a.qty);
    return {
      lines,
      amount,
      items: lines.reduce((s, l) => s + l.qty, 0),
      count: rows.length,
    };
  }, [invoices, products, start, end]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------- purchases, grouped by product ---------------- */
  const purchases = useMemo(() => {
    const rows = transactions.filter(
      t => t.transactionType === 'PURCHASE' && within(t.createdAt),
    );
    const byProduct = new Map<string, ProductLine>();
    let amount = 0;

    rows.forEach(t => {
      amount += Number(t.totalPrice || 0);
      const p = t.product || {};
      const key = String(p.id ?? p.productId ?? t.id);
      const qty = Number(t.totalProducts || 0);
      const total = Number(t.totalPrice || 0);
      const prev = byProduct.get(key);
      if (prev) { prev.qty += qty; prev.amount += total; }
      else byProduct.set(key, {
        key,
        name: p.name || 'Unknown product',
        sku: p.sku,
        qty, amount: total,
        unit: qty ? total / qty : 0,
      });
    });

    const lines = [...byProduct.values()].sort((a, b) => b.qty - a.qty);
    return {
      lines,
      amount,
      items: lines.reduce((s, l) => s + l.qty, 0),
      count: rows.length,
    };
  }, [transactions, start, end]); // eslint-disable-line react-hooks/exhaustive-deps

  const Column = ({
    title, data, tone, emptyText, showAll, setShowAll, totalLabel, itemsLabel, countLabel,
  }: {
    title: string; data: typeof sales; tone: string; emptyText: string;
    showAll: boolean; setShowAll: (v: boolean) => void;
    totalLabel: string; itemsLabel: string; countLabel: string;
  }) => {
    const visible = showAll ? data.lines : data.lines.slice(0, MAX_ROWS);
    return (
      <div className="rounded-xl border border-gray-100 dark:border-[#222230] flex flex-col min-w-0">
        <p className="px-4 pt-4 pb-3 text-[17px] font-bold text-gray-900 dark:text-white">{title}</p>

        <div className="flex-1 px-4">
          {loading ? (
            <div className="space-y-2 pb-4">{[1, 2, 3].map(i => <div key={i} className="skeleton h-11 rounded-lg" />)}</div>
          ) : visible.length ? (
            <ul className="space-y-2.5 pb-4">
              {visible.map(l => (
                <li key={l.key} className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${tone}1A` }}>
                    <Pill className="w-4 h-4" style={{ color: tone }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16.5px] font-semibold text-gray-900 dark:text-white truncate">{l.name}</span>
                    <span className={`block text-[14.5px] ${MUTED} truncate`}>{l.sku || '—'}</span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="block text-[16px] font-semibold text-gray-900 dark:text-white tabular-nums">Qty {l.qty}</span>
                    <span className={`block text-[14.5px] ${MUTED} tabular-nums`}>{formatCurrency(l.amount)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`py-10 text-center text-[16px] ${MUTED}`}>{emptyText}</p>
          )}
        </div>

        {data.lines.length > MAX_ROWS && !loading && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 pb-3 text-[15.5px] font-semibold text-[#0F9291] hover:underline text-left"
          >
            {showAll ? 'Show less' : `View all ${data.lines.length}`}
          </button>
        )}

        <div className="px-4 py-3 border-t border-gray-100 dark:border-[#222230] space-y-1">
          <div className="flex items-center justify-between">
            <span className={`text-[15.5px] ${MUTED}`}>{itemsLabel}</span>
            <span className="text-[16px] font-semibold text-gray-900 dark:text-white tabular-nums">{data.items}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[15.5px] ${MUTED}`}>{countLabel}</span>
            <span className="text-[16px] font-semibold text-gray-900 dark:text-white tabular-nums">{data.count}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[16px] font-semibold text-gray-900 dark:text-white">{totalLabel}</span>
            <span className="text-[18px] font-bold tabular-nums" style={{ color: tone }}>{formatCurrency(data.amount)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`${CARD} w-full flex flex-col`}>
      {/* Header + range filter */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <h5 className="text-[18px] font-bold tracking-[-0.01em] text-gray-900 dark:text-white">Sales &amp; Purchase</h5>
        <div className="flex items-center gap-1.5 shrink-0">
          {onRefresh && (
            <button onClick={onRefresh} title="Refresh" aria-label="Refresh"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-slate-900/[0.04] transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setOpen(v => !v)}
              className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#222230] text-[16px] font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#1a1a24] transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" /> {RANGE_LABELS[range]} <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {open && (
              <div className="absolute right-0 mt-1 w-44 rounded-lg border border-gray-200 dark:border-[#222230] bg-white dark:bg-[#121218] shadow-lg z-30 py-1 animate-slide-down">
                {(Object.keys(RANGE_LABELS) as RangeKey[]).map(k => (
                  <button key={k} onClick={() => { setRange(k); setOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[16px] hover:bg-gray-50 dark:hover:bg-[#1a1a24] ${
                      range === k ? 'text-[#0F9291] font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                    {RANGE_LABELS[k]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {range === 'custom' && (
        <div className="px-5 pb-4 flex items-center gap-2 flex-wrap">
          <label className={`text-[15.5px] ${MUTED}`}>From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-gray-200 dark:border-[#222230] bg-white dark:bg-[#121218] text-[16px] outline-none focus:border-[#0F9291]" />
          <label className={`text-[15.5px] ${MUTED}`}>To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-gray-200 dark:border-[#222230] bg-white dark:bg-[#121218] text-[16px] outline-none focus:border-[#0F9291]" />
        </div>
      )}

      {/* Period summary */}
      <div className="px-5 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {[
          { l: 'SALES', v: sales.amount, tone: '#0F9291' },
          { l: 'PURCHASE', v: purchases.amount, tone: '#FA9200' },
        ].map(s => (
          <div key={s.l} className="rounded-xl border border-gray-100 dark:border-[#222230] px-4 py-3.5">
            <p className={`text-[14.5px] font-semibold uppercase tracking-[0.06em] ${MUTED}`}>{s.l}</p>
            {loading
              ? <div className="skeleton h-7 w-28 rounded mt-1.5" />
              : <p className="text-[22px] font-bold tracking-[-0.02em] tabular-nums mt-1" style={{ color: s.tone }}>{formatCurrency(s.v)}</p>}
            <p className={`text-[14.5px] ${MUTED} mt-0.5`}>From selected period</p>
          </div>
        ))}
      </div>

      {/* Two independent columns */}
      <div className="px-5 pb-5 grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        <Column
          title="Products Sold" data={sales} tone="#0F9291"
          emptyText="No sales transactions found"
          showAll={showAllSold} setShowAll={setShowAllSold}
          totalLabel="Total Sales" itemsLabel="Total Items Sold" countLabel="Total Transactions"
        />
        <Column
          title="Products Purchased" data={purchases} tone="#FA9200"
          emptyText="No purchase transactions found"
          showAll={showAllBought} setShowAll={setShowAllBought}
          totalLabel="Total Purchase" itemsLabel="Total Items Purchased" countLabel="Total Transactions"
        />
      </div>
    </div>
  );
}
