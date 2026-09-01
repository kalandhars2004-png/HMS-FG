'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  Search, Bell, Settings, ChevronDown, LogOut, Command,
  UserCog, BarChart3, Pill, Moon, Sun,
  Building2, Database, ShoppingCart, Package, AlertTriangle, Clock, Ban, TrendingUp, CheckCheck,
  Store, Warehouse, Layers, Check, X,
} from '@/components/ui/LucideIcon';
import { useTheme } from '@/lib/theme-context';
import { isAnyModalOpen } from '@/lib/modal-guard';
import { AlertsAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/lib/branch-context';

function useOutsideClick(refs: React.RefObject<HTMLElement | null>[], handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (refs.some(ref => ref.current?.contains(e.target as Node))) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [refs, handler]);
}

function useEscape(handler: () => void) {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isAnyModalOpen()) handler(); };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [handler]);
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/expiry': 'Expiry Alerts',
  '/medicines': 'Medicines',
  '/medicines/create': 'Add Medicine',
  '/categories': 'Categories',
  '/brands': 'Brands',
  '/units': 'Units',
  '/variants': 'Variants',
  '/suppliers': 'Suppliers',
  '/warehouses': 'Warehouses',
  '/racks': 'Racks',
  '/batch-management': 'Batch Management',
  '/stock': 'Stock',
  '/stock/adjustment': 'Stock Adjustment',
  '/stock/cycle-count': 'Cycle Count',
  '/stock/forecast': 'Forecast',
  '/stock/inventory-logs': 'Inventory Logs',
  '/stock/restock': 'Restock',
  '/stock/transfer': 'Stock Transfer',
  '/purchases': 'Purchases',
  '/purchases/create': 'New Purchase',
  '/purchases/orders': 'Purchase Orders',
  '/purchases/returns': 'Purchase Returns',
  '/sales': 'Sales',
  '/sales/customers': 'Customers',
  '/sales/invoices': 'Invoices',
  '/sales/orders': 'Sales Orders',
  '/sales/quotations': 'Quotations',
  '/sales/returns': 'Sales Returns',
  '/reports/sales': 'Sales Reports',
  '/reports/stock': 'Stock Reports',
  '/settings': 'Settings',
  '/settings/backup': 'Backup',
  '/settings/branches': 'Branches',
  '/settings/business': 'Business Settings',
  '/settings/integrations': 'Integrations',
  '/settings/notifications': 'Notifications',
  '/settings/permissions': 'Permissions',
  '/settings/roles': 'Roles',
  '/settings/taxes': 'Taxes',
  '/settings/users': 'Users',
  '/people/billers': 'Billers',
  '/people/stores': 'Stores',
  '/work-orders': 'Work Orders',
  '/work-orders/projects': 'Projects',
  '/equipment': 'Equipment',
  '/equipment/log': 'Equipment Log',
  '/audit': 'Audit Logs',
  '/pos': 'POS',
  '/pos/sessions': 'POS Sessions',
  '/login': 'Login',
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/sales/invoices/')) return 'Invoice Details';
  if (pathname.startsWith('/sales/orders/')) return 'Sales Order Details';
  if (pathname.startsWith('/dashboard/expiry/')) return 'Expiry Details';
  if (pathname.startsWith('/stock/cycle-count/')) return 'Cycle Count Details';
  if (pathname.startsWith('/batch-management/')) return 'Batch Details';

  const segments = pathname.split('/').filter(Boolean);
  for (let i = segments.length; i >= 1; i--) {
    const candidate = '/' + segments.slice(0, i).join('/');
    if (PAGE_TITLES[candidate]) return PAGE_TITLES[candidate];
  }
  return 'Dashboard';
}

