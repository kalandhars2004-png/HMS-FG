'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Download, Printer, Edit, Package, Box, Calendar, Clock, AlertTriangle,
  Truck, MapPin, QrCode, FileText, Info, Shield, Award, Mail, Phone,
  Hash, Layers, Warehouse, Ruler, IndianRupee, ChevronRight,
  Barcode, Tag, RefreshCw, Users, TrendingUp, TrendingDown,
  Archive, Plus, FileSpreadsheet, FileImage,
} from '@/components/ui/LucideIcon';
import { CATEGORY_ICONS } from '@/lib/constants';
import { ProductsAPI } from '@/lib/api';

interface BatchEntry {
  batchNo: string;
  rackNo: string;
  purchaseDate: string;
  expiryDate: string;
  qtyReceived: number;
  qtySold: number;
  qtyAvailable: number;
  supplier: { name: string; avatar: string };
  status: 'Active' | 'Near Expiry' | 'Expired';
}

const SUPPLIERS = ['MedLife Distributors', 'PharmaCare Wholesale', 'HealthFirst Logistics', 'MediSync Supplies', 'CureWell Traders', 'VitalCare Solutions'];
const AVATARS = ['BM', 'SW', 'CD', 'TH', 'EC', 'PE'];

const generateBatches = (productId: string): BatchEntry[] => {
  const baseDate = new Date(2026, 3, 20);
  const statuses: BatchEntry['status'][] = ['Active', 'Active', 'Active', 'Active', 'Near Expiry', 'Expired'];
  return statuses.map((status, i) => {
    const dayOffset = i * 10;
    const d = new Date(baseDate);
    d.setDate(d.getDate() - dayOffset);
    const expiry = new Date(d);
    expiry.setFullYear(expiry.getFullYear() + (status === 'Expired' ? 0 : status === 'Near Expiry' ? 1 : 2));
    if (status === 'Expired') expiry.setDate(expiry.getDate() - 60);
    if (status === 'Near Expiry') expiry.setDate(expiry.getDate() + 30);
    const received = [180, 200, 150, 120, 160, 120][i];
    const sold = received - [150, 120, 70, 50, 20, 10][i];
    return {
      batchNo: `BT${d.toLocaleDateString('en-GB').replace(/\//g, '')}${String(i + 1).padStart(2, '0')}`,
      rackNo: ['R1S1A1', 'R1S2A4', 'R3S1A3', 'R1S1B2', 'R2S1B4', 'R1S2B2'][i],
      purchaseDate: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      expiryDate: expiry.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      qtyReceived: received,
      qtySold: sold,
      qtyAvailable: received - sold,
      supplier: { name: SUPPLIERS[i], avatar: AVATARS[i] },
      status,
    };
  });
};

