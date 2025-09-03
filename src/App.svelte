<script lang="ts">
  import { stock, propertyDefinitions } from './stores';
  import type { StockItem } from './types';
  import StockList from './lib/StockList.svelte';
  import FilterForm from './lib/FilterForm.svelte';
  import Modal from './lib/Modal.svelte';
  import ProductForm from './lib/ProductForm.svelte';
  import PropertyManager from './lib/PropertyManager.svelte';
  import { onMount } from 'svelte';

  // --- State ---
  let showProductModal = false;
  let showPropertyModal = false;
  let editingItem: StockItem | null = null;

  // --- Filtering & Sorting State ---
  let searchTerm = '';
  let filters: Record<string, string> = {};
  let sortKey: string | null = null; // The ID of the property to sort by
  let sortDirection: 'asc' | 'desc' = 'asc';

  onMount(() => {
    propertyDefinitions.subscribe(defs => {
      const newFilters: Record<string, string> = {};
      defs.forEach(prop => {
        newFilters[prop.id] = '';
      });
      filters = newFilters;
    });
  });

  // --- Derived State (Computed) ---
  $: processedStock = (() => {
    // Create a new array from $stock to avoid modifying the original store data directly.
    let items = [...$stock];

    // 1. Filtering
    items = items.filter(item => {
      // Gracefully handle items that might not have a properties object
      if (!item || !item.properties) {
        return false;
      }

      const term = searchTerm.toLowerCase().trim();
      if (term) {
        const matchesSearchTerm = Object.values(item.properties)
          .some(val => String(val).toLowerCase().includes(term));
        if (!matchesSearchTerm) return false;
      }

      for (const propId in filters) {
        const filterValue = filters[propId]?.toLowerCase().trim();
        if (filterValue) {
          const itemValue = item.properties[propId]?.toLowerCase().trim();
          if (!itemValue || !itemValue.includes(filterValue)) {
            return false;
          }
        }
      }
      return true;
    });

    // 2. Sorting
    if (sortKey) {
      items.sort((a, b) => {
        let valA, valB;

        if (sortKey === 'quantity') {
          valA = a.quantity;
          valB = b.quantity;
        } else {
          // Safely access properties for sorting
          valA = a.properties ? a.properties[sortKey] : undefined;
          valB = b.properties ? b.properties[sortKey] : undefined;
        }

        // Handle cases where property might be null or undefined for robust sorting
        const strA = String(valA ?? '');
        const strB = String(valB ?? '');

        const comparison = strA.localeCompare(strB, undefined, { numeric: true });
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return items;
  })();

  // --- Event Handlers ---
  function handleSort(event: CustomEvent<string>) {
    const newKey = event.detail;
    if (sortKey === newKey) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = newKey;
      sortDirection = 'asc';
    }
  }

  function openAddProductModal() {
    editingItem = null;
    showProductModal = true;
  }

  function openEditProductModal(event: CustomEvent<StockItem>) {
    editingItem = event.detail;
    showProductModal = true;
  }

  function handleSaveProduct(event: CustomEvent<Omit<StockItem, 'id'> & { id?: number }>) {
    const savedItemData = event.detail;
    if (savedItemData.id) {
      $stock = $stock.map(item => (item.id === savedItemData.id ? { ...item, ...savedItemData, id: item.id } : item));
    } else {
      const newId = $stock.length > 0 ? Math.max(...$stock.map(i => i.id)) + 1 : 1;
      const newItem: StockItem = {
        id: newId,
        quantity: savedItemData.quantity,
        properties: savedItemData.properties
      };
      $stock = [...$stock, newItem];
    }
    showProductModal = false;
  }

  function handleDeleteProduct(event: CustomEvent<number>) {
    $stock = $stock.filter(item => item.id !== event.detail);
  }
  
  function handleUpdateQuantity(event: CustomEvent<{ id: number; quantity: number }>) {
    const { id, quantity } = event.detail;
    $stock = $stock.map(item => (item.id === id ? { ...item, quantity } : item));
  }
</script>

<main>
  <h1>Controle de Estoque Dinâmico</h1>

  <Modal bind:show={showProductModal}>
    <h2>{editingItem ? 'Editar Item' : 'Adicionar Item'}</h2>
    <ProductForm item={editingItem} on:save={handleSaveProduct} />
  </Modal>

  <Modal bind:show={showPropertyModal}>
    <h2>Gerenciar Propriedades</h2>
    <PropertyManager />
  </Modal>

  <div class="card search-card">
    <h2>Pesquisar & Filtrar</h2>
    <FilterForm bind:searchTerm bind:filters />
  </div>

  <div class="card list-card">
    <div class="card-header">
      <h2>Estoque Atual ({processedStock.length})</h2>
      <div class="header-actions">
        <button class="secondary" on:click={() => showPropertyModal = true}>Gerenciar Propriedades</button>
        <button on:click={openAddProductModal}>+ Adicionar Novo Item</button>
      </div>
    </div>
    <StockList
      stock={processedStock}
      {sortKey}
      {sortDirection}
      on:sort={handleSort}
      on:editItem={openEditProductModal}
      on:deleteItem={handleDeleteProduct}
      on:updateQuantity={handleUpdateQuantity}
    />
  </div>
</main>

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  h1 {
    text-align: center;
    margin-bottom: 2rem;
  }
  h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1rem;
  }
  .header-actions {
      display: flex;
      gap: 1rem;
  }
</style>
