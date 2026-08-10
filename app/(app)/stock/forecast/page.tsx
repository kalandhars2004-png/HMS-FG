'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, RotateCw, AlertTriangle, SlidersHorizontal } from '@/components/ui/LucideIcon';
import { ReorderAPI, ProductsAPI } from '@/lib/api';
import GlobalModal from '@/components/ui/GlobalModal';

interface ReorderPoint {
  id: number;
  productId: number;
  productName: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  reorderQuantity: number;
  status: string;
  needsReorder: boolean;
}

interface ForecastResult {
  productId: number;
  productName: string;
  currentStock: number;
  averageMonthlySales: number;
  daysUntilOutOfStock: number;
  recommendation: string;
  suggestedOrderQuantity: number;
  calculatedAt: string;
}

const RECOMMENDATION_COLORS: Record<string, string> = {
  ORDER: 'bg-red-100 text-red-800',
  NO_ACTION: 'bg-green-100 text-green-800',
  OVERSTOCKED: 'bg-orange-100 text-orange-800',
};

export default function ForecastPage() {
  const [reorderPoints, setReorderPoints] = useState<ReorderPoint[]>([]);
  const [needsReorder, setNeedsReorder] = useState<ReorderPoint[]>([]);
  const [forecast, setForecast] = useState<ForecastResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [recommendationFilter, setRecommendationFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    minStockLevel: '',
    maxStockLevel: '',
    reorderPoint: '',
    reorderQuantity: '',
  });
  const [editingPoint, setEditingPoint] = useState<ReorderPoint | null>(null);

  useEffect(() => {
    loadData();
    loadProducts();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pointsRes, needsRes, forecastRes] = await Promise.all([
        ReorderAPI.getPoints(),
        ReorderAPI.getNeedsReorder(),
        ReorderAPI.getForecast(),
      ]);
      setReorderPoints((pointsRes as any).data || []);
      setNeedsReorder((needsRes as any).data || []);
      setForecast((forecastRes as any).data || []);
    } catch (err) {
      console.error('Failed to load forecast data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await ProductsAPI.getAll();
      setProducts((res as any).data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const handleSetPoint = async () => {
    if (!selectedProduct) return;
    try {
      await ReorderAPI.setPoint({
        productId: selectedProduct.id,
        minStockLevel: parseInt(formData.minStockLevel) || 0,
        maxStockLevel: parseInt(formData.maxStockLevel) || 0,
        reorderPoint: parseInt(formData.reorderPoint) || 0,
        reorderQuantity: parseInt(formData.reorderQuantity) || 0,
        status: 'ACTIVE',
      });
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error('Failed to set reorder point:', err);
    }
  };

  const handleUpdatePoint = async (point: ReorderPoint) => {
    try {
      await ReorderAPI.setPoint({
        productId: point.productId,
        minStockLevel: point.minStockLevel,
        maxStockLevel: point.maxStockLevel,
        reorderPoint: point.reorderPoint,
        reorderQuantity: point.reorderQuantity,
        status: point.status,
      });
      loadData();
      setEditingPoint(null);
    } catch (err) {
      console.error('Failed to update reorder point:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await ReorderAPI.deletePoint(String(id));
      loadData();
    } catch (err) {
      console.error('Failed to delete reorder point:', err);
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setProductSearch('');
    setFormData({ minStockLevel: '', maxStockLevel: '', reorderPoint: '', reorderQuantity: '' });
  };

  const filteredProducts = products.filter((p: any) =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredForecast = forecast.filter(f => {
    const matchesRec = !recommendationFilter || f.recommendation === recommendationFilter;
    const matchesSearch = !searchQuery || f.productName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRec && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Forecast</h1>
            <p className="text-sm text-gray-600 mt-1">Forecast demand and manage reorder points</p>
          </div>
          <div className="flex gap-3">
            <button onClick={loadData} className="p-2 hover:bg-white rounded-lg border border-gray-200 bg-white">
              <RotateCw className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" /> Set Reorder Point
            </button>
          </div>
        </div>

        {needsReorder.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold text-red-800">Needs Reorder ({needsReorder.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-red-200">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-red-700 uppercase">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-red-700 uppercase">Current Stock</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-red-700 uppercase">Reorder Point</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-red-700 uppercase">Suggested Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  {needsReorder.map(item => (
                    <tr key={item.id} className="hover:bg-red-100/50">
                      <td className="px-4 py-3 text-sm font-medium text-red-900">{item.productName}</td>
                      <td className="px-4 py-3 text-sm text-red-700">{item.currentStock}</td>
                      <td className="px-4 py-3 text-sm text-red-700">{item.reorderPoint}</td>
                      <td className="px-4 py-3 text-sm text-red-700">{item.reorderQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Full Forecast</h2>
            <div className="flex gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <select
                value={recommendationFilter}
                onChange={(e) => setRecommendationFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Recommendations</option>
                <option value="ORDER">ORDER</option>
                <option value="NO_ACTION">NO_ACTION</option>
                <option value="OVERSTOCKED">OVERSTOCKED</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Current Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Avg Monthly Sales</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Days Until OOS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Recommendation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Suggested Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredForecast.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">No forecast data available.</td>
                  </tr>
                ) : (
                  filteredForecast.map(f => (
                    <tr key={f.productId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{f.productName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{f.currentStock}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{f.averageMonthlySales}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {f.daysUntilOutOfStock >= 999 ? '∞' : f.daysUntilOutOfStock}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${RECOMMENDATION_COLORS[f.recommendation] || 'bg-gray-100 text-gray-800'}`}>
                          {f.recommendation?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{f.suggestedOrderQuantity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reorder Points</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Current Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Min Level</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Max Level</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Reorder Point</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Reorder Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reorderPoints.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">No reorder points configured.</td>
                  </tr>
                ) : (
                  reorderPoints.map(point => (
                    <tr key={point.id} className="hover:bg-gray-50">
                      {editingPoint?.id === point.id ? (
                        <>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{point.productName}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{point.currentStock}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={editingPoint.minStockLevel}
                              onChange={(e) => setEditingPoint({ ...editingPoint, minStockLevel: parseInt(e.target.value) || 0 })}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={editingPoint.maxStockLevel}
                              onChange={(e) => setEditingPoint({ ...editingPoint, maxStockLevel: parseInt(e.target.value) || 0 })}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={editingPoint.reorderPoint}
                              onChange={(e) => setEditingPoint({ ...editingPoint, reorderPoint: parseInt(e.target.value) || 0 })}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={editingPoint.reorderQuantity}
                              onChange={(e) => setEditingPoint({ ...editingPoint, reorderQuantity: parseInt(e.target.value) || 0 })}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={editingPoint.status}
                              onChange={(e) => setEditingPoint({ ...editingPoint, status: e.target.value })}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="INACTIVE">INACTIVE</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleUpdatePoint(editingPoint)}
                                className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingPoint(null)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{point.productName}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{point.currentStock}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{point.minStockLevel}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{point.maxStockLevel}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{point.reorderPoint}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{point.reorderQuantity}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${point.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {point.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingPoint({ ...point })}
                                className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(point.id)}
                                className="p-1.5 hover:bg-red-100 rounded text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <GlobalModal
          onClose={() => { setShowModal(false); resetForm(); }}
          title="Set Reorder Point"
          subtitle="Configure minimum, maximum, reorder point and quantity for a product."
          icon={<SlidersHorizontal className="w-5 h-5" />}
          size="md"
          cancelLabel="Cancel"
          submitLabel="Set Point"
          onSubmit={handleSetPoint}
          submitDisabled={!selectedProduct}
        >
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product <span className="text-red-500">*</span></label>
              <Search className="absolute left-3 top-9 transform text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search Product"
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); setShowProductDropdown(true); setSelectedProduct(null); }}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {showProductDropdown && productSearch && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1E1E1E] border border-gray-300 dark:border-[#2A2A2A] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredProducts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => { setSelectedProduct(p); setProductSearch(p.name); setShowProductDropdown(false); }}
                      className="px-4 py-2 hover:bg-orange-50 dark:hover:bg-orange-500/10 cursor-pointer text-sm text-gray-900 dark:text-gray-200"
                    >
                      {p.name}
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="px-4 py-2 text-sm text-gray-500">No products found</div>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min Stock Level</label>
                <input
                  type="number"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Stock Level</label>
                <input
                  type="number"
                  value={formData.maxStockLevel}
                  onChange={(e) => setFormData({ ...formData, maxStockLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reorder Point</label>
                <input
                  type="number"
                  value={formData.reorderPoint}
                  onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reorder Quantity</label>
                <input
                  type="number"
                  value={formData.reorderQuantity}
                  onChange={(e) => setFormData({ ...formData, reorderQuantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
        </GlobalModal>
      )}
    </div>
  );
}
