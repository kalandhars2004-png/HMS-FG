'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, RotateCw, Maximize, House, X, ImageUp, Trash2, Loader2, CheckCircle2, AlertTriangle,
  Search, Building2, Package, Tag, Ruler, Warehouse, Pill,
} from '@/components/ui/LucideIcon';
import { ProductsAPI, CategoriesAPI, BrandsAPI, UnitsAPI, VariantsAPI, SuppliersAPI, SubCategoriesAPI } from '@/lib/api';
import CategoryCombobox from '@/components/dashboard/CategoryCombobox';

const inputClass = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-white outline-none transition-all duration-250 focus:border-[#0F9291] focus:shadow-[0_0_0_3px_rgba(15,146,145,0.1)] placeholder:text-gray-400";
const selectClass = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-white outline-none transition-all duration-250 focus:border-[#0F9291] focus:shadow-[0_0_0_3px_rgba(15,146,145,0.1)] appearance-none cursor-pointer";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
const requiredStar = <span className="text-red-500">*</span>;

interface InlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function InlineModal({ isOpen, onClose, title, children }: InlineModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[1060] animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
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
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(!!editId);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    sku: '',
    barcode: '',
    categoryId: '',
    subCategoryId: '',
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
    expiryDate: '',
    manufacturingDate: '',
    prescriptionRequired: false,
    description: '',
  });

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [modal, setModal] = useState<{ type: string; isOpen: boolean }>({ type: '', isOpen: false });
  const [modalForm, setModalForm] = useState({ name: '', description: '' });
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      CategoriesAPI.getAll().then(r => setCategories(r.data || [])).catch(() => {}),
      BrandsAPI.getAll().then(r => setBrands(r.data || [])).catch(() => {}),
      UnitsAPI.getAll().then(r => setUnits(r.data || [])).catch(() => {}),
      VariantsAPI.getAll().then(r => setVariants(r.data || [])).catch(() => {}),
      SuppliersAPI.getAll().then(r => setSuppliers(r.data || [])).catch(() => {}),
      SubCategoriesAPI.getAll().then(r => setSubCategories(r.data || [])).catch(() => {}),
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
            subCategoryId: String(p.subCategoryId || ''),
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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value }));
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
    router.push(`/medicines/create?id=${product.id}`);
  };

  const generateSku = () => {
    const prefix = 'MED';
    const num = String(Date.now()).slice(-6);
    setFormData(prev => ({ ...prev, sku: `${prefix}${num}` }));
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const openModal = (type: string) => {
    setModalForm({ name: '', description: '' });
    setModal({ type, isOpen: true });
  };

  const handleModalSubmit = async () => {
    if (!modalForm.name.trim()) return;
    try {
      let res: any;
      switch (modal.type) {
        case 'category':
          res = await CategoriesAPI.create({ name: modalForm.name, description: modalForm.description });
          break;
        case 'brand':
          res = await BrandsAPI.create({ name: modalForm.name, description: modalForm.description });
          break;
        case 'unit':
          res = await UnitsAPI.create({ name: modalForm.name, description: modalForm.description });
          break;
        case 'variant':
          res = await VariantsAPI.create({ name: modalForm.name, description: modalForm.description });
          break;
        case 'supplier':
          res = await SuppliersAPI.create({ name: modalForm.name });
          break;
      }
      const refreshMap: Record<string, any> = {
        category: { api: CategoriesAPI, state: setCategories, key: 'categories' },
        brand: { api: BrandsAPI, state: setBrands, key: 'brands' },
        unit: { api: UnitsAPI, state: setUnits, key: 'units' },
        variant: { api: VariantsAPI, state: setVariants, key: 'variants' },
        supplier: { api: SuppliersAPI, state: setSuppliers, key: 'suppliers' },
      };
      const cfg = refreshMap[modal.type];
      let newData: any[] = [];
      if (cfg) {
        const r = await cfg.api.getAll();
        newData = r.data || [];
        cfg.state(newData);
      }
      if (modal.type === 'category') {
        const created = newData.find((c: any) => c.name === modalForm.name.trim());
        if (created) handleChange('categoryId', String(created.id));
      }
      setToast({ show: true, message: `${modal.type.charAt(0).toUpperCase() + modal.type.slice(1)} added successfully`, type: 'success' });
      setModal({ type: '', isOpen: false });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save';
      setToast({ show: true, message: msg, type: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
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
      if (formData.expiryDate) fd.append('expiryDate', formData.expiryDate + 'T00:00:00');
      if (formData.manufacturingDate) fd.append('manufacturingDate', formData.manufacturingDate + 'T00:00:00');
      fd.append('prescriptionRequired', String(formData.prescriptionRequired));
      if (imageFile) fd.append('imageFile', imageFile);

      if (editId) {
        await ProductsAPI.update(editId, fd);
        setToast({ show: true, message: 'Medicine updated successfully', type: 'success' });
      } else {
        await ProductsAPI.create(fd);
        setToast({ show: true, message: 'Medicine added successfully', type: 'success' });
      }
      setTimeout(() => router.push('/medicines'), 1200);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to save medicine';
      setToast({ show: true, message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBrands = brands;
  const filteredUnits = units;
  const filteredVariants = variants;
  const filteredSuppliers = suppliers;

  if (isLoadingEdit) {
    return (
      <div className="pb-6 animate-pulse">
        <div className="flex items-center gap-3 mb-4"><div className="h-5 w-48 bg-gray-200 rounded-lg" /></div>
        <div className="max-w-5xl mx-auto"><div className="bg-white rounded-2xl p-8 space-y-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded-xl" />)}
        </div></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[1060] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-slideDown ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-2 opacity-50 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-1.5 m-0 p-0 list-none text-sm">
            <li className="flex items-center gap-1.5">
              <a href="/dashboard" className="text-gray-500 hover:text-gray-700 no-underline flex items-center gap-1.5"><House className="w-4 h-4" /> Dashboard</a>
              <span className="text-gray-300 mx-1">/</span>
            </li>
            <li className="flex items-center gap-1.5">
              <a href="/medicines" className="text-gray-500 hover:text-gray-700 no-underline">Medicine List</a>
              <span className="text-gray-300 mx-1">/</span>
            </li>
            <li className="text-gray-900 font-medium" aria-current="page">{editId ? 'Edit Medicine' : 'Add New Medicine'}</li>
          </ol>
        </nav>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-all shadow-sm" title="Refresh"><RotateCw className="w-4 h-4" /></button>
          <button className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-all shadow-sm" title="Maximize"><Maximize className="w-4 h-4" /></button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-5xl mx-auto space-y-5">

          {/* ===== SECTION 1: BASIC INFORMATION ===== */}
          <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-6 lg:p-8">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#0F9291]/10 flex items-center justify-center"><Pill className="w-4 h-4 text-[#0F9291]" /></div>
              <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 relative">
                <label className={labelClass}>Medicine Name {requiredStar}</label>
                <input type="text" required placeholder="e.g. Paracetamol 500mg Tablet"
                  className={inputClass} value={formData.name}
                  onChange={e => handleNameChange(e.target.value)}
                  onFocus={e => { if (e.target.value.trim().length >= 1) { const q = e.target.value.toLowerCase(); const matches = allProducts.filter(p => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)).slice(0, 8); setSuggestions(matches); setShowSuggestions(matches.length > 0); } }} />
                {showSuggestions && (
                  <div ref={suggestionRef} className="absolute z-50 top-full mt-1 left-0 right-0 bg-white rounded-xl border border-gray-200 shadow-xl max-h-64 overflow-auto animate-fadeIn">
                    {suggestions.map((p: any) => (
                      <button key={p.id} type="button"
                        onClick={() => handleSuggestionClick(p)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F0FDF9] transition-colors border-b border-gray-50 last:border-0">
                        <div className="w-7 h-7 rounded-lg bg-[#0F9291]/10 flex items-center justify-center flex-shrink-0">
                          <Pill className="w-3.5 h-3.5 text-[#0F9291]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-gray-900 block truncate">{p.name}</span>
                          <span className="text-xs text-gray-400">{p.sku} · ₹{Number(p.price || 0).toLocaleString()}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 bg-gray-100 rounded-md px-2 py-0.5">Edit</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>Generic Name</label>
                <input type="text" placeholder="e.g. Paracetamol"
                  className={inputClass} value={formData.genericName}
                  onChange={e => handleChange('genericName', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>SKU {requiredStar}</label>
                <div className="flex gap-2">
                  <input type="text" required placeholder="Auto-generated"
                    className={inputClass} value={formData.sku}
                    onChange={e => handleChange('sku', e.target.value)} />
                  <button type="button" onClick={generateSku}
                    className="shrink-0 px-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 text-sm transition-all">
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Barcode</label>
                <input type="text" placeholder="UPC / EAN / ISBN"
                  className={inputClass} value={formData.barcode}
                  onChange={e => handleChange('barcode', e.target.value)} />
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1">
                    <label className={labelClass}>Prescription Required</label>
                    <div className="flex items-center gap-3 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="rx" checked={formData.prescriptionRequired}
                          onChange={() => handleChange('prescriptionRequired', true)}
                          className="w-4 h-4 text-[#0F9291] focus:ring-[#0F9291]" />
                        <span className="text-sm text-gray-700">Yes (Rx)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="rx" checked={!formData.prescriptionRequired}
                          onChange={() => handleChange('prescriptionRequired', false)}
                          className="w-4 h-4 text-[#0F9291] focus:ring-[#0F9291]" />
                        <span className="text-sm text-gray-700">No (OTC)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-3">
                <label className={labelClass}>Medicine Image</label>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-[#0F9291] transition-all text-sm">
                    <ImageUp className="w-4 h-4" /> Upload Image
                  </button>
                  {imagePreview && (
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); }}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECTION 2: CLASSIFICATION ===== */}
          <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-6 lg:p-8">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center"><Tag className="w-4 h-4 text-purple-600" /></div>
              <h3 className="text-lg font-bold text-gray-900">Classification</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
              </div>
              <div>
                <label className={`${labelClass} flex items-center justify-between`}>
                  Sub Category
                  <button type="button" onClick={() => openModal('category')}
                    className="text-[#0F9291] inline-flex items-center gap-1 text-xs font-medium bg-transparent border-0 p-0 cursor-pointer hover:text-teal-700">
                    <Plus className="w-3 h-3" /> Add New
                  </button>
                </label>
                <select className={selectClass} value={formData.subCategoryId}
                  onChange={e => handleChange('subCategoryId', e.target.value)}>
                  <option value="">Select Sub Category</option>
                  {subCategories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`${labelClass} flex items-center justify-between`}>
                  Brand / Manufacturer
                  <button type="button" onClick={() => openModal('brand')}
                    className="text-[#0F9291] inline-flex items-center gap-1 text-xs font-medium bg-transparent border-0 p-0 cursor-pointer hover:text-teal-700">
                    <Plus className="w-3 h-3" /> Add New
                  </button>
                </label>
                <select className={selectClass} value={formData.brandId}
                  onChange={e => handleChange('brandId', e.target.value)}>
                  <option value="">Select Brand</option>
                  {filteredBrands.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`${labelClass} flex items-center justify-between`}>
                  Unit
                  <button type="button" onClick={() => openModal('unit')}
                    className="text-[#0F9291] inline-flex items-center gap-1 text-xs font-medium bg-transparent border-0 p-0 cursor-pointer hover:text-teal-700">
                    <Plus className="w-3 h-3" /> Add New
                  </button>
                </label>
                <select className={selectClass} value={formData.unitId}
                  onChange={e => handleChange('unitId', e.target.value)}>
                  <option value="">Select Unit</option>
                  {filteredUnits.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`${labelClass} flex items-center justify-between`}>
                  Rack / Location
                  <button type="button" onClick={() => openModal('variant')}
                    className="text-[#0F9291] inline-flex items-center gap-1 text-xs font-medium bg-transparent border-0 p-0 cursor-pointer hover:text-teal-700">
                    <Plus className="w-3 h-3" /> Add New
                  </button>
                </label>
                <select className={selectClass} value={formData.variantId}
                  onChange={e => handleChange('variantId', e.target.value)}>
                  <option value="">Select Rack</option>
                  {filteredVariants.map((v: any) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ===== SECTION 3: PRICING ===== */}
          <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-6 lg:p-8">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><Building2 className="w-4 h-4 text-emerald-600" /></div>
              <h3 className="text-lg font-bold text-gray-900">Pricing</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className={labelClass}>MRP (₹)</label>
                <input type="number" min="0" step="0.01" placeholder="0.00"
                  className={inputClass} value={formData.mrp}
                  onChange={e => handleChange('mrp', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Selling Price (₹) {requiredStar}</label>
                <input type="number" required min="0" step="0.01" placeholder="0.00"
                  className={inputClass} value={formData.price}
                  onChange={e => handleChange('price', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Purchase Price (₹)</label>
                <input type="number" min="0" step="0.01" placeholder="0.00"
                  className={inputClass} value={formData.purchasePrice}
                  onChange={e => handleChange('purchasePrice', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Tax / GST (%)</label>
                <select className={selectClass} value={formData.taxPercentage}
                  onChange={e => handleChange('taxPercentage', e.target.value)}>
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
                <input type="number" min="0" max="100" step="0.1" placeholder="0"
                  className={inputClass} value={formData.discountPercentage}
                  onChange={e => handleChange('discountPercentage', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ===== SECTION 4: STOCK MANAGEMENT ===== */}
          <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-6 lg:p-8">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><Package className="w-4 h-4 text-amber-600" /></div>
              <h3 className="text-lg font-bold text-gray-900">Stock Management</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className={labelClass}>Initial Stock Quantity {requiredStar}</label>
                <input type="number" required min="0" placeholder="0"
                  className={inputClass} value={formData.stockQuantity}
                  onChange={e => handleChange('stockQuantity', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Low Stock Alert at</label>
                <input type="number" min="0" placeholder="e.g. 10"
                  className={inputClass} value={formData.lowStockQuantity}
                  onChange={e => handleChange('lowStockQuantity', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Supplier</label>
                <div className="flex gap-2">
                  <select className={selectClass} value={formData.supplierId}
                    onChange={e => handleChange('supplierId', e.target.value)}>
                    <option value="">Select Supplier</option>
                    {filteredSuppliers.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => openModal('supplier')}
                    className="shrink-0 px-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 text-sm transition-all">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECTION 5: DATES ===== */}
          <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-6 lg:p-8">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Ruler className="w-4 h-4 text-blue-600" /></div>
              <h3 className="text-lg font-bold text-gray-900">Dates</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className={labelClass}>Expiry Date</label>
                <input type="date" className={inputClass} value={formData.expiryDate}
                  onChange={e => handleChange('expiryDate', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Manufacturing Date</label>
                <input type="date" className={inputClass} value={formData.manufacturingDate}
                  onChange={e => handleChange('manufacturingDate', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ===== SECTION 6: ADDITIONAL ===== */}
          <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-6 lg:p-8">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Warehouse className="w-4 h-4 text-gray-600" /></div>
              <h3 className="text-lg font-bold text-gray-900">Additional Information</h3>
            </div>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className={labelClass}>Description</label>
                <textarea rows={3} placeholder="Medicine description, usage instructions, side effects, etc."
                  className={`${inputClass} resize-none`} value={formData.description}
                  onChange={e => handleChange('description', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ===== ACTIONS ===== */}
          <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-6 lg:p-8">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Link href="/medicines"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all no-underline">
                <X className="w-4 h-4" /> Cancel
              </Link>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F9291] text-white text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {editId ? 'Updating...' : 'Adding...'}</>
                  ) : (
                    <>{editId ? <><Trash2 className="w-4 h-4" /> Update Medicine</> : <><Plus className="w-4 h-4" /> Add Medicine</>}</>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </form>

      {/* ===== INLINE MODALS ===== */}
      <InlineModal isOpen={modal.isOpen && modal.type === 'category'} onClose={() => setModal({ type: '', isOpen: false })} title="Add New Category">
        <div className="space-y-4">
          <div><label className={labelClass}>Category Name {requiredStar}</label>
            <input type="text" required placeholder="e.g. Antibiotics, Vitamins"
              className={inputClass} value={modalForm.name}
              onChange={e => setModalForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label className={labelClass}>Description</label>
            <textarea rows={2} placeholder="Optional"
              className={`${inputClass} resize-none`} value={modalForm.description}
              onChange={e => setModalForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal({ type: '', isOpen: false })}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
            <button type="button" onClick={handleModalSubmit}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#0F9291] text-white text-sm font-semibold hover:bg-teal-700 transition-all">Add Category</button>
          </div>
        </div>
      </InlineModal>

      <InlineModal isOpen={modal.isOpen && modal.type === 'brand'} onClose={() => setModal({ type: '', isOpen: false })} title="Add New Brand">
        <div className="space-y-4">
          <div><label className={labelClass}>Brand Name {requiredStar}</label>
            <input type="text" required placeholder="e.g. Cipla, Sun Pharma"
              className={inputClass} value={modalForm.name}
              onChange={e => setModalForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label className={labelClass}>Description</label>
            <textarea rows={2} placeholder="Optional"
              className={`${inputClass} resize-none`} value={modalForm.description}
              onChange={e => setModalForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal({ type: '', isOpen: false })}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
            <button type="button" onClick={handleModalSubmit}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#0F9291] text-white text-sm font-semibold hover:bg-teal-700 transition-all">Add Brand</button>
          </div>
        </div>
      </InlineModal>

      <InlineModal isOpen={modal.isOpen && modal.type === 'unit'} onClose={() => setModal({ type: '', isOpen: false })} title="Add New Unit">
        <div className="space-y-4">
          <div><label className={labelClass}>Unit Name {requiredStar}</label>
            <input type="text" required placeholder="e.g. Tablet, Capsule, ml"
              className={inputClass} value={modalForm.name}
              onChange={e => setModalForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label className={labelClass}>Description</label>
            <textarea rows={2} placeholder="Optional"
              className={`${inputClass} resize-none`} value={modalForm.description}
              onChange={e => setModalForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal({ type: '', isOpen: false })}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
            <button type="button" onClick={handleModalSubmit}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#0F9291] text-white text-sm font-semibold hover:bg-teal-700 transition-all">Add Unit</button>
          </div>
        </div>
      </InlineModal>

      <InlineModal isOpen={modal.isOpen && modal.type === 'variant'} onClose={() => setModal({ type: '', isOpen: false })} title="Add New Rack / Location">
        <div className="space-y-4">
          <div><label className={labelClass}>Rack Name {requiredStar}</label>
            <input type="text" required placeholder="e.g. Rack A-1, Shelf 3"
              className={inputClass} value={modalForm.name}
              onChange={e => setModalForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label className={labelClass}>Description</label>
            <textarea rows={2} placeholder="Optional"
              className={`${inputClass} resize-none`} value={modalForm.description}
              onChange={e => setModalForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal({ type: '', isOpen: false })}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
            <button type="button" onClick={handleModalSubmit}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#0F9291] text-white text-sm font-semibold hover:bg-teal-700 transition-all">Add Rack</button>
          </div>
        </div>
      </InlineModal>

      <InlineModal isOpen={modal.isOpen && modal.type === 'supplier'} onClose={() => setModal({ type: '', isOpen: false })} title="Add New Supplier">
        <div className="space-y-4">
          <div><label className={labelClass}>Supplier Name {requiredStar}</label>
            <input type="text" required placeholder="e.g. MedLife Distributors"
              className={inputClass} value={modalForm.name}
              onChange={e => setModalForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal({ type: '', isOpen: false })}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
            <button type="button" onClick={handleModalSubmit}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#0F9291] text-white text-sm font-semibold hover:bg-teal-700 transition-all">Add Supplier</button>
          </div>
        </div>
      </InlineModal>

    </div>
  );
}
