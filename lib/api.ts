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
    const body = data instanceof FormData ? data : JSON.stringify(data);
    const headers: Record<string, string> = {};
    if (!(data instanceof FormData)) headers['Content-Type'] = 'application/json';
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
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
  filter: async (params: Record<string, string | number | boolean | string[] | undefined>) => {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0))
      .map(([k, v]) => {
        if (Array.isArray(v)) return `${encodeURIComponent(k)}=${encodeURIComponent(v.join(','))}`;
        return `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`;
      })
      .join('&');
    const res = await ApiClient.get<ApiResponse>(`/units${qs ? `?${qs}` : ''}`);
    return {
      data: extractList(res, 'units'),
      totalElements: res.totalElements ?? res.data?.totalElements ?? 0,
      totalPages: res.totalPages ?? 1,
      currentPage: res.currentPage ?? 1,
      pageSize: res.pageSize ?? 20,
    };
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
      return ApiClient.put('/products/update', data);
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
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/warehouses/${id}`);
    return extractSingle(res, 'warehouse');
  },
  create: (data: any) => ApiClient.post('/warehouses/add', data),
  update: (id: string, data: any) => ApiClient.put(`/warehouses/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/warehouses/delete/${id}`),
};

// ---- Racks ----
export const RacksAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/racks/all');
    return { data: extractList(res, 'racks') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/racks/${id}`);
    return extractSingle(res, 'rack');
  },
  create: (data: any) => ApiClient.post('/racks/add', data),
  update: (id: string, data: any) => ApiClient.put(`/racks/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/racks/delete/${id}`),
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

// ---- Stock Transfers ----
export const StockTransfersAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/stock-transfers/all');
    return { data: extractList(res, 'stockTransfers') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/stock-transfers/${id}`);
    return extractSingle(res, 'stockTransfer');
  },
  create: (data: any) => ApiClient.post('/stock-transfers/add', data),
  update: (id: string, data: any) => ApiClient.put(`/stock-transfers/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/stock-transfers/delete/${id}`),
};

// ---- Stock Adjustments ----
export const StockAdjustmentsAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/stock-adjustments/all');
    return { data: extractList(res, 'stockAdjustments') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/stock-adjustments/${id}`);
    return extractSingle(res, 'stockAdjustment');
  },
  create: (data: any) => ApiClient.post('/stock-adjustments/add', data),
  update: (id: string, data: any) => ApiClient.put(`/stock-adjustments/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/stock-adjustments/delete/${id}`),
};

// ---- Purchase Returns ----
export const PurchaseReturnsAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/purchase-returns/all');
    return { data: extractList(res, 'purchaseReturns') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/purchase-returns/${id}`);
    return extractSingle(res, 'purchaseReturn');
  },
  create: (data: any) => ApiClient.post('/purchase-returns/add', data),
  update: (id: string, data: any) => ApiClient.put(`/purchase-returns/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/purchase-returns/delete/${id}`),
};

// ---- Batches ----
export const BatchesAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/batches/all');
    return { data: extractList(res, 'batches') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/batches/${id}`);
    return extractSingle(res, 'batch');
  },
  create: (data: any) => ApiClient.post('/batches/add', data),
  update: (id: string, data: any) => ApiClient.put(`/batches/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/batches/delete/${id}`),
  getExpiringBefore: async (date: string) => {
    const res = await ApiClient.get<ApiResponse>(`/batches/expiring-before?date=${date}`);
    return { data: extractList(res, 'batches') };
  },
};
// ---- Sales Orders ----
export const InvoicesAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/invoices/all');
    return { data: extractList(res, 'invoices') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/invoices/${id}`);
    return extractSingle(res, 'invoice');
  },
  create: (data: any) => ApiClient.post('/invoices/add', data),
  generateFromSO: (soId: string) => ApiClient.post(`/invoices/from-so/${soId}`, {}),
  updateStatus: (id: string, status: string) => ApiClient.put(`/invoices/status/${id}`, { status }),
  delete: (id: string) => ApiClient.delete(`/invoices/delete/${id}`),
};

export const SalesOrdersAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/sales-orders/all');
    return { data: extractList(res, 'salesOrders') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/sales-orders/${id}`);
    return extractSingle(res, 'salesOrder');
  },
  create: (data: any) => ApiClient.post('/sales-orders/add', data),
  updateStatus: (id: string, status: string) => ApiClient.put(`/sales-orders/status/${id}`, { status }),
  updatePayment: (id: string, paymentStatus: string) => ApiClient.put(`/sales-orders/payment/${id}`, { paymentStatus }),
  delete: (id: string) => ApiClient.delete(`/sales-orders/delete/${id}`),
};

