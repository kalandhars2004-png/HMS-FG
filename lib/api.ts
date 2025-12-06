// API configuration for Java REST API calls

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

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

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - clear token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Auth API
export const AuthAPI = {
  login: async (username: string, password: string) => {
    return ApiClient.post('/auth/login', { username, password });
  },

  logout: async () => {
    return ApiClient.post('/auth/logout', {});
  },
};

// Products API
export const ProductsAPI = {
  getAll: () => ApiClient.get('/products'),
  getById: (id: string) => ApiClient.get(`/products/${id}`),
  create: (data: any) => ApiClient.post('/products', data),
  update: (id: string, data: any) => ApiClient.put(`/products/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/products/${id}`),
};

// Categories API
export const CategoriesAPI = {
  getAll: () => ApiClient.get('/categories'),
  getById: (id: string) => ApiClient.get(`/categories/${id}`),
  create: (data: any) => ApiClient.post('/categories', data),
  update: (id: string, data: any) => ApiClient.put(`/categories/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/categories/${id}`),
};

// Sub Categories API
export const SubCategoriesAPI = {
  getAll: () => ApiClient.get('/subcategories'),
  getById: (id: string) => ApiClient.get(`/subcategories/${id}`),
  create: (data: any) => ApiClient.post('/subcategories', data),
  update: (id: string, data: any) => ApiClient.put(`/subcategories/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/subcategories/${id}`),
};

// Brands API
export const BrandsAPI = {
  getAll: () => ApiClient.get('/brands'),
  getById: (id: string) => ApiClient.get(`/brands/${id}`),
  create: (data: any) => ApiClient.post('/brands', data),
  update: (id: string, data: any) => ApiClient.put(`/brands/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/brands/${id}`),
};

// Units API
export const UnitsAPI = {
  getAll: () => ApiClient.get('/units'),
  getById: (id: string) => ApiClient.get(`/units/${id}`),
  create: (data: any) => ApiClient.post('/units', data),
  update: (id: string, data: any) => ApiClient.put(`/units/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/units/${id}`),
};

// Variants API
export const VariantsAPI = {
  getAll: () => ApiClient.get('/variants'),
  getById: (id: string) => ApiClient.get(`/variants/${id}`),
  create: (data: any) => ApiClient.post('/variants', data),
  update: (id: string, data: any) => ApiClient.put(`/variants/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/variants/${id}`),
};
