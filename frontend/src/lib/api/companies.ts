import { api } from './client';

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    stores: number;
  };
}

interface CompanyFormData {
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address?: string;
}

export const companiesApi = {
  // Get all companies
  getAll: async (): Promise<Company[]> => {
    const response = await api.get('/companies');
    return response.data;
  },

  // Create company
  create: async (data: CompanyFormData): Promise<Company> => {
    const response = await api.post('/companies', data);
    return response.data;
  }
};
