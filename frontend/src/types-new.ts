// Enums
export enum PaymentType {
  CASH = 'CASH',
  CARD = 'CARD', 
  PIX = 'PIX',
  INSTALLMENTS = 'INSTALLMENTS',
  FIADO = 'FIADO'
}

export enum SaleStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED'
}

export enum InstallmentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER'
}

// Core interfaces
export interface Company {
  id: string;
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    stockItems: number;
    customers: number;
    sales: number;
    users: number;
  };
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  barcode?: string;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockItem {
  id: string;
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
  purchasePrice: number;
  salePrice: number;
  isActive: boolean;
  productId: string;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  address?: string;
  birthDate?: Date;
  isActive: boolean;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
  // Campos para compatibilidade com tipos antigos
  congregation?: string;
  whatsappNumber?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  total: number;
  discount?: number;
  paymentType: PaymentType;
  status: SaleStatus;
  notes?: string;
  customerId?: string;
  storeId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: string;
  quantity: number;
  price: number;
  total: number;
  saleId: string;
  productId: string;
  stockItemId: string;
}

export interface Installment {
  id: string;
  number: number;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: InstallmentStatus;
  paymentType?: PaymentType;
  notes?: string;
  saleId: string;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extended interfaces with relations
export interface ProductWithStock extends Product {
  stockItems: (StockItem & { store: Store })[];
}

export interface StockItemWithRelations extends StockItem {
  product: Product;
  store: Store;
}

export interface CustomerWithStats extends Customer {
  store: Store;
  _count: {
    sales: number;
    installments: number;
  };
}

export interface SaleWithRelations extends Sale {
  customer?: Customer;
  store: Store;
  user: User;
  saleItems: (SaleItem & {
    product: Product;
    stockItem: StockItem;
  })[];
  installments: Installment[];
}

export interface InstallmentWithRelations extends Installment {
  customer: Customer;
  sale: Sale & { store: Store };
}

// Cart interfaces for frontend
export interface CartItem {
  id: string;
  product: Product;
  stockItem: StockItem;
  quantity: number;
  price: number;
  total: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  discount?: number;
  finalTotal: number;
}

// Form types
export interface ProductFormData {
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  barcode?: string;
  unit: string;
}

export interface CustomerFormData {
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  address?: string;
  birthDate?: string;
}

// Filter and search types
export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  active?: boolean;
}

// Legacy types for compatibility with existing components
export interface PropertyDefinition {
  id: string;
  name: string;
  type: 'text' | 'select';
  options?: string[];
}

export interface StockItemOld {
  id: string;
  name: string;
  price: number;
  quantity: number;
  brand: string;
  category: string;
  properties: Record<string, string>;
  productId?: string; // ID real do produto no banco de dados
}

export interface CustomerOld {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface PaymentTypeOld {
  id: string;
  name: string;
  requiresCustomer?: boolean;
}

export interface ProductOld {
  id: string;
  name: string;
  price: number;
}

export interface StoreWithDetails extends Store {
  company: Company;
  stockItems: (StockItem & { product: Product })[];
  customers: Customer[];
  sales: (Sale & {
    customer?: Customer;
    saleItems: (SaleItem & { product: Product })[];
    installments: Installment[];
  })[];
  _count: {
    stockItems: number;
    customers: number;
    sales: number;
    users: number;
  };
}

// Dashboard types
export interface SalesSummary {
  total: number;
  count: number;
}

export interface TopProduct {
  productId: string;
  product?: Product;
  quantity: number;
  total: number;
}

export interface StoreDashboard {
  salesToday: SalesSummary;
  salesMonth: SalesSummary;
  customersCount: number;
  lowStockItems: StockItem[];
  pendingInstallments: Installment[];
  topProducts: TopProduct[];
}
