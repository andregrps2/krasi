<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Modal from "./Modal.svelte";
  import type { Sale } from "../types";

  export let isOpen = false;
  export let sale: Sale | null = null;

  const dispatch = createEventDispatcher();

  function handleClose() {
    dispatch("close");
  }

  function formatCurrency(value: any): string {
    // Converter para número se necessário
    const numValue = typeof value === "number" ? value : parseFloat(value) || 0;
    return `R$ ${numValue.toFixed(2).replace(".", ",")}`;
  }

  function getPaymentTypeLabel(type: string): string {
    switch (type) {
      case "cash":
        return "À Vista";
      case "installments":
        return "Parcelado";
      case "pix":
        return "PIX";
      case "card":
        return "Cartão";
      default:
        return type;
    }
  }
</script>

<Modal bind:show={isOpen}>
  {#if sale}
    <div class="sale-success">
      <div class="success-icon">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22,4 12,14.01 9,11.01"></polyline>
        </svg>
      </div>

      <h2>Venda Finalizada com Sucesso!</h2>

      <div class="sale-details">
        <div class="detail-row">
          <span class="label">Número da Venda:</span>
          <span class="value">#VD{sale.id.toString().padStart(4, "0")}</span>
        </div>

        <div class="detail-row">
          <span class="label">Data:</span>
          <span class="value"
            >{new Date(sale.date).toLocaleDateString("pt-BR")}</span
          >
        </div>

        <div class="detail-row">
          <span class="label">Valor Total:</span>
          <span class="value total">{formatCurrency(sale.total)}</span>
        </div>

        <div class="detail-row">
          <span class="label">Forma de Pagamento:</span>
          <span class="value">{getPaymentTypeLabel(sale.paymentType)}</span>
        </div>

        {#if sale.customer}
          <div class="detail-row">
            <span class="label">Cliente:</span>
            <span class="value">{sale.customer.name}</span>
          </div>
        {/if}

        {#if sale.paymentType === "installments" && sale.installments && sale.installments.length > 0}
          <div class="installments-info">
            <h3>Parcelas Geradas</h3>
            <div class="installments-grid">
              {#each sale.installments as installment, index}
                <div class="installment-card">
                  <div class="installment-header">
                    <span class="installment-number">{index + 1}ª Parcela</span>
                    <span class="installment-value"
                      >{formatCurrency(installment.value)}</span
                    >
                  </div>
                  <div class="installment-due">
                    Vencimento: {installment.dueDate}
                  </div>
                </div>
              {/each}
            </div>
            <div class="installments-summary">
              <strong>
                Total: {formatCurrency(
                  sale.installments.reduce((sum, inst) => sum + inst.value, 0)
                )}
                em {sale.installments.length}x
              </strong>
            </div>
          </div>
        {/if}

        <div class="items-summary">
          <h3>Itens Vendidos</h3>
          <div class="items-list">
            {#each sale.items as item}
              <div class="item-row">
                <span class="item-desc">
                  {item.brand}
                  {item.type}
                  {#if item.size}
                    - Tam. {item.size}{/if}
                  {#if item.color}
                    - {item.color}{/if}
                </span>
                <span class="item-qty">{item.quantity}x</span>
                <span class="item-value"
                  >{formatCurrency(item.unitPrice * item.quantity)}</span
                >
              </div>
            {/each}
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn-new-sale" on:click={handleClose}>
          Nova Venda
        </button>
      </div>
    </div>
  {/if}
</Modal>

<style>
  .sale-success {
    max-width: 500px;
    width: 100%;
    text-align: center;
    max-height: 80vh;
    overflow-y: auto;
  }

  .success-icon {
    color: #4ade80;
    margin-bottom: 1rem;
    display: flex;
    justify-content: center;
  }

  .sale-success h2 {
    color: var(--text-accent);
    margin: 0 0 1.5rem 0;
    font-size: 1.4rem;
  }

  .sale-success h3 {
    color: var(--primary-color);
    margin: 1rem 0 0.7rem 0;
    font-size: 1rem;
    text-align: left;
    border-bottom: 1px solid #555;
    padding-bottom: 0.3rem;
  }

  .sale-details {
    text-align: left;
    background: #2a2a2a;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #555;
    margin-bottom: 1.5rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #444;
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .label {
    color: #ccc;
    font-size: 0.9rem;
  }

  .value {
    color: #fff;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .value.total {
    color: #4ade80;
    font-size: 1.1rem;
  }

  .installments-info {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #555;
  }

  .installments-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .installment-card {
    background: #333;
    border: 1px solid #555;
    border-radius: 4px;
    padding: 0.7rem;
  }

  .installment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.3rem;
  }

  .installment-number {
    color: var(--text-accent);
    font-weight: 600;
    font-size: 0.8rem;
  }

  .installment-value {
    color: #4ade80;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .installment-due {
    color: #ccc;
    font-size: 0.8rem;
  }

  .installments-summary {
    text-align: right;
    color: var(--text-accent);
    border-top: 1px solid #555;
    padding-top: 0.5rem;
  }

  .items-summary {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #555;
  }

  .items-list {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .item-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 1rem;
    align-items: center;
    padding: 0.3rem 0;
    border-bottom: 1px solid #444;
  }

  .item-row:last-child {
    border-bottom: none;
  }

  .item-desc {
    color: #fff;
    font-size: 0.8rem;
  }

  .item-qty {
    color: var(--text-accent);
    font-weight: 600;
    font-size: 0.8rem;
  }

  .item-value {
    color: #4ade80;
    font-weight: 600;
    text-align: right;
    font-size: 0.8rem;
  }

  .actions {
    display: flex;
    justify-content: center;
    margin-top: 1.5rem;
  }

  .btn-new-sale {
    background: var(--primary-color);
    color: #1a1a1a;
    border: none;
    border-radius: 6px;
    padding: 0.8rem 2rem;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .btn-new-sale:hover {
    background: #ffed4e;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);
  }
</style>
