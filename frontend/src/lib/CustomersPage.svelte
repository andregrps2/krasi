<script lang="ts">
  import { customers, currentStoreId, loadCustomersForStore } from "../stores";
  import type { Customer } from "../types-new";
  import { customersService } from "./services/customersService";
  import Modal from "./Modal.svelte";
  import CustomerForm from "./CustomerForm.svelte";

  // Tipo temporário que inclui campos de endereço para compatibilidade
  interface CustomerWithAddress extends Customer {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  }

  // State
  let showCustomerModal = false;
  let editingCustomer: CustomerWithAddress | null = null;
  let searchTerm = "";

  // Filtered customers
  $: filteredCustomers = $customers.filter((customer) => {
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(term) ||
      (customer.congregation &&
        customer.congregation.toLowerCase().includes(term)) ||
      (customer.whatsappNumber && customer.whatsappNumber.includes(term))
    );
  });

  function openAddCustomerModal() {
    editingCustomer = null;
    showCustomerModal = true;
  }

  function openEditCustomerModal(customer: Customer) {
    editingCustomer = customer as CustomerWithAddress;
    showCustomerModal = true;
  }

  async function handleSaveCustomer(
    event: CustomEvent<Omit<CustomerWithAddress, "id"> & { id?: string }>
  ) {
    const customerData = event.detail;

    if (!$currentStoreId) {
      alert("Nenhuma loja selecionada!");
      return;
    }

    try {
      if (customerData.id) {
        // Update existing customer (será implementado depois)
        console.log("Atualização de cliente ainda não implementada");
      } else {
        // Add new customer via API
        await customersService.createCustomer($currentStoreId, {
          name: customerData.name,
          congregation: customerData.congregation,
          whatsappNumber: customerData.whatsappNumber,
          cep: customerData.cep,
          logradouro: customerData.logradouro,
          numero: customerData.numero,
          complemento: customerData.complemento,
          bairro: customerData.bairro,
          localidade: customerData.localidade,
          uf: customerData.uf,
        });

        // Recarregar lista de clientes
        await loadCustomersForStore($currentStoreId);
      }

      showCustomerModal = false;
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Erro ao salvar cliente. Tente novamente.");
    }
  }
  function handleCancelCustomer() {
    showCustomerModal = false;
  }

  function deleteCustomer(customerId: string) {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      $customers = $customers.filter((customer) => customer.id !== customerId);
    }
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("pt-BR");
  }

  function formatWhatsApp(number: string): string {
    // Remove formatting and add WhatsApp link
    const cleanNumber = number.replace(/\D/g, "");
    return `https://wa.me/55${cleanNumber}`;
  }

  function openWhatsApp(number: string | undefined) {
    if (!number) return;
    window.open(formatWhatsApp(number), "_blank");
  }

  function formatAddress(customer: CustomerWithAddress): string {
    const parts = [];

    // Combinar logradouro e número
    let endereco = "";
    if (customer.logradouro) {
      endereco = customer.logradouro;
      if (customer.numero) {
        endereco += `, ${customer.numero}`;
      }
      parts.push(endereco);
    } else if (customer.numero) {
      parts.push(customer.numero);
    }

    if (customer.complemento) parts.push(customer.complemento);
    if (customer.bairro) parts.push(customer.bairro);
    if (customer.localidade && customer.uf) {
      parts.push(`${customer.localidade}/${customer.uf}`);
    } else if (customer.localidade) {
      parts.push(customer.localidade);
    }
    if (customer.cep) parts.push(`CEP: ${customer.cep}`);

    return parts.length > 0 ? parts.join(", ") : "";
  }

  function hasAddress(customer: CustomerWithAddress): boolean {
    return !!(
      customer.cep ||
      customer.logradouro ||
      customer.numero ||
      customer.bairro ||
      customer.localidade
    );
  }
</script>

