<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Customer } from "../types";

  export let customer: Customer | null = null;

  const dispatch = createEventDispatcher();

  // Form data - campos básicos
  let name = "";
  let congregation = "";
  let whatsappNumber = "";

  // Form data - campos de endereço
  let cep = "";
  let logradouro = "";
  let complemento = "";
  let bairro = "";
  let localidade = "";
  let uf = "";
  let estado = "";

  // Estado para busca de CEP
  let isLoadingCep = false;
  let cepError = "";

  // Inicializar formulário com dados do cliente se estiver editando
  $: if (customer) {
    name = customer.name || "";
    congregation = customer.congregation || "";
    whatsappNumber = customer.whatsappNumber || "";
    cep = customer.cep || "";
    logradouro = customer.logradouro || "";
    complemento = customer.complemento || "";
    bairro = customer.bairro || "";
    localidade = customer.localidade || "";
    uf = customer.uf || "";
    estado = customer.estado || "";
  } else {
    // Limpar campos para novo cliente
    name = "";
    congregation = "";
    whatsappNumber = "";
    cep = "";
    logradouro = "";
    complemento = "";
    bairro = "";
    localidade = "";
    uf = "";
    estado = "";
  }

  // Validação dos campos obrigatórios
  $: isValid =
    name.trim().length > 0 &&
    congregation.trim().length > 0 &&
    whatsappNumber.trim().length > 0;

  function handleSubmit(event: Event) {
    event.preventDefault();

    if (!isValid) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const customerData = {
      id: customer?.id,
      name: name.trim(),
      congregation: congregation.trim(),
      whatsappNumber: whatsappNumber.trim(),
      createdAt: customer?.createdAt || new Date(),
      cep: cep.trim() || undefined,
      logradouro: logradouro.trim() || undefined,
      complemento: complemento.trim() || undefined,
      bairro: bairro.trim() || undefined,
      localidade: localidade.trim() || undefined,
      uf: uf.trim() || undefined,
      estado: estado.trim() || undefined,
    };

    dispatch("save", customerData);
  }

  function handleCancel() {
    dispatch("cancel");
  }

  // Formatação do telefone
  function formatPhoneNumber(value: string): string {
    if (!value) return "";

    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 2) {
      return numbers ? `(${numbers}` : "";
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  }

  function handlePhoneInput(event: Event) {
    const target = event.target as HTMLInputElement;
    whatsappNumber = formatPhoneNumber(target.value);
  }

  // Formatação do CEP
  function formatCep(value: string): string {
    if (!value) return "";

    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 5) {
      return numbers;
    } else {
      return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
    }
  }

  function handleCepInput(event: Event) {
    const target = event.target as HTMLInputElement;
    cep = formatCep(target.value);

    // Limpar erro quando usuário começar a digitar
    if (cepError) {
      cepError = "";
    }
  }

  // Busca CEP na API
  async function searchCep() {
    const cleanCep = cep.replace(/\D/g, "");

    if (cleanCep.length !== 8) {
      cepError = "CEP deve ter 8 dígitos";
      return;
    }

    isLoadingCep = true;
    cepError = "";

    try {
      const response = await fetch(`https://opencep.com/v1/${cleanCep}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error("CEP não encontrado");
      }

      const data = await response.json();

      // Preencher campos automaticamente
      logradouro = data.logradouro || "";
      bairro = data.bairro || "";
      localidade = data.localidade || "";
      uf = data.uf || "";
      estado = data.estado || "";

      // Complemento apenas se não estiver preenchido
      if (data.complemento && !complemento.trim()) {
        complemento = data.complemento;
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      cepError = error instanceof Error ? error.message : "Erro ao buscar CEP";
    } finally {
      isLoadingCep = false;
    }
  }
</script>

<!-- Formulário de Cliente -->
<div class="customer-form-container">
  <form on:submit={handleSubmit} class="customer-form">
    <!-- Campos Obrigatórios -->
    <div class="required-section">
      <h3 class="section-title">👤 Informações Básicas</h3>

      <div class="form-group">
        <label for="name">Nome Completo: <span class="required">*</span></label>
        <input
          id="name"
          type="text"
          bind:value={name}
          placeholder="Digite o nome completo"
          required
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label for="congregation"
          >Congregação: <span class="required">*</span></label
        >
        <input
          id="congregation"
          type="text"
          bind:value={congregation}
          placeholder="Digite a congregação"
          required
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label for="whatsapp">WhatsApp: <span class="required">*</span></label>
        <input
          id="whatsapp"
          type="tel"
          value={whatsappNumber}
          on:input={handlePhoneInput}
          placeholder="(11) 99999-9999"
          required
          class="form-input"
          maxlength="15"
        />
        <small class="help-text"
          >Digite apenas números. Formatação automática.</small
        >
      </div>
    </div>

    <!-- Campos de Endereço (Opcionais) -->
    <div class="address-section">
      <h3 class="section-title">📍 Endereço (Opcional)</h3>

      <!-- CEP com Lupa -->
      <div class="form-group">
        <label for="cep">CEP:</label>
        <div class="cep-container">
          <input
            id="cep"
            type="text"
            value={cep}
            on:input={handleCepInput}
            placeholder="00000-000"
            class="form-input cep-input"
            maxlength="9"
          />
          <button
            type="button"
            class="search-cep-btn"
            on:click={searchCep}
            disabled={cep.replace(/\D/g, "").length !== 8 || isLoadingCep}
            title="Buscar CEP"
          >
            {#if isLoadingCep}
              <span class="loading">⏳</span>
            {:else}
              <span class="search-icon">🔍</span>
            {/if}
          </button>
        </div>
        {#if cepError}
          <small class="error-text">{cepError}</small>
        {:else}
          <small class="help-text"
            >Digite o CEP e clique na lupa para buscar</small
          >
        {/if}
      </div>

      <!-- Campos de Endereço em Linha -->
      <div class="form-row">
        <div class="form-group flex-2">
          <label for="logradouro">Logradouro:</label>
          <input
            id="logradouro"
            type="text"
            bind:value={logradouro}
            placeholder="Rua, Avenida, etc."
            class="form-input"
          />
        </div>

        <div class="form-group flex-1">
          <label for="complemento">Complemento:</label>
          <input
            id="complemento"
            type="text"
            bind:value={complemento}
            placeholder="Apto, Casa, etc."
            class="form-input"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label for="bairro">Bairro:</label>
          <input
            id="bairro"
            type="text"
            bind:value={bairro}
            placeholder="Nome do bairro"
            class="form-input"
          />
        </div>

        <div class="form-group flex-2">
          <label for="localidade">Cidade:</label>
          <input
            id="localidade"
            type="text"
            bind:value={localidade}
            placeholder="Nome da cidade"
            class="form-input"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label for="uf">UF:</label>
          <input
            id="uf"
            type="text"
            bind:value={uf}
            placeholder="SP"
            class="form-input uf-input"
            maxlength="2"
          />
        </div>

        <div class="form-group flex-2">
          <label for="estado">Estado:</label>
          <input
            id="estado"
            type="text"
            bind:value={estado}
            placeholder="Nome do estado"
            class="form-input"
          />
        </div>
      </div>
    </div>

    <!-- Botões de Ação -->
    <div class="form-actions">
      <button type="button" class="cancel-btn" on:click={handleCancel}>
        Cancelar
      </button>
      <button type="submit" class="save-btn" disabled={!isValid}>
        {customer ? "Atualizar" : "Salvar"} Cliente
      </button>
    </div>
  </form>
</div>

<style>
  .customer-form-container {
    width: 100%;
    max-height: 70vh;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .customer-form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    max-width: 100%;
  }

  /* Seções */
  .required-section,
  .address-section {
    background: #2a2a2a;
    border-radius: 8px;
    padding: 1.5rem;
    border: 2px solid #555;
  }

  .section-title {
    margin: 0 0 1.5rem 0;
    color: var(--text-accent);
    font-size: 1.2rem;
    border-bottom: 1px solid #555;
    padding-bottom: 0.5rem;
  }

  /* Grupos de Formulário */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .form-group label {
    font-weight: 600;
    color: var(--text-accent);
    font-size: 1rem;
  }

  .required {
    color: #ff6b6b;
  }

  /* Inputs */
  .form-input {
    padding: 0.75rem;
    border: 2px solid #555;
    border-radius: 4px;
    font-size: 1rem;
    background-color: #333;
    color: white;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--border-primary);
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
  }

  /* Container do CEP com Lupa */
  .cep-container {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .cep-input {
    flex: 1;
  }

  .search-cep-btn {
    background-color: var(--text-accent);
    color: #1a1a1a;
    border: none;
    padding: 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    min-width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .search-cep-btn:hover:not(:disabled) {
    background-color: #ffed4e;
    transform: translateY(-1px);
  }

  .search-cep-btn:disabled {
    background-color: #555;
    color: #888;
    cursor: not-allowed;
    transform: none;
  }

  .search-icon {
    font-size: 1.2rem;
  }

  .loading {
    font-size: 1.2rem;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  /* Campos especiais */
  .uf-input {
    text-transform: uppercase;
  }

  /* Linhas de formulário */
  .form-row {
    display: flex;
    gap: 1rem;
  }

  .flex-1 {
    flex: 1;
  }

  .flex-2 {
    flex: 2;
  }

  /* Textos de ajuda */
  .help-text {
    font-size: 0.85rem;
    color: #888;
    font-style: italic;
  }

  .error-text {
    font-size: 0.85rem;
    color: #ff6b6b;
    font-style: italic;
  }

  /* Botões de ação */
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #555;
  }

  .cancel-btn {
    background-color: transparent;
    color: var(--text-accent);
    border: 2px solid var(--border-primary);
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .cancel-btn:hover {
    background-color: var(--text-accent);
    color: #1a1a1a;
  }

  .save-btn {
    background-color: #4ade80;
    color: #1a1a1a;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .save-btn:hover:not(:disabled) {
    background-color: #22c55e;
    transform: translateY(-1px);
  }

  .save-btn:disabled {
    background-color: #555;
    color: #888;
    cursor: not-allowed;
    transform: none;
  }

  /* Responsividade */
  @media (max-width: 768px) {
    .customer-form-container {
      padding: 0.25rem;
    }

    .required-section,
    .address-section {
      padding: 1rem;
    }

    .form-row {
      flex-direction: column;
    }

    .form-actions {
      flex-direction: column;
    }
  }
</style>
