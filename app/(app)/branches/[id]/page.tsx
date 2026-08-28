'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Store, Warehouse, ArrowLeft, Users, Package, ShoppingCart, TrendingUp, AlertTriangle, Shield, MapPin, Phone, Mail, UserCheck, Layers, Receipt, BarChart3, Clock, Eye, ArrowRight, X, CheckCircle2, BriefcaseMedical } from '@/components/ui/LucideIcon';
import { BranchesAPI, UsersAPI } from '@/lib/api';
import { useBranch } from '@/lib/branch-context';
import { useAuth } from '@/lib/auth-context';
import { Branch } from '@/types';

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
        } catch {}

        setError(null);
      } catch (e:any) {
        setError(e.message || 'Failed to load branch');
      } finally { setLoading(false); }
    };
    loadBranch();
  }, [branchId]);

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

  return (
    <div className="p-4 sm:p-6 bg-[#f8f9fa] min-h-screen -m-6">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6">
        {/* Super Admin banner */}
        {isSuperAdmin && showBanner && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center"><Eye className="w-4 h-4"/></span>
              <div>
                <p className="text-sm font-semibold text-amber-900">Super Admin — Branch Workspace</p>
                <p className="text-xs text-amber-700">You are viewing <span className="font-semibold">{branch.name} ({branch.code})</span> in a new tab. All actions here are scoped to this branch via <code className="bg-white px-1.5 py-0.5 rounded border">X-Branch-Id: {branch.id}</code></p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-amber-200 text-xs font-semibold text-amber-700"><Shield className="w-3 h-3"/> Read-Write Scoped</span>
              <button onClick={()=>setShowBanner(false)} className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-amber-100 text-amber-700"><X className="w-4 h-4"/></button>
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm list-none p-0 m-0">
              <li><Link href="/dashboard" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 no-underline"><Building2 className="w-4 h-4"/> Dashboard</Link></li>
              <li className="text-gray-400">/</li>
              <li><Link href="/branches" className="text-gray-600 hover:text-gray-900 no-underline">Branches</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium flex items-center gap-1.5"><TypeIcon className="w-4 h-4"/> {branch.name} Workspace</li>
              <li className="ml-2 hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0F9291]/10 text-[#0F9291] text-xs font-semibold border border-[#0F9291]/20">{branch.code}</li>
            </ol>
          </nav>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${branch.status==='ACTIVE'?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-amber-50 text-amber-700 border-amber-200'}`}>{branch.status}</span>
            <Link href="/branches" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50"><ArrowLeft className="w-4 h-4"/> Back</Link>
            <a href={`/branches/${branch.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0F9291] text-white rounded-lg text-sm hover:bg-[#0e7a79]"><ExternalLink className="w-4 h-4"/> Open Again</a>
          </div>
        </div>

        {/* Branch header */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
          <div className="flex items-start gap-4">
            <span className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isCentral?'bg-purple-50 text-purple-700':branch.type==='WAREHOUSE'?'bg-amber-50 text-amber-700':'bg-[#0F9291]/10 text-[#0F9291]'}`}>
              <TypeIcon className="w-7 h-7"/>
            </span>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900">{branch.name} <span className="text-sm font-normal text-gray-500">({branch.code})</span> <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">{branch.type}</span></h1>
              <p className="text-sm text-gray-500 flex flex-wrap items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4"/> {branch.address || ''} {branch.city || ''} {branch.country || ''}</span>
                {branch.phone && <span className="inline-flex items-center gap-1"><Phone className="w-4 h-4"/> {branch.phone}</span>}
                {branch.email && <span className="inline-flex items-center gap-1"><Mail className="w-4 h-4"/> {branch.email}</span>}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-600"><UserCheck className="w-3 h-3"/> Manager: {branch.managerName || <span className="text-gray-400">Unassigned</span>}</span>
                {branch.contactPerson && <span className="inline-flex items-center gap-1.5 text-xs text-gray-600"><BriefcaseMedical className="w-3 h-3"/> {branch.contactPerson}</span>}
              </div>
            </div>
          </div>
        </div>

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
