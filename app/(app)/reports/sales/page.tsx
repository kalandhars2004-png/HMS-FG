'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Download, Calendar, DollarSign, ShoppingCart, Users, TrendingUp } from '@/components/ui/LucideIcon';
import { TransactionsAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';

export default function SalesReportPage() {
  const [period, setPeriod] = useState('today');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await TransactionsAPI.getAll();
      setTransactions(res.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sales = transactions.filter((t: any) => t.transactionType === 'SALE');
  const totalSales = sales.reduce((s: number, t: any) => s + Number(t.totalPrice || 0), 0);
  const customerSet = new Set(sales.map((t: any) => t.description).filter(Boolean));
  const avgOrder = sales.length > 0 ? totalSales / sales.length : 0;

  const stats = [
    { label: 'Total Sales', value: `${formatCurrency(totalSales)}`, change: '+12.5%', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Orders', value: sales.length.toString(), change: '+8.2%', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Customers', value: customerSet.size.toString(), change: '+5.7%', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Avg. Order Value', value: `${formatCurrency(avgOrder)}`, change: '+3.1%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? 'Loading...' : `${sales.length} transactions found`}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {['today', 'week', 'month', 'year'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${period === p ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>
            ))}
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <Calendar className="w-4 h-4" /> Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <Download className="w-4 h-4" />Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{s.change}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Sales Transactions</h3>
          <span className="text-xs text-gray-400">{sales.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Total</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 && !loading && (
                <tr><td colSpan={5} className="text-center py-8 text-sm text-gray-400">No sales transactions yet</td></tr>
              )}
              {sales.slice(0, 20).map((t: any, i: number) => (
                <tr key={t.id || i} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">#{t.id || `TX-${i + 1}`}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{t.description || 'Walk-in Customer'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(t.totalPrice || 0)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                      t.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>{t.status || 'COMPLETED'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-right">
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '-'}
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