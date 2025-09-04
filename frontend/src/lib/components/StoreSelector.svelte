<script lang="ts">
  import { onMount } from "svelte";
  import { storesApi } from "../api";
  import type { Store } from "../../types-new";

  export let selectedStore: Store | null = null;
  export let onStoreSelect: (store: Store) => void = () => {};

  let stores: Store[] = [];
  let loading = true;
  let error = "";

  onMount(async () => {
    try {
      stores = await storesApi.getAll({ active: true });

      // Se só há uma loja, selecione automaticamente
      if (stores.length === 1) {
        selectStore(stores[0]);
      }
    } catch (err) {
      error = "Erro ao carregar lojas";
      console.error("Erro ao carregar lojas:", err);
    } finally {
      loading = false;
    }
  });

  function selectStore(store: Store) {
    selectedStore = store;
    onStoreSelect(store);
  }
</script>

<div class="store-selector">
  <h2>Selecione uma Loja</h2>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Carregando lojas...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>{error}</p>
      <button on:click={() => window.location.reload()}>
        Tentar Novamente
      </button>
    </div>
  {:else if stores.length === 0}
    <div class="empty">
      <p>Nenhuma loja encontrada</p>
      <p>Entre em contato com o administrador</p>
    </div>
  {:else}
    <div class="stores-grid">
      {#each stores as store}
        <button
          class="store-card"
          class:selected={selectedStore?.id === store.id}
          on:click={() => selectStore(store)}
        >
          <div class="store-info">
            <h3>{store.name}</h3>
            {#if store.address}
              <p class="address">{store.address}</p>
            {/if}
            {#if store.phone}
              <p class="contact">{store.phone}</p>
            {/if}
            {#if store.email}
              <p class="contact">{store.email}</p>
            {/if}
          </div>

          {#if store._count}
            <div class="store-stats">
              <div class="stat">
                <span class="number">{store._count.customers}</span>
                <span class="label">Clientes</span>
              </div>
              <div class="stat">
                <span class="number">{store._count.sales}</span>
                <span class="label">Vendas</span>
              </div>
              <div class="stat">
                <span class="number">{store._count.stockItems}</span>
                <span class="label">Produtos</span>
              </div>
            </div>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .store-selector {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  h2 {
    color: white;
    margin-bottom: 2rem;
    font-size: 2rem;
    text-align: center;
  }

  .loading,
  .error,
  .empty {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .error button {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 1rem;
  }

  .stores-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    max-width: 1200px;
    width: 100%;
  }

  .store-card {
    background: white;
    border: 2px solid transparent;
    border-radius: 12px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  .store-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    border-color: #667eea;
  }

  .store-card.selected {
    border-color: #667eea;
    background: #f8f9ff;
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);
  }

  .store-info h3 {
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
    font-size: 1.25rem;
  }

  .address {
    color: #7f8c8d;
    margin: 0.25rem 0;
    font-size: 0.9rem;
  }

  .contact {
    color: #95a5a6;
    margin: 0.25rem 0;
    font-size: 0.85rem;
  }

  .store-stats {
    display: flex;
    justify-content: space-between;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #ecf0f1;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stat .number {
    font-size: 1.5rem;
    font-weight: bold;
    color: #667eea;
    line-height: 1;
  }

  .stat .label {
    font-size: 0.75rem;
    color: #95a5a6;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 0.25rem;
  }

  @media (max-width: 768px) {
    .stores-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    h2 {
      font-size: 1.5rem;
    }

    .store-selector {
      padding: 1rem;
    }
  }
</style>
