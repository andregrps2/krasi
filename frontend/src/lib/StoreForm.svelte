<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import { companiesApi, type Company } from "./api/companies";
  import { storesApi } from "./api/stores";
  import CompanyForm from "./CompanyForm.svelte";

  const dispatch = createEventDispatcher();

  export let show = false;

  let companies: Company[] = [];
  let isLoadingCompanies = false;
  let isLoadingStore = false;
  let showCompanyForm = false;

  let formData = {
    name: "",
    address: "",
    phone: "",
    email: "",
    companyId: "",
  };

  let errors: Record<string, string> = {};

  onMount(() => {
    loadCompanies();

    // Listen for company creation events
    window.addEventListener("companyCreated", handleCompanyCreated);

    return () => {
      window.removeEventListener("companyCreated", handleCompanyCreated);
    };
  });

  function handleCompanyCreated(event: Event) {
    const customEvent = event as CustomEvent;
    const newCompany = customEvent.detail;
    companies = [...companies, newCompany];

    // Auto-select the new company
    formData.companyId = newCompany.id;
    showCompanyForm = false;
  }
  async function loadCompanies() {
    isLoadingCompanies = true;
    try {
      companies = await companiesApi.getAll();
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
      alert("Erro ao carregar empresas. Tente novamente.");
    } finally {
      isLoadingCompanies = false;
    }
  }

  function validateForm() {
    errors = {};

    if (!formData.name.trim()) {
      errors.name = "Nome é obrigatório";
    }

    if (!formData.companyId) {
      errors.companyId = "Empresa é obrigatória";
    }

    if (formData.email && !isValidEmail(formData.email)) {
      errors.email = "Email inválido";
    }

    return Object.keys(errors).length === 0;
  }

  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async function handleSubmit() {
    if (!formData.companyId || !formData.name) return;

    isLoadingStore = true;

    try {
      const newStore = await storesApi.create(formData);

      // Emit event for parent components
      window.dispatchEvent(
        new CustomEvent("storeCreated", { detail: newStore })
      );

      dispatch("created", newStore);
      resetForm();
      show = false;
    } catch (err) {
      console.error("Erro ao criar loja:", err);
      alert("Erro ao criar loja. Tente novamente.");
    } finally {
      isLoadingStore = false;
    }
  }

  function resetForm() {
    formData = {
      name: "",
      address: "",
      phone: "",
      email: "",
      companyId: "",
    };
    errors = {};
  }

  function handleCancel() {
    resetForm();
    show = false;
  }
</script>

{#if show}
  <div class="modal-overlay" on:click={handleCancel}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Criar Nova Loja</h2>
        <button class="close-btn" on:click={handleCancel}>×</button>
      </div>

      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
          <label for="company">Empresa *</label>
          <div class="company-selector">
            <select
              id="company"
              bind:value={formData.companyId}
              class:error={errors.companyId}
              disabled={isLoadingCompanies}
              required
            >
              <option value="">
                {isLoadingCompanies ? "Carregando..." : "Selecione uma empresa"}
              </option>
              {#each companies as company}
                <option value={company.id}>{company.name}</option>
              {/each}
            </select>
            <button
              type="button"
              class="btn-new-company"
              on:click={() => (showCompanyForm = true)}
            >
              + Nova Empresa
            </button>
          </div>
          {#if errors.companyId}
            <span class="error-message">{errors.companyId}</span>
          {/if}
        </div>

        <div class="form-group">
          <label for="name">Nome da Loja *</label>
          <input
            id="name"
            type="text"
            bind:value={formData.name}
            class:error={errors.name}
            placeholder="Ex: Loja Centro"
            required
          />
          {#if errors.name}
            <span class="error-message">{errors.name}</span>
          {/if}
        </div>

        <div class="form-group">
          <label for="address">Endereço</label>
          <textarea
            id="address"
            bind:value={formData.address}
            placeholder="Endereço completo da loja"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="phone">Telefone</label>
          <input
            id="phone"
            type="tel"
            bind:value={formData.phone}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            bind:value={formData.email}
            class:error={errors.email}
            placeholder="loja@empresa.com"
          />
          {#if errors.email}
            <span class="error-message">{errors.email}</span>
          {/if}
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" on:click={handleCancel}>
            Cancelar
          </button>
          <button type="submit" class="btn-submit" disabled={isLoadingStore}>
            {isLoadingStore ? "Criando..." : "Criar Loja"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<CompanyForm bind:show={showCompanyForm} on:created={handleCompanyCreated} />

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: #2a2a2a;
    border-radius: 8px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid #555;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .modal-header h2 {
    color: var(--text-accent);
    margin: 0;
    font-size: 1.4rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #ccc;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    color: #fff;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-accent);
    font-weight: 500;
  }

  .company-selector {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .company-selector select {
    flex: 1;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #555;
    border-radius: 4px;
    background: #333;
    color: #fff;
    font-size: 0.9rem;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
  }

  .form-group input.error,
  .form-group select.error,
  .form-group textarea.error {
    border-color: #e74c3c;
  }

  .btn-new-company {
    background: #666;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.75rem 1rem;
    cursor: pointer;
    font-size: 0.8rem;
    white-space: nowrap;
    transition: all 0.2s;
  }

  .btn-new-company:hover {
    background: #777;
  }

  .error-message {
    color: #e74c3c;
    font-size: 0.8rem;
    margin-top: 0.25rem;
    display: block;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #555;
  }

  .btn-cancel {
    background: #666;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .btn-cancel:hover {
    background: #777;
  }

  .btn-submit {
    background: var(--primary-color);
    color: #1a1a1a;
    border: none;
    border-radius: 4px;
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .btn-submit:hover:not(:disabled) {
    background: #ffed4e;
    transform: translateY(-1px);
  }

  .btn-submit:disabled {
    background: #555;
    color: #888;
    cursor: not-allowed;
    transform: none;
  }
</style>
