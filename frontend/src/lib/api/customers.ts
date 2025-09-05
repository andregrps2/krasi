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
    console.log('🌐 [CUSTOMERS API] getAll chamado com filtros:', filters);
    
    const params = new URLSearchParams();
    if (filters?.storeId) {
      params.append('storeId', filters.storeId);
      console.log('🏪 [CUSTOMERS API] Adicionando filtro storeId:', filters.storeId);
    }
    if (filters?.search) params.append('search', filters.search);
    if (filters?.active !== undefined) params.append('active', String(filters.active));

    const url = `/customers?${params.toString()}`;
    console.log('🌐 [CUSTOMERS API] Fazendo requisição para:', url);
    
    const response = await api.get(url);
    console.log('🌐 [CUSTOMERS API] Resposta recebida:', response.data);
    console.log('🌐 [CUSTOMERS API] Quantidade de clientes:', response.data?.length || 0);
    
    return response.data;
  },

  // Get customer by ID
  getById: async (id: string): Promise<CustomerWithStats> => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Create customer
  create: async (data: CustomerFormData & { storeId: string }): Promise<CustomerWithStats> => {
    console.log('🌐 [CUSTOMERS API] Enviando requisição POST para /customers');
    console.log('📤 [CUSTOMERS API] Dados enviados:', data);
    
    try {
      const response = await api.post('/customers', data);
      console.log('✅ [CUSTOMERS API] Resposta recebida:', response.data);
      
      // Verificar se a resposta tem a estrutura esperada (success, data)
      if (response.data && response.data.success && response.data.data) {
        console.log('📦 [CUSTOMERS API] Retornando dados do cliente:', response.data.data);
        return response.data.data;
      } else {
        console.log('📦 [CUSTOMERS API] Retornando resposta direta:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('❌ [CUSTOMERS API] Erro na requisição:', error);
      throw error;
    }
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
