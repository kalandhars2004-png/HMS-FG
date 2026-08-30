'use client';

import { useState } from 'react';
import { ClipboardList, Search, Plus, Filter, Clock, CheckCircle, XCircle } from '@/components/ui/LucideIcon';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';

export default function PrescriptionsPage() {
  const [tab, setTab] = useState('pending');

  const prescriptions: Array<{ id: string; patient: string; doctor: string; medicines: number; total: number; status: string; date: string }> = [];

  const filtered = prescriptions.filter(p => p.status.toLowerCase() === tab || tab === 'all');

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all prescription orders.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search prescriptions..." className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 w-60" />
          </div>
          <Link href="/work-orders/projects" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            Doctors
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <Plus className="w-4 h-4" />New Prescription
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {['all', 'pending', 'approved', 'completed', 'cancelled'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{t}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">RX#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Patient</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Doctor</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Items</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Total</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">No prescriptions — prescriptions are not yet available in the API. Dummy data removed.</td></tr>
              ) : filtered.map((rx, i) => (
                <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">{rx.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{rx.patient}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{rx.doctor}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-center">{rx.medicines}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(rx.total)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      rx.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      rx.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                      rx.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {rx.status === 'Completed' && <CheckCircle className="w-3 h-3" />}
                      {rx.status === 'Pending' && <Clock className="w-3 h-3" />}
                      {rx.status === 'Cancelled' && <XCircle className="w-3 h-3" />}
                      {rx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-right">{rx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
