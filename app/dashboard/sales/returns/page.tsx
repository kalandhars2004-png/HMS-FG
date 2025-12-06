'use client';

import { useState } from 'react';
import { Search, Edit, Trash2, FileText, Sheet, RotateCw, X, Plus } from 'lucide-react';

interface SalesReturn {
  id: string;
  product: {
    name: string;
    icon: string;
  };
  date: string;
  customer: {
    name: string;
    initials: string;
  };
  status: 'Received' | 'Pending';
  total: number;
  paid: number;
  due: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Overdue';
}

export default function SalesReturnPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);
  const [activeTab, setActiveTab] = useState('Sales Return');

  const returns: SalesReturn[] = [
    { id: '1', product: { name: 'Lenovo IdeaPad 3', icon: '💻' }, date: '19 Nov 2022', customer: { name: 'Carl Evans', initials: 'CE' }, status: 'Received', total: 1000, paid: 1000, due: 0, paymentStatus: 'Paid' },
    { id: '2', product: { name: 'Apple tablet', icon: '📱' }, date: '19 Nov 2022', customer: { name: 'Minerva Rameriz', initials: 'MR' }, status: 'Pending', total: 1500, paid: 0, due: 1500, paymentStatus: 'Unpaid' },
    { id: '3', product: { name: 'Headphone', icon: '🎧' }, date: '19 Nov 2022', customer: { name: 'Robert Lamon', initials: 'RL' }, status: 'Received', total: 2000, paid: 1000, due: 1000, paymentStatus: 'Overdue' },
    { id: '4', product: { name: 'Nike Jordan', icon: '👟' }, date: '19 Nov 2022', customer: { name: 'Mark Joslyn', initials: 'MJ' }, status: 'Received', total: 1500, paid: 1500, due: 0, paymentStatus: 'Paid' },
    { id: '5', product: { name: 'Macbook Pro', icon: '💻' }, date: '19 Nov 2022', customer: { name: 'Patricia Lewis', initials: 'PL' }, status: 'Received', total: 800, paid: 800, due: 0, paymentStatus: 'Paid' },
    { id: '6', product: { name: 'Red Premium Satchel', icon: '👜' }, date: '19 Nov 2022', customer: { name: 'Marsha Betts', initials: 'MB' }, status: 'Pending', total: 750, paid: 0, due: 750, paymentStatus: 'Unpaid' },
    { id: '7', product: { name: 'Apple Earpods', icon: '🎧' }, date: '19 Nov 2022', customer: { name: 'Daniel Jude', initials: 'DJ' }, status: 'Received', total: 1300, paid: 1300, due: 0, paymentStatus: 'Paid' },
    { id: '8', product: { name: 'Iphone 14 Pro', icon: '📱' }, date: '19 Nov 2022', customer: { name: 'Emma Bates', initials: 'EB' }, status: 'Received', total: 1100, paid: 1100, due: 0, paymentStatus: 'Paid' },
    { id: '9', product: { name: 'Gaming Chair', icon: '🪑' }, date: '19 Nov 2022', customer: { name: 'Richard Fralick', initials: 'RF' }, status: 'Pending', total: 2300, paid: 2300, due: 0, paymentStatus: 'Paid' },
  ];

  const getAvatarColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-pink-500', 'bg-indigo-500', 'bg-green-500', 'bg-orange-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
    return colors[index % colors.length];
  };

  const getStatusBadge = (status: string) => {
    return status === 'Received' ? 'bg-green-100 text-green-800' : 'bg-cyan-100 text-cyan-800';
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusColors = {
      Paid: 'bg-green-100 text-green-800',
      Unpaid: 'bg-red-100 text-red-800',
      Overdue: 'bg-yellow-100 text-yellow-800',
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 bg-green-500 p-6 rounded-lg">
          <h1 className="text-2xl font-bold text-white">Sales Return</h1>
          <p className="text-sm text-white mt-1">Manage your returns</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-lg border-b">
          <div className="flex gap-8 px-6">
            <button
              onClick={() => setActiveTab('Sales')}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'Sales'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Sales
            </button>
            <button
              onClick={() => setActiveTab('Sales Return')}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'Sales Return'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Sales Return
            </button>
          </div>
        </div>

        <div className="bg-white shadow-sm p-4">
          <div className="flex justify-between items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div className="flex gap-2 items-center">
              <button className="p-2 hover:bg-gray-50 rounded border border-gray-300">
                <FileText className="w-4 h-4 text-red-500" />
              </button>
              <button className="p-2 hover:bg-gray-50 rounded border border-gray-300">
                <Sheet className="w-4 h-4 text-green-600" />
              </button>
              <button className="p-2 hover:bg-gray-50 rounded border border-gray-300">
                <RotateCw className="w-4 h-4 text-gray-600" />
              </button>
              <select className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white">
                <option>Customer</option>
              </select>
              <select className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white">
                <option>Status</option>
                <option>Received</option>
                <option>Pending</option>
              </select>
              <select className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white">
                <option>Payment Status</option>
                <option>Paid</option>
                <option>Unpaid</option>
                <option>Overdue</option>
              </select>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Sales Return
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-blue-400 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Product</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Paid</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Due</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Payment Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {returns.map((ret, index) => (
                <tr key={ret.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                        {ret.product.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{ret.product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{ret.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getAvatarColor(index)}`}>
                        {ret.customer.initials}
                      </div>
                      <span className="text-sm text-gray-900">{ret.customer.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(ret.status)}`}>
                      {ret.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">${ret.total}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">${ret.paid}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${ret.due > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      ${ret.due.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadge(ret.paymentStatus)}`}>
                      • {ret.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedReturn(ret);
                          setShowEditModal(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="Delete">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {returns.length} of {returns.length} returns
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
              Previous
            </button>
            <button className="px-3 py-1 bg-orange-500 text-white rounded-lg text-sm">
              1
            </button>
            <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Sales Return Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b bg-blue-600">
              <h2 className="text-xl font-semibold text-white">Add Sales Return</h2>
              <button onClick={() => setShowModal(false)} className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option>Select Customer</option>
                    <option>Carl Evans</option>
                    <option>Minerva Rameriz</option>
                    <option>Robert Lamon</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    defaultValue="2022-11-19"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter reference"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Please type product code and select"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option>Select Status</option>
                    <option>Received</option>
                    <option>Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Status <span className="text-red-500">*</span>
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option>Select Payment Status</option>
                    <option>Paid</option>
                    <option>Unpaid</option>
                    <option>Partial</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sales Return Modal */}
      {showEditModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b bg-blue-600">
              <h2 className="text-xl font-semibold text-white">Edit Sales Return</h2>
              <button onClick={() => setShowEditModal(false)} className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Top Form Fields */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option>Thomas</option>
                      <option>{selectedReturn.customer.name}</option>
                    </select>
                    <button className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    defaultValue="2022-11-19"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    defaultValue="555444"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Product Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Please type product code and select"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Product Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Product Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Net Unit Price($)</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Stock</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">QTY</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Discount($)</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Tax %</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Subtotal ($)</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <span className="text-xl">🎧</span>
                        <span>Apple Earpods</span>
                      </td>
                      <td className="px-4 py-3">300</td>
                      <td className="px-4 py-3">400</td>
                      <td className="px-4 py-3">500</td>
                      <td className="px-4 py-3">100</td>
                      <td className="px-4 py-3">50</td>
                      <td className="px-4 py-3">300</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <span className="text-xl">🎧</span>
                        <span>Apple Earpods</span>
                      </td>
                      <td className="px-4 py-3">150</td>
                      <td className="px-4 py-3">500</td>
                      <td className="px-4 py-3">300</td>
                      <td className="px-4 py-3">100</td>
                      <td className="px-4 py-3">50</td>
                      <td className="px-4 py-3">300</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Section */}
              <div className="flex justify-end">
                <div className="w-96 space-y-2 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order Tax</span>
                    <span className="font-medium">$ 0.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium">$ 0.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">$ 0.00</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold border-t pt-2">
                    <span>Grand Total</span>
                    <span>$ 0.00</span>
                  </div>
                </div>
              </div>

              {/* Bottom Form Fields */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Tax <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    defaultValue="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    defaultValue="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    defaultValue="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option>Select</option>
                    <option>Received</option>
                    <option>Pending</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                >
                  Cancel
                </button>
                <button className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
