import { z } from 'zod';

// Sale Types
export const SaleItemSchema = z.object({
  productId: z.string().min(1),
  stockItemId: z.string().min(1),
  quantity: z.number().min(1),
  price: z.number().min(0),
  total: z.number().min(0)
});

export const InstallmentSchema = z.object({
  number: z.number().min(1),
  amount: z.number().min(0),
  dueDate: z.string(),
  isDownPayment: z.boolean().optional(),
  isPaid: z.boolean().optional()
});

export const CreateSaleSchema = z.object({
  storeId: z.string().min(1, 'ID da loja é obrigatório'),
  userId: z.string().optional(),
  customerId: z.string().optional(),
  total: z.number().min(0, 'Total deve ser positivo'),
  discount: z.number().min(0).optional(),
  paymentType: z.enum(['CASH', 'CARD', 'PIX', 'INSTALLMENTS', 'FIADO']),
  notes: z.string().optional(),
  items: z.array(SaleItemSchema).min(1, 'Deve ter pelo menos um item'),
  installments: z.array(InstallmentSchema).optional()
});

export type CreateSaleData = z.infer<typeof CreateSaleSchema>;
export type SaleItemData = z.infer<typeof SaleItemSchema>;
export type InstallmentData = z.infer<typeof InstallmentSchema>;

// Customer Types
export const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  birthDate: z.string().optional().or(z.date().optional()),
  storeId: z.string().min(1, 'ID da loja é obrigatório')
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial().omit({ storeId: true });

export type CreateCustomerData = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerData = z.infer<typeof UpdateCustomerSchema>;

// Product Types
export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().default('un')
});

export const UpdateProductSchema = CreateProductSchema.partial();

export type CreateProductData = z.infer<typeof CreateProductSchema>;
export type UpdateProductData = z.infer<typeof UpdateProductSchema>;

// Stock Types
export const CreateStockItemSchema = z.object({
  productId: z.string().min(1, 'ID do produto é obrigatório'),
  storeId: z.string().min(1, 'ID da loja é obrigatório'),
  quantity: z.number().min(0).default(0),
  minQuantity: z.number().min(0).default(0),
  maxQuantity: z.number().min(0).optional(),
  purchasePrice: z.number().min(0),
  salePrice: z.number().min(0)
});

export const UpdateStockItemSchema = CreateStockItemSchema.partial().omit({ productId: true, storeId: true });

export type CreateStockItemData = z.infer<typeof CreateStockItemSchema>;
export type UpdateStockItemData = z.infer<typeof UpdateStockItemSchema>;

// Installment Types
export const CreateInstallmentSchema = z.object({
  saleId: z.string().min(1, 'ID da venda é obrigatório'),
  customerId: z.string().min(1, 'ID do cliente é obrigatório'),
  number: z.number().min(1, 'Número da parcela deve ser positivo'),
  amount: z.number().min(0, 'Valor deve ser positivo'),
  dueDate: z.string().or(z.date()),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).default('PENDING'),
  paymentType: z.enum(['CASH', 'CARD', 'PIX', 'INSTALLMENTS', 'FIADO']).optional(),
  paidDate: z.string().or(z.date()).optional(),
  notes: z.string().optional()
});

export const UpdateInstallmentSchema = CreateInstallmentSchema.partial().omit({ saleId: true, customerId: true });
export const PayInstallmentSchema = z.object({
  paymentType: z.enum(['CASH', 'CARD', 'PIX']),
  paidDate: z.string().or(z.date()).optional(),
  notes: z.string().optional()
});

export type CreateInstallmentData = z.infer<typeof CreateInstallmentSchema>;
export type UpdateInstallmentData = z.infer<typeof UpdateInstallmentSchema>;
export type PayInstallmentData = z.infer<typeof PayInstallmentSchema>;

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error Types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}
