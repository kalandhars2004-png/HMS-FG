'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, AlertTriangle, X, ClipboardCheck } from '@/components/ui/LucideIcon';
import { StockCountsAPI } from '@/lib/api';

interface StockCountItem {
  id: number;
  productId: number;
  productName: string;
  expectedQuantity: number;
  actualQuantity: number | null;
  variance: number;
  status: string;
  notes: string;
}

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
  items: StockCountItem[];
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const ITEM_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  COUNTED: 'bg-green-100 text-green-800',
  DISCREPANCY: 'bg-red-100 text-red-800',
};

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function CycleCountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [count, setCount] = useState<StockCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<number, string>>({});
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    loadCount();
  }, [params.id]);

  const loadCount = async () => {
    try {
      setLoading(true);
      const data = await StockCountsAPI.getById(params.id as string);
      setCount(data);
      const vals: Record<number, string> = {};
      (data as any).items?.forEach((item: StockCountItem) => {
        if (item.actualQuantity != null) vals[item.id] = String(item.actualQuantity);
      });
      setEditValues(vals);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async (itemId: number) => {
    if (!count) return;
    const val = editValues[itemId];
    if (val === '' || val === undefined) return;
    setSavingId(itemId);
    try {
      await StockCountsAPI.updateItemCount(String(count.id), String(itemId), { actualQuantity: Number(val) });
      showToast('Count saved', 'success');
      loadCount();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleComplete = async () => {
    if (!count) return;
    if (!confirm('Complete this stock count? All variances will be calculated.')) return;
    try {
      await StockCountsAPI.completeCount(String(count.id));
      showToast('Stock count completed', 'success');
      loadCount();
    } catch (err: any) {
      showToast(err?.message || 'Failed to complete', 'error');
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!count) return;
    try {
      await StockCountsAPI.updateStatus(String(count.id), status);
      showToast(`Status updated to ${status}`, 'success');
      loadCount();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!count) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-red-500">Stock count not found.</p>
            <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg">Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  const isEditable = count.status === 'DRAFT' || count.status === 'IN_PROGRESS';
  const canComplete = isEditable && (count.items?.some(i => i.actualQuantity != null) ?? false);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[1060] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-slideDown ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-2 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <button onClick={() => router.push('/stock/cycle-count')} className="text-sm text-orange-600 hover:text-orange-700 mb-2 block flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Cycle Counts
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Count: {count.countNumber}</h1>
          </div>
          <div className="flex gap-2">
            {isEditable && (
              <button onClick={() => handleStatusUpdate('IN_PROGRESS')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                Start Counting
              </button>
            )}
            {canComplete && (
              <button onClick={handleComplete} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" /> Complete Count
              </button>
            )}
            {isEditable && (
              <button onClick={() => handleStatusUpdate('CANCELLED')} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Count Info</h3>
            <p className="text-sm"><span className="text-gray-600">Count#: </span><span className="text-orange-500 font-medium">{count.countNumber}</span></p>
            <p className="text-sm"><span className="text-gray-600">Warehouse: </span>{count.warehouseName || `Warehouse #${count.warehouseId}`}</p>
            <p className="text-sm"><span className="text-gray-600">Created: </span>{formatDate(count.createdAt)}</p>
            {count.completedDate && <p className="text-sm"><span className="text-gray-600">Completed: </span>{formatDate(count.completedDate)}</p>}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Status</h3>
            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[count.status] || 'bg-gray-100 text-gray-800'}`}>
              {count.status?.replace('_', ' ')}
            </span>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{count.totalItems}</p>
                <p className="text-xs text-gray-600">Total Items</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{count.countedItems}</p>
                <p className="text-xs text-gray-600">Counted</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${count.discrepancyCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{count.discrepancyCount}</p>
                <p className="text-xs text-gray-600">Discrepancies</p>
              </div>
            </div>
          </div>
        </div>

        {count.discrepancyCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">
              {count.discrepancyCount} item{count.discrepancyCount > 1 ? 's' : ''} {count.discrepancyCount > 1 ? 'have' : 'has'} a discrepancy between expected and actual quantities.
            </p>
          </div>
        )}

        {count.notes && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
            <p className="text-sm text-gray-600">{count.notes}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Count Items</h3>
            {isEditable && (
              <p className="text-xs text-gray-500">Enter actual quantities and save per item</p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Product</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Expected Qty</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Actual Qty</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Variance</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                  {isEditable && <th className="px-6 py-4 text-left font-semibold text-gray-700">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(!count.items || count.items.length === 0) ? (
                  <tr>
                    <td colSpan={isEditable ? 6 : 5} className="px-6 py-8 text-center text-gray-500">No items in this count.</td>
                  </tr>
                ) : (
                  count.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900 font-medium">{item.productName || `Product #${item.productId}`}</td>
                      <td className="px-6 py-4">{item.expectedQuantity}</td>
                      <td className="px-6 py-4">
                        {isEditable ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={editValues[item.id] ?? ''}
                              onChange={(e) => setEditValues(prev => ({ ...prev, [item.id]: e.target.value }))}
                              className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                              placeholder="Enter count"
                            />
                          </div>
                        ) : (
                          <span>{item.actualQuantity ?? '-'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={item.variance !== 0 && item.variance !== null ? 'text-red-600 font-medium' : ''}>
                          {item.variance != null ? (item.variance > 0 ? `+${item.variance}` : item.variance) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${ITEM_STATUS_STYLES[item.status] || 'bg-gray-100 text-gray-600'}`}>
                          {item.status}
                        </span>
                      </td>
                      {isEditable && (
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleSaveItem(item.id)}
                            disabled={savingId === item.id || !editValues[item.id] || editValues[item.id] === ''}
                            className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-xs font-medium disabled:opacity-50"
                          >
                            {savingId === item.id ? 'Saving...' : 'Save Count'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
