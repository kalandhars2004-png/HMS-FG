'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, Edit, Trash2, FileText, Sheet, RotateCw, X, Plus, Minus, DollarSign, CreditCard, MoreVertical, CheckCircle2, AlertTriangle } from '@/components/ui/LucideIcon';
import { TransactionsAPI } from '@/lib/api';
import GlobalModal from '@/components/ui/GlobalModal';
import { formatCurrency } from '@/lib/currency';

interface Product {
  name: string;
  icon: string;
  qty: number;
  purchasePrice: number;
  discount: number;
  tax: number;
  taxAmount: number;
  unitCost: number;
  totalCost: number;
}

interface Payment {
  date: string;
  reference: string;
  amount: number;
  paidBy: string;
}

interface Sale {
  id: string;
  date: string;
  reference: string;
  customer: {
    name: string;
    initials: string;
    email: string;
    phone: string;
    address: string;
  };
  company: {
    name: string;
    address: string;
    email: string;
    phone: string;
  };
  warehouse: string;
  supplier: string;
  status: 'Completed' | 'Pending' | 'Ordered';
  grandTotal: number;
  paid: number;
  due: number;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';
  createdBy: string;
  products: Product[];
  payments: Payment[];
  orderTax: number;
  discount: number;
  shipping: number;
}

