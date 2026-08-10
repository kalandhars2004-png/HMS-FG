'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Sheet, RotateCw, Plus, Eye, Trash2, ClipboardCheck } from '@/components/ui/LucideIcon';
import { StockCountsAPI, WarehousesAPI } from '@/lib/api';
import GlobalModal from '@/components/ui/GlobalModal';

interface StockCount {
  id: number;
  countNumber: string;
  warehouseId: number;
  warehouseName: string;
  status: string;
  totalItems: number;
  countedItems: number;
  discrepancyCount: number;
  notes: string;
  scheduledDate: string;
  completedDate: string;
  createdAt: string;
  createdBy: number;
  completedBy: number;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function CycleCountPage() {
  const router = useRouter();
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ warehouseId: '', notes: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [countsRes, whRes] = await Promise.all([
        StockCountsAPI.getAll(),
        WarehousesAPI.getAll(),
      ]);
      setCounts((countsRes as any).data || []);
      setWarehouses((whRes as any).data || []);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err?.message || 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await StockCountsAPI.create({
        warehouseId: Number(formData.warehouseId),
        notes: formData.notes,
        status: 'DRAFT',
      });
      setShowModal(false);
      setFormData({ warehouseId: '', notes: '' });
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to create');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this stock count?')) return;
    try {
      await StockCountsAPI.delete(String(id));
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete');
    }
  };

  const filtered = counts.filter(c => {
    const matchesSearch = !searchQuery || c.countNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    const matchesWarehouse = !warehouseFilter || String(c.warehouseId) === warehouseFilter;
    return matchesSearch && matchesStatus && matchesWarehouse;
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-red-500">{error}</p>
            <button onClick={loadData} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Cycle Count / Stock Take</h1>
          <p className="text-sm text-gray-600 mt-1">Manage physical inventory counts</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search count number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex gap-2 items-center">
              <button className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200">
                <FileText className="w-5 h-5 text-red-500" />
              </button>
              <button className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200">
                <Sheet className="w-5 h-5 text-green-600" />
              </button>
              <button onClick={loadData} className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200">
                <RotateCw className="w-5 h-5 text-gray-600" />
              </button>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((wh: any) => (
                  <option key={wh.id} value={String(wh.id)}>{wh.warehouse}</option>
                ))}
              </select>

              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 font-medium"
              >
                <Plus className="w-5 h-5" /> New Count
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Count#</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Warehouse</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Total Items</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Counted</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Discrepancies</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">No stock counts found.</td>
                    </tr>
                  ) : (
                    filtered.map((count) => (
                      <tr
                        key={count.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/stock/cycle-count/${count.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-orange-600">{count.countNumber}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{count.warehouseName || `Warehouse #${count.warehouseId}`}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[count.status] || 'bg-gray-100 text-gray-800'}`}>
                            {count.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{count.totalItems}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{count.countedItems}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${count.discrepancyCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {count.discrepancyCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(count.createdAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/stock/cycle-count/${count.id}`); }}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(count.id); }}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <GlobalModal
          onClose={() => setShowModal(false)}
          title="New Stock Count"
          subtitle="Create a physical stock count for a warehouse."
          icon={<ClipboardCheck className="w-5 h-5" />}
          size="md"
          cancelLabel="Cancel"
          submitLabel="Create Count"
          onSubmit={handleCreate}
          submitDisabled={!formData.warehouseId}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Warehouse <span className="text-red-500">*</span></label>
              <select
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((wh: any) => (
                  <option key={wh.id} value={wh.id}>{wh.warehouse}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Optional notes..."
              />
            </div>
          </div>
        </GlobalModal>
      )}
    </div>
  );
}
