'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';
import { POSAPI } from '@/lib/api';
import GlobalModal from '@/components/ui/GlobalModal';
import { Search, X, Clock, CheckCheck, AlertCircle, Eye, Receipt, RotateCw } from '@/components/ui/LucideIcon';

interface Session {
  id: number;
  sessionNumber: string;
  openedBy: number;
  openedByName: string;
  closedByName?: string;
  status: string;
  openingBalance: number;
  closingBalance: number;
  totalSales: number;
  totalRefunds: number;
  netAmount: number;
  openedAt: string;
  closedAt?: string;
  notes?: string;
}

interface Transaction {
  id: number;
  sessionId: number;
  receiptNumber: string;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod: string;
  status: string;
  customerName?: string;
  createdAt: string;
}

export default function POSSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [transLoading, setTransLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await POSAPI.getSessions();
      setSessions(res.data || []);
    } catch {
      showToast('Failed to load sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const viewTransactions = async (session: Session) => {
    setSelectedSession(session);
    setShowTransactions(true);
    setTransLoading(true);
    try {
      const res = await POSAPI.getTransactions(String(session.id));
      setTransactions(res.data || []);
    } catch {
      showToast('Failed to load transactions', 'error');
    } finally {
      setTransLoading(false);
    }
  };

  const closeSession = async (id: number) => {
    try {
      await POSAPI.closeSession(String(id), 0);
      showToast('Session closed successfully', 'success');
      loadSessions();
    } catch {
      showToast('Failed to close session', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-emerald-100 text-emerald-800',
      CLOSED: 'bg-gray-100 text-gray-800',
      PAUSED: 'bg-amber-100 text-amber-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredSessions = sessions.filter(s =>
    !searchQuery || s.sessionNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-2 opacity-50 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto">
        <div className="mb-6 bg-gradient-to-r from-emerald-500 to-emerald-700 p-6 rounded-xl">
          <h1 className="text-2xl font-bold text-white">POS Sessions</h1>
          <p className="text-sm text-emerald-100 mt-1">Manage and view all POS sessions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text" placeholder="Search sessions..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button onClick={loadSessions} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-14 w-full rounded-lg" />)}
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Session #</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Opened By</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Opened At</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Closed At</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Opening</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Closing</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Sales</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                      <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium">No sessions found</p>
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map(session => (
                    <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{session.sessionNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{session.openedByName || 'Unknown'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{new Date(session.openedAt).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{session.closedAt ? new Date(session.closedAt).toLocaleString() : '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(session.openingBalance)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(session.closingBalance)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-emerald-600">{formatCurrency(session.totalSales)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(session.status)}`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => viewTransactions(session)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="View Transactions">
                            <Eye className="w-4 h-4" />
                          </button>
                          {session.status === 'OPEN' && (
                            <button onClick={() => closeSession(session.id)}
                              className="px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors">
                              Close
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Transactions Modal */}
      {showTransactions && selectedSession && (
        <GlobalModal
          onClose={() => setShowTransactions(false)}
          title="Session Transactions"
          subtitle={selectedSession.sessionNumber}
          icon={<Receipt className="w-5 h-5" />}
          size="xl"
          hideFooter
        >
          {transLoading ? (
            <div className="p-8 text-center text-gray-400 dark:text-gray-500">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-gray-500">
              <p className="text-sm font-medium">No transactions in this session</p>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-[#1A2232]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Receipt</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Product</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Qty</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Unit Price</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Total</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Payment</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-[#111827]">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-[#1F2937]/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-[#F8FAFC]">{tx.receiptNumber}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{tx.productName}</td>
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-[#F8FAFC]">{tx.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-[#F8FAFC]">{formatCurrency(tx.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-[#F8FAFC]">{formatCurrency(tx.totalPrice)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{tx.paymentMethod}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        tx.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300' :
                        tx.status === 'REFUNDED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>{tx.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </GlobalModal>
      )}
    </div>
  );
}
