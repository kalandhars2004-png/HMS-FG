'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, X, CheckCircle2, AlertTriangle, Trash2, RotateCw, Printer } from '@/components/ui/LucideIcon';
import { formatCurrency } from '@/lib/currency';
import { InvoicesAPI, SalesOrdersAPI } from '@/lib/api';
import GlobalModal from '@/components/ui/GlobalModal';

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

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('Last 7 Days');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showSOModal, setShowSOModal] = useState(false);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await InvoicesAPI.getAll();
      setInvoices(res.data || []);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await InvoicesAPI.delete(String(id));
      showToast('Invoice deleted', 'success');
      loadInvoices();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete', 'error');
    }
  };

  const openSOModal = async () => {
    try {
      const res = await SalesOrdersAPI.getAll();
      setSalesOrders(res.data || []);
      setShowSOModal(true);
    } catch {
      showToast('Failed to load sales orders', 'error');
    }
  };

  const handleGenerateFromSO = async (soId: number) => {
    try {
      await InvoicesAPI.generateFromSO(String(soId));
      showToast('Invoice generated from Sales Order', 'success');
      setShowSOModal(false);
      loadInvoices();
    } catch (err: any) {
      showToast(err?.message || 'Failed to generate invoice', 'error');
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = inv.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
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
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-sm text-white mt-1">Manage your invoices</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by invoice# or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={loadInvoices} className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200"><RotateCw className="w-5 h-5 text-gray-600" /></button>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">All Status</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
              </select>
              <button
                onClick={openSOModal}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
              >
                <Printer className="w-4 h-4" /> From SO
              </button>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 font-medium"
              >
                <Plus className="w-4 h-4" /> New Invoice
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Invoice#</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Due Date</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No invoices found.</td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/sales/invoices/${inv.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-orange-600">{inv.invoiceNumber}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{inv.customerName || '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(inv.totalAmount)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-800'}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{formatDate(inv.invoiceDate)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{inv.dueDate ? formatDate(inv.dueDate) : '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={(e) => handleDelete(inv.id, e)}
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

      {showSOModal && (
        <GlobalModal
          onClose={() => setShowSOModal(false)}
          title="Generate Invoice from Sales Order"
          icon={<Printer className="w-5 h-5" />}
          size="xl"
          hideFooter
        >
          {salesOrders.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No sales orders available.</p>
          ) : (
            <div className="space-y-2">
              {salesOrders.map((so: any) => (
                <div key={so.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-[#2A2A2A] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E1E1E]">
                  <div>
                    <span className="font-medium text-orange-600">{so.soNumber}</span>
                    <span className="ml-4 text-gray-600 dark:text-gray-300">{so.customerName || 'N/A'}</span>
                    <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">{formatCurrency(so.totalAmount)}</span>
                  </div>
                  <button
                    onClick={() => handleGenerateFromSO(so.id)}
                    className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
                  >
                    Generate
                  </button>
                </div>
              ))}
            </div>
          )}
        </GlobalModal>
      )}

      {showNewModal && (
        <GlobalModal
          onClose={() => setShowNewModal(false)}
          title="New Invoice"
          icon={<Plus className="w-5 h-5" />}
          size="sm"
          hideFooter
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Create a new invoice manually, or generate one from a Sales Order.</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowNewModal(false)} className="px-4 py-2 bg-gray-800 dark:bg-[#232323] text-white rounded-lg hover:bg-gray-900 dark:hover:bg-[#2A2A2A]">Cancel</button>
            <button onClick={() => { setShowNewModal(false); openSOModal(); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">From Sales Order</button>
          </div>
        </GlobalModal>
      )}
    </div>
  );
}
