/**
 * Hand-off cache between the post-login boot screen and the dashboard.
 *
 * The boot screen prefetches the dashboard's critical data while it is on
 * screen. The dashboard then reads from here on mount instead of issuing the
 * same three requests again, so it paints with real data rather than
 * skeletons. Module-level state is enough: login navigates client-side, so
 * nothing is torn down in between.
 */

export type DashboardBootData = {
  products: any[];
  categories: any[];
  transactions: any[];
  invoices: any[];
  batches: any[];
};

type Entry = { data: DashboardBootData; at: number };

let entry: Entry | null = null;

/** Anything older than this is treated as stale and refetched normally. */
const TTL_MS = 15_000;

export function setDashboardBootData(data: DashboardBootData) {
  entry = { data, at: Date.now() };
}

/** Returns the prefetched payload once, then clears it. */
export function takeDashboardBootData(): DashboardBootData | null {
  if (!entry) return null;
  const fresh = Date.now() - entry.at < TTL_MS;
  const data = entry.data;
  entry = null;
  return fresh ? data : null;
}

export function clearDashboardBootData() {
  entry = null;
}

/**
 * Broadcast that inventory or sales changed, so an already-mounted dashboard
 * refetches instead of showing figures from before the sale. Uses a plain
 * DOM event rather than pulling in a state library for one signal.
 */
export const DATA_CHANGED_EVENT = 'ims:data-changed';

export function notifyDataChanged() {
  clearDashboardBootData();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  }
}
