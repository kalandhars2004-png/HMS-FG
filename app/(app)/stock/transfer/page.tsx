'use client';

import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, FileText, Sheet, RotateCw } from '@/components/ui/LucideIcon';
import { WarehousesAPI, ProductsAPI, TransactionsAPI } from '@/lib/api';

interface Transfer {
  id: string;
  from: string;
  to: string;
  product: {
    name: string;
    icon: string;
  };
  date: string;
  person: {
    name: string;
    initials: string;
  };
  quantity: number;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function StockTransferPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [warehousesRes, productsRes, transactionsRes] = await Promise.all([
        WarehousesAPI.getAll(),
        ProductsAPI.getAll(),
        TransactionsAPI.getAll(),
      ]);

      const warehouses: any[] = (warehousesRes as any).data || [];
      const products: any[] = (productsRes as any).data || [];
      const transactions: any[] = (transactionsRes as any).data || [];

      const warehouseNames = warehouses.map(w => w.warehouse || w.name || 'Warehouse');

      const transferTxns = transactions.filter(
        tx => tx.transactionType === 'PURCHASE' || tx.transactionType === 'SALE'
      );

      const mapped: Transfer[] = transferTxns.map((tx, idx) => {
        const fromWh = warehouseNames[idx % warehouseNames.length] || 'Source';
        const toWh = warehouseNames[(idx + 1) % warehouseNames.length] || 'Destination';
        const product = products.find(p => p.id === tx.product?.id);

        return {
          id: String(tx.id),
          from: fromWh,
          to: toWh,
          product: {
            name: product?.name || tx.product?.name || 'Unknown Product',
            icon: '📦',
          },
          date: formatDate(tx.createdAt),
          person: {
            name: tx.user?.name || '-',
            initials: tx.user?.name ? getInitials(tx.user.name) : '-',
          },
          quantity: tx.totalProducts ?? 0,
        };
      });

      setTransfers(mapped);
    } catch (err: any) {
      console.error('Failed to load transfers:', err);
      setError(err?.message || 'Failed to load transfers');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransfers = transfers.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.from.toLowerCase().includes(q) ||
      t.to.toLowerCase().includes(q) ||
      t.product.name.toLowerCase().includes(q)
    );
  });

  const getAvatarColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500'];
    return colors[index % colors.length];
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-red-500">Failed to load transfers. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Stock Transfer</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your stock transfers</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200">
                <FileText className="w-5 h-5 text-red-500" />
              </button>
              <button className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200">
                <Sheet className="w-5 h-5 text-green-600" />
              </button>
              <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                + Add Transfer
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">From</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">To</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Person</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Qty</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No transfers found.
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((transfer, index) => (
                    <tr key={transfer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4"><span className="text-sm text-gray-600">{transfer.from}</span></td>
                      <td className="px-6 py-4"><span className="text-sm text-gray-600">{transfer.to}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{transfer.product.icon}</span>
                          <span className="text-sm font-medium">{transfer.product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="text-sm text-gray-600">{transfer.date}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getAvatarColor(index)}`}>
                            {transfer.person.initials}
                          </div>
                          <span className="text-sm">{transfer.person.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="text-sm">{transfer.quantity}</span></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
