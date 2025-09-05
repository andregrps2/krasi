import { prisma } from './prisma.service';
import { CreateInstallmentData, UpdateInstallmentData, PayInstallmentData, AppError } from '../types';

export class InstallmentService {
  async findAll(filters: {
    storeId?: string;
    customerId?: string;
    status?: string;
    overdue?: boolean;
  } = {}) {
    try {
      const where: any = {};
      
      if (filters.customerId) where.customerId = filters.customerId;
      if (filters.status) where.status = filters.status;
      
      if (filters.storeId) {
        where.sale = {
          storeId: filters.storeId
        };
      }
      
      // Filtrar parcelas em atraso
      if (filters.overdue) {
        where.dueDate = {
          lt: new Date()
        };
        where.status = 'PENDING';
      }

      return await prisma.installment.findMany({
        where,
        include: {
          customer: true,
          sale: {
            include: {
              store: true,
              saleItems: {
                include: {
                  product: true
                }
              }
            }
          }
        },
        orderBy: { dueDate: 'asc' }
      });
    } catch (error) {
      console.error('Erro ao buscar parcelas:', error);
      throw new AppError('Erro ao buscar parcelas', 500);
    }
  }

  async findById(id: string) {
    try {
      const installment = await prisma.installment.findUnique({
        where: { id },
        include: {
          customer: true,
          sale: {
            include: {
              store: true,
              user: true,
              saleItems: {
                include: {
                  product: true
                }
              }
            }
          }
        }
      });

      if (!installment) {
        throw new AppError('Parcela não encontrada', 404);
      }

      return installment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao buscar parcela:', error);
      throw new AppError('Erro ao buscar parcela', 500);
    }
  }

