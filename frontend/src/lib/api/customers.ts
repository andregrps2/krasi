import api from './client';
import type { 
  CustomerWithStats,
  CustomerFormData
} from '../../types-new';

export interface CustomerFilters {
  storeId?: string;
  search?: string;
  active?: boolean;
}

export const customersApi = {
  // Get all customers
  getAll: async (filters?: CustomerFilters): Promise<CustomerWithStats[]> => {
    const params = new URLSearchParams();
    if (filters?.storeId) params.append('storeId', filters.storeId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.active !== undefined) params.append('active', String(filters.active));

    const response = await api.get(`/customers?${params.toString()}`);
    return response.data;
  },

  // Get customer by ID
  getById: async (id: string): Promise<CustomerWithStats> => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Create customer
  create: async (data: CustomerFormData & { storeId: string }): Promise<CustomerWithStats> => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  // Update customer
  update: async (id: string, data: Partial<CustomerFormData>): Promise<CustomerWithStats> => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  // Delete customer (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  }
};
