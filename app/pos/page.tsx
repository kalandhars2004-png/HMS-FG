'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Minus, Trash2, User, Printer, X, ScanLine,
  ShoppingCart, LayoutDashboard, FileText, BarChart3, ClipboardList,
  ClipboardPen, Pause, ArrowRight, Banknote, CreditCard, QrCode,
  Copy, TicketPercent, Percent, Clock, RefreshCw, FileSpreadsheet,
  CheckCheck, SortAsc, Pill, AlertCircle, CircleDollarSign,
  CircleEqual, Sun, Moon, Calculator, Settings, Bell, ChevronDown,
  LogOut, Scan, Image, Droplet, Camera
} from '@/components/ui/LucideIcon';
import { UsersAPI, ProductsAPI, CategoriesAPI } from '@/lib/api';
import Link from 'next/link';

interface BillingItem {
  id: string;
  itemCode: string;
  productName: string;
  productImage?: string;
  qty: number;
  mrp: number;
  discount: number;
  addDisc: number;
  unitCost: number;
  netAmount: number;
  sku: string;
  tax: number;
}

interface PaymentEntry {
  id: string;
  method: string;
  amount: number;
  account?: string;
  upiId?: string;
}

interface POSProduct {
  id: string;
  code: string;
  name: string;
  mrp: number;
  stock: number;
  image: string;
  category?: string;
  unit?: string;
  rx?: boolean;
}

interface POSCustomer {
  id: string;
  name: string;
  phone: string;
  address: string;
}

const MEDICINE_ICONS = [
  '\u{1F48A}', '\u{1F3E5}', '\u{2695}\uFE0F', '\u{1F9EC}',
  '\u{1F9EB}', '\u{1F48A}', '\u{1F3E5}', '\u{1F9EF}',
  '\u{1F48A}', '\u{2695}\uFE0F', '\u{1F9EC}', '\u{1F9EB}',
];

const MOCK_MEDICINES: POSProduct[] = [
  { id: '1', code: 'CET-10', name: 'Cetirizine 10', mrp: 15.50, stock: 120, image: '\u{1F48A}', unit: 'Strip of 30 Tablets', rx: true, category: 'Allergy' },
  { id: '2', code: 'ASP-500', name: 'Asprin 500', mrp: 12.75, stock: 80, image: '\u{1F48A}', unit: 'Strip of 15 Tablets', rx: false, category: 'Pain Relief' },
  { id: '3', code: 'ACT-500', name: 'Acetaminophen 500', mrp: 7.29, stock: 3, image: '\u{1F48A}', unit: 'Strip of 10 Tablets', rx: false, category: 'Pain Relief' },
  { id: '4', code: 'CFS-GL', name: 'Cofsils Gargle', mrp: 14.99, stock: 80, image: '\u{1F48A}', unit: 'Bottle of 200ml', rx: true, category: 'Cough & Cold' },
  { id: '5', code: 'IBU-200', name: 'Ibuprofen 200', mrp: 9.99, stock: 150, image: '\u{1F48A}', unit: 'Strip of 15 Tablets', rx: true, category: 'Pain Relief' },
  { id: '6', code: 'AMX-500', name: 'Amoxicillin 500', mrp: 18.50, stock: 60, image: '\u{1F48A}', unit: 'Capsules 10s', rx: true, category: 'Antibiotics' },
  { id: '7', code: 'VIT-C', name: 'Vitamin C 1000', mrp: 11.25, stock: 0, image: '\u{1F48A}', unit: 'Bottle of 60 Tablets', rx: false, category: 'Supplements' },
  { id: '8', code: 'OMZ-20', name: 'Omeprazole 20', mrp: 8.99, stock: 95, image: '\u{1F48A}', unit: 'Capsules 15s', rx: true, category: 'Gastric' },
  { id: '9', code: 'LRT-10', name: 'Loratadine 10', mrp: 6.50, stock: 110, image: '\u{1F48A}', unit: 'Strip of 10 Tablets', rx: false, category: 'Allergy' },
  { id: '10', code: 'MTF-500', name: 'Metformin 500', mrp: 5.99, stock: 200, image: '\u{1F48A}', unit: 'Strip of 20 Tablets', rx: true, category: 'Diabetes' },
  { id: '11', code: 'AZM-250', name: 'Azithromycin 250', mrp: 22.00, stock: 45, image: '\u{1F48A}', unit: 'Tablets 6s', rx: true, category: 'Antibiotics' },
  { id: '12', code: 'CRB-200', name: 'Carbamazepine 200', mrp: 16.75, stock: 35, image: '\u{1F48A}', unit: 'Strip of 10 Tablets', rx: true, category: 'Neurology' },
  { id: '13', code: 'ATR-10', name: 'Atorvastatin 10', mrp: 19.25, stock: 75, image: '\u{1F48A}', unit: 'Strip of 15 Tablets', rx: true, category: 'Cardiac' },
  { id: '14', code: 'DCL-50', name: 'Diclofenac 50', mrp: 8.50, stock: 90, image: '\u{1F48A}', unit: 'Strip of 10 Tablets', rx: true, category: 'Pain Relief' },
  { id: '15', code: 'PNT-40', name: 'Pantoprazole 40', mrp: 10.99, stock: 65, image: '\u{1F48A}', unit: 'Strip of 10 Tablets', rx: true, category: 'Gastric' },
  { id: '16', code: 'AML-5', name: 'Amlodipine 5', mrp: 7.75, stock: 130, image: '\u{1F48A}', unit: 'Strip of 15 Tablets', rx: true, category: 'Cardiac' },
];

