<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    stock,
    propertyDefinitions,
    salesHistory,
    customers,
    installments,
  } from "../stores";
  import Modal from "./Modal.svelte";
  import PaymentTypeSelector from "./PaymentTypeSelector.svelte";
  import type {
    StockItem,
    Sale,
    SaleItem,
    Customer,
    PaymentType,
    Installment,
  } from "../types";

  const dispatch = createEventDispatcher();

  // Estado da venda
  let searchTerm = "";
  let customerSearchTerm = "";
  let showCustomerModal = false;
  let cart: { item: StockItem; quantity: number }[] = [];
  let total = 0;
  let selectedCustomer: Customer | null = null;
  let paymentType: PaymentType = "cash";
  let numberOfInstallments = 1;
  let installmentFrequency = 30; // dias entre parcelas
  let dueDay = 10; // dia do vencimento (1-31)
  let firstInstallmentMonth = new Date().getMonth() + 1; // mês da primeira parcela (1-12)
  let firstInstallmentYear = new Date().getFullYear(); // ano da primeira parcela

  // Computar total do carrinho
  $: total = cart.reduce(
    (sum, cartItem) => sum + cartItem.quantity * getPrice(cartItem.item),
    0
  );

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

  // Filtrar produtos disponíveis
  $: availableProducts = $stock.filter((item) => {
    if (item.quantity <= 0) return false;

    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    return Object.values(item.properties).some((val) =>
      String(val).toLowerCase().includes(term)
    );
  });

  // Função para obter preço (por enquanto usando um valor fixo, pode ser expandido)
  function getPrice(item: StockItem): number {
    // Por enquanto, vamos usar um preço baseado no tipo de produto
    const type = item.properties.type?.toLowerCase();
    switch (type) {
      case "terno":
        return 299.99;
      case "palitó":
        return 199.99;
      case "camisa":
        return 89.99;
      case "camiseta":
        return 49.99;
      case "sapato":
        return 159.99;
      default:
        return 99.99;
    }
  }

  function addToCart(item: StockItem) {
    const existingItem = cart.find((cartItem) => cartItem.item.id === item.id);

    if (existingItem) {
      if (existingItem.quantity < item.quantity) {
        existingItem.quantity += 1;
        cart = [...cart];
      }
    } else {
      cart = [...cart, { item, quantity: 1 }];
    }
  }

  function removeFromCart(itemId: number) {
    cart = cart.filter((cartItem) => cartItem.item.id !== itemId);
  }

  function updateCartQuantity(itemId: number, newQuantity: number) {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const cartItem = cart.find((item) => item.item.id === itemId);
    if (cartItem && newQuantity <= cartItem.item.quantity) {
      cartItem.quantity = newQuantity;
      cart = [...cart];
    }
  }

  function finalizeSale() {
    if (cart.length === 0) return;

    // Para vendas a prazo, cliente é obrigatório
    if (paymentType === "installments" && !selectedCustomer) {
      alert("Para vendas a prazo, é necessário selecionar um cliente!");
      return;
    }

    // Criar registro da venda
    const saleItems: SaleItem[] = cart.map((cartItem) => ({
      stockItemId: cartItem.item.id,
      stockItem: cartItem.item,
      quantity: cartItem.quantity,
      unitPrice: getPrice(cartItem.item),
      totalPrice: cartItem.quantity * getPrice(cartItem.item),
    }));

    const saleId =
      $salesHistory.length > 0
        ? Math.max(...$salesHistory.map((s) => s.id)) + 1
        : 1;

    // Criar parcelas se for venda a prazo
    let saleInstallments: Installment[] = [];
    if (paymentType === "installments") {
      const installmentAmount = total / numberOfInstallments;

      for (let i = 0; i < numberOfInstallments; i++) {
        // Calcular a data de vencimento baseada no dia, mês e ano da primeira parcela
        let month = firstInstallmentMonth + i;
        let year = firstInstallmentYear;

        // Ajustar o ano se o mês ultrapassar dezembro
        while (month > 12) {
          month -= 12;
          year += 1;
        }

        // Função para obter o último dia do mês
        const getLastDayOfMonth = (year: number, month: number) => {
          return new Date(year, month, 0).getDate();
        };

        // Verificar se o dia escolhido existe no mês, senão usar o último dia
        const lastDayOfMonth = getLastDayOfMonth(year, month);
        const validDay = Math.min(dueDay, lastDayOfMonth);

        // Criar a data com o dia válido
        const dueDate = new Date(year, month - 1, validDay);

        const installment: Installment = {
          id: $installments.length + i + 1,
          saleId: saleId,
          installmentNumber: i + 1,
          dueDate: dueDate,
          amount: installmentAmount,
          status: "pending",
        };

        saleInstallments.push(installment);
      }

      // Adicionar parcelas ao store
      $installments = [...$installments, ...saleInstallments];
    }

    const newSale: Sale = {
      id: saleId,
      date: new Date(),
      items: saleItems,
      totalAmount: total,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      paymentType: paymentType,
      installments: saleInstallments,
    };

    // Adicionar venda ao histórico
    $salesHistory = [...$salesHistory, newSale];

    // Atualizar estoque
    cart.forEach((cartItem) => {
      $stock = $stock.map((stockItem) =>
        stockItem.id === cartItem.item.id
          ? { ...stockItem, quantity: stockItem.quantity - cartItem.quantity }
          : stockItem
      );
    });

    // Limpar carrinho
    cart = [];
    selectedCustomer = null;
    paymentType = "cash";
    numberOfInstallments = 1;
    dueDay = 10;
    firstInstallmentMonth = new Date().getMonth() + 1;
    firstInstallmentYear = new Date().getFullYear();
    searchTerm = "";

    const paymentMessage =
      paymentType === "cash"
        ? `Venda #${newSale.id} finalizada com sucesso!\nTotal: R$ ${total.toFixed(2)}`
        : `Venda #${newSale.id} finalizada a prazo!\nTotal: R$ ${total.toFixed(2)}\nParcelas: ${numberOfInstallments}x de R$ ${(total / numberOfInstallments).toFixed(2)}`;

    alert(paymentMessage);
  }

  function clearCart() {
    cart = [];
    selectedCustomer = null;
    paymentType = "cash";
    numberOfInstallments = 1;
    dueDay = 10;
    firstInstallmentMonth = new Date().getMonth() + 1;
    firstInstallmentYear = new Date().getFullYear();
  }

  function selectCustomer(customer: Customer) {
    selectedCustomer = customer;
    showCustomerModal = false;
    customerSearchTerm = "";
  }

  function clearCustomer() {
    selectedCustomer = null;
    showCustomerModal = false;
  }

  function openCustomerModal() {
    showCustomerModal = true;
    customerSearchTerm = "";
  }
