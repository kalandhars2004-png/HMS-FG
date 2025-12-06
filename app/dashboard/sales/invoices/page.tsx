'use client';

import { useState } from 'react';
import { Search, Eye, Trash2, FileText, Sheet, RotateCw } from 'lucide-react';

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const invoices = [
    { id: 'INV001', customer: { name: 'Carl Evans', initials: 'CE' }, dueDate: '24 Dec 2024', amount: 1000, paid: 1000, due: 0, status: 'Paid' },
    { id: 'INV002', customer: { name: 'Minerva Rameriz', initials: 'MR' }, dueDate: '24 Dec 2024', amount: 1500, paid: 0, due: 1500, status: 'Unpaid' },
    { id: 'INV003', customer: { name: 'Robert Lamon', initials: 'RL' }, dueDate: '24 Dec 2024', amount: 1500, paid: 0, due: 1500, status: 'Unpaid' },
    { id: 'INV004', customer: { name: 'Patricia Lewis', initials: 'PL' }, dueDate: '24 Dec 2024', amount: 2000, paid: 1000, due: 1000, status: 'Overdue' },
  ];

  const getAvatarColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500'];
    return colors[index % colors.length];
  };

  const getStatusColor = (status: string) => {
    if (status === 'Paid') return 'text-green-600';
    if (status === 'Overdue') return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your stock invoices</p>
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
              <select className="px-3 py-2 border border-gray-200 rounded-lg">
                <option>Customer</option>
              </select>
              <select className="px-3 py-2 border border-gray-200 rounded-lg">
                <option>Status</option>
              </select>
              <select className="px-3 py-2 border border-gray-200 rounded-lg">
                <option>Sort By : Last 7 Days</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Invoice No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Due Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Paid</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Amount Due</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((invoice, index) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><span className="text-sm font-medium">{invoice.id}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getAvatarColor(index)}`}>
                        {invoice.customer.initials}
                      </div>
                      <span className="text-sm">{invoice.customer.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-gray-600">{invoice.dueDate}</span></td>
                  <td className="px-6 py-4"><span className="text-sm font-medium">${invoice.amount}</span></td>
                  <td className="px-6 py-4"><span className="text-sm">${invoice.paid}</span></td>
                  <td className="px-6 py-4"><span className="text-sm">${invoice.due}</span></td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${getStatusColor(invoice.status)}`}>● {invoice.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg"><Eye className="w-4 h-4" /></button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
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
