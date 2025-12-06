'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CategoriesAPI, SubCategoriesAPI, BrandsAPI, UnitsAPI } from '@/lib/api';

export default function AddProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'warranties' | 'manufacturer' | 'expiry'>('warranties');

  // Dropdown options state
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    // Product Information
    storeId: '',
    warehouseId: '',
    productName: '',
    slug: '',
    sku: '',
    sellingType: '',
    categoryId: '',
    subCategoryId: '',
    brandId: '',
    unitId: '',
    barcodeSymbology: '',
    itemBarcode: '',

    // Description
    description: '',

    // Pricing & Stocks
    productType: 'single' as 'single' | 'variable',
    quantity: 0,
    price: 0,
    taxType: '',
    tax: 0,
    discountType: '',
    discountValue: 0,

    // Images
    images: [] as string[],

    // Custom Fields
    warrantyId: '',
    manufacturerId: '',
    manufacturedDate: '',
    expiryDate: '',
  });

  useEffect(() => {
    loadDropdownData();
  }, []);

  const loadDropdownData = async () => {
    try {
      // Load categories, brands, units, etc.
      // const categoriesData = await CategoriesAPI.getAll();
      // setCategories(categoriesData);

      // Mock data for now
      setCategories([
        { id: '1', name: 'Electronics' },
        { id: '2', name: 'Computers' },
        { id: '3', name: 'Shoes' },
      ]);

      setBrands([
        { id: '1', name: 'Apple' },
        { id: '2', name: 'Lenovo' },
        { id: '3', name: 'Nike' },
      ]);

      setUnits([
        { id: '1', name: 'Piece', shortName: 'Pc' },
        { id: '2', name: 'Kilogram', shortName: 'Kg' },
      ]);
    } catch (error) {
      console.error('Failed to load dropdown data:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateSKU = () => {
    const sku = 'PT' + String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    handleInputChange('sku', sku);
  };

  const generateBarcode = () => {
    const barcode = String(Math.floor(Math.random() * 1000000000000)).padStart(12, '0');
    handleInputChange('itemBarcode', barcode);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Handle image upload logic here
      const imageUrls = Array.from(files).map(file => URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, images: [...prev.images, ...imageUrls] }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Submit to API
      console.log('Form data:', formData);
      // await ProductsAPI.create(formData);

      router.push('/dashboard/products');
    } catch (error) {
      console.error('Failed to create product:', error);
    }
  };

  return (
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Product</h1>
          <p className="text-sm text-gray-500 mt-1">Create new product</p>
        </div>
        <Link
          href="/dashboard/products"
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
        >
          ← Back to Product
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Information Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <span className="text-orange-500 mr-2">⊙</span>
            <h2 className="text-lg font-semibold text-gray-900">Product Information</h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Store */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.storeId}
                onChange={(e) => handleInputChange('storeId', e.target.value)}
              >
                <option value="">Select</option>
                <option value="1">Freshmart</option>
                <option value="2">Store 2</option>
              </select>
            </div>

            {/* Warehouse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warehouse <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.warehouseId}
                onChange={(e) => handleInputChange('warehouseId', e.target.value)}
              >
                <option value="">Select</option>
                <option value="1">Warehouse 1</option>
                <option value="2">Warehouse 2</option>
              </select>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                />
                <button
                  type="button"
                  onClick={generateSKU}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  Generate
                </button>
              </div>
            </div>

            {/* Selling Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selling Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.sellingType}
                onChange={(e) => handleInputChange('sellingType', e.target.value)}
              >
                <option value="">Select</option>
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                >
                  <option value="">Select</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="px-4 py-2 text-orange-500 border border-orange-500 rounded-md hover:bg-orange-50"
                >
                  + Add New
                </button>
              </div>
            </div>

            {/* Sub Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sub Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.subCategoryId}
                onChange={(e) => handleInputChange('subCategoryId', e.target.value)}
              >
                <option value="">Select</option>
                <option value="1">Sub Category 1</option>
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.brandId}
                onChange={(e) => handleInputChange('brandId', e.target.value)}
              >
                <option value="">Select</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.unitId}
                onChange={(e) => handleInputChange('unitId', e.target.value)}
              >
                <option value="">Select</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>

            {/* Barcode Symbology */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode Symbology <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.barcodeSymbology}
                onChange={(e) => handleInputChange('barcodeSymbology', e.target.value)}
              >
                <option value="">Select</option>
                <option value="CODE128">CODE 128</option>
                <option value="CODE39">CODE 39</option>
                <option value="EAN13">EAN-13</option>
                <option value="UPC">UPC</option>
              </select>
            </div>

            {/* Item Barcode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Barcode <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.itemBarcode}
                  onChange={(e) => handleInputChange('itemBarcode', e.target.value)}
                />
                <button
                  type="button"
                  onClick={generateBarcode}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="px-6 pb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="border border-gray-300 rounded-md">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
                <select className="text-sm border-none bg-transparent">
                  <option>Normal</option>
                  <option>Heading 1</option>
                  <option>Heading 2</option>
                </select>
                <button type="button" className="p-1 hover:bg-gray-200 rounded">
                  <strong>B</strong>
                </button>
                <button type="button" className="p-1 hover:bg-gray-200 rounded">
                  <em>I</em>
                </button>
                <button type="button" className="p-1 hover:bg-gray-200 rounded">
                  <u>U</u>
                </button>
                <button type="button" className="p-1 hover:bg-gray-200 rounded">
                  🔗
                </button>
              </div>
              <textarea
                className="w-full px-3 py-2 border-none focus:outline-none focus:ring-0"
                rows={4}
                placeholder="Maximum 60 Words"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Pricing & Stocks Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <span className="text-orange-500 mr-2">⊙</span>
            <h2 className="text-lg font-semibold text-gray-900">Pricing & Stocks</h2>
          </div>

          <div className="p-6">
            {/* Product Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Product Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="productType"
                    value="single"
                    checked={formData.productType === 'single'}
                    onChange={(e) => handleInputChange('productType', e.target.value)}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="ml-2">Single Product</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="productType"
                    value="variable"
                    checked={formData.productType === 'variable'}
                    onChange={(e) => handleInputChange('productType', e.target.value)}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="ml-2">Variable Product</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                />
              </div>

              {/* Tax Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.taxType}
                  onChange={(e) => handleInputChange('taxType', e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="exclusive">Exclusive</option>
                  <option value="inclusive">Inclusive</option>
                </select>
              </div>

              {/* Tax */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.tax}
                  onChange={(e) => handleInputChange('tax', parseFloat(e.target.value))}
                >
                  <option value="">Select</option>
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="10">10%</option>
                  <option value="18">18%</option>
                </select>
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.discountType}
                  onChange={(e) => handleInputChange('discountType', e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.discountValue}
                  onChange={(e) => handleInputChange('discountValue', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Images Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>
          </div>

          <div className="p-6">
            <div className="flex gap-4">
              {/* Add Images Button */}
              <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50">
                <span className="text-3xl text-gray-400">+</span>
                <span className="text-xs text-gray-500 mt-1">Add Images</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>

              {/* Display uploaded images */}
              {formData.images.map((image, index) => (
                <div key={index} className="relative w-32 h-32 border border-gray-200 rounded-lg overflow-hidden">
                  <img src={image} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Fields Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <span className="text-orange-500 mr-2">≡</span>
            <h2 className="text-lg font-semibold text-gray-900">Custom Fields</h2>
          </div>

          <div className="p-6">
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b">
              <button
                type="button"
                onClick={() => setActiveTab('warranties')}
                className={`pb-2 px-1 ${activeTab === 'warranties' ? 'border-b-2 border-orange-500 text-orange-500' : 'text-gray-600'}`}
              >
                Warranties
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manufacturer')}
                className={`pb-2 px-1 ${activeTab === 'manufacturer' ? 'border-b-2 border-orange-500 text-orange-500' : 'text-gray-600'}`}
              >
                Manufacturer
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('expiry')}
                className={`pb-2 px-1 ${activeTab === 'expiry' ? 'border-b-2 border-orange-500 text-orange-500' : 'text-gray-600'}`}
              >
                Expiry
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'warranties' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.warrantyId}
                    onChange={(e) => handleInputChange('warrantyId', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="1">1 Year</option>
                    <option value="2">2 Years</option>
                    <option value="3">3 Years</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'manufacturer' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manufacturer <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.manufacturerId}
                    onChange={(e) => handleInputChange('manufacturerId', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="1">Manufacturer 1</option>
                    <option value="2">Manufacturer 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manufactured Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.manufacturedDate}
                    onChange={(e) => handleInputChange('manufacturedDate', e.target.value)}
                  />
                </div>
              </div>
            )}

            {activeTab === 'expiry' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry On <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/products')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
          >
            Add Product
          </button>
        </div>
      </form>
    </div>
  );
}
