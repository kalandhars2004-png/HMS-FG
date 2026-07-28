'use client';

import { useState, useEffect } from 'react';
import { Unit } from '@/types';
import { UnitsAPI } from '@/lib/api';
import {
  Search, Edit2, Trash2, X, RotateCw, Maximize, Plus, House,
  CheckCircle, XCircle, Ruler,
} from '@/components/ui/LucideIcon';

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const res = await UnitsAPI.getAll();
      setUnits(res.data);
    } catch (error) {
      console.error('Failed to load units:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;
    try {
      await UnitsAPI.delete(id);
      setUnits(prev => prev.filter(u => u.id !== id));
    } catch (error) {
      console.error('Failed to delete unit:', error);
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingUnit(null);
    setShowModal(true);
  };

  const filteredUnits = units.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.shortName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: units.length,
    active: units.filter(u => u.status).length,
    inactive: units.filter(u => !u.status).length,
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
            <li className="text-gray-900 font-medium" aria-current="page">Units</li>
          </ol>
        </nav>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-250 shadow-sm" title="Refresh">
            <RotateCw className="w-4 h-4" />
          </button>
          <button className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-250 shadow-sm" title="Maximize">
            <Maximize className="w-4 h-4" />
          </button>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F9291] text-white font-semibold text-sm hover:bg-teal-700 transition-all duration-250 shadow-sm hover:shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Unit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {[
          { label: 'Total Units', value: stats.total, icon: Ruler, color: 'text-[#0F9291]', bg: 'bg-[#0F9291]/10', trend: 'All units' },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Currently enabled' },
          { label: 'Inactive', value: stats.inactive, icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-100', trend: 'Disabled' },
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
                <input
                  type="text"
                  placeholder="Search units..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-60 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250"
                />
              </div>
            </div>
            <span className="text-xs text-gray-400 font-medium">{filteredUnits.length} unit{filteredUnits.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#0F9291] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {['Unit', 'Short Name', 'Description', 'Created On', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <Ruler className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm mb-1">No units found</p>
                      <p className="text-gray-300 text-xs">Click "Add Unit" to create one</p>
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map(unit => (
                    <tr key={unit.id} className="hover:bg-gray-50/50 transition-colors duration-250">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0F9291]/10 text-[#0F9291] text-sm font-bold shrink-0">{unit.shortName}</span>
                          <span className="text-sm font-semibold text-gray-900">{unit.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <code className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{unit.shortName}</code>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 max-w-[200px] truncate">{unit.description || '-'}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                        {unit.createdAt ? new Date(unit.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${unit.status ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${unit.status ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {unit.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(unit)} className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-[#0F9291] hover:bg-[#0F9291]/10 transition-all duration-250" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(unit.id)} className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-250" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <UnitModal
          unit={editingUnit}
          onClose={() => setShowModal(false)}
          onSave={() => { loadItems(); setShowModal(false); }}
        />
      )}
    </div>
  );
}

function UnitModal({ unit, onClose, onSave }: { unit: Unit | null; onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    name: unit?.name || '',
    shortName: unit?.shortName || '',
    status: unit?.status ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (unit) {
        await UnitsAPI.update(unit.id, formData);
      } else {
        await UnitsAPI.create(formData);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save unit:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slideUp" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 m-0">{unit ? 'Edit Unit' : 'Add Unit'}</h2>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all duration-250">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Unit Name <span className="text-red-500">*</span></label>
              <input type="text" required placeholder="e.g. Kilogram, Bag, Ton" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Short Name <span className="text-red-500">*</span></label>
              <input type="text" required placeholder="e.g. Kg, Ton, Bag" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250" value={formData.shortName} onChange={e => setFormData({ ...formData, shortName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
              <div className="flex items-center">
                <button type="button" onClick={() => setFormData({ ...formData, status: !formData.status })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-250 ${formData.status ? 'bg-[#0F9291]' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-250 ${formData.status ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-gray-600 ml-3">{formData.status ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-250">Cancel</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0F9291] hover:bg-teal-700 rounded-xl transition-all duration-250 shadow-sm hover:shadow-md active:scale-95">{unit ? 'Update Unit' : 'Create Unit'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
