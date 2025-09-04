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

<div class="payment-compact">
  <!-- Controles de Pagamento em linha -->
  <div class="payment-controls">
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
        <label for="due-day-select">Venc.:</label>
        <select
          id="due-day-select"
          bind:value={dueDay}
          class="compact-select small"
        >
          {#each Array(31) as _, i}
            <option value={i + 1}>{i + 1}</option>
          {/each}
        </select>
      </div>

      <div class="control-group">
        <label for="first-month-select">Mês:</label>
        <select
          id="first-month-select"
          bind:value={firstInstallmentMonth}
          class="compact-select"
        >
          <option value={1}>Jan</option>
          <option value={2}>Fev</option>
          <option value={3}>Mar</option>
          <option value={4}>Abr</option>
          <option value={5}>Mai</option>
          <option value={6}>Jun</option>
          <option value={7}>Jul</option>
          <option value={8}>Ago</option>
          <option value={9}>Set</option>
          <option value={10}>Out</option>
          <option value={11}>Nov</option>
          <option value={12}>Dez</option>
        </select>
      </div>

      <div class="control-group">
        <label for="first-year-select">Ano:</label>
        <select
          id="first-year-select"
          bind:value={firstInstallmentYear}
          class="compact-select small"
        >
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
          <option value={2027}>2027</option>
        </select>
      </div>
    {/if}
  </div>
</div>

<style>
  .payment-compact {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.4rem;
    background: #333;
    border: 2px solid #555;
    border-radius: 4px;
    flex-wrap: wrap;
  }

  .payment-controls {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex-wrap: wrap;
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 0.15rem;
  }

  .control-group label {
    color: var(--text-accent);
    font-size: 0.65rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .compact-select {
    padding: 0.15rem 0.25rem;
    border: 1px solid #555;
    border-radius: 3px;
    background-color: #2a2a2a;
    color: white;
    font-size: 0.65rem;
    height: 24px;
    min-width: 80px;
  }

  .compact-select.small {
    min-width: 60px;
  }

  .compact-select:focus {
    outline: none;
    border-color: var(--primary-color-border);
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
  }

  /* Responsivo */
  @media (max-width: 768px) {
    .payment-controls {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }

    .control-group {
      justify-content: space-between;
    }
  }
</style>
