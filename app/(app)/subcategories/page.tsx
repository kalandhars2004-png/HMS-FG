'use client';

import { useState, useEffect } from 'react';
import { SubCategory, Category } from '@/types';
import { SubCategoriesAPI, CategoriesAPI } from '@/lib/api';
import {
  Search, Edit2, Trash2, X, RotateCw, Maximize, Plus, House,
  TrendingUp, TrendingDown, FolderOpen, CheckCircle, XCircle, Upload,
} from '@/components/ui/LucideIcon';

const CATEGORY_ICONS_MAP: Record<string, string> = {
  Tablet: '💊', Capsule: '💊', Syrup: '🧪', Injection: '💉',
  Ointment: '🧴', Drops: '💧',
};

const CATEGORY_COLORS: Record<string, string> = {
  Tablet: 'bg-[#0F9291]/10 text-[#0F9291]',
  Capsule: 'bg-[#14B8A6]/10 text-[#14B8A6]',
  Syrup: 'bg-[#FA9200]/10 text-[#FA9200]',
  Injection: 'bg-[#E65B0D]/10 text-[#E65B0D]',
  Ointment: 'bg-[#3848F5]/10 text-[#3848F5]',
  Drops: 'bg-[#8A38F5]/10 text-[#8A38F5]',
};

export default function SubCategoriesPage() {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const [catRes, subRes] = await Promise.all([
        CategoriesAPI.getAll(),
        SubCategoriesAPI.getAll(),
      ]);
      setCategories(catRes.data);
      setSubCategories(subRes.data);
    } catch (error) {
      console.error('Failed to load subcategories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sub category?')) return;
    try {
      await SubCategoriesAPI.delete(id);
      setSubCategories(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Failed to delete sub category:', error);
    }
  };

  const handleEdit = (subCategory: SubCategory) => {
    setEditingSubCategory(subCategory);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingSubCategory(null);
    setShowModal(true);
  };

  const filteredSubCategories = subCategories.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === '' || s.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: subCategories.length,
    active: subCategories.filter(s => s.status).length,
    inactive: subCategories.filter(s => !s.status).length,
  };

  const firstInitial = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="p-6 animate-fadeIn">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-1.5 m-0 p-0 list-none text-sm">
            <li className="flex items-center gap-1.5">
              <a href="/dashboard" className="text-gray-500 hover:text-gray-700 no-underline flex items-center gap-1.5">
                <House className="w-4 h-4" /> Dashboard
              </a>
              <span className="text-gray-300 mx-1">/</span>
            </li>
            <li className="text-gray-900 font-medium" aria-current="page">Sub Categories</li>
          </ol>
        </nav>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-250 shadow-sm" title="Refresh">
            <RotateCw className="w-4 h-4" />
          </button>
          <button className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-250 shadow-sm" title="Maximize">
            <Maximize className="w-4 h-4" />
          </button>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F9291] text-white font-semibold text-sm hover:bg-teal-700 transition-all duration-250 shadow-sm hover:shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Sub Category
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {[
          { label: 'Total Sub Categories', value: stats.total, icon: FolderOpen, color: 'text-[#0F9291]', bg: 'bg-[#0F9291]/10', trend: 'All subcategories' },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Currently enabled' },
          { label: 'Inactive', value: stats.inactive, icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-100', trend: 'Disabled' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-5 transition-all duration-250 hover:shadow-[0_15px_40px_rgba(15,23,42,0.08)] hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 m-0 flex items-center gap-2 mb-3">
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                  {card.label}
                </p>
                <h4 className="text-2xl font-bold text-gray-900 m-0 flex items-center gap-2">
                  {card.value}
                  <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 bg-gray-50 text-gray-500">
                    {card.trend}
                  </span>
                </h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        {/* Filter Bar */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search subcategories..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-60 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250 bg-white"
              >
                <option value="">All Categories</option>
                {categories.filter(c => c.status).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {filteredSubCategories.length} subcategor{filteredSubCategories.length !== 1 ? 'ies' : 'y'}
            </span>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#0F9291] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {['Sub Category', 'Category', 'Code', 'Description', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSubCategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm mb-1">No subcategories found</p>
                      <p className="text-gray-300 text-xs">Click "Add Sub Category" to create one</p>
                    </td>
                  </tr>
                ) : (
                  filteredSubCategories.map(sub => {
                    const catName = categories.find(c => c.id === sub.categoryId)?.name || '';
                    const icon = CATEGORY_ICONS_MAP[catName] || '📁';
                    const colorClass = CATEGORY_COLORS[catName] || 'bg-gray-100 text-gray-600';
                    return (
                      <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors duration-250">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className={`flex items-center justify-center w-10 h-10 rounded-xl text-base shrink-0 ${colorClass}`}>
                              {icon}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 m-0">{sub.name}</p>
                              <p className="text-[11px] text-gray-400 m-0 mt-0.5">Created {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs shrink-0 ${colorClass}`}>
                              {icon}
                            </span>
                            <span className="text-sm text-gray-700">{catName || '-'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <code className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{sub.categoryCode}</code>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                          {sub.description || '-'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${
                            sub.status
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sub.status ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {sub.status ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(sub)}
                              className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-[#0F9291] hover:bg-[#0F9291]/10 transition-all duration-250"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(sub.id)}
                              className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-250"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <SubCategoryModal
          subCategory={editingSubCategory}
          categories={categories}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

function SubCategoryModal({
  subCategory,
  categories,
  onClose,
  onSave,
}: {
  subCategory: SubCategory | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: subCategory?.name || '',
    categoryId: subCategory?.categoryId || '',
    categoryCode: subCategory?.categoryCode || '',
    description: subCategory?.description || '',
    image: subCategory?.image || '',
    status: subCategory?.status ?? true,
  });
  const [imagePreview, setImagePreview] = useState(subCategory?.image || '');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData({ ...formData, image: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (subCategory) {
        await SubCategoriesAPI.update(subCategory.id, formData);
      } else {
        await SubCategoriesAPI.create(formData);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save sub category:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slideUp" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900 m-0">
            {subCategory ? 'Edit Sub Category' : 'Add Sub Category'}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all duration-250"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Add Image</label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(''); setFormData({ ...formData, image: '' }); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm transition-all duration-250"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50">
                    <span className="text-gray-400 text-xs">No image</span>
                  </div>
                )}
                <label className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0F9291] hover:bg-teal-700 rounded-xl cursor-pointer transition-all duration-250 shadow-sm hover:shadow-md active:scale-95">
                  <Upload className="w-4 h-4" /> Upload Image
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">JPEG, PNG up to 2 MB</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250 bg-white"
                value={formData.categoryId}
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.filter(c => c.status).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Sub Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Paracetamol, Amoxicillin"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Category Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CEM-OPC, STL-TMT"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250"
                value={formData.categoryCode}
                onChange={e => setFormData({ ...formData, categoryCode: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Brief description of this subcategory..."
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250 resize-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: !formData.status })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-250 ${
                    formData.status ? 'bg-[#0F9291]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-250 ${
                    formData.status ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-sm text-gray-600 ml-3">{formData.status ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-250"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0F9291] hover:bg-teal-700 rounded-xl transition-all duration-250 shadow-sm hover:shadow-md active:scale-95"
            >
              {subCategory ? 'Update Sub Category' : 'Create Sub Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
