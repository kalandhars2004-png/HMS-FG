'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Search, RefreshCw, Eye, Edit, Trash2, User, House, RotateCw, Maximize,
  CheckCircle, XCircle, Warehouse as WarehouseIcon,
} from '@/components/ui/LucideIcon';
import { WarehousesAPI } from '@/lib/api';
import GlobalModal from '@/components/ui/GlobalModal';

interface Warehouse {
  id: string;
  warehouse: string;
  contactPerson: string;
  contactImage?: string;
  email: string;
  phone: string;
  phoneWork?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  totalProducts: number;
  stock: number;
  qty: number;
  createdOn: string;
  status: boolean;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Status');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await WarehousesAPI.getAll();
        setWarehouses(res.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load warehouses');
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouses();
  }, []);

  const initForm = () => ({
    warehouseName: '', contactPerson: '', email: '', phone: '', phoneWork: '',
    address: '', city: '', state: '', country: '', postalCode: '', warehouseStatus: true,
  });
  const [form, setForm] = useState(initForm());

  const openAdd = () => {
    setEditId(null);
    setForm(initForm());
    setShowAddModal(true);
  };

  const openEdit = (w: Warehouse) => {
    setEditId(w.id);
    setForm({ warehouseName: w.warehouse, contactPerson: w.contactPerson, email: w.email, phone: w.phone, phoneWork: w.phoneWork || '', address: w.address, city: w.city, state: w.state, country: w.country, postalCode: w.postalCode, warehouseStatus: w.status });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    const f = form;
    if (!f.warehouseName || !f.contactPerson || !f.email || !f.phone || !f.address || !f.city || !f.state || !f.country || !f.postalCode) {
      alert('Please fill in all required fields!');
      return;
    }
    try {
      if (editId) {
        await WarehousesAPI.update(editId, {
          warehouse: f.warehouseName,
          contactPerson: f.contactPerson,
          email: f.email,
          phone: f.phone,
          phoneWork: f.phoneWork,
          address: f.address,
          city: f.city,
          state: f.state,
          country: f.country,
          postalCode: f.postalCode,
          status: f.warehouseStatus,
        });
      } else {
        await WarehousesAPI.create({
          warehouse: f.warehouseName,
          contactPerson: f.contactPerson,
          email: f.email,
          phone: f.phone,
          phoneWork: f.phoneWork,
          address: f.address,
          city: f.city,
          state: f.state,
          country: f.country,
          postalCode: f.postalCode,
          status: f.warehouseStatus,
        });
      }
      setShowAddModal(false);
      const res = await WarehousesAPI.getAll();
      setWarehouses(res.data || []);
    } catch (err: any) {
      alert('Failed to save warehouse: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return;
    try {
      await WarehousesAPI.delete(id);
      const res = await WarehousesAPI.getAll();
      setWarehouses(res.data || []);
    } catch (err: any) {
      alert('Failed to delete warehouse: ' + (err.message || 'Unknown error'));
    }
  };

  const filteredWarehouses = warehouses.filter(w => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = w.warehouse.toLowerCase().includes(q) || w.contactPerson.toLowerCase().includes(q) || w.email.toLowerCase().includes(q) || w.phone.includes(q);
    const matchesStatus = statusFilter === 'Status' || (statusFilter === 'Active' && w.status) || (statusFilter === 'Inactive' && !w.status);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: warehouses.length,
    active: warehouses.filter(w => w.status).length,
    inactive: warehouses.filter(w => !w.status).length,
    totalStock: warehouses.reduce((s, w) => s + w.stock, 0),
  };

  return (
    <div className="p-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-1.5 m-0 p-0 list-none text-sm">
            <li className="flex items-center gap-1.5">
              <a href="/dashboard" className="text-gray-500 hover:text-gray-700 no-underline flex items-center gap-1.5">
                <House className="w-4 h-4" /> Dashboard
              </a>
              <span className="text-gray-300 mx-1">/</span>
            </li>
            <li className="text-gray-900 font-medium" aria-current="page">Warehouses</li>
          </ol>
        </nav>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-250 shadow-sm" title="Refresh">
            <RotateCw className="w-4 h-4" />
          </button>
          <button className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-250 shadow-sm" title="Maximize">
            <Maximize className="w-4 h-4" />
          </button>
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F9291] text-white font-semibold text-sm hover:bg-teal-700 transition-all duration-250 shadow-sm hover:shadow-md active:scale-95">
            <Plus className="w-4 h-4" /> Add Warehouse
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Total Warehouses', value: stats.total, icon: WarehouseIcon, color: 'text-[#0F9291]', bg: 'bg-[#0F9291]/10', trend: 'All locations' },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Operational' },
          { label: 'Inactive', value: stats.inactive, icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-100', trend: 'Disabled' },
          { label: 'Total Stock', value: stats.totalStock.toLocaleString(), icon: WarehouseIcon, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Across all' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-5 transition-all duration-250 hover:shadow-[0_15px_40px_rgba(15,23,42,0.08)] hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 m-0 flex items-center gap-2 mb-3">
                  <card.icon className={`w-4 h-4 ${card.color}`} /> {card.label}
                </p>
                <h4 className="text-2xl font-bold text-gray-900 m-0 flex items-center gap-2">
                  {card.value}
                  <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 bg-gray-50 text-gray-500">{card.trend}</span>
                </h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search warehouses..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-60 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250 bg-white">
                <option>Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <span className="text-xs text-gray-400 font-medium">{filteredWarehouses.length} warehouse{filteredWarehouses.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {['Warehouse', 'Contact Person', 'Phone', 'Total Products', 'Stock', 'Qty', 'Created On', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" /><div className="h-4 bg-gray-200 rounded animate-pulse w-32" /></div></td>
                    <td className="px-5 py-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" /><div><div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-1" /><div className="h-3 bg-gray-200 rounded animate-pulse w-32" /></div></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-28" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-8 mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-12 mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-8 mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-24" /></td>
                    <td className="px-5 py-4"><div className="h-5 bg-gray-200 rounded-full animate-pulse w-16" /></td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-1"><div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" /><div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" /><div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" /></div></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-red-500">{error}</td>
                </tr>
              ) : filteredWarehouses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <WarehouseIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm mb-1">No warehouses found</p>
                    <p className="text-gray-300 text-xs">Click &quot;Add Warehouse&quot; to create one</p>
                  </td>
                </tr>
              ) : (
                filteredWarehouses.map(w => (
                  <tr key={w.id} className="hover:bg-gray-50/50 transition-colors duration-250">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0F9291]/10 text-[#0F9291] shrink-0">
                          <WarehouseIcon className="w-5 h-5" />
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{w.warehouse}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 shrink-0">
                          <User className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 m-0">{w.contactPerson}</p>
                          <p className="text-[11px] text-gray-400 m-0">{w.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{w.phone}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-semibold">{w.totalProducts}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-semibold">{w.stock.toLocaleString()}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-semibold">{w.qty}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{w.createdOn}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${w.status ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${w.status ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {w.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-250" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(w)} className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-[#0F9291] hover:bg-[#0F9291]/10 transition-all duration-250" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(w.id)} className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-250" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <GlobalModal
          onClose={() => setShowAddModal(false)}
          title={editId ? 'Edit Warehouse' : 'Add Warehouse'}
          subtitle="Warehouses track physical storage locations across your business."
          icon={<WarehouseIcon className="w-5 h-5" />}
          cancelLabel="Cancel"
          submitLabel={editId ? 'Update Warehouse' : 'Add Warehouse'}
          onSubmit={handleSave}
          footer={
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-[#232323] dark:text-gray-300 dark:hover:bg-[#2A2A2A] rounded-xl transition-all duration-250">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0F9291] hover:bg-teal-700 rounded-xl transition-all duration-250 shadow-sm hover:shadow-md active:scale-95">{editId ? 'Update Warehouse' : 'Add Warehouse'}</button>
            </div>
          }
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Warehouse Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.warehouseName} onChange={e => setForm({ ...form, warehouseName: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250" placeholder="Enter warehouse name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Contact Person <span className="text-red-500">*</span></label>
              <input type="text" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250" placeholder="Enter contact person name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email <span className="text-red-500">*</span></label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250" placeholder="Enter email" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone <span className="text-red-500">*</span></label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250" placeholder="Enter phone" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone (Work)</label>
                <input type="tel" value={form.phoneWork} onChange={e => setForm({ ...form, phoneWork: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250" placeholder="Enter work phone" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Address <span className="text-red-500">*</span></label>
              <textarea rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250 resize-none" placeholder="Enter address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">City <span className="text-red-500">*</span></label>
                <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250" placeholder="Enter city" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">State <span className="text-red-500">*</span></label>
                <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250" placeholder="Enter state" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Country <span className="text-red-500">*</span></label>
                <input type="text" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250" placeholder="Enter country" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Postal Code <span className="text-red-500">*</span></label>
                <input type="text" value={form.postalCode} onChange={e => setForm({ ...form, postalCode: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250" placeholder="Enter postal code" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
              <div className="flex items-center">
                <button type="button" onClick={() => setForm({ ...form, warehouseStatus: !form.warehouseStatus })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-250 ${form.warehouseStatus ? 'bg-[#0F9291]' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-250 ${form.warehouseStatus ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-gray-600 ml-3">{form.warehouseStatus ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
        </GlobalModal>
      )}
    </div>
  );
}
