import { writable } from 'svelte/store';
import type { PropertyDefinition, StockItem, Sale } from './types';

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
];

export const propertyDefinitions = createPersistentStore<PropertyDefinition[]>('property-definitions', initialProperties);

// --- Estoque ---

const initialStock: StockItem[] = [];

export const stock = createPersistentStore<StockItem[]>('stock-items', initialStock);

// --- Histórico de Vendas ---

const initialSales: Sale[] = [];

export const salesHistory = createPersistentStore<Sale[]>('sales-history', initialSales);
