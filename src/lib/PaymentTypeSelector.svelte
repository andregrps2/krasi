<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { PaymentType, Customer } from "../types";

  const dispatch = createEventDispatcher();

  // Props
  export let selectedCustomer: Customer | null = null;
  export let paymentType: PaymentType = "cash";
  export let numberOfInstallments = 1;
  export let installmentFrequency = 30;
  export let dueDay = 10;
  export let firstInstallmentMonth = new Date().getMonth() + 1;
  export let firstInstallmentYear = new Date().getFullYear();

  // Funções para emitir eventos
  function openCustomerModal() {
    dispatch("openCustomerModal");
  }

  function clearCustomer() {
    dispatch("clearCustomer");
  }
</script>

<div class="payment-type-container">
  <!-- Título dentro do card -->
  <div class="controls-header">
    <h2>Tipo de Pagamento</h2>
  </div>

  <!-- Linha do Cliente -->
  <div class="client-row">
    <div class="control-group">
      <span class="control-label">Cliente:</span>
      <div class="customer-selector">
        {#if selectedCustomer}
          <div class="selected-customer">
            <span class="customer-name">{selectedCustomer.name}</span>
            <span class="customer-congregation"
              >({selectedCustomer.congregation})</span
            >
            <button
              class="clear-customer-btn"
              on:click={clearCustomer}
              title="Remover cliente"
            >
              ✕
            </button>
          </div>
        {:else}
          <button class="select-customer-btn" on:click={openCustomerModal}>
            Selecionar Cliente
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Controles de Pagamento -->
  <div class="payment-section">
    <div class="payment-row">
      <div class="control-group">
        <label for="payment-select">Pagamento:</label>
        <select
          id="payment-select"
          bind:value={paymentType}
          class="compact-select"
        >
          <option value="cash">À Vista</option>
          <option value="installments">A Prazo</option>
        </select>
      </div>

      {#if paymentType === "installments"}
        <div class="control-group">
          <label for="installments-select">Parcelas:</label>
          <select
            id="installments-select"
            bind:value={numberOfInstallments}
            class="compact-select"
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={3}>3x</option>
            <option value={4}>4x</option>
            <option value={5}>5x</option>
            <option value={6}>6x</option>
            <option value={10}>10x</option>
            <option value={12}>12x</option>
          </select>
        </div>

        <div class="control-group">
          <label for="frequency-select">Intervalo:</label>
          <select
            id="frequency-select"
            bind:value={installmentFrequency}
            class="compact-select"
          >
            <option value={7}>Semanal</option>
            <option value={15}>Quinzenal</option>
            <option value={30}>Mensal</option>
          </select>
        </div>
      {/if}
    </div>

    {#if paymentType === "installments"}
      <div class="installment-second-row">
        <div class="control-group">
          <label for="due-day-select">Dia Vencimento:</label>
          <select
            id="due-day-select"
            bind:value={dueDay}
            class="compact-select"
          >
            {#each Array(31) as _, i}
              <option value={i + 1}>{i + 1}</option>
            {/each}
          </select>
        </div>

        <div class="control-group">
          <label for="first-month-select">Mês 1ª Parcela:</label>
          <select
            id="first-month-select"
            bind:value={firstInstallmentMonth}
            class="compact-select"
          >
            <option value={1}>Janeiro</option>
            <option value={2}>Fevereiro</option>
            <option value={3}>Março</option>
            <option value={4}>Abril</option>
            <option value={5}>Maio</option>
            <option value={6}>Junho</option>
            <option value={7}>Julho</option>
            <option value={8}>Agosto</option>
            <option value={9}>Setembro</option>
            <option value={10}>Outubro</option>
            <option value={11}>Novembro</option>
            <option value={12}>Dezembro</option>
          </select>
        </div>

        <div class="control-group">
          <label for="first-year-select">Ano 1ª Parcela:</label>
          <select
            id="first-year-select"
            bind:value={firstInstallmentYear}
            class="compact-select"
          >
            {#each Array(106) as _, i}
              {@const year = new Date().getFullYear() - 5 + i}
              <option value={year}>{year}</option>
            {/each}
          </select>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .payment-type-container {
    background: #2a2a2a;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.1);
    border: 2px solid var(--primary-color-border);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* Cabeçalho dos Controles */
  .controls-header {
    text-align: center;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--primary-color-border);
    margin-bottom: 0.5rem;
  }

  .controls-header h2 {
    margin: 0;
    color: var(--text-accent);
    font-size: 1.5rem;
    text-shadow: var(--shadow-small);
  }

  /* Linha do Cliente */
  .client-row {
    display: flex;
    align-items: center;
    width: 100%;
  }

  /* Seção de Pagamento */
  .payment-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /* Linha dos Controles de Pagamento */
  .payment-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
  }

  /* Segunda linha dos campos de parcelamento */
  .installment-second-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    width: 100%;
    margin-top: 1rem;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 120px;
  }

  .control-group label,
  .control-group .control-label {
    color: var(--text-accent);
    font-size: 0.85rem;
    font-weight: 600;
  }

  .compact-select {
    padding: 0.5rem;
    border: 1px solid #555;
    border-radius: 4px;
    background-color: #333;
    color: white;
    font-size: 0.9rem;
  }

  .compact-select:focus {
    outline: none;
    border-color: var(--primary-color-border);
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
  }

  /* Seletor de Cliente */
  .customer-selector {
    min-width: 200px;
  }

  .selected-customer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background-color: #333;
    border: 1px solid var(--primary-color-border);
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .customer-name {
    color: var(--text-accent);
    font-weight: 600;
  }

  .customer-congregation {
    color: #ccc;
    font-size: 0.8rem;
  }

  .clear-customer-btn {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    padding: 0.2rem;
    margin-left: auto;
    border-radius: 2px;
    transition: all 0.2s;
  }

  .clear-customer-btn:hover {
    background-color: #ef4444;
    color: white;
  }

  .select-customer-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #555;
    border-radius: 4px;
    background-color: #333;
    color: white;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    width: 100%;
  }

  .select-customer-btn:hover {
    border-color: var(--primary-color-border);
    background-color: #444;
  }

  /* Responsivo */
  @media (max-width: 768px) {
    .payment-row,
    .installment-second-row {
      flex-direction: column;
      align-items: stretch;
    }

    .control-group {
      min-width: auto;
    }
  }
</style>
