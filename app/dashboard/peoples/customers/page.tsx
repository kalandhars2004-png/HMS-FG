'use client';

import { useState } from 'react';
import { Search, Plus, FileText, FileSpreadsheet, RefreshCw, ChevronUp, Eye, Edit, Trash2 } from 'lucide-react';

interface Customer {
  id: string;
  code: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  country: string;
  status: 'Active' | 'Inactive';
}

const mockCustomers: Customer[] = [
  {
    id: '1',
    code: 'CU001',
    name: 'Carl Evans',
    avatar: '👨',
    email: 'carlevans@example.com',
    phone: '+12163547758',
    country: 'Germany',
    status: 'Active'
  },
  {
    id: '2',
    code: 'CU002',
    name: 'Minerva Rameriz',
    avatar: '👩',
    email: 'rameriz@example.com',
    phone: '+11367529510',
    country: 'Japan',
    status: 'Active'
  },
  {
    id: '3',
    code: 'CU003',
    name: 'Robert Lamon',
    avatar: '👨',
    email: 'robert@example.com',
    phone: '+15362789414',
    country: 'USA',
    status: 'Active'
  },
  {
    id: '4',
    code: 'CU004',
    name: 'Patricia Lewis',
    avatar: '👩',
    email: 'patricia@example.com',
    phone: '+18513094627',
    country: 'Austria',
    status: 'Active'
  },
  {
    id: '5',
    code: 'CU005',
    name: 'Mark Joslyn',
    avatar: '👨',
    email: 'markjoslyn@example.com',
    phone: '+14678219025',
    country: 'Turkey',
    status: 'Active'
  },
  {
    id: '6',
    code: 'CU006',
    name: 'Marsha Betts',
    avatar: '👩',
    email: 'marshabetts@example.com',
    phone: '+10913278319',
    country: 'Mexico',
    status: 'Active'
  },
  {
    id: '7',
    code: 'CU007',
    name: 'Daniel Jude',
    avatar: '👨',
    email: 'daie ljude@example.com',
    phone: '+19125852947',
    country: 'France',
    status: 'Active'
  },
  {
    id: '8',
    code: 'CU008',
    name: 'Emma Bates',
    avatar: '👩',
    email: 'emmabates@example.com',
    phone: '+13671835209',
    country: 'Greece',
    status: 'Active'
  },
  {
    id: '9',
    code: 'CU009',
    name: 'Richard Fralick',
    avatar: '👨',
    email: 'richard@example.com',
    phone: '+19756194733',
    country: 'Italy',
    status: 'Active'
  },
];

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Status');

  const filteredCustomers = mockCustomers.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'Status' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-600">Manage your customers</p>
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
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Add Customer Button */}
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            <Plus className="w-5 h-5" />
            Add Customer
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
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Country
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{customer.code}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xl">
                      {customer.avatar}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{customer.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{customer.email}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{customer.phone}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{customer.country}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {customer.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
    </div>
  );
}