const COMPANY = {
  name: 'DGT',
  address: '2077 Chicago Avenue Orosi, CA 93647',
  email: 'admin@example.com',
  phone: '+1 893 174 0385',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function mapStatus(apiStatus: string): 'Completed' | 'Pending' | 'Ordered' {
  const s = (apiStatus || '').toLowerCase();
  if (s === 'completed' || s === 'received') return 'Completed';
  if (s === 'ordered') return 'Ordered';
  return 'Pending';
}

function mapPaymentStatus(paymentMethod: string | null, totalAmount: number): 'Paid' | 'Partial' | 'Unpaid' | 'Overdue' {
  if (!paymentMethod || paymentMethod === '') return 'Unpaid';
  if (paymentMethod === 'partial') return 'Partial';
  return 'Paid';
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
      return () => clearTimeout(t);
    }
  }, [toast.show]);

  useEffect(() => {
    const loadSales = async () => {
      try {
        setLoading(true);
        const res = await TransactionsAPI.getAll();
        const transactions: any[] = res.data || [];
        const filtered = transactions.filter((t: any) => t.transactionType === 'sell');
        setSales(
          filtered.map((t: any, i: number) => {
            const customerName = t.user?.username || t.user?.name || 'Customer';
            const paid = t.paymentMethod && t.paymentMethod !== '' ? t.totalAmount : 0;
            const due = t.totalAmount - paid;
            return {
              id: String(t.id ?? i),
              date: formatDate(t.transactionDate),
              reference: t.referenceNumber || `SL${String(i + 1).padStart(4, '0')}`,
              customer: {
                name: customerName,
                initials: getInitials(customerName),
                email: t.user?.email || '',
                phone: '',
                address: '',
              },
              company: { ...COMPANY },
              warehouse: t.warehouse || 'Warehouse 1',
              supplier: t.supplier || 'N/A',
              status: mapStatus(t.status),
              grandTotal: t.totalAmount || 0,
              paid,
              due,
              paymentStatus: mapPaymentStatus(t.paymentMethod, t.totalAmount),
              createdBy: t.user?.username || 'Admin',
              products: (t.items || []).map((item: any) => ({
                name: item.product?.name || item.name || 'Product',
                icon: '📦',
                qty: item.quantity || item.qty || 1,
                purchasePrice: item.unitPrice || item.purchasePrice || 0,
                discount: item.discount || 0,
                tax: item.tax || 0,
                taxAmount: item.taxAmount || 0,
                unitCost: item.unitCost || 0,
                totalCost: item.totalPrice || item.totalCost || 0,
              })),
              payments: t.paymentMethod
                ? [
                    {
                      date: formatDate(t.transactionDate),
                      reference: `INV/${t.referenceNumber || ''}`,
                      amount: paid,
                      paidBy: t.paymentMethod || 'Cash',
                    },
                  ]
                : [],
              orderTax: t.orderTax || 0,
              discount: t.discount || 0,
              shipping: t.shipping || 0,
            } as Sale;
          })
        );
      } catch {
        showToast('Failed to load sales', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadSales();
  }, []);

  const getAvatarColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'];
    return colors[index % colors.length];
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      Completed: 'bg-green-100 text-green-800',
      Pending: 'bg-blue-100 text-blue-800',
      Ordered: 'bg-yellow-100 text-yellow-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      Paid: 'bg-green-100 text-green-800',
      Partial: 'bg-orange-100 text-orange-800',
      Unpaid: 'bg-red-100 text-red-800',
      Overdue: 'bg-yellow-100 text-yellow-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleViewDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
    setShowActionsMenu(null);
  };

  const handleEditSale = (sale: Sale) => {
    setSelectedSale(sale);
    setShowEditModal(true);
    setShowActionsMenu(null);
  };

  const handleShowPayments = (sale: Sale) => {
    setSelectedSale(sale);
    setShowPaymentsModal(true);
    setShowActionsMenu(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[1060] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-slideDown ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 bg-green-500 p-6 rounded-lg">
          <h1 className="text-2xl font-bold text-white">Sales</h1>
          <p className="text-sm text-white mt-1">Manage Your Sales</p>
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
              <button className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200">
                <RotateCw className="w-5 h-5 text-gray-600" />
              </button>
              <select className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-40">
                <option>Customer</option>
              </select>
              <select className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-40">
                <option>Status</option>
              </select>
              <select className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-40">
                <option>Payment Status</option>
              </select>
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                <span className="text-sm">Sort By : Last 7 Days</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Sales
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-blue-400 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Reference</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Grand Total</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Paid</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Due</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Payment Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Biller</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">No sales found</td>
                  </tr>
                ) : (
                  sales.map((sale, index) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getAvatarColor(index)}`}>
                            {sale.customer.initials}
                          </div>
                          <span className="text-sm text-gray-900">{sale.customer.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{sale.reference}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{sale.date}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(sale.status)}`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(sale.grandTotal)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{formatCurrency(sale.paid)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{formatCurrency(sale.due)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadge(sale.paymentStatus)}`}>
                          • {sale.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{sale.createdBy}</span>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button
                          onClick={() => setShowActionsMenu(showActionsMenu === sale.id ? null : sale.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                        {showActionsMenu === sale.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <button
                              onClick={() => handleViewDetail(sale)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Sale Detail
                            </button>
                            <button
                              onClick={() => handleEditSale(sale)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Sale
                            </button>
                            <button
                              onClick={() => handleShowPayments(sale)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <DollarSign className="w-4 h-4" />
                              Show Payments
                            </button>
                            <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              Create Payment
                            </button>
                            <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Download pdf
                            </button>
                            <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600">
                              <Trash2 className="w-4 h-4" />
                              Delete Sale
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Sales Modal */}
      {showAddModal && (
        <GlobalModal
          onClose={() => setShowAddModal(false)}
          title="Add Sales"
          icon={<Plus className="w-5 h-5" />}
          size="xl"
          submitLabel="Submit"
        >
          <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden dark:border-[#2A2A2A]">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-[#1E1E1E]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Product</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Qty</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Purchase Price(₹)</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Discount(₹)</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Tax(%)</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Tax Amount(₹)</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Unit Cost(₹)</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Total Cost(%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No products added</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Customer Name <span className="text-red-500">*</span></label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg">
                    <option>Carl Evans</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date <span className="text-red-500">*</span></label>
                  <input type="date" defaultValue="2023-01-19" className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supplier <span className="text-red-500">*</span></label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg">
                    <option>Apex Computers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Please type product code and select" className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Order Tax <span className="text-red-500">*</span></label>
                  <input type="number" defaultValue="0" className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Discount <span className="text-red-500">*</span></label>
                  <input type="number" defaultValue="0" className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shipping <span className="text-red-500">*</span></label>
                  <input type="number" defaultValue="0" className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status <span className="text-red-500">*</span></label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg">
                    <option>Completed</option>
                    <option>Pending</option>
                  </select>
                </div>
              </div>
              <div className="border-t dark:border-[#2A2A2A] pt-4 space-y-2">
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Order Tax</span><span className="font-medium">{formatCurrency(0)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Discount</span><span className="font-medium">{formatCurrency(0)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Shipping</span><span className="font-medium">{formatCurrency(0)}</span></div>
                <div className="flex justify-between text-lg font-semibold"><span>Grand Total</span><span>{formatCurrency(5200)}</span></div>
              </div>
              </div>
        </GlobalModal>
      )}

      {/* Sale Detail Modal */}
      {showDetailModal && selectedSale && (
        <GlobalModal
          onClose={() => setShowDetailModal(false)}
          title="Sales Detail"
          icon={<Eye className="w-5 h-5" />}
          size="xl"
          hideFooter
        >
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Customer Info</h3>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{selectedSale.customer.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedSale.customer.address}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email{selectedSale.customer.email}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone{selectedSale.customer.phone}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Company Info</h3>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{selectedSale.company.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedSale.company.address}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email{selectedSale.company.email}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone{selectedSale.company.phone}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Invoice Info</h3>
                  <p className="text-sm"><span className="text-gray-600 dark:text-gray-400">Reference:</span> <span className="text-orange-500">#{selectedSale.reference}</span></p>
                  <p className="text-sm"><span className="text-gray-600 dark:text-gray-400">Reference:</span> {selectedSale.date}</p>
                  <p className="text-sm"><span className="text-gray-600 dark:text-gray-400">Status:</span> <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(selectedSale.status)}`}>{selectedSale.status}</span></p>
                  <p className="text-sm"><span className="text-gray-600 dark:text-gray-400">Payment Status:</span> <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getPaymentStatusBadge(selectedSale.paymentStatus)}`}>• {selectedSale.paymentStatus}</span></p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Order Summary</h3>
                <div className="border rounded-lg overflow-hidden dark:border-[#2A2A2A]">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-[#1E1E1E]">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Product</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Purchase Price(₹)</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Discount(₹)</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Tax(%)</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Tax Amount(₹)</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Unit Cost(₹)</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Total Cost(%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedSale.products.map((product, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 flex items-center gap-2">
                            <span className="text-xl">{product.icon}</span>
                            <span>{product.name}</span>
                          </td>
                          <td className="px-4 py-3">{product.purchasePrice}</td>
                          <td className="px-4 py-3">{product.discount}</td>
                          <td className="px-4 py-3">{product.tax.toFixed(2)}</td>
                          <td className="px-4 py-3">{product.taxAmount.toFixed(2)}</td>
                          <td className="px-4 py-3">{product.unitCost.toFixed(2)}</td>
                          <td className="px-4 py-3">{product.totalCost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Order Tax</span><span>{formatCurrency(selectedSale.orderTax)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Discount</span><span>{formatCurrency(selectedSale.discount)}</span></div>
                    <div className="flex justify-between text-lg font-semibold"><span>Grand Total</span><span>{formatCurrency(selectedSale.grandTotal)}</span></div>
                    <div className="flex justify-between text-lg font-semibold"><span>Paid</span><span>{formatCurrency(selectedSale.paid)}</span></div>
                    <div className="flex justify-between text-lg font-semibold"><span>Due</span><span>{formatCurrency(selectedSale.due)}</span></div>
                  </div>
                </div>
              </div>
        </GlobalModal>
      )}

      {/* Edit Sale Modal */}
      {showEditModal && selectedSale && (
        <GlobalModal
          onClose={() => setShowEditModal(false)}
          title="Edit Sales"
          icon={<Edit className="w-5 h-5" />}
          size="xl"
          submitLabel="Submit"
        >
          <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden dark:border-[#2A2A2A]">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-[#1E1E1E]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Product</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Qty</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Purchase Price(₹)</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Discount(₹)</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Tax(%)</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Tax Amount(₹)</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Unit Cost(₹)</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Total Cost(%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedSale.products.map((product, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 flex items-center gap-2">
                          <span className="text-xl">{product.icon}</span>
                          <span>{product.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button className="p-1 border rounded dark:border-[#2A2A2A]"><Plus className="w-3 h-3" /></button>
                            <span>{product.qty}</span>
                            <button className="p-1 border rounded dark:border-[#2A2A2A]"><Minus className="w-3 h-3" /></button>
                          </div>
                        </td>
                        <td className="px-4 py-3">{product.purchasePrice}</td>
                        <td className="px-4 py-3">{product.discount}</td>
                        <td className="px-4 py-3">{product.tax.toFixed(2)}</td>
                        <td className="px-4 py-3">{product.taxAmount.toFixed(2)}</td>
                        <td className="px-4 py-3">{product.unitCost.toFixed(2)}</td>
                        <td className="px-4 py-3">{product.totalCost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Customer Name <span className="text-red-500">*</span></label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg" defaultValue={selectedSale.customer.name}>
                    <option>{selectedSale.customer.name}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date <span className="text-red-500">*</span></label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supplier <span className="text-red-500">*</span></label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg" defaultValue={selectedSale.supplier}>
                    <option>{selectedSale.supplier}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Please type product code and select" className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Order Tax <span className="text-red-500">*</span></label>
                  <input type="number" defaultValue={selectedSale.orderTax} className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Discount <span className="text-red-500">*</span></label>
                  <input type="number" defaultValue={selectedSale.discount} className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shipping <span className="text-red-500">*</span></label>
                  <input type="number" defaultValue={selectedSale.shipping} className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status <span className="text-red-500">*</span></label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg" defaultValue={selectedSale.status}>
                    <option>Completed</option>
                    <option>Pending</option>
                    <option>Ordered</option>
                  </select>
                </div>
              </div>
              <div className="border-t dark:border-[#2A2A2A] pt-4 space-y-2">
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Order Tax</span><span className="font-medium">{formatCurrency(selectedSale.orderTax)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Discount</span><span className="font-medium">{formatCurrency(selectedSale.discount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Shipping</span><span className="font-medium">{formatCurrency(selectedSale.shipping)}</span></div>
                <div className="flex justify-between text-lg font-semibold"><span>Grand Total</span><span>{formatCurrency(selectedSale.grandTotal)}</span></div>
              </div>
              </div>
        </GlobalModal>
      )}

      {/* Show Payments Modal */}
      {showPaymentsModal && selectedSale && (
        <GlobalModal
          onClose={() => setShowPaymentsModal(false)}
          title="Show Payments"
          icon={<DollarSign className="w-5 h-5" />}
          size="lg"
          hideFooter
        >
              <div className="border rounded-lg overflow-hidden dark:border-[#2A2A2A]">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-[#1E1E1E]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Reference</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Paid By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedSale.payments.length > 0 ? (
                      selectedSale.payments.map((payment, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3">{payment.date}</td>
                          <td className="px-4 py-3">{payment.reference}</td>
                          <td className="px-4 py-3">{formatCurrency(payment.amount)}</td>
                          <td className="px-4 py-3">{payment.paidBy}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No payments recorded</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
        </GlobalModal>
      )}
    </div>
  );
}
