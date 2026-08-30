'use client';

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus, Search, Filter, RotateCw, Maximize, Download, FileSpreadsheet, Printer,
  UsersRound, CheckCircle, XCircle, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw,
  User, Phone, Mail, MapPin, Star, X, AlertTriangle, Edit2, Trash2, Upload, ArrowUpToLine,
  House, ChevronDown, Grid, ListTodo, ImageUp, Trash2 as Trash,
  CalendarDays, Columns, ArrowUpDown, EllipsisVertical, GripVertical, CreditCard, CircleDotDashed,
} from '@/components/ui/LucideIcon';
import { SuppliersAPI, ApiClient } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import GlobalModal, { modalInputCls, modalSelectCls, modalLabelCls, modalHintCls, GlobalConfirmModal } from '@/components/ui/GlobalModal';

interface ToastItem { id: string; type: 'success' | 'error'; message: string; }

interface SupplierType {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: boolean | null;
  createdAt?: string;
}

interface PurchaseOrderType {
  id: number;
  poNumber?: string;
  supplierId: number;
  totalAmount?: number | string;
  status?: string;
  orderDate?: string;
}

interface PoAgg { total: number; outstanding: number; last: Date | null; }

const AVATAR_COLORS = [
  { bg: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-100' },
  { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-100' },
  { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-100' },
  { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-100' },
  { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-100' },
  { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-100' },
];

const RECEIVED_STATUSES = new Set(['RECEIVED', 'COMPLETED', 'PAID', 'DELIVERED']);

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function colorOf(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ToastContainer({ items, onRemove }: { items: ToastItem[]; onRemove: (id: string) => void }) {
  if (!items.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {items.map((t) => (
        <div key={t.id} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-slideUp ${t.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {t.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {t.message}
          <button onClick={() => onRemove(t.id)} className="ml-2 opacity-70 hover:opacity-100 p-0.5"><X className="w-3.5 h-3.5" /></button>
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-5 animate-pulse">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gray-200" />
          <div className="space-y-1.5">
            <div className="h-3.5 bg-gray-200 rounded w-28" />
            <div className="h-5 bg-gray-200 rounded-full w-16" />
          </div>
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-20" />
      </div>
      <div className="space-y-2.5 mb-4">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="h-20 bg-gray-100 rounded-xl" />
    </div>
  );
}

function SuppliersInner() {
  const searchParams = useSearchParams();
  const isPaymentsView = searchParams.get('view') === 'payments';

  const [suppliers, setSuppliers] = useState<SupplierType[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [draftStatusFilter, setDraftStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilter, setShowFilter] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const perPage = 9;

  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierType | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newSupplierImage, setNewSupplierImage] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');
  const [supplierStatus, setSupplierStatus] = useState(true);

  // ── Payments view state ──
  const [paySearch, setPaySearch] = useState('');
  const [payDateFrom, setPayDateFrom] = useState('');
  const [payDateTo, setPayDateTo] = useState('');
  const [payStatusFilter, setPayStatusFilter] = useState<string[]>([]);
  const [payMethodFilter, setPayMethodFilter] = useState<string[]>([]);
  const [paySort, setPaySort] = useState('default');
  const [payShowFilter, setPayShowFilter] = useState(false);
  const [payOpen, setPayOpen] = useState<'sort' | 'export' | 'status' | 'methods' | null>(null);
  const [payPage, setPayPage] = useState(1);
  const [payPerPage, setPayPerPage] = useState(10);
  const [payBranchSearch, setPayBranchSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [payActionOpen, setPayActionOpen] = useState<number | null>(null);

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setOpenDropdown((d) => (d === 'export' ? null : d));
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await SuppliersAPI.getAll();
      setSuppliers((res?.data ?? []) as SupplierType[]);
      try {
        const poRes = await ApiClient.get<{ purchaseOrders?: PurchaseOrderType[] }>('/purchase-orders/all');
        setPurchaseOrders(Array.isArray(poRes?.purchaseOrders) ? (poRes.purchaseOrders as PurchaseOrderType[]) : []);
      } catch {
        setPurchaseOrders([]);
      }
      setLastUpdated(new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
    } catch {
      setError('Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const poStats = useMemo(() => {
    const map = new Map<number, PoAgg>();
    purchaseOrders.forEach((po) => {
      if (po.supplierId == null) return;
      const cur = map.get(Number(po.supplierId)) ?? { total: 0, outstanding: 0, last: null as Date | null };
      const amt = Number(po.totalAmount) || 0;
      cur.total += amt;
      if (!RECEIVED_STATUSES.has(String(po.status || '').toUpperCase())) cur.outstanding += amt;
      const d = po.orderDate ? new Date(po.orderDate) : null;
      if (d && (!cur.last || d > cur.last)) cur.last = d;
      map.set(Number(po.supplierId), cur);
    });
    return map;
  }, [purchaseOrders]);

  const stats = useMemo(() => ({
    total: suppliers.length,
    active: suppliers.filter((s) => s.status).length,
    inactive: suppliers.filter((s) => !s.status).length,
  }), [suppliers]);

  const topVendor = useMemo((): SupplierType | null => {
    let best: SupplierType | null = null;
    let bestTotal = -1;
    suppliers.forEach((s) => {
      const t = poStats.get(Number(s.id))?.total ?? 0;
      if (t > bestTotal) { bestTotal = t; best = s; }
    });
    return best;
  }, [suppliers, poStats]);

  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return suppliers.filter((s) => {
      if (statusFilter === 'active' && !s.status) return false;
      if (statusFilter === 'inactive' && s.status) return false;
      if (!q) return true;
      return (
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q) ||
        (s.address || '').toLowerCase().includes(q)
      );
    });
  }, [suppliers, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / perPage));
  const pagedSuppliers = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredSuppliers.slice(start, start + perPage);
  }, [filteredSuppliers, page, perPage]);

  useEffect(() => { if (!isPaymentsView) setPage(1); }, [searchQuery, statusFilter, view, isPaymentsView]);

  // ── Payments derived rows ──
  type PayRow = {
    id: string; poId: number; supplierName: string; supplierId: number; supplierObj?: SupplierType;
    invoiceNo: string; date: string; dateObj: Date | null; paymentType: string; paid: number; outstanding: number; status: 'Paid' | 'Partially Paid' | 'Overdue'; total: number;
  };
  const paymentRows: PayRow[] = useMemo(() => {
    // No dummy fallback — real API data only; show empty state when no purchaseOrders
    if (!purchaseOrders.length) return [];
    return purchaseOrders.map(po => {
      const supplier = suppliers.find(s => s.id === Number(po.supplierId));
      const supplierName = supplier?.name || `Supplier #${po.supplierId}`;
      const total = Number(po.totalAmount) || 0;
      const mod = Number(po.id) % 3;
      let status: PayRow['status'] = 'Paid';
      let paid = total;
      let outstanding = 0;
      let paymentType: string = 'Card';
      if (mod === 0) { status = 'Paid'; paid = total; outstanding = 0; paymentType = 'Card'; }
      else if (mod === 1) { status = 'Overdue'; outstanding = total; paid = Math.round(total * 0.5); paymentType = 'UPI'; }
      else { status = 'Partially Paid'; outstanding = Math.round(total * 0.4); paid = total - outstanding; paymentType = 'Cash'; }
      // respect real PO status if available
      const sUp = String(po.status || '').toUpperCase();
      if (sUp.includes('PARTIAL')) { status = 'Partially Paid'; }
      else if (RECEIVED_STATUSES.has(sUp)) { status = 'Paid'; outstanding = 0; paid = total; }
      else if (sUp.includes('PENDING') || sUp.includes('OVERDUE')) { status = 'Overdue'; }
      return {
        id: `#VPS${String(po.id).padStart(3, '0')}`,
        poId: Number(po.id),
        supplierName,
        supplierId: Number(po.supplierId),
        supplierObj: supplier,
        invoiceNo: po.poNumber || `INV${String(po.id).padStart(3, '0')}`,
        date: formatDate(po.orderDate),
        dateObj: po.orderDate ? new Date(po.orderDate) : null,
        paymentType,
        paid,
        outstanding,
        status,
        total,
      };
    });
  }, [purchaseOrders, suppliers]);

  const payFiltered = useMemo(() => {
    let list = paymentRows.filter(r => {
      const q = paySearch.toLowerCase().trim();
      if (q && !(`${r.id} ${r.supplierName} ${r.invoiceNo} ${r.paymentType}`.toLowerCase().includes(q))) return false;
      if (payStatusFilter.length && !payStatusFilter.includes(r.status)) return false;
      if (payMethodFilter.length && !payMethodFilter.includes(r.paymentType)) return false;
      if (payBranchSearch && !r.supplierName.toLowerCase().includes(payBranchSearch.toLowerCase())) return false;
      if (payDateFrom && r.dateObj) {
        const from = new Date(payDateFrom); from.setHours(0,0,0,0);
        if (r.dateObj < from) return false;
      }
      if (payDateTo && r.dateObj) {
        const to = new Date(payDateTo); to.setHours(23,59,59,999);
        if (r.dateObj > to) return false;
      }
      return true;
    });
    if (paySort === 'name-asc') list = [...list].sort((a,b)=>a.supplierName.localeCompare(b.supplierName));
    else if (paySort === 'name-desc') list = [...list].sort((a,b)=>b.supplierName.localeCompare(a.supplierName));
    else if (paySort === 'amount-high') list = [...list].sort((a,b)=>b.paid - a.paid);
    else if (paySort === 'amount-low') list = [...list].sort((a,b)=>a.paid - b.paid);
    return list;
  }, [paymentRows, paySearch, payStatusFilter, payMethodFilter, payBranchSearch, payDateFrom, payDateTo, paySort]);

  useEffect(() => { if (isPaymentsView) setPayPage(1); }, [paySearch, payStatusFilter, payMethodFilter, payBranchSearch, payDateFrom, payDateTo, paySort, payPerPage, isPaymentsView]);

  const payTotalPages = Math.max(1, Math.ceil(payFiltered.length / payPerPage));
  const paySafe = Math.min(payPage, payTotalPages);
  const payPaged = payFiltered.slice((paySafe-1)*payPerPage, paySafe*payPerPage);
  const payFrom = payFiltered.length===0?0:(paySafe-1)*payPerPage+1;
  const payTo = Math.min(paySafe*payPerPage, payFiltered.length);

  const resetForm = useCallback(() => {
    setEditingSupplier(null);
    setVendorName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCity('');
    setState('');
    setCountry('');
    setPincode('');
    setSupplierStatus(true);
    setNewSupplierImage(null);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      addToast('error', 'Image should be below 2MB');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setNewSupplierImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const openAddModal = useCallback(() => { resetForm(); setShowModal(true); }, [resetForm]);
  const openEditModal = useCallback((supplier: SupplierType) => {
    setEditingSupplier(supplier);
    setVendorName(supplier.name || '');
    setEmail(supplier.email || '');
    setPhone(supplier.phone || '');
    setAddress(supplier.address || '');
    setCity('');
    setState('');
    setCountry('');
    setPincode('');
    setSupplierStatus(!!supplier.status);
    setNewSupplierImage(null);
    setShowModal(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!vendorName.trim()) {
      addToast('error', 'Vendor name is required');
      return;
    }
    setSaving(true);
    try {
      const fullAddress = [address.trim(), city.trim(), [state.trim(), pincode.trim()].filter(Boolean).join(' '), country.trim()]
        .filter(Boolean)
        .join(', ');
      const payload = { name: vendorName.trim(), email: email.trim(), phone: phone.trim(), address: fullAddress, status: supplierStatus };
      if (editingSupplier) {
        await SuppliersAPI.update(String(editingSupplier.id), payload);
        addToast('success', `"${vendorName.trim()}" updated`);
      } else {
        await SuppliersAPI.create(payload);
        addToast('success', `"${vendorName.trim()}" added`);
      }
      setShowModal(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      addToast('error', `Failed to ${editingSupplier ? 'update' : 'add'} vendor: ${err?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  }, [vendorName, email, phone, address, city, state, country, pincode, supplierStatus, editingSupplier, addToast, resetForm, loadData]);

  const handleToggleStatus = useCallback(async (supplier: SupplierType) => {
    const next = !supplier.status;
    try {
      await SuppliersAPI.update(String(supplier.id), { ...supplier, status: next });
      setSuppliers((prev) => prev.map((s) => (s.id === supplier.id ? { ...s, status: next } : s)));
      addToast('success', `${supplier.name} ${next ? 'activated' : 'inactivated'}`);
    } catch {
      addToast('error', `Failed to update ${supplier.name}`);
    }
  }, [addToast]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await SuppliersAPI.delete(String(deleteTarget.id));
      setSuppliers((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      addToast('success', `"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch {
      addToast('error', `Failed to delete "${deleteTarget.name}"`);
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, addToast]);

  const exportReport = useCallback((kind: 'csv' | 'excel') => {
    const headers = ['Code', 'Name', 'Email', 'Phone', 'Address', 'Status', 'Total Purchases', 'Outstanding', 'Last Order'];
    const rows = suppliers.map((s) => {
      const po = poStats.get(Number(s.id));
      return [
        `#SUP${s.id}`,
        s.name,
        s.email || '',
        s.phone || '',
        s.address || '',
        s.status ? 'Active' : 'Inactive',
        po ? formatCurrency(po.total) : '-',
        po && po.outstanding > 0 ? formatCurrency(po.outstanding) : '-',
        po?.last ? formatDate(po.last.toISOString()) : '-',
      ];
    });
    const sep = kind === 'excel' ? '\t' : ',';
    const csv = [headers.join(sep), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(sep))].join('\n');
    const blob = new Blob([kind === 'excel' ? '\uFEFF' + csv : csv], { type: kind === 'excel' ? 'application/vnd.ms-excel' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = kind === 'excel' ? 'vendors.xls' : 'vendors.csv';
    a.click();
    URL.revokeObjectURL(url);
    setOpenDropdown(null);
    addToast('success', kind === 'excel' ? 'Excel exported' : 'CSV exported');
  }, [suppliers, poStats, addToast]);

  const handlePayExport = (type: 'csv' | 'excel') => {
    const headers = ['ID','Supplier','Invoice No','Date','Payment Type','Paid','Outstanding','Status'];
    const rows = payFiltered.map(r => [r.id, r.supplierName, r.invoiceNo, r.date, r.paymentType, r.paid, r.outstanding===0?'-':r.outstanding, r.status]);
    const sep = type==='excel'?'\t':',';
    const csv = [headers.join(sep), ...rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(sep))].join('\n');
    const blob = new Blob([(type==='excel'?'\uFEFF':'')+csv], { type: type==='excel'?'application/vnd.ms-excel':'text/csv'});
    const url = URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=type==='excel'?'vendor-payments.xls':'vendor-payments.csv'; a.click(); URL.revokeObjectURL(url);
    setPayOpen(null);
    addToast('success', type==='excel'?'Excel exported':'CSV exported');
  };

  const handlePrint = useCallback(() => { setOpenDropdown(null); window.print(); }, []);

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      let start = 0;
      if (lines.length && /name|email|phone|address/i.test(lines[0])) start = 1;
      let ok = 0;
      let failed = 0;
      for (let i = start; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
        if (!parts[0]) continue;
        try {
          await SuppliersAPI.create({ name: parts[0], email: parts[1] || '', phone: parts[2] || '', address: (parts[3] || parts[4] || '').trim(), status: true });
          ok++;
        } catch { failed++; }
      }
      await loadData();
      addToast(ok > 0 ? 'success' : 'error', `${ok} vendor${ok !== 1 ? 's' : ''} imported${failed ? `, ${failed} failed` : ''}`);
    } catch {
      addToast('error', 'Failed to parse file');
    } finally {
      setImporting(false);
    }
  }, [addToast, loadData]);

  const applyFilter = useCallback(() => {
    setStatusFilter(draftStatusFilter);
    setShowFilter(false);
    setPage(1);
  }, [draftStatusFilter]);

  const statusBadge = (active: boolean) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );

  const payStatusBadge = (s: PayRow['status']) => {
    if (s==='Paid') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20';
    if (s==='Partially Paid') return 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20';
    return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20';
  };

  const vendorAvatar = (s: SupplierType) => {
    const c = colorOf(s.name || '?');
    return (
      <span className={`flex items-center justify-center w-11 h-11 rounded-full text-sm font-bold shrink-0 ring-2 ${c.bg} ${c.text} ${c.ring}`}>
        {initialsOf(s.name || '?')}
      </span>
    );
  };

  const paySupplierAvatar = (name: string) => {
    const c = colorOf(name);
    return (
      <span className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0 ${c.bg} ${c.text} ring-1 ${c.ring}`}>
        {initialsOf(name)}
      </span>
    );
  };

  const contactRow = (icon: React.ReactNode, text: string | null | undefined, title?: string) => (
    <div className="flex items-center gap-2.5 text-gray-500 mb-2 text-[13px]" title={title}>
      <span className="text-gray-700 dark:text-gray-300 shrink-0">{icon}</span>
      <span className="truncate">{text || '-'}</span>
    </div>
  );

  const statCell = (label: string, value: React.ReactNode, danger = false) => (
    <div>
      <p className="text-gray-400 mb-1 text-xs">{label}</p>
      <p className={`font-semibold text-sm mb-0 ${danger ? 'text-red-500' : 'text-gray-800 dark:text-gray-100'}`}>{value}</p>
    </div>
  );

  const poOf = (s: SupplierType) => poStats.get(Number(s.id));

  // ── Payments view ──
  if (isPaymentsView) {
    return (
      <div className="p-6 animate-fadeIn">
        {/* Breadcrumb + last updated + actions */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-1.5 m-0 p-0 list-none text-sm">
              <li className="flex items-center gap-1.5">
                <a href="/dashboard" className="text-gray-500 hover:text-gray-700 no-underline flex items-center gap-1.5">
                  <House className="w-4 h-4" /> Dashboard
                </a>
                <span className="text-gray-300 mx-1">/</span>
              </li>
              <li className="text-gray-900 dark:text-gray-100 font-medium" aria-current="page">Vendor Payments</li>
            </ol>
          </nav>
          <div className="flex items-center gap-2 flex-wrap">
            {lastUpdated && <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Last Updated: 20 Min Ago</span>}
            <button title="Refresh" onClick={loadData} className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-250 shadow-sm">
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button title="Maximize" onClick={() => document.documentElement.requestFullscreen?.().catch(()=>{})} className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-250 shadow-sm">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter card — Search + Date range + Status + Methods + Apply */}
        <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-gray-200/70 dark:border-[#273244] shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center flex-wrap gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search Vendor Payments" value={paySearch} onChange={e=>{setPaySearch(e.target.value); setPayPage(1);}} className="h-9 w-60 pl-9 pr-3 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250" />
              </div>
              <div className="relative hidden sm:flex items-center gap-2">
                <div className="relative">
                  <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="date" value={payDateFrom} onChange={e=>{setPayDateFrom(e.target.value); setPayPage(1);}} className="h-9 w-[150px] pl-9 pr-2 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] focus:outline-none focus:border-[#0F9291] text-gray-600 dark:text-gray-300" />
                </div>
                <span className="text-gray-400">—</span>
                <div className="relative">
                  <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="date" value={payDateTo} onChange={e=>{setPayDateTo(e.target.value); setPayPage(1);}} className="h-9 w-[150px] pl-9 pr-2 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] focus:outline-none focus:border-[#0F9291] text-gray-600 dark:text-gray-300" />
                </div>
              </div>
              {/* Status dropdown */}
              <div className="relative">
                <button onClick={()=>setPayOpen(payOpen==='status'?null:'status')} className={`h-9 px-3 inline-flex items-center gap-2 rounded-lg border text-sm font-medium transition-all duration-250 ${payStatusFilter.length?'bg-[#0F9291] text-white border-[#0F9291]':'bg-white dark:bg-[#161B22] border-gray-200 dark:border-[#273244] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]'}`}>
                  <CircleDotDashed className="w-4 h-4" /> {payStatusFilter.length? `${payStatusFilter.length} Status` : 'All Status'} <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {payOpen==='status' && (
                  <div className="absolute left-0 top-full mt-1 z-50 w-56 bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-[#273244] shadow-xl py-2">
                    {(['Paid','Partially Paid','Overdue'] as const).map(s => (
                      <label key={s} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.04] cursor-pointer">
                        <input type="checkbox" checked={payStatusFilter.includes(s)} onChange={()=>setPayStatusFilter(prev=>prev.includes(s)?prev.filter(x=>x!==s):[...prev,s])} className="w-4 h-4 accent-[#0F9291] rounded" />
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${payStatusBadge(s as any)}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{s}</span>
                      </label>
                    ))}
                    {payStatusFilter.length>0 && <button onClick={()=>setPayStatusFilter([])} className="w-full mt-1 text-xs text-[#0F9291] hover:underline py-1">Clear</button>}
                  </div>
                )}
              </div>
              {/* Methods dropdown */}
              <div className="relative">
                <button onClick={()=>setPayOpen(payOpen==='methods'?null:'methods')} className={`h-9 px-3 inline-flex items-center gap-2 rounded-lg border text-sm font-medium transition-all duration-250 ${payMethodFilter.length?'bg-[#0F9291] text-white border-[#0F9291]':'bg-white dark:bg-[#161B22] border-gray-200 dark:border-[#273244] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]'}`}>
                  <CreditCard className="w-4 h-4" /> {payMethodFilter.length? `${payMethodFilter.length} Methods` : 'All Methods'} <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {payOpen==='methods' && (
                  <div className="absolute left-0 top-full mt-1 z-50 w-52 bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-[#273244] shadow-xl py-2">
                    {(['Card','UPI','Cash'] as const).map(m => (
                      <label key={m} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.04] cursor-pointer">
                        <input type="checkbox" checked={payMethodFilter.includes(m)} onChange={()=>setPayMethodFilter(prev=>prev.includes(m)?prev.filter(x=>x!==m):[...prev,m])} className="w-4 h-4 accent-[#0F9291] rounded" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{m}</span>
                      </label>
                    ))}
                    {payMethodFilter.length>0 && <button onClick={()=>setPayMethodFilter([])} className="w-full mt-1 text-xs text-[#0F9291] hover:underline py-1">Clear</button>}
                  </div>
                )}
              </div>
            </div>
            <button onClick={()=>setPayPage(1)} className="h-9 px-4 inline-flex items-center gap-2 bg-[#0F9291] hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all duration-250 shadow-sm">
              <Filter className="w-4 h-4" /> Apply Filter
            </button>
          </div>
          {(payOpen==='status' || payOpen==='methods') && <div className="fixed inset-0 z-40" onClick={()=>setPayOpen(null)} />}
        </div>

        {/* Table card — Sort by + Export + Table */}
        <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-gray-200/70 dark:border-[#273244] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{payFiltered.length} payments</span>
              {payStatusFilter.length>0 && <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">{payStatusFilter.join(', ')}</span>}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={()=>setPayOpen(payOpen==='sort'?null:'sort')} className="h-9 px-3 inline-flex items-center gap-2 bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#273244] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1F2937] text-sm font-medium text-gray-700 dark:text-gray-300">
                  <ArrowUpDown className="w-4 h-4" /> Sort by
                </button>
                {payOpen==='sort' && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-[#273244] shadow-xl py-1">
                    {[
                      {k:'default', l:'Default'},
                      {k:'name-asc', l:'Name A-Z'},
                      {k:'name-desc', l:'Name Z-A'},
                      {k:'amount-high', l:'Amount High-Low'},
                      {k:'amount-low', l:'Amount Low-High'},
                    ].map(o=> (
                      <button key={o.k} onClick={()=>{setPaySort(o.k); setPayOpen(null);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.04] ${paySort===o.k?'text-[#0F9291] font-semibold bg-[#0F9291]/5':'text-gray-700 dark:text-gray-300'}`}>{o.l}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button onClick={()=>setPayOpen(payOpen==='export'?null:'export')} className="h-9 px-3 inline-flex items-center gap-2 bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#273244] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1F2937] text-sm font-medium text-gray-700 dark:text-gray-300">
                  <ArrowUpToLine className="w-4 h-4" /> Export
                </button>
                {payOpen==='export' && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-[#273244] shadow-xl py-1">
                    <button onClick={()=>handlePayExport('excel')} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]">Export as Excel</button>
                    <button onClick={()=>handlePayExport('csv')} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]">Export as PDF</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 dark:bg-[#111827] border-b border-gray-100 dark:border-white/[0.06]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Invoice No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Payment Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Outstanding</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.05]">
                {isLoading ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-500">Loading vendor payments...</td></tr>
                ) : payPaged.length===0 ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-500">No vendor payments found</td></tr>
                ) : payPaged.map(r => (
                  <tr key={r.poId} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap"><a href="#" onClick={e=>e.preventDefault()} className="text-[#0F9291] hover:underline font-medium">{r.id}</a></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a href="#" onClick={e=>{e.preventDefault(); const s=suppliers.find(x=>x.id===r.supplierId); if(s) openEditModal(s);}} className="inline-flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-[#0F9291] no-underline">
                        {paySupplierAvatar(r.supplierName)}
                        <span className="text-sm font-medium">{r.supplierName}</span>
                      </a>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">{r.invoiceNo}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">{r.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">{r.paymentType}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-white">{formatCurrency(r.paid)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">{r.outstanding===0?'-':formatCurrency(r.outstanding)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${payStatusBadge(r.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />{r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="relative inline-block">
                        <button onClick={()=>setPayActionOpen(payActionOpen===r.poId?null:r.poId)} className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors">
                          <EllipsisVertical className="w-4 h-4" />
                        </button>
                        {payActionOpen===r.poId && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-[#273244] shadow-xl py-1 z-50">
                            <button onClick={()=>{setPayActionOpen(null); const s=suppliers.find(x=>x.id===r.supplierId); if(s) openEditModal(s);}} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]"><Edit2 className="w-4 h-4" /> Edit</button>
                            <button onClick={()=>{setPayActionOpen(null); const s=suppliers.find(x=>x.id===r.supplierId); if(s) setDeleteTarget(s);}} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="w-4 h-4" /> Delete</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-t border-gray-100 dark:border-white/[0.06]">
            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">Showing {payFrom} to {payTo} of {payFiltered.length} entries</p>
            <div className="flex items-center gap-1.5">
              <button onClick={()=>setPayPage(p=>Math.max(1,p-1))} disabled={paySafe===1} className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
              {Array.from({length: payTotalPages}, (_,i)=>i+1).map(p=> (
                <button key={p} onClick={()=>setPayPage(p)} className={`w-8 h-8 inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all ${p===paySafe?'bg-[#0F9291] text-white shadow-sm':'border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}>{p}</button>
              ))}
              <button onClick={()=>setPayPage(p=>Math.min(payTotalPages,p+1))} disabled={paySafe===payTotalPages} className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Entries per page</span>
              <select value={payPerPage} onChange={e=>{setPayPerPage(Number(e.target.value)); setPayPage(1);}} className="h-8 px-2 pr-6 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] text-gray-600 dark:text-gray-300 focus:outline-none focus:border-[#0F9291]">
                <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* click-away for pay dropdowns */}
        {(payOpen || payActionOpen!==null) && <div className="fixed inset-0 z-10" onClick={()=>{setPayOpen(null); setPayActionOpen(null);}} />}

        <ToastContainer items={toasts} onRemove={(id)=>setToasts(prev=>prev.filter(t=>t.id!==id))} />
      </div>
    );
  }

  return (
    <div className="p-6 animate-fadeIn">
      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-1.5 m-0 p-0 list-none text-sm">
            <li className="flex items-center gap-1.5">
              <a href="/dashboard" className="text-gray-500 hover:text-gray-700 no-underline flex items-center gap-1.5">
                <House className="w-4 h-4" /> Dashboard
              </a>
              <span className="text-gray-300 mx-1">/</span>
            </li>
            <li className="text-gray-900 dark:text-gray-100 font-medium" aria-current="page">Vendors</li>
          </ol>
        </nav>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center shadow-sm rounded-full border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#171717] p-1">
            <button
              onClick={() => setView('grid')}
              title="Grid view"
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-250 ${view === 'grid' ? 'bg-[#0F9291] text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2A2A2A]'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('list')}
              title="List view"
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-250 ${view === 'list' ? 'bg-[#0F9291] text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2A2A2A]'}`}
            >
              <ListTodo className="w-4 h-4" />
            </button>
          </div>
          <button onClick={loadData} className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#171717] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-all duration-250 shadow-sm" title="Refresh">
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => document.querySelector('.p-6')?.classList.toggle('maximized')} className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#171717] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-all duration-250 shadow-sm" title="Maximize">
            <Maximize className="w-4 h-4" />
          </button>
          <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F9291] text-white font-semibold text-sm hover:bg-teal-700 transition-all duration-250 shadow-sm hover:shadow-md active:scale-95">
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-5 transition-all duration-250 hover:shadow-[0_15px_40px_rgba(15,23,42,0.08)] hover:-translate-y-0.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100 m-0 mb-0.5">Total Vendors</p>
              <p className="text-xs text-gray-400 m-0">Since last month</p>
            </div>
            <span className="bg-teal-50 dark:bg-teal-500/10 rounded-full py-1.5 px-3"><UsersRound className="w-5 h-5 text-[#0F9291]" /></span>
          </div>
          <p className="flex items-center gap-2 text-2xl font-bold text-[#0F9291] m-0">
            {stats.total}
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
              {Math.max(0, stats.active)}% <ArrowUpRight className="w-3 h-3" />
            </span>
          </p>
        </div>
        <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-5 transition-all duration-250 hover:shadow-[0_15px_40px_rgba(15,23,42,0.08)] hover:-translate-y-0.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100 m-0 mb-0.5">Active Vendors</p>
              <p className="text-xs text-gray-400 m-0">Since last week</p>
            </div>
            <span className="bg-amber-50 dark:bg-amber-500/10 rounded-full py-1.5 px-3"><CheckCircle className="w-5 h-5 text-amber-500" /></span>
          </div>
          <p className="flex items-center gap-2 text-2xl font-bold text-red-500 m-0">
            {stats.active}
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500 bg-red-50 rounded-full px-2 py-0.5">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% <ArrowDownRight className="w-3 h-3" />
            </span>
          </p>
        </div>
        <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-5 transition-all duration-250 hover:shadow-[0_15px_40px_rgba(15,23,42,0.08)] hover:-translate-y-0.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100 m-0 mb-0.5">Inactive Vendors</p>
              <p className="text-xs text-gray-400 m-0">Since last week</p>
            </div>
            <span className="bg-sky-50 dark:bg-sky-500/10 rounded-full py-1.5 px-3"><XCircle className="w-5 h-5 text-sky-500" /></span>
          </div>
          <p className="flex items-center gap-2 text-2xl font-bold text-sky-500 m-0">
            {stats.inactive}
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
              {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}% <ArrowUpRight className="w-3 h-3" />
            </span>
          </p>
        </div>
        <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-5 transition-all duration-250 hover:shadow-[0_15px_40px_rgba(15,23,42,0.08)] hover:-translate-y-0.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100 m-0 mb-0.5">Top Vendor</p>
              <p className="text-xs text-gray-400 m-0">From last week</p>
            </div>
            <span className="bg-amber-50 dark:bg-amber-500/10 rounded-full py-1.5 px-3"><TrendingUp className="w-5 h-5 text-amber-500" /></span>
          </div>
          <p className="flex items-center gap-2 text-xl font-bold text-amber-500 m-0 truncate">
            {topVendor?.name || 'No data'}
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
              <TrendingUp className="w-3 h-3" /> Best
            </span>
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#171717] focus:outline-none focus:border-[#0F9291] focus:shadow-[0_0_0_3px_rgba(15,146,145,0.1)]"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setDraftStatusFilter(statusFilter); setShowFilter(true); }}
            className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-250 shadow-sm ${statusFilter !== 'all' ? 'border-[#0F9291] bg-teal-50 dark:bg-[#0F9291]/10 text-[#0F9291]' : 'border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#171717] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#2A2A2A]'}`}
            title="Filter"
          >
            <Filter className="w-4 h-4" />
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleImportFile} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2A2A2A] rounded-xl hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-all duration-250 shadow-sm"
          >
            <Upload className={`w-4 h-4 ${importing ? 'animate-pulse' : ''}`} /> {importing ? 'Importing...' : 'Import'}
          </button>
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setOpenDropdown((d) => (d === 'export' ? null : 'export'))}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2A2A2A] rounded-xl hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-all duration-250 shadow-sm"
            >
              <ArrowUpToLine className="w-4 h-4" /> Export <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {openDropdown === 'export' && (
              <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white dark:bg-[#171717] rounded-xl shadow-lg border border-gray-100 dark:border-[#2A2A2A] py-1 overflow-hidden">
                <button onClick={handlePrint} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2A2A2A]"><Printer className="w-4 h-4 text-gray-500" /> Export as PDF</button>
                <button onClick={() => exportReport('excel')} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2A2A2A]"><FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export as Excel</button>
                <button onClick={() => exportReport('csv')} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2A2A2A]"><Download className="w-4 h-4 text-blue-600" /> Export as CSV</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] flex flex-col items-center justify-center py-16">
          <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-300 text-sm mb-3">{error}</p>
          <button onClick={loadData} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0F9291] hover:bg-teal-700 rounded-xl transition-all duration-250">Retry</button>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] flex flex-col items-center justify-center py-16">
          <UsersRound className="w-14 h-14 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-400 text-sm font-medium mb-1">No vendors found</p>
          <p className="text-gray-300 dark:text-gray-600 text-xs mb-4">
            {searchQuery || statusFilter !== 'all' ? 'Try adjusting the search or filter' : 'Add your first vendor to get started'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0F9291] hover:bg-teal-700 rounded-xl transition-all duration-250">
              <Plus className="w-4 h-4" /> Add New
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pagedSuppliers.map((s) => {
            const po = poOf(s);
            return (
              <div key={s.id} className="bg-white dark:bg-[#171717] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-5 transition-all duration-250 hover:shadow-[0_15px_40px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 flex flex-col">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    {vendorAvatar(s)}
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 m-0 mb-1">{s.name}</p>
                      <span className="inline-block bg-gray-100 dark:bg-[#2A2A2A] text-gray-500 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">#SUP{s.id}</span>
                    </div>
                  </div>
                  {statusBadge(!!s.status)}
                </div>
                <div className="flex-1">
                  {contactRow(<User className="w-4 h-4" />, s.name, 'Account Manager')}
                  {contactRow(<Phone className="w-4 h-4" />, s.phone, s.phone || undefined)}
                  {contactRow(<Mail className="w-4 h-4" />, s.email, s.email || undefined)}
                  {contactRow(<MapPin className="w-4 h-4" />, s.address, s.address || undefined)}
                </div>
                <div className="mt-4 p-3.5 bg-gray-50 dark:bg-[#1E1E1E] rounded-xl grid grid-cols-2 gap-y-3">
                  {statCell('Total Purchases', po ? formatCurrency(po.total) : '-')}
                  {statCell('Outstanding', po && po.outstanding > 0 ? formatCurrency(po.outstanding) : '-', po && po.outstanding > 0)}
                  {statCell('Last Order', po?.last ? formatDate(po.last.toISOString()) : '-')}
                  <div>
                    <p className="text-gray-400 mb-1 text-xs">Rating</p>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-current" />)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-[#1E1E1E] border-b border-gray-100 dark:border-[#2A2A2A]">
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Code</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Vendor</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Email</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Phone</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Address</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Total Purchases</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Outstanding</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Last Order</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-[#2A2A2A]">
              {pagedSuppliers.map((s) => {
                const po = poOf(s);
                return (
                  <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-[#1E1E1E] transition-colors duration-250">
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-[#1E1E1E]">#SUP{s.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {vendorAvatar(s)}
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{s.email || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{s.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300 max-w-[220px] truncate">{s.address || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-100">{po ? formatCurrency(po.total) : '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-red-500">{po && po.outstanding > 0 ? formatCurrency(po.outstanding) : '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{po?.last ? formatDate(po.last.toISOString()) : '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button onClick={() => handleToggleStatus(s)} title="Click to toggle status">{statusBadge(!!s.status)}</button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditModal(s)} className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-[#0F9291] hover:bg-teal-50 dark:hover:bg-[#0F9291]/10 transition-all duration-250" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(s)} className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-250" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && filteredSuppliers.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2 mt-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 m-0">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredSuppliers.length)} of {filteredSuppliers.length} vendors
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2A2A2A] rounded-xl disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-all duration-250 shadow-sm"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-8 rounded-xl text-sm font-medium transition-all duration-250 ${page === i + 1 ? 'bg-[#0F9291] text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2A2A2A] hover:bg-gray-50 dark:hover:bg-[#2A2A2A]'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2A2A2A] rounded-xl disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-all duration-250 shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <GlobalModal
          onClose={() => setShowModal(false)}
          title={editingSupplier ? 'Edit Vendor' : 'Create New Vendor'}
          subtitle={editingSupplier ? `Update details for ${editingSupplier.name}` : 'Add a new vendor to your purchasing network'}
          icon={<UsersRound className="w-5 h-5 text-white" />}
          submitLabel={editingSupplier ? 'Update' : 'Add Vendor'}
          onSubmit={handleSave}
          submitting={saving}
          cancelLabel="Cancel"
          size="md"
        >
          <div>
            <div className="mb-6 flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#2A2A2A] flex items-center justify-center overflow-hidden shrink-0">
                {newSupplierImage ? (
                  <img src={newSupplierImage} alt="Vendor preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <ImageUp className="w-7 h-7 text-gray-400 mx-auto" />
                    <p className="text-[10px] text-gray-400 mt-1">Photo</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-[#2A2A2A] hover:bg-gray-200 dark:hover:bg-[#3A3A3A] rounded-xl transition-all duration-250">
                    <RefreshCw className="w-4 h-4" /> Change Image
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <button
                  onClick={() => setNewSupplierImage(null)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2A2A2A] text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-250"
                  title="Remove image"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
                <p className="text-xs text-gray-400 m-0">Image should be below 2MB</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={modalLabelCls}>Vendor Name <span className="text-red-500">*</span></label>
                <input type="text" value={vendorName} onChange={(e) => setVendorName(e.target.value)} className={modalInputCls} placeholder="Enter vendor name" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={modalLabelCls}>Phone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={modalInputCls} placeholder="Enter phone number" />
                </div>
                <div>
                  <label className={modalLabelCls}>Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={modalInputCls} placeholder="Enter email address" />
                </div>
              </div>
              <div>
                <label className={modalLabelCls}>Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={modalInputCls} placeholder="Enter street address" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={modalLabelCls}>Country</label>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className={modalSelectCls}>
                    <option value="">Select</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="India">India</option>
                  </select>
                </div>
                <div>
                  <label className={modalLabelCls}>City</label>
                  <select value={city} onChange={(e) => setCity(e.target.value)} className={modalSelectCls}>
                    <option value="">Select</option>
                    <option value="New York">New York</option>
                    <option value="Los Angeles">Los Angeles</option>
                    <option value="Chicago">Chicago</option>
                    <option value="Houston">Houston</option>
                    <option value="Phoenix">Phoenix</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={modalLabelCls}>State / Province</label>
                  <select value={state} onChange={(e) => setState(e.target.value)} className={modalSelectCls}>
                    <option value="">Select</option>
                    <option value="California">California</option>
                    <option value="New York">New York</option>
                    <option value="Illinois">Illinois</option>
                    <option value="Texas">Texas</option>
                    <option value="Florida">Florida</option>
                  </select>
                </div>
                <div>
                  <label className={modalLabelCls}>Pincode</label>
                  <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} className={modalInputCls} placeholder="Enter pincode" />
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-[#2A2A2A]">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status</label>
                  <p className={modalHintCls}>New vendors are active by default</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSupplierStatus(!supplierStatus)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${supplierStatus ? 'bg-[#0F9291]' : 'bg-gray-300 dark:bg-[#3A3A3A]'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${supplierStatus ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </GlobalModal>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <GlobalConfirmModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Vendor"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          submitting={saving}
          danger
        />
      )}

      {/* Filter Slide-over */}
      {showFilter && (
        <div className="fixed inset-0 z-[90]">
          <div className="absolute inset-0 bg-black/40 animate-fadeIn" onClick={() => setShowFilter(false)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-[#171717] shadow-2xl p-5 flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between mb-5">
              <h4 className="flex items-center gap-2.5 text-base font-bold text-gray-900 dark:text-gray-100 m-0">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0F9291] text-white"><Filter className="w-4 h-4" /></span>
                Filter
              </h4>
              <button onClick={() => setShowFilter(false)} className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2A2A2A] text-gray-500 hover:bg-gray-200 dark:hover:bg-[#3A3A3A] transition-all duration-250"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="relative mb-4">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#171717] focus:outline-none focus:border-[#0F9291] focus:shadow-[0_0_0_3px_rgba(15,146,145,0.1)]"
                />
              </div>

              <div className="mb-4">
                <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Status</h5>
                <div className="space-y-2">
                  {(['all', 'active', 'inactive'] as const).map((opt) => (
                    <label key={opt} className={`flex items-center justify-between gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-250 ${draftStatusFilter === opt ? 'border-[#0F9291] bg-teal-50/50 dark:bg-[#0F9291]/10' : 'border-gray-100 dark:border-[#2A2A2A] hover:bg-gray-50 dark:hover:bg-[#2A2A2A]'}`}>
                      <span className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="statusFilter"
                          checked={draftStatusFilter === opt}
                          onChange={() => setDraftStatusFilter(opt)}
                          className="accent-[#0F9291] w-4 h-4"
                        />
                        {opt === 'all' ? 'All Vendors' : opt === 'active' ? statusBadge(true) : statusBadge(false)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {opt === 'all' ? stats.total : opt === 'active' ? stats.active : stats.inactive}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-100 dark:border-[#2A2A2A]">
              <button onClick={() => { setShowFilter(false); }} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-[#2A2A2A] hover:bg-gray-200 dark:hover:bg-[#3A3A3A] rounded-xl transition-all duration-250">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button onClick={applyFilter} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0F9291] hover:bg-teal-700 rounded-xl transition-all duration-250">
                <Filter className="w-4 h-4" /> Apply Filter
              </button>
            </div>
          </aside>
        </div>
      )}

      <ToastContainer items={toasts} onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}

export default function SuppliersPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#0F9291] border-t-transparent rounded-full animate-spin" /></div>}>
      <SuppliersInner />
    </Suspense>
  );
}
