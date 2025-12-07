'use client';

import { useState } from 'react';
import { Search, FileText, FileSpreadsheet, RefreshCw, ChevronUp } from 'lucide-react';

interface PurchaseOrder {
  id: string;
  productName: string;
  productImage?: string;
  purchasedAmount: number;
  purchasedQty: number;
  instockQty: number;
}

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: '1',
    productName: 'Lenovo IdeaPad 3',
    purchasedAmount: 1000,
    purchasedQty: 40,
    instockQty: 30,
  },
  {
    id: '2',
    productName: 'Beats Pro',
    purchasedAmount: 1500,
    purchasedQty: 25,
    instockQty: 18,
  },
  {
    id: '3',
    productName: 'Nike Jordan',
    purchasedAmount: 1500,
    purchasedQty: 30,
    instockQty: 35,
  },
  {
    id: '4',
    productName: 'Apple Series 5 Watch',
    purchasedAmount: 2000,
    purchasedQty: 28,
    instockQty: 30,
  },
  {
    id: '5',
    productName: 'Amazon Echo Dot',
    purchasedAmount: 800,
    purchasedQty: 15,
    instockQty: 10,
  },
  {
    id: '6',
    productName: 'Sanford Chair Sofa',
    purchasedAmount: 750,
    purchasedQty: 20,
    instockQty: 15,
  },
  {
    id: '7',
    productName: 'Red Premium Satchel',
    purchasedAmount: 1300,
    purchasedQty: 35,
    instockQty: 40,
  },
  {
    id: '8',
    productName: 'Samsung Galaxy S23',
    purchasedAmount: 2500,
    purchasedQty: 22,
    instockQty: 20,
  },
  {
    id: '9',
    productName: 'MacBook Pro M2',
    purchasedAmount: 4200,
    purchasedQty: 15,
    instockQty: 12,
  },
  {
    id: '10',
    productName: 'Sony Headphones WH-1000XM4',
    purchasedAmount: 350,
    purchasedQty: 45,
    instockQty: 38,
  },
];

export default function PurchaseOrderPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Last 7 Days');

  const filteredOrders = mockPurchaseOrders.filter(order =>
    order.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Purchase order</h1>
        <p className="text-sm text-gray-600">Manage your Purchase order</p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex items-center justify-between">
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Export Icons */}
          <button className="p-2 hover:bg-gray-100 rounded" title="Export PDF">
            <FileText className="w-5 h-5 text-red-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded" title="Export Excel">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded" title="Refresh">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded" title="Collapse">
            <ChevronUp className="w-5 h-5 text-gray-600" />
          </button>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 3 Months</option>
            <option>Last 6 Months</option>
            <option>Last Year</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purchased Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purchased QTY
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Instock QTY
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-500 text-xs font-medium">
                        {order.productName.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{order.productName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-700">
                  ${order.purchasedAmount}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-700">
                  {order.purchasedQty}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-700">
                  {order.instockQty}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Showing</span>
            <select className="px-2 py-1 border border-gray-300 rounded text-sm">
              <option>10</option>
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
            <span className="text-sm text-gray-600">entries</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm">
              Previous
            </button>
            <button className="px-3 py-1 bg-orange-500 text-white rounded text-sm">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm">2</button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm">3</button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
