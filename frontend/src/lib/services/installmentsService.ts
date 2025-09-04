import { installmentsApi } from '../api';
import type { Installment, InstallmentWithRelations } from '../../types-new';

class InstallmentsService {
  // Removendo cache para debug
  // private installmentsCache = new Map<string, InstallmentWithRelations[]>();
  
  async getInstallmentsByStore(storeId: string): Promise<InstallmentWithRelations[]> {
    console.log('🔍 [INSTALLMENTS SERVICE] Buscando parcelas para loja:', storeId);
    
    try {
      // Sempre buscar dados frescos do servidor
      const storeInstallments = await installmentsApi.getAll({ storeId });
      
      console.log('✅ [INSTALLMENTS SERVICE] Parcelas obtidas da API:', storeInstallments.length);
      console.log('📋 [INSTALLMENTS SERVICE] IDs das parcelas:', storeInstallments.map(i => i.id));
      
      return storeInstallments;
    } catch (error) {
      console.error('❌ [INSTALLMENTS SERVICE] Erro ao carregar parcelas:', error);
      return [];
    }
  }

  async refreshInstallments(storeId: string): Promise<InstallmentWithRelations[]> {
    // Sem cache, sempre retorna dados frescos
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
      console.log('📤 [INSTALLMENTS SERVICE] Criando parcela:', installmentData);
      
      const newInstallment = await installmentsApi.create(installmentData);
      
      console.log('✅ [INSTALLMENTS SERVICE] Parcela criada:', newInstallment.id);
      
      return newInstallment;
    } catch (error) {
      console.error('❌ [INSTALLMENTS SERVICE] Erro ao criar parcela:', error);
      throw error;
    }
  }

  clearCache() {
    // Cache removido - nada para limpar
    console.log('🧹 [INSTALLMENTS SERVICE] Cache limpo (desabilitado)');
  }
}

export const installmentsService = new InstallmentsService();
