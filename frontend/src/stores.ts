import { writable, derived } from 'svelte/store';
import type { PropertyDefinition, StockItemOld as StockItem, Sale, Customer, Installment, InstallmentWithRelations, Store } from './types-new';
import { stockService, customersService, salesService, installmentsService } from './lib/services';

/**
 * Cria uma Svelte store (writable) que sincroniza seu estado com o localStorage.
 * @param key A chave usada para armazenar o valor no localStorage.
 * @param startValue O valor inicial a ser usado se nada for encontrado no localStorage.
 */
function createPersistentStore<T>(key: string, startValue: T) {
  const storedValue = localStorage.getItem(key);
  const initialValue = storedValue ? JSON.parse(storedValue) : startValue;
  
  const store = writable<T>(initialValue);

  store.subscribe(currentValue => {
    localStorage.setItem(key, JSON.stringify(currentValue));
  });

  return store;
}

// --- Store da loja atual selecionada ---
export const currentStoreId = writable<string | null>(null);
export const selectedStore = writable<Store | null>(null);

// --- Propriedades Customizáveis ---

const initialProperties: PropertyDefinition[] = [
  {
    id: 'name',
    name: 'Nome',
    type: 'text',
  },
  {
    id: 'brand',
    name: 'Marca',
    type: 'text',
  },
  {
    id: 'type',
    name: 'Tipo',
    type: 'select',
    options: ['Camisa', 'Camiseta', 'Palitó', 'Terno', 'Sapato'],
  },
  {
    id: 'fabric',
    name: 'Tecido',
    type: 'text',
  },
    {
    id: 'size',
    name: 'Tamanho',
    type: 'text',
  },
  {
    id: 'color',
    name: 'Cor',
    type: 'text',
  },
  {
    id: 'price',
    name: 'Preço',
    type: 'text',
  },
  {
    id: 'category',
    name: 'Categoria',
    type: 'text',
  },
];

// Função para garantir que as propriedades incluam 'name' e 'category'
function ensureRequiredProperties(properties: PropertyDefinition[]): PropertyDefinition[] {
  const hasName = properties.some(prop => prop.id === 'name');
  const hasCategory = properties.some(prop => prop.id === 'category');
  
  let updatedProperties = [...properties];
  
  if (!hasName) {
    updatedProperties.unshift({
      id: 'name',
      name: 'Nome',
      type: 'text',
    });
  }
  
  if (!hasCategory) {
    updatedProperties.push({
      id: 'category',
      name: 'Categoria',
      type: 'text',
    });
  }
  
  return updatedProperties;
}

// Store das propriedades customizáveis
function createPropertyStore() {
  const PROPERTIES_VERSION = '3.0'; // Incrementar para forçar reset
  const versionKey = 'property-definitions-version';
  const currentVersion = localStorage.getItem(versionKey);
  
  if (currentVersion !== PROPERTIES_VERSION) {
    // Limpar localStorage se a versão mudou
    localStorage.removeItem('property-definitions');
    localStorage.setItem(versionKey, PROPERTIES_VERSION);
    console.log('🔄 [PROPERTIES] Forçando atualização das propriedades para versão', PROPERTIES_VERSION);
    
    // Forçar recriação imediata das propriedades
    localStorage.setItem('property-definitions', JSON.stringify(initialProperties));
  }
  
  const store = createPersistentStore<PropertyDefinition[]>('property-definitions', initialProperties);
  
  // Garantir que as propriedades essenciais estejam presentes
  store.update(properties => {
    const updated = ensureRequiredProperties(properties);
    console.log('📋 [PROPERTIES] Propriedades carregadas:', updated.map(p => p.id));
    return updated;
  });
  
  return store;
}

export const propertyDefinitions = createPropertyStore();

// --- Estoque Dinâmico ---

export const stock = writable<StockItem[]>([]);

// Função para carregar estoque da loja atual
export async function loadStockForStore(storeId: string) {
  try {
    const storeStock = await stockService.getStockByStore(storeId);
    stock.set(storeStock);
  } catch (error) {
    console.error('Erro ao carregar estoque:', error);
    stock.set([]);
  }
}

// --- Clientes Dinâmicos ---

export const customers = writable<Customer[]>([]);

// Função para carregar clientes da loja atual
export async function loadCustomersForStore(storeId: string) {
  try {
    const storeCustomers = await customersService.getCustomersByStore(storeId);
    customers.set(storeCustomers);
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
    customers.set([]);
  }
}

// --- Histórico de Vendas Dinâmico ---

export const salesHistory = writable<Sale[]>([]);

// Função para carregar vendas da loja atual
export async function loadSalesForStore(storeId: string) {
  try {
    const storeSales = await salesService.getSalesByStore(storeId);
    salesHistory.set(storeSales);
  } catch (error) {
    console.error('Erro ao carregar vendas:', error);
    salesHistory.set([]);
  }
}

// --- Parcelas Dinâmicas ---

export const installments = writable<InstallmentWithRelations[]>([]);

// Função para carregar parcelas da loja atual
export async function loadInstallmentsForStore(storeId: string) {
  try {
    const storeInstallments = await installmentsService.getInstallmentsByStore(storeId);
    installments.set(storeInstallments);
  } catch (error) {
    console.error('Erro ao carregar parcelas:', error);
    installments.set([]);
  }
}

// --- Store reativo que carrega dados quando a loja muda ---

currentStoreId.subscribe(async (storeId) => {
  if (storeId) {
    console.log('Carregando dados para loja:', storeId);
    await Promise.all([
      loadStockForStore(storeId),
      loadCustomersForStore(storeId),
      loadSalesForStore(storeId),
      loadInstallmentsForStore(storeId)
    ]);
  } else {
    // Limpar dados quando não há loja selecionada
    stock.set([]);
    customers.set([]);
    salesHistory.set([]);
    installments.set([]);
  }
});
