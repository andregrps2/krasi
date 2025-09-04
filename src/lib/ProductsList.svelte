<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { StockItem } from "../types";

  const dispatch = createEventDispatcher();

  // Props
  export let availableProducts: StockItem[] = [];
  export let searchTerm = "";
  export let propertyDefinitions: any[] = [];

  // Função para obter preço do produto
  function getPrice(item: StockItem): number {
    // Primeiro tenta usar o preço definido no produto
    if (item.properties.price) {
      const price = parseFloat(item.properties.price);
      if (!isNaN(price)) {
        console.log(
          `ProductsList - Produto ${item.properties.brand} ${item.properties.type}: usando preço definido ${price}`
        );
        return price;
      }
    }

    console.log(
      `ProductsList - Produto ${item.properties.brand} ${item.properties.type}: sem preço definido, usando fallback`
    );

    // Fallback para preços baseados no tipo (para compatibilidade com produtos antigos)
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

  // Função para destacar termos de busca
  function highlightSearchTerms(text: string, searchTerm: string): string {
    if (!searchTerm.trim()) return text;

    const terms = searchTerm
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 0);
    let highlightedText = text;

    terms.forEach((term) => {
      // Busca por correspondência exata
      const exactRegex = new RegExp(`\\b(${escapeRegex(term)})\\b`, "gi");
      highlightedText = highlightedText.replace(exactRegex, "<mark>$1</mark>");

      // Busca por correspondência parcial se não houver correspondência exata
      if (!exactRegex.test(text)) {
        const partialRegex = new RegExp(`(${escapeRegex(term)})`, "gi");
        highlightedText = highlightedText.replace(
          partialRegex,
          "<mark>$1</mark>"
        );
      }
    });

    return highlightedText;
  }

  // Função para escapar caracteres especiais em regex
  function escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
</script>

<div class="products-section">
  <h2>Produtos Disponíveis</h2>

  <div class="search-bar">
    <input
      type="text"
      placeholder="Busca inteligente: digite qualquer combinação (ex: breda poli preto)"
      bind:value={searchTerm}
      class="search-input"
    />
    {#if searchTerm.trim()}
      <div class="search-info">
        <span class="results-count"
          >{availableProducts.length} produto(s) encontrado(s)</span
        >
        <button
          class="clear-search"
          on:click={() => (searchTerm = "")}
          title="Limpar busca"
        >
          ✕
        </button>
      </div>
    {/if}
  </div>

  <div class="products-grid">
    {#each availableProducts as item (item.id)}
      <div class="product-card">
        <div class="product-info">
          <h3 class="product-title">
            {#each propertyDefinitions as prop}
              {#if prop.id === "type" || prop.id === "brand"}
                <span class="property-value">
                  {@html highlightSearchTerms(
                    item.properties[prop.id] || "-",
                    searchTerm
                  )}
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
                    {@html highlightSearchTerms(
                      item.properties[prop.id] || "-",
                      searchTerm
                    )}
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
    padding: 0.5rem;
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.1);
    border: 2px solid var(--primary-color-border);
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .products-section h2 {
    color: var(--text-accent);
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }

  .search-bar {
    margin-bottom: 0.5rem;
  }

  .search-input {
    width: 100%;
    padding: 0.3rem;
    border: 2px solid #555;
    border-radius: 4px;
    font-size: 0.8rem;
    background-color: #333;
    color: white;
    margin-bottom: 0.5rem;
  }

  .search-input:focus {
    border-color: var(--primary-color-border);
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
  }

  .search-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
    color: #ccc;
  }

  .results-count {
    color: var(--text-accent);
    font-weight: 600;
  }

  .clear-search {
    background: #555;
    border: 1px solid #666;
    color: #ccc;
    border-radius: 3px;
    padding: 0.2rem 0.4rem;
    cursor: pointer;
    font-size: 0.7rem;
    transition: all 0.2s;
  }

  .clear-search:hover {
    background: #666;
    color: white;
  }

  /* Destaque dos termos de busca */
  :global(.product-card mark) {
    background-color: var(--text-accent);
    color: #1a1a1a;
    padding: 0.1rem 0.2rem;
    border-radius: 2px;
    font-weight: bold;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .product-card {
    border: 2px solid #555;
    border-radius: 6px;
    padding: 0.4rem;
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
    margin: 0 0 0.3rem 0;
    color: var(--text-accent);
    font-size: 0.9rem;
    font-weight: bold;
  }

  .property-value {
    margin-right: 0.3rem;
    color: var(--text-accent);
  }

  .product-details {
    margin-bottom: 0.5rem;
    font-size: 0.7rem;
  }

  .detail {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.2rem;
  }

  .detail-label {
    font-weight: 600;
    color: #cccccc;
  }

  .detail-value {
    color: #ffffff;
  }

  .product-price {
    font-size: 1.1rem;
    font-weight: bold;
    color: #4ade80;
    margin-bottom: 0.75rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .add-btn {
    width: 100%;
    padding: 0.5rem;
    background-color: var(--text-accent);
    color: #1a1a1a;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
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
