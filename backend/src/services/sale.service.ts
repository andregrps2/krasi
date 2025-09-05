import { prisma } from './prisma.service';
import { CreateSaleData, SaleItemData, InstallmentData, AppError } from '../types';

export class SaleService {
  async findAll(filters: {
    storeId?: string;
    customerId?: string;
    paymentType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  } = {}) {
    try {
      const where: any = {};
      
      if (filters.storeId) where.storeId = filters.storeId;
      if (filters.customerId) where.customerId = filters.customerId;
      if (filters.paymentType) where.paymentType = filters.paymentType;
      if (filters.status) where.status = filters.status;
      
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
        if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
      }

      return await prisma.sale.findMany({
        where,
        include: {
          customer: true,
          store: true,
          user: true,
          saleItems: {
            include: {
              product: true,
              stockItem: true
            }
          },
          installments: {
            orderBy: { number: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      throw new AppError('Erro ao buscar vendas', 500);
    }
  }

  async findById(id: string) {
    try {
      const sale = await prisma.sale.findUnique({
        where: { id },
        include: {
          customer: true,
          store: true,
          user: true,
          saleItems: {
            include: {
              product: true,
              stockItem: true
            }
          },
          installments: {
            orderBy: { number: 'asc' }
          }
        }
      });

      if (!sale) {
        throw new AppError('Venda não encontrada', 404);
      }

      return sale;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao buscar venda:', error);
      throw new AppError('Erro ao buscar venda', 500);
    }
  }

  async create(data: CreateSaleData) {
    try {
      console.log('🔄 [SaleService] Iniciando criação de venda:', JSON.stringify(data, null, 2));

      // Validações iniciais
      await this.validateSaleData(data);

      // Executar em transação
      const result = await prisma.$transaction(async (tx) => {
        console.log('🔄 [SaleService] Iniciando transação');

        // 1. Criar a venda
        const saleData: any = {
          storeId: data.storeId,
          total: data.total,
          discount: data.discount || 0,
          paymentType: data.paymentType,
          notes: data.notes,
          status: 'COMPLETED'
        };

        // Adicionar customerId e userId apenas se existirem
        if (data.customerId) saleData.customerId = data.customerId;
        if (data.userId) saleData.userId = data.userId;

        console.log('💾 [SaleService] Criando venda:', JSON.stringify(saleData, null, 2));
        const sale = await tx.sale.create({ data: saleData });
        console.log('✅ [SaleService] Venda criada com ID:', sale.id);

        // 2. Processar itens da venda
        console.log('📦 [SaleService] Processando', data.items.length, 'itens');
        for (const [index, item] of data.items.entries()) {
          await this.processSaleItem(tx, sale.id, item, index + 1);
        }

        // 3. Processar parcelas (para INSTALLMENTS e FIADO)
        if (data.installments && data.installments.length > 0) {
          console.log('💳 [SaleService] Processando', data.installments.length, 'parcelas');
          await this.processInstallments(tx, sale.id, data.customerId!, data.installments);
        }

        console.log('✅ [SaleService] Transação concluída com sucesso');
        return sale;
      });

      // Buscar venda completa
      return await this.findById(result.id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao criar venda:', error);
      throw new AppError('Erro ao criar venda', 500);
    }
  }

  private async validateSaleData(data: CreateSaleData) {
    // Validar loja
    const store = await prisma.store.findUnique({
      where: { id: data.storeId }
    });
    if (!store) {
      throw new AppError('Loja não encontrada', 404);
    }

    // Validar cliente (se fornecido)
    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId }
      });
      if (!customer) {
        throw new AppError('Cliente não encontrado', 404);
      }
    }

    // Validar usuário (se fornecido)
    if (data.userId) {
      const user = await prisma.user.findUnique({
        where: { id: data.userId }
      });
      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }
    }

    // Para vendas FIADO ou INSTALLMENTS, cliente é obrigatório
    if ((data.paymentType === 'FIADO' || data.paymentType === 'INSTALLMENTS') && !data.customerId) {
      throw new AppError('Cliente é obrigatório para vendas no fiado ou parceladas', 400);
    }

    // Para vendas parceladas, parcelas são obrigatórias
    if (data.paymentType === 'INSTALLMENTS' && (!data.installments || data.installments.length === 0)) {
      throw new AppError('Parcelas são obrigatórias para vendas parceladas', 400);
    }
  }

