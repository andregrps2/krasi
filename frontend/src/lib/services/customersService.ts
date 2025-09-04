import { customersApi } from '../api';
import type { Customer } from '../../types-new';

class CustomersService {
  private customersCache = new Map<string, Customer[]>();
  
  async getCustomersByStore(storeId: string): Promise<Customer[]> {
    // Verificar cache primeiro
    if (this.customersCache.has(storeId)) {
      return this.customersCache.get(storeId)!;
    }

    try {
      // Buscar todos os customers
      const allCustomers = await customersApi.getAll();
      
      // Filtrar apenas os customers da loja específica
      const storeCustomers = allCustomers.filter(customer => customer.storeId === storeId);
      
      // Salvar no cache
      this.customersCache.set(storeId, storeCustomers);
      
      return storeCustomers;
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      return [];
    }
  }

  async refreshCustomers(storeId: string): Promise<Customer[]> {
    // Limpar cache e recarregar
    this.customersCache.delete(storeId);
    return this.getCustomersByStore(storeId);
  }

  async createCustomer(storeId: string, customerData: any): Promise<Customer> {
    try {
      const newCustomer = await customersApi.create({
        ...customerData,
        storeId
      });
      
      // Atualizar cache
      await this.refreshCustomers(storeId);
      
      return newCustomer;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  }

  clearCache() {
    this.customersCache.clear();
  }
}

export const customersService = new CustomersService();
