<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Modal from "./Modal.svelte";
  import CustomerSelector from "./CustomerSelector.svelte";
  import PaymentTypeSelector from "./PaymentTypeSelector.svelte";
  import type { Customer, PaymentType, StockItem } from "../types";

  export let isOpen = false;
  export let cart: { item: StockItem; quantity: number }[] = [];
  export let total: number = 0;
  export let selectedCustomer: Customer | null = null;
  export let paymentType: PaymentType = "cash";
  export let numberOfInstallments = 1;
  export let dueDay = 10;
  export let firstInstallmentMonth = new Date().getMonth() + 1;
  export let firstInstallmentYear = new Date().getFullYear();

  const dispatch = createEventDispatcher();

  let installments: { value: number; dueDate: string }[] = [];
  let installmentsEdited = false;

  // Calcular parcelas quando os parâmetros mudarem
  $: if (isOpen && paymentType === "installments") {
    calculateInstallments();
  }

  function calculateInstallments() {
    installments = [];
    if (numberOfInstallments <= 1) return;

    const installmentValue = total / numberOfInstallments;

    for (let i = 0; i < numberOfInstallments; i++) {
      const dueDate = calculateDueDate(i);
      installments.push({
        value: Math.round(installmentValue * 100) / 100,
        dueDate,
      });
    }

    // Ajustar a última parcela para compensar arredondamentos
    const totalInstallments = installments.reduce(
      (sum, inst) => sum + inst.value,
      0
    );
    const difference = total - totalInstallments;
    if (Math.abs(difference) > 0.01) {
      installments[installments.length - 1].value += difference;
      installments[installments.length - 1].value =
        Math.round(installments[installments.length - 1].value * 100) / 100;
    }

    installmentsEdited = false;
  }

  function calculateDueDate(installmentIndex: number): string {
    const month = firstInstallmentMonth + installmentIndex;
    let year = firstInstallmentYear;
    let adjustedMonth = month;

    if (month > 12) {
      year += Math.floor((month - 1) / 12);
      adjustedMonth = ((month - 1) % 12) + 1;
    }

    const day = Math.min(dueDay, new Date(year, adjustedMonth, 0).getDate());
    return `${day.toString().padStart(2, "0")}/${adjustedMonth.toString().padStart(2, "0")}/${year}`;
  }

  function onInstallmentValueChange(index: number, newValue: number) {
    if (index === 0) {
      // Se editou a primeira parcela, recalcula as demais
      const firstInstallmentValue = newValue;
      const remainingTotal = total - firstInstallmentValue;
      const remainingInstallments = numberOfInstallments - 1;

      if (remainingInstallments > 0) {
        const remainingValue = remainingTotal / remainingInstallments;

        for (let i = 1; i < numberOfInstallments; i++) {
          installments[i].value = Math.round(remainingValue * 100) / 100;
        }

        // Ajustar a última parcela para compensar arredondamentos
        const totalInstallments = installments.reduce(
          (sum, inst) => sum + inst.value,
          0
        );
        const difference = total - totalInstallments;
        if (Math.abs(difference) > 0.01) {
          installments[installments.length - 1].value += difference;
          installments[installments.length - 1].value =
            Math.round(installments[installments.length - 1].value * 100) / 100;
        }
      }
    }

    installmentsEdited = true;
    installments = [...installments]; // Trigger reactivity
  }

  function handleConfirmSale() {
    const saleData = {
      cart,
      total,
      selectedCustomer,
      paymentType,
      numberOfInstallments,
      dueDay,
      firstInstallmentMonth,
      firstInstallmentYear,
      installments: paymentType === "installments" ? installments : [],
    };

    dispatch("confirmSale", saleData);
  }

  function handleCancel() {
    dispatch("cancel");
  }

  function handleCustomerSelected(event: CustomEvent) {
    selectedCustomer = event.detail;
    dispatch("customerSelected", event.detail);
  }

  function handlePaymentChange(event: CustomEvent) {
    paymentType = event.detail.paymentType;
    numberOfInstallments = event.detail.numberOfInstallments;
    dueDay = event.detail.dueDay;
    firstInstallmentMonth = event.detail.firstInstallmentMonth;
    firstInstallmentYear = event.detail.firstInstallmentYear;

    dispatch("paymentChange", event.detail);
  }

  function getPrice(item: StockItem): number {
    if (item.properties.price) {
      const price = parseFloat(item.properties.price);
      if (!isNaN(price)) return price;
    }

    const type = item.properties.type?.toLowerCase();
    switch (type) {
      case "terno":
        return 299.99;
      case "palitó":
        return 199.99;
      case "camisa":
        return 89.99;
      case "camiseta":
      case "blusa":
        return 49.99;
      case "sapato":
        return 159.99;
      default:
        return 99.99;
    }
  }
