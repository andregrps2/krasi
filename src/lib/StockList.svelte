<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { propertyDefinitions } from "../stores";
  import type { StockItem, PropertyDefinition } from "../types";
  import FilterModal from "./FilterModal.svelte";

  export let stock: StockItem[] = [];
  export let sortKey: string | null = null;
  export let sortDirection: "asc" | "desc" = "asc";
  export let filters: Record<string, string> = {};
  export let searchTerm = "";

  const dispatch = createEventDispatcher();

  // Modal state
  let showFilterModal = false;
  let activeFilterProperty: PropertyDefinition | null = null;

  // --- Sorter ---
  function requestSort(key: string) {
    dispatch("sort", key);
  }

  // --- Filter Modal Handlers ---
  function openFilterModal(property: PropertyDefinition) {
    activeFilterProperty = property;
    showFilterModal = true;
  }

  function handleFilterApply(
    event: CustomEvent<{ propertyId: string; value: string }>
  ) {
    const { propertyId, value } = event.detail;
    filters[propertyId] = value;
    filters = { ...filters }; // Trigger reactivity
  }

  // --- Event Handlers ---
  function incrementQuantity(item: StockItem) {
    dispatch("updateQuantity", { id: item.id, quantity: item.quantity + 1 });
  }

  function decrementQuantity(item: StockItem) {
    if (item.quantity > 1) {
      dispatch("updateQuantity", { id: item.id, quantity: item.quantity - 1 });
    }
  }

  function editItem(item: StockItem) {
    dispatch("editItem", item);
  }

  function deleteItem(id: number) {
    dispatch("deleteItem", id);
  }

  function clearFilters() {
    searchTerm = "";
    // Reset all property filters
    for (const key in filters) {
      if (Object.prototype.hasOwnProperty.call(filters, key)) {
        filters[key] = "";
      }
    }
    // Trigger the two-way binding update
    filters = { ...filters };
  }
</script>

<div class="table-container">
  <!-- Search bar above the table -->
  <div class="search-bar">
    <input
      class="search-input"
      type="text"
      placeholder="Pesquisar em todas as propriedades..."
      bind:value={searchTerm}
    />
    <button class="clear-btn" on:click={clearFilters}>Limpar Filtros</button>
  </div>

  <table>
    <thead>
      <!-- Column headers with sorting and filter icons -->
      <tr class="header-row">
        {#each $propertyDefinitions as prop (prop.id)}
          <th class="header-cell">
            <div class="header-content">
              <span
                class="header-title"
                on:click={() => requestSort(prop.id)}
                on:keydown={(e) => e.key === "Enter" && requestSort(prop.id)}
                role="button"
                tabindex="0"
              >
                {prop.name}
                {#if sortKey === prop.id}
                  <span class="sort-indicator"
                    >{sortDirection === "asc" ? "▲" : "▼"}</span
                  >
                {/if}
              </span>
              <button
                class="filter-icon"
                on:click={() => openFilterModal(prop)}
                title="Filtrar {prop.name}"
                class:active={filters[prop.id]}
              >
                🔍
              </button>
            </div>
          </th>
        {/each}
        <th class="header-cell quantity-header">
          <div class="header-content">
            <span
              class="header-title"
              on:click={() => requestSort("quantity")}
              on:keydown={(e) => e.key === "Enter" && requestSort("quantity")}
              role="button"
              tabindex="0"
            >
              Qtd.
              {#if sortKey === "quantity"}
                <span class="sort-indicator"
                  >{sortDirection === "asc" ? "▲" : "▼"}</span
                >
              {/if}
            </span>
          </div>
        </th>
        <th class="actions-header">Ações</th>
      </tr>
    </thead>
    <tbody>
      {#if stock.length === 0}
        <tr>
          <td colspan={$propertyDefinitions.length + 2} class="empty-state">
            Nenhum item encontrado. Tente ajustar seus filtros ou adicione um
            novo produto!
          </td>
        </tr>
      {/if}
      {#each stock as item (item.id)}
        <tr>
          <!-- Dynamic data cells -->
          {#each $propertyDefinitions as prop (prop.id)}
            <td>{item.properties[prop.id] || "-"}</td>
          {/each}

          <!-- Static data cells -->
          <td>
            <div class="quantity-controls">
              <button
                class="outline sm"
                on:click={() => decrementQuantity(item)}>−</button
              >
              <span>{item.quantity}</span>
              <button
                class="outline sm"
                on:click={() => incrementQuantity(item)}>+</button
              >
            </div>
          </td>
          <td class="actions-cell">
            <button class="secondary sm" on:click={() => editItem(item)}
              >Editar</button
            >
            <button class="danger sm" on:click={() => deleteItem(item.id)}
              >Excluir</button
            >
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<!-- Filter Modal -->
<FilterModal
  bind:show={showFilterModal}
  property={activeFilterProperty}
  currentValue={activeFilterProperty
    ? filters[activeFilterProperty.id] || ""
    : ""}
  on:apply={handleFilterApply}
/>

<style>
  .table-container {
    overflow-x: auto;
  }

  .search-bar {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    align-items: center;
  }

  .search-input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
  }

  .clear-btn {
    padding: 0.5rem 1rem;
    background-color: transparent;
    border: 1px solid var(--primary-color-border);
    color: var(--primary-color);
    border-radius: 4px;
    cursor: pointer;
    white-space: nowrap;
  }

  .clear-btn:hover {
    background-color: rgba(250, 204, 21, 0.1);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    white-space: nowrap;
  }

  th,
  td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle;
  }

  .header-row th {
    font-weight: 600;
    color: var(--primary-color);
    background-color: rgba(250, 204, 21, 0.05);
    position: sticky;
    top: 0;
  }

  .header-cell {
    position: relative;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .header-title {
    flex: 1;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
  }

  .header-title:hover {
    color: rgba(250, 204, 21, 0.8);
  }

  .filter-icon {
    background: none;
    border: none;
    font-size: 0.9rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 3px;
    opacity: 0.6;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .filter-icon:hover {
    opacity: 1;
    background-color: rgba(250, 204, 21, 0.1);
  }

  .filter-icon.active {
    opacity: 1;
    background-color: var(--primary-color);
    color: white;
  }

  .sort-indicator {
    margin-left: 0.5rem;
    font-size: 0.8em;
    color: var(--primary-color);
  }

  .quantity-header,
  .actions-header {
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
