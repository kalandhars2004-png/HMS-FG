'use client';

import { useState, useEffect } from 'react';
import { BrandsAPI } from '@/lib/api';
import {
  Search, Edit, Trash2, X, RotateCw, Maximize, Plus, House, CheckCircle2, AlertTriangle,
  Building2, Award, MoreVertical, Copy, LayoutGrid, ListTodo,
  ArrowUpDown, ArrowUpToLine,
} from '@/components/ui/LucideIcon';
import GlobalModal, { modalInputCls, modalLabelCls, modalHintCls, modalSelectCls, GlobalConfirmModal } from '@/components/ui/GlobalModal';

interface ManufacturerData {
  id: string;
  code: string;
  name: string;
  image?: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  linkedMedicines: string[];
  status: boolean;
}

const MANUFACTURER_LOGO_COLORS: Record<string, string> = {
  'ABC Pharma': 'bg-[#0F9291]/10 text-[#0F9291]',
  'HealCare Labs': 'bg-[#3848F5]/10 text-[#3848F5]',
  'Medix Ltd': 'bg-[#FA9200]/10 text-[#FA9200]',
  'SkinPlus Pharma': 'bg-[#E65B0D]/10 text-[#E65B0D]',
  'NovaLife Pharma': 'bg-[#0E583D]/10 text-[#0E583D]',
  'CareWell Labs': 'bg-[#8A38F5]/10 text-[#8A38F5]',
  'MedSure Pharma': 'bg-[#D42314]/10 text-[#D42314]',
};

const CONTACT_AVATAR_COLORS: Record<string, string> = {
  'Steven Kelley': 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  'Hilda Morris': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'Daniel Hadley': 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  'Dorthy Gifford': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  'Jared Mercer': 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  'Shirley Scott': 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  'Joseph Shepard': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  'Kathleen Bryant': 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
  'Ronald Emmons': 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
};

