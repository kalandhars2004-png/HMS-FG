'use client';

import { useCallback, useEffect, useState } from 'react';
import ModalLayer from '@/components/ui/ModalLayer';
import { formatCurrency } from '@/lib/currency';
import { getStockStatus, DEFAULT_LOW_STOCK } from '@/lib/stock-status';
import {
  ProductsAPI, BatchesAPI, TransactionsAPI, BrandsAPI,
  UnitsAPI, VariantsAPI, WarehousesAPI, SuppliersAPI,
} from '@/lib/api';
import {
  Pill, X, Package, Truck, Layers, Warehouse, Boxes,
  BadgeDollarSign, Timer, ListEnd, ShieldCheck, Edit,
} from '@/components/ui/LucideIcon';

const NA = 'Not available';
const LOW_DEFAULT = DEFAULT_LOW_STOCK;

type Any = Record<string, any>;

interface Props {
  open: boolean;
  productId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onHistory: (id: string) => void;
}

/* ---------- presentational atoms (match the app's existing tokens) ---------- */

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="px-6 py-5 border-b border-gray-100 dark:border-[#273244] last:border-0">
      <h3 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-[#94A3B8] mb-4">
        <span className="text-[#0F9291]">{icon}</span> {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, value, tone }: { label: string; value?: React.ReactNode; tone?: string }) {
  const empty = value === null || value === undefined || value === '' || value === NA;
  return (
    <div className="min-w-0">
      <p className="text-[12px] text-gray-400 dark:text-[#64748B]">{label}</p>
      <p className={`text-[14px] mt-0.5 truncate ${
        empty ? 'text-gray-300 dark:text-[#4B5563] italic' : tone || 'text-gray-900 dark:text-[#F8FAFC] font-medium'
      }`}>
        {empty ? NA : value}
      </p>
    </div>
  );
}

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">{children}</div>
);

