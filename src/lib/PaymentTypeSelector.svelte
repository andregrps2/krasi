<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { PaymentType, Customer } from "../types";

  const dispatch = createEventDispatcher();

  // Props
  export let selectedCustomer: Customer | null = null;
  export let paymentType: PaymentType = "cash";
  export let numberOfInstallments = 2;
  export let installmentFrequency = 30;
  export let dueDay = 10;
  export let firstInstallmentMonth = new Date().getMonth() + 1;
  export let firstInstallmentYear = new Date().getFullYear();
  export let total = 0;
  export let showPreview = true;
  export let previewOnly = false;
  export let hasDownPayment = false;
  export let downPaymentValue: number | string = "";

  // Variável reativa para a lista de parcelas
  let installmentsList: any[] = [];

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

    // Garantir que downPaymentValue é um número
    const entryValue = Number(downPaymentValue) || 0;
    const installments = [];

    // Se tem entrada, primeira parcela é a entrada
    if (hasDownPayment && entryValue > 0) {
      const entryInstallment = {
        number: 1,
        value: entryValue,
        dueDate: "Entrada",
        isDownPayment: true,
        isPaid: true,
      };
      installments.push(entryInstallment);

      // Calcular parcelas normais
      // Se tem entrada: numberOfInstallments inclui a entrada, então parcelas normais = numberOfInstallments - 1
      const remainingAmount = total - entryValue;
      const normalInstallments = numberOfInstallments - 1;

      if (normalInstallments > 0) {
        const installmentValue = remainingAmount / normalInstallments;
        // Calcular o valor base para cada parcela (arredondado para baixo)
        const baseInstallmentValue = Math.floor(installmentValue * 100) / 100;

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
            // Somar todas as parcelas anteriores para calcular o que resta
            let sumPreviousParcels = 0;
            for (let j = 0; j < i; j++) {
              sumPreviousParcels += Math.round(installmentValue * 100) / 100;
            }
            finalValue = remainingAmount - sumPreviousParcels;
          } else {
            // Para parcelas não-finais, usar valor arredondado
            finalValue = Math.round(installmentValue * 100) / 100;
          }

          const normalInstallment = {
            number: i + 2,
            value: finalValue,
            dueDate: date.toLocaleDateString("pt-BR"),
            isDownPayment: false,
            isPaid: false,
          };
          installments.push(normalInstallment);
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
          // Somar todas as parcelas anteriores para calcular o que resta
          let sumPreviousParcels = 0;
          for (let j = 0; j < i; j++) {
            sumPreviousParcels += Math.round(installmentValue * 100) / 100;
          }
          finalValue = total - sumPreviousParcels;
        } else {
          // Para parcelas não-finais, usar valor arredondado
          finalValue = Math.round(installmentValue * 100) / 100;
        }

        const normalInstallment = {
          number: i + 1,
          value: finalValue,
          dueDate: date.toLocaleDateString("pt-BR"),
          isDownPayment: false,
          isPaid: false,
        };
        installments.push(normalInstallment);
      }
    }

    return installments;
  }

  // Reactive statement para calcular parcelas automaticamente
  $: installmentsList = calculateInstallments();

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
  {#if !previewOnly}
    <div class="payment-form">
      <div class="payment-controls">
        <div class="control-group">
          <label for="payment-select">Pagamento:</label>
          <select
            id="payment-select"
            bind:value={paymentType}
            class="enhanced-select"
            on:change={() => {
              dispatch("paymentChange", {
                paymentType,
                numberOfInstallments,
                dueDay,
                firstInstallmentMonth,
                firstInstallmentYear,
                hasDownPayment,
                downPaymentValue: Number(downPaymentValue) || 0,
              });
            }}
          >
            <option value="cash">💰 À Vista</option>
            <option value="pix">📱 PIX</option>
            <option value="card">💳 Cartão</option>
            <option value="installments">📋 Parcelado</option>
          </select>
        </div>

        {#if paymentType === "installments"}
          <div class="installment-controls">
            <div class="control-row">
              <div class="control-group">
                <label for="installments-select">Parcelas:</label>
                <select
                  id="installments-select"
                  bind:value={numberOfInstallments}
                  class="enhanced-select small"
                  on:change={() => {
                    dispatch("paymentChange", {
                      paymentType,
                      numberOfInstallments,
                      dueDay,
                      firstInstallmentMonth,
                      firstInstallmentYear,
                      hasDownPayment,
                      downPaymentValue: Number(downPaymentValue) || 0,
                    });
                  }}
                >
                  <option value={2}>2x</option>
                  <option value={3}>3x</option>
                  <option value={4}>4x</option>
                  <option value={5}>5x</option>
                  <option value={6}>6x</option>
                  <option value={7}>7x</option>
                  <option value={8}>8x</option>
                  <option value={9}>9x</option>
                  <option value={10}>10x</option>
                  <option value={11}>11x</option>
                  <option value={12}>12x</option>
                </select>
              </div>

              <div class="control-group">
                <label for="due-day-select">Venc.:</label>
                <select
                  id="due-day-select"
                  bind:value={dueDay}
                  class="enhanced-select small"
                  on:change={() => {
                    dispatch("paymentChange", {
                      paymentType,
                      numberOfInstallments,
                      dueDay,
                      firstInstallmentMonth,
                      firstInstallmentYear,
                      hasDownPayment,
                      downPaymentValue: Number(downPaymentValue) || 0,
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
                  class="enhanced-select"
                  on:change={() => {
                    dispatch("paymentChange", {
                      paymentType,
                      numberOfInstallments,
                      dueDay,
                      firstInstallmentMonth,
                      firstInstallmentYear,
                      hasDownPayment,
                      downPaymentValue: Number(downPaymentValue) || 0,
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
                  class="enhanced-select small"
                  on:change={() => {
                    dispatch("paymentChange", {
                      paymentType,
                      numberOfInstallments,
                      dueDay,
                      firstInstallmentMonth,
                      firstInstallmentYear,
                      hasDownPayment,
                      downPaymentValue: Number(downPaymentValue) || 0,
                    });
                  }}
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>

            <!-- Controles de Entrada -->
            <div class="down-payment-section">
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    bind:checked={hasDownPayment}
                    class="enhanced-checkbox"
                    on:change={() => {
                      if (!hasDownPayment) {
                        downPaymentValue = "";
                      }
                      dispatch("paymentChange", {
                        paymentType,
                        numberOfInstallments,
                        dueDay,
                        firstInstallmentMonth,
                        firstInstallmentYear,
                        hasDownPayment,
                        downPaymentValue: Number(downPaymentValue) || 0,
                      });
                    }}
                  />
                  <span class="checkmark"></span>
                  💰 Possui Valor de Entrada
                </label>
              </div>

              {#if hasDownPayment}
                <div class="control-group">
                  <label for="down-payment-input"
                    >💰 Valor da Entrada (R$):</label
                  >
                  <input
                    id="down-payment-input"
                    type="number"
                    step="0.01"
                    min="0"
                    max={total}
                    value={downPaymentValue === 0 || downPaymentValue === ""
                      ? ""
                      : downPaymentValue}
                    class="enhanced-input price-input"
                    placeholder="0,00"
                    on:input={(e) => {
                      const target = e.currentTarget as HTMLInputElement;
                      downPaymentValue =
                        target.value === "" ? "" : Number(target.value);
                      dispatch("paymentChange", {
                        paymentType,
                        numberOfInstallments,
                        dueDay,
                        firstInstallmentMonth,
                        firstInstallmentYear,
                        hasDownPayment,
                        downPaymentValue: Number(downPaymentValue) || 0,
                      });
                    }}
                  />
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Prévia das Parcelas -->
  {#if (showPreview || previewOnly) && paymentType === "installments" && installmentsList.length > 0}
    <div class="installments-preview">
      <!-- Tabela compacta e elegante -->
      <div class="installments-table-container">
        {#if !previewOnly}
          <h4 class="table-title">📋 Prévia das Parcelas</h4>
        {/if}

        <div class="installments-grid">
          <!-- Header -->
          <div class="grid-header">
            <div class="header-cell">Parcela</div>
            <div class="header-cell">Vencimento</div>
            <div class="header-cell">Valor</div>
          </div>

          <!-- Rows -->
          <div class="grid-body">
            {#each installmentsList as installment, index}
              <div
                class="grid-row"
                class:even={index % 2 === 0}
                class:down-payment={installment.isDownPayment}
                class:paid={installment.isPaid}
              >
                <div class="cell installment-number">
                  {#if installment.isDownPayment}
                    {#if installment.isPaid}
                      <span class="paid-text">PAGO</span>
                    {:else}
                      💰
                    {/if}
                  {:else}
                    {installment.number}ª
                  {/if}
                </div>
                <div class="cell installment-date">{installment.dueDate}</div>
                <div class="cell installment-value">
                  {formatCurrency(installment.value)}
                </div>
              </div>
            {/each}
          </div>

          <!-- Footer -->
          <div class="grid-footer">
            <div class="footer-cell">Total</div>
            <div class="footer-cell"></div>
            <div class="footer-cell total-amount">{formatCurrency(total)}</div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .payment-compact {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0;
    flex-wrap: wrap;
  }

  /* Formulário de Pagamento Melhorado */
  .payment-form {
    width: 100%;
    background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
    border-radius: 8px;
    padding: 0.6rem;
    border: 1px solid #333;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .payment-controls {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .control-row {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    align-items: end;
  }

  .installment-controls {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding-top: 0.4rem;
    border-top: 1px solid #444;
  }

  .down-payment-section {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.6rem;
    background: rgba(255, 215, 0, 0.05);
    border: 1px solid rgba(255, 215, 0, 0.2);
    border-radius: 6px;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  .control-group label {
    color: var(--text-accent);
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    margin-bottom: 0.1rem;
  }

  /* Selects e Inputs Melhorados */
  .enhanced-select,
  .enhanced-input {
    padding: 0.3rem 0.5rem;
    border: 2px solid #555;
    border-radius: 6px;
    background: linear-gradient(135deg, #333 0%, #2a2a2a 100%);
    color: white;
    font-size: 0.8rem;
    min-height: 32px;
    transition: all 0.2s ease;
  }

  .enhanced-select:focus,
  .enhanced-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
    transform: translateY(-1px);
  }

  .enhanced-select.small {
    min-width: 70px;
  }

  .enhanced-input {
    min-width: 120px;
  }

  /* Campo de preço melhorado */
  .price-input {
    font-size: 1rem !important;
    font-weight: 600;
    text-align: right;
    padding: 0.5rem 0.7rem !important;
    min-height: 40px !important;
    background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%) !important;
    border: 2px solid #666 !important;
    color: #4ade80 !important;
    min-width: 140px !important;
  }

  .price-input:focus {
    border-color: var(--primary-color) !important;
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.3) !important;
    background: linear-gradient(135deg, #333 0%, #2a2a2a 100%) !important;
  }

  /* Remover setinhas do input number */
  .price-input::-webkit-outer-spin-button,
  .price-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .price-input[type="number"] {
    -moz-appearance: textfield;
  }

  /* Checkbox Customizado */
  .checkbox-group {
    display: flex;
    align-items: center;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-accent);
    transition: color 0.2s ease;
  }

  .checkbox-label:hover {
    color: var(--primary-color);
  }

  .enhanced-checkbox {
    display: none;
  }

  .checkmark {
    width: 20px;
    height: 20px;
    border: 2px solid #555;
    border-radius: 4px;
    background: #2a2a2a;
    position: relative;
    transition: all 0.2s ease;
  }

  .enhanced-checkbox:checked + .checkmark {
    background: var(--primary-color);
    border-color: var(--primary-color);
  }

  .enhanced-checkbox:checked + .checkmark::after {
    content: "✓";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #000;
    font-weight: bold;
    font-size: 12px;
  }

  /* Prévia das Parcelas */
  .installments-preview {
    margin-top: 0;
    padding: 0;
    max-height: none;
    overflow: visible;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .installments-preview h4 {
    margin: 0;
    color: var(--text-accent);
    font-size: 0.8rem;
    padding-bottom: 0;
    flex-shrink: 0;
  }

  .table-title {
    margin: 0 !important;
    padding: 0.4rem 0.7rem 0.2rem 0.7rem !important;
    color: var(--text-accent) !important;
    font-size: 0.8rem !important;
    font-weight: 600 !important;
  }

  /* Container da tabela */
  .installments-table-container {
    background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
    border-radius: 6px;
    padding: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    border: 1px solid #333;
  }

  .installments-grid {
    width: 100%;
    overflow: hidden;
  }

  /* Header da tabela */
  .grid-header {
    display: grid;
    grid-template-columns: 80px 1.2fr 90px;
    gap: 0.5rem;
    padding: 0.5rem 0.7rem;
    background: linear-gradient(135deg, var(--primary-color) 0%, #e6b800 100%);
    border-radius: 4px 4px 0 0;
    margin-bottom: 1px;
  }

  .header-cell {
    font-weight: 700;
    font-size: 0.7rem;
    color: #000;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  /* Body da tabela */
  .grid-body {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .grid-row {
    display: grid;
    grid-template-columns: 80px 1.2fr 90px;
    gap: 0.5rem;
    padding: 0.4rem 0.7rem;
    background: #1a1a1a;
    transition: all 0.15s ease;
  }

  .grid-row:hover {
    background: #252525;
    transform: translateX(1px);
  }

  .grid-row.even {
    background: #1e1e1e;
  }

  .grid-row.even:hover {
    background: #282828;
  }

  .cell {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
  }

  .installment-number {
    justify-content: center;
    color: var(--primary-color);
    font-weight: 700;
    font-size: 0.8rem;
    background: rgba(255, 215, 0, 0.1);
    border-radius: 3px;
    padding: 0.1rem 0.3rem;
  }

  .installment-date {
    justify-content: center;
    color: #fff;
    font-weight: 500;
    font-size: 0.75rem;
  }

  .installment-value {
    justify-content: flex-end;
    color: #4ade80;
    font-weight: 700;
    font-size: 0.8rem;
    position: relative;
  }

  /* Estados especiais das parcelas */
  .grid-row.down-payment {
    background: linear-gradient(
      135deg,
      rgba(255, 215, 0, 0.15) 0%,
      rgba(255, 215, 0, 0.05) 100%
    ) !important;
    border: 1px solid rgba(255, 215, 0, 0.3);
  }

  .grid-row.paid {
    background: linear-gradient(
      135deg,
      rgba(74, 222, 128, 0.15) 0%,
      rgba(74, 222, 128, 0.05) 100%
    ) !important;
    border: 1px solid rgba(74, 222, 128, 0.3);
  }

  .paid-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #4ade80;
    color: #000;
    font-size: 0.6rem;
    font-weight: 700;
    padding: 0.1rem 0.3rem;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .paid-text {
    background: #4ade80;
    color: #000;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    text-shadow: none;
  }

  /* Footer da tabela */
  .grid-footer {
    display: grid;
    grid-template-columns: 80px 1.2fr 90px;
    gap: 0.5rem;
    padding: 0.5rem 0.7rem;
    background: linear-gradient(135deg, #333 0%, #2a2a2a 100%);
    border-radius: 0 0 4px 4px;
    border-top: 2px solid var(--primary-color);
    margin-top: 1px;
  }

  .footer-cell {
    display: flex;
    align-items: center;
    font-weight: 700;
    font-size: 0.75rem;
    color: var(--text-accent);
  }

  .footer-cell:first-child {
    justify-content: center;
  }

  .total-amount {
    justify-content: flex-end !important;
    color: #4ade80 !important;
    font-size: 0.85rem !important;
    text-shadow: 0 0 6px rgba(74, 222, 128, 0.3);
  }

  /* Responsivo */
  @media (max-width: 768px) {
    .payment-form {
      padding: 0.5rem;
    }

    .control-row {
      flex-direction: column;
      gap: 0.5rem;
    }

    .control-group {
      min-width: 100%;
    }

    .down-payment-section {
      padding: 0.5rem;
    }

    .installments-table-container {
      padding: 0;
    }

    .grid-header,
    .grid-row,
    .grid-footer {
      grid-template-columns: 65px 1.2fr 80px;
      gap: 0.4rem;
      padding: 0.4rem 0.6rem;
    }

    .header-cell,
    .footer-cell {
      font-size: 0.65rem;
    }

    .cell {
      font-size: 0.7rem;
    }

    .installment-number {
      font-size: 0.7rem;
      padding: 0.05rem 0.2rem;
    }

    .total-amount {
      font-size: 0.8rem !important;
    }
  }

  @media (max-width: 480px) {
    .grid-header,
    .grid-row,
    .grid-footer {
      grid-template-columns: 55px 1.2fr 70px;
      gap: 0.3rem;
      padding: 0.3rem 0.5rem;
    }

    .installments-table-container {
      padding: 0;
    }
  }
</style>
