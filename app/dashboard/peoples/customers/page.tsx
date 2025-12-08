'use client';

import { useState } from 'react';
import { Search, Plus, FileText, FileSpreadsheet, RefreshCw, ChevronUp, Eye, Edit, Trash2, X, User } from 'lucide-react';

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerImage, setNewCustomerImage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [customerStatus, setCustomerStatus] = useState(true);

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
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
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

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Add Customer</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  // Reset form
                  setNewCustomerImage(null);
                  setFirstName('');
                  setLastName('');
                  setEmail('');
                  setPhone('');
                  setAddress('');
                  setCity('');
                  setState('');
                  setCountry('');
                  setPostalCode('');
                  setCustomerStatus(true);
                }}
                className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Upload Image Section */}
              <div className="mb-6 flex items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-24 h-24 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {newCustomerImage ? (
                      <img src={newCustomerImage} alt="Customer" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Plus className="w-8 h-8 mb-1" />
                        <span className="text-xs">Add Image</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer">
                    <span className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 inline-block">
                      Upload Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewCustomerImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <p className="text-xs text-gray-500">JPEG, PNG up to 2 MB</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* First Name and Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* City and State */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="New York">New York</option>
                      <option value="Los Angeles">Los Angeles</option>
                      <option value="Chicago">Chicago</option>
                      <option value="Houston">Houston</option>
                      <option value="Phoenix">Phoenix</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Bangalore">Bangalore</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="California">California</option>
                      <option value="Texas">Texas</option>
                      <option value="Florida">Florida</option>
                      <option value="New York">New York</option>
                      <option value="Illinois">Illinois</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                    </select>
                  </div>
                </div>

                {/* Country and Postal Code */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="United States">United States</option>
                      <option value="India">India</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCustomerStatus(!customerStatus)}
                      className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {customerStatus ? 'Active' : 'Inactive'}
                      </span>
                      <div className={`relative w-10 h-5 rounded-full transition-colors ${
                        customerStatus ? 'bg-green-600' : 'bg-gray-300'
                      }`}>
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          customerStatus ? 'translate-x-5' : 'translate-x-0'
                        }`}></div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    // Reset form
                    setNewCustomerImage(null);
                    setFirstName('');
                    setLastName('');
                    setEmail('');
                    setPhone('');
                    setAddress('');
                    setCity('');
                    setState('');
                    setCountry('');
                    setPostalCode('');
                    setCustomerStatus(true);
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!firstName || !lastName || !email || !phone) {
                      alert('Please fill in all required fields!');
                      return;
                    }
                    // Here you would normally save the customer data
                    const fullName = `${firstName} ${lastName}`;
                    alert(`Customer "${fullName}" added successfully!`);
                    setShowAddModal(false);
                    // Reset form
                    setNewCustomerImage(null);
                    setFirstName('');
                    setLastName('');
                    setEmail('');
                    setPhone('');
                    setAddress('');
                    setCity('');
                    setState('');
                    setCountry('');
                    setPostalCode('');
                    setCustomerStatus(true);
                  }}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
