'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, RotateCw, Maximize, House, X, ImageUp, Trash2, Loader2, CheckCircle2, AlertTriangle,
  Search, Building2, Package, Tag, Ruler, Warehouse, Pill, Save, Check, ChevronDown,
  Calculator, Barcode, Clock, Hash, Percent, DollarSign, IndianRupee, Box, ArrowLeft,
} from '@/components/ui/LucideIcon';
import { ProductsAPI, CategoriesAPI, BrandsAPI, UnitsAPI, VariantsAPI, SuppliersAPI, RacksAPI } from '@/lib/api';
import { notifyDataChanged } from '@/lib/boot-cache';
import { getStockStatus } from '@/lib/stock-status';
import RackSelect, { rackSpace, type RackRow } from '@/components/medicines/RackSelect';
import { formatCurrency } from '@/lib/currency';
import GlobalModal from '@/components/ui/GlobalModal';
import CategoryCombobox from '@/components/dashboard/CategoryCombobox';
import AddUnitDialog from '@/components/units/AddUnitDialog';

const inputBase = "w-full h-12 rounded-xl border bg-white dark:bg-[#111827] px-4 text-[15px] text-gray-900 dark:text-[#F8FAFC] outline-none transition-all duration-200 placeholder:text-gray-400/60 dark:placeholder:text-gray-500";
const inputClass = `${inputBase} border-gray-200 dark:border-[#273244] focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20`;
const inputErrorClass = `${inputBase} border-red-300 dark:border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20`;
const textareaBase = "w-full rounded-xl border bg-white dark:bg-[#111827] px-4 py-3 text-[15px] text-gray-900 dark:text-[#F8FAFC] outline-none transition-all duration-200 placeholder:text-gray-400/60 dark:placeholder:text-gray-500 resize-none";
const textareaClass = `${textareaBase} border-gray-200 dark:border-[#273244] focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20`;
const textareaErrorClass = `${textareaBase} border-red-300 dark:border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20`;
const labelClass = "block text-sm font-medium text-gray-700 dark:text-[#F8FAFC] mb-1.5";
const cardClass = "bg-white dark:bg-[#161B22] rounded-[20px] border border-[#E5E7EB] dark:border-[#273244] shadow-[0_2px_12px_rgba(15,23,42,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)] p-7";
const requiredStar = <span className="text-red-400 ml-0.5">*</span>;
const teal = "#0F9291";

const medicineForms = [
  "Tablet", "Capsule", "Syrup", "Injection", "Drops", "Cream", "Ointment", "Powder", "Gel", "Spray", "Device"
];

const storageConditions = [
  { label: "Room Temperature", icon: "🌡️", desc: "20-25°C" },
  { label: "Cold Storage", icon: "🧊", desc: "2-8°C" },
  { label: "Refrigerated", icon: "❄️", desc: "2-8°C" },
  { label: "Frozen", icon: "🥶", desc: "-20°C and below" },
];

