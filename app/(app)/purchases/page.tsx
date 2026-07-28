'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Download, Eye, Edit, Trash2, FileText, FileSpreadsheet, RefreshCw, ChevronUp, X, Calendar } from '@/components/ui/LucideIcon';
import { TransactionsAPI, ProductsAPI, SuppliersAPI } from '@/lib/api';

interface Purchase {
  id: string;
  supplierName: string;
  reference: string;
  date: string;
  status: 'Received' | 'Pending' | 'Ordered';
  total: number;
  paid: number;
  due: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Overdue';
}

interface PurchaseProduct {
  id: string;
  name: string;
  qty: number;
  purchasePrice: number;
  discount: number;
  tax: number;
  taxAmount: number;
  unitCost: number;
  totalCost: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  tax: number;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('Payment Status');
  const [showAddModal, setShowAddModal] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [date, setDate] = useState('');
  const [reference, setReference] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<PurchaseProduct[]>([]);
  const [orderTax, setOrderTax] = useState('');
  const [discount, setDiscount] = useState('');
  const [shipping, setShipping] = useState('');
  const [status, setStatus] = useState('');
  const [description, setDescription] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [txRes, prodRes, supRes] = await Promise.all([
          TransactionsAPI.getAll(),
          ProductsAPI.getAll(),
          SuppliersAPI.getAll(),
        ]);
        const txList = (txRes.data || []).filter((t: any) => t.transactionType === 'PURCHASE');
        setPurchases(txList.map((t: any) => {
          const total = Number(t.totalPrice || 0);
          const isCompleted = t.status === 'COMPLETED';
          const paid = isCompleted ? total : 0;
          return {
            id: String(t.id),
            supplierName: t.supplierName || t.supplier?.name || 'Unknown',
            reference: `PT-${String(t.id).padStart(3, '0')}`,
            date: t.createdAt
              ? new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : '',
            status: (t.status === 'COMPLETED' ? 'Received' : t.status === 'PENDING' ? 'Pending' : 'Ordered') as Purchase['status'],
            total,
            paid,
            due: total - paid,
            paymentStatus: isCompleted ? 'Paid' : 'Unpaid',
          };
        }));
        setAllProducts((prodRes.data || []).map((p: any) => ({
          id: String(p.id),
          name: p.name || '',
          sku: p.sku || '',
          price: Number(p.price || 0),
          tax: Number(p.tax || 0),
        })));
        setSuppliers(supRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusColor = (status: Purchase['status']) => {
    switch (status) {
      case 'Received':
        return 'bg-green-500 text-white';
      case 'Pending':
        return 'bg-cyan-500 text-white';
      case 'Ordered':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPaymentStatusColor = (status: Purchase['paymentStatus']) => {
    switch (status) {
      case 'Paid':
        return 'text-green-600';
      case 'Unpaid':
        return 'text-red-600';
      case 'Overdue':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch =
      purchase.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      paymentStatusFilter === 'Payment Status' || purchase.paymentStatus === paymentStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredProducts = allProducts.filter(product =>
    productSearch.trim() !== '' &&
    (product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
     product.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const addProductToTable = (product: Product) => {
    const qty = 1;
    const purchasePrice = product.price;
    const discount = 0;
    const tax = product.tax;
    const taxAmount = (purchasePrice * tax) / 100;
    const unitCost = purchasePrice - discount + taxAmount;
    const totalCost = unitCost * qty;

    const newProduct: PurchaseProduct = {
      id: `${Date.now()}-${product.id}`,
      name: product.name,
      qty,
      purchasePrice,
      discount,
      tax,
      taxAmount,
      unitCost,
      totalCost,
    };

    setProducts([...products, newProduct]);
    setProductSearch('');
    setShowAutocomplete(false);
    setSelectedProductIndex(0);
  };

  const handleProductSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showAutocomplete || filteredProducts.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedProductIndex(prev =>
        prev < filteredProducts.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedProductIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProducts[selectedProductIndex]) {
        addProductToTable(filteredProducts[selectedProductIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
      setSelectedProductIndex(0);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Purchase</h1>
        <p className="text-sm text-gray-600">Manage your purchases</p>
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
          <button className="p-2 hover:bg-gray-100 rounded">
            <FileText className="w-5 h-5 text-red-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <ChevronUp className="w-5 h-5 text-gray-600" />
          </button>

          {/* Payment Status Filter */}
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option>Payment Status</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Overdue">Overdue</option>
          </select>

          {/* Add & Import Buttons */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Plus className="w-5 h-5" />
            Add Purchase
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black">
            <Download className="w-5 h-5" />
            Import Purchase
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paid
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-24" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-20" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-28" /></td>
                  <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded-full animate-pulse w-16" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-16" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-16" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-16" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-20" /></td>
                  <td className="px-6 py-4"><div className="flex items-center justify-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                  </div></td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-red-500">{error}</td>
              </tr>
            ) : filteredPurchases.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">No purchases found</td>
              </tr>
            ) : (
              filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">{purchase.supplierName}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{purchase.reference}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{purchase.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                      {purchase.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700">₹{purchase.total}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700">₹{purchase.paid}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700">₹{purchase.due.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1 text-xs font-medium ${getPaymentStatusColor(purchase.paymentStatus)}`}>
                      <span className="w-2 h-2 rounded-full bg-current"></span>
                      {purchase.paymentStatus}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl shadow-xl max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b bg-white sticky top-0 z-10">
              <h2 className="text-2xl font-bold text-gray-900">Add Purchase</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              {/* Top Form Fields */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* Supplier Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select</option>
                      {suppliers.map((s: any) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="dd/mm/yyyy"
                    />
                  </div>
                </div>

                {/* Reference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Product Search */}
              <div className="mb-6 relative" ref={autocompleteRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowAutocomplete(e.target.value.trim() !== '');
                    setSelectedProductIndex(0);
                  }}
                  onKeyDown={handleProductSearchKeyDown}
                  placeholder="Search Product"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Autocomplete Dropdown */}
                {showAutocomplete && filteredProducts.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredProducts.map((product, index) => (
                      <div
                        key={product.id}
                        onClick={() => addProductToTable(product)}
                        className={`px-4 py-3 cursor-pointer transition-colors ${
                          index === selectedProductIndex
                            ? 'bg-indigo-50 border-l-4 border-indigo-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">₹{product.price.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">Tax: {product.tax}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No results message */}
                {showAutocomplete && productSearch.trim() !== '' && filteredProducts.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                    <p className="text-gray-500 text-center">No products found</p>
                  </div>
                )}
              </div>

              {/* Products Table */}
              <div className="mb-6 border border-gray-300 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Purchase Price(₹)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount(₹)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax(%)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax Amount(₹)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Cost(₹)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Cost(₹)</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                          No products added. Search and add products above.
                        </td>
                      </tr>
                    ) : (
                      products.map((product, index) => (
                        <tr key={product.id} className="border-t border-gray-200">
                          <td className="px-4 py-3 text-sm">{product.name}</td>
                          <td className="px-4 py-3 text-center text-sm">{product.qty}</td>
                          <td className="px-4 py-3 text-right text-sm">₹{product.purchasePrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-sm">₹{product.discount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-sm">{product.tax}%</td>
                          <td className="px-4 py-3 text-right text-sm">₹{product.taxAmount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-sm">₹{product.unitCost.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-sm">₹{product.totalCost.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setProducts(products.filter((_, i) => i !== index))}
                              className="p-1 hover:bg-red-100 rounded text-red-600"
                              title="Remove product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="bg-gray-50 px-4 py-2 border-t border-gray-300 flex items-center justify-between text-sm">
                  <span>Row Per Page</span>
                  <select className="px-2 py-1 border border-gray-300 rounded">
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                  </select>
                  <span>Entries</span>
                  <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-gray-200 rounded">&lt;</button>
                    <span className="w-8 h-8 bg-orange-500 text-white rounded flex items-center justify-center">1</span>
                    <button className="p-1 hover:bg-gray-200 rounded">&gt;</button>
                  </div>
                </div>
              </div>

              {/* Bottom Form Fields */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {/* Order Tax */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Tax <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={orderTax}
                    onChange={(e) => setOrderTax(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Shipping */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={shipping}
                    onChange={(e) => setShipping(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select</option>
                    <option value="Received">Received</option>
                    <option value="Pending">Pending</option>
                    <option value="Ordered">Ordered</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  {/* Toolbar */}
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-300 flex items-center gap-2">
                    <select className="px-2 py-1 border border-gray-300 rounded text-sm">
                      <option>Normal</option>
                      <option>Heading 1</option>
                      <option>Heading 2</option>
                    </select>
                    <button className="p-1 hover:bg-gray-200 rounded font-bold">B</button>
                    <button className="p-1 hover:bg-gray-200 rounded italic">I</button>
                    <button className="p-1 hover:bg-gray-200 rounded underline">U</button>
                    <button className="p-1 hover:bg-gray-200 rounded">🔗</button>
                    <button className="p-1 hover:bg-gray-200 rounded">•</button>
                    <button className="p-1 hover:bg-gray-200 rounded">1.</button>
                    <button className="p-1 hover:bg-gray-200 rounded">Tx</button>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 focus:outline-none resize-none"
                    rows={4}
                    placeholder="Maximum 60 Words"
                  ></textarea>
                </div>
                <p className="text-xs text-gray-500 mt-1">Maximum 60 Words</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
