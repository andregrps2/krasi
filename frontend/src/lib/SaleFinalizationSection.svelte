<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import CustomerSelector from "./CustomerSelector.svelte";
  import PaymentTypeSelector from "./PaymentTypeSelector.svelte";
  import type { Customer, PaymentType } from "../types-new";
  import { PaymentType as PaymentTypeEnum } from "../types-new";

  const dispatch = createEventDispatcher();

  export let total: number = 0;
  export let selectedCustomer: Customer | null = null;
  export let paymentType: PaymentType = PaymentTypeEnum.CASH;
  export let numberOfInstallments: number = 2;
  export let dueDay: number = 10;
  export let firstInstallmentMonth: number = new Date().getMonth() + 1;
  export let firstInstallmentYear: number = new Date().getFullYear();
  export let hasDownPayment: boolean = false;
  export let downPaymentValue: number | string = "";

  // Garantir que quando mudar para "installments", numberOfInstallments seja pelo menos 2
  $: if (
    paymentType === PaymentTypeEnum.INSTALLMENTS &&
    numberOfInstallments < 2
  ) {
    numberOfInstallments = 2;
  }

  // Força a reatividade da prévia das parcelas
  $: previewKey = `${paymentType}-${numberOfInstallments}-${dueDay}-${firstInstallmentMonth}-${firstInstallmentYear}-${total}-${hasDownPayment}-${downPaymentValue}`;

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  function handleConfirmSale() {
    if (!selectedCustomer) {
      alert("Por favor, selecione um cliente.");
      return;
    }

    let installments: any[] = [];
    const entryValue = Number(downPaymentValue) || 0;

    if (paymentType === PaymentTypeEnum.INSTALLMENTS) {
      // Usar a mesma lógica do PaymentTypeSelector para garantir consistência

      // Se tem entrada, primeira parcela é a entrada
      if (hasDownPayment && entryValue > 0) {
        installments.push({
          number: 1,
          value: entryValue,
          dueDate: "Entrada",
          isDownPayment: true,
          isPaid: true,
        });

        // Calcular parcelas normais
        const remainingAmount = total - entryValue;
        const normalInstallments = numberOfInstallments - 1;

        if (normalInstallments > 0) {
          const installmentValue = remainingAmount / normalInstallments;

          for (let i = 0; i < normalInstallments; i++) {
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

            let finalValue;

            // Se é a última parcela, calcular o valor restante exato
            if (i === normalInstallments - 1) {
              let sumPreviousParcels = 0;
              for (let j = 0; j < i; j++) {
                sumPreviousParcels += Math.round(installmentValue * 100) / 100;
              }
              finalValue = remainingAmount - sumPreviousParcels;
            } else {
              finalValue = Math.round(installmentValue * 100) / 100;
            }

            installments.push({
              number: i + 2,
              value: finalValue,
              dueDate: date.toLocaleDateString("pt-BR"),
              isDownPayment: false,
              isPaid: false,
            });
          }
        }
      } else {
        // Sem entrada - calcular todas as parcelas normalmente
        const installmentValue = total / numberOfInstallments;

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

          let finalValue;

          // Se é a última parcela, calcular o valor restante exato
          if (i === numberOfInstallments - 1) {
            let sumPreviousParcels = 0;
            for (let j = 0; j < i; j++) {
              sumPreviousParcels += Math.round(installmentValue * 100) / 100;
            }
            finalValue = total - sumPreviousParcels;
          } else {
            finalValue = Math.round(installmentValue * 100) / 100;
          }

          installments.push({
            number: i + 1,
            value: finalValue,
            dueDate: date.toLocaleDateString("pt-BR"),
            isDownPayment: false,
            isPaid: false,
          });
        }
      }
    }

    dispatch("confirmSale", {
      selectedCustomer,
      paymentType,
      installments,
      total,
      hasDownPayment,
      downPaymentValue: entryValue,
    });
  }

  function handleCancel() {
    dispatch("cancel");
  }

  function handleCustomerSelect(event: CustomEvent) {
    selectedCustomer = event.detail;
  }

  function handlePaymentChange(event: CustomEvent) {
    const {
      paymentType: newPaymentType,
      numberOfInstallments: newInstallments,
      dueDay: newDueDay,
      firstInstallmentMonth: newMonth,
      firstInstallmentYear: newYear,
      hasDownPayment: newHasDownPayment,
      downPaymentValue: newDownPaymentValue,
    } = event.detail;

    paymentType = newPaymentType;
    numberOfInstallments = newInstallments || 1;
    dueDay = newDueDay || dueDay;
    firstInstallmentMonth = newMonth || firstInstallmentMonth;
    firstInstallmentYear = newYear || firstInstallmentYear;
    hasDownPayment = newHasDownPayment || false;
    downPaymentValue =
      newDownPaymentValue === undefined ? "" : newDownPaymentValue;
  }
</script>

