<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    stock,
    propertyDefinitions,
    salesHistory,
    installments,
  } from "../stores";
  import ProductsList from "./ProductsList.svelte";
  import ShoppingCart from "./ShoppingCart.svelte";
  import SaleFinalizationSection from "./SaleFinalizationSection.svelte";
  import SaleSuccessModal from "./SaleSuccessModal.svelte";
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
  let cart: { item: StockItem; quantity: number }[] = [];
  let total = 0;
  let selectedCustomer: Customer | null = null;
  let paymentType: PaymentType = "cash";
  let numberOfInstallments = 1;
  let installmentFrequency = 30; // dias entre parcelas
  let dueDay = 10; // dia do vencimento (1-31)
  let firstInstallmentMonth = new Date().getMonth() + 1; // mês da primeira parcela (1-12)
  let firstInstallmentYear = new Date().getFullYear(); // ano da primeira parcela

  // Estados dos modais e interface
  let showFinalizationSection = false;
  let showSuccessModal = false;
  let completedSale: Sale | null = null;

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
    showFinalizationSection = true;
  }

  function handleConfirmSale(event: CustomEvent) {
    const saleData = event.detail;

    // Criar registro da venda
    const saleItems: SaleItem[] = cart.map((cartItem) => ({
      stockItemId: cartItem.item.id,
      stockItem: cartItem.item,
      quantity: cartItem.quantity,
      unitPrice: getPrice(cartItem.item),
      totalPrice: cartItem.quantity * getPrice(cartItem.item),
      brand: cartItem.item.properties.brand || "",
      type: cartItem.item.properties.type || "",
      size: cartItem.item.properties.size || "",
      color: cartItem.item.properties.color || "",
    }));

    const saleId =
      $salesHistory.length > 0
        ? Math.max(...$salesHistory.map((s) => s.id)) + 1
        : 1;

    // Criar parcelas se for venda a prazo
    let saleInstallments: Installment[] = [];
    if (saleData.paymentType === "installments" && saleData.installments) {
      saleData.installments.forEach((inst: any, i: number) => {
        const installment: Installment = {
          id: $installments.length + i + 1,
          saleId: saleId,
          installmentNumber: i + 1,
          dueDate: new Date(inst.dueDate.split("/").reverse().join("-")),
          amount: inst.value,
          status: "pending",
        };
        saleInstallments.push(installment);
      });

      // Adicionar parcelas ao store
      $installments = [...$installments, ...saleInstallments];
    }

    const newSale: Sale = {
      id: saleId,
      date: new Date(),
      items: saleItems,
      total: saleData.total,
      totalAmount: saleData.total, // Para compatibilidade
      customerId: saleData.selectedCustomer?.id,
      customer: saleData.selectedCustomer,
      customerName: saleData.selectedCustomer?.name,
      paymentType: saleData.paymentType,
      installments: saleData.installments || [],
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

    // Limpar carrinho e estados
    cart = [];
    selectedCustomer = null;
    paymentType = "cash";
    numberOfInstallments = 1;
    dueDay = 10;
    firstInstallmentMonth = new Date().getMonth() + 1;
    firstInstallmentYear = new Date().getFullYear();
    searchTerm = "";

    // Fechar seção de finalização e mostrar modal de sucesso
    showFinalizationSection = false;
    completedSale = newSale;
    showSuccessModal = true;
  }

  function handleCancelSale() {
    showFinalizationSection = false;
  }

  function handleSuccessModalClose() {
    showSuccessModal = false;
    completedSale = null;
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
</script>

<div class="sales-container">
  <div class="sales-header">
    <div class="header-content">
      <h1>🛒 Ponto de Venda</h1>
    </div>
  </div>

  <div class="sales-content">
    <!-- Área Principal: Produtos e Vendas -->
    <div class="main-area" class:finalization-mode={showFinalizationSection}>
      {#if !showFinalizationSection}
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
          showFinalizationButton={true}
          on:updateQuantity={handleCartUpdateQuantity}
          on:removeItem={handleCartRemoveItem}
          on:clearCart={handleCartClear}
          on:finalizeSale={handleCartFinalize}
        />
      {:else}
        <!-- Carrinho de Vendas (lado esquerdo) -->
        <ShoppingCart
          {cart}
          {total}
          {paymentType}
          {numberOfInstallments}
          {dueDay}
          {firstInstallmentMonth}
          {firstInstallmentYear}
          {selectedCustomer}
          showFinalizationButton={false}
          on:updateQuantity={handleCartUpdateQuantity}
          on:removeItem={handleCartRemoveItem}
          on:clearCart={handleCartClear}
          on:finalizeSale={handleCartFinalize}
        />

        <!-- Seção de Finalização (lado direito) -->
        <SaleFinalizationSection
          {cart}
          {total}
          bind:selectedCustomer
          bind:paymentType
          bind:numberOfInstallments
          bind:dueDay
          bind:firstInstallmentMonth
          bind:firstInstallmentYear
          on:confirmSale={handleConfirmSale}
          on:cancel={handleCancelSale}
        />
      {/if}
    </div>
  </div>
</div>

<!-- Modal de Sucesso -->
<SaleSuccessModal
  bind:isOpen={showSuccessModal}
  sale={completedSale}
  on:close={handleSuccessModalClose}
/>

<style>
  .sales-container {
    padding: 0 1rem 0 1rem;
    max-width: 1600px;
    margin: 0 auto;
    background-color: #1a1a1a;
    height: 100vh;
    overflow: hidden;
    color: #ffffff;
    display: flex;
    flex-direction: column;
  }

  .sales-header {
    margin-bottom: 0.5rem;
    padding: 0.5rem 0;
    flex-shrink: 0;
  }

  .header-content {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }

  .sales-header h1 {
    margin: 0;
    font-size: 1.1rem;
    text-shadow: var(--shadow-small);
    white-space: nowrap;
    line-height: 1;
  }

  .sales-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Área Principal: Produtos e Vendas */
  .main-area {
    flex: 1;
    display: grid;
    grid-template-columns: 2.5fr 1fr;
    gap: 0.5rem;
    overflow: hidden;
    min-height: 0;
  }

  /* Modo de finalização: carrinho mantém tamanho, seção de finalização fica maior */
  .main-area.finalization-mode {
    grid-template-columns: 1fr 2fr;
  }

  /* Responsivo */
  @media (max-width: 768px) {
    .main-area {
      grid-template-columns: 1fr;
    }
  }
</style>
