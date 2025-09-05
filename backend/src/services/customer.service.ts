import { prisma } from './prisma.service';
import { CreateCustomerData, UpdateCustomerData, AppError } from '../types';

export class CustomerService {
  async findAll(storeId?: string) {
    try {
      console.log('👥 [CUSTOMER SERVICE] findAll - Parâmetro storeId:', storeId);
      const where: any = { isActive: true };
      if (storeId) where.storeId = storeId;
      console.log('👥 [CUSTOMER SERVICE] findAll - Condição WHERE:', where);

      const customers = await prisma.customer.findMany({
        where,
        orderBy: { name: 'asc' }
      });
      
      console.log('👥 [CUSTOMER SERVICE] findAll - Resultados encontrados:', customers.length);
      console.log('👥 [CUSTOMER SERVICE] findAll - Clientes:', customers);
      
      return customers;
    } catch (error) {
      console.error('❌ [CUSTOMER SERVICE] Erro ao buscar clientes:', error);
      throw new AppError('Erro ao buscar clientes', 500);
    }
  }

  async findById(id: string) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          store: true,
          sales: {
            include: {
              saleItems: {
                include: {
                  product: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          installments: {
            where: { status: 'PENDING' },
            orderBy: { dueDate: 'asc' }
          }
        }
      });

      if (!customer) {
        throw new AppError('Cliente não encontrado', 404);
      }

      return customer;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao buscar cliente:', error);
      throw new AppError('Erro ao buscar cliente', 500);
    }
  }

  async create(data: CreateCustomerData) {
    try {
      // Verificar se CPF já existe (se fornecido)
      if (data.cpf) {
        const existingCustomer = await prisma.customer.findFirst({
          where: {
            cpf: data.cpf,
            storeId: data.storeId,
            isActive: true
          }
        });

        if (existingCustomer) {
          throw new AppError('Já existe um cliente com este CPF nesta loja', 400);
        }
      }

      return await prisma.customer.create({
        data: {
          name: data.name,
          cpf: data.cpf,
          phone: data.phone,
          email: data.email,
          address: data.address,
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          storeId: data.storeId
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao criar cliente:', error);
      throw new AppError('Erro ao criar cliente', 500);
    }
  }

  async update(id: string, data: UpdateCustomerData) {
    try {
      // Verificar se cliente existe
      const existingCustomer = await this.findById(id);

      // Verificar se CPF já existe em outro cliente da mesma loja
      if (data.cpf && data.cpf !== existingCustomer.cpf) {
        const customerWithCpf = await prisma.customer.findFirst({
          where: {
            cpf: data.cpf,
            storeId: existingCustomer.storeId,
            isActive: true,
            id: { not: id }
          }
        });

        if (customerWithCpf) {
          throw new AppError('Já existe um cliente com este CPF nesta loja', 400);
        }
      }

      return await prisma.customer.update({
        where: { id },
        data: {
          ...data,
          birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao atualizar cliente:', error);
      throw new AppError('Erro ao atualizar cliente', 500);
    }
  }

  async delete(id: string) {
    try {
      // Verificar se cliente existe
      await this.findById(id);

      // Verificar se cliente tem vendas associadas
      const salesCount = await prisma.sale.count({
        where: { customerId: id }
      });

      if (salesCount > 0) {
        // Soft delete - marcar como inativo
        return await prisma.customer.update({
          where: { id },
          data: { isActive: false }
        });
      } else {
        // Hard delete se não tem vendas
        return await prisma.customer.delete({
          where: { id }
        });
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao deletar cliente:', error);
      throw new AppError('Erro ao deletar cliente', 500);
    }
  }

  async search(query: string, storeId?: string) {
    try {
      const where: any = {
        AND: [
          { isActive: true },
          {
            OR: [
              { name: { contains: query } },
              { cpf: { contains: query } },
              { phone: { contains: query } },
              { email: { contains: query } }
            ]
          }
        ]
      };

      if (storeId) where.AND.push({ storeId });

      return await prisma.customer.findMany({
        where,
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      console.error('Erro ao pesquisar clientes:', error);
      throw new AppError('Erro ao pesquisar clientes', 500);
    }
  }

  async getCustomerBalance(customerId: string) {
    try {
      const customer = await this.findById(customerId);
      
      // Buscar parcelas pendentes
      const pendingInstallments = await prisma.installment.findMany({
        where: {
          customerId,
          status: 'PENDING'
        }
      });

      const totalDebt = pendingInstallments.reduce((sum, installment) => {
        return sum + Number(installment.amount);
      }, 0);

      // Buscar parcelas em atraso
      const overdueInstallments = pendingInstallments.filter(
        installment => installment.dueDate < new Date()
      );

      const overdueAmount = overdueInstallments.reduce((sum, installment) => {
        return sum + Number(installment.amount);
      }, 0);

      return {
        customer,
        totalDebt,
        overdueAmount,
        pendingInstallments: pendingInstallments.length,
        overdueInstallments: overdueInstallments.length
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao buscar saldo do cliente:', error);
      throw new AppError('Erro ao buscar saldo do cliente', 500);
    }
  }
}
