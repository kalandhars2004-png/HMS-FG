'use client';

import { useState } from 'react';
import { Plus, Search, RefreshCw, Eye, Edit, Trash2, X, User } from 'lucide-react';

interface Warehouse {
  id: string;
  warehouse: string;
  contactPerson: string;
  contactImage?: string;
  email: string;
  phone: string;
  phoneWork?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  totalProducts: number;
  stock: number;
  qty: number;
  createdOn: string;
  status: boolean;
}

const mockWarehouses: Warehouse[] = [
  {
    id: '1',
    warehouse: 'Lavish Warehouse',
    contactPerson: 'Chad Taylor',
    email: 'chad@example.com',
    phone: '+12498345785',
    address: '123 Storage Lane',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    postalCode: '10001',
    totalProducts: 10,
    stock: 600,
    qty: 80,
    createdOn: '24 Dec 2024',
    status: true,
  },
  {
    id: '2',
    warehouse: 'Quaint Warehouse',
    contactPerson: 'Jenny Ellis',
    email: 'jenny@example.com',
    phone: '+13178964582',
    address: '456 Depot Road',
    city: 'Los Angeles',
    state: 'CA',
    country: 'United States',
    postalCode: '90001',
    totalProducts: 15,
    stock: 300,
    qty: 85,
    createdOn: '10 Dec 2024',
    status: true,
  },
  {
    id: '3',
    warehouse: 'Traditional Warehouse',
    contactPerson: 'Leon Baxter',
    email: 'leon@example.com',
    phone: '+12796183487',
    address: '789 Warehouse Ave',
    city: 'Chicago',
    state: 'IL',
    country: 'United States',
    postalCode: '60601',
    totalProducts: 12,
    stock: 400,
    qty: 70,
    createdOn: '27 Nov 2024',
    status: true,
  },
  {
    id: '4',
    warehouse: 'Cool Warehouse',
    contactPerson: 'Karen Flores',
    email: 'karen@example.com',
    phone: '+17538647943',
    address: '321 Cold Storage Blvd',
    city: 'Houston',
    state: 'TX',
    country: 'United States',
    postalCode: '77001',
    totalProducts: 20,
    stock: 320,
    qty: 65,
    createdOn: '18 Nov 2024',
    status: true,
  },
  {
    id: '5',
    warehouse: 'Overflow Warehouse',
    contactPerson: 'Michael Dawson',
    email: 'michael@example.com',
    phone: '+13798132475',
    address: '654 Overflow St',
    city: 'Phoenix',
    state: 'AZ',
    country: 'United States',
    postalCode: '85001',
    totalProducts: 8,
    stock: 170,
    qty: 80,
    createdOn: '06 Nov 2024',
    status: true,
  },
];

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(mockWarehouses);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Status');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [warehouseName, setWarehouseName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneWork, setPhoneWork] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [warehouseStatus, setWarehouseStatus] = useState(true);

  const handleSaveWarehouse = () => {
    if (!warehouseName || !contactPerson || !email || !phone || !address || !city || !state || !country || !postalCode) {
      alert('Please fill in all required fields!');
      return;
    }

    const newWarehouse: Warehouse = {
      id: Date.now().toString(),
      warehouse: warehouseName,
      contactPerson,
      email,
      phone,
      phoneWork,
      address,
      city,
      state,
      country,
      postalCode,
      totalProducts: 0,
      stock: 0,
      qty: 0,
      createdOn: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: warehouseStatus,
    };

    setWarehouses([...warehouses, newWarehouse]);

    // Reset form
    setShowAddModal(false);
    setWarehouseName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setPhoneWork('');
    setAddress('');
    setCity('');
    setState('');
    setCountry('');
    setPostalCode('');
    setWarehouseStatus(true);
  };

  const filteredWarehouses = warehouses.filter((warehouse) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      warehouse.warehouse.toLowerCase().includes(query) ||
      warehouse.contactPerson.toLowerCase().includes(query) ||
      warehouse.email.toLowerCase().includes(query) ||
      warehouse.phone.includes(query);
    const matchesStatus =
      statusFilter === 'Status' ||
      (statusFilter === 'Active' && warehouse.status) ||
      (statusFilter === 'Inactive' && !warehouse.status);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Warehouses</h1>
        <p className="text-gray-600">Manage your warehouses</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search warehouses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option>Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Warehouse
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Person
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Products
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created On
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWarehouses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No warehouses found
                  </td>
                </tr>
              ) : (
                filteredWarehouses.map((warehouse) => (
                  <tr key={warehouse.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {warehouse.warehouse}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {warehouse.contactImage ? (
                            <img
                              src={warehouse.contactImage}
                              alt={warehouse.contactPerson}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <span className="text-sm text-gray-900">{warehouse.contactPerson}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {warehouse.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {warehouse.totalProducts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {warehouse.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {warehouse.qty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {warehouse.createdOn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          warehouse.status
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {warehouse.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-gray-100 rounded text-gray-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded text-gray-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:bg-red-100 rounded text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Warehouse Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Add Warehouse</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Warehouse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter warehouse name"
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person <span className="text-red-500">*</span>
                </label>
                <select
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select</option>
                  <option value="Chad Taylor">Chad Taylor</option>
                  <option value="Jenny Ellis">Jenny Ellis</option>
                  <option value="Leon Baxter">Leon Baxter</option>
                  <option value="Karen Flores">Karen Flores</option>
                  <option value="Michael Dawson">Michael Dawson</option>
                </select>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter email"
                />
              </div>

              {/* Phone and Phone(Work) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone(Work)
                  </label>
                  <input
                    type="tel"
                    value={phoneWork}
                    onChange={(e) => setPhoneWork(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter work phone"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter address"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="New York">New York</option>
                    <option value="Los Angeles">Los Angeles</option>
                    <option value="Chicago">Chicago</option>
                    <option value="Houston">Houston</option>
                    <option value="Phoenix">Phoenix</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="NY">New York</option>
                    <option value="CA">California</option>
                    <option value="IL">Illinois</option>
                    <option value="TX">Texas</option>
                    <option value="AZ">Arizona</option>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter postal code"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <button
                  type="button"
                  onClick={() => setWarehouseStatus(!warehouseStatus)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    warehouseStatus ? 'bg-teal-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      warehouseStatus ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveWarehouse}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Add Warehouse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
