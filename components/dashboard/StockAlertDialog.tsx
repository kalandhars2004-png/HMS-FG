'use client';

import Link from 'next/link';
import { AlertTriangle, Ban, Pill, X } from '@/components/ui/LucideIcon';
import ModalLayer from '@/components/ui/ModalLayer';
import { getStockStatus } from '@/lib/stock-status';

export interface StockAlertProduct {
  id: string | number;
  name: string;
  sku?: string;
  stockQuantity?: number;
  quantity?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Products at zero — "finished". */
  outOfStock: StockAlertProduct[];
  /** Products at or below the reorder threshold. */
  lowStock: StockAlertProduct[];
  threshold: number;
}

const qtyOf = (p: StockAlertProduct) => Number(p.stockQuantity ?? p.quantity ?? 0);

/**
 * Shown once per sign-in when stock needs attention. Deliberately a dialog
 * rather than a toast: an empty shelf is a decision the user has to make, not
 * something that should slide past while they look elsewhere.
 */
export default function StockAlertDialog({ open, onClose, outOfStock, lowStock, threshold }: Props) {
  const total = outOfStock.length + lowStock.length;

  const Row = ({ p, tone }: { p: StockAlertProduct; tone: 'out' | 'low' }) => (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
        tone === 'out' ? 'bg-red-50 dark:bg-red-900/25' : 'bg-amber-50 dark:bg-amber-900/25'}`}>
        <Pill className={`w-4 h-4 ${tone === 'out' ? 'text-red-600' : 'text-amber-600'}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-gray-900 dark:text-white truncate">{p.name}</span>
        <span className="block text-[12px] text-gray-400">{p.sku || '—'}</span>
      </span>
      <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full shrink-0 border ${getStockStatus(qtyOf(p)).pill}`}>
        {qtyOf(p)} left
      </span>
    </li>
  );

  return (
    <ModalLayer
      open={open && total > 0}
      onClose={onClose}
      role="alertdialog"
      labelledBy="stock-alert-title"
      describedBy="stock-alert-desc"
    >
      <div
        className="w-[480px] max-w-full flex flex-col rounded-2xl bg-white dark:bg-[#121218]
                   border border-gray-100 dark:border-[#222230] shadow-2xl animate-boot-in overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-gray-100 dark:border-[#222230]">
          <span className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/25 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="stock-alert-title" className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight">
              {total} {total === 1 ? 'item needs' : 'items need'} restocking
            </h2>
            <p id="stock-alert-desc" className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
              {outOfStock.length > 0 && (
                <><strong className="text-red-600 dark:text-red-400">{outOfStock.length} finished</strong>
                  {lowStock.length > 0 ? ' · ' : ''}</>
              )}
              {lowStock.length > 0 && <>{lowStock.length} at or below {threshold}</>}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Dismiss"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700
                       dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1a1a24] transition-colors shrink-0
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9291]/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lists */}
        <div className="overflow-y-auto ims-scroll flex-1 py-1">
          {outOfStock.length > 0 && (
            <>
              <p className="flex items-center gap-1.5 px-5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                <Ban className="w-3.5 h-3.5" /> Out of stock
              </p>
              <ul>{outOfStock.slice(0, 8).map(p => <Row key={`o-${p.id}`} p={p} tone="out" />)}</ul>
            </>
          )}

          {lowStock.length > 0 && (
            <>
              <p className="flex items-center gap-1.5 px-5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" /> Running low
              </p>
              <ul>{lowStock.slice(0, 8).map(p => <Row key={`l-${p.id}`} p={p} tone="low" />)}</ul>
            </>
          )}

          {total > 16 && (
            <p className="px-5 py-3 text-[12px] text-gray-400">
              + {total - 16} more not shown
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-t border-gray-100 dark:border-[#222230]">
          <Link
            href="/stock/restock"
            onClick={onClose}
            className="h-10 px-4 rounded-lg text-white text-[14px] font-semibold flex items-center justify-center
                       hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(103.28deg,#0EA5A4 0%,#175780 100%)' }}
          >
            Review low stock
          </Link>
          <Link
            href="/purchases/create"
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-gray-200 dark:border-[#222230] text-[14px] font-medium
                       text-gray-700 dark:text-gray-300 flex items-center justify-center
                       hover:bg-gray-50 dark:hover:bg-[#1a1a24] transition-colors"
          >
            Receive stock
          </Link>
          <button
            onClick={onClose}
            className="ml-auto h-10 px-4 rounded-lg text-[14px] font-medium text-gray-500 hover:text-gray-800
                       dark:hover:text-gray-200 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </ModalLayer>
  );
}
