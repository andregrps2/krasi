<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Customer } from "../types";

  export let customer: Customer | null = null;

  const dispatch = createEventDispatcher();

  // Form data
  let name = "";
  let congregation = "";
  let whatsappNumber = "";

  // Initialize form with customer data if editing
  $: if (customer) {
    name = customer.name;
    congregation = customer.congregation;
    whatsappNumber = customer.whatsappNumber;
  } else {
    name = "";
    congregation = "";
    whatsappNumber = "";
  }

  // Validation
  $: isValid = name.trim() && congregation.trim() && whatsappNumber.trim();

  function handleSubmit(event: Event) {
    event.preventDefault();

    if (!isValid) return;

    const customerData = {
      id: customer?.id,
      name: name.trim(),
      congregation: congregation.trim(),
      whatsappNumber: whatsappNumber.trim(),
      createdAt: customer?.createdAt || new Date(),
    };

    dispatch("save", customerData);
  }

  function handleCancel() {
    dispatch("cancel");
  }

  function formatPhoneNumber(value: string) {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, "");

    // Aplica a máscara (xx) xxxxx-xxxx
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  }

  function handlePhoneInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const formatted = formatPhoneNumber(target.value);
    whatsappNumber = formatted;
  }
</script>

<form on:submit={handleSubmit} class="customer-form">
  <div class="form-group">
    <label for="name">Nome Completo:</label>
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
    <label for="congregation">Congregação:</label>
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
    <label for="whatsapp">Número do WhatsApp:</label>
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
      >Digite apenas os números. A formatação será aplicada automaticamente.</small
    >
  </div>

  <div class="form-actions">
    <button type="button" class="cancel-btn" on:click={handleCancel}>
      Cancelar
    </button>
    <button type="submit" class="save-btn" disabled={!isValid}>
      {customer ? "Atualizar" : "Salvar"} Cliente
    </button>
  </div>
</form>

<style>
  .customer-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 500px;
    margin: 0 auto;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-weight: 600;
    color: var(--primary-color);
    font-size: 1rem;
  }

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
    border-color: var(--primary-color-border);
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
  }

  .help-text {
    font-size: 0.85rem;
    color: #888;
    font-style: italic;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }

  .cancel-btn {
    background-color: transparent;
    color: var(--primary-color);
    border: 2px solid var(--primary-color-border);
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .cancel-btn:hover {
    background-color: var(--primary-color);
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
</style>