export default function POSPage() {
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showThermalPrint, setShowThermalPrint] = useState(false);
  const [showOnholdOrders, setShowOnholdOrders] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showTodaySale, setShowTodaySale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<POSCustomer[]>([]);
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('full');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);
  const [flatDiscount, setFlatDiscount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [selectedStore, setSelectedStore] = useState('Newyork');
  const [darkMode, setDarkMode] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '',
    city: '', state: '', country: 'USA', postalCode: '', image: null as string | null,
  });
  const [completedTransaction, setCompletedTransaction] = useState<{
    items: BillingItem[]; totals: any; amount: number; date: string; invoiceNo: string;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, productsRes] = await Promise.all([
          UsersAPI.getAll(),
          ProductsAPI.getAll(),
        ]);
        setCustomers((usersRes.data || []).map((u: any) => ({
          id: u.id?.toString(), name: u.username || u.email || '',
          phone: u.phone || '', address: u.address || '',
        })));
        const mappedProducts = (productsRes.data || []).map((p: any) => ({
          id: p.id?.toString(), code: p.sku || p.itemBarcode || '',
          name: p.name || '', mrp: p.price || 0, stock: p.quantity || 0,
          image: '\u{1F48A}', category: p.category?.name || p.category || 'General',
          unit: p.unit || '', rx: false,
        }));
        if (mappedProducts.length === 0) {
          setProducts(MOCK_MEDICINES);
          const cats = Array.from(new Set(MOCK_MEDICINES.map(p => p.category).filter(Boolean))) as string[];
          setCategories(cats);
        } else {
          setProducts(mappedProducts);
          const cats = Array.from(new Set(mappedProducts.map((p: any) => p.category).filter(Boolean))) as string[];
          setCategories(cats);
        }
      } catch {
        setProducts(MOCK_MEDICINES);
        const cats = Array.from(new Set(MOCK_MEDICINES.map(p => p.category).filter(Boolean))) as string[];
        setCategories(cats);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const addItem = (product: POSProduct) => {
    setBillingItems(prev => {
      const existing = prev.find(i => i.itemCode === product.code);
      if (existing) {
        return prev.map(i => {
          if (i.id === existing.id) {
            const uc = i.mrp - i.discount - i.addDisc;
            return { ...i, qty: i.qty + 1, unitCost: uc, netAmount: uc * (i.qty + 1) };
          }
          return i;
        });
      }
      return [...prev, {
        id: Date.now().toString(), itemCode: product.code,
        productName: product.name, productImage: product.image,
        qty: 1, mrp: product.mrp, discount: 0, addDisc: 0,
        unitCost: product.mrp, netAmount: product.mrp,
        sku: product.code, tax: 0,
      }];
    });
  };

  const updateItemQty = (id: string, newQty: number) => {
    if (newQty < 1) { removeItem(id); return; }
    setBillingItems(prev => prev.map(i => {
      if (i.id === id) {
        const uc = i.mrp - i.discount - i.addDisc;
        return { ...i, qty: newQty, unitCost: uc, netAmount: uc * newQty };
      }
      return i;
    }));
  };

  const removeItem = (id: string) => {
    setBillingItems(prev => prev.filter(i => i.id !== id));
  };

  const calculateTotals = () => {
    const quantity = billingItems.reduce((s, i) => s + i.qty, 0);
    const mrpTotal = billingItems.reduce((s, i) => s + (i.mrp * i.qty), 0);
    const discountTotal = billingItems.reduce((s, i) => s + i.discount * i.qty, 0);
    const subTotal = billingItems.reduce((s, i) => s + i.netAmount, 0);
    const taxAmount = subTotal * 0.05;
    const discount = discountTotal + (subTotal * discountPercent / 100) + flatDiscount;
    return { quantity, subTotal, mrp: mrpTotal, taxAmount, discount, flatDiscount, roundOff: 0, amount: subTotal + taxAmount - discount };
  };

  const totals = calculateTotals();

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (selectedCategory !== 'all') filtered = filtered.filter(p => p.category === selectedCategory);
    if (searchQuery.length > 0) filtered = filtered.filter(p =>
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered;
  }, [products, searchQuery, selectedCategory]);

  const handlePlaceOrder = () => {
    if (billingItems.length === 0) return;
    setPaymentAmount('');
    setPaymentMethod('full');
    setOrderNotes('');
    setPaymentEntries([{ id: Date.now().toString(), method: 'Cash', amount: 0 }]);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = () => {
    const invoiceNo = 'ORD' + Math.floor(Math.random() * 1000000);
    setCompletedTransaction({
      items: [...billingItems], totals: { ...totals },
      amount: totals.amount, date: new Date().toLocaleDateString('en-GB'), invoiceNo,
    });
    setShowPaymentModal(false);
    setShowPaymentSuccess(true);
  };

  const addPaymentEntry = () => {
    setPaymentEntries(prev => [...prev, { id: Date.now().toString(), method: 'Cash', amount: 0 }]);
  };

  const updatePaymentEntry = (id: string, field: keyof PaymentEntry, value: any) => {
    setPaymentEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const removePaymentEntry = (id: string) => {
    setPaymentEntries(prev => prev.filter(e => e.id !== id));
  };

  const getTotalPaid = () => {
    if (paymentMethod === 'full') return parseFloat(paymentAmount) || 0;
    return paymentEntries.reduce((s, e) => s + e.amount, 0);
  };

  const getRemainingAmount = () => totals.amount - getTotalPaid();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fa' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm font-medium">Loading POS...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-content, #receipt-content * { visibility: visible; }
          #receipt-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none; }
        }
        .pos-page-body { background: #f5f5f7; }
        .pos-item { cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .pos-item:hover { border-color: #007AFF !important; box-shadow: 0 4px 16px rgba(0,122,255,0.12); }
        .pos-item.active { border-color: #007AFF !important; background: #f0f7ff; }
        .pos-item .stock-add { display: none; }
        .pos-item.active .stock-add { display: inline-flex; }
        .pos-item.active .stock-badge { display: none; }
        .pos-item .pos-add-indicator { opacity: 0; transform: scale(0.8); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .pos-item.active .pos-add-indicator { opacity: 1; transform: scale(1); }
        .quantity-control { display: inline-flex; align-items: center; border: 1px solid #e5e5e7; border-radius: 8px; overflow: hidden; background: white; }
        .quantity-control button { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; background: #f5f5f7; cursor: pointer; color: #1d1d1f; font-size: 14px; transition: background 0.15s ease; }
        .quantity-control button:hover { background: #e5e5e7; }
        .quantity-control input { width: 40px; text-align: center; border: none; border-left: 1px solid #e5e5e7; border-right: 1px solid #e5e5e7; height: 32px; font-size: 13px; outline: none; font-weight: 600; color: #1d1d1f; }
        .pos-table { max-height: calc(100vh - 420px); overflow-y: auto; }
        .pos-table::-webkit-scrollbar { width: 4px; }
        .pos-table::-webkit-scrollbar-thumb { background: #e5e5e7; border-radius: 4px; }
        .pos-table::-webkit-scrollbar-track { background: transparent; }
        .pos-table table th { font-size: 11px; font-weight: 600; color: #86868b; text-transform: uppercase; letter-spacing: 0.04em; background: #fafafa; padding: 10px 14px; white-space: nowrap; border-bottom: 1px solid #e5e5e7; }
        .pos-table table td { padding: 8px 14px; font-size: 13px; vertical-align: middle; border-bottom: 1px solid #f0f0f2; }
        .category-scroll { overflow-x: auto; white-space: nowrap; flex-wrap: nowrap; }
        .category-scroll::-webkit-scrollbar { height: 2px; }
        .category-scroll::-webkit-scrollbar-thumb { background: #e5e5e7; border-radius: 4px; }
        .product-grid { max-height: calc(100vh - 280px); overflow-y: auto; }
        .product-grid::-webkit-scrollbar { width: 3px; }
        .product-grid::-webkit-scrollbar-thumb { background: #e5e5e7; border-radius: 4px; }
        .animate-ring { animation: ring 2s ease-in-out infinite; }
        @keyframes ring { 0% { transform: rotate(0); } 10% { transform: rotate(12deg); } 20% { transform: rotate(-12deg); } 30% { transform: rotate(8deg); } 40% { transform: rotate(-8deg); } 50% { transform: rotate(4deg); } 60%,100% { transform: rotate(0); } }
        .glass-effect { background: rgba(255,255,255,0.72); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .dark-mode .pos-page-body { background: #1d1d1f !important; }
        .dark-mode .glass-effect { background: rgba(30,30,32,0.8); }
        .dark-mode .bg-white { background: #2c2c2e !important; }
        .dark-mode .text-gray-900 { color: #f5f5f7 !important; }
        .dark-mode .text-gray-800 { color: #e5e5e7 !important; }
        .dark-mode .text-gray-700 { color: #a1a1a6 !important; }
        .dark-mode .text-gray-500 { color: #86868b !important; }
        .dark-mode .text-gray-600 { color: #a1a1a6 !important; }
        .dark-mode .text-gray-400 { color: #636366 !important; }
        .dark-mode .border-gray-200 { border-color: #38383a !important; }
        .dark-mode .border-gray-100 { border-color: #333336 !important; }
        .dark-mode .bg-gray-50 { background: #2c2c2e !important; }
        .dark-mode .bg-gray-100 { background: #38383a !important; }
        .dark-mode .hover\\:bg-gray-50:hover { background: #38383a !important; }
        .dark-mode .hover\\:bg-gray-100:hover { background: #3a3a3c !important; }
        .macos-card { background: rgba(255,255,255,0.95); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border: 0.5px solid rgba(0,0,0,0.06); }
        .dark-mode .macos-card { background: rgba(44,44,46,0.95); border: 0.5px solid rgba(255,255,255,0.06); }
        .macos-shadow { box-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.03); }
        .macos-shadow-lg { box-shadow: 0 4px 24px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.04); }
      `}</style>

      <div className={`pos-page-body min-h-screen flex flex-col ${darkMode ? 'dark-mode' : ''}`}>

        {/* ======================== HEADER ======================== */}
        <header className="glass-effect border-b border-gray-200/60 px-3 lg:px-5 py-2.5 flex items-center justify-between sticky top-0 z-40 no-print macos-shadow">
          <div className="flex items-center gap-2 lg:gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-200">
                <Pill className="w-4 h-4" />
              </div>
              <span className="font-bold text-gray-900 text-base hidden sm:inline">Inventory</span>
            </Link>
            <div className="h-6 w-px bg-gray-200 hidden lg:block"></div>
            <div className="dropdown hidden xl:flex items-center">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 border border-gray-200 transition-colors">
                <span className="text-base">{'\u{1F3F0}'}</span>
                {selectedStore}
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
            <div className="hidden xl:flex items-center gap-1.5 ml-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-amber-200/50">
                <span className="text-xs">{'\u{1F4B0}'}</span>
                Today&apos;s Sale: <span className="font-bold">₹1,245.50</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200/50">
                <Clock className="w-3 h-3" />
                Shift A &middot; 09:00 - 17:00
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 lg:gap-2">
            <button className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Cash Book</span>
            </button>
            <button className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Recent Bills</span>
            </button>

            <button className="hidden lg:inline-flex p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors" title="Calculator">
              <Calculator className="w-4 h-4" />
            </button>

            <button onClick={() => setDarkMode(!darkMode)} className="hidden lg:inline-flex p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors" title="Toggle Theme">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="header-item hidden lg:flex">
              <button className="relative p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                <Bell className="w-4 h-4 animate-ring" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            </div>

            <button className="hidden lg:inline-flex p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors" title="Settings">
              <Settings className="w-4 h-4" />
            </button>

            <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">A</div>
              <div className="hidden md:block text-xs leading-tight">
                <p className="font-medium text-gray-900">Admin</p>
                <p className="text-gray-500 text-[10px]">Administrator</p>
              </div>
              <ChevronDown className="w-3 h-3 text-gray-400 hidden md:block" />
            </div>
          </div>
        </header>

        {/* ======================== MAIN CONTENT ======================== */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 grid grid-cols-12 gap-0">

            {/* ========== LEFT COLUMN - Products ========== */}
            <div className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col bg-white border-r border-gray-200/60">
              <div className="p-3 bg-white border-b border-gray-100/60">
                <div className="relative mb-2">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-gray-50">
                    <div className="px-3 text-gray-400"><Search className="w-4 h-4" /></div>
                    <input type="text" placeholder="Search or scan item..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 px-2 py-2 text-sm outline-none bg-transparent"
                    />
                    <div className="px-3 text-gray-600 cursor-pointer hover:text-blue-600 transition-colors">
                      <Scan className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/medicines/create"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium">
                    <Plus className="w-3.5 h-3.5" />Add Item
                  </Link>
                  <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium">
                    <SortAsc className="w-3.5 h-3.5" />Sort
                  </button>
                </div>
              </div>

              <div className="product-grid flex-1 px-3 pb-3 pt-3">
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredProducts.map((product) => {
                    const isInCart = billingItems.some(i => i.itemCode === product.code);
                    return (
                      <div key={product.id} onClick={() => addItem(product)}
                        className={`macos-card rounded-xl p-2.5 pos-item macos-shadow ${isInCart ? 'active border-[#007AFF]' : 'border-[rgba(0,0,0,0.04)]'}`}
                        style={{ borderWidth: isInCart ? 1.5 : 0.5 }}
                      >
                        <div className="bg-[#f5f5f7] rounded-xl p-2.5 flex items-center justify-center mb-2.5 h-20 relative overflow-hidden">
                          <div className={`absolute inset-0 bg-gradient-to-br ${isInCart ? 'from-[#007AFF]/5 to-transparent' : 'from-transparent to-transparent'}`}></div>
                          <span className="text-4xl relative z-10">{product.image}</span>
                          <span className={`absolute top-1.5 right-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${product.rx ? 'bg-[#FFF2E0] text-[#C93400] border-[#FFD6B3]' : 'bg-[#E8F5E9] text-[#2E7D32] border-[#B8E0B9]'}`}>
                            {product.rx ? 'Rx' : 'OTC'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#1d1d1f] truncate">{product.name}</p>
                        <p className="text-[10px] text-[#86868b] truncate mb-1.5 leading-tight">{product.unit || 'Unit'}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-[#1d1d1f]">₹{product.mrp.toFixed(2)}</p>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold transition-all ${isInCart ? 'bg-[#007AFF]/10 text-[#007AFF] pos-add-indicator' : product.stock === 0 ? 'bg-[#FFE5E5] text-[#D70015]' : product.stock > 10 ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFF2E0] text-[#C93400]'}`}>
                            {isInCart ? <CheckCheck className="w-2.5 h-2.5" /> : null}
                            {isInCart ? 'Added' : product.stock === 0 ? 'Out' : `${product.stock}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <div className="col-span-2 text-center py-14 text-[#86868b]">
                      <div className="w-14 h-14 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mx-auto mb-3">
                        <Pill className="w-7 h-7 opacity-40" />
                      </div>
                      <p className="text-sm font-medium text-[#1d1d1f]">No products found</p>
                      <p className="text-xs text-[#86868b]">Try a different search term</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200/60 p-2.5 bg-white">
                <div className="category-scroll flex gap-1.5 px-0.5">
                  <button onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === 'all' ? 'bg-[#1d1d1f] text-white shadow-sm' : 'bg-[#f5f5f7] text-[#86868b] hover:bg-[#e5e5e7]'
                    }`}>All</button>
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        selectedCategory === cat ? 'bg-[#1d1d1f] text-white shadow-sm' : 'bg-[#f5f5f7] text-[#86868b] hover:bg-[#e5e5e7]'
                      }`}>{cat}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* ========== MIDDLE COLUMN - Cart ========== */}
            <div className="col-span-12 lg:col-span-5 xl:col-span-6 flex flex-col bg-[#fafafa]">
              <div className="flex items-center justify-between flex-wrap gap-2 p-3.5 bg-white border-b border-gray-200/60">
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                    Active Cart
                    <span className="text-xs font-normal text-gray-400">#ORD{Math.floor(Math.random() * 10000)}</span>
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">Items: {billingItems.length}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <User className="w-3 h-3" />{customerName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center flex-wrap gap-1.5">
                  <button onClick={() => setShowOnholdOrders(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium">
                    <ClipboardList className="w-3.5 h-3.5" />On Hold
                  </button>
                  <button onClick={() => setBillingItems([])}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors font-medium">
                    <Trash2 className="w-3.5 h-3.5" />Clear All
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-white pos-table">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="w-10"></th>
                      <th>Item</th>
                      <th className="text-center">Price</th>
                      <th className="text-center">Qty</th>
                      <th className="text-center">Disc</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-gray-400">
                          <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-50" />
                          <p className="text-sm font-medium">No items added</p>
                          <p className="text-xs">Search and select products from the left panel</p>
                        </td>
                      </tr>
                    ) : (
                      billingItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td>
                            <button onClick={() => removeItem(item.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                          <td>
                            <p className="font-semibold text-gray-900 text-sm">{item.productName}</p>
                            <p className="text-[10px] text-gray-400 font-medium">SKU: {item.sku}</p>
                          </td>
                          <td className="text-center">
                            <span className="text-sm font-medium text-gray-800">₹{item.mrp.toFixed(2)}</span>
                          </td>
                          <td className="text-center">
                            <div className="quantity-control">
                              <button type="button" onClick={() => updateItemQty(item.id, item.qty - 1)}>
                                <Minus className="w-3 h-3" />
                              </button>
                              <input type="text" value={item.qty}
                                onChange={(e) => updateItemQty(item.id, parseInt(e.target.value) || 0)}
                                aria-label="Quantity" />
                              <button type="button" onClick={() => updateItemQty(item.id, item.qty + 1)}>
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="text-center text-sm font-medium text-gray-600">₹{item.discount.toFixed(2)}</td>
                          <td className="text-right font-bold text-gray-900 text-sm">₹{item.netAmount.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-white border-t border-gray-200/60 p-3.5 lg:p-4">
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#86868b]">Sub Total</span>
                    <span className="font-semibold text-[#1d1d1f]">₹{totals.subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#86868b]">Tax (5%)</span>
                    <span className="font-semibold text-[#1d1d1f]">₹{totals.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-[#86868b]">
                      Discount
                      <button onClick={() => setShowDiscountModal(true)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${totals.discount > 0 ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#f5f5f7] text-[#86868b] hover:bg-[#e5e5e7]'}`}>
                        {totals.discount > 0 ? `${discountPercent > 0 ? discountPercent + '%' : '₹' + flatDiscount} Applied` : 'Add'}
                        {totals.discount > 0 && <X className="w-2.5 h-2.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); setFlatDiscount(0); setDiscountPercent(0); }} />}
                      </button>
                    </span>
                    <span className="font-semibold text-[#C93400]">-₹{totals.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-[#86868b]">
                      Coupon
                      <button onClick={() => setShowCouponModal(true)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f5f5f7] text-[#86868b] rounded-full text-[10px] font-medium hover:bg-[#e5e5e7] transition-colors">
                        {couponCode || 'Add'}
                      </button>
                    </span>
                    <span className="font-semibold text-[#C93400]">₹0.00</span>
                  </div>
                </div>
                <div className="flex justify-between text-base font-bold text-[#1d1d1f] pt-3 border-t border-gray-200/60">
                  <span>Total Amount</span>
                  <span>₹{totals.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* ========== RIGHT COLUMN - Actions ========== */}
            <div className="col-span-12 lg:col-span-3 flex flex-col bg-white border-l border-gray-200/60">
              <div className="p-3.5 bg-white">
                <button onClick={() => setShowScanModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white rounded-xl text-sm font-semibold hover:from-[#0066CC] hover:to-[#4A4AC7] transition-all shadow-lg shadow-[#007AFF]/20 mb-2.5 active:scale-[0.98]">
                  <Scan className="w-4 h-4" />AI Scan Rx
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowOnholdOrders(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#e5e5e7] rounded-xl text-sm text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all font-medium active:scale-[0.98]">
                    <Pause className="w-3.5 h-3.5" />Hold Order
                  </button>
                  <button onClick={() => setShowPrintModal(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#e5e5e7] rounded-xl text-sm text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all font-medium active:scale-[0.98]">
                    <Printer className="w-3.5 h-3.5" />Print
                  </button>
                </div>
              </div>

              <div className="flex-1 p-3.5">
                <p className="text-[10px] font-semibold text-[#86868b] mb-2.5 uppercase tracking-[0.08em]">Customer Profile</p>
                <div className="flex items-center gap-2 mb-3">
                  <select value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-[#e5e5e7] rounded-xl outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 bg-white transition-all text-[#1d1d1f]">
                    <option>Walk-in Customer</option>
                    {customers.map((c) => (<option key={c.id} value={c.name}>{c.name}</option>))}
                  </select>
                  <button onClick={() => setShowCustomerModal(true)}
                    className="p-2 bg-white border border-[#e5e5e7] rounded-xl text-[#86868b] hover:bg-[#f5f5f7] hover:border-[#c7c7cc] transition-all flex-shrink-0 active:scale-[0.95]">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="mb-3">
                  <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#e5e5e7] rounded-xl outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 bg-white transition-all text-[#1d1d1f]">
                    <option value="">Select Doctor</option>
                    {['Dr. Michael Anderson', 'Dr. Emily Thompson', 'Dr. David Wilson', 'Dr. Sophia Martinez', 'Dr. James Carter'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <input type="text" placeholder="Phone Number (Optional)"
                    value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#e5e5e7] rounded-xl outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all placeholder:text-[#a1a1a6]" />
                </div>

                <div className="mt-4 pt-4 border-t border-[#e5e5e7]/60">
                  <p className="text-[10px] font-semibold text-[#86868b] mb-2.5 uppercase tracking-[0.08em]">Order Summary</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-[#86868b]">Items</span><span className="font-semibold text-[#1d1d1f]">{totals.quantity}</span></div>
                    <div className="flex justify-between"><span className="text-[#86868b]">Sub Total</span><span className="font-semibold text-[#1d1d1f]">₹{totals.subTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-[#86868b]">Tax</span><span className="font-semibold text-[#1d1d1f]">₹{totals.taxAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between text-base font-bold text-[#1d1d1f] pt-2 border-t border-[#e5e5e7]/60">
                      <span>Total</span>
                      <span>₹{totals.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-white border-t border-[#e5e5e7]/60">
                <button onClick={handlePlaceOrder} disabled={billingItems.length === 0}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    billingItems.length > 0
                      ? 'bg-[#007AFF] text-white hover:bg-[#0066CC] shadow-lg shadow-[#007AFF]/20 active:scale-[0.98]'
                      : 'bg-[#f5f5f7] text-[#c7c7cc] cursor-not-allowed'
                  }`}>
                  Place Order <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ======================== BOTTOM FOOTER ======================== */}
        <div className="glass-effect border-t border-gray-200/60 hidden md:block no-print">
          <div className="grid grid-cols-6">
            {[
              { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
              { icon: ShoppingCart, label: 'POS', href: '/pos', active: true },
              { icon: FileText, label: 'Invoices', href: '/sales/invoices' },
              { icon: BarChart3, label: 'Sales', href: '/reports/sales' },
              { icon: ClipboardPen, label: 'Prescriptions', href: '/work-orders' },
              { icon: RefreshCw, label: 'Sales Return', href: '/sales/returns' },
            ].map((item, idx) => (
              <Link key={idx} href={item.href}
                className={`flex flex-col items-center py-2.5 text-[#86868b] hover:text-[#007AFF] border-r border-gray-200/60 last:border-r-0 relative transition-all ${item.active ? 'text-[#007AFF]' : ''}`}>
                <item.icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.active && <div className="absolute inset-0 bg-[#007AFF]/5 rounded pointer-events-none" />}
              </Link>
            ))}
          </div>
        </div>

        {/* ======================== MODALS ======================== */}

        {/* Add Customer Modal */}
        {showCustomerModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCustomerModal(false)}>
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs"><User className="w-3.5 h-3.5" /></span>
                  Create New Customer
                </h4>
                <button onClick={() => setShowCustomerModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {newCustomer.image ? <img src={newCustomer.image} alt="" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-gray-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Upload Photo</p>
                    <p className="text-xs text-gray-500 mb-2">Image should be below 2MB</p>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" />Change Image
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) { const r = new FileReader(); r.onloadend = () => setNewCustomer(prev => ({ ...prev, image: r.result as string })); r.readAsDataURL(file); }
                        }} />
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'First Name', field: 'firstName' as const, required: true },
                    { label: 'Last Name', field: 'lastName' as const, required: true },
                    { label: 'Email', field: 'email' as const, type: 'email', required: true },
                    { label: 'Phone', field: 'phone' as const, type: 'tel', required: true },
                    { label: 'City', field: 'city' as const },
                    { label: 'State', field: 'state' as const },
                    { label: 'Country', field: 'country' as const },
                    { label: 'Postal Code', field: 'postalCode' as const },
                  ].map((f) => (
                    <div key={f.field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                      <input type={f.type || 'text'} value={newCustomer[f.field]}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, [f.field]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input type="text" value={newCustomer.address}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowCustomerModal(false)}
                    className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Cancel</button>
                  <button onClick={() => {
                    if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.email || !newCustomer.phone) {
                      alert('Please fill required fields!'); return;
                    }
                    setCustomerName(`${newCustomer.firstName} ${newCustomer.lastName}`);
                    setShowCustomerModal(false);
                  }}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Save</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">Collect Payment</h4>
                <span className="text-xs text-orange-500 font-semibold bg-orange-50 px-2 py-1 rounded">#ORD{Math.floor(Math.random() * 10000)}</span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { id: 'full', icon: CircleDollarSign, label: 'Full Payment' },
                    { id: 'split', icon: CircleEqual, label: 'Split Payment' },
                  ].map((opt) => (
                    <label key={opt.id}
                      className={`flex flex-col items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === opt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="payment-method" checked={paymentMethod === opt.id}
                        onChange={() => setPaymentMethod(opt.id)} className="sr-only" />
                      <opt.icon className={`w-6 h-6 mb-1 ${paymentMethod === opt.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${paymentMethod === opt.id ? 'text-blue-600' : 'text-gray-600'}`}>{opt.label}</span>
                    </label>
                  ))}
                </div>

                {paymentMethod === 'split' && (
                  <div className="mb-4">
                    <div className="space-y-3 mb-4">
                      {paymentEntries.map((entry) => (
                        <div key={entry.id} className="flex items-start gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex-1 space-y-2">
                            <input type="number" placeholder="Received Amount" value={entry.amount || ''}
                              onChange={(e) => updatePaymentEntry(entry.id, 'amount', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-all" />
                            <select value={entry.method}
                              onChange={(e) => updatePaymentEntry(entry.id, 'method', e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white transition-all">
                              <option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Card">Card</option><option value="Bank Transfer">Bank Transfer</option>
                            </select>
                          </div>
                          <button onClick={() => removePaymentEntry(entry.id)} className="p-1.5 text-gray-400 hover:text-red-500 mt-1"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                      <button onClick={addPaymentEntry}
                        className="w-full py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50 font-medium transition-colors">+ Add More Payment</button>
                    </div>
                    {paymentEntries.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3 space-y-1 mb-4">
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Total Paid:</span><span className="font-semibold text-gray-900">₹{getTotalPaid().toFixed(2)}</span></div>
                        <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1">
                          <span className={getRemainingAmount() > 0 ? 'text-red-600' : 'text-emerald-600'}>{getRemainingAmount() > 0 ? 'Remaining:' : 'Change:'}</span>
                          <span className={getRemainingAmount() > 0 ? 'text-red-600' : 'text-emerald-600'}>₹{Math.abs(getRemainingAmount()).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'full' && (
                  <>
                    <div className="mb-4">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label className="text-sm font-medium text-gray-700">Payment Amount <span className="text-red-500">*</span></label>
                        <p className="text-sm text-gray-500">Bill total: <span className="font-semibold text-gray-900">₹{totals.amount.toFixed(2)}</span></p>
                      </div>
                      <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="Enter amount" />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1 mb-4">
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Total Amount:</span><span className="font-bold text-gray-900">₹{totals.amount.toFixed(2)}</span></div>
                      {paymentAmount && parseFloat(paymentAmount) > 0 && (
                        <><div className="flex justify-between text-sm"><span className="text-gray-500">Received:</span><span className="font-semibold text-gray-900">₹{parseFloat(paymentAmount).toFixed(2)}</span></div>
                        <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1">
                          <span className={parseFloat(paymentAmount) >= totals.amount ? 'text-emerald-600' : 'text-red-600'}>{parseFloat(paymentAmount) >= totals.amount ? 'Change:' : 'Due:'}</span>
                          <span className={parseFloat(paymentAmount) >= totals.amount ? 'text-emerald-600' : 'text-red-600'}>₹{Math.abs(parseFloat(paymentAmount) - totals.amount).toFixed(2)}</span>
                        </div></>
                      )}
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Cancel</button>
                  <button onClick={handlePaymentComplete}
                    disabled={paymentMethod === 'full' && (!paymentAmount || parseFloat(paymentAmount) < totals.amount)}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      (!paymentAmount || parseFloat(paymentAmount) >= totals.amount || paymentMethod === 'split') && billingItems.length > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}>
                    <CheckCheck className="w-4 h-4" />Confirm Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Success Modal */}
        {showPaymentSuccess && completedTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentSuccess(false)}>
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-200">
                  <CheckCheck className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">Payment Successful!</h4>
                <p className="text-sm text-gray-500 mb-4">Order has been Successfully Completed</p>

                <div className="border border-gray-200 rounded-xl p-4 mb-4 text-left bg-gray-50">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="font-bold text-gray-900 text-base">₹{completedTransaction.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Date & Time</span>
                    <span className="font-medium text-gray-900">{completedTransaction.date} - {new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Invoice No.</span>
                    <span className="font-medium text-orange-500">#{completedTransaction.invoiceNo}</span>
                  </div>
                </div>

                <div className="overflow-x-auto mb-4 rounded-xl border border-gray-200">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2.5 text-xs font-semibold text-gray-600">#</th>
                        <th className="px-3 py-2.5 text-xs font-semibold text-gray-600">Item</th>
                        <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 text-center">Qty</th>
                        <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedTransaction.items.map((item, index) => (
                        <tr key={item.id} className="border-t border-gray-100">
                          <td className="px-3 py-2 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{item.productName}</td>
                          <td className="px-3 py-2 text-sm text-center text-gray-600">{item.qty}</td>
                          <td className="px-3 py-2 text-sm font-medium text-right text-gray-900">₹{item.netAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left space-y-1.5">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Sub Total</span><span className="font-medium text-gray-900">₹{completedTransaction.totals.subTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span className="font-medium text-gray-900">₹{completedTransaction.totals.taxAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="font-medium text-red-500">-₹{completedTransaction.totals.discount.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1.5 mt-1.5"><span>Total</span><span className="text-gray-900">₹{completedTransaction.amount.toFixed(2)}</span></div>
                </div>
              </div>
              <div className="border-t border-gray-200 p-4 flex gap-3">
                <button className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" />Print Invoice
                </button>
                <button onClick={() => { setBillingItems([]); setShowPaymentSuccess(false); setCompletedTransaction(null); }}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <CheckCheck className="w-4 h-4" />New Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discount Modal */}
        {showDiscountModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDiscountModal(false)}>
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs"><Percent className="w-3.5 h-3.5" /></span>
                  Add Discount
                </h4>
                <button onClick={() => setShowDiscountModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                  <div className="flex gap-3">
                    {[
                      { id: 'percent', label: 'Percentage (%)' },
                      { id: 'flat', label: 'Fixed Amount (₹)' },
                    ].map((opt) => (
                      <label key={opt.id}
                        className={`flex-1 flex items-center justify-center p-2.5 border-2 rounded-lg cursor-pointer transition-all text-sm font-medium ${opt.id === 'percent' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                        <input type="radio" name="discount-type" className="sr-only" checked={opt.id === 'percent'} readOnly />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
                    <input type="number" value={discountPercent || ''}
                      onChange={(e) => { setDiscountPercent(parseFloat(e.target.value) || 0); }}
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="0" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount Amount</span>
                    <span className="font-semibold text-orange-500">-₹{(totals.subTotal * discountPercent / 100).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowDiscountModal(false)} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Cancel</button>
                  <button onClick={() => setShowDiscountModal(false)} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Apply</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Coupon Modal */}
        {showCouponModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCouponModal(false)}>
            <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs"><TicketPercent className="w-3.5 h-3.5" /></span>
                  Available Coupons
                </h4>
                <button onClick={() => setShowCouponModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'REFILL REWARD', desc: 'Get ₹10 off', code: 'REFILL10', detail: 'Receive ₹10 off your next refill', color: 'bg-purple-600' },
                    { title: 'WELCOME BONUS', desc: '15% discount', code: 'WELCOME15', detail: 'Welcome discount for new customers', color: 'bg-blue-600' },
                    { title: 'BULK BUY BONUS', desc: 'Get ₹10 off', code: 'BULK10', detail: 'Enjoy ₹10 off on bulk purchases', color: 'bg-indigo-600' },
                    { title: 'SEASONAL SALE', desc: '20% discount', code: 'SEASON20', detail: 'Seasonal sale on all medicines', color: 'bg-pink-600' },
                  ].map((coupon) => (
                    <div key={coupon.code} className="border border-gray-200 rounded-xl overflow-hidden flex shadow-sm hover:shadow-md transition-shadow">
                      <div className={`${coupon.color} text-white p-3 flex items-center justify-center min-w-[90px]`}>
                        <p className="font-bold text-xs text-center leading-tight">{coupon.title}</p>
                      </div>
                      <div className="p-3 flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-1">{coupon.desc}</p>
                        <p className="text-xs text-gray-500 mb-2">{coupon.detail}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded">{coupon.code}</span>
                          <button onClick={() => { setCouponCode(coupon.code); setShowCouponModal(false); }}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            <Copy className="w-3 h-3" />Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scan Modal */}
        {showScanModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowScanModal(false)}>
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl text-center p-8" onClick={(e) => e.stopPropagation()}>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-lg">
                <Scan className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">AI Scan Prescription</h4>
              <p className="text-sm text-gray-500 mb-6">Place the prescription in front of the camera to scan and auto-add medicines</p>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 mb-6 bg-gray-50">
                <Camera className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">Camera preview will appear here</p>
              </div>
              <button onClick={() => setShowScanModal(false)}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Close</button>
            </div>
          </div>
        )}

        {/* Print Modal */}
        {showPrintModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPrintModal(false)}>
            <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-blue-600" />
                  Print Options
                </h4>
                <button onClick={() => setShowPrintModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'Thermal Receipt (80mm)', desc: 'Standard receipt printer', icon: Printer },
                  { label: 'A4 Invoice', desc: 'Full page invoice format', icon: FileText },
                  { label: 'Thermal Receipt (58mm)', desc: 'Small receipt printer', icon: Printer },
                ].map((opt) => (
                  <button key={opt.label}
                    className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-left">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <opt.icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
