import { writable } from 'svelte/store';
import type { PropertyDefinition, StockItem, Sale, Customer, Installment } from './types';

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

// --- Estoque ---

const initialStock: StockItem[] = [
  {
    id: 1,
    quantity: 19,
    properties: {
      brand: 'Breda',
      type: 'Camisa',
      fabric: 'Poliéster',
      size: 'GG',
      color: 'Preto',
      price: '99.99'
    }
  },
  {
    id: 2,
    quantity: 12,
    properties: {
      brand: 'Breda',
      type: 'Camisa',
      fabric: 'Algodão',
      size: 'M',
      color: 'Azul',
      price: '89.99'
    }
  },
  {
    id: 3,
    quantity: 8,
    properties: {
      brand: 'Ricardo',
      type: 'Terno',
      fabric: 'Lã',
      size: 'G',
      color: 'Preto',
      price: '299.99'
    }
  },
  {
    id: 4,
    quantity: 15,
    properties: {
      brand: 'Breda',
      type: 'Palitó',
      fabric: 'Poliéster',
      size: 'P',
      color: 'Cinza',
      price: '199.99'
    }
  },
  {
    id: 5,
    quantity: 25,
    properties: {
      brand: 'Style',
      type: 'Camiseta',
      fabric: 'Algodão',
      size: 'M',
      color: 'Branco',
      price: '49.99'
    }
  },
  {
    id: 6,
    quantity: 6,
    properties: {
      brand: 'Comfort',
      type: 'Sapato',
      fabric: 'Couro',
      size: '42',
      color: 'Marrom',
      price: '159.99'
    }
  }
];

export const stock = createPersistentStore<StockItem[]>('stock-items', initialStock);

// --- Clientes ---

const initialCustomers: Customer[] = [];

export const customers = createPersistentStore<Customer[]>('customers', initialCustomers);

// --- Histórico de Vendas ---

const initialSales: Sale[] = [];

export const salesHistory = createPersistentStore<Sale[]>('sales-history', initialSales);

// --- Parcelas ---

const initialInstallments: Installment[] = [];

export const installments = createPersistentStore<Installment[]>('installments', initialInstallments);
