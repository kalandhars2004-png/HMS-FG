'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCw, AlertTriangle, ShoppingCart } from '@/components/ui/LucideIcon';
import { ReorderAPI } from '@/lib/api';

interface ReorderItem {
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

export default function ReorderPage() {
  const router = useRouter();
  const [items, setItems] = useState<ReorderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await ReorderAPI.getNeedsReorder();
      setItems((res as any).data || []);
    } catch (err) {
      console.error('Failed to load reorder items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorderAll = () => {
    router.push('/purchases/create');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1600px] mx-auto flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reorder Stock</h1>
            <p className="text-sm text-gray-600 mt-1">Products that need to be reordered</p>
          </div>
          <div className="flex gap-3">
            <button onClick={loadData} className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
              <RotateCw className="w-5 h-5 text-gray-600" />
            </button>
            {items.length > 0 && (
              <button
                onClick={handleReorderAll}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 font-medium"
              >
                <ShoppingCart className="w-5 h-5" /> Reorder All ({items.length})
              </button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">All Stock Levels Are Healthy</h2>
            <p className="text-gray-500">No products need reordering at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-red-100 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                      <p className="text-xs text-gray-500">Product #{item.productId}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Low Stock
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Stock</span>
                    <span className="font-semibold text-red-600">{item.currentStock}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Reorder Point</span>
                    <span className="font-medium text-gray-900">{item.reorderPoint}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Suggested Order Qty</span>
                    <span className="font-medium text-gray-900">{item.reorderQuantity}</span>
                  </div>
                  {item.minStockLevel != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Min Stock Level</span>
                      <span className="font-medium text-gray-900">{item.minStockLevel}</span>
                    </div>
                  )}
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (item.currentStock / (item.reorderPoint || 1)) * 100)}%`,
                    }}
                  ></div>
                </div>

                <button
                  onClick={() => router.push('/purchases/create')}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <ShoppingCart className="w-4 h-4" /> Create Purchase Order
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
