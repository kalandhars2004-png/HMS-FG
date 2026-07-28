'use client';

import { Package, AlertTriangle, TrendingDown, RefreshCw } from '@/components/ui/LucideIcon';

export default function StockReportPage() {
  const stats = [
    { label: 'Total Products', value: '1,245', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Low Stock Items', value: '23', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Out of Stock', value: '8', icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Pending Reorder', value: '15', icon: RefreshCw, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Report</h1>
          <p className="text-sm text-gray-500 mt-1">View inventory and stock movement reports.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" />Export Report
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
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Stock Movement</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">SKU</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Current Stock</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Min Stock</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Max Stock</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Cetirizine 10mg', sku: 'CET-10', stock: 120, min: 50, max: 500, status: 'In Stock' },
                { name: 'Amoxicillin 500mg', sku: 'AMX-500', stock: 15, min: 30, max: 300, status: 'Low Stock' },
                { name: 'Vitamin C 1000mg', sku: 'VIT-C', stock: 0, min: 20, max: 200, status: 'Out of Stock' },
                { name: 'Ibuprofen 200mg', sku: 'IBU-200', stock: 150, min: 40, max: 400, status: 'In Stock' },
                { name: 'Metformin 500mg', sku: 'MTF-500', stock: 200, min: 50, max: 600, status: 'In Stock' },
                { name: 'Atorvastatin 10mg', sku: 'ATR-10', stock: 8, min: 25, max: 250, status: 'Low Stock' },
              ].map((row, i) => (
                <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{row.sku}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right">{row.stock}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-right">{row.min}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-right">{row.max}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      row.status === 'In Stock' ? 'bg-emerald-100 text-emerald-700' :
                      row.status === 'Low Stock' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