const statusBadge = (status: BatchEntry['status']) => {
  const map = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Near Expiry': 'bg-orange-50 text-orange-700 border-orange-200',
    Expired: 'bg-red-50 text-red-700 border-red-200',
  };
  const dot = {
    Active: 'bg-emerald-500',
    'Near Expiry': 'bg-orange-500',
    Expired: 'bg-red-500',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${map[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status]}`} />
      {status}
    </span>
  );
};

function CountUp({ end, suffix = '' }: { end: number | string; suffix?: string }) {
  const display = typeof end === 'number' ? end.toLocaleString() : end;
  return <span>{display}{suffix}</span>;
}

function AnimatedProgress({ value, max, color, label, valueLabel }: { value: number; max: number; color: string; label: string; valueLabel?: string }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{valueLabel || `${pct}%`}</span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }}
        />
      </div>
    </div>
  );
}

const timelineEvents = [
  { type: 'Received', date: '15 Mar 2026', time: '09:30 AM', user: 'Rajesh Kumar', remarks: 'Batch received from supplier', icon: Truck, color: 'bg-emerald-500' },
  { type: 'Transferred', date: '18 Mar 2026', time: '11:15 AM', user: 'Anil Verma', remarks: 'Transferred to Warehouse A', icon: MapPin, color: 'bg-blue-500' },
  { type: 'Sold', date: '22 Mar 2026', time: '02:45 PM', user: 'Priya Sharma', remarks: 'Sold 50 units to customer', icon: TrendingDown, color: 'bg-amber-500' },
  { type: 'Adjusted', date: '05 Apr 2026', time: '10:00 AM', user: 'Rajesh Kumar', remarks: 'Stock adjustment - damage write-off', icon: AlertTriangle, color: 'bg-orange-500' },
  { type: 'Sold', date: '12 Apr 2026', time: '04:20 PM', user: 'Sunita Patel', remarks: 'Sold 30 units', icon: TrendingDown, color: 'bg-amber-500' },
  { type: 'Returned', date: '18 Apr 2026', time: '01:10 PM', user: 'Anil Verma', remarks: '10 units returned by customer', icon: RefreshCw, color: 'bg-purple-500' },
];

const categoryGradients: Record<string, string> = {
  Tablet: 'from-[#0F9291]/20 to-[#14B8A6]/10',
  Capsule: 'from-[#14B8A6]/20 to-[#0F9291]/10',
  Syrup: 'from-[#FA9200]/20 to-[#FBBF24]/10',
  Injection: 'from-[#E65B0D]/20 to-[#F87171]/10',
  Ointment: 'from-[#3848F5]/20 to-[#6366F1]/10',
  Drops: 'from-[#8A38F5]/20 to-[#A78BFA]/10',
};

export default function BatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params?.batchId as string;
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    ProductsAPI.getById(batchId).then((res: any) => {
      if (res) setProduct(res);
    }).catch(() => setProduct(null));
  }, [batchId]);

  const batches = useMemo(() => product ? generateBatches(product.id) : [], [product]);

  if (!product || batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Package className="w-16 h-16 text-gray-300" />
        <h3 className="text-xl font-bold text-gray-900 m-0">Batch not found</h3>
        <p className="text-sm text-gray-400 m-0">The requested batch could not be located.</p>
        <Link href="/batch-management" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F9291] text-white text-sm font-semibold hover:bg-teal-700 transition-all no-underline">
          <ArrowLeft className="w-4 h-4" /> Back to Batch Management
        </Link>
      </div>
    );
  }

  const cat = product.categoryName || product.category?.name || '';
  const gradient = categoryGradients[cat] || 'from-gray-100 to-gray-50';
  const icon = CATEGORY_ICONS[cat] || '📦';

  const totalReceived = batches.reduce((s, b) => s + b.qtyReceived, 0);
  const totalSold = batches.reduce((s, b) => s + b.qtySold, 0);
  const totalAvailable = batches.reduce((s, b) => s + b.qtyAvailable, 0);
  const activeCount = batches.filter(b => b.status === 'Active').length;
  const nearCount = batches.filter(b => b.status === 'Near Expiry').length;
  const expiredCount = batches.filter(b => b.status === 'Expired').length;
  const primaryBatch = batches[0];

  const daysToExpiry = 245;

  return (
    <div className="animate-fadeIn">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fillWidth { from { width:0 } to { width:var(--target) } }
        @keyframes countUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
        @keyframes ripple { to { transform:scale(4); opacity:0 } }
        .animate-fadeUp { animation: fadeUp 0.6s ease-out both }
        .animate-fadeUp-1 { animation-delay:0.05s }
        .animate-fadeUp-2 { animation-delay:0.1s }
        .animate-fadeUp-3 { animation-delay:0.15s }
        .animate-fadeUp-4 { animation-delay:0.2s }
        .animate-fadeUp-5 { animation-delay:0.25s }
        .animate-fadeUp-6 { animation-delay:0.3s }
        .animate-slideInRight { animation: slideInRight 0.5s ease-out both }
      `}</style>

      {/* ==================== PAGE HEADER ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fadeUp">
        <div>
          <nav className="flex items-center gap-1.5 text-sm mb-2">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 no-underline transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <Link href="/batch-management" className="text-gray-400 hover:text-gray-600 no-underline transition-colors">Batch Management</Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-gray-900 font-medium">Batch Details</span>
          </nav>
          <h1 className="text-[32px] font-bold text-gray-900 m-0 flex items-center gap-3">
            Batch Details
            <span className="text-base font-normal text-gray-400">- {product.name}</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1 m-0">View and manage complete batch information for {product.sku}</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/batch-management" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all no-underline shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all shadow-sm">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all shadow-sm">
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F9291] text-white text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md">
            <Edit className="w-4 h-4" /> Edit Batch
          </button>
        </div>
      </div>

      {/* ==================== TOP SUMMARY - 6 KPI CARDS ==================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Batch Number', value: primaryBatch.batchNo, icon: Hash, color: '#0F9291' },
          { label: 'Product', value: product.name, icon: Package, color: '#6366F1' },
          { label: 'Available Quantity', value: `${totalAvailable.toLocaleString()}`, icon: Box, color: '#14B8A6' },
          { label: 'Warehouse', value: 'Warehouse A', icon: Warehouse, color: '#F59E0B' },
          { label: 'Expiry Status', value: expiredCount > 0 ? 'Expired' : nearCount > 0 ? 'Near Expiry' : 'Active', icon: Calendar, color: expiredCount > 0 ? '#EF4444' : nearCount > 0 ? '#F97316' : '#10B981' },
          { label: 'Supplier', value: primaryBatch.supplier.name, icon: Users, color: '#8B5CF6' },
        ].map((card, i) => (
          <div key={i}
            className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.06)] p-4 transition-all duration-250 hover:shadow-[0_12px_40px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 animate-fadeUp"
            style={{ animationDelay: `${0.05 + i * 0.05}s` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`flex items-center justify-center w-9 h-9 rounded-xl`} style={{ background: `${card.color}15` }}>
                <card.icon className="w-4.5 h-4.5" style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-500 m-0 mb-0.5 truncate">{card.label}</p>
            <p className="text-sm font-bold text-gray-900 m-0 truncate">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ==================== MAIN CONTENT LAYOUT ==================== */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* LEFT CONTENT */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ==================== PRODUCT INFORMATION ==================== */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden animate-fadeUp">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#0F9291]/10 text-[#0F9291]">
                  <Package className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-base font-bold text-gray-900 m-0">Product Information</h4>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {activeCount > 0 ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className={`w-full sm:w-40 h-40 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                  <span className="text-6xl">{icon}</span>
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                  {[
                    { label: 'Product Name', value: product.name, icon: Tag },
                    { label: 'Category', value: cat, icon: Layers },
                    { label: 'Sub Category', value: cat || '-', icon: Layers },
                    { label: 'Brand', value: '-', icon: Award },
                    { label: 'Unit', value: '-', icon: Ruler },
                    { label: 'SKU', value: product.sku, icon: Barcode },
                    { label: 'Batch Number', value: primaryBatch.batchNo, icon: Hash },
                    { label: 'Barcode', value: product.sku.replace('#', ''), icon: Barcode },
                    { label: 'QR Code', value: 'View QR', icon: QrCode, highlight: '#0F9291' },
                  ].map((f, i) => (
                    <div key={i}>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider m-0 mb-1 flex items-center gap-1">
                        <f.icon className="w-3 h-3" /> {f.label}
                      </p>
                      <p className={`text-sm font-medium m-0 ${f.highlight ? `text-[${f.highlight}]` : 'text-gray-900'}`}
                        style={f.highlight ? { color: f.highlight } : {}}>
                        {f.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ==================== BATCH INFORMATION ==================== */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden animate-fadeUp animate-fadeUp-1">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#6366F1]/10 text-[#6366F1]">
                <Info className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-base font-bold text-gray-900 m-0">Batch Information</h4>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-5">
              {[
                { label: 'Batch Number', value: primaryBatch.batchNo },
                { label: 'Manufacturing Date', value: '10 Jan 2026' },
                { label: 'Purchase Date', value: primaryBatch.purchaseDate },
                { label: 'Expiry Date', value: primaryBatch.expiryDate },
                { label: 'Shelf Life', value: '24 Months' },
                { label: 'Warehouse', value: 'Main Warehouse - A' },
                { label: 'Rack', value: primaryBatch.rackNo.split('S')[0] || '-' },
                { label: 'Bin Location', value: primaryBatch.rackNo.split('S')[1] || '-' },
                { label: 'Lot Number', value: `LOT-${primaryBatch.batchNo.slice(-6)}` },
                { label: 'Status', value: primaryBatch.status, badge: true },
              ].map((f, i) => (
                <div key={i}>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider m-0 mb-1">{f.label}</p>
                  {f.badge ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                      style={{
                        background: primaryBatch.status === 'Active' ? '#ECFDF5' : primaryBatch.status === 'Near Expiry' ? '#FFF7ED' : '#FEF2F2',
                        color: primaryBatch.status === 'Active' ? '#059669' : primaryBatch.status === 'Near Expiry' ? '#D97706' : '#DC2626',
                        borderColor: primaryBatch.status === 'Active' ? '#A7F3D0' : primaryBatch.status === 'Near Expiry' ? '#FED7AA' : '#FECACA',
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{
                          background: primaryBatch.status === 'Active' ? '#059669' : primaryBatch.status === 'Near Expiry' ? '#D97706' : '#DC2626',
                        }}
                      />
                      {f.value}
                    </span>
                  ) : (
                    <p className="text-sm font-medium text-gray-900 m-0">{f.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ==================== INVENTORY STATUS ==================== */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden animate-fadeUp animate-fadeUp-2">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#14B8A6]/10 text-[#14B8A6]">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-base font-bold text-gray-900 m-0">Inventory Status</h4>
            </div>
            <div className="p-6 space-y-5">
              <AnimatedProgress value={totalReceived} max={totalReceived} color="#0F9291" label="Quantity Received" valueLabel={`${totalReceived.toLocaleString()} units`} />
              <AnimatedProgress value={totalSold} max={totalReceived} color="#F59E0B" label="Quantity Sold" valueLabel={`${totalSold.toLocaleString()} units`} />
              <AnimatedProgress value={totalAvailable} max={totalReceived} color="#10B981" label="Quantity Remaining" valueLabel={`${totalAvailable.toLocaleString()} units`} />
              <AnimatedProgress value={12} max={totalReceived} color="#6366F1" label="Reserved" valueLabel="12 units" />
              <AnimatedProgress value={5} max={totalReceived} color="#EF4444" label="Damaged" valueLabel="5 units" />
              <AnimatedProgress value={8} max={totalReceived} color="#8B5CF6" label="Returned" valueLabel="8 units" />
            </div>
          </div>

          {/* ==================== SUPPLIER DETAILS ==================== */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden animate-fadeUp animate-fadeUp-3">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6]">
                <Truck className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-base font-bold text-gray-900 m-0">Supplier Details</h4>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 text-lg font-bold text-purple-700 shrink-0 shadow-sm">
                  {primaryBatch.supplier.avatar}
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                  {[
                    { label: 'Supplier Name', value: primaryBatch.supplier.name },
                    { label: 'Email', value: 'contact@buildmartsupplies.com' },
                    { label: 'Phone', value: '+91 98765 43210' },
                    { label: 'GST Number', value: '27AABCU9603R1ZV' },
                    { label: 'Address', value: '42, Industrial Area, Bangalore - 560001' },
                    { label: 'Purchase Order', value: 'PO-2026-0042' },
                  ].map((f, i) => (
                    <div key={i}>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider m-0 mb-1 flex items-center gap-1">
                        {f.label === 'Email' ? <Mail className="w-3 h-3" /> : f.label === 'Phone' ? <Phone className="w-3 h-3" /> : f.label === 'Address' ? <MapPin className="w-3 h-3" /> : null}
                        {f.label}
                      </p>
                      <p className="text-sm font-medium text-gray-900 m-0">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ==================== PURCHASE INFORMATION ==================== */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden animate-fadeUp animate-fadeUp-4">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B]">
                <IndianRupee className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-base font-bold text-gray-900 m-0">Purchase Information</h4>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
              {[
                { label: 'Purchase Cost (per unit)', value: `₹${product.price}` },
                { label: 'Selling Price (per unit)', value: `₹${Math.round(product.price * 1.15)}` },
                { label: 'Discount', value: '5%' },
                { label: 'Tax (GST)', value: '12%' },
                { label: 'Total Value', value: `₹${(product.price * totalReceived).toLocaleString()}` },
                { label: 'Purchase Invoice', value: 'INV-2026-0891' },
                { label: 'Purchase Date', value: primaryBatch.purchaseDate },
              ].map((f, i) => (
                <div key={i}>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider m-0 mb-1">{f.label}</p>
                  <p className={`text-sm font-medium m-0 ${f.label === 'Total Value' ? 'text-[#0F9291] text-base' : 'text-gray-900'}`}>{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ==================== STOCK MOVEMENT TIMELINE ==================== */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden animate-fadeUp animate-fadeUp-5">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#0F9291]/10 text-[#0F9291]">
                <Clock className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-base font-bold text-gray-900 m-0">Stock Movement Timeline</h4>
            </div>
            <div className="p-6">
              <div className="relative pl-8 space-y-0">
                <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-[#0F9291] via-[#6366F1] to-[#8B5CF6] rounded-full" />
                {timelineEvents.map((event, i) => (
                  <div key={i} className="relative pb-6 group animate-fadeUp" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className={`absolute -left-[23px] top-1 w-[14px] h-[14px] rounded-full border-[3px] border-white shadow-sm transition-transform duration-250 group-hover:scale-125 ${event.color}`} />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pl-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{event.type}</span>
                          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{event.time}</span>
                        </div>
                        <p className="text-xs text-gray-400 m-0 mt-0.5">{event.date} &middot; {event.user}</p>
                        <p className="text-xs text-gray-500 m-0 mt-0.5">{event.remarks}</p>
                      </div>
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${event.color} text-white bg-opacity-20 shrink-0`}>
                        <event.icon className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ==================== EXPIRY ANALYTICS ==================== */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden animate-fadeUp animate-fadeUp-6">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#F97316]/10 text-[#F97316]">
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-base font-bold text-gray-900 m-0">Expiry Analytics</h4>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative flex items-center justify-center w-32 h-32 shrink-0">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#10B981" strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      strokeDashoffset={`${2 * Math.PI * 52 * (1 - Math.min(daysToExpiry / 365, 1))}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-2xl font-bold text-gray-900 m-0 leading-none">{daysToExpiry}</p>
                    <p className="text-[10px] font-medium text-gray-400 m-0 mt-0.5">Days Left</p>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                  {[
                    { label: 'Expiry Risk', value: 'Low', color: '#10B981', bg: '#ECFDF5' },
                    { label: 'Status', value: primaryBatch.status, color: primaryBatch.status === 'Active' ? '#10B981' : primaryBatch.status === 'Near Expiry' ? '#F97316' : '#EF4444', bg: primaryBatch.status === 'Active' ? '#ECFDF5' : primaryBatch.status === 'Near Expiry' ? '#FFF7ED' : '#FEF2F2' },
                    { label: 'Days Remaining', value: `${daysToExpiry} days`, color: '#0F9291', bg: '#F0FDFA' },
                    { label: 'Shelf Life Used', value: '40%', color: '#F59E0B', bg: '#FFFBEB' },
                  ].map((r, i) => (
                    <div key={i} className="rounded-xl p-3 text-center" style={{ background: r.bg }}>
                      <p className="text-xs font-semibold" style={{ color: r.color }}>{r.value}</p>
                      <p className="text-[10px] font-medium text-gray-400 m-0 mt-0.5">{r.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100 flex-wrap">
                {(['Green', 'Yellow', 'Orange', 'Red'] as const).map((lvl, i) => {
                  const colors = [['bg-emerald-500', 'bg-emerald-50 text-emerald-700'], ['bg-yellow-500', 'bg-yellow-50 text-yellow-700'], ['bg-orange-500', 'bg-orange-50 text-orange-700'], ['bg-red-500', 'bg-red-50 text-red-700']];
                  return (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${colors[i][0]}`} />
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors[i][1]}`}>{lvl}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ==================== WAREHOUSE LOCATION ==================== */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden animate-fadeUp">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B]">
                <MapPin className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-base font-bold text-gray-900 m-0">Warehouse Location</h4>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-5">
              {[
                { label: 'Warehouse', value: 'Main Warehouse - A', icon: Warehouse },
                { label: 'Rack', value: primaryBatch.rackNo.split('S')[0] || 'R1', icon: MapPin },
                { label: 'Shelf', value: `Shelf ${primaryBatch.rackNo.split('S')[1]?.charAt(0) || '1'}`, icon: Layers },
                { label: 'Bin', value: primaryBatch.rackNo.split('S')[1]?.slice(1) || 'A1', icon: Box },
                { label: 'Location Code', value: primaryBatch.rackNo, icon: Hash },
              ].map((loc, i) => (
                <div key={i} className="rounded-xl bg-gray-50 p-4 text-center hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white mx-auto mb-2 shadow-sm">
                    <loc.icon className="w-4.5 h-4.5 text-gray-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 m-0">{loc.value}</p>
                  <p className="text-[10px] font-medium text-gray-400 m-0 mt-0.5">{loc.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ==================== BATCH HISTORY TABLE ==================== */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden animate-fadeUp">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#6366F1]/10 text-[#6366F1]">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-base font-bold text-gray-900 m-0">Batch History</h4>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search history..."
                  className="h-8 w-40 text-xs border border-gray-200 rounded-lg px-3 outline-none focus:border-[#0F9291] transition-colors"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    {['Date', 'Activity', 'Reference', 'Quantity', 'User', 'Remarks'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { date: '15 Mar 2026', activity: 'Received', ref: 'PO-2026-0042', qty: '+180', user: 'Rajesh Kumar', remarks: 'Batch received' },
                    { date: '18 Mar 2026', activity: 'Transferred', ref: 'TRF-2026-0112', qty: '-180', user: 'Anil Verma', remarks: 'To Warehouse A' },
                    { date: '22 Mar 2026', activity: 'Sold', ref: 'INV-2026-0234', qty: '-50', user: 'Priya Sharma', remarks: 'Customer sale' },
                    { date: '05 Apr 2026', activity: 'Adjusted', ref: 'ADJ-2026-0089', qty: '-5', user: 'Rajesh Kumar', remarks: 'Damage write-off' },
                    { date: '12 Apr 2026', activity: 'Sold', ref: 'INV-2026-0312', qty: '-30', user: 'Sunita Patel', remarks: 'Customer sale' },
                    { date: '18 Apr 2026', activity: 'Returned', ref: 'RMA-2026-0045', qty: '+10', user: 'Anil Verma', remarks: 'Customer return' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{row.date}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.activity === 'Received' ? 'bg-emerald-50 text-emerald-700' :
                          row.activity === 'Sold' ? 'bg-amber-50 text-amber-700' :
                          row.activity === 'Transferred' ? 'bg-blue-50 text-blue-700' :
                          row.activity === 'Adjusted' ? 'bg-orange-50 text-orange-700' :
                          'bg-purple-50 text-purple-700'
                        }`}>{row.activity}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#0F9291]">{row.ref}</td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${row.qty.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>{row.qty}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{row.user}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{row.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 m-0">Showing 6 of 6 entries</p>
              <div className="flex items-center gap-1">
                <button className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white text-gray-500 text-xs hover:bg-gray-50 transition-all disabled:opacity-40" disabled>&lt;</button>
                <button className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0F9291] text-white text-xs font-medium shadow-sm">1</button>
                <button className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white text-gray-500 text-xs hover:bg-gray-50 transition-all disabled:opacity-40" disabled>&gt;</button>
              </div>
            </div>
          </div>

          {/* ==================== ATTACHMENTS ==================== */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden animate-fadeUp">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6]">
                <FileImage className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-base font-bold text-gray-900 m-0">Attachments</h4>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: 'Purchase Invoice', type: 'PDF', size: '2.4 MB', icon: FileText, color: 'bg-red-50 text-red-600' },
                { name: 'Quality Certificate', type: 'PDF', size: '1.8 MB', icon: Shield, color: 'bg-blue-50 text-blue-600' },
                { name: 'Purchase Order', type: 'PDF', size: '0.9 MB', icon: FileSpreadsheet, color: 'bg-emerald-50 text-emerald-600' },
                { name: 'Product Image', type: 'JPG', size: '3.2 MB', icon: FileImage, color: 'bg-amber-50 text-amber-600' },
              ].map((att, i) => (
                <div key={i} className="rounded-xl border border-gray-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 group">
                  <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${att.color} mb-3`}>
                    <att.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 m-0 truncate">{att.name}</p>
                  <p className="text-[11px] text-gray-400 m-0 mt-0.5">{att.type} &middot; {att.size}</p>
                  <button className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#0F9291] hover:text-teal-700 transition-colors opacity-0 group-hover:opacity-100">
                    <Download className="w-3 h-3" /> Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ==================== RIGHT SIDEBAR ==================== */}
        <div className="w-full xl:w-[320px] shrink-0 space-y-5">

          {/* Quick Actions */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden animate-slideInRight">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0F9291]/10 text-[#0F9291]">
                <Plus className="w-4 h-4" />
              </div>
              <h5 className="text-sm font-bold text-gray-900 m-0">Quick Actions</h5>
            </div>
            <div className="p-4 space-y-2">
              {[
                { label: 'Transfer Batch', icon: Truck, color: '#0F9291' },
                { label: 'Adjust Stock', icon: Edit, color: '#6366F1' },
                { label: 'Print Barcode', icon: Barcode, color: '#14B8A6' },
                { label: 'Print QR Code', icon: QrCode, color: '#8B5CF6' },
                { label: 'Generate Report', icon: FileText, color: '#F59E0B' },
                { label: 'Archive Batch', icon: Archive, color: '#EF4444' },
              ].map((action, i) => (
                <button key={i}
                  className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-250 group"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg transition-transform duration-250 group-hover:scale-110"
                    style={{ background: `${action.color}15` }}>
                    <action.icon className="w-4 h-4" style={{ color: action.color }} />
                  </div>
                  <span className="flex-1 text-left">{action.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden animate-slideInRight">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#14B8A6]/10 text-[#14B8A6]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h5 className="text-sm font-bold text-gray-900 m-0">Quick Stats</h5>
            </div>
            <div className="p-4 space-y-4">
              {[
                { label: 'Total Batches', value: batches.length, color: '#0F9291' },
                { label: 'Active', value: activeCount, color: '#10B981' },
                { label: 'Near Expiry', value: nearCount, color: '#F97316' },
                { label: 'Expired', value: expiredCount, color: '#EF4444' },
                { label: 'Total Stock Value', value: `₹${(product.price * totalAvailable).toLocaleString()}`, color: '#6366F1' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">{stat.label}</span>
                  <span className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Warning */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden border-l-4 border-l-red-500 animate-slideInRight">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
                <h5 className="text-sm font-bold text-gray-900 m-0">Low Stock Warning</h5>
              </div>
              <div className="rounded-xl bg-red-50 p-3.5">
                <p className="text-xs font-semibold text-red-700 m-0">{primaryBatch.qtyAvailable < 50 ? `${primaryBatch.batchNo} has only ${primaryBatch.qtyAvailable} units remaining` : 'Stock levels are adequate'}</p>
                <p className="text-[11px] text-red-500 m-0 mt-1">Consider reordering before stock runs out.</p>
              </div>
            </div>
          </div>

          {/* Related Batches */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden animate-slideInRight">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0F9291]/10 text-[#0F9291]">
                  <Package className="w-4 h-4" />
                </div>
                <h5 className="text-sm font-bold text-gray-900 m-0">Related Batches</h5>
              </div>
              <Link href="/batch-management" className="text-xs font-medium text-[#0F9291] hover:text-teal-700 no-underline">View All</Link>
            </div>
            <div className="p-4 space-y-2.5">
              {batches.slice(1, 4).map((batch, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 m-0">{batch.batchNo}</p>
                    <p className="text-[10px] text-gray-400 m-0 mt-0.5">{batch.status} &middot; {batch.qtyAvailable} units</p>
                  </div>
                  {statusBadge(batch.status)}
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Expiry */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden animate-slideInRight">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4.5 h-4.5 text-orange-500" />
                <h5 className="text-sm font-bold text-gray-900 m-0">Upcoming Expiry</h5>
              </div>
              <div className="rounded-xl bg-orange-50 p-3.5">
                <p className="text-xs font-semibold text-orange-700 m-0">{nearCount} batch{(nearCount !== 1 ? 'es' : '')} nearing expiry</p>
                <p className="text-[11px] text-orange-500 m-0 mt-1">Take action on batches close to expiration.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
