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

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

export interface SaleFormData {
  customerId?: string;
  paymentType: PaymentType;
  discount?: number;
  notes?: string;
  items: {
    stockItemId: string;
    quantity: number;
    price: number;
  }[];
  installments?: {
    amount: number;
    dueDate: string;
  }[];
}

// Filter and search types
export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  active?: boolean;
}

export interface SaleFilters {
  storeId?: string;
  customerId?: string;
  paymentType?: PaymentType;
  status?: SaleStatus;
  startDate?: string;
  endDate?: string;
}

export interface InstallmentFilters {
  storeId?: string;
  customerId?: string;
  status?: InstallmentStatus;
  overdue?: boolean;
  startDate?: string;
  endDate?: string;
}
