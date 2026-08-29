'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Store, Warehouse, Plus, Search, RefreshCw, Maximize, House, Edit2, UserCheck, Users, TrendingUp, MapPin, Phone, Mail, Shield, Archive, Ban, Trash2, X, CheckCircle2, AlertTriangle, BriefcaseMedical, Eye } from '@/components/ui/LucideIcon';
import { BranchesAPI, UsersAPI } from '@/lib/api';
import { useBranch } from '@/lib/branch-context';
import { useAuth } from '@/lib/auth-context';
import GlobalModal from '@/components/ui/GlobalModal';
import { Branch } from '@/types';

export default function BranchesHubPage() {
  const { branches, selectedBranchId, isSuperAdmin, refresh } = useBranch();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{show:boolean; message:string; type:'success'|'error'}>({show:false,message:'',type:'success'});
  const [form, setForm] = useState({ code:'', name:'', type:'RETAIL' as Branch['type'], address:'', city:'', phone:'', email:'', status:'ACTIVE' as Branch['status'] });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => { if(toast.show){ const t=setTimeout(()=>setToast(p=>({...p,show:false})),3000); return()=>clearTimeout(t);} },[toast.show]);

  useEffect(() => { UsersAPI.getAll().then(r=>setUsers(r.data||[])).catch(()=>{}); }, []);

  const filtered = branches.filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.code.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!form.code || !form.name) { setToast({show:true,message:'Code & name required',type:'error'}); return; }
    setLoading(true);
    try {
      await BranchesAPI.create({ code: form.code, name: form.name, type: form.type, address: form.address, city: form.city, phone: form.phone, email: form.email, status: form.status });
      setToast({show:true,message:'Branch created',type:'success'}); setShowCreate(false); setForm({ code:'', name:'', type:'RETAIL', address:'', city:'', phone:'', email:'', status:'ACTIVE'}); refresh();
    } catch(e:any){ setToast({show:true,message:e.message||'Failed',type:'error'});} finally{ setLoading(false); }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setLoading(true);
    try {
      await BranchesAPI.update(editing.id, { name: form.name, address: form.address, city: form.city, phone: form.phone, email: form.email, status: form.status, type: form.type });
      setToast({show:true,message:'Branch updated',type:'success'}); setEditing(null); refresh();
    } catch(e:any){ setToast({show:true,message:e.message||'Failed',type:'error'});} finally{ setLoading(false); }
  };

  const handleDisable = async (b:Branch) => {
    try{ await BranchesAPI.disable(b.id); setToast({show:true,message:'Branch disabled',type:'success'}); refresh(); } catch(e:any){ setToast({show:true,message:e.message,type:'error'});}
  };
  const openEdit = (b:Branch) => { setEditing(b); setForm({ code:b.code, name:b.name, type:b.type, address:b.address||'', city:b.city||'', phone:b.phone||'', email:b.email||'', status:b.status}); };

  const currentBranch = selectedBranchId ? branches.find(b=>b.id===selectedBranchId) : null;
  const isManagerView = !isSuperAdmin && currentBranch;

  return (
    <div className="p-4 sm:p-6 bg-[#f8f9fa] min-h-screen -m-6">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6">
        {toast.show && (
          <div className={`fixed top-6 right-6 z-[1060] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border ${toast.type==='success'?'bg-emerald-50 border-emerald-200 text-emerald-800':'bg-red-50 border-red-200 text-red-800'}`}>
            {toast.type==='success'?<CheckCircle2 className="w-5 h-5"/>:<AlertTriangle className="w-5 h-5"/>}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={()=>setToast(p=>({...p,show:false}))} className="ml-2 opacity-50 hover:opacity-100"><X className="w-4 h-4"/></button>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm list-none p-0 m-0">
              <li><Link href="/dashboard" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 no-underline"><House className="w-4 h-4"/> Dashboard</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium">Branches</li>
              {isManagerView && <li className="ml-2 hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0F9291]/10 text-[#0F9291] text-xs font-semibold border border-[#0F9291]/20"><Building2 className="w-3 h-3"/> {currentBranch?.name}</li>}
            </ol>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={()=>refresh()} className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600"><RefreshCw className="w-4 h-4"/></button>
            <button className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600"><Maximize className="w-4 h-4"/></button>
            {isSuperAdmin && <button onClick={()=>setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F9291] hover:bg-[#0e7a79] text-white rounded-lg text-sm font-medium shadow-sm"><Plus className="w-4 h-4"/> New Branch</button>}
          </div>
        </div>

        {isManagerView ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start gap-4 mb-6">
              <span className="w-14 h-14 rounded-2xl bg-[#0F9291]/10 flex items-center justify-center"><Building2 className="w-7 h-7 text-[#0F9291]"/></span>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{currentBranch?.name} <span className="text-sm font-normal text-gray-500">({currentBranch?.code})</span></h2>
                <p className="text-sm text-gray-500 flex items-center gap-2 mt-1"><MapPin className="w-4 h-4"/> {currentBranch?.address || ''} {currentBranch?.city || ''} · <Phone className="w-4 h-4"/> {currentBranch?.phone || '-'} · <Mail className="w-4 h-4"/> {currentBranch?.email || '-'}</p>
                <span className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-semibold border ${currentBranch?.status==='ACTIVE'?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-amber-50 text-amber-700 border-amber-200'}`}>{currentBranch?.status}</span>
              </div>
              <button onClick={()=> currentBranch && openEdit(currentBranch)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"><Edit2 className="w-4 h-4"/> Edit</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Role</p><p className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-gray-400"/> {user?.role}</p></div>
              <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Manager</p><p className="font-semibold">{currentBranch?.managerName || '—'}</p></div>
              <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Type</p><p className="font-semibold flex items-center gap-2">{currentBranch?.type==='CENTRAL_WAREHOUSE'?<Warehouse className="w-4 h-4"/>:currentBranch?.type==='WAREHOUSE'?<Store className="w-4 h-4"/>:<Building2 className="w-4 h-4"/>} {currentBranch?.type}</p></div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2"><Users className="w-4 h-4"/> Employees in this Branch</h4>
                <p className="text-sm text-gray-500">{users.filter((u:any)=>String(u.branchId)===String(currentBranch?.id)).length} users (filtered client-side)</p>
                <Link href="/settings/users" className="text-sm text-[#0F9291] hover:underline mt-2 inline-block">Manage Users →</Link>
              </div>
              <div className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4"/> Branch Performance</h4>
                <p className="text-sm text-gray-500">Sales, purchases, stock — scoped to this branch via <code className="bg-gray-100 px-1 rounded">X-Branch-Id: {currentBranch?.id}</code></p>
                <Link href="/reports/sales" className="text-sm text-[#0F9291] hover:underline mt-2 inline-block">View Reports →</Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input placeholder="Search branches..." value={search} onChange={e=>setSearch(e.target.value)} className="w-72 h-9 pl-9 pr-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20" />
                </div>
                <div className="text-sm text-gray-500">{filtered.length} branches · {branches.filter(b=>b.status==='ACTIVE').length} active · super-admin view</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(b => (
                <div key={b.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${String(b.id)===String(selectedBranchId)?'ring-2 ring-[#0F9291] border-[#0F9291]':''}`}>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${b.type==='CENTRAL_WAREHOUSE'?'bg-purple-50 text-purple-700':b.type==='WAREHOUSE'?'bg-amber-50 text-amber-700':'bg-[#0F9291]/10 text-[#0F9291]'}`}>
                        {b.type==='CENTRAL_WAREHOUSE'?<Warehouse className="w-5 h-5"/>:b.type==='WAREHOUSE'?<Store className="w-5 h-5"/>:<Building2 className="w-5 h-5"/>}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${b.status==='ACTIVE'?'bg-emerald-50 text-emerald-700 border-emerald-200':b.status==='DISABLED'?'bg-amber-50 text-amber-700 border-amber-200':'bg-gray-100 text-gray-600 border-gray-200'}`}>{b.status}</span>
                    </div>
                    <h3 className="font-bold text-gray-900">{b.name} <span className="text-xs font-normal text-gray-500">({b.code})</span></h3>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> {b.address || ''} {b.city || ''}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-2 mt-1"><Phone className="w-3 h-3"/> {b.phone || '-'} · <Mail className="w-3 h-3"/> {b.email || '-'}</p>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><UserCheck className="w-3 h-3"/> Manager: {b.managerName || <span className="text-gray-400">Unassigned</span>}</p>
                    <div className="flex gap-2 mt-4">
                      <Link href={`/branches/${b.id}`} target="_blank" className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 bg-[#0F9291] text-white rounded-lg text-sm hover:bg-[#0e7a79] font-medium"><Eye className="w-4 h-4"/> View Branch</Link>
                      <button onClick={()=> openEdit(b)} className="h-9 px-3 inline-flex items-center justify-center gap-1 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50" title="Edit"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={()=>handleDisable(b)} className="h-9 px-3 inline-flex items-center justify-center gap-1 bg-white border border-amber-200 text-amber-700 rounded-lg text-sm hover:bg-amber-50" title="Disable"><Ban className="w-4 h-4"/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {(showCreate || editing) && (
          <GlobalModal onClose={()=>{setShowCreate(false); setEditing(null);}} title={editing?'Edit Branch':'New Branch'} icon={<Building2 className="w-5 h-5"/>} submitLabel={editing?'Update':'Create'} onSubmit={editing?handleUpdate:handleCreate} submitting={loading}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Code *</label><input value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))} disabled={!!editing} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-100" placeholder="BR-XXX"/></div>
                <div><label className="block text-sm font-medium mb-1">Type</label><select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value as any}))} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm"><option value="RETAIL">RETAIL</option><option value="WAREHOUSE">WAREHOUSE</option><option value="CENTRAL_WAREHOUSE">CENTRAL_WAREHOUSE</option></select></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">City</label><input value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm"/></div>
                <div><label className="block text-sm font-medium mb-1">Phone</label><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm"/></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Address</label><input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm"/></div>
                <div><label className="block text-sm font-medium mb-1">Status</label><select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value as any}))} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm"><option value="ACTIVE">ACTIVE</option><option value="DISABLED">DISABLED</option><option value="ARCHIVED">ARCHIVED</option></select></div>
              </div>
            </div>
          </GlobalModal>
        )}
      </div>
    </div>
  );
}
