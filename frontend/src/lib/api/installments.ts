import { api } from './client';
import type { Installment, InstallmentWithRelations } from '../../types-new';

interface InstallmentFormData {
  saleId: string;
  customerId: string;
  amount: number;
  dueDate: Date;
  description?: string;
}

export const installmentsApi = {
  // Get all installments
  getAll: async (params?: {
    storeId?: string;
    customerId?: string;
    status?: string;
    overdue?: boolean;
  }): Promise<InstallmentWithRelations[]> => {
    const searchParams = new URLSearchParams();
    if (params?.storeId) searchParams.append('storeId', params.storeId);
    if (params?.customerId) searchParams.append('customerId', params.customerId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.overdue) searchParams.append('overdue', 'true');
    
    const response = await api.get(`/installments?${searchParams.toString()}`);
    return response.data;
  },

  // Get installment by ID
  getById: async (id: string): Promise<InstallmentWithRelations> => {
    const response = await api.get(`/installments/${id}`);
    return response.data;
  },

  // Create installment
  create: async (data: InstallmentFormData): Promise<Installment> => {
    const response = await api.post('/installments', data);
    return response.data;
  },

  // Update installment
  update: async (id: string, data: Partial<InstallmentFormData>): Promise<Installment> => {
    const response = await api.put(`/installments/${id}`, data);
    return response.data;
  },

  // Pay installment
  pay: async (id: string, paymentData: {
    paymentDate?: Date;
    paymentMethod?: string;
  }): Promise<Installment> => {
    const response = await api.post(`/installments/${id}/pay`, paymentData);
    return response.data;
  },

  // Delete installment
  delete: async (id: string): Promise<void> => {
    await api.delete(`/installments/${id}`);
  },
};
