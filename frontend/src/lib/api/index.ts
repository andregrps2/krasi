export { api as default } from './client';
export { productsApi } from './products';
export { stockApi } from './stock';
export { customersApi } from './customers';
export { storesApi } from './stores';
export { salesApi } from './sales';
export { installmentsApi } from './installments';
export { companiesApi } from './companies';

// Re-export types for convenience
export type {
  StockFormData,
  StockFilters,
  StockQuantityUpdate
} from './stock';

export type {
  CustomerFilters
} from './customers';

export type {
  StoreFormData,
  StoreFilters,
  StoreDashboard
} from './stores';

export type {
  SaleFormData,
  SaleItemFormData,
  InstallmentFormData,
  SaleFilters
} from './sales';
