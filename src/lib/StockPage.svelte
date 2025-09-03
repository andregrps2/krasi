<script lang="ts">
  import { stock, propertyDefinitions } from "../stores";
  import type { StockItem } from "../types";
  import StockList from "./StockList.svelte";
  import Modal from "./Modal.svelte";
  import ProductForm from "./ProductForm.svelte";
  import PropertyManager from "./PropertyManager.svelte";
  import { onMount } from "svelte";

  // --- State ---
  let showProductModal = false;
  let showPropertyModal = false;
  let editingItem: StockItem | null = null;

  // --- Filtering & Sorting State ---
  let searchTerm = "";
  let filters: Record<string, string> = {};
  let sortKey: string | null = null;
  let sortDirection: "asc" | "desc" = "asc";

  onMount(() => {
    propertyDefinitions.subscribe((defs) => {
      const newFilters: Record<string, string> = {};
      defs.forEach((prop) => {
        newFilters[prop.id] = "";
      });
      filters = newFilters;
    });
  });

  // --- Derived State (Computed) ---
  $: processedStock = (() => {
    let items = [...$stock];

    // 1. Filtering
    items = items.filter((item) => {
      if (!item || !item.properties) {
        return false;
      }

      const term = searchTerm.toLowerCase().trim();
      if (term) {
        const matchesSearchTerm = Object.values(item.properties).some((val) =>
          String(val).toLowerCase().includes(term)
        );
        if (!matchesSearchTerm) return false;
      }

      for (const propId in filters) {
        const filterValue = filters[propId]?.trim();
        if (filterValue) {
          const itemValue = item.properties[propId]?.trim();
          const propertyDef = $propertyDefinitions.find(
            (prop) => prop.id === propId
          );

          if (!itemValue) {
            return false;
          }

          if (propertyDef?.type === "select") {
            if (itemValue !== filterValue) {
              return false;
            }
          } else {
            if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) {
              return false;
            }
          }
        }
      }
      return true;
    });

    // 2. Sorting
    if (sortKey) {
      items.sort((a, b) => {
        let valA, valB;

        if (sortKey === "quantity") {
          valA = a.quantity;
          valB = b.quantity;
        } else {
          valA = a.properties && sortKey ? a.properties[sortKey] : undefined;
          valB = b.properties && sortKey ? b.properties[sortKey] : undefined;
        }

        const strA = String(valA ?? "");
        const strB = String(valB ?? "");

        const comparison = strA.localeCompare(strB, undefined, {
          numeric: true,
        });

        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return items;
  })();

  // --- Event Handlers ---
  function handleSort(event: CustomEvent<string>) {
    const newKey = event.detail;
    if (sortKey === newKey) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortKey = newKey;
      sortDirection = "asc";
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

  function handleSaveProduct(
    event: CustomEvent<Omit<StockItem, "id"> & { id?: number }>
  ) {
    const savedItemData = event.detail;
    if (savedItemData.id) {
      $stock = $stock.map((item) =>
        item.id === savedItemData.id
          ? { ...item, ...savedItemData, id: item.id }
          : item
      );
    } else {
      const newId =
        $stock.length > 0 ? Math.max(...$stock.map((i) => i.id)) + 1 : 1;
      const newItem: StockItem = {
        id: newId,
        quantity: savedItemData.quantity,
        properties: savedItemData.properties,
      };
      $stock = [...$stock, newItem];
    }
    showProductModal = false;
  }

  function handleDeleteProduct(event: CustomEvent<number>) {
    $stock = $stock.filter((item) => item.id !== event.detail);
  }

  function handleUpdateQuantity(
    event: CustomEvent<{ id: number; quantity: number }>
  ) {
    const { id, quantity } = event.detail;
    $stock = $stock.map((item) =>
      item.id === id ? { ...item, quantity } : item
    );
  }
</script>

<div class="stock-container">
  <div class="stock-header">
    <h1>📦 Controle de Estoque</h1>
  </div>

  <Modal bind:show={showProductModal}>
    <h2>{editingItem ? "Editar Item" : "Adicionar Item"}</h2>
    <ProductForm item={editingItem} on:save={handleSaveProduct} />
  </Modal>

  <Modal bind:show={showPropertyModal}>
    <h2>Gerenciar Propriedades</h2>
    <PropertyManager />
  </Modal>

  <div class="card list-card">
    <div class="card-header">
      <h2>Estoque Atual ({processedStock.length})</h2>
      <div class="header-actions">
        <button class="secondary" on:click={() => (showPropertyModal = true)}>
          Gerenciar Propriedades
        </button>
        <button on:click={openAddProductModal}>+ Adicionar Novo Item</button>
      </div>
    </div>
    <StockList
      stock={processedStock}
      {sortKey}
      {sortDirection}
      bind:searchTerm
      bind:filters
      on:sort={handleSort}
      on:editItem={openEditProductModal}
      on:deleteItem={handleDeleteProduct}
      on:updateQuantity={handleUpdateQuantity}
    />
  </div>
</div>

<style>
  .stock-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    background-color: #1a1a1a;
    min-height: 100vh;
    color: #ffffff;
  }

  .stock-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .stock-header h1 {
    color: #ffd700;
    margin: 0;
    font-size: 2.5rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: #ffd700;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid #ffd700;
    padding-bottom: 1rem;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
  }
</style>
