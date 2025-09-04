import { installmentsApi } from '../api';
import type { Installment } from '../../types-new';

class InstallmentsService {
  private installmentsCache = new Map<string, Installment[]>();
  
  async getInstallmentsByStore(storeId: string): Promise<Installment[]> {
    // Verificar cache primeiro
    if (this.installmentsCache.has(storeId)) {
      return this.installmentsCache.get(storeId)!;
    }

    try {
      // Buscar todas as parcelas da loja específica
      const storeInstallments = await installmentsApi.getAll({ storeId });
      
      // Salvar no cache
      this.installmentsCache.set(storeId, storeInstallments);
      
      return storeInstallments;
    } catch (error) {
      console.error('Erro ao carregar parcelas:', error);
      return [];
    }
  }

  async refreshInstallments(storeId: string): Promise<Installment[]> {
    // Limpar cache e recarregar
    this.installmentsCache.delete(storeId);
    return this.getInstallmentsByStore(storeId);
  }

  async payInstallment(id: string, paymentData: {
    paymentDate?: Date;
    paymentMethod?: string;
  }): Promise<Installment> {
    try {
      const updatedInstallment = await installmentsApi.pay(id, paymentData);
      
      // Atualizar cache removendo todas as entradas para forçar recarregamento
      this.clearCache();
      
      return updatedInstallment;
    } catch (error) {
      console.error('Erro ao pagar parcela:', error);
      throw error;
    }
  }

  async createInstallment(storeId: string, installmentData: any): Promise<Installment> {
    try {
      const newInstallment = await installmentsApi.create(installmentData);
      
      // Atualizar cache
      await this.refreshInstallments(storeId);
      
      return newInstallment;
    } catch (error) {
      console.error('Erro ao criar parcela:', error);
      throw error;
    }
  }

  clearCache() {
    this.installmentsCache.clear();
  }
}

export const installmentsService = new InstallmentsService();
