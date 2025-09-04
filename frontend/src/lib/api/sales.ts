import api from './client';
import type { 
  SaleWithRelations,
  PaymentType,
  SaleStatus
} from '../../types-new';

export interface SaleItemFormData {
  productId: string;
  stockItemId: string;
  quantity: number;
  price: number;
  total: number;
}

export interface InstallmentFormData {
  number: number;
  amount: number;
  dueDate: string;
}

export interface SaleFormData {
  storeId: string;
  userId: string;
  customerId?: string;
  total: number;
  discount?: number;
  paymentType: PaymentType;
  notes?: string;
  items: SaleItemFormData[];
  installments?: InstallmentFormData[];
}

export interface SaleFilters {
  storeId?: string;
  customerId?: string;
  paymentType?: PaymentType;
  status?: SaleStatus;
  startDate?: string;
  endDate?: string;
}

export const salesApi = {
  // Get all sales
  getAll: async (filters?: SaleFilters): Promise<SaleWithRelations[]> => {
    const params = new URLSearchParams();
    if (filters?.storeId) params.append('storeId', filters.storeId);
    if (filters?.customerId) params.append('customerId', filters.customerId);
    if (filters?.paymentType) params.append('paymentType', filters.paymentType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/sales?${params.toString()}`);
    return response.data;
  },

  // Get sale by ID
  getById: async (id: string): Promise<SaleWithRelations> => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  // Create sale
  create: async (data: SaleFormData): Promise<SaleWithRelations> => {
    const response = await api.post('/sales', data);
    return response.data;
  },

  // Update sale status
  updateStatus: async (id: string, status: SaleStatus): Promise<SaleWithRelations> => {
    const response = await api.put(`/sales/${id}/status`, { status });
    return response.data;
  }
};
