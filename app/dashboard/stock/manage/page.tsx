'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, Edit, Trash2, FileText, Sheet, RotateCw } from 'lucide-react';

interface Stock {
  id: string;
  warehouse: string;
  store: string;
  product: {
    name: string;
    icon: string;
  };
  date: string;
  person: {
    name: string;
    initials: string;
  };
  quantity: number;
}

export default function ManageStockPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    try {
      setIsLoading(true);

      // Mock data
      const mockStocks: Stock[] = [
        {
          id: '1',
          warehouse: 'Lavish Warehouse',
          store: 'Electro Mart',
          product: { name: 'Lenovo IdeaPad 3', icon: '💻' },
          date: '24 Dec 2024',
          person: { name: 'James Kirwin', initials: 'JK' },
          quantity: 100,
        },
        {
          id: '2',
          warehouse: 'Quaint Warehouse',
          store: 'Quantum Gadgets',
          product: { name: 'Beats Pro', icon: '🎧' },
          date: '10 Dec 2024',
          person: { name: 'Francis Chang', initials: 'FC' },
          quantity: 140,
        },
        {
          id: '3',
          warehouse: 'Lobar Handy',
          store: 'Prime Bazaar',
          product: { name: 'Nike Jordan', icon: '👟' },
          date: '25 Jul 2023',
          person: { name: 'Steven', initials: 'S' },
          quantity: 120,
        },
        {
          id: '4',
          warehouse: 'Quaint Warehouse',
          store: 'Gadget World',
          product: { name: 'Apple Series 5 Watch', icon: '⌚' },
          date: '28 Jul 2023',
          person: { name: 'Gravely', initials: 'G' },
          quantity: 130,
        },
        {
          id: '5',
          warehouse: 'Traditional Warehouse',
          store: 'Volt Vault',
          product: { name: 'Amazon Echo Dot', icon: '🔊' },
          date: '24 Jul 2023',
          person: { name: 'Kevin', initials: 'K' },
          quantity: 140,
        },
      ];
      setStocks(mockStocks);
    } catch (error) {
      console.error('Failed to load stocks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stock.warehouse.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWarehouse = warehouseFilter === '' || stock.warehouse === warehouseFilter;
    const matchesStore = storeFilter === '' || stock.store === storeFilter;
    const matchesProduct = productFilter === '' || stock.product.name === productFilter;
    return matchesSearch && matchesWarehouse && matchesStore && matchesProduct;
  });

  const warehouses = Array.from(new Set(stocks.map(s => s.warehouse)));
  const stores = Array.from(new Set(stocks.map(s => s.store)));
  const products = Array.from(new Set(stocks.map(s => s.product.name)));

  const getAvatarColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-orange-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Stock</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your stock</p>
        </div>

        {/* Top Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            {/* Left side - Search */}
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Right side - Filters and buttons */}
            <div className="flex gap-2 items-center">
              <button className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200">
                <FileText className="w-5 h-5 text-red-500" />
              </button>
              <button className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200">
                <Sheet className="w-5 h-5 text-green-600" />
              </button>
              <button className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200">
                <RotateCw className="w-5 h-5 text-gray-600" />
              </button>

              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse} value={warehouse}>
                    {warehouse}
                  </option>
                ))}
              </select>

              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Store</option>
                {stores.map((store) => (
                  <option key={store} value={store}>
                    {store}
                  </option>
                ))}
              </select>

              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Product</option>
                {products.map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
              </select>

              <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 font-medium">
                <span className="text-lg">+</span> Add Stock
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Warehouse
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Store
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Person
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredStocks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No stocks found.
                      </td>
                    </tr>
                  ) : (
                    filteredStocks.map((stock, index) => (
                      <tr key={stock.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{stock.warehouse}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{stock.store}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{stock.product.icon}</span>
                            <span className="text-sm font-medium text-gray-900">{stock.product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{stock.date}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getAvatarColor(index)}`}>
                              {stock.person.initials}
                            </div>
                            <span className="text-sm text-gray-900">{stock.person.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{stock.quantity}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-red-600"
                              title="Delete"
                            >
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
        )}
      </div>
    </div>
  );
}
