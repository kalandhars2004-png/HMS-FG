'use client';

import { useState } from 'react';
import { Search, Edit, Trash2, FileText, Sheet, RotateCw } from 'lucide-react';

export default function StockTransferPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const transfers = [
    {
      id: '1',
      from: 'Lavish Warehouse',
      to: 'Electro Mart',
      product: { name: 'Lenovo IdeaPad 3', icon: '💻' },
      date: '24 Dec 2024',
      person: { name: 'James Kirwin', initials: 'JK' },
      quantity: 100,
    },
  ];

  const getAvatarColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500'];
    return colors[index % colors.length];
  };

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
              {transfers.map((transfer, index) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
