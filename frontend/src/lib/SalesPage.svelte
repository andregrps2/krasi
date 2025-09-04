<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    stock,
    propertyDefinitions,
    salesHistory,
    installments,
    currentStoreId,
  } from "../stores";
  import { salesService } from "./services/salesService";
  import { installmentsService } from "./services/installmentsService";
  import { PaymentType } from "../types-new";
  import ProductsList from "./ProductsList.svelte";
  import ShoppingCart from "./ShoppingCart.svelte";
  import SaleFinalizationSection from "./SaleFinalizationSection.svelte";
  import SaleSuccessModal from "./SaleSuccessModal.svelte";
  import type {
    StockItemWithRelations as StockItem,
    Sale,
    SaleItem,
    Customer,
    Installment,
  } from "../types-new";

  const dispatch = createEventDispatcher();

  // Estado da venda
  let searchTerm = "";
  let cart: { item: StockItem; quantity: number }[] = [];
  let total = 0;
  let selectedCustomer: Customer | null = null;
  let paymentType: PaymentType = PaymentType.CASH;
  let numberOfInstallments = 2;
  let installmentFrequency = 30; // dias entre parcelas
  let dueDay = 10; // dia do vencimento (1-31)
  let firstInstallmentMonth = new Date().getMonth() + 1; // mês da primeira parcela (1-12)
  let firstInstallmentYear = new Date().getFullYear(); // ano da primeira parcela

  // Estados dos modais e interface
  let showFinalizationSection = false;
  let showSuccessModal = false;
  let completedSale: Sale | null = null;
  let isProcessingSale = false; // Flag para evitar execução dupla

  // Garantir que quando mudar para "installments", numberOfInstallments seja pelo menos 2
  $: if (paymentType === PaymentType.INSTALLMENTS && numberOfInstallments < 2) {
    numberOfInstallments = 2;
  }

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
        // Verificar se o item tem a estrutura correta
        if ("product" in item && "store" in item) {
          const score = calculateFuzzyScore(item as any, searchTerms);
          return { item, score };
        } else {
          // Para itens antigos, criar um score básico baseado no nome
          const itemName =
            (item as any).name || (item as any).product?.name || "";
          const score = searchTerms.some((term) =>
            itemName.toLowerCase().includes(term)
          )
            ? 5
            : 0;
          return { item, score };
        }
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);

    return scoredItems;
  })();

  // Função para calcular pontuação fuzzy
  function calculateFuzzyScore(item: StockItem, searchTerms: string[]): number {
    let score = 0;
    const itemText = [
      item.product.name,
      item.product.brand,
      item.product.category,
      item.product.description,
    ]
      .filter(Boolean)
      .map((val) => normalizeText(String(val)))
      .join(" ");

    searchTerms.forEach((term) => {
      const normalizedTerm = normalizeText(term);

      // Pontuação para correspondência exata
      if (itemText.includes(normalizedTerm)) {
        score += 10;
      }

      // Pontuação para correspondência parcial em cada propriedade
      const searchFields = [
        item.product.name,
        item.product.brand,
        item.product.category,
        item.product.description,
      ].filter(Boolean);

      searchFields.forEach((propValue) => {
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
        [
          item.product.name,
          item.product.brand,
          item.product.category,
          item.product.description,
        ]
          .filter(Boolean)
          .some((val) => {
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

  // Função para obter o productId correto baseado no stockItemId
  function getProductIdFromStockId(stockItemId: string): string {
    // Mapping dos stockItemIds para productIds corretos (baseado nos dados do banco)
    const stockToProductMap: Record<string, string> = {
      cmf5e1mqf00093npvoz57tycl: "cmf5e1mqd00073npvlbhc9zjd", // Terno Slim Azul Marinho
      cmf5e1mqo000g3npvz9ma30av: "cmf5e1mqm000e3npvryl6jx7o", // Camisa Social Branca
      cmf5e1mqv000n3npvhew3c0wl: "cmf5e1mqt000l3npvpd4tn9is", // Gravata Seda Vermelha
    };

    const productId = stockToProductMap[stockItemId];
    if (!productId) {
      console.warn(
        `⚠️ [MAPPING] ProductId não encontrado para stockItemId: ${stockItemId}`
      );
      // Como fallback, assumir que o stockItemId é o productId (para casos antigos)
      return stockItemId;
    }

    console.log(`✅ [MAPPING] Mapeado ${stockItemId} -> ${productId}`);
    return productId;
  }

  // Função para obter preço do produto
  function getPrice(item: any): number {
    // Se for o novo formato (StockItemWithRelations)
    if ("salePrice" in item && item.salePrice && item.salePrice > 0) {
      return item.salePrice;
    }

    // Se for o formato antigo com properties.price
    if (item.properties?.price) {
      const price = parseFloat(item.properties.price);
      if (!isNaN(price)) {
        return price;
      }
    }

    // Se for o formato antigo com campo price direto
    if (item.price && typeof item.price === "number") {
      return item.price;
    }

    // Fallback para preços baseados na categoria/tipo
    const category =
      item.product?.category?.toLowerCase() ||
      item.properties?.type?.toLowerCase() ||
      item.category?.toLowerCase();
    switch (category) {
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

  function removeFromCart(itemId: string) {
    cart = cart.filter((cartItem) => cartItem.item.id !== itemId);
  }

  function updateCartQuantity(itemId: string, newQuantity: number) {
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

  async function handleConfirmSale(event: CustomEvent) {
    // Proteção contra execução dupla
    if (isProcessingSale) {
      console.warn(
        "⚠️ [SALES] Processo já em andamento, ignorando chamada duplicada"
      );
      return;
    }

    isProcessingSale = true;
    console.log("🚀 [SALES] Iniciando processo de finalização da venda");

    const saleData = event.detail;
    console.log("📋 [SALES] Dados recebidos:", saleData);

    if (!$currentStoreId) {
      console.error("❌ [SALES] Erro: Nenhuma loja selecionada");
      alert("Nenhuma loja selecionada!");
      isProcessingSale = false;
      return;
    }
    console.log("🏪 [SALES] Loja selecionada:", $currentStoreId);

    try {
      console.log("🛒 [SALES] Convertendo dados do carrinho...");
      console.log("🛒 [SALES] Carrinho atual:", cart);

      // Converter dados do carrinho para o formato da API
      const saleItems = cart.map((cartItem, index) => {
        console.log(`📦 [SALES] Processando item ${index + 1}:`, {
          id: cartItem.item.id,
          productId: cartItem.item.productId,
          name: cartItem.item.product?.name,
          quantity: cartItem.quantity,
          price: getPrice(cartItem.item),
          // DEBUG: mostrar toda a estrutura do item
          fullItem: cartItem.item,
        });

        const finalProductId =
          cartItem.item.productId || getProductIdFromStockId(cartItem.item.id);
        console.log(
          `🔄 [MAPPING] Item ${index + 1}: stockId=${cartItem.item.id} -> productId=${finalProductId}`
        );

        return {
          productId: finalProductId,
          stockItemId: cartItem.item.id,
          quantity: cartItem.quantity,
          price: getPrice(cartItem.item),
          total: cartItem.quantity * getPrice(cartItem.item),
        };
      });

      console.log("✅ [SALES] Itens convertidos:", saleItems);

      // Converter parcelas para o formato da API (se existirem)
      console.log("💰 [SALES] Processando parcelas...");
      const installments =
        saleData.installments?.map((inst: any, index: number) => {
          console.log(`💳 [SALES] Parcela ${index + 1}:`, inst);
          console.log(
            `🔍 [SALES] isDownPayment: ${inst.isDownPayment}, isPaid: ${inst.isPaid}`
          );

          const dueDate =
            inst.dueDate === "Entrada"
              ? new Date().toISOString()
              : new Date(
                  inst.dueDate.split("/").reverse().join("-")
                ).toISOString();

          console.log(
            `📅 [SALES] Data de vencimento convertida: ${inst.dueDate} -> ${dueDate}`
          );

          const converted = {
            number: inst.number,
            amount: inst.value,
            dueDate: dueDate,
            isDownPayment: inst.isDownPayment || false, // PRESERVAR informação de entrada
            isPaid: inst.isPaid || false, // PRESERVAR informação de pagamento
          };

          console.log(`🔄 [SALES] Parcela ${index + 1} convertida:`, converted);
          return converted;
        }) || [];

      console.log("✅ [SALES] Parcelas convertidas:", installments);

      // Dados da venda no formato esperado pela API
      const apiSaleData = {
        storeId: $currentStoreId,
        userId: "cmf5e1mqa00013npvcupmd8ck", // TODO: pegar do usuário logado
        customerId: saleData.selectedCustomer?.id,
        total: saleData.total,
        paymentType: saleData.paymentType,
        items: saleItems,
        installments: installments,
      };

      console.log(
        "📤 [SALES] Dados finais para envio à API:",
        JSON.stringify(apiSaleData, null, 2)
      );

      // Salvar venda no banco via API
      console.log("🌐 [SALES] Enviando venda para a API...");
      const savedSale = await salesService.createSale(
        $currentStoreId,
        apiSaleData
      );
      console.log("✅ [SALES] Venda salva com sucesso:", savedSale);

      // NOVA FUNCIONALIDADE: Salvar parcelas no banco se for venda parcelada
      if (
        (saleData.paymentType === "installments" ||
          saleData.paymentType === PaymentType.INSTALLMENTS) &&
        saleData.installments &&
        saleData.selectedCustomer
      ) {
        console.log(
          "💰 [INSTALLMENTS] Iniciando salvamento de parcelas no banco..."
        );
        console.log("💰 [INSTALLMENTS] Dados das parcelas:", installments);
        console.log(
          "💰 [INSTALLMENTS] Cliente selecionado:",
          saleData.selectedCustomer
        );

        for (const [index, inst] of installments.entries()) {
          try {
            console.log(
              `💳 [INSTALLMENTS] Processando parcela ${index + 1}/${installments.length}:`,
              inst
            );
            console.log(
              `🔍 [INSTALLMENTS] isDownPayment: ${inst.isDownPayment}`
            );

            const status = inst.isDownPayment ? "PAID" : "PENDING";
            const paidDate = inst.isDownPayment ? new Date() : undefined;

            console.log(`📋 [INSTALLMENTS] Status calculado: ${status}`);
            console.log(`📅 [INSTALLMENTS] Data de pagamento: ${paidDate}`);

            const installmentData = {
              number: inst.number,
              dueDate: new Date(inst.dueDate),
              amount: inst.amount,
              status: status,
              paidDate: paidDate,
              saleId: savedSale.id.toString(),
              customerId: saleData.selectedCustomer.id.toString(),
            };

            console.log(
              `📤 [INSTALLMENTS] Enviando parcela ${index + 1} para API:`,
              installmentData
            );

            await installmentsService.createInstallment(
              $currentStoreId,
              installmentData
            );

            console.log(
              `✅ [INSTALLMENTS] Parcela ${index + 1} salva com sucesso`
            );
          } catch (error) {
            console.error(
              `❌ [INSTALLMENTS] Erro ao salvar parcela ${index + 1}:`,
              error
            );
            console.error(
              `❌ [INSTALLMENTS] Dados da parcela que falhou:`,
              inst
            );
          }
        }

        // Recarregar parcelas do banco
        try {
          console.log("🔄 [INSTALLMENTS] Recarregando parcelas do banco...");
          await installmentsService.refreshInstallments($currentStoreId);
          console.log("✅ [INSTALLMENTS] Parcelas recarregadas com sucesso");
        } catch (error) {
          console.error(
            "❌ [INSTALLMENTS] Erro ao recarregar parcelas:",
            error
          );
        }
      } else {
        console.log(
          "ℹ️ [INSTALLMENTS] Venda não é parcelada ou não há dados de parcelas"
        );
      }

      // Recarregar vendas
      console.log("🔄 [SALES] Recarregando vendas...");
      await salesService.refreshSales($currentStoreId);
      console.log("✅ [SALES] Vendas recarregadas com sucesso");

      // Atualizar estoque (manter funcionalidade local por enquanto)
      console.log("📦 [STOCK] Atualizando estoque local...");
      cart.forEach((cartItem, index) => {
        console.log(
          `📦 [STOCK] Atualizando item ${index + 1}: ${cartItem.item.id} - reduzindo ${cartItem.quantity} unidades`
        );
        $stock = $stock.map((stockItem) =>
          stockItem.id === cartItem.item.id
            ? { ...stockItem, quantity: stockItem.quantity - cartItem.quantity }
            : stockItem
        );
      });
      console.log("✅ [STOCK] Estoque atualizado");

      // Limpar carrinho e estados
      console.log("🧹 [CLEANUP] Limpando carrinho e estados...");
      cart = [];
      selectedCustomer = null;
      paymentType = PaymentType.CASH;
      numberOfInstallments = 2;
      dueDay = 10;
      firstInstallmentMonth = new Date().getMonth() + 1;
      firstInstallmentYear = new Date().getFullYear();
      searchTerm = "";

      // Fechar seção de finalização e mostrar modal de sucesso
      console.log(
        "🎉 [SUCCESS] Finalizando processo - mostrando modal de sucesso"
      );
      showFinalizationSection = false;
      completedSale = savedSale;
      showSuccessModal = true;
      console.log("✅ [SALES] Processo de venda finalizado com sucesso!");
    } catch (error) {
      console.error("💥 [ERROR] Erro fatal ao finalizar venda:");
      console.error("💥 [ERROR] Tipo do erro:", typeof error);
      console.error("💥 [ERROR] Erro completo:", error);

      if (error instanceof Error) {
        console.error("💥 [ERROR] Mensagem:", error.message);
        console.error("💥 [ERROR] Stack:", error.stack);
      }

      if (error && typeof error === "object") {
        console.error("💥 [ERROR] Propriedades do erro:", Object.keys(error));
        if ("response" in error) {
          console.error("💥 [ERROR] Response:", (error as any).response);
        }
      }

      alert(
        `Erro ao salvar venda: ${error instanceof Error ? error.message : "Erro desconhecido"}. Verifique o console para mais detalhes.`
      );
    } finally {
      // Sempre resetar a flag no final
      isProcessingSale = false;
      console.log("🔄 [SALES] Flag de processamento resetada");
    }
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
    paymentType = PaymentType.CASH;
    numberOfInstallments = 2;
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
          availableProducts={availableProducts as any}
          bind:searchTerm
          propertyDefinitions={$propertyDefinitions}
          on:addToCart={(e) => addToCart(e.detail)}
        />

        <!-- Carrinho de Vendas -->
        <ShoppingCart
          cart={cart as any}
          {total}
          paymentType={paymentType as any}
          {numberOfInstallments}
          {dueDay}
          {firstInstallmentMonth}
          {firstInstallmentYear}
          showFinalizationButton={true}
          on:updateQuantity={handleCartUpdateQuantity}
          on:removeItem={handleCartRemoveItem}
          on:clearCart={handleCartClear}
          on:finalizeSale={handleCartFinalize}
        />
      {:else}
        <!-- Carrinho de Vendas (lado esquerdo) -->
        <ShoppingCart
          cart={cart as any}
          {total}
          paymentType={paymentType as any}
          {numberOfInstallments}
          {dueDay}
          {firstInstallmentMonth}
          {firstInstallmentYear}
          showFinalizationButton={false}
          on:updateQuantity={handleCartUpdateQuantity}
          on:removeItem={handleCartRemoveItem}
          on:clearCart={handleCartClear}
          on:finalizeSale={handleCartFinalize}
        />

        <!-- Seção de Finalização (lado direito) -->
        <SaleFinalizationSection
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
  sale={completedSale as any}
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
