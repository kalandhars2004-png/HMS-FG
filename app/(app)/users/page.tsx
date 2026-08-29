'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Users, UserCheck, Shield, Building2, Search, RefreshCw, House, Edit2, CheckCircle2, AlertTriangle, X, MoreVertical, Plus, UserPlus, ArrowUpToLine, LayoutGrid, ListTodo, Mail, Phone, Trash2, UserCog, UsersRound } from '@/components/ui/LucideIcon';
import { BranchesAPI, UsersAPI } from '@/lib/api';
import { useBranch } from '@/lib/branch-context';
import { Branch } from '@/types';
import GlobalModal, { modalInputCls, modalSelectCls, modalLabelCls, modalHintCls, GlobalConfirmModal } from '@/components/ui/GlobalModal';
import DropdownMenu from '@/components/ui/DropdownMenu';

interface ToastItem { id: string; type: 'success' | 'error'; message: string; }

const AVATAR_COLORS = [
  'bg-[#0F9291]/10 text-[#0F9291]',
  'bg-[#3848F5]/10 text-[#3848F5]',
  'bg-[#FA9200]/10 text-[#FA9200]',
  'bg-[#E65B0D]/10 text-[#E65B0D]',
  'bg-[#0E583D]/10 text-[#0E583D]',
  'bg-[#8A38F5]/10 text-[#8A38F5]',
  'bg-[#D42314]/10 text-[#D42314]',
  'bg-[#0891B2]/10 text-[#0891B2]',
];

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  SUPER_ADMIN: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  ADMIN: { bg: 'bg-[#0F9291]/10', text: 'text-[#0F9291]', border: 'border-[#0F9291]/20', dot: 'bg-[#0F9291]' },
  MANAGER: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
  PHARMACIST: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  CASHIER: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  STAFF: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' },
};

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initialsOf(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

function roleBadge(role: string) {
  const key = String(role).toUpperCase();
  const c = ROLE_COLORS[key] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {role}
    </span>
  );
}

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function UsersManagementPage() {
  const { branches, isSuperAdmin } = useBranch();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [form, setForm] = useState({ name: '', email: '', role: 'STAFF', password: '', branchId: '' });

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await UsersAPI.getAll().catch(() => ({ data: [] }) as any);
      const list: any[] = (res as any)?.data || (res as any)?.users || [];
      setUsers(Array.isArray(res) ? res : list);
    } catch (e: any) {
      addToast(e.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const handler = () => setOpenMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const filtered = useMemo(() => {
    // SuperAdmin is single global — never show on user list daa
    let list = users.filter((u:any)=> String(u.role).toUpperCase()!=='SUPER_ADMIN');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u: any) =>
        String(u.name || '').toLowerCase().includes(q) ||
        String(u.email || '').toLowerCase().includes(q) ||
        String(u.role || '').toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    switch (sortBy) {
      case 'name-asc': sorted.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))); break;
      case 'name-desc': sorted.sort((a, b) => String(b.name || '').localeCompare(String(a.name || ''))); break;
      case 'role-asc': sorted.sort((a, b) => String(a.role || '').localeCompare(String(b.role || ''))); break;
      case 'role-desc': sorted.sort((a, b) => String(b.role || '').localeCompare(String(a.role || ''))); break;
      case 'newest': sorted.sort((a, b) => (b.id || 0) - (a.id || 0)); break;
      case 'oldest': sorted.sort((a, b) => (a.id || 0) - (b.id || 0)); break;
    }
    return sorted;
  }, [users, search, sortBy]);

  const stats = useMemo(() => {
    const visible = users.filter((u:any)=> String(u.role).toUpperCase()!=='SUPER_ADMIN');
    const total = visible.length;
    const managers = visible.filter((u: any) => String(u.role).toUpperCase().includes('MANAGER')).length;
    const admins = visible.filter((u: any) => String(u.role).toUpperCase() === 'ADMIN').length;
    const employees = Math.max(0, total - managers - admins);
    const unassigned = visible.filter((u: any) => !u.branchId).length;
    const superAdmins = users.filter((u: any) => String(u.role).toUpperCase() === 'SUPER_ADMIN').length;
    return { total, managers, employees, superAdmins, admins, unassigned };
  }, [users]);

  const byBranch = useMemo(() => {
    const filteredForBranch = users.filter((u:any)=> String(u.role).toUpperCase()!=='SUPER_ADMIN');
    const map = new Map<string, { branch: Branch | null; count: number; managers: number }>();
    branches.forEach(b => map.set(String(b.id), { branch: b, count: 0, managers: 0 }));
    map.set('unassigned', { branch: null, count: 0, managers: 0 });
    filteredForBranch.forEach((u: any) => {
      const bid = u.branchId ? String(u.branchId) : 'unassigned';
      const row = map.get(bid) || { branch: null, count: 0, managers: 0 };
      row.count += 1;
      if (String(u.role).toUpperCase().includes('MANAGER')) row.managers += 1;
      map.set(bid, row);
    });
    return [...map.entries()].map(([id, row]) => ({ id, ...row }));
  }, [users, branches]);

  const openAdd = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', role: 'STAFF', password: '', branchId: '' });
    setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditingUser(u);
    setForm({
      name: u.name || '',
      email: u.email || '',
      role: String(u.role || 'STAFF').toUpperCase(),
      password: '',
      branchId: u.branchId ? String(u.branchId) : '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving('');
    try {
      const payload: any = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
      };
      if (form.password.trim()) payload.password = form.password.trim();
      if (form.branchId) payload.branchId = Number(form.branchId);
      else payload.branchId = null;

      if (editingUser) {
        await UsersAPI.update(editingUser.id, payload);
        addToast(`"${payload.name}" updated successfully`, 'success');
      } else {
        await UsersAPI.update(form.email, payload);
        addToast(`"${payload.name}" created successfully`, 'success');
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      addToast(e.message || 'Save failed', 'error');
    } finally {
      setSaving(null);
    }
  };

  const handleAssign = async (userId: string, branchId: string) => {
    setSaving(userId);
    try {
      await UsersAPI.update(userId, { branchId: branchId ? Number(branchId) : null });
      addToast('Branch assigned', 'success');
      load();
    } catch (e: any) {
      addToast(e.message || 'Assign failed', 'error');
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await UsersAPI.delete(deleteTarget.id);
      addToast(`"${deleteTarget.name}" deleted`, 'success');
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      addToast(e.message || 'Delete failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const exportCSV = () => {
    const rows = [['Name', 'Email', 'Role', 'Branch', 'Phone', 'Created']];
    filtered.forEach((u: any) => {
      const branch = u.branchId ? branches.find((b: any) => String(b.id) === String(u.branchId))?.name || `Branch ${u.branchId}` : 'Unassigned';
      rows.push([u.name || '', u.email || '', u.role || '', branch, u.phoneNumber || '', formatDateTime(u.createdAt)]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    addToast('Exported users.csv', 'success');
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-4 sm:p-6 bg-[#f8f9fa] min-h-screen -m-6">
        <div className="max-w-[1600px] mx-auto p-4 sm:p-6">
          <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center">
            <Shield className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold">Super Admin only</h3>
            <p className="text-sm text-gray-500 mt-1">This user management is for Super Admin to see branch-wise managers and employees and assign branches.</p>
            <a href="/dashboard" className="mt-4 inline-flex px-4 py-2 bg-[#0F9291] text-white rounded-xl text-sm font-medium no-underline hover:bg-teal-700 transition-colors">Back to Dashboard</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#f8f9fa] min-h-screen -m-6">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-4">
        {/* Toasts */}
        <div className="fixed top-6 right-6 z-[1060] flex flex-col gap-2">
          {toasts.map(t => (
            <div key={t.id} className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-slideDown ${t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              {t.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <span className="text-sm font-medium">{t.message}</span>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="ml-2 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-1.5 m-0 p-0 list-none text-sm">
              <li><a href="/dashboard" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 no-underline"><House className="w-4 h-4" /> Dashboard</a></li>
              <li className="text-gray-300 mx-1">/</li>
              <li><a href="/branches" className="text-gray-500 hover:text-gray-700 no-underline">Branches</a></li>
              <li className="text-gray-300 mx-1">/</li>
              <li className="text-gray-900 font-medium flex items-center gap-1.5"><Users className="w-4 h-4" /> User Management</li>
            </ol>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={load} className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 shadow-sm transition-all duration-250">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={exportCSV} className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-all duration-250">
              <ArrowUpToLine className="w-4 h-4" /> Export
            </button>
            <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F9291] text-white font-semibold text-sm hover:bg-teal-700 shadow-sm hover:shadow-md transition-all duration-250 active:scale-95">
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {[
            { label: 'Total Users', value: stats.total, grad: 'bg-gradient-to-br from-[#EAF0FF] to-[#C2D2FF]', iconColor: 'text-[#4F39F6]', Icon: Users },
            { label: 'Managers', value: stats.managers, grad: 'bg-gradient-to-br from-[#E9EFEC] to-[#BFD8CB]', iconColor: 'text-[#0E583D]', Icon: UserCog },
             { label: 'Employees', value: stats.employees, grad: 'bg-gradient-to-br from-[#FFF6ED] to-[#FBDDB5]', iconColor: 'text-[#FA9200]', Icon: UsersRound },
            { label: 'Branches', value: branches.length, grad: 'bg-gradient-to-br from-[#EAF0FF] to-[#C2D2FF]', iconColor: 'text-[#3848F5]', Icon: Building2 },
            { label: 'Unassigned', value: stats.unassigned, grad: 'bg-gradient-to-br from-[#FFEDEA] to-[#FFC9BE]', iconColor: 'text-[#D42314]', Icon: AlertTriangle },
          ].map((card, i) => (
            <div key={i} className={`rounded-2xl ${card.grad} p-5 transition-all duration-250 hover:-translate-y-0.5`}>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm mx-auto mb-3">
                <card.Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <p className="text-xs font-bold text-gray-500 text-center uppercase tracking-wider">{card.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 text-center mt-1">{card.value}</h3>
            </div>
          ))}
        </div>

        {/* Branch-wise summary */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3"><Building2 className="w-4 h-4 text-[#0F9291]" /> Branch-wise Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {byBranch.map(row => (
              <div key={row.id} className={`rounded-xl border p-4 ${row.id === 'unassigned' ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
                <p className="text-sm font-semibold text-gray-900 truncate">{row.branch ? `${row.branch.name} (${row.branch.code})` : 'Unassigned'}</p>
                <p className="text-xs text-gray-500">{row.branch?.city || ''} {row.branch?.status || ''}</p>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {row.count} users</span>
                  <span className="inline-flex items-center gap-1"><UserCheck className="w-3 h-3" /> {row.managers} managers</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 flex items-center justify-between gap-3 flex-wrap border-b border-gray-100">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  placeholder="Search name, email, role..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-64 h-9 pl-9 pr-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-3 focus:ring-[#0F9291]/10 transition-all"
                />
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 focus:outline-none focus:border-[#0F9291] cursor-pointer"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="role-asc">Role A-Z</option>
                <option value="role-desc">Role Z-A</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center p-1 rounded-full border border-gray-200 bg-white">
                <button onClick={() => setView('grid')} title="Grid view" className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${view === 'grid' ? 'bg-[#0F9291] text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                  <LayoutGrid className="w-[15px] h-[15px]" />
                </button>
                <button onClick={() => setView('list')} title="List view" className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${view === 'list' ? 'bg-[#0F9291] text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                  <ListTodo className="w-[15px] h-[15px]" />
                </button>
              </div>
              <span className="text-xs text-gray-400 font-medium">{filtered.length} users</span>
            </div>
          </div>

          {/* Grid View */}
          {view === 'grid' ? (
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-[#0F9291] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">{search ? 'No users match your search' : 'No users found'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((u: any) => {
                    const branch = u.branchId ? branches.find((b: any) => String(b.id) === String(u.branchId)) : null;
                    return (
                      <div key={String(u.id)} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-250 p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`flex items-center justify-center w-12 h-12 rounded-full text-sm font-bold shrink-0 ${colorFor(u.name || u.email)}`}>
                            {initialsOf(u.name || u.email)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{u.name}</p>
                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          </div>
                          <div className="relative ml-auto">
                            <button
                              onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === String(u.id) ? null : String(u.id)); }}
                              className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                              aria-label="Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {openMenu === String(u.id) && (
                              <DropdownMenu open={!!openMenu} onClose={() => setOpenMenu(null)} anchorEl={document.activeElement as HTMLElement} width={180}>
                                <button onClick={() => { setOpenMenu(null); openEdit(u); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"><Edit2 className="w-4 h-4 text-gray-400" /> Edit</button>
                                <button onClick={() => { setOpenMenu(null); setDeleteTarget(u); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /> Delete</button>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Role</span>
                            {roleBadge(u.role)}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Branch</span>
                            <span className="text-xs font-medium text-gray-700">{branch ? `${branch.name} (${branch.code})` : <span className="text-amber-600">Unassigned</span>}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Phone</span>
                            <span className="text-xs font-medium text-gray-700">{u.phoneNumber || '—'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* List / Table View */
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-[#0F9291] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">{search ? 'No users match your search' : 'No users found'}</p>
                  <p className="text-gray-300 text-xs mt-1">{search ? 'Try a different search term' : 'Click "Add User" to create one'}</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assign Branch</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((u: any) => {
                      const branch = u.branchId ? branches.find((b: any) => String(b.id) === String(u.branchId)) : null;
                      const isSuper = String(u.role).toUpperCase() === 'SUPER_ADMIN';
                      return (
                        <tr key={String(u.id)} className="hover:bg-gray-50/50 transition-colors duration-150">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold shrink-0 ${colorFor(u.name || u.email)}`}>
                                {initialsOf(u.name || u.email)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                                <p className="text-xs text-gray-500 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">{roleBadge(u.role)}</td>
                          <td className="px-5 py-4">
                            {branch ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-gray-700"><Building2 className="w-3.5 h-3.5 text-gray-400" /> {branch.name} <span className="text-gray-400">({branch.code})</span></span>
                            ) : <span className="text-xs text-amber-600 font-medium">Unassigned</span>}
                          </td>
                          <td className="px-5 py-4">
                            {isSuper ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded-lg px-2.5 py-1.5 font-medium">Global — no branch</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <select
                                  value={String(u.branchId || '')}
                                  onChange={e => handleAssign(String(u.id), e.target.value)}
                                  disabled={saving === String(u.id)}
                                  className="h-8 pl-2.5 pr-8 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#0F9291] cursor-pointer disabled:opacity-50"
                                >
                                  <option value="">— No branch —</option>
                                  {branches.map((b: any) => <option key={String(b.id)} value={String(b.id)}>{b.name} ({b.code})</option>)}
                                </select>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEdit(u)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-[#0F9291] hover:bg-[#0F9291]/10 transition-all duration-250"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(u)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-250"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <GlobalModal
          onClose={() => setShowModal(false)}
          title={editingUser ? 'Edit User' : 'Add New User'}
          subtitle={editingUser ? 'Update user details and permissions.' : 'Create a new user account with role and branch.'}
          icon={<UserCog className="w-5 h-5" />}
          size="md"
          submitting={!!saving}
          footer={
            <div className="flex items-center justify-between gap-2.5 w-full">
              <button type="button" onClick={() => setShowModal(false)} disabled={!!saving} className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold text-gray-600 bg-white ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-all active:scale-[0.98]">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={!!saving} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-gradient-to-r from-[#0F9291] to-teal-600 text-white text-sm font-bold shadow-lg shadow-[#0F9291]/25 hover:shadow-[#0F9291]/35 disabled:opacity-60 transition-all active:scale-[0.98]">
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {editingUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          }
        >
          <div className="space-y-5">
            <div>
              <label className={modalLabelCls}>Full Name <span className="text-red-500">*</span></label>
              <input type="text" placeholder="e.g. John Doe" className={modalInputCls} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className={modalLabelCls}>Email <span className="text-red-500">*</span></label>
              <input type="email" placeholder="e.g. john@pharmacy.com" className={modalInputCls} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className={modalLabelCls}>Role</label>
              <select className={modalSelectCls} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="PHARMACIST">Pharmacist</option>
                <option value="CASHIER">Cashier</option>
                <option value="STAFF">Staff</option>
              </select>
              <p className={modalHintCls}>Super Admin is single global — cannot create another daa.</p>
            </div>
            <div>
              <label className={modalLabelCls}>{editingUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
              <input type="password" placeholder={editingUser ? 'Leave blank to keep current' : 'Set initial password'} className={modalInputCls} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
              <p className={modalHintCls}>{editingUser ? 'Only fill this if you want to change the password.' : 'Minimum 6 characters recommended.'}</p>
            </div>
            <div>
              <label className={modalLabelCls}>Branch</label>
              <select className={modalSelectCls} value={form.branchId} onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))}>
                <option value="">— No branch —</option>
                {branches.map((b: any) => <option key={String(b.id)} value={String(b.id)}>{b.name} ({b.code})</option>)}
              </select>
              <p className={modalHintCls}>Super Admin users should not be assigned to a branch.</p>
            </div>
          </div>
        </GlobalModal>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <GlobalConfirmModal
          onClose={() => !isDeleting && setDeleteTarget(null)}
          title="Delete User"
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          submitting={isDeleting}
          danger
        >
          <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete &ldquo;{deleteTarget.name}&rdquo;? This action cannot be undone.</p>
        </GlobalConfirmModal>
      )}
    </div>
  );
}
