'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Package, AlertTriangle, Clock, Ban, ShoppingCart, TrendingUp, CheckCheck, Trash2, Building2, House } from '@/components/ui/LucideIcon';
import { AlertsAPI } from '@/lib/api';

function timeAgo(iso?: string){ if(!iso) return 'Just now'; const d=new Date(iso); const s=Math.floor((Date.now()-d.getTime())/1000); if(s<60) return 'Just now'; if(s<3600) return `${Math.floor(s/60)}m ago`; if(s<86400) return `${Math.floor(s/3600)}h ago`; const dt=d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); return dt; }
function iconFor(a:any){ const t=String(a.type||'').toUpperCase(); const s=String(a.severity||'').toUpperCase(); if(t.includes('OUT_OF_STOCK')) return {Icon:Ban,bg:'#FFEDEA',c:'#EF4444'}; if(t.includes('LOW_STOCK')) return {Icon:AlertTriangle,bg:'#FFF1EB',c:'#F97316'}; if(t.includes('EXPIR')) return {Icon:Clock,bg:'#FFF6ED',c:'#FA9200'}; if(t.includes('SALE')) return {Icon:TrendingUp,bg:'#FFF6ED',c:'#0F9291'}; if(t.includes('PURCHASE')) return {Icon:ShoppingCart,bg:'#EAF0FF',c:'#3848F5'}; if(t.includes('PAYMENT')) return {Icon:s==='SUCCESS'?CheckCheck:AlertTriangle,bg:s==='SUCCESS'?'#EAFBF0':'#FFEDEA',c:s==='SUCCESS'?'#0E9F6E':'#EF4444'}; return {Icon:Package,bg:'#F4F6FA',c:'#667085'}; }
function hrefFor(a:any){ const t=String(a.type||'').toUpperCase(); if(t.includes('STOCK')||t.includes('PRODUCT')) return '/medicines'; if(t.includes('BATCH')||t.includes('EXPIR')) return '/batch-management'; if(t.includes('SALE')) return '/sales/invoices'; if(t.includes('PURCHASE')) return '/purchases'; if(t.includes('PAYMENT')) return '/sales/invoices'; if(t.includes('USER')) return '/users'; return '/dashboard'; }

const TABS = [
  {k:'ALL', l:'All'},
  {k:'UNREAD', l:'Unread'},
  {k:'CRITICAL', l:'Critical'},
  {k:'INVENTORY', l:'Inventory'},
  {k:'PAYMENTS', l:'Payments'},
  {k:'SALES', l:'Sales'},
  {k:'PURCHASES', l:'Purchases'},
];

