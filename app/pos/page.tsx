'use client';

import { notifyDataChanged } from '@/lib/boot-cache';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, Minus, Trash2, Printer, X, CheckCheck, ShoppingCart, CreditCard, Banknote,
  QrCode, ArrowRight, DollarSign, RotateCw, AlertCircle, Clock, Pill, Package, Wallet,
  Percent, User, Phone, Hash, Download, ArrowUp, ArrowUpDown, AlertTriangle, Info,
  ChevronDown, ChevronUp, Maximize, Users, Receipt, Ban, Barcode, Grid, LayoutDashboard, Mail, CalendarDays, CheckCircle, XCircle, Loader2, Share2, Smartphone, Check, Edit, Scan, ClipboardList, Filter, Calculator, Bell, Settings, MapPin, TrendingUp, FileText, RefreshCw, Sparkles, UserPlus, FileImage, Copy, FileSpreadsheet,
} from '@/components/ui/LucideIcon';
import { ProductsAPI, TransactionsAPI, CategoriesAPI, UsersAPI, POSAPI } from '@/lib/api';
import GlobalModal from '@/components/ui/GlobalModal';
import { shouldIgnoreGlobalKey } from '@/lib/modal-guard';
import { formatCurrency } from '@/lib/currency';
import { beginSilentScope, endSilentScope } from '@/components/ui/global-loader/loader-bridge';

// ─── Types ───
interface POSProduct {
  id: number; name: string; price: number; mrp?: number; stockQuantity: number;
  genericName?: string; batchNumber?: string; expiryDate?: string;
  prescriptionRequired?: boolean; sku?: string; categoryName?: string; imageUrl?: string;
  lowStockQuantity?: number; manufacturer?: string;
}

interface CartItem {
  id: string; productId: number; productName: string; genericName?: string;
  unitPrice: number; mrp?: number; quantity: number; totalPrice: number;
  batchNumber?: string; expiryDate?: string; prescriptionRequired?: boolean;
  discountPct: number; discountAmt: number; taxPct: number; taxAmt: number;
}

interface Customer { id?: string; name: string; phone?: string; email?: string; loyaltyPoints?: number; }

function formatTime(d: Date) { return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
function formatDate(d: Date) { return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }); }

function isExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  const exp = new Date(expiryDate);
  if (isNaN(exp.getTime())) return false;
  return exp.getTime() < Date.now();
}

const MEDICINE_IMAGES = [
  'https://dreamspos.dreamstechnologies.com/pharmacy-pos/html/assets/img/medicine/medicine-01.png',
  'https://dreamspos.dreamstechnologies.com/pharmacy-pos/html/assets/img/medicine/medicine-02.png',
  'https://dreamspos.dreamstechnologies.com/pharmacy-pos/html/assets/img/medicine/medicine-03.png',
  'https://dreamspos.dreamstechnologies.com/pharmacy-pos/html/assets/img/medicine/medicine-04.png',
  'https://dreamspos.dreamstechnologies.com/pharmacy-pos/html/assets/img/medicine/medicine-05.png',
  'https://dreamspos.dreamstechnologies.com/pharmacy-pos/html/assets/img/medicine/medicine-06.png',
  'https://dreamspos.dreamstechnologies.com/pharmacy-pos/html/assets/img/medicine/medicine-07.png',
  'https://dreamspos.dreamstechnologies.com/pharmacy-pos/html/assets/img/medicine/medicine-08.png',
];

