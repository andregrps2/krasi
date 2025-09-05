import { prisma } from './prisma.service';
import { CreateProductData, UpdateProductData, AppError } from '../types';

export class ProductService {
  async findAll() {
    try {
      return await prisma.product.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw new AppError('Erro ao buscar produtos', 500);
    }
  }

  async findById(id: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          stockItems: {
            include: {
              store: true
            }
          }
        }
      });

      if (!product) {
        throw new AppError('Produto não encontrado', 404);
      }

      return product;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao buscar produto:', error);
      throw new AppError('Erro ao buscar produto', 500);
    }
  }

  async findByBarcode(barcode: string) {
    try {
      return await prisma.product.findUnique({
        where: { barcode },
        include: {
          stockItems: {
            include: {
              store: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Erro ao buscar produto por código de barras:', error);
      throw new AppError('Erro ao buscar produto por código de barras', 500);
    }
  }

  async create(data: CreateProductData) {
    try {
      // Verificar se já existe produto com mesmo código de barras
      if (data.barcode) {
        const existingProduct = await prisma.product.findUnique({
          where: { barcode: data.barcode }
        });

        if (existingProduct) {
          throw new AppError('Já existe um produto com este código de barras', 400);
        }
      }

      return await prisma.product.create({
        data: {
          name: data.name,
          description: data.description,
          brand: data.brand,
          category: data.category,
          barcode: data.barcode,
          unit: data.unit || 'un'
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao criar produto:', error);
      throw new AppError('Erro ao criar produto', 500);
    }
  }

  async update(id: string, data: UpdateProductData) {
    try {
      // Verificar se produto existe
      const existingProduct = await this.findById(id);

      // Verificar se código de barras já existe em outro produto
      if (data.barcode && data.barcode !== existingProduct.barcode) {
        const productWithBarcode = await prisma.product.findUnique({
          where: { barcode: data.barcode }
        });

        if (productWithBarcode && productWithBarcode.id !== id) {
          throw new AppError('Já existe um produto com este código de barras', 400);
        }
      }

      return await prisma.product.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao atualizar produto:', error);
      throw new AppError('Erro ao atualizar produto', 500);
    }
  }

  async delete(id: string) {
    try {
      // Verificar se produto existe
      await this.findById(id);

      // Verificar se produto tem vendas associadas
      const salesCount = await prisma.saleItem.count({
        where: { productId: id }
      });

      if (salesCount > 0) {
        // Soft delete - marcar como inativo
        return await prisma.product.update({
          where: { id },
          data: { isActive: false }
        });
      } else {
        // Hard delete se não tem vendas
        return await prisma.product.delete({
          where: { id }
        });
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao deletar produto:', error);
      throw new AppError('Erro ao deletar produto', 500);
    }
  }

  async search(query: string) {
    try {
      return await prisma.product.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                { name: { contains: query } },
                { description: { contains: query } },
                { brand: { contains: query } },
                { category: { contains: query } },
                { barcode: { contains: query } }
              ]
            }
          ]
        },
        include: {
          stockItems: {
            include: {
              store: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      console.error('Erro ao pesquisar produtos:', error);
      throw new AppError('Erro ao pesquisar produtos', 500);
    }
  }
}
