/**
 * Single source of truth for stock health.
 *
 * Four tiers, most severe first:
 *   0            → Out of Stock  (red)
 *   1–4          → Critical      (orange)
 *   5 … threshold→ Low Stock     (yellow)
 *   > threshold  → In Stock      (green)
 *
 * `threshold` is the product's own reorder level when it has one, else
 * DEFAULT_LOW_STOCK. Every badge, pill, chart colour and filter reads from here,
 * so the boundaries can never drift between screens.
 */

export const DEFAULT_LOW_STOCK = 30;
/** Below this, stock is effectively gone even though it is not yet zero. */
export const CRITICAL_STOCK = 5;

export type StockLevel = 'out' | 'critical' | 'low' | 'healthy';

export interface StockStatusMeta {
  level: StockLevel;
  label: string;
  /** Raw colour for dots, charts and inline styles. */
  hex: string;
  /** Tailwind classes for a bordered pill. */
  pill: string;
  /** Tailwind background for a solid dot / progress fill. */
  dot: string;
  /** True for anything the user should act on. */
  needsAttention: boolean;
}

const META: Record<StockLevel, Omit<StockStatusMeta, 'level'>> = {
  out: {
    label: 'Out of Stock',
    hex: '#D42314',
    pill: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700/30',
    dot: 'bg-red-500',
    needsAttention: true,
  },
  critical: {
    label: 'Critical',
    hex: '#E65B0D',
    pill: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700/30',
    dot: 'bg-orange-500',
    needsAttention: true,
  },
  low: {
    label: 'Low Stock',
    hex: '#D97F06',
    pill: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700/30',
    dot: 'bg-yellow-400',
    needsAttention: true,
  },
  healthy: {
    label: 'In Stock',
    hex: '#0E9F6E',
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/30',
    dot: 'bg-emerald-500',
    needsAttention: false,
  },
};

export function getStockLevel(qty: number | null | undefined, threshold = DEFAULT_LOW_STOCK): StockLevel {
  const n = Number(qty ?? 0);
  if (n <= 0) return 'out';
  if (n < CRITICAL_STOCK) return 'critical';
  if (n <= threshold) return 'low';
  return 'healthy';
}

export function getStockStatus(qty: number | null | undefined, threshold = DEFAULT_LOW_STOCK): StockStatusMeta {
  const level = getStockLevel(qty, threshold);
  return { level, ...META[level] };
}

/** Labels in severity order — used to build filter lists. */
export const STOCK_STATUS_LABELS = [
  META.healthy.label,
  META.low.label,
  META.critical.label,
  META.out.label,
];
