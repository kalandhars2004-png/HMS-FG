'use client';

import { useState } from 'react';
import { Search, Plus, FileText, FileSpreadsheet, RefreshCw, ChevronUp, Edit, Trash2, X, Scan } from 'lucide-react';

interface PurchaseReturn {
  id: string;
  productImage?: string;
  productIcon: string;
  date: string;
  supplierName: string;
  reference: string;
  status: 'Received' | 'Pending';
  total: number;
  paid: number;
  due: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Overdue';
}

const mockPurchaseReturns: PurchaseReturn[] = [
  {
    id: '1',
    productIcon: '💻',
    date: '24 Dec 2024',
    supplierName: 'Electro Mart',
    reference: 'PT001',
    status: 'Received',
    total: 1000,
    paid: 1000,
    due: 0,
    paymentStatus: 'Paid'
  },
  {
    id: '2',
    productIcon: '🎧',
    date: '10 Dec 2024',
    supplierName: 'Quantum Gadgets',
    reference: 'PT002',
    status: 'Pending',
    total: 1500,
    paid: 0,
    due: 1500,
    paymentStatus: 'Unpaid'
  },
  {
    id: '3',
    productIcon: '👟',
    date: '27 Nov 2024',
    supplierName: 'Prime Bazaar',
    reference: 'PT003',
    status: 'Received',
    total: 1500,
    paid: 1800,
    due: 0,
    paymentStatus: 'Paid'
  },
  {
    id: '4',
    productIcon: '⌚',
    date: '18 Nov 2024',
    supplierName: 'Gadget World',
    reference: 'PT004',
    status: 'Received',
    total: 2000,
    paid: 1000,
    due: 1000,
    paymentStatus: 'Overdue'
  },
  {
    id: '5',
    productIcon: '🔊',
    date: '06 Nov 2024',
    supplierName: 'Volt Vault',
    reference: 'PT005',
    status: 'Received',
    total: 800,
    paid: 800,
    due: 0,
    paymentStatus: 'Paid'
  },
  {
    id: '6',
    productIcon: '🪑',
    date: '25 Oct 2024',
    supplierName: 'Elite Retail',
    reference: 'PT006',
    status: 'Pending',
    total: 750,
    paid: 0,
    due: 750,
    paymentStatus: 'Unpaid'
  },
  {
    id: '7',
    productIcon: '👜',
    date: '14 Oct 2024',
    supplierName: 'Prime Mart',
    reference: 'PT007',
    status: 'Received',
    total: 1300,
    paid: 1300,
    due: 0,
    paymentStatus: 'Paid'
  },
  {
    id: '8',
    productIcon: '📱',
    date: '14 Oct 2024',
    supplierName: 'NeoTech Store',
    reference: 'PT008',
    status: 'Received',
    total: 1100,
    paid: 1100,
    due: 0,
    paymentStatus: 'Paid'
  },
];

export default function PurchaseReturnsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Status');
  const [sortBy, setSortBy] = useState('Sort By : Last 7 Days');
  const [showAddModal, setShowAddModal] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [date, setDate] = useState('');
  const [reference, setReference] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [orderTax, setOrderTax] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [shipping, setShipping] = useState('0');
  const [returnStatus, setReturnStatus] = useState('');
  const [description, setDescription] = useState('');

  const getStatusColor = (status: PurchaseReturn['status']) => {
    switch (status) {
      case 'Received':
        return 'bg-green-500 text-white';
      case 'Pending':
        return 'bg-cyan-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPaymentStatusColor = (status: PurchaseReturn['paymentStatus']) => {
    switch (status) {
      case 'Paid':
        return 'text-green-600';
      case 'Unpaid':
        return 'text-red-600';
      case 'Overdue':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredReturns = mockPurchaseReturns.filter(returnItem => {
    const matchesSearch =
      returnItem.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      returnItem.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'Status' || returnItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Returns</h1>
        <p className="text-sm text-gray-600">Manage your purchase return</p>
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option>Status</option>
            <option value="Received">Received</option>
            <option value="Pending">Pending</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option>Sort By : Last 7 Days</option>
            <option>Sort By : Last 30 Days</option>
            <option>Sort By : Last 3 Months</option>
            <option>Sort By : Last 6 Months</option>
            <option>Sort By : Last Year</option>
          </select>

          {/* Add Sales Return Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Plus className="w-5 h-5" />
            Add Sales Return
          </button>
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
                Product Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paid
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredReturns.map((returnItem) => (
              <tr key={returnItem.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                </td>
                <td className="px-6 py-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded flex items-center justify-center text-white text-xl">
                    {returnItem.productIcon}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{returnItem.date}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{returnItem.supplierName}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{returnItem.reference}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(returnItem.status)}`}>
                    {returnItem.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-700">${returnItem.total}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-700">${returnItem.paid}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-700">${returnItem.due.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1 text-xs font-medium ${getPaymentStatusColor(returnItem.paymentStatus)}`}>
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    {returnItem.paymentStatus}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
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

      {/* Add Purchase Return Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl shadow-xl max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b bg-white sticky top-0 z-10">
              <h2 className="text-2xl font-bold text-gray-900">Add Purchase Return</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              {/* Top Form Fields */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* Supplier Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select</option>
                      <option value="Electro Mart">Electro Mart</option>
                      <option value="Quantum Gadgets">Quantum Gadgets</option>
                      <option value="Prime Bazaar">Prime Bazaar</option>
                      <option value="Gadget World">Gadget World</option>
                      <option value="Volt Vault">Volt Vault</option>
                    </select>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="dd/mm/yyyy"
                  />
                </div>

                {/* Reference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Product Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search Product"
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <Scan className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Returns Table */}
              <div className="mb-6 border border-gray-300 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total ($)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid ($)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Due ($)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                        No returns added. Search and add products above.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Form Fields */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {/* Order Tax */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Tax <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={orderTax}
                    onChange={(e) => setOrderTax(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Shipping */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={shipping}
                    onChange={(e) => setShipping(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={returnStatus}
                    onChange={(e) => setReturnStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select</option>
                    <option value="Received">Received</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  {/* Toolbar */}
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-300 flex items-center gap-2">
                    <select className="px-2 py-1 border border-gray-300 rounded text-sm">
                      <option>Normal</option>
                      <option>Heading 1</option>
                      <option>Heading 2</option>
                    </select>
                    <button className="p-1 hover:bg-gray-200 rounded font-bold">B</button>
                    <button className="p-1 hover:bg-gray-200 rounded italic">I</button>
                    <button className="p-1 hover:bg-gray-200 rounded underline">U</button>
                    <button className="p-1 hover:bg-gray-200 rounded">🔗</button>
                    <button className="p-1 hover:bg-gray-200 rounded">•</button>
                    <button className="p-1 hover:bg-gray-200 rounded">1.</button>
                    <button className="p-1 hover:bg-gray-200 rounded">Tx</button>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 focus:outline-none resize-none"
                    rows={4}
                    placeholder="Type your message"
                  ></textarea>
                </div>
                <p className="text-xs text-gray-500 mt-1">Maximum 60 Words</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
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
