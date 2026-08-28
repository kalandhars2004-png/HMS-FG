// Type definitions for the application

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  branchId?: string | null;
  branchName?: string | null;
  organizationId?: string | null;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  type: 'RETAIL' | 'WAREHOUSE' | 'CENTRAL_WAREHOUSE';
  status: 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  operatingHours?: string;
  managerId?: string | null;
  managerName?: string | null;
  contactPerson?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug?: string;
  categoryId?: string;
  category?: Category;
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
  pluralName?: string;
  symbol?: string;
  description?: string;
  category?: string;
  unitType?: string;
  measurementSystem?: string;
  baseUnit?: string;
  conversionValue?: number | string;
  conversionRate?: number | string;
  decimalPlaces?: number;
  displayFormat?: string;
  applicableFor?: string;
  isDefault?: boolean;
  usesPurchases?: boolean;
  usesSales?: boolean;
  usesInventory?: boolean;
  usesManufacturing?: boolean;
  usesPrescriptions?: boolean;
  usesReports?: boolean;
  usesBarcodePrinting?: boolean;
  archived?: boolean;
  usageCount?: number;
  createdBy?: string;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Variant {
  id: string;
  name: string;
  attributeName: string;
  description?: string;
  createdAt?: string;
}

export interface Rack {
  id: string;
  code: string;
  category: string;
  rowsCount: number;
  columns: number;
  bins: number;
  alertThreshold: number;
  temperature?: string;
  status?: string;
  assignedMedicines?: number;
  capacityPercent?: number;
  createdAt?: string;
}
