'use client';

import { useMemo, useState } from 'react';
import ModalLayer from '@/components/ui/ModalLayer';
import {
  X, FileText, FileSpreadsheet, Download, Printer,
  ShoppingCart, Package, Users, Calendar, Boxes,
} from '@/components/ui/LucideIcon';
import { resolveRange, type RangeKey } from '@/components/dashboard/SalesPurchasePanel';
import { toCSV, toXLSX, downloadBlob, printReport, type Column } from '@/lib/export';
import { getStockLevel } from '@/lib/stock-status';

type Any = Record<string, any>;
type Format = 'pdf' | 'excel' | 'csv';
type Dataset = 'sales' | 'purchases' | 'customers' | 'products' | 'inventory';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Completed (non-void) invoices — the sales record. */
  invoices: Any[];
  /** Transaction ledger; PURCHASE rows are the receiving record. */
  transactions: Any[];
  products: Any[];
}

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'lastWeek', label: 'Last Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'thisYear', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
];

const DATASETS: { key: Dataset; label: string; desc: string; icon: any }[] = [
  { key: 'sales',     label: 'Sales',            desc: 'Invoice by invoice',     icon: ShoppingCart },
  { key: 'purchases', label: 'Purchases',        desc: 'Stock received',         icon: Package },
  { key: 'customers', label: 'Customer Summary', desc: 'Spend per customer',     icon: Users },
  { key: 'products',  label: 'Product Sales',    desc: 'Units sold per item',    icon: Boxes },
  { key: 'inventory', label: 'Inventory',        desc: 'Stock on hand (current)', icon: FileText },
];

const dt = (v?: string) => (v ? new Date(v) : null);
const fmtDate = (v?: string) => {
  const d = dt(v);
  return d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
};
const fmtDateTime = (v?: string) => {
  const d = dt(v);
  return d ? d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '';
};
const num = (v: any) => Number(v || 0);
const money = (v: any) => Math.round(num(v) * 100) / 100;

