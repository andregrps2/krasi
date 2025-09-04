<script lang="ts">
  import { onMount } from "svelte";
  import { storesApi, salesApi } from "../../api";
  import type { Store, SaleWithRelations, StoreDashboard } from "../../types";

  export let store: Store;

  let dashboard: StoreDashboard | null = null;
  let recentSales: SaleWithRelations[] = [];
  let loading = true;
  let error = "";

  onMount(() => {
    loadDashboardData();
  });

  async function loadDashboardData() {
    try {
      loading = true;

      const [dashboardData, salesData] = await Promise.all([
        storesApi.getDashboard(store.id),
        salesApi.getAll({ storeId: store.id }),
      ]);

      dashboard = dashboardData;
      recentSales = salesData.slice(0, 5); // Últimas 5 vendas
    } catch (err) {
      error = "Erro ao carregar dados do dashboard";
      console.error("Erro:", err);
    } finally {
      loading = false;
    }
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString("pt-BR");
  }

  function formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleString("pt-BR");
  }

  function getPaymentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      CASH: "Dinheiro",
      CARD: "Cartão",
      PIX: "PIX",
      INSTALLMENTS: "Parcelado",
      FIADO: "Fiado",
    };
    return labels[type] || type;
  }
</script>

<div class="dashboard">
  <div class="header">
    <h1>{store.name}</h1>
    <p class="store-info">
      {#if store.address}
        📍 {store.address}
      {/if}
    </p>
  </div>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Carregando dados...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>{error}</p>
      <button on:click={loadDashboardData}>Tentar Novamente</button>
    </div>
  {:else if dashboard}
    <!-- Cards de Métricas -->
    <div class="metrics-grid">
      <div class="metric-card sales-today">
        <div class="metric-icon">💰</div>
        <div class="metric-content">
          <h3>Vendas Hoje</h3>
          <p class="metric-value">
            {formatCurrency(dashboard.salesToday.total)}
          </p>
          <p class="metric-sub">{dashboard.salesToday.count} vendas</p>
        </div>
      </div>

      <div class="metric-card sales-month">
        <div class="metric-icon">📈</div>
        <div class="metric-content">
          <h3>Vendas do Mês</h3>
          <p class="metric-value">
            {formatCurrency(dashboard.salesMonth.total)}
          </p>
          <p class="metric-sub">{dashboard.salesMonth.count} vendas</p>
        </div>
      </div>

      <div class="metric-card customers">
        <div class="metric-icon">👥</div>
        <div class="metric-content">
          <h3>Clientes</h3>
          <p class="metric-value">{dashboard.customersCount}</p>
          <p class="metric-sub">cadastrados</p>
        </div>
      </div>

      <div class="metric-card low-stock">
        <div class="metric-icon">⚠️</div>
        <div class="metric-content">
          <h3>Estoque Baixo</h3>
          <p class="metric-value">{dashboard.lowStockItems.length}</p>
          <p class="metric-sub">produtos</p>
        </div>
      </div>
    </div>

    <!-- Alertas -->
    {#if dashboard.pendingInstallments.length > 0}
      <div class="alert alert-warning">
        <h3>⏰ Parcelas Vencidas</h3>
        <p>{dashboard.pendingInstallments.length} parcelas estão vencidas</p>
      </div>
    {/if}

    {#if dashboard.lowStockItems.length > 0}
      <div class="alert alert-danger">
        <h3>📦 Estoque Baixo</h3>
        <p>{dashboard.lowStockItems.length} produtos com estoque baixo</p>
      </div>
    {/if}

    <!-- Vendas Recentes -->
    <div class="section">
      <h2>Vendas Recentes</h2>
      {#if recentSales.length > 0}
        <div class="sales-list">
          {#each recentSales as sale}
            <div class="sale-item">
              <div class="sale-header">
                <span class="sale-id">#{sale.id.slice(-6)}</span>
                <span class="sale-date">{formatDateTime(sale.createdAt)}</span>
              </div>
              <div class="sale-details">
                <div class="sale-customer">
                  {#if sale.customer}
                    👤 {sale.customer.name}
                  {:else}
                    👤 Cliente avulso
                  {/if}
                </div>
                <div class="sale-payment">
                  💳 {getPaymentTypeLabel(sale.paymentType)}
                </div>
                <div class="sale-total">
                  {formatCurrency(sale.total)}
                </div>
              </div>
              <div class="sale-items">
                {sale.saleItems.length} item{sale.saleItems.length !== 1
                  ? "s"
                  : ""}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <p>Nenhuma venda encontrada</p>
        </div>
      {/if}
    </div>

    <!-- Produtos Mais Vendidos -->
    {#if dashboard.topProducts.length > 0}
      <div class="section">
        <h2>Produtos Mais Vendidos (Este Mês)</h2>
        <div class="top-products">
          {#each dashboard.topProducts as item, index}
            <div class="product-item">
              <span class="rank">#{index + 1}</span>
              <span class="product-name">{item.product?.name || "Produto"}</span
              >
              <span class="product-quantity">{item.quantity} vendidos</span>
              <span class="product-total">{formatCurrency(item.total)}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .header {
    margin-bottom: 2rem;
  }

  .header h1 {
    color: #2c3e50;
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
  }

  .store-info {
    color: #7f8c8d;
    margin: 0;
    font-size: 1rem;
  }

  .loading {
    text-align: center;
    padding: 4rem 2rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .error {
    text-align: center;
    padding: 2rem;
    background: #fff5f5;
    border: 1px solid #fed7d7;
    border-radius: 8px;
    color: #e53e3e;
  }

  .error button {
    background: #e53e3e;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 1rem;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .metric-card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .metric-icon {
    font-size: 2rem;
  }

  .metric-content h3 {
    margin: 0 0 0.5rem 0;
    color: #7f8c8d;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .metric-value {
    margin: 0 0 0.25rem 0;
    font-size: 1.5rem;
    font-weight: bold;
    color: #2c3e50;
  }

  .metric-sub {
    margin: 0;
    font-size: 0.8rem;
    color: #95a5a6;
  }

  .sales-today {
    border-left: 4px solid #27ae60;
  }
  .sales-month {
    border-left: 4px solid #3498db;
  }
  .customers {
    border-left: 4px solid #9b59b6;
  }
  .low-stock {
    border-left: 4px solid #e74c3c;
  }

  .alert {
    padding: 1rem 1.5rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }

  .alert h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }

  .alert p {
    margin: 0;
    font-size: 0.9rem;
  }

  .alert-warning {
    background: #fff8e1;
    border: 1px solid #ffcc02;
    color: #f57c00;
  }

  .alert-danger {
    background: #ffebee;
    border: 1px solid #f44336;
    color: #d32f2f;
  }

  .section {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 1.5rem;
  }

  .section h2 {
    margin: 0 0 1rem 0;
    color: #2c3e50;
    font-size: 1.25rem;
  }

  .sales-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .sale-item {
    border: 1px solid #ecf0f1;
    border-radius: 8px;
    padding: 1rem;
  }

  .sale-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .sale-id {
    font-weight: bold;
    color: #3498db;
  }

  .sale-date {
    color: #7f8c8d;
    font-size: 0.9rem;
  }

  .sale-details {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 1rem;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .sale-customer,
  .sale-payment {
    font-size: 0.9rem;
    color: #7f8c8d;
  }

  .sale-total {
    font-weight: bold;
    color: #27ae60;
    font-size: 1.1rem;
  }

  .sale-items {
    font-size: 0.8rem;
    color: #95a5a6;
  }

  .top-products {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .product-item {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    gap: 1rem;
    align-items: center;
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 6px;
  }

  .rank {
    font-weight: bold;
    color: #3498db;
    min-width: 2rem;
  }

  .product-name {
    color: #2c3e50;
  }

  .product-quantity {
    color: #7f8c8d;
    font-size: 0.9rem;
  }

  .product-total {
    font-weight: bold;
    color: #27ae60;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #7f8c8d;
  }

  @media (max-width: 768px) {
    .dashboard {
      padding: 1rem;
    }

    .metrics-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .sale-details {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .product-item {
      grid-template-columns: 1fr;
      gap: 0.5rem;
      text-align: center;
    }
  }
</style>
