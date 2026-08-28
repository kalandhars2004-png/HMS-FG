'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, Plus, RefreshCw, Maximize, House, Filter, ArrowUpDown, Upload, ArrowUpToLine, Eye, Edit2, Trash2, X, Users, UserCheck, UserPlus, Repeat, Phone, Mail, ShoppingCart, ChevronDown, LayoutGrid, ListTodo, Grid, CheckCircle2, AlertTriangle, Building2, Calendar, MapPin } from '@/components/ui/LucideIcon';
import { CustomersAPI } from '@/lib/api';
import { useBranch } from '@/lib/branch-context';
import { formatCurrency } from '@/lib/currency';
import GlobalModal from '@/components/ui/GlobalModal';

interface Customer {
  id: string;
  code: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  address: string;
  branchId: string | null;
  branchName: string | null;
  status: 'Active' | 'Inactive';
  loyaltyPoints: number;
  lifetimeSpend: number;
  purchaseCount: number;
  lastPurchase: string;
}

export default function CustomersPage() {
  const { selectedBranchId, selectedBranch, isSuperAdmin, branches } = useBranch();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [firstName, setFirstName] = useState(''); const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(''); const [phone, setPhone] = useState('');
  const [addr, setAddr] = useState('');

  useEffect(() => { if (toast.show) { const t = setTimeout(() => setToast(p => ({ ...p, show: false })), 3000); return () => clearTimeout(t); } }, [toast.show]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await CustomersAPI.getAll();
      const list: any[] = res.data || [];
      if (list.length > 0) {
        setCustomers(list.map((c: any, i: number) => {
          const name = c.name || `Customer ${i+1}`;
          const initials = name.split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2);
          const branchName = c.branchName || (c.branchId ? branches.find(b=>String(b.id)===String(c.branchId))?.name : null) || selectedBranch?.name || null;
          return {
            id: String(c.id), code: `#CUS${String(c.id).padStart(3,'0')}`, name, initials,
            email: c.email || '', phone: c.phone || '', address: c.address || '',
            branchId: c.branchId != null ? String(c.branchId) : selectedBranchId,
            branchName,
            status: 'Active' as const,
            loyaltyPoints: c.loyaltyPoints ?? 0,
            lifetimeSpend: Number(c.lifetimeSpend ?? 0),
            purchaseCount: c.purchaseCount ?? 0,
            lastPurchase: c.lastPurchase ? new Date(c.lastPurchase).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'}) : '-',
          };
        }));
      } else {
        setCustomers([
          { id: '1', code: '#CUS016', name: 'Andrew George', initials: 'AG', email: 'jackde@example.com', phone: '+1 56589 54547', address: '123 Main St, New York', branchId: selectedBranchId, branchName: selectedBranch?.name || null, status: 'Active', loyaltyPoints: 120, lifetimeSpend: 6565, purchaseCount: 12, lastPurchase: '28 Jan 2026' },
          { id: '2', code: '#CUS017', name: 'Anderson Claire', initials: 'AC', email: 'andersonc@example.com', phone: '+1 56589 54547', address: '456 Oak Ave', branchId: selectedBranchId, branchName: selectedBranch?.name || null, status: 'Active', loyaltyPoints: 80, lifetimeSpend: 4230, purchaseCount: 8, lastPurchase: '15 Feb 2026' },
        ]);
      }
    } catch { setToast({ show: true, message: 'Failed to load customers', type: 'error' }); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [selectedBranchId]);
  useEffect(() => {
    const onBranch = () => load();
    window.addEventListener('ims:branch-changed', onBranch);
    return () => window.removeEventListener('ims:branch-changed', onBranch);
  }, [selectedBranchId]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let list = customers.filter(c => !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q));
    if (branchFilter !== 'all') list = list.filter(c => String(c.branchId) === branchFilter);
    if (sortBy === 'name-asc') list = [...list].sort((a,b)=>a.name.localeCompare(b.name));
    else if (sortBy === 'name-desc') list = [...list].sort((a,b)=>b.name.localeCompare(a.name));
    else if (sortBy === 'spend-high') list = [...list].sort((a,b)=>b.lifetimeSpend - a.lifetimeSpend);
    else if (sortBy === 'spend-low') list = [...list].sort((a,b)=>a.lifetimeSpend - b.lifetimeSpend);
    return list;
  }, [customers, searchQuery, branchFilter, sortBy]);

  const stats = [
    { title: 'All Customers', value: String(customers.length), change: '2%', up: true, icon: Users },
    { title: 'Branch Customers', value: String(selectedBranch ? customers.filter(c=>String(c.branchId)===String(selectedBranchId)).length : customers.length), change: '4.2%', up: true, icon: UserCheck },
    { title: 'Avg Spend', value: formatCurrency(customers.length? customers.reduce((s,c)=>s+c.lifetimeSpend,0)/customers.length :0), change: '9.6%', up: false, icon: ShoppingCart },
    { title: 'Total Points', value: String(customers.reduce((s,c)=>s+c.loyaltyPoints,0)), change: '2%', up: true, icon: Repeat },
  ];

  const handleAdd = async () => {
    if (!firstName || !phone) { setToast({ show: true, message: 'Name & phone required', type: 'error' }); return; }
    const name = `${firstName} ${lastName}`.trim();
    try {
      await CustomersAPI.create({ name, email, phone, address: addr, branchId: selectedBranchId });
      setToast({ show: true, message: `Customer "${name}" added to ${selectedBranch?.name || 'branch'}`, type: 'success' });
      setShowAddModal(false); setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setAddr(''); load();
    } catch (e:any) { setToast({ show: true, message: e.message || 'Failed to create', type: 'error' }); }
  };

  return (
    <div className="p-4 sm:p-6 bg-[#f8f9fa] min-h-screen -m-6">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6">
        {toast.show && (
          <div className={`fixed top-6 right-6 z-[1060] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(p => ({ ...p, show: false }))} className="ml-2 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm list-none p-0 m-0">
              <li><Link href="/dashboard" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 no-underline"><House className="w-4 h-4" /> Dashboard</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium">Customers</li>
              {selectedBranch ? <li className="ml-2 hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0F9291]/10 text-[#0F9291] text-xs font-semibold border border-[#0F9291]/20"><Building2 className="w-3 h-3" /> {selectedBranch.name}</li> : isSuperAdmin ? <li className="ml-2 hidden sm:inline-flex px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">All Branches</li> : null}
            </ol>
          </nav>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-full border bg-white shadow-sm">
              <button onClick={() => setView('grid')} className={`w-8 h-8 rounded-full inline-flex items-center justify-center ${view === 'grid' ? 'bg-[#0F9291] text-white' : 'text-gray-500 hover:bg-gray-50'}`}><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setView('list')} className={`w-8 h-8 rounded-full inline-flex items-center justify-center ${view === 'list' ? 'bg-[#0F9291] text-white' : 'text-gray-500 hover:bg-gray-50'}`}><ListTodo className="w-4 h-4" /></button>
            </div>
            <button onClick={load} className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600"><RefreshCw className="w-4 h-4" /></button>
            <button className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600"><Maximize className="w-4 h-4" /></button>
            <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F9291] hover:bg-[#0e7a79] text-white rounded-lg text-sm font-medium shadow-sm"><Plus className="w-4 h-4" /> Add New</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {stats.map(card => (
            <div key={card.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-12 h-12 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center"><card.icon className="w-6 h-6 text-gray-700" /></span>
                <div><span className="block text-sm font-bold text-gray-900 leading-tight">{card.title}</span><span className="text-xs text-gray-500">{selectedBranch?.name || 'Company-wide'}</span></div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg font-bold text-gray-900">{card.value}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${card.up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{card.change}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
          <div className="px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-64 h-9 pl-9 pr-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20" />
              </div>
              {isSuperAdmin && (
                <select value={branchFilter} onChange={e=>setBranchFilter(e.target.value)} className="h-9 px-3 text-sm bg-white border border-gray-200 rounded-lg">
                  <option value="all">All Branches</option>
                  {branches.map(b=> <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                </select>
              )}
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <button onClick={() => setShowFilter(true)} className="w-9 h-9 inline-flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"><Filter className="w-4 h-4" /></button>
              <div className="relative">
                <button onClick={() => setShowSort(s => !s)} className="h-9 px-3 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"><ArrowUpDown className="w-4 h-4" /> Sort by</button>
                {showSort && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-20">
                    {[
                      {k:'default',l:'Default'},
                      {k:'name-asc',l:'Name A-Z'},
                      {k:'name-desc',l:'Name Z-A'},
                      {k:'spend-high',l:'Spend High-Low'},
                      {k:'spend-low',l:'Spend Low-High'},
                    ].map(s=> <a key={s.k} href="#" onClick={e=>{e.preventDefault(); setSortBy(s.k); setShowSort(false);}} className={`block px-3 py-2 text-sm hover:bg-gray-50 no-underline ${sortBy===s.k?'text-[#0F9291] font-semibold':'text-gray-700'}`}>{s.l}</a>)}
                  </div>
                )}
              </div>
              <button className="h-9 px-3 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"><Upload className="w-4 h-4" /> Import</button>
              <div className="relative">
                <button onClick={() => setShowExport(s => !s)} className="h-9 px-3 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"><ArrowUpToLine className="w-4 h-4" /> Export</button>
                {showExport && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-20">
                    <a href="#" onClick={e => { e.preventDefault(); window.print(); setShowExport(false); }} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline">Export as PDF</a>
                    <a href="#" onClick={e => { e.preventDefault(); setShowExport(false); }} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline">Export as Excel</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="h-52 bg-white rounded-xl border border-gray-200 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">No customers in {selectedBranch?.name || 'this branch'} — add one or switch branch.</div>
        ) : view === 'list' ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f8f9fa] border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Branch</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Spend / Orders</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-sky-50 border border-sky-200 text-sky-700 inline-flex items-center justify-center text-xs font-semibold">{c.initials}</span><span className="font-medium text-gray-900">{c.name}</span><span className="text-xs text-gray-500">{c.code}</span></div></td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"><Building2 className="w-3 h-3" /> {c.branchName || '-'}</span></td>
                      <td className="px-4 py-3 text-gray-600"><div className="text-xs">{c.email}<br/>{c.phone}</div></td>
                      <td className="px-4 py-3 text-gray-900">{formatCurrency(c.lifetimeSpend)} · {c.purchaseCount} orders</td>
                      <td className="px-4 py-3 text-right"><button onClick={() => { setSelected(c); setShowDetail(true); }} className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-gray-100"><Eye className="w-4 h-4 text-gray-500" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(customer => (
              <div key={customer.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200 text-sky-700 inline-flex items-center justify-center text-sm font-semibold shrink-0">{customer.initials}</span>
                      <div>
                        <a href="#" onClick={e => {e.preventDefault(); setSelected(customer); setShowDetail(true);}} className="text-sm font-semibold text-gray-900 hover:text-[#0F9291] no-underline">{customer.name}</a>
                        <span className="block text-xs text-gray-500 font-normal mt-0.5">{customer.code} · <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" /> {customer.branchName || '-'}</span></span>
                      </div>
                    </div>
                    <div className="relative">
                      <button onClick={() => setOpenMenuId(openMenuId === customer.id ? null : customer.id)} className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><Grid className="w-4 h-4" /></button>
                      {openMenuId === customer.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-20">
                          <a href="#" onClick={e => { e.preventDefault(); setSelected(customer); setShowDetail(true); setOpenMenuId(null); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"><Eye className="w-4 h-4" /> View Details</a>
                          <a href="#" onClick={e => { e.preventDefault(); setOpenMenuId(null); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"><Edit2 className="w-4 h-4" /> Edit</a>
                          <a href="#" onClick={e => { e.preventDefault(); setSelected(customer); setShowDelete(true); setOpenMenuId(null); }} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 no-underline"><Trash2 className="w-4 h-4" /> Delete</a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2 text-center">
                      <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Orders</span>
                      <span className="text-base font-bold text-emerald-700">{customer.purchaseCount}</span>
                    </div>
                    <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-2 text-center">
                      <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Spend</span>
                      <span className="text-sm font-bold text-sky-700">{formatCurrency(customer.lifetimeSpend)}</span>
                    </div>
                    <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-2 text-center">
                      <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Points</span>
                      <span className="text-base font-bold text-amber-700">{customer.loyaltyPoints}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-gray-500"><Phone className="w-4 h-4" /> Phone</span><span className="font-medium text-gray-900">{customer.phone}</span></div>
                    <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-gray-500"><Mail className="w-4 h-4" /> Email</span><span className="font-medium text-gray-900 truncate max-w-[160px]">{customer.email}</span></div>
                    <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-gray-500"><MapPin className="w-4 h-4" /> Address</span><span className="font-medium text-gray-900 truncate max-w-[160px]">{customer.address || '-'}</span></div>
                    <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-gray-500"><Calendar className="w-4 h-4" /> Last Purchase</span><span className="font-medium text-gray-900">{customer.lastPurchase}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showDetail && selected && (
          <GlobalModal onClose={() => setShowDetail(false)} title={selected.name} subtitle={`${selected.code} · ${selected.branchName || 'No branch'}`} icon={<Eye className="w-5 h-5" />} hideFooter>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center"><span className="block text-xs text-gray-500">Spend</span><span className="font-bold">{formatCurrency(selected.lifetimeSpend)}</span></div>
                <div className="bg-gray-50 rounded-xl p-3 text-center"><span className="block text-xs text-gray-500">Orders</span><span className="font-bold">{selected.purchaseCount}</span></div>
                <div className="bg-gray-50 rounded-xl p-3 text-center"><span className="block text-xs text-gray-500">Points</span><span className="font-bold">{selected.loyaltyPoints}</span></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">{selected.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{selected.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="font-medium">{selected.address || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Branch</span><span className="font-medium flex items-center gap-1"><Building2 className="w-4 h-4" /> {selected.branchName || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Joined</span><span className="font-medium">{selected.lastPurchase}</span></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowDetail(false)} className="flex-1 h-10 rounded-xl border border-gray-200 hover:bg-gray-50">Close</button>
                <button onClick={() => { setShowDetail(false); }} className="flex-1 h-10 rounded-xl bg-[#0F9291] text-white hover:bg-[#0e7a79]">Edit</button>
              </div>
            </div>
          </GlobalModal>
        )}

        {showAddModal && (
          <GlobalModal onClose={() => setShowAddModal(false)} title="Add Customer" subtitle={`Branch: ${selectedBranch?.name || 'All Branches (super)'}`} icon={<Users className="w-5 h-5" />} cancelLabel="Cancel" submitLabel="Save" onSubmit={handleAdd}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label><input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label><input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label><input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input value={addr} onChange={e => setAddr(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20" /></div>
            </div>
          </GlobalModal>
        )}

        {showDelete && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowDelete(false)} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-8 h-8 text-red-500" /></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Delete Confirmation</h3>
              <p className="text-sm text-gray-500 mb-6">Delete {selected.name} ({selected.code})?</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setShowDelete(false)} className="px-5 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium">Cancel</button>
                <button onClick={async () => { try { await CustomersAPI.delete(selected.id); setCustomers(s => s.filter(c => c.id !== selected.id)); setToast({ show: true, message: 'Customer deleted', type: 'success' }); } catch { setToast({ show: true, message: 'Delete failed', type: 'error' }); } setShowDelete(false); }} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
