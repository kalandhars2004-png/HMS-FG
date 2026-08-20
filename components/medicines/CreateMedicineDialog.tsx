'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ModalLayer from '@/components/ui/ModalLayer';
import EntitySelect, { type EntityOption } from '@/components/ui/EntitySelect';
import { formatCurrency } from '@/lib/currency';
import { getStockStatus } from '@/lib/stock-status';
import { notifyDataChanged } from '@/lib/boot-cache';
import {
  ProductsAPI, CategoriesAPI, BrandsAPI, UnitsAPI, VariantsAPI,
  WarehousesAPI, SuppliersAPI, RacksAPI, BatchesAPI,
} from '@/lib/api';
import {
  Pill, X, Loader2, Package, Layers, Truck, BadgeDollarSign,
  Warehouse, Boxes, Timer, ShieldCheck, Plus, Trash2,
} from '@/components/ui/LucideIcon';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface BatchRow {
  batchNo: string;
  manufacturingDate: string;
  expiryDate: string;
  quantity: string;
  purchasePrice: string;
  mrp: string;
}

const emptyBatch = (): BatchRow => ({ batchNo: '', manufacturingDate: '', expiryDate: '', quantity: '', purchasePrice: '', mrp: '' });

const FORM_INIT = {
  name: '', genericName: '', sku: '', barcode: '', description: '',
  categoryId: '', brandId: '', unitId: '', variantId: '',
  supplierId: '', warehouseId: '', rackId: '',
  purchasePrice: '', price: '', mrp: '', discountPercentage: '', taxPercentage: '',
  stockQuantity: '', lowStockQuantity: '',
  manufacturingDate: '', expiryDate: '',
  prescriptionRequired: false,
};

