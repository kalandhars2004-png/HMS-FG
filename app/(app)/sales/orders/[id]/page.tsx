'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileText, X, CheckCircle2, AlertTriangle, Printer } from '@/components/ui/LucideIcon';
import { formatCurrency } from '@/lib/currency';
import { SalesOrdersAPI } from '@/lib/api';

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

const STATUS_NEXT: Record<string, string> = {
  QUOTATION: 'CONFIRMED',
  CONFIRMED: 'PROCESSING',
  PROCESSING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function SalesOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await SalesOrdersAPI.getById(params.id as string);
      setOrder(data);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      await SalesOrdersAPI.updateStatus(String(order!.id), status);
      showToast(`Order ${status}`, 'success');
      loadOrder();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update status', 'error');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this order? This may revert inventory changes.')) return;
    await handleStatusUpdate('CANCELLED');
  };

  const handlePaymentUpdate = async (paymentStatus: string) => {
    try {
      await SalesOrdersAPI.updatePayment(String(order!.id), paymentStatus);
      showToast(`Payment status updated to ${paymentStatus}`, 'success');
      loadOrder();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update payment', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-red-500">Order not found.</p>
            <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg">Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  const canProgress = !!STATUS_NEXT[order.status];
  const canCancel = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';

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
        <div className="flex justify-between items-center mb-6">
          <div>
            <button onClick={() => router.push('/sales/orders')} className="text-sm text-orange-600 hover:text-orange-700 mb-2 block">&larr; Back to Sales Orders</button>
            <h1 className="text-2xl font-bold text-gray-900">Sales Order {order.soNumber}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Invoice
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Customer Info</h3>
            <h4 className="font-semibold text-gray-900">{order.customerName || 'N/A'}</h4>
            {order.customerEmail && <p className="text-sm text-gray-600">Email: {order.customerEmail}</p>}
            {order.customerPhone && <p className="text-sm text-gray-600">Phone: {order.customerPhone}</p>}
            {order.customerAddress && <p className="text-sm text-gray-600">Address: {order.customerAddress}</p>}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Order Info</h3>
            <p className="text-sm"><span className="text-gray-600">SO#: </span><span className="text-orange-500 font-medium">{order.soNumber}</span></p>
            <p className="text-sm"><span className="text-gray-600">Date: </span>{formatDate(order.orderDate)}</p>
            <p className="text-sm"><span className="text-gray-600">Created: </span>{formatDateTime(order.createdAt)}</p>
            <p className="text-sm"><span className="text-gray-600">Payment: </span>{order.paymentMethod || 'N/A'}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Status</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600">Order:</span>
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                {order.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Payment:</span>
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${PAYMENT_STATUS_COLORS[order.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
                {order.paymentStatus || 'UNPAID'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Update Order Status</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canProgress && (
              <button
                onClick={() => handleStatusUpdate(STATUS_NEXT[order.status])}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Mark as {STATUS_NEXT[order.status]}
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Cancel Order
              </button>
            )}
            <div className="ml-auto">
              <label className="text-sm text-gray-600 mr-2">Payment:</label>
              <select
                value={order.paymentStatus || 'UNPAID'}
                onChange={(e) => handlePaymentUpdate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Order Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Product</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Qty</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Unit Price</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Total</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Delivered Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(!order.items || order.items.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No items</td>
                  </tr>
                ) : (
                  order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">{item.productName || `Product #${item.productId}`}</td>
                      <td className="px-6 py-4">{item.quantity}</td>
                      <td className="px-6 py-4">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-6 py-4 font-medium">{formatCurrency(item.totalPrice)}</td>
                      <td className="px-6 py-4">{item.deliveredQuantity ?? 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span>{formatCurrency(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span>{formatCurrency(-(order.discountAmount || 0))}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
