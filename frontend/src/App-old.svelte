<script lang="ts">
  import Sidebar from "./lib/Sidebar.svelte";
  import StockPage from "./lib/StockPage.svelte";
  import SalesPage from "./lib/SalesPage.svelte";

  // Estado da navegação
  let currentPage = "estoque";

  function handleNavigation(event: CustomEvent<string>) {
    currentPage = event.detail;
  }
</script>

<div class="app-container">
  <Sidebar {currentPage} on:navigate={handleNavigation} />
  
  <main class="main-content">
    {#if currentPage === "vendas"}
      <SalesPage />
    {:else if currentPage === "estoque"}
      <StockPage />
    {/if}
  </main>
</div>

<style>
  .app-container {
    display: flex;
    min-height: 100vh;
    background-color: #f8f9fa;
  }

  .main-content {
    margin-left: 250px;
    flex: 1;
    overflow-x: auto;
  }

  /* Responsivo */
  @media (max-width: 768px) {
    .main-content {
      margin-left: 0;
    }
  }

  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background-color: #f8f9fa;
  }

  :global(.card) {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  :global(.list-card) {
    padding: 1.5rem;
  }

  :global(button) {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.2s;
  }

  :global(button:hover) {
    background-color: #2980b9;
  }

  :global(button.secondary) {
    background-color: transparent;
    color: #3498db;
    border: 1px solid #3498db;
  }

  :global(button.secondary:hover) {
    background-color: rgba(52, 152, 219, 0.1);
  }

  :global(button.danger) {
    background-color: #e74c3c;
  }

  :global(button.danger:hover) {
    background-color: #c0392b;
  }

  :global(button.sm) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  :global(button.outline) {
    background-color: transparent;
    color: #666;
    border: 1px solid #ddd;
  }

  :global(button.outline:hover) {
    background-color: #f8f9fa;
  }

  :global(input, select, textarea) {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 0.75rem;
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  :global(input:focus, select:focus, textarea:focus) {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }

  :global(:root) {
    --primary-color: #3498db;
    --border-color: #e0e0e0;
  }
</style>

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

<main>
  <h1>Controle de Estoque Dinâmico</h1>

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
        <button class="secondary" on:click={() => (showPropertyModal = true)}
          >Gerenciar Propriedades</button
        >
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
