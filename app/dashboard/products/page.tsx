'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { ProductsAPI } from '@/lib/api';
import { Search, Eye, Edit, Trash2, FileText, Sheet, RotateCw, ChevronDown } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      // const data = await ProductsAPI.getAll();
      // setProducts(data);

      // Mock data for demonstration
      const mockProducts: Product[] = [
        {
          id: '1',
          sku: 'LAPTOP001',
          name: 'Dell XPS 15',
          productType: 'single',
          price: 1299.99,
          quantity: 25,
          category: { id: '1', name: 'Electronics', slug: 'electronics', status: true },
          brand: { id: '1', name: 'Dell', status: true },
          description: 'High-performance laptop with 15.6" display',
          unit: { id: '1', name: 'Piece', shortName: 'Pc', status: true },
          createdBy: 'James Kirwin',
        },
        {
          id: '2',
          sku: 'PHONE001',
          name: 'iPhone 15 Pro',
          productType: 'single',
          price: 999.99,
          quantity: 50,
          category: { id: '1', name: 'Electronics', slug: 'electronics', status: true },
          brand: { id: '2', name: 'Apple', status: true },
          description: 'Latest iPhone with A17 Pro chip',
          unit: { id: '1', name: 'Piece', shortName: 'Pc', status: true },
          createdBy: 'Francis Chang',
        },
        {
          id: '3',
          sku: 'DESK001',
          name: 'Standing Desk',
          productType: 'single',
          price: 399.99,
          quantity: 15,
          category: { id: '2', name: 'Furniture', slug: 'furniture', status: true },
          brand: { id: '3', name: 'IKEA', status: true },
          description: 'Adjustable height standing desk',
          unit: { id: '1', name: 'Piece', shortName: 'Pc', status: true },
          createdBy: 'Antonio Engle',
        },
        {
          id: '4',
          sku: 'CHAIR001',
          name: 'Ergonomic Office Chair',
          productType: 'single',
          price: 249.99,
          quantity: 30,
          category: { id: '2', name: 'Furniture', slug: 'furniture', status: true },
          brand: { id: '4', name: 'Herman Miller', status: true },
          description: 'Comfortable office chair with lumbar support',
          unit: { id: '1', name: 'Piece', shortName: 'Pc', status: true },
          createdBy: 'Leo Kelly',
        },
        {
          id: '5',
          sku: 'MOUSE001',
          name: 'Wireless Mouse',
          productType: 'single',
          price: 29.99,
          quantity: 100,
          category: { id: '3', name: 'Accessories', slug: 'accessories', status: true },
          brand: { id: '5', name: 'Logitech', status: true },
          description: 'Wireless ergonomic mouse',
          unit: { id: '1', name: 'Piece', shortName: 'Pc', status: true },
          createdBy: 'Annette Walker',
        },
        {
          id: '6',
          sku: 'TABLET001',
          name: 'Samsung Galaxy Tab',
          productType: 'single',
          price: 549.99,
          quantity: 35,
          category: { id: '1', name: 'Electronics', slug: 'electronics', status: true },
          brand: { id: '6', name: 'Samsung', status: true },
          description: 'Android tablet with S-Pen',
          unit: { id: '1', name: 'Piece', shortName: 'Pc', status: true },
          createdBy: 'John Weaver',
        },
      ];
      setProducts(mockProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await ProductsAPI.delete(id);
      loadProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === '' || product.category?.name === categoryFilter;
    const matchesBrand = brandFilter === '' || product.brand?.name === brandFilter;
    return matchesSearch && matchesCategory && matchesBrand;
  });

  // Get unique categories and brands for filters
  const categories = Array.from(new Set(products.map(p => p.category?.name).filter(Boolean)));
  const brands = Array.from(new Set(products.map(p => p.brand?.name).filter(Boolean)));

  // Helper function to get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Helper function to get random color for avatar
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

  // Helper function to get product icon color
  const getProductIconColor = (index: number) => {
    const colors = [
      'bg-purple-100 text-purple-600',
      'bg-red-100 text-red-600',
      'bg-orange-100 text-orange-600',
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600',
      'bg-pink-100 text-pink-600',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Product List</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your products</p>
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

            {/* Right side - Export/Import and Add buttons */}
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
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Brand</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>

              <Link
                href="/dashboard/products/add"
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 font-medium"
              >
                <span className="text-lg">+</span> Add Product
              </Link>

              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium"
              >
                Import Product
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
                      SKU
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                        No products found. Click "Add Product" to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product, index) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{product.sku}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getProductIconColor(index)}`}>
                              <span className="text-lg">📦</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{product.category?.name || '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{product.brand?.name || '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 font-medium">${product.price}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{product.unit?.shortName || 'Pc'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{product.quantity}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getAvatarColor(index)}`}>
                              {getInitials(product.createdBy || 'Unknown')}
                            </div>
                            <span className="text-sm text-gray-900">{product.createdBy}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
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

      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadProducts();
          }}
        />
      )}
    </div>
  );
}

function ProductModal({
  product,
  onClose,
  onSave,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    price: product?.price || 0,
    quantity: product?.quantity || 0,
    description: product?.description || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (product) {
        await ProductsAPI.update(product.id, formData);
      } else {
        await ProductsAPI.create(formData);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">
          {product ? 'Edit Product' : 'Add Product'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">SKU</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input
              type="number"
              required
              step="0.01"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: parseFloat(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: parseInt(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
