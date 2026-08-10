'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { X, CheckCircle2, AlertTriangle, Printer, Download } from '@/components/ui/LucideIcon';
import { formatCurrency } from '@/lib/currency';
import { InvoicesAPI } from '@/lib/api';
import InvoicePrintStyles from '@/components/invoice/InvoicePrintStyles';

interface InvoiceItem {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  salesOrderId: number | null;
  transactionId: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  notes: string;
  invoiceDate: string;
  dueDate: string;
  createdAt: string;
  createdBy: number | null;
  items: InvoiceItem[];
}

const STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800',
  UNPAID: 'bg-red-100 text-red-800',
  PARTIAL: 'bg-orange-100 text-orange-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  REFUNDED: 'bg-purple-100 text-purple-800',
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

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    loadInvoice();
  }, [params.id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await InvoicesAPI.getById(params.id as string);
      setInvoice(data);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load invoice', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      await InvoicesAPI.updateStatus(String(invoice!.id), status);
      showToast(`Status updated to ${status}`, 'success');
      loadInvoice();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update status', 'error');
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

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-red-500">Invoice not found.</p>
            <button onClick={() => router.push('/sales/invoices')} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg">Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <InvoicePrintStyles />
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[1060] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-slideDown ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-2 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto">
        <div className="no-print flex justify-between items-center mb-6">
          <div>
            <button onClick={() => router.push('/sales/invoices')} className="text-sm text-orange-600 hover:text-orange-700 mb-2 block">&larr; Back to Invoices</button>
            <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoiceNumber}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print Invoice
            </button>
            <button onClick={handlePrint} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>

        <div className="invoice-print bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">INVOICE</h2>
              <p className="text-sm text-gray-500">#{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-bold text-gray-900">Your Company</h3>
              <p className="text-sm text-gray-600">123 Business Ave, Suite 100</p>
              <p className="text-sm text-gray-600">City, State ZIP</p>
              <p className="text-sm text-gray-600">Phone: (555) 123-4567</p>
              <p className="text-sm text-gray-600">Email: company@example.com</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2">Bill To</h4>
              <p className="font-semibold text-gray-900">{invoice.customerName || 'N/A'}</p>
              {invoice.customerAddress && <p className="text-sm text-gray-600">{invoice.customerAddress}</p>}
              {invoice.customerEmail && <p className="text-sm text-gray-600">Email: {invoice.customerEmail}</p>}
              {invoice.customerPhone && <p className="text-sm text-gray-600">Phone: {invoice.customerPhone}</p>}
            </div>
            <div className="text-right">
              <div className="space-y-1">
                <p className="text-sm"><span className="text-gray-600">Invoice Date:</span> <span className="font-medium">{formatDate(invoice.invoiceDate)}</span></p>
                <p className="text-sm"><span className="text-gray-600">Due Date:</span> <span className="font-medium">{invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}</span></p>
                <p className="text-sm"><span className="text-gray-600">Status:</span>
                  <span className={`ml-2 inline-flex px-3 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[invoice.status] || 'bg-gray-100 text-gray-800'}`}>
                    {invoice.status}
                  </span>
                </p>
                {invoice.paymentMethod && (
                  <p className="text-sm"><span className="text-gray-600">Payment:</span> <span className="font-medium">{invoice.paymentMethod}</span></p>
                )}
              </div>
            </div>
          </div>

          <table className="min-w-full text-sm mb-6">
            <thead>
              <tr className="border-t border-b border-gray-300">
                <th className="py-3 text-left font-semibold text-gray-700">#</th>
                <th className="py-3 text-left font-semibold text-gray-700">Item</th>
                <th className="py-3 text-center font-semibold text-gray-700">Quantity</th>
                <th className="py-3 text-right font-semibold text-gray-700">Unit Price</th>
                <th className="py-3 text-right font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(!invoice.items || invoice.items.length === 0) ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">No items</td>
                </tr>
              ) : (
                invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3 text-gray-600">{idx + 1}</td>
                    <td className="py-3 text-gray-900">{item.productName || `Product #${item.productId}`}</td>
                    <td className="py-3 text-center text-gray-900">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-900">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span>{formatCurrency(invoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span>{formatCurrency(-(invoice.discountAmount || 0))}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Notes</h4>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}
        </div>

        <div className="no-print bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Update Status</h3>
          <div className="flex gap-2 flex-wrap">
            {invoice.status !== 'PAID' && (
              <button onClick={() => handleStatusUpdate('PAID')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">Mark Paid</button>
            )}
            {invoice.status !== 'PARTIAL' && (
              <button onClick={() => handleStatusUpdate('PARTIAL')} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm">Mark Partial</button>
            )}
            {invoice.status !== 'CANCELLED' && (
              <button onClick={() => handleStatusUpdate('CANCELLED')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">Cancel</button>
            )}
            {invoice.status !== 'REFUNDED' && (
              <button onClick={() => handleStatusUpdate('REFUNDED')} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">Refund</button>
            )}
          </div>
        </div>

        <div className="no-print bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Invoice Timeline</h3>
          <p className="text-sm text-gray-600">Created: {formatDateTime(invoice.createdAt)}</p>
          {invoice.salesOrderId && (
            <p className="text-sm text-gray-600">Generated from Sales Order ID: {invoice.salesOrderId}</p>
          )}
        </div>
      </div>
    </div>
  );
}