export default function NotificationsPage(){
  const [tab,setTab]=useState('ALL');
  const [page,setPage]=useState(0);
  const [data,setData]=useState<any[]>([]);
  const [totalPages,setTotalPages]=useState(1);
  const [loading,setLoading]=useState(true);
  const [filterType,setFilterType]=useState<string|undefined>(undefined);
  const [unreadOnly,setUnreadOnly]=useState<boolean|undefined>(undefined);

  const load=async()=>{
    setLoading(true);
    try{
      let type: string|undefined;
      let unread: boolean|undefined;
      if(tab==='UNREAD') unread=true;
      else if(tab==='CRITICAL') type='OUT_OF_STOCK'; // will filter client side for severity
      else if(tab==='INVENTORY') type=undefined; // client filter
      else if(tab==='PAYMENTS') type='PAYMENT_SUCCESS';
      else if(tab==='SALES') type='SALE_CREATED';
      else if(tab==='PURCHASES') type='PURCHASE_CREATED';
      const res:any = await AlertsAPI.getAll({page, size:10, type, unread});
      let list:any[] = res.data||[];
      // Client-side tab filtering for composite tabs
      if(tab==='CRITICAL') list=list.filter((a:any)=> String(a.severity).toUpperCase()==='CRITICAL' || String(a.type).toUpperCase().includes('OUT_OF_STOCK') || String(a.type).toUpperCase()==='EXPIRED');
      if(tab==='INVENTORY') list=list.filter((a:any)=> ['LOW_STOCK','OUT_OF_STOCK','EXPIRING_SOON','EXPIRED','EXPIRING_BATCH'].includes(String(a.type).toUpperCase()));
      if(tab==='PAYMENTS') list=list.filter((a:any)=> String(a.type).toUpperCase().includes('PAYMENT'));
      setData(list);
      setTotalPages(res.totalPages||1);
    } catch{ setData([]); } finally{ setLoading(false); }
  };
  useEffect(()=>{ load(); }, [tab,page]);
  useEffect(()=>{ const h=()=> load(); window.addEventListener('ims:branch-changed',h); return()=> window.removeEventListener('ims:branch-changed',h); }, []);

  const markOne=async(a:any)=>{
    try{ await AlertsAPI.markAsRead(String(a.id)); setData(prev=> prev.map(x=> x.id===a.id? {...x, read:true}:x)); } catch{}
    window.location.href=hrefFor(a);
  };
  const markAll=async()=>{ try{ await AlertsAPI.markAllAsRead(); setData(prev=> prev.map(x=> ({...x, read:true}))); } catch{} };

  return (
    <div className="p-4 sm:p-6 bg-[#f8f9fa] min-h-screen -m-6">
      <div className="max-w-[900px] mx-auto p-4 sm:p-6">
        <nav className="flex items-center gap-1.5 text-sm mb-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 no-underline flex items-center gap-1"><House className="w-4 h-4"/> Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium flex items-center gap-1"><Bell className="w-4 h-4"/> Notifications</span>
        </nav>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-gray-900">Notifications</h1>
          <button onClick={markAll} className="text-sm font-medium text-[#0F9291] underline bg-transparent border-0 cursor-pointer">Mark all as read</button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {TABS.map(t=>(
            <button key={t.k} onClick={()=>{setTab(t.k); setPage(0);}} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${tab===t.k?'bg-[#0F9291] text-white border-[#0F9291]':'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>{t.l}</button>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i=> <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse"/>)}</div>
          ) : data.length===0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3"><CheckCheck className="w-8 h-8 text-emerald-500"/></div>
              <p className="text-base font-semibold text-gray-900">You&apos;re all caught up</p>
              <p className="text-sm text-gray-500 mt-1">No notifications.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.map((a:any)=>{
                const {Icon,bg,c}=iconFor(a);
                const isCrit=String(a.severity).toUpperCase()==='CRITICAL';
                return (
                  <div key={String(a.id)} onClick={()=> markOne(a)} className={`flex gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!a.read?'bg-gray-50/50':''} ${isCrit?'border-l-4 border-l-red-500':''}`}>
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border" style={{background:bg, borderColor:bg}}><Icon className="w-5 h-5" style={{color:c}}/></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                      <p className="text-sm text-gray-600 truncate">{a.message}</p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">{timeAgo(a.createdAt)} {!a.read && <span className="w-2 h-2 rounded-full bg-[#0F9291]"/>} {a.branchId && <span className="inline-flex items-center gap-1 text-xs text-gray-500"><Building2 className="w-3 h-3"/> Branch {a.branchId}</span>}</p>
                    </div>
                    <span className={`hidden sm:inline-flex h-6 px-2 rounded-full text-xs font-semibold border shrink-0 ${a.read?'bg-white text-gray-500 border-gray-200':'bg-[#0F9291]/10 text-[#0F9291] border-[#0F9291]/20'}`}>{a.read?'Read':'Unread'}</span>
                  </div>
                );
              })}
            </div>
          )}
          {totalPages>1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-100">
              <button disabled={page===0} onClick={()=> setPage(p=> Math.max(0,p-1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-50">Prev</button>
              <span className="text-sm text-gray-500">Page {page+1} of {totalPages}</span>
              <button disabled={page+1>=totalPages} onClick={()=> setPage(p=> p+1)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
