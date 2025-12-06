'use client';

import { useState, useEffect } from 'react';
import { SubCategory, Category } from '@/types';
import { SubCategoriesAPI, CategoriesAPI } from '@/lib/api';
import { Search, Edit2, Trash2, X, Upload } from 'lucide-react';

export default function SubCategoriesPage() {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    loadSubCategories();
    loadCategories();
  }, []);

  const loadSubCategories = async () => {
    try {
      setIsLoading(true);
      // const data = await SubCategoriesAPI.getAll();
      // setSubCategories(data);

      // Mock data for demonstration
      const mockSubCategories: SubCategory[] = [
        {
          id: '1',
          name: 'Laptops',
          categoryId: '1',
          category: { id: '1', name: 'Electronics', slug: 'electronics', status: true },
          categoryCode: 'ELC-LAP',
          description: 'Portable computers including notebooks and ultrabooks',
          status: true,
          createdAt: '2024-02-01',
        },
        {
          id: '2',
          name: 'Smartphones',
          categoryId: '1',
          category: { id: '1', name: 'Electronics', slug: 'electronics', status: true },
          categoryCode: 'ELC-PHN',
          description: 'Mobile phones and accessories',
          status: true,
          createdAt: '2024-02-02',
        },
        {
          id: '3',
          name: 'Tablets',
          categoryId: '1',
          category: { id: '1', name: 'Electronics', slug: 'electronics', status: true },
          categoryCode: 'ELC-TAB',
          description: 'Touch screen tablets and iPads',
          status: true,
          createdAt: '2024-02-03',
        },
        {
          id: '4',
          name: 'Office Desks',
          categoryId: '2',
          category: { id: '2', name: 'Furniture', slug: 'furniture', status: true },
          categoryCode: 'FUR-DSK',
          description: 'Work desks and computer tables',
          status: true,
          createdAt: '2024-02-04',
        },
        {
          id: '5',
          name: 'Office Chairs',
          categoryId: '2',
          category: { id: '2', name: 'Furniture', slug: 'furniture', status: true },
          categoryCode: 'FUR-CHR',
          description: 'Ergonomic and executive office chairs',
          status: true,
          createdAt: '2024-02-05',
        },
        {
          id: '6',
          name: 'Storage Cabinets',
          categoryId: '2',
          category: { id: '2', name: 'Furniture', slug: 'furniture', status: true },
          categoryCode: 'FUR-CAB',
          description: 'Filing cabinets and storage solutions',
          status: false,
          createdAt: '2024-02-06',
        },
        {
          id: '7',
          name: 'Computer Accessories',
          categoryId: '3',
          category: { id: '3', name: 'Accessories', slug: 'accessories', status: true },
          categoryCode: 'ACC-CMP',
          description: 'Keyboards, mice, and other peripherals',
          status: true,
          createdAt: '2024-02-07',
        },
      ];
      setSubCategories(mockSubCategories);
    } catch (error) {
      console.error('Failed to load sub categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // const data = await CategoriesAPI.getAll();
      // setCategories(data);
      const mockCategories: Category[] = [
        { id: '1', name: 'Electronics', slug: 'electronics', status: true },
        { id: '2', name: 'Furniture', slug: 'furniture', status: true },
        { id: '3', name: 'Accessories', slug: 'accessories', status: true },
      ];
      setCategories(mockCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sub category?')) return;

    try {
      await SubCategoriesAPI.delete(id);
      loadSubCategories();
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

  const filteredSubCategories = subCategories.filter(subCategory => {
    const matchesSearch = subCategory.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === '' || subCategory.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Sub Category</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your sub categories</p>
        </div>

        {/* Search and Add Button */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center gap-4">
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
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 font-medium"
              >
                <span className="text-lg">+</span> Add Sub Category
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Sub Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Category Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubCategories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No sub categories found. Click "Add Sub Category" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredSubCategories.map((subCategory) => (
                    <tr key={subCategory.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {subCategory.image ? (
                          <img
                            src={subCategory.image}
                            alt={subCategory.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No img</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {subCategory.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {subCategory.category?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {subCategory.categoryCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {subCategory.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          subCategory.status
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subCategory.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(subCategory)}
                          className="text-gray-600 hover:text-gray-900 mr-3"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(subCategory.id)}
                          className="text-gray-600 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <SubCategoryModal
          subCategory={editingSubCategory}
          categories={categories}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadSubCategories();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {subCategory ? 'Edit Sub Category' : 'Add Sub Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Image
              </label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setFormData({ ...formData, image: '' });
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No image</span>
                  </div>
                )}
                <label className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 cursor-pointer font-medium">
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">JPEG, PNG up to 2 MB</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">Select</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sub Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={formData.categoryCode}
                onChange={(e) => setFormData({ ...formData, categoryCode: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: !formData.status })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.status ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.status ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
            >
              {subCategory ? 'Save Changes' : 'Add Sub Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