  private async processSaleItem(tx: any, saleId: string, item: SaleItemData, itemNumber: number) {
    console.log(`📦 [SaleService] Processando item ${itemNumber}:`, JSON.stringify(item, null, 2));

    // Verificar se produto existe
    const product = await tx.product.findUnique({
      where: { id: item.productId }
    });
    if (!product) {
      throw new AppError(`Produto com ID ${item.productId} não encontrado`, 404);
    }
    console.log('✅ [SaleService] Produto encontrado:', product.name);

    // Verificar se item de estoque existe
    const stockItem = await tx.stockItem.findUnique({
      where: { id: item.stockItemId }
    });
    if (!stockItem) {
      throw new AppError(`Item de estoque com ID ${item.stockItemId} não encontrado`, 404);
    }
    console.log('✅ [SaleService] Item de estoque encontrado, quantidade atual:', stockItem.quantity);

    // Verificar se tem estoque suficiente
    if (stockItem.quantity < item.quantity) {
      throw new AppError(
        `Quantidade insuficiente em estoque para ${product.name}. Disponível: ${stockItem.quantity}, Solicitado: ${item.quantity}`,
        400
      );
    }

    // Criar item da venda
    console.log('💾 [SaleService] Criando item da venda');
    await tx.saleItem.create({
      data: {
        saleId,
        productId: item.productId,
        stockItemId: item.stockItemId,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }
    });

    // Atualizar estoque
    console.log('📉 [SaleService] Atualizando estoque, decrementando', item.quantity);
    await tx.stockItem.update({
      where: { id: item.stockItemId },
      data: {
        quantity: {
          decrement: item.quantity
        }
      }
    });
    console.log('✅ [SaleService] Item processado com sucesso');
  }

  private async processInstallments(tx: any, saleId: string, customerId: string, installments: InstallmentData[]) {
    for (const [index, installment] of installments.entries()) {
      console.log(`💳 [SaleService] Processando parcela ${index + 1}:`, JSON.stringify(installment, null, 2));

      // Determinar status baseado no campo isPaid
      const status = installment.isPaid ? 'PAID' : 'PENDING';
      const paidDate = installment.isPaid ? new Date() : null;

      await tx.installment.create({
        data: {
          saleId,
          customerId,
          number: installment.number,
          amount: installment.amount,
          dueDate: new Date(installment.dueDate),
          status,
          paidDate,
          paymentType: installment.isPaid ? 'CASH' : null // Assumir pagamento em dinheiro para parcelas pagas
        }
      });
      console.log('✅ [SaleService] Parcela criada com status:', status);
    }
  }

  async cancel(id: string, reason?: string) {
    try {
      const sale = await this.findById(id);

      if (sale.status === 'CANCELLED') {
        throw new AppError('Venda já está cancelada', 400);
      }

      return await prisma.$transaction(async (tx) => {
        // Atualizar status da venda
        await tx.sale.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            notes: reason ? `${sale.notes || ''}\nCancelada: ${reason}` : sale.notes
          }
        });

        // Reverter estoque
        for (const item of sale.saleItems) {
          await tx.stockItem.update({
            where: { id: item.stockItemId },
            data: {
              quantity: {
                increment: item.quantity
              }
            }
          });
        }

        // Cancelar parcelas pendentes
        await tx.installment.updateMany({
          where: {
            saleId: id,
            status: 'PENDING'
          },
          data: {
            status: 'CANCELLED'
          }
        });

        return await this.findById(id);
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao cancelar venda:', error);
      throw new AppError('Erro ao cancelar venda', 500);
    }
  }

  async getSalesReport(filters: {
    storeId?: string;
    startDate?: string;
    endDate?: string;
  } = {}) {
    try {
      const where: any = { status: { not: 'CANCELLED' } };
      
      if (filters.storeId) where.storeId = filters.storeId;
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
        if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
      }

      const sales = await prisma.sale.findMany({
        where,
        include: {
          saleItems: {
            include: {
              product: true
            }
          }
        }
      });

      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const totalDiscount = sales.reduce((sum, sale) => sum + Number(sale.discount || 0), 0);

      const paymentTypeBreakdown = sales.reduce((acc, sale) => {
        acc[sale.paymentType] = (acc[sale.paymentType] || 0) + Number(sale.total);
        return acc;
      }, {} as Record<string, number>);

      const topProducts = sales
        .flatMap(sale => sale.saleItems)
        .reduce((acc, item) => {
          const key = item.productId;
          if (!acc[key]) {
            acc[key] = {
              product: item.product,
              quantity: 0,
              revenue: 0
            };
          }
          acc[key].quantity += item.quantity;
          acc[key].revenue += Number(item.total);
          return acc;
        }, {} as Record<string, any>);

      const topProductsList = Object.values(topProducts)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10);

      return {
        totalSales,
        totalRevenue,
        totalDiscount,
        paymentTypeBreakdown,
        topProducts: topProductsList,
        sales
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de vendas:', error);
      throw new AppError('Erro ao gerar relatório de vendas', 500);
    }
  }
}
