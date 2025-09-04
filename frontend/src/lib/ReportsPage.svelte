<script lang="ts">
  import { salesHistory, propertyDefinitions } from "../stores";
  import type { Sale, SaleItem } from "../types";

  // Filtros de data
  let startDate = "";
  let endDate = "";

  // Computed properties
  $: filteredSales = $salesHistory.filter((sale) => {
    if (!startDate && !endDate) return true;

    const saleDate = new Date(sale.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && saleDate < start) return false;
    if (end && saleDate > end) return false;

    return true;
  });

  $: totalSales = filteredSales.reduce(
    (sum, sale) => sum + sale.totalAmount,
    0
  );

  $: productsSold = (() => {
    const products: Record<
      string,
      { quantity: number; revenue: number; item: SaleItem }
    > = {};

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const key = `${item.stockItem.properties.type || "N/A"} - ${item.stockItem.properties.brand || "N/A"} - ${item.stockItem.properties.color || "N/A"}`;

        if (!products[key]) {
          products[key] = {
            quantity: 0,
            revenue: 0,
            item: item,
          };
        }

        products[key].quantity += item.quantity;
        products[key].revenue += item.totalPrice;
      });
    });

    return Object.entries(products)
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => b.quantity - a.quantity);
  })();

  $: salesByDate = (() => {
    const salesMap: Record<string, { count: number; revenue: number }> = {};

    filteredSales.forEach((sale) => {
      const dateKey = new Date(sale.date).toLocaleDateString("pt-BR");

      if (!salesMap[dateKey]) {
        salesMap[dateKey] = { count: 0, revenue: 0 };
      }

      salesMap[dateKey].count += 1;
      salesMap[dateKey].revenue += sale.totalAmount;
    });

    return Object.entries(salesMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  })();

  function formatCurrency(value: number): string {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleString("pt-BR");
  }

  function clearFilters() {
    startDate = "";
    endDate = "";
  }
</script>

<div class="reports-container">
  <div class="reports-header">
    <h1>📊 Relatórios de Vendas</h1>
  </div>

  <!-- Filtros de Data -->
  <div class="filters-section">
    <h2>Filtros</h2>
    <div class="date-filters">
      <div class="filter-group">
        <label for="start-date">Data Inicial:</label>
        <input type="date" id="start-date" bind:value={startDate} />
      </div>

      <div class="filter-group">
        <label for="end-date">Data Final:</label>
        <input type="date" id="end-date" bind:value={endDate} />
      </div>

      <button class="clear-filters-btn" on:click={clearFilters}>
        Limpar Filtros
      </button>
    </div>
  </div>

  <!-- Resumo Geral -->
  <div class="summary-section">
    <div class="summary-cards">
      <div class="summary-card">
        <div class="card-icon">💰</div>
        <div class="card-content">
          <h3>Receita Total</h3>
          <p class="card-value">{formatCurrency(totalSales)}</p>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon">🛒</div>
        <div class="card-content">
          <h3>Total de Vendas</h3>
          <p class="card-value">{filteredSales.length}</p>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon">📦</div>
        <div class="card-content">
          <h3>Produtos Vendidos</h3>
          <p class="card-value">
            {productsSold.reduce((sum, p) => sum + p.quantity, 0)}
          </p>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon">📈</div>
        <div class="card-content">
          <h3>Ticket Médio</h3>
          <p class="card-value">
            {filteredSales.length > 0
              ? formatCurrency(totalSales / filteredSales.length)
              : formatCurrency(0)}
          </p>
        </div>
      </div>
    </div>
  </div>

  <div class="reports-content">
    <!-- Produtos Mais Vendidos -->
    <div class="report-section">
      <h2>Produtos Mais Vendidos</h2>

      {#if productsSold.length === 0}
        <div class="empty-state">
          <p>Nenhuma venda encontrada no período selecionado.</p>
        </div>
      {:else}
        <div class="products-table">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade Vendida</th>
                <th>Receita</th>
                <th>Preço Médio</th>
              </tr>
            </thead>
            <tbody>
              {#each productsSold as product}
                <tr>
                  <td>
                    <div class="product-info">
                      <div class="product-name">{product.key}</div>
                      <div class="product-details">
                        {#each $propertyDefinitions as prop}
                          {#if product.item.stockItem.properties[prop.id]}
                            <span class="detail"
                              >{prop.name}: {product.item.stockItem.properties[
                                prop.id
                              ]}</span
                            >
                          {/if}
                        {/each}
                      </div>
                    </div>
                  </td>
                  <td class="quantity">{product.quantity} un.</td>
                  <td class="revenue">{formatCurrency(product.revenue)}</td>
                  <td class="avg-price"
                    >{formatCurrency(product.revenue / product.quantity)}</td
                  >
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <!-- Vendas por Data -->
    <div class="report-section">
      <h2>Vendas por Data</h2>

      {#if salesByDate.length === 0}
        <div class="empty-state">
          <p>Nenhuma venda encontrada no período selecionado.</p>
        </div>
      {:else}
        <div class="sales-table">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Número de Vendas</th>
                <th>Receita</th>
                <th>Ticket Médio</th>
              </tr>
            </thead>
            <tbody>
              {#each salesByDate as sale}
                <tr>
                  <td>{sale.date}</td>
                  <td>{sale.count}</td>
                  <td class="revenue">{formatCurrency(sale.revenue)}</td>
                  <td class="avg-ticket"
                    >{formatCurrency(sale.revenue / sale.count)}</td
                  >
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <!-- Histórico de Vendas -->
    <div class="report-section">
      <h2>Histórico de Vendas</h2>

      {#if filteredSales.length === 0}
        <div class="empty-state">
          <p>Nenhuma venda encontrada no período selecionado.</p>
        </div>
      {:else}
        <div class="history-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Data/Hora</th>
                <th>Cliente</th>
                <th>Itens</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredSales as sale}
                <tr>
                  <td>#{sale.id}</td>
                  <td>{formatDate(sale.date)}</td>
                  <td>
                    {#if sale.customerName}
                      <span class="customer-name">{sale.customerName}</span>
                    {:else}
                      <span class="no-customer">Sem cliente</span>
                    {/if}
                  </td>
                  <td>
                    <div class="items-list">
                      {#each sale.items as item}
                        <div class="item-detail">
                          {item.quantity}x {item.stockItem.properties.type}
                          {item.stockItem.properties.brand}
                          ({formatCurrency(item.unitPrice)})
                        </div>
                      {/each}
                    </div>
                  </td>
                  <td class="sale-total">{formatCurrency(sale.totalAmount)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .reports-container {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    background-color: #1a1a1a;
    min-height: 100vh;
    color: #ffffff;
  }

  .reports-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .reports-header h1 {
    margin: 0;
    font-size: 2.5rem;
  }

  /* Filtros */
  .filters-section {
    background: #2a2a2a;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    border: 2px solid var(--primary-color-border);
  }

  .filters-section h2 {
    color: var(--text-accent);
    margin-top: 0;
    margin-bottom: 1rem;
  }

  .date-filters {
    display: flex;
    gap: 1.5rem;
    align-items: end;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-group label {
    font-weight: 600;
    color: var(--text-accent);
  }

  .filter-group input {
    padding: 0.75rem;
    border: 1px solid #555;
    border-radius: 4px;
    background-color: #333;
    color: white;
  }

  .clear-filters-btn {
    background-color: var(--text-accent);
    color: #1a1a1a;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.2s;
  }

  .clear-filters-btn:hover {
    background-color: #ffed4e;
  }

  /* Resumo */
  .summary-section {
    margin-bottom: 2rem;
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .summary-card {
    background: linear-gradient(135deg, #2a2a2a, #333);
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    border: 2px solid var(--primary-color-border);
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.1);
  }

  .card-icon {
    font-size: 2.5rem;
    background: var(--primary-color-transparent);
    border-radius: 50%;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-content h3 {
    margin: 0 0 0.5rem 0;
    color: var(--text-accent);
    font-size: 1rem;
  }

  .card-value {
    margin: 0;
    font-size: 1.8rem;
    font-weight: bold;
    color: white;
  }

  /* Relatórios */
  .reports-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .report-section {
    background: #2a2a2a;
    border-radius: 8px;
    padding: 1.5rem;
    border: 2px solid var(--primary-color-border);
  }

  .report-section h2 {
    color: var(--text-accent);
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }

  /* Tabelas */
  table {
    width: 100%;
    border-collapse: collapse;
    background: #333;
    border-radius: 8px;
    overflow: hidden;
  }

  th,
  td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #555;
  }

  th {
    background-color: var(--text-accent);
    color: #1a1a1a;
    font-weight: 600;
  }

  td {
    color: white;
  }

  tr:hover {
    background-color: #3a3a3a;
  }

  .product-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .product-name {
    font-weight: 600;
    color: var(--text-accent);
  }

  .product-details {
    font-size: 0.85rem;
    color: #ccc;
  }

  .detail {
    margin-right: 1rem;
  }

  .quantity,
  .revenue,
  .avg-price,
  .avg-ticket,
  .sale-total {
    font-weight: 600;
    text-align: right;
  }

  .customer-name {
    color: var(--text-accent);
    font-weight: 500;
  }

  .no-customer {
    color: #888;
    font-style: italic;
  }

  .revenue,
  .sale-total {
    color: #4ade80;
  }

  .items-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .item-detail {
    font-size: 0.9rem;
    color: #ccc;
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #888;
  }

  .empty-state p {
    font-size: 1.1rem;
  }

  /* Responsivo */
  @media (max-width: 768px) {
    .date-filters {
      flex-direction: column;
      align-items: stretch;
    }

    .summary-cards {
      grid-template-columns: 1fr;
    }

    table {
      font-size: 0.9rem;
    }

    th,
    td {
      padding: 0.75rem;
    }
  }
</style>