function timeAgo(iso?: string) {
  if (!iso) return 'Just now';
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime())/1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  if (s < 604800) return `${Math.floor(s/86400)}d ago`;
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'});
}
function notifIcon(type?: string, severity?: string): { Icon:any, bg:string, border:string } {
  const t = String(type||'').toUpperCase();
  const s = String(severity||'').toUpperCase();
  if (t.includes('OUT_OF_STOCK')) return { Icon: Ban, bg:'#FFEDEA', border:'#FBCAC1' };
  if (t.includes('LOW_STOCK')) return { Icon: AlertTriangle, bg:'#FFF1EB', border:'#FED5C5' };
  if (t.includes('EXPIR')) return { Icon: Clock, bg:'#FFF6ED', border:'#FFCFA5' };
  if (t.includes('SALE')) return { Icon: TrendingUp, bg:'#FFF6ED', border:'#FFCFA5' };
  if (t.includes('PURCHASE')) return { Icon: ShoppingCart, bg:'#EAF0FF', border:'#C2D2FF' };
  if (t.includes('PAYMENT')) return { Icon: s==='SUCCESS'? CheckCheck : AlertTriangle, bg: s==='SUCCESS'?'#EAFBF0':'#FFEDEA', border: s==='SUCCESS'?'#B6E5C8':'#FBCAC1' };
  return { Icon: Package, bg:'#F4F6FA', border:'#E5E7EB' };
}
function notifHref(a:any): string {
  const t = String(a.type||'').toUpperCase();
  if (t.includes('STOCK') || t.includes('PRODUCT')) return `/medicines`;
  if (t.includes('BATCH') || t.includes('EXPIR')) return `/batch-management`;
  if (t.includes('SALE')) return `/sales/invoices`;
  if (t.includes('PURCHASE')) return `/purchases`;
  if (t.includes('PAYMENT')) return `/sales/invoices`;
  if (t.includes('USER')) return `/users`;
  return `/dashboard`;
}

