// API configuration for Spring Boot REST API
import { notifyLoaderBegin, notifyLoaderEnd, isSilentScopeActive } from '@/components/ui/global-loader/loader-bridge';

const _rawBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api').replace(/\/+$/, '');
const API_BASE_URL = _rawBase.endsWith('/api') ? _rawBase : `${_rawBase}/api`;

// Spring Boot Response wrapper: { status, message, data?, categories?, category?, ... }
// Dynamic envelope — any intentional for flexible brand/warehouse/etc keys
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  private static getBranchId(): string | null {
    if (typeof window === 'undefined') return null;
    // Branch context is stored by branch-context; fallback to user.branchId
    const ctxBranch = localStorage.getItem('selectedBranchId');
    if (ctxBranch) return ctxBranch;
    try {
      const u = localStorage.getItem('user');
      if (u) {
        const parsed = JSON.parse(u);
        return parsed.branchId ?? null;
      }
    } catch {}
    return null;
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const branchId = this.getBranchId();
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string>),
    };
    // Opt out of the global overlay with { headers: { 'X-Silent': '1' } } or by
    // wrapping the call in beginSilentScope()/endSilentScope() — used by
    // background polling so it never flashes over user actions.
    const silent = headers['X-Silent'] === '1' || isSilentScopeActive();
    delete headers['X-Silent'];
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (branchId) headers['X-Branch-Id'] = String(branchId);

    if (!silent) notifyLoaderBegin();
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers, credentials: 'include' });

      if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('selectedBranchId');
          sessionStorage.removeItem('ims.stockAlert.seen');
          try { document.cookie = 'authToken=; Path=/; Max-Age=0; SameSite=Lax'; } catch {}
          // Also clear httpOnly cookie via backend (best-effort, no await)
          try { fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' }); } catch {}
          // Avoid redirect loop if already on /login
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        // Try to parse structured error: {message, error, msg} or plain text
        let errorMessage = `API Error: ${response.status}`;
        try {
          const text = await response.text();
          if (text) {
            try {
              const json = JSON.parse(text);
              errorMessage = json.message || json.error || json.msg || text;
            } catch {
              errorMessage = text;
            }
          }
        } catch {}
        throw new Error(errorMessage);
      }

      // Handle 204 No Content or empty body (e.g., DELETE)
      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      if (!text) return {} as T;
      if (contentType.includes('application/json')) {
        try {
          return JSON.parse(text) as T;
        } catch {
          return text as unknown as T;
        }
      }
      try {
        return JSON.parse(text) as T;
      } catch {
        return text as unknown as T;
      }
    } finally {
      // Always release — success, error, or network failure never leave the loader stuck.
      if (!silent) notifyLoaderEnd();
    }
  }

  static get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static post<T>(endpoint: string, data?: unknown): Promise<T> {
    const body = data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined);
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  static put<T>(endpoint: string, data: unknown): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    const headers: Record<string, string> = {};
    if (!(data instanceof FormData)) headers['Content-Type'] = 'application/json';
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  static delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Extract entity list from response wrapper — raw JSON boundary, any is intentional
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractList(res: any, key: string): any[] {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res[key])) return res[key];
  if (res && res.data !== undefined && Array.isArray(res.data)) return res.data;
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSingle(res: any, key: string): any {
  if (res && res[key] !== undefined) return res[key];
  if (res && res.data !== undefined) return res.data;
  return res;
}

