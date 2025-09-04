<script lang="ts">
  import { onMount } from "svelte";
  import { storesApi } from "../api";
  import StoreForm from "../StoreForm.svelte";
  import type { Store } from "../../types-new";

  export let selectedStore: Store | null = null;
  export let onStoreSelect: (store: Store) => void = () => {};

  let stores: Store[] = [];
  let loading = true;
  let error = "";
  let showStoreForm = false;

  onMount(() => {
    loadStores();

    // Listen for store creation events
    window.addEventListener("storeCreated", handleStoreCreated);

    return () => {
      window.removeEventListener("storeCreated", handleStoreCreated);
    };
  });

  async function loadStores() {
    loading = true;
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
  }

  function handleStoreCreated(event: Event) {
    const customEvent = event as CustomEvent;
    const newStore = customEvent.detail;
    stores = [...stores, newStore];

    // Auto-seleciona a nova loja
    selectStore(newStore);
    showStoreForm = false;
  }
  function selectStore(store: Store) {
    selectedStore = store;
    onStoreSelect(store);
  }

  function openStoreForm() {
    showStoreForm = true;
  }

  function closeStoreForm() {
    showStoreForm = false;
  }
</script>

<div class="mb-4">
  <h3 class="block text-sm font-medium text-gray-700 mb-2">Selecionar Loja</h3>

  {#if loading}
    <div class="flex items-center space-x-2">
      <div
        class="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
      ></div>
      <span class="text-gray-600">Carregando lojas...</span>
    </div>
  {:else if error}
    <div class="p-3 bg-red-50 border border-red-200 rounded-md">
      <p class="text-red-600">{error}</p>
      <button
        type="button"
        class="mt-2 text-blue-600 hover:underline"
        on:click={loadStores}
      >
        Tentar novamente
      </button>
    </div>
  {:else if stores.length === 0}
    <div class="p-4 bg-blue-50 border border-blue-200 rounded-md">
      <p class="text-blue-800 mb-3">Nenhuma loja encontrada.</p>
      <button
        type="button"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        on:click={openStoreForm}
      >
        Criar Primeira Loja
      </button>
    </div>
  {:else}
    <select
      class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      bind:value={selectedStore}
      on:change={() => selectedStore && selectStore(selectedStore)}
    >
      <option value={null}>Selecione uma loja</option>
      {#each stores as store}
        <option value={store}>{store.name}</option>
      {/each}
    </select>

    <div class="mt-2">
      <button
        type="button"
        class="text-blue-600 hover:underline text-sm"
        on:click={openStoreForm}
      >
        + Criar Nova Loja
      </button>
    </div>
  {/if}
</div>

{#if showStoreForm}
  <StoreForm bind:show={showStoreForm} on:created={handleStoreCreated} />
{/if}

<style>
  /* Styles for the simplified store selector */
</style>