<div class="finalization-section">
  <div class="section-header">
    <h2>🛍️ Finalizar Venda</h2>
    <div class="total-display">
      Total: <span class="total-value">{formatCurrency(total)}</span>
    </div>
  </div>

  <div class="section-content">
    <!-- Layout: Controles à esquerda, Prévia à direita -->
    <div class="main-layout">
      <!-- Coluna Esquerda: Cliente + Forma de Pagamento empilhados -->
      <div class="controls-column">
        <div class="customer-section">
          <h3>👤 Selecionar Cliente</h3>
          <CustomerSelector
            bind:selectedCustomer
            on:customerSelected={handleCustomerSelect}
          />
        </div>

        <div class="payment-form-section">
          <h3>💳 Forma de Pagamento</h3>
          <PaymentTypeSelector
            bind:paymentType
            bind:numberOfInstallments
            bind:dueDay
            bind:firstInstallmentMonth
            bind:firstInstallmentYear
            bind:hasDownPayment
            bind:downPaymentValue
            {total}
            on:paymentChange={handlePaymentChange}
            showPreview={false}
          />
        </div>
      </div>

      <!-- Coluna Direita: Prévia das Parcelas -->
      <div class="preview-column">
        {#if paymentType === PaymentTypeEnum.INSTALLMENTS && numberOfInstallments > 1}
          <div class="installments-preview-container">
            <h3>📋 Prévia das Parcelas</h3>
            {#key previewKey}
              <PaymentTypeSelector
                bind:paymentType
                bind:numberOfInstallments
                bind:dueDay
                bind:firstInstallmentMonth
                bind:firstInstallmentYear
                bind:hasDownPayment
                bind:downPaymentValue
                {total}
                on:paymentChange={handlePaymentChange}
                previewOnly={true}
              />
            {/key}
          </div>
        {:else if paymentType === PaymentTypeEnum.CASH}
          <div class="installments-preview-container">
            <h3>📋 Prévia do Pagamento</h3>
            <div class="cash-preview">
              <p>
                💰 Pagamento à vista: <strong
                  >R$ {total.toFixed(2).replace(".", ",")}</strong
                >
              </p>
            </div>
          </div>
        {:else if paymentType === PaymentTypeEnum.PIX}
          <div class="installments-preview-container">
            <h3>📋 Prévia do Pagamento</h3>
            <div class="cash-preview">
              <p>
                📱 Pagamento via PIX: <strong
                  >R$ {total.toFixed(2).replace(".", ",")}</strong
                >
              </p>
            </div>
          </div>
        {:else if paymentType === PaymentTypeEnum.CARD}
          <div class="installments-preview-container">
            <h3>📋 Prévia do Pagamento</h3>
            <div class="cash-preview">
              <p>
                💳 Pagamento no cartão: <strong
                  >R$ {total.toFixed(2).replace(".", ",")}</strong
                >
              </p>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Botões de Ação -->
    <div class="actions">
      <button type="button" class="btn-secondary" on:click={handleCancel}>
        ↩️ Voltar aos Produtos
      </button>
      <button type="button" class="btn-primary" on:click={handleConfirmSale}>
        ✅ Confirmar Venda
      </button>
    </div>
  </div>
</div>

<style>
  .finalization-section {
    background: #1e1e1e;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 1rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #333;
  }

  .section-header h2 {
    margin: 0;
    color: var(--primary-color);
    font-size: 1.2rem;
  }

  .total-display {
    font-size: 1.1rem;
    color: #fff;
  }

  .total-value {
    color: #4ade80;
    font-weight: 600;
    font-size: 1.3rem;
  }

  .section-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    overflow: hidden;
    min-height: 0;
  }

  .main-layout {
    display: flex;
    gap: 1.5rem;
    flex: 1;
    min-height: 0;
  }

  .controls-column {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
    min-width: 0;
  }

  .preview-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
  }

  .customer-section {
    background: #2a2a2a;
    padding: 1rem;
    border-radius: 6px;
    border: 1px solid #555;
    overflow-y: auto;
    min-height: 0;
  }

  .payment-form-section {
    background: #2a2a2a;
    padding: 1rem;
    border-radius: 6px;
    border: 1px solid #555;
    overflow-y: auto;
    min-height: 0;
  }

  .installments-preview-container {
    background: #2a2a2a;
    padding: 1rem;
    border-radius: 6px;
    border: 1px solid #555;
    overflow-y: auto;
    flex: 1;
  }

  .cash-preview {
    padding: 1rem;
    background: #1e1e1e;
    border: 1px solid #4ade80;
    border-radius: 6px;
    text-align: center;
  }

  .cash-preview p {
    margin: 0;
    color: #4ade80;
    font-size: 1.1rem;
  }

  .customer-section h3,
  .payment-form-section h3,
  .installments-preview-container h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: var(--text-accent);
    padding-bottom: 0.3rem;
  }

  .actions {
    display: flex;
    gap: 1rem;
    padding: 1rem 0 0 0;
    flex-shrink: 0;
    background: #1e1e1e;
    margin-top: auto;
  }

  .btn-primary,
  .btn-secondary {
    flex: 1;
    padding: 0.8rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn-primary {
    background: var(--primary-color);
    color: white;
  }

  .btn-primary:hover {
    background: var(--primary-color-hover);
    transform: translateY(-1px);
  }

  .btn-secondary {
    background: #4a4a4a;
    color: #fff;
    border: 1px solid #666;
  }

  .btn-secondary:hover {
    background: #5a5a5a;
    transform: translateY(-1px);
  }

  .btn-primary:active,
  .btn-secondary:active {
    transform: translateY(0);
  }

  /* Responsivo */
  @media (max-width: 768px) {
    .section-header {
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .main-layout {
      flex-direction: column;
    }

    .actions {
      flex-direction: column;
    }
  }
</style>