// ---- Auth ----
export const AuthAPI = {
  login: (email: string, password: string) =>
    ApiClient.post<ApiResponse>('/auth/login', { email, password }),
  register: (data: unknown) =>
    ApiClient.post<ApiResponse>('/auth/register', data),
  logout: () =>
    ApiClient.post<ApiResponse>('/auth/logout', {}),
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
  create: (data: unknown) => ApiClient.post('/categories/add', data),
  update: (id: string, data: unknown) => ApiClient.put(`/categories/update/${id}`, data),
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
  create: (data: unknown) => ApiClient.post('/brands/add', data),
  update: (id: string, data: unknown) => ApiClient.put(`/brands/update/${id}`, data),
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
  create: (data: unknown) => ApiClient.post('/units/add', data),
  update: (id: string, data: unknown) => ApiClient.put(`/units/update/${id}`, data),
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
  create: (data: unknown) => ApiClient.post('/variants/add', data),
  update: (id: string, data: unknown) => ApiClient.put(`/variants/update/${id}`, data),
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
  create: (data: unknown) => ApiClient.post('/products/add', data),
  update: (id: string, data: unknown) => {
    if (data instanceof FormData) {
      data.append('productId', id);
      return ApiClient.put('/products/update', data);
    }
    return ApiClient.put('/products/update', { ...(data as Record<string, unknown>), productId: id });
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
  create: (data: unknown) => ApiClient.post('/suppliers/add', data),
  update: (id: string, data: unknown) => ApiClient.put(`/suppliers/update/${id}`, data),
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
  create: (data: unknown) => ApiClient.post('/warehouses/add', data),
  update: (id: string, data: unknown) => ApiClient.put(`/warehouses/update/${id}`, data),
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
  create: (data: unknown) => ApiClient.post('/racks/add', data),
  update: (id: string, data: unknown) => ApiClient.put(`/racks/update/${id}`, data),
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
  create: (data: unknown) => ApiClient.post('/equipment/add', data),
  update: (id: string, data: unknown) => ApiClient.put(`/equipment/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/equipment/delete/${id}`),
};

// ---- Users ----
export const UsersAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/users/all');
    return { data: extractList(res, 'users') };
  },
  update: (id: string, data: unknown) => ApiClient.put(`/users/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/users/delete/${id}`),
  // Returns the standard envelope with a UserDTO under `user`. It used to return the
  // raw JPA entity — including the password hash — at the top level.
  getCurrent: async (): Promise<UserResponse> => {
    const res = await ApiClient.get<ApiResponse>('/users/current');
    return extractSingle(res, 'user');
  },
  // Staff who can bill at the POS ("Who is Billing?" popup), scoped to current branch.
  getBillers: async () => {
    const res = await ApiClient.get<ApiResponse>('/users/billers');
    return { data: extractList(res, 'users') };
  },
};
interface UserResponse { id: number; name: string; email: string; role: string; phoneNumber?: string; branchId?: number | null; branchName?: string | null; organizationId?: number | null; }

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
  create: (data: unknown) => ApiClient.post('/stock-transfers/add', data),
  update: (id: string, data: unknown) => ApiClient.put(`/stock-transfers/update/${id}`, data),
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
  create: (data: unknown) => ApiClient.post('/stock-adjustments/add', data),
  update: (id: string, data: unknown) => ApiClient.put(`/stock-adjustments/update/${id}`, data),
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
  create: (data: unknown) => ApiClient.post('/purchase-returns/add', data),
  update: (id: string, data: unknown) => ApiClient.put(`/purchase-returns/update/${id}`, data),
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
  create: (data: unknown) => ApiClient.post('/batches/add', data),
  update: (id: string, data: unknown) => ApiClient.put(`/batches/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/batches/delete/${id}`),
  getExpiringBefore: async (date: string) => {
    const res = await ApiClient.get<ApiResponse>(`/batches/expiring-before?date=${date}`);
    return { data: extractList(res, 'batches') };
  },
};
// ---- Customers (Branch-aware §24) ----
export const CustomersAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/customers/all');
    return { data: extractList(res, 'customers') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/customers/${id}`);
    return extractSingle(res, 'customer');
  },
  getByBranch: async (branchId: string) => {
    const res = await ApiClient.get<ApiResponse>(`/customers/branch/${branchId}`);
    return { data: extractList(res, 'customers') };
  },
  create: (data: unknown) => ApiClient.post('/customers/add', data),
  update: (id: string, data: unknown) => ApiClient.put(`/customers/update/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/customers/delete/${id}`),
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
  create: (data: unknown) => ApiClient.post('/invoices/add', data),
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
  create: (data: unknown) => ApiClient.post('/sales-orders/add', data),
  updateStatus: (id: string, status: string) => ApiClient.put(`/sales-orders/status/${id}`, { status }),
  updatePayment: (id: string, paymentStatus: string) => ApiClient.put(`/sales-orders/payment/${id}`, { paymentStatus }),
  delete: (id: string) => ApiClient.delete(`/sales-orders/delete/${id}`),
};

export const PurchaseOrdersAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/purchase-orders/all');
    return { data: extractList(res, 'purchaseOrders') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/purchase-orders/${id}`);
    return extractSingle(res, 'purchaseOrder');
  },
  create: (data: unknown) => ApiClient.post('/purchase-orders/add', data),
  updateStatus: (id: string, status: string) => ApiClient.put(`/purchase-orders/status/${id}`, { status }),
  receive: (id: string) => ApiClient.post(`/purchase-orders/${id}/receive`, {}),
  delete: (id: string) => ApiClient.delete(`/purchase-orders/delete/${id}`),
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
  create: (data: unknown) => ApiClient.post('/stock-counts/add', data),
  updateStatus: (id: string, status: string) => ApiClient.put(`/stock-counts/status/${id}`, { status }),
  updateItemCount: (countId: string, itemId: string, data: { actualQuantity: number }) =>
    ApiClient.put(`/stock-counts/${countId}/items/${itemId}`, data),
  completeCount: (countId: string) => ApiClient.post(`/stock-counts/${countId}/complete`, {}),
  delete: (id: string) => ApiClient.delete(`/stock-counts/delete/${id}`),
};

