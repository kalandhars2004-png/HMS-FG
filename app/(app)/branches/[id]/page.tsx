'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Store, Warehouse, ArrowLeft, Users, Package, ShoppingCart, TrendingUp, AlertTriangle, Shield, MapPin, Phone, Mail, UserCheck, Layers, Receipt, BarChart3, Clock, Eye, ArrowRight, X, CheckCircle2, BriefcaseMedical, ExternalLink } from '@/components/ui/LucideIcon';
import { BranchesAPI, UsersAPI, ProductsAPI, BatchesAPI, TransactionsAPI, InvoicesAPI } from '@/lib/api';
import { useBranch } from '@/lib/branch-context';
import { useAuth } from '@/lib/auth-context';
import { Branch } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { getStockLevel } from '@/lib/stock-status';

export default function BranchWorkspacePage() {
  const params = useParams() as { id: string };
  const branchId = params?.id as string;
  const router = useRouter();
  const { isSuperAdmin, selectBranch, branches } = useBranch();
  const { user } = useAuth();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ employees: 0, customers: 0, products: 0 });
  const [showBanner, setShowBanner] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedManager, setSelectedManager] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState<{type:'success'|'error', text:string}|null>(null);
  const [branchStock, setBranchStock] = useState<{totalStockValue:number; stockUnits:number; purchaseTotal:number; salesTotal:number; medicines:number; healthy:number; low:number; critical:number; out:number} | null>(null);

  // Enforce: only SUPER_ADMIN can open any branch workspace; branch managers only own
  useEffect(() => {
    if (!branchId) return;
    // Save previous branch to restore on unmount (per-tab isolation)
    const prev = typeof window !== 'undefined' ? localStorage.getItem('selectedBranchId') : null;
    // Set workspace branch for this tab
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedBranchId', String(branchId));
      sessionStorage.setItem('workspaceBranchId', String(branchId));
      // Notify same-tab listeners
      window.dispatchEvent(new CustomEvent('ims:branch-changed', { detail: { branchId } }));
    }
    return () => {
      // Restore previous on unmount (when user closes workspace tab, original tab unaffected until reload)
      if (typeof window !== 'undefined') {
        if (prev) localStorage.setItem('selectedBranchId', prev);
        else localStorage.removeItem('selectedBranchId');
        sessionStorage.removeItem('workspaceBranchId');
      }
    };
  }, [branchId]);

  useEffect(() => {
    if (!branchId) return;
    const loadBranch = async () => {
      try {
        setLoading(true);
        // Temporarily ensure header is branchId for this fetch
        const prev = localStorage.getItem('selectedBranchId');
        localStorage.setItem('selectedBranchId', String(branchId));
        const res = await BranchesAPI.getById(String(branchId));
        if (prev) localStorage.setItem('selectedBranchId', prev);
        else localStorage.removeItem('selectedBranchId');

        const b = (res as any)?.branch || (res as any)?.data?.branch || res;
        if (!b || !b.id) throw new Error('Branch not found');
        setBranch({ ...b, id: String(b.id) } as Branch);

        // Branch-scoped stats (best-effort, fallback to 0)
        try {
          // Employees in this branch (client filter)
          const usersRes = await UsersAPI.getAll();
          const users: any[] = (usersRes as any)?.data || (usersRes as any)?.users || [];
          const inBranch = users.filter((u:any) => String(u.branchId) === String(branchId));
          setStats({ employees: inBranch.length, customers: 0, products: 0 });
          setAllUsers(users);
          setSelectedManager(b?.managerId ? String(b.managerId) : '');
        } catch {}

        // Branch-specific stock valuation — uses X-Branch-Id header already set to branchId
        try {
          const prevStock = localStorage.getItem('selectedBranchId');
          localStorage.setItem('selectedBranchId', String(branchId));
          const [prodRes, batchRes, txRes, invRes] = await Promise.all([
            ProductsAPI.getAll().catch(()=>({data:[]}) as any),
            BatchesAPI.getAll().catch(()=>({data:[]}) as any),
            TransactionsAPI.getAll().catch(()=>({data:[]}) as any),
            InvoicesAPI.getAll().catch(()=>({data:[]}) as any),
          ]);
          if (prevStock) localStorage.setItem('selectedBranchId', prevStock);
          else localStorage.removeItem('selectedBranchId');
          const products:any[] = (prodRes as any)?.data || [];
          const tx:any[] = (txRes as any)?.data || [];
          const invoices:any[] = (invRes as any)?.data || [];
          const qty = (p:any)=> Number(p.stockQuantity ?? p.quantity ?? 0);
          const totalStockValue = products.reduce((s:number,p:any)=> s + qty(p)* Number(p.purchasePrice ?? p.price ?? 0), 0);
          const stockUnits = products.reduce((s:number,p:any)=> s + qty(p), 0);
          const sum = (rows:any[])=> rows.reduce((s:number,r:any)=> s + Number(r.totalPrice||0),0);
          const sumInv = (rows:any[])=> rows.reduce((s:number,r:any)=> s + Number(r.totalAmount||0),0);
          const txSales = tx.filter((t:any)=> t.transactionType==='SALE');
          const purchases = tx.filter((t:any)=> t.transactionType==='PURCHASE');
          const VOIDED=['CANCELLED','CANCELED','VOID','VOIDED'];
          const completedInvoices = invoices.filter((i:any)=> !VOIDED.includes(String(i.status).toUpperCase()));
          const purchaseTotal = sum(purchases);
          const salesTotal = sumInv(completedInvoices) + sum(txSales);
          const level = (p:any)=> getStockLevel(qty(p), p.lowStockQuantity ?? undefined);
          const healthy = products.filter((p:any)=> level(p)==='healthy').length;
          const low = products.filter((p:any)=> level(p)==='low').length;
          const critical = products.filter((p:any)=> level(p)==='critical').length;
          const out = products.filter((p:any)=> level(p)==='out').length;
          setBranchStock({ totalStockValue, stockUnits, purchaseTotal, salesTotal, medicines: products.length, healthy, low, critical, out });
        } catch {}

        setError(null);
      } catch (e:any) {
        setError(e.message || 'Failed to load branch');
      } finally { setLoading(false); }
    };
    loadBranch();
  }, [branchId]);

  const handleAssignManager = async () => {
    if (!selectedManager) { setAssignMsg({type:'error', text:'Select a manager'}); return; }
    setAssigning(true); setAssignMsg(null);
    try {
      await BranchesAPI.assignManager(String(branchId), String(selectedManager));
      const res = await BranchesAPI.getById(String(branchId));
      const b = (res as any)?.branch || (res as any)?.data?.branch || res;
      setBranch({ ...b, id: String(b.id) } as Branch);
      setAssignMsg({type:'success', text:'Manager assigned'});
    } catch(e:any){ setAssignMsg({type:'error', text:e.message||'Failed to assign'}); }
    finally{ setAssigning(false); }
  };

  const handleRemoveManager = async () => {
    setAssigning(true); setAssignMsg(null);
    try {
      await BranchesAPI.removeManager(String(branchId));
      const res = await BranchesAPI.getById(String(branchId));
      const b = (res as any)?.branch || (res as any)?.data?.branch || res;
      setBranch({ ...b, id: String(b.id) } as Branch);
      setSelectedManager('');
      setAssignMsg({type:'success', text:'Manager removed'});
    } catch(e:any){ setAssignMsg({type:'error', text:e.message||'Failed to remove'}); }
    finally{ setAssigning(false); }
  };

  // Also keep BranchContext in sync for APIs that read from context (dashboard etc) in this tab
  useEffect(() => {
    if (branchId && isSuperAdmin) {
      // Do not call selectBranch globally that would pollute other tabs via localStorage event?
      // We already set localStorage, now sync context state without broadcasting to other tabs
      // selectBranch will also write to localStorage and fire event, which is okay for this tab
      // Old tab listens to storage event only on reload, so safe
      selectBranch(String(branchId));
    }
  }, [branchId, isSuperAdmin]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-[#f8f9fa] min-h-screen -m-6">
        <div className="max-w-[1600px] mx-auto p-4 sm:p-6">
          <div className="h-32 bg-white rounded-xl border border-gray-200 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {[1,2,3].map(i=> <div key={i} className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="p-4 sm:p-6 bg-[#f8f9fa] min-h-screen -m-6">
        <div className="max-w-[1600px] mx-auto p-4 sm:p-6">
          <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">Unable to open branch workspace</h3>
            <p className="text-sm text-gray-500 mt-1">{error || 'Branch not found'}</p>
            <div className="flex justify-center gap-2 mt-4">
              <Link href="/branches" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 inline-flex items-center gap-2"><ArrowLeft className="w-4 h-4"/> Back to Branches</Link>
              <button onClick={()=>router.back()} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">Go Back</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isCentral = branch.type === 'CENTRAL_WAREHOUSE';
  const TypeIcon = isCentral ? Warehouse : branch.type === 'WAREHOUSE' ? Store : Building2;
  const heroGradient = isCentral ? 'linear-gradient(135deg,#4C1D95 0%,#7C3AED 45%,#A78BFA 100%)' : branch.type==='WAREHOUSE' ? 'linear-gradient(135deg,#92400E 0%,#D97706 45%,#FCD34D 100%)' : 'linear-gradient(135deg,#0F766E 0%,#0F9291 45%,#14B8A6 100%)';

  return (
    <div className="min-h-screen -m-6 bg-[#F8F9FA]">
      {/* Premium Hero */}
      <div className="relative overflow-hidden" style={{ background: heroGradient }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }}/>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl"/>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-black/10 blur-3xl"/>
        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <nav className="flex items-center gap-1.5 text-sm">
              <Link href="/dashboard" className="text-white/80 hover:text-white flex items-center gap-1.5"><Building2 className="w-4 h-4"/> Dashboard</Link>
              <span className="text-white/50">/</span>
              <Link href="/branches" className="text-white/80 hover:text-white">Branches</Link>
              <span className="text-white/50">/</span>
              <span className="text-white font-medium flex items-center gap-1.5"><TypeIcon className="w-4 h-4"/> {branch.name}</span>
              <span className="hidden sm:inline-flex ml-2 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-white text-xs font-semibold border border-white/20">{branch.code}</span>
            </nav>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur border ${branch.status==='ACTIVE'?'bg-emerald-400/20 text-white border-emerald-300/30':'bg-amber-400/20 text-white border-amber-300/30'}`}>{branch.status}</span>
              <Link href="/branches" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 backdrop-blur border border-white/20 text-white rounded-xl text-sm hover:bg-white/20"><ArrowLeft className="w-4 h-4"/> Branches</Link>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex gap-4 flex-1 min-w-0">
              <span className="w-20 h-20 rounded-[20px] bg-white flex items-center justify-center shadow-xl shrink-0">
                <TypeIcon className="w-9 h-9" style={{ color: isCentral ? '#7C3AED' : branch.type==='WAREHOUSE' ? '#D97706' : '#0F9291'}}/>
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-[28px] font-bold tracking-[-0.02em] text-white leading-none">{branch.name}</h1>
                <p className="text-white/80 text-sm mt-1 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4"/> {branch.city || branch.address || 'No address'} • {branch.country || 'India'}</span>
                  <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/50"/>
                  <span className="inline-flex items-center gap-1"><Mail className="w-4 h-4"/> {branch.email || '-'}</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-gray-900 text-xs font-semibold shadow-sm"><UserCheck className="w-3.5 h-3.5 text-[#0F9291]"/> {branch.managerName ? branch.managerName : 'No manager'} {branch.managerName && <span className="text-gray-500">• ID {branch.managerId}</span>}</span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white text-xs font-medium border border-white/20">{branch.type}</span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white text-xs border border-white/20"><Phone className="w-3 h-3"/> {branch.phone || '-'}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[420px] shrink-0">
              <div className="rounded-2xl bg-white p-4 shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Employees</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.employees}</p>
                <p className="text-xs text-gray-500">in branch</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Medicines</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{branchStock?.medicines ?? 0}</p>
                <p className="text-xs text-gray-500">skus</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Stock Units</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{branchStock ? branchStock.stockUnits.toLocaleString() : '—'}</p>
                <p className="text-xs text-emerald-600">live</p>
              </div>
            </div>
          </div>
          {isSuperAdmin && showBanner && (
            <div className="mt-6 flex items-center justify-between gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2.5 text-white text-sm">
                <Shield className="w-4 h-4"/> SuperAdmin workspace • <code className="bg-white/20 px-1.5 py-0.5 rounded text-xs">X-Branch-Id: {branch.id}</code> • all actions scoped to this branch
              </div>
              <button onClick={()=>setShowBanner(false)} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"><X className="w-4 h-4"/></button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {/* Assign Manager — premium card */}
        {isSuperAdmin && (
          <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
              <div>
                <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2"><UserCheck className="w-5 h-5 text-[#0F9291]"/> Assign Manager</h3>
                <p className="text-sm text-gray-500 mt-1">Choose a manager for <span className="font-semibold text-gray-900">{branch.name}</span>. SuperAdmin is global — never assignable daa.</p>
              </div>
              {branch.managerName && <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold"><CheckCircle2 className="w-4 h-4"/> {branch.managerName}</span>}
            </div>
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-2 text-sm text-amber-800 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0"/> Super admin cannot be a branch manager — only Managers/Employees.
            </div>
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                <select value={selectedManager} onChange={e=>setSelectedManager(e.target.value)} className="w-full h-11 pl-9 pr-3 border border-gray-200 rounded-xl text-sm bg-white focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20 outline-none">
                  <option value="">— Select user —</option>
                  {allUsers.filter((u:any)=> String(u.role).toUpperCase()!=='SUPER_ADMIN').map((u:any)=>(
                    <option key={String(u.id)} value={String(u.id)}>{u.name} — {u.email} ({String(u.role)}) {u.branchId?`• Branch ${u.branchId}`:''}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleAssignManager} disabled={assigning || !selectedManager} className="h-11 px-6 bg-[#0F9291] text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-[#0e7a79] flex items-center justify-center gap-2 shadow-sm"><CheckCircle2 className="w-4 h-4"/> {assigning?'Assigning...':'Assign Manager'}</button>
              {branch.managerId && <button onClick={handleRemoveManager} disabled={assigning} className="h-11 px-5 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 flex items-center gap-2"><X className="w-4 h-4"/> Remove</button>}
            </div>
            {assignMsg && <p className={`text-sm mt-3 px-4 py-3 rounded-xl border ${assignMsg.type==='success'?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-red-50 text-red-700 border-red-200'}`}>{assignMsg.text}</p>}
          </div>
        )}

        {/* Branch Stock — premium 4-up */}
        {branchStock && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2"><Package className="w-5 h-5 text-[#0F9291]"/> Branch Performance</h3>
              <span className="text-xs text-gray-500">Live • <code className="bg-white px-1.5 py-0.5 rounded border">X-Branch-Id: {branch.id}</code></span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-[20px] bg-white border border-gray-200 p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#0F9291]/5 -mr-8 -mt-8"/>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Stock Value</p>
                <p className="text-[26px] font-bold tracking-[-0.02em] text-gray-900 mt-2">{formatCurrency(branchStock.totalStockValue)}</p>
                <p className="text-sm text-gray-500 mt-1">{branchStock.stockUnits.toLocaleString()} units</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600"><TrendingUp className="w-3 h-3"/> Branch inventory</div>
              </div>
              <div className="rounded-[20px] bg-white border border-gray-200 p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#FA0051]/5 -mr-8 -mt-8"/>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Purchase Value</p>
                <p className="text-[26px] font-bold tracking-[-0.02em] text-gray-900 mt-2">{formatCurrency(branchStock.purchaseTotal)}</p>
                <p className="text-sm text-gray-500 mt-1">purchases</p>
              </div>
              <div className="rounded-[20px] bg-white border border-gray-200 p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#3848F5]/5 -mr-8 -mt-8"/>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Sale Value</p>
                <p className="text-[26px] font-bold tracking-[-0.02em] text-gray-900 mt-2">{formatCurrency(branchStock.salesTotal)}</p>
                <p className="text-sm text-gray-500 mt-1">invoices + ledger</p>
              </div>
              <div className="rounded-[20px] bg-white border border-gray-200 p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#FA9200]/10 -mr-8 -mt-8"/>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Medicines</p>
                <p className="text-[26px] font-bold tracking-[-0.02em] text-gray-900 mt-2">{branchStock.medicines}</p>
                <p className="text-xs mt-1"><span className="text-emerald-600">{branchStock.healthy} healthy</span> • <span className="text-amber-600">{branchStock.low} low</span> • <span className="text-orange-600">{branchStock.critical} crit</span> • <span className="text-red-600">{branchStock.out} out</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center"><Users className="w-5 h-5"/></span>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Employees</p>
                <p className="text-lg font-bold text-gray-900">{stats.employees}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Scoped to this branch</p>
            <Link href="/settings/users" className="text-xs text-[#0F9291] hover:underline mt-2 inline-block">Manage →</Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><Package className="w-5 h-5"/></span>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Branch Type</p>
                <p className="text-lg font-bold text-gray-900">{branch.type}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">{isCentral ? 'Central inventory source' : 'Retail branch workspace'}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center"><BarChart3 className="w-5 h-5"/></span>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Workspace</p>
                <p className="text-sm font-semibold text-gray-900">Branch-scoped</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">All modules below are filtered by <code className="bg-gray-100 px-1 rounded">branchId={branch.id}</code></p>
          </div>
        </div>

        {/* Workspace modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[
            { title:'Inventory', desc:'Products, batches, stock levels for this branch', href:'/medicines', icon:Layers, color:'text-[#0F9291] bg-[#0F9291]/10' },
            { title:'POS Billing', desc:'Sell from this branch inventory only', href:'/pos', icon:ShoppingCart, color:'text-emerald-700 bg-emerald-50' },
            { title:'Sales & Invoices', desc:'Orders and invoices for this branch', href:'/sales/invoices', icon:Receipt, color:'text-sky-700 bg-sky-50' },
            { title:'Purchases', desc:'Purchase orders for this branch', href:'/purchases/orders', icon:ShoppingCart, color:'text-amber-700 bg-amber-50' },
            { title:'Customers', desc:'Customers of this branch', href:'/sales/customers', icon:Users, color:'text-purple-700 bg-purple-50' },
            { title:'Reports', desc:'Branch sales, inventory, profit', href:'/reports/sales', icon:BarChart3, color:'text-indigo-700 bg-indigo-50' },
            { title:'Stock Transfers', desc:'Requests & transfers for this branch', href:'/stock/transfer', icon:TrendingUp, color:'text-teal-700 bg-teal-50' },
            { title:'Audit Logs', desc:'Trail filtered to this branch', href:'/audit', icon:Clock, color:'text-gray-700 bg-gray-100' },
            { title:'Employees', desc:'Users assigned to this branch', href:'/settings/users', icon:Shield, color:'text-rose-700 bg-rose-50' },
          ].map(card => (
            <Link key={card.title} href={card.href} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-[#0F9291]/30 transition-all group">
              <div className="flex items-center gap-3 mb-2">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}><card.icon className="w-5 h-5"/></span>
                <h3 className="font-semibold text-gray-900 group-hover:text-[#0F9291]">{card.title}</h3>
              </div>
              <p className="text-xs text-gray-500">{card.desc}</p>
              <span className="text-xs text-[#0F9291] group-hover:underline mt-2 inline-block">Open →</span>
            </Link>
          ))}
        </div>

        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Tip:</span> This tab is isolated. Your main <Link href="/branches" className="text-[#0F9291] hover:underline">Branches</Link> tab stays on <span className="font-semibold">All Branches</span> while this workspace stays on <span className="font-semibold">{branch.name}</span>.
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>window.close()} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Close Tab</button>
            <Link href="/dashboard" className="px-3 py-2 bg-[#0F9291] text-white rounded-lg text-sm hover:bg-[#0e7a79]">Go to Dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