export default function POSPage() {
  // ─── Data ───
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [cashier, setCashier] = useState('Cashier');

  // ─── Who is Billing ───
  const [biller, setBiller] = useState<{ id: number; name: string; role?: string } | null>(null);
  const [billers, setBillers] = useState<any[]>([]);
  const [showBillerModal, setShowBillerModal] = useState(false);
  const billerPromptedRef = useRef(false);

  // ─── Search & Filter ───
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const searchRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  // ─── Cart ───
  const [cart, setCart] = useState<CartItem[]>([]);
  const [globalDiscountPct, setGlobalDiscountPct] = useState(0);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountInput, setDiscountInput] = useState('20');
  const [couponCode, setCouponCode] = useState('FIRST PURCHASE');
  const [showCouponModal, setShowCouponModal] = useState(false);

  // ─── Customer ───
  const [customer, setCustomer] = useState<Customer>({ name: 'Walk-in Customer' });
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('Select Doctor');
  const [customerPhone, setCustomerPhone] = useState('');

  // ─── Payment ───
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'full' | 'split'>('full');
  const [receivedAmt, setReceivedAmt] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastReceipt, setLastReceipt] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // ─── POS Session ───
  const [sessionId, setSessionId] = useState<string | null>(null);

  // ─── UI ───
  const [clock, setClock] = useState(new Date());
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' }>({ show: false, message: '', type: 'success' });
  const [showDailySales, setShowDailySales] = useState(false);
  const [dailySales, setDailySales] = useState({ totalSales: 0, totalRefunds: 0, transactionCount: 0 });

  // ─── Share Modal ───
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTab, setShareTab] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [shareContact, setShareContact] = useState('');
  const [attachPdf, setAttachPdf] = useState(true);
  const [attachQr, setAttachQr] = useState(true);
  const [attachMedicines, setAttachMedicines] = useState(false);
  const [scheduleOption, setScheduleOption] = useState('now');
  const [commHistory, setCommHistory] = useState<{type: string; recipient: string; status: string; time: Date}[]>([]);
  const router = useRouter();
  const [navConfirm, setNavConfirm] = useState<{ open: boolean; href: string | null; label: string }>({ open: false, href: null, label: '' });

  const handleNavClick = useCallback((e: React.MouseEvent, href: string, label: string) => {
    e.preventDefault();
    // POS itself is the current page — no confirm needed
    if (href === '/pos') { router.push(href); return; }
    setNavConfirm({ open: true, href, label });
  }, [router]);

  const confirmNav = useCallback(() => {
    if (navConfirm.href) router.push(navConfirm.href);
    setNavConfirm({ open: false, href: null, label: '' });
  }, [navConfirm.href, router]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  }, []);

  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);

  const loadProducts = useCallback(() => {
    Promise.all([
      ProductsAPI.getAll(),
      CategoriesAPI.getAll().catch(() => ({ data: [] })),
      UsersAPI.getCurrent().catch(() => null),
    ]).then(([prodRes, catRes, user]) => {
      const mapped = (prodRes.data || []).map((p: any) => ({
        id: p.id, name: p.name, price: Number(p.price || p.mrp || 0), mrp: Number(p.mrp || p.price || 0),
        stockQuantity: p.quantity ?? p.stockQuantity ?? 0, genericName: p.genericName || '',
        batchNumber: p.batchNumber || '', expiryDate: p.expiryDate || '',
        prescriptionRequired: p.prescriptionRequired || false, sku: p.sku || '',
        categoryName: p.categoryName || p.category?.name || 'General', imageUrl: p.imageUrl || '',
        lowStockQuantity: p.lowStockQuantity || 10, manufacturer: p.brandName || '',
      })).filter((p: any) => !isExpired(p.expiryDate));
      setProducts(mapped);
      const cats = Array.from(new Set(mapped.map((p: any) => p.categoryName).filter(Boolean))) as string[];
      setCategories(cats);
      // Default biller = the signed-in cashier; popup lets them change it.
      if (user?.name) {
        setCashier(user.name);
        setBiller(prev => prev ?? { id: user.id, name: user.name, role: user.role });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    POSAPI.getActiveSession().then((s: any) => {
      if (s?.id) { setSessionId(s.id); return; }
      POSAPI.openSession({ notes: 'Auto-opened from POS' }).then((ns: any) => {
        if (ns?.id) setSessionId(ns.id);
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  useEffect(() => { searchRef.current?.focus(); }, [loading]);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  // "Who is Billing?" asks the cashier to confirm which staff member bills.
  // Asks once per entry to this page (reloads / branch switches re-prompt too).
  useEffect(() => {
    if (billerPromptedRef.current) return;
    billerPromptedRef.current = true;
    UsersAPI.getBillers()
      .then(({ data }) => setBillers(Array.isArray(data) ? data : []))
      .finally(() => setShowBillerModal(true));
  }, []);

  useEffect(() => {
    const onFocus = () => { if (!loading) { beginSilentScope(); Promise.resolve(loadProducts()).finally(endSilentScope); } };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadProducts, loading]);

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (shouldIgnoreGlobalKey(e)) return;
      if (e.key === 'F1' || (e.ctrlKey && e.key === 'k')) { e.preventDefault(); searchRef.current?.focus(); return; }
      if (e.key === 'F2') { e.preventDefault(); setShowCustomerModal(true); return; }
      if (e.key === 'F5' && cart.length > 0 && grandTotal > 0) { e.preventDefault(); setShowPaymentModal(true); return; }
      if (e.key === 'F8') { e.preventDefault(); newBill(); return; }
      if (e.key === 'Escape') { setShowCustomerModal(false); setShowPaymentModal(false); setBarcodeMode(false); setShowBillerModal(false); return; }
      if (e.ctrlKey && e.key === 'b') { e.preventDefault(); setBarcodeMode(true); setTimeout(() => barcodeRef.current?.focus(), 100); return; }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cart.length]);

  const TAX_RATE = 0.05;
  const addToCart = useCallback((product: POSProduct) => {
    if (isExpired(product.expiryDate)) { showToast(`${product.name} is expired and cannot be sold`, 'error'); return; }
    if (product.stockQuantity <= 0) { showToast('Out of stock', 'warning'); return; }
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev;
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice } : i);
      }
      const taxAmt = product.price * TAX_RATE;
      const item: CartItem = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        productId: product.id, productName: product.name, genericName: product.genericName,
        unitPrice: product.price, mrp: product.mrp, quantity: 1, totalPrice: product.price,
        batchNumber: product.batchNumber, expiryDate: product.expiryDate,
        prescriptionRequired: product.prescriptionRequired,
        discountPct: 0, discountAmt: 0, taxPct: TAX_RATE * 100, taxAmt,
      };
      return [...prev, item];
    });
  }, [showToast]);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty < 1) { setCart(prev => prev.filter(i => i.id !== id)); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty, totalPrice: qty * i.unitPrice } : i));
  }, []);
  const removeItem = useCallback((id: string) => setCart(prev => prev.filter(i => i.id !== id)), []);
  const newBill = useCallback(() => {
    setCart([]); setGlobalDiscountPct(0);
    setCustomer({ name: 'Walk-in Customer' }); setPaymentMethod('CASH'); setReceivedAmt(''); setCustomerPhone('');
    searchRef.current?.focus();
  }, []);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0), [cart]);
  const totalTax = useMemo(() => cart.reduce((s, i) => s + i.taxAmt * i.quantity, 0), [cart]);
  const totalDiscount = subtotal * (globalDiscountPct / 100);
  const grandTotal = Math.max(0, subtotal - totalDiscount + totalTax);

  const generateReceiptMessage = useCallback(() => {
    let msg = `*DreamsPOS Receipt*\n`;
    msg += `Date: ${formatDate(new Date())} ${formatTime(new Date())}\n`;
    msg += `Billed by: ${biller?.name || 'Cashier'}\n`;
    msg += `Customer: ${customer.name}\n`;
    if (lastReceipt) msg += `Receipt: ${lastReceipt}\n`;
    msg += `----------------\n`;
    cart.forEach(item => {
      msg += `${item.productName} x${item.quantity} = ${formatCurrency(item.totalPrice)}\n`;
    });
    msg += `----------------\n`;
    msg += `Total: ${formatCurrency(grandTotal)}\n`;
    return msg;
  }, [cart, customer, lastReceipt, grandTotal, biller]);

  const filteredProducts = useMemo(() => {
    let f = products.filter(p => p.stockQuantity > 0 && !isExpired(p.expiryDate));
    if (selectedCategory !== 'all') f = f.filter(p => p.categoryName === selectedCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(p => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.genericName?.toLowerCase().includes(q));
    }
    if (sortBy === 'name-asc') f = [...f].sort((a,b)=>a.name.localeCompare(b.name));
    else if (sortBy === 'name-desc') f = [...f].sort((a,b)=>b.name.localeCompare(a.name));
    else if (sortBy === 'price-high') f = [...f].sort((a,b)=>b.price-a.price);
    else if (sortBy === 'price-low') f = [...f].sort((a,b)=>a.price-b.price);
    else if (sortBy === 'stock-high') f = [...f].sort((a,b)=>b.stockQuantity-a.stockQuantity);
    else if (sortBy === 'stock-low') f = [...f].sort((a,b)=>a.stockQuantity-b.stockQuantity);
    return f;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const handleBarcode = useCallback((val: string) => {
    if (!val.trim()) return;
    const found = products.find(p => p.sku === val.trim());
    if (found) {
      if (isExpired(found.expiryDate)) showToast(`${found.name} is expired`, 'error');
      else { addToCart(found); showToast(`${found.name} added`, 'success'); }
    } else showToast('Product not found', 'error');
    if (barcodeRef.current) barcodeRef.current.value = '';
  }, [products, addToCart, showToast]);

  const handleCompleteSale = async () => {
    if (cart.length === 0 || grandTotal <= 0 || !sessionId) return;
    try {
      for (const item of cart) {
        await POSAPI.addTransaction(sessionId, {
          productId: item.productId, quantity: item.quantity,
          paymentMethod, customerName: customer.name,
          customerPhone: customerPhone || customer.phone || '',
          discountAmount: item.discountAmt * item.quantity,
          taxAmount: item.taxAmt * item.quantity,
          totalPrice: item.totalPrice,
          billerId: biller?.id,
          billerName: biller?.name,
        });
      }
      const invNum = `INV-${Date.now().toString().slice(-6)}`;
      setLastReceipt(invNum);
      setShowPaymentModal(false);
      setShowSuccessModal(true);
      setCart([]);
      loadProducts();
      notifyDataChanged();
      showToast('Sale completed!', 'success');
    } catch { showToast('Failed to complete sale', 'error'); }
  };

  const openDailySales = async () => {
    try {
      const ds = await POSAPI.getDailySales();
      setDailySales(ds);
      setShowDailySales(true);
    } catch { showToast('Failed to load sales', 'error'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
            <div className="w-6 h-6 border-[3px] border-[#0F9291] border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading POS...</p>
        </div>
      </div>
    );
  }

  const ToastIcon = toast.type === 'success' ? CheckCheck : toast.type === 'warning' ? AlertTriangle : AlertCircle;
  const toastBg = toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {toast.show && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg border animate-slideDown ${toastBg}`}>
          <ToastIcon className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{toast.message}</span>
          <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-2 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ─── HEADER ─── exact DreamPOS: logo, Newyork, Today's Sales, Shift, Cash Book, Recent Bills, calculator, bell, user ─── */}
      <header className="bg-white border-b border-gray-200 px-4 h-[56px] flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="logo" className="w-8 h-8 rounded-lg object-cover" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}} />
            <span className="font-bold text-gray-900 hidden sm:inline">DreamsPOS</span>
          </Link>
          <div className="hidden xl:flex items-center gap-2 ml-2">
            <button className="h-8 px-3 inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700">
              <MapPin className="w-4 h-4" /> Newyork
            </button>
          </div>
        </div>
        <div className="hidden xl:flex items-center gap-2">
          <button onClick={openDailySales} className="h-8 px-3 inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
            Today&apos;s Sales <span className="font-bold">{formatCurrency(dailySales.totalSales || 1245.50)}</span>
          </button>
          <span className="h-7 px-3 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
            <TrendingUp className="w-3.5 h-3.5" /> Shift A · 09:00 - 17:00
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sales/invoices" className="hidden lg:inline-flex h-8 px-3 items-center gap-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Receipt className="w-4 h-4" /> Cash Book
          </Link>
          <Link href="/pos/sessions" className="hidden lg:inline-flex h-8 px-3 items-center gap-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
            <FileText className="w-4 h-4" /> Recent Bills
          </Link>
          <button className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><Calculator className="w-4 h-4" /></button>
          <button className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><Bell className="w-4 h-4" /></button>
          <Link href="/settings/business" className="w-8 h-8 hidden lg:inline-flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><Settings className="w-4 h-4" /></Link>
          <button onClick={() => setShowBillerModal(true)} title="Change who is billing" className="flex items-center gap-2 group">
            <span className="hidden xl:flex flex-col items-end text-right">
              <span className="text-xs font-bold text-gray-900 leading-tight">{biller?.name || 'Cashier'}</span>
              <span className="text-[10px] text-gray-400">Billing as</span>
            </span>
            <span className="w-8 h-8 rounded-full bg-[#0F9291]/10 text-[#0F9291] text-xs font-bold flex items-center justify-center border border-[#0F9291]/20 group-hover:bg-[#0F9291]/20 transition">
              {(biller?.name || 'C').split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('')}
            </span>
          </button>
        </div>
      </header>

      {/* ─── MAIN 3-COL ─── pos-wrapper equivalent */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT: pos-product */}
        <div className="w-[340px] xl:w-[380px] shrink-0 bg-[#f8f9fa] border-r border-gray-200 flex flex-col min-h-0">
          <div className="bg-white p-3 border-b border-gray-200">
            <div className="relative mb-2">
              {barcodeMode ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                    <input ref={barcodeRef} autoFocus placeholder="Scan barcode..." onKeyDown={e=>{ if(e.key==='Enter') handleBarcode((e.target as HTMLInputElement).value); }} className="w-full h-10 pl-9 pr-9 bg-white border-2 border-emerald-500 rounded-lg text-sm focus:outline-none" />
                    <button onClick={()=>setBarcodeMode(false)} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-400"><Search className="w-4 h-4" /></span>
                  <input ref={searchRef} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search or scan item…" className="w-full h-10 pl-9 pr-9 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/10" />
                  <button onClick={()=>setBarcodeMode(true)} className="absolute right-2 w-7 h-7 inline-flex items-center justify-center hover:bg-gray-100 rounded text-gray-400"><Scan className="w-4 h-4" /></button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/medicines/create" className="h-9 inline-flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"><Plus className="w-4 h-4" /> Add Item</Link>
              <div className="relative">
                <button onClick={()=>document.getElementById('pos-sort')?.classList.toggle('hidden')} className="w-full h-9 inline-flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"><ArrowUpDown className="w-4 h-4" /> Sort</button>
                <div id="pos-sort" className="hidden absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20">
                  {[
                    {k:'default',l:'Default'},
                    {k:'name-asc',l:'Name A-Z'},
                    {k:'name-desc',l:'Name Z-A'},
                    {k:'price-high',l:'Price High-Low'},
                    {k:'price-low',l:'Price Low-High'},
                    {k:'stock-high',l:'Stock High-Low'},
                    {k:'stock-low',l:'Stock Low-High'},
                  ].map(o=>(
                    <button key={o.k} onClick={()=>{setSortBy(o.k); document.getElementById('pos-sort')?.classList.add('hidden')}} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${sortBy===o.k?'text-[#0F9291] font-semibold':''}`}>{o.l}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {filteredProducts.length===0 ? (
                <div className="col-span-2 flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                  <Search className="w-8 h-8 text-gray-300" />
                  <p className="text-sm">No products</p>
                </div>
              ) : filteredProducts.slice(0,80).map((p,idx)=>{
                const inCart = cart.some(c=>c.productId===p.id);
                const img = p.imageUrl || MEDICINE_IMAGES[idx % MEDICINE_IMAGES.length];
                const rx = p.prescriptionRequired ? 'Rx' : 'OTC';
                const stockLow = p.stockQuantity <= (p.lowStockQuantity || 10);
                return (
                  <button key={p.id} onClick={()=>addToCart(p)} className={`bg-white border rounded-xl p-2 text-left relative flex flex-col hover:border-[#0F9291] transition-all ${inCart?'border-[#0F9291] ring-1 ring-[#0F9291]/20':''}`}>
                    <span className="absolute top-2 right-2 text-[10px] font-bold bg-white border border-gray-200 px-1.5 py-0.5 rounded">{rx}</span>
                    <span className="bg-[#f8f9fa] p-2 rounded-lg flex items-center justify-center h-[84px] mb-2">
                      <img src={img} alt={p.name} className="max-h-full object-contain" onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                    </span>
                    <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mb-1"><Pill className="w-3 h-3" /> {p.genericName || p.categoryName} · {p.stockQuantity>0?`Stock: ${p.stockQuantity}`:'Out'}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(p.price)}</span>
                      {inCart ? <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-1"><Check className="w-3 h-3" /> Added</span> : <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${stockLow?'bg-red-50 text-red-700':'bg-emerald-50 text-emerald-700'}`}>{stockLow?'Low':'Stock'}: {p.stockQuantity}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            {filteredProducts.length>80 && <p className="text-center text-xs text-gray-400">+{filteredProducts.length-80} more — refine search</p>}
          </div>

          <div className="bg-white border-t border-gray-200 p-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {['all','Tablet','Syrup','Injection','Equipment'].map(cat=>(
                <button key={cat} onClick={()=>setSelectedCategory(cat==='all'?'all':cat)} className={`shrink-0 h-8 px-4 rounded-full text-xs font-semibold border ${selectedCategory===(cat==='all'?'all':cat) ? 'bg-[#0F9291] text-white border-[#0F9291] shadow' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{cat==='all'?'All':cat}</button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: pos-content */}
        <div className="flex-1 flex flex-col bg-white min-w-0 border-r border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-wrap gap-2">
            <div>
              <p className="text-sm font-bold text-gray-900">Active Cart · #ORD1024</p>
              <p className="text-xs text-gray-500 flex items-center gap-2"><span className="px-2 py-0.5 rounded-full bg-[#0F9291] text-white text-[11px]">Items: {cart.reduce((s,i)=>s+i.quantity,0)}</span> {customer.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-8 px-3 inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium"><FileText className="w-3.5 h-3.5" /> On Hold</button>
              <button onClick={loadProducts} className="h-8 px-3 inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium"><RefreshCw className="w-3.5 h-3.5" /> Sync</button>
              <Link href="/pos/sessions" className="h-8 px-3 inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium"><Clock className="w-3.5 h-3.5" /> History</Link>
              <button onClick={newBill} className="h-8 px-3 inline-flex items-center gap-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold"><Trash2 className="w-3.5 h-3.5" /> Clear All</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {cart.length===0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400 gap-2">
                <ShoppingCart className="w-10 h-10 text-gray-300" />
                <p className="text-sm">Cart empty — search or tap a product</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white border-b border-gray-100 text-xs text-gray-500">
                  <tr>
                    <th className="w-10 p-2"></th>
                    <th className="text-left p-2 font-semibold">Item</th>
                    <th className="text-left p-2 font-semibold">Price</th>
                    <th className="text-left p-2 font-semibold">Qty</th>
                    <th className="text-left p-2 font-semibold">Tax</th>
                    <th className="text-right p-2 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cart.map(item=>(
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-2"><button onClick={()=>removeItem(item.id)} className="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><Trash2 className="w-3.5 h-3.5" /></button></td>
                      <td className="p-2">
                        <p className="font-semibold text-gray-900 text-xs">{item.productName}</p>
                        <p className="text-[11px] text-gray-500">SKU: {String(item.productId).padStart(5,'0')}</p>
                      </td>
                      <td className="p-2 font-medium">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-2">
                        <span className="inline-flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                          <button onClick={()=>updateQty(item.id, item.quantity-1)} className="w-7 h-7 hover:bg-gray-50 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                          <input value={item.quantity} onChange={e=>updateQty(item.id, parseInt(e.target.value)||1)} className="w-8 text-center text-sm focus:outline-none" />
                          <button onClick={()=>updateQty(item.id, item.quantity+1)} className="w-7 h-7 hover:bg-gray-50 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                        </span>
                      </td>
                      <td className="p-2">{formatCurrency(item.taxAmt)}</td>
                      <td className="p-2 text-right font-bold">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="border-t border-gray-200 p-3 space-y-1 bg-white">
            <p className="flex justify-between text-sm"><span className="text-gray-500">Sub Total</span><span className="font-bold">{formatCurrency(subtotal)}</span></p>
            <p className="flex justify-between text-sm"><span className="text-gray-500">Tax (5%)</span><span className="font-bold">{formatCurrency(totalTax)}</span></p>
            <p className="flex justify-between text-sm">
              <span className="flex items-center gap-2">Discount <button onClick={()=>setShowDiscountModal(true)} className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">{globalDiscountPct}% Applied <X className="w-3 h-3 inline" /></button></span>
              <span className="font-bold text-amber-600">-{formatCurrency(totalDiscount)}</span>
            </p>
            <p className="flex justify-between text-sm">
              <span className="flex items-center gap-2">Coupon <button onClick={()=>setShowCouponModal(true)} className="text-[11px] px-1.5 py-0.5 rounded bg-white border">{couponCode} <X className="w-3 h-3 inline" /></button></span>
              <span className="font-bold text-amber-600">-20.10</span>
            </p>
            <p className="flex justify-between text-base font-bold border-t pt-2"><span>Total Amount</span><span>{formatCurrency(grandTotal)}</span></p>
          </div>
        </div>

        {/* RIGHT: pos-profile */}
        <div className="w-[300px] xl:w-[320px] shrink-0 bg-[#f8f9fa] flex flex-col min-h-0">
          <div className="bg-white p-3 border-b border-gray-200 space-y-2">
            <button onClick={()=>showToast('AI Scan coming soon','warning')} className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#0F9291] to-[#0e7a79] text-white text-sm font-semibold"><Sparkles className="w-4 h-4" /> AI Scan Rx</button>
            <div className="grid grid-cols-2 gap-2">
              <button className="h-9 inline-flex items-center justify-center gap-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium"><Clock className="w-4 h-4" /> Hold Order</button>
              <button onClick={()=>{ const w=window.open('','_blank'); if(w){ w.document.write(`<pre>${generateReceiptMessage()}</pre>`); w.print(); } }} className="h-9 inline-flex items-center justify-center gap-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium"><Printer className="w-4 h-4" /> Print</button>
            </div>
          </div>

          <div className="p-3 flex-1 overflow-y-auto space-y-3">
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">Customer Profile</p>
              <div className="flex items-center gap-2 mb-2">
                <select value={customer.name} onChange={e=>setCustomer({name:e.target.value})} className="flex-1 h-9 px-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option>Walk-in Customer</option>
                  <option>Anderson Claire</option>
                  <option>Emily Johnson</option>
                  <option>Sarah Wilson</option>
                  <option>Ava Martinez</option>
                </select>
                <button onClick={()=>setShowCustomerModal(true)} className="w-9 h-9 inline-flex items-center justify-center bg-white border border-gray-200 rounded-lg"><UserPlus className="w-4 h-4" /></button>
              </div>
              <select value={selectedDoctor} onChange={e=>setSelectedDoctor(e.target.value)} className="w-full h-9 px-2 border border-gray-200 rounded-lg text-sm bg-white mb-2">
                <option>Select Doctor</option>
                <option>Dr. Michael Anderson</option>
                <option>Dr. Emily Thompson</option>
              </select>
              <input value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} placeholder="Phone Number (Optional)" className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white" />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
              <p className="text-sm font-semibold">Order Summary</p>
              <p className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold">{formatCurrency(subtotal)}</span></p>
              <p className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span className="font-semibold">{formatCurrency(totalTax)}</span></p>
              <p className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="font-semibold text-amber-600">-{formatCurrency(totalDiscount)}</span></p>
              <p className="flex justify-between text-base font-bold border-t pt-2"><span>Total</span><span>{formatCurrency(grandTotal)}</span></p>
            </div>
          </div>

          <div className="p-3 bg-white border-t border-gray-200">
            <button onClick={()=>setShowPaymentModal(true)} disabled={cart.length===0 || grandTotal<=0} className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0F9291] to-[#0e7a79] text-white font-semibold disabled:opacity-50">
              Place Order <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── FOOTER POS NAV ─── shortcuts with confirm popup */}
      <div className="hidden md:grid grid-cols-6 border-t border-gray-200 bg-white">
        <a href="/dashboard" onClick={(e) => handleNavClick(e, '/dashboard', 'Dashboard')} className="flex flex-col items-center justify-center py-2 border-r border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer"><LayoutDashboard className="w-5 h-5 mb-1" /><span className="text-xs">Dashboard</span></a>
        <a href="/pos" onClick={(e) => handleNavClick(e, '/pos', 'POS')} className="flex flex-col items-center justify-center py-2 border-r border-gray-200 bg-[#0F9291] text-white cursor-pointer"><ShoppingCart className="w-5 h-5 mb-1" /><span className="text-xs">POS</span></a>
        <a href="/sales/invoices" onClick={(e) => handleNavClick(e, '/sales/invoices', 'Invoices')} className="flex flex-col items-center justify-center py-2 border-r border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer"><ClipboardList className="w-5 h-5 mb-1" /><span className="text-xs">Invoices</span></a>
        <a href="/reports/sales" onClick={(e) => handleNavClick(e, '/reports/sales', 'Sales')} className="flex flex-col items-center justify-center py-2 border-r border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer"><DollarSign className="w-5 h-5 mb-1" /><span className="text-xs">Sales</span></a>
        <a href="/work-orders" onClick={(e) => handleNavClick(e, '/work-orders', 'Prescriptions')} className="flex flex-col items-center justify-center py-2 border-r border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer"><ClipboardList className="w-5 h-5 mb-1" /><span className="text-xs">Prescriptions</span></a>
        <a href="/sales/returns" onClick={(e) => handleNavClick(e, '/sales/returns', 'Sales Return')} className="flex flex-col items-center justify-center py-2 hover:bg-gray-50 text-gray-600 cursor-pointer"><ClipboardList className="w-5 h-5 mb-1" /><span className="text-xs">Sales Return</span></a>
      </div>

      {/* ─── NAV CONFIRM POPUP ─── */}
      {navConfirm.open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setNavConfirm({ open: false, href: null, label: '' })} />
          <div className="relative bg-white dark:bg-[#161B22] rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden animate-scaleIn">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Leave POS?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                You are about to go to <span className="font-semibold text-gray-900 dark:text-white">{navConfirm.label}</span>.
                {cart.length > 0 ? ` You have ${cart.reduce((s, i) => s + i.quantity, 0)} item(s) in cart — they will be kept but confirm to continue.` : ' Confirm to continue.'}
              </p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50 dark:bg-[#0F1525] border-t border-gray-100 dark:border-white/[0.06]">
              <button onClick={() => setNavConfirm({ open: false, href: null, label: '' })} className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]">Cancel</button>
              <button onClick={confirmNav} className="flex-1 h-10 rounded-xl bg-[#0F9291] hover:bg-teal-700 text-white text-sm font-semibold shadow-sm">OK, Go</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODALS: keep our functional modals styled like dream ─── */}
      {showBillerModal && (
        <GlobalModal onClose={() => setShowBillerModal(false)} title="Who is Billing?" icon={<Users className="w-5 h-5" />} size="md" hideFooter>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Select the staff member who is billing this sale. Bills are recorded under their name.
            </p>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 border rounded-xl">
              {billers.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">No other staff found — you are the biller.</div>
              )}
              {billers.map((u: any) => {
                const isActive = biller?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      setBiller({ id: u.id, name: u.name, role: u.role });
                      setCashier(u.name);
                      setShowBillerModal(false);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition ${isActive ? 'bg-[#0F9291]/5' : ''}`}
                  >
                    <span className={`w-9 h-9 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${isActive ? 'bg-[#0F9291] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {String(u.name || '?').split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('')}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-gray-900 truncate">{u.name}</span>
                      <span className="block text-xs text-gray-500 truncate">{String(u.role || '').replace(/_/g, ' ')} {u.branchName ? `· ${u.branchName}` : ''}</span>
                    </span>
                    {isActive && <Check className="w-5 h-5 text-[#0F9291]" />}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400">Tip: you can change this anytime from the avatar in the top-right.</p>
          </div>
        </GlobalModal>
      )}

      {showCustomerModal && (
        <GlobalModal onClose={()=>setShowCustomerModal(false)} title="Select Customer" icon={<User className="w-5 h-5" />} size="lg">
          <div className="space-y-3">
            <input value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)} placeholder="Search customer" className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm" />
            <div className="max-h-64 overflow-y-auto divide-y">
              {[{name:'Walk-in Customer',phone:''},{name:'Anderson Claire',phone:'9876543210'},{name:'Emily Johnson',phone:'9123456789'}].filter(c=>c.name.toLowerCase().includes(customerSearch.toLowerCase())).map(c=>(
                <button key={c.name} onClick={()=>{setCustomer(c); setCustomerPhone(c.phone||''); setShowCustomerModal(false);}} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between">
                  <span className="font-medium text-sm">{c.name}</span><span className="text-xs text-gray-500">{c.phone}</span>
                </button>
              ))}
            </div>
          </div>
        </GlobalModal>
      )}

      {showDiscountModal && (
        <GlobalModal onClose={()=>setShowDiscountModal(false)} title="Add Discount" icon={<Percent className="w-5 h-5" />} size="sm">
          <div className="space-y-3">
            <div className="flex gap-2">
              <button className="flex-1 h-9 rounded-lg border bg-[#0F9291] text-white text-sm">Percentage</button>
              <button className="flex-1 h-9 rounded-lg border bg-white text-sm">Flat Price</button>
            </div>
            <input value={discountInput} onChange={e=>setDiscountInput(e.target.value)} placeholder="Enter Discount Rate" className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm" />
            <div className="flex justify-between">
              <button onClick={()=>setShowDiscountModal(false)} className="h-9 px-4 rounded-lg border text-sm">Cancel</button>
              <button onClick={()=>{ setGlobalDiscountPct(Number(discountInput)||0); setShowDiscountModal(false); }} className="h-9 px-4 rounded-lg bg-[#0F9291] text-white text-sm">Add Discount</button>
            </div>
          </div>
        </GlobalModal>
      )}

      {showCouponModal && (
        <GlobalModal onClose={()=>setShowCouponModal(false)} title="Add Coupon" icon={<FileText className="w-5 h-5" />} size="lg" hideFooter>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {code:'REFILL10',title:'REFILL REWARD',desc:'Receive $10 off your next refill',color:'bg-purple-600'},
              {code:'BULK15',title:'BULK BUY BONUS',desc:'Enjoy 15% off on bulk purchases',color:'bg-indigo-600'},
              {code:'LOYALTY2X',title:'LOYALTY PERK',desc:'Get double loyalty points',color:'bg-emerald-600'},
            ].map(c=>(
              <div key={c.code} className="border rounded-xl flex overflow-hidden">
                <div className={`${c.color} text-white p-3 flex items-center justify-center w-28 text-center text-xs font-bold`}>{c.title}</div>
                <div className="p-3 flex-1">
                  <p className="text-xs text-gray-500">Coupon</p>
                  <p className="font-bold text-sm">{c.code}</p>
                  <p className="text-xs text-gray-600 mb-2">{c.desc}</p>
                  <div className="flex gap-2">
                    <button onClick={()=>{ setCouponCode(c.code); setShowCouponModal(false); }} className="text-xs h-7 px-3 rounded bg-white border">Use Now</button>
                    <button onClick={()=>{ navigator.clipboard.writeText(c.code); showToast('Copied','success'); }} className="text-xs flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlobalModal>
      )}

      {showPaymentModal && (
        <GlobalModal onClose={()=>setShowPaymentModal(false)} title={`Collect Payment — #ORD1024`} size="lg" hideFooter>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={()=>setPaymentMode('full')} className={`h-20 rounded-xl border flex flex-col items-center justify-center gap-1 ${paymentMode==='full'?'bg-[#0F9291] text-white':'bg-white'}`}><DollarSign className="w-5 h-5" /> Full Payment</button>
              <button onClick={()=>setPaymentMode('split')} className={`h-20 rounded-xl border flex flex-col items-center justify-center gap-1 ${paymentMode==='split'?'bg-[#0F9291] text-white':'bg-white'}`}><CreditCard className="w-5 h-5" /> Split Payment</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                {id:'CASH',label:'Cash',icon:Banknote},
                {id:'CARD',label:'Card',icon:CreditCard},
                {id:'UPI',label:'UPI / QR',icon:QrCode},
              ].map(p=>(
                <button key={p.id} onClick={()=>setPaymentMethod(p.id)} className={`h-16 rounded-xl border flex flex-col items-center justify-center gap-1 ${paymentMethod===p.id?'bg-[#0F9291] text-white':'bg-white'}`}>
                  <p.icon className="w-5 h-5" /> <span className="text-xs">{p.label}</span>
                </button>
              ))}
            </div>
            <div>
              <label className="text-sm font-medium">Payment Amount *</label>
              <p className="text-xs text-gray-500">Bill total: {formatCurrency(grandTotal)}</p>
              <input value={receivedAmt} onChange={e=>setReceivedAmt(e.target.value)} placeholder={String(grandTotal)} className="w-full h-10 px-3 border border-gray-200 rounded-lg mt-1" />
            </div>
            {paymentMethod==='CARD' && (
              <div className="grid grid-cols-3 gap-2">
                <input placeholder="Card Number *" className="col-span-3 h-10 px-3 border rounded-lg" />
                <input placeholder="Expiry dd/mm/yyyy" className="col-span-2 h-10 px-3 border rounded-lg" />
                <input placeholder="CVV" className="h-10 px-3 border rounded-lg" />
              </div>
            )}
            {paymentMethod==='UPI' && <div className="text-center py-2"><img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi" alt="qr" className="mx-auto" /><p className="text-xs">Scan Now</p></div>}
            <div>
              <label className="text-sm font-medium">Order Notes</label>
              <textarea value={orderNotes} onChange={e=>setOrderNotes(e.target.value)} rows={3} className="w-full p-2 border rounded-lg" />
            </div>
            <div className="border rounded-xl p-3 space-y-1">
              <p className="flex justify-between text-sm"><span>Amount Paid</span><span className="font-bold">{formatCurrency(Number(receivedAmt)||0)}</span></p>
              <p className="flex justify-between text-sm"><span>Due Amount</span><span className="font-bold">{formatCurrency(Math.max(0, grandTotal - (Number(receivedAmt)||0)))}</span></p>
              <p className="flex justify-between font-bold border-t pt-2"><span>Total Amount</span><span>{formatCurrency(grandTotal)}</span></p>
            </div>
            <div className="flex justify-between">
              <button onClick={()=>setShowPaymentModal(false)} className="h-10 px-5 rounded-lg border">Cancel</button>
              <button onClick={handleCompleteSale} className="h-10 px-5 rounded-lg bg-[#0F9291] text-white">Complete Payment</button>
            </div>
          </div>
        </GlobalModal>
      )}

      {showSuccessModal && (
        <GlobalModal onClose={()=>setShowSuccessModal(false)} title="Payment Success" size="lg" hideFooter>
          <div className="text-center py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2"><CheckCheck className="w-8 h-8" /></div>
            <h4 className="font-bold">Payment Success</h4>
            <p className="text-sm text-gray-500 mb-3">Your Order has been Successfully Completed</p>
            <div className="text-left border rounded-xl p-3 space-y-1">
              <p className="flex justify-between text-sm"><span>Amount</span><span className="font-medium">{formatCurrency(grandTotal)}</span></p>
              <p className="flex justify-between text-sm"><span>Date</span><span>{formatDate(new Date())} - {formatTime(new Date())}</span></p>
              <p className="flex justify-between text-sm"><span>Invoice</span><span className="text-amber-600">{lastReceipt}</span></p>
            </div>
            <div className="flex justify-between mt-3">
              <button onClick={()=>{ const w=window.open('','_blank'); if(w){ w.document.write(`<pre>${generateReceiptMessage()}</pre>`); w.print(); } }} className="h-9 px-4 rounded-lg border flex items-center gap-2 text-sm"><Printer className="w-4 h-4" /> Print Invoice</button>
              <button onClick={()=>setShowSuccessModal(false)} className="h-9 px-4 rounded-lg bg-[#0F9291] text-white text-sm">Done</button>
            </div>
          </div>
        </GlobalModal>
      )}

      {showDailySales && (
        <GlobalModal onClose={()=>setShowDailySales(false)} title="Today's Sales Insights" size="sm">
          <div className="space-y-3">
            <div className="bg-sky-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Total Sale Amount</p>
              <p className="font-bold text-sky-700">{formatCurrency(dailySales.totalSales)}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="border rounded-xl p-2"><p>Cash</p><p className="font-bold">{formatCurrency(dailySales.totalSales*0.6)}</p></div>
              <div className="border rounded-xl p-2"><p>Card</p><p className="font-bold">{formatCurrency(dailySales.totalSales*0.3)}</p></div>
              <div className="border rounded-xl p-2"><p>UPI</p><p className="font-bold">{formatCurrency(dailySales.totalSales*0.1)}</p></div>
            </div>
          </div>
        </GlobalModal>
      )}

      {showShareModal && (
        <GlobalModal onClose={()=>setShowShareModal(false)} title="Share Invoice" size="lg" hideFooter>
          <div className="space-y-3">
            <div className="flex gap-2 border-b">
              {(['whatsapp','sms','email'] as const).map(t=>(
                <button key={t} onClick={()=>setShareTab(t)} className={`px-3 py-2 text-sm border-b-2 ${shareTab===t?'border-[#0F9291] text-[#0F9291]':'border-transparent text-gray-500'}`}>{t}</button>
              ))}
            </div>
            <input value={shareContact} onChange={e=>setShareContact(e.target.value)} placeholder={shareTab==='email'?'Email':'Phone'} className="w-full h-9 px-3 border rounded-lg text-sm" />
            <div className="bg-gray-50 p-3 rounded-xl text-sm font-mono">
              Hello {customer.name}, Invoice {lastReceipt} Amount {formatCurrency(grandTotal)}
            </div>
            <div className="flex gap-2">
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={attachPdf} onChange={e=>setAttachPdf(e.target.checked)} /> PDF</label>
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={attachQr} onChange={e=>setAttachQr(e.target.checked)} /> QR</label>
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={attachMedicines} onChange={e=>setAttachMedicines(e.target.checked)} /> Medicines</label>
            </div>
            <button onClick={()=>{ setCommHistory(prev=>[...prev,{type:shareTab, recipient:shareContact||customer.name, status:'sent', time:new Date()}]); setShowShareModal(false); showToast('Shared','success'); }} className="w-full h-9 rounded-lg bg-[#0F9291] text-white text-sm">Send</button>
          </div>
        </GlobalModal>
      )}
    </div>
  );
}
