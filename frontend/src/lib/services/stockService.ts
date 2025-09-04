import { stockApi } from '../api';
import type { StockItemWithRelations, StockItemOld } from '../../types-new';

class StockService {
  private stockCache = new Map<string, StockItemOld[]>();
  
  async getStockByStore(storeId: string): Promise<StockItemOld[]> {
    // Verificar cache primeiro
    if (this.stockCache.has(storeId)) {
      return this.stockCache.get(storeId)!;
    }

    try {
      // Buscar todos os itens de estoque
      const allStock = await stockApi.getAll();
      
      // Filtrar apenas os itens da loja específica
      const storeStock = allStock.filter(item => item.storeId === storeId);
      
      // Converter para formato antigo
      const convertedStock = this.convertToOldFormat(storeStock);
      
      // Salvar no cache
      this.stockCache.set(storeId, convertedStock);
      
      return convertedStock;
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
      return [];
    }
  }

  async refreshStock(storeId: string): Promise<StockItemOld[]> {
    // Limpar cache e recarregar
    this.stockCache.delete(storeId);
    return this.getStockByStore(storeId);
  }

  // Converter formato da API para formato antigo (compatibilidade)
  private convertToOldFormat(stockItems: StockItemWithRelations[]): StockItemOld[] {
    return stockItems.map(item => ({
      id: item.id,
      name: item.product.name,
      price: parseFloat(item.salePrice.toString()),
      quantity: item.quantity,
      brand: item.product.brand || '',
      category: item.product.category || '',
      properties: {
        name: item.product.name,
        description: item.product.description || '',
        brand: item.product.brand || '',
        category: item.product.category || '',
        price: item.salePrice.toString(),
        barcode: item.product.barcode || '',
        unit: item.product.unit || 'un'
      }
    }));
  }

  clearCache() {
    this.stockCache.clear();
  }
}

export const stockService = new StockService();
