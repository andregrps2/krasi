<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { StockItem } from "../types";

  const dispatch = createEventDispatcher();

  // Props
  export let availableProducts: StockItem[] = [];
  export let searchTerm = "";
  export let propertyDefinitions: any[] = [];

  // Função para obter preço (duplicada do componente pai por enquanto)
  function getPrice(item: StockItem): number {
    const type = item.properties.type?.toLowerCase();
    switch (type) {
      case "terno":
        return 299.99;
      case "palitó":
        return 199.99;
      case "camisa":
        return 89.99;
      case "camiseta":
        return 49.99;
      case "sapato":
        return 159.99;
      default:
        return 99.99;
    }
  }

  function handleAddToCart(item: StockItem) {
    dispatch("addToCart", item);
  }
</script>

<div class="products-section">
  <h2>Produtos Disponíveis</h2>

  <div class="search-bar">
    <input
      type="text"
      placeholder="Buscar produtos..."
      bind:value={searchTerm}
      class="search-input"
    />
  </div>

  <div class="products-grid">
    {#each availableProducts as item (item.id)}
      <div class="product-card">
        <div class="product-info">
          <h3 class="product-title">
            {#each propertyDefinitions as prop}
              {#if prop.id === "type" || prop.id === "brand"}
                <span class="property-value">
                  {item.properties[prop.id] || "-"}
                </span>
              {/if}
            {/each}
          </h3>

          <div class="product-details">
            {#each propertyDefinitions as prop}
              {#if prop.id !== "type" && prop.id !== "brand"}
                <div class="detail">
                  <span class="detail-label">{prop.name}:</span>
                  <span class="detail-value">
                    {item.properties[prop.id] || "-"}
                  </span>
                </div>
              {/if}
            {/each}

            <div class="detail">
              <span class="detail-label">Estoque:</span>
              <span class="detail-value">{item.quantity} un.</span>
            </div>
          </div>

          <div class="product-price">
            R$ {getPrice(item).toFixed(2)}
          </div>
        </div>

        <button
          class="add-btn"
          on:click={() => handleAddToCart(item)}
          disabled={item.quantity <= 0}
        >
          Adicionar
        </button>
      </div>
    {/each}
  </div>
</div>

<style>
  /* Produtos */
  .products-section {
    background: #2a2a2a;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.1);
    border: 2px solid var(--primary-color-border);
  }

  .products-section h2 {
    color: var(--text-accent);
    margin-top: 0;
    margin-bottom: 1.5rem;
  }

  .search-bar {
    margin-bottom: 1.5rem;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #555;
    border-radius: 4px;
    font-size: 1rem;
    background-color: #333;
    color: white;
  }

  .search-input:focus {
    border-color: var(--primary-color-border);
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
    max-height: 500px;
    overflow-y: auto;
  }

  .product-card {
    border: 2px solid #555;
    border-radius: 8px;
    padding: 1rem;
    background: #333;
    transition:
      transform 0.2s,
      box-shadow 0.2s,
      border-color 0.2s;
  }

  .product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);
    border-color: var(--primary-color-border);
  }

  .product-title {
    margin: 0 0 0.75rem 0;
    color: var(--text-accent);
    font-size: 1.1rem;
    font-weight: bold;
  }

  .property-value {
    margin-right: 0.5rem;
    color: var(--text-accent);
  }

  .product-details {
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .detail {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.25rem;
  }

  .detail-label {
    font-weight: 600;
    color: #cccccc;
  }

  .detail-value {
    color: #ffffff;
  }

  .product-price {
    font-size: 1.2rem;
    font-weight: bold;
    color: #4ade80;
    margin-bottom: 1rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .add-btn {
    width: 100%;
    padding: 0.75rem;
    background-color: var(--text-accent);
    color: #1a1a1a;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .add-btn:hover:not(:disabled) {
    background-color: #ffed4e;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);
  }

  .add-btn:disabled {
    background-color: #555;
    color: #888;
    cursor: not-allowed;
  }

  /* Responsivo */
  @media (max-width: 768px) {
    .products-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
