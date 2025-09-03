<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { customers } from "../stores";
  import Modal from "./Modal.svelte";
  import type { Customer } from "../types";

  export let selectedCustomer: Customer | null = null;
  export let show: boolean = false;

  const dispatch = createEventDispatcher();

  let customerSearchTerm = "";

  // Filtrar clientes disponíveis
  $: filteredCustomers = $customers.filter((customer) => {
    if (!customerSearchTerm.trim()) return true;

    const term = customerSearchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(term) ||
      customer.congregation.toLowerCase().includes(term) ||
      customer.whatsappNumber.includes(term)
    );
  });

  function selectCustomer(customer: Customer) {
    selectedCustomer = customer;
    show = false;
    customerSearchTerm = "";
    dispatch("customerSelected", customer);
  }

  function clearCustomer() {
    selectedCustomer = null;
    show = false;
    dispatch("customerCleared");
  }

  function closeModal() {
    show = false;
    dispatch("modalClosed");
  }

  export function openModal() {
    show = true;
    customerSearchTerm = "";
  }
</script>

<!-- Modal de Seleção de Cliente -->
<Modal bind:show>
  <h2>Selecionar Cliente</h2>

  <div class="customer-modal-content">
    <div class="customer-search">
      <input
        type="text"
        placeholder="Buscar por nome, congregação ou telefone..."
        bind:value={customerSearchTerm}
        class="search-input"
      />
    </div>

    {#if filteredCustomers.length === 0}
      <div class="empty-state">
        <p>Nenhum cliente encontrado</p>
      </div>
    {:else}
      <div class="customers-grid">
        {#each filteredCustomers as customer (customer.id)}
          <button
            class="customer-card"
            on:click={() => selectCustomer(customer)}
            type="button"
          >
            <div class="customer-header">
              <h3>{customer.name}</h3>
              <span class="customer-id">#{customer.id}</span>
            </div>
            <div class="customer-details">
              <div class="detail-item">
                <span class="detail-label">Congregação:</span>
                <span class="detail-value">{customer.congregation}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">WhatsApp:</span>
                <span class="detail-value">{customer.whatsappNumber}</span>
              </div>
            </div>
          </button>
        {/each}
      </div>
    {/if}

    <div class="modal-actions">
      <button class="btn-secondary" on:click={clearCustomer}>
        Venda sem cliente
      </button>
      <button class="btn-secondary" on:click={closeModal}> Cancelar </button>
    </div>
  </div>
</Modal>

<style>
  /* Modal de Cliente */
  .customer-modal-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-height: 70vh;
  }

  .customer-search {
    margin-bottom: 1rem;
  }

  .customer-search .search-input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #555;
    border-radius: 4px;
    font-size: 1rem;
    background-color: #333;
    color: white;
  }

  .customer-search .search-input:focus {
    border-color: var(--primary-color-border);
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
  }

  .customers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    max-height: 400px;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .customer-card {
    background: #2a2a2a;
    border: 2px solid #555;
    border-radius: 8px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
    color: inherit;
    font-family: inherit;
  }

  .customer-card:hover {
    border-color: var(--primary-color-border);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.2);
  }

  .customer-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #555;
  }

  .customer-card h3 {
    margin: 0;
    color: var(--text-accent);
    font-size: 1.1rem;
  }

  .customer-id {
    font-size: 0.8rem;
    color: #888;
  }

  .customer-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
  }

  .detail-label {
    color: var(--text-accent);
    font-weight: 500;
  }

  .detail-value {
    color: #ccc;
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid #555;
  }

  .btn-secondary {
    padding: 0.75rem 1.5rem;
    background-color: #555;
    color: white;
    border: 2px solid #666;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    border-color: var(--primary-color-border);
    background-color: #444;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #888;
  }
</style>
