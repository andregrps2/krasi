import api from './client';
import type { 
  Store,
  StoreWithDetails
} from '../../types-new';

export interface StoreFormData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  companyId: string;
}

export interface StoreFilters {
  active?: boolean;
}

export interface StoreDashboard {
  salesToday: {
    total: number;
    count: number;
  };
  salesMonth: {
    total: number;
    count: number;
  };
  lowStockItems: any[];
  pendingInstallments: any[];
  customersCount: number;
  topProducts: any[];
}

export const storesApi = {
  // Get all stores
  getAll: async (filters?: StoreFilters): Promise<Store[]> => {
    const params = new URLSearchParams();
    if (filters?.active !== undefined) params.append('active', String(filters.active));

    const response = await api.get(`/stores?${params.toString()}`);
    return response.data;
  },

  // Get store by ID with details
  getById: async (id: string): Promise<StoreWithDetails> => {
    const response = await api.get(`/stores/${id}`);
    return response.data;
  },

  // Get store dashboard
  getDashboard: async (id: string): Promise<StoreDashboard> => {
    const response = await api.get(`/stores/${id}/dashboard`);
    return response.data;
  },

  // Create store
  create: async (data: StoreFormData): Promise<Store> => {
    const response = await api.post('/stores', data);
    return response.data;
  },

  // Update store
  update: async (id: string, data: Partial<StoreFormData>): Promise<Store> => {
    const response = await api.put(`/stores/${id}`, data);
    return response.data;
  },

  // Delete store (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/stores/${id}`);
  }
};