  async create(data: CreateInstallmentData) {
    try {
      // Verificar se venda existe
      const sale = await prisma.sale.findUnique({
        where: { id: data.saleId }
      });
      if (!sale) {
        throw new AppError('Venda não encontrada', 404);
      }

      // Verificar se cliente existe
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId }
      });
      if (!customer) {
        throw new AppError('Cliente não encontrado', 404);
      }

      // Verificar se já existe parcela com mesmo número para esta venda
      const existingInstallment = await prisma.installment.findFirst({
        where: {
          saleId: data.saleId,
          number: data.number
        }
      });
      
      if (existingInstallment) {
        throw new AppError(`Já existe uma parcela número ${data.number} para esta venda`, 400);
      }

      return await prisma.installment.create({
        data: {
          saleId: data.saleId,
          customerId: data.customerId,
          number: data.number,
          amount: data.amount,
          dueDate: new Date(data.dueDate),
          status: data.status || 'PENDING',
          paymentType: data.paymentType,
          paidDate: data.paidDate ? new Date(data.paidDate) : null,
          notes: data.notes
        },
        include: {
          customer: true,
          sale: {
            include: {
              store: true
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao criar parcela:', error);
      throw new AppError('Erro ao criar parcela', 500);
    }
  }

  async update(id: string, data: UpdateInstallmentData) {
    try {
      // Verificar se parcela existe
      await this.findById(id);

      return await prisma.installment.update({
        where: { id },
        data: {
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          paidDate: data.paidDate ? new Date(data.paidDate) : undefined,
          updatedAt: new Date()
        },
        include: {
          customer: true,
          sale: {
            include: {
              store: true
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao atualizar parcela:', error);
      throw new AppError('Erro ao atualizar parcela', 500);
    }
  }

  async pay(id: string, data: PayInstallmentData) {
    try {
      const installment = await this.findById(id);

      if (installment.status === 'PAID') {
        throw new AppError('Parcela já está paga', 400);
      }

      if (installment.status === 'CANCELLED') {
        throw new AppError('Não é possível pagar uma parcela cancelada', 400);
      }

      const paidDate = data.paidDate ? new Date(data.paidDate) : new Date();

      return await prisma.installment.update({
        where: { id },
        data: {
          status: 'PAID',
          paymentType: data.paymentType,
          paidDate,
          notes: data.notes ? `${installment.notes || ''}\nPagamento: ${data.notes}` : installment.notes,
          updatedAt: new Date()
        },
        include: {
          customer: true,
          sale: {
            include: {
              store: true
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao pagar parcela:', error);
      throw new AppError('Erro ao pagar parcela', 500);
    }
  }

  async cancel(id: string, reason?: string) {
    try {
      const installment = await this.findById(id);

      if (installment.status === 'PAID') {
        throw new AppError('Não é possível cancelar uma parcela já paga', 400);
      }

      if (installment.status === 'CANCELLED') {
        throw new AppError('Parcela já está cancelada', 400);
      }

      return await prisma.installment.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          notes: reason ? `${installment.notes || ''}\nCancelada: ${reason}` : installment.notes,
          updatedAt: new Date()
        },
        include: {
          customer: true,
          sale: {
            include: {
              store: true
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao cancelar parcela:', error);
      throw new AppError('Erro ao cancelar parcela', 500);
    }
  }

  async getOverdueInstallments(storeId?: string) {
    try {
      return await this.findAll({
        storeId,
        overdue: true
      });
    } catch (error) {
      console.error('Erro ao buscar parcelas em atraso:', error);
      throw new AppError('Erro ao buscar parcelas em atraso', 500);
    }
  }

  async getCustomerInstallments(customerId: string, status?: string) {
    try {
      return await this.findAll({
        customerId,
        status
      });
    } catch (error) {
      console.error('Erro ao buscar parcelas do cliente:', error);
      throw new AppError('Erro ao buscar parcelas do cliente', 500);
    }
  }

  async getInstallmentsReport(filters: {
    storeId?: string;
    startDate?: string;
    endDate?: string;
  } = {}) {
    try {
      const where: any = {};
      
      if (filters.storeId) {
        where.sale = {
          storeId: filters.storeId
        };
      }
      
      if (filters.startDate || filters.endDate) {
        where.dueDate = {};
        if (filters.startDate) where.dueDate.gte = new Date(filters.startDate);
        if (filters.endDate) where.dueDate.lte = new Date(filters.endDate);
      }

      const installments = await prisma.installment.findMany({
        where,
        include: {
          customer: true,
          sale: {
            include: {
              store: true
            }
          }
        }
      });

      const totalInstallments = installments.length;
      const totalAmount = installments.reduce((sum, inst) => sum + Number(inst.amount), 0);
      
      const paidInstallments = installments.filter(inst => inst.status === 'PAID');
      const totalPaid = paidInstallments.reduce((sum, inst) => sum + Number(inst.amount), 0);
      
      const pendingInstallments = installments.filter(inst => inst.status === 'PENDING');
      const totalPending = pendingInstallments.reduce((sum, inst) => sum + Number(inst.amount), 0);
      
      const overdueInstallments = pendingInstallments.filter(inst => inst.dueDate < new Date());
      const totalOverdue = overdueInstallments.reduce((sum, inst) => sum + Number(inst.amount), 0);

      return {
        totalInstallments,
        totalAmount,
        totalPaid,
        totalPending,
        totalOverdue,
        paidCount: paidInstallments.length,
        pendingCount: pendingInstallments.length,
        overdueCount: overdueInstallments.length,
        installments
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de parcelas:', error);
      throw new AppError('Erro ao gerar relatório de parcelas', 500);
    }
  }

  async updateOverdueInstallments() {
    try {
      // Atualizar status de parcelas em atraso
      const result = await prisma.installment.updateMany({
        where: {
          status: 'PENDING',
          dueDate: {
            lt: new Date()
          }
        },
        data: {
          status: 'OVERDUE'
        }
      });

      console.log(`${result.count} parcelas marcadas como em atraso`);
      return result;
    } catch (error) {
      console.error('Erro ao atualizar parcelas em atraso:', error);
      throw new AppError('Erro ao atualizar parcelas em atraso', 500);
    }
  }
}