function SearchableSelect({ label, value, onChange, options, placeholder, onAddNew, required, error }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { id: string; name: string }[]; placeholder?: string; onAddNew?: () => void; required?: boolean; error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', click);
    return () => document.removeEventListener('mousedown', click);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? options.filter(o => o.name?.toLowerCase().includes(q)) : options;
  }, [options, search]);

  const selected = options.find(o => String(o.id) === String(value));
  const isEmptyList = options.length === 0 && !search;

  return (
    <div ref={ref} className="relative">
      <label className={labelClass}>{label} {required && requiredStar}</label>
      <div onClick={() => setOpen(!open)}
        className={`${error ? inputErrorClass : inputClass} flex items-center gap-2 cursor-pointer select-none ${open ? (error ? '' : 'border-[#0F9291] ring-2 ring-[#0F9291]/20') : 'hover:border-gray-300 dark:hover:border-[#273244]'}`}>
        {open ? (
          <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent outline-none text-[15px] text-gray-900 dark:text-[#F8FAFC] placeholder:text-gray-400/60 dark:placeholder:text-gray-500"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className={`flex-1 text-[15px] ${selected ? 'text-gray-900 dark:text-[#F8FAFC]' : 'text-gray-400/60 dark:text-gray-500/60'}`}>
            {selected?.name || placeholder || 'Select...'}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>
      {error && !open && <p className="text-[12px] text-red-500 mt-1">{error}</p>}
      {open && (
        <div className="absolute z-50 left-0 top-full mt-1.5 w-full bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-[#273244] shadow-lg dark:shadow-2xl max-h-56 overflow-auto animate-fadeIn py-1.5">
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500 text-center space-y-1">
              {isEmptyList ? (
                <><Search className="w-5 h-5 mx-auto mb-1 opacity-40" /><p>No records found</p>{onAddNew && <button type="button" onClick={() => { onAddNew(); setOpen(false); }} className="text-[#0F9291] font-medium hover:underline mt-1">Add new record</button>}</>
              ) : (
                <p>No matches found</p>
              )}
            </div>
          )}
          {filtered.map(o => (
            <button key={o.id} type="button" onClick={() => { onChange(String(o.id)); setOpen(false); setSearch(''); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${
                String(o.id) === String(value) ? 'bg-[#0F9291]/5 text-[#0F9291] font-medium' : 'text-gray-700 dark:text-[#F8FAFC] hover:bg-gray-50 dark:hover:bg-[#1F2937]'}`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                String(o.id) === String(value) ? 'border-[#0F9291] bg-[#0F9291]' : 'border-gray-300 dark:border-[#273244]'}`}>
                {String(o.id) === String(value) && <Check className="w-3 h-3 text-white" />}
              </div>
              {o.name}
            </button>
          ))}
          {filtered.length > 0 && onAddNew && (
            <div className="border-t border-gray-100 dark:border-[#273244] pt-1.5 mt-1.5">
              <button type="button" onClick={() => { onAddNew(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-[#0F9291] hover:bg-[#0F9291]/5 dark:hover:bg-[#0F9291]/10 transition-colors"
              ><Plus className="w-3.5 h-3.5" /> Add New</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#0F9291]/20 ${checked ? 'bg-[#0F9291]' : 'bg-gray-200 dark:bg-[#273244]'}`}>
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#F8FAFC] shadow-sm ring-0 transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );
}

function Toast({ toast, onClose }: { toast: any; onClose: () => void }) {
  if (!toast.show) return null;
  return (
    <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-slideDown ${
      toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/30 text-emerald-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/30 text-red-800 dark:text-red-300'
    }`}>
      {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
      <span className="text-sm font-medium">{toast.message}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
    </div>
  );
}

function InlineModal({ isOpen, onClose, title, onSubmit, submitLabel, icon, children }: { isOpen: boolean; onClose: () => void; title: string; onSubmit?: () => void; submitLabel?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <GlobalModal
      onClose={onClose}
      title={title}
      size="sm"
      icon={icon}
      submitLabel={submitLabel ?? 'Save'}
      onSubmit={onSubmit}
    >
      {children}
    </GlobalModal>
  );
}

export default function AddMedicinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [racks, setRacks] = useState<RackRow[]>([]);
  const [rackError, setRackError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(!!editId);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [medicineForm, setMedicineForm] = useState('');
  /** Free-text entry for a dosage form not in the preset list. */
  const [customForm, setCustomForm] = useState('');
  const [storageCondition, setStorageCondition] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [medicineNotes, setMedicineNotes] = useState('');
  const [sideEffects, setSideEffects] = useState('');
  const [usageInstructions, setUsageInstructions] = useState('');
  const [minOrderQty, setMinOrderQty] = useState('');
  const [maxOrderQty, setMaxOrderQty] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brandId: '',
    unitId: '',
    variantId: '',
    supplierId: '',
    price: '',
    mrp: '',
    purchasePrice: '',
    taxPercentage: '',
    discountPercentage: '',
    stockQuantity: '',
    lowStockQuantity: '',
    rackId: '',
    expiryDate: '',
    manufacturingDate: '',
    prescriptionRequired: false,
    description: '',
  });

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [genericSuggestions, setGenericSuggestions] = useState<string[]>([]);
  const [showGenericSuggestions, setShowGenericSuggestions] = useState(false);
  const [modal, setModal] = useState<{ type: string; isOpen: boolean }>({ type: '', isOpen: false });
  const [modalForm, setModalForm] = useState({ name: '', description: '', bins: '' });
  const suggestionRef = useRef<HTMLDivElement>(null);
  const genericSuggestionRef = useRef<HTMLDivElement>(null);

  const margin = useMemo(() => {
    const mrp = parseFloat(formData.mrp) || 0;
    const sp = parseFloat(formData.price) || 0;
    const pp = parseFloat(formData.purchasePrice) || 0;
    const marginAmt = sp - pp;
    const marginPct = sp > 0 ? ((sp - pp) / sp) * 100 : 0;
    return { marginAmt, marginPct, sp, pp, mrp };
  }, [formData.mrp, formData.price, formData.purchasePrice]);

  const allGenericNames = useMemo(() => {
    const names = new Set<string>();
    allProducts.forEach(p => { if (p.genericName?.trim()) names.add(p.genericName.trim()); });
    return Array.from(names).sort();
  }, [allProducts]);

  const marginColor = margin.sp > 0 ? (margin.marginPct >= 15 ? 'emerald' : margin.marginPct >= 0 ? 'amber' : 'red') : 'gray';
  const marginStatus = margin.sp > 0 ? (margin.marginPct >= 15 ? 'Healthy' : margin.marginPct >= 0 ? 'Low' : 'Loss') : 'No Data';

  useEffect(() => {
    Promise.all([
      CategoriesAPI.getAll().then(r => setCategories(r.data || [])).catch(() => {}),
      RacksAPI.getAll().then(r => { setRacks(r.data || []); setRackError(false); }).catch(() => setRackError(true)),
      BrandsAPI.getAll().then(r => setBrands(r.data || [])).catch(() => {}),
      UnitsAPI.getAll().then(r => setUnits(r.data || [])).catch(() => {}),
      VariantsAPI.getAll().then(r => setVariants(r.data || [])).catch(() => {}),
      SuppliersAPI.getAll().then(r => setSuppliers(r.data || [])).catch(() => {}),
      ProductsAPI.getAll().then(r => setAllProducts(r.data || [])).catch(() => {}),
    ]);
    if (editId) {
      ProductsAPI.getById(editId).then((p: any) => {
        if (p) {
          setFormData({
            name: p.name || '',
            genericName: p.genericName || '',
            sku: p.sku || '',
            barcode: p.barcode || '',
            categoryId: String(p.categoryId || ''),
            // The product model has no rack link, so an existing medicine cannot
            // report where it is shelved — the picker starts empty on edit.
            rackId: '',
            brandId: String(p.brandId || ''),
            unitId: String(p.unitId || ''),
            variantId: String(p.variantId || ''),
            supplierId: String(p.supplierId || ''),
            price: String(p.price || ''),
            mrp: String(p.mrp || ''),
            purchasePrice: String(p.purchasePrice || ''),
            taxPercentage: String(p.taxPercentage || ''),
            discountPercentage: String(p.discountPercentage || ''),
            stockQuantity: String(p.quantity ?? p.stockQuantity ?? ''),
            lowStockQuantity: String(p.lowStockQuantity || ''),
            expiryDate: p.expiryDate ? p.expiryDate.substring(0, 10) : '',
            manufacturingDate: p.manufacturingDate ? p.manufacturingDate.substring(0, 10) : '',
            prescriptionRequired: p.prescriptionRequired || false,
            description: p.description || '',
          });
          if (p.imageUrl) setImagePreview(p.imageUrl);
        }
      }).catch(() => {}).finally(() => setIsLoadingEdit(false));
    } else {
      generateSku();
    }
  }, [editId]);

  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
      return () => clearTimeout(t);
    }
  }, [toast.show]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (genericSuggestionRef.current && !genericSuggestionRef.current.contains(e.target as Node)) {
        setShowGenericSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearError = (field: string) => {
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value }));
    clearError('name');
    if (value.trim().length >= 1) {
      const q = value.toLowerCase();
      const matches = allProducts.filter(p =>
        p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
      ).slice(0, 8);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (product: any) => {
    setShowSuggestions(false);
    router.push(`/medicines/create?id=${product.id}`);
  };

  const handleGenericSuggestionClick = (name: string) => {
    setFormData(prev => ({ ...prev, genericName: name }));
    setShowGenericSuggestions(false);
    setGenericSuggestions([]);
  };

  const generateSku = () => {
    const prefix = 'MED';
    const num = String(Date.now()).slice(-6);
    setFormData(prev => ({ ...prev, sku: `${prefix}${num}` }));
  };

  const generateBarcode = () => {
    const num = String(Math.floor(Math.random() * 10000000000000)).padStart(13, '0');
    setFormData(prev => ({ ...prev, barcode: num }));
  };

  const handleGenericNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, genericName: value }));
    clearError('genericName');
    if (value.trim().length >= 1) {
      const q = value.toLowerCase();
      const matches = allGenericNames.filter(n => n.toLowerCase().includes(q)).slice(0, 8);
      setGenericSuggestions(matches);
      setShowGenericSuggestions(matches.length > 0);
    } else {
      setGenericSuggestions([]);
      setShowGenericSuggestions(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  const resetForm = () => {
    setFormData({
      name: '', genericName: '', sku: '', barcode: '', categoryId: '',
      brandId: '', unitId: '', variantId: '', supplierId: '', price: '', mrp: '',
      purchasePrice: '', taxPercentage: '', discountPercentage: '', stockQuantity: '',
      lowStockQuantity: '',
    rackId: '', expiryDate: '', manufacturingDate: '', prescriptionRequired: false, description: '',
    });
    setImagePreview(null);
    setImageFile(null);
    setMedicineForm('');
    setStorageCondition('');
    setBatchNumber('');
    setMedicineNotes('');
    setSideEffects('');
    setUsageInstructions('');
    setMinOrderQty('');
    setMaxOrderQty('');
    setManufacturer('');
    setIsActive(true);
    setErrors({});
    generateSku();
  };

  const openModal = (type: string) => {
    setModalForm({ name: '', description: '', bins: '' });
    setModal({ type, isOpen: true });
  };

  const handleModalSubmit = async () => {
    if (!modalForm.name.trim()) return;
    try {
      let res: any;
      switch (modal.type) {
        case 'category': res = await CategoriesAPI.create({ name: modalForm.name, description: modalForm.description }); break;
        case 'brand': res = await BrandsAPI.create({ name: modalForm.name, description: modalForm.description }); break;
        case 'unit': res = await UnitsAPI.create({ name: modalForm.name, description: modalForm.description }); break;
        case 'variant': res = await VariantsAPI.create({ name: modalForm.name, description: modalForm.description }); break;
        case 'supplier': res = await SuppliersAPI.create({ name: modalForm.name }); break;
        case 'rack': res = await RacksAPI.create({
          code: modalForm.name,
          category: modalForm.description || 'General',
          bins: Number(modalForm.bins || 0),
          rowsCount: 0, columns: 0, assignedMedicines: 0, status: 'ACTIVE',
        }); break;
      }
      const refreshMap: Record<string, any> = {
        category: { api: CategoriesAPI, state: setCategories, key: 'categories' },
        brand: { api: BrandsAPI, state: setBrands, key: 'brands' },
        unit: { api: UnitsAPI, state: setUnits, key: 'units' },
        variant: { api: VariantsAPI, state: setVariants, key: 'variants' },
        supplier: { api: SuppliersAPI, state: setSuppliers, key: 'suppliers' },
        rack: { api: RacksAPI, state: setRacks, key: 'racks' },
      };
      const cfg = refreshMap[modal.type];
      let newData: any[] = [];
      if (cfg) { const r = await cfg.api.getAll(); newData = r.data || []; cfg.state(newData); }
      if (modal.type === 'category') { const created = newData.find((c: any) => c.name === modalForm.name.trim()); if (created) handleChange('categoryId', String(created.id)); }
      if (modal.type === 'brand') { const created = newData.find((b: any) => b.name === modalForm.name.trim()); if (created) handleChange('brandId', String(created.id)); }
      if (modal.type === 'unit') { const created = newData.find((u: any) => u.name === modalForm.name.trim()); if (created) handleChange('unitId', String(created.id)); }
      if (modal.type === 'supplier') { const created = newData.find((s: any) => s.name === modalForm.name.trim()); if (created) handleChange('supplierId', String(created.id)); }
      if (modal.type === 'rack') { const created = newData.find((r: any) => r.code === modalForm.name.trim()); if (created) handleChange('rackId', String(created.id)); }
      setToast({ show: true, message: `${modal.type.charAt(0).toUpperCase() + modal.type.slice(1)} added successfully`, type: 'success' });
      setModal({ type: '', isOpen: false });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save';
      setToast({ show: true, message: msg, type: 'error' });
    }
  };

  const handleUnitDialogSaved = async (createdName?: string) => {
    try {
      const r = await UnitsAPI.getAll();
      const newData = r.data || [];
      setUnits(newData);
      if (createdName) {
        const created = newData.find((u: any) => u.name?.toLowerCase() === createdName.trim().toLowerCase());
        if (created) handleChange('unitId', String(created.id));
      }
      setToast({ show: true, message: 'Unit added successfully', type: 'success' });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save';
      setToast({ show: true, message: msg, type: 'error' });
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Medicine name is required';
    if (!formData.sku.trim()) errs.sku = 'SKU is required';
    if (!formData.price) errs.price = 'Selling price is required';
    if (!formData.stockQuantity) errs.stockQuantity = 'Stock quantity is required';
    if (!formData.categoryId) errs.categoryId = 'Category is required';
    if (formData.manufacturingDate && new Date(formData.manufacturingDate) > new Date()) errs.manufacturingDate = 'Manufacturing date cannot be in the future';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name', formData.name);
    fd.append('sku', formData.sku);
    fd.append('price', formData.price);
    fd.append('stockQuantity', formData.stockQuantity);
    fd.append('categoryId', formData.categoryId);
    if (formData.description) fd.append('description', formData.description);
    if (formData.genericName) fd.append('genericName', formData.genericName);
    if (formData.barcode) fd.append('barcode', formData.barcode);
    if (formData.mrp) fd.append('mrp', formData.mrp);
    if (formData.purchasePrice) fd.append('purchasePrice', formData.purchasePrice);
    if (formData.taxPercentage) fd.append('taxPercentage', formData.taxPercentage);
    if (formData.discountPercentage) fd.append('discountPercentage', formData.discountPercentage);
    if (formData.lowStockQuantity) fd.append('lowStockQuantity', formData.lowStockQuantity);
    if (formData.brandId) fd.append('brandId', formData.brandId);
    if (formData.unitId) fd.append('unitId', formData.unitId);
    if (formData.variantId) fd.append('variantId', formData.variantId);
    if (formData.supplierId) fd.append('supplierId', formData.supplierId);
    if (formData.expiryDate) fd.append('expiryDate', formData.expiryDate + 'T00:00:00');
    if (formData.manufacturingDate) fd.append('manufacturingDate', formData.manufacturingDate + 'T00:00:00');
    fd.append('prescriptionRequired', String(formData.prescriptionRequired));
    fd.append('isActive', String(isActive));
    if (storageCondition) fd.append('storageCondition', storageCondition);
    if (imageFile) fd.append('imageFile', imageFile);
    return fd;
  };

  const submitForm = async (fd: FormData) => {
    // A rack cannot hold more than its free bins — refuse rather than silently overfill.
    const rack = racks.find(r => String(r.id) === String(formData.rackId));
    if (rack) {
      const sp = rackSpace(rack);
      const qty = Number(formData.stockQuantity || 0);
      if (qty > sp.free) {
        setToast({ show: true, message: `${rack.code} has only ${sp.free} space left — cannot assign ${qty}`, type: 'error' });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editId) {
        await ProductsAPI.update(editId, fd);
        setToast({ show: true, message: 'Medicine updated successfully', type: 'success' });
      } else {
        await ProductsAPI.create(fd);
        setToast({ show: true, message: 'Medicine added successfully', type: 'success' });
      }
      // Record the space taken on the chosen rack. `assignedMedicines` is the
      // only occupancy field the Rack model has, so that is what we increment.
      if (rack && !editId) {
        const qty = Number(formData.stockQuantity || 0);
        await RacksAPI.update(String(rack.id), {
          ...rack,
          assignedMedicines: Number(rack.assignedMedicines || 0) + qty,
        }).catch(() => null);
      }

      // Stock changed — let the dashboard refetch instead of showing pre-save figures.
      notifyDataChanged();
      setTimeout(() => router.push('/medicines'), 1200);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to save medicine';
      setToast({ show: true, message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.name.trim()) handleChange('name', 'Draft');
    const fd = new FormData();
    fd.append('name', formData.name.trim() || 'Draft');
    fd.append('sku', formData.sku || `DRAFT-${Date.now()}`);
    fd.append('price', formData.price || '0');
    fd.append('stockQuantity', formData.stockQuantity || '0');
    fd.append('categoryId', formData.categoryId || '1');
    fd.append('isActive', String(isActive));
    if (imageFile) fd.append('imageFile', imageFile);
    setErrors({});
    await submitForm(fd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setToast({ show: true, message: 'Please fill all required fields', type: 'error' });
      return;
    }
    await submitForm(buildFormData());
  };

  const handleSubmitAndAnother = async () => {
    if (!validate()) {
      setToast({ show: true, message: 'Please fill all required fields', type: 'error' });
      return;
    }
    await submitForm(buildFormData());
    resetForm();
  };

  const inputCls = (field: string) => errors[field] ? inputErrorClass : inputClass;
  const textareaCls = (field: string) => errors[field] ? textareaErrorClass : textareaClass;

  if (isLoadingEdit) {
    return (
      <div className="animate-pulse space-y-6 max-w-[1700px] mx-auto">
        <div className="h-8 w-72 bg-gray-200 dark:bg-[#1F2937] rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#161B22] rounded-[20px] border border-[#E5E7EB] dark:border-[#273244] p-7 space-y-5">
              <div className="h-7 w-44 bg-gray-200 dark:bg-[#1F2937] rounded-lg" />
              {[...Array(5)].map((_, j) => <div key={j} className="space-y-2"><div className="h-4 w-24 bg-gray-200 dark:bg-[#1F2937] rounded" /><div className="h-12 bg-gray-100 dark:bg-[#1F2937] rounded-xl" /></div>)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 max-w-[1700px] mx-auto">
      <Toast toast={toast} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

      {/* ============= PAGE HEADER ============= */}
      <div className="mb-8">
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="flex items-center gap-2 m-0 p-0 list-none text-[13px]">
            <li><Link href="/dashboard" className="text-gray-400 dark:text-[#64748B] hover:text-gray-600 dark:hover:text-[#F8FAFC] no-underline transition-colors">Dashboard</Link><span className="text-gray-300 dark:text-[#4B5563] mx-2">/</span></li>
            <li><Link href="/medicines" className="text-gray-400 dark:text-[#64748B] hover:text-gray-600 dark:hover:text-[#F8FAFC] no-underline transition-colors">Medicine List</Link><span className="text-gray-300 dark:text-[#4B5563] mx-2">/</span></li>
            <li className="text-gray-900 dark:text-[#F8FAFC] font-semibold">{editId ? 'Edit Medicine' : 'Add Medicine'}</li>
          </ol>
        </nav>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-gray-900 dark:text-[#F8FAFC] font-['Space_Grotesk'] leading-tight">
              {editId ? 'Edit Medicine' : 'Add Medicine'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#94A3B8] mt-1">
              {editId ? 'Update medicine details, inventory and pricing information.' : 'Create a new medicine record with complete details and pricing.'}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={resetForm}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-amber-200 bg-amber-50/50 text-sm font-medium text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all active:scale-[0.98]">
              <RotateCw className="w-4 h-4" /> Reset
            </button>
            <Link href="/medicines"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-sm font-medium text-gray-500 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#1F2937] hover:border-gray-300 dark:hover:border-[#3a3a48] transition-all active:scale-[0.98] no-underline">
              <X className="w-4 h-4" /> Cancel
            </Link>
            <button type="button" onClick={handleSaveDraft}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-blue-200 bg-blue-50/50 text-sm font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all active:scale-[0.98]">
              <Save className="w-4 h-4" /> Save Draft
            </button>
          </div>
        </div>
      </div>

        {/* ============= MAIN 3-COLUMN GRID ============= */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* ===== COLUMN 1: Basic Information ===== */}
          <div className="flex flex-col h-full">
            <div className={`${cardClass} flex-1 flex flex-col`}>
              <div className="flex items-start gap-3.5 mb-6 pb-5 border-b border-gray-100 dark:border-[#273244]">
                <div className="w-10 h-10 rounded-xl bg-[#0F9291]/10 flex items-center justify-center shrink-0">
                  <Pill className="w-5 h-5 text-[#0F9291]" />
                </div>
                <div>
                  <h3 className="text-[22px] font-bold text-gray-900 dark:text-[#F8FAFC] font-['Space_Grotesk'] leading-snug">Basic Information</h3>
                  <p className="text-[13px] text-gray-500 dark:text-[#94A3B8] mt-0.5">Primary medicine details and identifiers.</p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="relative">
                  <label className={labelClass}>Medicine Name {requiredStar}</label>
                  <input type="text" required placeholder="e.g. Paracetamol 500mg Tablet"
                    className={inputCls('name')} value={formData.name}
                    onChange={e => handleNameChange(e.target.value)} />
                  {errors.name && <p className="text-[12px] text-red-500 mt-1">{errors.name}</p>}
                  {showSuggestions && (
                    <div ref={suggestionRef} className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-[#273244] shadow-lg dark:shadow-2xl max-h-56 overflow-auto animate-fadeIn py-1.5">
                      {suggestions.map((p: any) => (
                        <button key={p.id} type="button" onClick={() => handleSuggestionClick(p)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F0FDF9] dark:hover:bg-[#0F9291]/5 transition-colors border-b border-gray-50 dark:border-[#273244] last:border-0">
                          <div className="w-8 h-8 rounded-lg bg-[#0F9291]/10 flex items-center justify-center flex-shrink-0"><Pill className="w-4 h-4 text-[#0F9291]" /></div>
                          <div className="min-w-0 flex-1"><span className="text-sm font-medium text-gray-900 dark:text-[#F8FAFC] block truncate">{p.name}</span><span className="text-xs text-gray-400 dark:text-[#64748B]">{p.sku} · {formatCurrency(p.price)}</span></div>
                          <span className="text-[11px] text-gray-400 dark:text-[#64748B] bg-gray-100 dark:bg-[#1F2937] rounded-lg px-2 py-1">Edit</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className={labelClass}>Generic Name</label>
                  <input type="text" placeholder="e.g. Paracetamol" className={inputCls('genericName')} value={formData.genericName} onChange={e => handleGenericNameChange(e.target.value)} />
                  {showGenericSuggestions && (
                    <div ref={genericSuggestionRef} className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-[#273244] shadow-lg dark:shadow-2xl max-h-48 overflow-auto animate-fadeIn py-1.5">
                      {genericSuggestions.map(name => (
                        <button key={name} type="button" onClick={() => handleGenericSuggestionClick(name)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F0FDF9] dark:hover:bg-[#0F9291]/5 transition-colors text-sm text-gray-700 dark:text-[#F8FAFC]">
                          <div className="w-5 h-5 rounded-md border-2 border-gray-300 dark:border-[#3a3a48] flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-transparent" />
                          </div>
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Medicine Image</label>
                  <div ref={dropRef}
                    onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex items-center gap-4 p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                      isDragOver ? 'border-[#0F9291] bg-[#0F9291]/5' : 'border-gray-200 dark:border-[#273244] bg-gray-50/50 dark:bg-[#111827]/50 hover:border-[#0F9291] hover:bg-[#0F9291]/5'
                    }`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#273244] flex items-center justify-center shrink-0">
                        <ImageUp className="w-5 h-5 text-gray-400 dark:text-[#64748B]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-600 dark:text-[#94A3B8]">Drop image here or click to upload</p>
                        <p className="text-[12px] text-gray-400 dark:text-[#64748B] mt-0.5">PNG, JPG, WEBP up to 5MB</p>
                      </div>
                    </div>
                    {imagePreview && (
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 dark:border-[#273244] shadow-sm group shrink-0">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={e => { e.stopPropagation(); setImagePreview(null); setImageFile(null); }}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>SKU {requiredStar}</label>
                  <div className="flex gap-2">
                    <input type="text" required placeholder="Auto-generated" className={inputCls('sku')} value={formData.sku} onChange={e => handleChange('sku', e.target.value)} />
                    <button type="button" onClick={generateSku} title="Generate new SKU"
                      className="shrink-0 h-12 w-12 rounded-xl border border-gray-200 dark:border-[#273244] bg-gray-50 dark:bg-[#111827] text-gray-500 dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#1F2937] hover:border-gray-300 dark:hover:border-[#3a3a48] text-sm transition-all flex items-center justify-center active:scale-[0.95]">
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                  {errors.sku && <p className="text-[12px] text-red-500 mt-1">{errors.sku}</p>}
                </div>
                <div>
                  <label className={labelClass}>Barcode (UPC/EAN/ISBN)</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Auto-generate or scan" className={inputCls('barcode')} value={formData.barcode} onChange={e => handleChange('barcode', e.target.value)} />
                    <button type="button" onClick={generateBarcode} title="Generate random barcode"
                      className="shrink-0 h-12 w-12 rounded-xl border border-gray-200 dark:border-[#273244] bg-gray-50 dark:bg-[#111827] text-gray-500 dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#1F2937] hover:border-gray-300 dark:hover:border-[#3a3a48] text-sm transition-all flex items-center justify-center active:scale-[0.95]">
                      <Barcode className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Medicine Type</label>
                  <div className="flex bg-gray-100 dark:bg-[#1F2937] rounded-xl p-1 mt-1.5">
                    <button type="button" onClick={() => handleChange('prescriptionRequired', true)}
                      className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${
                        formData.prescriptionRequired ? 'bg-white dark:bg-[#161B22] text-gray-900 dark:text-[#F8FAFC] shadow-sm' : 'text-gray-500 dark:text-[#94A3B8] hover:text-gray-700 dark:hover:text-[#F8FAFC]'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0F9291] shrink-0" />
                      Prescription (Rx)
                    </button>
                    <button type="button" onClick={() => handleChange('prescriptionRequired', false)}
                      className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${
                        !formData.prescriptionRequired ? 'bg-white dark:bg-[#161B22] text-gray-900 dark:text-[#F8FAFC] shadow-sm' : 'text-gray-500 dark:text-[#94A3B8] hover:text-gray-700 dark:hover:text-[#F8FAFC]'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      OTC
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <ToggleSwitch checked={isActive} onChange={setIsActive} />
                    <span className={`text-sm font-medium ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-[#64748B]'}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== COLUMN 2: Classification ===== */}
          <div className="flex flex-col h-full">
            <div className={`${cardClass} flex-1 flex flex-col`}>
              <div className="flex items-start gap-3.5 mb-6 pb-5 border-b border-gray-100 dark:border-[#273244]">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-[22px] font-bold text-gray-900 dark:text-[#F8FAFC] font-['Space_Grotesk'] leading-snug">Classification</h3>
                  <p className="text-[13px] text-gray-500 dark:text-[#94A3B8] mt-0.5">Category and manufacturer information.</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Category {requiredStar}</label>
                  <CategoryCombobox
                    value={formData.categoryId}
                    onChange={(id) => handleChange('categoryId', id)}
                    categories={categories}
                    required
                    placeholder="Search or select category..."
                    onAddNew={() => openModal('category')}
                  />
                  {errors.categoryId && <p className="text-[12px] text-red-500 mt-1">{errors.categoryId}</p>}
                </div>
                <SearchableSelect label="Brand" value={formData.brandId} onChange={v => handleChange('brandId', v)}
                  options={brands} placeholder="Search brand..." onAddNew={() => openModal('brand')} />
                <div>
                  <label className={labelClass}>Manufacturer</label>
                  <input type="text" placeholder="e.g. Sun Pharma" className={inputCls('manufacturer')} value={manufacturer} onChange={e => setManufacturer(e.target.value)} />
                </div>
                <RackSelect
                  label="Rack Location"
                  racks={racks}
                  value={formData.rackId}
                  onChange={v => handleChange('rackId', v)}
                  quantity={Number(formData.stockQuantity || 0)}
                  onAddNew={() => openModal('rack')}
                  loadError={rackError}
                  onRetry={() => RacksAPI.getAll()
                    .then(r => { setRacks(r.data || []); setRackError(false); })
                    .catch(() => setRackError(true))}
                />
                <SearchableSelect label="Unit" value={formData.unitId} onChange={v => handleChange('unitId', v)}
                  options={units} placeholder="Search unit..." onAddNew={() => openModal('unit')} />
                <div>
                  <label className={labelClass}>Medicine Form</label>
                  <div className="flex flex-wrap gap-2 mt-2 mb-4">
                    {medicineForms.map(f => (
                      <button key={f} type="button" onClick={() => setMedicineForm(f)}
                        className={`relative px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-200 active:scale-95 ${
                          medicineForm === f
                            ? 'bg-[#0F9291] text-white border-[#0F9291] shadow-sm'
                            : 'bg-white dark:bg-[#161B22] text-gray-600 dark:text-[#94A3B8] border-gray-200 dark:border-[#273244] hover:border-[#0F9291] hover:text-[#0F9291]'}
                        `}>
                        {medicineForm === f && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full border-2 border-[#0F9291] flex items-center justify-center"><Check className="w-2.5 h-2.5 text-[#0F9291]" /></span>}
                        {f}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Add custom form (e.g. Patch, Implant)"
                      value={customForm}
                      onChange={e => setCustomForm(e.target.value)}
                      className={`mt-1 w-full rounded-xl border bg-white dark:bg-[#161B22] px-3 py-2 text-sm text-gray-700 dark:text-[#F8FAFC] outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20 transition-colors`}
                    />
                    {customForm.trim() && (
                      <button type="button"
                        onClick={() => {
                          setMedicineForm(customForm.trim());
                          setCustomForm('');
                        }}
                        className="mt-1 rounded-xl border bg-[#0F9291] text-white text-sm px-3 py-1 hover:bg-[#0F9291]/90 transition-colors">
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== COLUMN 3: Pricing & Inventory ===== */}
          <div className="flex flex-col h-full">
            <div className={`${cardClass} flex-1 flex flex-col`}>
              <div className="flex items-start gap-3.5 mb-6 pb-5 border-b border-gray-100 dark:border-[#273244]">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-[22px] font-bold text-gray-900 dark:text-[#F8FAFC] font-['Space_Grotesk'] leading-snug">Pricing &amp; Inventory</h3>
                  <p className="text-[13px] text-gray-500 dark:text-[#94A3B8] mt-0.5">Stock, pricing and GST configuration.</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>MRP (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#64748B] text-[15px]">₹</span>
                    <input type="number" min="0" step="0.01" placeholder="0.00" className={`${inputCls('mrp')} pl-8`} value={formData.mrp} onChange={e => handleChange('mrp', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Selling Price (₹) {requiredStar}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#64748B] text-[15px]">₹</span>
                    <input type="number" required min="0" step="0.01" placeholder="0.00" className={`${inputCls('price')} pl-8`} value={formData.price} onChange={e => { handleChange('price', e.target.value); }} />
                  </div>
                  {errors.price && <p className="text-[12px] text-red-500 mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className={labelClass}>Purchase Price (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#64748B] text-[15px]">₹</span>
                    <input type="number" min="0" step="0.01" placeholder="0.00" className={`${inputCls('purchasePrice')} pl-8`} value={formData.purchasePrice} onChange={e => handleChange('purchasePrice', e.target.value)} />
                  </div>
                </div>

                {/* Premium Margin KPI Card - always visible */}
                <div className={`rounded-xl border p-4 transition-all duration-300 ${
                  marginColor === 'emerald' ? 'bg-emerald-50/80 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/50' :
                  marginColor === 'amber' ? 'bg-amber-50/80 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50' :
                  marginColor === 'red' ? 'bg-red-50/80 dark:bg-red-900/30 border-red-200 dark:border-red-700/50' :
                  'bg-gray-50/80 dark:bg-[#111827]/80 border-gray-200 dark:border-[#273244]'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#94A3B8]">Margin Analysis</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      marginColor === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                      marginColor === 'amber' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                      marginColor === 'red' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
                      'bg-gray-100 dark:bg-[#1F2937] text-gray-500 dark:text-[#94A3B8]'
                    }`}>{marginStatus}</span>
                  </div>
                  {margin.sp > 0 ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-[11px] text-gray-500 dark:text-[#94A3B8]">Profit per Unit</span>
                          <p className={`text-xl font-bold font-['Space_Grotesk'] ${margin.marginAmt >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                            {margin.marginAmt >= 0 ? '+' : ''}{formatCurrency(margin.marginAmt)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 dark:text-[#94A3B8]">Margin %</span>
                          <p className={`text-xl font-bold font-['Space_Grotesk'] ${
                            margin.marginPct >= 15 ? 'text-emerald-600 dark:text-emerald-400' : margin.marginPct >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'
                          }`}>
                            {margin.marginPct >= 0 ? '+' : ''}{margin.marginPct.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-white/80 dark:bg-[#161B22]/80 rounded-full h-2 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ease-out ${
                          marginColor === 'emerald' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                          marginColor === 'amber' ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                          'bg-gradient-to-r from-red-400 to-red-600'
                        }`} style={{ width: `${Math.min(Math.abs(margin.marginPct), 100)}%` }} />
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 py-2">
                      <Calculator className="w-4 h-4 text-gray-400 dark:text-[#64748B]" />
                      <p className="text-xs text-gray-400 dark:text-[#64748B]">Enter selling price to see margin analysis</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>GST (%)</label>
                    <select className={inputCls('taxPercentage')} value={formData.taxPercentage} onChange={e => handleChange('taxPercentage', e.target.value)}>
                      <option value="">No Tax</option>
                      <option value="0">0% (Nil)</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Discount (%)</label>
                    <input type="number" min="0" max="100" step="0.1" placeholder="0" className={inputCls('discountPercentage')} value={formData.discountPercentage} onChange={e => handleChange('discountPercentage', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{editId ? 'Current Stock' : 'Initial Stock'} {requiredStar}</label>
                  <input type="number" required min="0" placeholder="0" className={inputCls('stockQuantity')} value={formData.stockQuantity} onChange={e => handleChange('stockQuantity', e.target.value)} />
                  {errors.stockQuantity && <p className="text-[12px] text-red-500 mt-1">{errors.stockQuantity}</p>}
                </div>
                <div>
                  <label className={labelClass}>Low Stock Alert at</label>
                  <input type="number" min="0" placeholder="e.g. 10 units" className={inputCls('lowStockQuantity')} value={formData.lowStockQuantity} onChange={e => handleChange('lowStockQuantity', e.target.value)} />
                  {/* Same four-tier rule the list, dashboard and badges use */}
                  {formData.stockQuantity !== '' && (() => {
                    const st = getStockStatus(Number(formData.stockQuantity || 0), Number(formData.lowStockQuantity) || undefined);
                    return (
                      <p className="mt-2 flex items-center gap-2 text-[12px] text-gray-500 dark:text-[#94A3B8]">
                        Status
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${st.pill}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" /> {st.label}
                        </span>
                      </p>
                    );
                  })()}
                </div>
                <SearchableSelect label="Supplier" value={formData.supplierId} onChange={v => handleChange('supplierId', v)}
                  options={suppliers} placeholder="Search supplier..." onAddNew={() => openModal('supplier')} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Min Order Qty</label>
                    <input type="number" min="0" placeholder="0" className={inputCls('minOrderQty')} value={minOrderQty} onChange={e => setMinOrderQty(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Max Order Qty</label>
                    <input type="number" min="0" placeholder="0" className={inputCls('maxOrderQty')} value={maxOrderQty} onChange={e => setMaxOrderQty(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============= SECOND ROW: 3-column ============= */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">

          {/* Manufacturing / Expiry / Batch */}
          <div className={`${cardClass} h-full`}>
            <div className="flex items-start gap-3.5 mb-6 pb-5 border-b border-gray-100 dark:border-[#273244]">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-[22px] font-bold text-gray-900 dark:text-[#F8FAFC] font-['Space_Grotesk'] leading-snug">Manufacturing Details</h3>
                <p className="text-[13px] text-gray-500 dark:text-[#94A3B8] mt-0.5">Dates, batch and traceability.</p>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>
                  Manufacturing Date
                  {errors.manufacturingDate && <span className="ml-2 text-[11px] text-red-500">({errors.manufacturingDate})</span>}
                </label>
                <input type="date" className={inputCls('manufacturingDate')} value={formData.manufacturingDate} onChange={e => handleChange('manufacturingDate', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>
                  Expiry Date
                  {formData.expiryDate && new Date(formData.expiryDate) < new Date() &&
                    <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-medium text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-lg"><AlertTriangle className="w-3 h-3" />Expired</span>
                  }
                </label>
                <input type="date" className={`${inputCls('expiryDate')} ${formData.expiryDate && new Date(formData.expiryDate) < new Date() ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  value={formData.expiryDate} onChange={e => handleChange('expiryDate', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Batch Number</label>
                <input type="text" placeholder="e.g. BATCH-001" className={inputCls('batchNumber')} value={batchNumber} onChange={e => setBatchNumber(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Storage Condition */}
          <div className={`${cardClass} h-full`}>
            <div className="flex items-start gap-3.5 mb-6 pb-5 border-b border-gray-100 dark:border-[#273244]">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
                <Hash className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h3 className="text-[22px] font-bold text-gray-900 dark:text-[#F8FAFC] font-['Space_Grotesk'] leading-snug">Storage Condition</h3>
                <p className="text-[13px] text-gray-500 dark:text-[#94A3B8] mt-0.5">Temperature and handling requirements.</p>
              </div>
            </div>
            <div className="space-y-3">
              {storageConditions.map(sc => (
                <label
                  key={sc.label}
                  onClick={() => setStorageCondition(storageCondition === sc.label ? '' : sc.label)}
                  className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                  storageCondition === sc.label ? 'border-[#0F9291] dark:border-[#0F9291] bg-[#0F9291]/5 dark:bg-[#0F9291]/10 shadow-sm' : 'border-gray-200 dark:border-[#273244] hover:border-gray-300 dark:hover:border-[#3a3a48] hover:bg-gray-50 dark:hover:bg-[#1F2937]'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                    storageCondition === sc.label ? 'bg-[#0F9291]/10' : 'bg-gray-100 dark:bg-[#1F2937]'
                  }`}>{sc.icon}</div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium block ${storageCondition === sc.label ? 'text-[#0F9291]' : 'text-gray-700 dark:text-[#F8FAFC]'}`}>{sc.label}</span>
                    <span className="text-[12px] text-gray-400 dark:text-[#64748B]">{sc.desc}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    storageCondition === sc.label ? 'border-[#0F9291] bg-[#0F9291]' : 'border-gray-300 dark:border-[#3a3a48]'
                  }`}>
                    {storageCondition === sc.label && <Check className="w-3 h-3 text-white" />}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className={`${cardClass} h-full`}>
            <div className="flex items-start gap-3.5 mb-6 pb-5 border-b border-gray-100 dark:border-[#273244]">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#1F2937] flex items-center justify-center shrink-0">
                <Box className="w-5 h-5 text-gray-600 dark:text-[#94A3B8]" />
              </div>
              <div>
                <h3 className="text-[22px] font-bold text-gray-900 dark:text-[#F8FAFC] font-['Space_Grotesk'] leading-snug">Additional Info</h3>
                <p className="text-[13px] text-gray-500 dark:text-[#94A3B8] mt-0.5">Notes, instructions and descriptions.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Description</label>
                <textarea rows={3} placeholder="Brief description of the medicine..." className={textareaCls('description')} value={formData.description} onChange={e => handleChange('description', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Medicine Notes</label>
                <textarea rows={2} placeholder="Special notes, warnings, precautions..." className={textareaCls('medicineNotes')} value={medicineNotes} onChange={e => setMedicineNotes(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Side Effects</label>
                <textarea rows={3} placeholder="List possible side effects..." className={textareaCls('sideEffects')} value={sideEffects} onChange={e => setSideEffects(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Usage Instructions</label>
                <textarea rows={3} placeholder="How to take or use this medicine..." className={textareaCls('usageInstructions')} value={usageInstructions} onChange={e => setUsageInstructions(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* ============= ACTION BAR — end of form =============
            Previously `fixed bottom-0 … ml-[280px]`: it floated over the middle
            of the page and the hardcoded 280px offset no longer matched the
            sidebar (260px expanded, 72px collapsed), so it sat misaligned too.
            A static bar after the last field is both correct and self-aligning. */}
        <div className="mt-8 rounded-2xl bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#273244] shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap px-6 py-4">
            <div className="flex items-center gap-3">
              <Link href="/medicines"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-sm font-medium text-gray-500 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#1F2937] hover:border-gray-300 dark:hover:border-[#3a3a48] transition-all active:scale-[0.98] no-underline">
                <ArrowLeft className="w-4 h-4" /> Cancel
              </Link>
              <button type="button" onClick={handleSaveDraft}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-blue-200 bg-blue-50/50 text-sm font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all active:scale-[0.98]">
                <Save className="w-4 h-4" /> Save Draft
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleSubmitAndAnother} disabled={isSubmitting}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-[#0F9291]/20 bg-white dark:bg-[#161B22] text-sm font-semibold text-[#0F9291] hover:bg-[#0F9291]/5 transition-all active:scale-[0.98] disabled:opacity-50">
                <Plus className="w-4 h-4" /> Save &amp; Add Another
              </button>
<button type="submit" disabled={isSubmitting}
                className="inline-flex items-center gap-2.5 h-11 px-6 rounded-xl bg-gradient-to-r from-[#0F9291] to-teal-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#0F9291]/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

      {/* ============= MODALS ============= */}
      <InlineModal isOpen={modal.isOpen && modal.type === 'category'} onClose={() => setModal({ type: '', isOpen: false })} title="Add New Category" icon={<Plus className="w-5 h-5" />} onSubmit={handleModalSubmit} submitLabel="Add Category">
        <div className="space-y-5">
          <div><label className={labelClass}>Category Name {requiredStar}</label><input type="text" required placeholder="e.g. Antibiotics, Vitamins" className={inputClass} value={modalForm.name} onChange={e => setModalForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label className={labelClass}>Description</label><textarea rows={2} placeholder="Optional" className={textareaClass} value={modalForm.description} onChange={e => setModalForm(p => ({ ...p, description: e.target.value }))} /></div>
        </div>
      </InlineModal>

      <InlineModal isOpen={modal.isOpen && modal.type === 'brand'} onClose={() => setModal({ type: '', isOpen: false })} title="Add New Brand" icon={<Plus className="w-5 h-5" />} onSubmit={handleModalSubmit} submitLabel="Add Brand">
        <div className="space-y-5">
          <div><label className={labelClass}>Brand Name {requiredStar}</label><input type="text" required placeholder="e.g. Cipla, Sun Pharma" className={inputClass} value={modalForm.name} onChange={e => setModalForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label className={labelClass}>Description</label><textarea rows={2} placeholder="Optional" className={textareaClass} value={modalForm.description} onChange={e => setModalForm(p => ({ ...p, description: e.target.value }))} /></div>
        </div>
      </InlineModal>

      <InlineModal isOpen={modal.isOpen && modal.type === 'variant'} onClose={() => setModal({ type: '', isOpen: false })} title="Add New Strength / Variant" icon={<Plus className="w-5 h-5" />} onSubmit={handleModalSubmit} submitLabel="Add Variant">
        <div className="space-y-5">
          <div><label className={labelClass}>Strength {requiredStar}</label><input type="text" required placeholder="e.g. 500mg, 10ml" className={inputClass} value={modalForm.name} onChange={e => setModalForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label className={labelClass}>Description</label><textarea rows={2} placeholder="Optional" className={textareaClass} value={modalForm.description} onChange={e => setModalForm(p => ({ ...p, description: e.target.value }))} /></div>
        </div>
      </InlineModal>

      <InlineModal isOpen={modal.isOpen && modal.type === 'rack'} onClose={() => setModal({ type: '', isOpen: false })} title="Add New Rack" icon={<Plus className="w-5 h-5" />} onSubmit={handleModalSubmit} submitLabel="Add Rack">
        <div className="space-y-5">
          <div><label className={labelClass}>Rack Code {requiredStar}</label><input type="text" required placeholder="e.g. RCK017" className={inputClass} value={modalForm.name} onChange={e => setModalForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label className={labelClass}>Category {requiredStar}</label><input type="text" required placeholder="e.g. Antibiotics" className={inputClass} value={modalForm.description} onChange={e => setModalForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div>
            <label className={labelClass}>Total Capacity (bins) {requiredStar}</label>
            <input type="number" min="1" required placeholder="e.g. 150" className={inputClass} value={modalForm.bins} onChange={e => setModalForm(p => ({ ...p, bins: e.target.value }))} />
            <p className="text-[12px] text-gray-400 mt-1">How many units this rack can hold. Free space is measured against this.</p>
          </div>
        </div>
      </InlineModal>
      <InlineModal isOpen={modal.isOpen && modal.type === 'supplier'} onClose={() => setModal({ type: '', isOpen: false })} title="Add New Supplier" icon={<Plus className="w-5 h-5" />} onSubmit={handleModalSubmit} submitLabel="Add Supplier">
        <div className="space-y-5">
          <div><label className={labelClass}>Supplier Name {requiredStar}</label><input type="text" required placeholder="e.g. MedLife Distributors" className={inputClass} value={modalForm.name} onChange={e => setModalForm(p => ({ ...p, name: e.target.value }))} /></div>
        </div>
      </InlineModal>

      {/* ── Enterprise Unit Dialog (replaces the old Add Unit inline modal) ── */}
      <AddUnitDialog
        open={modal.isOpen && modal.type === 'unit'}
        existingUnits={units}
        onClose={() => setModal({ type: '', isOpen: false })}
        onSaved={handleUnitDialogSaved}
      />

    </div>
  );
}
