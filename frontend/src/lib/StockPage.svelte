<script lang="ts">
  import { stock, propertyDefinitions, selectedStore } from "../stores";
  import { stockApi } from "./api/stock";
  import { productsApi } from "./api/products";
  import type { StockItemOld as StockItem } from "../types-new";
  import StockList from "./StockList.svelte";
  import Modal from "./Modal.svelte";
  import ProductForm from "./ProductForm.svelte";
  import PropertyManager from "./PropertyManager.svelte";
  import { onMount } from "svelte";
  import { get } from "svelte/store";

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

  // Função para limpar estoque local (desenvolvimento)
  function clearLocalStock() {
    if (confirm("⚠️ Isso vai limpar todo o estoque local. Continuar?")) {
      $stock = [];
      console.log("🗑️ [STOCK] Estoque local limpo");
    }
  }

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

  async function handleSaveProduct(
    event: CustomEvent<Omit<StockItem, "id"> & { id?: string }>
  ) {
    const savedItemData = event.detail;
    const currentStoreId = get(selectedStore)?.id;

    if (!currentStoreId) {
      console.error("❌ [STOCK] Nenhuma loja selecionada");
      alert(
        "Por favor, selecione uma loja primeiro. Clique no botão 'Trocar Loja' no cabeçalho da aplicação para selecionar uma loja."
      );
      return;
    }

    try {
      console.log("💾 [STOCK] Salvando produto:", savedItemData);

      if (savedItemData.id) {
        // Editar produto existente
        // TODO: Implementar atualização via API
        $stock = $stock.map((item) =>
          item.id === savedItemData.id
            ? { ...item, ...savedItemData, id: item.id }
            : item
        );
      } else {
        // Criar novo produto
        console.log("🆕 [STOCK] Criando novo produto via API");
        console.log(
          "📦 [STOCK] Dados do produto a serem enviados:",
          savedItemData
        );

        // 1. Primeiro criar o produto
        const productData = {
          name: savedItemData.name || "",
          brand: savedItemData.brand || "",
          category: savedItemData.category || "",
          description: "",
          unit: "un", // Adicionar unidade padrão
        };
        console.log("📤 [STOCK] Payload para a API:", productData);

        const newProduct = await productsApi.create(productData);

        console.log("✅ [STOCK] Produto criado:", newProduct);
        console.log("🆔 [STOCK] Product ID:", newProduct?.id);

        if (!newProduct || !newProduct.id) {
          console.error("❌ [STOCK] Erro: produto retornado sem ID");
          alert(
            "Erro ao criar produto. Verifique o console para mais detalhes."
          );
          return;
        }

        // 2. Depois criar o item de estoque
        const stockItemData = {
          productId: newProduct.id,
          storeId: currentStoreId,
          quantity: savedItemData.quantity || 0,
          minQuantity: 0,
          purchasePrice: savedItemData.price || 0,
          salePrice: savedItemData.price || 0,
        };
        console.log(
          "📤 [STOCK] Dados para criar item de estoque:",
          stockItemData
        );

        const newStockItem = await stockApi.create(stockItemData);

        console.log("✅ [STOCK] Item de estoque criado:", newStockItem);

        // 3. Converter para o formato esperado pelo frontend
        const newItem: StockItem = {
          id: newStockItem.id,
          name: newProduct.name,
          price: Number(newStockItem.salePrice),
          quantity: newStockItem.quantity,
          brand: newProduct.brand || "",
          category: newProduct.category || "",
          properties: savedItemData.properties || {},
          productId: newProduct.id, // Adicionar o productId real
        };

        $stock = [...$stock, newItem];
        console.log("🎉 [STOCK] Produto adicionado ao store local");
      }
      showProductModal = false;
    } catch (error) {
      console.error("💥 [STOCK] Erro ao salvar produto:", error);
      alert("Erro ao salvar produto. Verifique o console para detalhes.");
    }
  }

  function handleDeleteProduct(event: CustomEvent<string>) {
    $stock = $stock.filter((item) => item.id !== event.detail);
  }

  function handleUpdateQuantity(
    event: CustomEvent<{ id: string; quantity: number }>
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
    <div class="header-actions">
      <button
        on:click={clearLocalStock}
        class="btn-danger"
        title="Limpar estoque local (apenas desenvolvimento)"
      >
        🗑️ Limpar Estoque Local
      </button>
    </div>
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
    padding: var(--spacing-xl);
    max-width: 1200px;
    margin: 0 auto;
    background-color: var(--bg-primary);
    min-height: 100vh;
    color: var(--text-primary);
  }

  .stock-header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
    position: relative;
  }

  .header-actions {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    gap: var(--spacing-sm);
  }

  .btn-danger {
    background-color: #dc3545;
    color: white;
    border: none;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 0.875rem;
    transition: background-color 0.2s;
  }

  .btn-danger:hover {
    background-color: #c82333;
  }

  h2 {
    margin-top: 0;
    margin-bottom: var(--spacing-lg);
    color: var(--text-accent);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    border-bottom: 2px solid var(--border-primary);
    padding-bottom: var(--spacing-md);
  }

  .header-actions {
    display: flex;
    gap: var(--spacing-md);
  }
</style>
