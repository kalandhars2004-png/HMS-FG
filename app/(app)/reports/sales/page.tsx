'use client';

import { useState } from 'react';
import { BarChart3, Download, Filter, Calendar, DollarSign, ShoppingCart, Users, TrendingUp } from '@/components/ui/LucideIcon';

export default function SalesReportPage() {
  const [period, setPeriod] = useState('today');

  const stats = [
    { label: 'Total Sales', value: '₹12,845.50', change: '+12.5%', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Orders', value: '156', change: '+8.2%', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Customers', value: '89', change: '+5.7%', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Avg. Order Value', value: '₹82.34', change: '+3.1%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>
          <p className="text-sm text-gray-500 mt-1">View and export sales analytics.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {['today', 'week', 'month', 'year'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${period === p ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <Calendar className="w-4 h-4" />Jan 1 - Jul 27, 2026
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
          <h3 className="text-base font-semibold text-gray-900">Recent Sales</h3>
          <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <Filter className="w-4 h-4" />Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Invoice</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Items</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Total</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {[
                { inv: 'ORD-001', customer: 'John Smith', items: 3, total: 156.00, status: 'Completed', date: '27 Jul 2026' },
                { inv: 'ORD-002', customer: 'Sarah Johnson', items: 1, total: 28.50, status: 'Completed', date: '27 Jul 2026' },
                { inv: 'ORD-003', customer: 'Mike Wilson', items: 5, total: 234.75, status: 'Pending', date: '26 Jul 2026' },
                { inv: 'ORD-004', customer: 'Emily Davis', items: 2, total: 89.99, status: 'Completed', date: '26 Jul 2026' },
                { inv: 'ORD-005', customer: 'Robert Brown', items: 4, total: 312.25, status: 'Cancelled', date: '25 Jul 2026' },
              ].map((row, i) => (
                <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">#{row.inv}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row.customer}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.items}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{row.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      row.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      row.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>{row.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-right">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
