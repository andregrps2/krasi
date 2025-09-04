import { writable, derived } from 'svelte/store';
import type { PropertyDefinition, StockItemOld as StockItem, Sale, Customer, Installment } from './types-new';
import { stockService, customersService, salesService } from './lib/services';

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

// --- Propriedades Customizáveis ---

const initialProperties: PropertyDefinition[] = [
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
];

export const propertyDefinitions = createPersistentStore<PropertyDefinition[]>('property-definitions', initialProperties);

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

// --- Parcelas (ainda em localStorage) ---

const initialInstallments: Installment[] = [];

export const installments = createPersistentStore<Installment[]>('installments', initialInstallments);

// --- Store reativo que carrega dados quando a loja muda ---

currentStoreId.subscribe(async (storeId) => {
  if (storeId) {
    console.log('Carregando dados para loja:', storeId);
    await Promise.all([
      loadStockForStore(storeId),
      loadCustomersForStore(storeId),
      loadSalesForStore(storeId)
    ]);
  } else {
    // Limpar dados quando não há loja selecionada
    stock.set([]);
    customers.set([]);
    salesHistory.set([]);
  }
});
