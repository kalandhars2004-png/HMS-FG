'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, FileText, FileSpreadsheet, RefreshCw, ChevronUp, Edit, Trash2, Scan } from '@/components/ui/LucideIcon';
import { formatCurrency } from '@/lib/currency';
import { TransactionsAPI } from '@/lib/api';
import GlobalModal from '@/components/ui/GlobalModal';

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

export default function PurchaseReturnsPage() {
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await TransactionsAPI.getAll();
        const txList = (res.data || []).filter((t: any) => t.transactionType === 'RETURN_TO_SUPPLIER');
        setReturns(txList.map((t: any) => {
          const total = Number(t.totalPrice || 0);
          const isCompleted = t.status === 'COMPLETED';
          const paid = isCompleted ? total : 0;
          return {
            id: String(t.id),
            productIcon: '\u{1F4E6}',
            date: t.createdAt
              ? new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : '',
            supplierName: t.supplierName || t.supplier?.name || 'Unknown',
            reference: `RT-${String(t.id).padStart(3, '0')}`,
            status: isCompleted ? 'Received' : 'Pending',
            total,
            paid,
            due: total - paid,
            paymentStatus: isCompleted ? 'Paid' : 'Unpaid',
          };
        }));
      } catch (err: any) {
        setError(err.message || 'Failed to load returns');
      } finally {
        setLoading(false);
      }
    };
    fetchReturns();
  }, []);

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

  const filteredReturns = returns.filter(returnItem => {
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
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><div className="w-4 h-4 bg-gray-200 rounded animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="w-10 h-10 bg-gray-200 rounded animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-28" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-24" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-20" /></td>
                  <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded-full animate-pulse w-16" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-16" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-16" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-16" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-20" /></td>
                  <td className="px-6 py-4"><div className="flex items-center justify-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                  </div></td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={11} className="px-6 py-8 text-center text-red-500">{error}</td>
              </tr>
            ) : filteredReturns.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-8 text-center text-gray-500">No purchase returns found</td>
              </tr>
            ) : (
              filteredReturns.map((returnItem) => (
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
                  <td className="px-6 py-4 text-sm text-right text-gray-700">{formatCurrency(returnItem.total)}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700">{formatCurrency(returnItem.paid)}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700">{formatCurrency(returnItem.due)}</td>
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
              ))
            )}
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
        <GlobalModal
          onClose={() => setShowAddModal(false)}
          title="Add Purchase Return"
          icon={<Plus className="w-5 h-5" />}
          size="xl"
          submitLabel="Submit"
        >
          <div className="p-6">
            {/* Top Form Fields */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* Supplier Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                    Supplier Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                    >
                      <option value="">Select</option>
                      <option value="Electro Mart">Electro Mart</option>
                      <option value="Quantum Gadgets">Quantum Gadgets</option>
                      <option value="Prime Bazaar">Prime Bazaar</option>
                      <option value="Gadget World">Gadget World</option>
                      <option value="Volt Vault">Volt Vault</option>
                    </select>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black dark:bg-[#232323] dark:hover:bg-[#2A2A2A]">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                    placeholder="dd/mm/yyyy"
                  />
                </div>

                {/* Reference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                    Reference <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                  />
                </div>
              </div>

              {/* Product Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                  Product <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search Product"
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <Scan className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Returns Table */}
              <div className="mb-6 border border-gray-300 rounded-lg overflow-hidden dark:border-[#2A2A2A]">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#1E1E1E]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Image</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Supplier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Reference</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Total ($)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Paid ($)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Due ($)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                    Order Tax <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={orderTax}
                    onChange={(e) => setOrderTax(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                  />
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                    Discount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                  />
                </div>

                {/* Shipping */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                    Shipping <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={shipping}
                    onChange={(e) => setShipping(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={returnStatus}
                    onChange={(e) => setReturnStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                  >
                    <option value="">Select</option>
                    <option value="Received">Received</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                  Description
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden dark:border-[#2A2A2A]">
                  {/* Toolbar */}
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-300 flex items-center gap-2 dark:bg-[#1E1E1E] dark:border-[#2A2A2A]">
                    <select className="px-2 py-1 border border-gray-300 rounded text-sm dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]">
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
                    className="w-full px-4 py-3 focus:outline-none resize-none dark:bg-transparent dark:text-[#F8FAFC]"
                    rows={4}
                    placeholder="Type your message"
                  ></textarea>
                </div>
                <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Maximum 60 Words</p>
              </div>

              {/* Action Buttons */}
            </div>
        </GlobalModal>
      )}
    </div>
  );
}
