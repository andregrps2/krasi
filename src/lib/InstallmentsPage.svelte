<script lang="ts">
  import { installments, customers, salesHistory } from "../stores";
  import type { Installment, InstallmentStatus } from "../types";

  // State
  let filterStatus: InstallmentStatus | "all" = "all";
  let selectedCustomerId: number | null = null;
  let searchTerm = "";

  // Computações reativas
  $: filteredInstallments = $installments.filter((installment) => {
    // Filtro por status
    if (filterStatus !== "all" && installment.status !== filterStatus) {
      return false;
    }

    // Filtro por cliente
    if (selectedCustomerId) {
      const sale = $salesHistory.find((s) => s.id === installment.saleId);
      if (!sale || sale.customerId !== selectedCustomerId) {
        return false;
      }
    }

    // Filtro por busca
    if (searchTerm.trim()) {
      const sale = $salesHistory.find((s) => s.id === installment.saleId);
      const customer = $customers.find((c) => c.id === sale?.customerId);
      if (!customer) return false;

      const term = searchTerm.toLowerCase();
      return (
        customer.name.toLowerCase().includes(term) ||
        customer.congregation.toLowerCase().includes(term)
      );
    }

    return true;
  });

  // Atualizar status das parcelas vencidas
  $: {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    $installments = $installments.map((installment) => {
      if (installment.status === "pending") {
        const dueDate = new Date(installment.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today) {
          return { ...installment, status: "overdue" as InstallmentStatus };
        }
      }
      return installment;
    });
  }

  // Estatísticas
  $: stats = {
    total: $installments.length,
    pending: $installments.filter((i) => i.status === "pending").length,
    overdue: $installments.filter((i) => i.status === "overdue").length,
    paid: $installments.filter((i) => i.status === "paid").length,
    totalAmount: $installments.reduce((sum, i) => sum + i.amount, 0),
    pendingAmount: $installments
      .filter((i) => i.status === "pending")
      .reduce((sum, i) => sum + i.amount, 0),
    overdueAmount: $installments
      .filter((i) => i.status === "overdue")
      .reduce((sum, i) => sum + i.amount, 0),
  };

  function markAsPaid(installmentId: number) {
    if (confirm("Marcar esta parcela como paga?")) {
      $installments = $installments.map((installment) =>
        installment.id === installmentId
          ? {
              ...installment,
              status: "paid" as InstallmentStatus,
              paidDate: new Date(),
            }
          : installment
      );
    }
  }

  function markAsPending(installmentId: number) {
    if (confirm("Marcar esta parcela como pendente?")) {
      $installments = $installments.map((installment) =>
        installment.id === installmentId
          ? {
              ...installment,
              status: "pending" as InstallmentStatus,
              paidDate: undefined,
            }
          : installment
      );
    }
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("pt-BR");
  }

  function formatCurrency(value: number): string {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function getCustomerName(saleId: number): string {
    const sale = $salesHistory.find((s) => s.id === saleId);
    return sale?.customerName || "Cliente não encontrado";
  }

  function getStatusColor(status: InstallmentStatus): string {
    switch (status) {
      case "paid":
        return "#4ade80";
      case "pending":
        return "#ffd700";
      case "overdue":
        return "#ef4444";
      default:
        return "#888";
    }
  }

  function getStatusText(status: InstallmentStatus): string {
    switch (status) {
      case "paid":
        return "Paga";
      case "pending":
        return "Pendente";
      case "overdue":
        return "Vencida";
      default:
        return "Desconhecido";
    }
  }

  function getStatusIcon(status: InstallmentStatus): string {
    switch (status) {
      case "paid":
        return "✅";
      case "pending":
        return "⏳";
      case "overdue":
        return "⚠️";
      default:
        return "❓";
    }
  }
</script>

<div class="installments-container">
  <div class="installments-header">
    <h1>💳 Controle de Fiado</h1>
  </div>

  <div class="installments-content">
    <!-- Estatísticas -->
    <div class="stats-grid">
      <div class="stat-card total">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <h3>Total de Parcelas</h3>
          <p class="stat-value">{stats.total}</p>
        </div>
      </div>

      <div class="stat-card pending">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <h3>Pendentes</h3>
          <p class="stat-value">{stats.pending}</p>
          <p class="stat-amount">{formatCurrency(stats.pendingAmount)}</p>
        </div>
      </div>

      <div class="stat-card overdue">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <h3>Vencidas</h3>
          <p class="stat-value">{stats.overdue}</p>
          <p class="stat-amount">{formatCurrency(stats.overdueAmount)}</p>
        </div>
      </div>

      <div class="stat-card paid">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <h3>Pagas</h3>
          <p class="stat-value">{stats.paid}</p>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters">
      <div class="filter-group">
        <label for="status-filter">Status:</label>
        <select
          id="status-filter"
          bind:value={filterStatus}
          class="filter-select"
        >
          <option value="all">Todos</option>
          <option value="pending">Pendentes</option>
          <option value="overdue">Vencidas</option>
          <option value="paid">Pagas</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="customer-filter">Cliente:</label>
        <select
          id="customer-filter"
          bind:value={selectedCustomerId}
          class="filter-select"
        >
          <option value={null}>Todos os clientes</option>
          {#each $customers as customer (customer.id)}
            <option value={customer.id}>{customer.name}</option>
          {/each}
        </select>
      </div>

      <div class="filter-group">
        <label for="search-input">Buscar:</label>
        <input
          id="search-input"
          type="text"
          placeholder="Nome do cliente..."
          bind:value={searchTerm}
          class="search-input"
        />
      </div>
    </div>

    <!-- Lista de Parcelas -->
    {#if filteredInstallments.length === 0}
      <div class="empty-state">
        <h3>Nenhuma parcela encontrada</h3>
        <p>Não há parcelas que correspondam aos filtros selecionados.</p>
      </div>
    {:else}
      <div class="installments-table">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Venda</th>
              <th>Parcela</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredInstallments as installment (installment.id)}
              <tr class="installment-row {installment.status}">
                <td>
                  <div class="customer-info">
                    {getCustomerName(installment.saleId)}
                  </div>
                </td>
                <td>#{installment.saleId}</td>
                <td>{installment.installmentNumber}</td>
                <td>
                  <div class="date-info">
                    {formatDate(installment.dueDate)}
                    {#if installment.status === "overdue"}
                      <span class="overdue-label">VENCIDA</span>
                    {/if}
                  </div>
                </td>
                <td class="amount">{formatCurrency(installment.amount)}</td>
                <td>
                  <div class="status-badge {installment.status}">
                    {getStatusIcon(installment.status)}
                    {getStatusText(installment.status)}
                    {#if installment.paidDate}
                      <div class="paid-date">
                        em {formatDate(installment.paidDate)}
                      </div>
                    {/if}
                  </div>
                </td>
                <td>
                  <div class="actions">
                    {#if installment.status !== "paid"}
                      <button
                        class="action-btn pay-btn"
                        on:click={() => markAsPaid(installment.id)}
                        title="Marcar como paga"
                      >
                        ✅
                      </button>
                    {:else}
                      <button
                        class="action-btn undo-btn"
                        on:click={() => markAsPending(installment.id)}
                        title="Desfazer pagamento"
                      >
                        ↩️
                      </button>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<style>
  .installments-container {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    background-color: #1a1a1a;
    min-height: 100vh;
    color: #ffffff;
  }

  .installments-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .installments-header h1 {
    color: #ffd700;
    margin: 0;
    font-size: 2.5rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .installments-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* Estatísticas */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .stat-card {
    background: #2a2a2a;
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    border: 2px solid;
  }

  .stat-card.total {
    border-color: #ffd700;
  }
  .stat-card.pending {
    border-color: #ffd700;
  }
  .stat-card.overdue {
    border-color: #ef4444;
  }
  .stat-card.paid {
    border-color: #4ade80;
  }

  .stat-icon {
    font-size: 2.5rem;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-card.total .stat-icon {
    background: #ffd700;
  }
  .stat-card.pending .stat-icon {
    background: #ffd700;
  }
  .stat-card.overdue .stat-icon {
    background: #ef4444;
  }
  .stat-card.paid .stat-icon {
    background: #4ade80;
  }

  .stat-content h3 {
    margin: 0 0 0.5rem 0;
    color: #ffd700;
    font-size: 1rem;
  }

  .stat-value {
    margin: 0;
    font-size: 1.8rem;
    font-weight: bold;
    color: white;
  }

  .stat-amount {
    margin: 0.25rem 0 0 0;
    font-size: 0.9rem;
    color: #ccc;
  }

  /* Filtros */
  .filters {
    background: #2a2a2a;
    border-radius: 8px;
    padding: 1.5rem;
    border: 2px solid #ffd700;
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    align-items: end;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 150px;
  }

  .filter-group label {
    color: #ffd700;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .filter-select,
  .search-input {
    padding: 0.75rem;
    border: 2px solid #555;
    border-radius: 4px;
    background-color: #333;
    color: white;
    font-size: 1rem;
  }

  .filter-select:focus,
  .search-input:focus {
    outline: none;
    border-color: #ffd700;
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
  }

  /* Tabela */
  .installments-table {
    background: #2a2a2a;
    border-radius: 8px;
    overflow: hidden;
    border: 2px solid #ffd700;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    background: #333;
    color: #ffd700;
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid #ffd700;
  }

  td {
    padding: 1rem;
    border-bottom: 1px solid #555;
  }

  .installment-row:hover {
    background: #333;
  }

  .installment-row.overdue {
    background: rgba(239, 68, 68, 0.1);
  }

  .installment-row.paid {
    background: rgba(74, 222, 128, 0.1);
  }

  .customer-info {
    font-weight: 600;
    color: #ffd700;
  }

  .date-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .overdue-label {
    background: #ef4444;
    color: white;
    padding: 0.1rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: bold;
  }

  .amount {
    font-weight: 600;
    color: #4ade80;
    text-align: right;
  }

  .status-badge {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .status-badge.pending {
    color: #ffd700;
  }
  .status-badge.overdue {
    color: #ef4444;
  }
  .status-badge.paid {
    color: #4ade80;
  }

  .paid-date {
    font-size: 0.8rem;
    color: #888;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    background: none;
    border: 1px solid #555;
    width: 35px;
    height: 35px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    font-size: 1rem;
  }

  .pay-btn:hover {
    background-color: #4ade80;
    border-color: #4ade80;
  }

  .undo-btn:hover {
    background-color: #ffd700;
    border-color: #ffd700;
  }

  /* Estado vazio */
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #888;
  }

  .empty-state h3 {
    color: #ffd700;
    margin-bottom: 1rem;
  }

  /* Responsivo */
  @media (max-width: 768px) {
    .filters {
      flex-direction: column;
      align-items: stretch;
    }

    .filter-group {
      min-width: auto;
    }

    .installments-table {
      overflow-x: auto;
    }

    table {
      min-width: 600px;
    }
  }
</style>
