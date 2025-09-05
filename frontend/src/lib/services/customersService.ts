import { customersApi } from '../api';
import type { Customer } from '../../types-new';

class CustomersService {
  private customersCache = new Map<string, Customer[]>();
  
  async getCustomersByStore(storeId: string): Promise<Customer[]> {
    console.log('👥 [CUSTOMERS SERVICE] getCustomersByStore para loja:', storeId);
    
    // Verificar cache primeiro
    if (this.customersCache.has(storeId)) {
      console.log('💾 [CUSTOMERS SERVICE] Usando cache para loja:', storeId);
      const cachedCustomers = this.customersCache.get(storeId)!;
      console.log('💾 [CUSTOMERS SERVICE] Clientes em cache:', cachedCustomers.length);
      return cachedCustomers;
    }

    console.log('🌐 [CUSTOMERS SERVICE] Buscando clientes da API com filtro de loja');
    try {
      // Buscar clientes filtrando por loja diretamente na API
      const allCustomers = await customersApi.getAll({ storeId });
      console.log('� [CUSTOMERS SERVICE] Clientes retornados da API:', allCustomers.length);
      console.log('� [CUSTOMERS SERVICE] Lista da API:', allCustomers);
      
      // Salvar no cache
      this.customersCache.set(storeId, allCustomers);
      console.log('💾 [CUSTOMERS SERVICE] Cache atualizado para loja:', storeId);
      
      return allCustomers;
    } catch (error) {
      console.error('❌ [CUSTOMERS SERVICE] Erro ao carregar clientes:', error);
      return [];
    }
  }

  async refreshCustomers(storeId: string): Promise<Customer[]> {
    // Limpar cache e recarregar
    this.customersCache.delete(storeId);
    return this.getCustomersByStore(storeId);
  }

  async createCustomer(storeId: string, customerData: any): Promise<Customer> {
    console.log('👥 [CUSTOMERS SERVICE] Criando cliente para loja:', storeId);
    console.log('👥 [CUSTOMERS SERVICE] Dados recebidos:', customerData);
    
    try {
      const dataToSend = {
        ...customerData,
        storeId
      };
      console.log('📤 [CUSTOMERS SERVICE] Dados para enviar à API:', dataToSend);
      
      const newCustomer = await customersApi.create(dataToSend);
      console.log('✅ [CUSTOMERS SERVICE] Cliente criado via API:', newCustomer);
      
      // Limpar cache antes de atualizar
      console.log('🧹 [CUSTOMERS SERVICE] Limpando cache');
      this.customersCache.delete(storeId);
      this.customersCache.clear(); // Limpar todo o cache para garantir
      
      // Atualizar cache
      console.log('🔄 [CUSTOMERS SERVICE] Atualizando cache');
      await this.refreshCustomers(storeId);
      console.log('✅ [CUSTOMERS SERVICE] Cache atualizado');
      
      return newCustomer;
    } catch (error) {
      console.error('❌ [CUSTOMERS SERVICE] Erro ao criar cliente:', error);
      throw error;
    }
  }

  clearCache() {
    this.customersCache.clear();
  }
}

export const customersService = new CustomersService();
