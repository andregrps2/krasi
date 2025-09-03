<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    stock,
    propertyDefinitions,
    salesHistory,
    installments,
  } from "../stores";
  import Modal from "./Modal.svelte";
  import PaymentTypeSelector from "./PaymentTypeSelector.svelte";
  import ProductsList from "./ProductsList.svelte";
  import ShoppingCart from "./ShoppingCart.svelte";
  import CustomerSelector from "./CustomerSelector.svelte";
  import type {
    StockItem,
    Sale,
    SaleItem,
    Customer,
    PaymentType,
    Installment,
  } from "../types";

  const dispatch = createEventDispatcher();

  let customerSelector: CustomerSelector;

  // Estado da venda
  let searchTerm = "";
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

  function handleCartUpdateQuantity(event: CustomEvent) {
    const { itemId, newQuantity } = event.detail;
    updateCartQuantity(itemId, newQuantity);
  }

  function handleCartRemoveItem(event: CustomEvent) {
    const itemId = event.detail;
    removeFromCart(itemId);
  }

  function handleCartClear() {
    clearCart();
  }

  function handleCartFinalize() {
    finalizeSale();
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

  function handleCustomerSelected(event: CustomEvent) {
    selectedCustomer = event.detail;
  }

  function handleCustomerCleared() {
    selectedCustomer = null;
  }

  function openCustomerModal() {
    customerSelector.openModal();
  }
</script>

<div class="sales-container">
  <div class="sales-header">
    <h1>🛒 Ponto de Venda</h1>
  </div>

  <!-- Seletor de Cliente -->
  <CustomerSelector
    bind:selectedCustomer
    bind:this={customerSelector}
    on:customerSelected={handleCustomerSelected}
    on:customerCleared={handleCustomerCleared}
  />

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
      on:clearCustomer={handleCustomerCleared}
    />

    <!-- Área Principal: Produtos e Vendas -->
    <div class="main-area">
      <!-- Produtos Disponíveis -->
      <ProductsList
        {availableProducts}
        bind:searchTerm
        propertyDefinitions={$propertyDefinitions}
        on:addToCart={(e) => addToCart(e.detail)}
      />

      <!-- Carrinho de Vendas -->
      <ShoppingCart
        {cart}
        {total}
        {paymentType}
        {numberOfInstallments}
        {dueDay}
        {firstInstallmentMonth}
        {firstInstallmentYear}
        {selectedCustomer}
        on:updateQuantity={handleCartUpdateQuantity}
        on:removeItem={handleCartRemoveItem}
        on:clearCart={handleCartClear}
        on:finalizeSale={handleCartFinalize}
      />
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

  .sales-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    min-height: 600px;
  }

  /* Área Principal: Produtos e Vendas */
  .main-area {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
  }

  /* Responsivo */
  @media (max-width: 768px) {
    .main-area {
      grid-template-columns: 1fr;
    }
  }
</style>