export default function Navbar() {
  const { dark, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { isSuperAdmin, branches, selectedBranchId, selectedBranch, selectBranch } = useBranch();
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [branchQuery, setBranchQuery] = useState('');
  const branchRef = useRef<HTMLDivElement>(null);
  const branchBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Real notification polling — every 30s, branch-aware via ApiClient X-Branch-Id
  const fetchCount = async () => {
    try { const r = await AlertsAPI.getUnreadCount(); const c = r.count ?? 0; setNotifCount(prev=> { if(c>prev) setHasNew(true); return c; }); setTimeout(()=> setHasNew(false), 2000); } catch {}
  };
  const fetchNotifs = async () => {
    setNotifLoading(true);
    try { const r = await AlertsAPI.getUnread(); setNotifs((r.data||[]).slice(0,8)); } catch {} finally { setNotifLoading(false); }
  };
  useEffect(()=>{ fetchCount(); const id=setInterval(fetchCount, 30000); const onBranch=()=> fetchCount(); window.addEventListener('ims:branch-changed', onBranch); window.addEventListener('focus', fetchCount); return()=>{ clearInterval(id); window.removeEventListener('ims:branch-changed', onBranch); window.removeEventListener('focus', fetchCount); }; }, []);
  useEffect(()=>{ if(showNotifications) fetchNotifs(); }, [showNotifications]);

  const markAllRead = async () => {
    try { await AlertsAPI.markAllAsRead(); setNotifs(prev=> prev.map(n=> ({...n, read:true}))); setNotifCount(0); } catch {}
  };
  const handleNotifClick = async (n:any) => {
    try { if(!n.read) { await AlertsAPI.markAsRead(String(n.id)); setNotifCount(c=> Math.max(0,c-1)); setNotifs(prev=> prev.map(x=> x.id===n.id? {...x, read:true}:x)); } } catch {}
    setShowNotifications(false);
    router.push(notifHref(n));
  };

  const notifRef = useRef<HTMLDivElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileBtnRef = useRef<HTMLButtonElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  const closeAll = useCallback(() => {
    setShowNotifications(false);
    setShowProfile(false);
    setShowSettings(false);
    setBranchOpen(false);
  }, []);

  useOutsideClick(
    [notifRef, notifBtnRef, profileRef, profileBtnRef, settingsRef, settingsBtnRef, branchRef, branchBtnRef] as React.RefObject<HTMLElement | null>[],
    closeAll
  );
  useEscape(closeAll);

  return (
    <header className="sticky top-0 z-[1000] bg-white dark:bg-[#121218] min-h-[50px] border-b border-gray-200 dark:border-gray-700 px-6 flex items-center shadow-sm">
      <div className="flex items-center justify-between w-full">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="flex items-center no-underline">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#0F766E] to-[#14B8A6] shadow-sm shadow-teal-500/20">
              <Pill className="w-4 h-4 text-white" />
            </div>
          </a>

          <h4 className="hidden lg:block m-0 text-base font-semibold text-gray-900 dark:text-white ml-1">
            {getPageTitle(pathname)}
          </h4>
          {/* Current Branch — compact premium pill (SuperAdmin only) */}
          {isSuperAdmin && branches.length > 0 && (
            <div className="hidden md:flex items-center ml-3 pl-3 border-l border-gray-200 dark:border-gray-700">
              <div className="relative" ref={branchRef}>
                <button
                  ref={branchBtnRef}
                  onClick={() => setBranchOpen(o => !o)}
                  className="group flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-full bg-gray-50 dark:bg-[#1a1a24] border border-gray-200 dark:border-[#2a2a38] hover:bg-white dark:hover:bg-[#1e1e2a] hover:border-[#0F9291]/30 hover:shadow-md transition-all"
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0 ${selectedBranch ? 'bg-gradient-to-br from-[#0F9291] to-teal-600 text-white' : 'bg-white dark:bg-[#252535] border border-gray-200 dark:border-[#2a2a38] text-gray-500'}`}>
                    {selectedBranch ? (selectedBranch.type === 'CENTRAL_WAREHOUSE' ? <Warehouse className="w-4 h-4" /> : selectedBranch.type === 'WAREHOUSE' ? <Store className="w-4 h-4" /> : <Building2 className="w-4 h-4" />) : <Layers className="w-4 h-4" />}
                  </span>
                  <span className="min-w-0 text-left hidden lg:block pr-1">
                    <span className="block text-sm font-bold leading-none text-gray-900 dark:text-white truncate max-w-[160px]">{selectedBranch ? selectedBranch.name : 'All Branches'}</span>
                    <span className="block text-[11px] font-medium text-gray-500 truncate">{selectedBranch ? `${selectedBranch.code} · ${selectedBranch.city ?? selectedBranch.type}` : `${branches.filter(b=>b.status==='ACTIVE').length} branches • Global`}</span>
                  </span>
                  <span className="hidden lg:flex w-7 h-7 rounded-full bg-white dark:bg-[#252535] border border-gray-200 dark:border-[#2a2a38] group-hover:border-[#0F9291]/30 items-center justify-center shrink-0 transition-colors">
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${branchOpen ? 'rotate-180' : ''}`} />
                  </span>
                  <span className="lg:hidden w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                </button>

                {branchOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0 top-full mt-2.5 w-[340px] rounded-2xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#0F1525] shadow-2xl shadow-black/15 overflow-hidden animate-slideDown z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-[#273244] bg-gradient-to-br from-[#0F9291]/[0.04] to-teal-500/[0.03] dark:from-white/[0.03] dark:to-transparent">
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Building2 className="w-4 h-4 text-[#0F9291]" />Switch Branch</h4>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white dark:bg-[#1A2232] border border-gray-200 dark:border-[#273244] text-gray-500">{branches.filter(b=>b.status==='ACTIVE').length} active</span>
                      </div>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          autoFocus
                          value={branchQuery}
                          onChange={e => setBranchQuery(e.target.value)}
                          placeholder="Search branch, code or city..."
                          className="w-full h-9 pl-9 pr-8 text-sm bg-white dark:bg-[#1A2232] border border-gray-200 dark:border-[#273244] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/10 shadow-sm"
                        />
                        {branchQuery && <button onClick={() => setBranchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1.5 space-y-0.5">
                      <button onClick={() => { selectBranch(null); setBranchOpen(false); setBranchQuery(''); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors ${!selectedBranchId ? 'bg-[#0F9291] text-white shadow-md shadow-[#0F9291]/20' : 'hover:bg-gray-50'}`}>
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${!selectedBranchId ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}><Layers className="w-4 h-4" /></span>
                        <span className="min-w-0 flex-1"><span className={`block text-sm truncate ${!selectedBranchId ? 'font-bold text-white' : 'font-semibold text-gray-900 dark:text-white'}`}>All Branches</span><span className={`block text-xs truncate ${!selectedBranchId ? 'text-white/70' : 'text-gray-500'}`}>Global view — all branches data</span></span>
                        {!selectedBranchId && <span className="w-7 h-7 rounded-full bg-white text-[#0F9291] flex items-center justify-center shrink-0"><Check className="w-4 h-4" /></span>}
                      </button>
                      {branches.filter(b => b.status === 'ACTIVE').filter(b => !branchQuery || `${b.name} ${b.code} ${b.city ?? ''} ${b.type}`.toLowerCase().includes(branchQuery.toLowerCase())).map(b => {
                        const active = String(b.id) === String(selectedBranchId);
                        const Icon = b.type === 'CENTRAL_WAREHOUSE' ? Warehouse : b.type === 'WAREHOUSE' ? Store : Building2;
                        return (
                          <button key={String(b.id)} onClick={() => { selectBranch(String(b.id)); setBranchOpen(false); setBranchQuery(''); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${active ? 'bg-[#0F9291] text-white shadow-md shadow-[#0F9291]/20' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-white/5'}`}>
                            <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}><Icon className="w-4 h-4" /></span>
                            <span className="min-w-0 flex-1"><span className={`block text-sm truncate ${active ? 'font-bold text-white' : 'font-semibold text-gray-900 dark:text-white'}`}>{b.name}</span><span className={`block text-xs truncate flex items-center gap-1.5 ${active ? 'text-white/70' : 'text-gray-500'}`}>{b.code} {b.city ? `· ${b.city}` : ''} <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${active ? 'bg-white/20 text-white' : b.type === 'RETAIL' ? 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' : b.type === 'WAREHOUSE' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-violet-50 text-violet-700 dark:bg-violet-500/15'}`}>{b.type}</span></span></span>
                            {active ? <span className="w-7 h-7 rounded-full bg-white text-[#0F9291] flex items-center justify-center shrink-0"><Check className="w-4 h-4" /></span> : <ChevronDown className="w-4 h-4 text-gray-300 -rotate-90 shrink-0" />}
                          </button>
                        );
                      })}
                      {branches.filter(b => b.status === 'ACTIVE').filter(b => !branchQuery || `${b.name} ${b.code} ${b.city ?? ''}`.toLowerCase().includes(branchQuery.toLowerCase())).length === 0 && <p className="px-3 py-10 text-center"><span className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-2"><Search className="w-5 h-5 text-gray-400" /></span><span className="text-sm text-gray-500">No branches match “{branchQuery}”</span></p>}
                    </div>
                    <div className="px-3 py-2.5 border-t border-gray-100 dark:border-[#273244] bg-gray-50/70 dark:bg-white/[0.02] flex items-center justify-between">
                      <span className="text-xs text-gray-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{branches.filter(b=>b.status==='ACTIVE').length} active branches</span>
                      <button onClick={() => setBranchOpen(false)} className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#0F9291] px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-white/5 transition-colors">Close</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-1.5">

          {/* Search */}
          <div className="flex items-center">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-[1] transition-colors duration-250 group-focus-within:text-[#0F9291]" />
              <input type="text" placeholder="Search"
                className="h-9 text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-[#2a2a38] rounded-xl bg-gray-50 dark:bg-[#1a1a24] pl-9 pr-11 w-[200px] outline-none transition-all duration-250 focus:w-[260px] focus:border-[#0F9291] focus:bg-white dark:focus:bg-gray-700 focus:shadow-[0_0_0_3px_rgba(15,146,145,0.1)]"
              />
              <span className="flex items-center justify-center absolute right-[5px] top-1/2 -translate-y-1/2 w-[38px] h-[26px] rounded-lg bg-gray-200/70 gap-0.5 text-xs text-gray-500 font-medium">
                <Command className="w-3 h-3" />K
              </span>
            </div>
          </div>

          {/* POS Button */}
          <a href="/pos"
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-[#0F9291] to-[#14B8A6] text-white text-sm font-semibold no-underline hover:shadow-lg hover:shadow-teal-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-250"
          >
            <ShoppingCart className="w-[16px] h-[16px]" />
            <span className="hidden sm:inline">POS</span>
          </a>

          {/* Theme Toggle */}
          <div className="flex items-center">
            {mounted && (
              <button onClick={toggleTheme}
                className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-[#2a2a38] bg-white dark:bg-[#1a1a24] cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#222230] hover:shadow-sm transition-all duration-250"
                title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <div className="transition-transform duration-500 hover:rotate-180">
                  {dark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                </div>
              </button>
            )}
          </div>

          {/* Notifications — REAL, branch-aware, polled */}
          <div className="flex items-center relative">
            <button ref={notifBtnRef} onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); setShowSettings(false); }}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-[#2a2a38] bg-white dark:bg-[#1a1a24] cursor-pointer relative hover:bg-gray-50 dark:hover:bg-[#222230] hover:shadow-sm transition-all duration-250"
              style={{ color: showNotifications ? '#0F9291' : '#101828' }}
            >
              <Bell className={`w-[18px] h-[18px] ${hasNew?'animate-bounce':''}`} />
              {notifCount > 0 && (
                <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white rounded-full border-2 border-white ${hasNew?'animate-pulse':''}`} style={{ background: notifCount>0 && notifs.some((n:any)=> String(n.severity).toUpperCase()==='CRITICAL') ? '#EF4444' : '#EF4444' }}>
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div ref={notifRef}
                className="absolute right-0 top-full mt-2 bg-white dark:bg-[#121218] rounded-2xl border border-gray-200 dark:border-gray-700 w-[380px] z-[1050] p-5 animate-slideDown"
                style={{ boxShadow: '0 20px 60px rgba(15,23,42,0.12)' }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <h5 className="m-0 text-base font-semibold text-gray-900 dark:text-white">Notifications {notifCount>0 && <span className="ml-2 text-xs font-normal text-gray-500">{notifCount} unread</span>}</h5>
                  {notifCount>0 && <button onClick={markAllRead} className="text-sm font-medium text-[#0F9291] underline border-0 bg-transparent cursor-pointer p-0 hover:text-teal-700 transition-colors">Mark all as read</button>}
                </div>
                <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                  <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }`}</style>
                  {notifLoading ? (
                    <div className="space-y-3">{[1,2,3].map(i=> <div key={i} className="h-16 bg-gray-50 dark:bg-white/5 rounded-xl animate-pulse"/> )}</div>
                  ) : notifs.length===0 ? (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3"><CheckCheck className="w-7 h-7 text-emerald-500"/></div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">You&apos;re all caught up</p>
                      <p className="text-xs text-gray-500 mt-1">No new notifications.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {notifs.map((n:any)=> {
                        const { Icon, bg, border } = notifIcon(n.type, n.severity);
                        const isCrit = String(n.severity).toUpperCase()==='CRITICAL' || String(n.type).toUpperCase().includes('OUT_OF_STOCK') || String(n.type).toUpperCase()==='EXPIRED';
                        return (
                          <button key={String(n.id)} onClick={()=> handleNotifClick(n)} className={`flex gap-3 w-full text-left p-3 rounded-xl border transition-all ${n.read ? 'bg-white dark:bg-transparent border-transparent opacity-70' : 'bg-gray-50 dark:bg-white/[0.04] border-gray-100 dark:border-white/5 hover:border-[#0F9291]/20'} ${isCrit?'ring-1 ring-red-100':''}`}>
                            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border" style={{ background: bg, borderColor: border }}><Icon className="w-4 h-4" style={{ color: isCrit?'#EF4444':'#0F9291'}}/></span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-gray-900 dark:text-white truncate">{n.title}</span>
                              <span className="block text-xs text-gray-500 truncate">{n.message}</span>
                              <span className="block text-[11px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</span>
                            </span>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-[#0F9291] shrink-0 mt-2"/>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="pt-3">
                  <a href="/notifications"
                    className="flex items-center justify-center w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#2a2a38] bg-white dark:bg-[#1a1a24] cursor-pointer text-sm font-semibold text-gray-900 dark:text-gray-100 gap-2 hover:bg-gray-50 dark:hover:bg-[#222230] hover:shadow-sm transition-all duration-250 active:scale-[0.98] no-underline"
                    onClick={()=> setShowNotifications(false)}
                  >
                    View All
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="flex items-center relative">
            <button ref={settingsBtnRef} onClick={() => { setShowSettings(!showSettings); setShowNotifications(false); setShowProfile(false); }}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-[#2a2a38] bg-white dark:bg-[#1a1a24] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#222230] hover:shadow-sm transition-all duration-250"
              style={{ color: showSettings ? '#0F9291' : '#101828' }}
            >
              <Settings className="w-[18px] h-[18px]" />
            </button>

            {showSettings && (
              <div ref={settingsRef}
                className="absolute right-0 top-full mt-2 bg-white dark:bg-[#121218] rounded-2xl border border-gray-200 dark:border-gray-700 w-[220px] z-[1050] p-2 animate-slideDown"
                style={{ boxShadow: '0 20px 60px rgba(15,23,42,0.12)' }}
              >
                <a href="/warehouses"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-250"
                >
                  <Building2 className="w-4 h-4" /> Warehouse Settings
                </a>
                <a href="/brands"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-250"
                >
                  <Database className="w-4 h-4" /> Brand Settings
                </a>
                <div className="pt-1 mt-1 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => { toggleTheme(); closeAll(); }}
                    className="flex items-center justify-between w-full gap-2.5 px-3 py-2.5 rounded-xl border-0 bg-transparent cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-250"
                  >
                    <span className="flex items-center gap-3">
                      {mounted && (dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
                      {dark ? 'Light Mode' : 'Dark Mode'}
                    </span>
                    <span className="text-[#0F9291] dark:text-[#14B8A6]">{dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center justify-center relative">
            <button ref={profileBtnRef} onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); setShowSettings(false); }}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-[#2a2a38] bg-white dark:bg-[#1a1a24] cursor-pointer p-0 overflow-hidden hover:shadow-sm transition-all duration-250"
            >
              <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-[#0F766E] to-[#14B8A6] text-white font-bold text-sm">
                RK
              </div>
            </button>

            {showProfile && (
              <div ref={profileRef}
                className="absolute right-0 top-full mt-2 bg-white dark:bg-[#121218] rounded-2xl border border-gray-200 dark:border-gray-700 w-[280px] z-[1050] p-4 animate-scaleIn"
                style={{ boxShadow: '0 20px 60px rgba(15,23,42,0.12)' }}
              >
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#1a1a24]/50 rounded-xl p-3 mb-2">
                  <div className="flex items-center justify-center shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#0F766E] to-[#14B8A6] text-white font-bold text-sm shadow-md">
                    RK
                  </div>
                  <div>
                  <p className="m-0 font-semibold text-sm text-gray-900 dark:text-white">Rajesh Kumar</p>
                  <span className="text-[13px] text-gray-500 dark:text-gray-400">Pharmacist</span>
                  </div>
                </div>

                <a href="/people/stores"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-250"
                >
                  <UserCog className="w-4 h-4" /> My Profile
                </a>
                <a href="/reports/sales"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-250"
                >
                  <BarChart3 className="w-4 h-4" /> Reports
                </a>
                <label className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer m-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-250">
                  <span className="flex items-center gap-3">
                    <Bell className="w-4 h-4" /> Notifications
                  </span>
                  <input type="checkbox" defaultChecked
                    className="cursor-pointer accent-[#0F9291] rounded" />
                </label>
                <a href="/warehouses"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-250"
                >
                  <Settings className="w-4 h-4" /> Settings
                </a>
                <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-700">
                  <button
                    className="flex items-center w-full gap-3 px-3 py-2.5 rounded-xl border-0 bg-transparent cursor-pointer text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-250"
                    onClick={() => { window.location.href = '/login'; }}
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
