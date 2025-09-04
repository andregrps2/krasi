<script lang="ts">
  import { onMount } from "svelte";
  import {
    installments,
    customers,
    salesHistory,
    currentStoreId,
  } from "../stores";
  import { installmentsService } from "../lib/services";
  import type {
    Installment,
    Customer,
    InstallmentWithRelations,
  } from "../types-new";
  import { InstallmentStatus } from "../types-new";
  import Modal from "./Modal.svelte";

  // State
  let filterStatus: InstallmentStatus | "all" = "all";
  let selectedCustomerId: string | null = null;
  let selectedCustomer: Customer | null = null;
  let searchTerm = "";
  let customerSearchTerm = "";
  let showCustomerModal = false;

  // Filtrar clientes disponíveis
  $: filteredCustomers = $customers.filter((customer) => {
    if (!customerSearchTerm.trim()) return true;

    const term = customerSearchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(term) ||
      customer.congregation?.toLowerCase().includes(term) ||
      false ||
      customer.whatsappNumber?.includes(term) ||
      false
    );
  });

  // Computações reativas
  $: filteredInstallments = $installments.filter(
    (installment: Installment | InstallmentWithRelations) => {
      // Filtro por status
      if (filterStatus !== "all" && installment.status !== filterStatus) {
        return false;
      }

      // Filtro por cliente
      if (selectedCustomerId) {
        // Usar dados que vêm da API ou fallback para stores
        const customerId =
          "customer" in installment && installment.customer
            ? installment.customer.id
            : $salesHistory.find((s) => s.id === installment.saleId)
                ?.customerId;

        if (customerId !== selectedCustomerId) {
          return false;
        }
      }

      // Filtro por busca
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();

        // Usar dados que vêm da API
        if ("customer" in installment && installment.customer) {
          const matches =
            installment.customer.name.toLowerCase().includes(term) ||
            installment.customer.congregation?.toLowerCase().includes(term) ||
            false;

          if (!matches) {
            return false;
          }
        } else {
          // Fallback para stores
          const sale = $salesHistory.find((s) => s.id === installment.saleId);
          const customer = $customers.find((c) => c.id === sale?.customerId);
          if (!customer) {
            return false;
          }

          const matches =
            customer.name.toLowerCase().includes(term) ||
            customer.congregation?.toLowerCase().includes(term) ||
            false;

          if (!matches) {
            return false;
          }
        }
      }

      return true;
    }
  );

  // Debug: log apenas a contagem
  $: {
    if ($installments.length > 0) {
      console.log(
        "🔢 [INSTALLMENTS PAGE] Total de parcelas no store:",
        $installments.length
      );
      console.log(
        "🔢 [INSTALLMENTS PAGE] Parcelas após filtros:",
        filteredInstallments.length
      );
    }
  }

  // Atualizar status das parcelas vencidas
  $: {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    $installments = $installments.map((installment) => {
      if (installment.status === InstallmentStatus.PENDING) {
        const dueDate = new Date(installment.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today) {
          return { ...installment, status: InstallmentStatus.OVERDUE };
        }
      }
      return installment;
    });
  }

  // Estatísticas
  $: stats = {
    total: $installments.length,
    pending: $installments.filter((i) => i.status === InstallmentStatus.PENDING)
      .length,
    overdue: $installments.filter((i) => i.status === InstallmentStatus.OVERDUE)
      .length,
    paid: $installments.filter((i) => i.status === InstallmentStatus.PAID)
      .length,
    totalAmount: $installments.reduce((sum, i) => sum + i.amount, 0),
    pendingAmount: $installments
      .filter((i) => i.status === InstallmentStatus.PENDING)
      .reduce((sum, i) => sum + i.amount, 0),
    overdueAmount: $installments
      .filter((i) => i.status === InstallmentStatus.OVERDUE)
      .reduce((sum, i) => sum + i.amount, 0),
  };

  async function markAsPaid(installmentId: string) {
    if (confirm("Marcar esta parcela como paga?")) {
      try {
        await installmentsService.payInstallment(installmentId, {
          paymentDate: new Date(),
          paymentMethod: "cash",
        });

        // Recarregar dados da loja atual
        const storeId = $currentStoreId;
        if (storeId) {
          const updatedInstallments =
            await installmentsService.getInstallmentsByStore(storeId);
          installments.set(updatedInstallments);
        }
      } catch (error) {
        alert("Erro ao marcar parcela como paga: " + error);
      }
    }
  }

  async function markAsPending(installmentId: string) {
    if (confirm("Marcar esta parcela como pendente?")) {
      try {
        // Funcionalidade em desenvolvimento
        alert("Funcionalidade em desenvolvimento");
      } catch (error) {
        alert("Erro ao alterar status da parcela: " + error);
      }
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

  function getCustomerName(
    installment: Installment | InstallmentWithRelations
  ): string {
    // Usar dados que vêm diretamente da API (com include)
    if ("customer" in installment && installment.customer) {
      return installment.customer.name;
    }

    // Fallback para os stores (caso não venha da API)
    const sale = $salesHistory.find((s) => s.id === installment.saleId);
    if (!sale) return "Cliente não encontrado";

    const customer = $customers.find((c) => c.id === sale.customerId);
    return customer?.name || "Cliente não encontrado";
  }
  function getStatusColor(status: InstallmentStatus): string {
    switch (status) {
      case InstallmentStatus.PAID:
        return "#4ade80";
      case InstallmentStatus.PENDING:
        return "var(--primary-color)";
      case InstallmentStatus.OVERDUE:
        return "#ef4444";
      default:
        return "#888";
    }
  }

  function getStatusText(status: InstallmentStatus): string {
    switch (status) {
      case InstallmentStatus.PAID:
        return "Paga";
      case InstallmentStatus.PENDING:
        return "Pendente";
      case InstallmentStatus.OVERDUE:
        return "Vencida";
      default:
        return "Desconhecido";
    }
  }

  function getStatusIcon(status: InstallmentStatus): string {
    switch (status) {
      case InstallmentStatus.PAID:
        return "✅";
      case InstallmentStatus.PENDING:
        return "⏳";
      case InstallmentStatus.OVERDUE:
        return "⚠️";
      default:
        return "❓";
    }
  }

  function selectCustomer(customer: Customer) {
    selectedCustomer = customer;
    selectedCustomerId = customer.id;
    showCustomerModal = false;
    customerSearchTerm = "";
  }

  function clearCustomer() {
    selectedCustomer = null;
    selectedCustomerId = null;
    showCustomerModal = false;
  }

  function openCustomerModal() {
    showCustomerModal = true;
    customerSearchTerm = "";
  }

  // Carregar parcelas quando a página for montada
  onMount(async () => {
    console.log("📦 [INSTALLMENTS PAGE] Carregando parcelas...");

    const storeId = $currentStoreId;
    if (storeId) {
      console.log("🏪 [INSTALLMENTS PAGE] Loja atual:", storeId);

      try {
        const loadedInstallments =
          await installmentsService.getInstallmentsByStore(storeId);
        console.log(
          "✅ [INSTALLMENTS PAGE] Parcelas carregadas:",
          loadedInstallments.length
        );
        console.log(
          "📋 [INSTALLMENTS PAGE] Dados das parcelas:",
          loadedInstallments
        );
        console.log(
          "👥 [INSTALLMENTS PAGE] Clientes disponíveis:",
          $customers.length
        );
        console.log(
          "💰 [INSTALLMENTS PAGE] Vendas disponíveis:",
          $salesHistory.length
        );
        installments.set(loadedInstallments);
      } catch (error) {
        console.error(
          "❌ [INSTALLMENTS PAGE] Erro ao carregar parcelas:",
          error
        );
      }
    } else {
      console.warn("⚠️ [INSTALLMENTS PAGE] Nenhuma loja selecionada");
    }
  });
</script>

<div class="installments-container">
  <div class="installments-header">
    <h1>💳 Controle de Fiado</h1>
  </div>

  <!-- Modal de Seleção de Cliente -->
  <Modal bind:show={showCustomerModal}>
    <h2>Filtrar por Cliente</h2>

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
          Mostrar todos os clientes
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
          <option value={InstallmentStatus.PENDING}>Pendentes</option>
          <option value={InstallmentStatus.OVERDUE}>Vencidas</option>
          <option value={InstallmentStatus.PAID}>Pagas</option>
        </select>
      </div>

      <div class="filter-group">
        <span class="filter-label">Cliente:</span>
        <div class="customer-selector">
          {#if selectedCustomer}
            <div class="selected-customer">
              <span class="customer-name">{selectedCustomer.name}</span>
              <span class="customer-congregation"
                >({selectedCustomer.congregation})</span
              >
              <button
                class="clear-customer-btn"
                on:click={clearCustomer}
                title="Remover filtro"
              >
                ✕
              </button>
            </div>
          {:else}
            <button class="select-customer-btn" on:click={openCustomerModal}>
              Filtrar por Cliente
            </button>
          {/if}
        </div>
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
                    {getCustomerName(installment)}
                  </div>
                </td>
                <td>#{installment.saleId}</td>
                <td>{installment.number}</td>
                <td>
                  <div class="date-info">
                    {formatDate(installment.dueDate)}
                    {#if installment.status === InstallmentStatus.OVERDUE}
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
                    {#if installment.status !== InstallmentStatus.PAID}
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
    margin: 0;
    font-size: 2.5rem;
    text-shadow: var(--shadow-small);
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
    border-color: var(--primary-color-border);
  }
  .stat-card.pending {
    border-color: var(--primary-color-border);
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
    background: var(--primary-color-transparent);
  }
  .stat-card.pending .stat-icon {
    background: var(--primary-color-transparent);
  }
  .stat-card.overdue .stat-icon {
    background: #ef4444;
  }
  .stat-card.paid .stat-icon {
    background: #4ade80;
  }

  .stat-content h3 {
    margin: 0 0 0.5rem 0;
    color: var(--text-accent);
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
    border: 2px solid var(--primary-color-border);
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
    color: var(--text-accent);
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
    border-color: var(--primary-color-border);
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
  }

  /* Seletor de Cliente */
  .filter-label {
    color: var(--text-accent);
    font-weight: 600;
    font-size: 0.9rem;
  }

  .customer-selector {
    min-width: 200px;
  }

  .selected-customer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background-color: #333;
    border: 2px solid var(--primary-color-border);
    border-radius: 4px;
    font-size: 1rem;
  }

  .customer-name {
    color: var(--text-accent);
    font-weight: 600;
  }

  .customer-congregation {
    color: #ccc;
    font-size: 0.9rem;
  }

  .clear-customer-btn {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    padding: 0.2rem;
    margin-left: auto;
    border-radius: 2px;
    transition: all 0.2s;
  }

  .clear-customer-btn:hover {
    background-color: #ef4444;
    color: white;
  }

  .select-customer-btn {
    padding: 0.75rem 1rem;
    border: 2px solid #555;
    border-radius: 4px;
    background-color: #333;
    color: white;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
    width: 100%;
  }

  .select-customer-btn:hover {
    border-color: var(--primary-color-border);
    background-color: #444;
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

  /* Tabela */
  .installments-table {
    background: #2a2a2a;
    border-radius: 8px;
    overflow: hidden;
    border: 2px solid var(--primary-color-border);
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    background: #333;
    color: var(--text-accent);
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid var(--primary-color);
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
    color: var(--text-accent);
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
    color: var(--text-accent);
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
    background-color: var(--text-accent);
    border-color: var(--primary-color-border);
  }

  /* Estado vazio */
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #888;
  }

  .empty-state h3 {
    color: var(--text-accent);
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
