import api from './client';
import type { 
  ProductWithStock, 
  ProductFormData,
  ProductFilters
} from '../../types-new';

export const productsApi = {
  // Get all products
  getAll: async (filters?: ProductFilters): Promise<ProductWithStock[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.brand) params.append('brand', filters.brand);
    if (filters?.active !== undefined) params.append('active', String(filters.active));

    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
  },

  // Get product by ID
  getById: async (id: string): Promise<ProductWithStock> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Create product
  create: async (data: ProductFormData): Promise<ProductWithStock> => {
    const response = await api.post('/products', data);
    return response.data;
  },

  // Update product
  update: async (id: string, data: Partial<ProductFormData>): Promise<ProductWithStock> => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  // Delete product (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  }
};
