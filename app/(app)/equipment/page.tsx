'use client';

import { useState, useEffect } from 'react';
import {
  Search, Edit2, Trash2, X, RotateCw, Maximize, Plus, House,
  CheckCircle, XCircle, Wrench,
} from '@/components/ui/LucideIcon';
import { EquipmentAPI } from '@/lib/api';

interface Equipment {
  id: string;
  name: string;
  model: string;
  category: string;
  serialNo: string;
  status: 'Operational' | 'Under Maintenance' | 'Retired';
  lastService: string;
  nextService: string;
  location: string;
  createdAt: string;
}

const statusBadge = (status: Equipment['status']) => {
  const map = {
    Operational: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Under Maintenance': 'bg-orange-50 text-orange-700 border-orange-200',
    Retired: 'bg-red-50 text-red-700 border-red-200',
  };
  const dot = {
    Operational: 'bg-emerald-500',
    'Under Maintenance': 'bg-orange-500',
    Retired: 'bg-red-500',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${map[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status]}`} />
      {status}
    </span>
  );
};

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await EquipmentAPI.getAll();
        setEquipment(res.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load equipment');
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, []);

  const filteredEquipment = equipment.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.serialNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: equipment.length,
    operational: equipment.filter(e => e.status === 'Operational').length,
    maintenance: equipment.filter(e => e.status === 'Under Maintenance').length,
    retired: equipment.filter(e => e.status === 'Retired').length,
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
            <li className="text-gray-900 font-medium" aria-current="page">Equipment List</li>
          </ol>
        </nav>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-250 shadow-sm" title="Refresh">
            <RotateCw className="w-4 h-4" />
          </button>
          <button className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-250 shadow-sm" title="Maximize">
            <Maximize className="w-4 h-4" />
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F9291] text-white font-semibold text-sm hover:bg-teal-700 transition-all duration-250 shadow-sm hover:shadow-md active:scale-95">
            <Plus className="w-4 h-4" /> Add Equipment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Total Equipment', value: stats.total, icon: Wrench, color: 'text-[#0F9291]', bg: 'bg-[#0F9291]/10', trend: 'All assets' },
          { label: 'Operational', value: stats.operational, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'In use' },
          { label: 'Under Maintenance', value: stats.maintenance, icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50', trend: 'In service' },
          { label: 'Retired', value: stats.retired, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', trend: 'Decommissioned' },
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
                <input type="text" placeholder="Search equipment..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-60 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250" />
              </div>
            </div>
            <span className="text-xs text-gray-400 font-medium">{filteredEquipment.length} equipment{filteredEquipment.length !== 1 ? '' : ''}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {['Equipment', 'Model', 'Serial No', 'Category', 'Location', 'Last Service', 'Next Service', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" /><div className="h-4 bg-gray-200 rounded animate-pulse w-28" /></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-20" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-28" /></td>
                    <td className="px-5 py-4"><div className="h-5 bg-gray-200 rounded-full animate-pulse w-20" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-16" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-24" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-24" /></td>
                    <td className="px-5 py-4"><div className="h-5 bg-gray-200 rounded-full animate-pulse w-24" /></td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-1"><div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" /><div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" /></div></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-red-500">{error}</td>
                </tr>
              ) : filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm mb-1">No equipment found</p>
                    <p className="text-gray-300 text-xs">Click &quot;Add Equipment&quot; to register one</p>
                  </td>
                </tr>
              ) : (
                filteredEquipment.map(eq => (
                  <tr key={eq.id} className="hover:bg-gray-50/50 transition-colors duration-250">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0F9291]/10 text-[#0F9291] shrink-0">
                          <Wrench className="w-5 h-5" />
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{eq.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{eq.model}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <code className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{eq.serialNo}</code>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {eq.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{eq.location}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{eq.lastService}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{eq.nextService}</td>
                    <td className="px-5 py-4 whitespace-nowrap">{statusBadge(eq.status)}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-[#0F9291] hover:bg-[#0F9291]/10 transition-all duration-250" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-250" title="Delete">
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
      </div>
    </div>
  );
}
