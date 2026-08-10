'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Sheet, RotateCw, Plus, X, CheckCircle2, AlertTriangle, Trash2 } from '@/components/ui/LucideIcon';
import { formatCurrency } from '@/lib/currency';
import { SalesOrdersAPI, ProductsAPI } from '@/lib/api';
import GlobalModal from '@/components/ui/GlobalModal';

interface SalesOrderItem {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveredQuantity: number;
}

interface SalesOrder {
  id: number;
  soNumber: string;
  customerId: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  notes: string;
  orderDate: string;
  createdAt: string;
  createdBy: number | null;
  items: SalesOrderItem[];
}

const STATUS_FLOW: Record<string, string> = {
  QUOTATION: 'QUOTATION',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

const STATUS_COLORS: Record<string, string> = {
  QUOTATION: 'bg-gray-100 text-gray-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-yellow-100 text-yellow-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800',
  PARTIAL: 'bg-orange-100 text-orange-800',
  UNPAID: 'bg-red-100 text-red-800',
};

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function SalesOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('Last 7 Days');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newOrder, setNewOrder] = useState<Partial<SalesOrder>>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 0,
    status: 'QUOTATION',
    paymentStatus: 'UNPAID',
    paymentMethod: '',
    notes: '',
    orderDate: new Date().toISOString().split('T')[0],
  });
  const [newItems, setNewItems] = useState<SalesOrderItem[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [productResults, setProductResults] = useState<any[]>([]);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await SalesOrdersAPI.getAll();
      setOrders(res.data || []);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this sales order?')) return;
    try {
      await SalesOrdersAPI.delete(String(id));
      showToast('Sales order deleted', 'success');
      loadOrders();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete', 'error');
    }
  };

  useEffect(() => {
    if (!searchProduct.trim()) { setProductResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await ProductsAPI.getAll();
        const all = res.data || [];
        setProductResults(all.filter((p: any) =>
          p.name?.toLowerCase().includes(searchProduct.toLowerCase())
        ));
      } catch { setProductResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchProduct]);

  const addProductToOrder = (product: any) => {
    const exists = newItems.find(i => i.productId === product.id);
    if (exists) {
      setNewItems(newItems.map(i =>
        i.productId === product.id ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice } : i
      ));
    } else {
      setNewItems([...newItems, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price || 0,
        totalPrice: product.price || 0,
        deliveredQuantity: 0,
      }]);
    }
    setSearchProduct('');
    setProductResults([]);
  };

  const updateItemQty = (productId: number, qty: number) => {
    if (qty < 1) return;
    setNewItems(newItems.map(i =>
      i.productId === productId ? { ...i, quantity: qty, totalPrice: qty * i.unitPrice } : i
    ));
  };

  const removeItem = (productId: number) => {
    setNewItems(newItems.filter(i => i.productId !== productId));
  };

  const recalcTotals = () => {
    const subtotal = newItems.reduce((s, i) => s + i.totalPrice, 0);
    const totalAmount = subtotal + (newOrder.taxAmount || 0) - (newOrder.discountAmount || 0);
    return { subtotal, totalAmount };
  };

  const handleCreate = async () => {
    try {
      const { subtotal, totalAmount } = recalcTotals();
      const payload = {
        ...newOrder,
        subtotal,
        totalAmount,
        orderDate: newOrder.orderDate ? new Date(newOrder.orderDate).toISOString() : new Date().toISOString(),
        items: newItems,
      };
      await SalesOrdersAPI.create(payload);
      showToast('Sales order created successfully', 'success');
      setShowNewModal(false);
      setNewOrder({
        customerName: '', customerEmail: '', customerPhone: '', customerAddress: '',
        subtotal: 0, taxAmount: 0, discountAmount: 0, totalAmount: 0,
        status: 'QUOTATION', paymentStatus: 'UNPAID', paymentMethod: '', notes: '',
        orderDate: new Date().toISOString().split('T')[0],
      });
      setNewItems([]);
      loadOrders();
    } catch (err: any) {
      showToast(err?.message || 'Failed to create order', 'error');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchSearch = o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.soNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchPayment = !paymentFilter || o.paymentStatus === paymentFilter;
    return matchSearch && matchStatus && matchPayment;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[1060] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-slideDown ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-2 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 bg-blue-600 p-6 rounded-lg">
          <h1 className="text-2xl font-bold text-white">Sales Orders</h1>
          <p className="text-sm text-white mt-1">Manage your sales orders</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by customer or SO#"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex gap-2 items-center">
              <button className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200"><FileText className="w-5 h-5 text-red-500" /></button>
              <button className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200"><Sheet className="w-5 h-5 text-green-600" /></button>
              <button onClick={loadOrders} className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200"><RotateCw className="w-5 h-5 text-gray-600" /></button>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">All Status</option>
                <option value="QUOTATION">Quotation</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Payment</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="UNPAID">Unpaid</option>
              </select>
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
              </select>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 font-medium"
              >
                <Plus className="w-4 h-4" /> New SO
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">SO#</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Total</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Payment</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No sales orders found.</td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/sales/orders/${order.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-orange-600">{order.soNumber}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{order.customerName || '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${PAYMENT_STATUS_COLORS[order.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
                            {order.paymentStatus || 'UNPAID'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{formatDate(order.createdAt || order.orderDate)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={(e) => handleDelete(order.id, e)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showNewModal && (
        <GlobalModal
          onClose={() => setShowNewModal(false)}
          title="New Sales Order"
          icon={<Plus className="w-5 h-5" />}
          size="xl"
          submitLabel="Create Order"
          onSubmit={handleCreate}
        >
          <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Add Products</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search product..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                  />
                </div>
                {productResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto dark:bg-[#1E1E1E] dark:border-[#2A2A2A]">
                    {productResults.map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => addProductToOrder(p)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex justify-between dark:hover:bg-[#232323]"
                      >
                        <span>{p.name}</span>
                        <span className="text-gray-500 dark:text-gray-400">{formatCurrency(p.price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {newItems.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-[#1E1E1E]">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Product</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Qty</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Unit Price</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Total</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {newItems.map((item) => (
                        <tr key={item.productId}>
                          <td className="px-4 py-3 text-gray-900 dark:text-[#F8FAFC]">{item.productName}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateItemQty(item.productId, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center border rounded hover:bg-gray-100 dark:border-[#2A2A2A] dark:hover:bg-[#232323]">-</button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <button onClick={() => updateItemQty(item.productId, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center border rounded hover:bg-gray-100 dark:border-[#2A2A2A] dark:hover:bg-[#232323]">+</button>
                            </div>
                          </td>
                          <td className="px-4 py-3">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-3">{formatCurrency(item.totalPrice)}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => removeItem(item.productId)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Customer Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newOrder.customerName || ''}
                    onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    value={newOrder.customerEmail || ''}
                    onChange={(e) => setNewOrder({ ...newOrder, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Phone</label>
                  <input
                    type="text"
                    value={newOrder.customerPhone || ''}
                    onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Address</label>
                <textarea
                  value={newOrder.customerAddress || ''}
                  onChange={(e) => setNewOrder({ ...newOrder, customerAddress: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Order Date</label>
                  <input
                    type="date"
                    value={newOrder.orderDate || ''}
                    onChange={(e) => setNewOrder({ ...newOrder, orderDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Payment Method</label>
                  <select
                    value={newOrder.paymentMethod || ''}
                    onChange={(e) => setNewOrder({ ...newOrder, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                  >
                    <option value="">Select</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Payment Status</label>
                  <select
                    value={newOrder.paymentStatus || 'UNPAID'}
                    onChange={(e) => setNewOrder({ ...newOrder, paymentStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                  >
                    <option value="UNPAID">Unpaid</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Tax Amount</label>
                  <input
                    type="number"
                    value={newOrder.taxAmount || 0}
                    onChange={(e) => setNewOrder({ ...newOrder, taxAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Discount Amount</label>
                  <input
                    type="number"
                    value={newOrder.discountAmount || 0}
                    onChange={(e) => setNewOrder({ ...newOrder, discountAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Status</label>
                  <select
                    value={newOrder.status || 'QUOTATION'}
                    onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                  >
                    <option value="QUOTATION">Quotation</option>
                    <option value="CONFIRMED">Confirmed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Notes</label>
                <textarea
                  value={newOrder.notes || ''}
                  onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-[#1E1E1E] dark:border-[#2A2A2A] dark:text-[#F8FAFC]"
                />
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Subtotal</span><span className="font-medium">{formatCurrency(recalcTotals().subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Tax</span><span className="font-medium">{formatCurrency(newOrder.taxAmount)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Discount</span><span className="font-medium">{formatCurrency(-(newOrder.discountAmount || 0))}</span></div>
                <div className="flex justify-between text-lg font-semibold"><span>Total</span><span>{formatCurrency(recalcTotals().totalAmount)}</span></div>
              </div>
          </div>
        </GlobalModal>
      )}
    </div>
  );
}
