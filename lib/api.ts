// API configuration for Spring Boot REST API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';

// Spring Boot Response wrapper: { status, message, data?, categories?, category?, ... }
interface ApiResponse {
  status: number;
  message: string;
  token?: string;
  role?: string;
  timestamp?: string;
  [key: string]: any;
}

export class ApiClient {
  private static getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      const body = await response.text();
      throw new Error(body || `API Error: ${response.status}`);
    }

    return response.json();
  }

  static get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static post<T>(endpoint: string, data?: any): Promise<T> {
    const body = data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined);
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  static put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  }

  static delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Extract entity list from response wrapper
function extractList(res: any, key: string) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res[key])) return res[key];
  if (res && res.data && Array.isArray(res.data)) return res.data;
  return [];
}

function extractSingle(res: any, key: string) {
  if (res && res[key]) return res[key];
  if (res && res.data) return res.data;
  return res;
}

// ---- Auth ----
export const AuthAPI = {
  login: (email: string, password: string) =>
    ApiClient.post<ApiResponse>('/auth/login', { email, password }),
  register: (data: any) =>
    ApiClient.post<ApiResponse>('/auth/register', data),
};

// ---- Categories ----
export const CategoriesAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/categories/all');
    return { data: extractList(res, 'categories') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/categories/${id}`);
    return extractSingle(res, 'category');
  },
  create: (data: any) => ApiClient.post('/categories/add', data),
  update: (id: string, data: any) => ApiClient.put(`/categories/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/categories/delete/${id}`),
};

// ---- Sub Categories ----
export const SubCategoriesAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/sub-categories/all');
    return { data: extractList(res, 'subCategories') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/sub-categories/${id}`);
    return extractSingle(res, 'subCategory');
  },
  create: (data: any) => ApiClient.post('/sub-categories/add', data),
  update: (id: string, data: any) => ApiClient.put(`/sub-categories/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/sub-categories/delete/${id}`),
};

// ---- Brands ----
export const BrandsAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/brands/all');
    return { data: extractList(res, 'brands') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/brands/${id}`);
    return extractSingle(res, 'brand');
  },
  create: (data: any) => ApiClient.post('/brands/add', data),
  update: (id: string, data: any) => ApiClient.put(`/brands/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/brands/delete/${id}`),
};

// ---- Units ----
export const UnitsAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/units/all');
    return { data: extractList(res, 'units') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/units/${id}`);
    return extractSingle(res, 'unit');
  },
  create: (data: any) => ApiClient.post('/units/add', data),
  update: (id: string, data: any) => ApiClient.put(`/units/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/units/delete/${id}`),
};

// ---- Variants ----
export const VariantsAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/variants/all');
    return { data: extractList(res, 'variants') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/variants/${id}`);
    return extractSingle(res, 'variant');
  },
  create: (data: any) => ApiClient.post('/variants/add', data),
  update: (id: string, data: any) => ApiClient.put(`/variants/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/variants/delete/${id}`),
};

// ---- Products ----
export const ProductsAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/products/all');
    return { data: extractList(res, 'products') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/products/${id}`);
    return extractSingle(res, 'product');
  },
  create: (data: any) => ApiClient.post('/products/add', data),
  update: (id: string, data: any) => {
    if (data instanceof FormData) {
      data.append('productId', id);
      return ApiClient.post('/products/update', data);
    }
    return ApiClient.put('/products/update', { ...data, productId: id });
  },
  delete: (id: string) => ApiClient.delete(`/products/delete/${id}`),
};

// ---- Suppliers ----
export const SuppliersAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/suppliers/all');
    return { data: extractList(res, 'suppliers') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/suppliers/${id}`);
    return extractSingle(res, 'supplier');
  },
  create: (data: any) => ApiClient.post('/suppliers/add', data),
  update: (id: string, data: any) => ApiClient.put(`/suppliers/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/suppliers/delete/${id}`),
};

// ---- Warehouses ----
export const WarehousesAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/warehouses/all');
    return { data: extractList(res, 'warehouses') };
  },
  create: (data: any) => ApiClient.post('/warehouses/add', data),
  update: (id: string, data: any) => ApiClient.put(`/warehouses/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/warehouses/delete/${id}`),
};

// ---- Equipment ----
export const EquipmentAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/equipment/all');
    return { data: extractList(res, 'equipments') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/equipment/${id}`);
    return extractSingle(res, 'equipment');
  },
  create: (data: any) => ApiClient.post('/equipment/add', data),
  update: (id: string, data: any) => ApiClient.put(`/equipment/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/equipment/delete/${id}`),
};

// ---- Users ----
export const UsersAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/users/all');
    return { data: extractList(res, 'users') };
  },
  update: (id: string, data: any) => ApiClient.put(`/users/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/users/delete/${id}`),
  getCurrent: () => ApiClient.get<UserResponse>('/users/current'),
};
interface UserResponse { id: number; name: string; email: string; role: string; phoneNumber?: string; }

// ---- Transactions ----
export const TransactionsAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/transactions/all');
    return { data: extractList(res, 'transactions') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/transactions/${id}`);
    return extractSingle(res, 'transaction');
  },
  getByMonth: async (month: number, year: number) => {
    const res = await ApiClient.get<ApiResponse>(`/transactions/by-month-year?month=${month}&year=${year}`);
    return { data: extractList(res, 'transactions') };
  },
  purchase: (data: any) => ApiClient.post('/transactions/purchase', data),
  sell: (data: any) => ApiClient.post('/transactions/sell', data),
  returnToSupplier: (data: any) => ApiClient.post('/transactions/return', data),
  updateStatus: (id: string, status: string) => ApiClient.put(`/transactions/update/${id}`, { status }),
};