<div class="customers-container">
  <div class="customers-header">
    <h1>👥 Cadastro de Clientes</h1>
  </div>

  <Modal bind:show={showCustomerModal}>
    <h2>{editingCustomer ? "Editar Cliente" : "Novo Cliente"}</h2>
    <CustomerForm
      customer={editingCustomer}
      on:save={handleSaveCustomer}
      on:cancel={handleCancelCustomer}
    />
  </Modal>

  <div class="customers-content">
    <div class="toolbar">
      <div class="search-section">
        <input
          type="text"
          placeholder="Buscar por nome, congregação ou telefone..."
          bind:value={searchTerm}
          class="search-input"
        />
      </div>

      <button class="add-customer-btn" on:click={openAddCustomerModal}>
        + Novo Cliente
      </button>
    </div>

    <div class="customers-stats">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <h3>Total de Clientes</h3>
          <p class="stat-value">{$customers.length}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🔍</div>
        <div class="stat-content">
          <h3>Resultados da Busca</h3>
          <p class="stat-value">{filteredCustomers.length}</p>
        </div>
      </div>
    </div>

    {#if filteredCustomers.length === 0}
      <div class="empty-state">
        {#if $customers.length === 0}
          <h3>Nenhum cliente cadastrado</h3>
          <p>
            Comece adicionando o primeiro cliente clicando no botão "Novo
            Cliente"
          </p>
        {:else}
          <h3>Nenhum cliente encontrado</h3>
          <p>Tente ajustar os termos da sua busca</p>
        {/if}
      </div>
    {:else}
      <div class="customers-grid">
        {#each filteredCustomers as customer (customer.id)}
          <div class="customer-card">
            <div class="customer-header">
              <div class="customer-name">
                <h3>{customer.name}</h3>
                <span class="customer-id">#{customer.id}</span>
              </div>
              <div class="customer-actions">
                <button
                  class="action-btn whatsapp-btn"
                  on:click={() => openWhatsApp(customer.whatsappNumber)}
                  title="Abrir WhatsApp"
                >
                  💬
                </button>
                <button
                  class="action-btn edit-btn"
                  on:click={() => openEditCustomerModal(customer)}
                  title="Editar Cliente"
                >
                  ✏️
                </button>
                <button
                  class="action-btn delete-btn"
                  on:click={() => deleteCustomer(customer.id)}
                  title="Excluir Cliente"
                >
                  🗑️
                </button>
              </div>
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

              {#if hasAddress(customer)}
                <div class="detail-item">
                  <span class="detail-label">Endereço:</span>
                  <span class="detail-value address-text"
                    >{formatAddress(customer)}</span
                  >
                </div>
              {/if}

              <div class="detail-item">
                <span class="detail-label">Cadastrado em:</span>
                <span class="detail-value"
                  >{formatDate(customer.createdAt)}</span
                >
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .customers-container {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    background-color: #1a1a1a;
    min-height: 100vh;
    color: #ffffff;
  }

  .customers-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .customers-header h1 {
    margin: 0;
    font-size: 2.5rem;
    text-shadow: var(--shadow-small);
  }

  .customers-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .search-section {
    flex: 1;
    max-width: 400px;
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
    outline: none;
    border-color: var(--primary-color-border);
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
  }

  .add-customer-btn {
    background-color: var(--text-accent);
    color: #1a1a1a;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .add-customer-btn:hover {
    background-color: #ffed4e;
    transform: translateY(-1px);
  }

  .customers-stats {
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
    border: 2px solid var(--primary-color-border);
  }

  .stat-icon {
    font-size: 2.5rem;
    background: var(--primary-color-transparent);
    border-radius: 50%;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
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

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #888;
  }

  .empty-state h3 {
    color: var(--text-accent);
    margin-bottom: 1rem;
  }

  .customers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .customer-card {
    background: #2a2a2a;
    border-radius: 8px;
    padding: 1.5rem;
    border: 2px solid #555;
    transition: all 0.2s;
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
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #555;
  }

  .customer-name h3 {
    margin: 0;
    color: var(--text-accent);
    font-size: 1.2rem;
  }

  .customer-id {
    font-size: 0.85rem;
    color: #888;
  }

  .customer-actions {
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

  .whatsapp-btn:hover {
    background-color: #25d366;
    border-color: #25d366;
  }

  .edit-btn:hover {
    background-color: var(--text-accent);
    border-color: var(--primary-color-border);
  }

  .delete-btn:hover {
    background-color: #dc3545;
    border-color: #dc3545;
  }

  .customer-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-label {
    font-weight: 600;
    color: var(--text-accent);
  }

  .detail-value {
    color: #cccccc;
  }

  .address-text {
    font-size: 0.9rem;
    line-height: 1.4;
    word-wrap: break-word;
  }

  /* Responsivo */
  @media (max-width: 768px) {
    .toolbar {
      flex-direction: column;
      align-items: stretch;
    }

    .search-section {
      max-width: none;
    }

    .customers-grid {
      grid-template-columns: 1fr;
    }

    .customer-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .customer-actions {
      justify-content: center;
    }
  }
</style>
