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
  export let total = 0;

  // Função para formatar moeda
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  // Função para calcular as parcelas
  function calculateInstallments() {
    if (paymentType !== "installments" || total === 0) return [];

    const installmentValue = total / numberOfInstallments;
    const installments = [];

    for (let i = 0; i < numberOfInstallments; i++) {
      const date = new Date();
      date.setMonth(firstInstallmentMonth - 1 + i);
      date.setFullYear(firstInstallmentYear);
      date.setDate(dueDay);

      // Ajustar o ano se o mês ultrapassar dezembro
      if (date.getMonth() >= 12) {
        date.setFullYear(
          firstInstallmentYear +
            Math.floor((firstInstallmentMonth - 1 + i) / 12)
        );
        date.setMonth((firstInstallmentMonth - 1 + i) % 12);
      }

      installments.push({
        number: i + 1,
        value: installmentValue,
        dueDate: date.toLocaleDateString("pt-BR"),
      });
    }

    return installments;
  }

  // Reactive statement para calcular parcelas automaticamente
  $: installmentsList = calculateInstallments();

  // Reactive statement para garantir atualização quando qualquer parâmetro muda
  $: if (paymentType === "installments" && total > 0) {
    installmentsList = calculateInstallments();
  }

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
        on:change={() => {
          installmentsList = calculateInstallments();
          dispatch("paymentChange", {
            paymentType,
            numberOfInstallments,
            dueDay,
            firstInstallmentMonth,
            firstInstallmentYear,
          });
        }}
      >
        <option value="cash">À Vista</option>
        <option value="pix">PIX</option>
        <option value="card">Cartão</option>
        <option value="installments">Parcelado</option>
      </select>
    </div>

    {#if paymentType === "installments"}
      <div class="control-group">
        <label for="installments-select">Parcelas:</label>
        <select
          id="installments-select"
          bind:value={numberOfInstallments}
          class="compact-select"
          on:change={() => {
            installmentsList = calculateInstallments();
            dispatch("paymentChange", {
              paymentType,
              numberOfInstallments,
              dueDay,
              firstInstallmentMonth,
              firstInstallmentYear,
            });
          }}
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
          on:change={() => {
            installmentsList = calculateInstallments();
            dispatch("paymentChange", {
              paymentType,
              numberOfInstallments,
              dueDay,
              firstInstallmentMonth,
              firstInstallmentYear,
            });
          }}
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
          on:change={() => {
            installmentsList = calculateInstallments();
            dispatch("paymentChange", {
              paymentType,
              numberOfInstallments,
              dueDay,
              firstInstallmentMonth,
              firstInstallmentYear,
            });
          }}
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
          on:change={() => {
            installmentsList = calculateInstallments();
            dispatch("paymentChange", {
              paymentType,
              numberOfInstallments,
              dueDay,
              firstInstallmentMonth,
              firstInstallmentYear,
            });
          }}
        >
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
          <option value={2027}>2027</option>
        </select>
      </div>
    {/if}
  </div>

  <!-- Prévia das Parcelas -->
  {#if paymentType === "installments" && installmentsList.length > 0}
    <div class="installments-preview">
      <h4>📋 Prévia das Parcelas</h4>

      {#if installmentsList.length <= 6}
        <!-- Uma coluna para até 6 parcelas -->
        <div class="installments-table single-column">
          <div class="table-header">
            <span>Parcela</span>
            <span>Vencimento</span>
            <span>Valor</span>
          </div>
          {#each installmentsList as installment}
            <div class="table-row">
              <span class="installment-number">{installment.number}ª</span>
              <span class="installment-date">{installment.dueDate}</span>
              <span class="installment-value"
                >{formatCurrency(installment.value)}</span
              >
            </div>
          {/each}
          <div class="table-footer">
            <span>Total:</span>
            <span></span>
            <span class="total-value">{formatCurrency(total)}</span>
          </div>
        </div>
      {:else}
        <!-- Duas colunas para mais de 6 parcelas -->
        <div class="installments-table-dual">
          <!-- Primeira coluna -->
          <div class="installments-table column">
            <div class="table-header">
              <span>Parcela</span>
              <span>Vencimento</span>
              <span>Valor</span>
            </div>
            {#each installmentsList.slice(0, Math.ceil(installmentsList.length / 2)) as installment}
              <div class="table-row">
                <span class="installment-number">{installment.number}ª</span>
                <span class="installment-date">{installment.dueDate}</span>
                <span class="installment-value"
                  >{formatCurrency(installment.value)}</span
                >
              </div>
            {/each}
          </div>

          <!-- Segunda coluna -->
          <div class="installments-table column">
            <div class="table-header">
              <span>Parcela</span>
              <span>Vencimento</span>
              <span>Valor</span>
            </div>
            {#each installmentsList.slice(Math.ceil(installmentsList.length / 2)) as installment}
              <div class="table-row">
                <span class="installment-number">{installment.number}ª</span>
                <span class="installment-date">{installment.dueDate}</span>
                <span class="installment-value"
                  >{formatCurrency(installment.value)}</span
                >
              </div>
            {/each}
          </div>

          <!-- Total span across both columns -->
          <div class="table-footer-dual">
            <span>Total:</span>
            <span class="total-value">{formatCurrency(total)}</span>
          </div>
        </div>
      {/if}
    </div>
  {/if}
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

  /* Prévia das Parcelas */
  .installments-preview {
    margin-top: 1rem;
    background: #1e1e1e;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 1rem;
  }

  .installments-preview h4 {
    margin: 0 0 0.8rem 0;
    color: var(--text-accent);
    font-size: 0.9rem;
    border-bottom: 1px solid #444;
    padding-bottom: 0.5rem;
  }

  .installments-table {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .installments-table.single-column {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  /* Layout de duas colunas */
  .installments-table-dual {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .installments-table-dual .column {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .installments-table-dual {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.8rem;
    grid-template-areas:
      "col1 col2"
      "footer footer";
  }

  .installments-table-dual .column:first-child {
    grid-area: col1;
  }

  .installments-table-dual .column:last-child {
    grid-area: col2;
  }

  .table-footer-dual {
    grid-area: footer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0.6rem;
    background: #444;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.8rem;
    color: var(--text-accent);
    border-top: 2px solid var(--primary-color);
    margin-top: 0.3rem;
  }

  .table-footer-dual .total-value {
    color: #4ade80;
    font-size: 0.9rem;
  }

  .table-header {
    display: grid;
    grid-template-columns: 1fr 1.2fr 1fr;
    gap: 0.5rem;
    padding: 0.4rem 0.6rem;
    background: #333;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.75rem;
    color: var(--text-accent);
  }

  .table-row {
    display: grid;
    grid-template-columns: 1fr 1.2fr 1fr;
    gap: 0.5rem;
    padding: 0.4rem 0.6rem;
    background: #2a2a2a;
    border-radius: 3px;
    font-size: 0.8rem;
    align-items: center;
  }

  .table-row:hover {
    background: #353535;
  }

  .installment-number {
    color: var(--primary-color);
    font-weight: 600;
  }

  .installment-date {
    color: #fff;
    text-align: center;
  }

  .installment-value {
    color: #4ade80;
    font-weight: 600;
    text-align: right;
  }

  .table-footer {
    display: grid;
    grid-template-columns: 1fr 1.2fr 1fr;
    gap: 0.5rem;
    padding: 0.4rem 0.6rem;
    background: #444;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.8rem;
    color: var(--text-accent);
    border-top: 2px solid var(--primary-color);
    margin-top: 0.3rem;
  }

  .total-value {
    color: #4ade80;
    text-align: right;
    font-size: 0.9rem;
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
