'use client';

import { useState } from 'react';
import { Search, Eye, Edit, Trash2, FileText, Sheet, RotateCw, Plus } from '@/components/ui/LucideIcon';
import GlobalModal from '@/components/ui/GlobalModal';

export default function QuotationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  const quotations = [
    { id: 'QT001', customer: { name: 'Carl Evans', initials: 'CE' }, date: '06 Dec 2025', reference: 'admin', grandTotal: 1000, status: 'Sent' },
    { id: 'QT002', customer: { name: 'Minerva Rameriz', initials: 'MR' }, date: '05 Dec 2025', reference: 'admin', grandTotal: 1500, status: 'Pending' },
    { id: 'QT003', customer: { name: 'Robert Lamon', initials: 'RL' }, date: '04 Dec 2025', reference: 'admin', grandTotal: 2000, status: 'Sent' },
  ];

  const getAvatarColor = (index: number) => ['bg-blue-500', 'bg-pink-500', 'bg-indigo-500'][index % 3];
  const getStatusBg = (status: string) => status === 'Sent' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 bg-green-500 p-6 rounded-lg">
          <h1 className="text-2xl font-bold text-white">Quotation</h1>
          <p className="text-sm text-white mt-1">Manage your quotations</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200"><FileText className="w-5 h-5 text-red-500" /></button>
              <button className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200"><Sheet className="w-5 h-5 text-green-600" /></button>
              <button className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200"><RotateCw className="w-5 h-5 text-gray-600" /></button>
              <select className="px-3 py-2 border border-gray-200 rounded-lg w-40"><option>Customer</option></select>
              <select className="px-3 py-2 border border-gray-200 rounded-lg w-40"><option>Status</option></select>
              <select className="px-3 py-2 border border-gray-200 rounded-lg"><option>Sort By : Last 7 Days</option></select>
              <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">+ Add Quotation</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-blue-400 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Quotation No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Reference</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Grand Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotations.map((quote, index) => (
                <tr key={quote.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><span className="text-sm font-medium">{quote.id}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getAvatarColor(index)}`}>{quote.customer.initials}</div>
                      <span className="text-sm">{quote.customer.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-gray-600">{quote.date}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-gray-600">{quote.reference}</span></td>
                  <td className="px-6 py-4"><span className="text-sm font-medium">${quote.grandTotal}</span></td>
                  <td className="px-6 py-4"><span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBg(quote.status)}`}>{quote.status}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg"><Eye className="w-4 h-4" /></button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4" /></button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <GlobalModal
          onClose={() => setShowModal(false)}
          title="Add Quotation"
          icon={<Plus className="w-5 h-5" />}
          size="xl"
          cancelLabel="Cancel"
          submitLabel="Submit"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Customer Name <span className="text-red-500">*</span></label><select className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] dark:text-[#F8FAFC] rounded-lg"><option>Carl Evans</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date <span className="text-red-500">*</span></label><input type="date" defaultValue="2025-12-06" className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] dark:text-[#F8FAFC] rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reference <span className="text-red-500">*</span></label><input type="text" defaultValue="admin" className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] dark:text-[#F8FAFC] rounded-lg" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product <span className="text-red-500">*</span></label><input type="text" placeholder="shi" className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] dark:text-[#F8FAFC] rounded-lg" /></div>
            <div className="border rounded-lg overflow-hidden dark:border-[#2A2A2A]">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#1A2232]">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Product</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Qty</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Purchase Price($)</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Discount($)</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Tax(%)</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Tax Amount($)</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Unit Cost($)</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Total Cost(%)</th>
                  </tr>
                </thead>
                <tbody><tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No products added</td></tr></tbody>
              </table>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Order Tax <span className="text-red-500">*</span></label><input type="number" defaultValue="0" className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] dark:text-[#F8FAFC] rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Discount <span className="text-red-500">*</span></label><input type="number" defaultValue="0" className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] dark:text-[#F8FAFC] rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shipping <span className="text-red-500">*</span></label><input type="number" defaultValue="0" className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] dark:text-[#F8FAFC] rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status <span className="text-red-500">*</span></label><select className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] dark:text-[#F8FAFC] rounded-lg"><option>Select</option></select></div>
            </div>
          </div>
        </GlobalModal>
      )}
    </div>
  );
}
