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

  // Filtrar produtos disponíveis com busca fuzzy
  $: availableProducts = (() => {
    if (!searchTerm.trim()) {
      return $stock.filter((item) => item.quantity > 0);
    }

    const searchTerms = searchTerm
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 0);

    const scoredItems = $stock
      .filter((item) => item.quantity > 0)
      .map((item) => {
        const score = calculateFuzzyScore(item, searchTerms);
        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);

    return scoredItems;
  })();

  // Função para calcular pontuação fuzzy
  function calculateFuzzyScore(item: StockItem, searchTerms: string[]): number {
    let score = 0;
    const itemText = Object.values(item.properties)
      .map((val) => normalizeText(String(val)))
      .join(" ");

    searchTerms.forEach((term) => {
      const normalizedTerm = normalizeText(term);

      // Pontuação para correspondência exata
      if (itemText.includes(normalizedTerm)) {
        score += 10;
      }

      // Pontuação para correspondência parcial em cada propriedade
      Object.values(item.properties).forEach((propValue) => {
        const value = normalizeText(String(propValue));

        // Correspondência exata na propriedade
        if (value === normalizedTerm) {
          score += 20;
        }
        // Correspondência no início da palavra
        else if (value.startsWith(normalizedTerm)) {
          score += 15;
        }
        // Correspondência parcial
        else if (value.includes(normalizedTerm)) {
          score += 8;
        }
        // Busca por abreviações (poli = poliéster)
        else if (isAbbreviation(normalizedTerm, value)) {
          score += 12;
        }
        // Correspondência fuzzy (caracteres similares)
        else {
          const fuzzyMatch = calculateLevenshteinSimilarity(
            value,
            normalizedTerm
          );
          if (fuzzyMatch > 0.7) {
            score += Math.floor(fuzzyMatch * 5);
          }
        }
      });
    });

    // Bônus se todos os termos foram encontrados
    const foundTerms = searchTerms.filter((term) => {
      const normalizedTerm = normalizeText(term);
      return (
        itemText.includes(normalizedTerm) ||
        Object.values(item.properties).some((val) => {
          const value = normalizeText(String(val));
          return (
            value.includes(normalizedTerm) ||
            isAbbreviation(normalizedTerm, value)
          );
        })
      );
    });

    if (foundTerms.length === searchTerms.length) {
      score += 15;
    }

    return score;
  }

  // Função para normalizar texto (remover acentos, converter para minúscula)
  function normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9\s]/g, "") // Remove caracteres especiais
      .trim();
  }

  // Função para verificar se um termo é abreviação de outro
  function isAbbreviation(abbrev: string, fullText: string): boolean {
    if (abbrev.length >= fullText.length) return false;

    // Verifica se as letras da abreviação aparecem em ordem no texto completo
    let abbrevIndex = 0;
    for (let i = 0; i < fullText.length && abbrevIndex < abbrev.length; i++) {
      if (fullText[i] === abbrev[abbrevIndex]) {
        abbrevIndex++;
      }
    }

    return abbrevIndex === abbrev.length;
  }

  // Função para calcular similaridade usando Levenshtein
  function calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    // Criar matriz
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Preencher matriz
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // Deleção
          matrix[i][j - 1] + 1, // Inserção
          matrix[i - 1][j - 1] + cost // Substituição
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return 1 - distance / maxLen;
  }

  // Função para obter preço do produto
  function getPrice(item: StockItem): number {
    // Primeiro tenta usar o preço definido no produto
    if (item.properties.price) {
      const price = parseFloat(item.properties.price);
      if (!isNaN(price)) {
        return price;
      }
    }

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
    <div class="header-content">
      <h1>🛒 Ponto de Venda</h1>
      <div class="header-controls">
        <!-- Seletor de Cliente -->
        <CustomerSelector
          bind:selectedCustomer
          bind:this={customerSelector}
          on:customerSelected={handleCustomerSelected}
          on:customerCleared={handleCustomerCleared}
        />

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
      </div>
    </div>
  </div>

  <div class="sales-content">
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
    padding: 1rem;
    max-width: 1600px;
    margin: 0 auto;
    background-color: #1a1a1a;
    min-height: 100vh;
    color: #ffffff;
  }

  .sales-header {
    margin-bottom: 0.2rem;
    padding: 0.1rem 0;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.2rem;
    min-height: 35px;
  }

  .header-controls {
    display: flex;
    gap: 0.2rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .sales-header h1 {
    margin: 0;
    font-size: 1.1rem;
    text-shadow: var(--shadow-small);
    white-space: nowrap;
    line-height: 1;
  }

  .sales-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: calc(100vh - 50px);
  }

  /* Área Principal: Produtos e Vendas */
  .main-area {
    display: grid;
    grid-template-columns: 1.8fr 1.2fr;
    gap: 0.5rem;
    height: calc(100vh - 70px);
  }

  /* Responsivo */
  @media (max-width: 768px) {
    .main-area {
      grid-template-columns: 1fr;
    }
  }
</style>
