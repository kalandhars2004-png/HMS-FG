'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, AlertTriangle, TrendingDown, RefreshCw } from '@/components/ui/LucideIcon';
import { ProductsAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';

const STOCK_LOW_THRESHOLD = 30;

export default function StockReportPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ProductsAPI.getAll();
      setProducts(res.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalProducts = products.length;
  const lowStockCount = products.filter((p: any) => {
    const q = p.quantity ?? p.stockQuantity ?? 0;
    return q > 0 && q < STOCK_LOW_THRESHOLD;
  }).length;
  const outOfStockCount = products.filter((p: any) => (p.quantity ?? p.stockQuantity ?? 0) === 0).length;

  const stats = [
    { label: 'Total Products', value: totalProducts.toLocaleString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Low Stock Items', value: lowStockCount.toString(), icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Out of Stock', value: outOfStockCount.toString(), icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'In Stock', value: (totalProducts - lowStockCount - outOfStockCount).toLocaleString(), icon: RefreshCw, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Report</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? 'Loading...' : `${totalProducts} products in inventory`}</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" />Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Stock Movement</h3>
          <span className="text-xs text-gray-400">{products.length} items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">SKU</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Stock</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Price</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && !loading && (
                <tr><td colSpan={5} className="text-center py-8 text-sm text-gray-400">No products found</td></tr>
              )}
              {products.slice(0, 30).map((p: any, i: number) => {
                const qty = p.quantity ?? p.stockQuantity ?? 0;
                const status = qty === 0 ? 'Out of Stock' : qty < STOCK_LOW_THRESHOLD ? 'Low Stock' : 'In Stock';
                const statusColor = status === 'In Stock' ? 'bg-emerald-100 text-emerald-700'
                  : status === 'Low Stock' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
                return (
                  <tr key={p.id || i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name || `Product #${p.id}`}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.sku || '-'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-right">{qty}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(p.price || 0)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>{status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}