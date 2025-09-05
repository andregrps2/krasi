import api from './client';
import type { 
  StockItemWithRelations,
  ProductFilters
} from '../../types-new';

export interface StockFormData {
  productId: string;
  storeId: string;
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
  purchasePrice: number;
  salePrice: number;
}

export interface StockFilters extends ProductFilters {
  storeId?: string;
  productId?: string;
  lowStock?: boolean;
}

export interface StockQuantityUpdate {
  quantity: number;
  operation: 'add' | 'subtract' | 'set';
}

export const stockApi = {
  // Get all stock items
  getAll: async (filters?: StockFilters): Promise<StockItemWithRelations[]> => {
    const params = new URLSearchParams();
    if (filters?.storeId) params.append('storeId', filters.storeId);
    if (filters?.productId) params.append('productId', filters.productId);
    if (filters?.lowStock) params.append('lowStock', String(filters.lowStock));
    if (filters?.search) params.append('search', filters.search);

    console.log('🔄 [STOCK API] Fazendo requisição para:', `/stock?${params.toString()}`);
    const response = await api.get(`/stock?${params.toString()}`);
    console.log('✅ [STOCK API] Resposta recebida:', response.data);
    
    // Verificar se a resposta tem a estrutura esperada (success, data)
    if (response.data && response.data.success && response.data.data) {
      console.log('📦 [STOCK API] Retornando dados:', response.data.data);
      return response.data.data;
    } else {
      console.log('📦 [STOCK API] Retornando resposta direta:', response.data);
      return response.data;
    }
  },

  // Get stock item by ID
  getById: async (id: string): Promise<StockItemWithRelations> => {
    const response = await api.get(`/stock/${id}`);
    return response.data;
  },

  // Create stock item
  create: async (data: StockFormData): Promise<StockItemWithRelations> => {
    const response = await api.post('/stock', data);
    return response.data;
  },

  // Update stock item
  update: async (id: string, data: Partial<StockFormData>): Promise<StockItemWithRelations> => {
    const response = await api.put(`/stock/${id}`, data);
    return response.data;
  },

  // Update stock quantity
  updateQuantity: async (id: string, update: StockQuantityUpdate): Promise<StockItemWithRelations> => {
    const response = await api.patch(`/stock/${id}/quantity`, update);
    return response.data;
  },

  // Delete stock item (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/stock/${id}`);
  },

  // Get low stock items
  getLowStock: async (storeId?: string): Promise<StockItemWithRelations[]> => {
    return stockApi.getAll({ lowStock: true, storeId });
  }
};