export const ReorderAPI = {
  setPoint: (data: unknown) => ApiClient.post('/reorder/points/add', data),
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
  purchase: (data: unknown) => ApiClient.post('/transactions/purchase', data),
  sell: (data: unknown) => ApiClient.post('/transactions/sell', data),
  returnToSupplier: (data: unknown) => ApiClient.post('/transactions/return', data),
  updateStatus: (id: string, status: string) => ApiClient.put(`/transactions/update/${id}`, { status }),
};

export const POSAPI = {
  openSession: async (data: unknown) => {
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
  addTransaction: (sessionId: string, data: unknown) =>
    ApiClient.post(`/pos/sessions/${sessionId}/transaction`, data),
  getTransactions: async (sessionId: string) => {
    const res = await ApiClient.get<ApiResponse>(`/pos/sessions/${sessionId}/transactions`);
    return { data: extractList(res, 'posTransactions') };
  },
  voidTransaction: (id: string) => ApiClient.put(`/pos/transactions/${id}/void`, {}),
  getDailySales: async () => {
    const res = await ApiClient.get<ApiResponse>('/pos/daily-sales');
    // Backend returns totalSales/totalRefunds/transactionCount at the top level
    // of the Response envelope — not under `data`.
    return {
      totalSales: Number(res.totalSales ?? 0),
      totalRefunds: Number(res.totalRefunds ?? 0),
      transactionCount: Number(res.transactionCount ?? 0),
    };
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

// ---- Branches ----
export const BranchesAPI = {
  getAll: async () => {
    const res = await ApiClient.get<ApiResponse>('/branches/all');
    return { data: extractList(res, 'branches') };
  },
  getActive: async () => {
    const res = await ApiClient.get<ApiResponse>('/branches/active');
    return { data: extractList(res, 'branches') };
  },
  getById: async (id: string) => {
    const res = await ApiClient.get<ApiResponse>(`/branches/${id}`);
    return extractSingle(res, 'branch');
  },
  create: (data: unknown) => ApiClient.post('/branches/add', data),
  update: (id: string, data: unknown) => ApiClient.put(`/branches/update/${id}`, data),
  disable: (id: string) => ApiClient.put(`/branches/disable/${id}`, {}),
  archive: (id: string) => ApiClient.put(`/branches/archive/${id}`, {}),
  assignManager: (branchId: string, managerId: string) => ApiClient.put(`/branches/${branchId}/manager/${managerId}`, {}),
  removeManager: (branchId: string) => ApiClient.delete(`/branches/${branchId}/manager`),
};

// ---- Alerts / Notifications (real, branch-aware) ----
export const AlertsAPI = {
  getUnread: async () => {
    const res = await ApiClient.get<ApiResponse>('/alerts/unread');
    return { data: extractList(res, 'alerts') };
  },
  getAll: async (params?: { page?: number; size?: number; type?: string; unread?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.page !== undefined) qs.set('page', String(params.page));
    if (params?.size !== undefined) qs.set('size', String(params.size));
    if (params?.type) qs.set('type', params.type);
    if (params?.unread !== undefined) qs.set('unread', String(params.unread));
    const q = qs.toString();
    // Use paginated endpoint if params, else legacy /all
    if (q) {
      const res = await ApiClient.get<ApiResponse>(`/alerts${q ? `?${q}` : ''}`);
      return { data: extractList(res, 'alerts'), totalPages: res.totalPages ?? 1, totalElements: res.totalElements ?? 0 };
    }
    const res = await ApiClient.get<ApiResponse>('/alerts/all');
    return { data: extractList(res, 'alerts') };
  },
  getUnreadCount: async () => {
    const res = await ApiClient.get<ApiResponse>('/alerts/count');
    // Backend returns message with count string, or data
    const c = res.message || res.data || '0';
    return { count: Number(c) || 0 };
  },
  markAsRead: (id: string|number) => ApiClient.put(`/alerts/read/${id}`, {}),
  markAllAsRead: () => ApiClient.put('/alerts/read-all', {}),
  check: () => ApiClient.post('/alerts/check', {}),
};

// ---- Stock Movements (Inventory Logs) ----
export const StockMovementsAPI = {
  getAll: async (params?: { page?: number; size?: number; searchText?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page !== undefined) qs.set('page', String(params.page));
    if (params?.size !== undefined) qs.set('size', String(params.size));
    if (params?.searchText) qs.set('searchText', params.searchText);
    const query = qs.toString();
    const res = await ApiClient.get<ApiResponse>(`/stock-movements/all${query ? `?${query}` : ''}`);
    return {
      data: extractList(res, 'stockMovements'),
      totalPages: res.totalPages ?? 1,
      totalElements: res.totalElements ?? 0,
      currentPage: res.currentPage ?? 0,
    };
  },
};

// ---- Backup (Superadmin, Google Drive) ----
export const BackupAPI = {
  // POST /api/backup/create?branchId=null -> all branches
  createAll: async () => {
    const res = await ApiClient.post<ApiResponse>('/backup/create', {});
    return extractSingle(res, 'backup');
  },
  createForBranch: async (branchId: string) => {
    const res = await ApiClient.post<ApiResponse>(`/backup/create?branchId=${encodeURIComponent(branchId)}`, {});
    return extractSingle(res, 'backup');
  },
  // aliases for pages that use .create / .history / .latest / .status
  create: async (branchId?: string | null) => {
    const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
    const res = await ApiClient.post<ApiResponse>(`/backup/create${q}`, {});
    return extractSingle(res, 'backup');
  },
  getHistory: async () => {
    const res = await ApiClient.get<ApiResponse>('/backup/history');
    return { data: extractList(res, 'backups') };
  },
  history: async () => {
    const res = await ApiClient.get<ApiResponse>('/backup/history');
    return { data: extractList(res, 'backups') };
  },
  getLatest: async () => {
    const res = await ApiClient.get<ApiResponse>('/backup/latest');
    return extractSingle(res, 'backup');
  },
  latest: async () => {
    const res = await ApiClient.get<ApiResponse>('/backup/latest');
    return extractSingle(res, 'backup');
  },
  getStatus: async () => {
    const res = await ApiClient.get<ApiResponse>('/backup/status');
    // backend returns { message, cloudConfigured }
    return { message: String(res.message || ''), cloudConfigured: Boolean((res as any).cloudConfigured) };
  },
  status: async () => {
    const res = await ApiClient.get<ApiResponse>('/backup/status');
    return { message: String(res.message || ''), cloudConfigured: Boolean((res as any).cloudConfigured) };
  },
  download: (id: string | number) => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';
    const url = `${String(base).replace(/\/+$/, '').replace(/\/api$/, '')}/api/backup/download/${id}`;
    // fallback to ApiClient base if needed
    return url;
  },
};