// ---- Stock Counts (Cycle Counting) ----
export const StockCountsAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/stock-counts/all');
    return { data: extractList(res, 'stockCounts') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/stock-counts/${id}`);
    return extractSingle(res, 'stockCount');
  },
  create: (data: any) => ApiClient.post('/stock-counts/add', data),
  updateStatus: (id: string, status: string) => ApiClient.put(`/stock-counts/status/${id}`, { status }),
  updateItemCount: (countId: string, itemId: string, data: { actualQuantity: number }) =>
    ApiClient.put(`/stock-counts/${countId}/items/${itemId}`, data),
  completeCount: (countId: string) => ApiClient.post(`/stock-counts/${countId}/complete`, {}),
  delete: (id: string) => ApiClient.delete(`/stock-counts/delete/${id}`),
};

export const ReorderAPI = {
  setPoint: (data: any) => ApiClient.post('/reorder/points/add', data),
  getPoints: async () => {
    const res = await ApiClient.get<ApiResponse>('/reorder/points');
    return { data: extractList(res, 'reorderPoints') };
  },
  getPoint: async (productId: string) => {
    const res = await ApiClient.get<ApiResponse>(`/reorder/points/${productId}`);
    return extractSingle(res, 'reorderPoint');
  },
  getNeedsReorder: async () => {
    const res = await ApiClient.get<ApiResponse>('/reorder/needs-reorder');
    return { data: extractList(res, 'reorderPoints') };
  },
  getForecast: async () => {
    const res = await ApiClient.get<ApiResponse>('/reorder/forecast');
    return { data: extractList(res, 'forecastResults') };
  },
  deletePoint: (id: string) => ApiClient.delete(`/reorder/points/${id}`),
};

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

export const POSAPI = {
  openSession: async (data: any) => {
    const res = await ApiClient.post<ApiResponse>('/pos/sessions/open', data);
    return extractSingle(res, 'posSession');
  },
  closeSession: (id: string, closingBalance: number) =>
    ApiClient.put(`/pos/sessions/${id}/close`, { closingBalance }),
  getActiveSession: async () => {
    const res = await ApiClient.get<ApiResponse>('/pos/sessions/active');
    return extractSingle(res, 'posSession');
  },
  getSessions: async () => {
    const res = await ApiClient.get<ApiResponse>('/pos/sessions');
    return { data: extractList(res, 'posSessions') };
  },
  addTransaction: (sessionId: string, data: any) =>
    ApiClient.post(`/pos/sessions/${sessionId}/transaction`, data),
  getTransactions: async (sessionId: string) => {
    const res = await ApiClient.get<ApiResponse>(`/pos/sessions/${sessionId}/transactions`);
    return { data: extractList(res, 'posTransactions') };
  },
  voidTransaction: (id: string) => ApiClient.put(`/pos/transactions/${id}/void`, {}),
  getDailySales: async () => {
    const res = await ApiClient.get<ApiResponse>('/pos/daily-sales');
    return res.data;
  },
};

export const AuditAPI = {
  getAll: async (params?: { entityType?: string; entityId?: string }) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await ApiClient.get<ApiResponse>(`/audit/all${query}`);
    return { data: extractList(res, 'auditLogs') };
  },
  getByEntityType: async (entityType: string) => {
    const res = await ApiClient.get<ApiResponse>(`/audit/type/${entityType}`);
    return { data: extractList(res, 'auditLogs') };
  },
  cleanOldLogs: (days: number) => ApiClient.delete(`/audit/clean?days=${days}`),
};
