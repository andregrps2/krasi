<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { propertyDefinitions } from '../stores';
  import type { StockItem } from '../types';

  export let stock: StockItem[] = [];
  export let sortKey: string | null = null;
  export let sortDirection: 'asc' | 'desc' = 'asc';

  const dispatch = createEventDispatcher();

  // --- Sorter --- 
  function requestSort(key: string) {
    dispatch('sort', key);
  }

  // --- Event Handlers ---
  function incrementQuantity(item: StockItem) {
    dispatch('updateQuantity', { id: item.id, quantity: item.quantity + 1 });
  }

  function decrementQuantity(item: StockItem) {
    if (item.quantity > 1) {
      dispatch('updateQuantity', { id: item.id, quantity: item.quantity - 1 });
    }
  }

  function editItem(item: StockItem) {
    dispatch('editItem', item);
  }

  function deleteItem(id: number) {
    dispatch('deleteItem', id);
  }
</script>

<div class="table-container">
  <table>
    <thead>
      <tr>
        <!-- Dynamically generate table headers -->
        {#each $propertyDefinitions as prop (prop.id)}
          <th on:click={() => requestSort(prop.id)} class="sortable">
            {prop.name}
            {#if sortKey === prop.id}
              <span class="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
            {/if}
          </th>
        {/each}

        <!-- Static headers -->
        <th on:click={() => requestSort('quantity')} class="sortable quantity-header">
          Qtd.
          {#if sortKey === 'quantity'}
            <span class="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
          {/if}
        </th>
        <th class="actions-header">Ações</th>
      </tr>
    </thead>
    <tbody>
      {#if stock.length === 0}
        <tr>
          <td colspan={$propertyDefinitions.length + 2} class="empty-state">
            Nenhum item encontrado. Tente ajustar seus filtros ou adicione um novo produto!
          </td>
        </tr>
      {/if}
      {#each stock as item (item.id)}
        <tr>
          <!-- Dynamic data cells -->
          {#each $propertyDefinitions as prop (prop.id)}
            <td>{item.properties[prop.id] || '-'}</td>
          {/each}
          
          <!-- Static data cells -->
          <td>
            <div class="quantity-controls">
              <button class="outline sm" on:click={() => decrementQuantity(item)}>−</button>
              <span>{item.quantity}</span>
              <button class="outline sm" on:click={() => incrementQuantity(item)}>+</button>
            </div>
          </td>
          <td class="actions-cell">
            <button class="secondary sm" on:click={() => editItem(item)}>Editar</button>
            <button class="danger sm" on:click={() => deleteItem(item.id)}>Excluir</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  /* ... styles from previous step ... */
  .table-container {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    white-space: nowrap;
  }
  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle;
  }
  th {
    font-weight: 600;
    color: var(--primary-color);
    background-color: rgba(250, 204, 21, 0.05);
    position: sticky;
    top: 0;
  }
  th.sortable {
    cursor: pointer;
    user-select: none;
  }
  th.sortable:hover {
    background-color: rgba(250, 204, 21, 0.15);
  }
  .sort-indicator {
    margin-left: 0.5rem;
    font-size: 0.8em;
    color: var(--primary-color);
  }
  .quantity-header, .actions-header {
    text-align: center;
  }
  .quantity-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  .quantity-controls span {
    min-width: 20px;
    text-align: center;
  }
  .actions-cell {
    text-align: center;
  }
   .actions-cell button {
    margin: 0 0.2rem;
  }
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #aaa;
  }
</style>
