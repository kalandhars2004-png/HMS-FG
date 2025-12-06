'use client';

import { useState } from 'react';
import { Search, Eye, Edit, Trash2, FileText, Sheet, RotateCw, X, MoreVertical, DollarSign, CreditCard, Download } from 'lucide-react';

interface Invoice {
  id: string;
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
  dueDate: string;
  amount: number;
  paid: number;
  due: number;
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Partial';
  reference: string;
  date: string;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
}

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const invoices: Invoice[] = [
    {
      id: 'INV001',
      customer: {
        name: 'Carl Evans',
        initials: 'CE',
        email: 'carlevans241@example.com',
        phone: '+1 987 471 6589',
        address: '3103 Trainer Avenue Peoria, IL 61602',
      },
      company: {
        name: 'DGT',
        address: '2077 Chicago Avenue Orosi, CA 93647',
        email: 'admin@example.com',
        phone: '+1 893 174 0385',
      },
      dueDate: '24 Dec 2024',
      amount: 1000,
      paid: 1000,
      due: 0,
      status: 'Paid',
      reference: 'INV/2024/001',
      date: '17 Dec 2024',
      paymentStatus: 'Paid',
    },
    {
      id: 'INV002',
      customer: {
        name: 'Minerva Rameriz',
        initials: 'MR',
        email: 'minerva@example.com',
        phone: '+1 555 123 4567',
        address: '123 Main St, Los Angeles, CA 90001',
      },
      company: {
        name: 'DGT',
        address: '2077 Chicago Avenue Orosi, CA 93647',
        email: 'admin@example.com',
        phone: '+1 893 174 0385',
      },
      dueDate: '20 Dec 2024',
      amount: 1500,
      paid: 0,
      due: 1500,
      status: 'Unpaid',
      reference: 'INV/2024/002',
      date: '13 Dec 2024',
      paymentStatus: 'Unpaid',
    },
    {
      id: 'INV003',
      customer: {
        name: 'Robert Lamon',
        initials: 'RL',
        email: 'robert@example.com',
        phone: '+1 555 987 6543',
        address: '456 Oak Ave, San Francisco, CA 94102',
      },
      company: {
        name: 'DGT',
        address: '2077 Chicago Avenue Orosi, CA 93647',
        email: 'admin@example.com',
        phone: '+1 893 174 0385',
      },
      dueDate: '22 Dec 2024',
      amount: 1500,
      paid: 1500,
      due: 0,
      status: 'Paid',
      reference: 'INV/2024/003',
      date: '15 Dec 2024',
      paymentStatus: 'Paid',
    },
    {
      id: 'INV004',
      customer: {
        name: 'Patricia Lewis',
        initials: 'PL',
        email: 'patricia@example.com',
        phone: '+1 555 456 7890',
        address: '789 Pine St, Seattle, WA 98101',
      },
      company: {
        name: 'DGT',
        address: '2077 Chicago Avenue Orosi, CA 93647',
        email: 'admin@example.com',
        phone: '+1 893 174 0385',
      },
      dueDate: '18 Dec 2024',
      amount: 2000,
      paid: 1000,
      due: 1000,
      status: 'Partial',
      reference: 'INV/2024/004',
      date: '11 Dec 2024',
      paymentStatus: 'Partial',
    },
    {
      id: 'INV005',
      customer: {
        name: 'Mark Joslyn',
        initials: 'MJ',
        email: 'mark@example.com',
        phone: '+1 555 321 9876',
        address: '321 Elm St, Boston, MA 02101',
      },
      company: {
        name: 'DGT',
        address: '2077 Chicago Avenue Orosi, CA 93647',
        email: 'admin@example.com',
        phone: '+1 893 174 0385',
      },
      dueDate: '25 Dec 2024',
      amount: 800,
      paid: 800,
      due: 0,
      status: 'Paid',
      reference: 'INV/2024/005',
      date: '18 Dec 2024',
      paymentStatus: 'Paid',
    },
  ];

  const getAvatarColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-green-500'];
    return colors[index % colors.length];
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      Paid: 'bg-green-100 text-green-800',
      Unpaid: 'bg-red-100 text-red-800',
      Overdue: 'bg-yellow-100 text-yellow-800',
      Partial: 'bg-orange-100 text-orange-800',
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  const handleViewDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
    setShowActionsMenu(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 bg-green-500 p-6 rounded-lg">
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-sm text-white mt-1">Manage your invoices</p>
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
                <option>Paid</option>
                <option>Unpaid</option>
                <option>Partial</option>
              </select>
              <select className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option>Sort By : Last 7 Days</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-blue-400 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Invoice No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Due Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Paid</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Amount Due</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((invoice, index) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{invoice.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getAvatarColor(index)}`}>
                        {invoice.customer.initials}
                      </div>
                      <span className="text-sm text-gray-900">{invoice.customer.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{invoice.dueDate}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">${invoice.amount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">${invoice.paid}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${invoice.due > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      ${invoice.due}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(invoice.status)}`}>
                      • {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button
                      onClick={() => setShowActionsMenu(showActionsMenu === invoice.id ? null : invoice.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                    {showActionsMenu === invoice.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <button
                          onClick={() => handleViewDetail(invoice)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Invoice Detail
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          Edit Invoice
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Show Payments
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Create Payment
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          Download PDF
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600">
                          <Trash2 className="w-4 h-4" />
                          Delete Invoice
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {invoices.length} of {invoices.length} invoices
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

      {/* Invoice Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b bg-blue-600">
              <h2 className="text-xl font-semibold text-white">Invoice Detail</h2>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200">
                  <FileText className="w-5 h-5 text-red-500" />
                </button>
                <button className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200">
                  <Download className="w-5 h-5 text-gray-600" />
                </button>
                <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center gap-2">
                  ← Back to Invoices
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Customer Info</h3>
                  <h4 className="font-semibold text-gray-900">{selectedInvoice.customer.name}</h4>
                  <p className="text-sm text-gray-600">{selectedInvoice.customer.address}</p>
                  <p className="text-sm text-gray-600">Email: {selectedInvoice.customer.email}</p>
                  <p className="text-sm text-gray-600">Phone: {selectedInvoice.customer.phone}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Company Info</h3>
                  <h4 className="font-semibold text-gray-900">{selectedInvoice.company.name}</h4>
                  <p className="text-sm text-gray-600">{selectedInvoice.company.address}</p>
                  <p className="text-sm text-gray-600">Email: {selectedInvoice.company.email}</p>
                  <p className="text-sm text-gray-600">Phone: {selectedInvoice.company.phone}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Invoice Info</h3>
                  <p className="text-sm">
                    <span className="text-gray-600">Reference: </span>
                    <span className="text-orange-500 font-medium">#{selectedInvoice.reference}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Date: </span>
                    <span className="text-gray-900">{selectedInvoice.date}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Due Date: </span>
                    <span className="text-gray-900">{selectedInvoice.dueDate}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Status: </span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(selectedInvoice.status)}`}>
                      • {selectedInvoice.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
                <div className="flex justify-end">
                  <div className="w-80 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium text-gray-900">${selectedInvoice.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Paid:</span>
                      <span className="font-medium text-green-600">${selectedInvoice.paid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-3">
                      <span className="text-gray-900 font-semibold">Amount Due:</span>
                      <span className={`font-semibold ${selectedInvoice.due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${selectedInvoice.due.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