</script>

<div class="sales-container">
  <div class="sales-header">
    <h1>🛒 Ponto de Venda</h1>
  </div>

  <!-- Modal de Seleção de Cliente -->
  <Modal bind:show={showCustomerModal}>
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
        <button class="btn-secondary" on:click={() => clearCustomer()}>
          Venda sem cliente
        </button>
        <button
          class="btn-secondary"
          on:click={() => (showCustomerModal = false)}
        >
          Cancelar
        </button>
      </div>
    </div>
  </Modal>

  <div class="sales-content">
    <!-- Seletor de Tipo de Pagamento -->
    <PaymentTypeSelector
      bind:selectedCustomer
      bind:paymentType
      bind:numberOfInstallments
      bind:installmentFrequency
      bind:dueDay
      bind:firstInstallmentMonth
      bind:firstInstallmentYear
      on:openCustomerModal={openCustomerModal}
      on:clearCustomer={clearCustomer}
    />

    <!-- Área Principal: Produtos e Carrinho -->
    <div class="main-area">
      <!-- Produtos Disponíveis -->
      <div class="products-section">
        <h2>Produtos Disponíveis</h2>

        <div class="search-bar">
          <input
            type="text"
            placeholder="Buscar produtos..."
            bind:value={searchTerm}
            class="search-input"
          />
        </div>

        <div class="products-grid">
          {#each availableProducts as item (item.id)}
            <div class="product-card">
              <div class="product-info">
                <h3 class="product-title">
                  {#each $propertyDefinitions as prop}
                    {#if prop.id === "type" || prop.id === "brand"}
                      <span class="property-value"
                        >{item.properties[prop.id] || "-"}</span
                      >
                    {/if}
                  {/each}
                </h3>

                <div class="product-details">
                  {#each $propertyDefinitions as prop}
                    {#if prop.id !== "type" && prop.id !== "brand"}
                      <div class="detail">
                        <span class="detail-label">{prop.name}:</span>
                        <span class="detail-value"
                          >{item.properties[prop.id] || "-"}</span
                        >
                      </div>
                    {/if}
                  {/each}

                  <div class="detail">
                    <span class="detail-label">Estoque:</span>
                    <span class="detail-value">{item.quantity} un.</span>
                  </div>
                </div>

                <div class="product-price">
                  R$ {getPrice(item).toFixed(2)}
                </div>
              </div>

              <button
                class="add-btn"
                on:click={() => addToCart(item)}
                disabled={item.quantity <= 0}
              >
                Adicionar
              </button>
            </div>
          {/each}
        </div>
      </div>

      <!-- Carrinho -->
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
                    {cartItem.item.properties.color} - {cartItem.item.properties
                      .size}
                  </div>
                  <div class="item-price">
                    R$ {getPrice(cartItem.item).toFixed(2)} cada
                  </div>
                </div>

                <div class="quantity-controls">
                  <button
                    class="qty-btn"
                    on:click={() =>
                      updateCartQuantity(
                        cartItem.item.id,
                        cartItem.quantity - 1
                      )}
                  >
                    -
                  </button>
                  <span class="quantity">{cartItem.quantity}</span>
                  <button
                    class="qty-btn"
                    on:click={() =>
                      updateCartQuantity(
                        cartItem.item.id,
                        cartItem.quantity + 1
                      )}
                    disabled={cartItem.quantity >= cartItem.item.quantity}
                  >
                    +
                  </button>
                </div>

                <div class="item-total">
                  R$ {(cartItem.quantity * getPrice(cartItem.item)).toFixed(2)}
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
              {#if paymentType === "installments" && total > 0}
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
              <button
                class="finalize-btn"
                on:click={finalizeSale}
                disabled={paymentType === "installments" && !selectedCustomer}
              >
                Finalizar Venda
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .sales-container {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    background-color: #1a1a1a;
    min-height: 100vh;
    color: #ffffff;
  }

  .sales-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .sales-header h1 {
    margin: 0;
    font-size: 2.5rem;
    text-shadow: var(--shadow-small);
  }

  .sales-header h2 {
    margin: 0;
    color: var(--text-accent);
    font-size: 1.5rem;
    text-shadow: var(--shadow-small);
  }

  .sales-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    min-height: 600px;
  }

  /* Área Principal: Produtos e Carrinho */
  .main-area {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
  }

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
    border: 1px solid #555;
    border-radius: 4px;
    background-color: #333;
    color: white;
    cursor: pointer;
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

  /* Produtos */
  .products-section {
    background: #2a2a2a;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.1);
    border: 2px solid var(--primary-color-border);
  }

  .products-section h2 {
    color: var(--text-accent);
    margin-top: 0;
    margin-bottom: 1.5rem;
  }

  .search-bar {
    margin-bottom: 1.5rem;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #555;
    border-radius: 4px;
    font-size: 1rem;
    background-color: #333;
    color: white;
  }

  .search-input:focus {
    border-color: var(--primary-color-border);
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
    max-height: 500px;
    overflow-y: auto;
  }

  .product-card {
    border: 2px solid #555;
    border-radius: 8px;
    padding: 1rem;
    background: #333;
    transition:
      transform 0.2s,
      box-shadow 0.2s,
      border-color 0.2s;
  }

  .product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);
    border-color: var(--primary-color-border);
  }

  .product-title {
    margin: 0 0 0.75rem 0;
    color: var(--text-accent);
    font-size: 1.1rem;
    font-weight: bold;
  }

  .property-value {
    margin-right: 0.5rem;
    color: var(--text-accent);
  }

  .product-details {
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .detail {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.25rem;
  }

  .detail-label {
    font-weight: 600;
    color: #cccccc;
  }

  .detail-value {
    color: #ffffff;
  }

  .product-price {
    font-size: 1.2rem;
    font-weight: bold;
    color: #4ade80;
    margin-bottom: 1rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .add-btn {
    width: 100%;
    padding: 0.75rem;
    background-color: var(--text-accent);
    color: #1a1a1a;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .add-btn:hover:not(:disabled) {
    background-color: #ffed4e;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);
  }

  .add-btn:disabled {
    background-color: #555;
    color: #888;
    cursor: not-allowed;
  }

  /* Carrinho */
  .cart-section {
    background: #2a2a2a;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.1);
    display: flex;
    flex-direction: column;
    border: 2px solid var(--primary-color-border);
  }

  .cart-section h2 {
    color: var(--text-accent);
    margin-top: 0;
    margin-bottom: 1.5rem;
  }

  .empty-cart {
    text-align: center;
    color: #888;
    padding: 3rem 1rem;
  }

  .empty-cart p {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    color: #cccccc;
  }

  .empty-cart span {
    color: #888;
  }

  .cart-items {
    flex: 1;
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: 1rem;
  }

  .cart-item {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 1rem;
    align-items: center;
    padding: 1rem;
    border: 2px solid #555;
    border-radius: 6px;
    margin-bottom: 0.75rem;
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
    margin-bottom: 0.25rem;
    color: var(--text-accent);
  }

  .item-details {
    font-size: 0.9rem;
    color: #cccccc;
    margin-bottom: 0.25rem;
  }

  .item-price {
    font-size: 0.85rem;
    color: #4ade80;
  }

  .quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .qty-btn {
    width: 30px;
    height: 30px;
    border: 2px solid var(--primary-color-border);
    background: #2a2a2a;
    color: var(--text-accent);
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
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

  .item-total {
    font-weight: 600;
    color: #4ade80;
    text-align: right;
  }

  .remove-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.25rem;
    transition: transform 0.2s;
  }

  .remove-btn:hover {
    transform: scale(1.2);
  }

  .cart-summary {
    border-top: 2px solid var(--primary-color);
    padding-top: 1rem;
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
    transform: none;
  }

  /* Responsivo */
  @media (max-width: 768px) {
    .main-area {
      grid-template-columns: 1fr;
    }

    .sale-controls {
      flex-direction: column;
      align-items: stretch;
    }

    .control-group {
      min-width: auto;
    }

    .products-grid {
      grid-template-columns: 1fr;
    }

    .cart-item {
      grid-template-columns: 1fr;
      gap: 0.5rem;
      text-align: center;
    }
  }
</style>
