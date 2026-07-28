// Type definitions for the application

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug?: string;
  categoryId?: string;
  category?: Category;
  subCategoryId?: string;
  subCategory?: SubCategory;
  brandId?: string;
  brand?: Brand;
  unitId?: string;
  unit?: Unit;
  storeId?: string;
  warehouseId?: string;
  sellingType?: string;
  barcodeSymbology?: string;
  itemBarcode?: string;
  productType: 'single' | 'variable';
  price: number;
  quantity: number;
  tax?: number;
  taxType?: string;
  discountType?: string;
  discountValue?: number;
  description?: string;
  images?: string[];
  warrantyId?: string;
  manufacturerId?: string;
  manufacturedDate?: string;
  expiryDate?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  code?: string;
  description?: string;
  status: boolean;
  icon?: string;
  color?: string;
  displayOrder?: number;
  parentId?: string;
  createdAt?: string;
}

export interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
  category?: Category;
  categoryCode: string;
  description?: string;
  image?: string;
  status: boolean;
  createdAt?: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  image?: string;
  status: boolean;
  createdAt?: string;
}

export interface Unit {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  status: boolean;
  createdAt?: string;
}

export interface Variant {
  id: string;
  name: string;
  attributeName: string;
  description?: string;
  createdAt?: string;
}
