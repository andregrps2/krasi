<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { PropertyDefinition } from "../types";

  export let show = false;
  export let property: PropertyDefinition | null = null;
  export let currentValue = "";

  const dispatch = createEventDispatcher();

  let tempValue = "";

  $: if (show && property) {
    tempValue = currentValue;
  }

  function applyFilter() {
    dispatch("apply", { propertyId: property?.id, value: tempValue });
    show = false;
  }

  function clearFilter() {
    tempValue = "";
    dispatch("apply", { propertyId: property?.id, value: "" });
    show = false;
  }

  function closeModal() {
    show = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closeModal();
    } else if (event.key === "Enter") {
      applyFilter();
    }
  }
</script>

{#if show && property}
  <!-- Modal backdrop -->
  <div
    class="modal-backdrop"
    on:click={closeModal}
    on:keydown={handleKeydown}
    role="button"
    tabindex="0"
  >
    <!-- Modal content -->
    <div
      class="modal-content"
      on:click|stopPropagation
      on:keydown={handleKeydown}
      role="dialog"
      aria-labelledby="filter-title"
      tabindex="-1"
    >
      <div class="modal-header">
        <h3 id="filter-title">Filtrar: {property.name}</h3>
        <button class="close-btn" on:click={closeModal} aria-label="Fechar"
          >×</button
        >
      </div>

      <div class="modal-body">
        {#if property.type === "text"}
          <label for="filter-input">Valor do filtro:</label>
          <input
            id="filter-input"
            type="text"
            placeholder="Digite o valor para filtrar..."
            bind:value={tempValue}
            class="filter-input"
          />
          <div class="help-text">
            * Use texto parcial para buscar (ex: "azul" encontra "azul claro")
          </div>
        {:else if property.type === "select"}
          <label for="filter-select">Selecione uma opção:</label>
          <select
            id="filter-select"
            bind:value={tempValue}
            class="filter-select"
          >
            <option value="">-- Todas as opções --</option>
            {#each property.options || [] as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        {/if}
      </div>

      <div class="modal-footer">
        <button class="secondary" on:click={clearFilter}>Limpar</button>
        <button class="primary" on:click={applyFilter}>Aplicar</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-width: 400px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .modal-header h3 {
    margin: 0;
    color: var(--primary-color);
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .close-btn:hover {
    background-color: #f0f0f0;
    color: #333;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-body label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #333;
  }

  .filter-input,
  .filter-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .filter-input:focus,
  .filter-select:focus {
    outline: none;
    border-color: var(--primary-color-border);
    box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.2);
  }

  .help-text {
    font-size: 0.85rem;
    color: #666;
    font-style: italic;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid var(--border-color);
  }

  .modal-footer button {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }

  .modal-footer button.primary {
    background-color: var(--primary-color);
    color: white;
    border: none;
  }

  .modal-footer button.primary:hover {
    background-color: rgba(250, 204, 21, 0.9);
  }

  .modal-footer button.secondary {
    background-color: transparent;
    color: var(--primary-color);
    border: 1px solid var(--primary-color-border);
  }

  .modal-footer button.secondary:hover {
    background-color: rgba(250, 204, 21, 0.1);
  }
</style>
