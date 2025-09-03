/**
 * Define o tipo de um campo de propriedade.
 * 'text': Campo de texto livre.
 * 'select': Campo de seleção com opções pré-definidas.
 */
export type PropertyType = 'text' | 'select';

/**
 * Define a estrutura de uma propriedade customizável.
 */
export interface PropertyDefinition {
  id: string; // ID único, ex: 'marca'
  name: string; // Nome exibido na UI, ex: 'Marca'
  type: PropertyType;
  options?: string[]; // Lista de opções se o tipo for 'select'
}

/**
 * Representa um item no estoque, agora com propriedades dinâmicas.
 */
export interface StockItem {
  id: number;
  quantity: number;
  // Armazena os valores das propriedades, usando o ID da propriedade como chave.
  // ex: { marca: 'Marca Fina', cor: 'Azul' }
  properties: Record<string, string>; 
}

/**
 * Representa um cliente
 */
export interface Customer {
  id: number;
  name: string;
  congregation: string;
  whatsappNumber: string;
  createdAt: Date;
  // Campos de endereço
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

/**
 * Representa um item vendido
 */
export interface SaleItem {
  stockItemId: number;
  stockItem: StockItem;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * Tipo de pagamento
 */
export type PaymentType = 'cash' | 'installments';

/**
 * Status da parcela
 */
export type InstallmentStatus = 'pending' | 'paid' | 'overdue';

/**
 * Representa uma parcela
 */
export interface Installment {
  id: number;
  saleId: number;
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  paidDate?: Date;
  status: InstallmentStatus;
}

/**
 * Representa uma venda completa
 */
export interface Sale {
  id: number;
  date: Date;
  customerId?: number;
  customerName?: string;
  items: SaleItem[];
  totalAmount: number;
  paymentType: PaymentType;
  installments?: Installment[];
}
