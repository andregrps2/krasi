import { prisma } from './prisma.service';
import { CreateStockItemData, UpdateStockItemData, AppError } from '../types';

export class StockService {
  async findAll(storeId?: string) {
    try {
      const where: any = { isActive: true };
      if (storeId) where.storeId = storeId;

      return await prisma.stockItem.findMany({
        where,
        include: {
          product: true,
          store: true
        },
        orderBy: { product: { name: 'asc' } }
      });
    } catch (error) {
      console.error('Erro ao buscar itens de estoque:', error);
      throw new AppError('Erro ao buscar itens de estoque', 500);
    }
  }

  async findById(id: string) {
    try {
      const stockItem = await prisma.stockItem.findUnique({
        where: { id },
        include: {
          product: true,
          store: true
        }
      });

      if (!stockItem) {
        throw new AppError('Item de estoque não encontrado', 404);
      }

      return stockItem;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao buscar item de estoque:', error);
      throw new AppError('Erro ao buscar item de estoque', 500);
    }
  }

  async findByProductAndStore(productId: string, storeId: string) {
    try {
      return await prisma.stockItem.findUnique({
        where: {
          productId_storeId: {
            productId,
            storeId
          }
        },
        include: {
          product: true,
          store: true
        }
      });
    } catch (error) {
      console.error('Erro ao buscar item de estoque por produto e loja:', error);
      throw new AppError('Erro ao buscar item de estoque por produto e loja', 500);
    }
  }

  async create(data: CreateStockItemData) {
    try {
      // Verificar se já existe item para este produto nesta loja
      const existingItem = await this.findByProductAndStore(data.productId, data.storeId);
      
      if (existingItem) {
        throw new AppError('Já existe um item de estoque para este produto nesta loja', 400);
      }

      // Verificar se produto existe
      const product = await prisma.product.findUnique({
        where: { id: data.productId }
      });

      if (!product) {
        throw new AppError('Produto não encontrado', 404);
      }

      // Verificar se loja existe
      const store = await prisma.store.findUnique({
        where: { id: data.storeId }
      });

      if (!store) {
        throw new AppError('Loja não encontrada', 404);
      }

      return await prisma.stockItem.create({
        data: {
          productId: data.productId,
          storeId: data.storeId,
          quantity: data.quantity || 0,
          minQuantity: data.minQuantity || 0,
          maxQuantity: data.maxQuantity,
          purchasePrice: data.purchasePrice,
          salePrice: data.salePrice
        },
        include: {
          product: true,
          store: true
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao criar item de estoque:', error);
      throw new AppError('Erro ao criar item de estoque', 500);
    }
  }

  async update(id: string, data: UpdateStockItemData) {
    try {
      // Verificar se item existe
      await this.findById(id);

      return await prisma.stockItem.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          product: true,
          store: true
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao atualizar item de estoque:', error);
      throw new AppError('Erro ao atualizar item de estoque', 500);
    }
  }

  async updateQuantity(id: string, quantity: number, operation: 'add' | 'subtract' | 'set' = 'set') {
    try {
      const stockItem = await this.findById(id);

      let newQuantity: number;
      
      switch (operation) {
        case 'add':
          newQuantity = stockItem.quantity + quantity;
          break;
        case 'subtract':
          newQuantity = stockItem.quantity - quantity;
          if (newQuantity < 0) {
            throw new AppError('Quantidade insuficiente em estoque', 400);
          }
          break;
        case 'set':
        default:
          newQuantity = quantity;
          break;
      }

      return await prisma.stockItem.update({
        where: { id },
        data: {
          quantity: newQuantity,
          updatedAt: new Date()
        },
        include: {
          product: true,
          store: true
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao atualizar quantidade do estoque:', error);
      throw new AppError('Erro ao atualizar quantidade do estoque', 500);
    }
  }

  async delete(id: string) {
    try {
      // Verificar se item existe
      await this.findById(id);

      // Verificar se item tem vendas associadas
      const salesCount = await prisma.saleItem.count({
        where: { stockItemId: id }
      });

      if (salesCount > 0) {
        // Soft delete - marcar como inativo
        return await prisma.stockItem.update({
          where: { id },
          data: { isActive: false }
        });
      } else {
        // Hard delete se não tem vendas
        return await prisma.stockItem.delete({
          where: { id }
        });
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao deletar item de estoque:', error);
      throw new AppError('Erro ao deletar item de estoque', 500);
    }
  }

  async getLowStockItems(storeId?: string) {
    try {
      const where: any = {
        isActive: true,
        quantity: {
          lte: prisma.stockItem.fields.minQuantity
        }
      };

      if (storeId) where.storeId = storeId;

      return await prisma.stockItem.findMany({
        where,
        include: {
          product: true,
          store: true
        },
        orderBy: { quantity: 'asc' }
      });
    } catch (error) {
      console.error('Erro ao buscar itens com estoque baixo:', error);
      throw new AppError('Erro ao buscar itens com estoque baixo', 500);
    }
  }

  async search(query: string, storeId?: string) {
    try {
      const where: any = {
        AND: [
          { isActive: true },
          {
            product: {
              OR: [
                { name: { contains: query } },
                { description: { contains: query } },
                { brand: { contains: query } },
                { category: { contains: query } },
                { barcode: { contains: query } }
              ]
            }
          }
        ]
      };

      if (storeId) where.AND.push({ storeId });

      return await prisma.stockItem.findMany({
        where,
        include: {
          product: true,
          store: true
        },
        orderBy: { product: { name: 'asc' } }
      });
    } catch (error) {
      console.error('Erro ao pesquisar itens de estoque:', error);
      throw new AppError('Erro ao pesquisar itens de estoque', 500);
    }
  }

  async getStockReport(storeId?: string) {
    try {
      const where: any = { isActive: true };
      if (storeId) where.storeId = storeId;

      const stockItems = await prisma.stockItem.findMany({
        where,
        include: {
          product: true,
          store: true
        }
      });

      const totalValue = stockItems.reduce((sum, item) => {
        return sum + (Number(item.purchasePrice) * item.quantity);
      }, 0);

      const totalSaleValue = stockItems.reduce((sum, item) => {
        return sum + (Number(item.salePrice) * item.quantity);
      }, 0);

      const lowStockCount = stockItems.filter(item => item.quantity <= item.minQuantity).length;
      const outOfStockCount = stockItems.filter(item => item.quantity === 0).length;

      return {
        totalItems: stockItems.length,
        totalValue,
        totalSaleValue,
        lowStockCount,
        outOfStockCount,
        items: stockItems
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de estoque:', error);
      throw new AppError('Erro ao gerar relatório de estoque', 500);
    }
  }
}
