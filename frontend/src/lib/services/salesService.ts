import { salesApi } from '../api';
import type { Sale } from '../../types-new';

class SalesService {
  private salesCache = new Map<string, Sale[]>();
  
  async getSalesByStore(storeId: string): Promise<Sale[]> {
    // Verificar cache primeiro
    if (this.salesCache.has(storeId)) {
      return this.salesCache.get(storeId)!;
    }

    try {
      // Buscar todas as vendas
      const allSales = await salesApi.getAll();
      
      // Filtrar apenas as vendas da loja específica
      const storeSales = allSales.filter(sale => sale.storeId === storeId);
      
      // Salvar no cache
      this.salesCache.set(storeId, storeSales);
      
      return storeSales;
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      return [];
    }
  }

  async refreshSales(storeId: string): Promise<Sale[]> {
    // Limpar cache e recarregar
    this.salesCache.delete(storeId);
    return this.getSalesByStore(storeId);
  }

  async createSale(storeId: string, saleData: Partial<Sale>): Promise<Sale> {
    try {
      const newSale = await salesApi.create({
        ...saleData,
        storeId
      } as any);
      
      // Atualizar cache
      await this.refreshSales(storeId);
      
      return newSale;
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      throw error;
    }
  }

  clearCache() {
    this.salesCache.clear();
  }
}

export const salesService = new SalesService();
