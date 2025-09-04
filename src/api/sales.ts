import type { Sale, SaleWithRelations } from '../types';

const API_BASE = 'http://localhost:3001/api';

interface SalesFilters {
  storeId?: string;
  customerId?: string;
  paymentType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface CreateSaleData {
  storeId: string;
  customerId?: string;
  paymentType: 'CASH' | 'CARD' | 'PIX' | 'INSTALLMENTS' | 'FIADO';
  downPayment?: number;
  installments?: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
}

export const salesApi = {
  async getAll(filters: SalesFilters = {}): Promise<SaleWithRelations[]> {
    const searchParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const url = `${API_BASE}/sales${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async getById(id: string): Promise<SaleWithRelations> {
    const response = await fetch(`${API_BASE}/sales/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async create(data: CreateSaleData): Promise<SaleWithRelations> {
    const response = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async update(id: string, data: Partial<Sale>): Promise<SaleWithRelations> {
    const response = await fetch(`${API_BASE}/sales/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/sales/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
};
