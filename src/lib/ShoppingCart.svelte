<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { StockItem, PaymentType, Customer } from "../types";

  export let cart: { item: StockItem; quantity: number }[] = [];
  export let total: number = 0;
  export let paymentType: PaymentType = "cash";
  export let numberOfInstallments: number = 1;
  export let dueDay: number = 10;
  export let firstInstallmentMonth: number = new Date().getMonth() + 1;
  export let firstInstallmentYear: number = new Date().getFullYear();
  export let selectedCustomer: Customer | null = null;
  export let showFinalizationButton: boolean = true;

  const dispatch = createEventDispatcher();

  function getPrice(item: StockItem): number {
    // Primeiro tenta usar o preço definido no produto
    if (item.properties.price) {
      const price = parseFloat(item.properties.price);
      if (!isNaN(price)) {
        console.log(
          `ShoppingCart - Produto ${item.properties.brand} ${item.properties.type}: usando preço definido ${price}`
        );
        return price;
      }
    }

    console.log(
      `ShoppingCart - Produto ${item.properties.brand} ${item.properties.type}: sem preço definido, usando fallback`
    );

    // Fallback para preços baseados no tipo (para compatibilidade com produtos antigos)
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
  function updateCartQuantity(itemId: number, newQuantity: number) {
    dispatch("updateQuantity", { itemId, newQuantity });
  }

  function removeFromCart(itemId: number) {
    dispatch("removeItem", itemId);
  }

  function clearCart() {
    dispatch("clearCart");
  }

  function finalizeSale() {
    dispatch("finalizeSale");
  }
</script>

<div class="cart-section">
  <h2>Carrinho de Vendas</h2>

  {#if cart.length === 0}
    <div class="empty-cart">
      <p>Carrinho vazio</p>
      <span>Adicione produtos para iniciar uma venda</span>
    </div>
  {:else}
    <div class="cart-items">
      {#each cart as cartItem (cartItem.item.id)}
        <div class="cart-item">
          <div class="item-info">
            <div class="item-name">
              {cartItem.item.properties.type}
              {cartItem.item.properties.brand}
            </div>
            <div class="item-details">
              {cartItem.item.properties.fabric} - {cartItem.item.properties
                .color} - {cartItem.item.properties.size}
            </div>
          </div>

          <div class="item-controls">
            <div class="item-total">
              R$ {(cartItem.quantity * getPrice(cartItem.item)).toFixed(2)}
            </div>
            <div class="quantity-controls">
              <button
                class="qty-btn"
                on:click={() =>
                  updateCartQuantity(cartItem.item.id, cartItem.quantity - 1)}
              >
                -
              </button>
              <span class="quantity">{cartItem.quantity}</span>
              <button
                class="qty-btn"
                on:click={() =>
                  updateCartQuantity(cartItem.item.id, cartItem.quantity + 1)}
                disabled={cartItem.quantity >= cartItem.item.quantity}
              >
                +
              </button>
            </div>
          </div>

          <button
            class="remove-btn"
            on:click={() => removeFromCart(cartItem.item.id)}
          >
            ❌
          </button>
        </div>
      {/each}
    </div>

    <div class="cart-summary">
      <div class="total">
        <strong>Total: R$ {total.toFixed(2)}</strong>
        {#if paymentType === "installments" && total > 0 && !showFinalizationButton}
          <div class="installment-info">
            {numberOfInstallments}x de R$ {(
              total / numberOfInstallments
            ).toFixed(2)}
            <div class="installment-details">
              Vencimento: Dia {dueDay} de cada mês
              <br />
              Primeira parcela: {new Date(
                firstInstallmentYear,
                firstInstallmentMonth - 1
              ).toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
        {/if}
      </div>

      <div class="cart-actions">
        <button class="clear-btn" on:click={clearCart}>
          Limpar Carrinho
        </button>
        {#if showFinalizationButton}
          <button
            class="finalize-btn"
            on:click={() => dispatch("finalizeSale")}
            disabled={cart.length === 0}
          >
            Finalizar Venda
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  /* Carrinho */
  .cart-section {
    background: #2a2a2a;
    border-radius: 8px;
    padding: 0.5rem;
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.1);
    display: flex;
    flex-direction: column;
    border: 2px solid var(--primary-color-border);
    height: 100%;
    min-height: 0;
  }

  .cart-section h2 {
    color: var(--text-accent);
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    flex-shrink: 0;
  }

  .empty-cart {
    text-align: center;
    color: #888;
    padding: 1rem 0.5rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .empty-cart p {
    font-size: 0.9rem;
    margin-bottom: 0.3rem;
    color: #cccccc;
  }

  .empty-cart span {
    color: #888;
  }

  .cart-items {
    overflow-y: auto;
    margin-bottom: 0.5rem;
    min-height: 0;
    max-height: 60vh;
  }

  .cart-item {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 0.5rem;
    align-items: start;
    padding: 0.5rem;
    border: 2px solid #555;
    border-radius: 6px;
    margin-bottom: 0.3rem;
    background: #333;
    transition: border-color 0.2s;
  }

  .cart-item:hover {
    border-color: var(--primary-color-border);
  }

  .item-info {
    min-width: 0;
  }

  .item-name {
    font-weight: 600;
    margin-bottom: 0.1rem;
    color: var(--text-accent);
    font-size: 0.8rem;
  }

  .item-details {
    font-size: 0.7rem;
    color: #cccccc;
  }

  .item-controls {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.3rem;
  }

  .item-total {
    font-weight: 600;
    color: #4ade80;
    text-align: right;
  }

  .quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .qty-btn {
    width: 22px;
    height: 22px;
    border: 2px solid var(--primary-color-border);
    background: #2a2a2a;
    color: var(--text-accent);
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    font-size: 0.7rem;
  }

  .qty-btn:hover:not(:disabled) {
    background: var(--primary-color-transparent);
    color: #1a1a1a;
  }

  .qty-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border-color: #555;
    color: #555;
  }

  .quantity {
    min-width: 30px;
    text-align: center;
    font-weight: 600;
    color: #ffffff;
  }

  .remove-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.25rem;
    transition: transform 0.2s;
    align-self: center;
    justify-self: end;
  }

  .remove-btn:hover {
    transform: scale(1.2);
  }

  .cart-summary {
    border-top: 2px solid var(--primary-color);
    padding-top: 1rem;
    flex-shrink: 0;
    margin-top: auto;
  }

  .total {
    font-size: 1.3rem;
    text-align: center;
    margin-bottom: 1rem;
    color: var(--text-accent);
    font-weight: bold;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .installment-info {
    font-size: 0.9rem;
    color: #ccc;
    margin-top: 0.25rem;
    font-weight: normal;
  }

  .installment-details {
    font-size: 0.8rem;
    color: var(--text-accent);
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: var(--color-gold-transparent);
    border-radius: var(--radius-sm);
    border-left: 3px solid var(--border-primary);
  }

  .cart-actions {
    display: flex;
    gap: 0.75rem;
    flex-shrink: 0;
    margin-top: 1rem;
  }

  .clear-btn,
  .finalize-btn {
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .clear-btn {
    background-color: #dc3545;
    color: white;
  }

  .clear-btn:hover {
    background-color: #c82333;
    transform: translateY(-1px);
  }

  .finalize-btn {
    background-color: #4ade80;
    color: #1a1a1a;
  }

  .finalize-btn:hover:not(:disabled) {
    background-color: #22c55e;
    transform: translateY(-1px);
  }

  .finalize-btn:disabled {
    background-color: #555;
    color: #888;
    cursor: not-allowed;
  }
</style>