export default function ExportModal({ isOpen, onClose, invoices, transactions, products }: Props) {
  const [format, setFormat] = useState<Format>('excel');
  const [dataset, setDataset] = useState<Dataset>('sales');
  const [range, setRange] = useState<RangeKey>('thisMonth');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);

  const { start, end } = useMemo(() => resolveRange(range, from, to), [range, from, to]);

  /** Inventory is a point-in-time snapshot — a date range does not apply to it. */
  const dated = dataset !== 'inventory';

  const inRange = (v?: string) => {
    const d = dt(v);
    if (!d) return false;
    const t = d.getTime();
    return t >= start.getTime() && t <= end.getTime();
  };

  const salesRows = useMemo(
    () => invoices.filter(i => inRange(i.invoiceDate || i.createdAt)),
    [invoices, start, end],
  );

  const purchaseRows = useMemo(
    () => transactions.filter(t => t.transactionType === 'PURCHASE' && inRange(t.createdAt)),
    [transactions, start, end],
  );

  /** Spend rolled up per customer. Unnamed POS sales collapse into Walk-in. */
  const customerRows = useMemo(() => {
    const map = new Map<string, { name: string; orders: number; qty: number; amount: number; last: string }>();
    salesRows.forEach(i => {
      const name = (i.customerName || '').trim() || 'Walk-in Customer';
      const row = map.get(name) || { name, orders: 0, qty: 0, amount: 0, last: '' };
      row.orders += 1;
      row.amount += num(i.totalAmount);
      row.qty += (i.items || []).reduce((s: number, it: Any) => s + num(it.quantity), 0);
      const when = i.invoiceDate || i.createdAt || '';
      if (!row.last || new Date(when) > new Date(row.last)) row.last = when;
      map.set(name, row);
    });
    return [...map.values()].sort((a, b) => b.amount - a.amount);
  }, [salesRows]);

  /** Invoice lines carry a productId but the stored productName is often blank,
   *  so names and SKUs are resolved against the product catalogue. */
  const productById = useMemo(() => {
    const m = new Map<string, Any>();
    products.forEach(p => m.set(String(p.id), p));
    return m;
  }, [products]);

  /** Units sold per product, from invoice line items. */
  const productRows = useMemo(() => {
    const map = new Map<string, { name: string; sku: string; qty: number; amount: number; orders: number }>();
    salesRows.forEach(i => {
      (i.items || []).forEach((it: Any) => {
        const key = String(it.productId ?? it.productName ?? 'unknown');
        const cat = productById.get(String(it.productId));
        const row = map.get(key) || {
          name: it.productName || cat?.name || `Product #${it.productId ?? '?'}`,
          sku: it.sku || cat?.sku || '',
          qty: 0, amount: 0, orders: 0,
        };
        row.qty += num(it.quantity);
        row.amount += num(it.totalPrice ?? num(it.unitPrice) * num(it.quantity));
        row.orders += 1;
        map.set(key, row);
      });
    });
    return [...map.values()].sort((a, b) => b.qty - a.qty);
  }, [salesRows, productById]);

  const inventoryRows = products;

  const COLUMNS: Record<Dataset, Column<any>[]> = {
    sales: [
      { header: 'Invoice No', value: r => r.invoiceNumber || '' },
      { header: 'Date', value: r => fmtDateTime(r.invoiceDate || r.createdAt) },
      { header: 'Customer', value: r => (r.customerName || '').trim() || 'Walk-in Customer' },
      { header: 'Phone', value: r => r.customerPhone || '' },
      { header: 'Items', value: r => (r.items || []).length },
      { header: 'Subtotal', value: r => money(r.subtotal) },
      { header: 'Tax', value: r => money(r.taxAmount) },
      { header: 'Discount', value: r => money(r.discountAmount) },
      { header: 'Total', value: r => money(r.totalAmount) },
      { header: 'Payment', value: r => r.paymentMethod || '' },
      { header: 'Status', value: r => r.status || '' },
    ],
    purchases: [
      { header: 'Ref', value: r => `TXN-${r.id}` },
      { header: 'Date', value: r => fmtDateTime(r.createdAt) },
      { header: 'Product', value: r => r.product?.name || '' },
      { header: 'SKU', value: r => r.product?.sku || '' },
      { header: 'Supplier', value: r => r.supplier?.name || '' },
      { header: 'Qty', value: r => num(r.totalProducts) },
      { header: 'Total Cost', value: r => money(r.totalPrice) },
      { header: 'Status', value: r => String(r.status ?? '') },
      { header: 'Recorded By', value: r => r.user?.name || '' },
      { header: 'Note', value: r => r.description || '' },
    ],
    customers: [
      { header: 'Customer', value: r => r.name },
      { header: 'Orders', value: r => r.orders },
      { header: 'Units Bought', value: r => r.qty },
      { header: 'Total Spend', value: r => money(r.amount) },
      { header: 'Avg Order Value', value: r => money(r.orders ? r.amount / r.orders : 0) },
      { header: 'Last Purchase', value: r => fmtDateTime(r.last) },
    ],
    products: [
      { header: 'Product', value: r => r.name },
      { header: 'SKU', value: r => r.sku },
      { header: 'Units Sold', value: r => r.qty },
      { header: 'Times Ordered', value: r => r.orders },
      { header: 'Revenue', value: r => money(r.amount) },
      { header: 'Avg Unit Price', value: r => money(r.qty ? r.amount / r.qty : 0) },
    ],
    inventory: [
      { header: 'Product', value: r => r.name || '' },
      { header: 'SKU', value: r => r.sku || '' },
      { header: 'Category', value: r => r.categoryName || 'Uncategorised' },
      { header: 'Stock On Hand', value: r => num(r.stockQuantity ?? r.quantity) },
      { header: 'Stock Status', value: r => {
        const lvl = getStockLevel(num(r.stockQuantity ?? r.quantity), r.lowStockQuantity ?? undefined);
        return { healthy: 'In Stock', low: 'Low Stock', critical: 'Critical', out: 'Out of Stock' }[lvl];
      } },
      { header: 'Unit Price', value: r => money(r.price) },
      { header: 'Stock Value', value: r => money(num(r.price) * num(r.stockQuantity ?? r.quantity)) },
      { header: 'Expiry', value: r => fmtDate(r.expiryDate) },
    ],
  };

  const ROWS: Record<Dataset, any[]> = {
    sales: salesRows,
    purchases: purchaseRows,
    customers: customerRows,
    products: productRows,
    inventory: inventoryRows,
  };

  const rows = ROWS[dataset];
  const columns = COLUMNS[dataset];
  const label = DATASETS.find(d => d.key === dataset)!.label;
  const rangeLabel = RANGES.find(r => r.key === range)!.label;

  const periodText = dated
    ? `${rangeLabel} · ${start.toLocaleDateString('en-GB')} – ${end.toLocaleDateString('en-GB')}`
    : 'Current snapshot';

  /** Money columns are worth totalling; counts and IDs are not. */
  const total = useMemo(() => {
    if (dataset === 'sales') return salesRows.reduce((s, r) => s + num(r.totalAmount), 0);
    if (dataset === 'purchases') return purchaseRows.reduce((s, r) => s + num(r.totalPrice), 0);
    if (dataset === 'customers') return customerRows.reduce((s, r) => s + r.amount, 0);
    if (dataset === 'products') return productRows.reduce((s, r) => s + r.amount, 0);
    return inventoryRows.reduce((s, r) => s + num(r.price) * num(r.stockQuantity ?? r.quantity), 0);
  }, [dataset, salesRows, purchaseRows, customerRows, productRows, inventoryRows]);

  const filename = () => {
    const stamp = dated
      ? `${start.toISOString().slice(0, 10)}_${end.toISOString().slice(0, 10)}`
      : new Date().toISOString().slice(0, 10);
    return `${label.toLowerCase().replace(/\s+/g, '-')}_${stamp}`;
  };

  const handleExport = () => {
    setBusy(true);
    // Yield a frame so the button paints its busy state before the main thread
    // is taken by serialisation on a large report.
    requestAnimationFrame(() => {
      try {
        if (format === 'csv') {
          downloadBlob(toCSV(columns, rows), `${filename()}.csv`);
        } else if (format === 'excel') {
          downloadBlob(toXLSX(label, columns, rows), `${filename()}.xlsx`);
        } else {
          printReport(`${label} Report`, `${periodText} · ${rows.length} records`, columns, rows);
        }
        onClose();
      } finally {
        setBusy(false);
      }
    });
  };

  const chip = (active: boolean) =>
    `px-3 py-2 rounded-lg text-[13px] font-medium border transition-colors ${
      active
        ? 'border-[#0F9291] bg-[#0F9291]/[0.07] text-[#0F9291]'
        : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-[#273244] dark:text-gray-300'
    }`;

  return (
    <ModalLayer open={isOpen} onClose={onClose}>
      <div className="w-[620px] max-w-full bg-white dark:bg-[#0F141C] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#273244] flex flex-col max-h-[calc(100vh-32px)] min-h-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#273244] shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">Export Report</h2>
            <p className="text-[12.5px] text-gray-400 mt-0.5">Pick the data, the period and the file type.</p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F2937] text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto ims-scroll min-h-0">
          {/* ---- Dataset ---- */}
          <div>
            <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-200 mb-2.5">Report</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {DATASETS.map(d => (
                <button key={d.key} onClick={() => setDataset(d.key)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-colors ${
                    dataset === d.key
                      ? 'border-[#0F9291] bg-[#0F9291]/[0.05]'
                      : 'border-gray-200 dark:border-[#273244] hover:border-gray-300'
                  }`}>
                  <d.icon className={`w-4 h-4 mt-0.5 shrink-0 ${dataset === d.key ? 'text-[#0F9291]' : 'text-gray-400'}`} />
                  <span className="min-w-0">
                    <span className={`block text-[13px] font-semibold truncate ${dataset === d.key ? 'text-[#0F9291]' : 'text-gray-700 dark:text-gray-200'}`}>
                      {d.label}
                    </span>
                    <span className="block text-[11px] text-gray-400 truncate">{d.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ---- Period ---- */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-200">Period</p>
            </div>
            {dated ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {RANGES.map(r => (
                    <button key={r.key} onClick={() => setRange(r.key)} className={chip(range === r.key)}>
                      {r.label}
                    </button>
                  ))}
                </div>
                {range === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <label className="block">
                      <span className="block text-[12px] text-gray-500 mb-1">From</span>
                      <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-[#273244] dark:bg-[#111827] text-[13px] outline-none focus:border-[#0F9291]" />
                    </label>
                    <label className="block">
                      <span className="block text-[12px] text-gray-500 mb-1">To</span>
                      <input type="date" value={to} onChange={e => setTo(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-[#273244] dark:bg-[#111827] text-[13px] outline-none focus:border-[#0F9291]" />
                    </label>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[12.5px] text-gray-400 rounded-lg bg-gray-50 dark:bg-[#161B22] px-3 py-2.5">
                Inventory is a live snapshot of stock on hand, so a date range does not apply.
              </p>
            )}
          </div>

          {/* ---- Format ---- */}
          <div>
            <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-200 mb-2.5">Format</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'excel' as const, icon: FileSpreadsheet, label: 'Excel', desc: '.xlsx' },
                { key: 'csv' as const, icon: Download, label: 'CSV', desc: '.csv' },
                { key: 'pdf' as const, icon: Printer, label: 'PDF', desc: 'via print' },
              ].map(opt => (
                <button key={opt.key} onClick={() => setFormat(opt.key)}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-colors ${
                    format === opt.key
                      ? 'border-[#0F9291] bg-[#0F9291]/[0.05]'
                      : 'border-gray-200 dark:border-[#273244] hover:border-gray-300'
                  }`}>
                  <opt.icon className={`w-5 h-5 ${format === opt.key ? 'text-[#0F9291]' : 'text-gray-400'}`} />
                  <span className={`text-[13px] font-semibold ${format === opt.key ? 'text-[#0F9291]' : 'text-gray-700 dark:text-gray-200'}`}>{opt.label}</span>
                  <span className="text-[10.5px] text-gray-400">{opt.desc}</span>
                </button>
              ))}
            </div>
            {format === 'pdf' && (
              <p className="text-[11.5px] text-gray-400 mt-2">
                Opens your print dialog — choose “Save as PDF” as the destination.
              </p>
            )}
          </div>

          {/* ---- What will be exported ---- */}
          <div className="rounded-xl border border-gray-100 dark:border-[#273244] bg-gray-50/70 dark:bg-[#161B22] px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-200">{label}</span>
              <span className="text-[12px] text-gray-400 truncate">{periodText}</span>
            </div>
            <div className="flex items-baseline gap-4 mt-1.5">
              <span className="text-[13px] text-gray-500 dark:text-gray-400">
                <b className="text-gray-900 dark:text-white tabular-nums">{rows.length}</b> record{rows.length === 1 ? '' : 's'}
              </span>
              <span className="text-[13px] text-gray-500 dark:text-gray-400">
                {dataset === 'inventory' ? 'Stock value' : 'Total'}{' '}
                <b className="text-gray-900 dark:text-white tabular-nums">
                  ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </b>
              </span>
            </div>
            {rows.length === 0 && (
              <p className="text-[12px] text-amber-600 dark:text-amber-400 mt-1.5">
                Nothing matches this selection — the file would be empty.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-[#273244] shrink-0">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#273244] text-[13px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors">
            Cancel
          </button>
          <button onClick={handleExport} disabled={busy || rows.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(103.28deg,#0EA5A4 0%,#175780 100%)' }}>
            {format === 'pdf' ? <Printer className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {busy ? 'Preparing…' : format === 'pdf' ? 'Open Print View' : `Download ${format === 'excel' ? '.xlsx' : '.csv'}`}
          </button>
        </div>
      </div>
    </ModalLayer>
  );
}
