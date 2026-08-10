'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, Plus, Minus, Trash2, Printer, X, CheckCheck, ShoppingCart, CreditCard, Banknote,
  QrCode, ArrowRight, DollarSign, RotateCw, AlertCircle, Clock, Pill, Package, Wallet,
  Percent, User, Phone, Hash, Download, ArrowUp, AlertTriangle, Info,
  ChevronDown, ChevronUp, Maximize, Users, Receipt, Ban, Barcode, Grid, LayoutDashboard, Mail, CalendarDays, CheckCircle, XCircle, Loader2, Share2, Smartphone, Check, Edit, Command,
} from '@/components/ui/LucideIcon';
import { ProductsAPI, TransactionsAPI, CategoriesAPI, UsersAPI, POSAPI } from '@/lib/api';
import GlobalModal from '@/components/ui/GlobalModal';
import { formatCurrency } from '@/lib/currency';

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

export default function POSPage() {
  // ─── Data ───
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [cashier, setCashier] = useState('Cashier');

  // ─── Search & Filter ───
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [barcodeMode, setBarcodeMode] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  // ─── Cart ───
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPct, setDiscountPct] = useState(0);
  const [globalDiscountPct, setGlobalDiscountPct] = useState(0);

  // ─── Customer ───
  const [customer, setCustomer] = useState<Customer>({ name: 'Walk-in Customer' });
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);

  // ─── Payment ───
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [receivedAmt, setReceivedAmt] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastReceipt, setLastReceipt] = useState('');
  const [lastInvoice, setLastInvoice] = useState('');

  // ─── POS Session ───
  const [sessionId, setSessionId] = useState<string | null>(null);

  // ─── UI ───
  const [clock, setClock] = useState(new Date());
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' }>({ show: false, message: '', type: 'success' });
  const [showSearchModal, setShowSearchModal] = useState(false);

  // ─── Share Modal ───
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTab, setShareTab] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [shareContact, setShareContact] = useState('');
  const [shareCustomContact, setShareCustomContact] = useState('');
  const [addNewContact, setAddNewContact] = useState(false);
  const [newContactValue, setNewContactValue] = useState('');
  const [attachPdf, setAttachPdf] = useState(true);
  const [attachQr, setAttachQr] = useState(true);
  const [attachMedicines, setAttachMedicines] = useState(false);
  const [scheduleOption, setScheduleOption] = useState('now');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [commHistory, setCommHistory] = useState<{type: string; recipient: string; status: string; time: Date}[]>([]);
  const [shareDropdownOpen, setShareDropdownOpen] = useState(false);
  const [shareSearch, setShareSearch] = useState('');

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  }, []);

  // ─── Clock tick ───
  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);

  // ─── Load data ───
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
      }));
      setProducts(mapped);
      const cats = Array.from(new Set(mapped.map((p: any) => p.categoryName).filter(Boolean))) as string[];
      setCategories(cats);
      if (user?.name) setCashier(user.name);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // ─── Load session ───
  useEffect(() => {
    POSAPI.getActiveSession().then((s: any) => {
      if (s?.id) { setSessionId(s.id); return; }
      POSAPI.openSession({ notes: 'Auto-opened from POS' }).then((ns: any) => {
        if (ns?.id) setSessionId(ns.id);
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  // ─── Auto-focus search on mount ───
  useEffect(() => { searchRef.current?.focus(); }, [loading]);

  // ─── Load products on mount ───
  useEffect(() => { loadProducts(); }, [loadProducts]);

  // ─── Refresh products on tab focus ───
  useEffect(() => {
    const onFocus = () => { if (!loading) loadProducts(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadProducts, loading]);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'F1' || (e.ctrlKey && e.key === 'k')) { e.preventDefault(); searchRef.current?.focus(); return; }
      if (e.key === 'F2') { e.preventDefault(); setShowCustomerModal(true); return; }
      if (e.key === 'F3') { e.preventDefault(); setShowSearchModal(true); return; }
      if (e.key === 'F5' && cart.length > 0 && grandTotal > 0) { e.preventDefault(); setShowPaymentModal(true); return; }
      if (e.key === 'F8') { e.preventDefault(); newBill(); return; }
      if (e.key === 'Escape') { setShowSearchModal(false); setShowCustomerModal(false); setShowPaymentModal(false); setBarcodeMode(false); return; }
      if (e.ctrlKey && e.key === 'b') { e.preventDefault(); setBarcodeMode(true); setTimeout(() => barcodeRef.current?.focus(), 100); return; }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        searchRef.current?.focus();
        setSearchQuery(prev => prev + e.key);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cart.length]);

  // ─── Cart operations ───
  const TAX_RATE = 0.05;

  const addToCart = useCallback((product: POSProduct) => {
    if (product.stockQuantity <= 0) { showToast('Out of stock', 'warning'); return; }
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev;
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice } : i);
      }
      const discountAmt = product.price * (0 / 100);
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

  const updateItemDiscount = useCallback((id: string, pct: number) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const discAmt = i.unitPrice * (pct / 100);
      return { ...i, discountPct: pct, discountAmt: discAmt, totalPrice: (i.unitPrice - discAmt) * i.quantity };
    }));
  }, []);

  const newBill = useCallback(() => {
    setCart([]); setDiscountPct(0); setGlobalDiscountPct(0);
    setCustomer({ name: 'Walk-in Customer' }); setPaymentMethod('CASH'); setReceivedAmt('');
    searchRef.current?.focus();
  }, []);

  // ─── Computed ───
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0), [cart]);
  const itemDiscount = useMemo(() => cart.reduce((s, i) => s + i.discountAmt * i.quantity, 0), [cart]);
  const globalDiscount = subtotal * (globalDiscountPct / 100);
  const totalDiscount = itemDiscount + globalDiscount;
  const taxableAmt = subtotal - totalDiscount;
  const totalTax = useMemo(() => cart.reduce((s, i) => s + i.taxAmt * i.quantity, 0), [cart]);
  const grandTotal = Math.max(0, taxableAmt + totalTax);
  const balance = Number(receivedAmt || 0) - grandTotal;

  // ─── Receipt message ───
  const generateReceiptMessage = useCallback(() => {
    const line = '─'.repeat(32);
    let msg = `*DreamsPOS Receipt*\n${line}\n`;
    msg += `Date: ${formatDate(new Date())} ${formatTime(new Date())}\n`;
    msg += `Customer: ${customer.name}\n`;
    if (lastReceipt) msg += `Receipt: ${lastReceipt}\n`;
    msg += `${line}\n`;
    cart.forEach(item => {
      msg += `${item.productName} x${item.quantity}\n`;
      msg += `  ${formatCurrency(item.unitPrice)} × ${item.quantity} = ${formatCurrency(item.totalPrice)}\n`;
      if (item.discountPct > 0) msg += `  Disc: ${item.discountPct}%\n`;
    });
    msg += `${line}\n`;
    msg += `Subtotal: ${formatCurrency(subtotal)}\n`;
    if (totalDiscount > 0) msg += `Discount: -${formatCurrency(totalDiscount)}\n`;
    msg += `Tax: +${formatCurrency(totalTax)}\n`;
    msg += `*Grand Total: ${formatCurrency(grandTotal)}*\n`;
    msg += `${line}\n`;
    msg += `Payment: ${paymentMethod}\n`;
    msg += `Thank you!\n`;
    return msg;
  }, [cart, customer, lastReceipt, subtotal, totalDiscount, totalTax, grandTotal, paymentMethod]);

  const filteredProducts = useMemo(() => {
    let f = products.filter(p => p.stockQuantity > 0);
    if (selectedCategory !== 'all') f = f.filter(p => p.categoryName === selectedCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(p => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.genericName?.toLowerCase().includes(q) || p.manufacturer?.toLowerCase().includes(q));
    }
    return f;
  }, [products, searchQuery, selectedCategory]);

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch));

  // ─── Barcode scan handler ───
  const handleBarcode = useCallback((val: string) => {
    if (!val.trim()) return;
    const found = products.find(p => p.sku === val.trim());
    if (found) { addToCart(found); showToast(`${found.name} added`, 'success'); }
    else { showToast('Product not found', 'error'); }
    if (barcodeRef.current) barcodeRef.current.value = '';
  }, [products, addToCart, showToast]);

  // ─── Complete sale ───
  const handleCompleteSale = async () => {
    if (cart.length === 0 || grandTotal <= 0 || !sessionId) return;
    try {
      for (const item of cart) {
        await POSAPI.addTransaction(sessionId, {
          productId: item.productId, quantity: item.quantity,
          paymentMethod, customerName: customer.name,
          customerPhone: customer.phone || '',
          discountAmount: item.discountAmt * item.quantity,
          taxAmount: item.taxAmt * item.quantity,
          totalPrice: item.totalPrice,
        });
      }
      const invNum = `INV-${Date.now().toString().slice(-6)}`;
      setLastReceipt(invNum);
      setLastInvoice(invNum);
      setShowPaymentModal(false);
      setShowSuccessModal(true);
      setCart([]);
      loadProducts();
      showToast('Sale completed!', 'success');
    } catch { showToast('Failed to complete sale', 'error'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
            <div className="w-6 h-6 border-[3px] border-[#059669] border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading POS...</p>
        </div>
      </div>
    );
  }

  const ToastIcon = toast.type === 'success' ? CheckCheck : toast.type === 'warning' ? AlertTriangle : AlertCircle;
  const toastBg = toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800';

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg border animate-slideDown ${toastBg}`}>
          <ToastIcon className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{toast.message}</span>
          <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-2 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ─── HEADER ─── */}
      <header className="bg-white border-b border-gray-200/80 px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center shadow-sm"><Pill className="w-5 h-5 text-white" /></div>
            <span className="font-bold text-gray-900 text-[17px] tracking-tight">DreamsPOS</span>
          </div>
          <div className="h-7 w-px bg-gray-200" />
          <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-semibold transition-all">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <Link href="/medicines" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-semibold transition-all">
            <Pill className="w-4 h-4" /> Products
          </Link>
          <div className="h-7 w-px bg-gray-200" />
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{formatDate(clock)}</span>
            <span className="mx-2">·</span>
            <span className="font-mono font-semibold text-gray-700">{formatTime(clock)}</span>
          </div>
          <div className="h-7 w-px bg-gray-200" />
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700 font-semibold">{cashier}</span>
            <span className="text-gray-400 mx-1">·</span>
            <span className="text-gray-500">Counter 1</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Shift Active
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-500 rounded-xl text-[11px] font-mono border border-gray-200">
            <Search className="w-3.5 h-3.5" /> F1
          </kbd>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-500 rounded-xl text-[11px] font-mono border border-gray-200">
            <Grid className="w-3.5 h-3.5" /> F3
          </kbd>
          <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"><Maximize className="w-[18px] h-[18px]" /></button>
        </div>
      </header>

      {/* ─── MAIN 3-COLUMN LAYOUT ─── */}
      <div className="flex gap-5 p-5 h-[calc(100vh-69px-64px)]">

        {/* ===== LEFT PANEL (35%) ===== */}
        <div className="w-[35%] flex flex-col gap-4 min-w-0">
          {/* Search */}
          <div className="relative">
            {barcodeMode ? (
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
                  <input ref={barcodeRef} type="text" placeholder="Scan barcode..." autoFocus
                    onChange={e => { if (e.target.value.endsWith('\n')) handleBarcode(e.target.value.replace('\n', '')); }}
                    onKeyDown={e => { if (e.key === 'Enter') handleBarcode((e.target as HTMLInputElement).value); }}
                    className="w-full h-[54px] pl-12 pr-12 bg-white border-2 border-emerald-500 rounded-2xl text-[15px] focus:outline-none shadow-sm" />
                  <button onClick={() => setBarcodeMode(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl whitespace-nowrap">Barcode Mode</span>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input ref={searchRef} type="text" placeholder="Search by Name, SKU, Barcode, Generic Name..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-[54px] pl-12 pr-12 bg-white border border-gray-200 rounded-2xl text-[15px] focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_0_4px_rgba(5,150,105,0.1)] transition-all"
                />
                <button onClick={() => setBarcodeMode(true)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 p-1 transition-all">
                  <Barcode className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
            <button onClick={() => setSelectedCategory('all')} className={`shrink-0 h-[38px] px-4 rounded-full text-sm font-semibold transition-all ${selectedCategory === 'all' ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200' : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700'}`}>All</button>
            {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Ointment'].filter(c => categories.includes(c)).map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`shrink-0 h-[38px] px-4 rounded-full text-sm font-semibold transition-all ${selectedCategory === cat ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200' : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700'}`}>{cat}</button>
            ))}
            {categories.filter(c => !['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Ointment'].includes(c)).slice(0, 5).map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`shrink-0 h-[38px] px-4 rounded-full text-sm font-semibold transition-all ${selectedCategory === cat ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200' : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700'}`}>{cat}</button>
            ))}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-[17px] font-semibold text-gray-700">Search medicines</p>
                <p className="text-sm text-gray-400 max-w-xs text-center">Type a name, scan barcode, or pick a category to start adding items</p>
              </div>
            ) : filteredProducts.length > 200 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.slice(0, 200).map(p => (
                  <ProductCard key={p.id} product={p} cart={cart} onAdd={addToCart} />
                ))}
                <div className="col-span-2 text-center py-5 text-sm text-gray-400 bg-white rounded-2xl border border-gray-100">
                  +{filteredProducts.length - 200} more results — refine search
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map(p => (
                  <ProductCard key={p.id} product={p} cart={cart} onAdd={addToCart} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== CENTER PANEL (40%) ===== */}
        <div className="w-[40%] flex flex-col bg-white rounded-2xl border border-gray-200/80 shadow-sm min-w-0">
          {/* Cart header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-emerald-600" /></div>
              <div>
                <h3 className="text-[17px] font-bold text-gray-900">Current Bill</h3>
                <p className="text-sm text-gray-400">{cart.reduce((s, i) => s + i.quantity, 0)} items · {cart.length} lines</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <>
                  <button onClick={newBill} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-all">
                    <Ban className="w-4 h-4" /> New Bill <kbd className="ml-1.5 text-[11px] text-red-400 bg-red-50 px-1.5 py-0.5 rounded-lg">F8</kbd>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                  <ShoppingCart className="w-9 h-9 text-gray-300" />
                </div>
                <p className="text-[17px] font-semibold text-gray-700">Cart is empty</p>
                <p className="text-sm text-gray-400 max-w-xs text-center">Start scanning medicines or click a product to add it to the bill</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {cart.map(item => (
                  <CartRow key={item.id} item={item} onUpdateQty={updateQty} onRemove={removeItem} onDiscount={updateItemDiscount} />
                ))}
              </div>
            )}
          </div>

          {/* Cart footer - quick actions */}
          {cart.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-3 bg-gray-50/50">
              <span className="text-sm text-gray-500 font-semibold">Discount:</span>
              <div className="flex items-center gap-1.5">
                {[0, 5, 10, 15, 20].map(pct => (
                  <button key={pct} onClick={() => setGlobalDiscountPct(pct)} className={`h-[34px] px-3.5 rounded-xl text-sm font-semibold transition-all ${globalDiscountPct === pct ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700'}`}>{pct === 0 ? '0%' : `${pct}%`}</button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-4 text-sm">
                <span className="text-gray-500">Items: <strong className="text-gray-900 text-[15px]">{cart.reduce((s, i) => s + i.quantity, 0)}</strong></span>
                <span className="text-gray-500">Total: <strong className="text-gray-900 text-[17px]">{formatCurrency(grandTotal)}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* ===== RIGHT PANEL (25%) ===== */}
        <div className="w-[25%] flex flex-col gap-4 min-w-0">

          {/* Customer card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center"><User className="w-[18px] h-[18px] text-amber-600" /></div>
                <span className="font-bold text-gray-900 text-[15px]">Customer</span>
              </div>
              <button onClick={() => setShowCustomerModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold transition-all">
                <Plus className="w-4 h-4" /> Change
              </button>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold">W</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{customer.name}</p>
                  {customer.phone && <p className="text-xs text-gray-400">{customer.phone}</p>}
                  {!customer.phone && <p className="text-xs text-gray-400">Default</p>}
                </div>
              </div>
              <Edit className="w-4 h-4 text-gray-300" />
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 flex flex-col flex-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center"><Receipt className="w-[18px] h-[18px] text-purple-600" /></div>
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Order Summary</h3>
                <p className="text-xs text-gray-400">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500">Discount</span>
                <span className="font-semibold text-emerald-600">-{formatCurrency(totalDiscount)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500">Tax (5%)</span>
                <span className="font-semibold text-gray-900">+{formatCurrency(totalTax)}</span>
              </div>
              <hr className="border-gray-100 my-2" />
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 text-sm">Total Items</span>
                <span className="text-gray-900 font-bold">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <hr className="border-gray-100 my-2" />
              <div className="flex justify-between items-end">
                <span className="text-gray-800 text-[15px] font-bold">Total</span>
                <span className="text-[34px] font-black text-gray-900 tracking-tight">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setPaymentMethod('CASH')} className={`h-[56px] rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98] transition-all ${paymentMethod === 'CASH' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700'}`}>
              <Banknote className="w-5 h-5" /> Cash
            </button>
            <button onClick={() => setPaymentMethod('CARD')} className={`h-[56px] rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98] transition-all ${paymentMethod === 'CARD' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-700'}`}>
              <CreditCard className="w-5 h-5" /> Card
            </button>
            <button onClick={() => setPaymentMethod('UPI')} className={`h-[56px] rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98] transition-all ${paymentMethod === 'UPI' ? 'bg-violet-600 text-white shadow-violet-200' : 'bg-white text-gray-700 border border-gray-200 hover:border-violet-300 hover:text-violet-700'}`}>
              <QrCode className="w-5 h-5" /> UPI
            </button>
            <button onClick={() => setPaymentMethod('WALLET')} className={`h-[56px] rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98] transition-all ${paymentMethod === 'WALLET' ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-white text-gray-700 border border-gray-200 hover:border-rose-300 hover:text-rose-700'}`}>
              <Wallet className="w-5 h-5" /> Wallet
            </button>
          </div>

          {/* Complete Sale */}
          {cart.length > 0 && (
            <button onClick={() => cart.length > 0 && grandTotal > 0 && setShowPaymentModal(true)} className="relative h-[60px] w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-[17px] flex items-center justify-center gap-3 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all overflow-hidden">
              <div className="absolute inset-0 bg-white/10 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />
              <><Check className="w-6 h-6" /> Complete Sale <kbd className="ml-1 text-sm text-white/80 bg-white/20 px-2 py-0.5 rounded-lg">F5</kbd></>
            </button>
          )}
        </div>

      </div>

      {/* ─── BOTTOM ACTION BAR ─── */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200/80 px-6 py-3 flex items-center justify-between gap-4 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2.5">
          <button onClick={newBill} className="flex items-center gap-2 px-4 h-[42px] rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-all">
            <Ban className="w-4 h-4" /> New Bill <kbd className="ml-1 text-[11px] text-red-400 bg-red-50 px-1.5 py-0.5 rounded-lg">F8</kbd>
          </button>
          <button className="flex items-center gap-2 px-4 h-[42px] rounded-xl text-sm font-semibold text-amber-600 hover:bg-amber-50 border border-amber-200 transition-all">
            <Clock className="w-4 h-4" /> Hold Bill <kbd className="ml-1 text-[11px] text-amber-400 bg-amber-50 px-1.5 py-0.5 rounded-lg">F6</kbd>
          </button>
          <button className="flex items-center gap-2 px-4 h-[42px] rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 border border-gray-200 transition-all">
            <Printer className="w-4 h-4" /> Print <kbd className="ml-1 text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-lg">F9</kbd>
          </button>
          <div className="h-7 w-px bg-gray-200 mx-1" />
          <button onClick={() => { const w = window.open('', '_blank'); if (w) { w.document.write(`<pre style="font-family:monospace;padding:20px">${generateReceiptMessage()}</pre>`); w.print(); } }} className="flex items-center gap-2 px-4 h-[42px] rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 border border-gray-200 transition-all">
            <Download className="w-4 h-4" /> Receipt
          </button>
          <button onClick={() => { setShareTab('sms'); setShareContact(customer.phone || ''); setShowShareModal(true); }} className="flex items-center gap-2 px-4 h-[42px] rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 border border-gray-200 transition-all">
            <Smartphone className="w-4 h-4" /> SMS
          </button>
          <button onClick={() => { setShareTab('whatsapp'); setShareContact(customer.phone || ''); setShowShareModal(true); }} className="flex items-center gap-2 px-4 h-[42px] rounded-xl text-sm font-semibold text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-all">
            <Share2 className="w-4 h-4" /> WhatsApp
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-sm text-gray-500 font-semibold">Pay via:</span>
            {[
              { method: 'CASH', label: 'Cash', icon: Banknote },
              { method: 'CARD', label: 'Card', icon: CreditCard },
              { method: 'UPI', label: 'UPI', icon: QrCode },
              { method: 'WALLET', label: 'Wallet', icon: Wallet },
            ].map(({ method, label, icon: Icon }) => (
              <button key={method} onClick={() => setPaymentMethod(method)}
                className={`flex items-center gap-1.5 px-3.5 h-[38px] rounded-xl text-sm font-semibold border transition-all ${
                  paymentMethod === method ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                }`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
          <div className="h-9 w-px bg-gray-200" />
          <div className="text-right mr-2">
            <p className="text-xs text-gray-400 font-medium">Total</p>
            <p className="text-2xl font-black text-gray-900 tracking-tight">{formatCurrency(grandTotal)}</p>
          </div>
          <button onClick={() => cart.length > 0 && grandTotal > 0 && setShowPaymentModal(true)} disabled={cart.length === 0 || grandTotal <= 0}
            className="flex items-center gap-2.5 px-7 h-[52px] rounded-xl text-[15px] font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all">
            <CheckCheck className="w-5 h-5" /> Complete Sale <kbd className="ml-1 text-[12px] text-white/80 bg-white/20 px-2 py-0.5 rounded-lg">F5</kbd>
          </button>
        </div>
      </div>

      {/* ─── SHARE INVOICE MODAL ─── */}
      {showShareModal && (
        <GlobalModal
          onClose={() => { setShowShareModal(false); setSendSuccess(false); setAddNewContact(false); setNewContactValue(''); setShareCustomContact(''); setShareSearch(''); }}
          title="Share Invoice"
          subtitle="Send the invoice digitally to your customer"
          icon={<Share2 className="w-5 h-5" />}
          size="lg"
          hideFooter
        >
            {/* Customer Info */}
            <div className="px-6 py-4 bg-gray-50/50 dark:bg-[#1E1E1E]/50 border-b border-gray-100 dark:border-[#2A2A2A] flex items-center gap-3 -mx-6 -mt-4 mb-4 rounded-t-[24px]">
              <div className="w-12 h-12 rounded-full bg-[#0F9D8A]/10 flex items-center justify-center">
                <User className="w-5 h-5 text-[#0F9D8A]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{customer.name}</p>
                <p className="text-xs text-gray-400">
                  {customer.phone && <span>{customer.phone} · </span>}
                  Walk-in · #{lastReceipt || '---'}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6">
              {[
                { id: 'whatsapp', label: 'WhatsApp', icon: Share2 },
                { id: 'sms', label: 'SMS', icon: Smartphone },
                { id: 'email', label: 'Email', icon: Mail },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { setShareTab(id as any); setAddNewContact(false); setShareSearch(''); }}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${shareTab === id ? 'border-[#0F9D8A] text-[#0F9D8A]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-4">
              {/* Contact Input */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  {shareTab === 'whatsapp' ? 'WhatsApp Number' : shareTab === 'sms' ? 'SMS Number' : 'Email Address'}
                </label>
                {addNewContact ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      {shareTab !== 'email' && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">+91</span>
                      )}
                      <input type={shareTab === 'email' ? 'email' : 'tel'} placeholder={shareTab === 'email' ? 'Enter email address' : 'Enter mobile number'} value={newContactValue} onChange={e => setNewContactValue(e.target.value)} autoFocus
                        className={`w-full ${shareTab !== 'email' ? 'pl-10' : 'pl-3'} pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0F9D8A] focus:shadow-[0_0_0_3px_rgba(15,157,138,0.1)]`} />
                    </div>
                    <button onClick={() => { if (newContactValue.trim()) { setShareCustomContact(newContactValue.trim()); setShareContact(newContactValue.trim()); setAddNewContact(false); setNewContactValue(''); } }} className="px-4 py-2.5 rounded-xl bg-[#0F9D8A] text-white text-sm font-semibold hover:bg-[#0D8A7A] transition-all shrink-0">Save</button>
                    <button onClick={() => setAddNewContact(false)} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-all shrink-0">Cancel</button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShareDropdownOpen(!shareDropdownOpen)}>
                      <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-all">
                        {shareTab === 'email' ? <Mail className="w-4 h-4 text-gray-400" /> : <Phone className="w-4 h-4 text-gray-400" />}
                        <span className={`text-sm ${shareContact ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                          {shareContact || (shareTab === 'email' ? 'Select email address' : 'Select phone number')}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                    {shareDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden animate-fadeIn">
                        <div className="p-2 border-b border-gray-100">
                          <input type="text" placeholder="Search..." value={shareSearch} onChange={e => setShareSearch(e.target.value)} autoFocus
                            className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none" />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {customer.phone && (shareTab === 'whatsapp' || shareTab === 'sms') && (
                            <button onClick={() => { setShareContact(customer.phone!); setShareDropdownOpen(false); setShareSearch(''); }} className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-gray-50 text-left transition-all">
                              <Phone className="w-4 h-4 text-[#0F9D8A]" />
                              <div><p className="text-sm font-medium text-gray-900">{customer.phone}</p><p className="text-xs text-gray-400">Customer Mobile</p></div>
                            </button>
                          )}
                          {shareTab === 'email' && (
                            <button onClick={() => { setShareContact(customer.email || ''); setShareDropdownOpen(false); setShareSearch(''); }} className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-gray-50 text-left transition-all">
                              <Mail className="w-4 h-4 text-[#0F9D8A]" />
                              <div><p className="text-sm font-medium text-gray-900">{customer.email || 'No email on file'}</p><p className="text-xs text-gray-400">Primary Email</p></div>
                            </button>
                          )}
                          <button onClick={() => { setAddNewContact(true); setShareDropdownOpen(false); }} className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-gray-50 text-left border-t border-gray-50 transition-all">
                            <Plus className="w-4 h-4 text-[#0F9D8A]" />
                            <span className="text-sm font-medium text-[#0F9D8A]">Add New {shareTab === 'email' ? 'Email' : 'Number'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Message Preview */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Message Preview</label>
                <div className="bg-gray-50 rounded-xl p-4 text-sm font-mono text-gray-700 leading-relaxed border border-gray-100">
                  Hello {customer.name},{'\n'}
                  Thank you for purchasing from ABC Pharmacy.{'\n\n'}
                  Invoice: <strong>{lastReceipt || 'INV-2026-******'}</strong>{'\n'}
                  Amount: <strong>{formatCurrency(grandTotal)}</strong>{'\n\n'}
                  Please find your invoice below.{'\n'}
                  Thank you.
                </div>
              </div>

              {/* Attachments */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Attachments</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'pdf', label: 'PDF Invoice', state: attachPdf, setter: setAttachPdf },
                    { key: 'qr', label: 'QR Code', state: attachQr, setter: setAttachQr },
                    { key: 'med', label: 'Medicine List', state: attachMedicines, setter: setAttachMedicines },
                  ].map(({ key, label, state, setter }) => (
                    <label key={key} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-all text-sm">
                      <input type="checkbox" checked={state} onChange={() => setter(!state)} className="w-4 h-4 rounded border-gray-300 text-[#0F9D8A] focus:ring-[#0F9D8A]" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Send Schedule</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'now', label: 'Now' },
                    { key: '5min', label: '5 Min' },
                    { key: '30min', label: '30 Min' },
                    { key: '1hr', label: '1 Hour' },
                    { key: 'tomorrow', label: 'Tomorrow' },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => setScheduleOption(key)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${scheduleOption === key ? 'bg-[#0F9D8A] text-white border-[#0F9D8A]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent History */}
              {commHistory.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Recent History</label>
                  <div className="space-y-1.5">
                    {commHistory.slice(-3).reverse().map((h, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 text-sm">
                        <div className="flex items-center gap-2">
                          {h.type === 'whatsapp' ? <Share2 className="w-3.5 h-3.5 text-emerald-500" /> : h.type === 'sms' ? <Smartphone className="w-3.5 h-3.5 text-blue-500" /> : <Mail className="w-3.5 h-3.5 text-purple-500" />}
                          <span className="text-gray-700 capitalize">{h.type}</span>
                          <span className="text-xs text-gray-400">→ {h.recipient}</span>
                        </div>
                        <span className={`text-xs font-medium ${h.status === 'sent' ? 'text-emerald-600' : h.status === 'failed' ? 'text-red-500' : 'text-amber-500'}`}>{h.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Send Button */}
              <button onClick={() => {
                const recipient = shareCustomContact || shareContact;
                if (!recipient) { showToast('Select a contact first', 'warning'); return; }
                setSending(true);
                setTimeout(() => {
                  setSending(false);
                  setSendSuccess(true);
                  const msg = generateReceiptMessage();
                  if (shareTab === 'whatsapp') {
                    window.open(`https://wa.me/${recipient.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                  } else if (shareTab === 'sms') {
                    window.open(`sms:${recipient}?body=${encodeURIComponent(msg)}`, '_blank');
                  } else {
                    window.open(`mailto:${recipient}?subject=${encodeURIComponent('Invoice from ABC Pharmacy')}&body=${encodeURIComponent(msg)}`, '_blank');
                  }
                  setCommHistory(prev => [...prev, { type: shareTab, recipient, status: 'sent', time: new Date() }]);
                  setTimeout(() => { setShowShareModal(false); setSendSuccess(false); }, 1500);
                }, 800);
              }} disabled={sending}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-[#0F9D8A] hover:bg-[#0D8A7A] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[52px]">
                {sending ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : sendSuccess ? <><CheckCircle className="w-5 h-5" /> Sent Successfully</> : <><ArrowRight className="w-5 h-5" /> Send Invoice</>}
              </button>
            </div>
        </GlobalModal>
      )}

      {/* ─── CUSTOMER MODAL ─── */}
      {showCustomerModal && (
        <GlobalModal
          onClose={() => setShowCustomerModal(false)}
          title="Select Customer"
          subtitle="Choose who this sale belongs to"
          icon={<Users className="w-5 h-5" />}
          size="sm"
          hideFooter
        >
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name or phone..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} autoFocus className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl text-sm focus:outline-none focus:border-[#0F9D8A] focus:shadow-[0_0_0_3px_rgba(15,157,138,0.1)]" />
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            <button onClick={() => { setCustomer({ name: 'Walk-in Customer' }); setShowCustomerModal(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1E1E1E] transition-all text-left">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Walk-in Customer</span>
            </button>
            {filteredCustomers.map((c, i) => (
              <button key={i} onClick={() => { setCustomer(c); setShowCustomerModal(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1E1E1E] transition-all text-left">
                <div className="w-8 h-8 rounded-full bg-[#0F9D8A]/10 flex items-center justify-center"><User className="w-3.5 h-3.5 text-[#0F9D8A]" /></div>
                <div><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</p>{c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}</div>
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#2A2A2A]">
            <button className="flex items-center gap-2 text-sm font-medium text-[#0F9D8A] hover:text-teal-700">
              <Plus className="w-4 h-4" /> Add New Customer
            </button>
          </div>
        </GlobalModal>
      )}

      {/* ─── PAYMENT MODAL ─── */}
      {showPaymentModal && (
        <GlobalModal
          onClose={() => setShowPaymentModal(false)}
          title="Confirm Payment"
          subtitle="Verify the amount before completing the sale"
          icon={<CreditCard className="w-5 h-5" />}
          size="sm"
          hideFooter
        >
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-[#1E1E1E] rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Items</span><span className="font-medium">{cart.reduce((s, i) => s + i.quantity, 0)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="font-medium text-red-500">-{formatCurrency(totalDiscount)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Tax (5%)</span><span className="font-medium">+{formatCurrency(totalTax)}</span></div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 dark:border-[#2A2A2A]"><span>Grand Total</span><span className="text-lg text-[#0F9D8A]">{formatCurrency(grandTotal)}</span></div>
            </div>
            <div className="flex items-center gap-2">
              {['CASH', 'CARD', 'UPI', 'WALLET'].map(m => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all min-h-[44px] ${paymentMethod === m ? 'bg-[#0F9D8A] text-white border-[#0F9D8A]' : 'bg-white dark:bg-[#1E1E1E] text-gray-600 border-gray-200 dark:border-[#2A2A2A]'}`}>{m}</button>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Received Amount</label>
              <input type="number" placeholder="0.00" value={receivedAmt} onChange={e => setReceivedAmt(e.target.value)} autoFocus
                className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl text-sm focus:outline-none focus:border-[#0F9D8A] focus:shadow-[0_0_0_3px_rgba(15,157,138,0.1)]" />
              {Number(receivedAmt) > 0 && <p className="text-xs text-gray-500 mt-1.5">Balance: <strong className={balance >= 0 ? 'text-emerald-600' : 'text-red-500'}>{formatCurrency(balance)}</strong></p>}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2A2A2A] text-sm font-semibold text-gray-600 hover:bg-gray-50 min-h-[48px]">Cancel</button>
              <button onClick={handleCompleteSale} className="flex-1 px-4 py-3 rounded-xl bg-[#0F9D8A] text-white text-sm font-bold hover:bg-[#0D8A7A] min-h-[48px] flex items-center justify-center gap-2 shadow-sm">
                <CheckCheck className="w-4 h-4" /> Pay {formatCurrency(grandTotal)}
              </button>
            </div>
          </div>
        </GlobalModal>
      )}

      {/* ─── SUCCESS MODAL ─── */}
      {showSuccessModal && (
        <GlobalModal
          onClose={() => setShowSuccessModal(false)}
          title="Sale Completed!"
          subtitle="Transaction processed successfully"
          icon={<CheckCheck className="w-5 h-5" />}
          size="sm"
          hideFooter
        >
          <div className="text-center">
            {lastReceipt && (
              <div className="bg-gray-50 dark:bg-[#1E1E1E] rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-500 mb-0.5">Receipt</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 font-mono">{lastReceipt}</p>
              </div>
            )}
            <div className="bg-[#F0FDF9] dark:bg-[#0F3D39]/30 rounded-xl p-4 mb-6">
              <p className="text-2xl font-bold text-[#0F9D8A]">{formatCurrency(grandTotal)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Paid via {paymentMethod}</p>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2A2A2A] text-sm font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Print</button>
              <button onClick={() => { setShowSuccessModal(false); newBill(); }} className="flex-1 px-4 py-3 rounded-xl bg-[#0F9D8A] text-white text-sm font-bold hover:bg-[#0D8A7A]">New Sale</button>
            </div>
          </div>
        </GlobalModal>
      )}

      {/* ─── KEYBOARD SHORTCUTS HELP ─── */}
      {showSearchModal && (
        <GlobalModal
          onClose={() => setShowSearchModal(false)}
          title="Keyboard Shortcuts"
          subtitle="Speed up your workflow at the counter"
          icon={<Command className="w-5 h-5" />}
          size="md"
          hideFooter
        >
          <div className="grid grid-cols-2 gap-2">
            {[
              ['F1', 'Search'], ['F2', 'Customer'], ['F3', 'Discount'], ['F5', 'Complete Sale'],
              ['F8', 'New Bill'], ['ESC', 'Cancel'], ['Ctrl+K', 'Search'], ['Ctrl+B', 'Barcode'],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#1E1E1E]">
                <span className="text-sm text-gray-600 dark:text-gray-300">{desc}</span>
                <kbd className="text-xs font-mono bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#2A2A2A] px-2 py-0.5 rounded font-semibold text-gray-700 dark:text-gray-200">{key}</kbd>
              </div>
            ))}
          </div>
          <button onClick={() => setShowSearchModal(false)} className="w-full mt-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#232323] text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]">Close</button>
        </GlobalModal>
      )}
    </div>
  );
}

// ─── Product Card ───
function ProductCard({ product, cart, onAdd }: { product: POSProduct; cart: CartItem[]; onAdd: (p: POSProduct) => void }) {
  const inCart = cart.find(i => i.productId === product.id);
  const outOfStock = product.stockQuantity <= 0;
  const lowStock = product.stockQuantity > 0 && product.stockQuantity <= (product.lowStockQuantity || 10);
  const rx = product.prescriptionRequired;

  let expiryBadge: { label: string; cls: string } | null = null;
  if (product.expiryDate) {
    const daysLeft = Math.ceil((new Date(product.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) expiryBadge = { label: 'Expired', cls: 'text-red-600 bg-red-50 border-red-200' };
    else if (daysLeft < 30) expiryBadge = { label: `${daysLeft}d`, cls: 'text-red-600 bg-red-50 border-red-200' };
    else if (daysLeft < 90) expiryBadge = { label: `${daysLeft}d`, cls: 'text-amber-600 bg-amber-50 border-amber-200' };
  }

  const stockBarWidth = Math.min(100, (product.stockQuantity / Math.max(product.lowStockQuantity || 10, 1)) * 100);

  return (
    <button onClick={() => onAdd(product)} disabled={outOfStock}
      className={`relative text-left w-full h-[130px] p-3 rounded-2xl border transition-all duration-200 bg-white hover:shadow-md hover:-translate-y-0.5 border-l-[4px] ${
        inCart ? 'border-emerald-500 ring-1 ring-emerald-500/20 border-l-emerald-600' : outOfStock ? 'border-gray-100 opacity-60 cursor-not-allowed border-l-gray-300' : 'border-gray-200 hover:border-emerald-300 border-l-emerald-400'
      }`}>
      {inCart && <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center z-10 shadow-sm">{inCart.quantity}</span>}
      <div className="flex h-full gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center flex-shrink-0 border border-emerald-200/50 shadow-sm">
          <Pill className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[16px] font-semibold text-gray-900 truncate max-w-[160px] leading-tight">{product.name}</p>
              {rx && <span className="text-[10px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded">Rx</span>}
              {expiryBadge && <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${expiryBadge.cls}`}>{expiryBadge.label}</span>}
            </div>
            {product.genericName && <p className="text-[12px] text-gray-400 truncate leading-tight mt-0.5">{product.genericName}</p>}
          </div>
          <div className="flex items-end justify-between mt-auto">
            <div>
              <p className="text-[22px] font-bold text-gray-900 tracking-tight">{formatCurrency(product.price)}</p>
              {product.mrp && product.mrp > product.price && (
                <div className="flex items-center gap-1">
                  <p className="text-[11px] text-gray-400 line-through">{formatCurrency(product.mrp)}</p>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{Math.round((1 - product.price / product.mrp) * 100)}% off</span>
                </div>
              )}
            </div>
            <div className="text-right">
              {outOfStock ? (
                <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-lg">Out of Stock</span>
              ) : (
                <>
                  <div className="flex items-center justify-end gap-1 mb-1">
                    <span className={`text-[12px] font-semibold ${lowStock ? 'text-amber-600' : 'text-gray-700'}`}>{product.stockQuantity}</span>
                    <span className="text-[10px] text-gray-400">stock</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${lowStock ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${stockBarWidth}%` }} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Cart Row ───
function CartRow({ item, onUpdateQty, onRemove, onDiscount }: {
  item: CartItem; onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void; onDiscount: (id: string, pct: number) => void;
}) {
  const [showDisc, setShowDisc] = useState(false);
  const hasExpiry = item.expiryDate && item.expiryDate.length > 0;
  let expiryWarning: 'none' | 'orange' | 'red' = 'none';
  if (hasExpiry) {
    const daysLeft = Math.ceil((new Date(item.expiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) expiryWarning = 'red';
    else if (daysLeft < 30) expiryWarning = 'red';
    else if (daysLeft < 90) expiryWarning = 'orange';
  }
  return (
    <div className={`flex items-center h-[72px] px-4 hover:bg-gray-50 transition-colors ${expiryWarning === 'red' ? 'bg-red-50/50' : expiryWarning === 'orange' ? 'bg-amber-50/30' : ''}`}>
      {/* Medicine info */}
      <div className="flex-[2] min-w-0 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
          <Pill className="w-[18px] h-[18px] text-gray-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[15px] font-semibold text-gray-900 truncate max-w-[200px]">{item.productName}</p>
            {item.prescriptionRequired && <span className="shrink-0 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Rx</span>}
            {expiryWarning !== 'none' && (
              <span className={`text-[10px] font-medium ${expiryWarning === 'red' ? 'text-red-500' : 'text-amber-600'}`}>
                {expiryWarning === 'red' ? 'Expired' : 'Expiring'}
              </span>
            )}
          </div>
          {item.genericName && <p className="text-[12px] text-gray-400 truncate">{item.genericName}</p>}
        </div>
      </div>
      {/* Batch */}
      <div className="w-20 text-center">
        <span className="text-[13px] font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg">{item.batchNumber || '-'}</span>
      </div>
      {/* Expiry */}
      <div className="w-16 text-center">
        <span className="text-[13px] text-gray-500">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }) : '-'}</span>
      </div>
      {/* Qty controls */}
      <div className="w-24 flex items-center justify-center gap-1">
        <button onClick={() => onUpdateQty(item.id, item.quantity - 1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"><Minus className="w-3.5 h-3.5" /></button>
        <input type="number" value={item.quantity} min={1}
          onChange={e => onUpdateQty(item.id, Math.max(1, parseInt(e.target.value) || 1))}
          className="w-10 text-center text-[15px] font-bold text-gray-900 border-0 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
        <button onClick={() => onUpdateQty(item.id, item.quantity + 1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"><Plus className="w-3.5 h-3.5" /></button>
      </div>
      {/* Price */}
      <div className="w-24 text-right">
        <span className="text-[15px] font-semibold text-gray-900">{formatCurrency(item.unitPrice)}</span>
      </div>
      {/* Discount */}
      <div className="w-16 flex justify-center">
        <button onClick={() => setShowDisc(!showDisc)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all ${item.discountPct > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'text-gray-400 hover:bg-gray-100 border border-transparent hover:border-gray-200'}`}>
          <Percent className="w-4 h-4" />
        </button>
      </div>
      {/* Amount */}
      <div className="w-24 text-right">
        <span className="text-[15px] font-bold text-gray-900">{formatCurrency(item.totalPrice)}</span>
      </div>
      {/* Remove */}
      <div className="w-10 flex justify-center">
        <button onClick={() => onRemove(item.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}