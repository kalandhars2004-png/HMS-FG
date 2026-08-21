'use client';

import { useState, useEffect, useMemo } from 'react';
import { BrandsAPI } from '@/lib/api';
import {
  Search, Edit, Trash2, X, RotateCw, Maximize, Plus, House, CheckCircle2, AlertTriangle,
  Building2, Award, MoreVertical, LayoutGrid, ListTodo,
  ArrowUpDown, ArrowUpToLine,
} from '@/components/ui/LucideIcon';
import GlobalModal, { modalInputCls, modalLabelCls, modalHintCls, GlobalConfirmModal } from '@/components/ui/GlobalModal';

interface BrandRow {
  id: string;
  code: string;
  name: string;
  description: string;
  status: boolean;
  createdAt: string;
}

const AVATAR_COLORS = [
  'bg-[#0F9291]/10 text-[#0F9291]',
  'bg-[#3848F5]/10 text-[#3848F5]',
  'bg-[#FA9200]/10 text-[#FA9200]',
  'bg-[#E65B0D]/10 text-[#E65B0D]',
  'bg-[#0E583D]/10 text-[#0E583D]',
  'bg-[#8A38F5]/10 text-[#8A38F5]',
  'bg-[#D42314]/10 text-[#D42314]',
];

const colorFor = (key: string) => {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export default function ManufacturersPage() {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BrandRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false, message: '', type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
      return () => clearTimeout(t);
    }
  }, [toast.show]);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const res = await BrandsAPI.getAll();
      const list: any[] = res.data || [];
      setBrands(list.map((b: any) => ({
        id: String(b.id),
        code: `#BRAND${String(b.id).padStart(3, '0')}`,
        name: b.name || 'Unnamed',
        description: b.description || '',
        status: b.status !== false,
        createdAt: b.createdAt || '',
      })));
    } catch {
      setBrands([]);
      showToast('Failed to load manufacturers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = brands.length;
    const active = brands.filter(b => b.status).length;
    const inactive = total - active;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const newThisMonth = brands.filter(b => b.createdAt && new Date(b.createdAt).getTime() >= monthStart).length;
    return { total, active, inactive, newThisMonth };
  }, [brands]);

  const filteredBrands = useMemo(() =>
    brands.filter(b =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase())
    ), [brands, searchQuery]);

  const openAdd = () => {
    setEditingBrand(null);
    setShowModal(true);
  };

  const openEdit = (b: BrandRow) => {
    setEditingBrand(b);
    setOpenMenu(null);
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await BrandsAPI.delete(deleteTarget.id);
      setBrands(prev => prev.filter(b => b.id !== deleteTarget.id));
      showToast(`"${deleteTarget.name}" deleted successfully`, 'success');
      setDeleteTarget(null);
    } catch {
      showToast('Failed to delete manufacturer', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = () => {
    loadItems();
    setShowModal(false);
    showToast('Manufacturer saved successfully', 'success');
  };

  return (
    <div className="p-6 animate-fadeIn">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[1060] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-slideDown ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700/30 dark:text-emerald-300' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700/30 dark:text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-1.5 m-0 p-0 list-none text-sm">
            <li className="flex items-center gap-1.5">
              <a href="/dashboard" className="text-gray-500 hover:text-gray-700 no-underline flex items-center gap-1.5">
                <House className="w-4 h-4" /> Dashboard
              </a>
              <span className="text-gray-300 mx-1">/</span>
            </li>
            <li className="text-gray-900 font-medium" aria-current="page">Manufacturers</li>
          </ol>
        </nav>
        <div className="flex items-center gap-2">
          <div className="flex items-center shadow-sm p-1 rounded-full border border-gray-200 bg-white view-icons">
            <button
              onClick={() => setView('grid')}
              title="Grid view"
              className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${view === 'grid' ? 'bg-[#0F9291] text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutGrid className="w-[15px] h-[15px]" />
            </button>
            <button
              onClick={() => setView('list')}
              title="List view"
              className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${view === 'list' ? 'bg-[#0F9291] text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <ListTodo className="w-[15px] h-[15px]" />
            </button>
          </div>
          <button
            onClick={loadItems}
            title="Refresh"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-250 shadow-sm"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            title="Maximize"
            onClick={() => { document.documentElement.requestFullscreen?.(); }}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-250 shadow-sm"
          >
            <Maximize className="w-4 h-4" />
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F9291] text-white font-semibold text-sm hover:bg-teal-700 transition-all duration-250 shadow-sm hover:shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Manufacturers', value: stats.total, grad: 'bg-gradient-to-br from-[#EAF0FF] to-[#C2D2FF]', iconColor: 'text-[#4F39F6]' },
          { label: 'Active Manufacturers', value: stats.active, grad: 'bg-gradient-to-br from-[#E9EFEC] to-[#BFD8CB]', iconColor: 'text-[#0E583D]' },
          { label: 'Inactive Manufacturers', value: stats.inactive, grad: 'bg-gradient-to-br from-[#FFEDEA] to-[#FFC9BE]', iconColor: 'text-[#D42314]' },
          { label: 'Added This Month', value: stats.newThisMonth, grad: 'bg-gradient-to-br from-[#FFF6ED] to-[#FBDDB5]', iconColor: 'text-[#FA9200]' },
        ].map((card, i) => (
          <div key={i} className={`rounded-2xl text-center ${card.grad} p-6 transition-all duration-250 hover:-translate-y-0.5`}>
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-sm mx-auto mb-3">
              <Building2 className={`w-6 h-6 ${card.iconColor}`} />
            </div>
            <p className="text-sm font-bold text-gray-900 m-0 mb-2">{card.label}</p>
            <h3 className="text-2xl font-bold text-gray-900 m-0">{card.value}</h3>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap mt-5 mb-5 pt-5 border-t border-gray-200/70 dark:border-[#273244]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-9 w-60 pl-9 pr-3 text-sm border border-gray-200 dark:border-[#273244] rounded-lg bg-white dark:bg-[#161B22] focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250"
          />
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <select
            onChange={e => {
              const v = e.target.value;
              setBrands(prev => {
                const arr = [...prev];
                if (v === 'NAME_AZ') arr.sort((a, b) => a.name.localeCompare(b.name));
                else if (v === 'NAME_ZA') arr.sort((a, b) => b.name.localeCompare(a.name));
                else if (v === 'NEWEST') arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                else if (v === 'OLDEST') arr.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
                else if (v === 'ACTIVE') arr.sort((a, b) => Number(b.status) - Number(a.status));
                else if (v === 'INACTIVE') arr.sort((a, b) => Number(a.status) - Number(b.status));
                return arr;
              });
            }}
            defaultValue=""
            className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-sm font-medium text-gray-600 dark:text-gray-300 focus:outline-none focus:border-[#0F9291] transition-all duration-250 cursor-pointer"
          >
            <option value="" disabled>Sort by</option>
            <option value="NAME_AZ">Name A-Z</option>
            <option value="NAME_ZA">Name Z-A</option>
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
            <option value="ACTIVE">Active First</option>
            <option value="INACTIVE">Inactive First</option>
          </select>
          <button
            onClick={() => {
              const rows = [['Code', 'Name', 'Description', 'Status', 'Created']];
              filteredBrands.forEach(b => rows.push([b.code, b.name, b.description.replace(/\n/g, ' '), b.status ? 'Active' : 'Inactive', b.createdAt ? formatDateTime(b.createdAt) : '-']));
              const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
              const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'manufacturers.csv';
              a.click();
              URL.revokeObjectURL(a.href);
            }}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250"
          >
            <ArrowUpToLine className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Card Grid / List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#0F9291] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="py-16 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm mb-1">{searchQuery ? 'No manufacturers match your search' : 'No manufacturers found'}</p>
          <p className="text-gray-300 text-xs">{searchQuery ? 'Try a different search term' : 'Click "Add New" to create one'}</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBrands.map(b => (
            <div key={b.id} className="bg-white dark:bg-[#161B22] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-none transition-all duration-250 hover:shadow-[0_15px_40px_rgba(15,23,42,0.08)] hover:-translate-y-0.5">
              <div className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-2 bg-[#F5F7FA] dark:bg-[#111827] p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 border-white shadow-sm ${colorFor(b.name)}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-[#F8FAFC] mb-1.5">{b.name}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 text-xs font-semibold">
                        {b.code}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === b.id ? null : b.id); }}
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all duration-200"
                      aria-label="Actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenu === b.id && (
                      <div className="absolute right-0 top-full mt-1 z-[60] bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-[#273244] shadow-xl p-2 w-36 animate-scaleIn">
                        <button
                          onClick={e => { e.stopPropagation(); openEdit(b); }}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setOpenMenu(null); setDeleteTarget(b); }}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400 m-0 shrink-0">Description:</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-[#F8FAFC] m-0 text-right line-clamp-2">{b.description || '—'}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 m-0">Created:</p>
                    <span className="text-sm font-medium text-gray-900 dark:text-[#F8FAFC]">{formatDateTime(b.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-end mt-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${
                      b.status ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${b.status ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {b.status ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#161B22] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-none overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-[#111827] border-b border-gray-100 dark:border-white/[0.06]">
                {['Manufacturer', 'Description', 'Created', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.05]">
              {filteredBrands.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors duration-250">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl text-xs font-bold shrink-0 ${colorFor(b.name)}`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-[#F8FAFC] m-0">{b.name}</p>
                        <span className="text-xs text-sky-600 dark:text-sky-400 font-medium">{b.code}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">{b.description || '-'}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDateTime(b.createdAt)}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${
                      b.status ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${b.status ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {b.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(b)} className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-[#0F9291] hover:bg-[#0F9291]/10 transition-all duration-250" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(b)} className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-250" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <BrandModal
          brand={editingBrand}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <GlobalConfirmModal
          onClose={() => !isDeleting && setDeleteTarget(null)}
          title="Delete Confirmation"
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          submitting={isDeleting}
          danger
        >
          <p className="text-sm text-gray-500 dark:text-[#94A3B8] mb-6">Are you sure you want to delete &ldquo;{deleteTarget.name}&rdquo;?</p>
          <p className="text-xs text-gray-400 dark:text-[#64748B] mb-6">This action cannot be undone.</p>
        </GlobalConfirmModal>
      )}
    </div>
  );
}

function BrandModal({
  brand,
  onClose,
  onSave,
}: {
  brand: BrandRow | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: brand?.name || '',
    description: brand?.description || '',
    status: brand?.status ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setServerError('Manufacturer name is required');
      return;
    }
    setSubmitting(true);
    setServerError('');
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description,
        status: formData.status,
      };
      if (brand) {
        await BrandsAPI.update(brand.id, payload);
      } else {
        await BrandsAPI.create(payload);
      }
      onSave();
    } catch (error: any) {
      setServerError(error?.response?.data?.message || 'Failed to save manufacturer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GlobalModal
      onClose={onClose}
      title={brand ? 'Edit Manufacturer' : 'Add New Manufacturer'}
      subtitle="Manufacturers help organise products and medicines by producer."
      icon={<Award className="w-5 h-5" />}
      formId="manufacturer-form"
      submitting={submitting}
    >
      <form id="manufacturer-form" onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <label className={modalLabelCls}>
              Manufacturer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. ABC Pharma"
              className={modalInputCls}
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className={modalLabelCls}>Description</label>
            <textarea
              rows={4}
              placeholder="Short description of the manufacturer"
              className={`${modalInputCls} h-auto min-h-[96px] py-3 resize-none`}
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
            <p className={modalHintCls}>Shown on the manufacturer card.</p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status: !prev.status }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-250 ${formData.status ? 'bg-[#0F9291]' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-250 ${formData.status ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
            </div>
            {serverError && (
              <p className="text-[13px] font-medium text-red-600 dark:text-red-400">{serverError}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2.5 w-full mt-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1F1F1F] ring-1 ring-gray-200 dark:ring-[#2A2A2A] hover:bg-gray-50 dark:hover:bg-[#232323] disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-gradient-to-r from-[#0F9291] to-teal-600 text-white text-sm font-bold shadow-lg shadow-[#0F9291]/25 hover:shadow-[#0F9291]/35 disabled:opacity-60 transition-all active:scale-[0.98]"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {brand ? 'Save Changes' : 'Create New'}
          </button>
        </div>
      </form>
    </GlobalModal>
  );
}