</script>

<Modal bind:show={isOpen}>
  <div class="sale-finalization">
    <h2>Finalizar Venda</h2>

    <div class="customer-section">
      <h3>Cliente</h3>
      <CustomerSelector
        bind:selectedCustomer
        on:customerSelected={handleCustomerSelected}
      />
    </div>

    <div class="payment-section">
      <h3>Forma de Pagamento</h3>
      <PaymentTypeSelector
        bind:paymentType
        bind:numberOfInstallments
        bind:dueDay
        bind:firstInstallmentMonth
        bind:firstInstallmentYear
        on:paymentChange={handlePaymentChange}
      />
    </div>

    {#if paymentType === "installments" && installments.length > 0}
      <div class="installments-section">
        <h3>Parcelas</h3>
        <div class="installments-list">
          {#each installments as installment, index}
            <div class="installment-row">
              <span class="installment-number">{index + 1}ª:</span>
              <input
                type="number"
                step="0.01"
                min="0"
                bind:value={installment.value}
                on:input={(e) =>
                  onInstallmentValueChange(
                    index,
                    parseFloat(e.currentTarget.value) || 0
                  )}
                class="installment-value"
              />
              <span class="due-date">Venc: {installment.dueDate}</span>
            </div>
          {/each}
          <div class="installments-total">
            <strong>
              Total Parcelas: R$ {installments
                .reduce((sum, inst) => sum + inst.value, 0)
                .toFixed(2)}
            </strong>
          </div>
        </div>
      </div>
    {/if}

    <div class="modal-actions">
      <button class="btn-cancel" on:click={handleCancel}> Cancelar </button>
      <button
        class="btn-confirm"
        on:click={handleConfirmSale}
        disabled={paymentType === "installments" && !selectedCustomer}
      >
        Confirmar Venda
      </button>
    </div>
  </div>
</Modal>

<style>
  .sale-finalization {
    max-width: 600px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
  }

  .sale-finalization h2 {
    color: var(--text-accent);
    margin: 0 0 1rem 0;
    font-size: 1.4rem;
    text-align: center;
  }

  .sale-finalization h3 {
    color: var(--primary-color);
    margin: 1rem 0 0.5rem 0;
    font-size: 1rem;
    border-bottom: 1px solid #555;
    padding-bottom: 0.3rem;
  }

  .customer-section,
  .payment-section {
    margin-bottom: 1rem;
  }

  .installments-section {
    background: #2a2a2a;
    padding: 1rem;
    border-radius: 6px;
    border: 1px solid #555;
    margin-bottom: 1rem;
  }

  .installments-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .installment-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.5rem;
    align-items: center;
    padding: 0.3rem 0;
  }

  .installment-number {
    color: var(--text-accent);
    font-weight: 600;
    font-size: 0.9rem;
    min-width: 30px;
  }

  .installment-value {
    background: #333;
    border: 1px solid #555;
    border-radius: 3px;
    padding: 0.3rem;
    color: #fff;
    font-size: 0.9rem;
    text-align: right;
  }

  .installment-value:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
  }

  .due-date {
    color: #ccc;
    font-size: 0.8rem;
    min-width: 100px;
    text-align: right;
  }

  .installments-total {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #555;
    text-align: right;
    color: var(--text-accent);
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #555;
  }

  .btn-cancel {
    background: #666;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.7rem 1.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .btn-cancel:hover {
    background: #777;
  }

  .btn-confirm {
    background: var(--primary-color);
    color: #1a1a1a;
    border: none;
    border-radius: 4px;
    padding: 0.7rem 1.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .btn-confirm:hover:not(:disabled) {
    background: #ffed4e;
    transform: translateY(-1px);
  }

  .btn-confirm:disabled {
    background: #555;
    color: #888;
    cursor: not-allowed;
    transform: none;
  }
</style>