function Section({ icon, title, hint, children }: { icon: React.ReactNode; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="px-6 py-5 border-b border-gray-100 dark:border-[#273244] last:border-0">
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-[#0F9291]">{icon}</span>
        <h3 className="text-[14px] font-bold text-gray-900 dark:text-[#F8FAFC]">{title}</h3>
        {hint && <span className="text-[12px] text-gray-400">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label className="block text-[13px] font-semibold text-gray-700 dark:text-[#94A3B8] mb-1.5">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error && <p className="text-[12px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputCls =
  'w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#111827] ' +
  'text-sm text-gray-900 dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#0F9291] ' +
  'placeholder:text-gray-400';

const Grid = ({ cols = 3, children }: { cols?: number; children: React.ReactNode }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 ${cols === 3 ? 'lg:grid-cols-3' : ''} gap-x-5 gap-y-4`}>{children}</div>
);

export default function CreateMedicineDialog({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState({ ...FORM_INIT });
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [categories, setCategories] = useState<EntityOption[]>([]);
  const [brands, setBrands] = useState<EntityOption[]>([]);
  const [units, setUnits] = useState<EntityOption[]>([]);
  const [variants, setVariants] = useState<EntityOption[]>([]);
  const [warehouses, setWarehouses] = useState<EntityOption[]>([]);
  const [suppliers, setSuppliers] = useState<EntityOption[]>([]);
  const [racks, setRacks] = useState<EntityOption[]>([]);

  const set = (k: keyof typeof FORM_INIT, v: any) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  /* ---------------- lookups ---------------- */
  const loadCategories = useCallback(async () => {
    const r = await CategoriesAPI.getAll();
    const o = (r.data || []).map((x: any) => ({ id: x.id, label: x.name }));
    setCategories(o); return o;
  }, []);
  const loadBrands = useCallback(async () => {
    const r = await BrandsAPI.getAll();
    const o = (r.data || []).map((x: any) => ({ id: x.id, label: x.name }));
    setBrands(o); return o;
  }, []);
  const loadUnits = useCallback(async () => {
    const r = await UnitsAPI.getAll();
    const o = (r.data || []).map((x: any) => ({ id: x.id, label: x.name, sub: x.shortName }));
    setUnits(o); return o;
  }, []);
  const loadVariants = useCallback(async () => {
    const r = await VariantsAPI.getAll();
    const o = (r.data || []).map((x: any) => ({ id: x.id, label: x.name, sub: x.attributeName }));
    setVariants(o); return o;
  }, []);
  const loadWarehouses = useCallback(async () => {
    const r = await WarehousesAPI.getAll();
    const o = (r.data || []).map((x: any) => ({ id: x.id, label: x.warehouse || `Warehouse ${x.id}` }));
    setWarehouses(o); return o;
  }, []);
  const loadSuppliers = useCallback(async () => {
    const r = await SuppliersAPI.getAll();
    const o = (r.data || []).map((x: any) => ({ id: x.id, label: x.name, sub: x.phone }));
    setSuppliers(o); return o;
  }, []);
  const loadRacks = useCallback(async () => {
    const r = await RacksAPI.getAll();
    const o = (r.data || []).map((x: any) => ({ id: x.id, label: x.code, sub: x.category }));
    setRacks(o); return o;
  }, []);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      loadCategories(), loadBrands(), loadUnits(), loadVariants(),
      loadWarehouses(), loadSuppliers(), loadRacks(),
    ]).catch(() => {});
  }, [open, loadCategories, loadBrands, loadUnits, loadVariants, loadWarehouses, loadSuppliers, loadRacks]);

  useEffect(() => {
    if (!open) { setForm({ ...FORM_INIT }); setBatches([]); setErrors({}); setSubmitError(''); }
  }, [open]);

  /* ---------------- derived ---------------- */
  const purchase = Number(form.purchasePrice || 0);
  const sell = Number(form.price || 0);
  const profit = sell - purchase;
  const margin = purchase > 0 ? (profit / purchase) * 100 : null;

  const stockPreview = useMemo(
    () => getStockStatus(Number(form.stockQuantity || 0), Number(form.lowStockQuantity) || undefined),
    [form.stockQuantity, form.lowStockQuantity],
  );

  const daysLeft = form.expiryDate
    ? Math.ceil((new Date(form.expiryDate).getTime() - Date.now()) / 86400000)
    : null;

  const selectedRack = racks.find(r => String(r.id) === form.rackId);

  /* ---------------- validation ---------------- */
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Medicine name is required';
    if (!form.categoryId) e.categoryId = 'Category is required';
    if (!form.unitId) e.unitId = 'Medicine form is required';
    if (form.price === '' || Number.isNaN(sell)) e.price = 'Selling price is required';
    if (sell < 0) e.price = 'Selling price cannot be negative';
    if (purchase < 0) e.purchasePrice = 'Purchase price cannot be negative';
    if (form.stockQuantity !== '' && Number(form.stockQuantity) < 0) e.stockQuantity = 'Stock cannot be negative';
    if (form.manufacturingDate && form.expiryDate && new Date(form.expiryDate) <= new Date(form.manufacturingDate)) {
      e.expiryDate = 'Expiry must be after the manufacturing date';
    }
    batches.forEach((b, i) => {
      if (!b.batchNo.trim()) e[`batch${i}`] = 'Batch number is required';
      else if (b.manufacturingDate && b.expiryDate && new Date(b.expiryDate) <= new Date(b.manufacturingDate)) {
        e[`batch${i}`] = 'Batch expiry must be after its manufacturing date';
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------------- submit ---------------- */
  const submit = async () => {
    if (submitting) return;              // guards against double submission
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const fd = new FormData();
      const put = (k: string, v: any) => { if (v !== '' && v !== null && v !== undefined) fd.append(k, String(v)); };

      // Only fields ProductController actually binds.
      put('name', form.name);
      put('sku', form.sku || `MED${Date.now().toString().slice(-6)}`);
      put('price', form.price || '0');
      put('stockQuantity', form.stockQuantity || '0');
      put('categoryId', form.categoryId);
      put('description', form.description);
      put('genericName', form.genericName);
      put('barcode', form.barcode);
      put('mrp', form.mrp);
      put('purchasePrice', form.purchasePrice);
      put('taxPercentage', form.taxPercentage);
      put('discountPercentage', form.discountPercentage);
      put('lowStockQuantity', form.lowStockQuantity);
      put('prescriptionRequired', form.prescriptionRequired);
      put('brandId', form.brandId);
      put('unitId', form.unitId);
      put('variantId', form.variantId);
      put('warehouseId', form.warehouseId);
      if (form.manufacturingDate) put('manufacturingDate', `${form.manufacturingDate}T00:00:00`);
      if (form.expiryDate) put('expiryDate', `${form.expiryDate}T00:00:00`);

      await ProductsAPI.create(fd);

      // The product id is needed to attach batches, and create does not return it.
      let newId: string | null = null;
      try {
        const all = await ProductsAPI.getAll();
        const match = (all.data || []).find((p: any) => p.name === form.name);
        newId = match ? String(match.id) : null;
      } catch { /* batches are best-effort */ }

      if (newId && batches.length) {
        await Promise.all(batches.map(b => BatchesAPI.create({
          productId: Number(newId),
          batchNo: b.batchNo,
          quantity: Number(b.quantity || 0),
          purchasePrice: b.purchasePrice ? Number(b.purchasePrice) : undefined,
          mrp: b.mrp ? Number(b.mrp) : undefined,
          manufacturingDate: b.manufacturingDate ? `${b.manufacturingDate}T00:00:00` : undefined,
          expiryDate: b.expiryDate ? `${b.expiryDate}T00:00:00` : undefined,
          status: true,
        }).catch(() => null)));
      }

      notifyDataChanged();
      onCreated();
      onClose();
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      let msg = '';
      try { msg = JSON.parse(raw)?.message ?? ''; } catch { msg = raw; }
      setSubmitError(msg || 'Could not create the medicine. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalLayer open={open} onClose={() => !submitting && onClose()} labelledBy="create-med-title">
      <div className="w-[960px] max-w-full max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#273244] shadow-2xl overflow-hidden animate-boot-in">

        {/* Header */}
        <div className="shrink-0 flex items-start gap-4 px-6 py-5 border-b border-gray-100 dark:border-[#273244]">
          <span className="w-12 h-12 rounded-xl bg-[#0F9291]/10 flex items-center justify-center shrink-0">
            <Pill className="w-6 h-6 text-[#0F9291]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="create-med-title" className="text-[20px] font-bold text-gray-900 dark:text-[#F8FAFC] leading-tight">
              Create New Medicine
            </h2>
            <p className="text-[13px] text-gray-500 dark:text-[#94A3B8] mt-0.5">
              Add medicine, inventory, pricing and storage information
            </p>
          </div>
          <button onClick={() => !submitting && onClose()} aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-[#F8FAFC] hover:bg-gray-100 dark:hover:bg-[#1F2937] transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — the only scrolling region */}
        <div className="flex-1 overflow-y-auto ims-scroll min-h-0">

          <Section icon={<Package className="w-4 h-4" />} title="Basic Information">
            <Grid>
              <Field label="Medicine Name" required error={errors.name}>
                <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Paracetamol 500mg" />
              </Field>
              <Field label="Generic Name">
                <input className={inputCls} value={form.genericName} onChange={e => set('genericName', e.target.value)} placeholder="Paracetamol" />
              </Field>
              <Field label="SKU / Medicine Code">
                <div className="flex gap-2">
                  <input className={inputCls} value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="Auto-generated if blank" />
                  <button type="button" onClick={() => set('sku', `MED${Date.now().toString().slice(-6)}`)}
                    className="h-10 px-3 rounded-xl border border-gray-200 dark:border-[#273244] text-[13px] font-medium text-[#0F9291] hover:bg-[#0F9291]/5 shrink-0">
                    Generate
                  </button>
                </div>
              </Field>
              <Field label="Barcode">
                <input className={inputCls} value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="8901234567890" />
              </Field>
              <div className="sm:col-span-2 lg:col-span-2">
                <Field label="Description">
                  <input className={inputCls} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description" />
                </Field>
              </div>
            </Grid>
          </Section>

          <Section icon={<Layers className="w-4 h-4" />} title="Classification">
            <Grid>
              <EntitySelect
                label="Category" required value={form.categoryId} onChange={v => set('categoryId', v)}
                options={categories} error={errors.categoryId}
                createTitle="Create Category" createFields={[{ key: 'name', label: 'Category name', required: true }]}
                onCreateSubmit={v => CategoriesAPI.create({ name: v.name, status: true }) as any}
                onCreated={loadCategories}
              />
              <EntitySelect
                label="Medicine Form" required value={form.unitId} onChange={v => set('unitId', v)}
                options={units} error={errors.unitId} placeholder="Tablet, Syrup…"
                createTitle="Create Unit" createFields={[
                  { key: 'name', label: 'Unit name', required: true, placeholder: 'Tablet' },
                  { key: 'shortName', label: 'Short name', placeholder: 'TAB' },
                ]}
                onCreateSubmit={v => UnitsAPI.create({ name: v.name, shortName: v.shortName || v.name, status: true }) as any}
                onCreated={loadUnits}
              />
              <EntitySelect
                label="Strength" value={form.variantId} onChange={v => set('variantId', v)}
                options={variants} placeholder="500mg, 10ml…"
                createTitle="Create Strength" createFields={[
                  { key: 'name', label: 'Strength', required: true, placeholder: '500mg' },
                  { key: 'attributeName', label: 'Attribute', placeholder: 'Dosage' },
                ]}
                onCreateSubmit={v => VariantsAPI.create({ name: v.name, attributeName: v.attributeName || 'Strength' }) as any}
                onCreated={loadVariants}
              />
              <EntitySelect
                label="Brand / Manufacturer" value={form.brandId} onChange={v => set('brandId', v)}
                options={brands}
                createTitle="Create Manufacturer" createFields={[{ key: 'name', label: 'Manufacturer name', required: true }]}
                onCreateSubmit={v => BrandsAPI.create({ name: v.name, status: true }) as any}
                onCreated={loadBrands}
              />
            </Grid>
          </Section>

          <Section icon={<Truck className="w-4 h-4" />} title="Supplier" hint="stored for reference — see note in footer">
            <Grid>
              <EntitySelect
                label="Supplier" value={form.supplierId} onChange={v => set('supplierId', v)}
                options={suppliers}
                createTitle="Create Supplier" createFields={[
                  { key: 'name', label: 'Supplier name', required: true },
                  { key: 'email', label: 'Email', type: 'email' },
                  { key: 'phone', label: 'Phone', type: 'tel' },
                ]}
                onCreateSubmit={v => SuppliersAPI.create({ name: v.name, email: v.email, phone: v.phone, status: true }) as any}
                onCreated={loadSuppliers}
              />
            </Grid>
          </Section>

          <Section icon={<BadgeDollarSign className="w-4 h-4" />} title="Pricing">
            <Grid>
              <Field label="Purchase Price" error={errors.purchasePrice}>
                <input type="number" min="0" step="0.01" className={inputCls} value={form.purchasePrice} onChange={e => set('purchasePrice', e.target.value)} placeholder="0.00" />
              </Field>
              <Field label="Selling Price" required error={errors.price}>
                <input type="number" min="0" step="0.01" className={inputCls} value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" />
              </Field>
              <Field label="MRP">
                <input type="number" min="0" step="0.01" className={inputCls} value={form.mrp} onChange={e => set('mrp', e.target.value)} placeholder="0.00" />
              </Field>
              <Field label="Discount %">
                <input type="number" min="0" step="0.01" className={inputCls} value={form.discountPercentage} onChange={e => set('discountPercentage', e.target.value)} placeholder="0" />
              </Field>
              <Field label="Tax / GST %">
                <input type="number" min="0" step="0.01" className={inputCls} value={form.taxPercentage} onChange={e => set('taxPercentage', e.target.value)} placeholder="0" />
              </Field>
            </Grid>
            {(purchase > 0 || sell > 0) && (
              <div className="mt-4 flex items-center gap-6 flex-wrap rounded-xl bg-slate-900/[0.03] dark:bg-white/[0.04] px-4 py-3">
                <span className="text-[13px] text-gray-500">Profit
                  <strong className={`ml-2 ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(profit)}</strong>
                </span>
                <span className="text-[13px] text-gray-500">Margin
                  <strong className={`ml-2 ${(margin ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {margin === null ? '—' : `${margin.toFixed(2)}%`}
                  </strong>
                </span>
              </div>
            )}
          </Section>

          <Section icon={<Boxes className="w-4 h-4" />} title="Inventory & Stock">
            <Grid>
              <Field label="Opening Stock" error={errors.stockQuantity}>
                <input type="number" min="0" className={inputCls} value={form.stockQuantity} onChange={e => set('stockQuantity', e.target.value)} placeholder="0" />
              </Field>
              <Field label="Minimum / Reorder Level">
                <input type="number" min="0" className={inputCls} value={form.lowStockQuantity} onChange={e => set('lowStockQuantity', e.target.value)} placeholder="30" />
              </Field>
              <Field label="Stock Status">
                <div className="h-10 flex items-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${stockPreview.pill}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" /> {stockPreview.label}
                  </span>
                  <span className="text-[12px] text-gray-400 ml-2">calculated</span>
                </div>
              </Field>
            </Grid>
          </Section>

          <Section icon={<Warehouse className="w-4 h-4" />} title="Storage Location">
            <Grid>
              <EntitySelect
                label="Storage Location" value={form.warehouseId} onChange={v => set('warehouseId', v)}
                options={warehouses}
                createTitle="Create Storage Location" createFields={[{ key: 'warehouse', label: 'Location name', required: true }]}
                onCreateSubmit={v => WarehousesAPI.create({ warehouse: v.warehouse, status: true }) as any}
                onCreated={loadWarehouses}
              />
              <EntitySelect
                label="Rack" value={form.rackId} onChange={v => set('rackId', v)}
                options={racks}
                createTitle="Create Rack" createFields={[
                  { key: 'code', label: 'Rack code', required: true, placeholder: 'RCK017' },
                  { key: 'category', label: 'Category', required: true, placeholder: 'Antibiotics' },
                  { key: 'rowsCount', label: 'Rows', type: 'number' },
                  { key: 'columns', label: 'Columns', type: 'number' },
                  { key: 'bins', label: 'Bins', type: 'number' },
                ]}
                onCreateSubmit={v => RacksAPI.create({
                  code: v.code, category: v.category,
                  rowsCount: Number(v.rowsCount || 0), columns: Number(v.columns || 0), bins: Number(v.bins || 0),
                  status: 'ACTIVE',
                }) as any}
                onCreated={loadRacks}
              />
              {selectedRack && (
                <Field label="Rack capacity">
                  <div className="h-10 flex items-center text-[13px] text-gray-500">{selectedRack.sub || '—'}</div>
                </Field>
              )}
            </Grid>
          </Section>

          <Section icon={<Timer className="w-4 h-4" />} title="Expiry Information">
            <Grid>
              <Field label="Manufacturing Date">
                <input type="date" className={inputCls} value={form.manufacturingDate} onChange={e => set('manufacturingDate', e.target.value)} />
              </Field>
              <Field label="Expiry Date" error={errors.expiryDate}>
                <input type="date" className={inputCls} value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
              </Field>
              <Field label="Status">
                <div className="h-10 flex items-center text-[13px]">
                  {daysLeft === null ? <span className="text-gray-400">—</span>
                    : daysLeft < 0 ? <span className="text-red-600 font-semibold">Expired {Math.abs(daysLeft)} days ago</span>
                    : daysLeft <= 30 ? <span className="text-amber-600 font-semibold">Near expiry — {daysLeft} days</span>
                    : <span className="text-emerald-600 font-semibold">Safe — {daysLeft} days</span>}
                </div>
              </Field>
            </Grid>
          </Section>

          <Section icon={<Boxes className="w-4 h-4" />} title="Batch Information" hint="optional">
            {batches.map((b, i) => (
              <div key={i} className="rounded-xl border border-gray-100 dark:border-[#273244] p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] font-semibold text-gray-700 dark:text-[#94A3B8]">Batch {i + 1}</p>
                  <button type="button" onClick={() => setBatches(rows => rows.filter((_, x) => x !== i))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Grid>
                  {([
                    ['batchNo', 'Batch Number', 'text'], ['quantity', 'Quantity', 'number'],
                    ['manufacturingDate', 'Mfg Date', 'date'], ['expiryDate', 'Expiry Date', 'date'],
                    ['purchasePrice', 'Purchase Price', 'number'], ['mrp', 'MRP', 'number'],
                  ] as const).map(([k, lbl, t]) => (
                    <Field key={k} label={lbl}>
                      <input type={t} className={inputCls} value={(b as any)[k]}
                        onChange={e => setBatches(rows => rows.map((r, x) => x === i ? { ...r, [k]: e.target.value } : r))} />
                    </Field>
                  ))}
                </Grid>
                {errors[`batch${i}`] && <p className="text-[12px] text-red-500 mt-2">{errors[`batch${i}`]}</p>}
              </div>
            ))}
            <button type="button" onClick={() => setBatches(r => [...r, emptyBatch()])}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-[#0F9291]/25 text-[13px] font-semibold text-[#0F9291] hover:bg-[#0F9291]/5">
              <Plus className="w-4 h-4" /> Add Batch
            </button>
          </Section>

          <Section icon={<ShieldCheck className="w-4 h-4" />} title="Additional Information">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" checked={form.prescriptionRequired}
                onChange={e => set('prescriptionRequired', e.target.checked)}
                className="w-4 h-4 rounded accent-[#0F9291]" />
              <span className="text-[14px] text-gray-700 dark:text-[#94A3B8]">Prescription required</span>
            </label>
          </Section>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-100 dark:border-[#273244] bg-white dark:bg-[#161B22]">
          {submitError && <p className="text-[13px] text-red-500 mb-3">{submitError}</p>}
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={submit} disabled={submitting}
              className="h-11 px-5 rounded-xl text-white text-[14px] font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(103.28deg,#0EA5A4 0%,#175780 100%)' }}>
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Medicine'}
            </button>
            <button type="button" onClick={() => !submitting && onClose()}
              className="ml-auto h-11 px-5 rounded-xl text-[14px] font-medium text-gray-500 hover:text-gray-800 dark:hover:text-[#F8FAFC]">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </ModalLayer>
  );
}