function StatusBadge({ stock, threshold }: { stock: number; threshold: number }) {
  const st = getStockStatus(stock, threshold);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${st.pill}`}>
      {!st.needsAttention ? (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      ) : (
        <span className="status-dot w-1.5 h-1.5">
          <span className="ring bg-current" />
          <span className="dot w-1.5 h-1.5 rounded-full bg-current" />
        </span>
      )}
      {st.label}
    </span>
  );
}

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : NA;

/* ------------------------------- dialog ------------------------------- */

export default function MedicineDetailsDialog({ open, productId, onClose, onEdit, onHistory }: Props) {
  const [loading, setLoading] = useState(false);
  const [p, setP] = useState<Any | null>(null);
  const [batches, setBatches] = useState<Any[]>([]);
  const [activity, setActivity] = useState<Any[]>([]);
  const [lookups, setLookups] = useState<{ brand?: Any; unit?: Any; variant?: Any; warehouse?: Any; supplier?: Any }>({});

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [prod, bRes, tRes, brands, units, variants, warehouses, suppliers] = await Promise.all([
        ProductsAPI.getById(id),
        BatchesAPI.getAll().catch(() => ({ data: [] })),
        TransactionsAPI.getAll().catch(() => ({ data: [] })),
        BrandsAPI.getAll().catch(() => ({ data: [] })),
        UnitsAPI.getAll().catch(() => ({ data: [] })),
        VariantsAPI.getAll().catch(() => ({ data: [] })),
        WarehousesAPI.getAll().catch(() => ({ data: [] })),
        SuppliersAPI.getAll().catch(() => ({ data: [] })),
      ]);

      const prd: Any = prod || {};
      setP(prd);

      const byId = (rows: Any[], key: any) => rows.find((r: Any) => String(r.id) === String(key));
      setLookups({
        brand: byId(brands.data || [], prd.brandId),
        unit: byId(units.data || [], prd.unitId),
        variant: byId(variants.data || [], prd.variantId),
        warehouse: byId(warehouses.data || [], prd.warehouseId),
        supplier: byId(suppliers.data || [], prd.supplierId),
      });

      setBatches((bRes.data || []).filter((b: Any) => String(b.productId) === String(id)));
      setActivity(
        (tRes.data || [])
          .filter((t: Any) => String(t.product?.id ?? t.productId ?? '') === String(id))
          .slice(0, 8),
      );
    } catch (e) {
      console.error('Medicine details failed to load:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && productId) load(productId);
    if (!open) { setP(null); setBatches([]); setActivity([]); setLookups({}); }
  }, [open, productId, load]);

  const stock = Number(p?.stockQuantity ?? p?.quantity ?? 0);
  const threshold = Number(p?.lowStockQuantity ?? LOW_DEFAULT);
  const price = Number(p?.price ?? 0);
  const purchase = Number(p?.purchasePrice ?? 0);
  const margin = purchase > 0 ? ((price - purchase) / purchase) * 100 : null;

  const daysLeft = p?.expiryDate
    ? Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / 86400000)
    : null;
  const expiryTone =
    daysLeft === null ? '' : daysLeft < 0 ? 'text-red-600' : daysLeft <= 30 ? 'text-amber-600' : 'text-emerald-600';
  const expiryLabel =
    daysLeft === null ? NA : daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} days ago`
    : daysLeft <= 30 ? `Near expiry — ${daysLeft} days left` : `Safe — ${daysLeft} days left`;

  return (
    <ModalLayer open={open} onClose={onClose} labelledBy="med-details-title">
      <div className="w-[900px] max-w-full max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#273244] shadow-2xl overflow-hidden animate-boot-in">

        {/* Header — stays fixed */}
        <div className="shrink-0 flex items-start gap-4 px-6 py-5 border-b border-gray-100 dark:border-[#273244]">
          <span className="w-12 h-12 rounded-xl bg-[#0F9291]/10 flex items-center justify-center shrink-0">
            <Pill className="w-6 h-6 text-[#0F9291]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-gray-400">Medicine Details</p>
            <h2 id="med-details-title" className="text-[20px] font-bold text-gray-900 dark:text-[#F8FAFC] truncate leading-tight">
              {p?.name || (loading ? 'Loading…' : NA)}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {p?.genericName && <span className="text-[13px] text-gray-500 dark:text-[#94A3B8]">{p.genericName}</span>}
              {p?.sku && <span className="text-[13px] text-[#0F9291] font-medium">{p.sku}</span>}
              {p && <StatusBadge stock={stock} threshold={threshold} />}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-[#F8FAFC] hover:bg-gray-100 dark:hover:bg-[#1F2937] transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Only this region scrolls */}
        <div className="flex-1 overflow-y-auto ims-scroll min-h-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : !p ? (
            <p className="p-10 text-center text-sm text-gray-400">Could not load this medicine.</p>
          ) : (
            <>
              <Section icon={<Package className="w-4 h-4" />} title="Basic Information">
                <Grid>
                  <Field label="Medicine Name" value={p.name} />
                  <Field label="Generic Name" value={p.genericName} />
                  <Field label="SKU" value={p.sku} />
                  <Field label="Category" value={p.categoryName} />
                  <Field label="Sub Category" />
                  <Field label="Brand" value={lookups.brand?.name} />
                  <Field label="Manufacturer" value={lookups.brand?.name} />
                  <Field label="Medicine Form" value={lookups.unit?.name} />
                  <Field label="Strength" value={lookups.variant?.name} />
                  <Field label="Unit" value={lookups.unit?.shortName || lookups.unit?.name} />
                  <Field label="Barcode" value={p.barcode} />
                  <Field label="Prescription Required" value={p.prescriptionRequired === true ? 'Yes' : p.prescriptionRequired === false ? 'No' : undefined} />
                </Grid>
                <div className="mt-4"><Field label="Description" value={p.description} /></div>
              </Section>

              <Section icon={<Truck className="w-4 h-4" />} title="Supplier Information">
                <Grid>
                  <Field label="Supplier Name" value={lookups.supplier?.name} />
                  <Field label="Supplier Code" value={lookups.supplier?.id ? `SUP-${lookups.supplier.id}` : undefined} />
                  <Field label="Contact Person" value={lookups.supplier?.name} />
                  <Field label="Phone" value={lookups.supplier?.phone} />
                  <Field label="Email" value={lookups.supplier?.email} />
                  <Field label="Address" value={lookups.supplier?.address} />
                  <Field label="Last Purchase Date" value={fmtDate(activity.find(a => a.transactionType === 'PURCHASE')?.createdAt)} />
                  <Field label="Last Purchase Qty" value={activity.find(a => a.transactionType === 'PURCHASE')?.totalProducts} />
                  <Field label="Purchase Price" value={p.purchasePrice != null ? formatCurrency(p.purchasePrice) : undefined} />
                </Grid>
              </Section>

              <Section icon={<Layers className="w-4 h-4" />} title="Stock Information">
                <Grid>
                  <Field label="Current Stock" value={stock} tone={stock === 0 ? 'text-red-600 font-semibold' : 'text-gray-900 dark:text-[#F8FAFC] font-medium'} />
                  <Field label="Available Stock" value={stock} />
                  <Field label="Reserved Stock" />
                  <Field label="Minimum Stock Level" value={p.lowStockQuantity} />
                  <Field label="Reorder Level" value={p.lowStockQuantity ?? LOW_DEFAULT} />
                  <Field label="Maximum Stock Level" />
                  <Field label="Stock Value" value={formatCurrency(stock * price)} />
                </Grid>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[12px] text-gray-500 mb-1.5">
                    <span>Stock level</span>
                    <span className="tabular-nums">{stock} / {threshold * 2}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-[#1F2937] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${getStockStatus(stock, threshold).dot}`}
                      style={{ width: `${Math.min(100, (stock / Math.max(1, threshold * 2)) * 100)}%` }}
                    />
                  </div>
                </div>
              </Section>

              <Section icon={<Warehouse className="w-4 h-4" />} title="Storage Location">
                <Grid>
                  <Field label="Storage Location" value={lookups.warehouse?.warehouse} />
                  <Field label="Rack Name" />
                  <Field label="Rack Code" />
                  <Field label="Row" />
                  <Field label="Column" />
                  <Field label="Bin" />
                  <Field label="Temperature Condition" />
                </Grid>
                {!lookups.warehouse && (
                  <p className="text-[12px] text-gray-400 mt-3">
                    Racks are not linked to products in the current data model, so shelf position cannot be resolved.
                  </p>
                )}
              </Section>

              <Section icon={<Boxes className="w-4 h-4" />} title={`Batch Information${batches.length ? ` (${batches.length})` : ''}`}>
                {batches.length ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-[#273244]">
                    <table className="w-full text-[13px]">
                      <thead className="bg-gray-50 dark:bg-[#111827]">
                        <tr>
                          {['Batch No', 'Mfg Date', 'Expiry', 'Qty', 'Purchase', 'MRP', 'Status'].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-[#94A3B8] whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-[#1F2937]">
                        {batches.map((b: Any) => (
                          <tr key={b.id}>
                            <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-[#F8FAFC] whitespace-nowrap">{b.batchNo || NA}</td>
                            <td className="px-3 py-2.5 text-gray-600 dark:text-[#94A3B8] whitespace-nowrap">{fmtDate(b.manufacturingDate)}</td>
                            <td className="px-3 py-2.5 text-gray-600 dark:text-[#94A3B8] whitespace-nowrap">{fmtDate(b.expiryDate)}</td>
                            <td className="px-3 py-2.5 tabular-nums text-gray-900 dark:text-[#F8FAFC]">{b.quantity ?? NA}</td>
                            <td className="px-3 py-2.5 tabular-nums text-gray-600 dark:text-[#94A3B8]">{b.purchasePrice != null ? formatCurrency(b.purchasePrice) : NA}</td>
                            <td className="px-3 py-2.5 tabular-nums text-gray-600 dark:text-[#94A3B8]">{b.mrp != null ? formatCurrency(b.mrp) : NA}</td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                b.status ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                {b.status ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-[13px] text-gray-400">No batches recorded for this medicine.</p>}
              </Section>

              <Section icon={<BadgeDollarSign className="w-4 h-4" />} title="Pricing">
                <Grid>
                  <Field label="Purchase Price" value={p.purchasePrice != null ? formatCurrency(p.purchasePrice) : undefined} />
                  <Field label="Selling Price" value={formatCurrency(price)} />
                  <Field label="MRP" value={p.mrp != null ? formatCurrency(p.mrp) : undefined} />
                  <Field label="Discount" value={p.discountPercentage != null ? `${p.discountPercentage}%` : undefined} />
                  <Field label="Tax / GST" value={p.taxPercentage != null ? `${p.taxPercentage}%` : undefined} />
                  <Field
                    label="Profit Margin"
                    value={margin != null ? `${margin.toFixed(1)}%` : undefined}
                    tone={margin != null ? (margin >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold') : undefined}
                  />
                </Grid>
              </Section>

              <Section icon={<Timer className="w-4 h-4" />} title="Expiry Information">
                <Grid>
                  <Field label="Manufacturing Date" value={fmtDate(p.manufacturingDate)} />
                  <Field label="Expiry Date" value={fmtDate(p.expiryDate)} />
                  <Field label="Days Remaining" value={daysLeft != null ? `${daysLeft}` : undefined} tone={expiryTone ? `${expiryTone} font-semibold` : undefined} />
                  <Field label="Expiry Status" value={daysLeft != null ? expiryLabel : undefined} tone={expiryTone ? `${expiryTone} font-semibold` : undefined} />
                </Grid>
              </Section>

              <Section icon={<ListEnd className="w-4 h-4" />} title="Inventory Activity">
                {activity.length ? (
                  <ul className="space-y-2.5">
                    {activity.map((a: Any) => (
                      <li key={a.id} className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-[#0F9291] shrink-0" />
                        <span className="text-[13px] font-medium text-gray-900 dark:text-[#F8FAFC] w-32 shrink-0">{a.transactionType || NA}</span>
                        <span className="text-[13px] text-gray-500 dark:text-[#94A3B8] flex-1">{fmtDate(a.createdAt)}</span>
                        <span className="text-[13px] tabular-nums font-semibold text-gray-900 dark:text-[#F8FAFC]">{a.totalProducts ?? '—'}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-[13px] text-gray-400">No stock movements recorded for this medicine.</p>}
              </Section>

              <Section icon={<ShieldCheck className="w-4 h-4" />} title="Audit Information">
                <Grid>
                  <Field label="Medicine ID" value={p.id} />
                  <Field label="Created Date" value={fmtDate(p.createdAt)} />
                  <Field label="Created By" />
                  <Field label="Last Updated Date" value={fmtDate(p.updatedAt)} />
                  <Field label="Last Updated By" />
                  <Field label="Last Stock Updated" value={fmtDate(activity[0]?.createdAt)} />
                </Grid>
              </Section>
            </>
          )}
        </div>

        {/* Footer — stays fixed */}
        <div className="shrink-0 flex items-center gap-2.5 px-6 py-4 border-t border-gray-100 dark:border-[#273244] bg-white dark:bg-[#161B22]">
          <button
            onClick={() => p && onEdit(String(p.id))}
            disabled={!p}
            className="h-10 px-4 rounded-lg text-white text-[14px] font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: 'linear-gradient(103.28deg,#0EA5A4 0%,#175780 100%)' }}
          >
            <Edit className="w-4 h-4" /> Edit Medicine
          </button>
          <button
            onClick={() => p && onHistory(String(p.id))}
            disabled={!p}
            className="h-10 px-4 rounded-lg border border-gray-200 dark:border-[#273244] text-[14px] font-medium text-gray-700 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors disabled:opacity-50"
          >
            View Inventory History
          </button>
          <button
            onClick={onClose}
            className="ml-auto h-10 px-4 rounded-lg text-[14px] font-medium text-gray-500 hover:text-gray-800 dark:hover:text-[#F8FAFC] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </ModalLayer>
  );
}