const TEMPLATE_MANUFACTURERS: ManufacturerData[] = [
  { id: '1', code: '#MNG016', name: 'ABC Pharma', contactPerson: 'Steven Kelley', email: 'steven@example.com', phone: '+1 89384 47384', address: '123 Pharma St, New York', linkedMedicines: [], status: true },
  { id: '2', code: '#MNG015', name: 'HealCare Labs', contactPerson: 'Hilda Morris', email: 'hilds@example.com', phone: '+1 65849 48035', address: '', linkedMedicines: [], status: true },
  { id: '3', code: '#MNG014', name: 'Medix Ltd', contactPerson: 'Daniel Hadley', email: 'daniel@example.com', phone: '+1 73829 49204', address: '', linkedMedicines: [], status: true },
  { id: '4', code: '#MNG013', name: 'SkinPlus Pharma', contactPerson: 'Dorthy Gifford', email: 'dorthy@example.com', phone: '+1 84205 13628', address: '', linkedMedicines: [], status: true },
  { id: '5', code: '#MNG012', name: 'NovaLife Pharma', contactPerson: 'Jared Mercer', email: 'jared@example.com', phone: '+1 93638 48290', address: '', linkedMedicines: [], status: true },
  { id: '6', code: '#MNG011', name: 'CareWell Labs', contactPerson: 'Shirley Scott', email: 'shirley@example.com', phone: '+1 84245 29403', address: '', linkedMedicines: [], status: true },
  { id: '7', code: '#MNG010', name: 'MedSure Pharma', contactPerson: 'Joseph Shepard', email: 'joseph@example.com', phone: '+1 74725 10853', address: '', linkedMedicines: [], status: true },
  { id: '8', code: '#MNG009', name: 'ABC Pharma', contactPerson: 'Kathleen Bryant', email: 'kathleen@example.com', phone: '+1 65456 74925', address: '', linkedMedicines: [], status: true },
  { id: '9', code: '#MNG008', name: 'NutriPlus Labs', contactPerson: 'Ronald Emmons', email: 'ronald@example.com', phone: '+1 89242 47294', address: '', linkedMedicines: [], status: true },
];

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<ManufacturerData[]>(TEMPLATE_MANUFACTURERS);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<ManufacturerData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManufacturerData | null>(null);
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
      if (list.length > 0) {
        const mapped: ManufacturerData[] = list.map((b: any, i: number) => ({
          id: String(b.id ?? i),
          code: `#MNG${String(16 - i).padStart(3, '0')}`,
          name: b.name || 'Unnamed',
          image: b.image || '',
          contactPerson: b.contactPerson || b.manager || '',
          email: b.email || '',
          phone: b.phone || b.contact || '',
          address: b.address || '',
          linkedMedicines: b.medicineNames || [],
          status: b.status !== false,
        }));
        setManufacturers(mapped);
      } else {
        setManufacturers(TEMPLATE_MANUFACTURERS);
      }
    } catch {
      setManufacturers(TEMPLATE_MANUFACTURERS);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredManufacturers = manufacturers.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAdd = () => {
    setEditingManufacturer(null);
    setShowModal(true);
  };

  const openEdit = (m: ManufacturerData) => {
    setEditingManufacturer(m);
    setOpenMenu(null);
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await BrandsAPI.delete(deleteTarget.id);
      setManufacturers(prev => prev.filter(m => m.id !== deleteTarget.id));
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

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text);
  };

  const initialsOf = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const avatarColor = (name: string) => CONTACT_AVATAR_COLORS[name] || 'bg-gray-100 text-gray-600';

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
            <RotateCw className="w-4 h-4" />
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
          { label: 'Total Manufacturers', value: 120, grad: 'bg-gradient-to-br from-[#EAF0FF] to-[#C2D2FF]', iconColor: 'text-[#4F39F6]' },
          { label: 'Active Manufacturers', value: 100, grad: 'bg-gradient-to-br from-[#E9EFEC] to-[#BFD8CB]', iconColor: 'text-[#0E583D]' },
          { label: 'Inactive Manufacturers', value: 20, grad: 'bg-gradient-to-br from-[#FFEDEA] to-[#FFC9BE]', iconColor: 'text-[#D42314]' },
          { label: 'Low Stock Products', value: 200, grad: 'bg-gradient-to-br from-[#FFF6ED] to-[#FBDDB5]', iconColor: 'text-[#FA9200]' },
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
          <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250">
            <ArrowUpDown className="w-4 h-4" /> Sort by
          </button>
          <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250">
            <ArrowUpToLine className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Card Grid / List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#0F9291] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredManufacturers.length === 0 ? (
        <div className="py-16 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm mb-1">No manufacturers found</p>
          <p className="text-gray-300 text-xs">Click "Add New" to create one</p>
        </div>
      ) : view === 'grid' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredManufacturers.map(m => {
              const logoColor = MANUFACTURER_LOGO_COLORS[m.name] || 'bg-[#0F9291]/10 text-[#0F9291]';
              return (
                <div key={m.id} className="bg-white dark:bg-[#161B22] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-none transition-all duration-250 hover:shadow-[0_15px_40px_rgba(15,23,42,0.08)] hover:-translate-y-0.5">
                  <div className="p-5">
                    <div className="flex items-center justify-between flex-wrap gap-2 bg-[#F5F7FA] dark:bg-[#111827] p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 border-white shadow-sm ${logoColor}`}>
                          {m.image ? (
                            <img src={m.image} alt={m.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <Building2 className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-[#F8FAFC] mb-1.5">{m.name}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 text-xs font-semibold">
                            {m.code}
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === m.id ? null : m.id); }}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all duration-200"
                          aria-label="Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenu === m.id && (
                          <div className="absolute right-0 top-full mt-1 z-[60] bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-[#273244] shadow-xl p-2 w-36 animate-scaleIn">
                            <button
                              onClick={e => { e.stopPropagation(); openEdit(m); }}
                              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
                            >
                              <Edit className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); setOpenMenu(null); setDeleteTarget(m); }}
                              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400 m-0">Contact Person:</p>
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${avatarColor(m.contactPerson)}`}>
                            {initialsOf(m.contactPerson)}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-[#F8FAFC]">{m.contactPerson}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400 m-0">Email Address:</p>
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-[#F8FAFC]">
                          {m.email}
                          <button
                            onClick={e => copyToClipboard(m.email, e)}
                            className="text-gray-400 hover:text-[#0F9291] transition-colors"
                            title="Copy"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400 m-0">Phone:</p>
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-[#F8FAFC]">
                          {m.phone}
                          <button
                            onClick={e => copyToClipboard(m.phone, e)}
                            className="text-gray-400 hover:text-[#0F9291] transition-colors"
                            title="Copy"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-6">
            <button
              onClick={() => setView('list')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#161B22] text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-250"
            >
              Load More
            </button>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-[#161B22] rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-none overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-[#111827] border-b border-gray-100 dark:border-white/[0.06]">
                {['Manufacturer', 'Contact Person', 'Email Address', 'Phone', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.05]">
              {filteredManufacturers.map(m => (
                <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors duration-250">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl text-xs font-bold shrink-0 ${MANUFACTURER_LOGO_COLORS[m.name] || 'bg-[#0F9291]/10 text-[#0F9291]'}`}>
                        {m.image ? <img src={m.image} alt={m.name} className="w-10 h-10 rounded-xl object-cover" /> : <Building2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-[#F8FAFC] m-0">{m.name}</p>
                        <span className="text-xs text-sky-600 dark:text-sky-400 font-medium">{m.code}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{m.contactPerson || '-'}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{m.email || '-'}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{m.phone || '-'}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${
                      m.status ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${m.status ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {m.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(m)} className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-[#0F9291] hover:bg-[#0F9291]/10 transition-all duration-250" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(m)} className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-250" title="Delete">
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
        <ManufacturerModal
          manufacturer={editingManufacturer}
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

function ManufacturerModal({
  manufacturer,
  onClose,
  onSave,
}: {
  manufacturer: ManufacturerData | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: manufacturer?.name || '',
    contactPerson: manufacturer?.contactPerson || '',
    email: manufacturer?.email || '',
    phone: manufacturer?.phone || '',
    address: manufacturer?.address || '',
    country: 'Select',
    city: 'Select',
    state: 'Select',
    pincode: '',
    image: manufacturer?.image || '',
    linkedMedicines: manufacturer?.linkedMedicines || ([] as string[]),
    status: manufacturer?.status ?? true,
  });
  const [imagePreview, setImagePreview] = useState(manufacturer?.image || '');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleMedicine = (med: string) => {
    setFormData(prev => ({
      ...prev,
      linkedMedicines: prev.linkedMedicines.includes(med)
        ? prev.linkedMedicines.filter(m => m !== med)
        : [...prev.linkedMedicines, med],
    }));
  };

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
        name: formData.name,
        description: formData.address,
        image: formData.image,
        status: formData.status,
      };
      if (manufacturer) {
        await BrandsAPI.update(manufacturer.id, payload);
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
      title={manufacturer ? 'Edit Manufacturer' : 'Add New Manufacturer'}
      subtitle="Manufacturers help organise products and medicines by producer."
      icon={<Award className="w-5 h-5" />}
      formId="manufacturer-form"
      submitting={submitting}
    >
      <form id="manufacturer-form" onSubmit={handleSubmit}>
        <div className="space-y-5">
          {/* Image Upload */}
          <div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-20 h-20 rounded-full border-2 border-dashed border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#1F1F1F] overflow-hidden shrink-0`}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-7 h-7 text-gray-400" />
                )}
              </div>
              <div>
                <label className={modalLabelCls}>Upload Store Image</label>
                <p className={modalHintCls}>Image should below 2MB</p>
                <div className="flex items-center gap-2 mt-2">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-[#1F1F1F] hover:bg-gray-200 dark:hover:bg-[#262626] rounded-lg cursor-pointer transition-all duration-250 border border-gray-200 dark:border-[#2A2A2A]">
                    <RotateCw className="w-4 h-4" /> Change Image
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => { setImagePreview(''); setFormData(prev => ({ ...prev, image: '' })); }}
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-[#2A2A2A] text-red-500 hover:bg-red-50 transition-all duration-250"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
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

            <div className="md:col-span-2">
              <label className={modalLabelCls}>Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Steven Kelley"
                className={modalInputCls}
                value={formData.contactPerson}
                onChange={e => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
              />
            </div>

            <div>
              <label className={modalLabelCls}>Email Address</label>
              <input
                type="email"
                placeholder="e.g. steven@example.com"
                className={modalInputCls}
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <label className={modalLabelCls}>Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +1 89384 47384"
                className={modalInputCls}
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <label className={modalLabelCls}>Address</label>
              <input
                type="text"
                placeholder="e.g. 123 Pharma St, New York"
                className={modalInputCls}
                value={formData.address}
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div>
              <label className={modalLabelCls}>Country</label>
              <select
                className={modalSelectCls}
                value={formData.country}
                onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
              >
                {['Select', 'USA', 'Canada', 'Germany', 'France'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className={modalLabelCls}>City</label>
              <select
                className={modalSelectCls}
                value={formData.city}
                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
              >
                {['Select', 'Los Angeles', 'San Diego', 'Fresno', 'San Francisco'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className={modalLabelCls}>State / Province</label>
              <select
                className={modalSelectCls}
                value={formData.state}
                onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
              >
                {['Select', 'California', 'New York', 'Texas', 'Florida'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className={modalLabelCls}>Pincode</label>
              <input
                type="text"
                placeholder="e.g. 10292"
                className={modalInputCls}
                value={formData.pincode}
                onChange={e => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <label className={modalLabelCls}>Linked Medicines</label>
              <div className="flex flex-wrap gap-2">
                {['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Ciprofloxacin'].map(med => (
                  <button
                    key={med}
                    type="button"
                    onClick={() => toggleMedicine(med)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-all duration-200 ${
                      formData.linkedMedicines.includes(med)
                        ? 'bg-[#0F9291] text-white border-[#0F9291]'
                        : 'bg-white dark:bg-[#1F1F1F] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#2A2A2A] hover:border-[#0F9291]/40 hover:text-[#0F9291]'
                    }`}
                  >
                    {med}
                  </button>
                ))}
              </div>
            </div>
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
            {manufacturer ? 'Save Changes' : 'Create New'}
          </button>
        </div>
      </form>
    </GlobalModal>
  );
}